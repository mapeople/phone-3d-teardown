const path=require('path');
const { chromium, chromePath } = require('./_paths.cjs');
(async()=>{
  const b=await chromium.launch({executablePath: chromePath,args:['--no-sandbox','--disable-dev-shm-usage']});
  const p=await b.newPage({viewport:{width:430,height:900}});
  p.on('pageerror',e=>console.log('PAGEERROR',e.message));
  await p.goto('file://'+path.resolve('dist/index.html'));
  await p.waitForTimeout(5000);
  console.log(await p.evaluate(()=>({dbg:!!window.__dbg, T:!!window.T, ready:document.readyState})));
  await b.close();
})();
