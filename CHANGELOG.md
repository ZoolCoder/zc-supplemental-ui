# Changelog

All notable changes to zc-supplemental-ui. The format follows
[Keep a Changelog](https://keepachangelog.com/en/1.1.0/), and versions follow
[Semantic Versioning](https://semver.org/).

## v0.2.0 — 2026-10-13

### Added

- Translations. `page-zc-langs` pairs each language with a component, and
  the header gets a language menu that opens the same page in the other
  language. The interface is in English or Arabic, and Arabic, Persian,
  Hebrew and Urdu pages are laid out right to left.
- Search shows only the hits in the reader's language.
- A version menu in the sidebar, which marks the latest version and opens
  the same page in another version.
- Tabs from `@asciidoctor/tabs`, with arrow-key support, synced choices that
  are remembered, and a style for each theme.
- Diagram classes for inline SVG (`d-box`, `d-acc`, `d-ok`, `d-edge`...),
  which follow the light and dark themes.
- Antora extensions, shipped in the npm package:
  - `last-updated.js` shows "Last updated" under each page, from git.
  - `llms.js` writes a Markdown copy of each page, `llms.txt` and
    `llms-full.txt`. The page gets a "Copy as Markdown" button and a link to
    the `.md` file.
  - `og-image.js` draws a link-preview card for each page, mirrored for
    right-to-left pages.
- `zc-pdf`, a PDF command for Antora Assembler. It runs asciidoctor-pdf as
  before, and prints right-to-left guides through headless Chrome with a
  matching print stylesheet, since asciidoctor-pdf cannot shape Arabic.

### Fixed

- Heading anchors have an accessible name, and the light theme's dim text
  meets the 4.5:1 contrast ratio.

## v0.1.0 — 2026-10-13

### Added

- An Antora UI bundle built on the toolshell design: a sticky sidebar that
  becomes a drawer on phones, a glass header, light, dark and auto themes,
  and the toolshell light field behind the page.
- Search in the header for the Antora Lunr extension, opened with
  <kbd>Ctrl</kbd>/<kbd>⌘</kbd> <kbd>K</kbd> or <kbd>/</kbd>.
- A table of contents that follows the reader, previous and next cards,
  breadcrumbs and an "Edit this page" link.
- Code blocks highlighted with a vendored highlight.js in the theme's own
  colours, a copy button that copies only the commands from a console block,
  and callout markers that survive highlighting.
- Styles for every Asciidoctor block: admonitions, tables, definition
  lists, callouts, examples, sidebars, quotes and images.
- Keyboard shortcuts: `?` lists them, `t` cycles the theme, `g h` goes home,
  and the arrow keys turn pages.
- PDF and GitHub buttons, footer links and a licence line, each driven by a
  `page-zc-*` attribute in the playbook.
- Roles for landing pages: `[.hero]` for a lead, `[.cta]` for a row of
  buttons, and `[.cards]` for a grid of cards that are clickable when they
  start with a link.
- A print stylesheet for a single page.
- `zc-pdf-theme.zip`, an asciidoctor-pdf theme with the ZoolCoder mark on
  the title page, the toolshell palette, and running headers and footers.
