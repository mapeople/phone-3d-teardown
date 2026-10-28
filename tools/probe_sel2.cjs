const path=require('path');
const { chromium, chromePath } = require('./_paths.cjs');
(async()=>{
  const b=await chromium.launch({executablePath: chromePath,args:['--no-sandbox','--disable-dev-shm-usage']});
  const p=await b.newPage({viewport:{width:1600,height:950}});
  await p.goto('file://'+path.resolve('dist/index.html'));
  await p.waitForTimeout(2000);
  const r=await p.evaluate(()=>{
    const d=window.__dbg;
    d.setExplode(0.85,true); d.select('battery'); d.snapFocus();
    const dump=id=>{
      const pt=d.parts.find(x=>x.id===id);
      return pt.mats.map(m=>({c:'#'+m.color.getHexString(), e:'#'+m.emissive.getHexString(), ei:+m.emissiveIntensity.toFixed(2), r:+m.roughness.toFixed(2), mt:m.metalness, map:!!m.map, emap:!!m.emissiveMap}));
    };
    return {battery:dump('battery'), screen:dump('screen')};
  });
  console.log(JSON.stringify(r,null,1));
  await b.close();
})();
