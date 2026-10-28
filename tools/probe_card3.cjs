const path=require('path');
const { chromium, chromePath } = require('./_paths.cjs');
(async()=>{
  const b=await chromium.launch({executablePath: chromePath,args:['--no-sandbox','--disable-dev-shm-usage']});
  const p=await b.newPage({viewport:{width:1600,height:950}});
  await p.goto('file://'+path.resolve('dist/index.html'));
  await p.waitForTimeout(2000);
  const r=await p.evaluate(()=>{
    const d=window.__dbg;
    d.setExplode(1,true);
    const rows=[...document.querySelectorAll('#cardSpec .spec-row')];
    return {
      n:rows.length,
      rows:rows.map(x=>({t:x.textContent.trim().slice(0,40), op:getComputedStyle(x).opacity, disp:getComputedStyle(x).display, h:x.getBoundingClientRect().height})),
      specH: document.getElementById('cardSpec').getBoundingClientRect().height,
      cardCls: document.getElementById('card').className
    };
  });
  console.log(JSON.stringify(r,null,1));
  await b.close();
})();
