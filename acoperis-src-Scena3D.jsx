// BACKUP 20.07.2026 — src/Scena3D.jsx FINAL (configurator acoperis v1)
// Include: texturi procedurale+bump, sRGB, UV pe linia pantei, ocluzie
// streasina, pazii+hip ridges, horn, lumina laterala ierarhizata, vigneta.
// Structura proiect: vezi acoperis-REPRODUCERE.txt
import React, { useRef, useEffect } from "react";
import * as THREE from "three";
import { CONFIG_ACOPERIS as C } from "../config/CONFIG.js";

const rad = g => (g * Math.PI) / 180;
const srgb = t => { if ("colorSpace" in t) t.colorSpace = THREE.SRGBColorSpace; else t.encoding = THREE.sRGBEncoding; return t; };

function meshTri(tris, mat, uvScale = 0.55) {
  const pos = new Float32Array(tris.flat(2));
  const g = new THREE.BufferGeometry();
  g.setAttribute("position", new THREE.BufferAttribute(pos, 3));
  const uv = new Float32Array((pos.length / 3) * 2);
  for (let tI = 0; tI < pos.length; tI += 9) {
    const p = k => new THREE.Vector3(pos[tI + k * 3], pos[tI + k * 3 + 1], pos[tI + k * 3 + 2]);
    const a = p(0), b2 = p(1), c2 = p(2);
    const n = b2.clone().sub(a).cross(c2.clone().sub(a)).normalize();
    let down = new THREE.Vector3(0, -1, 0).sub(n.clone().multiplyScalar(-n.y)).normalize();
    if (!isFinite(down.x) || down.lengthSq() < 1e-6) down = new THREE.Vector3(1, 0, 0);
    const along = down.clone().cross(n).normalize();
    for (let k = 0; k < 3; k++) {
      const P = p(k), j = ((tI / 9) * 3 + k) * 2;
      uv[j] = P.dot(along) * uvScale; uv[j + 1] = P.dot(down) * uvScale;
    }
  }
  g.setAttribute("uv", new THREE.BufferAttribute(uv, 2));
  g.computeVertexNormals();
  const m = new THREE.Mesh(g, mat);
  m.castShadow = true; m.receiveShadow = true;
  return m;
}

function shade(hex, f) {
  const n = parseInt(hex.slice(1), 16), r = Math.min(255, ((n >> 16) & 255) * f), g = Math.min(255, ((n >> 8) & 255) * f), b = Math.min(255, (n & 255) * f);
  return `rgb(${r | 0},${g | 0},${b | 0})`;
}

function texInvelitoare(hex, tip) {  // returneaza {map,bump}
  const c = document.createElement("canvas"); c.width = c.height = 512;
  const x = c.getContext("2d");
  const gr = x.createLinearGradient(0, 0, 0, 512);
  gr.addColorStop(0, shade(hex, 1.06)); gr.addColorStop(1, shade(hex, 0.94));
  x.fillStyle = gr; x.fillRect(0, 0, 512, 512);
  if (tip === "tabla") {
    for (let px = 0; px < 512; px += 32) {
      x.fillStyle = "rgba(0,0,0,0.42)"; x.fillRect(px, 0, 3, 512);
      x.fillStyle = "rgba(255,255,255,0.16)"; x.fillRect(px + 3, 0, 2, 512);
      x.fillStyle = "rgba(255,255,255,0.045)"; x.fillRect(px + 16, 0, 8, 512);
    }
  } else {
    for (let py = 0; py < 512; py += 26) {
      x.fillStyle = "rgba(0,0,0,0.45)"; x.fillRect(0, py, 512, 3);
      x.fillStyle = "rgba(255,255,255,0.14)"; x.fillRect(0, py + 3, 512, 2);
      for (let px = ((py / 26) % 2) * 22; px < 512; px += 44) {
        x.fillStyle = "rgba(0,0,0,0.10)"; x.fillRect(px, py + 3, 2, 23);
      }
    }
  }
  for (let i = 0; i < 900; i++) {
    x.fillStyle = Math.random() > 0.5 ? "rgba(255,255,255,0.025)" : "rgba(0,0,0,0.03)";
    x.fillRect(Math.random() * 512, Math.random() * 512, 1 + Math.random() * 2, 1 + Math.random() * 2);
  }
  const t = new THREE.CanvasTexture(c);
  t.wrapS = t.wrapT = THREE.RepeatWrapping; t.anisotropy = 8;
  const b = document.createElement("canvas"); b.width = b.height = 512;
  const bx = b.getContext("2d");
  bx.fillStyle = "#808080"; bx.fillRect(0, 0, 512, 512);
  if (tip === "tabla") {
    for (let px = 0; px < 512; px += 32) { bx.fillStyle = "#ffffff"; bx.fillRect(px, 0, 5, 512); }
  } else {
    for (let py = 0; py < 512; py += 26) { bx.fillStyle = "#ffffff"; bx.fillRect(0, py, 512, 5); bx.fillStyle = "#5a5a5a"; bx.fillRect(0, py + 20, 512, 6); }
  }
  const bt = new THREE.CanvasTexture(b);
  bt.wrapS = bt.wrapT = THREE.RepeatWrapping; bt.anisotropy = 8;
  return { map: srgb(t), bump: bt };
}

