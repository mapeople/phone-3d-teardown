const path=require('path');
const { chromium, chromePath } = require('./_paths.cjs');
(async()=>{
  const b=await chromium.launch({executablePath: chromePath,args:['--no-sandbox','--disable-dev-shm-usage']});
  const p=await b.newPage({viewport:{width:1200,height:800}});
  await p.goto('file://'+path.resolve('dist/index.html'));
  await p.waitForTimeout(2000);
  const r=await p.evaluate(()=>{
    const d=window.__dbg;
    d.setExplode(0.85,true);
    d.select('battery');
    d.snapFocus();
    const out=[];
    d.parts.forEach(pt=>{
      const m=pt.mats[0];
      out.push({id:pt.id, dim:+pt.dim.toFixed(2), glow:+pt.glow.toFixed(2),
        col:'#'+m.color.getHexString(), em:'#'+m.emissive.getHexString(), ei:+m.emissiveIntensity.toFixed(2), rough:+m.roughness.toFixed(2), n:pt.mats.length});
    });
    return out;
  });
  console.log(JSON.stringify(r,null,0));
  await b.close();
})();
