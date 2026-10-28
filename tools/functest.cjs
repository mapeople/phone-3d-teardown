const path=require('path');
const { chromium, chromePath } = require('./_paths.cjs');
const ROOT=path.resolve(__dirname,'..');
const errs=[];
(async()=>{
 const b=await chromium.launch({executablePath: chromePath,args:['--no-sandbox','--disable-dev-shm-usage']});
 const p=await b.newPage({viewport:{width:1600,height:950}});
 p.on('pageerror',e=>errs.push('PAGEERROR: '+e.message));
 p.on('console',m=>{ if(m.type()==='error'){ const t=m.text(); if(!/Shader Error|VALIDATE_STATUS|WebGL/i.test(t)) errs.push('CONSOLE: '+t.slice(0,160)); }});
 await p.goto('file://'+path.join(ROOT,'dist/index.html'),{waitUntil:'load'});
 await p.waitForTimeout(2500);
 await p.evaluate(()=>{document.getElementById('guide').classList.add('hidden');});
 const out={};
 // 1 初始
 out.partCount = await p.evaluate(()=>document.querySelectorAll('.pitem').length);
 out.labels0 = await p.evaluate(()=>document.querySelectorAll('.lbl').length);
 out.explode0 = await p.evaluate(()=>window.__dbg.explodeT);
 // 2 点击清单第 8 项（电池）
 await p.evaluate(()=>{ document.querySelectorAll('.pitem')[6].click(); });
 await p.waitForTimeout(400);
 out.sel = await p.evaluate(()=>window.__dbg.state.selected);
 out.cardName = await p.textContent('#cardName');
 out.cardSpecRows = await p.evaluate(()=>document.querySelectorAll('#cardSpec .spec-row').length);
 out.explodeAfterSel = await p.evaluate(()=>+window.__dbg.explodeT.toFixed(2));
 // 3 滑块
 await p.evaluate(()=>{ const s=document.getElementById('explode'); s.value=100; s.dispatchEvent(new Event('input',{bubbles:true})); });
 await p.waitForTimeout(600);
 out.explode100 = await p.evaluate(()=>+window.__dbg.explodeT.toFixed(2));
 out.lblVisible = await p.evaluate(()=>Array.from(document.querySelectorAll('.lbl')).filter(e=>e.style.display!=='none'&&e.classList.contains('on')).length);
 // 4 视角按钮
 await p.evaluate(()=>{ document.querySelector('.vp[data-v="back"]').click(); });
 await p.waitForTimeout(300);
 out.viewBack = await p.evaluate(()=>({th:+window.__dbg.orbit.des.th.toFixed(2),ph:+window.__dbg.orbit.des.ph.toFixed(2)}));
 // 5 重置
 await p.evaluate(()=>{ document.getElementById('btnReset').click(); });
 await p.waitForTimeout(400);
 out.afterReset = await p.evaluate(()=>({e:+window.__dbg.explodeT.toFixed(2),sel:window.__dbg.state.selected}));
 // 6 一键拆解
 await p.evaluate(()=>{ document.getElementById('btnExplodeAll').click(); });
 await p.waitForTimeout(500);
 out.afterAll = await p.evaluate(()=>+window.__dbg.explodeT.toFixed(2));
 // 7 分组筛选
 await p.evaluate(()=>{ document.querySelectorAll('#railFilter button')[3].click(); });
 await p.waitForTimeout(200);
 out.filterVisible = await p.evaluate(()=>Array.from(document.querySelectorAll('.pitem')).filter(e=>e.style.display!=='none').length);
 out.filterCount = await p.textContent('#partCount');
 // 8 标注开关
 await p.evaluate(()=>{ document.getElementById('btnLabels').click(); });
 await p.waitForTimeout(200);
 out.labelsOffClass = await p.evaluate(()=>document.getElementById('labels').className);
 // 9 键盘
 await p.keyboard.press('Escape');
 await p.waitForTimeout(200);
 out.escSel = await p.evaluate(()=>window.__dbg.state.selected);
 console.log(JSON.stringify(out,null,1));
 console.log('ERRORS:', errs.length? JSON.stringify(errs,null,1):'none');
 await b.close();
})();
