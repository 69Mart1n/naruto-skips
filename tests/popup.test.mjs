import { test } from 'node:test';
import assert from 'node:assert/strict';
import { readFile } from 'node:fs/promises';
import { JSDOM } from 'jsdom';
const html = await readFile(new URL('../extension/popup.html',import.meta.url),'utf8');
const script = await readFile(new URL('../extension/popup.js',import.meta.url),'utf8');
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
