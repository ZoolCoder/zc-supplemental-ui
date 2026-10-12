'use strict'

// {{t "key"}} prints an interface string in the page's language, from the
// table {{zc-init}} put on @root.zc. A missing key shows as itself, so a typo
// is visible on the page instead of leaving a blank.
module.exports = (key, { data: { root } }) => {
  const strings = (root.zc && root.zc.strings) || {}
  return key in strings ? strings[key] : key
}
