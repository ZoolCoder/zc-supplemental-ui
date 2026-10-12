'use strict'

// Returns the first truthy value, like JavaScript's ||, so it can pick a default.
module.exports = (...args) => {
  const values = args.slice(0, -1)
  return values.find(Boolean) ?? values[values.length - 1]
}
