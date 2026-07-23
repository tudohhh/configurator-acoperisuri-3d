import * as THREE from "three";

/* ============================================================
   GRADINA — copaci, iarba, gard, vant, mediu de reflexie.
   Se lipeste peste scena existenta cu O SINGURA linie:
       adaugaGradina(scene, renderer, L, W);
   Copacii se genereaza o singura data si se tin in cache, ca sa nu
   se reconstruiasca la fiecare miscare de slider.
   ============================================================ */

const srgb = (t) => {
  if ("colorSpace" in t) t.colorSpace = THREE.SRGBColorSpace;
  else t.encoding = THREE.sRGBEncoding;
  return t;
};

function rng(seed) {
  let s = seed >>> 0;
  return () => {
    s = (s * 1664525 + 1013904223) >>> 0;
    return s / 4294967296;
  };
}

/* ---------- vant, in shader ---------- */
const MAT_VANT = [];
function cuVant(mat, amp) {
  mat.onBeforeCompile = (sh) => {
    sh.uniforms.uTime = { value: 0 };
    sh.uniforms.uAmp = { value: amp };
    sh.vertexShader =
      "uniform float uTime;\nuniform float uAmp;\nattribute float aSway;\n" +
      sh.vertexShader.replace(
        "#include <begin_vertex>",
        `#include <begin_vertex>
         vec4 wp = modelMatrix * vec4(transformed, 1.0);
         float w = sin(uTime * 1.45 + wp.x * 0.40 + wp.z * 0.29)
                 + 0.42 * sin(uTime * 2.85 + wp.x * 0.93 - wp.z * 0.51);
         transformed.x += w * aSway * uAmp;
         transformed.z += w * aSway * uAmp * 0.5;`
      );
    mat.userData.sh = sh;
    MAT_VANT.push(mat);
  };
  return mat;
}

let ceasPornit = false;
function pornesteCeasul() {
  if (ceasPornit) return;
  ceasPornit = true;
  let t0 = performance.now();
  let t = 0;
  const pas = () => {
    const acum = performance.now();
    t += Math.min(0.05, (acum - t0) / 1000);
    t0 = acum;
    for (let i = MAT_VANT.length - 1; i >= 0; i--) {
      const sh = MAT_VANT[i].userData.sh;
      if (sh) sh.uniforms.uTime.value = t;
    }
    requestAnimationFrame(pas);
  };
  requestAnimationFrame(pas);
}

/* ---------- texturi ---------- */
function texturaFrunza(tip, seed) {
  const cv = document.createElement("canvas");
  cv.width = cv.height = 128;
  const x = cv.getContext("2d");
  const r = rng(seed);
  x.clearRect(0, 0, 128, 128);
  if (tip === "ace") {
    x.strokeStyle = "rgba(255,255,255,.95)";
    x.lineWidth = 2.6;
    x.beginPath();
    x.moveTo(64, 126);
    x.lineTo(64, 8);
    x.stroke();
    for (let i = 0; i < 34; i++) {
      const t = i / 34;
      const y = 124 - t * 112;
      const len = 30 * (1 - t * 0.55);
      for (const s of [-1, 1]) {
        x.strokeStyle = "rgba(255,255,255," + (0.62 + r() * 0.38) + ")";
        x.lineWidth = 1.5 + r() * 1.2;
        x.lineCap = "round";
        x.beginPath();
        x.moveTo(64, y);
        x.lineTo(64 + s * len * (0.7 + r() * 0.5), y + 8 + r() * 7);
        x.stroke();
      }
    }
  } else {
    x.strokeStyle = "rgba(255,255,255,.85)";
    x.lineWidth = 2.2;
    x.beginPath();
    x.moveTo(64, 126);
    x.quadraticCurveTo(70, 70, 64, 10);
    x.stroke();
    for (let i = 0; i < 7; i++) {
      const t = (i + 0.6) / 7.6;
      const y = 122 - t * 108;
      const s = i % 2 === 0 ? 1 : -1;
      const lung = 40 * (1 - t * 0.42) * (0.85 + r() * 0.3);
      const lat = lung * (0.44 + r() * 0.14);
      x.save();
      x.translate(64, y);
      x.rotate(s * (0.62 + r() * 0.3) + (r() - 0.5) * 0.2);
      x.fillStyle = "rgba(255,255,255," + (0.82 + r() * 0.18) + ")";
      x.beginPath();
      x.moveTo(0, 0);
      x.quadraticCurveTo(lat * 0.5, -lung * 0.34, 0, -lung);
      x.quadraticCurveTo(-lat * 0.5, -lung * 0.34, 0, 0);
      x.fill();
      x.strokeStyle = "rgba(0,0,0,.22)";
      x.lineWidth = 1;
      x.beginPath();
      x.moveTo(0, 0);
      x.lineTo(0, -lung * 0.92);
      x.stroke();
      x.restore();
    }
  }
  return new THREE.CanvasTexture(cv);
}

