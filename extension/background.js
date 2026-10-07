// Only extension content scripts can use this broker; no externally_connectable surface.
chrome.runtime.onMessage.addListener((message, sender, reply) => {
  if (message?.type !== 'top-state' || !sender.tab || sender.frameId === 0) return;
  chrome.tabs.sendMessage(sender.tab.id, { type: 'status' }, { frameId: 0 }).then(reply).catch(() => reply(null));
  return true;
});
const mediaFrames = new Map();
chrome.runtime.onMessage.addListener((message,sender,reply) => {
  if (!sender.tab) return;
  if (message?.type === 'media-frame' && sender.frameId !== 0) {
    mediaFrames.set(sender.tab.id,{frameId:sender.frameId,key:message.key,at:Date.now()});
    reply({ok:true}); return;
  }
  if(message?.type !== 'media-request' || sender.frameId !== 0) return;
  const frame = mediaFrames.get(sender.tab.id);
  if(!frame || Date.now()-frame.at>5000 || frame.key !== message.command?.key || !['media-info','media-action'].includes(message.command?.type)) {reply({available:false,ok:false,reason:'Esperando el reproductor.'});return;}
  chrome.tabs.sendMessage(sender.tab.id,message.command,{frameId:frame.frameId}).then(reply).catch(()=>reply({available:false,ok:false,reason:'Recargá el reproductor.'}));
  return true;
});
chrome.tabs.onRemoved.addListener(tabId=>mediaFrames.delete(tabId));
