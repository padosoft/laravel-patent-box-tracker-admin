// ============== App root — Patent Box admin ==============

const TWEAK_DEFAULTS = /*EDITMODE-BEGIN*/{
  "theme": "dark",
  "density": "regular",
  "accent": "deep_cyan",
  "showHashChainStrip": true,
  "showLivePill": true,
  "phaseChartStyle": "stacked"
}/*EDITMODE-END*/;

function buildPhaseBreakdown(commits = []) {
  const buckets = {
    research: 0,
    design: 0,
    implementation: 0,
    validation: 0,
    documentation: 0,
    non_qualified: 0,
  };

  for (const commit of commits) {
    const phase = commit?.phase || 'non_qualified';
    if (Object.prototype.hasOwnProperty.call(buckets, phase)) {
      buckets[phase] += 1;
    } else {
      buckets.non_qualified += 1;
    }
  }

  return [
    { phase: 'research',       count: buckets.research,       qualified: 0 },
    { phase: 'design',         count: buckets.design,         qualified: 0 },
    { phase: 'implementation', count: buckets.implementation, qualified: 0 },
    { phase: 'validation',     count: buckets.validation,     qualified: 0 },
    { phase: 'documentation',  count: buckets.documentation,  qualified: 0 },
    { phase: 'non_qualified',  count: buckets.non_qualified,  qualified: 0 },
  ];
}

function buildAiBreakdown(commits = []) {
  const buckets = {
    human: 0,
    ai_assisted: 0,
    ai_authored: 0,
  };

  for (const commit of commits) {
    const kind = String(commit?.ai_attribution || 'human');
    if (Object.prototype.hasOwnProperty.call(buckets, kind)) {
      buckets[kind] += 1;
    } else {
      buckets.human += 1;
    }
  }

  const total = commits.length || 1;
  return [
    { kind: 'human',      count: buckets.human,      pct: (buckets.human / total) * 100 },
    { kind: 'ai_assisted', count: buckets.ai_assisted, pct: (buckets.ai_assisted / total) * 100 },
    { kind: 'ai_authored', count: buckets.ai_authored, pct: (buckets.ai_authored / total) * 100 },
  ];
}

