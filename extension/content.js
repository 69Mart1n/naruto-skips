(() => {
  const C = globalThis.NarutoCore;
  const D = globalThis.NarutoData;
  const A = globalThis.NarutoAdapters;
  const platform = location.hostname.endsWith('netflix.com') ? 'netflix' : 'crunchyroll';
  const adapter = A[platform];
  const isTop = window === window.top;
  const defaults = { enabled: true, skipIntro: true, skipRecap:true, nextEpisode: true, skipFiller: true, watchProfile: 'user-list', playbackSpeed:1, accelerateScenes:true, scenes:{}, mappings: {}, keep: {} };
  const media = globalThis.NarutoMedia?.createController();
  let settings = null;
  let status = { platform, reason: 'Buscando el reproductor…' };
  let stableKey = '';
  let stableSince = 0;
  let pending = null;
  let blockedKey = null;
  let introKey = null;
  let recapKey = null;
  let running = false;
  let timeout = null;
  let clicked = new WeakSet();
  function compute() {
    const raw = adapter.read();
    if (!raw) return { platform, reason: 'Abrí uno de los siete animes compatibles y mostrá los controles.' };
    const episode = raw.absolute ?? C.absoluteEpisode(platform, raw.series, raw.position, settings?.mappings ?? {}, D, raw.mappingScope);
    const key = `${raw.series}:${raw.route}:${raw.position?.season}:${raw.position?.episode}:${episode}`;
    const type = C.classify(D, raw.series, episode);
    const watchProfile = C.effectiveProfile(D, settings?.watchProfile ?? defaults.watchProfile, raw.series);
    const keep = settings?.keep[raw.series] ?? [];
    const omit = C.shouldSkip(D, raw.series, episode, keep, watchProfile);
    const target = C.targetEpisode(D, raw.series, episode, keep, watchProfile);
    const profileName = D.profiles[watchProfile]?.name ?? 'Guía desconocida';
    return { ...raw, platform, episode, key, type, target, omit, watchProfile, reason: !raw.position ? 'No se pudo leer el número. Mostrá los controles.' : !episode ? raw.mappingScope ? 'Confirmá que estás viendo el anime de One Piece y su capítulo absoluto. La versión live action no es compatible.' : 'Confirmá el capítulo absoluto para esta temporada en el panel.' : !type ? 'Este capítulo todavía no está cubierto por la guía.' : omit ? target ? `${profileName}: se omite este capítulo. Retomar en ${target}.` : `${profileName}: relleno al final de la serie. No hay otro capítulo cubierto para saltar.` : `${profileName}: este capítulo se conserva.` };
  }
  function clickOnce(el) {
    if (!A.isVisible(el) || clicked.has(el)) return false;
    clicked.add(el);
    el.click();
    return true;
  }
  function startNavigation(el, state) {
    if (!el || pending || blockedKey === state.key) return false;
    pending = { key: state.key, route: state.route, series: state.series, episode: state.episode, position: state.position, at: Date.now() };
    if (!clickOnce(el)) { pending = null; return false; }
    return true;
  }
  async function scan() {
    if (running || !settings) return;
    running = true;
    try {
      const state = isTop ? compute() : await chrome.runtime.sendMessage({ type: 'top-state' });
      if (!state) return;
      media?.update(state,settings);
      if (!isTop && media?.info().available) void chrome.runtime.sendMessage({type:'media-frame',key:state.key}).catch(()=>{});
      if (isTop) status = state;
      const now = Date.now();
      if (state.key !== stableKey) { stableKey = state.key; stableSince = now; clicked = new WeakSet(); }
      if (pending) {
        // URL and numeric identity must both update before a second navigation.
        const changed = state.series && (state.series !== pending.series || (state.route !== pending.route && (state.identification === 'catalog' ? state.episode !== pending.episode : state.position?.episode !== pending.position?.episode)));
        if (changed) { pending = null; blockedKey = null; introKey = null; recapKey = null; }
        else if (now - pending.at > 15000) { blockedKey = pending.key; pending = null; }
      }
      if (isTop && blockedKey === state.key) status.reason = 'El salto no se confirmó. Usá Reintentar en el panel.';
      if (!settings.enabled || !state.series || !state.key || now - stableSince < 1500 || pending || blockedKey === state.key) return;
      if (state.mappingScope && !state.episode) return;
      if (isTop && settings.skipFiller && state.omit && state.target > state.episode) {
        const route = adapter.targetRoute?.(state,state.target);
        if (route) {
          pending = {key:state.key,route:state.route,series:state.series,episode:state.episode,position:state.position,at:now};
          status.reason = `Saltando según la guía: ${state.episode} → ${state.target}.`;
          adapter.navigate(route); return;
        }
        const next = adapter.fillerNext(state, state.target);
        if (startNavigation(next, state)) { status.reason = `Saltando según la guía: ${state.episode} → ${state.target}.`; return; }
        status.reason = 'Este capítulo se omite según la guía. Mostrá el botón siguiente para saltarlo.';
      }
      if (settings.skipIntro && introKey !== state.key) {
        if (clickOnce(adapter.intro())) { introKey = state.key; return; }
      }
      if (settings.skipRecap && recapKey !== state.key && clickOnce(adapter.recap?.())) { recapKey = state.key; return; }
      // Persistent next controls are used only for confirmed filler, never normal playback.
      if (settings.nextEpisode && state.episode !== D.series[state.series]?.totalEpisodes) startNavigation(adapter.endNext(), state);
    } catch (error) {
      if (isTop) status.reason = 'No se pudo leer el reproductor. Recargá la página.';
      console.debug('[Anime Skips]', error.message);
    } finally { running = false; }
  }
  function schedule() { if (timeout === null) timeout = setTimeout(() => { timeout = null; void scan(); }, 200); }
  chrome.runtime.onMessage.addListener((message, sender, reply) => {
    if (message?.type === 'media-info' || message?.type === 'media-action') {
      (async () => {
        const fresh = isTop ? compute() : await chrome.runtime.sendMessage({type:'top-state'});
        media?.update(fresh,settings);
        if(message.type === 'media-action' && message.key !== fresh?.key) return {ok:false,reason:'El episodio cambió. Actualizá el panel.'};
        if (isTop && !media?.info().available) return chrome.runtime.sendMessage({type:'media-request',command:{...message,key:fresh?.key}});
        if(message.type === 'media-info') return media?.info() ?? {available:false};
        return media?.command(message,fresh,settings) ?? {ok:false,reason:'Video no disponible.'};
      })().then(reply).catch(()=>reply({ok:false,available:false,reason:'Video no disponible.'}));
      return true;
    }
    if (!isTop) return;
    if (message?.type === 'status') { const state = compute(); reply({ ...state, reason: pending || blockedKey === state.key ? status.reason : state.reason }); return; }
    if (message?.type === 'retry') { blockedKey = null; pending = null; clicked = new WeakSet(); schedule(); reply({ ok: true }); return; }
    if (message?.type === 'calibrate') {
      const state = compute();
      const absolute = message.episode;
      if (state.key !== message.key || !state.series || !state.position || !C.classify(D, state.series, absolute) || absolute < state.position.episode) { reply({ ok: false, reason: 'El episodio cambió o el número es inválido. Actualizá el panel.' }); return; }
      const key = C.mappingKey(platform, state.series, state.position.season, state.mappingScope);
      const mappings = { ...settings.mappings, [key]: absolute - state.position.episode };
      chrome.storage.local.set({ mappings }).then(() => { settings.mappings = mappings; schedule(); reply({ ok: true }); }).catch(() => reply({ ok: false, reason: 'No se pudo guardar.' }));
      return true;
    }
    if (message?.type === 'keep-current') {
      const state = compute();
      if (state.key !== message.key || !state.episode || !state.omit) { reply({ ok: false }); return; }
      const keep = { ...settings.keep, [state.series]: [...new Set([...(settings.keep[state.series] ?? []), state.episode])] };
      chrome.storage.local.set({ keep }).then(() => { settings.keep = keep; reply({ ok: true }); });
      return true;
    }
  });
  chrome.storage.onChanged.addListener((changes, area) => {
    if (area !== 'local' || !settings) return;
    for (const [key, change] of Object.entries(changes)) if (key in defaults) settings[key] = change.newValue ?? defaults[key];
    schedule();
  });
  chrome.storage.local.get(defaults).then(stored => {
    settings = stored;
    const observer = new MutationObserver(schedule);
    observer.observe(document.documentElement, { subtree: true, childList: true, characterData: true, attributes: true, attributeFilter: ['aria-hidden', 'hidden', 'disabled', 'class'] });
    setInterval(() => void scan(), 1000);
    void scan();
  });
})();
