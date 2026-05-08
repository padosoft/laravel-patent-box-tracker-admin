// ============== Patent Box admin — fixtures + helpers ==============

const PB = {};

// Phase metadata
PB.PHASES = [
  { key: 'research',       label: 'Research' },
  { key: 'design',         label: 'Design' },
  { key: 'implementation', label: 'Implementation' },
  { key: 'validation',     label: 'Validation' },
  { key: 'documentation',  label: 'Documentation' },
  { key: 'non_qualified',  label: 'Non-qualified' },
];
PB.AI_KINDS = [
  { key: 'human',       label: 'Human' },
  { key: 'ai_assisted', label: 'AI-assisted' },
  { key: 'ai_authored', label: 'AI-authored' },
];

// Capabilities (mirrors GET /v1/capabilities)
PB.CAPABILITIES = {
  package: { name: 'padosoft/laravel-patent-box-tracker', api_version: 'v1' },
  roles: ['primary_ip', 'support', 'meta_self'],
  regimes: ['documentazione_idonea', 'non_documentazione'],
  render_formats: ['pdf', 'json'],
  locales: ['it'],
  classifier: {
    provider: 'regolo',
    model: 'claude-sonnet-4-6',
    seed: 3235823838,
    batch_size: 20,
    cost_cap_eur_per_run: 50,
  },
  renderer: { driver: 'browsershot', available_drivers: ['browsershot', 'dompdf'] },
};

// Sessions fixture
PB.SESSIONS = [
  {
    id: 1042,
    status: 'classified',
    fiscal_year: '2026',
    denomination: 'Padosoft S.r.l.',
    p_iva: '01234560000',
    regime: 'documentazione_idonea',
    period: { from: '2026-01-01', to: '2026-12-31' },
    classifier: { provider: 'regolo', model: 'claude-sonnet-4-6', seed: 3235823838 },
    cost: { projected_eur: 12.4800, actual_eur: 12.3920 },
    summary: { commit_count: 312, qualified_commit_count: 184, repository_count: 2 },
    finished_at: '2026-05-07T11:33:00Z',
    created_at: '2026-05-07T11:20:00Z',
    chain: { verified: true, head: '8f3a91c7e2bb40e5b6d2c08af79e1c4b9a7d5f4e2c8a9b1d0e7f3a4c5b6d8e9f', commit_count: 312 },
  },
  {
    id: 1041,
    status: 'rendered',
    fiscal_year: '2026',
    denomination: 'Acme Software',
    p_iva: '04567891234',
    regime: 'documentazione_idonea',
    period: { from: '2025-01-01', to: '2025-12-31' },
    classifier: { provider: 'regolo', model: 'claude-sonnet-4-6', seed: 1287943210 },
    cost: { projected_eur: 28.5400, actual_eur: 27.9810 },
    summary: { commit_count: 718, qualified_commit_count: 401, repository_count: 4 },
    finished_at: '2026-05-07T09:14:00Z',
    created_at: '2026-05-07T08:42:00Z',
    chain: { verified: true, head: 'a1b2c3d4e5f60718293a4b5c6d7e8f901a2b3c4d5e6f70819a2b3c4d5e6f7081', commit_count: 718 },
  },
  {
    id: 1040,
    status: 'running',
    fiscal_year: '2026',
    denomination: 'Padosoft S.r.l.',
    p_iva: '01234560000',
    regime: 'documentazione_idonea',
    period: { from: '2024-01-01', to: '2024-12-31' },
    classifier: { provider: 'regolo', model: 'claude-sonnet-4-6', seed: 9923847121 },
    cost: { projected_eur: 9.8800, actual_eur: 6.4400 },
    summary: { commit_count: 247, qualified_commit_count: 0, repository_count: 1 },
    finished_at: null,
    created_at: '2026-05-07T11:42:00Z',
    chain: null,
  },
  {
    id: 1039,
    status: 'failed',
    fiscal_year: '2025',
    denomination: 'NorthForge Labs',
    p_iva: '09876543210',
    regime: 'non_documentazione',
    period: { from: '2025-01-01', to: '2025-12-31' },
    classifier: { provider: 'regolo', model: 'claude-sonnet-4-6', seed: 4444471234 },
    cost: { projected_eur: 18.2100, actual_eur: 7.4012 },
    summary: { commit_count: 412, qualified_commit_count: 0, repository_count: 3 },
    finished_at: '2026-05-06T22:18:00Z',
    created_at: '2026-05-06T22:01:00Z',
    chain: { verified: false, head: '00000000000000000000000000000000', commit_count: 0 },
  },
  {
    id: 1038,
    status: 'classified',
    fiscal_year: '2025',
    denomination: 'Padosoft S.r.l.',
    p_iva: '01234560000',
    regime: 'documentazione_idonea',
    period: { from: '2025-01-01', to: '2025-12-31' },
    classifier: { provider: 'regolo', model: 'claude-sonnet-4-6', seed: 3235823838 },
    cost: { projected_eur: 22.1100, actual_eur: 21.8870 },
    summary: { commit_count: 564, qualified_commit_count: 312, repository_count: 3 },
    finished_at: '2026-05-06T17:02:00Z',
    created_at: '2026-05-06T16:30:00Z',
    chain: { verified: true, head: 'fedcba9876543210fedcba9876543210fedcba9876543210fedcba9876543210', commit_count: 564 },
  },
  {
    id: 1037,
    status: 'pending',
    fiscal_year: '2026',
    denomination: 'Vesper Systems',
    p_iva: '11122233344',
    regime: 'documentazione_idonea',
    period: { from: '2026-01-01', to: '2026-06-30' },
    classifier: { provider: 'regolo', model: 'claude-sonnet-4-6', seed: 7777771234 },
    cost: { projected_eur: 5.4400, actual_eur: 0 },
    summary: { commit_count: 136, qualified_commit_count: 0, repository_count: 1 },
    finished_at: null,
    created_at: '2026-05-07T11:58:00Z',
    chain: null,
  },
  {
    id: 1036,
    status: 'rendered',
    fiscal_year: '2024',
    denomination: 'Acme Software',
    p_iva: '04567891234',
    regime: 'documentazione_idonea',
    period: { from: '2024-01-01', to: '2024-12-31' },
    classifier: { provider: 'regolo', model: 'claude-sonnet-4-6', seed: 1234567890 },
    cost: { projected_eur: 31.7700, actual_eur: 31.2150 },
    summary: { commit_count: 891, qualified_commit_count: 502, repository_count: 5 },
    finished_at: '2026-05-05T14:44:00Z',
    created_at: '2026-05-05T13:50:00Z',
    chain: { verified: true, head: '11223344556677889900aabbccddeeff11223344556677889900aabbccddeeff', commit_count: 891 },
  },
];

