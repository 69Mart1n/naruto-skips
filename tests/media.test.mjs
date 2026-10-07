import {test} from 'node:test';
import assert from 'node:assert/strict';
import {readFile} from 'node:fs/promises';
import {JSDOM} from 'jsdom';
const script=await readFile(new URL('../extension/media.js',import.meta.url),'utf8');
function setup(){
  const dom=new JSDOM('<video></video><input>',{runScripts:'outside-only'});
  const w=dom.window,v=w.document.querySelector('video');
  Object.defineProperty(v,'readyState',{value:1});Object.defineProperty(v,'duration',{value:1200,configurable:true});
  const prefs={enabled:true,playbackSpeed:1,accelerateScenes:true,scenes:{}};
  w.chrome={storage:{local:{get:async()=>({scenes:prefs.scenes}),set:async values=>Object.assign(prefs,values)}}};
  w.eval(script);
  const controller=w.NarutoMedia.createController();
  const state={platform:'netflix',series:'naruto-shippuden',episode:321,route:'/watch/80143883',key:'321'};
  controller.update(state,prefs);
  return {w,v,prefs,controller,state};
}
test('holding V boosts speed, releases on keyup/blur, and leaves editable fields alone',()=>{
  const r=setup();
  try{
    r.v.playbackRate=1.25;
    r.w.document.dispatchEvent(new r.w.KeyboardEvent('keydown',{code:'KeyV'}));assert.equal(r.v.playbackRate,2);
    r.w.document.dispatchEvent(new r.w.KeyboardEvent('keyup',{code:'KeyV'}));assert.equal(r.v.playbackRate,1.25);
    r.w.document.querySelector('input').dispatchEvent(new r.w.KeyboardEvent('keydown',{code:'KeyV',bubbles:true}));assert.equal(r.v.playbackRate,1.25);
    r.w.document.dispatchEvent(new r.w.KeyboardEvent('keydown',{code:'KeyV'}));r.w.dispatchEvent(new r.w.Event('blur'));assert.equal(r.v.playbackRate,1.25);
  }finally{r.w.close();}
});
test('scene marks persist, merge overlapping ranges, and never apply to another edition or duration',async()=>{
  const r=setup();
  try{
    r.v.currentTime=50;assert.equal((await r.controller.command({key:'321',action:'end'},r.state,r.prefs)).ok,false);
    assert.equal((await r.controller.command({key:'321',action:'start'},r.state,r.prefs)).ok,true);
    r.v.currentTime=60;assert.equal((await r.controller.command({key:'old',action:'end'},r.state,r.prefs)).ok,false);
    assert.equal((await r.controller.command({key:'321',action:'end'},r.state,r.prefs)).ok,true);
    r.v.currentTime=55;r.controller.update(r.state,r.prefs);assert.equal(r.v.playbackRate,2);
    r.v.currentTime=70;r.controller.update(r.state,r.prefs);assert.equal(r.v.playbackRate,1);
    r.v.currentTime=55;await r.controller.command({key:'321',action:'start'},r.state,r.prefs);
    r.v.currentTime=80;await r.controller.command({key:'321',action:'end'},r.state,r.prefs);
    assert.equal(r.controller.info().segments,1);
    Object.defineProperty(r.v,'duration',{value:1300,configurable:true});r.v.currentTime=55;r.controller.update(r.state,r.prefs);assert.equal(r.v.playbackRate,1);
    Object.defineProperty(r.v,'duration',{value:1200,configurable:true});r.controller.update({...r.state,route:'/watch/different'},r.prefs);assert.equal(r.v.playbackRate,1);
    r.controller.update(r.state,r.prefs);assert.equal(r.v.playbackRate,2);
    await r.controller.command({key:'321',action:'clear'},r.state,r.prefs);r.controller.update(r.state,r.prefs);assert.equal(r.v.playbackRate,1);
  }finally{r.w.close();}
});
test('disabling automation or changing episode restores the prior playback rate',()=>{
  const r=setup();
  try{r.prefs.playbackSpeed=1.5;r.controller.update(r.state,r.prefs);assert.equal(r.v.playbackRate,1.5);r.prefs.enabled=false;r.controller.update(r.state,r.prefs);assert.equal(r.v.playbackRate,1);r.prefs.enabled=true;r.controller.update(r.state,r.prefs);r.controller.update(null,r.prefs);assert.equal(r.v.playbackRate,1);}finally{r.w.close();}
});
