const path=require('path');
const { chromium, chromePath } = require('./_paths.cjs');
(async()=>{
  const b=await chromium.launch({executablePath: chromePath,args:['--no-sandbox','--disable-dev-shm-usage']});
  const p=await b.newPage({viewport:{width:1600,height:950}});
  await p.goto('file://'+path.resolve('dist/index.html'));
  await p.waitForTimeout(2000);
  const r=await p.evaluate(()=>{
    const d=window.__dbg, THREE=window.THREE;
    function bbox(){
      let minX=1e9,maxX=-1e9,minY=1e9,maxY=-1e9;
      const v=new THREE.Vector3();
      d.parts.forEach(pt=>{
        pt.mesh.updateMatrixWorld(true);
        pt.mesh.traverse(o=>{
          if(!o.isMesh||!o.visible) return;
          const g=o.geometry; if(!g.attributes.position) return;
          const pos=g.attributes.position;
          const step=Math.max(1, Math.floor(pos.count/64));
          for(let i=0;i<pos.count;i+=step){
            v.fromBufferAttribute(pos,i).applyMatrix4(o.matrixWorld).project(d.camera);
            const sx=(v.x*0.5+0.5)*1600, sy=(-v.y*0.5+0.5)*950;
            minX=Math.min(minX,sx);maxX=Math.max(maxX,sx);
            minY=Math.min(minY,sy);maxY=Math.max(maxY,sy);
          }
        });
      });
      return {w:+(maxX-minX).toFixed(0),h:+(maxY-minY).toFixed(0),x0:+minX.toFixed(0),y0:+minY.toFixed(0)};
    }
    const out={};
    d.setExplode(0,true); d.orbit.autoFit=true; d.orbit.zoom=1; d.applyExplode(0);
    d.orbit.cur.r=d.orbit.des.r=d.fitRadius(0); d.syncCamera(); d.camera.updateMatrixWorld();
    out.t0={r:+d.orbit.cur.r.toFixed(1), bb:bbox()};
    d.setExplode(1,true); d.applyExplode(1);
    d.orbit.cur.r=d.orbit.des.r=d.fitRadius(1); d.syncCamera(); d.camera.updateMatrixWorld();
    out.t1={r:+d.orbit.cur.r.toFixed(1), bb:bbox()};
    return out;
  });
  console.log(JSON.stringify(r));
  await b.close();
})();
