# Contributing

Thanks for helping. The bundle is small on purpose, so read this before you
open a pull request.

## Ground rules

- **toolshell first.** The look comes from
  [toolshell](https://github.com/zoolcoder/toolshell). A change to the shared
  look (colours, the sidebar, the header, menus) belongs there too, so the
  admin tools and their docs stay alike.
- **No runtime dependency.** The page loads its own stylesheet, its own
  script and the vendored highlight.js, and nothing else.
- **Content first.** A page must read correctly before the script runs. The
  script only adds the table of contents, copy buttons and shortcuts.
- **Both themes and phone width.** Check every change in light and dark, at
  1440px and at 390px, with no sideways scroll.
- **Both directions.** Check the Arabic preview too. Use logical properties
  (`margin-inline-start`, `inset-inline-end`) rather than left and right, and
  put a new interface string in English and Arabic in `zc-init.js`.

## Development

You need Node.js 22 or later. For the PDF you also need Ruby and Bundler, and
Chrome or Chromium for the Arabic one; gems install into `vendor/bundle`,
never globally.

```sh
npm ci
npm run build          # build/ui-bundle.zip and build/zc-pdf-theme.zip
npm run preview        # the preview site in build/preview
bundle config set --local path vendor/bundle
bundle install
npm run preview:pdf    # the preview site with its PDFs
```

Serve `build/preview` with any static server, for example
`python3 -m http.server -d build/preview`.

To try a change on a real site, point its Antora build at your local bundle:

```sh
npx antora --ui-bundle-url ../zc-supplemental-ui/build/ui-bundle.zip antora-playbook.yml
```

## Layout

| Path | Holds |
|---|---|
| `src/layouts`, `src/partials` | Handlebars templates |
| `src/helpers` | Handlebars helpers. Each is loaded alone, so it may not `require` a sibling file. |
| `src/css` | Stylesheets, joined in name order into `css/site.css` |
| `src/js/zc.js` | The page script |
| `src/helpers/zc-init.js` | Languages, writing direction and the interface strings |
| `extensions` | Antora extensions: last updated, Markdown and llms.txt, link-preview cards |
| `bin/zc-pdf.js` | The PDF command: asciidoctor-pdf, or Chrome for right-to-left languages |
| `pdf` | The asciidoctor-pdf theme, and `print.css` for the Chrome PDF |
| `preview`, `preview-ar` | A site that uses every element, in English and Arabic |
| `preview-old` | An older version, for the version menu |

## Commits and pull requests

- Use [Conventional Commits](https://www.conventionalcommits.org/):
  `feat(search): show the section title`, `fix(css): keep the toc in view`.
- Keep each pull request to one topic, and rebase it on `main`.
- Add a line to `CHANGELOG.md` for a change that sites would notice.

## Releases

Bump `version` in `package.json`, add the CHANGELOG section, commit, and push
a matching `vX.Y.Z` tag. The release workflow attaches `ui-bundle.zip` and
`zc-pdf-theme.zip` to the GitHub release.

By contributing you agree that your work is released under the MIT licence
and that you follow the [code of conduct](CODE_OF_CONDUCT.md).
