'use strict'

// Page titles can carry inline markup; <title> and meta tags need plain text.
module.exports = (html) => (html ? String(html).replace(/<[^>]+>/g, '') : html)
