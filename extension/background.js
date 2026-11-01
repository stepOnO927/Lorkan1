chrome.runtime.onMessage.addListener((message,sender,reply)=>{
 if(message.type!=='lorkan-local-run')return;
 let url;try{url=new URL(sender.url)}catch{return}
 if(!['127.0.0.1','localhost'].includes(url.hostname)){reply({error:'自动对战仅支持本地环境'});return}
 fetch('http://127.0.0.1:8765/api/run',{method:'POST',headers:{'Content-Type':'application/json'},body:'{}'}).then(async r=>{const value=await r.json();reply(value)}).catch(()=>reply({error:'本地对战服务未启动，请先按 README 启动服务'}));return true;
});