// Phase breakdown for the active session (1042) — counts that sum to 312
PB.PHASE_BREAKDOWN_1042 = [
  { phase: 'research',       count: 38,  qualified: 38 },
  { phase: 'design',         count: 47,  qualified: 47 },
  { phase: 'implementation', count: 78,  qualified: 78 },
  { phase: 'validation',     count: 21,  qualified: 21 },
  { phase: 'documentation',  count: 0,   qualified: 0 },
  { phase: 'non_qualified',  count: 128, qualified: 0 },
];

PB.AI_BREAKDOWN_1042 = [
  { kind: 'human',       count: 142, pct: 45.5 },
  { kind: 'ai_assisted', count: 121, pct: 38.8 },
  { kind: 'ai_authored', count: 49,  pct: 15.7 },
];

// Repos for session 1042
PB.REPOS_1042 = [
  { path: '/repos/main-ip',     role: 'primary_ip', commit_count: 247, qualified: 158 },
  { path: '/repos/support-lib', role: 'support',    commit_count:  65, qualified:  26 },
];

// Commits — synthesized
PB.COMMIT_AUTHORS = [
  { name: 'Lorenzo Padovani', email: 'lorenzo.padovani@padosoft.com' },
  { name: 'Sara Bonetti',     email: 'sara.bonetti@padosoft.com' },
  { name: 'Marco Rossi',      email: 'marco.rossi@padosoft.com' },
  { name: 'Elena Conti',      email: 'elena.conti@padosoft.com' },
  { name: 'Andrea Vitale',    email: 'andrea.vitale@padosoft.com' },
  { name: 'Giulia Ferrari',   email: 'giulia.ferrari@padosoft.com' },
];

