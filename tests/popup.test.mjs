import { test } from 'node:test';
import assert from 'node:assert/strict';
import { readFile } from 'node:fs/promises';
import { JSDOM } from 'jsdom';
const html = await readFile(new URL('../extension/popup.html',import.meta.url),'utf8');
const script = await readFile(new URL('../extension/popup.js',import.meta.url),'utf8');
const themes = await readFile(new URL('../extension/themes.js',import.meta.url),'utf8');
const data = JSON.parse(await readFile(new URL('../data/episodes.json',import.meta.url),'utf8'));
const flush = async () => { for(let i=0;i<12;i++) await Promise.resolve(); };
test('popup selects the user guide by default, persists changes, and offers exceptions for mixed skips', async () => {
  const dom = new JSDOM(html,{url:'https://extension.test/popup.html',runScripts:'outside-only'});
  const w = dom.window;
  const stored = {};
  w.chrome = {
    storage:{local:{get:async defaults=>({...defaults,...stored}),set:async values=>Object.assign(stored,values)}},
    tabs:{query:async()=>[{id:1}],sendMessage:async()=>({key:'test',series:'naruto-shippuden',episode:419,type:'mixed',position:{episode:419},omit:(stored.watchProfile ?? 'user-list')==='user-list',reason:'Guía activa'})}
  };
  try {
    w.NarutoData = data;
    w.eval(themes);
    w.eval(script);
    await flush();
    const guide=w.document.getElementById('watchProfile');
    assert.equal(guide.value,'user-list');
    assert.equal(w.document.getElementById('keep').disabled,false);
    assert.match(w.document.getElementById('guideNote').textContent,/también omite/);
    guide.value='full-filler';
    guide.dispatchEvent(new w.Event('change'));
    await flush();
    assert.equal(stored.watchProfile,'full-filler');
    assert.equal(w.document.getElementById('keep').disabled,true);
    assert.match(w.document.getElementById('guideNote').textContent,/Conserva todos/);
  } finally {w.close();}
});

test('theme choices persist, remain separate from playback, and auto follows the detected anime',async()=>{
  const stored={};
  let playing='one-piece';
  const create=async()=>{
    const dom=new JSDOM(html,{url:'https://extension.test/popup.html',runScripts:'outside-only'});
    const w=dom.window;
    w.NarutoData=data;
    w.chrome={storage:{local:{get:async defaults=>({...defaults,...stored}),set:async values=>Object.assign(stored,values)}},tabs:{query:async()=>[{id:1}],sendMessage:async message=>message.type==='media-info'?{available:false}:{series:playing,episode:61,type:'mixed',position:{season:1,episode:61},omit:false,reason:'Capítulo conservado'}}};
    w.eval(themes);w.eval(script);await flush();return dom;
  };
  let dom=await create();
  try {
    const d=dom.window.document;
    assert.equal(d.body.dataset.theme,'one-piece');
    assert.equal(d.querySelectorAll('.anime-card').length,7);
    assert.equal(d.getElementById('libraryView').hidden,true);
    assert.equal(d.getElementById('playerView').hidden,false);
    d.getElementById('changeAnime').click();await flush();
    assert.equal(d.getElementById('playerView').hidden,true);
    assert.equal(d.activeElement.id,'libraryTitle');
    d.dispatchEvent(new dom.window.KeyboardEvent('keydown',{key:'Escape',bubbles:true}));
    assert.equal(d.getElementById('libraryView').hidden,true);
    assert.equal(d.activeElement.id,'changeAnime');
    assert.equal(d.getElementById('watchProfile').value,'user-list');
    assert.match(d.getElementById('fillerRanges').textContent,/1029–1030/);
    for(const id of ['naruto','naruto-shippuden','bleach','dragon-ball','dragon-ball-z','black-clover']) {
      d.getElementById('changeAnime').click();await flush();
      d.querySelector(`[data-series="${id}"]`).click();await flush();
      assert.equal(d.getElementById('libraryView').hidden,true);
      assert.equal(d.getElementById('playerView').hidden,false);
      assert.equal(d.body.dataset.theme,id);
      assert.equal(stored.themeSelection,id);
      assert.equal(d.getElementById('playingSeries').textContent,'One Piece');
      assert.equal(stored.watchProfile,undefined,'theme clicks never change playback preferences');
    }
    dom.window.close();dom=await create();
    assert.equal(dom.window.document.body.dataset.theme,'black-clover','manual selection survives reopening');
    playing='dragon-ball-z';
    dom.window.document.getElementById('changeAnime').click();await flush();
    dom.window.document.getElementById('followPlayer').click();await flush();
    assert.equal(stored.themeSelection,'auto');
    assert.equal(dom.window.document.body.dataset.theme,'dragon-ball-z');
    assert.equal(dom.window.document.getElementById('absolute').max,'291');
  } finally {dom.window.close();}
});

test('One Piece panel shows the active custom ranges and changes to the full-filler list',async()=>{
  const dom=new JSDOM(html,{url:'https://extension.test/popup.html',runScripts:'outside-only'});
  const w=dom.window;
  const stored={};
  w.NarutoData=data;
  w.chrome={storage:{local:{get:async defaults=>({...defaults,...stored}),set:async values=>Object.assign(stored,values)}},tabs:{query:async()=>[{id:1}],sendMessage:async message=>message.type==='media-info'?{available:false}:{series:'one-piece',episode:226,type:'mixed',position:{episode:226},omit:(stored.watchProfile ?? 'user-list')==='user-list',reason:'Guía activa'}}};
  try {
    w.eval(themes);w.eval(script);await flush();
    const d=w.document;
    assert.match(d.getElementById('fillerSummary').textContent,/100 capítulos para saltar/);
    assert.match(d.getElementById('fillerRanges').textContent,/220–226/);
    assert.match(d.getElementById('guideNote').textContent,/1084 se conserva/);
    assert.equal(d.getElementById('keep').disabled,false);
    const guide=d.getElementById('watchProfile');
    guide.value='full-filler';guide.dispatchEvent(new w.Event('change'));await flush();
    assert.match(d.getElementById('fillerSummary').textContent,/94 capítulos de relleno/);
    assert.match(d.getElementById('fillerRanges').textContent,/220–225/);
    assert.equal(d.getElementById('keep').disabled,true);
  } finally {w.close();}
});

test('all anime guides can be browsed without an open player',async()=>{
  const dom=new JSDOM(html,{url:'https://extension.test/popup.html',runScripts:'outside-only'});
  const w=dom.window;
  w.NarutoData=data;
  w.chrome={storage:{local:{get:async defaults=>defaults,set:async()=>{}}},tabs:{query:async()=>[],sendMessage:async()=>{throw new Error('No player');}}};
  try {
    w.eval(themes);w.eval(script);await flush();
    assert.equal(w.document.querySelectorAll('.anime-card').length,7);
    w.document.querySelector('[data-series="black-clover"]').click();await flush();
    assert.equal(w.document.body.dataset.theme,'black-clover');
    assert.match(w.document.getElementById('fillerSummary').textContent,/18 capítulos/);
    assert.equal(w.document.getElementById('watchProfile').value,'full-filler');
    assert.equal(w.document.getElementById('keep').disabled,true);
    assert.equal(w.document.querySelector('#calibration button').disabled,true);
  } finally {w.close();}
});
