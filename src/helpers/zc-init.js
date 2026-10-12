'use strict'

// {{zc-init}} runs once at the top of the shell. It works out the page's
// language, writing direction, interface strings and translations, and keeps
// them on @root.zc for the partials and for the {{t}} and {{date}} helpers.
// Antora loads each helper on its own, so this is the one place that knows
// about languages.
//
// A site lists its translations with one attribute, set on every component
// that takes part (or once in the playbook):
//
//   page-zc-langs: en=mailctl ar=mailctl-ar
//
// Each entry pairs a language with the component that holds it. A page's
// language is page-lang when set, else its component's entry, else English.

const RTL = ['ar', 'fa', 'he', 'ps', 'ur', 'yi']

const NAMES = {
  ar: 'العربية',
  de: 'Deutsch',
  en: 'English',
  es: 'Español',
  fa: 'فارسی',
  fr: 'Français',
  he: 'עברית',
  it: 'Italiano',
  ja: '日本語',
  pt: 'Português',
  tr: 'Türkçe',
  ur: 'اردو',
  zh: '中文',
}

const STRINGS = {
  en: {
    skip: 'Skip to content',
    home: 'Documentation home',
    tagline: 'Documentation',
    openMenu: 'Open menu',
    closeMenu: 'Close menu',
    search: 'Search the docs',
    pdfTitle: 'Download the whole guide as a PDF',
    githubTitle: 'Source on GitHub',
    themeMenu: 'Theme and shortcuts',
    theme: 'Theme',
    light: 'Light',
    dark: 'Dark',
    auto: 'Auto',
    autoTitle: 'Follow the system setting',
    shortcuts: 'Keyboard shortcuts',
    website: 'Website',
    breadcrumb: 'Breadcrumb',
    by: 'by',
    source: 'Source',
    issues: 'Issues',
    releases: 'Releases',
    license: 'MIT licensed',
    docs: 'Documentation',
    pages: 'Pages',
    openSource: 'Open source',
    keysSearch: 'Search the docs',
    keysResults: 'Move through the search results',
    keysPage: 'Previous or next page',
    keysHome: 'Home',
    keysTheme: 'Cycle the theme',
    keysList: 'This list',
    keysEsc: 'Close a menu or the search results',
    close: 'Close',
    or: 'or',
    prevKey: '←',
    nextKey: '→',
    notFound: 'Page not found',
    notFoundSub: 'The page may have moved. Search the docs, or start again from the home page.',
    backHome: 'Back to the docs',
    editPage: 'Edit this page',
    onThisPage: 'On this page',
    previous: 'Previous',
    next: 'Next',
    pager: 'Previous and next page',
    language: 'Language',
    version: 'Version',
    latest: 'latest',
    updated: 'Last updated',
    copyPage: 'Copy as Markdown',
    markdownTitle: 'View this page as Markdown',
  },
  ar: {
    skip: 'انتقل إلى المحتوى',
    home: 'الصفحة الرئيسية للتوثيق',
    tagline: 'التوثيق',
    openMenu: 'افتح القائمة',
    closeMenu: 'أغلق القائمة',
    search: 'ابحث في التوثيق',
    pdfTitle: 'نزّل الدليل كاملًا بصيغة PDF',
    githubTitle: 'الشيفرة المصدرية على GitHub',
    themeMenu: 'المظهر والاختصارات',
    theme: 'المظهر',
    light: 'فاتح',
    dark: 'داكن',
    auto: 'تلقائي',
    autoTitle: 'اتبع إعداد النظام',
    shortcuts: 'اختصارات لوحة المفاتيح',
    website: 'الموقع',
    breadcrumb: 'مسار التنقل',
    by: 'من',
    source: 'المصدر',
    issues: 'المشكلات',
    releases: 'الإصدارات',
    license: 'مرخّص بموجب MIT',
    docs: 'التوثيق',
    pages: 'الصفحات',
    openSource: 'مفتوح المصدر',
    keysSearch: 'ابحث في التوثيق',
    keysResults: 'تنقّل بين نتائج البحث',
    keysPage: 'الصفحة السابقة أو التالية',
    keysHome: 'الصفحة الرئيسية',
    keysTheme: 'بدّل المظهر',
    keysList: 'هذه القائمة',
    keysEsc: 'أغلق القائمة أو نتائج البحث',
    close: 'إغلاق',
    or: 'أو',
    prevKey: '→',
    nextKey: '←',
    notFound: 'الصفحة غير موجودة',
    notFoundSub: 'ربما نُقلت الصفحة. ابحث في التوثيق، أو ابدأ من جديد من الصفحة الرئيسية.',
    backHome: 'العودة إلى التوثيق',
    editPage: 'عدّل هذه الصفحة',
    onThisPage: 'في هذه الصفحة',
    previous: 'السابق',
    next: 'التالي',
    pager: 'الصفحة السابقة والتالية',
    language: 'اللغة',
    version: 'الإصدار',
    latest: 'الأحدث',
    updated: 'آخر تحديث',
    copyPage: 'انسخ بصيغة Markdown',
    markdownTitle: 'اعرض هذه الصفحة بصيغة Markdown',
  },
}

