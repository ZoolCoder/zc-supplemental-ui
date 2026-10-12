// zc-supplemental-ui: the behaviour behind the ZoolCoder docs shell. Plain
// script, no framework. Every feature checks for its markup and quietly does
// nothing without it, so a page that drops a partial still works.
;(function () {
  'use strict'

  var root = document.documentElement
  var isMac = /Mac|iP(hone|ad|od)/.test(navigator.platform || navigator.userAgent)

  function $ (sel, ctx) { return (ctx || document).querySelector(sel) }
  function $$ (sel, ctx) { return Array.prototype.slice.call((ctx || document).querySelectorAll(sel)) }

  function typing (el) {
    return el && (el.isContentEditable || /^(INPUT|TEXTAREA|SELECT)$/.test(el.tagName))
  }

  // ---------------------------------------------------------------- theme

  var THEMES = ['light', 'dark', 'auto']

  function setTheme (theme) {
    root.setAttribute('data-theme', theme)
    try { localStorage.setItem('zc-theme', theme) } catch (e) { /* not persisted */ }
    $$('[data-theme-set]').forEach(function (b) {
      var on = b.getAttribute('data-theme-set') === theme
      b.classList.toggle('on', on)
      b.setAttribute('aria-checked', String(on))
    })
  }

  setTheme(root.getAttribute('data-theme') || 'auto')
  $$('[data-theme-set]').forEach(function (b) {
    b.addEventListener('click', function () { setTheme(b.getAttribute('data-theme-set')) })
  })

  function cycleTheme () {
    var i = THEMES.indexOf(root.getAttribute('data-theme'))
    setTheme(THEMES[(i + 1) % THEMES.length])
  }

  // ---------------------------------------------------------------- drawer

  var shell = $('.shell')
  var scrim = $('[data-scrim]')
  var drawerBtn = $('[data-drawer]')

  function drawer (open) {
    if (!shell) return
    shell.classList.toggle('open', open)
    document.body.classList.toggle('locked', open)
    if (scrim) scrim.hidden = !open
    if (drawerBtn) drawerBtn.setAttribute('aria-expanded', String(open))
    if (open) {
      var current = $('.side .on') || $('.side a')
      if (current) current.focus({ preventScroll: true })
    } else if (drawerBtn && shell.contains(document.activeElement)) {
      drawerBtn.focus()
    }
  }

  if (drawerBtn) drawerBtn.addEventListener('click', function () { drawer(true) })
  $$('[data-drawer-close]').forEach(function (b) { b.addEventListener('click', function () { drawer(false) }) })
  if (scrim) scrim.addEventListener('click', function () { drawer(false) })

  // Keep the current page visible in a long sidebar.
  var currentLink = $('.side .on')
  if (currentLink && currentLink.scrollIntoView) currentLink.scrollIntoView({ block: 'center' })

  // ---------------------------------------------------------------- search

  var searchInput = $('#search-input')
  var palkey = $('[data-palkey]')
  if (palkey) palkey.textContent = isMac ? '⌘K' : 'Ctrl K'

  function focusSearch () {
    if (!searchInput) return
    drawer(false)
    searchInput.focus()
    searchInput.select()
  }

  // ---------------------------------------------------------------- shortcuts

  var keys = $('#zc-keys')
  var pendingG = 0

  function go (link) {
    if (link && link.href) window.location.href = link.href
  }

  document.addEventListener('keydown', function (e) {
    if ((e.metaKey || e.ctrlKey) && !e.altKey && e.key.toLowerCase() === 'k') {
      e.preventDefault()
      focusSearch()
      return
    }
    if (e.key === 'Escape') {
      if (shell && shell.classList.contains('open')) drawer(false)
      if (document.activeElement === searchInput) searchInput.blur()
      return
    }
    if (e.metaKey || e.ctrlKey || e.altKey || typing(e.target)) return

    if (pendingG && Date.now() - pendingG < 1200) {
      pendingG = 0
      if (e.key === 'h') go($('.brand'))
      return
    }
    switch (e.key) {
      case '/': e.preventDefault(); focusSearch(); break
      case '?': if (keys && keys.showModal) keys.showModal(); break
      case 't': cycleTheme(); break
      case 'g': pendingG = Date.now(); break
      case 'ArrowLeft': go($('link[rel=prev]')); break
      case 'ArrowRight': go($('link[rel=next]')); break
    }
  })

  $$('[data-keys]').forEach(function (b) {
    b.addEventListener('click', function () {
      var menu = b.closest('[popover]')
      if (menu && menu.hidePopover) menu.hidePopover()
      if (keys && keys.showModal) keys.showModal()
    })
  })

  // ---------------------------------------------------------------- table of contents

  var toc = $('.toc')
  var article = $('article.doc')
  if (toc && article) buildToc(toc, article)

  function buildToc (toc, article) {
    var levels = parseInt(toc.getAttribute('data-levels'), 10) || 2
    var sel = []
    for (var l = 1; l <= levels; l++) sel.push('.sect' + l + ' > h' + (l + 1) + '[id]')
    var headings = $$(sel.join(','), article)
    if (headings.length < 2) return

    var list = document.createElement('ul')
    var links = headings.map(function (h) {
      var li = document.createElement('li')
      li.className = 'l' + (parseInt(h.tagName.slice(1), 10) - 1)
      var a = document.createElement('a')
      a.href = '#' + h.id
      var clone = h.cloneNode(true)
      $$('.anchor', clone).forEach(function (x) { x.remove() })
      a.textContent = clone.textContent.trim()
      li.appendChild(a)
      list.appendChild(li)
      return a
    })
    $('.toc-menu', toc).appendChild(list)
    toc.hidden = false

    // The active entry is the last heading that has scrolled past the top
    // quarter of the viewport.
    var ticking = false
    function spy () {
      ticking = false
      var line = window.innerHeight * 0.25
      var active = 0
      headings.forEach(function (h, i) { if (h.getBoundingClientRect().top <= line) active = i })
      if (window.innerHeight + window.scrollY >= document.body.scrollHeight - 2) active = headings.length - 1
      links.forEach(function (a, i) {
        a.classList.toggle('on', i === active)
        if (i === active) a.setAttribute('aria-current', 'location')
        else a.removeAttribute('aria-current')
      })
    }
    window.addEventListener('scroll', function () {
      if (!ticking) { ticking = true; window.requestAnimationFrame(spy) }
    }, { passive: true })
    spy()
  }

  // ---------------------------------------------------------------- code blocks

  if (window.hljs) {
    $$('pre.highlight > code[data-lang]').forEach(function (code) {
      if (window.hljs.getLanguage(code.getAttribute('data-lang'))) highlight(code)
    })
  }

  // highlight.js only reads text, so it would flatten callout markers to
  // "(1)". Lift them out with the line each sits on, highlight, and put them
  // back at the end of the same lines.
  function highlight (code) {
    var callouts = $$('.conum', code).map(function (conum) {
      var range = document.createRange()
      range.setStart(code, 0)
      range.setEndBefore(conum)
      var line = range.toString().split('\n').length - 1
      var label = conum.nextElementSibling
      var html = conum.outerHTML + (label && label.tagName === 'B' ? label.outerHTML : '')
      if (label && label.tagName === 'B') label.remove()
      conum.remove()
      return { line: line, html: html }
    })
    window.hljs.highlightElement(code)
    if (!callouts.length) return
    var lines = code.innerHTML.split('\n')
    callouts.forEach(function (c) {
      lines[c.line] = lines[c.line].replace(/\s+$/, '') + ' ' + c.html
    })
    code.innerHTML = lines.join('\n')
  }

  $$('.doc .listingblock > .content').forEach(function (content) {
    var pre = $('pre', content)
    if (!pre) return
    var code = $('code', pre) || pre
    var lang = code.getAttribute('data-lang')
    if (lang) content.setAttribute('data-lang', lang)
    if (!navigator.clipboard) return

    var button = document.createElement('button')
    button.type = 'button'
    button.className = 'copy'
    button.setAttribute('aria-label', 'Copy to clipboard')
    button.textContent = 'Copy'
    content.appendChild(button)

    button.addEventListener('click', function () {
      // In a console block only the command lines are copied, without their
      // prompt, so the paste runs as it is. Output lines are left behind.
      var text = code.textContent
      if (lang === 'console' || lang === 'shell-session') {
        var cmds = text.split('\n').filter(function (line) { return /^\s*[$#] /.test(line) })
        if (cmds.length) text = cmds.map(function (line) { return line.replace(/^\s*[$#] /, '') }).join('\n')
      }
      navigator.clipboard.writeText(text.replace(/\s+$/, '')).then(function () {
        button.textContent = 'Copied'
        button.classList.add('on')
        setTimeout(function () { button.textContent = 'Copy'; button.classList.remove('on') }, 1600)
      }, function () {
        button.textContent = isMac ? 'Press ⌘C' : 'Press Ctrl C'
      })
    })
  })

  // Wide tables scroll inside their own box instead of widening the page.
  $$('.doc table.tableblock').forEach(function (table) {
    if (table.parentNode.classList.contains('tw')) return
    var wrap = document.createElement('div')
    wrap.className = 'tw'
    table.parentNode.insertBefore(wrap, table)
    wrap.appendChild(table)
  })
})()
