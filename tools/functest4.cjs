const path=require('path');
const { chromium, chromePath } = require('./_paths.cjs');
const ROOT=path.resolve(__dirname,'..');
(async()=>{
 const b=await chromium.launch({executablePath: chromePath,args:['--no-sandbox','--disable-dev-shm-usage']});
 const p=await b.newPage({viewport:{width:1600,height:950}});
 await p.goto('file://'+path.join(ROOT,'dist/index.html'),{waitUntil:'load'});
 await p.waitForTimeout(2500);
 await p.evaluate(()=>{document.getElementById('guide').classList.add('hidden'); window.__dbg.setExplode(1); window.__dbg.orbit.autoFit=false; window.__dbg.orbit.des.r=46; window.__dbg.syncCamera();});
 await p.waitForTimeout(300);
 const scan = await p.evaluate(()=>{
   const m={};
   for(let y=80;y<900;y+=14) for(let x=280;x<1330;x+=14){ const id=window.__dbg.pick(x,y); if(id){ m[id]=(m[id]||0)+1; } }
   return m;
 });
 console.log('pickable in exploded view:', JSON.stringify(scan));
 // 真实鼠标点击：找某个部件的像素点
 const target = await p.evaluate(()=>{
   for(let y=80;y<900;y+=8) for(let x=280;x<1330;x+=8){ if(window.__dbg.pick(x,y)==='battery') return {x,y}; }
   return null;
 });
 console.log('battery px', JSON.stringify(target));
 if(target){
   await p.mouse.move(target.x,target.y);
   await p.mouse.down(); await p.mouse.up();
   await p.waitForTimeout(500);
   console.log('selected after click:', await p.evaluate(()=>window.__dbg.state.selected), '| card:', await p.textContent('#cardName'));
 }
 await b.close();
})();
