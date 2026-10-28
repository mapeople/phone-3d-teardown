/* ============================================================================
 *  textures.js — 全部贴图由 Canvas 程序化生成，零外部资源
 * ==========================================================================*/
(function () {
  const T = window.T;
  const cache = {};

  function make(w, h, draw) {
    const c = document.createElement('canvas');
    c.width = w;
    c.height = h;
    const x = c.getContext('2d');
    draw(x, w, h);
    return c;
  }
  function tex(canvas, repeat) {
    const t = new THREE.CanvasTexture(canvas);
    t.colorSpace = THREE.SRGBColorSpace;
    t.anisotropy = 4;
    t.needsUpdate = true;
    if (repeat) {
      t.wrapS = t.wrapT = THREE.RepeatWrapping;
      t.repeat.set(repeat[0], repeat[1]);
    }
    return t;
  }
  function once(key, fn) {
    if (!cache[key]) cache[key] = fn();
    return cache[key];
  }

  /* ======================== 屏幕壁纸 ======================== */
  T.texScreen = function () {
    return once('screen', function () {
      const W = 720, H = 1560;
      const c = make(W, H, function (x) {
        // 深空底色
        const g = x.createLinearGradient(0, 0, W * 0.4, H);
        g.addColorStop(0, '#05070e');
        g.addColorStop(0.42, '#0a1230');
        g.addColorStop(0.72, '#171046');
        g.addColorStop(1, '#050510');
        x.fillStyle = g;
        x.fillRect(0, 0, W, H);

        // 极光光带
        for (let i = 0; i < 5; i++) {
          const rg = x.createRadialGradient(
            W * (0.24 + i * 0.14), H * (0.30 + i * 0.06), 20,
            W * (0.24 + i * 0.14), H * (0.30 + i * 0.06), W * (0.52 - i * 0.03)
          );
          rg.addColorStop(0, ['rgba(90,140,255,0.42)', 'rgba(150,90,255,0.30)',
            'rgba(60,210,230,0.24)', 'rgba(255,110,180,0.16)', 'rgba(70,120,255,0.12)'][i]);
          rg.addColorStop(1, 'rgba(0,0,0,0)');
          x.fillStyle = rg;
          x.fillRect(0, 0, W, H);
        }

        // 细密星点
        for (let i = 0; i < 420; i++) {
          const sx = Math.random() * W, sy = Math.random() * H * 0.8;
          const a = Math.random() * 0.5 + 0.08;
          x.fillStyle = 'rgba(200,225,255,' + a.toFixed(3) + ')';
          x.fillRect(sx, sy, Math.random() < 0.85 ? 1.4 : 2.4, Math.random() < 0.85 ? 1.4 : 2.4);
        }

        // 星球弧线
        x.save();
        x.globalAlpha = 0.55;
        const pg = x.createLinearGradient(W * 0.1, H * 0.62, W * 0.9, H * 0.9);
        pg.addColorStop(0, 'rgba(120,170,255,0.55)');
        pg.addColorStop(0.5, 'rgba(70,60,190,0.35)');
        pg.addColorStop(1, 'rgba(10,10,30,0)');
        x.strokeStyle = pg;
        x.lineWidth = 2.2;
        for (let i = 0; i < 26; i++) {
          x.beginPath();
          x.ellipse(W * 0.5, H * 1.28, W * (0.42 + i * 0.036), W * (0.30 + i * 0.030), 0, Math.PI * 1.04, Math.PI * 1.96);
          x.stroke();
        }
        x.restore();

        // 时间
        x.fillStyle = 'rgba(255,255,255,0.94)';
        x.font = '300 132px "Helvetica Neue", Arial, sans-serif';
        x.textAlign = 'center';
        x.fillText('09:41', W / 2, H * 0.20);
        x.font = '400 30px "Helvetica Neue", Arial, sans-serif';
        x.fillStyle = 'rgba(210,222,255,0.72)';
        x.fillText('10月28日  星期二', W / 2, H * 0.245);

        // 锁屏快捷图标（左：手电筒 / 右：相机）
        x.strokeStyle = 'rgba(255,255,255,0.55)';
        x.lineWidth = 3;
        [W * 0.16, W * 0.84].forEach(function (cx) {
          x.beginPath();
          x.arc(cx, H * 0.885, 34, 0, Math.PI * 2);
          x.fillStyle = 'rgba(255,255,255,0.12)';
          x.fill();
          x.stroke();
        });

        // 应用图标网格 4×5
        const cols = 4, rows = 5;
        const padX = W * 0.10, padY = H * 0.335;
        const gw = (W - padX * 2) / cols;
        const gh = H * 0.098;
        const palette = [
          ['#2a6bff', '#5aa8ff'], ['#12b76a', '#5ce6a1'], ['#f04438', '#ff8a72'],
          ['#f79009', '#ffc46b'], ['#7a5af8', '#b39dff'], ['#06aed4', '#6ee7ff'],
          ['#e04a8a', '#ff9ec4'], ['#4b5565', '#8b98ab'], ['#13b5b1', '#63e6e2'],
          ['#ff6b2c', '#ffb27a'], ['#845adf', '#c3adff'], ['#0ba5ec', '#7dd3fc'],
          ['#d92d20', '#ff9a8f'], ['#12b76a', '#a6f4c5'], ['#475467', '#98a2b3'],
          ['#1d4ed8', '#7aa2ff'], ['#c11574', '#f670c7'], ['#027a48', '#6ce9a6'],
          ['#b54708', '#fdb022'], ['#344054', '#667085'],
        ];
        for (let r = 0; r < rows; r++) {
          for (let cI = 0; cI < cols; cI++) {
            const idx = r * cols + cI;
            const cx = padX + gw * cI + gw / 2;
            const cy = padY + gh * r + gh / 2;
            const s = gw * 0.56;
            const p = palette[idx % palette.length];
            const ig = x.createLinearGradient(cx - s / 2, cy - s / 2, cx + s / 2, cy + s / 2);
            ig.addColorStop(0, p[0]);
            ig.addColorStop(1, p[1]);
            x.fillStyle = ig;
            x.beginPath();
            const rr = s * 0.28;
            x.moveTo(cx - s / 2 + rr, cy - s / 2);
            x.arcTo(cx + s / 2, cy - s / 2, cx + s / 2, cy + s / 2, rr);
            x.arcTo(cx + s / 2, cy + s / 2, cx - s / 2, cy + s / 2, rr);
            x.arcTo(cx - s / 2, cy + s / 2, cx - s / 2, cy - s / 2, rr);
            x.arcTo(cx - s / 2, cy - s / 2, cx + s / 2, cy - s / 2, rr);
            x.fill();
            // 图标高光
            x.fillStyle = 'rgba(255,255,255,0.30)';
            x.beginPath();
            x.ellipse(cx, cy - s * 0.18, s * 0.26, s * 0.13, 0, 0, Math.PI * 2);
            x.fill();
            // 名称条
            x.fillStyle = 'rgba(255,255,255,0.36)';
            x.fillRect(cx - s * 0.34, cy + s * 0.62, s * 0.68, 4);
          }
        }

        // Dock
        const dy = H * 0.925;
        x.fillStyle = 'rgba(255,255,255,0.09)';
        x.beginPath();
        const dw = W * 0.80, dh = H * 0.072, dx = (W - dw) / 2, dr = dh / 2;
        x.moveTo(dx + dr, dy - dh / 2);
        x.arcTo(dx + dw, dy - dh / 2, dx + dw, dy + dh / 2, dr);
        x.arcTo(dx + dw, dy + dh / 2, dx, dy + dh / 2, dr);
        x.arcTo(dx, dy + dh / 2, dx, dy - dh / 2, dr);
        x.arcTo(dx, dy - dh / 2, dx + dw, dy - dh / 2, dr);
        x.fill();
        for (let i = 0; i < 4; i++) {
          const cx = dx + dw * (0.135 + i * 0.243);
          const p = palette[(i + 3) % palette.length];
          const ig = x.createLinearGradient(cx - 30, dy - 30, cx + 30, dy + 30);
          ig.addColorStop(0, p[0]);
          ig.addColorStop(1, p[1]);
          x.fillStyle = ig;
          x.beginPath();
          x.roundRect ? x.roundRect(cx - 30, dy - 30, 60, 60, 17) : x.rect(cx - 30, dy - 30, 60, 60);
          x.fill();
        }

        // 顶部状态栏
        x.fillStyle = 'rgba(255,255,255,0.85)';
        x.font = '500 24px "Helvetica Neue", Arial, sans-serif';
        x.textAlign = 'left';
        x.fillText('9:41', W * 0.09, H * 0.035);
        x.textAlign = 'right';
        x.fillText('5G', W * 0.79, H * 0.035);
        // 电池
        x.strokeStyle = 'rgba(255,255,255,0.8)';
        x.lineWidth = 2;
        x.strokeRect(W * 0.83, H * 0.020, 38, 18);
        x.fillStyle = 'rgba(255,255,255,0.85)';
        x.fillRect(W * 0.83 + 2, H * 0.020 + 2, 30, 14);
        // 信号格
        for (let i = 0; i < 4; i++) {
          x.fillStyle = 'rgba(255,255,255,' + (i < 3 ? 0.85 : 0.3) + ')';
          x.fillRect(W * 0.72 + i * 7, H * 0.038 - i * 3, 4, 6 + i * 3);
        }
      });
      return tex(c);
    });
  };

  /* ======================== 后盖素皮（玄黑） ======================== */
  T.texLeather = function (base) {
    return once('leather' + base, function () {
      const W = 512, H = 1024;
      const c = make(W, H, function (x) {
        x.fillStyle = base || '#14151a';
        x.fillRect(0, 0, W, H);
        // 皮革颗粒
        for (let i = 0; i < 26000; i++) {
          const px = Math.random() * W, py = Math.random() * H;
          const a = Math.random();
          x.fillStyle = a > 0.55
            ? 'rgba(255,255,255,' + (Math.random() * 0.035).toFixed(3) + ')'
            : 'rgba(0,0,0,' + (Math.random() * 0.10).toFixed(3) + ')';
          const s = Math.random() * 2.4 + 0.4;
          x.fillRect(px, py, s, s);
        }
        // 细纹路
        x.globalAlpha = 0.06;
        x.strokeStyle = '#9aa4b8';
        x.lineWidth = 0.8;
        for (let i = 0; i < 240; i++) {
          const y0 = Math.random() * H;
          x.beginPath();
          x.moveTo(0, y0);
          x.bezierCurveTo(W * 0.3, y0 + (Math.random() - 0.5) * 40, W * 0.7, y0 + (Math.random() - 0.5) * 40, W, y0 + (Math.random() - 0.5) * 20);
          x.stroke();
        }
        x.globalAlpha = 1;
        // 底部品牌字
        x.fillStyle = 'rgba(212,178,120,0.92)';
        x.font = '600 26px "Helvetica Neue", Arial, sans-serif';
        x.textAlign = 'center';
        x.letterSpacing = '10px';
        x.fillText('HUAWEI', W / 2, H * 0.905);
        x.fillStyle = 'rgba(190,160,110,0.55)';
        x.font = '400 13px "Helvetica Neue", Arial, sans-serif';
        x.fillText('ULTIMATE  DESIGN', W / 2, H * 0.928);
        // 星环徽记
        x.strokeStyle = 'rgba(214,180,122,0.30)';
        x.lineWidth = 1.4;
        x.beginPath();
        x.arc(W / 2, H * 0.955, 18, 0, Math.PI * 2);
        x.stroke();
      });
      return tex(c);
    });
  };

  /* ======================== 陶瓷 / 素皮 背板（典藏版金线） ======================== */
  T.texBackPanel = function () {
    return once('backpanel', function () {
      const W = 640, H = 1340;
      const c = make(W, H, function (x) {
        // 底色：深墨绿灰（典藏版素皮质感，比纯黑更有层次）
        const bg = x.createLinearGradient(0, 0, W * 0.6, H);
        bg.addColorStop(0, '#23262e');
        bg.addColorStop(0.42, '#1a1d24');
        bg.addColorStop(0.75, '#15181e');
        bg.addColorStop(1, '#1b1e26');
        x.fillStyle = bg;
        x.fillRect(0, 0, W, H);

        // 顶部微光
        const g = x.createLinearGradient(0, 0, 0, H);
        g.addColorStop(0, 'rgba(96,116,158,0.55)');
        g.addColorStop(0.22, 'rgba(50,60,82,0.30)');
        g.addColorStop(0.55, 'rgba(18,22,30,0.10)');
        g.addColorStop(1, 'rgba(8,9,12,0.0)');
        x.fillStyle = g;
        x.fillRect(0, 0, W, H);

        // 侧向丝缎光（左右两道亮边，模拟曲面玻璃/素皮高光）
        const s = x.createLinearGradient(0, 0, W, 0);
        s.addColorStop(0, 'rgba(190,210,240,0.16)');
        s.addColorStop(0.10, 'rgba(160,180,215,0.05)');
        s.addColorStop(0.30, 'rgba(255,255,255,0)');
        s.addColorStop(0.72, 'rgba(255,255,255,0)');
        s.addColorStop(0.93, 'rgba(180,200,235,0.07)');
        s.addColorStop(1, 'rgba(200,220,255,0.14)');
        x.fillStyle = s;
        x.fillRect(0, 0, W, H);

        // 斜向主高光带（斜穿机身的柔光）
        x.save();
        x.translate(W * 0.5, H * 0.34);
        x.rotate(-0.42);
        const hl = x.createLinearGradient(-W * 0.62, 0, W * 0.62, 0);
        hl.addColorStop(0, 'rgba(255,255,255,0)');
        hl.addColorStop(0.42, 'rgba(210,225,255,0.055)');
        hl.addColorStop(0.5, 'rgba(235,244,255,0.10)');
        hl.addColorStop(0.58, 'rgba(210,225,255,0.05)');
        hl.addColorStop(1, 'rgba(255,255,255,0)');
        x.fillStyle = hl;
        x.fillRect(-W * 0.62, -H * 0.5, W * 1.24, H);
        x.restore();

        // 细颗粒磨砂（素皮颗粒感）
        for (let i = 0; i < 42000; i++) {
          const px = Math.random() * W, py = Math.random() * H;
          const up = Math.random() > 0.42;
          x.fillStyle = up
            ? 'rgba(220,232,255,' + (Math.random() * 0.05).toFixed(3) + ')'
            : 'rgba(0,0,0,' + (Math.random() * 0.10).toFixed(3) + ')';
          const sz = 0.9 + Math.random() * 1.6;
          x.fillRect(px, py, sz, sz);
        }

        // 素皮纵向细纹
        x.globalAlpha = 0.10;
        for (let i = 0; i < 180; i++) {
          const px = Math.random() * W;
          x.strokeStyle = Math.random() > 0.5 ? '#c8d6ea' : '#05070a';
          x.lineWidth = 0.6;
          x.beginPath();
          const y0 = Math.random() * H;
          x.moveTo(px, y0);
          x.lineTo(px + (Math.random() - 0.5) * 14, y0 + 40 + Math.random() * 220);
          x.stroke();
        }
        x.globalAlpha = 1;

        // 金色装饰：下部纵向光带
        x.save();
        x.globalAlpha = 0.85;
        const lg = x.createLinearGradient(0, H * 0.60, 0, H * 0.90);
        lg.addColorStop(0, 'rgba(206,166,106,0)');
        lg.addColorStop(0.5, 'rgba(206,166,106,0.13)');
        lg.addColorStop(1, 'rgba(206,166,106,0)');
        x.fillStyle = lg;
        x.fillRect(0, H * 0.60, W, H * 0.30);
        x.restore();

        // 品牌字（带发光晕）
        x.save();
        x.shadowColor = 'rgba(214,178,116,0.65)';
        x.shadowBlur = 16;
        x.fillStyle = 'rgba(232,204,152,0.98)';
        x.font = '600 34px "Helvetica Neue", Arial, sans-serif';
        x.textAlign = 'center';
        x.fillText('HUAWEI', W / 2, H * 0.878);
        x.restore();
        x.fillStyle = 'rgba(212,182,128,0.82)';
        x.font = '400 16px "Helvetica Neue", Arial, sans-serif';
        x.textAlign = 'center';
        x.fillText('MATE  90  PRO MAX', W / 2, H * 0.906);
        x.fillStyle = 'rgba(206,176,124,0.58)';
        x.font = '400 12px "Helvetica Neue", Arial, sans-serif';
        x.fillText('ULTIMATE  DESIGN', W / 2, H * 0.926);

        // 底部细金线
        x.strokeStyle = 'rgba(200,168,110,0.24)';
        x.lineWidth = 1;
        x.beginPath();
        x.moveTo(W * 0.30, H * 0.945);
        x.lineTo(W * 0.70, H * 0.945);
        x.stroke();

        // 右上角 XMAGE 标识区（相机模组附近装饰）
        x.fillStyle = 'rgba(210,178,120,0.42)';
        x.font = '500 13px "Helvetica Neue", Arial, sans-serif';
        x.fillText('XMAGE', W * 0.5, H * 0.062);
      });
      return tex(c);
    });
  };

  /* ======================== PCB 主板 ======================== */
  T.texPCB = function () {
    return once('pcb', function () {
      const W = 512, H = 1024;
      const c = make(W, H, function (x) {
        // 深墨绿阻焊层（低饱和，避免刺眼）
        x.fillStyle = '#0b1a16';
        x.fillRect(0, 0, W, H);
        const bg = x.createLinearGradient(0, 0, W, H);
        bg.addColorStop(0, 'rgba(70,110,95,0.16)');
        bg.addColorStop(0.5, 'rgba(0,0,0,0)');
        bg.addColorStop(1, 'rgba(0,0,0,0.28)');
        x.fillStyle = bg;
        x.fillRect(0, 0, W, H);
        // 大面积覆铜区（少量、规整）
        x.fillStyle = 'rgba(46,86,72,0.20)';
        for (let i = 0; i < 26; i++) {
          const bw = 40 + Math.random() * 130, bh = 40 + Math.random() * 150;
          x.fillRect(Math.random() * (W - bw), Math.random() * (H - bh), bw, bh);
        }
        // 走线（正交折线，像真实 PCB）
        x.strokeStyle = 'rgba(196,158,86,0.34)';
        x.lineWidth = 1;
        for (let i = 0; i < 150; i++) {
          let px = Math.random() * W, py = Math.random() * H;
          x.beginPath();
          x.moveTo(px, py);
          for (let k = 0; k < 3; k++) {
            if (Math.random() > 0.5) px += (Math.random() - 0.5) * 150;
            else py += (Math.random() - 0.5) * 150;
            x.lineTo(px, py);
          }
          x.stroke();
        }
        // 过孔阵列
        x.fillStyle = 'rgba(200,170,110,0.30)';
        for (let i = 0; i < 220; i++) {
          x.beginPath();
          x.arc(Math.random() * W, Math.random() * H, 1.1, 0, Math.PI * 2);
          x.fill();
        }
        // 焊盘阵列
        for (let i = 0; i < 130; i++) {
          const px = Math.random() * W, py = Math.random() * H;
          x.fillStyle = 'rgba(212,178,110,0.75)';
          x.beginPath();
          x.arc(px, py, Math.random() * 3 + 1, 0, Math.PI * 2);
          x.fill();
        }
        // 丝印
        x.fillStyle = 'rgba(220,232,240,0.55)';
        x.font = '500 13px monospace';
        for (let i = 0; i < 26; i++) {
          x.fillText('R' + (100 + i) + ' C' + (200 + i), Math.random() * (W - 70), Math.random() * H);
        }
        x.strokeStyle = 'rgba(220,232,240,0.35)';
        x.lineWidth = 1.6;
        x.strokeRect(12, 12, W - 24, H - 24);
      });
      return tex(c);
    });
  };

  /* ======================== 芯片顶面丝印 ======================== */
  T.texChip = function (label, sub, color) {
    const key = 'chip' + label + sub + color;
    return once(key, function () {
      const S = 256;
      const c = make(S, S, function (x) {
        x.fillStyle = color || '#101318';
        x.fillRect(0, 0, S, S);
        const g = x.createLinearGradient(0, 0, S, S);
        g.addColorStop(0, 'rgba(255,255,255,0.10)');
        g.addColorStop(0.5, 'rgba(255,255,255,0)');
        g.addColorStop(1, 'rgba(0,0,0,0.22)');
        x.fillStyle = g;
        x.fillRect(0, 0, S, S);
        // 封装边缘
        x.strokeStyle = 'rgba(210,224,244,0.22)';
        x.lineWidth = 3;
        x.strokeRect(6, 6, S - 12, S - 12);
        // 芯片丝印
        x.fillStyle = 'rgba(228,236,248,0.94)';
        x.font = '600 30px "Helvetica Neue", Arial, sans-serif';
        x.textAlign = 'center';
        x.fillText(label, S / 2, S * 0.44);
        x.fillStyle = 'rgba(200,214,232,0.62)';
        x.font = '400 15px "Helvetica Neue", Arial, sans-serif';
        if (sub) x.fillText(sub, S / 2, S * 0.56);
        // 角标
        x.fillStyle = 'rgba(210,178,120,0.8)';
        x.beginPath();
        x.arc(26, 26, 6, 0, Math.PI * 2);
        x.fill();
        // 引脚阴影
        x.fillStyle = 'rgba(0,0,0,0.25)';
        x.fillRect(0, S - 10, S, 10);
      });
      return tex(c);
    });
  };

  /* ======================== 电池标签 ======================== */
  T.texBattery = function () {
    return once('battery', function () {
      const W = 420, H = 640;
      const c = make(W, H, function (x) {
        const g = x.createLinearGradient(0, 0, W, H);
        g.addColorStop(0, '#1c2430');
        g.addColorStop(0.5, '#2a3444');
        g.addColorStop(1, '#151b25');
        x.fillStyle = g;
        x.fillRect(0, 0, W, H);
        // 拉丝
        x.globalAlpha = 0.08;
        for (let i = 0; i < 220; i++) {
          x.strokeStyle = i % 2 ? '#ffffff' : '#000000';
          x.lineWidth = 1;
          x.beginPath();
          x.moveTo(0, Math.random() * H);
          x.lineTo(W, Math.random() * H);
          x.stroke();
        }
        x.globalAlpha = 1;

        // 边框
        x.strokeStyle = 'rgba(180,196,220,0.28)';
        x.lineWidth = 2;
        x.strokeRect(10, 10, W - 20, H - 20);

        // 标题
        x.fillStyle = 'rgba(230,238,250,0.95)';
        x.font = '600 26px "Helvetica Neue", Arial, sans-serif';
        x.textAlign = 'center';
        x.fillText('HUAWEI  Li-Polymer', W / 2, 60);

        // 大容量数字
        x.fillStyle = 'rgba(255,255,255,0.96)';
        x.font = '300 84px "Helvetica Neue", Arial, sans-serif';
        x.fillText('6800', W / 2, H * 0.30);
        x.fillStyle = 'rgba(190,206,228,0.8)';
        x.font = '500 26px "Helvetica Neue", Arial, sans-serif';
        x.fillText('mAh   Typ.', W / 2, H * 0.345);

        // 参数行
        x.textAlign = 'left';
        const rows = [
          ['标称电压', '3.87 V'],
          ['充电限制电压', '4.48 V'],
          ['额定能量', '26.3 Wh'],
          ['最大充电功率', '100 W  SuperCharge'],
          ['电芯型号', 'HB-90PM-6800'],
        ];
        rows.forEach(function (r, i) {
          const y = H * 0.44 + i * 40;
          x.fillStyle = 'rgba(160,180,205,0.75)';
          x.font = '400 17px "Helvetica Neue", Arial, sans-serif';
          x.fillText(r[0], 40, y);
          x.fillStyle = 'rgba(235,242,252,0.9)';
          x.font = '500 17px "Helvetica Neue", Arial, sans-serif';
          x.textAlign = 'right';
          x.fillText(r[1], W - 40, y);
          x.textAlign = 'left';
          x.strokeStyle = 'rgba(160,180,205,0.12)';
          x.lineWidth = 1;
          x.beginPath();
          x.moveTo(40, y + 12);
          x.lineTo(W - 40, y + 12);
          x.stroke();
        });

        // 条形码
        const by = H * 0.80;
        for (let i = 0; i < 76; i++) {
          x.fillStyle = Math.random() > 0.5 ? 'rgba(240,246,255,0.9)' : 'rgba(240,246,255,0.15)';
          x.fillRect(38 + i * 4.4, by, Math.random() * 2.4 + 1, 46);
        }
        x.fillStyle = 'rgba(210,222,238,0.75)';
        x.font = '400 14px monospace';
        x.fillText('HB90PMM-6800-ULT-2026', 38, by + 70);

        // 高压警示
        x.strokeStyle = 'rgba(230,180,90,0.8)';
        x.lineWidth = 2;
        x.beginPath();
        x.moveTo(W - 66, H - 96);
        x.lineTo(W - 34, H - 96);
        x.lineTo(W - 50, H - 62);
        x.closePath();
        x.stroke();
        x.fillStyle = 'rgba(230,180,90,0.9)';
        x.font = '700 18px Arial';
        x.textAlign = 'center';
        x.fillText('!', W - 50, H - 74);
      });
      return tex(c);
    });
  };

  /* ======================== 镜头环刻度 ======================== */
  T.texLensRing = function () {
    return once('lensring', function () {
      const S = 512;
      const c = make(S, S, function (x) {
        x.clearRect(0, 0, S, S);
        const cx = S / 2, cy = S / 2;
        // 外圈金属环
        const g = x.createRadialGradient(cx, cy, S * 0.30, cx, cy, S * 0.50);
        g.addColorStop(0, 'rgba(40,44,54,0)');
        g.addColorStop(0.62, 'rgba(78,84,98,0.85)');
        g.addColorStop(0.80, 'rgba(200,172,116,0.95)');
        g.addColorStop(0.88, 'rgba(120,100,64,0.9)');
        g.addColorStop(1, 'rgba(30,32,40,0)');
        x.fillStyle = g;
        x.beginPath();
        x.arc(cx, cy, S * 0.5, 0, Math.PI * 2);
        x.fill();
        // 刻度
        x.strokeStyle = 'rgba(24,26,32,0.9)';
        x.lineWidth = 2;
        for (let i = 0; i < 96; i++) {
          const a = (i / 96) * Math.PI * 2;
          const r0 = S * (i % 8 === 0 ? 0.425 : 0.445);
          const r1 = S * 0.462;
          x.beginPath();
          x.moveTo(cx + Math.cos(a) * r0, cy + Math.sin(a) * r0);
          x.lineTo(cx + Math.cos(a) * r1, cy + Math.sin(a) * r1);
          x.stroke();
        }
        // 文字
        x.save();
        x.translate(cx, cy);
        x.fillStyle = 'rgba(28,30,36,0.95)';
        x.font = '600 20px "Helvetica Neue", Arial, sans-serif';
        x.textAlign = 'center';
        for (let i = 0; i < 12; i++) {
          const a = (i / 12) * Math.PI * 2 - Math.PI / 2;
          x.save();
          x.rotate(a + Math.PI / 2);
          x.translate(0, -S * 0.395);
          x.fillText(String(i * 5 + 5), 0, 0);
          x.restore();
        }
        x.restore();
      });
      const t = tex(c);
      return t;
    });
  };

  /* ======================== 石墨烯散热膜 ======================== */
  T.texGraphite = function () {
    return once('graphite', function () {
      const W = 420, H = 780;
      const c = make(W, H, function (x) {
        // 深石墨灰底（近黑，带金属冷调）
        const g = x.createLinearGradient(0, 0, W, H);
        g.addColorStop(0, '#24272d');
        g.addColorStop(0.40, '#2e323a');
        g.addColorStop(0.72, '#22252b');
        g.addColorStop(1, '#1a1c22');
        x.fillStyle = g;
        x.fillRect(0, 0, W, H);
        // 蜂窝石墨纹理（极淡）
        x.strokeStyle = 'rgba(180,200,230,0.045)';
        x.lineWidth = 1;
        const s = 14;
        for (let row = -1; row < H / (s * 0.87) + 1; row++) {
          for (let col = -1; col < W / (s * 1.5) + 1; col++) {
            const cx = col * s * 1.5 + (row % 2 ? s * 0.75 : 0);
            const cy = row * s * 0.87;
            x.beginPath();
            for (let k = 0; k < 6; k++) {
              const a = (k / 6) * Math.PI * 2;
              const px = cx + Math.cos(a) * s * 0.52;
              const py = cy + Math.sin(a) * s * 0.52;
              k ? x.lineTo(px, py) : x.moveTo(px, py);
            }
            x.closePath();
            x.stroke();
          }
        }
        // 铜箔边缘（细金线）
        x.strokeStyle = 'rgba(206,166,106,0.62)';
        x.lineWidth = 2.5;
        x.strokeRect(8, 8, W - 16, H - 16);
        // 中心大面积柔和反光
        const sh = x.createLinearGradient(0, H * 0.15, W, H * 0.62);
        sh.addColorStop(0, 'rgba(255,255,255,0)');
        sh.addColorStop(0.5, 'rgba(200,220,255,0.075)');
        sh.addColorStop(1, 'rgba(255,255,255,0)');
        x.fillStyle = sh;
        x.fillRect(0, 0, W, H);
        x.fillStyle = 'rgba(196,214,236,0.42)';
        x.font = '500 15px monospace';
        x.fillText('GRAPHENE  FILM  ·  3D  VC', 22, H - 24);
      });
      return tex(c);
    });
  };

  /* ======================== VC 均热板 ======================== */
  T.texVC = function () {
    return once('vc', function () {
      const W = 380, H = 620;
      const c = make(W, H, function (x) {
        const g = x.createLinearGradient(0, 0, W, H);
        g.addColorStop(0, '#7a4a22');
        g.addColorStop(0.3, '#c98a45');
        g.addColorStop(0.55, '#e8b877');
        g.addColorStop(0.8, '#a86a30');
        g.addColorStop(1, '#6b3d1c');
        x.fillStyle = g;
        x.fillRect(0, 0, W, H);
        // 铜面细纹
        x.globalAlpha = 0.12;
        for (let i = 0; i < 500; i++) {
          x.strokeStyle = i % 2 ? '#fff6e0' : '#5a2f10';
          x.beginPath();
          x.moveTo(0, Math.random() * H);
          x.lineTo(W, Math.random() * H);
          x.stroke();
        }
        x.globalAlpha = 1;
        // 蚀刻纹路
        x.strokeStyle = 'rgba(70,38,12,0.35)';
        x.lineWidth = 2;
        for (let i = 0; i < 16; i++) {
          x.beginPath();
          const y0 = 40 + i * 34;
          x.moveTo(24, y0);
          for (let k = 1; k <= 12; k++) {
            x.lineTo(24 + (W - 48) * (k / 12), y0 + Math.sin(k * 1.4 + i) * 12);
          }
          x.stroke();
        }
        x.fillStyle = 'rgba(60,32,10,0.55)';
        x.font = '600 18px "Helvetica Neue", Arial, sans-serif';
        x.textAlign = 'center';
        x.fillText('VAPOR  CHAMBER', W / 2, H * 0.5);
        x.font = '400 13px "Helvetica Neue", Arial, sans-serif';
        x.fillText('5000 mm²  ·  超薄 0.35 mm', W / 2, H * 0.53);
      });
      return tex(c);
    });
  };

  /* ======================== 中框内壁（金属拉丝） ======================== */
  T.texBrushed = function () {
    return once('brushed', function () {
      const S = 256;
      const c = make(S, S, function (x) {
        x.fillStyle = '#8e949e';
        x.fillRect(0, 0, S, S);
        for (let i = 0; i < 900; i++) {
          x.strokeStyle = 'rgba(255,255,255,' + (Math.random() * 0.10).toFixed(3) + ')';
          x.lineWidth = Math.random() * 1.6 + 0.2;
          const y = Math.random() * S;
          x.beginPath();
          x.moveTo(0, y);
          x.lineTo(S, y + (Math.random() - 0.5) * 3);
          x.stroke();
        }
      });
      const t = tex(c, [3, 3]);
      return t;
    });
  };

  /* ======================== 光晕（发光粒子贴图） ======================== */
  T.texGlow = function () {
    return once('glow', function () {
      const S = 128;
      const c = make(S, S, function (x) {
        const g = x.createRadialGradient(S / 2, S / 2, 0, S / 2, S / 2, S / 2);
        g.addColorStop(0, 'rgba(255,255,255,1)');
        g.addColorStop(0.25, 'rgba(200,225,255,0.55)');
        g.addColorStop(0.6, 'rgba(120,170,255,0.12)');
        g.addColorStop(1, 'rgba(0,0,0,0)');
        x.fillStyle = g;
        x.fillRect(0, 0, S, S);
      });
      return tex(c);
    });
  };

  /* ======================== 副板 ======================== */
  T.texSubPCB = function () {
    return once('subpcb', function () {
      const W = 300, H = 420;
      const c = make(W, H, function (x) {
        x.fillStyle = '#0b1a16';
        x.fillRect(0, 0, W, H);
        x.fillStyle = 'rgba(46,86,72,0.22)';
        for (let i = 0; i < 12; i++) {
          x.fillRect(Math.random() * W * 0.8, Math.random() * H * 0.8, 40 + Math.random() * 80, 40 + Math.random() * 80);
        }
        x.strokeStyle = 'rgba(200,160,90,0.4)';
        x.lineWidth = 1;
        for (let i = 0; i < 90; i++) {
          let px = Math.random() * W, py = Math.random() * H;
          x.beginPath();
          x.moveTo(px, py);
          for (let k = 0; k < 3; k++) {
            px += (Math.random() - 0.5) * 90;
            py += (Math.random() - 0.5) * 90;
            x.lineTo(px, py);
          }
          x.stroke();
        }
        // USB-C 焊盘
        x.fillStyle = 'rgba(210,178,110,0.8)';
        for (let i = 0; i < 24; i++) {
          x.fillRect(W / 2 - 60 + i * 5, H * 0.72, 2.4, 26);
        }
      });
      return tex(c);
    });
  };

  /* ======================== 相机模组顶面（星环装饰） ======================== */
  T.texCameraIsland = function () {
    return once('camisland', function () {
      const S = 512;
      const c = make(S, S, function (x) {
        x.clearRect(0, 0, S, S);
        const cx = S / 2, cy = S / 2;
        const g = x.createRadialGradient(cx, cy - 40, 20, cx, cy, S * 0.5);
        g.addColorStop(0, '#2a2d36');
        g.addColorStop(0.55, '#15171d');
        g.addColorStop(1, '#0a0b0f');
        x.fillStyle = g;
        x.beginPath();
        x.arc(cx, cy, S * 0.5, 0, Math.PI * 2);
        x.fill();
        // 同心星环
        for (let i = 0; i < 3; i++) {
          x.strokeStyle = 'rgba(206,172,112,' + (0.5 - i * 0.13) + ')';
          x.lineWidth = 1.6;
          x.beginPath();
          x.arc(cx, cy, S * (0.30 + i * 0.075), 0, Math.PI * 2);
          x.stroke();
        }
        // 细刻线
        x.strokeStyle = 'rgba(255,255,255,0.06)';
        x.lineWidth = 1;
        for (let i = 0; i < 72; i++) {
          const a = (i / 72) * Math.PI * 2;
          x.beginPath();
          x.moveTo(cx + Math.cos(a) * S * 0.40, cy + Math.sin(a) * S * 0.40);
          x.lineTo(cx + Math.cos(a) * S * 0.44, cy + Math.sin(a) * S * 0.44);
          x.stroke();
        }
      });
      return tex(c);
    });
  };

  /* ======================== 屏幕黑边/听筒区 ======================== */
  T.texScreenMask = function () {
    return once('screenmask', function () {
      const W = 360, H = 780;
      const c = make(W, H, function (x) {
        x.clearRect(0, 0, W, H);
        x.fillStyle = 'rgba(0,0,0,0)';
        x.fillRect(0, 0, W, H);
        // 屏幕圆角遮罩用（透明底 + 黑框）
        x.strokeStyle = 'rgba(0,0,0,0.9)';
        x.lineWidth = 10;
        x.strokeRect(5, 5, W - 10, H - 10);
      });
      return tex(c);
    });
  };

  /* ======================== 天线带 / 装饰细纹 ======================== */
  T.texSpeckle = function () {
    return once('speckle', function () {
      const S = 256;
      const c = make(S, S, function (x) {
        x.fillStyle = '#16181d';
        x.fillRect(0, 0, S, S);
        for (let i = 0; i < 9000; i++) {
          x.fillStyle = 'rgba(255,255,255,' + (Math.random() * 0.05).toFixed(3) + ')';
          x.fillRect(Math.random() * S, Math.random() * S, 1.5, 1.5);
        }
      });
      const t = tex(c, [2, 2]);
      return t;
    });
  };
})();
