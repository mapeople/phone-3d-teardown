const path=require('path');
const { chromium, chromePath } = require('./_paths.cjs');
const ROOT=path.resolve(__dirname,'..');
(async()=>{
 const b=await chromium.launch({executablePath: chromePath,args:['--no-sandbox','--disable-dev-shm-usage']});
 const m=await b.newPage({viewport:{width:430,height:900},deviceScaleFactor:3,isMobile:true,hasTouch:true});
 await m.goto('file://'+path.join(ROOT,'dist/index.html'),{waitUntil:'load'});
 await m.waitForTimeout(2000);
 await m.evaluate(()=>{document.getElementById('guide').classList.add('hidden');});
 const t=await m.$('#topbar');
 await t.screenshot({path:path.join(ROOT,'shots/m_top.png')});
 const info=await m.evaluate(()=>{
   const l=document.querySelector('.logo');
   return {html:l.innerHTML.slice(0,120), rect:l.getBoundingClientRect().toJSON()};
 });
 console.log(JSON.stringify(info));
 await b.close();
})();
