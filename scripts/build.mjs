// Builds build/ui-bundle.zip (the Antora UI) and build/zc-pdf-theme.zip (the
// asciidoctor-pdf theme) from src/ and pdf/. No bundler: the CSS is a few
// ordered files joined into one, and the only third-party code is
// highlight.js, copied as published.
import { execFileSync } from 'node:child_process'
import { cpSync, mkdirSync, readFileSync, readdirSync, rmSync, writeFileSync } from 'node:fs'
import { join } from 'node:path'

const root = new URL('..', import.meta.url).pathname
const src = join(root, 'src')
const out = join(root, 'build')
const bundle = join(out, 'bundle')
const version = JSON.parse(readFileSync(join(root, 'package.json'), 'utf8')).version

rmSync(out, { recursive: true, force: true })
mkdirSync(join(bundle, 'css'), { recursive: true })

for (const dir of ['layouts', 'partials', 'helpers', 'js', 'img']) {
  cpSync(join(src, dir), join(bundle, dir), { recursive: true })
}

const cssDir = join(src, 'css')
const css = readdirSync(cssDir)
  .filter((name) => name.endsWith('.css'))
  .sort()
  .map((name) => readFileSync(join(cssDir, name), 'utf8'))
  .join('\n')
writeFileSync(join(bundle, 'css', 'site.css'), `/* zc-supplemental-ui ${version} */\n${css}`)

const hljs = join(root, 'node_modules', '@highlightjs', 'cdn-assets')
mkdirSync(join(bundle, 'js', 'vendor'), { recursive: true })
cpSync(join(hljs, 'highlight.min.js'), join(bundle, 'js', 'vendor', 'highlight.min.js'))
cpSync(join(hljs, 'LICENSE'), join(bundle, 'js', 'vendor', 'highlight.LICENSE.txt'))

const zip = (dir, file) => execFileSync('zip', ['-qrX', join(out, file), '.'], { cwd: dir })
zip(bundle, 'ui-bundle.zip')
zip(join(root, 'pdf'), 'zc-pdf-theme.zip')

console.log(`built zc-supplemental-ui ${version}: build/ui-bundle.zip, build/zc-pdf-theme.zip`)
