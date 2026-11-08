const fs=require('fs'),vm=require('vm'),assert=require('node:assert/strict');
const src=fs.readFileSync(process.env.AI_POLICY_PATH??'extension/native-bridge.js','utf8');
const start=src.indexOf('attackableEnemy.filter(q=>lateTerritorial?'),end=src.indexOf(')){const bs=',start);
assert.ok(start>=0&&end>start,'production naval candidate selection exists');
const expression=src.slice(start,end+1),rankStart=src.indexOf('const landingCost=x=>'),rankEnd=src.indexOf('for(const target of targets.slice',rankStart);
assert.ok(rankStart>0&&rankEnd>rankStart,'production landing route ranking exists');
const rank=src.slice(rankStart,rankEnd),q=(id,army,land)=>({id:()=>id,troops:()=>army,numTilesOwned:()=>land});
const foes=Array.from({length:10},(_,i)=>q('e'+i,100+i*10,100*(i+1)**2));
function select(o={}){const ctx=vm.createContext({attackableEnemy:foes,seaUrgent:false,lateTerritorial:false,t:1000,troops:1000,profile:{},...o});return vm.runInContext(expression,ctx)}
assert.deepEqual(Array.from(select(),x=>x.id()),['e0','e1','e2','e3']);
assert.equal(select({lateTerritorial:true,t:1799}).length,4);
assert.equal(select({lateTerritorial:true,seaUrgent:true,t:1800}).length,8);
assert.equal(select({lateTerritorial:true,seaUrgent:true,t:1800})[0].id(),'e9');
assert.equal(select({lateTerritorial:true,seaUrgent:true,t:1800,profile:{huntTargetID:'e1'}})[0].id(),'e1');
assert.ok(select({lateTerritorial:true,seaUrgent:true,t:1800,troops:220}).every(x=>220>=x.troops()*1.35));
function order(targets,o={}){const ctx=vm.createContext({targets,seaUrgent:true,t:1800,lateTerritorial:true,troops:1000,Math,...o});vm.runInContext(rank,ctx);return Array.from(ctx.targets,x=>x.tile)}
assert.deepEqual(order([{tile:1,q:q('small',100,100),distance:1000},{tile:2,q:q('large',100,10000),distance:1000}]),[2,1]);
assert.deepEqual(order([{tile:1,q:q('near',100,10000),distance:1000},{tile:2,q:q('far',100,10000),distance:1000000}]),[1,2]);
assert.deepEqual(order([{tile:1,q:q('large',100,10000),distance:1000},{tile:2,q:null,distance:100}],{seaUrgent:false}),[2,1]);
const gate=src.slice(src.indexOf('const seaSquad='),src.indexOf('if(t-lastBoat>=120'));
function urgent({ownLand=10000,enemyLand=12000,ownArmy=1000,enemyArmy=900,late=true}={}){const own={...q('own',ownArmy,ownLand),isAlive:()=>true},enemy={...q('enemy',enemyArmy,enemyLand),isAlive:()=>true},ctx=vm.createContext({g:{players:()=>[own,enemy]},p:own,teammate:()=>false,lateTerritorial:late,Math});vm.runInContext(gate+';globalThis.result=seaUrgent',ctx);return ctx.result}
assert.equal(urgent(),true);assert.equal(urgent({ownLand:20000}),false);assert.equal(urgent({enemyArmy:100}),false);assert.equal(urgent({late:false}),false);
console.log('Passed production naval selection: early behavior, late yield, hunt priority, mandatory army advantage and route distance.');
