const path=require('path');
const { chromium, chromePath } = require('./_paths.cjs');
(async()=>{
  const b=await chromium.launch({executablePath: chromePath,args:['--no-sandbox','--disable-dev-shm-usage']});
  // 1) 引导弹窗
  let p=await b.newPage({viewport:{width:1600,height:950}});
  await p.goto('file://'+path.resolve('dist/index.html'));
  await p.waitForTimeout(2000);
  await p.evaluate(()=>{document.getElementById('loading').style.display='none';document.getElementById('guide').classList.remove('hidden');});
  await p.waitForTimeout(300);
  await p.screenshot({path:'shots/ui_guide.png'});
  await p.close();

  // 2) 加载页（静态停在中途）
  p=await b.newPage({viewport:{width:1600,height:950}});
  await p.addInitScript(()=>{ window.__noBoot=true; });
  await p.goto('file://'+path.resolve('dist/index.html'));
  await p.waitForTimeout(1200);
  await p.evaluate(()=>{
    document.getElementById('guide').style.display='none';
    const l=document.getElementById('loading');
    l.classList.remove('done'); l.style.opacity='1'; l.style.visibility='visible'; l.style.display='grid';
  });
  await p.waitForTimeout(150);
  await p.evaluate(()=>{
    document.getElementById('loadPct').textContent='62%';
    document.getElementById('loadFill').style.width='62%';
  });
  await p.waitForTimeout(200);
  await p.screenshot({path:'shots/ui_loading.png'});
  await p.close();
  await b.close();
  console.log('ok');
})();
