const path=require('path');
const { chromium, chromePath } = require('./_paths.cjs');
(async()=>{
  const b=await chromium.launch({executablePath: chromePath,args:['--no-sandbox','--disable-dev-shm-usage']});
  const p=await b.newPage({viewport:{width:1600,height:950}});
  await p.goto('file://'+path.resolve('dist/index.html'));
  await p.waitForTimeout(2000);
  const r=await p.evaluate(()=>{
    const d=window.__dbg, card=document.getElementById('card');
    const a=card.className;
    document.getElementById('btnReset').click();
    const b1=card.className;
    card.classList.remove('hidden');
    const c=card.className;
    d.setExplode(1,true);
    const e=card.className;
    return {a,b1,c,e, rect:card.getBoundingClientRect().toJSON()};
  });
  console.log(JSON.stringify(r,null,1));
  await b.close();
})();
