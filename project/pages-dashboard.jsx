// ============== Dashboard page ==============

function PageDashboard({ onNavigate, fy }) {
  const k = PB.computeKpis(fy);
  const recent = (fy === 'all' ? PB.SESSIONS : PB.SESSIONS.filter(s => s.fiscal_year === fy)).slice(0, 6);

  return (
    <div className="page wide" data-screen-label="Dashboard">
      <div className="page-head">
        <div>
          <h1 className="page-title">Patent Box dashboard</h1>
          <p className="page-sub">Operative overview · FY {fy === 'all' ? 'all years' : fy} · cryptographically anchored ledger.</p>
        </div>
        <div className="page-actions">
          <button className="btn"><I.External size={13}/> Export</button>
          <button className="btn pb-primary" onClick={() => onNavigate('new-run')}>
            <I.Plus size={13}/> New run
          </button>
        </div>
      </div>

      <MetricRail items={[
        { label: 'Sessions',          value: k.sessions.toLocaleString(),                  sub: 'across ' + k.years + ' fiscal years', accent: true },
        { label: 'Commits classified',value: k.commits.toLocaleString(),                   sub: 'AI-attributed at ' + k.aiPct + '%' },
        { label: 'R&D qualified',     value: k.qualified.toLocaleString(),                 sub: k.qualifiedPct + '% qualification rate', color: 'var(--status-success)' },
        { label: 'Projected cost',    value: PB.fmtEur(k.projected),                       sub: 'cap €' + PB.CAPABILITIES.classifier.cost_cap_eur_per_run + '/run' },
        { label: 'Actual cost',       value: PB.fmtEur(k.actual),                          sub: ((k.actual/k.projected)*100).toFixed(0) + '% of projected' },
        { label: 'Dossiers',          value: k.dossiers,                                   sub: 'JSON & PDF · sha256 anchored' },
      ]}/>

      <div style={{display:'grid',gridTemplateColumns:'1.5fr 1fr',gap:16,marginTop:16}}>
        <div className="card" style={{margin:0}}>
          <div className="card-head">
            <h3 className="card-title">Phase distribution</h3>
            <span className="muted" style={{fontSize:11.5}}>R&D phases per Italian Patent Box · Decreto Crescita</span>
          </div>
          <div className="card-body">
            <PhaseStackedBar data={PB.PHASE_BREAKDOWN_TOTAL}/>
          </div>
        </div>

        <div className="card" style={{margin:0}}>
          <div className="card-head">
            <h3 className="card-title">AI attribution</h3>
            <span className="muted" style={{fontSize:11.5}}>provenance · all commits</span>
          </div>
          <div className="card-body">
            <AiAttributionBar data={PB.AI_BREAKDOWN_TOTAL}/>
            <div style={{marginTop:18,paddingTop:14,borderTop:'1px solid var(--border-subtle)'}}>
              <div style={{display:'flex',justifyContent:'space-between',alignItems:'baseline'}}>
                <span className="muted" style={{fontSize:11}}>Average classifier confidence</span>
                <b style={{fontFamily:'var(--font-mono)',fontSize:13,color:'var(--status-success)'}}>0.873</b>
              </div>
              <div style={{display:'flex',justifyContent:'space-between',alignItems:'baseline',marginTop:8}}>
                <span className="muted" style={{fontSize:11}}>Determinism (re-run match)</span>
                <b style={{fontFamily:'var(--font-mono)',fontSize:13,color:'var(--status-success)'}}>100.0%</b>
              </div>
              <div style={{display:'flex',justifyContent:'space-between',alignItems:'baseline',marginTop:8}}>
                <span className="muted" style={{fontSize:11}}>Cost vs. cap (avg / run)</span>
                <b style={{fontFamily:'var(--font-mono)',fontSize:13}}>€{(k.actual / k.sessions).toFixed(2)} <span style={{color:'var(--text-tertiary)'}}>/ €{PB.CAPABILITIES.classifier.cost_cap_eur_per_run}</span></b>
              </div>
            </div>
          </div>
        </div>
      </div>

      <div style={{marginTop:16}}>
        <HashChainStrip chain={PB.LEDGER_CHAIN}/>
      </div>

      <div className="card" style={{marginTop:16}}>
        <div className="card-head">
          <h3 className="card-title">Recent sessions</h3>
          <button className="btn sm ghost" onClick={() => onNavigate('sessions')}>
            View all <I.ChevronRight size={12}/>
          </button>
        </div>
        <div className="card-body flush">
          <div className="table-wrap">
            <table className="tbl">
              <thead>
                <tr>
                  <th style={{width:110}}>Status</th>
                  <th style={{width:60}}>ID</th>
                  <th>Taxpayer</th>
                  <th style={{width:60}}>FY</th>
                  <th style={{width:100}}>Regime</th>
                  <th className="num" style={{width:80}}>Commits</th>
                  <th className="num" style={{width:140}}>Qualified</th>
                  <th className="num" style={{width:90}}>Cost</th>
                  <th style={{width:140}}>Finished</th>
                </tr>
              </thead>
              <tbody>
                {recent.map(s => {
                  const r = s.summary.commit_count ? s.summary.qualified_commit_count / s.summary.commit_count : 0;
                  return (
                    <tr key={s.id} onClick={() => onNavigate('detail:' + s.id)}>
                      <td><StatusBadgePB status={s.status}/></td>
                      <td className="mono">#{s.id}</td>
                      <td>
                        <b style={{fontWeight:500}}>{s.denomination}</b>
                        <div className="muted" style={{fontSize:11,fontFamily:'var(--font-mono)'}}>{PB.maskPiva(s.p_iva)}</div>
                      </td>
                      <td className="mono">{s.fiscal_year}</td>
                      <td><span className="badge outline" style={{fontSize:10}}>{s.regime === 'documentazione_idonea' ? 'doc.idonea' : 'non.doc.'}</span></td>
                      <td className="num">{s.summary.commit_count}</td>
                      <td className="num">
                        <div style={{display:'flex',alignItems:'center',gap:8,justifyContent:'flex-end'}}>
                          <span className="ratio-bar"><span className="fill" style={{width:(r*100)+'%'}}/></span>
                          <span>{s.summary.qualified_commit_count}</span>
                        </div>
                      </td>
                      <td className="num">{PB.fmtEur(s.cost.actual_eur)}</td>
                      <td className="muted" style={{fontSize:11.5,fontFamily:'var(--font-mono)'}}>{PB.fmtDt(s.finished_at)}</td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </div>
      </div>
    </div>
  );
}

window.PageDashboard = PageDashboard;
