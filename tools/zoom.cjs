const path=require('path'),fs=require('fs');
const { chromium, chromePath } = require('./_paths.cjs');
const ROOT=path.resolve(__dirname,'..');
(async()=>{
 const b=await chromium.launch({executablePath: chromePath,args:['--no-sandbox','--disable-dev-shm-usage']});
 const p=await b.newPage({viewport:{width:1600,height:950},deviceScaleFactor:2});
 await p.goto('file://'+path.join(ROOT,'dist/index.html'),{waitUntil:'load'});
 await p.waitForTimeout(2000);
 await p.evaluate(()=>{document.getElementById('guide').classList.add('hidden');});
 await p.waitForTimeout(200);
 // 悬停一个部件列表项，检查 hover 与 active
 await p.hover('.pitem:nth-child(6)');
 await p.waitForTimeout(300);
 const rail=await p.$('#rail');
 await rail.screenshot({path:path.join(ROOT,'shots/z_rail.png')});
 // 标注标签特写
 await p.evaluate(()=>{ window.__dbg.setExplode(0.85); });
 await p.waitForTimeout(1200);
 const labels=await p.$('#labels');
 if(labels) await labels.screenshot({path:path.join(ROOT,'shots/z_labels.png')});
 await b.close(); console.log('ok');
})();
