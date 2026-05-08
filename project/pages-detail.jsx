// ============== Session Detail page ==============

function PageDetail({ sessionId, onNavigate }) {
  const session = PB.SESSIONS.find(s => s.id === sessionId) || PB.SESSIONS[0];
  const [tab, setTab] = React.useState('commits');
  const [drawerCommit, setDrawerCommit] = React.useState(null);

  // Build a pipeline matching the session status
  const pipelineFor = (status) => {
    const order = ['pending','running','classified','rendered'];
    const idx = order.indexOf(status);
    return order.map((k, i) => {
      let state = 'pending';
      if (i < idx) state = 'done';
      else if (i === idx) state = status === 'failed' ? 'failed' : 'current';
      return {
        key: k, label: k.charAt(0).toUpperCase() + k.slice(1),
        state, ts: i <= idx ? new Date(Date.parse(session.created_at) + i * 360000).toISOString() : null,
      };
    });
  };
  const pipeline = pipelineFor(session.status);
  const ratio = session.summary.commit_count ? session.summary.qualified_commit_count / session.summary.commit_count : 0;

  return (
    <div className="page wide" data-screen-label={`Session ${sessionId}`}>
      <div className="page-head">
        <div>
          <h1 className="page-title with-id">
            {session.denomination}
            <span className="id">#{session.id}</span>
            <StatusBadgePB status={session.status}/>
          </h1>
          <p className="page-sub">FY {session.fiscal_year} · {session.period.from} → {session.period.to} · {session.regime.replace('_',' ')}</p>
        </div>
        <div className="page-actions">
          <button className="btn"><I.Refresh size={13}/> Refresh</button>
          <button className="btn"><I.External size={13}/> Render JSON</button>
          <button className="btn pb-primary"><I.Send size={13}/> Render PDF</button>
        </div>
      </div>

      {/* Pipeline timeline */}
      <div className="card">
        <div className="card-body" style={{padding:'4px 16px 8px'}}>
          <PipelineTimeline steps={pipeline}/>
        </div>
      </div>

      {/* Metric rail */}
      <div style={{marginTop:16}}>
        <MetricRail items={[
          { label: 'Commits',          value: session.summary.commit_count.toLocaleString(),                           sub: session.summary.repository_count + ' repositories' },
          { label: 'R&D qualified',    value: session.summary.qualified_commit_count.toLocaleString(),                  sub: (ratio*100).toFixed(1) + '% of total', color: 'var(--status-success)' },
          { label: 'Projected cost',   value: PB.fmtEur(session.cost.projected_eur),                                    sub: 'cap €' + PB.CAPABILITIES.classifier.cost_cap_eur_per_run + '/run' },
          { label: 'Actual cost',      value: PB.fmtEur(session.cost.actual_eur),                                       sub: session.classifier.provider + ' · ' + session.classifier.model },
          { label: 'Classifier seed',  value: session.classifier.seed.toString().slice(0,7),                            sub: 'deterministic · v1' },
          { label: 'Started',          value: PB.fmtDt(session.created_at).slice(11),                                   sub: PB.fmtDt(session.created_at).slice(0,10) },
        ]}/>
      </div>

      {/* Hash chain + repos side by side */}
      <div style={{display:'grid',gridTemplateColumns:'1.2fr 1fr',gap:16,marginTop:16}}>
        <HashChainStrip chain={session.chain}/>
        <div className="card" style={{margin:0}}>
          <div className="card-head" style={{padding:'8px 14px'}}>
            <h3 className="card-title">Repositories</h3>
            <span className="badge outline">{PB.REPOS_1042.length}</span>
          </div>
          <div className="card-body flush">
            {PB.REPOS_1042.map((r,i) => {
              const rr = r.commit_count ? r.qualified / r.commit_count : 0;
              return (
                <div key={i} className="repo-line">
                  <span className={`role-tag ${r.role}`}>{r.role.replace('_',' ')}</span>
                  <span className="mono" style={{fontSize:12}}>{r.path}</span>
                  <span className="mono muted" style={{fontSize:11.5}}>{r.commit_count} commits</span>
                  <div style={{display:'flex',alignItems:'center',gap:8}}>
                    <span className="ratio-bar"><span className="fill" style={{width:(rr*100)+'%'}}/></span>
                    <span className="mono" style={{fontSize:11.5,minWidth:30,textAlign:'right'}}>{r.qualified}</span>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      </div>

      {/* Phase + AI */}
      <div style={{display:'grid',gridTemplateColumns:'1.1fr 0.9fr',gap:16,marginTop:16}}>
        <div className="card">
          <div className="card-head">
            <h3 className="card-title">Phase breakdown</h3>
            <span className="badge outline">{PB.PHASE_BREAKDOWN_1042.reduce((a,d)=>a+d.count,0)} commits</span>
          </div>
          <div className="card-body"><PhaseStackedBar data={PB.PHASE_BREAKDOWN_1042}/></div>
        </div>
        <div className="card">
          <div className="card-head"><h3 className="card-title">AI attribution</h3></div>
          <div className="card-body"><AiAttributionBar data={PB.AI_BREAKDOWN_1042}/></div>
        </div>
      </div>

      {/* Tabs */}
      <div style={{marginTop:24}}>
        <div className="tabs">
          {[
            { k:'commits',  l:'Commits',  c: session.summary.commit_count },
            { k:'evidence', l:'Evidence', c: PB.EVIDENCE.length },
            { k:'dossiers', l:'Dossiers', c: PB.DOSSIERS_1042.length },
            { k:'json',     l:'JSON Payload' },
          ].map(t => (
            <div key={t.k} className={`tab ${tab === t.k ? 'active' : ''}`} onClick={() => setTab(t.k)}>
              {t.l}{t.c != null && <span className="badge outline">{t.c}</span>}
            </div>
          ))}
        </div>
        <div style={{marginTop:14}}>
          {tab === 'commits' && <CommitsTab onOpen={setDrawerCommit}/>}
          {tab === 'evidence' && <EvidenceTab/>}
          {tab === 'dossiers' && <DossiersTab/>}
          {tab === 'json' && <JsonPayloadTab session={session}/>}
        </div>
      </div>

      <CommitDrawer commit={drawerCommit} onClose={() => setDrawerCommit(null)}/>
    </div>
  );
}

function CommitsTab({ onOpen }) {
  const [phase, setPhase] = React.useState('all');
  const [rd, setRd] = React.useState('all');
  const [q, setQ] = React.useState('');
  let rows = PB.COMMITS;
  if (phase !== 'all') rows = rows.filter(c => c.phase === phase);
  if (rd === 'yes') rows = rows.filter(c => c.is_rd_qualified);
  if (rd === 'no') rows = rows.filter(c => !c.is_rd_qualified);
  if (q) rows = rows.filter(c => (c.sha + ' ' + c.message_subject + ' ' + c.author_email).toLowerCase().includes(q.toLowerCase()));

  return (
    <div className="card">
      <div className="card-head" style={{padding:'10px 12px',gap:8,flexWrap:'wrap'}}>
        <div style={{display:'flex',gap:6,alignItems:'center',flexWrap:'wrap'}}>
          <button className={`chip ${phase==='all'?'active':''}`} onClick={()=>setPhase('all')}>All phases</button>
          {PB.PHASES.map(p => (
            <button key={p.key} className={`chip ${phase===p.key?'active':''}`} onClick={()=>setPhase(p.key)}>
              {p.label}
            </button>
          ))}
        </div>
        <div style={{display:'flex',gap:6,alignItems:'center'}}>
          <select className="select" style={{width:130}} value={rd} onChange={e=>setRd(e.target.value)}>
            <option value="all">R&D · all</option>
            <option value="yes">R&D · qualified</option>
            <option value="no">R&D · rejected</option>
          </select>
          <input className="input" style={{width:200}} placeholder="SHA, message, author…"
                 value={q} onChange={e=>setQ(e.target.value)}/>
        </div>
      </div>
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
                <tr key={c.id} onClick={() => onOpen(c)}>
                  <td><span className="mono" style={{fontSize:12}}>{c.short_sha}</span></td>
                  <td>
                    <div style={{fontWeight:500,fontSize:13}}>{c.message_subject}</div>
                    <div className="muted" style={{fontSize:11,marginTop:2,display:'flex',gap:8,alignItems:'center'}}>
                      <span className={`role-tag ${c.repository_role}`} style={{fontSize:9,padding:'1px 5px'}}>{c.repository_role.replace('_',' ')}</span>
                      <span className="mono">{c.repository_path}</span>
                      <span className="mono">· {c.branch_name_canonical}</span>
                    </div>
                  </td>
                  <td><PhaseBadge phase={c.phase}/></td>
                  <td>{c.is_rd_qualified
                    ? <span className="rd-yes"><I.Check size={11}/> Yes</span>
                    : <span className="rd-no">— No</span>}</td>
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
  );
}

function EvidenceTab() {
  return (
    <div className="card">
      <div className="card-body flush">
        <div className="table-wrap">
          <table className="tbl">
            <thead>
              <tr>
                <th style={{width:110}}>Kind</th>
                <th>Title</th>
                <th>Path</th>
                <th>Slug</th>
                <th className="num" style={{width:120}}>Linked commits</th>
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
  );
}

function DossiersTab() {
  return (
    <div className="card">
      <div className="card-head">
        <h3 className="card-title">Rendered artefacts</h3>
        <div style={{display:'flex',gap:6}}>
          <button className="btn sm">Render JSON</button>
          <button className="btn sm pb-primary"><I.Send size={11}/> Render PDF</button>
        </div>
      </div>
      <div className="card-body flush">
        {PB.DOSSIERS_1042.map(d => (
          <div key={d.id} className="dossier-row">
            <div className={`icon-tile ${d.format}`}>{d.format.toUpperCase()}</div>
            <div>
              <b style={{fontWeight:500,fontSize:13}}>dossier-{d.id}.{d.format}</b>
              <div style={{display:'flex',gap:10,alignItems:'center',marginTop:4}}>
                <CopyDigest value={d.sha256} short/>
                <span className="digest" style={{fontSize:11}}>locale {d.locale}</span>
                <span className="digest" style={{fontSize:11}}>{PB.fmtDt(d.generated_at)}</span>
              </div>
            </div>
            <span className="size">{PB.fmtBytes(d.byte_size)}</span>
            <button className="btn sm ghost"><I.Copy size={11}/></button>
            <button className="btn sm"><I.External size={11}/> Download</button>
          </div>
        ))}
      </div>
    </div>
  );
}

function JsonPayloadTab({ session }) {
  const payload = {
    session: { id: session.id, status: session.status, denomination: session.denomination, fiscal_year: session.fiscal_year, p_iva: session.p_iva, regime: session.regime },
    period: session.period,
    classifier: session.classifier,
    cost: session.cost,
    summary: session.summary,
    chain: session.chain,
    repositories: PB.REPOS_1042,
    phase_breakdown: PB.PHASE_BREAKDOWN_1042,
  };
  return (
    <div className="card">
      <div className="card-head">
        <h3 className="card-title">JSON payload preview</h3>
        <button className="btn sm"><I.Copy size={11}/> Copy</button>
      </div>
      <div className="card-body">
        <pre className="code-block" dangerouslySetInnerHTML={{__html: jsonHighlight(payload)}}/>
      </div>
    </div>
  );
}

function CommitDrawer({ commit, onClose }) {
  return (
    <Drawer open={!!commit} onClose={onClose}
            title={commit ? <>Commit · <span className="mono" style={{fontSize:12,color:'var(--text-secondary)'}}>{commit.short_sha}</span></> : ''}
            actions={commit && (
              <button className="btn sm"><I.Copy size={11}/> Copy SHA</button>
            )}>
      {commit && (
        <div>
          <div className="insp-section">
            <h4>Subject</h4>
            <p style={{fontWeight:500,fontSize:14,marginBottom:6}}>{commit.message_subject}</p>
            <div style={{display:'flex',gap:8,flexWrap:'wrap',marginTop:10}}>
              <PhaseBadge phase={commit.phase}/>
              {commit.is_rd_qualified
                ? <span className="rd-yes"><I.Check size={11}/> R&D qualified</span>
                : <span className="rd-no">Not qualified</span>}
              <AiPill kind={commit.ai_attribution}/>
              <Confidence value={commit.rd_qualification_confidence}/>
            </div>
          </div>

          <div className="insp-section">
            <h4>Rationale</h4>
            <p>{commit.rationale}</p>
            {commit.rejected_phase && (
              <div style={{marginTop:8,fontSize:11.5,color:'var(--text-tertiary)'}}>
                Initial classification rejected: <PhaseBadge phase={commit.rejected_phase}/>
              </div>
            )}
          </div>

          <div className="insp-section">
            <h4>Evidence used</h4>
            {commit.evidence_used.length === 0
              ? <p style={{color:'var(--text-tertiary)'}}>—</p>
              : commit.evidence_used.map(s => (
                <span key={s} className="insp-evidence">
                  <I.Definitions size={11} className="icon"/>
                  {s}
                </span>
              ))}
          </div>

          <div className="insp-section">
            <h4>Repository & branch</h4>
            <dl className="kv compact">
              <dt>Path</dt><dd>{commit.repository_path}</dd>
              <dt>Role</dt><dd><span className={`role-tag ${commit.repository_role}`}>{commit.repository_role.replace('_',' ')}</span></dd>
              <dt>Branch</dt><dd>{commit.branch_name_canonical}</dd>
              <dt>Author</dt><dd style={{fontFamily:'var(--font-sans)'}}>{commit.author_name} &lt;{commit.author_email}&gt;</dd>
              <dt>Committed</dt><dd>{PB.fmtDt(commit.committed_at)}</dd>
              <dt>Files</dt><dd>{commit.files_changed_count} · +{commit.insertions} −{commit.deletions}</dd>
            </dl>
          </div>

          <div className="insp-section">
            <h4>Hash chain link</h4>
            <div className="chain-link">
              <div className="digest">
                <small>prev</small>
                {commit.hash_chain.prev.slice(0,16)}…{commit.hash_chain.prev.slice(-6)}
              </div>
              <div className="arrow"><I.ArrowRight size={14}/></div>
              <div className="digest">
                <small>self</small>
                {commit.hash_chain.self.slice(0,16)}…{commit.hash_chain.self.slice(-6)}
              </div>
            </div>
          </div>

          <div className="insp-section">
            <h4>Raw</h4>
            <pre className="code-block" style={{fontSize:11}} dangerouslySetInnerHTML={{__html: jsonHighlight(commit)}}/>
          </div>
        </div>
      )}
    </Drawer>
  );
}

window.PageDetail = PageDetail;
