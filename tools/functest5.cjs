const path=require('path');
const { chromium, chromePath } = require('./_paths.cjs');
const ROOT=path.resolve(__dirname,'..');
(async()=>{
 const b=await chromium.launch({executablePath: chromePath,args:['--no-sandbox','--disable-dev-shm-usage']});
 const p=await b.newPage({viewport:{width:1600,height:950}});
 const errs=[];
 p.on('pageerror',e=>errs.push(e.message));
 await p.goto('file://'+path.join(ROOT,'dist/index.html'),{waitUntil:'load'});
 await p.waitForTimeout(2200);
 await p.evaluate(()=>document.getElementById('guide').classList.add('hidden'));
 const o={};
 // 一键拆解 toggle
 await p.click('#btnExplodeAll'); await p.waitForTimeout(900);
 o.all1 = await p.evaluate(()=>+window.__dbg.state.explode.toFixed(2));
 await p.click('#btnExplodeAll'); await p.waitForTimeout(1200);
 o.all2 = await p.evaluate(()=>+window.__dbg.state.explode.toFixed(2));
 // 选中 + 聚焦
 await p.evaluate(()=>window.__dbg.select('soc'));
 await p.waitForTimeout(200);
 const t0=await p.evaluate(()=>({tx:+window.__dbg.orbit.des.tx.toFixed(2),ty:+window.__dbg.orbit.des.ty.toFixed(2),r:+window.__dbg.orbit.des.r.toFixed(1)}));
 await p.click('#btnFocus'); await p.waitForTimeout(700);
 const t1=await p.evaluate(()=>({tx:+window.__dbg.orbit.des.tx.toFixed(2),ty:+window.__dbg.orbit.des.ty.toFixed(2),r:+window.__dbg.orbit.des.r.toFixed(1),autoFit:window.__dbg.orbit.autoFit}));
 o.focus={before:t0,after:t1};
 // 键盘
 await p.keyboard.press('Space'); await p.waitForTimeout(600);
 o.space = await p.evaluate(()=>+window.__dbg.state.explode.toFixed(2));
 await p.keyboard.press('a'); await p.waitForTimeout(200);
 o.autoRotate = await p.evaluate(()=>window.__dbg.orbit.autoRotate);
 await p.keyboard.press('r'); await p.waitForTimeout(900);
 o.reset = await p.evaluate(()=>({e:+window.__dbg.state.explode.toFixed(2),sel:window.__dbg.state.selected,autoFit:window.__dbg.orbit.autoFit}));
 // 拖拽旋转
 const before = await p.evaluate(()=>+window.__dbg.orbit.des.th.toFixed(3));
 await p.mouse.move(800,500); await p.mouse.down(); await p.mouse.move(900,500,{steps:5}); await p.mouse.up();
 await p.waitForTimeout(200);
 o.drag = {before, after: await p.evaluate(()=>+window.__dbg.orbit.des.th.toFixed(3))};
 // 滚轮缩放
 const rBefore = await p.evaluate(()=>+window.__dbg.orbit.des.r.toFixed(1));
 await p.mouse.wheel(0,-300); await p.waitForTimeout(300);
 o.wheel = {rBefore, rAfter: await p.evaluate(()=>+window.__dbg.orbit.des.r.toFixed(1))};
 // 移动端 rail
 const m=await b.newPage({viewport:{width:430,height:900},isMobile:true,hasTouch:true});
 await m.goto('file://'+path.join(ROOT,'dist/index.html'),{waitUntil:'load'});
 await m.waitForTimeout(2000);
 await m.evaluate(()=>document.getElementById('guide').classList.add('hidden'));
 await m.click('#btnRail'); await m.waitForTimeout(400);
 o.mobileRail = await m.evaluate(()=>getComputedStyle(document.getElementById('rail')).display);
 console.log(JSON.stringify(o,null,1));
 console.log('errors:', errs.length?errs:'none');
 await b.close();
})();
