const path=require('path');
const { chromium, chromePath } = require('./_paths.cjs');
(async()=>{
  const b=await chromium.launch({executablePath: chromePath,args:['--no-sandbox','--disable-dev-shm-usage']});
  const p=await b.newPage({viewport:{width:1200,height:800}});
  await p.goto('file://'+path.resolve('dist/index.html'));
  await p.waitForTimeout(2000);
  const out=await p.evaluate(()=>{
    const d=window.__dbg; const res=[];
    d.setExplode(1);
    ['battery','soc','screen','back_cover'].forEach(id=>{
      const pt=d.parts.find(x=>x.id===id);
      pt.mesh.updateMatrixWorld(true);
      const bb=new THREE.Box3().setFromObject(pt.mesh);
      const worldC=bb.getCenter(new THREE.Vector3());
      res.push({id, anchor:pt.anchor.toArray().map(v=>+v.toFixed(2)), pos:pt.mesh.position.toArray().map(v=>+v.toFixed(2)),
        worldCenter:worldC.toArray().map(v=>+v.toFixed(2)),
        labelUsed:pt.anchor.clone().add(pt.mesh.position).toArray().map(v=>+v.toFixed(2))});
    });
    return res;
  });
  console.log(JSON.stringify(out,null,1));
  await b.close();
})();
