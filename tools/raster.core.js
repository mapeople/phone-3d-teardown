/* ============================================================
   CPU 软件光栅化器（带 z-buffer + 贴图采样）
   容器内 WebGL 光栅化失效，只能用 CPU 验证 three.js 场景。
   ============================================================ */
(function () {
  var L1 = new THREE.Vector3(-0.42, 0.74, 0.52).normalize();
  var L2 = new THREE.Vector3(0.78, -0.15, -0.42).normalize();
  var L3 = new THREE.Vector3(-0.2, -0.5, 0.85).normalize();

  var texCache = {};

  function getTex(tex) {
    if (!tex) return null;
    var key = tex.uuid;
    if (key in texCache) return texCache[key];
    var img = tex.image;
    if (!img) { texCache[key] = null; return null; }
    var w = img.width || img.videoWidth || 0;
    var h = img.height || img.videoHeight || 0;
    if (!w || !h) { texCache[key] = null; return null; }
    var c = document.createElement('canvas');
    c.width = w; c.height = h;
    var cx = c.getContext('2d', { willReadFrequently: true });
    try {
      cx.drawImage(img, 0, 0, w, h);
      var d = cx.getImageData(0, 0, w, h).data;
      var hasA = false;
      for (var ai = 3; ai < d.length; ai += 4) { if (d[ai] < 250) { hasA = true; break; } }
      texCache[key] = { data: d, w: w, h: h, alpha: hasA };
    } catch (e) {
      texCache[key] = null;
    }
    return texCache[key];
  }

  function isVisible(o) {
    var n = o;
    while (n) {
      if (n.visible === false) return false;
      n = n.parent;
    }
    return true;
  }

  window.__raster = function (opts) {
    var W = opts.w | 0, H = opts.h | 0;
    var scene = window.__dbg.scene;
    var camera = window.__dbg.camera;

    scene.updateMatrixWorld(true);
    camera.updateMatrixWorld(true);
    camera.updateProjectionMatrix();

    var view = camera.matrixWorldInverse;
    var proj = camera.projectionMatrix;
    var camPos = camera.position.clone();

    /* ---------- 收集三角形 ---------- */
    var opaque = [];
    var trans = [];
    var meshes = [];

    scene.traverse(function (o) {
      if (!o.isMesh) return;
      if (!isVisible(o)) return;
      if (o.userData && o.userData.skipRaster) return;
      if (!o.geometry || !o.geometry.attributes.position) return;
      meshes.push(o);
    });

    var vA = new THREE.Vector3(), vB = new THREE.Vector3(), vC = new THREE.Vector3();
    var e1 = new THREE.Vector3(), e2 = new THREE.Vector3(), nrm = new THREE.Vector3();
    var pA = new THREE.Vector4(), pB = new THREE.Vector4(), pC = new THREE.Vector4();

    for (var mi = 0; mi < meshes.length; mi++) {
      var o = meshes[mi];
      var g = o.geometry;
      var pos = g.attributes.position;
      var uvA = g.attributes.uv || null;
      var idx = g.index;
      var count = idx ? idx.count : pos.count;
      var mw = o.matrixWorld;
      var mat = Array.isArray(o.material) ? o.material[0] : o.material;
      if (!mat) continue;

      var opacity = mat.transparent ? (mat.opacity === undefined ? 1 : mat.opacity) : 1;
      if (opacity < 0.03) continue;

      var col = mat.color ? mat.color : new THREE.Color(0xcccccc);
      var cr = col.r, cg = col.g, cb = col.b;
      var metal = mat.metalness === undefined ? 0.15 : mat.metalness;
      var rough = mat.roughness === undefined ? 0.65 : mat.roughness;
      var mapTex = getTex(mat.map);
      var emTex = getTex(mat.emissiveMap);
      var emCol = mat.emissive ? mat.emissive : null;
      var emInt = mat.emissiveIntensity === undefined ? 1 : mat.emissiveIntensity;
      var useEm = !!(emCol && (emCol.r + emCol.g + emCol.b) > 0.01);
      var shin = Math.max(2, Math.pow(2, (1 - rough) * 9));
      var specK = (1 - rough) * (0.12 + metal * 0.75) * 0.9;

      var isTrans = opacity < 0.985;
      var target = isTrans ? trans : opaque;

      for (var i = 0; i < count; i += 3) {
        var i0 = idx ? idx.getX(i) : i;
        var i1 = idx ? idx.getX(i + 1) : i + 1;
        var i2 = idx ? idx.getX(i + 2) : i + 2;

        vA.fromBufferAttribute(pos, i0).applyMatrix4(mw);
        vB.fromBufferAttribute(pos, i1).applyMatrix4(mw);
        vC.fromBufferAttribute(pos, i2).applyMatrix4(mw);

        // 视空间 z
        var zA = -(view.elements[2] * vA.x + view.elements[6] * vA.y + view.elements[10] * vA.z + view.elements[14]);
        var zB = -(view.elements[2] * vB.x + view.elements[6] * vB.y + view.elements[10] * vB.z + view.elements[14]);
        var zC = -(view.elements[2] * vC.x + view.elements[6] * vC.y + view.elements[10] * vC.z + view.elements[14]);
        if (zA < 0.08 || zB < 0.08 || zC < 0.08) continue;

        pA.set(vA.x, vA.y, vA.z, 1).applyMatrix4(view).applyMatrix4(proj);
        pB.set(vB.x, vB.y, vB.z, 1).applyMatrix4(view).applyMatrix4(proj);
        pC.set(vC.x, vC.y, vC.z, 1).applyMatrix4(view).applyMatrix4(proj);

        var x0 = (pA.x / pA.w * 0.5 + 0.5) * W, y0 = (-pA.y / pA.w * 0.5 + 0.5) * H;
        var x1 = (pB.x / pB.w * 0.5 + 0.5) * W, y1 = (-pB.y / pB.w * 0.5 + 0.5) * H;
        var x2 = (pC.x / pC.w * 0.5 + 0.5) * W, y2 = (-pC.y / pC.w * 0.5 + 0.5) * H;

        var minX = Math.max(0, Math.floor(Math.min(x0, x1, x2)));
        var maxX = Math.min(W - 1, Math.ceil(Math.max(x0, x1, x2)));
        var minY = Math.max(0, Math.floor(Math.min(y0, y1, y2)));
        var maxY = Math.min(H - 1, Math.ceil(Math.max(y0, y1, y2)));
        if (minX > maxX || minY > maxY) continue;

        var area = (x1 - x0) * (y2 - y0) - (x2 - x0) * (y1 - y0);
        if (Math.abs(area) < 1e-9) continue;

        // 面法线（世界空间）
        e1.subVectors(vB, vA); e2.subVectors(vC, vA);
        nrm.crossVectors(e1, e2);
        if (nrm.lengthSq() < 1e-14) continue;
        nrm.normalize();

        var cx = (vA.x + vB.x + vC.x) / 3;
        var cy = (vA.y + vB.y + vC.y) / 3;
        var cz = (vA.z + vB.z + vC.z) / 3;
        var tx = camPos.x - cx, ty = camPos.y - cy, tz = camPos.z - cz;
        var tl = Math.sqrt(tx * tx + ty * ty + tz * tz) || 1;
        tx /= tl; ty /= tl; tz /= tl;
        var facing = nrm.x * tx + nrm.y * ty + nrm.z * tz;
        if (facing < 0) { nrm.multiplyScalar(-1); facing = -facing; }

        // 光照（三向主光 + 相机补光，近似页面里 6 盏方向光 + 环境贴图）
        var d1 = Math.max(0, nrm.x * L1.x + nrm.y * L1.y + nrm.z * L1.z);
        var d2 = Math.max(0, nrm.x * L2.x + nrm.y * L2.y + nrm.z * L2.z);
        var d3 = Math.max(0, nrm.x * L3.x + nrm.y * L3.y + nrm.z * L3.z);
        var d4 = Math.max(0, nrm.x * tx + nrm.y * ty + nrm.z * tz); // 相机补光
        var amb = 0.34 + 0.22 * (nrm.y * 0.5 + 0.5);

        // Blinn 高光
        var hx = L1.x + tx, hy = L1.y + ty, hz = L1.z + tz;
        var hl = Math.sqrt(hx * hx + hy * hy + hz * hz) || 1;
        hx /= hl; hy /= hl; hz /= hl;
        var sp = Math.pow(Math.max(0, nrm.x * hx + nrm.y * hy + nrm.z * hz), shin) * specK;
        var fres = Math.pow(1 - facing, 4) * (0.10 + metal * 0.55);

        var shade = amb + d1 * 0.72 + d2 * 0.30 + d3 * 0.20 + d4 * 0.30;

        var u0 = 0, v0 = 0, u1 = 0, v1 = 0, u2 = 0, v2 = 0;
        if (uvA && mapTex) {
          u0 = uvA.getX(i0); v0 = uvA.getY(i0);
          u1 = uvA.getX(i1); v1 = uvA.getY(i1);
          u2 = uvA.getX(i2); v2 = uvA.getY(i2);
        }

        var r0 = cr * shade, g0 = cg * shade, b0 = cb * shade;
        // 金属：环境反射偏冷
        if (metal > 0.4) {
          var refl = fres * 1.05 + 0.10 + d4 * 0.06;
          r0 += refl * (0.55 + cr * 0.5);
          g0 += refl * (0.62 + cg * 0.5);
          b0 += refl * (0.80 + cb * 0.5);
        } else {
          r0 += fres * 0.5; g0 += fres * 0.55; b0 += fres * 0.7;
        }
        r0 += sp; g0 += sp; b0 += sp;

        // 自发光：Three.js 里 emissive 直接叠加，选中高亮的金色辉光靠它体现。
        // 有 emissiveMap 的面（屏幕/闪光灯）已在 drawTri 里叠加，避免重复计算。
        if (emCol && !emTex) {
          r0 += emCol.r * emInt; g0 += emCol.g * emInt; b0 += emCol.b * emInt;
        }

        target.push({
          x0: x0, y0: y0, x1: x1, y1: y1, x2: x2, y2: y2,
          minX: minX, maxX: maxX, minY: minY, maxY: maxY,
          inv: 1 / area,
          z0: zA, z1: zB, z2: zC,
          u0: u0, v0: v0, u1: u1, v1: v1, u2: u2, v2: v2,
          map: mapTex, em: useEm ? emTex : null,
          emR: useEm ? emCol.r * emInt : 0,
          emG: useEm ? emCol.g * emInt : 0,
          emB: useEm ? emCol.b * emInt : 0,
          r: r0, g: g0, b: b0,
          op: opacity,
          d: (zA + zB + zC) / 3
        });
      }
    }

    /* ---------- 帧缓冲 ---------- */
    var color = new Float32Array(W * H * 3);
    var zbuf = new Float32Array(W * H);
    for (var k = 0; k < W * H; k++) zbuf[k] = Infinity;

    // 背景（径向 + 垂直渐变）
    var cxs = W * 0.5, cys = H * 0.42;
    var maxd = Math.sqrt(cxs * cxs + cys * cys);
    for (var yy = 0; yy < H; yy++) {
      for (var xx = 0; xx < W; xx++) {
        var dx = xx - cxs, dy = yy - cys;
        var dd = Math.sqrt(dx * dx + dy * dy) / maxd;
        var t = Math.min(1, dd);
        var vig = 1 - t * t * 0.85;
        var idx2 = (yy * W + xx) * 3;
        color[idx2] = (0.075 * vig + 0.012) ;
        color[idx2 + 1] = (0.085 * vig + 0.014);
        color[idx2 + 2] = (0.105 * vig + 0.020);
      }
    }

    function drawTri(T) {
      var x0 = T.x0, y0 = T.y0, x1 = T.x1, y1 = T.y1, x2 = T.x2, y2 = T.y2;
      var inv = T.inv;
      var iw0 = 1 / T.z0, iw1 = 1 / T.z1, iw2 = 1 / T.z2;
      var mp = T.map, md = mp ? mp.data : null, mw2 = mp ? mp.w : 1, mh2 = mp ? mp.h : 1;
      var emd = T.em ? T.em.data : null, ew = T.em ? T.em.w : 1, eh = T.em ? T.em.h : 1;
      var isT = T.op < 0.985;
      var baseR = T.r, baseG = T.g, baseB = T.b;

      for (var py = T.minY; py <= T.maxY; py++) {
        var fy = py + 0.5;
        for (var px = T.minX; px <= T.maxX; px++) {
          var fx = px + 0.5;
          var w0 = ((x1 - fx) * (y2 - fy) - (x2 - fx) * (y1 - fy)) * inv;
          if (w0 < -1e-7) continue;
          var w1 = ((x2 - fx) * (y0 - fy) - (x0 - fx) * (y2 - fy)) * inv;
          if (w1 < -1e-7) continue;
          var w2 = 1 - w0 - w1;
          if (w2 < -1e-7) continue;

          var iw = w0 * iw0 + w1 * iw1 + w2 * iw2;
          if (iw <= 0) continue;
          var z = 1 / iw;

          var pi = py * W + px;
          if (z >= zbuf[pi]) continue;

          var r = baseR, g = baseG, b = baseB;
          var pixA = 1;

          if (md) {
            var u = (w0 * T.u0 * iw0 + w1 * T.u1 * iw1 + w2 * T.u2 * iw2) * z;
            var v = (w0 * T.v0 * iw0 + w1 * T.v1 * iw1 + w2 * T.v2 * iw2) * z;
            var tx2 = (u - Math.floor(u)) * mw2 | 0;
            var ty2 = (1 - (v - Math.floor(v))) * mh2 | 0;
            if (tx2 < 0) tx2 = 0; else if (tx2 >= mw2) tx2 = mw2 - 1;
            if (ty2 < 0) ty2 = 0; else if (ty2 >= mh2) ty2 = mh2 - 1;
            var ti = (ty2 * mw2 + tx2) * 4;
            r *= md[ti] / 255; g *= md[ti + 1] / 255; b *= md[ti + 2] / 255;
            if (mp.alpha) pixA = md[ti + 3] / 255;
          }

          if (emd || T.emR > 0) {
            var eu = 0.5, ev = 0.5;
            if (emd) {
              eu = (w0 * T.u0 * iw0 + w1 * T.u1 * iw1 + w2 * T.u2 * iw2) * z;
              ev = (w0 * T.v0 * iw0 + w1 * T.v1 * iw1 + w2 * T.v2 * iw2) * z;
              var ex = (eu - Math.floor(eu)) * ew | 0;
              var ey = (1 - (ev - Math.floor(ev))) * eh | 0;
              if (ex < 0) ex = 0; else if (ex >= ew) ex = ew - 1;
              if (ey < 0) ey = 0; else if (ey >= eh) ey = eh - 1;
              var ei = (ey * ew + ex) * 4;
              r += (emd[ei] / 255) * T.emR;
              g += (emd[ei + 1] / 255) * T.emG;
              b += (emd[ei + 2] / 255) * T.emB;
            } else {
              r += T.emR * 0.4; g += T.emG * 0.4; b += T.emB * 0.4;
            }
          }

          if (isT || pixA < 0.995) {
            var a = T.op * pixA;
            if (a < 0.004) continue;
            var ci = pi * 3;
            color[ci] = color[ci] * (1 - a) + r * a;
            color[ci + 1] = color[ci + 1] * (1 - a) + g * a;
            color[ci + 2] = color[ci + 2] * (1 - a) + b * a;
          } else {
            zbuf[pi] = z;
            var ci2 = pi * 3;
            color[ci2] = r;
            color[ci2 + 1] = g;
            color[ci2 + 2] = b;
          }
        }
      }
    }

    for (var q = 0; q < opaque.length; q++) drawTri(opaque[q]);
    trans.sort(function (a, b) { return b.d - a.d; });
    for (var q2 = 0; q2 < trans.length; q2++) drawTri(trans[q2]);

    /* ---------- 输出 ---------- */
    var out = document.createElement('canvas');
    out.width = W; out.height = H;
    var octx = out.getContext('2d');
    var img = octx.createImageData(W, H);
    var od = img.data;
    for (var i3 = 0, j3 = 0; i3 < W * H; i3++, j3 += 4) {
      var s = i3 * 3;
      var rr = color[s], gg = color[s + 1], bb = color[s + 2];
      // 轻色调映射
      rr = rr / (1 + rr * 0.42); gg = gg / (1 + gg * 0.42); bb = bb / (1 + bb * 0.42);
      rr = Math.pow(rr, 0.9); gg = Math.pow(gg, 0.9); bb = Math.pow(bb, 0.9);
      od[j3] = Math.min(255, rr * 255) | 0;
      od[j3 + 1] = Math.min(255, gg * 255) | 0;
      od[j3 + 2] = Math.min(255, bb * 255) | 0;
      od[j3 + 3] = 255;
    }
    octx.putImageData(img, 0, 0);

    return {
      url: out.toDataURL('image/png'),
      tris: opaque.length + trans.length,
      meshes: meshes.length
    };
  };
})();
