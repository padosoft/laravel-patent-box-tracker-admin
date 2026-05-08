// ============== New Run wizard ==============

function PageNewRun({ onCancel, onLaunched, apiEnabled = true, onSuccess }) {
  const toast = useToast();
  const [step, setStep] = React.useState(1);
  const [busy, setBusy] = React.useState(false);
  const [apiError, setApiError] = React.useState(null);
  const [projection, setProjection] = React.useState(null);

  const [form, setForm] = React.useState({
    denomination: 'Padosoft S.r.l.',
    p_iva: '01234567890',
    fiscal_year: '2026',
    period_from: '2026-01-01',
    period_to: '2026-12-31',
    regime: 'documentazione_idonea',
    repos: [
      { path: 'github.com/padosoft/forge-runtime', role: 'primary_ip', branch: 'main', enabled: true },
      { path: 'github.com/padosoft/forge-cli', role: 'support', branch: 'main', enabled: true },
      { path: 'github.com/padosoft/devops', role: 'meta_self', branch: 'main', enabled: false },
    ],
    provider: 'regolo',
    model: 'claude-sonnet-4-6',
    seed: '0xC0FFEE-2026',
    cost_cap_eur: 50,
    locale: 'it',
  });

  const update = (k, v) => setForm((f) => ({ ...f, [k]: v }));
  const updRepo = (i, k, v) => setForm((f) => ({ ...f, repos: f.repos.map((r, j) => j === i ? { ...r, [k]: v } : r) }));

  const enabledRepos = form.repos.filter((r) => r.enabled);

  const buildPayload = React.useCallback(() => ({
    mode: enabledRepos.length === 1 ? 'single_repo' : 'cross_repo',
    tax_identity: {
      denomination: String(form.denomination || '').trim(),
      p_iva: String(form.p_iva || '').trim(),
      fiscal_year: String(form.fiscal_year),
      regime: String(form.regime),
    },
    period: {
      from: form.period_from,
      to: form.period_to,
    },
    classifier: {
      provider: String(form.provider),
      model: String(form.model),
      seed: String(form.seed),
    },
    cost_model: {
      cost_cap_eur_per_run: Number(form.cost_cap_eur) || 0,
    },
    repositories: enabledRepos.map((repo) => ({
      path: String(repo.path || '').trim(),
      role: repo.role === 'core' ? 'primary_ip' : repo.role,
      branch: String(repo.branch || 'main').trim() || 'main',
    })),
  }), [enabledRepos, form]);

  const clearState = React.useCallback(() => {
    setApiError(null);
    setProjection(null);
  }, []);

  const launchFromApi = async () => {
    clearState();

    if (!apiEnabled || typeof TrackerApi === 'undefined' || !onLaunched) {
      setApiError('Tracker API disabled. Enable API in the client config and retry.');
      toast.push({ kind: 'error', title: 'API non abilitata', body: 'Tracker API required for launch.' });
      return;
    }

    if (!enabledRepos.length) {
      setApiError('Enable at least one repository.');
      return;
    }

    const payload = buildPayload();
    const invalidRole = payload.repositories.some((r) => !['primary_ip', 'support', 'meta_self'].includes(r.role));
    if (invalidRole) {
      setApiError('Repository role must be primary_ip, support or meta_self.');
      return;
    }

    if (payload.mode === 'cross_repo' && !payload.repositories.some((r) => r.role === 'primary_ip')) {
      setApiError('Cross-repo mode requires at least one primary_ip repository.');
      return;
    }

    if (new Date(payload.period.from) >= new Date(payload.period.to)) {
      setApiError('Period "from" must be earlier than "to".');
      return;
    }

    setBusy(true);

    try {
      const dryRun = await TrackerApi.dryRun(payload);
      if (!dryRun.ok) {
        const code = dryRun.error?.code || 'validation_failed';
        const message = dryRun.error?.message || 'Dry-run failed.';
        setApiError(`${code}: ${message}`);
        toast.push({ kind: 'error', title: 'Dry-run failed', body: message });
        return;
      }
      setProjection(dryRun.data);

      const createRsp = await onLaunched(payload);
      if (!createRsp.ok) {
        const code = createRsp.error?.code || 'request_failed';
        const message = createRsp.error?.message || 'Session launch failed.';
        setApiError(`${code}: ${message}`);
        toast.push({ kind: 'error', title: 'Launch failed', body: message });
        return;
      }

      const sessionId = createRsp.data?.id;
      const status = createRsp.data?.status;
      toast.push({
        kind: 'ok',
        title: 'Session started',
        body: `Session #${sessionId || ''} ${status ? `(${status})` : ''}`,
      });

      if (onSuccess) {
        onSuccess(createRsp.data || null);
      } else {
        onCancel();
      }
    } finally {
      setBusy(false);
    }
  };

  const projectedCost = projection
    ? Number(projection.projected_cost_eur || 0).toFixed(2)
    : (enabledRepos.length * 12.4).toFixed(2);
  const projectedCommits = projection ? Number(projection.total_commit_count || 0) : (enabledRepos.length * 320);

  const steps = [
    { n: 1, label: 'Taxpayer & period' },
    { n: 2, label: 'Repositories' },
    { n: 3, label: 'Classifier' },
    { n: 4, label: 'Review & launch' },
  ];

  return (
    <div className="page" data-screen-label="New Run">
      <div className="page-head">
        <div>
          <h1 className="page-title">New session</h1>
          <p className="page-sub">Configure a Patent Box tracking run. API-backed wizard.</p>
        </div>
        <div className="page-actions">
          <button className="btn ghost" onClick={onCancel}>Cancel</button>
        </div>
      </div>

      {apiError && (
        <div className="card" style={{marginBottom:16,borderColor:'var(--status-failed)',background:'rgba(255,96,96,.08)'}}>
          <div className="card-body" style={{fontSize:13,color:'var(--status-failed)'}}>
            <b>Error</b>
            <div className="muted" style={{marginTop:6}}>{apiError}</div>
          </div>
        </div>
      )}

      <div className="wiz-shell">
        <div className="wiz-rail">
          {steps.map((s) => (
            <div
              key={s.n}
              className={`wiz-rail-step ${step === s.n ? 'active' : step > s.n ? 'done' : ''}`}
              onClick={() => step > s.n && setStep(s.n)}
            >
              <span className="num">{step > s.n ? <I.Check size={11} /> : s.n}</span>
              <div>
                <div style={{ fontSize: 12, fontWeight: 500, letterSpacing: '.02em' }}>{s.label}</div>
              </div>
            </div>
          ))}
        </div>

        <div className="card" style={{ margin: 0 }}>
          <div className="card-head">
            <h3 className="card-title">{steps[step - 1].label}</h3>
            <span className="muted" style={{ fontSize: 11.5, fontFamily: 'var(--font-mono)' }}>step {step} / {steps.length}</span>
          </div>
          <div className="card-body">
            {step === 1 && (
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 14 }}>
                <Field label="Denomination" hint="Soggetto passivo IRES">
                  <input className="input" value={form.denomination} onChange={(e) => update('denomination', e.target.value)} />
                </Field>
                <Field label="P.IVA" hint="11 digits">
                  <input className="input mono" value={form.p_iva} onChange={(e) => update('p_iva', e.target.value)} />
                </Field>
                <Field label="Fiscal year">
                  <select className="select" value={form.fiscal_year} onChange={(e) => update('fiscal_year', e.target.value)}>
                    <option>2026</option>
                    <option>2025</option>
                    <option>2024</option>
                  </select>
                </Field>
                <Field label="Regime">
                  <select className="select" value={form.regime} onChange={(e) => update('regime', e.target.value)}>
                    <option value="documentazione_idonea">Documentazione idonea</option>
                    <option value="non_documentazione">Non documentazione</option>
                  </select>
                </Field>
                <Field label="Period — from">
                  <input className="input mono" type="date" value={form.period_from} onChange={(e) => update('period_from', e.target.value)} />
                </Field>
                <Field label="Period — to">
                  <input className="input mono" type="date" value={form.period_to} onChange={(e) => update('period_to', e.target.value)} />
                </Field>
              </div>
            )}

            {step === 2 && (
              <div>
                <p className="muted" style={{ fontSize: 12, marginBottom: 12 }}>
                  Roles are API-compatible: <b>primary_ip</b>, <b>support</b>, <b>meta_self</b>.
                </p>
                <div style={{ border: '1px solid var(--border-subtle)', borderRadius: 6, overflow: 'hidden' }}>
                  <table className="tbl" style={{ margin: 0 }}>
                    <thead>
                      <tr>
                        <th style={{ width: 40 }}></th>
                        <th>Repository</th>
                        <th style={{ width: 180 }}>Role</th>
                        <th style={{ width: 140 }}>Branch</th>
                      </tr>
                    </thead>
                    <tbody>
                      {form.repos.map((r, i) => (
                        <tr key={i} style={{ cursor: 'default' }}>
                          <td>
                            <input type="checkbox" checked={r.enabled} onChange={(e) => updRepo(i, 'enabled', e.target.checked)} />
                          </td>
                          <td>
                            <span className="mono" style={{ fontSize: 12 }}>{r.path}</span>
                          </td>
                          <td>
                            <select
                              className="select"
                              style={{ padding: '4px 8px', fontSize: 11 }}
                              value={r.role}
                              onChange={(e) => updRepo(i, 'role', e.target.value)}
                            >
                              <option value="primary_ip">primary_ip</option>
                              <option value="support">support</option>
                              <option value="meta_self">meta_self</option>
                            </select>
                          </td>
                          <td>
                            <input
                              className="input mono"
                              style={{ padding: '4px 8px', fontSize: 11 }}
                              value={r.branch}
                              onChange={(e) => updRepo(i, 'branch', e.target.value)}
                            />
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
                <button className="btn sm" style={{ marginTop: 10 }}><I.Plus size={11} /> Add repository</button>
              </div>
            )}

            {step === 3 && (
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 14 }}>
                <Field label="Provider">
                  <select className="select" value={form.provider} onChange={(e) => update('provider', e.target.value)}>
                    <option value="anthropic">Anthropic</option>
                    <option value="openai">OpenAI</option>
                  </select>
                </Field>
                <Field label="Model">
                  <select className="select" value={form.model} onChange={(e) => update('model', e.target.value)}>
                    <option>claude-haiku-4-5</option>
                    <option>claude-sonnet-4-6</option>
                    <option>gpt-4o-mini</option>
                  </select>
                </Field>
                <Field label="Deterministic seed">
                  <input className="input mono" value={form.seed} onChange={(e) => update('seed', e.target.value)} />
                </Field>
                <Field label="Cost cap (EUR)">
                  <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                    <input className="input mono" style={{ width: 80 }} value={form.cost_cap_eur} onChange={(e) => update('cost_cap_eur', e.target.value)} />
                    <span className="muted" style={{ fontSize: 11 }}>EUR / run</span>
                  </div>
                </Field>
                <Field label="Output locale">
                  <select className="select" value={form.locale} onChange={(e) => update('locale', e.target.value)}>
                    <option value="it">it</option>
                    <option value="en">en</option>
                  </select>
                </Field>
              </div>
            )}

            {step === 4 && (
              <div>
                <p className="muted" style={{ fontSize: 12, marginBottom: 14 }}>
                  Review the configuration. The launch performs a dry-run projection and then queues the session.
                </p>
                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 14 }}>
                  <ReviewCard title="Taxpayer & period">
                    <dl className="kv compact">
                      <dt>Denomination</dt><dd style={{ fontFamily: 'var(--font-sans)' }}>{form.denomination}</dd>
                      <dt>P.IVA</dt><dd>{form.p_iva}</dd>
                      <dt>FY</dt><dd>{form.fiscal_year}</dd>
                      <dt>Period</dt><dd>{form.period_from} → {form.period_to}</dd>
                      <dt>Regime</dt><dd style={{ fontFamily: 'var(--font-sans)' }}>{form.regime}</dd>
                    </dl>
                  </ReviewCard>
                  <ReviewCard title="Classifier">
                    <dl className="kv compact">
                      <dt>Provider</dt><dd style={{ fontFamily: 'var(--font-sans)' }}>{form.provider}</dd>
                      <dt>Model</dt><dd>{form.model}</dd>
                      <dt>Seed</dt><dd>{form.seed}</dd>
                      <dt>Cost cap</dt><dd>€{form.cost_cap_eur}</dd>
                      <dt>Locale</dt><dd>{form.locale}</dd>
                    </dl>
                  </ReviewCard>
                  <ReviewCard title={`Repositories (${enabledRepos.length})`} span>
                    {enabledRepos.map((r, i) => (
                      <div key={i} style={{ display: 'flex', gap: 10, alignItems: 'center', padding: '4px 0' }}>
                        <span className={`role-tag ${r.role}`}>{r.role}</span>
                        <span className="mono" style={{ fontSize: 12 }}>{r.path}</span>
                        <span className="mono muted" style={{ fontSize: 11.5, marginLeft: 'auto' }}>{r.branch}</span>
                      </div>
                    ))}
                  </ReviewCard>
                </div>
                <div style={{ marginTop: 16, padding: 14, border: '1px solid var(--pb-accent-border)', borderRadius: 8, background: 'var(--pb-accent-soft)' }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', gap: 20 }}>
                    <div>
                      <div style={{ fontSize: 11, color: 'var(--text-tertiary)', textTransform: 'uppercase', letterSpacing: '.08em', fontFamily: 'var(--font-mono)' }}>Projected cost</div>
                      <div style={{ fontSize: 24, fontFamily: 'var(--font-mono)', fontWeight: 500, marginTop: 4 }}>€{projectedCost}</div>
                    </div>
                    <div style={{ textAlign: 'right' }}>
                      <div style={{ fontSize: 11, color: 'var(--text-tertiary)', textTransform: 'uppercase', letterSpacing: '.08em', fontFamily: 'var(--font-mono)' }}>Projected commits</div>
                      <div style={{ fontSize: 24, fontFamily: 'var(--font-mono)', fontWeight: 500, marginTop: 4 }}>~{projectedCommits}</div>
                    </div>
                    <div style={{ textAlign: 'right' }}>
                      <div style={{ fontSize: 11, color: 'var(--text-tertiary)', textTransform: 'uppercase', letterSpacing: '.08em', fontFamily: 'var(--font-mono)' }}>Exceeds cap</div>
                      <div style={{ fontSize: 24, fontFamily: 'var(--font-mono)', fontWeight: 500, marginTop: 4 }}>{projection ? (projection.exceeds_cost_cap ? 'Yes' : 'No') : 'n/a'}</div>
                    </div>
                  </div>
                </div>
              </div>
            )}
          </div>

          <div style={{ padding: '12px 16px', borderTop: '1px solid var(--border-subtle)', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <button
              className="btn ghost"
              disabled={step === 1 || busy}
              onClick={() => setStep((s) => s - 1)}
            >
              <I.ChevronLeft size={12} /> Back
            </button>

            {step < 4 ? (
              <button className="btn pb-primary" onClick={() => setStep((s) => s + 1)}>
                Continue <I.ChevronRight size={12} />
              </button>
            ) : (
              <button
                className="btn pb-primary"
                disabled={busy}
                onClick={launchFromApi}
              >
                {busy ? 'Launching…' : <><I.Send size={13} /> Queue session</>}
              </button>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}

function Field({ label, hint, children }) {
  return (
    <div>
      <label style={{ display: 'block', fontSize: 11, fontWeight: 500, letterSpacing: '.04em', textTransform: 'uppercase', color: 'var(--text-secondary)', marginBottom: 6, fontFamily: 'var(--font-mono)' }}>{label}</label>
      {children}
      {hint && <div style={{ fontSize: 11, color: 'var(--text-tertiary)', marginTop: 4 }}>{hint}</div>}
    </div>
  );
}

function ReviewCard({ title, span, children }) {
  return (
    <div style={{
      border: '1px solid var(--border-subtle)',
      borderRadius: 6,
      padding: '12px 14px',
      gridColumn: span ? '1 / -1' : 'auto',
    }}>
      <div style={{ fontSize: 11, letterSpacing: '.08em', textTransform: 'uppercase', color: 'var(--text-tertiary)', fontFamily: 'var(--font-mono)', marginBottom: 10 }}>{title}</div>
      {children}
    </div>
  );
}

window.PageNewRun = PageNewRun;
