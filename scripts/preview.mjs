// Local design preview. Mock Chrome APIs stay here, outside the extension package.
import { createServer } from 'node:http';
import { readFile } from 'node:fs/promises';
import { resolve, dirname, extname, sep } from 'node:path';
import { fileURLToPath } from 'node:url';
const root = resolve(dirname(fileURLToPath(import.meta.url)), '../dist/extension');
const ids = ['naruto','naruto-shippuden','one-piece','bleach','dragon-ball','dragon-ball-z','black-clover'];
const types = {'.html':'text/html; charset=utf-8','.js':'text/javascript; charset=utf-8','.css':'text/css; charset=utf-8','.png':'image/png','.jpg':'image/jpeg','.webp':'image/webp'};
const mock = `<script>
const previewSeries=new URLSearchParams(location.search).get('series') || 'naruto';
const previewStorage='anime-skips-preview-'+previewSeries;
let previewPrefs=JSON.parse(localStorage.getItem(previewStorage)||'{}');
window.chrome={storage:{local:{get:async defaults=>({...defaults,themeSelection:previewSeries,...previewPrefs}),set:async values=>{Object.assign(previewPrefs,values);localStorage.setItem(previewStorage,JSON.stringify(previewPrefs));}}},tabs:{query:async()=>[{id:1}],sendMessage:async (tabId,message)=>{
if(message.type==='media-info')return {available:false};
if(message.type==='status')return {series:previewSeries,episode:1,type:'manga-canon',position:{season:1,episode:1},omit:false,key:'preview',reason:'Vista previa con reproductor simulado. El capítulo 1 se conserva.'};
return {ok:false,reason:'Esta vista previa sólo permite probar el diseño.'};
}}};
</script>`;
const server = createServer(async (request,response) => {
  try {
    const url = new URL(request.url,'http://127.0.0.1');
    if(url.pathname==='/designs') {
      const html=`<!doctype html><html lang="es"><meta charset="utf-8"><title>Anime Skips · siete diseños</title><style>*{box-sizing:border-box}body{margin:0;padding:28px;background:#101116;color:#f7f6f3;font-family:system-ui}h1{font-size:26px;margin:0}p{color:#aeb6c3;font-size:13px;margin:8px 0 22px}.grid{display:grid;grid-template-columns:repeat(auto-fit,260px);gap:14px}.tile{width:260px;height:400px;overflow:hidden;border-radius:14px;border:1px solid #353b48}iframe{border:0;width:390px;height:600px;transform:scale(.6666667);transform-origin:top left}</style><h1>Anime Skips · elegí tu universo</h1><p>Diseño original de Naruto Skips y stickers por anime. Tocá Cambiar anime para explorar. Vista previa con reproducción simulada.</p><div class="grid">${ids.map(id=>`<div class="tile"><iframe title="${id}" src="/popup.html?series=${id}&gallery=1"></iframe></div>`).join('')}</div></html>`;
      response.writeHead(200,{'content-type':types['.html']});response.end(html);return;
    }
    const filename=resolve(root,'.'+decodeURIComponent(url.pathname==='/'?'/popup.html':url.pathname));
    if(!filename.startsWith(root+sep)) {response.writeHead(403);response.end();return;}
    let body=await readFile(filename);
    if(extname(filename)==='.html') {
      body=body.toString().replace('<script src="data/episodes.js">',mock+'<script src="data/episodes.js">');
      if(!url.searchParams.has('gallery')) body=body.replace('</head>','<style>:root{width:auto;height:auto;overflow:auto;background:#080b11}body{margin:18px auto;box-shadow:0 20px 80px #0009;border:1px solid #353b48;border-radius:15px}header{border-radius:15px 15px 0 0}</style></head>');
    }
    response.writeHead(200,{'content-type':types[extname(filename)]??'application/octet-stream'});response.end(body);
  } catch {response.writeHead(404);response.end('Not found');}
});
server.listen(4173,'127.0.0.1',()=>console.log('Design preview: http://127.0.0.1:4173/designs'));
