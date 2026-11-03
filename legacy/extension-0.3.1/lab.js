(()=>{'use strict';const $=id=>document.getElementById(id);let report=null;const key='lorkan-reviewed-winner';
function show(){
 const names={'City':'城市','Factory':'工厂','Port':'港口','Transport':'运输船','Defense Post':'要塞','Trade Ship':'贸易船','Train':'火车','Warship':'军舰','Shell':'舰炮','Missile Silo':'发射井','SAM Launcher':'防空塔','Atom Bomb':'原子弹','Hydrogen Bomb':'氢弹','MIRV':'MIRV'};
 const clock=t=>Math.floor(t/600).toString().padStart(2,'0')+':'+Math.floor(t/10%60).toString().padStart(2,'0');
 $('output').textContent=report?`正式胜者：${report.winnerId}\n本地完整游戏 · ${report.gameId}\n结束时间：${clock(report.ticks)}\n\n首次观察到的建筑与兵种\n${report.observedBuildOrder.map(x=>clock(x.firstObservedTick)+'  '+(names[x.type]||x.type)).join('\n')}\n\n终局持有：城市 ${report.finalUnits.City||0} · 工厂 ${report.finalUnits.Factory||0} · 港口 ${report.finalUnits.Port||0}\n累计铁路收入：${Number(report.trainGold).toLocaleString()}\n累计海运收入：${Number(report.tradeGold).toLocaleString()}\n\n首次出现可能来自建设、生产或缴获。采样不能复原原始操作；获胜不等于已证明打法因果关系。`:'尚未导入对局。不会填入虚构的胜者数据。';$('save').disabled=!report;
}
$('consent').onchange=()=>{$('file').disabled=!$('consent').checked};
$('sample').onclick=async()=>{try{report=LorkanReplayAnalysis.analyze(await fetch('sample-observation.json').then(r=>r.json()));show()}catch(e){$('output').textContent=e.message}};
$('file').onchange=async()=>{try{const file=$('file').files[0];if(!file)return;if(file.size>20*1024*1024)throw Error('文件超过20MB限制');report=LorkanReplayAnalysis.analyze(JSON.parse(await file.text()));localStorage.setItem(key,JSON.stringify(report));show()}catch(e){$('output').textContent=e.message;report=null;$('save').disabled=true}};
$('clear').onclick=()=>{localStorage.removeItem(key);report=null;$('file').value='';show()};
$('save').onclick=()=>{if(!report)return;const url=URL.createObjectURL(new Blob([JSON.stringify(report,null,2)],{type:'application/json'})),a=document.createElement('a');a.href=url;a.download='lorkan-winner-report.json';a.click();setTimeout(()=>URL.revokeObjectURL(url),1000)};
try{report=JSON.parse(localStorage.getItem(key)||'null')}catch{}show();})();
