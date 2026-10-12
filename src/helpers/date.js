'use strict'

// {{date iso}} writes a date the way readers of the page's language expect,
// for example "12 October 2026" or "١٢ أكتوبر ٢٠٢٦".
module.exports = (iso, { data: { root } }) => {
  const date = new Date(iso)
  if (!iso || Number.isNaN(date.getTime())) return iso
  const lang = (root.zc && root.zc.lang) || 'en'
  try {
    return new Intl.DateTimeFormat(lang, { dateStyle: 'long' }).format(date)
  } catch (e) {
    return date.toISOString().slice(0, 10)
  }
}
