(function(root){
 'use strict';
 const median=a=>{if(!a.length)return null;const s=a.slice().sort((a,b)=>a-b);return s[Math.floor(s.length/2)]};
 function analyze(record){
  if(!record||record.schema!=='lorkan-observation-v1')throw Error('不支持此格式。当前支持 Lorkan 实测观察记录 v1；FrontWars 原生回放适配尚未完成。');
  if(record.completed!==true||typeof record.winnerId!=='string')throw Error('没有引擎正式判定的胜者；未决对局不能用作胜者学习。');
  if(!Array.isArray(record.samples)||record.samples.length>100000)throw Error('观察记录数量无效');
  const rows=record.samples.filter(x=>x.playerId===record.winnerId).sort((a,b)=>a.tick-b.tick);
  if(!rows.length)throw Error('记录缺少胜者的状态轨迹');
  const first={},last=rows.at(-1);for(const row of rows)for(const [type,n] of Object.entries(row.units||{}))if(Number(n)>0&&first[type]===undefined)first[type]=row.tick;
  const commitments=rows.flatMap(r=>Array.isArray(r.attackRatios)?r.attackRatios:[]).filter(n=>Number.isFinite(n)&&n>0&&n<=1);
  const neutral=rows.flatMap(r=>Array.isArray(r.neutralRatios)?r.neutralRatios:[]).filter(n=>Number.isFinite(n)&&n>0&&n<=1);
  const cities=Number(last.units?.City||0),factories=Number(last.units?.Factory||0);
  return {gameId:String(record.gameId||''),source:String(record.source||'unknown'),winnerId:record.winnerId,ticks:last.tick,observedBuildOrder:Object.entries(first).sort((a,b)=>a[1]-b[1]).map(([type,tick])=>({type,firstObservedTick:tick})),finalUnits:last.units||{},finalTiles:Number(last.tiles||0),factoryPerCity:cities?factories/cities:null,medianObservedAttackRatio:median(commitments),medianObservedNeutralRatio:median(neutral),trainGold:String(last.trainGold||0),tradeGold:String(last.tradeGold||0),limitations:'每100刻采样；出现时间是首次观察，不是精确指令时刻。观察到的攻击比例不是原始操作参数；胜者打法不是获胜因果证明。'};
 }
 root.LorkanReplayAnalysis={analyze};
 if(typeof module==='object'&&module.exports)module.exports=root.LorkanReplayAnalysis;
})(globalThis);
