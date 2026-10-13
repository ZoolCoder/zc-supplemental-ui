// zc-supplemental-ui: the behaviour behind the ZoolCoder docs shell. Plain
// script, no framework. Every feature checks for its markup and quietly does
// nothing without it, so a page that drops a partial still works.
;(function () {
  'use strict'

  var root = document.documentElement
  var isMac = /Mac|iP(hone|ad|od)/.test(navigator.platform || navigator.userAgent)
  var rtl = root.dir === 'rtl'

  function $ (sel, ctx) { return (ctx || document).querySelector(sel) }
  function $$ (sel, ctx) { return Array.prototype.slice.call((ctx || document).querySelectorAll(sel)) }

  function typing (el) {
    return el && (el.isContentEditable || /^(INPUT|TEXTAREA|SELECT)$/.test(el.tagName))
  }

  // Interface strings in the page's language, written by the shell.
  var S = { copy: 'Copy', copied: 'Copied', copyCode: 'Copy to clipboard', pressCopy: 'Press %s', noResults: 'No results for “%s”', otherLangs: [] }
  try {
    var given = JSON.parse(($('#zc-strings') || {}).textContent || '{}')
    for (var k in given) S[k] = given[k]
  } catch (e) { /* keep the English defaults */ }

  function fill (text, value) { return text.replace('%s', value) }

  // Shows a short confirmation on a button, then puts its label back.
  function flash (button, label, text) {
    var before = label.textContent
    label.textContent = text
    button.classList.add('on')
    setTimeout(function () { label.textContent = before; button.classList.remove('on') }, 1600)
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

  var searchField = $('#search-field')
  if (searchField && searchInput) searchResults(searchField)

  function searchResults (field) {
    function hits () { return $$('.search-result-document-hit > a', field) }

    // Arrow keys walk the results and Enter opens the first one. This runs
    // in the capture phase and stops the event, because the search script
    // redraws the whole list on every key it sees in the input.
    field.addEventListener('keydown', function (e) {
      var list = hits()
      var at = list.indexOf(document.activeElement)
      if (e.key === 'Escape' && at >= 0) {
        e.preventDefault()
        e.stopPropagation()
        searchInput.focus()
      } else if (e.key === 'Enter' && e.target === searchInput && list.length) {
        e.preventDefault()
        e.stopPropagation()
        list[0].click()
      } else if ((e.key === 'ArrowDown' || e.key === 'ArrowUp') && list.length) {
        e.preventDefault()
        e.stopPropagation()
        var next = at + (e.key === 'ArrowDown' ? 1 : -1)
        if (next < 0) searchInput.focus()
        else list[Math.min(next, list.length - 1)].focus()
      }
    }, true)

    // A site in several languages shares one index. Keep the reader in their
    // language, and say "no results" in it too.
    new MutationObserver(function () {
      $$('.search-result-dataset:not([data-zc])', field).forEach(function (set) {
        set.setAttribute('data-zc', '')
        if (S.otherLangs.length) {
          $$('.search-result-item', set).forEach(function (item) {
            var a = $('.search-result-document-hit > a', item)
            if (!a) return
            var path = new URL(a.href, location.href).pathname
            var other = S.otherLangs.some(function (name) { return path.indexOf('/' + name + '/') >= 0 })
            if (other) item.remove()
          })
        }
        if (!$('.search-result-document-hit > a', set)) {
          set.textContent = ''
          var empty = document.createElement('div')
          empty.className = 'search-result-item zc-empty'
          empty.textContent = fill(S.noResults, searchInput.value.trim())
          set.appendChild(empty)
        }
      })
    }).observe(field, { childList: true, subtree: true })
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
    if (e.target.closest && e.target.closest('.search, [role=tablist]')) return

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
      // In a right-to-left page the previous page is to the right.
      case 'ArrowLeft': go($(rtl ? 'link[rel=next]' : 'link[rel=prev]')); break
      case 'ArrowRight': go($(rtl ? 'link[rel=prev]' : 'link[rel=next]')); break
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
    button.setAttribute('aria-label', S.copyCode)
    var label = document.createElement('span')
    label.textContent = S.copy
    button.appendChild(label)
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
        flash(button, label, S.copied)
      }, function () {
        label.textContent = fill(S.pressCopy, isMac ? '⌘C' : 'Ctrl C')
      })
    })
  })

  // ---------------------------------------------------------------- copy as Markdown

  // The button copies the page's Markdown twin, written by the llms
  // extension. The fetch goes inside the ClipboardItem so Safari still
  // counts the copy as part of the click. If the copy fails, open the file.
  $$('[data-copy-md]').forEach(function (button) {
    var label = $('span', button)
    if (!navigator.clipboard) { button.hidden = true; return }
    button.addEventListener('click', function () {
      var url = button.getAttribute('data-copy-md')
      var text = fetch(url).then(function (r) {
        if (!r.ok) throw new Error(url + ': ' + r.status)
        return r.text()
      })
      var copied = window.ClipboardItem && navigator.clipboard.write
        ? navigator.clipboard.write([new window.ClipboardItem({
            'text/plain': text.then(function (t) { return new Blob([t], { type: 'text/plain' }) })
          })])
        : text.then(function (t) { return navigator.clipboard.writeText(t) })
      copied.then(function () { flash(button, label, S.copied) }, function () { window.location.href = url })
    })
  })

  // ---------------------------------------------------------------- tabs

  // Markup from the Asciidoctor Tabs extension. Tabs marked as synced share
  // a choice across the page, remembered for the next visit.
  var tabsBlocks = $$('.doc .tabs')
  tabsBlocks.forEach(initTabs)
  if (tabsBlocks.length) {
    window.addEventListener('hashchange', openTabFromHash)
    openTabFromHash()
  }

  function initTabs (tabs) {
    var list = $('.tablist > ul', tabs)
    if (!list) return
    list.setAttribute('role', 'tablist')
    var pairs = $$(':scope > li', list).map(function (tab) {
      var anchor
      if (!tab.id && (anchor = $('a[id]', tab))) { tab.id = anchor.id; anchor.remove() }
      var panel = tab.id && document.querySelector('.tabpanel[aria-labelledby~="' + tab.id + '"]')
      tab.classList.add('tab')
      tab.setAttribute('role', 'tab')
      if (panel) {
        tab.setAttribute('aria-controls', panel.id)
        panel.setAttribute('role', 'tabpanel')
        panel.setAttribute('tabindex', '0')
      }
      return { tab: tab, panel: panel, label: tab.textContent.trim() }
    }).filter(function (p) { return p.panel })
    if (!pairs.length) return
    tabs.zcPairs = pairs
    tabs.zcGroup = tabs.classList.contains('is-sync')
      ? 'zc-tab:' + pairs.map(function (p) { return p.label }).sort().join('|')
      : ''

    var stored
    try { stored = tabs.zcGroup && localStorage.getItem(tabs.zcGroup) } catch (e) { /* not remembered */ }
    var start = pairs.filter(function (p) { return p.label === stored })[0] || pairs[0]
    selectTab(tabs, start, false)
    tabs.classList.remove('is-loading')

    pairs.forEach(function (p, i) {
      p.tab.addEventListener('click', function () { selectTab(tabs, p, true) })
      p.tab.addEventListener('keydown', function (e) {
        var step = { ArrowRight: rtl ? -1 : 1, ArrowLeft: rtl ? 1 : -1 }[e.key]
        var to = step ? (i + step + pairs.length) % pairs.length : e.key === 'Home' ? 0 : e.key === 'End' ? pairs.length - 1 : -1
        if (to < 0) {
          if (e.key === 'Enter' || e.key === ' ') { e.preventDefault(); selectTab(tabs, p, true) }
          return
        }
        e.preventDefault()
        selectTab(tabs, pairs[to], true)
        pairs[to].tab.focus()
      })
    })
  }

  function selectTab (tabs, chosen, byReader) {
    tabs.zcPairs.forEach(function (p) {
      var on = p === chosen
      p.tab.setAttribute('aria-selected', String(on))
      p.tab.classList.toggle('is-selected', on)
      p.tab.tabIndex = on ? 0 : -1
      p.panel.hidden = !on
    })
    if (!byReader || !tabs.zcGroup) return
    try { localStorage.setItem(tabs.zcGroup, chosen.label) } catch (e) { /* not remembered */ }
    // Keep the block the reader clicked still while the others change size.
    var top = tabs.getBoundingClientRect().top
    tabsBlocks.forEach(function (other) {
      if (other === tabs || other.zcGroup !== tabs.zcGroup) return
      var same = other.zcPairs.filter(function (p) { return p.label === chosen.label })[0]
      if (same) selectTab(other, same, false)
    })
    var moved = tabs.getBoundingClientRect().top - top
    if (moved) window.scrollBy(0, moved)
  }

  function openTabFromHash () {
    var id = decodeURIComponent(location.hash.slice(1))
    var tab = id && document.getElementById(id)
    var tabs = tab && tab.getAttribute('role') === 'tab' && tab.closest('.tabs')
    if (!tabs || !tabs.zcPairs) return
    var pair = tabs.zcPairs.filter(function (p) { return p.tab === tab })[0]
    if (pair) selectTab(tabs, pair, true)
  }

  // Wide tables scroll inside their own box instead of widening the page.
  $$('.doc table.tableblock').forEach(function (table) {
    if (table.parentNode.classList.contains('tw')) return
    var wrap = document.createElement('div')
    wrap.className = 'tw'
    table.parentNode.insertBefore(wrap, table)
    wrap.appendChild(table)
  })

  // A code block, table or diagram wider than the page scrolls in its own
  // box; a box that scrolls takes keyboard focus, so it scrolls without a
  // mouse. Checked again when the window changes size.
  var scrollers = $$('.doc pre, .doc .tw, .doc .imageblock.diagram > .content')
  function markScrollers () {
    scrollers.forEach(function (el) {
      if (el.scrollWidth > el.clientWidth + 1) {
        el.tabIndex = 0
        el.setAttribute('data-zc-scroll', '')
      } else if (el.hasAttribute('data-zc-scroll')) {
        el.removeAttribute('tabindex')
        el.removeAttribute('data-zc-scroll')
      }
    })
  }
  var resizing
  markScrollers()
  window.addEventListener('resize', function () { clearTimeout(resizing); resizing = setTimeout(markScrollers, 150) })

  // Asciidoctor's heading anchors are empty links; give each a name.
  $$('.doc a.anchor').forEach(function (a) {
    var heading = a.parentNode.cloneNode(true)
    $$('.anchor', heading).forEach(function (x) { x.remove() })
    a.setAttribute('aria-label', fill(S.anchor, heading.textContent.trim()))
  })
})()
