const path=require('path');
const { chromium, chromePath } = require('./_paths.cjs');
(async()=>{
  const b=await chromium.launch({executablePath: chromePath,args:['--no-sandbox','--disable-dev-shm-usage']});
  const p=await b.newPage({viewport:{width:1600,height:950}});
  await p.goto('file://'+path.resolve('dist/index.html'));
  await p.waitForTimeout(2000);
  const out=await p.evaluate(()=>{
    const d=window.__dbg;
    d.setExplode(0.7);
    d.select('main_cam',{focus:true});
    const o=d.orbit;
    o.cur.r=o.des.r; o.cur.th=o.des.th; o.cur.ph=o.des.ph;
    o.cur.tx=o.des.tx; o.cur.ty=o.des.ty; o.cur.tz=o.des.tz;
    d.syncCamera();
    const pt=d.parts.find(x=>x.id==='main_cam');
    pt.mesh.updateMatrixWorld(true);
    const bb=new THREE.Box3().setFromObject(pt.mesh);
    const c=bb.getCenter(new THREE.Vector3());
    const sp=Math.sin(o.cur.ph), cp=Math.cos(o.cur.ph);
    return {des:{r:o.cur.r,th:o.cur.th,ph:o.cur.ph,tx:o.cur.tx,ty:o.cur.ty,tz:o.cur.tz},
      center:c.toArray().map(v=>+v.toFixed(2)), cam:d.camera.position.toArray().map(v=>+v.toFixed(2)),
      pos:pt.mesh.position.toArray().map(v=>+v.toFixed(2))};
  });
  console.log(JSON.stringify(out));
  await b.close();
})();