function texIarba() {
  const c = document.createElement("canvas");
  c.width = c.height = 128;
  const x = c.getContext("2d");
  x.clearRect(0, 0, 128, 128);
  for (let i = 0; i < 24; i++) {
    const x0 = 18 + Math.random() * 92;
    const h = 52 + Math.random() * 70;
    const lean = (Math.random() - 0.5) * 36;
    const w = 2.2 + Math.random() * 2.8;
    x.fillStyle = "rgba(255,255,255," + (0.5 + Math.random() * 0.5) + ")";
    x.beginPath();
    x.moveTo(x0 - w, 128);
    x.quadraticCurveTo(x0 - w * 0.4 + lean * 0.5, 128 - h * 0.55, x0 + lean, 128 - h);
    x.quadraticCurveTo(x0 + w * 0.6 + lean * 0.5, 128 - h * 0.5, x0 + w, 128);
    x.closePath();
    x.fill();
  }
  return new THREE.CanvasTexture(c);
}

function texContact() {
  const c = document.createElement("canvas");
  c.width = c.height = 256;
  const x = c.getContext("2d");
  const g = x.createRadialGradient(128, 128, 18, 128, 128, 128);
  g.addColorStop(0, "rgba(28,30,24,0.42)");
  g.addColorStop(0.6, "rgba(28,30,24,0.15)");
  g.addColorStop(1, "rgba(28,30,24,0)");
  x.fillStyle = g;
  x.fillRect(0, 0, 256, 256);
  return new THREE.CanvasTexture(c);
}


/* ---------- gazon: textura de detaliu, cusuta la margini ---------- */
function texGazon() {
  const S = 1024;
  const c = document.createElement("canvas");
  c.width = c.height = S;
  const x = c.getContext("2d");
  x.fillStyle = "#5b6944";
  x.fillRect(0, 0, S, S);

  const tonuri = ["#6d7c50", "#586740", "#77865c", "#4d5a36", "#7f8d64", "#657449", "#8a976f"];
  const fir = (px, py, ang, len, w, col) => {
    x.strokeStyle = col;
    x.lineWidth = w;
    x.lineCap = "round";
    x.beginPath();
    x.moveTo(px, py);
    x.lineTo(px + Math.cos(ang) * len, py + Math.sin(ang) * len);
    x.stroke();
  };

  // smocuri mari de umbra, ca sa nu fie covor uniform
  for (let i = 0; i < 260; i++) {
    const px = Math.random() * S, py = Math.random() * S;
    const rr = 22 + Math.random() * 80;
    const g = x.createRadialGradient(px, py, 0, px, py, rr);
    const inchis = Math.random() < 0.55;
    g.addColorStop(0, inchis ? "rgba(40,52,30,0.30)" : "rgba(160,175,125,0.22)");
    g.addColorStop(1, "rgba(0,0,0,0)");
    x.fillStyle = g;
    x.fillRect(px - rr, py - rr, rr * 2, rr * 2);
  }

  const N = 19000;
  for (let i = 0; i < N; i++) {
    const px = Math.random() * S, py = Math.random() * S;
    const ang = -Math.PI / 2 + (Math.random() - 0.5) * 1.7;
    const len = 5 + Math.random() * 12;
    const w = 0.9 + Math.random() * 1.7;
    const col = tonuri[(Math.random() * tonuri.length) | 0];
    // firele de langa margine se deseneaza si de partea cealalta,
    // ca textura sa se coasa fara custura vizibila
    if (px < 22 || px > S - 22 || py < 22 || py > S - 22) {
      for (const dx of [-S, 0, S])
        for (const dy of [-S, 0, S]) fir(px + dx, py + dy, ang, len, w, col);
    } else fir(px, py, ang, len, w, col);
  }

  const t = new THREE.CanvasTexture(c);
  t.wrapS = t.wrapT = THREE.RepeatWrapping;
  t.anisotropy = 16;
  return srgb(t);
}

/* ---------- macro-variatie: sparge repetitia dalei ---------- */
function texMacro() {
  const S = 256;
  const c = document.createElement("canvas");
  c.width = c.height = S;
  const x = c.getContext("2d");
  x.fillStyle = "#808080";
  x.fillRect(0, 0, S, S);
  for (let i = 0; i < 70; i++) {
    const px = Math.random() * S, py = Math.random() * S;
    const rr = 26 + Math.random() * 78;
    const v = 60 + Math.random() * 140;
    const g = x.createRadialGradient(px, py, 0, px, py, rr);
    g.addColorStop(0, `rgba(${v},${v},${v},0.55)`);
    g.addColorStop(1, "rgba(128,128,128,0)");
    x.fillStyle = g;
    for (const dx of [-S, 0, S])
      for (const dy of [-S, 0, S]) {
        x.save();
        x.translate(dx, dy);
        x.fillStyle = g;
        x.fillRect(px - rr, py - rr, rr * 2, rr * 2);
        x.restore();
      }
  }
  const t = new THREE.CanvasTexture(c);
  t.wrapS = t.wrapT = THREE.RepeatWrapping;
  return t;
}

