// Explicit research refresh. Never runs during build or in the installed extension.
import { readFile, writeFile, mkdir } from 'node:fs/promises';
import { resolve, dirname } from 'node:path';
import { fileURLToPath } from 'node:url';
import { JSDOM } from 'jsdom';
const root = resolve(dirname(fileURLToPath(import.meta.url)), '..');
const series = [
  ['naruto','Naruto',90], ['naruto-shippuden','Naruto Shippuden',203],
  ['one-piece','One Piece',94], ['bleach','Bleach',163],
  ['dragon-ball','Dragon Ball',21], ['dragon-ball-z','Dragon Ball Z',38],
  ['black-clover','Black Clover',18]
];
async function get(url) {
  let failure;
  for (let attempt = 0; attempt < 3; attempt++) {
    try {
      const response = await fetch(url, { signal:AbortSignal.timeout(20000) });
      if (!response.ok) throw new Error(`${response.status}: ${url}`);
      return response;
    } catch (error) { failure = error; }
  }
  throw failure;
}
function parseRanges(text) {
  return text.split(',').map(value => {
    const match = value.trim().match(/^(\d+)(?:-(\d+))?$/);
    if (!match) throw new Error(`Invalid source range: ${value}`);
    return [Number(match[1]), Number(match[2] ?? match[1])];
  });
}
const results = await Promise.allSettled(series.map(async ([id,name,expected]) => {
  const source = `https://www.animefillerlist.com/shows/${id}`;
  const dom = new JSDOM(await (await get(source)).text());
  try {
    const document = dom.window.document;
    const categories = Object.fromEntries([...document.querySelectorAll('.Label')].map(el => [el.textContent.trim(), el.nextElementSibling?.textContent.trim()]));
    const ranges = label => categories[label] ? parseRanges(categories[label]) : [];
    const fillerRanges = ranges('Filler Episodes:');
    const count = fillerRanges.reduce((n,[a,b]) => n+b-a+1, 0);
    if (count !== expected) throw new Error(`${id}: source now has ${count} fillers; review before updating expected ${expected}`);
    const all = Object.values(categories).flatMap(text => parseRanges(text));
    const totalEpisodes = Math.max(...all.map(([,end])=>end));
    const date = document.body.textContent.match(/Updated on ([A-Za-z]+ \d+, \d{4})/)?.[1];
    const sourceUpdatedOn = date ? new Date(`${date} UTC`).toISOString().slice(0,10) : null;
    const imageUrl = document.querySelector('img[src*="/anime_poster/"]')?.src;
    if (!imageUrl) throw new Error(`No cover image: ${id}`);
    const response = await get(imageUrl);
    const mime = response.headers.get('content-type');
    if (!/^image\/(jpeg|png|webp)/.test(mime)) throw new Error(`Unexpected image: ${mime}`);
    const extension = mime.includes('png') ? 'png' : mime.includes('webp') ? 'webp' : 'jpg';
    return { id, record:{name,totalEpisodes,source,sourceUpdatedOn,fillerRanges,mixedRanges:ranges('Mixed Canon/Filler Episodes:'),animeCanonRanges:ranges('Anime Canon Episodes:')}, artwork:{file:`assets/series/${id}.${extension}`,sourcePage:source,imageUrl,retrievedOn:'2026-10-09'}, bytes:new Uint8Array(await response.arrayBuffer()) };
  } finally { dom.window.close(); }
}));
for (let index=0; index<results.length; index++) {
  if (results[index].status === 'rejected') console.error(series[index][0], results[index].reason.message);
}
if (results.some(result=>result.status === 'rejected')) process.exit(1);
const data = JSON.parse(await readFile(resolve(root,'data/episodes.json'),'utf8'));
const artwork = {};
await mkdir(resolve(root,'extension/assets/series'),{recursive:true});
for (const {value} of results) {
  data.series[value.id] = {...data.series[value.id], ...value.record};
  artwork[value.id] = value.artwork;
  await writeFile(resolve(root,'extension',value.artwork.file), value.bytes);
  console.log(`${value.record.name}: ${value.record.totalEpisodes} covered, ${value.record.fillerRanges.reduce((n,[a,b])=>n+b-a+1,0)} filler, ${value.bytes.length} image bytes`);
}
data.researchedOn = '2026-10-09';
data.profiles['user-list'].fallback = 'full-filler';
data.profiles['user-list'].fallbackDescription = 'En las demás series, se aplica Solo relleno completo.';
data.series['one-piece'].ongoing = true;
// Retain the separately reviewed continuation when this provider's list is older.
const continuation = data.series['one-piece'].coverageExtension;
if (continuation && continuation.start <= data.series['one-piece'].totalEpisodes + 1 && continuation.end > data.series['one-piece'].totalEpisodes) {
  data.series['one-piece'].baseGuideTotalEpisodes = data.series['one-piece'].totalEpisodes;
  data.series['one-piece'].totalEpisodes = continuation.end;
}
data.series['one-piece'].netflixRequiresEpisodeConfirmation = true;
data.series.bleach.edition = 'Serie original de 2004, episodios 1–366. No incluye Thousand-Year Blood War.';
data.series['dragon-ball-z'].edition = 'Dragon Ball Z original. No incluye Kai, Super, GT ni Daima.';
const compactRanges = value => JSON.stringify(value,null,2).replace(/\[\s*(\d+),\s*(\d+)\s*\]/g,'[$1,$2]').replace(/\[\s*(\[\d+,\d+\](?:,\s*\[\d+,\d+\])*)\s*\]/g,(_,ranges)=>'['+ranges.replace(/\s+/g,'')+']');
await writeFile(resolve(root,'data/episodes.json'),compactRanges(data)+'\n');
await writeFile(resolve(root,'data/artwork.json'),JSON.stringify(artwork,null,2)+'\n');
