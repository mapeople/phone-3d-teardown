const path=require('path');
const { chromium, chromePath } = require('./_paths.cjs');
(async()=>{
  const b=await chromium.launch({executablePath: chromePath,args:['--no-sandbox','--disable-dev-shm-usage']});
  const p=await b.newPage({viewport:{width:1600,height:950}});
  await p.goto('file://'+path.resolve('dist/index.html'));
  await p.waitForTimeout(2000);
  const r=await p.evaluate(()=>{
    const d=window.__dbg;
    d.setExplode(0.85,true);
    d.select('battery');
    d.snapFocus();
    // 等 500ms 后再看 dim/glow 是否被 animate 覆盖
    return new Promise(res=>setTimeout(()=>{
      const p1=d.parts.find(x=>x.id==='battery');
      const p2=d.parts.find(x=>x.id==='screen');
      res({sel:{dim:p1.dim,glow:p1.glow}, other:{dim:p2.dim,glow:p2.glow}, state:d.state});
    },600));
  });
  console.log(JSON.stringify(r));
  await b.close();
})();
