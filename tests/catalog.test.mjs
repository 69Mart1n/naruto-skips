import {test} from 'node:test';
import assert from 'node:assert/strict';
import {readFile} from 'node:fs/promises';
await import('../extension/core.js');
const C=globalThis.NarutoCore;
const catalog=JSON.parse(await readFile(new URL('../data/netflix-catalog.json',import.meta.url)));
test('all 720 Netflix IDs reproduce the independently read catalog checksums and season boundaries',()=>{
  const ids=new Set();
  for(const [series,total,checksum] of [['naruto',220,1825630586186],['naruto-shippuden',500,10055073316726]]) {
    let actual=0;
    for(let episode=1;episode<=total;episode++) {
      const id=C.catalogVideoId(catalog,series,episode);
      assert.ok(id);assert.ok(!ids.has(id));ids.add(id);
      const entry=C.catalogEntry(catalog,id);
      assert.equal(entry.series,series);assert.equal(entry.episode,episode);
      assert.ok(entry.localEpisode>=1 && entry.localEpisode<=catalog.series[series].seasonLengths[entry.season-1]);
      actual+=episode*Number(id);
    }
    assert.equal(actual,checksum);
    assert.equal(C.catalogVideoId(catalog,series,total+1),null);
  }
  assert.equal(ids.size,720);
  assert.equal(C.catalogEntry(catalog,'99999999'),null);
  assert.equal(C.catalogEntry(catalog,'80000518junk'),null);
  assert.equal(C.identifySeries('Naruto Shippuden: La película'),null);
});
