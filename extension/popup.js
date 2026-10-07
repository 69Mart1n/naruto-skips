const keys = ['enabled', 'skipIntro', 'skipRecap', 'nextEpisode', 'skipFiller','accelerateScenes'];
const defaults = { enabled:true, skipIntro:true, skipRecap:true, nextEpisode:true, skipFiller:true, accelerateScenes:true, playbackSpeed:1, watchProfile:'user-list' };
let tabId;
let current;
const feedback = text => { document.getElementById('feedback').textContent = text; };
async function send(message) { return chrome.tabs.sendMessage(tabId, message, { frameId:0 }); }
async function refresh() {
  try {
    current = await send({ type:'status' });
    const labels = { filler:'relleno', mixed:'mixto', 'anime-canon':'canon del anime', 'manga-canon':'historia principal' };
    document.getElementById('episode').textContent = current.episode ? `Capítulo ${current.episode} · ${labels[current.type]}` : current.series ? 'Serie detectada · falta confirmar capítulo' : 'Sin episodio detectado';
    document.getElementById('reason').textContent = current.reason;
    document.getElementById('absolute').placeholder = current.episode ? String(current.episode) : 'Ej. 303';
    document.querySelector('#calibration button').disabled = !current.position;
    document.getElementById('keep').disabled = !current.omit;
    document.getElementById('manual').open = !!current.series && !current.episode;
  } catch {
    current = null;
    document.getElementById('episode').textContent = 'Abrí Naruto en el reproductor';
    document.getElementById('reason').textContent = 'Después de instalar, recargá Netflix o Crunchyroll. Esta beta necesita probarse con tu sesión.';
    document.querySelector('#calibration button').disabled = true;
    document.getElementById('keep').disabled = true;
  }
  await refreshMedia();
}
async function refreshMedia() {
  let info;
  try {info=await send({type:'media-info'});} catch {info=null;}
  document.getElementById('markStart').disabled = !info?.available;
  document.getElementById('markEnd').disabled = !info?.available || !info?.marked;
  document.getElementById('clearScenes').disabled = !info?.available || !info?.segments;
  document.getElementById('mediaStatus').textContent = info?.available ? `${info.rate}× · ${info.segments} tramo(s) guardado(s)${info.segments && !info.matching ? ' · duración diferente: no se aplican' : ''}${info.marked ? ' · inicio marcado' : ''}` : 'El video debe estar cargado para marcar escenas.';
}
async function initialize() {
  const stored = await chrome.storage.local.get(defaults);
  const guide = document.getElementById('watchProfile');
  function updateGuideNote() {
    document.getElementById('guideNote').textContent = guide.value === 'user-list' ? 'Tu lista también omite algunos capítulos mixtos. Naruto 135 se conserva.' : 'Conserva todos los capítulos mixtos y el canon del anime.';
  }
  const speed = document.getElementById('playbackSpeed');
  speed.value = String(stored.playbackSpeed);
  speed.addEventListener('change',async()=>{ await chrome.storage.local.set({playbackSpeed:Number(speed.value)}); await refreshMedia(); });
  guide.value = stored.watchProfile;
  updateGuideNote();
  guide.addEventListener('change', async () => { await chrome.storage.local.set({watchProfile:guide.value}); updateGuideNote(); await refresh(); });
  for (const key of keys) {
    const input = document.getElementById(key);
    input.checked = stored[key];
    input.addEventListener('change', async () => { await chrome.storage.local.set({[key]:input.checked}); await refresh(); });
  }
  const [tab] = await chrome.tabs.query({ active:true, currentWindow:true });
  tabId = tab?.id;
  await refresh();
}
document.getElementById('calibration').addEventListener('submit', async event => {
  event.preventDefault();
  try {
    const result = await send({ type:'calibrate', episode:Number(document.getElementById('absolute').value), key:current?.key });
    feedback(result.ok ? 'Numeración guardada para esta temporada.' : result.reason);
    await refresh();
  } catch { feedback('Mostrá los controles del reproductor y volvé a intentarlo.'); }
});
for (const [id,action] of [['markStart','start'],['markEnd','end'],['clearScenes','clear']]) {
  document.getElementById(id).addEventListener('click',async()=>{
    try { const result=await send({type:'media-action',action,key:current?.key}); feedback(result?.reason ?? 'Video no disponible.'); await refreshMedia(); }
    catch { feedback('Recargá el reproductor.'); }
  });
}
document.getElementById('keep').addEventListener('click', async () => {
  try { const result = await send({type:'keep-current',key:current?.key}); feedback(result.ok ? 'Este capítulo se conservará.' : 'El capítulo cambió.'); await refresh(); }
  catch { feedback('No se pudo guardar la excepción.'); }
});
document.getElementById('retry').addEventListener('click', async () => {
  try { await send({type:'retry'}); feedback('Comprobando de nuevo…'); await refresh(); } catch { feedback('Recargá la página del reproductor.'); }
});
void initialize();
