'use strict'

// Antora extension: publishes every page as Markdown next to its HTML, plus
// llms.txt and llms-full.txt at the site root (https://llmstxt.org). The UI
// reads page-zc-md to show "Copy as Markdown" and a link to the .md file.
//
//   antora:
//     extensions:
//     - zc-supplemental-ui/extensions/llms.js
//
// llms.txt lists each component's pages in navigation order, with each
// page's description. llms-full.txt holds every page in that order.

const TurndownService = require('turndown')
const { gfm } = require('turndown-plugin-gfm')

module.exports.register = function () {
  const markdown = new Map()

  this.on('documentsConverted', ({ contentCatalog }) => {
    const turndown = createTurndown()
    for (const page of contentCatalog.getPages((it) => it.out && it.asciidoc)) {
      const mdPath = page.out.path.replace(/\.html$/, '.md')
      const title = page.asciidoc.doctitle
      const description = page.asciidoc.attributes.description
      let md = title ? `# ${plain(title)}\n\n` : ''
      if (description) md += `> ${description}\n\n`
      md += turndown.turndown(page.contents.toString()).trim() + '\n'
      markdown.set(page, { path: mdPath, contents: md })
      page.asciidoc.attributes['page-zc-md'] = '/' + mdPath
    }
  })

  this.on('beforePublish', ({ playbook, contentCatalog, siteCatalog }) => {
    for (const { path, contents } of markdown.values()) {
      siteCatalog.addFile({ contents: Buffer.from(contents), out: { path } })
    }
    const siteUrl = absoluteSiteUrl(playbook)
    const pageByUrl = new Map([...markdown.keys()].map((page) => [page.pub.url, page]))
    const index = [`# ${playbook.site.title || 'Documentation'}`, '']
    const full = []
    for (const component of contentCatalog.getComponentsSortedBy('name')) {
      for (const version of component.versions) {
        const pages = navigationPages(version, pageByUrl)
        if (!pages.length) continue
        const lang = version.asciidoc && version.asciidoc.attributes && version.asciidoc.attributes.lang
        const heading = [component.title, version.displayVersion, lang && `(${lang})`].filter(Boolean).join(' ')
        index.push(`## ${heading}`, '')
        for (const page of pages) {
          const { path, contents } = markdown.get(page)
          const url = siteUrl + '/' + path
          const description = page.asciidoc.attributes.description
          index.push(`- [${plain(page.asciidoc.doctitle || page.src.stem)}](${url})${description ? ': ' + description : ''}`)
          full.push(`<!-- ${url} -->\n\n${contents}`)
        }
        index.push('')
      }
    }
    siteCatalog.addFile({ contents: Buffer.from(index.join('\n')), out: { path: 'llms.txt' } })
    siteCatalog.addFile({ contents: Buffer.from(full.join('\n---\n\n')), out: { path: 'llms-full.txt' } })
  })
}

// The pages of a component version in the order its navigation lists them,
// start page first, each once.
function navigationPages (version, pageByUrl) {
  const pages = []
  const add = (url) => {
    const page = url && pageByUrl.get(url.split('#')[0])
    if (page && !pages.includes(page)) pages.push(page)
  }
  add(version.url)
  const walk = (items = []) => items.forEach((item) => {
    if (item.urlType === 'internal') add(item.url)
    walk(item.items)
  })
  ;(version.navigation || []).forEach((tree) => {
    if (tree.urlType === 'internal') add(tree.url)
    walk(tree.items)
  })
  return pages
}

function absoluteSiteUrl (playbook) {
  const url = playbook.site.url || ''
  return /^https?:\/\//.test(url) ? url.replace(/\/$/, '') : ''
}

function plain (html) {
  return String(html).replace(/<[^>]+>/g, '').replace(/&#8217;/g, '’').replace(/&amp;/g, '&').replace(/&lt;/g, '<').replace(/&gt;/g, '>')
}

function hasClass (node, name) {
  return node.nodeType === 1 && (' ' + (node.getAttribute('class') || '') + ' ').includes(' ' + name + ' ')
}

function inside (node, name) {
  for (let it = node.parentNode; it && it.nodeType === 1; it = it.parentNode) if (hasClass(it, name)) return it
}

// Turndown with rules for the blocks Asciidoctor writes as tables or with
// markup of their own: code with a language, admonitions, callouts and tabs.
function createTurndown () {
  const turndown = new TurndownService({ headingStyle: 'atx', codeBlockStyle: 'fenced', bulletListMarker: '-', emDelimiter: '_' })
  turndown.use(gfm)

  turndown.addRule('anchors', {
    filter: (node) => node.nodeName === 'A' && hasClass(node, 'anchor'),
    replacement: () => '',
  })

  turndown.addRule('code', {
    filter: (node) => node.nodeName === 'PRE' && (node.querySelector('code') || hasClass(node.parentNode, 'content')),
    replacement: (content, node) => {
      const code = node.querySelector('code')
      const lang = (code && code.getAttribute('data-lang')) || ''
      const text = (code || node).textContent.replace(/\n$/, '')
      const fence = text.includes('```') ? '~~~~' : '```'
      return `\n\n${fence}${lang}\n${text}\n${fence}\n\n`
    },
  })

  turndown.addRule('block titles', {
    filter: (node) => hasClass(node, 'title') && node.parentNode && !inside(node, 'admonitionblock'),
    replacement: (content) => `\n\n**${content.trim()}**\n\n`,
  })

  turndown.addRule('admonition', {
    filter: (node) => hasClass(node, 'admonitionblock'),
    replacement: (content, node) => {
      // The label is the icon's title with font icons, else its text.
      const icon = node.querySelector('td.icon [title]')
      const label = icon ? icon.getAttribute('title') : (node.querySelector('td.icon') || node).textContent.trim()
      const body = content.trim().replace(/\n/g, '\n> ')
      return `\n\n> **${label || 'Note'}:** ${body}\n\n`
    },
  })

  turndown.addRule('admonition parts', {
    filter: (node) => ['TABLE', 'TBODY', 'TR', 'TD'].includes(node.nodeName) && inside(node, 'admonitionblock'),
    replacement: (content, node) => (hasClass(node, 'icon') ? '' : content),
  })

  turndown.addRule('callouts', {
    filter: (node) => ['TABLE', 'TBODY', 'TR', 'TD'].includes(node.nodeName) && inside(node, 'colist'),
    replacement: (content, node) => {
      if (node.nodeName === 'TR') return `\n${content.trim()}\n`
      // Turndown drops the empty <i> before any rule sees it, so the
      // number is read here.
      const number = node.nodeName === 'TD' && node.querySelector('i.conum')
      if (number) return `(${number.getAttribute('data-value')}) `
      if (node.nodeName === 'TD') return content.trim()
      return `\n\n${content.trim()}\n\n`
    },
  })

  turndown.addRule('tab list', {
    filter: (node) => hasClass(node, 'tablist'),
    replacement: () => '',
  })

  turndown.addRule('tab panel', {
    filter: (node) => hasClass(node, 'tabpanel'),
    replacement: (content, node) => {
      const tab = node.ownerDocument.getElementById(node.getAttribute('aria-labelledby'))
      const label = tab ? tab.textContent.trim() : ''
      return `\n\n**${label}**\n\n${content.trim()}\n\n`
    },
  })

  turndown.addRule('inline svg', {
    filter: ['svg'],
    replacement: (content, node) => {
      const title = node.querySelector('title')
      return title ? `\n\n_${title.textContent.trim()}_\n\n` : ''
    },
  })

  return turndown
}
