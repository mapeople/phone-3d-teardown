/* 把 CPU 光栅化结果作为 canvas 的替身贴回页面，得到「UI + 3D」完整预览截图。
   容器里 WebGL 无法出图，这是唯一能得到真实观感截图的路径。 */
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
      d.setExplode(j.explode === undefined ? 0 : j.explode);
      const o = d.orbit;
      o.autoFit = false; o.autoRotate = false;
      if (j.th !== undefined) { o.cur.th = j.th; o.des.th = j.th; }
      if (j.ph !== undefined) { o.cur.ph = j.ph; o.des.ph = j.ph; }
      if (j.r !== undefined) { o.cur.r = j.r; o.des.r = j.r; }
      if (j.tx !== undefined) { o.target.x = j.tx; o.des.tx = j.tx; }
      if (j.ty !== undefined) { o.target.y = j.ty; o.des.ty = j.ty; }
      if (j.select) d.select(j.select);
      if (typeof d.snapFocus === 'function') d.snapFocus();
      d.parts.forEach((pt) => { pt.mesh.position.copy(pt.base); });
      d.applyExplode(d.explodeT || 0);
      if (typeof d.syncCamera === 'function') d.syncCamera();
      else d.camera.lookAt(o.target);
      // 隐藏 DOM 里依赖 WebGL 的加载层与引导
      document.getElementById('loading').classList.add('done');
      document.getElementById('loading').style.display = 'none';
      if (!j.keepGuide) document.getElementById('guide').classList.add('hidden');
    }, job);

    await p.waitForTimeout(420);
    const res = await p.evaluate((o) => window.__raster(o), { w: job.w || VW, h: job.h || VH });

    // 把光栅图作为 img 铺满画布区域（canvas 之后、背景层之前）
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
    await p.waitForTimeout(500);
    // 引导层/加载层可能在 rAF 节流下延迟出现，截图前再压一次
    await p.evaluate(() => {
      document.getElementById('guide').classList.add('hidden');
      document.getElementById('guide').style.display = 'none';
      const ld = document.getElementById('loading');
      ld.classList.add('done');
      ld.style.display = 'none';
    });
    await p.waitForTimeout(250);

    const file = path.join(OUT, job.name + '.png');
    await p.screenshot({ path: file });
    console.log(job.name.padEnd(20), 'tris=' + res.tris, (fs.statSync(file).size / 1024).toFixed(0) + 'KB');
  }
  await b.close();
})();
