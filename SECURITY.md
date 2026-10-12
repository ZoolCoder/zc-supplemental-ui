# Security

zc-supplemental-ui is the page frame for documentation sites, so a
cross-site scripting bug in it is a bug on every site that uses it.

## Supported versions

Only the latest release gets fixes.

## Reporting a vulnerability

Please report privately, not in a public issue. Open a
[security advisory](https://github.com/zoolcoder/zc-supplemental-ui/security/advisories/new)
on this repository.

Include what you did, what happened, and what you expected. You will get a
reply within 7 days.

## What the bundle guarantees

- **No external requests.** Every script, stylesheet and image is served from
  the site itself. highlight.js is vendored into the bundle, not loaded from
  a CDN.
- **No tracking.** The only thing stored in the browser is the theme choice,
  in `localStorage` under `zc-theme`.
- **Page text is never run as markup.** The script builds the table of
  contents and the copy buttons with `textContent`. Callout markers are the
  one piece of existing markup it moves, and it moves them as they were.

## Out of scope

The content of the sites built with the bundle, and the Antora extensions
they load.
