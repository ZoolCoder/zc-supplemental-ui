'use strict'

// {{{icon "name"}}} inlines one of the toolshell glyphs: 16px strokes that take
// the text colour, so they theme without extra CSS. Triple braces, because the
// helper returns markup. Copied from toolshell's icons.go; keep them in step.
const icons = {
  search: "<svg aria-hidden=\"true\" focusable=\"false\" viewBox=\"0 0 16 16\" fill=\"none\" stroke=\"currentColor\" stroke-width=\"1.5\" stroke-linecap=\"round\" stroke-linejoin=\"round\"><circle cx=\"7\" cy=\"7\" r=\"4.5\"/><path d=\"M10.5 10.5l3.5 3.5\"/></svg>",
  menu: "<svg aria-hidden=\"true\" focusable=\"false\" viewBox=\"0 0 16 16\" fill=\"none\" stroke=\"currentColor\" stroke-width=\"1.5\" stroke-linecap=\"round\" stroke-linejoin=\"round\"><path d=\"M2.5 4h11M2.5 8h11M2.5 12h11\"/></svg>",
  close: "<svg aria-hidden=\"true\" focusable=\"false\" viewBox=\"0 0 16 16\" fill=\"none\" stroke=\"currentColor\" stroke-width=\"1.5\" stroke-linecap=\"round\" stroke-linejoin=\"round\"><path d=\"M4 4l8 8M12 4l-8 8\"/></svg>",
  sun: "<svg aria-hidden=\"true\" focusable=\"false\" viewBox=\"0 0 16 16\" fill=\"none\" stroke=\"currentColor\" stroke-width=\"1.5\" stroke-linecap=\"round\" stroke-linejoin=\"round\"><circle cx=\"8\" cy=\"8\" r=\"2.8\"/><path d=\"M8 1.5v1.5M8 13v1.5M1.5 8H3M13 8h1.5M3.4 3.4l1 1M11.6 11.6l1 1M3.4 12.6l1-1M11.6 4.4l1-1\"/></svg>",
  moon: "<svg aria-hidden=\"true\" focusable=\"false\" viewBox=\"0 0 16 16\" fill=\"none\" stroke=\"currentColor\" stroke-width=\"1.5\" stroke-linecap=\"round\" stroke-linejoin=\"round\"><path d=\"M13.5 9.5A5.8 5.8 0 0 1 6.5 2.5a5.8 5.8 0 1 0 7 7z\"/></svg>",
  monitor: "<svg aria-hidden=\"true\" focusable=\"false\" viewBox=\"0 0 16 16\" fill=\"none\" stroke=\"currentColor\" stroke-width=\"1.5\" stroke-linecap=\"round\" stroke-linejoin=\"round\"><rect x=\"1.5\" y=\"2.5\" width=\"13\" height=\"8.5\" rx=\"1.5\"/><path d=\"M5.5 14h5M8 11v3\"/></svg>",
  download: "<svg aria-hidden=\"true\" focusable=\"false\" viewBox=\"0 0 16 16\" fill=\"none\" stroke=\"currentColor\" stroke-width=\"1.5\" stroke-linecap=\"round\" stroke-linejoin=\"round\"><path d=\"M8 2.5v8M4.8 7.5L8 10.7l3.2-3.2M2.5 13.5h11\"/></svg>",
  external: "<svg aria-hidden=\"true\" focusable=\"false\" viewBox=\"0 0 16 16\" fill=\"none\" stroke=\"currentColor\" stroke-width=\"1.5\" stroke-linecap=\"round\" stroke-linejoin=\"round\"><path d=\"M9 2.5h4.5V7M13.5 2.5L7 9M11.5 9.5v3a1 1 0 0 1-1 1h-7a1 1 0 0 1-1-1v-7a1 1 0 0 1 1-1h3\"/></svg>",
  copy: "<svg aria-hidden=\"true\" focusable=\"false\" viewBox=\"0 0 16 16\" fill=\"none\" stroke=\"currentColor\" stroke-width=\"1.5\" stroke-linecap=\"round\" stroke-linejoin=\"round\"><rect x=\"5.5\" y=\"5.5\" width=\"8\" height=\"8\" rx=\"1.5\"/><path d=\"M10.5 5.5v-2a1 1 0 0 0-1-1h-6a1 1 0 0 0-1 1v6a1 1 0 0 0 1 1h2\"/></svg>",
  check: "<svg aria-hidden=\"true\" focusable=\"false\" viewBox=\"0 0 16 16\" fill=\"none\" stroke=\"currentColor\" stroke-width=\"1.5\"><circle cx=\"8\" cy=\"8\" r=\"6.5\"/><path d=\"M5 8.2l2 2 4-4.4\"/></svg>",
  arrow: "<svg aria-hidden=\"true\" focusable=\"false\" viewBox=\"0 0 16 16\" fill=\"none\" stroke=\"currentColor\" stroke-width=\"1.5\" stroke-linecap=\"round\" stroke-linejoin=\"round\"><path d=\"M3 8h10M9 4l4 4-4 4\"/></svg>",
  chevron: "<svg aria-hidden=\"true\" focusable=\"false\" viewBox=\"0 0 16 16\" fill=\"none\" stroke=\"currentColor\" stroke-width=\"1.5\" stroke-linecap=\"round\" stroke-linejoin=\"round\"><path d=\"M6 3.5L10.5 8 6 12.5\"/></svg>",
  keyboard: "<svg aria-hidden=\"true\" focusable=\"false\" viewBox=\"0 0 16 16\" fill=\"none\" stroke=\"currentColor\" stroke-width=\"1.5\" stroke-linecap=\"round\" stroke-linejoin=\"round\"><rect x=\"1.5\" y=\"3.5\" width=\"13\" height=\"9\" rx=\"1.5\"/><path d=\"M4 6.5h.01M6.5 6.5h.01M9 6.5h.01M11.5 6.5h.01M5 9.5h6\"/></svg>",
  edit: "<svg aria-hidden=\"true\" focusable=\"false\" viewBox=\"0 0 16 16\" fill=\"none\" stroke=\"currentColor\" stroke-width=\"1.5\" stroke-linecap=\"round\" stroke-linejoin=\"round\"><path d=\"M10.5 2.5l3 3-8 8h-3v-3z\"/></svg>",
  info: "<svg aria-hidden=\"true\" focusable=\"false\" viewBox=\"0 0 16 16\" fill=\"none\" stroke=\"currentColor\" stroke-width=\"1.5\" stroke-linecap=\"round\" stroke-linejoin=\"round\"><circle cx=\"8\" cy=\"8\" r=\"6.5\"/><path d=\"M8 7.5v4M8 4.8h.01\"/></svg>",
  alert: "<svg aria-hidden=\"true\" focusable=\"false\" viewBox=\"0 0 16 16\" fill=\"none\" stroke=\"currentColor\" stroke-width=\"1.5\" stroke-linecap=\"round\" stroke-linejoin=\"round\"><path d=\"M8 2l6.5 11.5h-13z\"/><path d=\"M8 6.5v3M8 11.6h.01\"/></svg>",
  list: "<svg aria-hidden=\"true\" focusable=\"false\" viewBox=\"0 0 16 16\" fill=\"none\" stroke=\"currentColor\" stroke-width=\"1.5\"><path d=\"M5 4h9M5 8h9M5 12h9M2 4h.01M2 8h.01M2 12h.01\"/></svg>",
  xcircle: "<svg aria-hidden=\"true\" focusable=\"false\" viewBox=\"0 0 16 16\" fill=\"none\" stroke=\"currentColor\" stroke-width=\"1.5\" stroke-linecap=\"round\" stroke-linejoin=\"round\"><circle cx=\"8\" cy=\"8\" r=\"6.5\"/><path d=\"M5.8 5.8l4.4 4.4M10.2 5.8l-4.4 4.4\"/></svg>",
  shield: "<svg aria-hidden=\"true\" focusable=\"false\" viewBox=\"0 0 16 16\" fill=\"none\" stroke=\"currentColor\" stroke-width=\"1.5\"><path d=\"M8 1.5l5.5 2v4c0 3.3-2.4 5.6-5.5 7-3.1-1.4-5.5-3.7-5.5-7v-4z\"/></svg>",
  terminal: "<svg aria-hidden=\"true\" focusable=\"false\" viewBox=\"0 0 16 16\" fill=\"none\" stroke=\"currentColor\" stroke-width=\"1.5\"><rect x=\"1.5\" y=\"2.5\" width=\"13\" height=\"11\" rx=\"1.5\"/><path d=\"M4.5 6l2.5 2-2.5 2M8.5 10h3\"/></svg>",
  grid: "<svg aria-hidden=\"true\" focusable=\"false\" viewBox=\"0 0 16 16\" fill=\"none\" stroke=\"currentColor\" stroke-width=\"1.5\"><rect x=\"1.5\" y=\"1.5\" width=\"5.5\" height=\"5.5\" rx=\"1\"/><rect x=\"9\" y=\"1.5\" width=\"5.5\" height=\"5.5\" rx=\"1\"/><rect x=\"1.5\" y=\"9\" width=\"5.5\" height=\"5.5\" rx=\"1\"/><rect x=\"9\" y=\"9\" width=\"5.5\" height=\"5.5\" rx=\"1\"/></svg>",
  globe: "<svg aria-hidden=\"true\" focusable=\"false\" viewBox=\"0 0 16 16\" fill=\"none\" stroke=\"currentColor\" stroke-width=\"1.5\"><circle cx=\"8\" cy=\"8\" r=\"6.5\"/><path d=\"M1.5 8h13M8 1.5c2.2 2 2.2 11 0 13M8 1.5c-2.2 2-2.2 11 0 13\"/></svg>",
  mail: "<svg aria-hidden=\"true\" focusable=\"false\" viewBox=\"0 0 16 16\" fill=\"none\" stroke=\"currentColor\" stroke-width=\"1.5\"><rect x=\"1.5\" y=\"3.5\" width=\"13\" height=\"9\" rx=\"1.5\"/><path d=\"M2 4.5l6 4.5 6-4.5\"/></svg>",
  markdown: "<svg aria-hidden=\"true\" focusable=\"false\" viewBox=\"0 0 16 16\" fill=\"none\" stroke=\"currentColor\" stroke-width=\"1.5\" stroke-linecap=\"round\" stroke-linejoin=\"round\"><rect x=\"1.5\" y=\"3.5\" width=\"13\" height=\"9\" rx=\"1.5\"/><path d=\"M4 10V6l2 2 2-2v4M11 6v4M9.5 8.5L11 10l1.5-1.5\"/></svg>",
  github: "<svg aria-hidden=\"true\" focusable=\"false\" viewBox=\"0 0 16 16\" fill=\"currentColor\"><path d=\"M8 0c4.42 0 8 3.58 8 8a8.01 8.01 0 0 1-5.45 7.59c-.4.08-.55-.17-.55-.38 0-.27.01-1.13.01-2.2 0-.75-.25-1.23-.54-1.48 1.78-.2 3.65-.88 3.65-3.95 0-.88-.31-1.59-.82-2.15.08-.2.36-1.02-.08-2.12 0 0-.67-.22-2.2.82-.64-.18-1.32-.27-2-.27-.68 0-1.36.09-2 .27-1.53-1.03-2.2-.82-2.2-.82-.44 1.1-.16 1.92-.08 2.12-.51.56-.82 1.28-.82 2.15 0 3.06 1.86 3.75 3.64 3.95-.23.2-.44.55-.51 1.07-.46.21-1.61.55-2.33-.66-.15-.24-.6-.83-1.23-.82-.67.01-.27.38.01.53.34.19.73.9.82 1.13.16.45.68 1.31 2.69.94 0 .67.01 1.3.01 1.49 0 .21-.15.45-.55.38A7.995 7.995 0 0 1 0 8c0-4.42 3.58-8 8-8Z\"/></svg>",
}

module.exports = (name) => {
  const svg = icons[name]
  if (!svg) throw new Error(`zc-supplemental-ui: unknown icon "${name}"`)
  return svg
}
