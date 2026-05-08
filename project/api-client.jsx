// ============== Admin API transport + typed-like contracts ==============

const API_CLIENT_VERSION = '2026.05.08';
const API_STORAGE_KEY = '__PB_ADMIN_API_CONFIG__';

const PB_ENV = {
  baseUrl: '/api/patent-box',
  token: null,
  timeoutMs: 30000,
  enabled: true,
};

function readQueryValue(name) {
  const params = new URLSearchParams(window.location.search || '');
  return params.get(name);
}

function resolveApiConfig() {
  let baseUrl = readQueryValue('apiBase') || PB_ENV.baseUrl;
  let token = readQueryValue('apiToken') || PB_ENV.token || null;
  const timeoutMs = Number(readQueryValue('apiTimeout') || PB_ENV.timeoutMs);
  let enabled = readQueryValue('apiEnabled') !== '0';

  const fromStorage = (() => {
    try {
      const raw = localStorage.getItem(API_STORAGE_KEY);
      return raw ? JSON.parse(raw) : null;
    } catch {
      return null;
    }
  })();

  if (fromStorage?.baseUrl) {
    baseUrl = fromStorage.baseUrl;
  }
  if (fromStorage?.token) {
    token = fromStorage.token;
  }
  if (fromStorage?.enabled !== undefined) {
    enabled = Boolean(fromStorage.enabled);
  }

  const cleanBase = baseUrl.endsWith('/') ? baseUrl.slice(0, -1) : baseUrl;
  const withVersion = /\/v1($|\/)/.test(cleanBase) ? cleanBase : `${cleanBase}/v1`;

  return {
    baseUrl: withVersion,
    token: token || null,
    timeoutMs: Number.isFinite(timeoutMs) && timeoutMs > 0 ? timeoutMs : PB_ENV.timeoutMs,
    enabled,
  };
}

const TRACKER_API_CONFIG = resolveApiConfig();
window.PB_ADMIN_API_CONFIG = TRACKER_API_CONFIG;

function normalizeHeaders(token) {
  const headers = {
    'Content-Type': 'application/json',
    Accept: 'application/json',
  };
  if (token) {
    headers.Authorization = `Bearer ${token}`;
  }
  return headers;
}

function joinPath(base, path) {
  const cleanBase = base.endsWith('/') ? base.slice(0, -1) : base;
  const cleanPath = path.startsWith('/') ? path.slice(1) : path;
  return `${cleanBase}/${cleanPath}`;
}

function toNumber(value, fallback = 0) {
  const n = Number(value);
  return Number.isFinite(n) ? n : fallback;
}

function parseIso(value) {
  if (!value) {
    return null;
  }
  const d = new Date(value);
  return Number.isNaN(d.getTime()) ? null : d.toISOString();
}

async function safeParseJson(response) {
  const raw = await response.text();
  if (!raw) {
    return {};
  }
  try {
    return JSON.parse(raw);
  } catch {
    return { raw };
  }
}

const ERROR_CODE_ALIAS = {
  invalid_repository: 'validation_failed',
};

function toApiError(response, body) {
  const error = body?.error || {};
  return {
    transportOk: false,
    status: response.status,
    code: ERROR_CODE_ALIAS[error.code] || error.code || `http_${response.status}`,
    message: error.message || `Request failed with status ${response.status}`,
    details: error.details || {},
    raw: body,
  };
}

function envelopePayload(body) {
  if (!body || typeof body !== 'object') {
    return { data: null, meta: null, error: null };
  }
  const data = Object.prototype.hasOwnProperty.call(body, 'data') ? body.data : null;
  const error = Object.prototype.hasOwnProperty.call(body, 'error') ? body.error : null;
  return {
    data: data === undefined ? null : data,
    meta: body.meta || null,
    error: error || null,
  };
}

