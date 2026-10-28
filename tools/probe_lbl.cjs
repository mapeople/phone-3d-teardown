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
    d.setExplode(1,true);
    d.orbit.autoFit=true; d.applyExplode(1);
    d.orbit.cur.r=d.orbit.des.r=d.fitRadius(1); d.syncCamera();
    d.camera.updateMatrixWorld();
    // 触发一次标注更新
    if (typeof d.updateLabels==='function') d.updateLabels();
    const lab=document.getElementById('labels');
    const lr=lab.getBoundingClientRect();
    const els=[...lab.querySelectorAll('.lbl')].filter(e=>e.style.display!=='none').slice(0,5);
    return {labelsRect:{x:lr.x,w:lr.width}, rail:document.getElementById('rail').getBoundingClientRect().right,
      card:document.getElementById('card').getBoundingClientRect().left,
      items:els.map(e=>({t:e.textContent.trim().slice(0,12), x:+e.getBoundingClientRect().x.toFixed(0), y:+e.getBoundingClientRect().y.toFixed(0), w:+e.getBoundingClientRect().width.toFixed(0), tr:e.style.transform}))};
  });
  console.log(JSON.stringify(r,null,1));
  await b.close();
})();
