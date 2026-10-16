// Explicit research step; builds never contact these sites.
import { mkdir, writeFile, readFile } from 'node:fs/promises';
import { createHash } from 'node:crypto';
const assets = [
  ['straw-hat.png','Sombrero de paja','https://imgflip.com/memetemplate/420027909/Straw-Hat','https://i.imgflip.com/6y2nlx.png'],
  ['gum-fruit.avif','Fruta de Luffy','https://pngdownload.io/png-image/gomu-gomu-no-mi-one-piece-devil-fruit-luffys-power-source-transparent-png-image/','https://pngdownload.io/wp-content/uploads/2025/08/Gomu-Gomu-no-Mi-One-Piece-Devil-Fruit.avif'],
  ['ichigo-mask.png','Máscara Hollow de Ichigo','https://www.clipartmax.com/max/m2i8A0m2N4d3K9d3/','https://www.clipartmax.com/png/full/226-2260131_ichigo-hollow-mask-by-hylian-shield-master-ichigo-hollow-mask-png.png'],
  ['shinigami-badge.png','Insignia de shinigami sustituto','https://www.pngkey.com/maxpic/u2w7a9y3e6i1e6i1/','https://www.pngkey.com/png/full/169-1695428_open-bleach-insignia-shinigami-sustituto.png'],
  ['dragon-ball.png','Esfera de cuatro estrellas','https://www.citypng.com/photo/27984/hd-dragon-ball-z-dbz-seven-crystal-balls-png','https://www.citypng.com/public/uploads/preview/hd-png-dragon-ball-z-dbz-crystal-ball-4-stars-11664327357fukqwtt5yh.png'],
  ['nimbus.png','Nube voladora','https://www.nicepng.com/maxp/u2y3q8q8e6e6o0o0/','https://www.nicepng.com/png/full/954-9546201_nube-nubevoladora-dragonball-kid-goku-iphone-x.png'],
  ['scouter.png','Scouter','https://www.pngaaa.com/detail/5584919','https://image.pngaaa.com/919/5584919-middle.png'],
  ['great-ape.png','Ozaru','https://www.realclipart.com/middle/m2i8Z5Z5m2d3Z5d3_share-this-image-great-ape-dragon-ball-z/','https://www.realclipart.com/png/middle/106-1061848_share-this-image-great-ape-dragon-ball-z.png'],
  ['five-leaf-clover.png','Trébol de cinco hojas','https://www.stickpng.com/img/games/black-clover-quartet-knights/black-five-leaved-clover','https://assets.stickpng.com/images/628c8637bbec114743bed4c2.png'],
  ['asta.png','Asta con espada y grimorio','https://sp.shonenjump.com/j/sp_bclover/story/index.html','https://sp.shonenjump.com/j/sp_bclover/story/_img/chara1.png']
];
await mkdir('extension/assets/stickers',{recursive:true});
const previous=JSON.parse(await readFile('data/stickers.json','utf8').catch(()=>'[]'));
const results=await Promise.allSettled(assets.map(async([filename,name,sourcePage,imageUrl])=>{
  const response=await fetch(imageUrl,{signal:AbortSignal.timeout(20000)});
  if(!response.ok) throw new Error(`${filename}: HTTP ${response.status}`);
  const bytes=Buffer.from(await response.arrayBuffer());
  const png=bytes.subarray(0,8).equals(Buffer.from([137,80,78,71,13,10,26,10]));
  if(!png && !response.headers.get('content-type')?.startsWith('image/')) throw new Error(`${filename}: not an image`);
  if(bytes.length>5_000_000) throw new Error(`${filename}: oversized image`);
  const file=`assets/stickers/${filename}`;
  await writeFile(`extension/${file}`,bytes);
  return {file,name,sourcePage,imageUrl,retrievedOn:'2026-10-09',sha256:createHash('sha256').update(bytes).digest('hex'),bytes:bytes.length};
}));
for(let i=0;i<results.length;i++) if(results[i].status==='rejected') console.error(assets[i][0],results[i].reason.message);
await writeFile('data/stickers.json',JSON.stringify([...results.filter(r=>r.status==='fulfilled').map(r=>r.value),...previous.filter(r=>r.generatedWith)],null,2)+'\n');
console.log(`Downloaded ${results.filter(r=>r.status==='fulfilled').length}/${assets.length} assets.`);
if(results.some(r=>r.status==='rejected')) process.exitCode=1;