/* ---------- solul: detaliu fin + macro + stingere spre orizont ---------- */
function faSol(latura) {
  const det = texGazon();
  det.repeat.set(latura / 3.2, latura / 3.2); // o dala la ~3.2 m
  const mac = texMacro();

  const mat = new THREE.MeshStandardMaterial({
    color: 0xffffff,
    map: det,
    roughness: 1,
    metalness: 0,
  });

  mat.onBeforeCompile = (sh) => {
    sh.uniforms.uMacro = { value: mac };
    sh.vertexShader =
      "varying vec3 vWPos;\n" +
      sh.vertexShader.replace(
        "#include <begin_vertex>",
        "#include <begin_vertex>\n  vWPos = (modelMatrix * vec4(transformed, 1.0)).xyz;"
      );
    sh.fragmentShader =
      "uniform sampler2D uMacro;\nvarying vec3 vWPos;\n" +
      sh.fragmentShader.replace(
        "#include <map_fragment>",
        `#include <map_fragment>
         // pete mari de culoare, la alta scara decat dala: fara ele se vede
         // grila repetata de la 20 m in sus
         vec3 mac = texture2D(uMacro, vWPos.xz * 0.0075).rgb;
         diffuseColor.rgb *= (0.62 + mac * 0.78);
         // spre orizont totul se stinge in ceata; asa dispare si repetitia
         float dOriz = length(vWPos.xz);
         diffuseColor.rgb = mix(diffuseColor.rgb, vec3(0.575, 0.60, 0.545),
                                smoothstep(45.0, 200.0, dOriz));`
      );
    mat.userData.sh = sh;
  };

  const m = new THREE.Mesh(new THREE.PlaneGeometry(latura, latura), mat);
  m.rotation.x = -Math.PI / 2;
  m.position.y = 0.004; // peste terenul existent, sub platforma si alee
  m.receiveShadow = true;
  return m;
}