function mapSessionFromListRow(row) {
  const taxIdentity = row?.tax_identity || {};
  const summary = row?.summary || {};
  const cost = row?.cost || {};
  const period = row?.period || {};
  return {
    id: toNumber(row?.id, 0),
    status: String(row?.status || 'pending'),
    fiscal_year: String(row?.fiscal_year || taxIdentity.fiscal_year || ''),
    denomination: String(row?.denomination || taxIdentity.denomination || ''),
    p_iva: String(row?.p_iva || taxIdentity.p_iva || ''),
    regime: String(row?.regime || taxIdentity.regime || ''),
    period: {
      from: parseIso(period.from) || null,
      to: parseIso(period.to) || null,
    },
    classifier: row?.classifier || { provider: 'regolo', model: 'claude-sonnet-4-6', seed: 0 },
    cost: {
      projected_eur: toNumber(cost?.projected_eur, 0),
      actual_eur: toNumber(cost?.actual_eur, 0),
    },
    summary: {
      commit_count: toNumber(summary?.commit_count, 0),
      qualified_commit_count: toNumber(summary?.qualified_commit_count, 0),
      repository_count: toNumber(summary?.repository_count, 0),
    },
    finished_at: parseIso(row?.finished_at),
    created_at: parseIso(row?.created_at),
    chain: row?.hash_chain_head ? {
      head: String(row.hash_chain_head),
      commit_count: toNumber(summary?.commit_count, 0),
      verified: null,
    } : null,
    repositories: Array.isArray(row?.repositories) ? row.repositories : [],
    dossiers: Array.isArray(row?.dossiers) ? row.dossiers : [],
    tax_identity: {
      fiscal_year: String(row?.fiscal_year || taxIdentity.fiscal_year || ''),
      denomination: String(row?.denomination || taxIdentity.denomination || ''),
      p_iva: String(row?.p_iva || taxIdentity.p_iva || ''),
      regime: String(row?.regime || taxIdentity.regime || ''),
    },
  };
}

function mapSessionFromDetail(payload = {}, fallbackSession) {
  const fallbackTaxIdentity = fallbackSession?.tax_identity || {};
  const payloadTaxIdentity = payload?.tax_identity || {};
  const taxIdentity = {
    fiscal_year: String(payloadTaxIdentity?.fiscal_year || payload?.fiscal_year || fallbackTaxIdentity?.fiscal_year || ''),
    denomination: String(payloadTaxIdentity?.denomination || payload?.denomination || fallbackTaxIdentity?.denomination || ''),
    p_iva: String(payloadTaxIdentity?.p_iva || payload?.p_iva || fallbackTaxIdentity?.p_iva || ''),
    regime: String(payloadTaxIdentity?.regime || payload?.regime || fallbackTaxIdentity?.regime || ''),
  };
  const summary = payload?.summary || fallbackSession?.summary || { commit_count: 0, qualified_commit_count: 0, repository_count: 0 };
  const period = payload?.period || fallbackSession?.period || {};
  return {
    id: toNumber(payload?.id, 0),
    status: String(payload?.status || fallbackSession?.status || 'pending'),
    fiscal_year: String(taxIdentity.fiscal_year || fallbackSession?.fiscal_year || ''),
    denomination: String(taxIdentity.denomination || fallbackSession?.denomination || ''),
    p_iva: String(taxIdentity.p_iva || fallbackSession?.p_iva || ''),
    regime: String(taxIdentity.regime || fallbackSession?.regime || ''),
    period: {
      from: parseIso(period.from) || null,
      to: parseIso(period.to) || null,
    },
    classifier: payload?.classifier || fallbackSession?.classifier || { provider: 'regolo', model: 'claude-sonnet-4-6', seed: 0 },
    cost: {
      projected_eur: toNumber(payload?.cost?.projected_eur, fallbackSession?.cost?.projected_eur || 0),
      actual_eur: toNumber(payload?.cost?.actual_eur, fallbackSession?.cost?.actual_eur || 0),
    },
    summary,
    finished_at: parseIso(payload?.finished_at) || fallbackSession?.finished_at || null,
    created_at: parseIso(payload?.created_at) || fallbackSession?.created_at || null,
    chain: payload?.hash_chain_head ? {
      head: String(payload.hash_chain_head),
      commit_count: toNumber(summary?.commit_count, 0),
      verified: null,
    } : (fallbackSession?.chain || null),
    repositories: Array.isArray(payload?.repositories) ? payload.repositories : (fallbackSession?.repositories || []),
    dossiers: Array.isArray(payload?.dossiers) ? payload.dossiers : (fallbackSession?.dossiers || []),
    tax_identity: taxIdentity,
  };
}

