import {createScriptedRunner,scriptedGameStart} from './tests/util/ScriptedGame';
import {GameMapSize,UnitType} from '@openfront/engine-api/game/GameTypes';
import fs from 'node:fs';
const out = '../../outputs';
const names=['极速扩张','经济优先','军事突袭','均衡外交'];
const ids=['OVER0001','OVER0002','OVER0003','OVER0004'];
const previous=JSON.parse(fs.readFileSync(`${out}/results-first24.json`,'utf8'));
const wins=names.map(n=>previous.wins[n]), results:any[]=[...previous.results];
const offset=24;
const permutations:number[][]=[];
function perm(a:number[],b:number[]=[]){if(!a.length)permutations.push(b);else a.forEach((x,i)=>perm(a.filter((_,j)=>j!==i),[...b,x]));}perm([0,1,2,3]);
const startTime=Date.now();
console.debug=()=>{};
for(let round=0;round<Number(process.env.ROUNDS??24);round++){
 const seats=permutations[round%24];
 const start=scriptedGameStart({gameMapSize:GameMapSize.Normal,nations:"disabled",bots:0,infiniteGold:false,infiniteTroops:false,instantBuild:false,doomsdayClock:{enabled:false,speed:'normal'},customAllianceDuration:1});
 start.gameID='OVERLORD-BATCH-'+Math.floor(round/24);
 start.players=seats.map(s=>({clientID:ids[s],username:names[s],clanTag:null,isLobbyCreator:false}));
 const runner=await createScriptedRunner('big_plains',start),g=runner.game;
 const positions=[[35,35],[164,35],[164,164],[35,164]];
 const frames:any[]=[],counts=names.map(()=>({attack:0,build_unit:0,allianceRequest:0,breakAlliance:0}));
 function build(p:any,s:number,t:number){
  const options=s===1?[UnitType.City,UnitType.Factory]:s===2?[UnitType.DefensePost,UnitType.City]:[UnitType.City,UnitType.DefensePost];
  for(const unit of options){
   if(p.gold()<g.unitInfo(unit).cost(g,p))continue;
   const tiles=[...p.tiles()];
   for(let k=0;k<30;k++){const tile=tiles[(t*17+k*97)%tiles.length];if(tile!==undefined&&p.canBuild(unit,tile)!==false)return {type:'build_unit',unit,tile};}
  }return null;
 }
 function decide(p:any,s:number,t:number):any{
  if(!p.isAlive())return null;
  const others=g.players().filter(q=>q!==p&&q.isAlive());
  if(p.allies().length&&others.length===1)return {type:'breakAlliance',recipient:others[0].id()};
  const requests=p.incomingAllianceRequests();
  if(requests.length&&s!==2&&others.length>1&&p.allies().length===0)return {type:'allianceRequest',recipient:requests[0].requestor().id()};
  if(s===3&&t%100===0&&others.length>1&&p.allies().length===0){
   const q=others.filter(q=>p.canSendAllianceRequest(q)).sort((a,b)=>a.numTilesOwned()-b.numTilesOwned())[0];
   if(q)return {type:'allianceRequest',recipient:q.id()};
  }
  if((s===1&&t%30===0)||(s===3&&t%60===0)||(s===2&&t%100===0)||(s===0&&t%150===0)){
   const b=build(p,s,t);if(b)return b;
  }
  const near=p.nearby(),neutral=near.some(q=>!q.isPlayer());
  const enemies=near.filter(q=>q.isPlayer()&&!p.isFriendly(q)).sort((a,b)=>a.troops()-b.troops());
  const target=enemies[0];
  const has=(id:any)=>p.outgoingAttacks().some(a=>a.target().id()===id);
  const threshold=[1.25,1.8,.75,1.35][s];
  if(target&&p.troops()>target.troops()*threshold&&(!neutral||s===2)&&!has(target.id()))return {type:'attack',targetID:target.id(),troops:p.troops()*[.35,.25,.55,.3][s]};
  if(neutral&&!has(g.terraNullius().id())&&p.troops()>300)return {type:'attack',targetID:null,troops:p.troops()*[.45,.18,.25,.28][s]};
  if(target&&!has(target.id())&&p.troops()>target.troops()*threshold)return {type:'attack',targetID:target.id(),troops:p.troops()*[.35,.25,.55,.3][s]};
  return null;
 }
 for(let t=0;t<18000;t++){
  const intents:any[]=[];
  for(let seat=0;seat<4;seat++){
   const s=seats[seat],p=g.playerByClientID(ids[s]);if(!p)continue;
   let a:any=null;
   if(g.inSpawnPhase()){if(!p.hasSpawned()&&t===5)a={type:'spawn',tile:g.ref(...positions[seat] as [number,number])};}
   else if(t%10===0)a=decide(p,s,t);
   if(a){intents.push({...a,clientID:ids[s]});if(a.type in counts[s])counts[s][a.type]++;}
  }
  runner.addTurn({turnNumber:t,intents});
  if(!runner.executeNextTick())throw Error('Tick failed '+t);
  if(t%100===0||g.getWinner()){
   const players=ids.map((id,s)=>{const p=g.playerByClientID(id);return {name:names[s],tiles:p?.numTilesOwned()??0,troops:Math.round(p?.troops()??0),gold:String(p?.gold()??0),cities:p?.units(UnitType.City).length??0};});
   const cells:number[]=[];
   for(let y=0;y<200;y+=2)for(let x=0;x<200;x+=2){const o=g.owner(g.ref(x,y));cells.push(o.isPlayer()?ids.indexOf(o.clientID()!)+1:0);}
   frames.push({tick:t,players,cells});
  }
  if(g.getWinner())break;
 }
 const winner:any=g.getWinner();const wi=winner&&typeof winner.clientID==='function'?ids.indexOf(winner.clientID()):-1;
 if(wi>=0)wins[wi]++;
 const result={round:offset+round+1,seats:seats.map(s=>names[s]),winner:wi>=0?names[wi]:null,ticks:g.ticks(),counts,final:frames.at(-1).players};
 results.push(result);
 fs.writeFileSync(`${out}/round-${offset+round+1}.json`,JSON.stringify({result,frames}));
 fs.writeFileSync(`${out}/results.json`,JSON.stringify({engine:'OpenFrontIO unmodified rules; custom intent policies',map:'big_plains 200x200',decisionInterval:10,tickLimit:18000,wins:Object.fromEntries(names.map((n,i)=>[n,wins[i]])),elapsedSeconds:(Date.now()-startTime)/1000,results},null,2));
 console.log(JSON.stringify({round:round+1,winner:result.winner,ticks:result.ticks,wins}));
}

