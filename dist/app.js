/* ============================================================================
 *  app.js — 场景 / 交互 / 拆解动画 / UI
 * ==========================================================================*/
(function () {
  'use strict';
  const T = window.T;
  const clamp = T.clamp, lerp = T.lerp, damp = T.damp;
  const $ = (s, r) => (r || document).querySelector(s);
  const $$ = (s, r) => Array.prototype.slice.call((r || document).querySelectorAll(s));

  /* ==========================================================================
   *  0. DOM
   * ========================================================================*/
  const canvas = $('#scene');
  const elList = $('#partList');
  const elFilter = $('#railFilter');
  const elCount = $('#partCount');
  const elRail = $('#rail');
  const elCard = $('#card');
  const elLabels = $('#labels');
  const elLeaders = $('#leaders');
  const elDock = $('#dock');
  const elGuide = $('#guide');
  const elLoading = $('#loading');
  const elToast = $('#toast');

  /* 部件短参数（标注用） */
  const SHORT = {
    screen: '6.9″ 双层 OLED',
    front_cam: '13MP 超广角',
    midframe: '钛合金 8.6mm',
    mainboard: '12 层 HDI',
    soc: '3nm · 8 核',
    memory: '16GB + 1TB',
    battery: '6800mAh 100W',
    vc: '5000mm² VC',
    graphite: '1800 W/m·K',
    coil: '80W 无线',
    back_cover: '素皮典藏',
    camera_island: '星环四摄',
    main_cam: '50MP 可变光圈',
    ultrawide: '40MP 超广角',
    periscope: '48MP 潜望 10×',
    sensor_red: '9 通道光谱',
    subboard: 'USB-C 3.2',
    speaker: '超线性双扬',
    motor: 'X 轴马达',
  };

  /* ==========================================================================
   *  1. 渲染器 / 场景 / 相机
   * ========================================================================*/
  const renderer = new THREE.WebGLRenderer({
    canvas: canvas,
    antialias: true,
    alpha: false,
    powerPreference: 'high-performance',
  });
  renderer.setClearColor(0x05070c, 1);
  renderer.setPixelRatio(Math.min(window.devicePixelRatio || 1, 2));
  renderer.outputColorSpace = THREE.SRGBColorSpace;
  renderer.toneMapping = THREE.ACESFilmicToneMapping;
  renderer.toneMappingExposure = 1.02;

  const scene = new THREE.Scene();
  scene.fog = new THREE.FogExp2(0x05070c, 0.0062);

  const camera = new THREE.PerspectiveCamera(34, 1, 0.4, 500);
  camera.position.set(0, 0, 44);

  /* ==========================================================================
   *  2. 程序化环境贴图（PMREM）
   * ========================================================================*/
  function buildEnv() {
    const W = 1024, H = 512;
    const c = document.createElement('canvas');
    c.width = W; c.height = H;
    const x = c.getContext('2d');

    // 底色：上暗下亮
    const g0 = x.createLinearGradient(0, 0, 0, H);
    g0.addColorStop(0.00, '#05070c');
    g0.addColorStop(0.32, '#0d1626');
    g0.addColorStop(0.50, '#1a2740');
    g0.addColorStop(0.62, '#101a2b');
    g0.addColorStop(1.00, '#04060a');
    x.fillStyle = g0;
    x.fillRect(0, 0, W, H);

    // 左主光（冷白，大面）
    let g = x.createRadialGradient(W * 0.18, H * 0.46, 10, W * 0.18, H * 0.46, W * 0.34);
    g.addColorStop(0, 'rgba(226,240,255,0.95)');
    g.addColorStop(0.25, 'rgba(170,205,255,0.45)');
    g.addColorStop(1, 'rgba(120,170,255,0)');
    x.fillStyle = g;
    x.fillRect(0, 0, W, H);

    // 右暖光（香槟金）
    g = x.createRadialGradient(W * 0.80, H * 0.42, 6, W * 0.80, H * 0.42, W * 0.26);
    g.addColorStop(0, 'rgba(255,232,190,0.85)');
    g.addColorStop(0.3, 'rgba(226,180,110,0.32)');
    g.addColorStop(1, 'rgba(200,150,80,0)');
    x.fillStyle = g;
    x.fillRect(0, 0, W, H);

    // 顶部灯带
    g = x.createLinearGradient(0, 0, 0, H * 0.22);
    g.addColorStop(0, 'rgba(255,255,255,0.55)');
    g.addColorStop(1, 'rgba(255,255,255,0)');
    x.fillStyle = g;
    x.fillRect(0, 0, W, H * 0.22);

    // 顶部环形柔光箱
    g = x.createRadialGradient(W * 0.5, H * 0.06, 8, W * 0.5, H * 0.06, W * 0.3);
    g.addColorStop(0, 'rgba(255,255,255,0.9)');
    g.addColorStop(0.4, 'rgba(200,225,255,0.25)');
    g.addColorStop(1, 'rgba(150,190,255,0)');
    x.fillStyle = g;
    x.fillRect(0, 0, W, H);

    // 底部反光带（冷色）
    g = x.createLinearGradient(0, H * 0.72, 0, H);
    g.addColorStop(0, 'rgba(60,120,190,0)');
    g.addColorStop(0.6, 'rgba(70,130,200,0.22)');
    g.addColorStop(1, 'rgba(120,180,240,0.30)');
    x.fillStyle = g;
    x.fillRect(0, 0, W, H);

    // 细长灯条（营造金属拉丝高光）
    for (let i = 0; i < 5; i++) {
      const bx = W * (0.06 + i * 0.045);
      const bw = W * (0.006 + Math.random() * 0.012);
      const gg = x.createLinearGradient(bx, 0, bx + bw, 0);
      gg.addColorStop(0, 'rgba(255,255,255,0)');
      gg.addColorStop(0.5, 'rgba(255,255,255,0.5)');
      gg.addColorStop(1, 'rgba(255,255,255,0)');
      x.fillStyle = gg;
      x.fillRect(bx, H * 0.18, bw, H * 0.5);
    }

    const tex = new THREE.CanvasTexture(c);
    tex.mapping = THREE.EquirectangularReflectionMapping;
    tex.colorSpace = THREE.SRGBColorSpace;
    const pmrem = new THREE.PMREMGenerator(renderer);
    pmrem.compileEquirectangularShader();
    const rt = pmrem.fromEquirectangular(tex);
    scene.environment = rt.texture;
    tex.dispose();
    pmrem.dispose();
  }

  /* ==========================================================================
   *  3. 灯光
   * ========================================================================*/
  function buildLights() {
    const key = new THREE.DirectionalLight(0xfff2df, 3.4);
    key.position.set(14, 18, 20);
    scene.add(key);

    const fill = new THREE.DirectionalLight(0x9dc0ff, 1.9);
    fill.position.set(-18, 6, 12);
    scene.add(fill);

    const rim = new THREE.DirectionalLight(0xffd39a, 2.6);
    rim.position.set(-8, -6, -22);
    scene.add(rim);

    const top = new THREE.DirectionalLight(0xffffff, 1.5);
    top.position.set(0, 26, 4);
    scene.add(top);

    const front = new THREE.DirectionalLight(0xcfe0ff, 1.15);
    front.position.set(2, 2, 28);
    scene.add(front);

    const back = new THREE.DirectionalLight(0x6ea8ff, 1.2);
    back.position.set(6, 4, -26);
    scene.add(back);

    scene.add(new THREE.AmbientLight(0x6b7d99, 1.25));
    scene.add(new THREE.HemisphereLight(0xbfd8ff, 0x0a0e16, 0.75));
  }

  /* ==========================================================================
   *  4. 舞台（地面光晕 + 旋转刻度环）
   * ========================================================================*/
  const stage = new THREE.Group();
  const stageSpin = new THREE.Group();
  function buildStage() {
    // 地面柔光
    const glowTex = T.texGlow();
    const glow = new THREE.Mesh(
      new THREE.PlaneGeometry(52, 52),
      new THREE.MeshBasicMaterial({
        map: glowTex, color: 0x2f5f9e, transparent: true, opacity: 0.55,
        blending: THREE.AdditiveBlending, depthWrite: false,
      })
    );
    glow.rotation.x = -Math.PI / 2;
    glow.position.y = -10.4;
    glow.userData.skipRaster = true;
    stage.add(glow);

    // 刻度环
    const tickMat = new THREE.MeshBasicMaterial({
      color: 0x6ea8d8, transparent: true, opacity: 0.28,
      blending: THREE.AdditiveBlending, depthWrite: false,
    });
    const N = 96;
    for (let i = 0; i < N; i++) {
      const a = (i / N) * Math.PI * 2;
      const long = i % 8 === 0;
      const r = 13.6;
      const t = new THREE.Mesh(
        new THREE.PlaneGeometry(long ? 0.055 : 0.03, long ? 0.62 : 0.3),
        tickMat
      );
      t.position.set(Math.cos(a) * r, 0, Math.sin(a) * r);
      t.rotation.x = -Math.PI / 2;
      t.rotation.z = -a + Math.PI / 2;
      stageSpin.add(t);
    }

    // 两道细环
    [11.4, 14.2].forEach(function (rr, i) {
      const ring = new THREE.Mesh(
        new THREE.RingGeometry(rr, rr + (i === 0 ? 0.018 : 0.012), 128),
        new THREE.MeshBasicMaterial({
          color: i === 0 ? 0xc9a86a : 0x5ecbff,
          transparent: true, opacity: i === 0 ? 0.34 : 0.18,
          blending: THREE.AdditiveBlending, depthWrite: false, side: THREE.DoubleSide,
        })
      );
      ring.rotation.x = -Math.PI / 2;
      stageSpin.add(ring);
    });

    stageSpin.position.y = -10.4;
    stage.add(stageSpin);
    scene.add(stage);
  }

  /* ==========================================================================
   *  5. 模型
   * ========================================================================*/
  let MODEL = null;
  let parts = [];

  function buildModel() {
    MODEL = T.buildModel();
    scene.add(MODEL.root);
    parts = MODEL.parts;
    parts.sort(function (a, b) { return a.order - b.order; });

    const n = parts.length;
    const bb = new THREE.Box3();
    parts.forEach(function (p, i) {
      p.mesh.updateMatrixWorld(true);
      bb.setFromObject(p.mesh);
      // anchor 存「局部中心」：扣掉当前世界位置，之后用 anchor + mesh.position
      // 才能同时适配静止态与拆解态（否则会把初始位置叠加两遍）
      p.anchor = bb.getCenter(new THREE.Vector3()).sub(p.mesh.position);
      p.center0 = p.anchor.clone();
      p.delay = n > 1 ? i / (n - 1) : 0;
      p.dim = 0;          // 当前暗化值
      p.glow = 0;         // 当前发光值
      p.mats = [];        // 该部件独立材质列表
      // 光晕尺寸按部件包围盒自适应：小件（芯片/镜头）别被糊成一个大光斑
      const bs = bb.getSize(new THREE.Vector3());
      p.glowSize = clamp(Math.max(bs.x, bs.y, bs.z) * 1.55, 1.6, 9.0);
    });

    // 每个部件克隆独立材质（便于单独高亮/暗化，不影响其它部件）
    parts.forEach(function (p) {
      const seen = new Map();
      p.mesh.traverse(function (o) {
        if (!o.isMesh || !o.material) return;
        const arr = Array.isArray(o.material) ? o.material : [o.material];
        const out = arr.map(function (m) {
          let cl = seen.get(m.uuid);
          if (!cl) {
            cl = m.clone();
            cl.userData.baseColor = cl.color ? cl.color.clone() : null;
            cl.userData.baseEmissive = cl.emissive ? cl.emissive.clone() : null;
            cl.userData.baseEI = cl.emissiveIntensity;
            cl.userData.baseRough = cl.roughness;
            cl.userData.baseOpacity = cl.opacity;
            cl.userData.baseTransparent = cl.transparent;
            cl.userData.baseDepthWrite = cl.depthWrite;
            seen.set(m.uuid, cl);
            p.mats.push(cl);
          }
          return cl;
        });
        o.material = Array.isArray(o.material) ? out : out[0];
      });
    });
  }

  /* 选中光晕 sprite */
  let glowSprite = null;
  function buildGlowSprite() {
    const mat = new THREE.SpriteMaterial({
      map: T.texGlow(),
      color: 0xf0d9a8,
      transparent: true,
      opacity: 0,
      blending: THREE.AdditiveBlending,
      depthWrite: false,
      depthTest: false,
    });
    glowSprite = new THREE.Sprite(mat);
    glowSprite.scale.set(7, 7, 1);
    glowSprite.renderOrder = 5;
    scene.add(glowSprite);
  }

  /* ==========================================================================
   *  6. 轨道控制
   * ========================================================================*/
  const HOME = { r: 40, th: 0.52, ph: 1.26, tx: 0, ty: 0, tz: 0 };

  const orbit = {
    cur: { r: HOME.r, th: HOME.th, ph: HOME.ph, tx: 0, ty: 0, tz: 0 },
    des: { r: HOME.r, th: HOME.th, ph: HOME.ph, tx: 0, ty: 0, tz: 0 },
    target: new THREE.Vector3(0, 0, 0),
    minR: 12,
    maxR: 130,
    autoRotate: false,
    autoSpeed: 0.055,
    autoFit: true,
    zoom: 1,
    idle: 0,
    dragging: false,
  };

  const VIEWS = {
    iso:   { th: 0.52, ph: 1.26 },
    front: { th: 0.0,  ph: Math.PI / 2 },
    back:  { th: Math.PI, ph: Math.PI / 2 },
    /* 侧视稍微抬一点俯角、并带一点方位偏转，否则手机侧看只是一条竖线 */
    side:  { th: Math.PI / 2 - 0.16, ph: 1.36 },
    top:   { th: 0.0,  ph: 0.30 },
  };

  /* ==========================================================================
   *  7. 尺寸自适应
   * ========================================================================*/
  let VW = 1, VH = 1;

  function resize() {
    VW = window.innerWidth;
    VH = window.innerHeight;
    renderer.setSize(VW, VH, false);
    camera.aspect = VW / VH;
    camera.updateProjectionMatrix();
    elLeaders.setAttribute('viewBox', '0 0 ' + VW + ' ' + VH);
    elLeaders.setAttribute('width', VW);
    elLeaders.setAttribute('height', VH);
    // 断点变化时字号会变，清掉标签尺寸缓存让下次重新量
    for (let i = 0; i < labelEls.length; i++) { labelEls[i].w = 0; labelEls[i].h = 0; }
  }

  /* 计算"刚好容纳整机"的相机距离
     系数由实测投影反推：t=0 时屏幕高 ≈ 27160/r、宽 ≈ 12900/r；
     拆解后（t=1）高 ≈ 39160/r、宽 ≈ 30000/r。 */
  function fitRadius(t) {
    t = clamp(t, 0, 1);
    // 由 probe_bbox 实测投影反推：t=0 屏高≈25956/r、宽≈?；t=1 屏高≈32314/r、宽≈23936/r
    const KH = 25960 + 6360 * t;
    const KW = 12900 + 11040 * t;

    // 可用区域：桌面端扣掉左右面板，移动端扣掉顶栏与底部卡片
    const wide = VW > 900;
    const padX = wide ? 320 : 28;
    const padY = wide ? 150 : 190;
    const availW = Math.max(220, VW - padX * 2);
    const availH = Math.max(220, VH - padY);

    // 投影尺寸 ∝ 1/r，这里用「目标像素占比」反推距离：
    // 拆解态横向铺得更开，允许占满可用宽度的 92%，纵向留一点呼吸
    const rH = KH / (availH * (t > 0.5 ? 0.90 : 0.94));
    const rW = KW / (availW * (t > 0.5 ? 0.86 : 0.96));
    return clamp(Math.max(rH, rW), orbit.minR, orbit.maxR);
  }

  /* ==========================================================================
   *  8. 拆解
   * ========================================================================*/
  let explodeT = 0;      // 当前值 0..1
  let explodeDes = 0;    // 目标值
  const SPREAD = 0.42;

  function applyExplode(t) {
    t = clamp(t, 0, 1);
    for (let i = 0; i < parts.length; i++) {
      const p = parts[i];
      // 错峰：中心层先动，外层后动
      let lt = (t * (1 + SPREAD) - p.delay * SPREAD);
      lt = clamp(lt, 0, 1);
      const e = T.easeInOutCubic(lt);
      p.mesh.position.copy(p.base).addScaledVector(p.explode, e);
      p.explodeE = e;
    }
    // 相机自适应
    if (orbit.autoFit) {
      orbit.des.r = fitRadius(t) * orbit.zoom;
    }
  }

  function setExplode(v, silent) {
    explodeDes = clamp(v, 0, 1);
    if (silent) {
      explodeT = explodeDes;
      applyExplode(explodeT);
    }
    syncExplodeUI();
  }

  /* ==========================================================================
   *  9. 选中 / 高亮
   * ========================================================================*/
  let selected = null;
  const DIM_COLOR = new THREE.Color(0x0e1118);
  const GLOW_COLOR = new THREE.Color(0xc9a86a);

  /* 把部件的 dim / glow 数值写回材质（被 animate 与 setExplode 共用，
     否则 CPU 光栅化截图时阻尼还没跑完，选中态看不出来） */
  function refreshPartMats(p) {
    const pulse = 0.5 + 0.5 * Math.sin(t0 * 2.6);
    for (let k = 0; k < p.mats.length; k++) {
      const m = p.mats[k];
      const bc = m.userData.baseColor;
      if (bc && m.color) {
        m.color.copy(bc).lerp(GLOW_COLOR, p.glow * 0.06).lerp(DIM_COLOR, p.dim * 0.72);
      }
      if (m.emissive) {
        const be = m.userData.baseEmissive;
        if (be) {
          m.emissive.copy(be).lerp(GLOW_COLOR, p.glow * 0.22);
          const baseEI = m.userData.baseEI || 0;
          /* 高亮强度刻意收敛：选中件要保持自身丝印/纹理可读，
             靠"其余部件压暗 + 外圈光晕"制造对比，而不是把本体涂成金色 */
          m.emissiveIntensity = baseEI * (1 - p.glow * 0.55) * (1 - p.dim * 0.70)
            + p.glow * (0.07 + pulse * 0.10);
        }
      }
      if (m.roughness !== undefined) {
        m.roughness = clamp((m.userData.baseRough || 0.3) + p.dim * 0.30 - p.glow * 0.12, 0.02, 1);
      }
      /* 选中某个部件时，挡在它前面的层（按拆解方向 z 判断）半透明化 ——
         否则拆解态下最前面的屏幕会把后面的电池/芯片完全遮住。 */
      if (m.userData.baseTransparent !== undefined) {
        const baseOp = m.userData.baseOpacity === undefined ? 1 : m.userData.baseOpacity;
        const ghost = p.ghost || 0;
        if (ghost > 0.02) {
          m.transparent = true;
          m.opacity = baseOp * (1 - ghost * 0.55);
          m.depthWrite = ghost > 0.5 ? false : m.userData.baseDepthWrite;
        } else {
          m.transparent = m.userData.baseTransparent;
          m.opacity = baseOp;
          m.depthWrite = m.userData.baseDepthWrite;
        }
      }
    }
  }

  function snapFocus() {
    const selPart = selected ? parts.find(function (q) { return q.id === selected; }) : null;
    for (let i = 0; i < parts.length; i++) {
      const p = parts[i];
      p.dim = (selected && selected !== p.id) ? 1 : 0;
      p.glow = (selected === p.id) ? 1 : 0;
      let gh = 0;
      if (selPart && p !== selPart) {
        const dz = p.explode.z - selPart.explode.z;
        gh = dz > 0.4 ? clamp(0.42 + (dz / 9) * 0.34, 0, 0.76) : 0;
      }
      p.ghost = gh;
      refreshPartMats(p);
    }
  }

  function select(id, opts) {
    opts = opts || {};
    selected = id || null;

    // 列表状态
    $$('.pitem', elList).forEach(function (el) {
      el.classList.toggle('active', el.dataset.id === selected);
    });
    // 标注状态
    $$('.lbl', elLabels).forEach(function (el) {
      el.classList.toggle('active', el.dataset.id === selected);
    });

    if (selected) {
      const p = parts.find(function (q) { return q.id === selected; });
      if (p) {
        fillCard(p);
        elCard.classList.remove('hidden');
        if (opts.focus) focusPart(p);
      }
    } else {
      fillCard(null);
    }
  }

  function focusPart(p) {
    const c = p.anchor.clone().add(p.mesh.position);
    orbit.des.tx = c.x; orbit.des.ty = c.y; orbit.des.tz = c.z;

    // 按部件自身包围球取景：竖直与水平方向都留出余量，避免大件被裁切
    const bb = new THREE.Box3().setFromObject(p.mesh);
    const size = bb.getSize(new THREE.Vector3());
    const rad = Math.max(1.6, size.length() * 0.5);

    const vFov = (camera.fov * Math.PI) / 180;
    const vTan = Math.tan(vFov / 2);
    const hTan = vTan * camera.aspect;

    // 侧边面板占位：桌面端把可用宽度收窄，部件落在中间可视区里
    const wide = VW > 900;
    const availFrac = wide ? 0.62 : 0.94;
    const rV = (rad * 1.18) / vTan;
    const rH = (rad * 1.18) / (hTan * availFrac);

    orbit.zoom = 1;
    orbit.autoFit = false;
    // 特写允许比整机更近（orbit.minR 是整机取景下限）
    orbit.des.r = clamp(Math.max(rV, rH), orbit.minR * 0.52, orbit.maxR);

    // 背面部件的「正面」在 -Z 侧：自动绕到离当前最近的背面角度
    /* 芯片贴在主板背面（-Z 侧），只有绕到背面才看得到丝印，所以一并算作"背面件" */
    const rear = (p.group === '影像系统' || p.id === 'back_cover' || p.id === 'coil'
      || p.id === 'graphite' || p.id === 'soc' || p.id === 'memory');
    const curTh = orbit.cur.th;
    const dTh = ((Math.PI - curTh) % (Math.PI * 2) + Math.PI * 3) % (Math.PI * 2) - Math.PI;
    orbit.des.th = rear ? curTh + dTh : curTh;
    orbit.des.ph = clamp(orbit.cur.ph, 0.95, 1.75);
  }

  /* ==========================================================================
   * 10. 详情卡
   * ========================================================================*/
  const OVERVIEW = {
    name: 'HUAWEI Mate 90 Pro Max',
    en: 'ULTIMATE DESIGN EDITION',
    tag: '整机概览',
    spec: [
      '6.9″ 双层 OLED 串联屏 · 3500 nits',
      '麒麟 9050 Pro · 3nm · NPU 45 TOPS',
      '16GB + 1TB · 6800mAh · 100W',
      '星环四摄 · 红枫原色影像',
      '钛合金中框 · 8.6mm / 218g',
    ],
    desc: '典藏版以钛合金中框与素皮后盖构成机身骨架，19 个核心部件在 8.6mm 空间内高密度堆叠。点击任意部件即可查看其结构位置与关键参数，拖动底部滑块可逐层展开内部结构。',
  };

  function fillCard(p) {
    const tag = $('#cardTag');
    const name = $('#cardName');
    const en = $('#cardEn');
    const spec = $('#cardSpec');
    const desc = $('#cardDesc');

    const data = p
      ? { name: p.name, en: p.en, tag: p.group, spec: p.spec, desc: p.desc }
      : OVERVIEW;

    tag.textContent = data.tag;
    name.textContent = data.name;
    en.textContent = data.en;
    desc.textContent = data.desc;

    spec.innerHTML = '';
    data.spec.forEach(function (s, i) {
      const row = document.createElement('div');
      row.className = 'spec-row';
      row.style.animationDelay = (i * 55) + 'ms';
      row.innerHTML = '<i class="sr-k"></i><span class="sr-v"></span>';
      row.querySelector('.sr-v').textContent = s;
      spec.appendChild(row);
    });
  }

  /* ==========================================================================
   * 11. 部件清单
   * ========================================================================*/
  const GROUPS = ['全部', '外观结构', '核心计算', '影像系统', '能源散热', '其他'];
  let filterGroup = '全部';

  function buildRail() {
    // 筛选
    GROUPS.forEach(function (g) {
      const b = document.createElement('button');
      b.textContent = g;
      b.className = g === '全部' ? 'on' : '';
      b.addEventListener('click', function () {
        filterGroup = g;
        $$('button', elFilter).forEach(function (x) { x.classList.toggle('on', x === b); });
        renderList();
      });
      elFilter.appendChild(b);
    });

    // 列表
    parts.forEach(function (p, i) {
      const d = document.createElement('div');
      d.className = 'pitem';
      d.dataset.id = p.id;
      d.dataset.group = p.group;
      d.innerHTML =
        '<span class="pi-idx">' + String(i + 1).padStart(2, '0') + '</span>' +
        '<span class="pi-dot"></span>' +
        '<span class="pi-txt"><span class="pi-name"></span><span class="pi-en"></span></span>' +
        '<span class="pi-grp">' + p.group.replace('系统', '') + '</span>';
      d.querySelector('.pi-name').textContent = p.name;
      d.querySelector('.pi-en').textContent = p.en;
      d.addEventListener('click', function () {
        if (selected === p.id) { select(null); return; }
        select(p.id, { focus: false });
        if (explodeT < 0.5) setExplode(0.72);
      });
      elList.appendChild(d);
    });

    elCount.textContent = parts.length;
  }

  function renderList() {
    let n = 0;
    $$('.pitem', elList).forEach(function (el) {
      const show = filterGroup === '全部' || el.dataset.group === filterGroup;
      el.style.display = show ? '' : 'none';
      if (show) n++;
    });
    elCount.textContent = n;
  }

  /* ==========================================================================
   * 12. 3D 标注 + 引线
   * ========================================================================*/
  const labelEls = [];
  const SVGNS = 'http://www.w3.org/2000/svg';

  function buildLabels() {
    parts.forEach(function (p) {
      const el = document.createElement('div');
      el.className = 'lbl';
      el.dataset.id = p.id;
      el.innerHTML =
        '<div class="lbl-in"><i class="lbl-dot"></i>' +
        '<span class="lbl-nm"></span><span class="lbl-pt"></span></div>';
      el.querySelector('.lbl-nm').textContent = p.name;
      el.querySelector('.lbl-pt').textContent = SHORT[p.id] || '';
      el.style.opacity = '0';
      el.style.display = 'none';
      el.addEventListener('click', function (e) {
        e.stopPropagation();
        select(p.id, { focus: false });
        if (explodeT < 0.5) setExplode(0.72);
      });
      elLabels.appendChild(el);

      const line = document.createElementNS(SVGNS, 'polyline');
      line.setAttribute('fill', 'none');
      line.setAttribute('stroke', '#c9a86a');
      line.setAttribute('stroke-width', '1');
      line.setAttribute('stroke-opacity', '0');
      elLeaders.appendChild(line);

      const dot = document.createElementNS(SVGNS, 'circle');
      dot.setAttribute('r', '2.4');
      dot.setAttribute('fill', '#5ecbff');
      dot.setAttribute('fill-opacity', '0');
      elLeaders.appendChild(dot);

      labelEls.push({ p: p, el: el, line: line, dot: dot, w: 0, h: 0, side: 1, ty: 0, tx: 0 });
    });
  }

  let labelsOn = true;
  const _v = new THREE.Vector3();

  /* 标注必须避开左右两块面板，否则标签会压在部件清单/详情卡下面 */
  function safeBounds() {
    const b = { l: 10, r: VW - 10, t: 78, b: VH - 96 };
    const rr = elRail.getBoundingClientRect();
    if (rr.width > 0 && getComputedStyle(elRail).display !== 'none') {
      b.l = Math.max(b.l, rr.right + 12);
    }
    const cr = elCard.getBoundingClientRect();
    if (!elCard.classList.contains('hidden') && cr.width > 0) {
      b.r = Math.min(b.r, cr.left - 12);
    }
    if (b.r - b.l < 220) { b.l = 10; b.r = VW - 10; }
    return b;
  }

  function updateLabels() {
    const W = VW, H = VH;
    const SB = safeBounds();
    const showAll = labelsOn && explodeT > 0.04;
    const vis = [];

    for (let i = 0; i < labelEls.length; i++) {
      const L = labelEls[i];
      const p = L.p;
      const isSel = selected === p.id;
      const on = labelsOn && (showAll || isSel);
      if (!on) {
        if (L.el.style.display !== 'none') {
          L.el.style.display = 'none';
          L.line.setAttribute('stroke-opacity', '0');
          L.dot.setAttribute('fill-opacity', '0');
        }
        continue;
      }

      _v.copy(p.anchor).add(p.mesh.position);
      _v.project(camera);
      if (_v.z > 1 || _v.z < -1) { L.el.style.display = 'none'; continue; }

      const sx = (_v.x * 0.5 + 0.5) * W;
      const sy = (-_v.y * 0.5 + 0.5) * H;
      if (sx < -160 || sx > W + 160 || sy < -80 || sy > H + 80) {
        L.el.style.display = 'none';
        L.line.setAttribute('stroke-opacity', '0');
        L.dot.setAttribute('fill-opacity', '0');
        continue;
      }

      L.el.style.display = '';
      L.sx = sx; L.sy = sy;
      L.side = sx < (SB.l + SB.r) / 2 ? -1 : 1;
      vis.push(L);
    }

    // 同侧竖直避让（左右各成一列，按锚点高度顺序排布，互不重叠）
    vis.sort(function (a, b) { return a.sy - b.sy; });
    let lastL = -999, lastR = -999;
    const GAP = 26;
    for (let i = 0; i < vis.length; i++) {
      const L = vis[i];
      if (L.w === 0) { L.w = L.el.offsetWidth || 130; L.h = L.el.offsetHeight || 24; }
      let y = L.sy;
      if (L.side < 0) {
        if (y - lastL < GAP) y = lastL + GAP;
        lastL = y;
      } else {
        if (y - lastR < GAP) y = lastR + GAP;
        lastR = y;
      }
      L.ty = clamp(y, SB.t + 14, SB.b - 14);
    }

    const fade = clamp((explodeT - 0.04) / 0.26, 0, 1);

    for (let i = 0; i < vis.length; i++) {
      const L = vis[i];
      const isSel = selected === L.p.id;
      // 两侧各自贴边成列，形成工程图式的引出标注
      const lx = L.side > 0 ? (SB.r - L.w) : SB.l;
      const ly = L.ty;

      L.el.style.transform = 'translate(' + lx.toFixed(1) + 'px,' + (ly - L.h / 2).toFixed(1) + 'px)';
      L.el.style.opacity = isSel ? '1' : (fade * 0.94).toFixed(3);

      // 引线：锚点 → 折点 → 标签边缘
      const ax = L.sx, ay = L.sy;
      const ex = L.side > 0 ? lx : lx + L.w;
      const ey = ly;
      const midX = ax + (L.side > 0 ? 18 : -18);
      L.line.setAttribute('points',
        ax.toFixed(1) + ',' + ay.toFixed(1) + ' ' +
        midX.toFixed(1) + ',' + ay.toFixed(1) + ' ' +
        midX.toFixed(1) + ',' + ey.toFixed(1) + ' ' +
        ex.toFixed(1) + ',' + ey.toFixed(1));
      L.line.setAttribute('stroke-opacity', isSel ? '0.95' : (fade * 0.34).toFixed(2));
      L.line.setAttribute('stroke', isSel ? '#f0d9a8' : '#c9a86a');

      L.dot.setAttribute('cx', ax.toFixed(1));
      L.dot.setAttribute('cy', ay.toFixed(1));
      L.dot.setAttribute('fill', isSel ? '#f0d9a8' : '#5ecbff');
      L.dot.setAttribute('fill-opacity', isSel ? '1' : (fade * 0.85).toFixed(2));
      L.dot.setAttribute('r', isSel ? '3.2' : '2.2');
    }
  }

  /* ==========================================================================
   * 13. UI 同步
   * ========================================================================*/
  const elExplode = $('#explode');
  const elFill = $('#sliderFill');
  const elKnob = $('#sliderKnob');
  const elVal = $('#explodeVal');
  const elRailPct = $('#railPct');
  const elRailBar = $('#railBar');

  function syncExplodeUI() {
    const pct = Math.round(explodeDes * 100);
    if (elExplode.value !== String(pct)) elExplode.value = pct;
    elFill.style.width = pct + '%';
    elKnob.style.left = pct + '%';
    elVal.textContent = pct + '%';
    elRailPct.textContent = pct + '%';
    elRailBar.style.width = pct + '%';
  }

  let toastTimer = 0;
  function toast(msg) {
    elToast.textContent = msg;
    elToast.classList.add('show');
    clearTimeout(toastTimer);
    toastTimer = setTimeout(function () { elToast.classList.remove('show'); }, 1900);
  }

  /* ==========================================================================
   * 14. 交互：拾取
   * ========================================================================*/
  const ray = new THREE.Raycaster();
  const ndc = new THREE.Vector2();
  let downX = 0, downY = 0, downT = 0, moved = 0;

  function pick(cx, cy) {
    ndc.x = (cx / VW) * 2 - 1;
    ndc.y = -(cy / VH) * 2 + 1;
    ray.setFromCamera(ndc, camera);
    const hits = ray.intersectObject(MODEL.root, true);
    for (let i = 0; i < hits.length; i++) {
      let o = hits[i].object;
      while (o && !o.userData.partId) o = o.parent;
      if (o && o.userData.partId) return o.userData.partId;
    }
    return null;
  }

  /* ==========================================================================
   * 15. 交互：指针
   * ========================================================================*/
  const pointers = new Map();
  let pinchStart = 0, pinchR = 0;

  function onDown(e) {
    canvas.setPointerCapture && canvas.setPointerCapture(e.pointerId);
    pointers.set(e.pointerId, { x: e.clientX, y: e.clientY });
    if (pointers.size === 1) {
      orbit.dragging = true;
      downX = e.clientX; downY = e.clientY; downT = performance.now(); moved = 0;
      canvas.classList.add('dragging');
    } else if (pointers.size === 2) {
      const a = Array.from(pointers.values());
      pinchStart = Math.hypot(a[0].x - a[1].x, a[0].y - a[1].y);
      pinchR = orbit.des.r;
    }
  }

  function onMove(e) {
    const pt = pointers.get(e.pointerId);
    if (!pt) {
      // hover 光标
      if (!orbit.dragging) {
        const id = pick(e.clientX, e.clientY);
        canvas.classList.toggle('hovering', !!id);
      }
      return;
    }

    if (pointers.size === 2) {
      pt.x = e.clientX; pt.y = e.clientY;
      const a = Array.from(pointers.values());
      const d = Math.hypot(a[0].x - a[1].x, a[0].y - a[1].y);
      if (pinchStart > 0) {
        orbit.autoFit = false;
        orbit.des.r = clamp(pinchR * (pinchStart / Math.max(20, d)), orbit.minR, orbit.maxR);
      }
      return;
    }

    const dx = e.clientX - pt.x;
    const dy = e.clientY - pt.y;
    pt.x = e.clientX; pt.y = e.clientY;
    moved += Math.abs(dx) + Math.abs(dy);

    orbit.cur.th -= dx * 0.0072;
    orbit.des.th -= dx * 0.0072;
    orbit.cur.ph = clamp(orbit.cur.ph - dy * 0.0062, 0.12, Math.PI - 0.12);
    orbit.des.ph = orbit.cur.ph;
    orbit.idle = 0;
  }

  function onUp(e) {
    pointers.delete(e.pointerId);
    if (pointers.size === 0) {
      const dt = performance.now() - downT;
      const dist = Math.hypot(e.clientX - downX, e.clientY - downY);
      orbit.dragging = false;
      canvas.classList.remove('dragging');
      if (dist < 8 && dt < 620) {
        const id = pick(e.clientX, e.clientY);
        if (id) {
          if (selected === id) { select(null); }
          else {
            select(id);
            if (explodeT < 0.45) setExplode(0.78);
          }
        } else {
          select(null);
        }
      }
    } else if (pointers.size === 1) {
      const a = Array.from(pointers.values())[0];
      downX = a.x; downY = a.y; downT = performance.now();
    }
  }

  function onWheel(e) {
    e.preventDefault();
    orbit.autoFit = false;
    const k = Math.exp(e.deltaY * 0.0011);
    orbit.des.r = clamp(orbit.des.r * k, orbit.minR, orbit.maxR);
    orbit.idle = 0;
  }

  /* ==========================================================================
   * 16. 交互：按钮
   * ========================================================================*/
  function bindUI() {
    // 滑块
    elExplode.addEventListener('input', function () {
      orbit.autoFit = true;
      orbit.zoom = 1;
      setExplode(parseInt(elExplode.value, 10) / 100);
    });

    // 视角
    $$('.vp').forEach(function (b) {
      b.addEventListener('click', function () {
        $$('.vp').forEach(function (x) { x.classList.remove('active'); });
        b.classList.add('active');
        const v = VIEWS[b.dataset.v];
        if (!v) return;
        orbit.des.th = v.th;
        orbit.des.ph = v.ph;
        orbit.autoFit = true;
        orbit.zoom = 1;
        orbit.des.r = fitRadius(explodeT);
        orbit.des.tx = 0; orbit.des.ty = 0; orbit.des.tz = 0;
      });
    });

    // 一键拆解
    $('#btnExplodeAll').addEventListener('click', function () {
      orbit.autoFit = true;
      orbit.zoom = 1;
      if (explodeDes > 0.5) {
        setExplode(0);
        select(null);
        toast('已复位为整机形态');
      } else {
        setExplode(1);
        toast('正在展开全部 19 个部件');
      }
    });

    // 重置
    $('#btnReset').addEventListener('click', resetAll);

    // 自动旋转
    $('#btnAuto').addEventListener('click', function () {
      orbit.autoRotate = !orbit.autoRotate;
      this.classList.toggle('on', orbit.autoRotate);
      toast(orbit.autoRotate ? '自动旋转：开启' : '自动旋转：关闭');
    });

    // 标注
    $('#btnLabels').addEventListener('click', function () {
      labelsOn = !labelsOn;
      this.classList.toggle('on', labelsOn);
      toast(labelsOn ? '部件标注：显示' : '部件标注：隐藏');
    });

    // 引导
    $('#btnGuide').addEventListener('click', function () { showGuide(true); });
    $('#guideClose').addEventListener('click', function () { showGuide(false); });
    $('#guideOk').addEventListener('click', function () { showGuide(false); });

    // 侧栏（窄屏）
    $('#btnRail').addEventListener('click', function () {
      elRail.classList.toggle('mobile-open');
    });

    // 卡片
    $('#cardClose').addEventListener('click', function () { elCard.classList.add('hidden'); });
    $('#btnClose2').addEventListener('click', resetAll);
    $('#btnFocus').addEventListener('click', function () {
      if (!selected) return;
      const p = parts.find(function (q) { return q.id === selected; });
      if (!p) return;
      setExplode(1);
      focusPart(p);
      toast('已聚焦：' + p.name);
    });

    // 画布
    canvas.addEventListener('pointerdown', onDown);
    canvas.addEventListener('pointermove', onMove);
    canvas.addEventListener('pointerup', onUp);
    canvas.addEventListener('pointercancel', onUp);
    canvas.addEventListener('wheel', onWheel, { passive: false });
    canvas.addEventListener('dblclick', function () {
      orbit.des.th = HOME.th;
      orbit.des.ph = HOME.ph;
      orbit.autoFit = true;
      orbit.zoom = 1;
      orbit.des.r = fitRadius(explodeT);
      toast('视角已复位');
    });
    canvas.addEventListener('contextmenu', function (e) { e.preventDefault(); });

    // 键盘
    window.addEventListener('keydown', function (e) {
      const tag = (e.target && e.target.tagName) || '';
      if (tag === 'INPUT' || tag === 'TEXTAREA') return;
      const k = e.key.toLowerCase();
      if (k === 'r') { resetAll(); }
      else if (k === ' ') { e.preventDefault(); $('#btnExplodeAll').click(); }
      else if (k === 'l') { $('#btnLabels').click(); }
      else if (k === 'a') { $('#btnAuto').click(); }
      else if (k === 'g') { $('#btnGuide').click(); }
      else if (k === 'escape') { select(null); elCard.classList.add('hidden'); }
      else if (k === 'arrowleft') { orbit.des.th += 0.14; }
      else if (k === 'arrowright') { orbit.des.th -= 0.14; }
      else if (k === 'arrowup') { orbit.des.ph = clamp(orbit.des.ph - 0.1, 0.12, Math.PI - 0.12); }
      else if (k === 'arrowdown') { orbit.des.ph = clamp(orbit.des.ph + 0.1, 0.12, Math.PI - 0.12); }
    });

    window.addEventListener('resize', resize);
  }

  function resetAll() {
    orbit.autoFit = true;
    orbit.zoom = 1;
    orbit.des.th = HOME.th;
    orbit.des.ph = HOME.ph;
    orbit.des.tx = 0; orbit.des.ty = 0; orbit.des.tz = 0;
    orbit.des.r = fitRadius(0);
    setExplode(0);
    select(null);
    elCard.classList.add('hidden');
    $$('.vp').forEach(function (x) { x.classList.toggle('active', x.dataset.v === 'iso'); });
    toast('已重置视角与拆解');
  }

  function showGuide(on) {
    elGuide.classList.toggle('hidden', !on);
  }

  /* ==========================================================================
   * 17. 主循环
   * ========================================================================*/
  const clock = new THREE.Clock();
  let t0 = 0;

  function animate() {
    requestAnimationFrame(animate);
    const dt = Math.min(clock.getDelta(), 0.05);
    t0 += dt;

    /* --- 拆解插值 --- */
    if (Math.abs(explodeT - explodeDes) > 0.0002) {
      explodeT = damp(explodeT, explodeDes, 5.2, dt);
      applyExplode(explodeT);
    } else if (explodeT !== explodeDes) {
      explodeT = explodeDes;
      applyExplode(explodeT);
    }

    /* --- 轨道阻尼 --- */
    const o = orbit;
    o.idle += dt;
    if (o.autoRotate && !o.dragging) {
      o.des.th += dt * o.autoSpeed * (o.idle > 1.2 ? 1 : 0);
    }
    o.cur.r = damp(o.cur.r, o.des.r, 5.5, dt);
    o.cur.th = damp(o.cur.th, o.des.th, 7, dt);
    o.cur.ph = damp(o.cur.ph, o.des.ph, 7, dt);
    o.cur.tx = damp(o.cur.tx, o.des.tx, 6, dt);
    o.cur.ty = damp(o.cur.ty, o.des.ty, 6, dt);
    o.cur.tz = damp(o.cur.tz, o.des.tz, 6, dt);

    o.target.set(o.cur.tx, o.cur.ty, o.cur.tz);
    const sp = Math.sin(o.cur.ph), cp = Math.cos(o.cur.ph);
    camera.position.set(
      o.target.x + o.cur.r * sp * Math.sin(o.cur.th),
      o.target.y + o.cur.r * cp,
      o.target.z + o.cur.r * sp * Math.cos(o.cur.th)
    );
    camera.lookAt(o.target);

    /* --- 部件高亮 / 暗化 --- */
    const hasSel = !!selected;
    const selPart = selected ? parts.find(function (q) { return q.id === selected; }) : null;
    for (let i = 0; i < parts.length; i++) {
      const p = parts[i];
      const isSel = selected === p.id;
      const dimT = hasSel && !isSel ? 1 : 0;
      const glowT = isSel ? 1 : 0;

      const nd = damp(p.dim, dimT, 7, dt);
      const ng = damp(p.glow, glowT, 8, dt);
      if (Math.abs(nd - p.dim) < 0.0015 && Math.abs(ng - p.glow) < 0.0015 &&
          Math.abs(p.dim - dimT) < 0.0015 && Math.abs(p.glow - glowT) < 0.0015) {
        continue;
      }
      p.dim = nd; p.glow = ng;
      /* 挡在选中件"外侧"（explode.z 更大）的层，淡化成玻璃，露出后面的部件 */
      let gh = 0;
      if (selPart && p !== selPart) {
        const dz = p.explode.z - selPart.explode.z;
        gh = dz > 0.4 ? clamp(0.42 + (dz / 9) * 0.34, 0, 0.76) : 0;
      }
      p.ghost = damp(p.ghost || 0, gh, 7, dt);
      refreshPartMats(p);
    }

    /* --- 选中光晕 --- */
    if (glowSprite) {
      const p = selected ? parts.find(function (q) { return q.id === selected; }) : null;
      if (p) {
        const c = p.anchor.clone().add(p.mesh.position);
        glowSprite.position.copy(c);
        const pulse = 0.5 + 0.5 * Math.sin(t0 * 2.4);
        /* 光晕只做"背后一圈呼吸光"，不能糊住部件本体：
           1) 不透明度压低；2) 尺寸随部件自适应；3) 沿视线方向后移一点 */
        const sz = p.glowSize || 5.2;
        glowSprite.material.opacity = damp(glowSprite.material.opacity, 0.13 + pulse * 0.11, 8, dt);
        glowSprite.scale.setScalar(sz * (0.94 + pulse * 0.10));
        const dir = camera.position.clone().sub(c).normalize();
        glowSprite.position.copy(c).addScaledVector(dir, -sz * 0.34);
      } else {
        glowSprite.material.opacity = damp(glowSprite.material.opacity, 0, 10, dt);
      }
    }

    /* --- 舞台旋转 --- */
    if (stageSpin) stageSpin.rotation.y += dt * 0.045;

    renderer.render(scene, camera);

    /* --- 标注 --- */
    updateLabels();
  }

  /* ==========================================================================
   * 18. 启动
   * ========================================================================*/
  function setLoad(pct, sub) {
    $('#loadFill').style.width = pct + '%';
    $('#loadPct').textContent = Math.round(pct) + '%';
    if (sub) $('.load-sub').textContent = sub;
  }

  function boot() {
    resize();
    setLoad(8, '正在生成程序化贴图…');

    requestAnimationFrame(function () {
      buildEnv();
      setLoad(32, '正在构建光照与环境反射…');
      buildLights();
      buildStage();
      setLoad(52, '正在构建三维结构模型…');

      requestAnimationFrame(function () {
        buildModel();
        buildGlowSprite();
        setLoad(76, '正在生成部件标注…');
        buildRail();
        buildLabels();
        fillCard(null);
        // 窄屏下详情卡会盖住机身，初始收起，点选部件时再展开
        if (window.innerWidth <= 640) elCard.classList.add('hidden');
        bindUI();
        syncExplodeUI();

        requestAnimationFrame(function () {
          applyExplode(0);
          orbit.autoFit = true;
          orbit.des.r = fitRadius(0);
          orbit.cur.r = orbit.des.r;
          setLoad(96, '即将完成…');

          requestAnimationFrame(function () {
            setLoad(100, '加载完成');
            setTimeout(function () {
              elLoading.classList.add('done');
              animate();
              // 首次进入展示引导
              let seen = false;
              try { seen = localStorage.getItem('mate90-guide') === '1'; } catch (e) {}
              if (!seen) {
                showGuide(true);
                try { localStorage.setItem('mate90-guide', '1'); } catch (e) {}
              }
            }, 260);
          });
        });
      });
    });
  }

  /* ==========================================================================
   * 19. 调试接口（供 CPU 光栅化验证脚本使用）
   * ========================================================================*/
  window.__dbg = {
    renderer: renderer,
    scene: scene,
    camera: camera,
    orbit: orbit,
    /* 注意：buildModel() 会整体替换 parts 数组，必须用 getter，否则拿到的是启动前的空数组 */
    get parts() { return parts; },
    pick: pick,
    state: { get explode() { return explodeT; }, get selected() { return selected; } },
    setMode: function (m) { window.__mode = m; },
    setExplode: function (v) {
      orbit.autoFit = false;
      explodeT = clamp(v, 0, 1);
      explodeDes = explodeT;
      applyExplode(explodeT);
      snapFocus();
      syncExplodeUI();
    },
    select: select,
    applyExplode: applyExplode,
    get explodeT() { return explodeT; },
    fitRadius: fitRadius,
    hideGuide: function () { showGuide(false); },
    hideLoading: function () { elLoading.classList.add('done'); },
    snapFocus: snapFocus,
    updateLabels: updateLabels,
    /* 供 CPU 光栅化脚本使用：立即把相机同步到目标状态（容器内 rAF 帧率极低） */
    syncCamera: function () {
      const o = orbit;
      o.cur.r = o.des.r; o.cur.th = o.des.th; o.cur.ph = o.des.ph;
      o.cur.tx = o.des.tx; o.cur.ty = o.des.ty; o.cur.tz = o.des.tz;
      o.target.set(o.cur.tx, o.cur.ty, o.cur.tz);
      const sp = Math.sin(o.cur.ph), cp = Math.cos(o.cur.ph);
      camera.position.set(
        o.target.x + o.cur.r * sp * Math.sin(o.cur.th),
        o.target.y + o.cur.r * cp,
        o.target.z + o.cur.r * sp * Math.cos(o.cur.th)
      );
      camera.lookAt(o.target);
      camera.updateMatrixWorld(true);
      scene.updateMatrixWorld(true);
    },
  };

  boot();
})();