PB.COMMIT_SUBJECTS = [
  { phase: 'implementation', subj: 'Implement deterministic classifier batcher' },
  { phase: 'implementation', subj: 'Add cost projection action with cap enforcement' },
  { phase: 'implementation', subj: 'Wire CrossRepoTrackingAction to evidence collector' },
  { phase: 'design',         subj: 'Design hash-chain verification protocol' },
  { phase: 'design',         subj: 'Sketch dossier renderer driver interface' },
  { phase: 'research',       subj: 'Investigate UIBM patent slug resolver' },
  { phase: 'research',       subj: 'Spike: Browsershot vs DomPDF for IT compliance' },
  { phase: 'validation',     subj: 'Add golden-set assertions for classifier seed' },
  { phase: 'validation',     subj: 'Verify chain head against fixture session' },
  { phase: 'documentation',  subj: 'Document API opt-in flag and middleware stack' },
  { phase: 'non_qualified',  subj: 'Bump dev dependencies; lockfile sync' },
  { phase: 'non_qualified',  subj: 'Fix typo in README example' },
  { phase: 'non_qualified',  subj: 'CI: switch runner to ubuntu-24.04' },
  { phase: 'implementation', subj: 'Refactor RepositoryEvidenceCollector signature' },
  { phase: 'implementation', subj: 'Add JSON dossier payload assembler test fixtures' },
];

const _hex = (n) => 'abcdef0123456789'.split('').sort(() => Math.random() - 0.5).slice(0, 1).join('') + Math.random().toString(16).slice(2, 1 + n);
function makeSha(seed) {
  let h = '';
  let s = seed;
  for (let i = 0; i < 40; i++) {
    s = (s * 9301 + 49297) % 233280;
    h += '0123456789abcdef'[Math.floor((s / 233280) * 16)];
  }
  return h;
}

PB.COMMITS = (() => {
  const out = [];
  for (let i = 0; i < 36; i++) {
    const subj = PB.COMMIT_SUBJECTS[i % PB.COMMIT_SUBJECTS.length];
    const author = PB.COMMIT_AUTHORS[i % PB.COMMIT_AUTHORS.length];
    const sha = makeSha(1042 * 1000 + i);
    const prev = i > 0 ? makeSha(1042 * 1000 + i - 1) : '0000000000000000000000000000000000000000000000000000000000000000';
    const isRd = subj.phase !== 'non_qualified';
    const conf = isRd ? (0.65 + ((i * 7) % 35) / 100) : (0.05 + ((i * 11) % 30) / 100);
    const ai = i % 5 === 0 ? 'ai_authored' : (i % 2 === 0 ? 'ai_assisted' : 'human');
    const repo = i % 4 === 0 ? '/repos/support-lib' : '/repos/main-ip';
    const role = repo === '/repos/main-ip' ? 'primary_ip' : 'support';
    const evidenceRefs = subj.phase === 'research' ? ['plan:RFC-12'] :
                         subj.phase === 'design' ? ['plan:PLAN-W4', 'spec:DOSSIER-V1'] :
                         subj.phase === 'implementation' ? ['plan:PLAN-W4', 'issue:#241'] :
                         subj.phase === 'validation' ? ['plan:GOLDEN-SET'] :
                         subj.phase === 'documentation' ? ['readme:API.md'] : [];
    out.push({
      id: 9000 + i,
      sha,
      short_sha: sha.slice(0, 7),
      repository_path: repo,
      repository_role: role,
      author_name: author.name,
      author_email: author.email,
      committed_at: new Date(Date.UTC(2026, 3, 1 + (i % 30), 8 + (i % 10), (i * 7) % 60)).toISOString(),
      message_subject: subj.subj,
      files_changed_count: 2 + (i % 14),
      insertions: 18 + ((i * 23) % 380),
      deletions: 4 + ((i * 13) % 90),
      phase: subj.phase,
      is_rd_qualified: isRd,
      rd_qualification_confidence: Math.round(conf * 100) / 100,
      rationale: isRd
        ? 'Implements core R&D capability per plan:PLAN-W4. Introduces deterministic batching with seed-bound shuffling required for reproducible classifier output.'
        : 'No design or implementation novelty; routine maintenance change with no R&D claim against the eligible activities catalogue.',
      rejected_phase: isRd ? null : (i % 3 === 0 ? 'implementation' : null),
      evidence_used: evidenceRefs,
      ai_attribution: ai,
      branch_name_canonical: i % 3 === 0 ? 'feature/w4' : i % 3 === 1 ? 'main' : 'fix/cost-cap',
      hash_chain: { prev, self: sha },
    });
  }
  return out;
})();

