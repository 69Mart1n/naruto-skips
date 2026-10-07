import { test } from 'node:test';
import assert from 'node:assert/strict';
import { readFile } from 'node:fs/promises';
import { JSDOM } from 'jsdom';

const data = JSON.parse(await readFile(new URL('../data/episodes.json', import.meta.url)));
const catalog = JSON.parse(await readFile(new URL('../data/netflix-catalog.json', import.meta.url)));
const scripts = await Promise.all(['core.js','adapters.js','media.js','content.js'].map(name => readFile(new URL(`../extension/${name}`, import.meta.url), 'utf8')));
const netflix = (episode = 7) => `<div class="video-title"><h4>Naruto Shippuden</h4><span>T12:E${episode}</span></div><button id="next" data-uia="control-next">Siguiente</button><button id="intro" data-uia="player-skip-intro">Saltar intro</button>`;
const crunchyroll = episode => `<div class="erc-current-media-info"><a data-t="show-title-link" href="/es/series/GYQ4MW246/naruto-shippuden"><h4>Naruto Shippuden</h4></a><h1 class="title">E${episode} - Ejemplo</h1></div><button id="next" data-testid="next-episode-button">Next Episode</button><div data-t="next-episode"><a class="title" aria-label="" href="/es/watch/VALID2/episode">Siguiente Episodio</a><a aria-label="Reproducir Episodio ${episode + 1} - Ejemplo"></a></div>`;
async function runtime(html, url, settings = {}) {
  const dom = new JSDOM(html, { url, runScripts:'outside-only' });
  const w = dom.window;
  let now = 0;
  let timer;
  let listener;
  let changed;
  w.Date.now = () => now;
  w.setInterval = callback => { timer = callback; return 1; };
  w.setTimeout = () => 1;
  w.MutationObserver = class { observe() {} };
  w.Element.prototype.getBoundingClientRect = function() { return { width:100,height:20 }; };
  // JSDOM has no layout. Preserve its real CSS visibility and normalize only default styles.
  const style = w.getComputedStyle.bind(w);
  w.getComputedStyle = node => { const css = style(node); return {display:css.display,visibility:css.visibility,opacity:css.opacity || '1',pointerEvents:css.pointerEvents}; };
  const store = { watchProfile:'full-filler', ...settings };
  w.chrome = {
    runtime: { onMessage:{ addListener:fn => { listener = fn; } }, sendMessage:async () => null },
    storage: { local:{ get:async defaults => ({...defaults,...store}), set:async values => { const changes = {}; for (const [key,value] of Object.entries(values)) { changes[key] = {newValue:value}; store[key] = value; } changed(changes,'local'); } }, onChanged:{ addListener:fn => { changed = fn; } } }
  };
  w.NarutoData = data;
  w.NarutoNetflixCatalog = catalog;
  for (const source of scripts) w.eval(source);
  await Promise.resolve();
  const clicks = {};
  w.document.addEventListener('click', event => { const id = event.target.id || event.target.className; clicks[id] = (clicks[id] || 0) + 1; event.preventDefault(); });
  return {
    dom,w,clicks,store,
    async tick(time) { now = time; await timer(); },
    message(message) { return new Promise(resolve => listener(message,{},resolve)); }
  };
}

