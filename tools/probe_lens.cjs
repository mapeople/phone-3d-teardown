const path=require('path');
const { chromium, chromePath } = require('./_paths.cjs');
(async()=>{
  const b=await chromium.launch({executablePath: chromePath,args:['--no-sandbox','--disable-dev-shm-usage']});
  const p=await b.newPage({viewport:{width:900,height:700}});
  await p.goto('file://'+path.resolve('dist/index.html'));
  await p.waitForTimeout(2000);
  const out = await p.evaluate(()=>{
    const d=window.__dbg;
    const part=d.parts.find(x=>x.id==='main_cam');
    part.mesh.updateMatrixWorld(true);
    const rows=[];
    part.mesh.traverse(o=>{
      if(!o.isMesh) return;
      o.geometry.computeBoundingBox();
      const bb=o.geometry.boundingBox.clone();
      const size=new THREE.Vector3(); bb.getSize(size);
      const ctr=new THREE.Vector3(); bb.getCenter(ctr);
      const w=o.localToWorld(ctr.clone());
      rows.push({geo:o.geometry.type, pos:[+o.position.x.toFixed(3),+o.position.y.toFixed(3),+o.position.z.toFixed(3)],
        size:[+size.x.toFixed(3),+size.y.toFixed(3),+size.z.toFixed(3)], world:[+w.x.toFixed(2),+w.y.toFixed(2),+w.z.toFixed(2)],
        col:'#'+o.material.color.getHexString()});
    });
    return {group:part.mesh.position.toArray().map(v=>+v.toFixed(3)), rows};
  });
  console.log(JSON.stringify(out,null,1));
  await b.close();
})();
