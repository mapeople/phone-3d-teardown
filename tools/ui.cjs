const path=require('path'),fs=require('fs');
const { chromium, chromePath } = require('./_paths.cjs');
const ROOT=path.resolve(__dirname,'..');
const URL='file://'+path.join(ROOT,'dist/index.html');
const OUT=path.join(ROOT,'shots');
(async()=>{
 const b=await chromium.launch({executablePath: chromePath,args:['--no-sandbox','--disable-dev-shm-usage']});
 const p=await b.newPage({viewport:{width:1600,height:950},deviceScaleFactor:1});
 p.on('pageerror',e=>console.log('ERR>',e.message));
 p.on('console',m=>{ if(m.type()==='error') console.log('CONSOLE-ERR>',m.text()); });
 await p.goto(URL,{waitUntil:'load'});
 await p.waitForTimeout(2500);
 // 关闭引导看主界面
 await p.evaluate(()=>{ const g=document.getElementById('guide'); if(g) g.classList.add('hidden'); });
 await p.waitForTimeout(300);
 await p.screenshot({path:path.join(OUT,'ui_main.png')});
 // 选中一个部件看详情卡
 await p.evaluate(()=>{ window.__dbg.select('soc'); });
 await p.waitForTimeout(600);
 await p.screenshot({path:path.join(OUT,'ui_selected.png')});
 // 拆解 + 标注
 await p.evaluate(()=>{ window.__dbg.setExplode(0.8); window.__dbg.select(null); });
 await p.waitForTimeout(900);
 await p.screenshot({path:path.join(OUT,'ui_explode.png')});
 // 引导
 await p.evaluate(()=>{ const g=document.getElementById('guide'); if(g) g.classList.remove('hidden'); });
 await p.waitForTimeout(400);
 await p.screenshot({path:path.join(OUT,'ui_guide.png')});
 // 移动端
 const m=await b.newPage({viewport:{width:430,height:900},deviceScaleFactor:2,isMobile:true,hasTouch:true});
 m.on('pageerror',e=>console.log('M-ERR>',e.message));
 await m.goto(URL,{waitUntil:'load'});
 await m.waitForTimeout(2500);
 await m.evaluate(()=>{ const g=document.getElementById('guide'); if(g) g.classList.add('hidden'); });
 await m.waitForTimeout(300);
 await m.screenshot({path:path.join(OUT,'ui_mobile.png')});
 const err=await m.evaluate(()=>window.__err||null);
 console.log('mobile err:',err);
 await b.close();
 console.log('done');
})();
