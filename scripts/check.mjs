import {readdirSync} from 'node:fs';
import {spawnSync} from 'node:child_process';
let failures=0;for(const file of readdirSync('extension').filter(f=>f.endsWith('.js'))){const r=spawnSync(process.execPath,['--check','extension/'+file],{stdio:'inherit'});if(r.status!==0)failures++;}if(failures)process.exitCode=1;else console.log('Extension JavaScript syntax checks passed.');