/* ---------- generator de copac: intoarce ARRAYS, nu obiecte 3D ---------- */
function generaCopac(p, seed) {
  const r = rng(seed);
  const H = p.inaltime * (0.88 + r() * 0.24);
  const umbra = p.umbrire;
  const ace = p.tip === "brad";
  const SUS = new THREE.Vector3(0, 1, 0);
  const OX = new THREE.Vector3(1, 0, 0);
  const UNU = new THREE.Vector3(1, 1, 1);

  const B = { pos: [], nor: [], idx: [], n: 0 };
  const tub = (a, b, ra, rb, lat) => {
    const d = new THREE.Vector3().subVectors(b, a);
    const len = d.length();
    if (len < 1e-4) return;
    const geo = new THREE.CylinderGeometry(rb, ra, len, lat, 1, true);
    const q = new THREE.Quaternion().setFromUnitVectors(SUS, d.clone().normalize());
    geo.applyMatrix4(new THREE.Matrix4().compose(a.clone().addScaledVector(d, 0.5), q, UNU));
    const gp = geo.attributes.position,
      gn = geo.attributes.normal,
      gi = geo.index;
    for (let i = 0; i < gp.count; i++) {
      B.pos.push(gp.getX(i), gp.getY(i), gp.getZ(i));
      B.nor.push(gn.getX(i), gn.getY(i), gn.getZ(i));
    }
    for (let i = 0; i < gi.count; i++) B.idx.push(gi.getX(i) + B.n);
    B.n += gp.count;
    geo.dispose();
  };

  const abate = (dir, unghi, rol) => {
    const ref = Math.abs(dir.y) > 0.92 ? OX : SUS;
    const u = new THREE.Vector3().crossVectors(dir, ref).normalize();
    const v = new THREE.Vector3().crossVectors(dir, u).normalize();
    const ax = u.multiplyScalar(Math.cos(rol)).addScaledVector(v, Math.sin(rol)).normalize();
    return dir.clone().applyAxisAngle(ax, unghi).normalize();
  };

  const S = ace
    ? { unghi: 1.32, apical: 0.86, copii: 1, gravit: -0.16, scurt: 0.9 }
    : p.tip === "plop"
    ? { unghi: 0.34, apical: 0.7, copii: 2, gravit: 0.42, scurt: 0.74 }
    : p.tip === "tufa"
    ? { unghi: 0.66, apical: 0.62, copii: 2, gravit: 0.12, scurt: 0.7 }
    : { unghi: 0.62, apical: 0.66, copii: 2, gravit: 0.2, scurt: 0.74 };

  const desch = p.deschidere * (Math.PI / 180);
  const varfuri = [];

  const creste = (a, dir, len, radius, ad) => {
    const b = a.clone().addScaledVector(dir, len);
    tub(a, b, radius, radius * 0.7, ad > 2 ? 7 : 5);
    if (ad <= 0 || len < H * 0.035) {
      varfuri.push({ p: b, d: dir.clone(), s: len });
      return;
    }
    const n = S.copii + (r() < 0.35 ? 1 : 0);
    const dP = abate(dir, desch * 0.22 * (0.5 + r()), r() * 6.283).lerp(SUS, S.gravit * 0.35).normalize();
    creste(b, dP, len * S.apical, radius * 0.74, ad - 1);
    for (let i = 0; i < n; i++) {
      const rol = (i / n) * 6.283 + r() * 1.4;
      const d2 = abate(dir, desch * S.unghi * (0.7 + r() * 0.6), rol)
        .lerp(SUS, S.gravit * (0.25 + r() * 0.3))
        .normalize();
      creste(b, d2, len * S.scurt * (0.82 + r() * 0.3), radius * 0.6, ad - 1);
    }
  };

  const niv = Math.round(p.ramificatii);
  const rad0 = p.grosime;

  if (ace) {
    const pasi = 8;
    let a = new THREE.Vector3(0, 0, 0);
    for (let i = 0; i < pasi; i++) {
      const t = i / pasi;
      const b = new THREE.Vector3((r() - 0.5) * rad0, ((i + 1) / pasi) * H, (r() - 0.5) * rad0);
      tub(a, b, rad0 * (1 - t * 0.85), rad0 * (1 - (t + 1 / pasi) * 0.85), 7);
      if (i > 0) {
        const nr = 4 + Math.round(r() * 2);
        for (let k = 0; k < nr; k++) {
          const rol = (k / nr) * 6.283 + i * 1.1;
          const d = abate(SUS, 1.18 + r() * 0.25, rol).normalize();
          const lg = p.latime * Math.pow(1 - t, 0.85) * (0.75 + r() * 0.45);
          creste(a.clone(), d, lg * 0.55, rad0 * 0.3 * (1 - t * 0.6), Math.max(1, niv - 2));
        }
      }
      a = b;
    }
    varfuri.push({ p: a.clone(), d: SUS.clone(), s: H * 0.05 });
  } else if (p.tip === "tufa") {
    const nT = 4 + Math.round(r() * 2);
    for (let i = 0; i < nT; i++) {
      const rol = (i / nT) * 6.283 + r();
      const d = abate(SUS, 0.3 + r() * 0.35, rol).normalize();
      creste(new THREE.Vector3((r() - 0.5) * 0.2, 0, (r() - 0.5) * 0.2), d, H * 0.34, rad0, niv);
    }
  } else {
    const hT = H * (p.tip === "plop" ? 0.3 : 0.34);
    tub(new THREE.Vector3(0, 0, 0), new THREE.Vector3((r() - 0.5) * 0.12, hT, (r() - 0.5) * 0.12), rad0 * 1.55, rad0, 9);
    creste(new THREE.Vector3(0, hT, 0), SUS.clone(), H * 0.3, rad0, niv);
  }

  // cutia de incadrare a lemnului, pentru gradientul de umbrire
  let minY = Infinity, maxY = -Infinity, cx = 0, cy = 0, cz = 0;
  for (let i = 0; i < B.pos.length; i += 3) {
    const y = B.pos[i + 1];
    if (y < minY) minY = y;
    if (y > maxY) maxY = y;
    cx += B.pos[i];
    cy += y;
    cz += B.pos[i + 2];
  }
  const nv = B.pos.length / 3;
  const centru = new THREE.Vector3(cx / nv, cy / nv, cz / nv);
  const yJos = minY + (maxY - minY) * 0.12;
  const ySus = maxY;

  const L = { pos: [], nor: [], uv: [], col: [], sw: [], idx: [], n: 0 };
  const xr = new THREE.Vector3(), zr = new THREE.Vector3(), nn = new THREE.Vector3();
  const vv = new THREE.Vector3(), ax2 = new THREE.Vector3();

  const frunza = (c, dir, marime) => {
    const y = dir.clone().normalize();
    const ref = Math.abs(y.y) > 0.92 ? OX : SUS;
    xr.crossVectors(ref, y).normalize();
    zr.crossVectors(xr, y).normalize();
    const rol = r() * 6.283;
    ax2.copy(xr).multiplyScalar(Math.cos(rol)).addScaledVector(zr, Math.sin(rol)).normalize();
    const nz = new THREE.Vector3().crossVectors(ax2, y).normalize();
    nn.copy(c).sub(centru).normalize().addScaledVector(SUS, 0.45).normalize();
    nn.lerp(nz, 0.35).normalize();
    const w = marime * 0.5, h = marime;
    const col = [[-w, 0, 0], [w, 0, 0], [w, h, 0], [-w, h, 0]];
    for (let i = 0; i < 4; i++) {
      vv.set(0, 0, 0)
        .addScaledVector(ax2, col[i][0])
        .addScaledVector(y, col[i][1])
        .addScaledVector(nz, col[i][2])
        .add(c);
      L.pos.push(vv.x, vv.y, vv.z);
      L.nor.push(nn.x, nn.y, nn.z);
      let t = (vv.y - yJos) / Math.max(0.001, ySus - yJos);
      t = t < 0 ? 0 : t > 1 ? 1 : t;
      const k = 1 - umbra + umbra * Math.pow(t, 0.75);
      L.col.push(k * (0.9 + 0.2 * t), k, k * (1.02 - 0.16 * t));
      L.sw.push(t * t);
    }
    L.uv.push(0, 0, 1, 0, 1, 1, 0, 1);
    L.idx.push(L.n, L.n + 1, L.n + 2, L.n, L.n + 2, L.n + 3);
    L.n += 4;
  };

  const perVarf = Math.max(1, Math.round(p.frunzePerVarf));
  for (const v of varfuri)
    for (let i = 0; i < perVarf; i++) {
      const dep = v.d.clone().addScaledVector(SUS, -0.5 - r() * 0.6).normalize();
      const c = v.p
        .clone()
        .addScaledVector(v.d, -v.s * r() * 0.75)
        .add(new THREE.Vector3((r() - 0.5) * v.s * 0.5, (r() - 0.5) * v.s * 0.4, (r() - 0.5) * v.s * 0.5));
      frunza(c, dep, p.marimeFrunza * (0.75 + r() * 0.55));
    }

  return {
    lemn: {
      pos: new Float32Array(B.pos),
      nor: new Float32Array(B.nor),
      idx: new Uint32Array(B.idx),
    },
    frunze: {
      pos: new Float32Array(L.pos),
      nor: new Float32Array(L.nor),
      uv: new Float32Array(L.uv),
      col: new Float32Array(L.col),
      sw: new Float32Array(L.sw),
      idx: new Uint32Array(L.idx),
    },
    ace,
  };
}

