(()=>{'use strict';const host=location.hostname,official=host==='frontwars.io'||host==='www.frontwars.io';
if(!official)return;
// Read-only surface diagnostics only. No clicks, socket hooks, worker hooks, account reads or fabricated control acknowledgements.
window.addEventListener('message',e=>{
 if(e.source!==window||e.origin!==location.origin||e.data?.source!=='lorkan-diagnostic-request')return;
 window.postMessage({source:'lorkan-diagnostic-result',site:'frontwars.io',version:'0.4.0',pageReady:document.readyState,canvasCount:document.querySelectorAll('canvas').length,capabilities:{pageMenu:true,liveState:false,sendGameIntent:false,nativeReplayImport:false},reason:'Current FrontWars runtime protocol has not been validated; local OpenFront bridge is incompatible.'},location.origin);
});})();
