const path=require('path');
const { chromium, chromePath } = require('./_paths.cjs');
const ROOT=path.resolve(__dirname,'..');
(async()=>{
 const b=await chromium.launch({executablePath: chromePath,args:['--no-sandbox','--disable-dev-shm-usage']});
 const m=await b.newPage({viewport:{width:430,height:900},deviceScaleFactor:2,isMobile:true,hasTouch:true});
 await m.goto('file://'+path.join(ROOT,'dist/index.html'),{waitUntil:'load'});
 await m.waitForTimeout(2200);
 await m.evaluate(()=>{document.getElementById('guide').classList.add('hidden');});
 const r=await m.evaluate(()=>{
   const res=[];
   [[30,40],[45,55],[20,20],[60,70]].forEach(([x,y])=>{
     const el=document.elementFromPoint(x,y);
     res.push({x,y,tag:el&&el.tagName,cls:el&&el.className&&el.className.toString(),id:el&&el.id});
   });
   const load=document.getElementById('loading');
   const cs=getComputedStyle(load);
   return {res, loadCls:load.className, loadOpacity:cs.opacity, loadDisplay:cs.display, loadVis:cs.visibility, loadZ:cs.zIndex};
 });
 console.log(JSON.stringify(r,null,1));
 await b.close();
})();
