# Changelog

All notable changes to zc-supplemental-ui. The format follows
[Keep a Changelog](https://keepachangelog.com/en/1.1.0/), and versions follow
[Semantic Versioning](https://semver.org/).

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
