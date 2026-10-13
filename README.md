# zc-supplemental-ui

The ZoolCoder look for [Antora](https://antora.org) documentation sites, and
a matching [asciidoctor-pdf](https://docs.asciidoctor.org/pdf-converter/latest/)
theme for the PDF of the same docs. It carries the design of
[toolshell](https://github.com/zoolcoder/toolshell), so an admin tool and its
docs look like one product.

<picture>
  <source media="(prefers-color-scheme: dark)" srcset=".github/preview-dark.png">
  <img alt="A docs page in the bundle: sidebar, search, code with callouts, and a table of contents" src=".github/preview-light.png">
</picture>

## What you get

- A sidebar that becomes a drawer on phones, a glass header with search, and
  light, dark and auto themes.
- Search for the [Antora Lunr extension](https://gitlab.com/antora/antora-lunr-extension),
  opened with <kbd>Ctrl</kbd>/<kbd>⌘</kbd> <kbd>K</kbd> or <kbd>/</kbd>.
- A table of contents that follows the reader, breadcrumbs, previous and next
  cards, and an "Edit this page" link.
- Highlighted code with a copy button. In a `console` block it copies only
  the commands, without their `$` prompts.
- Every Asciidoctor block styled: admonitions, tables, callouts, definition
  lists, examples, sidebars, quotes and images.
- Roles for a landing page: `[.hero]` on an open block for the lead, `[.cta]`
  on a paragraph of links for buttons, and `[.cards]` on a list for a card
  grid.
- Keyboard shortcuts. Press <kbd>?</kbd> on any page for the list.
- Translations: a language menu, the interface in the page's language, and
  a right-to-left layout for Arabic, Persian, Hebrew and Urdu.
- A version menu, "Last updated" under each page, and "Copy as Markdown".
- Tabs, from [@asciidoctor/tabs](https://github.com/asciidoctor/asciidoctor-tabs),
  with keyboard support, and diagram classes for inline SVG that follow the
  theme.
- A Content-Security-Policy and a Referrer-Policy as `<meta>` tags, which
  work on hosts that cannot send headers, such as GitHub Pages.
- A PDF button, and a theme that gives the PDF the same mark and colours.
- No external requests and no tracking. Everything is served by your site.

## Use it

Point the playbook at a release:

```yaml
ui:
  bundle:
    url: https://github.com/zoolcoder/zc-supplemental-ui/releases/download/v0.2.1/ui-bundle.zip
```

Then set the attributes that switch on the parts you want:

```yaml
asciidoc:
  attributes:
    page-zc-repo: https://github.com/you/project   # GitHub button, footer links
    page-zc-pdf: project/_exports/index.pdf         # PDF button, path from the site root
    page-zc-site: https://example.com/             # website link in the menu and footer
    page-zc-site-name: example.com
    page-zc-owner: Your name                        # footer
    page-zc-tagline: Documentation                  # under the product name
    page-zc-license: MIT licensed                   # footer and sidebar
    page-zc-og-image: https://example.com/card.png  # link previews
```

`page-zc-csp` replaces the default Content-Security-Policy, for a site that
loads anything from another host:

```yaml
    page-zc-csp: "default-src 'self'; img-src 'self' data: https://img.example.com"
```

For search, add `@antora/lunr-extension` to `antora.extensions`. List the
languages of your pages in its `languages` key; the search then shows only
the hits in the reader's language.

### Extensions and the PDF command

The Antora extensions and the `zc-pdf` command come from the npm package,
installed from the same tag:

```sh
npm install --save-dev github:zoolcoder/zc-supplemental-ui#v0.2.1 @asciidoctor/tabs
```

```yaml
antora:
  extensions:
    - zc-supplemental-ui/extensions/last-updated  # "Last updated" from git
    - zc-supplemental-ui/extensions/llms          # .md per page, llms.txt
    - zc-supplemental-ui/extensions/og-image      # link-preview cards
asciidoc:
  extensions:
    - '@asciidoctor/tabs'
```

Leave `.js` off the names: Antora reads a request that ends in `.js` as a
path next to the playbook, not as a package in `node_modules`.

- `last-updated.js` reads the git history. In CI, check out all of it
  (`fetch-depth: 0` on `actions/checkout`).
- `llms.js` writes a Markdown copy of each page, which the "Copy as
  Markdown" button uses, plus `llms.txt` and `llms-full.txt` at the site
  root.
- `og-image.js` draws a 1200×630 card for each page. It needs an absolute
  `site.url`, and sets `page-zc-og-image` for you.

### Diagrams on a phone

A wide diagram scrolls sideways on a phone. Draw it a second time, top to
bottom, and give the two the roles `wide` and `narrow`. The narrow one
replaces the wide one at 640px and below:

```asciidoc
[.diagram.wide]
image::pipeline.svg["The pipeline",opts=inline]

ifndef::zc-print[]
[.diagram.narrow]
image::pipeline-narrow.svg["The pipeline",opts=inline]
endif::[]
```

Set `zc-print: ''` in the attributes of `antora-assembler.yml` so the PDF
prints the diagram once. Assembler resolves conditionals before the PDF
converter runs, so `backend-pdf` cannot be used for this.

### Another language

Put each translation in its own component, give it `lang` in `antora.yml`,
and list the pairs once in the playbook:

```yaml
# docs-ar/antora.yml
name: project-ar
asciidoc:
  attributes:
    lang: ar
    page-zc-pdf: project-ar/_exports/index.pdf
    note-caption: ملاحظة      # and the other captions Asciidoctor writes
```

```yaml
# the playbook
asciidoc:
  attributes:
    page-zc-langs: en=project ar=project-ar
```

The language menu links each page to the page with the same path in the
other language, or to that language's start page. The interface strings
ship in English and Arabic; other languages fall back to English.

### The PDF

Use [Antora Assembler](https://docs.antora.org/assembler/latest/) with the
`zc-pdf` command, and give it the theme from the same release:

```sh
curl -fsSL -o zc-pdf-theme.zip \
  https://github.com/zoolcoder/zc-supplemental-ui/releases/download/v0.2.1/zc-pdf-theme.zip
unzip -o zc-pdf-theme.zip -d build/pdf-theme
```

```yaml
# antora-assembler.yml, next to the playbook
root_level: 0
build:
  command: npx zc-pdf -a pdf-themesdir=build/pdf-theme -a pdf-theme=zc
  publish: true
asciidoc:
  attributes:
    doctype: book
    toc: ''
    title-page: ''
    source-highlighter: rouge
    zc-owner: Your name   # shown in the page footer
    zc-print: ''          # leaves out what only a screen needs
```

The command runs in the playbook's folder, so `pdf-themesdir` is relative to
it. The PDF lands at `<component>/_exports/index.pdf`, which is the path to
put in `page-zc-pdf`. The `preview/` folder of this repo is a working example.

`zc-pdf` takes the arguments of asciidoctor-pdf and picks the converter by
the document's `lang`:

- Left-to-right languages go to asciidoctor-pdf with the theme.
- Right-to-left languages go through Asciidoctor's HTML converter and
  headless Chrome, because asciidoctor-pdf cannot shape Arabic. Chrome or
  Chromium must be installed; set `CHROME_PATH` when it is not in the usual
  place. GitHub's Ubuntu runners have it.

Set `ZC_PDF_KEEP=1` to keep the HTML that Chrome printed, for debugging a
layout.

On Ruby 3.5 or later, add `logger`, `bigdecimal`, `base64`, `ostruct` and
`csv` to the Gemfile next to `asciidoctor-pdf`: they are no longer default
gems, and its dependencies still load them.

## Develop

See [CONTRIBUTING.md](CONTRIBUTING.md). In short: `npm ci`, then
`npm run preview`, and open `build/preview`.

## Licence

[MIT](LICENSE). highlight.js, vendored into the bundle, is under its own
BSD-3-Clause licence, included as `js/vendor/highlight.LICENSE.txt`. The IBM
Plex Sans Arabic fonts are under the SIL Open Font License, included as
`extensions/fonts/OFL.txt`.
