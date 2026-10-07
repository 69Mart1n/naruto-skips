import { test } from 'node:test';
import assert from 'node:assert/strict';
import { readFile } from 'node:fs/promises';
import '../extension/core.js';
const data = JSON.parse(await readFile(new URL('../data/episodes.json', import.meta.url)));
const core = globalThis.NarutoCore;

test('catalog contains exactly the researched full filler totals and disjoint valid ranges', () => {
  for (const [id, expected] of [['naruto-shippuden', 203], ['naruto', 90]]) {
    const record = data.series[id];
    const seen = new Set();
    for (const ranges of [record.fillerRanges, record.mixedRanges, record.animeCanonRanges]) {
      for (const [start, end] of ranges) {
        assert.ok(start >= 1 && start <= end && end <= record.totalEpisodes);
        for (let n = start; n <= end; n++) { assert.ok(!seen.has(n), `overlap ${id}:${n}`); seen.add(n); }
      }
    }
    assert.equal(Array.from({ length: record.totalEpisodes }, (_, i) => core.classify(data, id, i + 1)).filter(type => type === 'filler').length, expected);
  }
});
test('war filler jumps preserve mixed boundaries', () => {
  for (const [episode, target] of [[279,282],[284,296],[303,321],[347,362],[388,391],[394,414],[416,418],[427,451],[464,469],[480,484]]) {
    assert.equal(core.targetEpisode(data, 'naruto-shippuden', episode), target);
  }
  for (const n of [28,296,362,451,469,500]) assert.equal(core.targetEpisode(data, 'naruto-shippuden', n), n);
  assert.equal(core.targetEpisode(data, 'naruto', 143), 220);
});
test('invalid values never produce a navigation destination', () => {
  for (const n of [0,501,-1,NaN,1.5,'284',null]) assert.equal(core.targetEpisode(data, 'naruto-shippuden', n), null);
  assert.equal(core.targetEpisode(data, 'boruto', 284), null);
});
test('keeping one filler interrupts a block skip', () => {
  assert.equal(core.targetEpisode(data, 'naruto-shippuden', 284, [290]), 290);
  assert.equal(core.targetEpisode(data, 'naruto-shippuden', 290, [290]), 290);
});
test('identity does not confuse Boruto or related recommendations with Naruto', () => {
  assert.equal(core.identifySeries('Naruto Shippūden'), 'naruto-shippuden');
  assert.equal(core.identifySeries('Naruto: Shippuden'), 'naruto-shippuden');
  assert.equal(core.identifySeries('Naruto'), 'naruto');
  assert.equal(core.identifySeries('Boruto: Naruto Next Generations'), null);
  assert.equal(core.identifySeries('Watch Naruto recommendations'), null);
});
test('positions parse English and Spanish and require a confirmed season map', () => {
  assert.deepEqual(core.parsePosition('T12:E7'), { season:12, episode:7 });
  assert.deepEqual(core.parsePosition('Season 12 Episode 7'), { season:12, episode:7 });
  assert.deepEqual(core.parsePosition('Temporada 12 Episodio 7'), { season:12, episode:7 });
  assert.deepEqual(core.parsePosition('E303 - título'), { season:null, episode:303 });
  assert.equal(core.parsePosition('303 visitas'), null);
  const p = { season:12, episode:7 };
  const key = core.mappingKey('netflix','naruto-shippuden',12);
  assert.equal(core.absoluteEpisode('netflix','naruto-shippuden',p,{},data), null);
  assert.equal(core.absoluteEpisode('netflix','naruto-shippuden',p,{[key]:277},data),284);
  assert.equal(core.absoluteEpisode('crunchyroll','naruto-shippuden',p,{[key]:277},data),null);
  assert.equal(core.absoluteEpisode('netflix','naruto-shippuden',{season:13,episode:7},{[key]:277},data),null);
});
