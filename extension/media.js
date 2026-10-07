(() => {
  // Each frame owns its media element. No audio, video or account data leaves the page.
  function createController() {
    let state = null;
    let settings = null;
    let media = null;
    let originalRate = null;
    let appliedRate = null;
    let contextKey = null;
    let start = null;
    let boost = false;
    function video() {
      return Array.from(document.querySelectorAll('video')).filter(v => v.readyState >= 1 && !v.ended).sort((a,b) => b.clientWidth*b.clientHeight-a.clientWidth*a.clientHeight)[0] ?? null;
    }
    function sceneKey(s) {
      if (!s?.episode) return null;
      // A timeupdate can arrive before the next scan during a same-tab navigation.
      if (window === window.top && /^(www\.netflix\.com|www\.crunchyroll\.com)$/.test(location.hostname) && s.route !== location.pathname) return null;
      return `${s.platform}:${s.series}:${s.episode}:${s.route}`;
    }
    function restore() {
      if (media && originalRate !== null && media.playbackRate === appliedRate) media.playbackRate = originalRate;
      originalRate = null; appliedRate = null; boost = false;
    }
    function update(s, prefs) {
      state = s; settings = prefs;
      const next = video();
      const key = sceneKey(s);
      if (next !== media || key !== contextKey) { restore(); start = null; media = next; contextKey = key; }
      if (!media || !key || !prefs.enabled) { restore(); return; }
      let rate = Number(prefs.playbackSpeed);
      if (![1,1.25,1.5,2].includes(rate)) rate = 1;
      const saved = prefs.scenes?.[key];
      const matching = saved && Number.isFinite(media.duration) && Math.abs(saved.duration-media.duration) <= 1.5;
      const inScene = prefs.accelerateScenes && matching && saved.segments?.some(([a,b]) => media.currentTime >= a && media.currentTime < b);
      if (boost || inScene) rate = Math.max(rate,2);
      if (rate === 1) { restore(); return; }
      if (originalRate === null) originalRate = media.playbackRate;
      if (media.playbackRate !== rate) media.playbackRate = rate;
      appliedRate = rate;
    }
    function info() {
      const v = video();
      const key = sceneKey(state);
      const record = settings?.scenes?.[key];
      return { available:!!v && !!key, time:v?.currentTime ?? null, duration:Number.isFinite(v?.duration) ? v.duration : null, rate:v?.playbackRate ?? null, marked:start !== null, segments:record?.segments?.length ?? 0, matching:!!record && !!v && Math.abs(record.duration-v.duration) <= 1.5 };
    }
    async function command(message, fresh, prefs) {
      update(fresh,prefs);
      const v = video();
      const key = sceneKey(fresh);
      if (!prefs.enabled || !v || !key || message.key !== fresh.key || !Number.isFinite(v.duration)) return { ok:false,reason:'El episodio cambió o el video todavía no está disponible.' };
      if (message.action === 'start') { start = { key,time:v.currentTime,duration:v.duration }; return { ok:true,reason:'Inicio marcado. Terminá el tramo desde este panel.' }; }
      if (message.action !== 'end' && message.action !== 'clear') return { ok:false,reason:'Acción desconocida.' };
      const stored = await chrome.storage.local.get({scenes:{}});
      const scenes = { ...stored.scenes };
      if (message.action === 'clear') { delete scenes[key]; start = null; }
      else {
        if (!start || start.key !== key || Math.abs(start.duration-v.duration)>1.5 || v.currentTime-start.time<1 || v.currentTime>=v.duration) return { ok:false,reason:'Marcá el inicio antes del final (al menos un segundo).' };
        const existing = scenes[key];
        const segments = existing && Math.abs(existing.duration-v.duration)<=1.5 ? existing.segments : [];
        if (segments.length >= 100) return { ok:false,reason:'Ya hay 100 tramos guardados para este episodio.' };
        const ordered = [...segments,[start.time,v.currentTime]].sort((a,b)=>a[0]-b[0]);
        const merged = [];
        for (const interval of ordered) { const last = merged.at(-1); if(last && interval[0]<=last[1]) last[1]=Math.max(last[1],interval[1]); else merged.push([...interval]); }
        scenes[key] = { duration:v.duration,segments:merged }; start = null;
      }
      await chrome.storage.local.set({scenes});
      return { ok:true,reason:message.action === 'clear' ? 'Tramos borrados para este episodio.' : 'Tramo guardado: se acelerará a 2× cuando vuelvas a verlo.' };
    }
    document.addEventListener('keydown', event => {
      if (event.code !== 'KeyV' || event.repeat || event.altKey || event.ctrlKey || event.metaKey || event.shiftKey || event.target?.closest?.('input,textarea,select,[contenteditable="true"]') || !settings?.enabled || !state?.episode || !video()) return;
      boost = true; event.preventDefault(); update(state,settings);
    });
    document.addEventListener('keyup', event => { if(event.code === 'KeyV') { boost=false; if(state && settings) update(state,settings); } });
    window.addEventListener('blur',()=>{ boost=false; if(state && settings) update(state,settings); });
    document.addEventListener('visibilitychange',()=>{ if(document.hidden) { boost=false; if(state && settings) update(state,settings); } });
    document.addEventListener('timeupdate',()=>{ if(state && settings) update(state,settings); },true);
    window.addEventListener('pagehide',restore);
    return { update, info, command };
  }
  globalThis.NarutoMedia = { createController };
})();
