'use strict'

const { posix: path } = require('path')

// Turns a root-relative URL into one relative to the current page, so the site
// works from any base path, including a file:// preview.
module.exports = (to, ...rest) => {
  const { data } = rest.pop()
  if (!to) return '#'
  if (to.charAt(0) !== '/') return to
  const from = rest[0] || data.root.page.url
  if (!from) return (data.root.site.path || '') + to
  const hashAt = to.indexOf('#')
  const hash = hashAt < 0 ? '' : to.slice(hashAt)
  const target = hashAt < 0 ? to : to.slice(0, hashAt)
  const isDir = target.endsWith('/')
  if (target === from) return hash || (isDir ? './' : path.basename(target))
  const rel = path.relative(path.dirname(from + '.'), target) || '.'
  return rel + (isDir ? '/' : '') + hash
}