/* ---------- specii si compozitie ---------- */
const SPECII = {
  Fag: { tip: "foios", inaltime: 5.5, latime: 1.8, grosime: 0.16, ramificatii: 5, deschidere: 42, umbrire: 0.55, frunzePerVarf: 4, marimeFrunza: 0.42, culoareFrunze: "#6d7d54", culoareTrunchi: "#6b5a48", variatieCuloare: 0.06 },
  Brad: { tip: "brad", inaltime: 7, latime: 1.7, grosime: 0.13, ramificatii: 5, deschidere: 42, umbrire: 0.55, frunzePerVarf: 4, marimeFrunza: 0.34, culoareFrunze: "#3c4a3a", culoareTrunchi: "#4a3c30", variatieCuloare: 0.05 },
  Plop: { tip: "plop", inaltime: 9, latime: 1.1, grosime: 0.15, ramificatii: 5, deschidere: 30, umbrire: 0.55, frunzePerVarf: 4, marimeFrunza: 0.36, culoareFrunze: "#78875e", culoareTrunchi: "#7a6a55", variatieCuloare: 0.07 },
  Tufa: { tip: "tufa", inaltime: 1.6, latime: 0.9, grosime: 0.1, ramificatii: 4, deschidere: 55, umbrire: 0.55, frunzePerVarf: 5, marimeFrunza: 0.26, culoareFrunze: "#5f6e4c", culoareTrunchi: "#5a4a3a", variatieCuloare: 0.09 },
};

// Soarele: key la (L*1.7, ..., W*0.3) => elevatie ~34 grade, umbrele cad spre -X.
// De aceea masa e pe -X: acolo umbrele pleaca DE LA casa, nu peste acoperis.
const COMPOZITIE = [
  { specie: "Plop", x: -9.5, z: -8, scara: 1, rot: 0.4, seed: 2141 },
  { specie: "Brad", x: -13, z: -12.5, scara: 0.9, rot: 1.2, seed: 3312 },
  { specie: "Fag", x: -11.5, z: -4.5, scara: 0.75, rot: 2.1, seed: 5518 },
  { specie: "Fag", x: -10.5, z: 6.5, scara: 1.1, rot: 0.9, seed: 7734 },
  { specie: "Fag", x: -13.2, z: 9.5, scara: 0.62, rot: 3.4, seed: 1287 },
  { specie: "Tufa", x: -7.9, z: 6.5, scara: 1, rot: 0.2, seed: 9021 },
  { specie: "Fag", x: 12.5, z: 8, scara: 0.85, rot: 1.7, seed: 4460 },
  { specie: "Tufa", x: 7.6, z: 6.3, scara: 1, rot: 2.6, seed: 6103 },
  { specie: "Fag", x: 13.5, z: -9, scara: 0.7, rot: 4.2, seed: 8875 },
  { specie: "Tufa", x: 8.2, z: -6.6, scara: 0.9, rot: 5.1, seed: 2298 },
  { specie: "Tufa", x: -3.7, z: 7.2, scara: 0.85, rot: 1.1, seed: 3741 },
  { specie: "Tufa", x: -0.7, z: 8.8, scara: 0.7, rot: 4.8, seed: 5960 },
  { specie: "Tufa", x: -3.9, z: 11, scara: 1, rot: 2.2, seed: 7182 },
];

