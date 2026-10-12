'use strict'

// The last argument is Handlebars' options object, so it is never a value.
module.exports = (...args) => args.slice(0, -1).every(Boolean)
