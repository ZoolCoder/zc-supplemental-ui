'use strict'

// Antora extension: draws a 1200×630 link-preview card for every page and
// points page-zc-og-image at it, so a shared link shows the product, the
// page title and its description. Right-to-left pages get a mirrored card.
//
//   antora:
//     extensions:
//     - zc-supplemental-ui/extensions/og-image.js
//
// Link previews need absolute URLs, so the extension does nothing unless
// site.url in the playbook is one. Cards are drawn with resvg and the IBM
// Plex Sans Arabic fonts in ./fonts, which cover Latin and Arabic, so the
// result is the same on every machine.

const fs = require('node:fs')
const path = require('node:path')
const { Resvg } = require('@resvg/resvg-js')

const W = 1200
const H = 630
const PAD = 80
const RTL = ['ar', 'fa', 'he', 'ps', 'ur', 'yi']
const FONTS = ['IBMPlexSansArabic-Regular.ttf', 'IBMPlexSansArabic-Bold.ttf'].map((it) => path.join(__dirname, 'fonts', it))
const FAMILY = 'IBM Plex Sans Arabic'

module.exports.register = function () {
  const logger = this.getLogger('zc-og-image')
  const cards = []

  this.on('documentsConverted', ({ playbook, contentCatalog }) => {
    const siteUrl = playbook.site.url || ''
    if (!/^https?:\/\//.test(siteUrl)) {
      logger.info('site.url is not an absolute URL, so no link-preview cards are drawn')
      return
    }
    const siteName = (playbook.asciidoc.attributes || {})['page-zc-site-name'] || new URL(siteUrl).host
    const mark = markSvg()
    for (const page of contentCatalog.getPages((it) => it.out && it.asciidoc)) {
      const attributes = page.asciidoc.attributes
      const outPath = '_og/' + page.out.path.replace(/\.html$/, '.png')
      const lang = String(attributes.lang || 'en').toLowerCase().split(/[-_]/)[0]
      const svg = cardSvg({
        product: componentTitle(contentCatalog, page),
        title: plain(page.asciidoc.doctitle || page.src.stem),
        description: attributes.description ? plain(attributes.description) : '',
        siteName,
        rtl: RTL.includes(lang),
        mark,
      })
      cards.push({ outPath, svg })
      attributes['page-zc-og-image'] = siteUrl.replace(/\/$/, '') + '/' + outPath
    }
  })

  this.on('beforePublish', ({ siteCatalog }) => {
    const options = { font: { fontFiles: FONTS, loadSystemFonts: false, defaultFontFamily: FAMILY }, fitTo: { mode: 'original' } }
    for (const { outPath, svg } of cards) {
      const png = new Resvg(svg, options).render().asPng()
      siteCatalog.addFile({ contents: png, out: { path: outPath } })
    }
    if (cards.length) logger.info(`drew ${cards.length} link-preview cards`)
  })
}

function componentTitle (contentCatalog, page) {
  const component = contentCatalog.getComponent(page.src.component)
  return (component && component.title) || page.src.component
}

