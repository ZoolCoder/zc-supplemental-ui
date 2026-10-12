#!/usr/bin/env node
'use strict'

// The PDF command for Antora Assembler. It takes the same arguments as
// asciidoctor-pdf, and picks the converter by the document's language:
//
// - Left-to-right languages go to asciidoctor-pdf with the zc theme, as before.
// - Right-to-left languages (Arabic, Persian, Hebrew, Urdu...) go through
//   Asciidoctor's HTML converter and headless Chrome. asciidoctor-pdf cannot
//   shape Arabic or lay out right-to-left text; a browser can.
//
//   build:
//     command: npx zc-pdf -a pdf-themesdir=build/pdf-theme -a pdf-theme=zc
//
// The language is the lang attribute, which a component sets in antora.yml.
// Chrome is found through CHROME_PATH, else in the usual places on macOS and
// Linux. Both converters run through Bundler when there is a Gemfile.
// ZC_PDF_KEEP=1 keeps the intermediate HTML.

const { spawn, spawnSync } = require('node:child_process')
const fs = require('node:fs')
const os = require('node:os')
const path = require('node:path')
const { pathToFileURL } = require('node:url')

const RTL = ['ar', 'fa', 'he', 'ps', 'ur', 'yi']
const ROOT = path.join(__dirname, '..')
const CHROME_TIMEOUT = 120_000

main(process.argv.slice(2))

function main (args) {
  const attributes = readAttributes(args)
  const lang = String(attributes.lang || 'en').toLowerCase().split(/[-_]/)[0]
  if (!RTL.includes(lang)) exit(ruby('asciidoctor-pdf', args))
  printWithChrome(args, attributes).then(exit, (err) => {
    console.error(`zc-pdf: ${err.message}`)
    exit(1)
  })
}

function readAttributes (args) {
  const attributes = {}
  args.forEach((arg, i) => {
    if (arg !== '-a' && arg !== '--attribute') return
    const [name, ...value] = String(args[i + 1]).split('=')
    attributes[name] = value.join('=')
  })
  return attributes
}

function outputFile (args) {
  const i = args.findIndex((arg) => arg === '-o' || arg === '--out-file')
  return i >= 0 ? args[i + 1] : undefined
}

// Runs a Ruby command, through Bundler when this folder or one above it has
// a Gemfile. stdin is passed through, because Assembler sends the document
// that way.
function ruby (command, args) {
  const bundled = process.env.BUNDLE_GEMFILE || hasGemfile(process.cwd())
  const result = spawnSync(bundled ? 'bundle' : command, bundled ? ['exec', command, ...args] : args, { stdio: 'inherit' })
  if (result.error) {
    console.error(`zc-pdf: cannot run ${command}: ${result.error.message}`)
    return 1
  }
  return result.status
}

function hasGemfile (dir) {
  if (fs.existsSync(path.join(dir, 'Gemfile'))) return true
  const parent = path.dirname(dir)
  return parent !== dir && hasGemfile(parent)
}

async function printWithChrome (args, attributes) {
  const outfile = outputFile(args)
  if (!outfile) {
    console.error('zc-pdf: no output file (-o) given')
    return 1
  }
  const chrome = findChrome()
  if (!chrome) {
    console.error('zc-pdf: a right-to-left PDF needs Chrome or Chromium. Set CHROME_PATH to its executable.')
    return 1
  }

  const work = fs.mkdtempSync(path.join(os.tmpdir(), 'zc-pdf-'))
  try {
    const html = path.join(work, path.basename(outfile).replace(/\.pdf$/, '') + '.html')
    const css = path.join(work, 'print.css')
    fs.writeFileSync(css, printCss(attributes))

    // Keep the document's own attributes, drop the PDF-only ones, and point
    // the HTML converter at the print stylesheet. Highlighting and admonition
    // icons are swapped for ones that need nothing from the network: the
    // HTML converter would load highlight.js and Font Awesome from a CDN.
    const htmlArgs = []
    for (let i = 0; i < args.length; i++) {
      const arg = args[i]
      if (arg === '-o' || arg === '--out-file') { i++; continue }
      if ((arg === '-a' || arg === '--attribute') && /^(pdf-|outfilesuffix|icons|source-highlighter)/.test(args[i + 1])) { i++; continue }
      if (arg === '-') continue
      htmlArgs.push(arg)
    }
    htmlArgs.push('-b', 'html5', '-a', 'data-uri', '-a', `stylesheet=${css}`, '-a', 'linkcss!', '-a', 'nofooter', '-a', 'webfonts!', '-a', 'icons!', '-a', 'source-highlighter=rouge', '-a', 'rouge-css=style', '-a', 'outfilesuffix=.html', '-o', html, '-')
    const status = ruby('asciidoctor', htmlArgs)
    if (status !== 0) return status
    fs.writeFileSync(html, tidyHtml(fs.readFileSync(html, 'utf8')))

    const chromeArgs = [
      '--headless',
      '--disable-gpu',
      '--no-first-run',
      '--no-default-browser-check',
      `--user-data-dir=${path.join(work, 'chrome')}`,
      '--no-pdf-header-footer',
      '--run-all-compositor-stages-before-draw',
      '--virtual-time-budget=15000',
      `--print-to-pdf=${path.resolve(outfile)}`,
      pathToFileURL(html).href,
    ]
    // Hosted Linux runners do not allow Chrome's own sandbox.
    if (process.platform === 'linux' && process.env.CI) chromeArgs.unshift('--no-sandbox')
    fs.mkdirSync(path.dirname(path.resolve(outfile)), { recursive: true })
    const result = await printPdf(chrome, chromeArgs)
    if (result.timedOut) {
      console.error(`zc-pdf: Chrome did not finish ${outfile} within ${CHROME_TIMEOUT / 1000}s`)
      return 1
    }
    if (!result.written || !fs.existsSync(outfile)) {
      console.error(`zc-pdf: Chrome did not write ${outfile}\n${result.stderr.trim()}`)
      return 1
    }
    return 0
  } finally {
    // ZC_PDF_KEEP=1 keeps the HTML and stylesheet Chrome printed, to debug a layout.
    if (process.env.ZC_PDF_KEEP) console.error(`zc-pdf: kept ${work}`)
    else fs.rmSync(work, { recursive: true, force: true })
  }
}

