/* 走「真实交互路径」的合成截图：只调用页面自己的接口（setExplode/select/视角按钮），
   然后把 orbit 的 cur 直接对齐 des（模拟阻尼收敛完毕），再 CPU 光栅化贴回页面截图。
   这样得到的就是用户真实看到的取景（含 autoFit 自动拉远）。 */
const path = require('path');
const fs = require('fs');
const { chromium, chromePath } = require('./_paths.cjs');

const ROOT = path.resolve(__dirname, '..');
const URL = 'file://' + path.join(ROOT, 'dist/index.html');
const OUT = path.join(ROOT, 'shots');
const CORE = fs.readFileSync(path.join(__dirname, 'raster.core.js'), 'utf8');

const jobs = JSON.parse(process.argv[2] || '[]');
const VW = +(process.argv[3] || 1600);
const VH = +(process.argv[4] || 950);

(async () => {
  const b = await chromium.launch({
    executablePath: chromePath,
    args: ['--no-sandbox', '--disable-dev-shm-usage'],
  });
  const p = await b.newPage({ viewport: { width: VW, height: VH } });
  p.on('pageerror', (e) => console.log('ERR>', e.message));
  await p.goto(URL, { waitUntil: 'load' });
  await p.waitForTimeout(2000);
  await p.evaluate(CORE);

  for (const job of jobs) {
    await p.evaluate((j) => {
      const d = window.__dbg;
      document.getElementById('guide').style.display = 'none';
      document.getElementById('loading').style.display = 'none';
      // 容器 rAF 被节流，CSS 过渡会卡在半途：截图期间直接禁用动画
      if (!document.getElementById('__notrans')) {
        const st = document.createElement('style');
        st.id = '__notrans';
        // 只关过渡（面板滑入/淡入），保留 keyframes；参数行动画结束后强制可见
        st.textContent = '*,*::before,*::after{transition:none!important}'
          + '.spec-row,.card-name-wrap,.card-desc-wrap{opacity:1!important;transform:none!important;animation:none!important}'
          + '#labels .lbl,#leaders polyline,#leaders circle{transition:none!important}';
        document.head.appendChild(st);
      }
      // 每个 job 都从干净状态开始（视角/拆解/选中），但保留「整机概览」卡片
      document.getElementById('btnReset').click();
      d.orbit.autoFit = true;
      d.orbit.zoom = 1;
      // 移动端（<=640）默认收起详情卡，避免遮挡机身；需要时用 showCard 打开
      const mobile = window.innerWidth <= 640;
      if (j.showCard || (!mobile && !j.hideCard)) document.getElementById('card').classList.remove('hidden');
      else document.getElementById('card').classList.add('hidden');

      // 1) 走页面真实接口
      if (j.explode !== undefined) {
        d.setExplode(j.explode, true);
        // 还原真实交互路径：拆解时 autoFit 仍然开启，相机自动拉远
        d.orbit.autoFit = true;
        d.applyExplode(d.state.explode);
      }
      if (j.select) d.select(j.select, j.focus ? { focus: true } : undefined);
      if (j.view) {
        const btn = document.querySelector('.vp[data-v="' + j.view + '"]');
        if (btn) btn.click();
      }
      if (j.zoom !== undefined) d.orbit.zoom = j.zoom;

      // 2) 阻尼直接收敛（容器 rAF 被节流，等不到动画结束）
      const o = d.orbit;
      o.cur.r = o.des.r; o.cur.th = o.des.th; o.cur.ph = o.des.ph;
      o.cur.tx = o.des.tx; o.cur.ty = o.des.ty; o.cur.tz = o.des.tz;
      if (j.th !== undefined) { o.cur.th = o.des.th = j.th; }
      if (j.ph !== undefined) { o.cur.ph = o.des.ph = j.ph; }
      if (j.r !== undefined) { o.autoFit = false; o.cur.r = o.des.r = j.r; }
      d.syncCamera();
      if (typeof d.snapFocus === 'function') d.snapFocus();
    }, job);

    await p.waitForTimeout(160);
    const res = await p.evaluate((o) => window.__raster(o), { w: job.w || VW, h: job.h || VH });

    await p.evaluate((url) => {
      let img = document.getElementById('__shot');
      if (!img) {
        img = document.createElement('img');
        img.id = '__shot';
        img.style.cssText = 'position:absolute;inset:0;width:100%;height:100%;z-index:1;pointer-events:none;';
        const cv = document.getElementById('scene');
        cv.parentNode.insertBefore(img, cv.nextSibling);
        cv.style.opacity = '0';
      }
      img.src = url;
    }, res.url);
    await p.waitForTimeout(420);
    await p.evaluate(() => {
      document.getElementById('guide').style.display = 'none';
      document.getElementById('loading').style.display = 'none';
    });
    await p.waitForTimeout(120);

    const file = path.join(OUT, job.name + '.png');
    await p.screenshot({ path: file });
    const st = await p.evaluate(() => ({ r: +window.__dbg.orbit.cur.r.toFixed(1), ex: +window.__dbg.state.explode.toFixed(2), sel: window.__dbg.state.selected, card: document.getElementById('card').className }));
    console.log(job.name.padEnd(18), 'r=' + st.r, 'ex=' + st.ex, 'sel=' + st.sel, 'card=[' + st.card + ']', 'tris=' + res.tris);
  }
  await b.close();
})();
