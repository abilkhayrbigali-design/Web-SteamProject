// Run both acceptance suites against the same deployed origin.
const {spawnSync}=require('node:child_process');
const path=require('node:path');
const base=process.env.HUB_BASE_URL || 'https://chinusoid.github.io/Web-SteamProject';
for(const file of ['final.cjs','published.cjs']) {
  const result=spawnSync(process.execPath,[path.join(__dirname,file)],{
    cwd:path.resolve(__dirname,'..'),stdio:'inherit',env:{...process.env,HUB_BASE_URL:base},
  });
  if(result.error)throw result.error;
  if(result.status!==0)process.exit(result.status||1);
}
