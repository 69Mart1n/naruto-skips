import {test} from 'node:test';
import assert from 'node:assert/strict';
import {readFile} from 'node:fs/promises';
import {runInNewContext} from 'node:vm';
const script=await readFile(new URL('../extension/background.js',import.meta.url),'utf8');
test('media broker forwards only to a recent frame for the same episode and removes closed tabs',async()=>{
  const listeners=[],calls=[];let removed,now=0;
  const chrome={runtime:{onMessage:{addListener:fn=>listeners.push(fn)}},tabs:{sendMessage:async(...args)=>{calls.push(args);return {available:true};},onRemoved:{addListener:fn=>removed=fn}}};
  runInNewContext(script,{chrome,Date:{now:()=>now}});
  const broker=listeners[1];
  const message=(msg,sender)=>new Promise(resolve=>broker(msg,sender,resolve));
  await message({type:'media-frame',key:'episode-a'},{tab:{id:1},frameId:2});
  const result=await message({type:'media-request',command:{type:'media-info',key:'episode-a'}},{tab:{id:1},frameId:0});
  assert.equal(result.available,true);assert.equal(calls[0][2].frameId,2);
  assert.equal((await message({type:'media-request',command:{type:'media-action',key:'episode-b'}},{tab:{id:1},frameId:0})).ok,false);
  now=6000;assert.equal((await message({type:'media-request',command:{type:'media-info',key:'episode-a'}},{tab:{id:1},frameId:0})).available,false);
  now=0;removed(1);assert.equal((await message({type:'media-request',command:{type:'media-info',key:'episode-a'}},{tab:{id:1},frameId:0})).available,false);
  assert.equal(calls.length,1);
});
