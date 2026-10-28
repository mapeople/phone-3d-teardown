const path=require('path');
const { chromium, chromePath } = require('./_paths.cjs');
(async()=>{
  const b=await chromium.launch({executablePath: chromePath,args:['--no-sandbox','--disable-dev-shm-usage']});
  const p=await b.newPage({viewport:{width:1600,height:950}});
  await p.goto('file://'+path.resolve('dist/index.html'));
  await p.waitForTimeout(2000);
  const r=await p.evaluate(()=>{
    const d=window.__dbg;
    document.getElementById('loading').style.display='none';
    d.setExplode(1,true); d.orbit.autoFit=true; d.applyExplode(1);
    d.orbit.cur.r=d.orbit.des.r=d.fitRadius(1); d.syncCamera(); d.camera.updateMatrixWorld();
    d.updateLabels();
    const lab=document.getElementById('labels');
    const e=lab.querySelector('.lbl');
    const cs=getComputedStyle(e);
    const lr=lab.getBoundingClientRect();
    const er=e.getBoundingClientRect();
    return {disp:cs.display, pos:cs.position, tr:cs.transform, top:cs.top, left:cs.left,
            labRect:{x:lr.x,y:lr.y,w:lr.width,h:lr.height},
            elRect:{x:er.x,y:er.y,w:er.width,h:er.height},
            inner:e.innerHTML.slice(0,160)};
  });
  console.log(JSON.stringify(r,null,1));
  await b.close();
})();
