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
 // 强制满拆解并同步
 await p.evaluate(()=>{ window.__dbg.setExplode(1); });
 await p.waitForTimeout(300);
 out.explode = await p.evaluate(()=>window.__dbg.explodeT);
 out.lblShown = await p.evaluate(()=>Array.from(document.querySelectorAll('.lbl')).filter(e=>e.style.display!=='none').length);
 out.lblSample = await p.evaluate(()=>{const e=document.querySelector('.lbl');return e?e.textContent.trim():null;});
 // 每部件 spec 条数
 out.specs = await p.evaluate(()=>window.__dbg.parts.map(x=>({id:x.id,n:(x.spec||[]).length,ord:x.order})));
 // 详情卡
 await p.evaluate(()=>window.__dbg.select('soc'));
 await p.waitForTimeout(200);
 out.socCard = await p.evaluate(()=>({name:document.querySelector('#cardName').textContent, rows:document.querySelectorAll('#cardSpec .spec-row').length, desc:document.querySelector('#cardDesc').textContent.slice(0,40), tag:document.querySelector('#cardTag').textContent}));
 // 选中后标注是否显示
 out.lblSelShown = await p.evaluate(()=>Array.from(document.querySelectorAll('.lbl')).filter(e=>e.style.display!=='none').length);
 // 点击 3D（用 __dbg 暴露的 pick？没有则用 canvas 中心点击）
 out.hasPick = await p.evaluate(()=>typeof window.__dbg.pick);
 console.log(JSON.stringify(out,null,1));
 await b.close();
})();
