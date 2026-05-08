// ============== Sessions list page ==============

function PageSessions({ onOpenSession, fy, onFy }) {
  const [statusFilter, setStatusFilter] = React.useState('all');
  const [regimeFilter, setRegimeFilter] = React.useState('all');
  const [q, setQ] = React.useState('');

  let rows = PB.SESSIONS;
  if (fy !== 'all') rows = rows.filter(s => s.fiscal_year === fy);
  if (statusFilter !== 'all') rows = rows.filter(s => s.status === statusFilter);
  if (regimeFilter !== 'all') rows = rows.filter(s => s.regime === regimeFilter);
  if (q) rows = rows.filter(s => (s.denomination + ' ' + s.id + ' ' + s.p_iva).toLowerCase().includes(q.toLowerCase()));

  const counts = PB.SESSIONS.reduce((a,s) => ({ ...a, [s.status]: (a[s.status]||0)+1 }), { all: PB.SESSIONS.length });

  return (
    <div className="page wide" data-screen-label="Sessions">
      <div className="page-head">
        <div>
          <h1 className="page-title">Sessions</h1>
          <p className="page-sub">Patent Box tracking sessions across fiscal years and taxpayers.</p>
        </div>
        <div className="page-actions">
          <button className="btn"><I.External size={13}/> Export CSV</button>
          <button className="btn pb-primary"><I.Plus size={13}/> New run</button>
        </div>
      </div>

      <div className="filter-bar">
        {['all','pending','running','classified','rendered','failed'].map(s => (
          <button key={s} className={`chip ${statusFilter === s ? 'active' : ''}`} onClick={() => setStatusFilter(s)}>
            {s === 'all' ? 'All' : PB.statusLabel(s)}
            <span className="count">{counts[s] || 0}</span>
          </button>
        ))}
        <span style={{flex:1}}/>
        <select className="select" style={{width:200}} value={regimeFilter} onChange={e => setRegimeFilter(e.target.value)}>
          <option value="all">All regimes</option>
          <option value="documentazione_idonea">Documentazione idonea</option>
          <option value="non_documentazione">Non documentazione</option>
        </select>
        <select className="select" style={{width:120}} value={fy} onChange={e => onFy(e.target.value)}>
          <option value="all">All FY</option>
          <option value="2026">FY 2026</option>
          <option value="2025">FY 2025</option>
          <option value="2024">FY 2024</option>
        </select>
        <input className="input" style={{width:240}} placeholder="Search denomination, P.IVA, ID…"
               value={q} onChange={e => setQ(e.target.value)}/>
      </div>

      <div className="card">
        <div className="card-body flush">
          <div className="table-wrap">
            <table className="tbl">
              <thead>
                <tr>
                  <th style={{width:110}}>Status</th>
                  <th style={{width:60}}>ID</th>
                  <th>Taxpayer</th>
                  <th style={{width:60}}>FY</th>
                  <th>Period</th>
                  <th style={{width:90}}>Regime</th>
                  <th className="num" style={{width:80}}>Repos</th>
                  <th className="num" style={{width:80}}>Commits</th>
                  <th className="num" style={{width:140}}>Qualified</th>
                  <th className="num" style={{width:90}}>Projected</th>
                  <th className="num" style={{width:90}}>Actual</th>
                  <th style={{width:140}}>Finished</th>
                  <th style={{width:80}}></th>
                </tr>
              </thead>
              <tbody>
                {rows.length === 0 && (
                  <tr><td colSpan={13}><div className="empty">No sessions match the filters</div></td></tr>
                )}
                {rows.map(s => {
                  const ratio = s.summary.commit_count ? s.summary.qualified_commit_count / s.summary.commit_count : 0;
                  return (
                    <tr key={s.id} onClick={() => onOpenSession(s.id)}>
                      <td><StatusBadgePB status={s.status}/></td>
                      <td className="mono">#{s.id}</td>
                      <td>
                        <b style={{fontWeight:500}}>{s.denomination}</b>
                        <div className="muted" style={{fontSize:11,fontFamily:'var(--font-mono)'}}>{PB.maskPiva(s.p_iva)}</div>
                      </td>
                      <td className="mono">{s.fiscal_year}</td>
                      <td className="muted" style={{fontSize:11.5,fontFamily:'var(--font-mono)'}}>{s.period.from} → {s.period.to}</td>
                      <td><span className="badge outline" style={{fontSize:10}}>{s.regime === 'documentazione_idonea' ? 'doc.idonea' : 'non.doc.'}</span></td>
                      <td className="num">{s.summary.repository_count}</td>
                      <td className="num">{s.summary.commit_count}</td>
                      <td className="num">
                        <div style={{display:'flex',alignItems:'center',gap:8,justifyContent:'flex-end'}}>
                          <span className="ratio-bar"><span className="fill" style={{width:(ratio*100)+'%'}}/></span>
                          <span>{s.summary.qualified_commit_count}</span>
                        </div>
                      </td>
                      <td className="num">{PB.fmtEur(s.cost.projected_eur)}</td>
                      <td className="num">{PB.fmtEur(s.cost.actual_eur)}</td>
                      <td className="muted" style={{fontSize:11.5,fontFamily:'var(--font-mono)'}}>{PB.fmtDt(s.finished_at)}</td>
                      <td>
                        <button className="btn sm ghost" onClick={(e) => { e.stopPropagation(); onOpenSession(s.id); }}>
                          Open
                        </button>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </div>
        <div className="pagination">
          <span>Showing {rows.length} of {PB.SESSIONS.length}</span>
          <div className="pagination-controls">
            <button className="btn sm ghost"><I.ChevronLeft size={12}/></button>
            <span style={{padding:'0 8px',fontFamily:'var(--font-mono)'}}>1 / 1</span>
            <button className="btn sm ghost"><I.ChevronRight size={12}/></button>
          </div>
        </div>
      </div>
    </div>
  );
}

window.PageSessions = PageSessions;
