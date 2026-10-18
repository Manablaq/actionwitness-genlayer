import { spawnSync } from 'node:child_process';
const r=spawnSync('npm',['audit','--json','--omit=dev'],{encoding:'utf8',timeout:40000,maxBuffer:3000000});
try {
  const v=JSON.parse(r.stdout);
  if(v.error){console.log('SECURITY_AUDIT=UNAVAILABLE '+String(v.error.code||''));process.exit(0)}
  const list=Object.entries(v.vulnerabilities||{}).map(([name,entry])=>({name,severity:entry.severity,direct:entry.isDirect,range:entry.range,fixAvailable:entry.fixAvailable}));
  console.log('SECURITY_AUDIT_RUNTIME='+JSON.stringify({counts:v.metadata?.vulnerabilities||{},packages:list}));
} catch {console.log('SECURITY_AUDIT=INCONCLUSIVE');}
