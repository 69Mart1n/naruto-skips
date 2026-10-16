const keys = ['enabled', 'skipIntro', 'skipRecap', 'nextEpisode', 'skipFiller','accelerateScenes'];
const defaults = { enabled:true, skipIntro:true, skipRecap:true, nextEpisode:true, skipFiller:true, accelerateScenes:true, playbackSpeed:1, watchProfile:'user-list', themeSelection:'auto', lastTheme:'naruto' };
const themes = globalThis.AnimeThemes;
const data = globalThis.NarutoData;
let preferences = {...defaults};
let displayedTheme = 'naruto';
let tabId;
let current;
const feedback = text => { document.getElementById('feedback').textContent = text; };
function setLibraryOpen(open) {
  document.getElementById('playerView').hidden = open;
  document.getElementById('libraryView').hidden = !open;
  document.getElementById('changeAnime').setAttribute('aria-expanded',String(open));
  document.documentElement.scrollTop = 0;
  document.body.scrollTop = 0;
  document.getElementById(open ? 'libraryTitle' : 'changeAnime').focus();
}
async function send(message) { return chrome.tabs.sendMessage(tabId, message, { frameId:0 }); }
function updateGuideNote() {
  const guide = document.getElementById('watchProfile');
  const playbackSeries = themes[current?.series] ? current.series : displayedTheme;
  const custom = Array.isArray(data.profiles['user-list'].skipRanges[playbackSeries]);
  guide.querySelector('option[value="user-list"]').disabled = !custom;
  guide.value = custom ? preferences.watchProfile : 'full-filler';
  document.getElementById('guideNote').textContent = guide.value === 'user-list'
    ? playbackSeries === 'one-piece'
      ? 'Tu lista salta automáticamente los arcos de relleno indicados. También omite algunos mixtos y canon del anime; el 1084 se conserva.'
      : 'Tu lista también omite algunos capítulos mixtos. Naruto 135 se conserva.'
    : 'Conserva todos los capítulos mixtos y el canon del anime.';
}
function updateTheme() {
  const automatic = preferences.themeSelection === 'auto';
  displayedTheme = automatic ? (themes[current?.series] ? current.series : preferences.lastTheme) : preferences.themeSelection;
  if (!themes[displayedTheme]) displayedTheme = 'naruto';
  const theme = themes[displayedTheme];
  const record = data.series[displayedTheme];
  document.body.dataset.theme = displayedTheme;
  document.getElementById('animeName').textContent = theme.headerName ?? theme.name;
  document.getElementById('automationTitle').textContent = theme.modeName ?? 'Tu reproducción';
  document.getElementById('themeEyebrow').textContent = theme.eyebrow;
  document.getElementById('themeTagline').textContent = theme.tagline;
  const art = document.getElementById('themeArt');
  art.src = theme.image;
  art.alt = '';
  for (const [id,key] of [['themeCompanion','companion'],['automationSticker','automation'],['guideSticker','guide'],['rhythmSticker','rhythm'],['footerSticker','footer']]) document.getElementById(id).src = theme[key] ?? theme.companion;
  for (const symbol of document.querySelectorAll('.theme-symbol')) symbol.textContent = theme.symbol;
  for (const button of document.querySelectorAll('.anime-card')) button.setAttribute('aria-pressed', String(button.dataset.series === displayedTheme));
  document.getElementById('followPlayer').setAttribute('aria-pressed',String(automatic));
  const detectedName = themes[current?.series]?.name;
  document.getElementById('themeNote').textContent = automatic
    ? detectedName ? `Diseño automático: ${detectedName}.` : 'El diseño seguirá la serie cuando abras el reproductor.'
    : detectedName && current.series !== displayedTheme ? `Diseño: ${theme.name}. La reproducción sigue la guía de ${detectedName}.` : `Diseño de ${theme.name} guardado. Podés volver al modo automático.`;
  const activeThemeNote = document.getElementById('activeThemeNote');
  activeThemeNote.hidden = automatic || !detectedName || current.series === displayedTheme;
  activeThemeNote.textContent = document.getElementById('themeNote').textContent;
  const customRanges = data.profiles['user-list'].skipRanges[displayedTheme];
  const custom = preferences.watchProfile === 'user-list' && Array.isArray(customRanges);
  const ranges = custom ? customRanges : record.fillerRanges;
  const count = ranges.reduce((total,[a,b])=>total+b-a+1,0);
  document.getElementById('fillerSummary').textContent = `${theme.name}: ${count} ${custom ? 'capítulos para saltar · Tu lista' : 'capítulos de relleno'}`;
  document.getElementById('fillerRanges').textContent = ranges.map(([a,b])=>a===b?String(a):`${a}–${b}`).join(', ');
  const extension = record.coverageExtension;
  document.getElementById('guideCoverage').textContent = `Guía hasta el capítulo ${record.totalEpisodes}. Fuente base: ${record.sourceUpdatedOn}.${extension ? ` Capítulos ${extension.start}–${extension.end} revisados en la guía de ${extension.sourceUpdatedOn}.` : ''} ${record.edition ?? ''}`;
  document.getElementById('guideSource').href = record.source;
  const extensionSource = document.getElementById('guideExtensionSource');
  extensionSource.hidden = !extension;
  if (extension) extensionSource.href = extension.source;
  else extensionSource.removeAttribute('href');
  updateGuideNote();
  if (preferences.lastTheme !== displayedTheme) {
    preferences.lastTheme = displayedTheme;
    void chrome.storage.local.set({lastTheme:displayedTheme}).catch(()=>{});
  }
}
async function refresh() {
  try {
    current = await send({ type:'status' });
    const labels = { filler:'relleno', mixed:'mixto', 'anime-canon':'canon del anime', 'manga-canon':'historia principal' };
    document.getElementById('playingSeries').textContent = themes[current.series]?.name ?? 'REPRODUCTOR';
    document.getElementById('episode').textContent = current.episode ? `Capítulo ${current.episode} · ${labels[current.type] ?? 'fuera de la guía'}` : current.series ? 'Serie detectada · falta confirmar capítulo' : 'Sin episodio detectado';
    document.getElementById('reason').textContent = current.reason;
    document.getElementById('absolute').placeholder = current.episode ? String(current.episode) : 'Ej. 303';
    document.getElementById('absolute').max = String(data.series[current.series]?.totalEpisodes ?? 1168);
    document.getElementById('calibrationNote').textContent = current.mappingScope
      ? 'Sólo para el anime de One Piece. Confirmá cada capítulo desconocido; la versión live action no es compatible.'
      : 'Confirmá el número absoluto del anime. Naruto y Shippuden usan sus identificadores verificados de Netflix; las otras series pueden necesitar confirmar cada temporada.';
    document.querySelector('#calibration button').disabled = !current.position;
    document.getElementById('keep').disabled = !current.omit;
    document.getElementById('manual').open = !!current.series && !current.episode;
  } catch {
    current = null;
    document.getElementById('playingSeries').textContent = 'REPRODUCTOR';
    document.getElementById('episode').textContent = 'Elegí tu anime y abrí el reproductor';
    document.getElementById('reason').textContent = 'Abrí el reproductor de Netflix o Crunchyroll.';
    document.querySelector('#calibration button').disabled = true;
    document.getElementById('keep').disabled = true;
  }
  updateTheme();
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
  preferences = {...defaults,...stored};
  if (preferences.themeSelection !== 'auto' && !themes[preferences.themeSelection]) preferences.themeSelection = 'auto';
  if (!['user-list','full-filler'].includes(preferences.watchProfile)) preferences.watchProfile = 'full-filler';
  for (const [id,theme] of Object.entries(themes)) {
    const button = document.createElement('button');
    button.type = 'button';
    button.className = 'anime-card';
    button.dataset.series = id;
    button.setAttribute('aria-label',`Diseño de ${theme.name}`);
    const image = document.createElement('img');
    image.src = theme.pickerImage ?? theme.image;
    image.alt = '';
    const label = document.createElement('span');
    label.textContent = theme.short;
    button.append(image,label);
    button.addEventListener('click',async()=>{
      preferences.themeSelection = id;
      updateTheme();
      setLibraryOpen(false);
      await chrome.storage.local.set({themeSelection:id,lastTheme:id});
    });
    document.getElementById('animePicker').append(button);
  }
  document.getElementById('followPlayer').addEventListener('click',async()=>{
    preferences.themeSelection = 'auto';
    updateTheme();
    setLibraryOpen(false);
    await chrome.storage.local.set({themeSelection:'auto'});
    await refresh();
  });
  const guide = document.getElementById('watchProfile');
  const speed = document.getElementById('playbackSpeed');
  speed.value = String(stored.playbackSpeed);
  speed.addEventListener('change',async()=>{ await chrome.storage.local.set({playbackSpeed:Number(speed.value)}); await refreshMedia(); });
  guide.value = preferences.watchProfile;
  updateGuideNote();
  guide.addEventListener('change', async () => { preferences.watchProfile = guide.value; await chrome.storage.local.set({watchProfile:guide.value}); updateGuideNote(); await refresh(); });
  for (const key of keys) {
    const input = document.getElementById(key);
    input.checked = stored[key];
    input.addEventListener('change', async () => { await chrome.storage.local.set({[key]:input.checked}); await refresh(); });
  }
  const [tab] = await chrome.tabs.query({ active:true, currentWindow:true });
  tabId = tab?.id;
  await refresh();
  setInterval(()=>void refresh(),2000);
}

document.getElementById('changeAnime').addEventListener('click',()=>setLibraryOpen(true));
document.getElementById('backToPlayer').addEventListener('click',()=>setLibraryOpen(false));
document.addEventListener('keydown',event=>{
  if(event.key === 'Escape' && !document.getElementById('libraryView').hidden) {event.preventDefault();setLibraryOpen(false);}
});
document.getElementById('calibration').addEventListener('submit', async event => {
  event.preventDefault();
  try {
    const result = await send({ type:'calibrate', episode:Number(document.getElementById('absolute').value), key:current?.key });
    feedback(result.ok ? current?.mappingScope ? 'Anime y numeración confirmados para este capítulo.' : 'Numeración guardada para esta temporada.' : result.reason);
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