// The mark from the UI, recoloured for the dark card.
function markSvg () {
  const source = fs.readFileSync(path.join(__dirname, '..', 'src', 'img', 'mark.svg'), 'utf8')
  const viewBox = /viewBox="([^"]+)"/.exec(source)[1]
  const body = source.replace(/^[\s\S]*?<svg[^>]*>/, '').replace(/<\/svg>\s*$/, '').replace(/<!--[\s\S]*?-->/g, '')
  return { viewBox, body: body.replace(/#111318/gi, '#F1F5FC').replace(/#3D7BFF/gi, '#60A5FA') }
}

function cardSvg ({ product, title, description, siteName, rtl, mark }) {
  // Positions are written for left-to-right and mirrored for right-to-left.
  const x = (value) => (rtl ? W - value : value)
  const anchor = rtl ? 'end' : 'start'
  const run = (text) => escape(rtl ? '‫' + text + '‬' : text)

  let size = 68
  let lines = wrap(title, W - PAD * 2, size, 3)
  if (lines.length > 2) {
    size = 56
    lines = wrap(title, W - PAD * 2, size, 3)
  }
  const titleTop = 250
  const lineHeight = Math.round(size * 1.18)
  const titleText = lines
    .map((line, i) => `<text x="${x(PAD)}" y="${titleTop + i * lineHeight}" font-size="${size}" font-weight="700" fill="#F1F5FC" text-anchor="${anchor}">${run(line)}</text>`)
    .join('')
  const descTop = titleTop + (lines.length - 1) * lineHeight + 70
  const descText = wrap(description, W - PAD * 2, 28, 2)
    .map((line, i) => `<text x="${x(PAD)}" y="${descTop + i * 40}" font-size="28" fill="#A4B3C9" text-anchor="${anchor}">${run(line)}</text>`)
    .join('')
  const markX = rtl ? W - PAD - 64 : PAD

  return `<svg xmlns="http://www.w3.org/2000/svg" width="${W}" height="${H}" viewBox="0 0 ${W} ${H}" font-family="${FAMILY}">
  <defs>
    <radialGradient id="glow" cx="${rtl ? 0.08 : 0.92}" cy="0" r="0.9">
      <stop offset="0" stop-color="#2563EB" stop-opacity="0.42"/>
      <stop offset="0.55" stop-color="#2563EB" stop-opacity="0.06"/>
      <stop offset="1" stop-color="#2563EB" stop-opacity="0"/>
    </radialGradient>
    <linearGradient id="bar" x1="0" x2="1">
      <stop offset="0" stop-color="#2563EB"/>
      <stop offset="1" stop-color="#60A5FA"/>
    </linearGradient>
    <pattern id="grid" width="40" height="40" patternUnits="userSpaceOnUse">
      <path d="M40 0H0V40" fill="none" stroke="#1B2A40" stroke-width="1" opacity="0.55"/>
    </pattern>
  </defs>
  <rect width="${W}" height="${H}" fill="#070B12"/>
  <rect width="${W}" height="${H}" fill="url(#grid)"/>
  <rect width="${W}" height="${H}" fill="url(#glow)"/>
  <svg x="${markX}" y="${PAD - 6}" width="64" height="64" viewBox="${mark.viewBox}">${mark.body}</svg>
  <text x="${x(PAD + 84)}" y="${PAD + 36}" font-size="34" font-weight="700" fill="#F1F5FC" text-anchor="${anchor}">${run(product)}</text>
  ${titleText}
  ${descText}
  <text x="${x(PAD)}" y="${H - 64}" font-size="24" fill="#75869F" text-anchor="${anchor}">${escape(siteName)}</text>
  <rect x="0" y="${H - 8}" width="${W}" height="8" fill="url(#bar)"/>
</svg>`
}

// resvg does not wrap text, so lines are broken by an estimate of each
// word's width. Bold Plex runs at about 0.56em for Latin and 0.5em for Arabic.
function wrap (text, width, size, maxLines) {
  if (!text) return []
  const measure = (s) => [...s].reduce((sum, ch) => sum + (/[؀-ۿ]/.test(ch) ? 0.5 : /[A-Z]/.test(ch) ? 0.66 : ch === ' ' ? 0.28 : 0.56), 0) * size
  const lines = []
  let line = ''
  for (const word of text.split(/\s+/)) {
    const next = line ? line + ' ' + word : word
    if (measure(next) <= width || !line) line = next
    else {
      lines.push(line)
      line = word
    }
  }
  if (line) lines.push(line)
  if (lines.length > maxLines) {
    lines.length = maxLines
    lines[maxLines - 1] = lines[maxLines - 1].replace(/\s*\S*$/, '') + '…'
  }
  return lines
}

function plain (html) {
  return String(html)
    .replace(/<[^>]+>/g, '')
    .replace(/&#8217;/g, '’')
    .replace(/&#8212;/g, '—')
    .replace(/&#(\d+);/g, (m, n) => String.fromCodePoint(Number(n)))
    .replace(/&lt;/g, '<')
    .replace(/&gt;/g, '>')
    .replace(/&quot;/g, '"')
    .replace(/&amp;/g, '&')
}

function escape (text) {
  return String(text).replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;')
}