/* ---------- iarba ---------- */
function geoIarba(L, W, dens, seed) {
  const r = rng(seed);
  const A = { pos: [], nor: [], uv: [], col: [], sw: [], idx: [], n: 0 };
  const fx = L / 2 + 11 - 0.55, fz = W / 2 + 10 - 0.55;
  const px = (L + 3.9) / 2 + 0.3, pz = (W + 3.9) / 2 + 0.3;
  const ax = -L / 5, az0 = W / 2 + 1.4, az1 = W / 2 + 9;
  const pas = Math.max(0.3, Math.sqrt((4 * fx * fz) / Math.max(250, dens)));

  for (let gx = -fx; gx <= fx; gx += pas) {
    for (let gz = -fz; gz <= fz; gz += pas) {
      const jx = gx + (r() - 0.5) * pas * 0.9;
      const jz = gz + (r() - 0.5) * pas * 0.9;
      if (Math.abs(jx) > fx || Math.abs(jz) > fz) continue;
      if (Math.abs(jx) < px && Math.abs(jz) < pz) continue;
      if (Math.abs(jx - ax) < 1.15 && jz > az0 && jz < az1) continue;
      const marg = Math.max(Math.abs(jx) / fx, Math.abs(jz) / fz);
      const hb = (0.075 + r() * 0.05) * (1 + Math.pow(marg, 5) * 2.4);
      const d = Math.hypot(jx, jz);
      const cet = Math.min(0.3, Math.max(0, (d - 9) / 44));
      for (let q = 0; q < 2; q++) {
        const ang = r() * Math.PI;
        const wq = (0.15 + r() * 0.1) * 0.5;
        const dx = Math.cos(ang) * wq, dz = Math.sin(ang) * wq;
        const cx = jx + (r() - 0.5) * pas * 0.3, cz = jz + (r() - 0.5) * pas * 0.3;
        const h = hb * (0.78 + r() * 0.44);
        const cor = [[cx - dx, 0, cz - dz], [cx + dx, 0, cz + dz], [cx + dx, h, cz + dz], [cx - dx, h, cz - dz]];
        const sw = [0, 0, 1, 1];
        const uvs = [0, 0, 1, 0, 1, 1, 0, 1];
        for (let k = 0; k < 4; k++) {
          A.pos.push(cor[k][0], cor[k][1], cor[k][2]);
          A.nor.push(0, 1, 0);
          A.uv.push(uvs[k * 2], uvs[k * 2 + 1]);
          const t = sw[k];
          const b = 0.62 + t * 0.46;
          A.col.push(b + cet * 0.4, b + cet * 0.38, b + cet * 0.35);
          A.sw.push(t);
        }
        A.idx.push(A.n, A.n + 1, A.n + 2, A.n, A.n + 2, A.n + 3);
        A.n += 4;
      }
    }
  }
  const g = new THREE.BufferGeometry();
  g.setAttribute("position", new THREE.Float32BufferAttribute(A.pos, 3));
  g.setAttribute("normal", new THREE.Float32BufferAttribute(A.nor, 3));
  g.setAttribute("uv", new THREE.Float32BufferAttribute(A.uv, 2));
  g.setAttribute("color", new THREE.Float32BufferAttribute(A.col, 3));
  g.setAttribute("aSway", new THREE.Float32BufferAttribute(A.sw, 1));
  g.setIndex(A.idx);
  return g;
}

/* ---------- gard de casa: soclu + stalpi + sipca verticala ---------- */
function geoGard(L, W, seed) {
  const r = rng(seed);
  const mk = () => ({ pos: [], nor: [], idx: [], n: 0 });
  const ZID = mk(), CAP = mk(), SIP = mk();
  const q = new THREE.Quaternion(), e = new THREE.Euler(), unu = new THREE.Vector3(1, 1, 1);
  const cutie = (A, w, h, d, x, y, z, ry) => {
    const g = new THREE.BoxGeometry(w, h, d);
    e.set(0, ry, 0);
    q.setFromEuler(e);
    g.applyMatrix4(new THREE.Matrix4().compose(new THREE.Vector3(x, y, z), q, unu));
    const gp = g.attributes.position, gn = g.attributes.normal, gi = g.index;
    for (let i = 0; i < gp.count; i++) {
      A.pos.push(gp.getX(i), gp.getY(i), gp.getZ(i));
      A.nor.push(gn.getX(i), gn.getY(i), gn.getZ(i));
    }
    for (let i = 0; i < gi.count; i++) A.idx.push(gi.getX(i) + A.n);
    A.n += gp.count;
    g.dispose();
  };

  const fx = L / 2 + 11, fz = W / 2 + 10;
  const poarta = -L / 5, latPoarta = 3.4;
  const hSoclu = 0.44, hStalp = 1.62, hSipca = 1.06;

  const latura = (ax, az, bx, bz, gap) => {
    const dx = bx - ax, dz = bz - az;
    const ry = Math.atan2(dx, dz);
    const seg =
      gap === null || Math.abs(dx) < 0.01
        ? [[0, 1]]
        : [[0, (gap - latPoarta / 2 - ax) / dx], [(gap + latPoarta / 2 - ax) / dx, 1]];
    for (const [t0, t1] of seg) {
      if (!(t1 > t0)) continue;
      const sx = ax + dx * t0, sz = az + dz * t0;
      const ex = ax + dx * t1, ez = az + dz * t1;
      const sl = Math.hypot(ex - sx, ez - sz);
      if (sl < 0.5) continue;
      const ux = (ex - sx) / sl, uz = (ez - sz) / sl;

      cutie(ZID, 0.28, hSoclu, sl, (sx + ex) / 2, hSoclu / 2, (sz + ez) / 2, ry);
      cutie(CAP, 0.34, 0.05, sl, (sx + ex) / 2, hSoclu + 0.02, (sz + ez) / 2, ry);

      const n = Math.max(1, Math.round(sl / 2.7));
      for (let i = 0; i <= n; i++) {
        const t = i / n;
        const x = sx + (ex - sx) * t, z = sz + (ez - sz) * t;
        cutie(ZID, 0.36, hStalp, 0.36, x, hStalp / 2, z, ry);
        cutie(CAP, 0.46, 0.08, 0.46, x, hStalp + 0.04, z, ry);
      }

      for (let i = 0; i < n; i++) {
        const d0 = (sl / n) * i + 0.26;
        const d1 = (sl / n) * (i + 1) - 0.26;
        for (let d = d0; d < d1; d += 0.135)
          cutie(SIP, 0.05, hSipca, 0.05, sx + ux * d, hSoclu + hSipca / 2 + 0.02, sz + uz * d, ry);
        const mid = (sl / n) * (i + 0.5);
        cutie(SIP, 0.06, 0.07, sl / n - 0.5, sx + ux * mid, hSoclu + hSipca - 0.04, sz + uz * mid, ry);
      }
    }
  };

  latura(-fx, -fz, fx, -fz, null);
  latura(-fx, fz, fx, fz, poarta);
  latura(-fx, -fz, -fx, fz, null);
  latura(fx, -fz, fx, fz, null);

  const fa = (A) => {
    const g = new THREE.BufferGeometry();
    g.setAttribute("position", new THREE.Float32BufferAttribute(A.pos, 3));
    g.setAttribute("normal", new THREE.Float32BufferAttribute(A.nor, 3));
    g.setIndex(A.idx);
    return g;
  };
  return { zid: fa(ZID), cap: fa(CAP), sipci: fa(SIP) };
}