function texTeren() {
  const c = document.createElement("canvas"); c.width = c.height = 512;
  const x = c.getContext("2d");
  x.fillStyle = "#87927a"; x.fillRect(0, 0, 512, 512);
  for (let i = 0; i < 2200; i++) {
    x.fillStyle = ["#7d8a6f", "#8f9a80", "#79856d", "#93a086"][i % 4];
    x.globalAlpha = 0.25;
    x.fillRect(Math.random() * 512, Math.random() * 512, 2 + Math.random() * 8, 2 + Math.random() * 5);
  }
  x.globalAlpha = 1;
  const t = new THREE.CanvasTexture(c);
  t.wrapS = t.wrapT = THREE.RepeatWrapping; t.repeat.set(20, 20); t.anisotropy = 8;
  return srgb(t);
}

function texCer() {
  const c = document.createElement("canvas"); c.width = 16; c.height = 512;
  const x = c.getContext("2d");
  const g = x.createLinearGradient(0, 0, 0, 512);
  g.addColorStop(0, "#a9c3d4"); g.addColorStop(0.55, "#cfdde6"); g.addColorStop(1, "#e9ecea");
  x.fillStyle = g; x.fillRect(0, 0, 16, 512);
  const h = x.createRadialGradient(13, 130, 5, 13, 130, 260);
  h.addColorStop(0, "rgba(255,238,205,0.55)"); h.addColorStop(1, "rgba(255,238,205,0)");
  x.fillStyle = h; x.fillRect(0, 0, 16, 512);
  return srgb(new THREE.CanvasTexture(c));
}

function umbraContact() {
  const c = document.createElement("canvas"); c.width = c.height = 256;
  const x = c.getContext("2d");
  const g = x.createRadialGradient(128, 128, 20, 128, 128, 128);
  g.addColorStop(0, "rgba(30,32,26,0.38)"); g.addColorStop(0.6, "rgba(30,32,26,0.14)"); g.addColorStop(1, "rgba(30,32,26,0)");
  x.fillStyle = g; x.fillRect(0, 0, 256, 256);
  return new THREE.CanvasTexture(c);
}

