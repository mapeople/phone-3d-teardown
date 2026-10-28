/* ============================================================================
 *  model.js — HUAWEI Mate 90 Pro Max 典藏版 全程序化建模
 *  坐标：1 unit = 10mm，XY 为机身平面，Z 为厚度方向（+Z 为正面/屏幕）
 * ==========================================================================*/
(function () {
  const T = window.T;

  /* ---------------- 机身尺寸 ---------------- */
  const PW = 7.80;   // 宽 78.0mm
  const PH = 16.35;  // 高 163.5mm
  const PR = 1.05;   // 圆角半径 10.5mm
  const HT = 0.86;   // 总厚度 8.6mm

  const Z_GLASS = 0.425;
  const Z_DISP = 0.392;
  const Z_FRAME = 0.0;
  const Z_MAIN = -0.09;
  const Z_BATT = -0.13;
  const Z_VC = -0.255;
  const Z_GRAPH = -0.315;
  const Z_COIL = -0.365;
  const Z_BACK = -0.425;

  const ISL_Y = 4.86;     // 相机模组中心
  const ISL_R = 2.46;     // 星环半径

  T.DIM = { PW: PW, PH: PH, PR: PR, HT: HT, ISL_Y: ISL_Y, ISL_R: ISL_R };

  /* ---------------- 共享材质 ---------------- */
  const M = {};
  function mats() {
    if (M.done) return M;
    M.done = true;

    M.frameGold = T.mat.metal(0xc9a97a, 0.26, 1.35);      // 钛金中框
    M.frameDark = T.mat.metal(0x2a2c33, 0.34, 1.0);
    M.champagne = T.mat.metal(0xe0c391, 0.18, 1.8);      // 香槟金高光件
    M.goldDeep = T.mat.metal(0x9c7c45, 0.30, 1.3);
    M.blackMetal = T.mat.metal(0x33384a, 0.26, 1.2);
    M.gunmetal = T.mat.metal(0x5a616f, 0.30, 1.25);
    M.silver = T.mat.metal(0xc4cad4, 0.20, 1.5);
    // 镜头外筒：深枪灰金属，带一点冷蓝，保证在暗背景下可辨识
    M.lensBarrel = T.mat.metal(0x59617a, 0.20, 1.6);
    M.lensRingInner = T.mat.metal(0x2b3040, 0.24, 1.3);
    M.darkPlastic = T.mat.plastic(0x0f1116, 0.62);
    M.blackPlastic = T.mat.plastic(0x1b1e25, 0.55);
    M.rubber = T.mat.plastic(0x0a0b0e, 0.85);
    M.glassBlack = T.mat.glass(0x05070c, 0.05, 1);
    // 镜片：深蓝紫镀膜玻璃，带微弱内发光（模拟镀膜反射）
    M.lensGlass = new THREE.MeshStandardMaterial({
      color: 0x1b2c66, metalness: 1.0, roughness: 0.035, envMapIntensity: 2.6,
      emissive: 0x0a1a4a, emissiveIntensity: 0.42,
    });
    M.lensGlass2 = new THREE.MeshStandardMaterial({
      color: 0x2a1140, metalness: 1.0, roughness: 0.045, envMapIntensity: 2.3,
      emissive: 0x180a2e, emissiveIntensity: 0.38,
    });
    M.iris = new THREE.MeshStandardMaterial({
      color: 0x0e1220, metalness: 0.9, roughness: 0.12, envMapIntensity: 1.4,
      emissive: 0x050a18, emissiveIntensity: 0.25,
    });
    // 镜片中心高光点（模拟蓝宝石镀膜反光）
    M.lensHot = new THREE.MeshStandardMaterial({
      color: 0x9fd0ff, metalness: 0.2, roughness: 0.06,
      emissive: 0x5aa8ff, emissiveIntensity: 0.85,
    });
    M.copper = T.mat.copper();
    M.copperLight = T.mat.metal(0xd79a55, 0.30, 1.5);
    M.pcb = function (c) { return T.mat.pcb(c); };
    M.screenGlass = new THREE.MeshPhysicalMaterial({
      color: 0x0b0e16, metalness: 0.1, roughness: 0.04,
      transparent: true, opacity: 0.20, envMapIntensity: 2.2,
      clearcoat: 1, clearcoatRoughness: 0.03,
    });
    M.bezelBlack = T.mat.plastic(0x030407, 0.35);
    M.flash = new THREE.MeshStandardMaterial({
      color: 0xfff2cf, emissive: 0xfff0c0, emissiveIntensity: 0.55,
      metalness: 0.1, roughness: 0.25,
    });
    return M;
  }

  /* ---------------- 部件注册 ---------------- */
  const parts = [];
  function P(o) {
    o.spec = o.spec || [];
    o.explode = o.explode || new THREE.Vector3();
    o.order = o.order === undefined ? parts.length : o.order;
    parts.push(o);
    return o;
  }

  /* ---------------- 小工具 ---------------- */
  function box(w, h, d, mat, x, y, z) {
    const m = T.box(w, h, d, mat);
    m.position.set(x || 0, y || 0, z || 0);
    return m;
  }
  function cylZ(r, h, seg, mat) {
    const m = new THREE.Mesh(new THREE.CylinderGeometry(r, r, h, seg || 40), mat);
    m.rotation.x = Math.PI / 2;
    return m;
  }
  function torusZ(r, tube, mat, seg) {
    const m = new THREE.Mesh(new THREE.TorusGeometry(r, tube, 14, seg || 72), mat);
    return m;
  }
  /* 芯片：暗色封装 + 顶面丝印 */
  function chip(w, h, d, label, sub, color, z) {
    const g = new THREE.Group();
    g.add(box(w, h, d, M.blackPlastic, 0, 0, 0));
    const t = T.texChip(label, sub, color);
    const pl = new THREE.Mesh(
      new THREE.PlaneGeometry(w * 0.94, h * 0.94),
      new THREE.MeshStandardMaterial({
        map: t, metalness: 0.15, roughness: 0.55,
        emissive: 0xffffff, emissiveMap: t, emissiveIntensity: 0.10,
      })
    );
    pl.rotation.y = Math.PI;
    pl.position.z = -d / 2 - 0.002;
    g.add(pl);
    // 双面丝印：从正面观察拆解视图时同样可读
    const pl2 = new THREE.Mesh(
      new THREE.PlaneGeometry(w * 0.94, h * 0.94),
      new THREE.MeshStandardMaterial({
        map: t, metalness: 0.15, roughness: 0.55,
        emissive: 0xffffff, emissiveMap: t, emissiveIntensity: 0.10,
      })
    );
    pl2.position.z = d / 2 + 0.002;
    g.add(pl2);
    // 引脚
    const pinMat = M.copper;
    for (let i = 0; i < 9; i++) {
      const px = -w / 2 + (w / 9) * (i + 0.5);
      g.add(box(w / 22, 0.03, 0.012, pinMat, px, -h / 2 - 0.008, -d / 2 + 0.01));
    }
    if (z !== undefined) g.position.z = z;
    return g;
  }
  /* 屏蔽罩 */
  function shield(w, h, d, x, y, z) {
    const g = new THREE.Group();
    g.add(box(w, h, d, M.silver, 0, 0, 0));
    // 顶面细纹
    const lines = new THREE.Group();
    for (let i = 0; i < 5; i++) {
      lines.add(box(w * 0.9, 0.008, 0.004, M.gunmetal, 0, -h / 2 + h * (i + 0.5) / 5, -d / 2 - 0.002));
    }
    g.add(lines);
    g.position.set(x, y, z);
    return g;
  }
  /* 镜头模组 */
  /* 镀膜反射弧：环形扇段 + 叠加混合，让镜片有玻璃/镀膜质感 */
  function coatArc(rad, tubeR, a0, a1, color, op, z) {
    const geo = new THREE.RingGeometry(Math.max(0.01, rad - tubeR), rad + tubeR, 48, 1, a0, a1 - a0);
    const mat = new THREE.MeshBasicMaterial({
      color: color, transparent: true, opacity: op,
      blending: THREE.AdditiveBlending, depthWrite: false, side: THREE.DoubleSide
    });
    const m = new THREE.Mesh(geo, mat);
    m.rotation.y = Math.PI;
    m.position.z = z;
    return m;
  }

  function makeLens(r, depth, glassMat, withGoldRing) {
    // 后摄镜筒：相机在 -Z 侧，所以「朝外」= -Z。
    // 筒身朝 +Z 插进星环基座，装饰面/金圈/镜片集中在 local z≈0 一侧朝外。
    const g = new THREE.Group();

    // 外筒（深枪灰金属）
    const barrel = cylZ(r, depth, 64, M.lensBarrel);
    barrel.position.z = depth / 2;
    g.add(barrel);

    // 顶部装饰面（比筒身亮一级，形成台阶）
    const face = cylZ(r * 0.97, 0.02, 64, M.gunmetal);
    face.position.z = -0.008;
    g.add(face);

    // 最外圈香槟金倒角（标志性金圈）
    const bevelRing = torusZ(r * 0.94, r * 0.055, M.champagne, 72);
    bevelRing.position.z = -0.018;
    g.add(bevelRing);

    // 第二道细金环
    if (withGoldRing !== false) {
      const gr = torusZ(r * 0.83, r * 0.030, M.goldDeep, 64);
      gr.position.z = -0.022;
      g.add(gr);
    }

    // 内凹黑圈（镜筒内壁）
    const well = torusZ(r * 0.72, r * 0.050, M.lensRingInner, 56);
    well.position.z = -0.026;
    g.add(well);

    // 镜片（浅球冠，朝 -Z 凸出）
    const lens = T.lens(r * 0.64, glassMat);
    lens.position.z = -0.028;
    g.add(lens);

    // 镀膜反射弧：主弧（冷白）+ 副弧（紫红），工程图式的镜头质感
    const dz = -0.028 - 0.62 * r * 0.12 * 0.88 - 0.004;
    g.add(coatArc(r * 0.50, r * 0.055, Math.PI * 0.62, Math.PI * 1.28, 0x9fd8ff, 0.42, dz));
    g.add(coatArc(r * 0.30, r * 0.030, Math.PI * 1.42, Math.PI * 1.86, 0x7f6bff, 0.30, dz - 0.002));

    // 光圈环（浮在镜片前，模拟镀膜反射环）
    const iris = torusZ(r * 0.36, r * 0.022, M.iris, 48);
    iris.position.z = -0.100;
    g.add(iris);

    // 中心高光点（小圆片，模拟镀膜反光）
    const hot = new THREE.Mesh(new THREE.CircleGeometry(r * 0.13, 24), M.lensHot);
    hot.position.set(-r * 0.17, r * 0.17, -0.102);
    hot.rotation.y = Math.PI;
    g.add(hot);

    // 筒底封盖（朝机身内侧，防止看穿）
    const cap = new THREE.Mesh(new THREE.CircleGeometry(r * 0.99, 48), M.iris);
    cap.position.z = depth - 0.01;
    g.add(cap);
    return g;
  }

  /* ==========================================================================
   *  1. 屏幕总成
   * ========================================================================*/
  function buildScreen() {
    const g = new THREE.Group();
    const bezel = new THREE.Mesh(T.rrPlane(PW - 0.05, PH - 0.05, PR - 0.01), M.bezelBlack);
    bezel.position.z = Z_DISP - 0.006;
    g.add(bezel);

    const dispTex = T.texScreen();
    const dispMat = new THREE.MeshStandardMaterial({
      map: dispTex,
      emissive: 0xffffff,
      emissiveMap: dispTex,
      emissiveIntensity: 0.92,
      metalness: 0.0,
      roughness: 0.32,
    });
    const disp = new THREE.Mesh(T.rrPlane(PW - 0.26, PH - 0.26, PR - 0.08), dispMat);
    disp.position.z = Z_DISP;
    g.add(disp);

    // 屏幕下方的驱动 IC 排线
    const fpc = box(PW * 0.55, 0.5, 0.02, M.copperLight, 0, -PH / 2 + 0.42, Z_DISP - 0.04);
    g.add(fpc);

    // 盖板玻璃
    const glass = T.roundedBox(PW - 0.015, PH - 0.015, 0.032, PR, 0.012);
    const gm = new THREE.Mesh(glass, M.screenGlass);
    gm.position.z = Z_GLASS - 0.016;
    g.add(gm);

    // 前摄三挖孔
    for (let i = 0; i < 3; i++) {
      const hole = cylZ(0.085, 0.01, 24, M.glassBlack);
      hole.position.set(-1.35 + i * 0.34, PH / 2 - 0.62, Z_DISP + 0.002);
      g.add(hole);
    }
    return g;
  }

  /* ==========================================================================
   *  2. 前置影像模组
   * ========================================================================*/
  function buildFrontCam() {
    const g = new THREE.Group();
    g.add(box(0.42, 0.42, 0.12, M.blackPlastic, -1.35, PH / 2 - 0.62, 0.33));
    g.add(box(0.42, 0.42, 0.12, M.blackPlastic, -1.01, PH / 2 - 0.62, 0.33));
    // 主前摄
    const l = makeLens(0.18, 0.16, M.lensGlass, false);
    l.position.set(-1.35, PH / 2 - 0.62, 0.40);
    l.rotation.y = Math.PI;
    g.add(l);
    // 3D 深感副摄
    const l2 = makeLens(0.13, 0.10, M.lensGlass2, false);
    l2.position.set(-1.01, PH / 2 - 0.62, 0.39);
    l2.rotation.y = Math.PI;
    g.add(l2);
    // 泛光感应窗
    g.add(box(0.16, 0.16, 0.03, M.iris, -0.67, PH / 2 - 0.62, 0.385));
    // 排线
    g.add(box(0.9, 0.06, 0.01, M.copperLight, -1.0, PH / 2 - 0.86, 0.36));
    return g;
  }

  /* ==========================================================================
   *  3. 玄武中框
   * ========================================================================*/
  function buildMidframe() {
    const g = new THREE.Group();

    // 主框
    const ring = new THREE.Mesh(T.rrRing(PW, PH, PR, 0.10, HT), M.frameGold);
    g.add(ring);

    // 内壁衬板（浅色）
    const inner = new THREE.Mesh(T.rrRing(PW - 0.20, PH - 0.20, PR - 0.10, 0.06, HT - 0.12), M.frameDark);
    g.add(inner);

    // 顶部 / 底部天线注塑条
    const antMat = T.mat.plastic(0x3a3f4a, 0.5);
    [[-1, 1], [1, -1]].forEach(function (s) {
      const a = box(PW * 0.34, 0.055, HT * 0.86, antMat, 0, s[0] * (PH / 2 - 0.06), 0);
      g.add(a);
    });
    [[-1, 1], [1, -1]].forEach(function (s) {
      const a = box(0.05, PH * 0.30, HT * 0.86, antMat, s[0] * (PW / 2 - 0.055), s[1] * (PH * 0.26), 0);
      g.add(a);
    });

    // 右侧按键（音量 + 电源）
    const keyMat = M.champagne;
    const vUp = T.roundedBox(0.075, 0.62, 0.16, 0.03, 0.012);
    const kv = new THREE.Mesh(vUp, keyMat);
    kv.rotation.y = Math.PI / 2;
    kv.position.set(PW / 2 - 0.02, 3.55, 0);
    g.add(kv);

    const vDn = new THREE.Mesh(T.roundedBox(0.075, 0.62, 0.16, 0.03, 0.012), keyMat);
    vDn.rotation.y = Math.PI / 2;
    vDn.position.set(PW / 2 - 0.02, 2.82, 0);
    g.add(vDn);

    const pwr = new THREE.Mesh(T.roundedBox(0.075, 0.92, 0.16, 0.03, 0.012), keyMat);
    pwr.rotation.y = Math.PI / 2;
    pwr.position.set(PW / 2 - 0.02, 1.35, 0);
    g.add(pwr);

    // 左侧 SIM 卡托
    const tray = new THREE.Mesh(T.roundedBox(0.05, 0.95, 0.30, 0.02, 0.008), M.frameDark);
    tray.rotation.y = Math.PI / 2;
    tray.position.set(-PW / 2 + 0.015, 4.6, 0);
    g.add(tray);

    // 底部 USB-C 开口
    const usb = new THREE.Mesh(T.rrPlane(0.92, 0.20, 0.10), M.glassBlack);
    usb.rotation.y = Math.PI / 2;
    usb.position.set(0, -PH / 2 + 0.008, 0);
    usb.rotation.z = Math.PI / 2;
    g.add(usb);

    // 顶部麦克风孔
    for (let i = 0; i < 3; i++) {
      const h = cylZ(0.028, 0.02, 12, M.rubber);
      h.rotation.set(Math.PI / 2, 0, Math.PI / 2);
      h.position.set(1.9 + i * 0.13, PH / 2 - 0.012, 0);
      g.add(h);
    }

    // 内部加强筋
    for (let i = 0; i < 4; i++) {
      g.add(box(0.06, 1.1, 0.16, M.frameDark, -PW / 2 + 0.24 + i * 0.12, -5.2 + i * 1.6, 0));
    }
    return g;
  }

  /* ==========================================================================
   *  4. 主板
   * ========================================================================*/
  function buildMainboard() {
    const g = new THREE.Group();
    const BW = 6.95, BH = 5.05, BY = 5.05;

    // PCB 本体（圆角 + 缺口）
    const pcbTex = T.texPCB();
    const pcb = T.roundedBox(BW, BH, 0.055, 0.22, 0.012);
    const pm = new THREE.Mesh(pcb, new THREE.MeshStandardMaterial({
      map: pcbTex, color: 0x8c99a8, metalness: 0.22, roughness: 0.74, envMapIntensity: 0.55,
    }));
    pm.position.set(0, BY, Z_MAIN);
    g.add(pm);

    // 屏蔽罩群
    g.add(shield(2.3, 1.35, 0.20, -2.0, BY + 1.65, Z_MAIN - 0.13));
    g.add(shield(1.6, 1.05, 0.18, 1.55, BY + 1.75, Z_MAIN - 0.12));
    g.add(shield(1.1, 0.85, 0.16, 2.55, BY + 0.35, Z_MAIN - 0.11));

    // 板对板连接器
    g.add(box(0.9, 0.22, 0.10, M.goldDeep, -0.6, BY - 2.05, Z_MAIN - 0.08));
    g.add(box(0.7, 0.18, 0.09, M.blackPlastic, 1.4, BY - 2.10, Z_MAIN - 0.08));

    // 电容电阻阵列
    const caps = new THREE.Group();
    for (let i = 0; i < 46; i++) {
      const cx = (Math.random() - 0.5) * (BW - 0.7);
      const cy = (Math.random() - 0.5) * (BH - 0.7);
      const w = 0.045 + Math.random() * 0.05;
      caps.add(box(w, w * 0.55, 0.022, Math.random() > 0.6 ? M.copperLight : M.gunmetal, cx, BY + cy, Z_MAIN - 0.038));
    }
    g.add(caps);

    // 射频同轴线
    for (let i = 0; i < 3; i++) {
      const c = new THREE.Mesh(new THREE.TorusGeometry(0.55 + i * 0.12, 0.016, 8, 40, Math.PI * 1.1), M.copper);
      c.position.set(-2.4 + i * 0.2, BY - 1.4, Z_MAIN - 0.05);
      g.add(c);
    }
    return g;
  }

  /* ==========================================================================
   *  5. 麒麟 9050 Pro
   * ========================================================================*/
  function buildSoC() {
    const g = new THREE.Group();
    const y = 5.05 + 1.62;
    // 封装基板
    g.add(box(1.62, 1.62, 0.05, M.pcb(0x1a3a2e), 0, y, Z_MAIN - 0.235));
    // 芯片本体
    const c = chip(1.36, 1.36, 0.13, 'KIRIN', '9050  PRO', '#26303f', Z_MAIN - 0.325);
    c.position.y = y;
    g.add(c);
    // 封装金线框
    const fr = new THREE.Mesh(T.rrRing(1.52, 1.52, 0.12, 0.04, 0.03), M.champagne);
    fr.position.set(0, y, Z_MAIN - 0.26);
    g.add(fr);
    return g;
  }

  /* ==========================================================================
   *  6. 内存与闪存
   * ========================================================================*/
  function buildMemory() {
    const g = new THREE.Group();
    const y = 5.05 + 1.72;
    const a = chip(1.18, 0.78, 0.09, 'LPDDR5X', '16 GB  ·  9600 MT/s', '#242b38', Z_MAIN - 0.24);
    a.position.set(2.05, y, Z_MAIN - 0.24);
    g.add(a);
    const b = chip(1.02, 0.70, 0.09, 'UFS 4.1', '1 TB  ·  SFS 2.0', '#242b38', Z_MAIN - 0.24);
    b.position.set(2.05, y - 0.95, Z_MAIN - 0.24);
    g.add(b);
    return g;
  }

  /* ==========================================================================
   *  7. 电池
   * ========================================================================*/
  function buildBattery() {
    const g = new THREE.Group();
    const BW = 6.40, BH = 9.10, BY = -2.30;

    // 电芯
    const shell = T.roundedBox(BW, BH, 0.17, 0.48, 0.03);
    const sm = new THREE.Mesh(shell, new THREE.MeshStandardMaterial({
      color: 0x9aa4b4, metalness: 0.85, roughness: 0.42, envMapIntensity: 0.9,
    }));
    sm.position.set(0, BY, Z_BATT);
    g.add(sm);

    // 标签面（朝后盖方向）
    const bt = T.texBattery();
    const lab = new THREE.Mesh(T.rrPlane(BW - 0.06, BH - 0.06, 0.46), new THREE.MeshStandardMaterial({
      map: bt, metalness: 0.2, roughness: 0.6, envMapIntensity: 0.7,
    }));
    lab.rotation.y = Math.PI;
    lab.position.set(0, BY, Z_BATT - 0.090);
    g.add(lab);

    // 正面标签（拆解后从正面也能读到电池参数）
    const lab2 = new THREE.Mesh(T.rrPlane(BW - 0.06, BH - 0.06, 0.46), new THREE.MeshStandardMaterial({
      map: bt, metalness: 0.2, roughness: 0.6, envMapIntensity: 0.7,
    }));
    lab2.position.set(0, BY, Z_BATT + 0.090);
    g.add(lab2);

    // 顶部 BMS 保护板
    g.add(box(BW * 0.92, 0.42, 0.10, M.pcb(0x123028), 0, BY + BH / 2 - 0.24, Z_BATT - 0.02));
    g.add(box(0.5, 0.18, 0.06, M.goldDeep, 0, BY + BH / 2 - 0.05, Z_BATT - 0.02));

    // 拉手胶带
    const tape = box(0.30, BH * 0.62, 0.012, M.rubber, BW / 2 - 0.42, BY - 0.6, Z_BATT - 0.10);
    g.add(tape);

    // 极耳
    g.add(box(0.14, 0.30, 0.06, M.copper, -0.9, BY + BH / 2 - 0.02, Z_BATT));
    g.add(box(0.14, 0.30, 0.06, M.copper, 0.9, BY + BH / 2 - 0.02, Z_BATT));
    return g;
  }

  /* ==========================================================================
   *  8. VC 均热板
   * ========================================================================*/
  function buildVC() {
    const g = new THREE.Group();
    const vw = 5.6, vh = 7.4;
    const vct = T.texVC();
    const plate = new THREE.Mesh(T.roundedBox(vw, vh, 0.05, 0.6, 0.012), new THREE.MeshStandardMaterial({
      map: vct, color: 0xffffff, metalness: 0.95, roughness: 0.30, envMapIntensity: 1.5,
    }));
    plate.position.set(0, 1.1, Z_VC);
    g.add(plate);

    // 铜热管延伸到主板
    const pipe = new THREE.Mesh(new THREE.CylinderGeometry(0.10, 0.10, 2.4, 16), M.copper);
    pipe.position.set(-2.2, 5.0, Z_VC + 0.02);
    pipe.rotation.z = -0.12;
    g.add(pipe);

    const pipe2 = new THREE.Mesh(new THREE.CylinderGeometry(0.085, 0.085, 2.0, 16), M.copper);
    pipe2.position.set(2.2, 4.9, Z_VC + 0.02);
    pipe2.rotation.z = 0.10;
    g.add(pipe2);

    // 导热硅脂块
    g.add(box(1.5, 1.5, 0.06, T.mat.plastic(0x8a8f99, 0.85), 0, 5.05 + 1.6, Z_VC - 0.03));
    return g;
  }

  /* ==========================================================================
   *  9. 石墨烯散热膜
   * ========================================================================*/
  function buildGraphite() {
    const g = new THREE.Group();
    const gt = T.texGraphite();
    const film = new THREE.Mesh(T.rrPlane(6.6, 11.4, 0.9), new THREE.MeshStandardMaterial({
      map: gt, color: 0xffffff, metalness: 0.55, roughness: 0.62, envMapIntensity: 0.8,
      side: THREE.DoubleSide,
    }));
    film.rotation.y = Math.PI;
    film.position.set(0, -0.4, Z_GRAPH);
    g.add(film);

    // 边缘铜箔包边
    const edge = new THREE.Mesh(T.rrRing(6.66, 11.46, 0.9, 0.05, 0.012), M.copper);
    edge.position.set(0, -0.4, Z_GRAPH - 0.004);
    g.add(edge);
    return g;
  }

  /* ==========================================================================
   *  10. 无线充电线圈 + NFC
   * ========================================================================*/
  function buildCoil() {
    const g = new THREE.Group();
    const cy = -2.30;

    // 基材
    const base = new THREE.Mesh(T.rrPlane(4.9, 4.9, 2.2), T.mat.plastic(0x2a2320, 0.75));
    base.rotation.y = Math.PI;
    base.position.set(0, cy, Z_COIL + 0.008);
    g.add(base);

    // 线圈（同心环）
    const N = 11;
    for (let i = 0; i < N; i++) {
      const r = 0.72 + i * 0.145;
      const ring = torusZ(r, 0.026, M.copper, 72);
      ring.position.set(0, cy, Z_COIL);
      g.add(ring);
    }
    // 线圈引出脚
    g.add(box(0.9, 0.05, 0.02, M.copperLight, 0, cy - 2.28, Z_COIL));

    // 隔磁片
    const shieldSheet = new THREE.Mesh(T.rrPlane(5.2, 5.2, 2.4), T.mat.metal(0x2b2f38, 0.55, 0.9));
    shieldSheet.rotation.y = Math.PI;
    shieldSheet.position.set(0, cy, Z_COIL + 0.018);
    g.add(shieldSheet);

    // NFC 天线（外圈方环）
    const nfc = new THREE.Mesh(T.rrRing(6.3, 6.3, 1.0, 0.055, 0.014), M.copper);
    nfc.position.set(0, cy - 0.1, Z_COIL + 0.02);
    g.add(nfc);
    return g;
  }

  /* ==========================================================================
   *  11. 后盖（素皮 / 陶瓷）
   * ========================================================================*/
  function buildBackCover() {
    const g = new THREE.Group();

    // 壳体（深色素皮基体，不贴图，避免背面镜像）
    const shell = new THREE.Mesh(T.roundedBox(PW - 0.03, PH - 0.03, 0.055, PR - 0.01, 0.018),
      new THREE.MeshStandardMaterial({
        color: 0x1c1f27, metalness: 0.30, roughness: 0.62, envMapIntensity: 0.9,
      }));
    shell.position.z = Z_BACK + 0.012;
    g.add(shell);

    // 外表面装饰层（朝 -Z，rotation.y=π 使文字正向可读）
    const bt = T.texBackPanel();
    const panel = new THREE.Mesh(T.rrPlane(PW - 0.06, PH - 0.06, PR - 0.02),
      new THREE.MeshStandardMaterial({
        map: bt, color: 0xffffff, metalness: 0.28, roughness: 0.58, envMapIntensity: 1.0,
        side: THREE.DoubleSide,
      }));
    panel.rotation.y = Math.PI;
    panel.position.z = Z_BACK - 0.022;
    g.add(panel);

    // 内衬（朝 +Z 的内侧，拆解后可看到）
    const lt = T.texLeather('#191b22');
    const leather = new THREE.Mesh(T.rrPlane(PW - 0.20, PH - 0.20, PR - 0.06),
      new THREE.MeshStandardMaterial({
        map: lt, color: 0xffffff, metalness: 0.08, roughness: 0.86, envMapIntensity: 0.7,
        side: THREE.DoubleSide,
      }));
    leather.position.z = Z_BACK + 0.050;
    g.add(leather);

    // 金色包边
    const trim = new THREE.Mesh(T.rrRing(PW - 0.05, PH - 0.05, PR - 0.02, 0.028, 0.024), M.champagne);
    trim.position.z = Z_BACK + 0.03;
    g.add(trim);

    // 相机开孔（挖不了洞，用一圈深色台阶模拟）
    const holeRim = torusZ(ISL_R + 0.06, 0.045, M.goldDeep, 80);
    holeRim.position.set(0, ISL_Y, Z_BACK + 0.02);
    g.add(holeRim);

    return g;
  }

  /* ==========================================================================
   *  12. 星环影像模组（基座）
   * ========================================================================*/
  function buildCameraIsland() {
    const g = new THREE.Group();

    // 基座圆台
    const base = cylZ(ISL_R, 0.30, 96, M.blackMetal);
    base.position.set(0, ISL_Y, Z_BACK - 0.13);
    g.add(base);

    // 顶面装饰盘
    const ct = T.texCameraIsland();
    const face = new THREE.Mesh(new THREE.CircleGeometry(ISL_R - 0.02, 96), new THREE.MeshStandardMaterial({
      map: ct, metalness: 0.55, roughness: 0.35, envMapIntensity: 1.2,
    }));
    face.rotation.y = Math.PI;
    face.position.set(0, ISL_Y, Z_BACK - 0.281);
    g.add(face);

    // 香槟金外环
    const ring = torusZ(ISL_R - 0.035, 0.075, M.champagne, 96);
    ring.position.set(0, ISL_Y, Z_BACK - 0.26);
    g.add(ring);

    // 内凹台阶环
    const step = new THREE.Mesh(new THREE.RingGeometry(ISL_R - 0.62, ISL_R - 0.16, 96), M.blackMetal);
    step.rotation.y = Math.PI;
    step.position.set(0, ISL_Y, Z_BACK - 0.285);
    g.add(step);

    // XMAGE 铭牌
    const badge = box(0.62, 0.16, 0.012, M.champagne, 0, ISL_Y - ISL_R + 0.16, Z_BACK - 0.30);
    g.add(badge);

    // 模组排线
    g.add(box(0.9, 0.06, 0.012, M.copperLight, 0, ISL_Y - ISL_R - 0.3, Z_BACK - 0.16));

    // 闪光灯
    const flash = cylZ(0.17, 0.06, 24, M.flash);
    flash.position.set(0, ISL_Y, Z_BACK - 0.32);
    g.add(flash);
    const flashRing = torusZ(0.20, 0.022, M.champagne, 32);
    flashRing.position.set(0, ISL_Y, Z_BACK - 0.31);
    g.add(flashRing);
    return g;
  }

  /* 相机镜头通用 */
  function lensPart(x, y, r, depth, glassMat) {
    const g = new THREE.Group();
    const l = makeLens(r, depth, glassMat, true);
    l.position.set(0, 0, 0);
    g.add(l);
    // 镜头组必须凸出星环顶面（Z_BACK-0.281）之外，否则金圈会被基座圆盘挡住
    g.position.set(x, ISL_Y + y, Z_BACK - 0.315);
    return g;
  }

  /* ==========================================================================
   *  13. 副板（USB-C / 卡槽 / 射频）
   * ========================================================================*/
  function buildSubboard() {
    const g = new THREE.Group();
    const BY = -7.05;
    const st = T.texSubPCB();
    const pcb = new THREE.Mesh(T.roundedBox(5.4, 1.15, 0.05, 0.16, 0.01), new THREE.MeshStandardMaterial({
      map: st, metalness: 0.25, roughness: 0.68, envMapIntensity: 0.65,
    }));
    pcb.position.set(0, BY, Z_MAIN);
    g.add(pcb);

    // USB-C 母座
    g.add(box(0.95, 0.34, 0.20, M.silver, 0, BY - 0.46, Z_MAIN - 0.06));
    g.add(box(0.72, 0.20, 0.10, M.rubber, 0, BY - 0.50, Z_MAIN - 0.06));

    // 屏蔽罩
    g.add(shield(1.2, 0.6, 0.14, -1.8, BY + 0.2, Z_MAIN - 0.10));
    g.add(shield(0.9, 0.5, 0.12, 1.9, BY + 0.22, Z_MAIN - 0.09));

    // 天线弹片
    for (let i = 0; i < 4; i++) {
      g.add(box(0.16, 0.10, 0.10, M.copper, -2.4 + i * 1.6, BY + 0.48, Z_MAIN - 0.04));
    }
    return g;
  }

  /* ==========================================================================
   *  14. 扬声器
   * ========================================================================*/
  function buildSpeaker() {
    const g = new THREE.Group();
    const y = -6.55;
    // 扬声器本体（金属腔体）
    g.add(box(2.05, 1.05, 0.26, M.gunmetal, 1.85, y, Z_MAIN - 0.14));
    // 音腔盖板
    g.add(box(1.88, 0.90, 0.05, M.blackPlastic, 1.85, y, Z_MAIN - 0.28));
    // 出声孔（朝机身外侧）
    for (let i = 0; i < 7; i++) {
      const h = cylZ(0.032, 0.02, 12, M.rubber);
      h.position.set(1.05 + i * 0.26, y - 0.34, Z_MAIN - 0.02);
      g.add(h);
    }
    // 振膜装饰环
    const dm = torusZ(0.30, 0.03, M.champagne, 40);
    dm.position.set(1.85, y, Z_MAIN - 0.31);
    g.add(dm);
    // 触点
    g.add(box(0.5, 0.10, 0.05, M.champagne, 1.85, y + 0.58, Z_MAIN - 0.16));
    return g;
  }

  /* ==========================================================================
   *  15. 线性马达
   * ========================================================================*/
  function buildMotor() {
    const g = new THREE.Group();
    const x = -2.25, y = -5.55;
    // 外壳
    g.add(box(0.86, 1.30, 0.30, M.gunmetal, x, y, Z_MAIN - 0.15));
    // 香槟金端面
    g.add(box(0.76, 1.18, 0.05, M.champagne, x, y, Z_MAIN - 0.31));
    // 铭文条
    g.add(box(0.58, 0.05, 0.02, M.blackPlastic, x, y + 0.32, Z_MAIN - 0.34));
    g.add(box(0.58, 0.05, 0.02, M.blackPlastic, x, y - 0.32, Z_MAIN - 0.34));
    // 配重块
    g.add(box(0.34, 0.88, 0.08, M.silver, x, y, Z_MAIN - 0.26));
    return g;
  }

  /* ==========================================================================
   *  组装
   * ========================================================================*/
  T.buildModel = function () {
    mats();
    const root = new THREE.Group();
    const phone = new THREE.Group();
    root.add(phone);

    function add(o, builder) {
      const g = builder();
      g.traverse(function (c) {
        if (c.isMesh) {
          c.userData.partId = o.id;
          c.castShadow = false;
          c.receiveShadow = false;
        }
      });
      phone.add(g);
      o.mesh = g;
      P(o);
      return o;
    }

    add({
      id: 'screen', name: '屏幕总成', en: 'DISPLAY ASSEMBLY', group: '外观结构', order: 1,
      explode: new THREE.Vector3(0, 0, 5.6),
      spec: [
        '6.9 英寸 双层 OLED 串联屏',
        '2832 × 1316 分辨率 · 460 ppi',
        '1–120 Hz LTPO 自适应刷新率',
        '峰值亮度 3500 nits',
        '第二代玄武钢化昆仑玻璃',
      ],
      desc: '双层串联 OLED 结构，将发光层数量翻倍以提升亮度与寿命；覆盖第二代玄武钢化昆仑玻璃，抗摔能力提升 3 倍，抗刮能力提升 16 倍。',
    }, buildScreen);

    add({
      id: 'front_cam', name: '前置影像模组', en: 'FRONT CAMERA', group: '影像系统', order: 2,
      explode: new THREE.Vector3(0, 1.0, 4.2),
      spec: ['1300 万像素超广角前摄', 'f/2.4 · 支持自动对焦', '3D 深感摄像头', '屏下隐藏式设计'],
      desc: '三挖孔前置影像系统，主前摄支持超广角合影与自动对焦，配合 3D 深感镜头实现金融级人脸解锁。',
    }, buildFrontCam);

    add({
      id: 'midframe', name: '玄武中框', en: 'TITANIUM MIDFRAME', group: '外观结构', order: 3,
      explode: new THREE.Vector3(0, 0, 0.5),
      spec: ['航空级钛合金一体成型', '重量 218 g', 'IP68 / IP69 防尘抗水', '机身厚度 8.6 mm'],
      desc: '钛合金中框经 CNC 一体成型与微弧氧化处理，兼顾强度与握持手感；内部集成天线断点与导热通道。',
    }, buildMidframe);

    add({
      id: 'mainboard', name: '主板', en: 'MAINBOARD', group: '核心计算', order: 4,
      explode: new THREE.Vector3(0.5, 0.8, -1.5),
      spec: ['12 层任意层 HDI 板', '板对板连接器 × 6', '集成射频 / 电源管理', '面积较上代缩小 12%'],
      desc: '12 层任意层互联 HDI 主板，把 SoC、内存、电源管理与射频前端高密度集成，为电池让出更多空间。',
    }, buildMainboard);

    add({
      id: 'soc', name: '麒麟 9050 Pro', en: 'KIRIN 9050 PRO', group: '核心计算', order: 5,
      explode: new THREE.Vector3(2.7, 1.7, -2.5),
      spec: ['3 nm 制程工艺', '8 核 CPU（2+4+2）', 'Maleoon 930 GPU', 'NPU 算力 45 TOPS'],
      desc: '麒麟 9050 Pro 采用 3nm 工艺，CPU 超大核主频 3.6GHz，自研 Maleoon 930 GPU 支持硬件光追，端侧 AI 算力达 45 TOPS。',
    }, buildSoC);

    add({
      id: 'memory', name: '内存与闪存', en: 'RAM & STORAGE', group: '核心计算', order: 6,
      explode: new THREE.Vector3(3.5, 2.5, -2.5),
      spec: ['16 GB LPDDR5X · 9600 MT/s', '1 TB UFS 4.1 闪存', 'SFS 2.0 超级文件系统', '顺序读取 4200 MB/s'],
      desc: '16GB LPDDR5X 内存与 1TB UFS 4.1 闪存堆叠封装，配合 SFS 2.0 超级文件系统，随机读写性能提升 40%。',
    }, buildMemory);

    add({
      id: 'battery', name: '电池', en: 'BATTERY', group: '能源散热', order: 7,
      explode: new THREE.Vector3(0, 0, -3.3),
      spec: ['6800 mAh 硅碳负极高密度电芯', '100 W 有线超级快充', '80 W 无线超级快充', '26.3 Wh 额定能量'],
      desc: '6800mAh 硅碳负极高密度电芯，能量密度提升至 780Wh/L；支持 100W 有线与 80W 无线超级快充，19 分钟充至 80%。',
    }, buildBattery);

    add({
      id: 'vc', name: 'VC 均热板', en: 'VAPOR CHAMBER', group: '能源散热', order: 8,
      explode: new THREE.Vector3(0, 0, -4.3),
      spec: ['5000 mm² 超大面积', '厚度仅 0.35 mm', '等效导热系数 12000 W/m·K', '覆盖 SoC 与电池双热源'],
      desc: '超薄 VC 均热板通过相变传热快速摊平 SoC 热点，配合石墨烯膜形成立体散热通道，重载游戏机身温度下降 6℃。',
    }, buildVC);

    add({
      id: 'graphite', name: '石墨烯散热膜', en: 'GRAPHENE FILM', group: '能源散热', order: 9,
      explode: new THREE.Vector3(0, 0, -5.3),
      spec: ['多层石墨烯叠层', '面内导热 1800 W/m·K', '覆盖面积 92%', '厚度 0.05 mm'],
      desc: '多层石墨烯散热膜将热量沿机身平面快速扩散，避免局部过热，同时起到电磁屏蔽作用。',
    }, buildGraphite);

    add({
      id: 'coil', name: '无线充电线圈', en: 'WIRELESS COIL', group: '能源散热', order: 10,
      explode: new THREE.Vector3(0, 0, -6.3),
      spec: ['80 W 无线超级快充', '双线圈设计 · 横竖皆可充', '集成 NFC 天线', '纳米晶隔磁片'],
      desc: '双线圈布局支持横竖放置充电，纳米晶隔磁片提升耦合效率并抑制涡流发热；外圈集成 NFC 天线。',
    }, buildCoil);

    add({
      id: 'back_cover', name: '素皮后盖', en: 'BACK COVER', group: '外观结构', order: 11,
      explode: new THREE.Vector3(0, 0, -7.9),
      spec: ['超轻素皮材质', '纳米级微晶镀膜', '香槟金包边工艺', '典藏版专属铭刻'],
      desc: '典藏版采用超轻素皮后盖，表面纳米微晶镀膜带来细腻哑光质感，边缘以香槟金包边收口，底部镌刻 HUAWEI 与 ULTIMATE DESIGN 标识。',
    }, buildBackCover);

    add({
      id: 'camera_island', name: '星环影像模组', en: 'STAR RING MODULE', group: '影像系统', order: 12,
      explode: new THREE.Vector3(0, 1.5, -8.9),
      spec: ['星环对称设计', '一体化金属基座', 'XMAGE 影像标识', '四摄 + 闪光灯布局'],
      desc: '标志性星环影像模组，以香槟金环包裹四颗镜头，对称排布带来极高辨识度；基座与中框同材质一体成型。',
    }, buildCameraIsland);

    add({
      id: 'main_cam', name: '超聚光主摄', en: 'ULTRA LIGHT CAMERA', group: '影像系统', order: 13,
      explode: new THREE.Vector3(-2.5, 2.0, -10.3),
      spec: ['5000 万像素 1 英寸大底', 'f/1.4–4.0 可变光圈', 'OIS 光学防抖', 'RYYB 超感光滤色阵列'],
      desc: '1 英寸超大底传感器配合 f/1.4 可变光圈，进光量提升 40%；RYYB 滤色阵列让暗光成片更纯净。',
    }, function () { return lensPart(-1.02, 1.02, 0.80, 0.30, M.lensGlass); });

    add({
      id: 'ultrawide', name: '超广角镜头', en: 'ULTRA WIDE', group: '影像系统', order: 14,
      explode: new THREE.Vector3(2.5, 2.0, -10.3),
      spec: ['4000 万像素超广角', 'f/2.2 · 120° 视场角', '2.5 cm 微距对焦', '自由曲面镜片'],
      desc: '4000 万像素超广角镜头支持 120° 大视野与 2.5cm 微距，自由曲面镜片有效抑制边缘畸变。',
    }, function () { return lensPart(1.02, 1.02, 0.62, 0.26, M.lensGlass2); });

    add({
      id: 'periscope', name: '潜望长焦', en: 'PERISCOPE TELE', group: '影像系统', order: 15,
      explode: new THREE.Vector3(-2.5, -2.0, -10.3),
      spec: ['5000 万像素潜望长焦', 'f/2.1 · 等效 96 mm', '5 倍光学 / 100 倍数码变焦', 'OIS + 传感器位移防抖'],
      desc: '潜望式光路折叠设计，在 8.6mm 机身内实现 5 倍光学变焦；传感器位移防抖让长焦端成片率提升 60%。',
    }, function () { return lensPart(-1.02, -1.02, 0.66, 0.28, M.lensGlass); });

    add({
      id: 'sensor_red', name: '红枫原色摄像头', en: 'TRUE CHROMA SENSOR', group: '影像系统', order: 16,
      explode: new THREE.Vector3(2.5, -2.0, -10.3),
      spec: ['150 万像素多光谱通道', '9 通道光谱采集', '色彩还原准确度提升 120%', '辅助主摄白平衡校准'],
      desc: '红枫原色摄像头采集 9 个光谱通道，实时校准主摄白平衡与色彩，让人像肤色还原更接近肉眼所见。',
    }, function () { return lensPart(1.02, -1.02, 0.50, 0.22, M.lensGlass2); });

    add({
      id: 'subboard', name: '副板', en: 'SUB BOARD', group: '其他', order: 17,
      explode: new THREE.Vector3(2.0, -2.6, -1.9),
      spec: ['USB-C 3.2 Gen 2 接口', '支持 100W 快充输入', '集成天线弹片与音频电路', 'SIM 卡座'],
      desc: '副板承载 USB-C 接口、SIM 卡座与天线馈点，通过板对板连接器与主板互联。',
    }, buildSubboard);

    add({
      id: 'speaker', name: '扬声器', en: 'SPEAKER', group: '其他', order: 18,
      explode: new THREE.Vector3(3.0, -3.4, -2.3),
      spec: ['超线性双扬声器', '响度提升 30%', '支持空间音频', '独立音腔设计'],
      desc: '底部超线性扬声器与顶部听筒组成立体声，独立音腔带来更饱满的低频表现。',
    }, buildSpeaker);

    add({
      id: 'motor', name: 'X 轴线性马达', en: 'LINEAR MOTOR', group: '其他', order: 19,
      explode: new THREE.Vector3(-3.0, -2.9, -1.7),
      spec: ['X 轴线性马达', '振动量提升 45%', '支持 200+ 种触感反馈', '超薄 0.34 mm 振子'],
      desc: 'X 轴线性马达提供干脆利落的触感反馈，配合系统级调校可模拟机械按键与游戏手柄的细腻振感。',
    }, buildMotor);

    // 记录初始状态
    parts.forEach(function (p) {
      p.base = p.mesh.position.clone();
      p.baseQuat = p.mesh.quaternion.clone();
    });

    T.parts = parts;
    T.phone = phone;
    return { root: root, phone: phone, parts: parts };
  };
})();