PB.EVIDENCE = [
  { id: 44, kind: 'design_doc',   path: 'docs/PLAN-W4.md',         slug: 'plan:PLAN-W4',     title: 'Patent Box W4 Implementation Plan',          first_seen_at: '2026-02-01T00:00:00Z', last_modified_at: '2026-04-01T00:00:00Z', linked_commit_count: 18 },
  { id: 45, kind: 'design_doc',   path: 'docs/RFC-12.md',          slug: 'plan:RFC-12',      title: 'RFC-12: Hash chain verification',            first_seen_at: '2026-01-12T00:00:00Z', last_modified_at: '2026-03-04T00:00:00Z', linked_commit_count: 7 },
  { id: 46, kind: 'spec',         path: 'docs/DOSSIER-V1.yaml',    slug: 'spec:DOSSIER-V1',  title: 'Dossier renderer driver spec v1',            first_seen_at: '2026-02-08T00:00:00Z', last_modified_at: '2026-04-22T00:00:00Z', linked_commit_count: 12 },
  { id: 47, kind: 'design_doc',   path: 'docs/GOLDEN-SET.md',      slug: 'plan:GOLDEN-SET',  title: 'Golden set evaluation protocol',             first_seen_at: '2026-01-22T00:00:00Z', last_modified_at: '2026-04-02T00:00:00Z', linked_commit_count: 6 },
  { id: 48, kind: 'issue',        path: '.github/issues/241.md',   slug: 'issue:#241',       title: 'Cost cap should reject before classifier call', first_seen_at: '2026-02-16T00:00:00Z', last_modified_at: '2026-02-19T00:00:00Z', linked_commit_count: 4 },
  { id: 49, kind: 'readme',       path: 'docs/API.md',             slug: 'readme:API.md',    title: 'API opt-in & middleware reference',          first_seen_at: '2026-03-01T00:00:00Z', last_modified_at: '2026-04-30T00:00:00Z', linked_commit_count: 3 },
  { id: 50, kind: 'changelog',    path: 'CHANGELOG.md',            slug: 'changelog:CL',     title: 'Project changelog',                          first_seen_at: '2025-09-01T00:00:00Z', last_modified_at: '2026-05-02T00:00:00Z', linked_commit_count: 22 },
];

PB.DOSSIERS_1042 = [
  { id: 55, format: 'pdf',  locale: 'it', path: 'storage/dossiers/1042.pdf',  byte_size: 482311, sha256: 'a3f8e1b2c4d5670819ab3c4d5e6f70819ab3c4d5e6f70819ab3c4d5e6f70819a', generated_at: '2026-05-07T11:40:00Z' },
  { id: 56, format: 'json', locale: 'it', path: 'storage/dossiers/1042.json', byte_size:  91240, sha256: 'b71429f8e1c2d3a4b5c6d7e8f90112233445566778899aabbccddeeff0011223', generated_at: '2026-05-07T11:40:00Z' },
];

PB.PIPELINE_1042 = [
  { key: 'pending',    label: 'Pending',    state: 'done',    ts: '2026-05-07T11:20:00Z' },
  { key: 'running',    label: 'Running',    state: 'done',    ts: '2026-05-07T11:21:14Z' },
  { key: 'classified', label: 'Classified', state: 'current', ts: '2026-05-07T11:33:00Z' },
  { key: 'rendered',   label: 'Rendered',   state: 'pending', ts: null },
  { key: 'failed',     label: 'Failed',     state: 'pending', ts: null },
];

// Format helpers
PB.fmtEur = (n) => '€' + (n || 0).toFixed(2);
PB.fmtPct = (n) => (n * 100).toFixed(0) + '%';
PB.fmtBytes = (b) => {
  if (b < 1024) return b + ' B';
  if (b < 1024*1024) return (b/1024).toFixed(1) + ' KB';
  return (b/1024/1024).toFixed(2) + ' MB';
};
PB.maskPiva = (s) => s.length > 4 ? '••••••' + s.slice(-4) : s;
PB.fmtDt = (iso) => iso ? new Date(iso).toISOString().replace('T',' ').slice(0,16) + 'Z' : '—';
PB.shortSha = (s) => s ? s.slice(0,7) : '—';
PB.headDigest = (s) => s ? s.slice(0,16) + '…' + s.slice(-6) : '—';

