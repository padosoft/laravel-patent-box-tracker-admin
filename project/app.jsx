// ============== App root — Patent Box admin ==============

const TWEAK_DEFAULTS = /*EDITMODE-BEGIN*/{
  "theme": "dark",
  "density": "regular",
  "accent": "deep_cyan",
  "showHashChainStrip": true,
  "showLivePill": true,
  "phaseChartStyle": "stacked"
}/*EDITMODE-END*/;

function App() {
  const [tweaks, setTweak] = useTweaks(TWEAK_DEFAULTS);
  const [route, setRoute] = React.useState('dashboard');
  const [sessionId, setSessionId] = React.useState(1042);
  const [fy, setFy] = React.useState('2026');
  const [autoRefresh, setAutoRefresh] = React.useState(true);
  const [paletteOpen, setPaletteOpen] = React.useState(false);
  const [lastTick, setLastTick] = React.useState(Date.now());

  // Apply theme
  React.useEffect(() => {
    document.documentElement.dataset.theme = tweaks.theme;
    document.documentElement.dataset.density = tweaks.density;
  }, [tweaks.theme, tweaks.density]);

  // ⌘K
  React.useEffect(() => {
    const onKey = (e) => {
      if ((e.metaKey || e.ctrlKey) && e.key.toLowerCase() === 'k') {
        e.preventDefault();
        setPaletteOpen(o => !o);
      }
    };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, []);

  // Live ticker
  React.useEffect(() => {
    if (!autoRefresh) return;
    const t = setInterval(() => setLastTick(Date.now()), 4000);
    return () => clearInterval(t);
  }, [autoRefresh]);

  const navigate = (r) => {
    if (r.startsWith('detail:')) {
      setSessionId(parseInt(r.slice(7), 10));
      setRoute('detail');
    } else if (r === 'newrun' || r === 'new-run') {
      setRoute('newrun');
    } else {
      setRoute(r);
    }
  };
  const openSession = (id) => { setSessionId(id); setRoute('detail'); };

  let page;
  if (route === 'dashboard') page = <PageDashboard onNavigate={navigate} fy={fy}/>;
  else if (route === 'sessions') page = <PageSessions onOpenSession={openSession} fy={fy} onFy={setFy}/>;
  else if (route === 'detail') page = <PageDetail sessionId={sessionId} onNavigate={navigate}/>;
  else if (route === 'newrun') page = <PageNewRun onCancel={() => setRoute('sessions')} onLaunched={() => setRoute('sessions')}/>;
  else if (route === 'commits') page = <PageCommits onOpenSession={openSession}/>;
  else if (route === 'evidence') page = <PageEvidence/>;
  else if (route === 'dossiers') page = <PageDossiers/>;
  else if (route === 'integrity') page = <PageAudit/>;
  else if (route === 'settings') page = <PageSettings tweaks={tweaks} setTweak={setTweak}/>;
  else page = <PageDashboard onNavigate={navigate} fy={fy}/>;

  return (
    <div className="app">
      <PBSidebar route={route} onNavigate={navigate} fy={fy} onFy={setFy} sessionsCount={PB.SESSIONS.length}/>
      <div className="main">
        <PBTopbar
          route={route} sessionId={sessionId}
          theme={tweaks.theme} onTheme={(v) => setTweak('theme', v)}
          autoRefresh={autoRefresh} onAutoRefresh={setAutoRefresh}
          onOpenPalette={() => setPaletteOpen(true)}
          lastTick={lastTick}
          onNavigate={navigate}/>
        <main className="content">{page}</main>
      </div>
      <PBPalette open={paletteOpen} onClose={() => setPaletteOpen(false)}
                 onNavigate={navigate} onOpenSession={openSession}/>

      <TweaksPanel title="Tweaks">
        <TweakSection label="Theme"/>
        <TweakRadio label="Mode" value={tweaks.theme} options={['dark','light']}
                    onChange={(v) => setTweak('theme', v)}/>
        <TweakRadio label="Density" value={tweaks.density} options={['compact','regular','comfy']}
                    onChange={(v) => setTweak('density', v)}/>
        <TweakSelect label="Accent" value={tweaks.accent}
                     options={['deep_cyan','violet','amber','green']}
                     onChange={(v) => setTweak('accent', v)}/>
        <TweakSection label="Surfaces"/>
        <TweakToggle label="Hash chain strip" value={tweaks.showHashChainStrip}
                     onChange={(v) => setTweak('showHashChainStrip', v)}/>
        <TweakToggle label="Live pill" value={tweaks.showLivePill}
                     onChange={(v) => setTweak('showLivePill', v)}/>
        <TweakRadio label="Phase chart" value={tweaks.phaseChartStyle}
                    options={['stacked','grid']}
                    onChange={(v) => setTweak('phaseChartStyle', v)}/>
      </TweaksPanel>
    </div>
  );
}

ReactDOM.createRoot(document.getElementById('root')).render(<App/>);
