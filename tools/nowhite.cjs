const path=require('path');
const { chromium, chromePath } = require('./_paths.cjs');
const ROOT=path.resolve(__dirname,'..');
(async()=>{
 const b=await chromium.launch({executablePath: chromePath,args:['--no-sandbox','--disable-dev-shm-usage']});
 const p=await b.newPage({viewport:{width:1600,height:950}});
 await p.goto('file://'+path.join(ROOT,'dist/index.html'),{waitUntil:'load'});
 await p.waitForTimeout(2200);
 await p.evaluate(()=>{ document.getElementById('scene').style.display='none'; document.getElementById('guide').classList.add('hidden'); });
 await p.waitForTimeout(300);
 await p.screenshot({path:path.join(ROOT,'shots/ui_nocanvas.png')});
 await b.close(); console.log('ok');
})();
