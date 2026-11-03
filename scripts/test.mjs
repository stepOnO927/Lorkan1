import {readdirSync} from 'node:fs';
import {spawnSync} from 'node:child_process';
const files=readdirSync('tests').filter(f=>f.endsWith('.cjs')).sort();
let failures=0;for(const file of files){const r=spawnSync(process.execPath,['tests/'+file],{stdio:'inherit'});if(r.status!==0)failures++;}
if(failures)process.exitCode=1;else console.log('Passed '+files.length+' test files.');
