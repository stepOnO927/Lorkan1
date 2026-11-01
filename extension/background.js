chrome.runtime.onMessage.addListener((message,sender)=>{
 if(message?.type!=='lorkan-open-lab')return;
 let host;try{host=new URL(sender.url).hostname}catch{return}
 if(!['frontwars.io','www.frontwars.io','localhost','127.0.0.1'].includes(host))return;
 chrome.tabs.create({url:chrome.runtime.getURL('lab.html')});
});