/* ---------- mediu de reflexie ---------- */
let ENV = null;
function mediu(renderer) {
  if (ENV) return ENV;
  const ec = document.createElement("canvas");
  ec.width = 1024;
  ec.height = 512;
  const x = ec.getContext("2d");
  const g = x.createLinearGradient(0, 0, 0, 512);
  g.addColorStop(0, "#79aed6");
  g.addColorStop(0.42, "#cfe0e9");
  g.addColorStop(0.5, "#e8e4d8");
  g.addColorStop(0.53, "#96a184");
  g.addColorStop(1, "#5d6752");
  x.fillStyle = g;
  x.fillRect(0, 0, 1024, 512);
  const sun = x.createRadialGradient(772, 148, 6, 772, 148, 130);
  sun.addColorStop(0, "rgba(255,247,226,1)");
  sun.addColorStop(0.35, "rgba(255,242,214,0.45)");
  sun.addColorStop(1, "rgba(255,242,214,0)");
  x.fillStyle = sun;
  x.fillRect(600, 0, 350, 300);
  for (let i = 0; i < 22; i++) {
    x.fillStyle = "rgba(255,255,255,0.16)";
    x.beginPath();
    x.ellipse(Math.random() * 1024, 60 + Math.random() * 150, 40 + Math.random() * 90, 9 + Math.random() * 16, 0, 0, 6.283);
    x.fill();
  }
  const t = new THREE.CanvasTexture(ec);
  t.mapping = THREE.EquirectangularReflectionMapping;
  try {
    const pm = new THREE.PMREMGenerator(renderer);
    pm.compileEquirectangularShader();
    ENV = pm.fromEquirectangular(t).texture;
    pm.dispose();
  } catch (err) {
    ENV = t;
  }
  return ENV;
}

/* ---------- cache ---------- */
let CACHE_COPACI = null;
let CACHE_IARBA = null;
let CACHE_GARD = null;
let TEX = null;

function texturi() {
  if (!TEX)
    TEX = {
      lat: texturaFrunza("lat", 131),
      ace: texturaFrunza("ace", 977),
      iarba: texIarba(),
      contact: texContact(),
    };
  return TEX;
}

/* ============================================================
   API
   ============================================================ */
