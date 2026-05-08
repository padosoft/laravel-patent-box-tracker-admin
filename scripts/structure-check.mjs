#!/usr/bin/env node
import { existsSync, readFileSync } from 'node:fs';
import { join, dirname } from 'node:path';
import { fileURLToPath } from 'node:url';

const here = dirname(fileURLToPath(import.meta.url));
const repoRoot = join(here, '..');

const required = [
  'project/index.html',
  'project/api-client.jsx',
  'project/app.jsx',
  'project/shell.jsx',
  'project/pages-dashboard.jsx',
  'project/pages-sessions.jsx',
  'project/pages-newrun.jsx',
  'project/pages-detail.jsx',
  'project/pages-misc.jsx',
  'project/styles.css',
  'project/patentbox.css',
  'README.md',
  'docs/PROGRESS.md',
  'docs/ENTERPRISE_PLAN.md',
  'docs/RULES.md',
  'docs/LESSON.md',
  '.claude/skills/patent-box-admin-enterprise/SKILL.md',
  '.claude/skills/copilot-pr-review-loop/SKILL.md',
];

const missing = required.filter((rel) => !existsSync(join(repoRoot, rel)));
if (missing.length > 0) {
  console.error('structure-check: missing required files:');
  for (const path of missing) {
    console.error('  - ' + path);
  }
  process.exit(1);
}

const apiClient = readFileSync(join(repoRoot, 'project/api-client.jsx'), 'utf8');

// Endpoint coverage: each entry is matched against the raw text of
// api-client.jsx via a regex that requires the path to be followed by a URL
// terminator (quote, backtick, '?', '/', or a template-literal '${...}').
// This is a string-level guard, not an AST-level analysis: it does NOT prove
// the segment lives inside a request(...)/fetch(...) call, only that it
// appears as a URL fragment that closes correctly. Without the terminator
// check, a shorter path like '/tracking-sessions' would match inside a
// longer one (e.g. '/tracking-sessions/dry-run') and the gate would silently
// pass even if real coverage regressed.
const expectedEndpoints = [
  { path: '/health', terminal: true },
  { path: '/capabilities', terminal: true },
  { path: '/repositories/validate', terminal: true },
  { path: '/tracking-sessions/dry-run', terminal: true },
  // /tracking-sessions is followed by either a quote/backtick (list/create call)
  // or by a template-literal interpolation (`${id}`); both are accepted.
  { path: '/tracking-sessions', terminal: false },
  // Sub-resources of a tracking session. /commits and /evidence are followed
  // by a template-literal '${qs ? ...}' that appends the optional query
  // string, so the lookahead must accept '${' — non-terminal. /integrity
  // closes the URL on a backtick (no query string accepted by the API), so
  // it is terminal.
  { path: '/commits', terminal: false },
  { path: '/evidence', terminal: false },
  { path: '/integrity', terminal: true },
  // /dossiers can be followed by /{dossierId}, /{dossierId}/download, or
  // close the URL on a list/create call — non-terminal.
  { path: '/dossiers', terminal: false },
  { path: '/download', terminal: true },
];

function escapeRegex(s) {
  return s.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
}

const missingEndpoints = expectedEndpoints.filter(({ path, terminal }) => {
  const escaped = escapeRegex(path);
  // Accept the endpoint when followed by a string-terminator (quote/backtick),
  // a path separator, a query-string '?' or a template-literal '${...}'.
  // Terminal-only endpoints (e.g. /health) must close the URL — the only
  // characters allowed immediately after are a quote/backtick (end of string)
  // or '?' (start of a query string).
  const tail = terminal ? `(?=['"\`?])` : `(?=['"\`?]|/|\\$\\{)`;
  return !new RegExp(escaped + tail).test(apiClient);
});
if (missingEndpoints.length > 0) {
  console.error('structure-check: api-client.jsx is missing references to:');
  for (const { path } of missingEndpoints) {
    console.error('  - ' + path);
  }
  process.exit(1);
}

if (!apiClient.includes('validation_failed') || !apiClient.includes('invalid_repository')) {
  console.error('structure-check: api-client.jsx must keep the invalid_repository -> validation_failed alias.');
  process.exit(1);
}

const indexHtml = readFileSync(join(repoRoot, 'project/index.html'), 'utf8');
const expectedScripts = [
  'ui.jsx',
  'tweaks-panel.jsx',
  'data.jsx',
  'shell.jsx',
  'pages-dashboard.jsx',
  'api-client.jsx',
  'pages-sessions.jsx',
  'pages-detail.jsx',
  'pages-newrun.jsx',
  'pages-misc.jsx',
  'app.jsx',
];
const missingScripts = expectedScripts.filter((s) => !indexHtml.includes(s));
if (missingScripts.length > 0) {
  console.error('structure-check: index.html is missing script tags for:');
  for (const s of missingScripts) {
    console.error('  - ' + s);
  }
  process.exit(1);
}

const missingScriptFiles = expectedScripts.filter((s) => !existsSync(join(repoRoot, 'project', s)));
if (missingScriptFiles.length > 0) {
  console.error('structure-check: index.html references scripts that are not on disk:');
  for (const s of missingScriptFiles) {
    console.error('  - project/' + s);
  }
  process.exit(1);
}

console.log('structure-check: ok (' + required.length + ' files, ' + expectedEndpoints.length + ' API endpoints, alias intact, ' + expectedScripts.length + ' scripts wired and resolved on disk)');
