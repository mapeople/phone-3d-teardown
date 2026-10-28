const path=require('path');
const { chromium, chromePath } = require('./_paths.cjs');
const ROOT=path.resolve(__dirname,'..');
(async()=>{
 const b=await chromium.launch({executablePath: chromePath,args:['--no-sandbox','--disable-dev-shm-usage']});
 const m=await b.newPage({viewport:{width:430,height:900},deviceScaleFactor:3,isMobile:true,hasTouch:true});
 await m.goto('file://'+path.join(ROOT,'dist/index.html'),{waitUntil:'load'});
 await m.waitForTimeout(4000);
 const st=await m.evaluate(()=>{
   const l=document.getElementById('loading');
   const cs=getComputedStyle(l);
   return {cls:l.className, op:cs.opacity, vis:cs.visibility, tr:cs.transition};
 });
 console.log('loading state', JSON.stringify(st));
 await m.evaluate(()=>{document.getElementById('guide').classList.add('hidden');document.getElementById('scene').style.visibility='hidden';});
 await m.waitForTimeout(400);
 await m.screenshot({path:path.join(ROOT,'shots/m_nocanvas.png')});
 const t=await m.$('#topbar');
 await t.screenshot({path:path.join(ROOT,'shots/m_top2.png')});
 await b.close();
})();
