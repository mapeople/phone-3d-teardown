const path=require('path');
const { chromium, chromePath } = require('./_paths.cjs');
const ROOT=path.resolve(__dirname,'..');
(async()=>{
 const b=await chromium.launch({executablePath: chromePath,args:['--no-sandbox','--disable-dev-shm-usage']});
 const p=await b.newPage({viewport:{width:1600,height:950}});
 await p.goto('file://'+path.join(ROOT,'dist/index.html'),{waitUntil:'load'});
 await p.waitForTimeout(2500);
 await p.evaluate(()=>{document.getElementById('guide').classList.add('hidden');});
 const out={};
 out.parts = await p.evaluate(()=>window.__dbg.parts.length);
 out.specLens = await p.evaluate(()=>window.__dbg.parts.map(x=>[x.id,(x.spec||[]).length]));
 // 拾取：屏幕中心
 out.pickCenter = await p.evaluate(()=>window.__dbg.pick(800,475));
 // 扫描网格找所有可拾取 id
 out.scan = await p.evaluate(()=>{
   const s=new Set();
   for(let y=120;y<860;y+=22) for(let x=300;x<1300;x+=22){ const id=window.__dbg.pick(x,y); if(id) s.add(id); }
   return Array.from(s);
 });
 console.log(JSON.stringify(out));
 await b.close();
})();
