const path=require('path');
const { chromium, chromePath } = require('./_paths.cjs');
(async()=>{
  const b=await chromium.launch({executablePath: chromePath,args:['--no-sandbox','--disable-dev-shm-usage']});
  const p=await b.newPage({viewport:{width:1600,height:950},deviceScaleFactor:2});
  await p.goto('file://'+path.resolve('dist/index.html'));
  await p.waitForTimeout(2000);
  const r=await p.evaluate(()=>{
    const d=window.__dbg;
    d.setExplode(1,true);
    const row=document.querySelector('#cardSpec .spec-row');
    const k=row.querySelector('.sr-k'), v=row.querySelector('.sr-v');
    const cs=getComputedStyle(k), vs=getComputedStyle(v);
    return {kText:k.textContent, kColor:cs.color, kOpacity:cs.opacity, kFont:cs.fontSize,
            vText:v.textContent.slice(0,30), vColor:vs.color, vOpacity:vs.opacity,
            rowHTML: row.outerHTML.slice(0,300)};
  });
  console.log(JSON.stringify(r,null,1));
  await p.evaluate(()=>{document.getElementById('loading').style.display='none';document.getElementById('guide').style.display='none';});
  const el=await p.$('#card');
  await el.screenshot({path:'shots/card_zoom.png'});
  await b.close();
})();
