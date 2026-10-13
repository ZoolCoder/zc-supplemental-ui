// Set before first paint, so a reader who chose a theme never sees the other
// one flash. A blocked localStorage must not take the page down with it.
;(function () {
  var theme = 'auto'
  try { theme = localStorage.getItem('zc-theme') || 'auto' } catch (e) {}
  document.documentElement.setAttribute('data-theme', theme)
})()
