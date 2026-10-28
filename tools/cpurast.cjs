const path = require('path');
const fs = require('fs');
const { chromium, chromePath } = require('./_paths.cjs');

const ROOT = path.resolve(__dirname, '..');
const URL = 'file://' + path.join(ROOT, 'dist/index.html');
const OUT = path.join(ROOT, 'shots');
fs.mkdirSync(OUT, { recursive: true });
const CORE = fs.readFileSync(path.join(__dirname, 'raster.core.js'), 'utf8');

const jobs = JSON.parse(process.argv[2] || '[]');
const W = +(process.argv[3] || 900);
const H = +(process.argv[4] || 700);

(async () => {
  const b = await chromium.launch({
    executablePath: chromePath,
    args: ['--no-sandbox', '--disable-dev-shm-usage', '--use-angle=gl'],
  });
  const p = await b.newPage({ viewport: { width: 1100, height: 900 } });
  p.on('pageerror', (e) => console.log('ERR>', e.message));
  await p.goto(URL, { waitUntil: 'load' });
  await p.waitForTimeout(2000);
  await p.evaluate(CORE);

  for (const job of jobs) {
    await p.evaluate((j) => {
      const d = window.__dbg;
      d.setMode(j.mode || 'combo');
      d.setExplode(j.explode === undefined ? 0 : j.explode);
      const o = d.orbit;
      o.autoFit = false;
      o.autoRotate = false;
      if (j.th !== undefined) { o.cur.th = j.th; o.des.th = j.th; }
      if (j.ph !== undefined) { o.cur.ph = j.ph; o.des.ph = j.ph; }
      if (j.r !== undefined) { o.cur.r = j.r; o.des.r = j.r; }
      o.autoRotate = false;
      if (j.select) d.select(j.select);
      if (typeof d.snapFocus === 'function') d.snapFocus();
      if (j.tx !== undefined || j.ty !== undefined) {
        o.target.set(j.tx || 0, j.ty || 0, j.tz || 0);
        o.des.tx = j.tx || 0; o.des.ty = j.ty || 0; o.des.tz = j.tz || 0;
      }
      d.parts.forEach((pt) => { pt.mesh.position.copy(pt.base); });
      if (typeof d.applyExplode === 'function') d.applyExplode(d.explodeT || 0);
      d.camera.lookAt(o.target);
    }, job);

    await p.waitForTimeout(220);

    const res = await p.evaluate((o) => window.__raster(o), { w: job.w || W, h: job.h || H });
    const file = path.join(OUT, job.name + '.png');
    fs.writeFileSync(file, Buffer.from(res.url.split(',')[1], 'base64'));
    console.log(job.name.padEnd(22), 'tris=' + String(res.tris).padStart(6), 'meshes=' + res.meshes, (fs.statSync(file).size / 1024).toFixed(0) + 'KB');
  }

  await b.close();
})();