PB.statusLabel = (s) => ({
  pending: 'Pending', running: 'Running', classified: 'Classified',
  rendered: 'Rendered', failed: 'Failed',
}[s] || s);
PB.statusBadge = (s) => ({
  pending: 'pending', running: 'running', classified: 'success',
  rendered: 'success', failed: 'failed',
}[s] || 'pending');

// === Aliases & cross-session aggregates ===

PB.DOSSIERS = [
  ...PB.DOSSIERS_1042.map(d => ({ ...d, session_id: 1042 })),
  { id: 53, session_id: 1041, format: 'pdf',  locale: 'it', byte_size: 612883, sha256: '7c1a9b8e2d4f6011223344556677889900aabbccddeeff00112233445566778', generated_at: '2026-05-07T09:18:00Z' },
  { id: 54, session_id: 1041, format: 'json', locale: 'it', byte_size: 142810, sha256: '5f6e7d8c9b0a112233445566778899aabbccddeeff00112233445566778899aa', generated_at: '2026-05-07T09:18:00Z' },
  { id: 51, session_id: 1038, format: 'pdf',  locale: 'it', byte_size: 521442, sha256: '9988776655443322110099887766554433221100ffeeddccbbaa998877665544', generated_at: '2026-05-06T17:08:00Z' },
  { id: 52, session_id: 1038, format: 'json', locale: 'it', byte_size: 102330, sha256: '11ff22ee33dd44cc55bb66aa778899001122334455667788991122334455aabb', generated_at: '2026-05-06T17:08:00Z' },
  { id: 49, session_id: 1036, format: 'pdf',  locale: 'it', byte_size: 781020, sha256: 'ddeeff00112233445566778899aabbccddeeff00112233445566778899aabbcc', generated_at: '2026-05-05T14:50:00Z' },
];

// Total phase breakdown (across all sessions)
PB.PHASE_BREAKDOWN_TOTAL = [
  { phase: 'research',       count:  254 },
  { phase: 'design',         count:  391 },
  { phase: 'implementation', count:  742 },
  { phase: 'validation',     count:  188 },
  { phase: 'documentation',  count:   86 },
  { phase: 'non_qualified',  count: 1018 },
];
PB.AI_BREAKDOWN_TOTAL = [
  { kind: 'human',       count: 1284, pct: 47.0 },
  { kind: 'ai_assisted', count: 1042, pct: 38.2 },
  { kind: 'ai_authored', count:  404, pct: 14.8 },
];

// Ledger chain (audit page)
PB.LEDGER_CHAIN = (() => {
  const out = [];
  let prev = '0000000000000000000000000000000000000000000000000000000000000000';
  for (let i = 0; i < 9; i++) {
    const self = makeSha(33000 + i);
    const ts = new Date(Date.UTC(2026, 4, 1 + (i % 7), 9 + i, (i*13) % 60)).toISOString();
    out.push({ block: 8000 + i, prev, self, ts });
    prev = self;
  }
  return out;
})();

// Aggregate KPIs by FY
PB.computeKpis = (fy) => {
  const sessions = fy === 'all' ? PB.SESSIONS : PB.SESSIONS.filter(s => s.fiscal_year === fy);
  const sum = (k1, k2) => sessions.reduce((a, s) => a + (s[k1] ? s[k1][k2] || 0 : 0), 0);
  const commits = sum('summary', 'commit_count');
  const qualified = sum('summary', 'qualified_commit_count');
  const projected = sum('cost', 'projected_eur');
  const actual = sum('cost', 'actual_eur');
  const aiCount = PB.AI_BREAKDOWN_TOTAL.filter(d => d.kind !== 'human').reduce((a,d) => a+d.count, 0);
  const aiPct = (aiCount / PB.AI_BREAKDOWN_TOTAL.reduce((a,d) => a+d.count, 0) * 100).toFixed(1);
  const dossiers = PB.DOSSIERS.filter(d => sessions.find(s => s.id === d.session_id)).length;
  const years = new Set(sessions.map(s => s.fiscal_year)).size;
  return {
    sessions: sessions.length,
    commits, qualified,
    qualifiedPct: commits ? (qualified/commits*100).toFixed(1) : '0',
    projected, actual,
    aiPct,
    dossiers,
    years,
  };
};

window.PB = PB;
