// ============== Session Detail page ==============

function PageDetail({ sessionId, onNavigate, live }) {
  const toast = useToast();
  const [tab, setTab] = React.useState('commits');
  const [drawerCommit, setDrawerCommit] = React.useState(null);
  const [drawerDossier, setDrawerDossier] = React.useState(null);
  const [drawerDossierLoading, setDrawerDossierLoading] = React.useState(false);
  // Tracks the most recent onOpenDossier request so concurrent calls do not
  // race to clear the loading state for the wrong request.
  const dossierReqRef = React.useRef(0);
  const [integrity, setIntegrity] = React.useState(null);
  const [integrityLoading, setIntegrityLoading] = React.useState(false);
  const [renderingFormat, setRenderingFormat] = React.useState('json');

  const baseSession = PB.SESSIONS.find((s) => s.id === sessionId) || PB.SESSIONS[0] || {};
  const liveSession = live?.session || null;

  const session = {
    ...baseSession,
    ...(liveSession || {}),
    tax_identity: liveSession?.tax_identity || baseSession?.tax_identity || {},
    period: liveSession?.period || baseSession?.period || {},
    classifier: liveSession?.classifier || baseSession?.classifier || {},
    cost: liveSession?.cost || baseSession?.cost || {},
    summary: liveSession?.summary || baseSession?.summary || {},
    chain: liveSession?.chain || baseSession?.chain || null,
  };

  const repos = Array.isArray(live?.repositories) && live.repositories.length ? live.repositories : (baseSession.repositories || PB.REPOS_1042 || []);
  const commits = Array.isArray(live?.commits) ? live.commits : PB.COMMITS;
  const evidence = Array.isArray(live?.evidence) ? live.evidence : PB.EVIDENCE;
  const dossiers = Array.isArray(live?.dossiers) ? live.dossiers : PB.DOSSIERS_1042;
  const phaseBreakdown = Array.isArray(live?.phaseBreakdown) && live.phaseBreakdown.length ? live.phaseBreakdown : PB.PHASE_BREAKDOWN_1042;
  const aiBreakdown = Array.isArray(live?.aiBreakdown) && live.aiBreakdown.length ? live.aiBreakdown : PB.AI_BREAKDOWN_1042;

  const ratio = session.summary?.commit_count ? session.summary.qualified_commit_count / session.summary.commit_count : 0;

  const pipelineFor = (status) => {
    const order = ['pending', 'running', 'classified', 'rendered', 'failed'];
    const idx = order.indexOf(status);
    return order.map((k, i) => {
      const done = i < idx;
      const current = i === idx && status !== 'failed';
      return {
        key: k,
        label: k.charAt(0).toUpperCase() + k.slice(1),
        state: status === 'failed' && k === 'failed' ? 'current' : (done ? 'done' : current ? 'current' : 'pending'),
        ts: i <= idx ? new Date(session.created_at || Date.now()).toISOString() : null,
      };
    });
  };

  const pipeline = pipelineFor(session.status || 'pending');

  const onRenderDossier = async (format) => {
    if (typeof TrackerApi === 'undefined') {
      toast.push({ kind: 'error', title: 'API non disponibile', body: 'Tracker API client non caricato.' });
      return;
    }

    const response = await TrackerApi.renderDossier(sessionId, { format, locale: 'it' });
    if (!response.ok) {
      toast.push({
        kind: 'error',
        title: 'Render error',
        body: response.error?.message || 'Unable to queue render job.',
      });
      return;
    }

    toast.push({
      kind: 'ok',
      title: 'Render queued',
      body: `${format.toUpperCase()} render queued for session #${sessionId}`,
    });
  };

  // Macro 6.4a — Verify hash-chain integrity for the current session by
  // calling GET /v1/tracking-sessions/{id}/integrity. The result is shown
  // both as a toast (immediate feedback) and as a small badge persisted in
  // local state so the operator can scan the latest verification at a glance
  // without re-clicking.
  const onVerifyIntegrity = async () => {
    if (typeof TrackerApi === 'undefined') {
      toast.push({ kind: 'error', title: 'API non disponibile', body: 'Tracker API client non caricato.' });
      return;
    }
    setIntegrityLoading(true);
    try {
      const response = await TrackerApi.verifySessionIntegrity(sessionId);
      if (!response.ok) {
        toast.push({
          kind: 'error',
          title: 'Integrity error',
          body: response.error?.message || `Verification request failed (${response.status})`,
        });
        setIntegrity({ ok: false, message: response.error?.message || 'request failed', verified_at: new Date().toISOString() });
        return;
      }
      const payload = TrackerApi.normalize.integrity(response.data || {});
      setIntegrity({
        ok: payload.verified === true,
        verified: payload.verified === true,
        head: payload.head,
        commit_count: payload.commit_count,
        first_failure: payload.first_failure,
        verified_at: new Date().toISOString(),
      });
      if (payload.verified) {
        toast.push({
          kind: 'ok',
          title: 'Hash chain verified',
          body: `head ${String(payload.head || '').slice(0, 12)} · ${payload.commit_count} commits`,
        });
      } else {
        toast.push({
          kind: 'error',
          title: 'Hash chain broken',
          body: payload.first_failure != null
            ? `First failure at row ${payload.first_failure} — dossier integrity compromised`
            : 'Verification failed — see API response for details',
        });
      }
    } finally {
      setIntegrityLoading(false);
    }
  };

  // Macro 6.4b — Open the per-dossier detail drawer. Calls GET
  // /v1/tracking-sessions/{id}/dossiers/{dossierId} and surfaces the full
  // metadata (sha256, byte_size, generated_at, format, locale, path) plus
  // a one-click download. Falls back to the row data if the API is not
  // configured (offline demo).
  const onOpenDossier = async (row) => {
    if (typeof TrackerApi === 'undefined' || !TrackerApi.config?.enabled) {
      setDrawerDossier({ ...row });
      return;
    }
    // Track which dossier id was requested so that a stale async response
    // arriving after the drawer was closed or a different row clicked does
    // not overwrite the current state. We use a closure-captured id for
    // the comparison instead of ref-based tracking to keep the JSX portable.
    const reqId = ++dossierReqRef.current;
    setDrawerDossier({ ...row, _stale: true });
    setDrawerDossierLoading(true);
    try {
      const response = await TrackerApi.getDossier(sessionId, row.id);
      // Guard: skip stale update if the user closed the drawer or opened a
      // different dossier while this request was in-flight.
      setDrawerDossier((current) => {
        if (!current || current.id !== row.id) return current;
        if (!response.ok) {
          toast.push({
            kind: 'error',
            title: 'Dossier load error',
            body: response.error?.message || 'Unable to load dossier detail.',
          });
          return { ...row };
        }
        const fresh = TrackerApi.normalize.dossiers([response.data || {}])[0] || row;
        return { ...row, ...fresh };
      });
    } finally {
      // Only clear the loading flag for the request that triggered it.
      if (dossierReqRef.current === reqId) {
        setDrawerDossierLoading(false);
      }
    }
  };

  return (
    <div className="page wide" data-screen-label={`Session ${sessionId}`}>
      <div className="page-head">
        <div>
          <h1 className="page-title with-id">
            {session.denomination || 'Patent Box session'}
            <span className="id">#{session.id || sessionId}</span>
            <StatusBadgePB status={session.status || 'pending'} />
          </h1>
          <p className="page-sub">FY {session.fiscal_year || '-'} · {session.period?.from || '-'} → {session.period?.to || '-'} · {session.regime || '-'}</p>
        </div>
        <div className="page-actions">
          <button className="btn" onClick={() => window.location.reload()}><I.Refresh size={13} /> Refresh</button>
          <button
            className="btn"
            onClick={onVerifyIntegrity}
            disabled={integrityLoading}
            title="Calls GET /v1/tracking-sessions/{id}/integrity"
          >
            <I.Check size={13} /> {integrityLoading ? 'Verifying…' : 'Verify integrity'}
          </button>
          <button className="btn" onClick={() => onRenderDossier('json')}><I.External size={13} /> Render JSON</button>
          <button className="btn pb-primary" onClick={() => onRenderDossier('pdf')}><I.Send size={13} /> Render PDF</button>
        </div>
      </div>

      <div className="card">
        <div className="card-body" style={{ padding: '4px 16px 8px' }}>
          <PipelineTimeline steps={pipeline} />
        </div>
      </div>

      <div style={{ marginTop: 16 }}>
        <MetricRail items={[
          { label: 'Commits', value: (session.summary?.commit_count || 0).toLocaleString(), sub: `${session.summary?.repository_count || 0} repositories` },
          { label: 'R&D qualified', value: (session.summary?.qualified_commit_count || 0).toLocaleString(), sub: (ratio * 100).toFixed(1) + '% of total' },
          { label: 'Projected cost', value: PB.fmtEur(session.cost?.projected_eur || 0), sub: 'cap €' + PB.CAPABILITIES.classifier.cost_cap_eur_per_run + '/run' },
          { label: 'Actual cost', value: PB.fmtEur(session.cost?.actual_eur || 0), sub: `${session.classifier?.provider || 'provider'} · ${session.classifier?.model || '-'}` },
          { label: 'Classifier seed', value: String(session.classifier?.seed || '').slice(0, 7) || 'auto', sub: 'deterministic · v1' },
          { label: 'Started', value: PB.fmtDt(session.created_at).slice(11), sub: PB.fmtDt(session.created_at).slice(0, 10) },
        ]} />
      </div>

      {integrity && (
        <div className={`card`} style={{ marginTop: 12, borderColor: integrity.verified ? 'var(--status-success)' : 'var(--status-failed)' }}>
          <div className="card-body" style={{ padding: '8px 14px', display: 'flex', alignItems: 'center', gap: 10, fontSize: 12 }}>
            {integrity.verified ? <I.Check size={14} /> : <I.X size={14} />}
            <strong style={{ fontWeight: 500 }}>
              {integrity.verified ? 'Hash chain verified' : 'Hash chain broken'}
            </strong>
            {integrity.verified ? (
              <>
                <span className="mono" style={{ fontSize: 11.5 }}>head {String(integrity.head || '').slice(0, 16) || '—'}</span>
                <span className="muted" style={{ fontSize: 11.5 }}>· {integrity.commit_count || 0} commits</span>
              </>
            ) : (
              <span className="muted" style={{ fontSize: 11.5 }}>
                {integrity.first_failure != null
                  ? `first failure at row ${integrity.first_failure}`
                  : (integrity.message || 'verification failed')}
              </span>
            )}
            <span style={{ flex: 1 }} />
            <span className="muted" style={{ fontSize: 11 }}>verified at {PB.fmtDt(integrity.verified_at)}</span>
          </div>
        </div>
      )}

      <div style={{ display: 'grid', gridTemplateColumns: '1.2fr 1fr', gap: 16, marginTop: 16 }}>
        <HashChainStrip chain={session.chain} />
        <div className="card" style={{ margin: 0 }}>
          <div className="card-head" style={{ padding: '8px 14px' }}>
            <h3 className="card-title">Repositories</h3>
            <span className="badge outline">{repos.length}</span>
          </div>
          <div className="card-body flush">
            {repos.map((r, i) => {
              const denominator = r.commit_count || 0;
              const numerator = r.qualified || 0;
              const quality = denominator ? (numerator / denominator) : 0;
              return (
                <div key={`${r.path}-${i}`} className="repo-line">
                  <span className={`role-tag ${r.role}`}>{r.role ? r.role.replace('_', ' ') : '-'}</span>
                  <span className="mono" style={{ fontSize: 12 }}>{r.path}</span>
                  <span className="mono muted" style={{ fontSize: 11.5 }}>{numerator}/{denominator} qualified</span>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                    <span className="ratio-bar"><span className="fill" style={{ width: (quality * 100) + '%' }} /></span>
                    <span className="mono" style={{ fontSize: 11.5, minWidth: 30, textAlign: 'right' }}>{numerator}</span>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: '1.1fr 0.9fr', gap: 16, marginTop: 16 }}>
        <div className="card">
          <div className="card-head">
            <h3 className="card-title">Phase breakdown</h3>
            <span className="badge outline">{phaseBreakdown.reduce((a, d) => a + d.count, 0)} commits</span>
          </div>
          <div className="card-body"><PhaseStackedBar data={phaseBreakdown} /></div>
        </div>
        <div className="card">
          <div className="card-head"><h3 className="card-title">AI attribution</h3></div>
          <div className="card-body"><AiAttributionBar data={aiBreakdown} /></div>
        </div>
      </div>

      <div style={{ marginTop: 24 }}>
        <div className="tabs">
          {[
            { k: 'commits', l: 'Commits', c: commits.length },
            { k: 'evidence', l: 'Evidence', c: evidence.length },
            { k: 'dossiers', l: 'Dossiers', c: dossiers.length },
            { k: 'json', l: 'JSON Payload' },
          ].map((t) => (
            <div
              key={t.k}
              className={`tab ${tab === t.k ? 'active' : ''}`}
              onClick={() => setTab(t.k)}
            >
              {t.l}{t.c != null && <span className="badge outline">{t.c}</span>}
            </div>
          ))}
        </div>

        <div style={{ marginTop: 14 }}>
          {tab === 'commits' && <CommitsTab commits={commits} onOpen={setDrawerCommit} />}
          {tab === 'evidence' && <EvidenceTab evidence={evidence} />}
          {tab === 'dossiers' && (
            <DossiersTab
              dossiers={dossiers}
              onDownload={(id) => TrackerApi?.downloadUrl(sessionId, id)}
              onRender={(format) => onRenderDossier(format)}
              onOpen={onOpenDossier}
            />
          )}
          {tab === 'json' && <JsonPayloadTab session={session} repos={repos} phaseBreakdown={phaseBreakdown} />}
        </div>
      </div>

      <CommitDrawer commit={drawerCommit} onClose={() => setDrawerCommit(null)} />
      <DossierDrawer
        dossier={drawerDossier}
        loading={drawerDossierLoading}
        onClose={() => setDrawerDossier(null)}
        onDownload={(id) => TrackerApi?.downloadUrl(sessionId, id)}
      />
    </div>
  );
}

function CommitsTab({ commits, onOpen }) {
  const [phase, setPhase] = React.useState('all');
  const [rd, setRd] = React.useState('all');
  const [q, setQ] = React.useState('');

  let rows = commits;
  if (phase !== 'all') rows = rows.filter((c) => c.phase === phase);
  if (rd === 'yes') rows = rows.filter((c) => c.is_rd_qualified);
  if (rd === 'no') rows = rows.filter((c) => c && !c.is_rd_qualified);
  if (q) rows = rows.filter((c) => (`${c.sha} ${c.message_subject} ${c.author_email}`).toLowerCase().includes(q.toLowerCase()));

  return (
    <div className="card">
      <div className="card-head" style={{ padding: '10px 12px', gap: 8, flexWrap: 'wrap' }}>
        <div style={{ display: 'flex', gap: 6, alignItems: 'center', flexWrap: 'wrap' }}>
          <button className={`chip ${phase === 'all' ? 'active' : ''}`} onClick={() => setPhase('all')}>All phases</button>
          {PB.PHASES.map((p) => (
            <button key={p.key} className={`chip ${phase === p.key ? 'active' : ''}`} onClick={() => setPhase(p.key)}>
              {p.label}
            </button>
          ))}
        </div>
        <div style={{ flex: 1 }} />
        <select className="select" style={{ width: 130 }} value={rd} onChange={(e) => setRd(e.target.value)}>
          <option value="all">R&D · all</option>
          <option value="yes">R&D · qualified</option>
          <option value="no">R&D · rejected</option>
        </select>
        <input className="input" style={{ width: 200 }} placeholder="SHA, message, author…" value={q} onChange={(e) => setQ(e.target.value)} />
      </div>

      <div className="card-body flush">
        <div className="table-wrap">
          <table className="tbl">
            <thead>
              <tr>
                <th style={{ width: 80 }}>SHA</th>
                <th>Subject</th>
                <th style={{ width: 130 }}>Phase</th>
                <th style={{ width: 60 }}>R&D</th>
                <th style={{ width: 130 }}>Confidence</th>
                <th style={{ width: 120 }}>AI</th>
                <th style={{ width: 120 }}>Author</th>
                <th className="num" style={{ width: 80 }}>Δ</th>
                <th style={{ width: 140 }}>When</th>
              </tr>
            </thead>
            <tbody>
              {rows.length === 0 && (
                <tr>
                  <td colSpan={9}>
                    <div className="empty" style={{ padding: 16 }}>No commits for selected filters.</div>
                  </td>
                </tr>
              )}
              {rows.map((c) => (
                <tr key={c.id} onClick={() => onOpen(c)}>
                  <td><span className="mono" style={{ fontSize: 12 }}>{c.short_sha}</span></td>
                  <td>
                    <div style={{ fontWeight: 500, fontSize: 13 }}>{c.message_subject}</div>
                    <div className="muted" style={{ fontSize: 11, marginTop: 2, display: 'flex', gap: 8, alignItems: 'center' }}>
                      <span className={`role-tag ${c.repository_role}`} style={{ fontSize: 9, padding: '1px 5px' }}>{String(c.repository_role || '').replace('_', ' ')}</span>
                      <span className="mono">{c.repository_path}</span>
                      <span className="mono">· {c.branch_name_canonical}</span>
                    </div>
                  </td>
                  <td><PhaseBadge phase={c.phase} /></td>
                  <td>{c.is_rd_qualified
                    ? <span className="rd-yes"><I.Check size={11} /> Yes</span>
                    : <span className="rd-no">— No</span>}
                  </td>
                  <td><Confidence value={c.rd_qualification_confidence} /></td>
                  <td><AiPill kind={c.ai_attribution} /></td>
                  <td className="muted" style={{ fontSize: 11.5 }}>{c.author_name}</td>
                  <td className="num">
                    <span style={{ color: 'var(--status-success)' }}>+{c.insertions}</span>{' '}
                    <span style={{ color: 'var(--status-failed)' }}>−{c.deletions}</span>
                  </td>
                  <td className="muted" style={{ fontSize: 11.5, fontFamily: 'var(--font-mono)' }}>{PB.fmtDt(c.committed_at)}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}

function EvidenceTab({ evidence }) {
  return (
    <div className="card">
      <div className="card-body flush">
        <div className="table-wrap">
          <table className="tbl">
            <thead>
              <tr>
                <th style={{ width: 110 }}>Kind</th>
                <th>Title</th>
                <th>Path</th>
                <th>Slug</th>
                <th className="num" style={{ width: 120 }}>Linked commits</th>
                <th style={{ width: 140 }}>Last modified</th>
              </tr>
            </thead>
            <tbody>
              {evidence.map((e) => (
                <tr key={e.id}>
                  <td><span className="badge outline">{e.kind}</span></td>
                  <td><b style={{ fontWeight: 500 }}>{e.title}</b></td>
                  <td><span className="mono" style={{ fontSize: 11.5 }}>{e.path}</span></td>
                  <td><span className="mono" style={{ fontSize: 11.5, color: 'var(--phase-design)' }}>{e.slug}</span></td>
                  <td className="num">{e.linked_commit_count}</td>
                  <td className="muted" style={{ fontSize: 11.5, fontFamily: 'var(--font-mono)' }}>{PB.fmtDt(e.last_modified_at)}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}

function DossiersTab({ dossiers, onDownload, onRender, onOpen }) {
  return (
    <div className="card">
      <div className="card-head">
        <h3 className="card-title">Rendered artefacts</h3>
        <div style={{ display: 'flex', gap: 6 }}>
          <button className="btn sm" onClick={() => onRender('json')}><I.External size={11} /> Render JSON</button>
          <button className="btn sm pb-primary" onClick={() => onRender('pdf')}><I.Send size={11} /> Render PDF</button>
        </div>
      </div>
      <div className="card-body flush">
        {dossiers.length === 0 && <div className="empty" style={{ padding: 16 }}>No dossier generated yet.</div>}
        {dossiers.map((d) => (
          <div
            key={d.id}
            className="dossier-row"
            style={{ cursor: onOpen ? 'pointer' : 'default' }}
            onClick={() => onOpen?.(d)}
          >
            <div className={`icon-tile ${d.format}`}>{d.format.toUpperCase()}</div>
            <div>
              <b style={{ fontWeight: 500, fontSize: 13 }}>dossier-{d.id}.{d.format}</b>
              <div style={{ display: 'flex', gap: 10, alignItems: 'center', marginTop: 4 }}>
                <CopyDigest value={d.sha256} short />
                <span className="digest" style={{ fontSize: 11 }}>locale {d.locale}</span>
                <span className="digest" style={{ fontSize: 11 }}>{PB.fmtDt(d.generated_at)}</span>
              </div>
            </div>
            <span className="size">{PB.fmtBytes(d.byte_size || 0)}</span>
            <
              href={onDownload ? onDownload(d.id) : '#'}
              className="btn sm"
              target="_blank"
              rel="noreferrer"
              onClick={(e) => e.stopPropagation()}
            >
              <I.External size={11} /> Download
            </a>
          </div>
        ))}
      </div>
    </div>
  );
}

// Macro 6.4b — Side drawer that surfaces the per-dossier metadata returned
// by GET /v1/tracking-sessions/{id}/dossiers/{dossierId} (sha256, byte_size,
// generated_at, format, locale, path) plus a one-click download. The
// component re-uses the shared `Drawer` primitive from ui.jsx; it is purely
// presentational and does not call the API itself — the parent fetches and
// passes the row in.
function DossierDrawer({ dossier, loading, onClose, onDownload }) {
  if (!dossier) return null;
  const downloadHref = onDownload ? onDownload(dossier.id) : null;
  return (
    <Drawer
      open={Boolean(dossier)}
      onClose={onClose}
      title={`Dossier · #${dossier.id} · ${(dossier.format || '').toUpperCase()}`}
      actions={downloadHref && (
        <a href={downloadHref} className="btn sm pb-primary" target="_blank" rel="noreferrer">
          <I.External size={11} /> Download
        </a>
      )}
    >
      <div style={{ display: 'flex', flexDirection: 'column', gap: 14, fontSize: 13 }}>
        {loading && (
          <div className="muted" style={{ fontSize: 11.5 }}>Loading detail from API…</div>
        )}
        <div>
          <div className="muted" style={{ fontSize: 11, marginBottom: 4 }}>Format · locale</div>
          <div>
            <span className="badge outline">{dossier.format || '-'}</span>{' '}
            <span className="badge outline">locale {dossier.locale || 'it'}</span>
          </div>
        </div>
        <div>
          <div className="muted" style={{ fontSize: 11, marginBottom: 4 }}>SHA-256</div>
          <CopyDigest value={dossier.sha256} />
        </div>
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 14 }}>
          <div>
            <div className="muted" style={{ fontSize: 11, marginBottom: 4 }}>Byte size</div>
            <span className="mono" style={{ fontSize: 12 }}>{PB.fmtBytes(dossier.byte_size || 0)}</span>
          </div>
          <div>
            <div className="muted" style={{ fontSize: 11, marginBottom: 4 }}>Generated at</div>
            <span className="mono" style={{ fontSize: 12 }}>{PB.fmtDt(dossier.generated_at) || '-'}</span>
          </div>
        </div>
        {dossier.path && (
          <div>
            <div className="muted" style={{ fontSize: 11, marginBottom: 4 }}>Storage path (server-side)</div>
            <span className="mono" style={{ fontSize: 11.5, wordBreak: 'break-all' }}>{dossier.path}</span>
          </div>
        )}
        <div>
          <div className="muted" style={{ fontSize: 11, marginBottom: 4 }}>Tracking session</div>
          <span className="mono" style={{ fontSize: 12 }}>#{dossier.tracking_session_id || '-'}</span>
        </div>
        <div className="muted" style={{ fontSize: 11, lineHeight: 1.5 }}>
          The download endpoint is session-scoped and ownership-checked server-side. Do not bookmark or share the resulting URL — re-render on demand.
        </div>
      </div>
    </Drawer>
  );
}

function JsonPayloadTab({ session, repos, phaseBreakdown }) {
  const payload = {
    session: {
      id: session.id,
      status: session.status,
      denomination: session.denomination,
      fiscal_year: session.fiscal_year,
      p_iva: session.p_iva,
      regime: session.regime,
    },
    period: session.period,
    tax_identity: session.tax_identity || {},
    classifier: session.classifier,
    cost: session.cost,
    summary: session.summary,
    chain: session.chain,
    repositories: repos,
    phase_breakdown: phaseBreakdown,
    ai_breakdown: session.ai_breakdown,
  };

  return (
    <div className="card">
      <div className="card-head">
        <h3 className="card-title">JSON payload preview</h3>
        <button className="btn sm"><I.Copy size={11} /> Copy</button>
      </div>
      <div className="card-body">
        <pre className="code-block" dangerouslySetInnerHTML={{ __html: jsonHighlight(payload) }} />
      </div>
    </div>
  );
}

window.PageDetail = PageDetail;
