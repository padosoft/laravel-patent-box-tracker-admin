// ============== Cross-session Commits, Evidence, Dossiers, Settings, Audit ==============

function PageCommits({ onOpenSession }) {
  const [phase, setPhase] = React.useState('all');
  const [rd, setRd] = React.useState('all');
  const [q, setQ] = React.useState('');
  const [drawer, setDrawer] = React.useState(null);

  let rows = PB.COMMITS;
  if (phase !== 'all') rows = rows.filter(c => c.phase === phase);
  if (rd === 'yes') rows = rows.filter(c => c.is_rd_qualified);
  if (rd === 'no') rows = rows.filter(c => !c.is_rd_qualified);
  if (q) rows = rows.filter(c => (c.sha + ' ' + c.message_subject + ' ' + c.author_email).toLowerCase().includes(q.toLowerCase()));

  return (
    <div className="page wide" data-screen-label="Commits">
      <div className="page-head">
        <div>
          <h1 className="page-title">Commits</h1>
          <p className="page-sub">Every commit anchored to the ledger · classified, rationalised, fingerprinted.</p>
        </div>
        <div className="page-actions">
          <button className="btn"><I.External size={13}/> Export CSV</button>
        </div>
      </div>

      <div className="filter-bar">
        <button className={`chip ${phase==='all'?'active':''}`} onClick={()=>setPhase('all')}>All phases</button>
        {PB.PHASES.map(p => (
          <button key={p.key} className={`chip ${phase===p.key?'active':''}`} onClick={()=>setPhase(p.key)}>{p.label}</button>
        ))}
        <span style={{flex:1}}/>
        <select className="select" style={{width:160}} value={rd} onChange={e=>setRd(e.target.value)}>
          <option value="all">R&D · all</option>
          <option value="yes">R&D · qualified</option>
          <option value="no">R&D · rejected</option>
        </select>
        <input className="input" style={{width:240}} placeholder="SHA, subject, author…"
               value={q} onChange={e=>setQ(e.target.value)}/>
      </div>

      <div className="card">
        <div className="card-body flush">
          <div className="table-wrap">
            <table className="tbl">
              <thead>
                <tr>
                  <th style={{width:80}}>SHA</th>
                  <th>Subject</th>
                  <th style={{width:130}}>Phase</th>
                  <th style={{width:60}}>R&D</th>
                  <th style={{width:130}}>Confidence</th>
                  <th style={{width:120}}>AI</th>
                  <th style={{width:120}}>Author</th>
                  <th className="num" style={{width:80}}>Δ</th>
                  <th style={{width:140}}>When</th>
                </tr>
              </thead>
              <tbody>
                {rows.map(c => (
                  <tr key={c.id} onClick={() => setDrawer(c)}>
                    <td><span className="mono" style={{fontSize:12}}>{c.short_sha}</span></td>
                    <td>
                      <div style={{fontWeight:500,fontSize:13}}>{c.message_subject}</div>
                      <div className="muted" style={{fontSize:11,marginTop:2,display:'flex',gap:8}}>
                        <span className={`role-tag ${c.repository_role}`} style={{fontSize:9,padding:'1px 5px'}}>{c.repository_role.replace('_',' ')}</span>
                        <span className="mono">{c.repository_path}</span>
                      </div>
                    </td>
                    <td><PhaseBadge phase={c.phase}/></td>
                    <td>{c.is_rd_qualified
                      ? <span className="rd-yes"><I.Check size={11}/> Yes</span>
                      : <span className="rd-no">No</span>}</td>
                    <td><Confidence value={c.rd_qualification_confidence}/></td>
                    <td><AiPill kind={c.ai_attribution}/></td>
                    <td className="muted" style={{fontSize:11.5}}>{c.author_name}</td>
                    <td className="num">
                      <span style={{color:'var(--status-success)'}}>+{c.insertions}</span>{' '}
                      <span style={{color:'var(--status-failed)'}}>−{c.deletions}</span>
                    </td>
                    <td className="muted" style={{fontSize:11.5,fontFamily:'var(--font-mono)'}}>{PB.fmtDt(c.committed_at)}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      </div>

      <Drawer open={!!drawer} onClose={() => setDrawer(null)}
              title={drawer ? <>Commit · <span className="mono" style={{fontSize:12,color:'var(--text-secondary)'}}>{drawer.short_sha}</span></> : ''}>
        {drawer && (
          <div>
            <div className="insp-section">
              <h4>Subject</h4>
              <p style={{fontWeight:500,fontSize:14}}>{drawer.message_subject}</p>
              <div style={{display:'flex',gap:8,flexWrap:'wrap',marginTop:10}}>
                <PhaseBadge phase={drawer.phase}/>
                {drawer.is_rd_qualified
                  ? <span className="rd-yes"><I.Check size={11}/> R&D qualified</span>
                  : <span className="rd-no">Not qualified</span>}
                <AiPill kind={drawer.ai_attribution}/>
                <Confidence value={drawer.rd_qualification_confidence}/>
              </div>
            </div>
            <div className="insp-section">
              <h4>Rationale</h4>
              <p>{drawer.rationale}</p>
            </div>
            <div className="insp-section">
              <h4>Hash chain link</h4>
              <div className="chain-link">
                <div className="digest"><small>prev</small>{drawer.hash_chain.prev.slice(0,16)}…{drawer.hash_chain.prev.slice(-6)}</div>
                <div className="arrow"><I.ArrowRight size={14}/></div>
                <div className="digest"><small>self</small>{drawer.hash_chain.self.slice(0,16)}…{drawer.hash_chain.self.slice(-6)}</div>
              </div>
            </div>
            <div className="insp-section">
              <h4>Evidence used</h4>
              {drawer.evidence_used.length === 0
                ? <p style={{color:'var(--text-tertiary)'}}>—</p>
                : drawer.evidence_used.map(s => (
                  <span key={s} className="insp-evidence"><I.Definitions size={11} className="icon"/>{s}</span>
                ))}
            </div>
          </div>
        )}
      </Drawer>
    </div>
  );
}

function PageEvidence() {
  return (
    <div className="page wide" data-screen-label="Evidence">
      <div className="page-head">
        <div>
          <h1 className="page-title">Evidence library</h1>
          <p className="page-sub">Project records, ADRs, RFCs, glossaries · semantic anchors for the classifier.</p>
        </div>
        <div className="page-actions">
          <button className="btn"><I.Plus size={13}/> Upload artefact</button>
        </div>
      </div>

      <div className="card">
        <div className="card-body flush">
          <div className="table-wrap">
            <table className="tbl">
              <thead>
                <tr>
                  <th style={{width:120}}>Kind</th>
                  <th>Title</th>
                  <th style={{width:280}}>Path</th>
                  <th style={{width:160}}>Slug</th>
                  <th className="num" style={{width:140}}>Linked commits</th>
                  <th style={{width:140}}>Last modified</th>
                </tr>
              </thead>
              <tbody>
                {PB.EVIDENCE.map(e => (
                  <tr key={e.id}>
                    <td><span className="badge outline">{e.kind}</span></td>
                    <td><b style={{fontWeight:500}}>{e.title}</b></td>
                    <td><span className="mono" style={{fontSize:11.5}}>{e.path}</span></td>
                    <td><span className="mono" style={{fontSize:11.5,color:'var(--phase-design)'}}>{e.slug}</span></td>
                    <td className="num">{e.linked_commit_count}</td>
                    <td className="muted" style={{fontSize:11.5,fontFamily:'var(--font-mono)'}}>{PB.fmtDt(e.last_modified_at)}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      </div>
    </div>
  );
}

function PageDossiers() {
  return (
    <div className="page" data-screen-label="Dossiers">
      <div className="page-head">
        <div>
          <h1 className="page-title">Dossiers</h1>
          <p className="page-sub">Rendered JSON & PDF artefacts · sha256-anchored, locale-tagged, packaged for tax authorities.</p>
        </div>
      </div>

      <div className="card">
        <div className="card-head">
          <h3 className="card-title">All artefacts</h3>
          <span className="badge outline">{PB.DOSSIERS.length}</span>
        </div>
        <div className="card-body flush">
          {PB.DOSSIERS.map(d => {
            const session = PB.SESSIONS.find(s => s.id === d.session_id);
            return (
              <div key={d.id} className="dossier-row">
                <div className={`icon-tile ${d.format}`}>{d.format.toUpperCase()}</div>
                <div>
                  <b style={{fontWeight:500,fontSize:13}}>
                    dossier-{session?.fiscal_year}-{session?.id}.{d.format}
                  </b>
                  <div style={{display:'flex',gap:10,alignItems:'center',marginTop:4}}>
                    <span className="digest" style={{fontSize:11,color:'var(--text-secondary)'}}>{session?.denomination}</span>
                    <CopyDigest value={d.sha256} short/>
                    <span className="digest" style={{fontSize:11}}>{d.locale}</span>
                    <span className="digest" style={{fontSize:11}}>{PB.fmtDt(d.generated_at)}</span>
                  </div>
                </div>
                <span className="size">{PB.fmtBytes(d.byte_size)}</span>
                <button className="btn sm ghost"><I.Copy size={11}/></button>
                <button className="btn sm"><I.External size={11}/></button>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
}

function PageAudit() {
  return (
    <div className="page wide" data-screen-label="Audit">
      <div className="page-head">
        <div>
          <h1 className="page-title">Hash chain · audit ledger</h1>
          <p className="page-sub">Append-only · sha256(prev || sorted_payload || timestamp) · independently verifiable.</p>
        </div>
        <div className="page-actions">
          <button className="btn"><I.Refresh size={13}/> Verify now</button>
          <button className="btn"><I.External size={13}/> Export ledger</button>
        </div>
      </div>

      <MetricRail items={[
        { label: 'Anchors',           value: PB.LEDGER_CHAIN.length.toString(), sub: 'append-only entries', accent: true },
        { label: 'Verified',          value: '100%',                            sub: 'last verified ' + PB.fmtDt(new Date(Date.now() - 4 * 3600_000).toISOString()), color: 'var(--status-success)' },
        { label: 'Genesis',           value: PB.LEDGER_CHAIN[0].self.slice(2,10), sub: 'block #' + PB.LEDGER_CHAIN[0].block },
        { label: 'Head',              value: PB.LEDGER_CHAIN.at(-1).self.slice(2,10), sub: 'block #' + PB.LEDGER_CHAIN.at(-1).block },
      ]}/>

      <div style={{marginTop:16}}>
        <HashChainStrip chain={PB.LEDGER_CHAIN}/>
      </div>

      <div className="card" style={{marginTop:16}}>
        <div className="card-head"><h3 className="card-title">Detailed ledger</h3></div>
        <div className="card-body flush">
          <div className="table-wrap">
            <table className="tbl">
              <thead>
                <tr>
                  <th style={{width:80}}>Block</th>
                  <th>Self digest</th>
                  <th>Prev digest</th>
                  <th style={{width:160}}>Timestamp</th>
                  <th style={{width:120}}></th>
                </tr>
              </thead>
              <tbody>
                {PB.LEDGER_CHAIN.map(b => (
                  <tr key={b.block} style={{cursor:'default'}}>
                    <td className="mono">#{b.block}</td>
                    <td><span className="mono" style={{fontSize:11.5}}>{b.self.slice(0,32)}…{b.self.slice(-6)}</span></td>
                    <td><span className="mono muted" style={{fontSize:11.5}}>{b.prev.slice(0,32)}…{b.prev.slice(-6)}</span></td>
                    <td className="muted" style={{fontSize:11.5,fontFamily:'var(--font-mono)'}}>{PB.fmtDt(b.ts)}</td>
                    <td>
                      <span className="rd-yes" style={{fontSize:10}}><I.Check size={10}/> verified</span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      </div>
    </div>
  );
}

function PageSettings({ tweaks, setTweak }) {
  return (
    <div className="page" data-screen-label="Settings">
      <div className="page-head">
        <div>
          <h1 className="page-title">Settings</h1>
          <p className="page-sub">Workspace preferences, classifier defaults, integrations.</p>
        </div>
      </div>

      <div style={{display:'grid',gridTemplateColumns:'200px 1fr',gap:24}}>
        <nav className="settings-nav">
          <a className="active">Workspace</a>
          <a>Classifier defaults</a>
          <a>Repositories</a>
          <a>Integrations</a>
          <a>API tokens</a>
          <a>Audit & retention</a>
          <a>Members</a>
          <a>Billing</a>
        </nav>

        <div>
          <div className="card" style={{margin:0}}>
            <div className="card-head"><h3 className="card-title">Workspace</h3></div>
            <div className="card-body" style={{display:'grid',gridTemplateColumns:'1fr 1fr',gap:14}}>
              <Field label="Organization name">
                <input className="input" defaultValue="Padosoft S.r.l."/>
              </Field>
              <Field label="P.IVA primaria">
                <input className="input mono" defaultValue="01234567890"/>
              </Field>
              <Field label="Default fiscal year">
                <select className="select" defaultValue="2026">
                  <option>2026</option><option>2025</option>
                </select>
              </Field>
              <Field label="Default regime">
                <select className="select" defaultValue="documentazione_idonea">
                  <option value="documentazione_idonea">Documentazione idonea</option>
                  <option value="non_documentazione">Non documentazione</option>
                </select>
              </Field>
            </div>
          </div>

          <div className="card" style={{marginTop:14}}>
            <div className="card-head"><h3 className="card-title">Classifier defaults</h3></div>
            <div className="card-body" style={{display:'grid',gridTemplateColumns:'1fr 1fr',gap:14}}>
              <Field label="Provider">
                <select className="select" defaultValue="anthropic">
                  <option value="anthropic">Anthropic</option>
                  <option value="openai">OpenAI</option>
                </select>
              </Field>
              <Field label="Model">
                <select className="select" defaultValue="claude-haiku-4-5">
                  <option>claude-haiku-4-5</option>
                  <option>claude-sonnet-4-5</option>
                </select>
              </Field>
              <Field label="Default seed prefix">
                <input className="input mono" defaultValue="0xPB-"/>
              </Field>
              <Field label="Cost cap (EUR/run)" hint={`Max allowed by package: €${PB.CAPABILITIES.classifier.cost_cap_eur_per_run}`}>
                <input className="input mono" defaultValue="50"/>
              </Field>
            </div>
          </div>

          <div className="card" style={{marginTop:14}}>
            <div className="card-head"><h3 className="card-title">Theme</h3></div>
            <div className="card-body">
              <div style={{display:'flex',gap:10}}>
                <button className={`btn ${tweaks.theme === 'dark' ? 'pb-primary' : ''}`} onClick={() => setTweak('theme', 'dark')}>
                  <I.Moon size={13}/> Dark · operator
                </button>
                <button className={`btn ${tweaks.theme === 'light' ? 'pb-primary' : ''}`} onClick={() => setTweak('theme', 'light')}>
                  <I.Sun size={13}/> Light · audit
                </button>
              </div>
              <p className="muted" style={{fontSize:12,marginTop:10}}>
                Audit-mode forces the light theme to match printed dossier visuals; operator dark-mode is the default for daily ops.
              </p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

window.PageCommits = PageCommits;
window.PageEvidence = PageEvidence;
window.PageDossiers = PageDossiers;
window.PageAudit = PageAudit;
window.PageSettings = PageSettings;
