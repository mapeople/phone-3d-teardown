const path=require('path');
const { chromium, chromePath } = require('./_paths.cjs');
const ROOT=path.resolve(__dirname,'..');
(async()=>{
 const b=await chromium.launch({executablePath: chromePath,args:['--no-sandbox','--disable-dev-shm-usage']});
 const p=await b.newPage({viewport:{width:1600,height:950}});
 await p.goto('file://'+path.join(ROOT,'dist/index.html'),{waitUntil:'load'});
 await p.waitForTimeout(2500);
 const info=await p.evaluate(()=>{
   const out=[];
   document.querySelectorAll('body *').forEach(el=>{
     const r=el.getBoundingClientRect();
     if(r.width>400&&r.height>400){
       const cs=getComputedStyle(el);
       out.push({tag:el.tagName,id:el.id,cls:el.className&&el.className.toString().slice(0,40),bg:cs.backgroundColor,z:cs.zIndex,rect:[r.x|0,r.y|0,r.width|0,r.height|0]});
     }
   });
   const c=document.getElementById('scene');
   const gl=c.getContext('webgl2')||c.getContext('webgl');
   return {out, hasGL:!!gl, lost:gl?gl.isContextLost():null, cw:c.width, ch:c.height,
     canvasStyle:{bg:getComputedStyle(c).backgroundColor, opacity:getComputedStyle(c).opacity},
     bodyBg:getComputedStyle(document.body).backgroundColor};
 });
 console.log(JSON.stringify(info,null,1));
 await b.close();
})();