function mapCommitRows(rawRows = []) {
  return rawRows.map((row) => ({
    ...row,
    id: toNumber(row?.id, 0),
    sha: String(row?.sha || ''),
    short_sha: String(row?.short_sha || ''),
    repository_path: String(row?.repository_path || ''),
    repository_role: String(row?.repository_role || ''),
    author_name: String(row?.author_name || ''),
    author_email: String(row?.author_email || ''),
    committed_at: parseIso(row?.committed_at),
    message_subject: String(row?.message_subject || ''),
    files_changed_count: toNumber(row?.files_changed_count, 0),
    insertions: toNumber(row?.insertions, 0),
    deletions: toNumber(row?.deletions, 0),
    phase: String(row?.phase || 'non_qualified'),
    is_rd_qualified: row?.is_rd_qualified == null ? false : Boolean(row.is_rd_qualified),
    rd_qualification_confidence: row?.rd_qualification_confidence == null ? 0 : Number(row.rd_qualification_confidence),
    rationale: String(row?.rationale || ''),
    rejected_phase: row?.rejected_phase || null,
    evidence_used: Array.isArray(row?.evidence_used) ? row.evidence_used : [],
    ai_attribution: String(row?.ai_attribution || 'human'),
    branch_name_canonical: String(row?.branch_name_canonical || ''),
    hash_chain: {
      prev: String(row?.hash_chain?.prev || ''),
      self: String(row?.hash_chain?.self || ''),
    },
  }));
}

function mapEvidenceRows(rawRows = []) {
  return rawRows.map((row) => ({
    ...row,
    id: toNumber(row?.id, 0),
    kind: String(row?.kind || 'design_doc'),
    path: String(row?.path || ''),
    slug: String(row?.slug || ''),
    title: String(row?.title || ''),
    linked_commit_count: toNumber(row?.linked_commit_count, 0),
    first_seen_at: parseIso(row?.first_seen_at),
    last_modified_at: parseIso(row?.last_modified_at),
  }));
}

function mapDossierRows(rawRows = []) {
  return rawRows.map((row) => ({
    id: toNumber(row?.id, 0),
    tracking_session_id: toNumber(row?.tracking_session_id, 0),
    format: String(row?.format || 'json'),
    locale: String(row?.locale || 'it'),
    path: row?.path || null,
    byte_size: row?.byte_size == null ? null : toNumber(row?.byte_size, 0),
    sha256: String(row?.sha256 || ''),
    generated_at: parseIso(row?.generated_at),
  }));
}

function mapIntegrity(payload = {}) {
  return {
    verified: Boolean(payload?.verified),
    head: String(payload?.head || ''),
    commit_count: toNumber(payload?.commit_count, 0),
    first_failure: payload?.first_failure == null ? null : toNumber(payload.first_failure, 0),
  };
}

async function request(path, options = {}) {
  const cfg = TRACKER_API_CONFIG;
  if (!cfg.enabled) {
    return {
      ok: false,
      status: 0,
      latencyMs: 0,
      data: null,
      meta: null,
      error: { transportOk: false, code: 'api_disabled', message: 'API disabled by configuration' },
    };
  }

  const url = joinPath(cfg.baseUrl, path);
  const controller = new AbortController();
  const timeout = setTimeout(() => controller.abort(), cfg.timeoutMs);
  const started = Date.now();
  try {
    const response = await fetch(url, {
      method: options.method || 'GET',
      headers: normalizeHeaders(cfg.token),
      credentials: 'include',
      body: options.body ? JSON.stringify(options.body) : undefined,
      signal: controller.signal,
    });
    const body = await safeParseJson(response);
    const wrapped = envelopePayload(body);
    const latencyMs = Date.now() - started;
    if (!response.ok) {
      return {
        ok: false,
        status: response.status,
        latencyMs,
        data: null,
        meta: wrapped.meta,
        error: toApiError(response, body),
      };
    }
    return {
      ok: true,
      status: response.status,
      latencyMs,
      data: wrapped.data,
      meta: wrapped.meta,
      error: null,
      raw: body?.raw,
    };
  } catch (err) {
    const latencyMs = Date.now() - started;
    if (err && err.name === 'AbortError') {
      return {
        ok: false,
        status: 0,
        latencyMs,
        data: null,
        meta: null,
        error: { transportOk: false, code: 'timeout', message: `Request timeout (${cfg.timeoutMs}ms)` },
      };
    }
    return {
      ok: false,
      status: 0,
      latencyMs,
      data: null,
      meta: null,
      error: {
        transportOk: false,
        code: 'network',
        message: err?.message || 'Network error',
      },
    };
  } finally {
    clearTimeout(timeout);
  }
}

