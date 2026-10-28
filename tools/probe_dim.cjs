const path=require('path');
const { chromium, chromePath } = require('./_paths.cjs');
(async()=>{
  const b=await chromium.launch({executablePath: chromePath,args:['--no-sandbox','--disable-dev-shm-usage']});
  const p=await b.newPage({viewport:{width:1600,height:950}});
  await p.goto('file://'+path.resolve('dist/index.html'));
  await p.waitForTimeout(2000);
  const r=await p.evaluate(()=>{
    const d=window.__dbg;
    d.setExplode(1); d.select('battery'); d.snapFocus();
    return d.parts.map(x=>({id:x.id,dim:+x.dim.toFixed(2),glow:+x.glow.toFixed(2)}));
  });
  console.log(JSON.stringify(r));
  await b.close();
})();
