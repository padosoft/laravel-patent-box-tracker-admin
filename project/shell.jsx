// ============== Patent Box admin — Shell (Sidebar + Topbar + ⌘K) ==============

function PBSidebar({ route, onNavigate, fy, onFy, sessionsCount }) {
  const operate = [
    { key: 'dashboard', label: 'Dashboard', icon: <I.Home size={15}/> },
    { key: 'sessions',  label: 'Sessions',  icon: <I.Runs size={15}/>, badge: sessionsCount },
    { key: 'newrun',    label: 'New run',   icon: <I.Play size={14}/> },
  ];
  const inspect = [
    { key: 'commits',   label: 'Commits',   icon: <I.Hash size={15}/> },
    { key: 'evidence',  label: 'Evidence',  icon: <I.Definitions size={15}/> },
    { key: 'dossiers',  label: 'Dossiers',  icon: <I.Outbox size={15}/> },
  ];
  const config = [
    { key: 'integrity', label: 'Integrity', icon: <I.Approvals size={15}/> },
    { key: 'settings',  label: 'Settings',  icon: <I.Settings size={15}/> },
  ];
  const Item = ({ it }) => (
    <div className={`nav-item ${route === it.key ? 'active' : ''}`}
         onClick={() => onNavigate(it.key)}>
      {it.icon}
      <span>{it.label}</span>
      {it.badge != null && <span className="badge">{it.badge}</span>}
    </div>
  );
  return (
    <aside className="sidebar">
      <div className="sidebar-brand">
        <div className="brand-mark">PB</div>
        <div className="brand-text">
          <span>Patent Box</span>
          <small>admin · v1</small>
        </div>
      </div>
      <div className="fy-pill" title="Active fiscal year">
        <span className="lbl">FY</span>
        <select className="yr"
                style={{background:'transparent',border:0,outline:0,color:'inherit',fontFamily:'var(--font-mono)',fontWeight:600,fontSize:13}}
                value={fy} onChange={(e) => onFy(e.target.value)}>
          <option value="2026">2026</option>
          <option value="2025">2025</option>
          <option value="2024">2024</option>
          <option value="all">All</option>
        </select>
        <I.ChevronDown size={12}/>
      </div>
      <div className="api-status" title="Tracker API connection">
        <span className="ind"></span>
        <span className="lbl">Tracker API · v1</span>
        <span className="latency">42ms</span>
      </div>
      <nav className="sidebar-nav">
        <div className="nav-section">
          <div className="nav-label">Operate</div>
          {operate.map(it => <Item key={it.key} it={it}/>)}
        </div>
        <div className="nav-section">
          <div className="nav-label">Inspect</div>
          {inspect.map(it => <Item key={it.key} it={it}/>)}
        </div>
        <div className="nav-section">
          <div className="nav-label">Configure</div>
          {config.map(it => <Item key={it.key} it={it}/>)}
        </div>
      </nav>
      <div className="sidebar-footer">
        <div className="user-chip">
          <div className="avatar">LP</div>
          <div className="user-info">
            <b>Lorenzo Padovani</b>
            <small>compliance · padosoft</small>
          </div>
        </div>
        <button className="iconbtn" title="Account"><I.ChevronDown size={14}/></button>
      </div>
    </aside>
  );
}

