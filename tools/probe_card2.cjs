const path=require('path');
const { chromium, chromePath } = require('./_paths.cjs');
(async()=>{
  const b=await chromium.launch({executablePath: chromePath,args:['--no-sandbox','--disable-dev-shm-usage']});
  const p=await b.newPage({viewport:{width:1600,height:950}});
  await p.goto('file://'+path.resolve('dist/index.html'));
  await p.waitForTimeout(2000);
  const r=await p.evaluate(()=>{
    const d=window.__dbg, card=document.getElementById('card');
    document.getElementById('guide').style.display='none';
    document.getElementById('loading').style.display='none';
    document.getElementById('btnReset').click();
    d.orbit.autoFit=true; d.orbit.zoom=1;
    card.classList.remove('hidden');
    d.setExplode(1,true);
    d.orbit.autoFit=true; d.applyExplode(d.state.explode);
    const o=d.orbit; o.cur.r=o.des.r; o.cur.th=o.des.th; o.cur.ph=o.des.ph;
    o.cur.tx=o.des.tx; o.cur.ty=o.des.ty; o.cur.tz=o.des.tz;
    d.syncCamera(); d.snapFocus();
    const cs=getComputedStyle(card);
    return {cls:card.className, op:cs.opacity, tr:cs.transform, disp:cs.display, vis:cs.visibility, zi:cs.zIndex,
            rect:card.getBoundingClientRect().toJSON()};
  });
  console.log(JSON.stringify(r,null,1));
  await b.close();
})();