// Strings zc.js needs at run time; %s marks where a value goes.
const SCRIPT_STRINGS = {
  en: {
    copy: 'Copy',
    copied: 'Copied',
    copyCode: 'Copy to clipboard',
    pressCopy: 'Press %s',
    noResults: 'No results for “%s”',
    anchor: 'Link to “%s”',
  },
  ar: {
    copy: 'نسخ',
    copied: 'نُسخ',
    copyCode: 'انسخ إلى الحافظة',
    pressCopy: 'اضغط %s',
    noResults: 'لا نتائج لـ «%s»',
    anchor: 'رابط إلى «%s»',
  },
}

function parseLangs (value) {
  return String(value || '')
    .split(/[\s,]+/)
    .map((entry) => entry.split('='))
    .filter(([lang, component]) => lang && component)
    .map(([lang, component]) => ({ lang, component }))
}

function base (lang) {
  return String(lang).toLowerCase().split(/[-_]/)[0]
}

// The same page in another component: same version when it has one, same
// module and path. A page with no translation yet links to that component's
// start page instead.
function translationUrl (catalog, page, componentName) {
  const component = catalog.getComponent(componentName)
  if (!component) return
  const version = component.versions.find((it) => it.version === page.version) || component.latest
  const target = catalog.getById({
    component: componentName,
    version: version.version,
    module: page.module,
    family: 'page',
    relative: page.relativeSrcPath,
  })
  return target ? target.pub.url : version.url
}

module.exports = ({ data: { root } }) => {
  const page = root.page || {}
  const attrs = page.attributes || {}
  const componentName = page.component && page.component.name
  const entries = parseLangs(attrs['zc-langs'])
  const own = entries.find((it) => it.component === componentName)
  const lang = attrs.lang || (own && own.lang) || 'en'
  const key = base(lang)

  const strings = Object.assign({}, STRINGS.en, STRINGS[key])
  const script = Object.assign({}, SCRIPT_STRINGS.en, SCRIPT_STRINGS[key])
  // Search hits from the other languages' components are hidden by zc.js.
  script.otherLangs = entries.filter((it) => it.component !== componentName).map((it) => it.component)

  let langs
  if (own && entries.length > 1 && root.contentCatalog) {
    const siteUrl = root.site && root.site.url
    langs = entries
      .map((it) => {
        const url = it.component === componentName ? page.url : translationUrl(root.contentCatalog, page, it.component)
        if (!url) return undefined
        return {
          lang: it.lang,
          name: NAMES[base(it.lang)] || it.lang,
          url,
          absoluteUrl: siteUrl && siteUrl.charAt() !== '/' ? siteUrl + url : undefined,
          current: it.component === componentName,
          dir: RTL.includes(base(it.lang)) ? 'rtl' : 'ltr',
        }
      })
      .filter(Boolean)
    if (langs.length < 2) langs = undefined
  }

  root.zc = {
    lang,
    dir: RTL.includes(key) ? 'rtl' : 'ltr',
    strings,
    langs,
    current: langs && langs.find((it) => it.current),
    script: JSON.stringify(script).replace(/</g, '\\u003c'),
  }
  return ''
}