export function adaugaGradina(scene, renderer, L, W, optiuni = {}) {
  const o = Object.assign(
    { copaci: true, iarba: true, gard: true, sol: true, densIarba: 3500, latSol: 400, envMap: true },
    optiuni
  );
  const T = texturi();
  const grup = new THREE.Group();
  grup.name = "gradina";

  if (o.envMap && renderer) scene.environment = mediu(renderer);

  /* --- solul --- */
  if (o.sol) grup.add(faSol(o.latSol));

  /* --- copaci --- */
  if (o.copaci) {
    if (!CACHE_COPACI) {
      CACHE_COPACI = COMPOZITIE.map((c) => {
        const par = Object.assign({}, SPECII[c.specie]);
        par.inaltime *= c.scara;
        par.latime *= c.scara;
        par.grosime *= c.scara;
        par.marimeFrunza *= Math.sqrt(c.scara);
        // perspectiva aeriana falsa: ceata reala incepe la 55 m, deci nimic
        // din curte n-o atinge si scena s-ar aplatiza
        const d = Math.hypot(c.x, c.z);
        const cet = Math.min(0.28, Math.max(0, (d - 6) / 38));
        const cf = new THREE.Color(par.culoareFrunze).lerp(new THREE.Color("#e6eae7"), cet);
        return Object.assign({}, c, {
          date: generaCopac(par, c.seed),
          culoareFrunze: cf.getHex(),
          culoareTrunchi: new THREE.Color(par.culoareTrunchi).getHex(),
          razaDisc: SPECII[c.specie].latime * c.scara * 2.6,
        });
      });
    }

    for (const c of CACHE_COPACI) {
      const g = new THREE.Group();

      const gl = new THREE.BufferGeometry();
      gl.setAttribute("position", new THREE.BufferAttribute(c.date.lemn.pos, 3));
      gl.setAttribute("normal", new THREE.BufferAttribute(c.date.lemn.nor, 3));
      gl.setIndex(new THREE.BufferAttribute(c.date.lemn.idx, 1));
      const lemn = new THREE.Mesh(
        gl,
        new THREE.MeshStandardMaterial({ color: c.culoareTrunchi, roughness: 0.95 })
      );
      lemn.castShadow = true;
      lemn.receiveShadow = true;
      g.add(lemn);

      const gf = new THREE.BufferGeometry();
      gf.setAttribute("position", new THREE.BufferAttribute(c.date.frunze.pos, 3));
      gf.setAttribute("normal", new THREE.BufferAttribute(c.date.frunze.nor, 3));
      gf.setAttribute("uv", new THREE.BufferAttribute(c.date.frunze.uv, 2));
      gf.setAttribute("color", new THREE.BufferAttribute(c.date.frunze.col, 3));
      gf.setAttribute("aSway", new THREE.BufferAttribute(c.date.frunze.sw, 1));
      gf.setIndex(new THREE.BufferAttribute(c.date.frunze.idx, 1));
      const tex = c.date.ace ? T.ace : T.lat;
      const frunze = new THREE.Mesh(
        gf,
        cuVant(
          new THREE.MeshStandardMaterial({
            color: c.culoareFrunze,
            map: tex,
            alphaMap: tex,
            alphaTest: 0.4,
            side: THREE.DoubleSide,
            roughness: 0.92,
            vertexColors: true,
          }),
          0.05
        )
      );
      frunze.castShadow = true;
      frunze.receiveShadow = true;
      g.add(frunze);

      // disc de contact propriu: umbra generala a casei acopera doar L+5 x W+5
      const disc = new THREE.Mesh(
        new THREE.PlaneGeometry(1, 1),
        new THREE.MeshBasicMaterial({ map: T.contact, transparent: true, depthWrite: false, opacity: 0.7 })
      );
      disc.rotation.x = -Math.PI / 2;
      disc.position.y = 0.03;
      disc.scale.set(c.razaDisc, c.razaDisc, 1);
      g.add(disc);

      g.position.set(c.x, 0, c.z);
      g.rotation.y = c.rot;
      grup.add(g);
    }
  }

  /* --- iarba --- */
  if (o.iarba) {
    const cheie = L + "x" + W + "x" + o.densIarba;
    if (!CACHE_IARBA || CACHE_IARBA.cheie !== cheie)
      CACHE_IARBA = { cheie, geo: geoIarba(L, W, o.densIarba, 4242) };
    const m = new THREE.Mesh(
      CACHE_IARBA.geo,
      cuVant(
        new THREE.MeshStandardMaterial({
          color: "#6f7f57",
          map: T.iarba,
          alphaMap: T.iarba,
          alphaTest: 0.35,
          side: THREE.DoubleSide,
          roughness: 1,
          vertexColors: true,
        }),
        0.075
      )
    );
    m.receiveShadow = true;
    grup.add(m);
  }

  /* --- gard --- */
  if (o.gard) {
    const cheie = L + "x" + W;
    if (!CACHE_GARD || CACHE_GARD.cheie !== cheie) CACHE_GARD = { cheie, geo: geoGard(L, W, 88) };
    const pune = (geo, mat) => {
      const m = new THREE.Mesh(geo, mat);
      m.castShadow = true;
      m.receiveShadow = true;
      grup.add(m);
    };
    pune(CACHE_GARD.geo.zid, new THREE.MeshStandardMaterial({ color: "#ebe5da", roughness: 0.9 }));
    pune(CACHE_GARD.geo.cap, new THREE.MeshStandardMaterial({ color: "#4a453e", roughness: 0.75 }));
    pune(CACHE_GARD.geo.sipci, new THREE.MeshStandardMaterial({ color: "#33352f", roughness: 0.42, metalness: 0.55 }));
  }

  scene.add(grup);
  pornesteCeasul();

  // Frustumul umbrelor din scena acopera doar +/-15 m, deci copacii de la
  // marginea curtii n-ar arunca nicio umbra. Il largim aici, ca sa nu fie
  // nevoie de nicio modificare in Scena3D.jsx.
  requestAnimationFrame(() => {
    scene.traverse((n) => {
      if (n.isDirectionalLight && n.castShadow && n.shadow) {
        const c = n.shadow.camera;
        const need = Math.max(L, W) * 1.5 + 18;
        if (c.right < need) {
          c.left = -need;
          c.right = need;
          c.top = need;
          c.bottom = -need;
          c.far = Math.max(c.far, 140);
          c.updateProjectionMatrix();
        }
      }
    });
  });

  return grup;
}

export { SPECII, COMPOZITIE };