function buildQuery(params = {}) {
  const query = new URLSearchParams();
  Object.entries(params).forEach(([k, v]) => {
    if (v == null || v === '') {
      return;
    }
    if (Array.isArray(v)) {
      query.set(k, v.join(','));
      return;
    }
    if (typeof v === 'number' && Number.isNaN(v)) {
      return;
    }
    query.set(k, String(v));
  });
  return query.toString();
}

const TrackerApi = {
  config: TRACKER_API_CONFIG,
  healthEndpoint: '/health',
  async getHealth() {
    return request('/health');
  },
  async getCapabilities() {
    return request('/capabilities');
  },
  async listSessions(params = {}) {
    const qs = buildQuery(params);
    return request(`/tracking-sessions${qs ? `?${qs}` : ''}`);
  },
  async getSession(sessionId) {
    const id = Number(sessionId);
    if (!Number.isFinite(id) || id <= 0) {
      return { ok: false, status: 0, error: { code: 'validation_failed', message: 'Invalid session id' } };
    }
    return request(`/tracking-sessions/${id}`);
  },
  async getSessionCommits(sessionId, params = {}) {
    const id = Number(sessionId);
    const qs = buildQuery(params);
    return request(`/tracking-sessions/${id}/commits${qs ? `?${qs}` : ''}`);
  },
  async getSessionEvidence(sessionId, params = {}) {
    const id = Number(sessionId);
    const qs = buildQuery(params);
    return request(`/tracking-sessions/${id}/evidence${qs ? `?${qs}` : ''}`);
  },
  async getSessionDossiers(sessionId, params = {}) {
    const id = Number(sessionId);
    const qs = buildQuery(params);
    return request(`/tracking-sessions/${id}/dossiers${qs ? `?${qs}` : ''}`);
  },
  async renderDossier(sessionId, payload) {
    const id = Number(sessionId);
    return request(`/tracking-sessions/${id}/dossiers`, {
      method: 'POST',
      body: payload,
    });
  },
  async createSession(payload) {
    return request('/tracking-sessions', {
      method: 'POST',
      body: payload,
    });
  },
  async dryRun(payload) {
    return request('/tracking-sessions/dry-run', {
      method: 'POST',
      body: payload,
    });
  },
  async validateRepository(payload) {
    return request('/repositories/validate', {
      method: 'POST',
      body: payload,
    });
  },
  async verifySessionIntegrity(sessionId) {
    const id = Number(sessionId);
    return request(`/tracking-sessions/${id}/integrity`);
  },
  async getDossier(sessionId, dossierId) {
    const sid = Number(sessionId);
    const did = Number(dossierId);
    return request(`/tracking-sessions/${sid}/dossiers/${did}`);
  },
  downloadUrl(sessionId, dossierId) {
    return joinPath(TRACKER_API_CONFIG.baseUrl, `/tracking-sessions/${Number(sessionId)}/dossiers/${Number(dossierId)}/download`);
  },
  normalize: {
    sessionFromList: mapSessionFromListRow,
    sessionFromDetail: mapSessionFromDetail,
    commits: mapCommitRows,
    evidence: mapEvidenceRows,
    dossiers: mapDossierRows,
    integrity: mapIntegrity,
  },
};

window.TrackerApi = TrackerApi;
window.PB_ADMIN_API_CLIENT_VERSION = API_CLIENT_VERSION;