export default function Scena3D({ cfg }) {
  const mount = useRef(null);
  useEffect(() => {
    const el = mount.current, Wpx = el.clientWidth, Hpx = el.clientHeight;
    const { lungime: L, latime: W, panta, tip, material } = cfg;
    const hz = 2.8, ov = 0.5;
    const hRoof = (W / 2) * Math.tan(rad(panta));

    const scene = new THREE.Scene();
    const cam = new THREE.PerspectiveCamera(38, Wpx / Hpx, 0.1, 400);
    const rnd = new THREE.WebGLRenderer({ antialias: true });
    rnd.setPixelRatio(Math.min(window.devicePixelRatio, 2)); rnd.setSize(Wpx, Hpx);
    rnd.shadowMap.enabled = true; rnd.shadowMap.type = THREE.PCFSoftShadowMap;
    if ("outputColorSpace" in rnd) rnd.outputColorSpace = THREE.SRGBColorSpace;
    else rnd.outputEncoding = THREE.sRGBEncoding;
    rnd.toneMapping = THREE.ACESFilmicToneMapping; rnd.toneMappingExposure = 1.06;
    el.appendChild(rnd.domElement);

    scene.background = texCer();
    scene.fog = new THREE.Fog("#e6eae7", 55, 170);

    const teren = new THREE.Mesh(new THREE.PlaneGeometry(320, 320),
      new THREE.MeshStandardMaterial({ map: texTeren(), roughness: 1 }));
    teren.rotation.x = -Math.PI / 2; teren.receiveShadow = true; scene.add(teren);
    const apron = new THREE.Mesh(new THREE.PlaneGeometry(L + 3.2, W + 3.2),
      new THREE.MeshStandardMaterial({ color: "#c7c2b5", roughness: 0.95 }));
    apron.rotation.x = -Math.PI / 2; apron.position.y = 0.012; apron.receiveShadow = true; scene.add(apron);
    const bordT = new THREE.Mesh(new THREE.PlaneGeometry(L + 3.9, W + 3.9),
      new THREE.MeshStandardMaterial({ color: "#a8a691", roughness: 1, transparent: true, opacity: 0.55 }));
    bordT.rotation.x = -Math.PI / 2; bordT.position.y = 0.008; bordT.receiveShadow = true; scene.add(bordT);
    const alee = new THREE.Mesh(new THREE.PlaneGeometry(1.3, 7),
      new THREE.MeshStandardMaterial({ color: "#bdb7a9", roughness: 0.95 }));
    alee.rotation.x = -Math.PI / 2; alee.position.set(-L / 5, 0.013, W / 2 + 3.5 + 1.6); scene.add(alee);
    const uc = new THREE.Mesh(new THREE.PlaneGeometry(L + 5, W + 5),
      new THREE.MeshBasicMaterial({ map: umbraContact(), transparent: true, depthWrite: false }));
    uc.rotation.x = -Math.PI / 2; uc.position.y = 0.02; scene.add(uc);
    const copac = (px, pz, s = 1) => {
      const tr = new THREE.Mesh(new THREE.CylinderGeometry(0.09 * s, 0.13 * s, 1.1 * s, 7),
        new THREE.MeshStandardMaterial({ color: "#6b5744", roughness: 1 }));
      tr.position.set(px, 0.55 * s, pz); tr.castShadow = true; scene.add(tr);
      const co = new THREE.Mesh(new THREE.ConeGeometry(1.05 * s, 2.6 * s, 8),
        new THREE.MeshStandardMaterial({ color: "#5c6e52", roughness: 1 }));
      co.position.set(px, 1.1 * s + 1.3 * s, pz); co.castShadow = true; scene.add(co);
    };
    copac(-L / 2 - 4.5, -W / 2 - 2, 1.15);
    { const s2 = 0.9;
      const tr = new THREE.Mesh(new THREE.CylinderGeometry(0.09 * s2, 0.13 * s2, 1.2 * s2, 7),
        new THREE.MeshStandardMaterial({ color: "#6b5744", roughness: 1 }));
      tr.position.set(L / 2 + 5, 0.6 * s2, W / 2 + 1); tr.castShadow = true; scene.add(tr);
      const co = new THREE.Mesh(new THREE.SphereGeometry(1.15 * s2, 9, 7),
        new THREE.MeshStandardMaterial({ color: "#66754f", roughness: 1 }));
      co.scale.y = 0.85; co.position.set(L / 2 + 5, 1.2 * s2 + 0.95 * s2, W / 2 + 1); co.castShadow = true; scene.add(co); }

    scene.add(new THREE.HemisphereLight(0xfdf3e3, 0x7f8a74, 0.38));
    const key = new THREE.DirectionalLight(0xffe9cf, 2.1);
    key.position.set(L * 1.7, hz + hRoof + 6.5, W * 0.3); key.castShadow = true;
    key.shadow.mapSize.set(2048, 2048); key.shadow.radius = 5;
    const s = Math.max(L, W) * 1.5;
    key.shadow.camera.left = -s; key.shadow.camera.right = s;
    key.shadow.camera.top = s; key.shadow.camera.bottom = -4; key.shadow.bias = -0.0005;
    scene.add(key);
    const fill = new THREE.DirectionalLight(0xd9e4f2, 0.26); fill.position.set(-L, hz, -W); scene.add(fill);
    const rim = new THREE.DirectionalLight(0xfff0dd, 0.5); rim.position.set(-L * 0.6, hz + hRoof + 6, -W); scene.add(rim);

    const zc = document.createElement("canvas"); zc.width = 64; zc.height = 256;
    const zx = zc.getContext("2d");
    zx.fillStyle = "#d3cabb"; zx.fillRect(0, 0, 64, 256);
    const zg = zx.createLinearGradient(0, 0, 0, 70);
    zg.addColorStop(0, "rgba(45,40,32,0.42)"); zg.addColorStop(1, "rgba(45,40,32,0)");
    zx.fillStyle = zg; zx.fillRect(0, 0, 64, 70);
    const ztx = srgb(new THREE.CanvasTexture(zc));
    const matZid = new THREE.MeshStandardMaterial({ map: ztx, roughness: 0.95 });
    const casa = new THREE.Mesh(new THREE.BoxGeometry(L, hz, W), matZid);
    casa.position.y = hz / 2; casa.castShadow = true; casa.receiveShadow = true; scene.add(casa);
    const soclu = new THREE.Mesh(new THREE.BoxGeometry(L + 0.14, 0.35, W + 0.14),
      new THREE.MeshStandardMaterial({ color: "#8f8a80", roughness: 1 }));
    soclu.position.y = 0.175; soclu.receiveShadow = true; scene.add(soclu);

    const M = C.materialeMp[material] || Object.values(C.materialeMp)[0];
    const TX = texInvelitoare(M.hex, M.tex || "tabla");
    const matInv = new THREE.MeshStandardMaterial({
      color: 0xffffff, map: TX.map, bumpMap: TX.bump, bumpScale: M.tex === "tigla" ? 0.035 : 0.02,
      roughness: M.tex === "tigla" ? 0.8 : 0.5, metalness: M.tex === "tigla" ? 0.02 : 0.3, side: THREE.DoubleSide,
    });
    const matSub = new THREE.MeshStandardMaterial({ color: "#33302c", roughness: 0.9, side: THREE.DoubleSide });
    const y0 = hz, x0 = L / 2 + ov, z0 = W / 2 + ov, yv = y0 + hRoof + (ov * Math.tan(rad(panta)));
    const tris = [], triF = [];
    const A = [-x0, y0, z0], B = [x0, y0, z0], Cc = [x0, y0, -z0], D = [-x0, y0, -z0];
    let yCoama = yv;

    if (tip === "doua_ape") {
      const R1 = [-x0, yv, 0], R2 = [x0, yv, 0];
      tris.push([A, B, R2], [A, R2, R1], [Cc, D, R1], [Cc, R1, R2]);
      const fx = L / 2;
      triF.push([[-fx, y0, W / 2], [-fx, y0, -W / 2], [-fx, yv, 0]]);
      triF.push([[fx, y0, -W / 2], [fx, y0, W / 2], [fx, yv, 0]]);
    } else if (tip === "patru_ape") {
      const c = Math.max((L - W) / 2, 0);
      const R1 = [-c, yv, 0], R2 = [c, yv, 0];
      tris.push([A, B, R2], [A, R2, R1], [Cc, D, R1], [Cc, R1, R2], [D, A, R1], [B, Cc, R2]);
    } else {
      const pJos = Math.min(panta + 25, 72), zB = W * 0.18 + ov * 0.3;
      const yB = y0 + (W / 2 - W * 0.18) * Math.tan(rad(pJos));
      const yT = yB + (W * 0.18) * Math.tan(rad(Math.max(panta - 10, 12)));
      yCoama = yT;
      const M1 = [-x0, yB, zB], M2 = [x0, yB, zB], M3 = [x0, yB, -zB], M4 = [-x0, yB, -zB];
      const R1 = [-x0, yT, 0], R2 = [x0, yT, 0];
      tris.push([A, B, M2], [A, M2, M1], [M1, M2, R2], [M1, R2, R1]);
      tris.push([Cc, D, M4], [Cc, M4, M3], [M3, M4, R1], [M3, R1, R2]);
      const fx = L / 2;
      triF.push([[-fx, y0, W / 2], [-fx, y0, -W / 2], [-fx, yT, 0]]);
      triF.push([[fx, y0, -W / 2], [fx, y0, W / 2], [fx, yT, 0]]);
    }
    const inv = meshTri(tris, matInv); scene.add(inv);
    const sub = meshTri(tris, matSub); sub.position.y = -0.05; sub.castShadow = false; scene.add(sub);
    if (triF.length) scene.add(meshTri(triF, matZid));

    const matPazie = new THREE.MeshStandardMaterial({ color: "#4d443a", roughness: 0.8 });
    const rake = (p1, p2) => {
      const a = new THREE.Vector3(...p1), b = new THREE.Vector3(...p2);
      const dir = b.clone().sub(a), len = dir.length();
      const m = new THREE.Mesh(new THREE.BoxGeometry(0.07, 0.2, len), matPazie);
      m.position.copy(a.clone().add(b).multiplyScalar(0.5));
      m.quaternion.setFromUnitVectors(new THREE.Vector3(0, 0, 1), dir.normalize());
      m.castShadow = true; scene.add(m);
    };
    const matJ = new THREE.MeshStandardMaterial({ color: "#70767c", metalness: 0.6, roughness: 0.35 });
    const bordura = (w, x, z, rotY = 0) => {
      const p = new THREE.Mesh(new THREE.BoxGeometry(w, 0.22, 0.06), matPazie);
      p.position.set(x, y0 - 0.02, z); p.rotation.y = rotY; p.castShadow = true; scene.add(p);
      const j = new THREE.Mesh(new THREE.BoxGeometry(w, 0.13, 0.15), matJ);
      j.position.set(x, y0 - 0.17, z); j.rotation.y = rotY; scene.add(j);
    };
    bordura(L + 2 * ov, 0, z0 + 0.04); bordura(L + 2 * ov, 0, -z0 - 0.04);
    if (tip === "patru_ape") {
      bordura(W + 2 * ov, x0 + 0.04, 0, Math.PI / 2); bordura(W + 2 * ov, -x0 - 0.04, 0, Math.PI / 2);
      const cH = Math.max((L - W) / 2, 0);
      const matHip = new THREE.MeshStandardMaterial({ color: shade(M.hex, 0.62), roughness: 0.6 });
      const hip = (p1, p2) => {
        const a = new THREE.Vector3(...p1), b = new THREE.Vector3(...p2);
        const dir = b.clone().sub(a), len = dir.length();
        const m = new THREE.Mesh(new THREE.BoxGeometry(0.12, 0.1, len), matHip);
        m.position.copy(a.clone().add(b).multiplyScalar(0.5)).y += 0.03;
        m.quaternion.setFromUnitVectors(new THREE.Vector3(0, 0, 1), dir.normalize());
        m.castShadow = true; scene.add(m);
      };
      hip([-x0, y0, z0], [-cH, yv, 0]); hip([-x0, y0, -z0], [-cH, yv, 0]);
      hip([x0, y0, z0], [cH, yv, 0]);   hip([x0, y0, -z0], [cH, yv, 0]);
    }
    else if (tip === "doua_ape") {
      for (const sx of [x0, -x0]) { rake([sx, y0, z0], [sx, yv, 0]); rake([sx, y0, -z0], [sx, yv, 0]); }
    } else {
      const pJos2 = Math.min(panta + 25, 72), zB2 = W * 0.18 + ov * 0.3;
      const yB2 = y0 + (W / 2 - W * 0.18) * Math.tan(rad(pJos2));
      for (const sx of [x0, -x0]) {
        rake([sx, y0, z0], [sx, yB2, zB2]); rake([sx, yB2, zB2], [sx, yCoama, 0]);
        rake([sx, y0, -z0], [sx, yB2, -zB2]); rake([sx, yB2, -zB2], [sx, yCoama, 0]);
      }
    }

    const qCoamaL = tip === "patru_ape" ? Math.max(L - W, 0) : L + 2 * ov;
    if (qCoamaL > 0.05) {
      const co = new THREE.Mesh(new THREE.BoxGeometry(qCoamaL, 0.14, 0.24),
        new THREE.MeshStandardMaterial({ color: shade(M.hex, 0.6), roughness: 0.6 }));
      co.position.set(0, yCoama + 0.06, 0); co.castShadow = true; scene.add(co);
    }

    const gol = (w, h, px, py, geamHex) => {
      const rama = new THREE.Mesh(new THREE.BoxGeometry(w + 0.16, h + 0.16, 0.05),
        new THREE.MeshStandardMaterial({ color: "#c9c2b2", roughness: 0.9 }));
      rama.position.set(px, py, W / 2 + 0.025); scene.add(rama);
      const panel = new THREE.Mesh(new THREE.BoxGeometry(w, h, 0.05),
        new THREE.MeshStandardMaterial(geamHex
          ? { color: geamHex, roughness: 0.15, metalness: 0.5 }
          : { color: "#4a4038", roughness: 0.8 }));
      panel.position.set(px, py, W / 2 + 0.032); panel.castShadow = true; scene.add(panel);
    };
    gol(0.95, 2.05, -L / 5, 1.025, null);
    gol(1.4, 1.2, L / 6, 1.5, "#9db6c4");
    if (L > 8) gol(1.4, 1.2, L / 2.6, 1.5, "#9db6c4");

    { const hx = -L / 4, hzp = -W / 5;
      const dyC = Math.min(Math.abs(hzp) * Math.tan(rad(panta)) + 0, hRoof);
      const hTop = (tip === "mansardat" ? yCoama : y0 + hRoof - dyC) + 1.0;
      const horn = new THREE.Mesh(new THREE.BoxGeometry(0.75, hTop, 0.55),
        new THREE.MeshStandardMaterial({ color: "#b8a58e", roughness: 0.95 }));
      horn.position.set(hx, hTop / 2, hzp); horn.castShadow = true; scene.add(horn);
      const cap = new THREE.Mesh(new THREE.BoxGeometry(0.9, 0.12, 0.7),
        new THREE.MeshStandardMaterial({ color: "#4d443a", roughness: 0.8 }));
      cap.position.set(hx, hTop + 0.06, hzp); cap.castShadow = true; scene.add(cap); }

    const target = new THREE.Vector3(0, (hz + hRoof) / 2 + 0.6, 0);
    const rRest = Math.max(L, W) * 1.35 + 6;
    let th = 0.7, ph = 1.15, r = rRest, drag = false, px = 0, py = 0, vth = 0, vph = 0, intro = 0;
    const upd = () => { cam.position.set(target.x + r * Math.sin(ph) * Math.sin(th), target.y + r * Math.cos(ph), target.z + r * Math.sin(ph) * Math.cos(th)); cam.lookAt(target); };
    const dom = rnd.domElement;
    const down = (x, y) => { drag = true; px = x; py = y; vth = 0; vph = 0; };
    const move = (x, y) => { if (!drag) return; const dx = (x - px) * 0.008, dy = (y - py) * 0.008; th -= dx; ph -= dy; vth = -dx; vph = -dy; ph = Math.max(0.5, Math.min(1.5, ph)); px = x; py = y; };
    const up = () => drag = false;
    dom.addEventListener("mousedown", e => down(e.clientX, e.clientY));
    window.addEventListener("mousemove", e => move(e.clientX, e.clientY));
    window.addEventListener("mouseup", up);
    dom.addEventListener("touchstart", e => { const q = e.touches[0]; down(q.clientX, q.clientY); }, { passive: true });
    dom.addEventListener("touchmove", e => { const q = e.touches[0]; move(q.clientX, q.clientY); }, { passive: true });
    dom.addEventListener("touchend", up);
    dom.addEventListener("wheel", e => { e.preventDefault(); r = Math.max(6, Math.min(rRest * 2.2, r + e.deltaY * 0.02)); }, { passive: false });

    let raf;
    const loop = () => {
      if (intro < 1) { intro = Math.min(1, intro + 0.02); const e = 1 - Math.pow(1 - intro, 3); r = rRest + (1 - e) * rRest * 0.5; th = 0.7 + (1 - e) * 0.5; }
      if (!drag) { th += vth; ph = Math.max(0.5, Math.min(1.5, ph + vph)); vth *= 0.92; vph *= 0.92; if (Math.abs(vth) < 0.0004 && intro >= 1) th += 0.0011; }
      upd(); rnd.render(scene, cam); raf = requestAnimationFrame(loop);
    };
    loop();
    const onR = () => { const w = el.clientWidth, h = el.clientHeight; cam.aspect = w / h; cam.updateProjectionMatrix(); rnd.setSize(w, h); };
    window.addEventListener("resize", onR);
    return () => { cancelAnimationFrame(raf); window.removeEventListener("resize", onR); window.removeEventListener("mousemove", move); window.removeEventListener("mouseup", up); rnd.dispose(); el.removeChild(rnd.domElement); };
  }, [cfg]);
  return (
    <div style={{ position: "relative", width: "100%", height: "100%" }}>
      <div ref={mount} style={{ width: "100%", height: "100%", touchAction: "none", cursor: "grab" }} />
      <div style={{ position: "absolute", inset: 0, pointerEvents: "none", background: "radial-gradient(ellipse at 50% 42%, rgba(0,0,0,0) 62%, rgba(20,25,20,0.13) 100%)" }} />
    </div>
  );
}
