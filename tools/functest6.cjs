/* 端到端交互自测：真实点击/滑块/键盘/视角/筛选，检查页面状态与报错 */
const path = require('path');
const { chromium, chromePath } = require('./_paths.cjs');

(async () => {
  const b = await chromium.launch({
    executablePath: chromePath,
    args: ['--no-sandbox', '--disable-dev-shm-usage'],
  });
  const p = await b.newPage({ viewport: { width: 1600, height: 950 } });
  const errs = [];
  p.on('pageerror', (e) => errs.push(e.message));
  p.on('console', (m) => { if (m.type() === 'error' && !/Shader Error|WebGL/.test(m.text())) errs.push('console:' + m.text()); });

  await p.goto('file://' + path.resolve('dist/index.html'), { waitUntil: 'load' });
  await p.waitForTimeout(2500);
  await p.evaluate(() => { document.getElementById('loading').style.display = 'none'; document.getElementById('guide').classList.add('hidden'); });

  const out = {};
  const st = () => p.evaluate(() => ({ ex: +window.__dbg.state.explode.toFixed(2), sel: window.__dbg.state.selected, r: +window.__dbg.orbit.cur.r.toFixed(1) }));

  out.init = await st();
  out.parts = await p.evaluate(() => window.__dbg.parts.length);
  out.labels = await p.evaluate(() => document.querySelectorAll('#labels .lbl').length);
  out.railItems = await p.evaluate(() => document.querySelectorAll('#partList .pitem').length);

  // 1) 点击清单里的电池
  await p.click('#partList .pitem[data-id="battery"]');
  await p.waitForTimeout(400);
  out.clickRail = { ...(await st()), card: await p.textContent('#cardName') };

  // 2) 点「拆解此部件」聚焦
  await p.click('#btnFocus');
  await p.waitForTimeout(600);
  out.focus = { ...(await st()), cardHidden: await p.evaluate(() => document.getElementById('card').classList.contains('hidden')) };

  // 3) 滑块到 100%
  await p.evaluate(() => { const s = document.getElementById('explode'); s.value = 100; s.dispatchEvent(new Event('input', { bubbles: true })); });
  await p.waitForTimeout(500);
  out.slider = { ...(await st()), val: await p.textContent('#explodeVal') };

  // 4) 视角按钮
  await p.click('.vp[data-v="front"]');
  await p.waitForTimeout(300);
  out.view = await p.evaluate(() => ({ th: +window.__dbg.orbit.des.th.toFixed(2), ph: +window.__dbg.orbit.des.ph.toFixed(2) }));

  // 5) 分组筛选
  await p.evaluate(() => { [...document.querySelectorAll('#railFilter button')].find((b) => b.textContent === '影像系统').click(); });
  await p.waitForTimeout(250);
  out.filter = await p.evaluate(() => ({
    visible: [...document.querySelectorAll('#partList .pitem')].filter((e) => e.style.display !== 'none').length,
    count: document.getElementById('partCount').textContent,
  }));
  await p.evaluate(() => { [...document.querySelectorAll('#railFilter button')].find((b) => b.textContent === '全部').click(); });
  await p.waitForTimeout(200);

  // 6) 标注开关
  const lblBefore = await p.evaluate(() => [...document.querySelectorAll('#labels .lbl')].filter((e) => e.style.display !== 'none').length);
  await p.click('#btnLabels');
  await p.waitForTimeout(500);
  const lblAfter = await p.evaluate(() => [...document.querySelectorAll('#labels .lbl')].filter((e) => e.style.display !== 'none').length);
  out.labelsToggle = { before: lblBefore, after: lblAfter };
  await p.click('#btnLabels');
  await p.waitForTimeout(400);

  // 7) 一键拆解 toggle
  await p.click('#btnExplodeAll');
  await p.waitForTimeout(700);
  const e1 = (await st()).ex;
  await p.click('#btnExplodeAll');
  await p.waitForTimeout(700);
  const e2 = (await st()).ex;
  out.explodeAll = { first: e1, second: e2 };

  // 8) 键盘
  await p.keyboard.press('Space');
  await p.waitForTimeout(600);
  out.keySpace = (await st()).ex;
  await p.keyboard.press('r');
  await p.waitForTimeout(900);
  out.keyR = await st();

  // 9) 3D 拾取
  out.pick = await p.evaluate(() => window.__dbg.pick(800, 470));

  // 10) 拖拽 / 滚轮
  await p.mouse.move(800, 470); await p.mouse.down(); await p.mouse.move(940, 470, { steps: 8 }); await p.mouse.up();
  await p.waitForTimeout(300);
  out.drag = await p.evaluate(() => +window.__dbg.orbit.cur.th.toFixed(2));
  const rBefore = await p.evaluate(() => window.__dbg.orbit.des.r);
  await p.mouse.wheel(0, -420);
  await p.waitForTimeout(300);
  out.wheel = await p.evaluate((r0) => ({ before: +r0.toFixed(1), after: +window.__dbg.orbit.des.r.toFixed(1) }), rBefore);

  // 11) 双击复位
  await p.mouse.dblclick(800, 470);
  await p.waitForTimeout(600);
  out.dblclick = await p.evaluate(() => ({ th: +window.__dbg.orbit.des.th.toFixed(2), r: +window.__dbg.orbit.des.r.toFixed(1) }));

  // 12) Esc 取消选中
  await p.evaluate(() => window.__dbg.select('screen'));
  await p.waitForTimeout(200);
  await p.keyboard.press('Escape');
  await p.waitForTimeout(300);
  out.esc = await st();

  out.errors = errs;
  console.log(JSON.stringify(out, null, 1));
  await b.close();
})();
