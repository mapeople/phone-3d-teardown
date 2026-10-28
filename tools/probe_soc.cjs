const path=require('path');
const { chromium, chromePath } = require('./_paths.cjs');
(async()=>{
  const b=await chromium.launch({executablePath: chromePath,args:['--no-sandbox','--disable-dev-shm-usage']});
  const p=await b.newPage({viewport:{width:1200,height:800}});
  await p.goto('file://'+path.resolve('dist/index.html'));
  await p.waitForTimeout(2000);
  const r=await p.evaluate(()=>{
    const d=window.__dbg;
    const soc=d.parts.find(x=>x.id==='soc');
    const out=[];
    soc.mesh.traverse(o=>{
      if(!o.isMesh) return;
      const m=o.material;
      out.push({
        geo:o.geometry.type,
        mat:m.type,
        map: m.map? (m.map.image && m.map.image.width)+'x'+(m.map.image && m.map.image.height) : null,
        emMap: m.emissiveMap? 'yes':'no',
        color: m.color? '#'+m.color.getHexString():null,
        emissive: m.emissive? '#'+m.emissive.getHexString():null,
        ei: m.emissiveIntensity,
      });
    });
    return out;
  });
  console.log(JSON.stringify(r,null,1));
  await b.close();
})();
