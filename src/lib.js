/* ============================================================================
 *  lib.js — 几何 / 材质 / 数学 工具库
 *  1 unit = 10mm（T.mm = 0.1）
 * ==========================================================================*/
(function () {
  const T = (window.T = window.T || {});

  T.mm = 0.1;

  /* ---------- 数学 ---------- */
  T.clamp = function (v, a, b) { return v < a ? a : v > b ? b : v; };
  T.lerp = function (a, b, t) { return a + (b - a) * t; };
  T.easeOutCubic = function (t) { return 1 - Math.pow(1 - t, 3); };
  T.easeInOutCubic = function (t) {
    return t < 0.5 ? 4 * t * t * t : 1 - Math.pow(-2 * t + 2, 3) / 2;
  };
  T.easeOutBack = function (t) {
    const c1 = 1.70158, c3 = c1 + 1;
    return 1 + c3 * Math.pow(t - 1, 3) + c1 * Math.pow(t - 1, 2);
  };
  T.easeOutQuint = function (t) { return 1 - Math.pow(1 - t, 5); };
  T.damp = function (cur, target, lambda, dt) {
    return T.lerp(cur, target, 1 - Math.exp(-lambda * dt));
  };

  /* ---------- 圆角矩形 Shape ---------- */
  T.rrShape = function (w, h, r) {
    r = Math.min(r, w / 2, h / 2);
    const s = new THREE.Shape();
    const x = -w / 2, y = -h / 2;
    s.moveTo(x + r, y);
    s.lineTo(x + w - r, y);
    s.quadraticCurveTo(x + w, y, x + w, y + r);
    s.lineTo(x + w, y + h - r);
    s.quadraticCurveTo(x + w, y + h, x + w - r, y + h);
    s.lineTo(x + r, y + h);
    s.quadraticCurveTo(x, y + h, x, y + h - r);
    s.lineTo(x, y + r);
    s.quadraticCurveTo(x, y, x + r, y);
    return s;
  };

  /* ---------- UV 归一化（把 UV 映射到 0..1 包围盒）---------- */
  T.normUV = function (g) {
    g.computeBoundingBox();
    const bb = g.boundingBox;
    const sx = bb.max.x - bb.min.x || 1;
    const sy = bb.max.y - bb.min.y || 1;
    const uv = g.attributes.uv;
    const pos = g.attributes.position;
    if (!uv) return g;
    for (let i = 0; i < uv.count; i++) {
      uv.setXY(i, (pos.getX(i) - bb.min.x) / sx, (pos.getY(i) - bb.min.y) / sy);
    }
    uv.needsUpdate = true;
    return g;
  };

  /* ---------- 圆角板（带倒角的挤出体）---------- */
  T.roundedBox = function (w, h, d, r, bevel) {
    bevel = bevel === undefined ? 0.02 : bevel;
    const shape = T.rrShape(w - 2 * bevel, h - 2 * bevel, Math.max(0.02, r - bevel));
    const g = new THREE.ExtrudeGeometry(shape, {
      depth: Math.max(0.004, d - 2 * bevel),
      bevelEnabled: bevel > 0,
      bevelSize: bevel,
      bevelThickness: bevel,
      bevelSegments: 3,
      curveSegments: 14,
      steps: 1,
    });
    g.center();
    T.normUV(g);
    return g;
  };

  /* ---------- 圆角环形框（挖内孔挤出）---------- */
  T.rrRing = function (w, h, r, thickness, depth) {
    const outer = T.rrShape(w, h, r);
    const iw = Math.max(0.1, w - thickness * 2);
    const ih = Math.max(0.1, h - thickness * 2);
    const inner = T.rrShape(iw, ih, Math.max(0.02, r - thickness));
    outer.holes.push(inner);
    const g = new THREE.ExtrudeGeometry(outer, {
      depth: depth,
      bevelEnabled: true,
      bevelSize: 0.012,
      bevelThickness: 0.012,
      bevelSegments: 2,
      curveSegments: 20,
      steps: 1,
    });
    g.center();
    T.normUV(g);
    return g;
  };

  /* ---------- 圆角平面片（贴图载体）---------- */
  T.rrPlane = function (w, h, r) {
    const g = new THREE.ShapeGeometry(T.rrShape(w, h, r), 16);
    T.normUV(g);
    return g;
  };

  /* ---------- 基础几何快捷 ---------- */
  T.box = function (w, h, d, mat) {
    return new THREE.Mesh(new THREE.BoxGeometry(w, h, d), mat);
  };
  T.cyl = function (rt, rb, h, seg, mat) {
    return new THREE.Mesh(new THREE.CylinderGeometry(rt, rb, h, seg || 48), mat);
  };
  T.flatRing = function (ro, ri, mat, seg) {
    const g = new THREE.RingGeometry(ri, ro, seg || 64, 1);
    return new THREE.Mesh(g, mat);
  };
  T.torus = function (r, tube, mat, seg) {
    return new THREE.Mesh(new THREE.TorusGeometry(r, tube, 16, seg || 64), mat);
  };
  T.lens = function (radius, mat) {
    // 浅球冠镜片：沿极轴压扁成浅碟形，极轴转到 -Z —— 后摄朝机身背面外侧凸出。
    // 注意 scale 作用在局部坐标系（先于 rotation），球冠极轴是 Y，所以压 scale.y。
    const g = new THREE.SphereGeometry(radius, 44, 26, 0, Math.PI * 2, 0, 0.46 * Math.PI);
    const m = new THREE.Mesh(g, mat);
    m.scale.set(1, 0.12, 1);
    m.rotation.x = -Math.PI / 2;   // 极轴 Y → -Z
    return m;
  };
  T.disc = function (r, mat, seg) {
    const g = new THREE.CircleGeometry(r, seg || 64);
    return new THREE.Mesh(g, mat);
  };

  /* ---------- 材质工厂 ---------- */
  T.mat = {
    metal: function (color, rough, envI) {
      return new THREE.MeshStandardMaterial({
        color: color,
        metalness: 1.0,
        roughness: rough === undefined ? 0.3 : rough,
        envMapIntensity: envI === undefined ? 1.15 : envI,
      });
    },
    plastic: function (color, rough) {
      return new THREE.MeshStandardMaterial({
        color: color,
        metalness: 0.05,
        roughness: rough === undefined ? 0.55 : rough,
        envMapIntensity: 0.7,
      });
    },
    glass: function (color, rough, opacity) {
      return new THREE.MeshStandardMaterial({
        color: color,
        metalness: 0.35,
        roughness: rough === undefined ? 0.06 : rough,
        envMapIntensity: 1.9,
        transparent: opacity !== undefined && opacity < 1,
        opacity: opacity === undefined ? 1 : opacity,
      });
    },
    copper: function () { return T.mat.metal(0xc8793c, 0.34, 1.25); },
    gold: function () { return T.mat.metal(0xd8b06a, 0.24, 1.5); },
    pcb: function (color) {
      return new THREE.MeshStandardMaterial({
        color: color === undefined ? 0x14352b : color,
        metalness: 0.2,
        roughness: 0.72,
        envMapIntensity: 0.6,
      });
    },
    emissive: function (color, intensity) {
      return new THREE.MeshStandardMaterial({
        color: 0x111111,
        emissive: color,
        emissiveIntensity: intensity === undefined ? 1.6 : intensity,
        metalness: 0.1,
        roughness: 0.5,
      });
    },
    glow: function (color, opacity) {
      return new THREE.MeshBasicMaterial({
        color: color,
        transparent: true,
        opacity: opacity === undefined ? 0.5 : opacity,
        blending: THREE.AdditiveBlending,
        depthWrite: false,
        side: THREE.DoubleSide,
      });
    },
  };

  /* ---------- 贴图材质 ---------- */
  T.texMat = function (tex, opt) {
    opt = opt || {};
    return new THREE.MeshStandardMaterial({
      map: tex,
      color: opt.color === undefined ? 0xffffff : opt.color,
      metalness: opt.metalness === undefined ? 0.1 : opt.metalness,
      roughness: opt.roughness === undefined ? 0.62 : opt.roughness,
      envMapIntensity: opt.envI === undefined ? 0.8 : opt.envI,
      emissive: opt.emissive === undefined ? 0x000000 : opt.emissive,
      emissiveMap: opt.emissiveMap || null,
      emissiveIntensity: opt.emissiveIntensity === undefined ? 1 : opt.emissiveIntensity,
      transparent: !!opt.transparent,
      opacity: opt.opacity === undefined ? 1 : opt.opacity,
      side: opt.side === undefined ? THREE.FrontSide : opt.side,
    });
  };

  /* ---------- 在 +Z 面贴一张圆角贴图片 ---------- */
  T.decal = function (w, h, r, tex, z, opt) {
    const m = new THREE.Mesh(T.rrPlane(w, h, r), T.texMat(tex, opt));
    m.position.z = z || 0;
    return m;
  };

  /* ---------- 细长圆角条（装饰、缝线）---------- */
  T.bar = function (w, h, mat) {
    const g = new THREE.PlaneGeometry(w, h);
    return new THREE.Mesh(g, mat);
  };

  /* ---------- 圆环（俯视平铺）---------- */
  T.ringFlat = function (ro, ri, mat, seg) {
    const g = new THREE.RingGeometry(ri, ro, seg || 72, 1);
    const m = new THREE.Mesh(g, mat);
    m.rotation.x = 0;
    return m;
  };
})();
