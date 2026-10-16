import { test } from 'node:test';
import assert from 'node:assert/strict';
import { readFile } from 'node:fs/promises';
import '../extension/core.js';
const data = JSON.parse(await readFile(new URL('../data/episodes.json', import.meta.url)));
const C = globalThis.NarutoCore;
// Expected watch intervals are transcribed from the user's instructions,
// independently of the stored skip intervals. Naruto 135 is retained.
const watch = {
  naruto:[[1,25],[27,96],[98,100],[107,135],[220,220]],
  'naruto-shippuden':[[1,56],[71,89],[112,143],[152,169],[172,175],[197,222],[243,257],[261,278],[282,283],[296,302],[321,346],[362,375],[378,388],[391,393],[414,415],[418,418],[420,421],[424,426],[458,459],[463,463],[469,479],[484,500]]
};
test('the custom guide agrees with every episode in the user watch list', () => {
  for (const [series,ranges] of Object.entries(watch)) {
    for (let ep = 1; ep <= data.series[series].totalEpisodes; ep++) {
      const expectedWatch = ranges.some(([a,b]) => ep >= a && ep <= b);
      assert.equal(C.shouldSkip(data,series,ep,[],'user-list'), !expectedWatch, `${series}:${ep}`);
    }
  }
});
test('custom guide resolves contradictory Naruto 135 by keeping it and skipping 136 through 219', () => {
  assert.equal(C.targetEpisode(data,'naruto',135,[],'user-list'),135);
  assert.equal(C.targetEpisode(data,'naruto',136,[],'user-list'),220);
  assert.equal(C.targetEpisode(data,'naruto',141,[],'user-list'),220);
  assert.equal(C.targetEpisode(data,'naruto',141,[],'full-filler'),141);
});
test('custom guide preserves its chosen boundary episodes and includes its mixed skips', () => {
  for (const ep of [71,112,257,271,388,458,469,500]) assert.equal(C.targetEpisode(data,'naruto-shippuden',ep,[],'user-list'),ep);
  for (const [ep,target] of [[57,71],[90,112],[258,261],[389,391],[419,420],[427,458],[451,458],[460,463]]) assert.equal(C.targetEpisode(data,'naruto-shippuden',ep,[],'user-list'),target);
  // Watching policy must not relabel source classification.
  for (const ep of [90,419,451,460]) assert.equal(C.classify(data,'naruto-shippuden',ep),'mixed');
});
test('exceptions override both guides and unknown guide never skips', () => {
  assert.equal(C.targetEpisode(data,'naruto-shippuden',427,[451],'user-list'),451);
  assert.equal(C.shouldSkip(data,'naruto-shippuden',419,[419],'user-list'),false);
  assert.equal(C.shouldSkip(data,'naruto-shippuden',284,[],'unknown'),false);
  for (const ep of [0,501,null,'419']) assert.equal(C.shouldSkip(data,'naruto-shippuden',ep,[],'user-list'),false);
});

test('One Piece custom guide matches every range supplied by the user and preserves the rest', () => {
  // Transcribed by arc, independently of the merged ranges in episodes.json.
  const arcs = [[54,60],[98,99],[102,102],[131,135],[136,138],[139,143],[196,206],[220,224],[225,226],[279,283],[291,292],[303,303],[317,319],[326,336],[382,384],[406,407],[426,429],[457,458],[492,492],[499,499],[506,506],[542,542],[575,578],[590,590],[626,628],[747,750],[751,751],[775,775],[780,782],[895,896],[907,907],[1029,1030]];
  let skipped = 0;
  const added = [];
  for (let ep = 1; ep <= data.series['one-piece'].totalEpisodes; ep++) {
    const expected = arcs.some(([a,b]) => ep >= a && ep <= b);
    assert.equal(C.shouldSkip(data,'one-piece',ep,[],'user-list'),expected,`One Piece ${ep}`);
    if (expected) skipped++;
    if (expected && !C.shouldSkip(data,'one-piece',ep,[],'full-filler')) added.push(ep);
  }
  assert.equal(skipped,100);
  assert.deepEqual(added,[226,499,506,628,751,775]);
  for (const ep of [226,628,751]) assert.equal(C.classify(data,'one-piece',ep),'mixed');
  for (const ep of [499,506,775,1084]) assert.equal(C.classify(data,'one-piece',ep),'anime-canon');
  assert.equal(C.targetEpisode(data,'one-piece',1084,[],'user-list'),1084);
});

test('One Piece skips whole contiguous arcs and respects a retained episode inside an arc', () => {
  for (const [start,end,target] of [[54,60,61],[131,143,144],[196,206,207],[220,226,227],[326,336,337],[626,628,629],[747,751,752],[1029,1030,1031]]) {
    for (let ep = start; ep <= end; ep++) assert.equal(C.targetEpisode(data,'one-piece',ep,[],'user-list'),target);
    assert.equal(C.targetEpisode(data,'one-piece',target,[],'user-list'),target);
  }
  assert.equal(C.targetEpisode(data,'one-piece',196,[200],'user-list'),200);
  assert.equal(C.shouldSkip(data,'one-piece',200,[200],'user-list'),false);
});
