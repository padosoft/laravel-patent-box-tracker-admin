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
const expectedEndpoints = [
  '/health',
  '/capabilities',
  '/repositories/validate',
  '/tracking-sessions/dry-run',
  '/tracking-sessions',
  '/integrity',
  '/dossiers',
];
const missingEndpoints = expectedEndpoints.filter((ep) => !apiClient.includes(ep));
if (missingEndpoints.length > 0) {
  console.error('structure-check: api-client.jsx is missing references to:');
  for (const ep of missingEndpoints) {
    console.error('  - ' + ep);
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

console.log('structure-check: ok (' + required.length + ' files, ' + expectedEndpoints.length + ' API endpoints, alias intact, ' + expectedScripts.length + ' scripts wired)');