function App() {
  const [tweaks, setTweak] = useTweaks(TWEAK_DEFAULTS);
  const [route, setRoute] = React.useState('dashboard');
  const [sessionId, setSessionId] = React.useState(1042);
  const [fy, setFy] = React.useState('2026');
  const [autoRefresh, setAutoRefresh] = React.useState(true);
  const [paletteOpen, setPaletteOpen] = React.useState(false);
  const [lastTick, setLastTick] = React.useState(Date.now());
  const [syncing, setSyncing] = React.useState(false);
  const [sessionStateVersion, setSessionStateVersion] = React.useState(0);
  const [apiStatus, setApiStatus] = React.useState({
    enabled: typeof TrackerApi !== 'undefined' && TrackerApi.config?.enabled !== false,
    connected: false,
    lastCheck: null,
    latencyMs: null,
    error: null,
  });

  const apiState = React.useMemo(() => {
    return window.PB_API_STATE || (window.PB_API_STATE = {
      sessionState: {},
    });
  }, []);

  const syncFromApi = React.useCallback(async () => {
    if (typeof TrackerApi === 'undefined' || !TrackerApi.config?.enabled) {
      setApiStatus((state) => ({
        ...state,
        enabled: false,
        connected: false,
        error: 'Tracker API client disabled or unavailable',
      }));
      return;
    }

    setSyncing(true);
    try {
      const health = await TrackerApi.getHealth();
      const latencyMs = health.latencyMs ?? null;
      const capabilities = await TrackerApi.getCapabilities();
      const sessions = await TrackerApi.listSessions({ per_page: 200 });
      const now = new Date().toISOString();

      setApiStatus((state) => ({
        ...state,
        enabled: true,
        connected: health.ok,
        latencyMs,
        error: health.ok ? null : health.error?.message || 'Health check failed',
        lastCheck: now,
      }));

      if (capabilities.ok && capabilities.data && PB.CAPABILITIES) {
        Object.assign(PB.CAPABILITIES, capabilities.data);
      }

      if (sessions.ok && Array.isArray(sessions.data)) {
        const rows = sessions.data.map((row) => TrackerApi.normalize.sessionFromList(row));
        if (rows.length > 0) {
          PB.SESSIONS = rows;
        }
      }

      if (route === 'detail' && sessionId) {
        const sessionBase = PB.SESSIONS.find((s) => s.id === sessionId) || {
          id: sessionId,
          status: 'pending',
          repositories: [],
          dossier: [],
        };

        const [sessionRsp, commitsRsp, evidenceRsp, dossiersRsp] = await Promise.all([
          TrackerApi.getSession(sessionId),
          TrackerApi.getSessionCommits(sessionId),
          TrackerApi.getSessionEvidence(sessionId),
          TrackerApi.getSessionDossiers(sessionId),
        ]);

        const detail = sessionRsp.ok
          ? TrackerApi.normalize.sessionFromDetail(sessionRsp.data, sessionBase)
          : sessionBase;

        const commits = commitsRsp.ok
          ? TrackerApi.normalize.commits(Array.isArray(commitsRsp.data) ? commitsRsp.data : [])
          : [];
        const evidence = evidenceRsp.ok
          ? TrackerApi.normalize.evidence(Array.isArray(evidenceRsp.data) ? evidenceRsp.data : [])
          : [];
        const dossiers = dossiersRsp.ok
          ? TrackerApi.normalize.dossiers(Array.isArray(dossiersRsp.data) ? dossiersRsp.data : [])
          : [];

        apiState.sessionState[sessionId] = {
          session: detail,
          commits,
          evidence,
          dossiers,
          phaseBreakdown: buildPhaseBreakdown(commits),
          aiBreakdown: buildAiBreakdown(commits),
          repositories: detail.repositories || sessionBase.repositories || [],
        };

        apiState.lastSync = now;
        setSessionStateVersion((v) => v + 1);
      }
    } finally {
      setSyncing(false);
    }
  }, [route, sessionId, apiState]);

  const launchSession = React.useCallback(async (payload) => {
    if (typeof TrackerApi === 'undefined' || !TrackerApi.config?.enabled) {
      return {
        ok: false,
        error: { code: 'api_disabled', message: 'Tracker API not enabled' },
      };
    }
    return TrackerApi.createSession(payload);
  }, []);

  React.useEffect(() => {
    syncFromApi();
    if (!autoRefresh) {
      return;
    }
    const t = setInterval(syncFromApi, 5000);
    return () => clearInterval(t);
  }, [syncFromApi, autoRefresh]);

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

  React.useEffect(() => {
    if (route === 'detail') {
      const has = PB.SESSIONS.some((s) => s.id === sessionId);
      if (!has && PB.SESSIONS.length > 0) {
        setSessionId(PB.SESSIONS[0].id);
      }
    }
  }, [route, sessionId, sessionStateVersion]);

  const navigate = (r) => {
    if (r.startsWith('detail:')) {
      setSessionId(parseInt(r.slice(7), 10));
      setRoute('detail');
      return;
    }
    if (r === 'newrun' || r === 'new-run') {
      setRoute('newrun');
      return;
    }
    setRoute(r);
  };

  const openSession = (id) => {
    setSessionId(id);
    setRoute('detail');
  };

  let page;
  if (route === 'dashboard') {
    page = <PageDashboard onNavigate={navigate} fy={fy}/>;
  } else if (route === 'sessions') {
    page = <PageSessions onOpenSession={openSession} fy={fy} onFy={setFy}/>;
  } else if (route === 'detail') {
    page = (
      <PageDetail
        sessionId={sessionId}
        onNavigate={navigate}
        live={apiState.sessionState?.[sessionId]}
      />
    );
  } else if (route === 'newrun') {
    page = <PageNewRun
      onCancel={() => setRoute('sessions')}
      onLaunched={launchSession}
      apiEnabled={apiStatus.enabled}
    />;
  } else if (route === 'commits') {
    page = <PageCommits onOpenSession={openSession}/>;
  } else if (route === 'evidence') {
    page = <PageEvidence/>;
  } else if (route === 'dossiers') {
    page = <PageDossiers/>;
  } else if (route === 'integrity') {
    page = <PageAudit/>;
  } else if (route === 'settings') {
    page = <PageSettings tweaks={tweaks} setTweak={setTweak}/>;
  } else {
    page = <PageDashboard onNavigate={navigate} fy={fy}/>;
  }

  return (
    <div className="app">
      <PBSidebar
        route={route}
        onNavigate={navigate}
        fy={fy}
        onFy={setFy}
        sessionsCount={PB.SESSIONS.length}
      />
      <div className="main">
        <PBTopbar
          route={route}
          sessionId={sessionId}
          theme={tweaks.theme}
          onTheme={(v) => setTweak('theme', v)}
          autoRefresh={autoRefresh}
          onAutoRefresh={setAutoRefresh}
          onOpenPalette={() => setPaletteOpen(true)}
          lastTick={lastTick}
          onNavigate={navigate}
        />
        <main className="content">{page}</main>
      </div>
      <PBPalette
        open={paletteOpen}
        onClose={() => setPaletteOpen(false)}
        onNavigate={navigate}
        onOpenSession={openSession}
      />
      <TweaksPanel title="Tweaks">
        <TweakSection label="Theme"/>
        <TweakRadio
          label="Mode"
          value={tweaks.theme}
          options={['dark','light']}
          onChange={(v) => setTweak('theme', v)}
        />
        <TweakRadio
          label="Density"
          value={tweaks.density}
          options={['compact','regular','comfy']}
          onChange={(v) => setTweak('density', v)}
        />
        <TweakSelect
          label="Accent"
          value={tweaks.accent}
          options={['deep_cyan','violet','amber','green']}
          onChange={(v) => setTweak('accent', v)}
        />
        <TweakSection label="Surfaces"/>
        <TweakToggle
          label="Hash chain strip"
          value={tweaks.showHashChainStrip}
          onChange={(v) => setTweak('showHashChainStrip', v)}
        />
        <TweakToggle
          label="Live pill"
          value={tweaks.showLivePill}
          onChange={(v) => setTweak('showLivePill', v)}
        />
        <TweakRadio
          label="Phase chart"
          value={tweaks.phaseChartStyle}
          options={['stacked','grid']}
          onChange={(v) => setTweak('phaseChartStyle', v)}
        />
      </TweaksPanel>
    </div>
  );
}

ReactDOM.createRoot(document.getElementById('root')).render(
  <ToastProvider>
    <App/>
  </ToastProvider>
);
