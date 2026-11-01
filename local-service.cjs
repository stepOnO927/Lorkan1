const http=require('node:http'),fs=require('node:fs'),path=require('node:path'),{spawn}=require('node:child_process');
const root=path.resolve(__dirname),engine=path.resolve(process.env.OPENFRONT_DIR||path.join(root,'../../work/OpenFrontIO'));
let state={running:false,exitCode:null,log:''};
http.createServer((req,res)=>{
 const origin=req.headers.origin||'';
 const allowed=origin==='http://127.0.0.1:8765'||origin==='http://localhost:8765'||/^chrome-extension:\/\/[a-p]{32}$/.test(origin);
 if(allowed){res.setHeader('Access-Control-Allow-Origin',origin);res.setHeader('Vary','Origin');res.setHeader('Access-Control-Allow-Headers','Content-Type');res.setHeader('Access-Control-Allow-Methods','GET, POST, OPTIONS');}
 const json=(code,data)=>{res.writeHead(code,{'Content-Type':'application/json; charset=utf-8'});res.end(JSON.stringify(data))};
 if(req.method==='OPTIONS'){res.writeHead(allowed?204:403);return res.end()}
 if(req.url==='/api/status')return json(200,state);
 if(req.url==='/api/run'){
  if(req.method!=='POST'||!allowed||req.headers['content-type']!=='application/json')return json(403,{error:'Only local extension requests are accepted'});
  if(state.running)return json(409,{error:'已有自动赛在运行'});
  if(!fs.existsSync(path.join(engine,'node_modules/tsx'))||!fs.existsSync(path.join(engine,'tournament.ts')))return json(503,{error:'本地 OpenFront 引擎尚未配置，请按 README 配置 OPENFRONT_DIR'});
  state={running:true,exitCode:null,log:''};
  const child=spawn(process.execPath,['--import','tsx','tournament.ts'],{cwd:engine,env:{...process.env,ROUNDS:'48'},windowsHide:true,stdio:['ignore','pipe','pipe']});
  const collect=b=>{state.log=(state.log+b.toString()).slice(-16000)};child.stdout.on('data',collect);child.stderr.on('data',collect);child.on('error',e=>{state.running=false;state.log+=e.message});child.on('close',code=>{state.running=false;state.exitCode=code});return json(202,{started:true});
 }
 if(req.method!=='GET')return json(405,{error:'Method not allowed'});
 const name=decodeURIComponent(req.url.split('?')[0]);if(name==='/'){
  res.writeHead(200,{'Content-Type':'text/html; charset=utf-8'});return res.end('<meta charset="utf-8"><title>Lorkan1 本地 AI</title><h1>Lorkan1 本地自动赛</h1><p>安装扩展后，右侧菜单可启动四策略自动赛。</p><a href="/index.html">查看已保存的72局回放</a><pre id="status"></pre><script>setInterval(async()=>{const r=await fetch("/api/status");const s=await r.json();document.getElementById("status").textContent=(s.running?"运行中":"就绪 / 已结束")+"\\n"+s.log},2000)</script>');
 }
 const file=path.resolve(root,'.'+name);if(!file.startsWith(root+path.sep))return json(403,{error:'Forbidden'});
 fs.readFile(file,(error,data)=>{if(error)return json(404,{error:'Not found'});res.setHeader('Content-Type',file.endsWith('.html')?'text/html; charset=utf-8':'text/plain; charset=utf-8');res.end(data)});
}).listen(8765,'127.0.0.1',()=>console.log('Lorkan1: http://127.0.0.1:8765'));
