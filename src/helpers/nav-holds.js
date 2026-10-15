'use strict'

// {{#if (nav-holds item url)}} is true when the page at url sits anywhere
// below item, so the nav opens the group that holds the current page.
const holds = (items, url) => (items || []).some((it) => it.url === url || holds(it.items, url))

module.exports = (item, url) => !!item && holds(item.items, url)
