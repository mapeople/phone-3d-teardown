const path=require('path');
const { chromium, chromePath } = require('./_paths.cjs');
(async()=>{
  const b=await chromium.launch({executablePath: chromePath,args:['--no-sandbox','--disable-dev-shm-usage']});
  const p=await b.newPage({viewport:{width:1600,height:950}});
  await p.goto('file://'+path.resolve('dist/index.html'));
  await p.waitForTimeout(2200);
  const out=await p.evaluate(()=>{
    const d=window.__dbg, T=window.T;
    const res=[];
    for(const t of [0,1]){
      d.setExplode(t);
      for(const r of [26,30,34,38,42,46,50,55]){
        const o=d.orbit;
        o.cur.r=o.des.r=r; o.cur.th=o.des.th=0.52; o.cur.ph=o.des.ph=1.26;
        o.cur.tx=o.des.tx=0; o.cur.ty=o.des.ty=0; o.cur.tz=o.des.tz=0;
        d.syncCamera();
        const box=new THREE.Box3().setFromObject(d.scene);
        // 投影 8 个角点
        let minY=1e9,maxY=-1e9,minX=1e9,maxX=-1e9;
        const v=new THREE.Vector3();
        for(let i=0;i<8;i++){
          v.set(i&1?box.max.x:box.min.x, i&2?box.max.y:box.min.y, i&4?box.max.z:box.min.z);
          v.project(d.camera);
          const sx=(v.x*0.5+0.5)*1600, sy=(-v.y*0.5+0.5)*950;
          minY=Math.min(minY,sy);maxY=Math.max(maxY,sy);
          minX=Math.min(minX,sx);maxX=Math.max(maxX,sx);
        }
        res.push({t,r,h:Math.round(maxY-minY),w:Math.round(maxX-minX),top:Math.round(minY),bot:Math.round(maxY)});
      }
    }
    return res;
  });
  console.log(out.map(o=>`t=${o.t} r=${o.r} -> h=${o.h} w=${o.w} top=${o.top} bot=${o.bot}`).join('\n'));
  await b.close();
})();
