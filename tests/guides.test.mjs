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
