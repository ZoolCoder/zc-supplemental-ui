'use strict'

// Antora extension: sets page-zc-updated on every page to the date of the
// last commit that changed its source file. The UI shows it as "Last
// updated" under the page.
//
//   antora:
//     extensions:
//     - zc-supplemental-ui/extensions/last-updated.js
//
// One git log runs per content source, not one per page. In CI, check out the
// full history (fetch-depth: 0 on actions/checkout), or every page gets the
// date of the last commit. A page that sets page-zc-updated keeps its own.

const { execFileSync } = require('node:child_process')
const path = require('node:path')

module.exports.register = function () {
  const logger = this.getLogger('zc-last-updated')

  this.on('documentsConverted', ({ contentCatalog }) => {
    const histories = new Map()
    for (const page of contentCatalog.getPages((it) => it.out && it.asciidoc)) {
      const attributes = page.asciidoc.attributes
      if (attributes['page-zc-updated']) continue
      const origin = page.src.origin
      if (!origin) continue
      const key = [origin.gitdir || origin.worktree, origin.refname, origin.startPath].join('\0')
      if (!histories.has(key)) histories.set(key, history(origin, logger))
      const repoPath = path.posix.join(origin.startPath || '', page.src.path)
      const date = histories.get(key).get(repoPath)
      if (date) attributes['page-zc-updated'] = date
    }
  })
}

// Maps each file under the origin's start path to the date of its last
// commit, newest first, so the first date seen for a file is the one kept.
function history (origin, logger) {
  const dates = new Map()
  const git = gitCommand(origin)
  if (!git) return dates
  let out
  try {
    out = execFileSync('git', [...git.args, '-c', 'core.quotePath=false', 'log', '--format=%x00%cI', '--name-only', git.rev, '--', origin.startPath || '.'], {
      cwd: git.cwd,
      encoding: 'utf8',
      maxBuffer: 256 * 1024 * 1024,
      stdio: ['ignore', 'pipe', 'ignore'],
    })
  } catch (err) {
    logger.warn(`no git history for ${origin.url || origin.worktree}: ${err.message.split('\n')[0]}`)
    return dates
  }
  for (const commit of out.split('\0')) {
    const [date, ...files] = commit.split('\n')
    for (const file of files) if (file && !dates.has(file)) dates.set(file, date.trim())
  }
  return dates
}

// A worktree is read where it is. Any other branch or tag is read from the
// repository Antora cloned or found, at the ref it used.
function gitCommand (origin) {
  if (origin.worktree) return { cwd: origin.worktree, args: [], rev: 'HEAD' }
  if (!origin.gitdir) return
  const args = ['--git-dir', origin.gitdir]
  const refs = [
    origin.refhash,
    origin.reftype === 'tag' ? `refs/tags/${origin.refname}` : undefined,
    `refs/heads/${origin.refname}`,
    `refs/remotes/origin/${origin.refname}`,
  ]
  for (const ref of refs.filter(Boolean)) {
    try {
      execFileSync('git', [...args, 'rev-parse', '--verify', '--quiet', `${ref}^{commit}`], { stdio: 'ignore' })
      return { cwd: process.cwd(), args, rev: ref }
    } catch {
      // try the next form of the ref
    }
  }
}
