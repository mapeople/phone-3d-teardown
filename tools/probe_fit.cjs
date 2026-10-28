const path=require('path');
const { chromium, chromePath } = require('./_paths.cjs');
(async()=>{
  const b=await chromium.launch({executablePath: chromePath,args:['--no-sandbox','--disable-dev-shm-usage']});
  const p=await b.newPage({viewport:{width:1600,height:950}});
  await p.goto('file://'+path.resolve('dist/index.html'));
  await p.waitForTimeout(2200);
  const out=await p.evaluate(()=>{
    const d=window.__dbg; const r={};
    d.setExplode(0); r.t0=d.fitRadius(0);
    d.setExplode(1); r.t1=d.fitRadius(1);
    r.orbit=d.orbit.des.r;
    return r;
  });
  console.log(JSON.stringify(out));
  await b.close();
})();