test('Netflix filler navigation waits for both route and episode updates and avoids duplicate clicks', async () => {
  const r = await runtime(netflix(), 'https://www.netflix.com/watch/1', {skipFiller:true,mappings:{'netflix:naruto-shippuden:12':277}});
  try {
    await r.tick(2000);
    assert.equal(r.clicks.next,1);
    await r.tick(4000);
    assert.equal(r.clicks.next,1);
    r.w.document.querySelector('#next').outerHTML = '<button id="next" data-uia="control-next">Siguiente</button>';
    r.dom.reconfigure({url:'https://www.netflix.com/watch/2'});
    await r.tick(6000); await r.tick(8000);
    assert.equal(r.clicks.next,1, 'URL update with stale episode metadata must not navigate again');
    r.w.document.querySelector('.video-title span').textContent = 'T12:E8';
    await r.tick(9000); await r.tick(11000);
    assert.equal(r.clicks.next,2);
  } finally { r.w.close(); }
});
test('Netflix resolves Naruto local numbers and Shippuden absolute numbers using catalog IDs',async()=>{
  for(const [id,title,pos,absolute] of [['70208142','NARUTO','T6:E1',136],['80144106','Naruto Shippuden','T14:E305',305],['80144106','Naruto Shippuden','T14:E10',305]]) {
    const r=await runtime(`<div class="video-title"><h4>${title}</h4><span>${pos}</span></div>`,`https://www.netflix.com/watch/${id}`,{skipFiller:false});
    try{const state=await r.message({type:'status'});assert.equal(state.episode,absolute);assert.equal(state.identification,'catalog');}finally{r.w.close();}
  }
});
test('Netflix jumps directly over a whole block by default and respects explicit disable and keep',async()=>{
  for(const settings of [{},{skipFiller:false},{keep:{'naruto-shippuden':[305]}}]) {
    const r=await runtime(netflix(305).replace('T12:','T14:'),'https://www.netflix.com/watch/80144106',settings);
    try{const routes=[];r.w.NarutoAdapters.netflix.navigate=url=>routes.push(url);await r.tick(2000);await r.tick(4000);assert.deepEqual(routes,settings.skipFiller===false || settings.keep ? [] : ['/watch/80143883']);}finally{r.w.close();}
  }
});
test('Netflix rejects stale title metadata and detects a loaded video with hidden controls',async()=>{
  const r=await runtime(netflix(304).replace('T12:','T14:')+'<video></video>','https://www.netflix.com/watch/80144106');
  try{
    assert.equal((await r.message({type:'status'})).episode,undefined);
    r.w.document.querySelector('.video-title').remove();
    assert.equal((await r.message({type:'status'})).episode,undefined);
    Object.defineProperty(r.w.document.querySelector('video'),'readyState',{value:1});
    assert.equal((await r.message({type:'status'})).episode,305);
  }finally{r.w.close();}
});
test('Netflix official recap button is only clicked once',async()=>{
  const r=await runtime(netflix(1)+'<button id="recap" data-uia="player-skip-recap">Saltar resumen</button>','https://www.netflix.com/watch/1',{skipIntro:false,skipFiller:false});
  try{await r.tick(2000);await r.tick(4000);assert.equal(r.clicks.recap,1);}finally{r.w.close();}
});
test('Crunchyroll original Naruto uses its own verified series identity',async()=>{
  const html=crunchyroll(136).replace('GYQ4MW246','GY9PJ5KWR').replace('Naruto Shippuden','Naruto');
  const r=await runtime(html,'https://www.crunchyroll.com/es/watch/VALID1/episode',{watchProfile:'user-list'});
  try{const state=await r.message({type:'status'});assert.equal(state.series,'naruto');assert.equal(state.episode,136);assert.equal(state.target,220);}finally{r.w.close();}
});
test('Netflix with unconfirmed or missing season never skips filler', async () => {
  for (const html of [netflix(),netflix().replace('T12:E7','E7')]) {
    const r = await runtime(html,'https://www.netflix.com/watch/1',{skipFiller:true,skipIntro:false});
    try { await r.tick(2000); assert.equal(r.clicks.next,undefined); assert.equal((await r.message({type:'status'})).episode,null); }
    finally { r.w.close(); }
  }
});
test('Netflix intro is clicked once and respects disabled setting', async () => {
  for (const skipIntro of [true,false]) {
    const r = await runtime(netflix(),'https://www.netflix.com/watch/1',{skipIntro});
    try { await r.tick(2000); await r.tick(4000); assert.equal(r.clicks.intro,skipIntro ? 1 : undefined); }
    finally { r.w.close(); }
  }
});
test('Crunchyroll persistent next button does not skip a canon episode mid-stream', async () => {
  const r = await runtime(crunchyroll(302),'https://www.crunchyroll.com/es/watch/VALID1/episode');
  try {
    await r.tick(2000);
    assert.equal(r.clicks.next,undefined);
    r.w.document.body.insertAdjacentHTML('beforeend','<button id="credits" hidden aria-label="Skip Credits">Skip Credits</button>');
    await r.tick(4000);
    assert.equal(r.clicks.next,undefined);
    r.w.document.getElementById('credits').hidden = false;
    await r.tick(6000); await r.tick(8000);
    assert.equal(r.clicks.next,1);
  } finally { r.w.close(); }
});
test('Crunchyroll full filler uses a validated next-episode link and preserves mixed 296', async () => {
  for (const n of [284,296,303]) {
    const r = await runtime(crunchyroll(n),'https://www.crunchyroll.com/es/watch/VALID1/episode',{skipFiller:true});
    try { await r.tick(2000); assert.equal(r.clicks.title,n === 296 ? undefined : 1); }
    finally { r.w.close(); }
  }
});
test('Crunchyroll rejects stale next links and preserves user exceptions', async () => {
  for (const settings of [{skipFiller:true,keep:{'naruto-shippuden':[303]}},{skipFiller:true}]) {
    const html = settings.keep ? crunchyroll(303) : crunchyroll(303).replace('Episodio 304','Episodio 305');
    const r = await runtime(html,'https://www.crunchyroll.com/es/watch/VALID1/episode',settings);
    try { await r.tick(2000); assert.equal(r.clicks.title,undefined); }
    finally { r.w.close(); }
  }
});
test('other shows and hidden buttons receive no automatic clicks', async () => {
  const r = await runtime(netflix().replace('Naruto Shippuden','Boruto: Naruto Next Generations'),'https://www.netflix.com/watch/1',{skipFiller:true});
  try { await r.tick(2000); assert.deepEqual(r.clicks,{}); }
  finally { r.w.close(); }
});
test('the final episode does not auto-advance beyond Shippuden', async () => {
  const r = await runtime(crunchyroll(500) + '<button aria-label="Skip Credits">Skip Credits</button>','https://www.crunchyroll.com/es/watch/VALID1/episode');
  try { await r.tick(2000); assert.equal(r.clicks.next,undefined); }
  finally { r.w.close(); }
});
test('the custom guide skips mixed 419 and allows keeping it as an exception', async () => {
  const r = await runtime(crunchyroll(419),'https://www.crunchyroll.com/es/watch/VALID1/episode',{watchProfile:'user-list',skipFiller:true});
  try {
    const before = await r.message({type:'status'});
    assert.equal(before.type,'mixed');
    assert.equal(before.omit,true);
    assert.equal(before.target,420);
    const result = await r.message({type:'keep-current',key:before.key});
    assert.equal(result.ok,true);
    await r.tick(2000);
    assert.equal(r.clicks.title,undefined);
    assert.equal((await r.message({type:'status'})).omit,false);
  } finally { r.w.close(); }
});
test('guide selection changes the skip decision without recalibrating Netflix', async () => {
  const r = await runtime(netflix(1),'https://www.netflix.com/watch/1',{watchProfile:'user-list',skipFiller:true,skipIntro:false,mappings:{'netflix:naruto-shippuden:12':450}});
  try {
    assert.equal((await r.message({type:'status'})).omit,true);
    await r.w.chrome.storage.local.set({watchProfile:'full-filler'});
    const after = await r.message({type:'status'});
    assert.equal(after.episode,451);
    assert.equal(after.omit,false);
    assert.match(after.reason,/Solo relleno completo/);
    await r.tick(2000);
    assert.equal(r.clicks.next,undefined);
  } finally { r.w.close(); }
});
test('custom guide keeps episode 271 while full filler skips it', async () => {
  for (const profile of ['user-list','full-filler']) {
    const r = await runtime(crunchyroll(271),'https://www.crunchyroll.com/es/watch/VALID1/episode',{watchProfile:profile,skipFiller:true});
    try { await r.tick(2000); assert.equal(r.clicks.title,profile === 'full-filler' ? 1 : undefined); }
    finally { r.w.close(); }
  }
});
