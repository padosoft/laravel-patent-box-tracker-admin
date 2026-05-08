// ============== New Run wizard ==============

function PageNewRun({ onCancel, onLaunched }) {
  const [step, setStep] = React.useState(1);
  const [form, setForm] = React.useState({
    denomination: 'Padosoft S.r.l.',
    p_iva: '01234567890',
    fiscal_year: '2026',
    period_from: '2026-01-01',
    period_to: '2026-12-31',
    regime: 'documentazione_idonea',
    repos: [
      { path: 'github.com/padosoft/forge-runtime',  role: 'core',           branch: 'main',    enabled: true },
      { path: 'github.com/padosoft/forge-cli',      role: 'core',           branch: 'main',    enabled: true },
      { path: 'github.com/padosoft/console-web',    role: 'support',        branch: 'master',  enabled: true },
      { path: 'github.com/padosoft/devops',         role: 'infrastructure', branch: 'main',    enabled: false },
    ],
    provider: 'anthropic',
    model: 'claude-haiku-4-5',
    seed: '0xC0FFEE-2026',
    cost_cap_eur: 50,
    locale: 'it-IT',
  });

  const update = (k,v) => setForm(f => ({ ...f, [k]: v }));
  const updRepo = (i, k, v) => setForm(f => ({ ...f, repos: f.repos.map((r,j) => j===i ? { ...r, [k]: v } : r) }));

  const enabledRepos = form.repos.filter(r => r.enabled);
  const projectedCost = (enabledRepos.length * 12.4).toFixed(2);

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
          <p className="page-sub">Configure a Patent Box tracking run · ingestion → classification → ledger anchor → dossier.</p>
        </div>
        <div className="page-actions">
          <button className="btn ghost" onClick={onCancel}>Cancel</button>
        </div>
      </div>

      <div className="wiz-shell">
        <div className="wiz-rail">
          {steps.map(s => (
            <div key={s.n} className={`wiz-rail-step ${step === s.n ? 'active' : step > s.n ? 'done' : ''}`}
                 onClick={() => step > s.n && setStep(s.n)}>
              <span className="num">
                {step > s.n ? <I.Check size={11}/> : s.n}
              </span>
              <div>
                <div style={{fontSize:12,fontWeight:500,letterSpacing:'.02em'}}>{s.label}</div>
                <div style={{fontSize:11,color:'var(--text-tertiary)',marginTop:2}}>
                  {s.n === 1 && 'company, fiscal year, regime'}
                  {s.n === 2 && 'repositories & branches'}
                  {s.n === 3 && 'provider, model, seed'}
                  {s.n === 4 && 'preview projected cost'}
                </div>
              </div>
            </div>
          ))}
        </div>

        <div className="card" style={{margin:0}}>
          <div className="card-head">
            <h3 className="card-title">{steps[step-1].label}</h3>
            <span className="muted" style={{fontSize:11.5,fontFamily:'var(--font-mono)'}}>step {step} / {steps.length}</span>
          </div>
          <div className="card-body">
            {step === 1 && (
              <div style={{display:'grid',gridTemplateColumns:'1fr 1fr',gap:14}}>
                <Field label="Denomination" hint="Soggetto passivo IRES — exact legal name">
                  <input className="input" value={form.denomination} onChange={e => update('denomination', e.target.value)}/>
                </Field>
                <Field label="P.IVA" hint="11 digits · validated against Agenzia delle Entrate">
                  <input className="input mono" value={form.p_iva} onChange={e => update('p_iva', e.target.value)}/>
                </Field>
                <Field label="Fiscal year">
                  <select className="select" value={form.fiscal_year} onChange={e => update('fiscal_year', e.target.value)}>
                    <option>2026</option><option>2025</option><option>2024</option>
                  </select>
                </Field>
                <Field label="Regime" hint="DM 11/2024 · documentazione idonea protects from sanctions">
                  <select className="select" value={form.regime} onChange={e => update('regime', e.target.value)}>
                    <option value="documentazione_idonea">Documentazione idonea</option>
                    <option value="non_documentazione">Non documentazione</option>
                  </select>
                </Field>
                <Field label="Period — from">
                  <input className="input mono" type="date" value={form.period_from} onChange={e => update('period_from', e.target.value)}/>
                </Field>
                <Field label="Period — to">
                  <input className="input mono" type="date" value={form.period_to} onChange={e => update('period_to', e.target.value)}/>
                </Field>
              </div>
            )}

            {step === 2 && (
              <div>
                <p className="muted" style={{fontSize:12,marginBottom:12}}>
                  Select repositories to ingest. Roles influence default qualification rules.
                  Only enabled repositories will be included; branches resolve to their canonical name.
                </p>
                <div style={{border:'1px solid var(--border-subtle)',borderRadius:6,overflow:'hidden'}}>
                  <table className="tbl" style={{margin:0}}>
                    <thead>
                      <tr>
                        <th style={{width:40}}></th>
                        <th>Repository</th>
                        <th style={{width:160}}>Role</th>
                        <th style={{width:140}}>Branch</th>
                      </tr>
                    </thead>
                    <tbody>
                      {form.repos.map((r,i) => (
                        <tr key={i} style={{cursor:'default'}}>
                          <td>
                            <input type="checkbox" checked={r.enabled}
                                   onChange={e => updRepo(i,'enabled',e.target.checked)}/>
                          </td>
                          <td><span className="mono" style={{fontSize:12}}>{r.path}</span></td>
                          <td>
                            <select className="select" style={{padding:'4px 8px',fontSize:11}}
                                    value={r.role} onChange={e => updRepo(i,'role',e.target.value)}>
                              <option value="core">core</option>
                              <option value="support">support</option>
                              <option value="infrastructure">infrastructure</option>
                            </select>
                          </td>
                          <td>
                            <input className="input mono" style={{padding:'4px 8px',fontSize:11}}
                                   value={r.branch} onChange={e => updRepo(i,'branch',e.target.value)}/>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
                <button className="btn sm" style={{marginTop:10}}><I.Plus size={11}/> Add repository</button>
              </div>
            )}

            {step === 3 && (
              <div style={{display:'grid',gridTemplateColumns:'1fr 1fr',gap:14}}>
                <Field label="Provider" hint="LLM provider for commit classification">
                  <select className="select" value={form.provider} onChange={e => update('provider', e.target.value)}>
                    <option value="anthropic">Anthropic</option>
                    <option value="openai">OpenAI</option>
                  </select>
                </Field>
                <Field label="Model">
                  <select className="select" value={form.model} onChange={e => update('model', e.target.value)}>
                    <option>claude-haiku-4-5</option>
                    <option>claude-sonnet-4-5</option>
                    <option>gpt-4o-mini</option>
                  </select>
                </Field>
                <Field label="Deterministic seed" hint="Same seed + payload → byte-identical classification">
                  <input className="input mono" value={form.seed} onChange={e => update('seed', e.target.value)}/>
                </Field>
                <Field label="Cost cap" hint={`Hard ceiling · package limit €${PB.CAPABILITIES.classifier.cost_cap_eur_per_run}`}>
                  <div style={{display:'flex',alignItems:'center',gap:8}}>
                    <input className="input mono" style={{width:80}} value={form.cost_cap_eur}
                           onChange={e => update('cost_cap_eur', e.target.value)}/>
                    <span className="muted" style={{fontSize:11}}>EUR / run</span>
                  </div>
                </Field>
                <Field label="Output locale">
                  <select className="select" value={form.locale} onChange={e => update('locale', e.target.value)}>
                    <option value="it-IT">Italiano (it-IT)</option>
                    <option value="en-US">English (en-US)</option>
                  </select>
                </Field>
              </div>
            )}

            {step === 4 && (
              <div>
                <p className="muted" style={{fontSize:12,marginBottom:14}}>
                  Review the configuration. Launch will enqueue the session and progress through pending → running → classified → rendered.
                </p>
                <div style={{display:'grid',gridTemplateColumns:'1fr 1fr',gap:14}}>
                  <ReviewCard title="Taxpayer & period">
                    <dl className="kv compact">
                      <dt>Denomination</dt><dd style={{fontFamily:'var(--font-sans)'}}>{form.denomination}</dd>
                      <dt>P.IVA</dt><dd>{form.p_iva}</dd>
                      <dt>FY</dt><dd>{form.fiscal_year}</dd>
                      <dt>Period</dt><dd>{form.period_from} → {form.period_to}</dd>
                      <dt>Regime</dt><dd style={{fontFamily:'var(--font-sans)'}}>{form.regime.replace('_',' ')}</dd>
                    </dl>
                  </ReviewCard>
                  <ReviewCard title="Classifier">
                    <dl className="kv compact">
                      <dt>Provider</dt><dd style={{fontFamily:'var(--font-sans)'}}>{form.provider}</dd>
                      <dt>Model</dt><dd>{form.model}</dd>
                      <dt>Seed</dt><dd>{form.seed}</dd>
                      <dt>Cost cap</dt><dd>€{form.cost_cap_eur}</dd>
                      <dt>Locale</dt><dd>{form.locale}</dd>
                    </dl>
                  </ReviewCard>
                  <ReviewCard title={`Repositories (${enabledRepos.length})`} span>
                    {enabledRepos.map((r,i) => (
                      <div key={i} style={{display:'flex',gap:10,alignItems:'center',padding:'4px 0'}}>
                        <span className={`role-tag ${r.role}`}>{r.role.replace('_',' ')}</span>
                        <span className="mono" style={{fontSize:12}}>{r.path}</span>
                        <span className="mono muted" style={{fontSize:11.5,marginLeft:'auto'}}>{r.branch}</span>
                      </div>
                    ))}
                  </ReviewCard>
                </div>

                <div style={{marginTop:16,padding:14,border:'1px solid var(--pb-accent-border)',borderRadius:8,background:'var(--pb-accent-soft)'}}>
                  <div style={{display:'flex',justifyContent:'space-between',alignItems:'center'}}>
                    <div>
                      <div style={{fontSize:11,color:'var(--text-tertiary)',textTransform:'uppercase',letterSpacing:'.08em',fontFamily:'var(--font-mono)'}}>Projected cost</div>
                      <div style={{fontSize:24,fontFamily:'var(--font-mono)',fontWeight:500,marginTop:4}}>€{projectedCost}</div>
                    </div>
                    <div style={{textAlign:'right'}}>
                      <div style={{fontSize:11,color:'var(--text-tertiary)',textTransform:'uppercase',letterSpacing:'.08em',fontFamily:'var(--font-mono)'}}>Projected commits</div>
                      <div style={{fontSize:24,fontFamily:'var(--font-mono)',fontWeight:500,marginTop:4}}>~{enabledRepos.length * 320}</div>
                    </div>
                    <div style={{textAlign:'right'}}>
                      <div style={{fontSize:11,color:'var(--text-tertiary)',textTransform:'uppercase',letterSpacing:'.08em',fontFamily:'var(--font-mono)'}}>Time</div>
                      <div style={{fontSize:24,fontFamily:'var(--font-mono)',fontWeight:500,marginTop:4}}>~{enabledRepos.length * 4}m</div>
                    </div>
                  </div>
                </div>
              </div>
            )}
          </div>
          <div style={{padding:'12px 16px',borderTop:'1px solid var(--border-subtle)',display:'flex',justifyContent:'space-between',alignItems:'center'}}>
            <button className="btn ghost" disabled={step === 1} onClick={() => setStep(s => s-1)}>
              <I.ChevronLeft size={12}/> Back
            </button>
            {step < 4
              ? <button className="btn pb-primary" onClick={() => setStep(s => s+1)}>
                  Continue <I.ChevronRight size={12}/>
                </button>
              : <button className="btn pb-primary" onClick={onLaunched}>
                  <I.Send size={13}/> Launch session
                </button>}
          </div>
        </div>
      </div>
    </div>
  );
}

function Field({ label, hint, children }) {
  return (
    <div>
      <label style={{display:'block',fontSize:11,fontWeight:500,letterSpacing:'.04em',textTransform:'uppercase',color:'var(--text-secondary)',marginBottom:6,fontFamily:'var(--font-mono)'}}>{label}</label>
      {children}
      {hint && <div style={{fontSize:11,color:'var(--text-tertiary)',marginTop:4}}>{hint}</div>}
    </div>
  );
}

function ReviewCard({ title, span, children }) {
  return (
    <div style={{
      border:'1px solid var(--border-subtle)',borderRadius:6,padding:'12px 14px',
      gridColumn: span ? '1 / -1' : 'auto',
    }}>
      <div style={{fontSize:11,letterSpacing:'.08em',textTransform:'uppercase',color:'var(--text-tertiary)',fontFamily:'var(--font-mono)',marginBottom:10}}>{title}</div>
      {children}
    </div>
  );
}

window.PageNewRun = PageNewRun;