function PBTopbar({ route, sessionId, theme, onTheme, autoRefresh, onAutoRefresh, onOpenPalette, lastTick, onNavigate }) {
  const labels = {
    dashboard: 'Dashboard', sessions: 'Sessions', newrun: 'New run',
    commits: 'Commits', evidence: 'Evidence', dossiers: 'Dossiers',
    integrity: 'Integrity', settings: 'Settings', detail: 'Session detail',
  };
  return (
    <header className="topbar">
      <div className="crumbs">
        <span className="muted">Patent Box</span>
        <span className="sep"><I.ChevronRight size={12}/></span>
        {route === 'detail' ? (
          <>
            <span className="muted" style={{cursor:'pointer'}} onClick={() => onNavigate('sessions')}>Sessions</span>
            <span className="sep"><I.ChevronRight size={12}/></span>
            <b className="mono" style={{fontFamily:'var(--font-mono)'}}>#{sessionId}</b>
          </>
        ) : (
          <b>{labels[route] || route}</b>
        )}
      </div>
      <div className="topbar-spacer"/>

      <span className="live-pill" title="Tracker API live status">
        <span className="pulse"/>
        <span>Live</span>
        <span style={{opacity:0.7,marginLeft:4}}>· {fmtTime(lastTick)}</span>
      </span>

      <button className="search-trigger" onClick={onOpenPalette}>
        <I.Search size={13}/>
        <span>Search sessions, commits, evidence…</span>
        <span className="kbd">⌘K</span>
      </button>

      <button className="iconbtn"
              onClick={() => onAutoRefresh(!autoRefresh)}
              title={autoRefresh ? 'Pause polling' : 'Resume polling'}>
        {autoRefresh ? <I.Pause size={14}/> : <I.Play size={14}/>}
      </button>
      <button className="iconbtn" title="Notifications"><I.Bell size={14}/></button>
      <button className="iconbtn" onClick={() => onTheme(theme === 'dark' ? 'light' : 'dark')}
              title="Toggle theme">
        {theme === 'dark' ? <I.Sun size={14}/> : <I.Moon size={14}/>}
      </button>
    </header>
  );
}

