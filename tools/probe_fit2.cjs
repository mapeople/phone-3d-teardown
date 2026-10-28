const path=require('path');
const { chromium, chromePath } = require('./_paths.cjs');
(async()=>{
  const b=await chromium.launch({executablePath: chromePath,args:['--no-sandbox','--disable-dev-shm-usage']});
  for(const [w,h] of [[1600,950],[1440,900],[430,900]]){
    const p=await b.newPage({viewport:{width:w,height:h}});
    await p.goto('file://'+path.resolve('dist/index.html'));
    await p.waitForTimeout(3200);
    const out=await p.evaluate(()=>{
      const d=window.__dbg; const o={};
      o.r0=+d.fitRadius(0).toFixed(1); o.r1=+d.fitRadius(1).toFixed(1);
      const box=(t,r)=>{
        d.setExplode(t);
        const or=d.orbit;
        or.cur.r=or.des.r=r; or.cur.th=or.des.th=0.52; or.cur.ph=or.des.ph=1.26;
        or.cur.tx=or.des.tx=0; or.cur.ty=or.des.ty=0; or.cur.tz=or.des.tz=0;
        d.syncCamera();
        const bb=new THREE.Box3().setFromObject(window.T.phone);
        let minY=1e9,maxY=-1e9,minX=1e9,maxX=-1e9; const v=new THREE.Vector3();
        for(let i=0;i<8;i++){
          v.set(i&1?bb.max.x:bb.min.x, i&2?bb.max.y:bb.min.y, i&4?bb.max.z:bb.min.z);
          v.project(d.camera);
          const sx=(v.x*0.5+0.5)*innerWidth, sy=(-v.y*0.5+0.5)*innerHeight;
          minY=Math.min(minY,sy);maxY=Math.max(maxY,sy);minX=Math.min(minX,sx);maxX=Math.max(maxX,sx);
        }
        return {h:Math.round(maxY-minY),w:Math.round(maxX-minX),top:Math.round(minY),bot:Math.round(maxY)};
      };
      o.b0=box(0,o.r0); o.b1=box(1,o.r1);
      return o;
    });
    console.log(w+'x'+h, JSON.stringify(out));
    await p.close();
  }
  await b.close();
})();