// Some Chrome builds keep running after they print, so Chrome is stopped as
// soon as it reports the file written, and after CHROME_TIMEOUT at the latest.
function printPdf (chrome, chromeArgs) {
  return new Promise((resolve, reject) => {
    const child = spawn(chrome, chromeArgs, { stdio: ['ignore', 'ignore', 'pipe'] })
    const result = { written: false, timedOut: false, stderr: '' }
    const timer = setTimeout(() => {
      result.timedOut = true
      child.kill('SIGKILL')
    }, CHROME_TIMEOUT)
    child.stderr.setEncoding('utf8')
    child.stderr.on('data', (chunk) => {
      result.stderr += chunk
      if (!result.written && /bytes written to file/.test(result.stderr)) {
        result.written = true
        child.kill()
      }
    })
    child.on('error', (err) => {
      clearTimeout(timer)
      reject(new Error(`cannot run Chrome: ${err.message}`))
    })
    child.on('close', (code) => {
      clearTimeout(timer)
      if (code === 0 && !result.timedOut) result.written = true
      resolve(result)
    })
  })
}

// Brings the HTML converter's output closer to what asciidoctor-pdf prints:
// callout numbers without their parentheses or the comment marker before
// them, and the version without the comma that joins it to the date.
function tidyHtml (html) {
  return html
    .replace(/(?:#|\/\/|--|;;|%)\s*(?=<b class="conum">)/g, '')
    .replace(/<b class="conum">\((\d+)\)<\/b>/g, '<b class="conum">$1</b>')
    .replace(/(<span id="revnumber">[^<]*?),\s*<\/span>/, '$1</span>')
}

// The stylesheet ships with the package. Its fonts are linked by file URL so
// Chrome embeds the same faces on every machine.
function printCss (attributes) {
  const fonts = pathToFileURL(path.join(ROOT, 'extensions', 'fonts')).href
  const css = fs.readFileSync(path.join(ROOT, 'pdf', 'print.css'), 'utf8')
  const footer = [attributes['zc-owner'], attributes.doctitle].filter(Boolean).join(' · ')
  return css.replace(/__FONTS__/g, fonts).replace(/__FOOTER__/g, JSON.stringify(footer).slice(1, -1))
}

function findChrome () {
  const candidates = [process.env.CHROME_PATH]
  if (process.platform === 'darwin') {
    candidates.push(
      '/Applications/Google Chrome.app/Contents/MacOS/Google Chrome',
      '/Applications/Chromium.app/Contents/MacOS/Chromium',
      path.join(os.homedir(), 'Applications/Google Chrome.app/Contents/MacOS/Google Chrome'),
    )
  } else if (process.platform === 'win32') {
    candidates.push(path.join(process.env.PROGRAMFILES || 'C:\\Program Files', 'Google\\Chrome\\Application\\chrome.exe'))
  } else {
    for (const name of ['google-chrome', 'google-chrome-stable', 'chromium', 'chromium-browser']) {
      const found = spawnSync('sh', ['-c', `command -v ${name}`], { encoding: 'utf8' }).stdout.trim()
      if (found) candidates.push(found)
    }
  }
  return candidates.find((it) => it && fs.existsSync(it))
}

function exit (status) {
  process.exit(status == null ? 1 : status)
}