// Command palette tuned to PB
function PBPalette({ open, onClose, onNavigate, onOpenSession }) {
  const [q, setQ] = React.useState('');
  const [active, setActive] = React.useState(0);
  const inputRef = React.useRef(null);

  React.useEffect(() => {
    if (open) { setQ(''); setActive(0); setTimeout(() => inputRef.current?.focus(), 30); }
  }, [open]);

  const navItems = [
    { kind: 'nav', label: 'Dashboard',  icon: <I.Home size={14}/>,        action: () => onNavigate('dashboard') },
    { kind: 'nav', label: 'Sessions',   icon: <I.Runs size={14}/>,        action: () => onNavigate('sessions') },
    { kind: 'nav', label: 'New run',    icon: <I.Play size={13}/>,        action: () => onNavigate('newrun') },
    { kind: 'nav', label: 'Commits',    icon: <I.Hash size={14}/>,        action: () => onNavigate('commits') },
    { kind: 'nav', label: 'Evidence',   icon: <I.Definitions size={14}/>, action: () => onNavigate('evidence') },
    { kind: 'nav', label: 'Dossiers',   icon: <I.Outbox size={14}/>,      action: () => onNavigate('dossiers') },
    { kind: 'nav', label: 'Integrity',  icon: <I.Approvals size={14}/>,   action: () => onNavigate('integrity') },
    { kind: 'nav', label: 'Settings',   icon: <I.Settings size={14}/>,    action: () => onNavigate('settings') },
  ];

  const results = React.useMemo(() => {
    const ql = q.toLowerCase();
    const sessions = PB.SESSIONS.map(s => ({
      kind: 'sess', label: s.denomination + ' · FY' + s.fiscal_year,
      meta: '#' + s.id, icon: <I.Runs size={14}/>,
      action: () => onOpenSession(s.id),
    }));
    if (!ql) {
      return [
        { section: 'Navigate', items: navItems },
        { section: 'Recent sessions', items: sessions.slice(0, 5) },
      ];
    }
    const navMatch = navItems.filter(i => i.label.toLowerCase().includes(ql));
    const sessMatch = sessions.filter(s =>
      s.label.toLowerCase().includes(ql) || s.meta.includes(ql)
    ).slice(0, 8);
    const cmtMatch = PB.COMMITS.filter(c =>
      c.short_sha.includes(ql) || c.message_subject.toLowerCase().includes(ql)
    ).slice(0, 5).map(c => ({
      kind: 'cmt', label: c.message_subject, meta: c.short_sha,
      icon: <I.Hash size={14}/>, action: () => onNavigate('commits'),
    }));
    const sections = [];
    if (navMatch.length) sections.push({ section: 'Navigate', items: navMatch });
    if (sessMatch.length) sections.push({ section: 'Sessions', items: sessMatch });
    if (cmtMatch.length) sections.push({ section: 'Commits', items: cmtMatch });
    return sections;
  }, [q]);

  const flat = results.flatMap(s => s.items);
  React.useEffect(() => {
    if (!open) return;
    const onKey = (e) => {
      if (e.key === 'Escape') { e.preventDefault(); onClose(); }
      else if (e.key === 'ArrowDown') { e.preventDefault(); setActive(a => Math.min(flat.length - 1, a + 1)); }
      else if (e.key === 'ArrowUp') { e.preventDefault(); setActive(a => Math.max(0, a - 1)); }
      else if (e.key === 'Enter') { e.preventDefault(); const it = flat[active]; if (it) { it.action(); onClose(); } }
    };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [open, flat, active, onClose]);

  if (!open) return null;
  let runningIdx = 0;
  return (
    <>
      <div className="overlay" onClick={onClose}/>
      <div className="palette">
        <input ref={inputRef} className="palette-input" placeholder="Search sessions, commits, evidence, or jump to a page…"
               value={q} onChange={e => { setQ(e.target.value); setActive(0); }}/>
        <div className="palette-list">
          {results.length === 0 && <div className="empty" style={{padding:'32px 16px'}}>No results</div>}
          {results.map((sec, si) => (
            <div key={si}>
              <div className="palette-section">{sec.section}</div>
              {sec.items.map((it, ii) => {
                const idx = runningIdx++;
                return (
                  <div key={ii}
                       className={`palette-item ${idx === active ? 'active' : ''}`}
                       onMouseEnter={() => setActive(idx)}
                       onClick={() => { it.action(); onClose(); }}>
                    <span className="icon">{it.icon}</span>
                    <span>{it.label}</span>
                    {it.meta && <span className="meta">{it.meta}</span>}
                  </div>
                );
              })}
            </div>
          ))}
        </div>
        <div className="palette-foot">
          <span><span className="kbd">↑↓</span> Navigate</span>
          <span><span className="kbd">↵</span> Open</span>
          <span><span className="kbd">esc</span> Close</span>
        </div>
      </div>
    </>
  );
}

// === Reusable building blocks for PB pages ===

function PhaseBadge({ phase, count }) {
  const meta = PB.PHASES.find(p => p.key === phase) || { label: phase };
  return (
    <span className={`phase ${phase}`}>
      <span className="swatch"/>
      {meta.label}
      {count != null && <span style={{opacity:0.7,marginLeft:4}}>{count}</span>}
    </span>
  );
}

function AiPill({ kind }) {
  const meta = PB.AI_KINDS.find(k => k.key === kind) || { label: kind };
  return (
    <span className={`ai-pill ${kind}`}>
      <span className="sw"/>
      {meta.label}
    </span>
  );
}

function Confidence({ value }) {
  const cls = value >= 0.8 ? '' : value >= 0.5 ? 'med' : 'low';
  return (
    <span className={`confidence ${cls}`}>
      <span className="track"><span className="fill" style={{width: (value*100)+'%'}}/></span>
      <span>{value.toFixed(2)}</span>
    </span>
  );
}

function PhaseStackedBar({ data }) {
  const total = data.reduce((a, d) => a + d.count, 0);
  return (
    <>
      <div className="phase-bar">
        {data.filter(d => d.count > 0).map(d => (
          <div key={d.phase} className={`phase-bar-seg ${d.phase}`}
               style={{ width: (d.count / total * 100) + '%' }}
               title={`${d.phase}: ${d.count}`}/>
        ))}
      </div>
      <div className="phase-legend">
        {data.map(d => (
          <div key={d.phase} className="row">
            <div className="name"><span className={`sw ${d.phase}`}/>{(PB.PHASES.find(p => p.key === d.phase) || {}).label}</div>
            <div className="num">{d.count}</div>
            <div className="pct">{total ? ((d.count / total) * 100).toFixed(1) : '0.0'}%</div>
          </div>
        ))}
      </div>
    </>
  );
}

function AiAttributionBar({ data }) {
  const total = data.reduce((a, d) => a + d.count, 0) || 1;
  return (
    <>
      <div className="ai-bar">
        {data.map(d => (
          <div key={d.kind} className={`seg ${d.kind}`}
               style={{ width: (d.count / total * 100) + '%' }}>
            {d.pct >= 8 ? `${d.pct.toFixed(0)}%` : ''}
          </div>
        ))}
      </div>
      <div style={{display:'flex',gap:14,marginTop:10,fontSize:12}}>
        {data.map(d => (
          <div key={d.kind} style={{display:'flex',alignItems:'center',gap:6}}>
            <AiPill kind={d.kind}/>
            <span style={{fontFamily:'var(--font-mono)',color:'var(--text-secondary)'}}>{d.count}</span>
          </div>
        ))}
      </div>
    </>
  );
}

function HashChainStrip({ chain, compact }) {
  // Accept either a chain-summary object or an array of ledger blocks
  if (Array.isArray(chain)) {
    const head = chain.length ? chain[chain.length - 1].self : null;
    chain = head ? { head, verified: true, commit_count: chain.length } : null;
  }
  if (!chain) {
    return (
      <div className="hashchain unverified" style={{borderLeftColor:'var(--text-tertiary)',background:'var(--bg-subtle)'}}>
        <div className="hashchain-icon" style={{background:'var(--bg-active)',color:'var(--text-tertiary)'}}>
          <I.Clock size={18}/>
        </div>
        <div className="hashchain-body">
          <div className="lbl">Hash chain</div>
          <div className="head"><b>Awaiting classification</b></div>
        </div>
        <div/>
      </div>
    );
  }
  return (
    <div className={`hashchain ${chain.verified ? '' : 'unverified'}`}>
      <div className="hashchain-icon">
        {chain.verified ? <I.Check size={20}/> : <I.AlertTriangle size={18}/>}
      </div>
      <div className="hashchain-body">
        <div className="lbl">{chain.verified ? 'Hash chain verified' : 'Hash chain failed'} · SHA-256 head</div>
        <div className="head">
          <b>{chain.head.slice(0,16)}…{chain.head.slice(-8)}</b>
          <small>{chain.commit_count} commits linked</small>
        </div>
      </div>
      {!compact && (
        <div className="hashchain-blocks">
          <span className="blk"/><span className="blk"/><span className="blk"/>
          <span className="arrow">→</span>
          <span className="blk"/><span className="blk"/><span className="blk"/>
          <span className="arrow">→</span>
          <span className="blk"/><span className="blk"/>
        </div>
      )}
    </div>
  );
}

function PipelineTimeline({ steps }) {
  return (
    <div className="pipeline">
      {steps.map(s => (
        <div key={s.key} className={`pipeline-step ${s.state}`}>
          <span className="node"/>
          <div>
            <div className="nm">{s.label}</div>
            <div className="ts">{s.ts ? PB.fmtDt(s.ts) : '—'}</div>
          </div>
        </div>
      ))}
    </div>
  );
}

function MetricRail({ items }) {
  return (
    <div className="metric-rail">
      {items.map((m, i) => (
        <div key={i} className="metric-cell">
          <div className="lbl">{m.label}</div>
          <div className="val" style={m.color ? { color: m.color } : null}>{m.value}</div>
          {m.sub && <div className="sub">{m.sub}</div>}
        </div>
      ))}
    </div>
  );
}

function CopyDigest({ value, short }) {
  const display = short ? (value.slice(0,10) + '…' + value.slice(-6)) : value;
  return (
    <button className="digest-copy" onClick={(e) => {
      e.stopPropagation();
      navigator.clipboard?.writeText(value);
    }} title="Copy digest">
      <I.Copy size={11} className="ico"/>
      <span>{display}</span>
    </button>
  );
}

function StatusBadgePB({ status }) {
  return <StatusBadge status={PB.statusBadge(status)} />;
}

Object.assign(window, {
  PBSidebar, PBTopbar, PBPalette,
  PhaseBadge, AiPill, Confidence,
  PhaseStackedBar, AiAttributionBar, HashChainStrip,
  PipelineTimeline, MetricRail, CopyDigest, StatusBadgePB,
});
