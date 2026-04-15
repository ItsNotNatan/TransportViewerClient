// src/pages/MedidorCargas/engine3D.js
import { GAP, getGC } from '../../components/CargoForm/constants';

export const buildVehicle = (v, tState, THREE) => {
  const mp = (col, shi, spec) => new THREE.MeshPhongMaterial({ color: col, shininess: shi || 60, specular: new THREE.Color(spec || 0x222222) });
  const mpT = (col, op, shi) => new THREE.MeshPhongMaterial({ color: col, transparent: true, opacity: op || 0.12, side: THREE.DoubleSide, shininess: shi || 140, specular: new THREE.Color(0.7, 0.85, 1) });
  
  const mk = (geo, mat, x, y, z) => {
    const m = new THREE.Mesh(geo, mat);
    m.position.set(x, y, z); m.castShadow = true; m.receiveShadow = true;
    m.userData.isVehicle = true; tState.vehGrp.add(m); return m;
  };
  
  const B = (w, h, d) => new THREE.BoxGeometry(w, h, d);
  const Cy = (r, h, s) => new THREE.CylinderGeometry(r, r, h, s || 20);

  const L = v.L, W = v.W, H = v.H, type = v.type;
  const GC = getGC(type);
  const bayY = GC + H / 2;

  const mGlass = mpT(0x88bbdd, 0.10);
  const mFrame = mp(0x2a4060, 50, 0x445577);
  const mFloor = mp(0x8b6e3a, 15);
  const mCab = mp(0x1c3355, 120, 0x4477cc);
  const mCabD = mp(0x162440, 80, 0x334488);
  const mWind = new THREE.MeshPhongMaterial({ color: 0x99ccff, transparent: true, opacity: 0.38, shininess: 200, specular: new THREE.Color(1, 1, 1) });
  const mMetal = mp(0x445566, 140, 0x778899);
  const mChr = mp(0xaabbcc, 200, 0xffffff);
  const mWheel = mp(0x111111, 20);
  const mRim = mp(0x999999, 180, 0xffffff);
  const mBump = mp(0x1a1a1a, 40);
  const mGrill = mp(0x0d0d0d, 30);
  const mLight = new THREE.MeshPhongMaterial({ color: 0xffffaa, emissive: new THREE.Color(0.5, 0.5, 0) });
  const mBrake = new THREE.MeshPhongMaterial({ color: 0xff3300, emissive: new THREE.Color(0.35, 0.05, 0) });
  const mExh = mp(0x667788, 80, 0x889999);
  const mChass = mp(0x0c1015, 20);
  const mRub = mp(0x1a1a1a, 5);
  const mPl = mp(0x7a5218, 8);

  // BAY SHELL
  mk(B(L, H, 0.04), mGlass, 0, bayY, W / 2);
  mk(B(L, H, 0.04), mGlass, 0, bayY, -W / 2);
  mk(B(0.04, H, W), mGlass, -L / 2, bayY, 0);
  mk(B(L, 0.04, W), mGlass, 0, GC + H, 0);

  // FLOOR
  mk(B(L, 0.07, W), mFloor, 0, GC + 0.035, 0);
  for (let pi = -L / 2 + 0.3; pi < L / 2 - 0.1; pi += 0.3) {
    const pl = new THREE.Mesh(B(0.015, 0.075, W), mPl);
    pl.position.set(pi, GC + 0.04, 0); tState.vehGrp.add(pl);
  }

  // FRAME
  const T = 0.055;
  mk(B(L + 0.01, T, T), mFrame, 0, GC + H, W / 2); mk(B(L + 0.01, T, T), mFrame, 0, GC + H, -W / 2);
  mk(B(L + 0.01, T, T), mFrame, 0, GC, W / 2); mk(B(L + 0.01, T, T), mFrame, 0, GC, -W / 2);
  const np = Math.max(2, Math.ceil(L / 2.5));
  for (let ni = 0; ni <= np; ni++) {
    const px = -L / 2 + (L / np) * ni;
    mk(B(T, H + T, T), mFrame, px, bayY, W / 2);
    mk(B(T, H + T, T), mFrame, px, bayY, -W / 2);
  }
  const nb = Math.max(2, Math.ceil(L / 3));
  for (let bi = 0; bi <= nb; bi++) mk(B(T, T, W), mFrame, -L / 2 + (L / nb) * bi, GC + H, 0);

  // CHASSIS
  mk(B(L + 0.2, 0.15, W * 0.52), mChass, -0.05, GC * 0.35, 0);
  [-L / 3, 0, L / 3].forEach(px => { mk(B(0.12, 0.12, W * 0.52), mChass, px, GC * 0.28, 0); });

  // WHEELS (Corrigido para alinhamento correto)
  const WR = { small: 0.27, van: 0.31, truck: 0.43, semi: 0.52, sider: 0.52, ddeck: 0.52 }[type] || 0.43;
  const WT = WR * 0.55, WY = WR;
  const addW = (x, y, z) => {
    const tc = new THREE.Mesh(Cy(WR, WT, 24), mWheel); tc.rotation.x = Math.PI / 2; tc.position.set(x, y, z); tc.castShadow = true; tState.vehGrp.add(tc);
    const sw = new THREE.Mesh(Cy(WR * 0.96, WT + 0.005, 24), mRub); sw.rotation.x = Math.PI / 2; sw.position.set(x, y, z); tState.vehGrp.add(sw);
    const rd = new THREE.Mesh(Cy(WR * 0.62, WT * 0.45, 10), mRim); rd.rotation.x = Math.PI / 2; rd.position.set(x, y, z); tState.vehGrp.add(rd);
    for (let si = 0; si < 5; si++) {
      const a = si * (Math.PI * 2 / 5);
      const sp = new THREE.Mesh(B(WR * 0.44, WR * 0.09, WT * 0.38), mChr);
      sp.rotation.z = a; sp.position.set(x + Math.cos(a) * WR * 0.34, y + Math.sin(a) * WR * 0.34, z); tState.vehGrp.add(sp);
    }
    const hb = new THREE.Mesh(new THREE.SphereGeometry(WR * 0.17, 8, 6), mChr); hb.position.set(x, y, z); tState.vehGrp.add(hb);
  };
  const dW = (x, y, z) => { addW(x, y, z + WT * 0.64); addW(x, y, z - WT * 0.64); };

  // CAB dims
  const CABL = { small: 1.55, van: 1.35, truck: 2.0, semi: 2.3, sider: 2.3, ddeck: 2.3 }[type] || 2.0;
  const CABH = { small: H + 0.02, van: H, truck: H * 0.97, semi: H * 0.88, sider: H * 0.88, ddeck: H * 0.6 }[type] || H * 0.97;
  const CABW = W + 0.04, CABX = L / 2 + CABL / 2;

  if (type === 'small') {
    mk(B(CABL, CABH, CABW), mCab, CABX, GC + CABH / 2, 0);
    mk(B(CABL * 0.52, CABH * 0.43, CABW * 0.88), mWind, CABX + CABL * 0.02, GC + CABH * 0.72, 0);
    mk(B(0.04, CABH * 0.35, CABW * 0.8), mWind, CABX - CABL / 2, GC + CABH * 0.68, 0);
    mk(B(CABL * 0.34, CABH * 0.26, 0.04), mWind, CABX - CABL * 0.06, GC + CABH * 0.73, CABW / 2);
    mk(B(CABL * 0.34, CABH * 0.26, 0.04), mWind, CABX - CABL * 0.06, GC + CABH * 0.73, -CABW / 2);
    mk(B(0.11, 0.36, CABW * 1.02), mBump, CABX + CABL / 2 + 0.055, GC + 0.18, 0);
    mk(B(0.065, 0.2, CABW * 0.72), mGrill, CABX + CABL / 2 + 0.04, GC + 0.18, 0);
    [CABW * 0.33, -CABW * 0.33].forEach(z => mk(B(0.055, 0.13, 0.18), mLight, CABX + CABL / 2 + 0.035, GC + 0.38, z));
    [CABW / 2 + 0.09, -CABW / 2 - 0.09].forEach(z => mk(B(0.16, 0.09, 0.055), mCabD, CABX + CABL * 0.2, GC + CABH * 0.72, z));
    mk(B(CABL * 0.4, 0.06, CABW * 0.35), mMetal, CABX, GC + CABH + 0.03, 0);
    addW(CABX + CABL * 0.24, WY, W / 2 + WT * 0.54); addW(CABX + CABL * 0.24, WY, -W / 2 - WT * 0.54);
    addW(-L / 2 + 0.22, WY, W / 2 + WT * 0.54); addW(-L / 2 + 0.22, WY, -W / 2 - WT * 0.54);
    [CABW * 0.34, -CABW * 0.34].forEach(z => mk(B(0.04, 0.11, 0.16), mBrake, CABX - CABL / 2, GC + CABH * 0.38, z));
  } else if (type === 'van') {
    mk(B(CABL, CABH, CABW), mCab, CABX, GC + CABH / 2, 0);
    mk(B(CABL * 0.65, 0.07, CABW * 0.96), mCab, CABX, GC + CABH, 0);
    mk(B(CABL * 0.58, CABH * 0.49, CABW * 0.9), mWind, CABX + CABL * 0.04, GC + CABH * 0.68, 0);
    mk(B(CABL * 0.3, CABH * 0.28, 0.04), mWind, CABX - CABL * 0.07, GC + CABH * 0.72, CABW / 2);
    mk(B(CABL * 0.3, CABH * 0.28, 0.04), mWind, CABX - CABL * 0.07, GC + CABH * 0.72, -CABW / 2);
    mk(B(0.13, 0.52, CABW * 1.02), mBump, CABX + CABL / 2 + 0.065, GC + 0.26, 0);
    mk(B(0.07, 0.3, CABW * 0.7), mGrill, CABX + CABL / 2 + 0.05, GC + 0.28, 0);
    [CABW * 0.37, -CABW * 0.37].forEach(z => mk(B(0.065, 0.22, 0.25), mLight, CABX + CABL / 2 + 0.04, GC + 0.55, z));
    [CABW / 2 + 0.12, -CABW / 2 - 0.12].forEach(z => mk(B(0.21, 0.13, 0.07), mCabD, CABX + CABL * 0.22, GC + CABH * 0.76, z));
    addW(CABX + CABL * 0.27, WY, W / 2 + WT * 0.58); addW(CABX + CABL * 0.27, WY, -W / 2 - WT * 0.58);
    addW(-L / 2 + 0.2, WY, W / 2 + WT * 0.58); addW(-L / 2 + 0.2, WY, -W / 2 - WT * 0.58);
    [CABW * 0.35, -CABW * 0.35].forEach(z => mk(B(0.05, 0.14, 0.19), mBrake, CABX - CABL / 2 - 0.01, GC + CABH * 0.4, z));
  } else {
    const isSemi = (type === 'semi' || type === 'sider' || type === 'ddeck');
    mk(B(CABL, CABH, CABW), mCab, CABX, GC + CABH / 2, 0);
    if (isSemi) mk(B(CABL * 0.52, CABH * 0.24, CABW * 0.97), mCabD, CABX - CABL * 0.19, GC + CABH * 0.88, 0);
    mk(B(CABL, 0.07, CABW * 0.93), mMetal, CABX, GC + CABH + 0.04, 0);
    mk(B(0.07, CABH * 0.45, CABW * 0.87), mWind, CABX + CABL / 2, GC + CABH * 0.71, 0);
    mk(B(CABL * 0.44, CABH * 0.3, 0.06), mWind, CABX + CABL * 0.04, GC + CABH * 0.73, CABW / 2);
    mk(B(CABL * 0.44, CABH * 0.3, 0.06), mWind, CABX + CABL * 0.04, GC + CABH * 0.73, -CABW / 2);
    mk(B(0.2, 0.62, CABW * 1.04), mBump, CABX + CABL / 2 + 0.1, GC + 0.31, 0);
    mk(B(0.065, 0.085, CABW * 0.9), mChr, CABX + CABL / 2 + 0.115, GC + 0.54, 0);
    mk(B(0.065, 0.085, CABW * 0.9), mChr, CABX + CABL / 2 + 0.115, GC + 0.28, 0);
    for (let gi = 0; gi < 6; gi++) mk(B(0.065, 0.046, CABW * 0.74), mGrill, CABX + CABL / 2 + 0.04, GC + 0.15 + gi * 0.068, 0);
    [CABW * 0.37, -CABW * 0.37].forEach(z => mk(B(0.075, 0.21, 0.28), mLight, CABX + CABL / 2 + 0.05, GC + 0.53, z));
    [CABW * 0.2, -CABW * 0.2].forEach(z => mk(B(0.055, 0.09, 0.15), mLight, CABX + CABL / 2 + 0.045, GC + 0.16, z));
    mk(B(CABW * 0.85, 0.06, 0.08), mChr, CABX, GC + CABH + 0.02, 0);
    [CABW / 2 + 0.14, -CABW / 2 - 0.14].forEach(z => {
      mk(B(0.06, 0.35, 0.055), mChr, CABX + CABL * 0.22, GC + CABH * 0.67, z > 0 ? CABW / 2 + 0.05 : -CABW / 2 - 0.05);
      mk(B(0.26, 0.17, 0.085), mCabD, CABX + CABL * 0.18, GC + CABH * 0.79, z);
    });
    [CABW * 0.36, -CABW * 0.36].forEach(z => mk(Cy(0.075, CABH * 0.52, 10), mExh, CABX - CABL * 0.24, GC + CABH + CABH * 0.26, z));
    mk(B(1.05, 0.43, 0.31), mMetal, CABX - CABL * 0.08, GC + 0.22, CABW / 2 + 0.17);
    mk(B(1.05, 0.43, 0.31), mMetal, CABX - CABL * 0.08, GC + 0.22, -CABW / 2 - 0.17);
    [0.2, 0.38].forEach(sy => {
      mk(B(0.3, 0.04, 0.25), mChr, CABX + CABL * 0.24, sy, CABW / 2 + 0.14);
      mk(B(0.3, 0.04, 0.25), mChr, CABX + CABL * 0.24, sy, -CABW / 2 - 0.14);
    });
    if (isSemi) {
      mk(B(0.88, 0.21, 0.92), mMetal, CABX - CABL * 0.54, GC + 0.075, 0);
      mk(B(0.88, 0.06, 0.92), mChr, CABX - CABL * 0.54, GC + 0.17, 0);
    }
    [CABW * 0.39, -CABW * 0.39].forEach(z => mk(B(0.055, 0.15, 0.21), mBrake, CABX - CABL / 2 - 0.02, GC + 0.46, z));
    addW(CABX + CABL * 0.23, WY, W / 2 + WT * 0.64); addW(CABX + CABL * 0.23, WY, -W / 2 - WT * 0.64);
    if (isSemi) {
      dW(CABX - CABL * 0.27, WY, W / 2 + WT * 0.72); dW(CABX - CABL * 0.27, WY, -W / 2 - WT * 0.72);
      const nAx = v.L > 12 ? 3 : 2;
      for (let ai = 0; ai < nAx; ai++) { dW(-L / 2 + 0.65 + ai * 0.75, WY, W / 2 + WT * 0.72); dW(-L / 2 + 0.65 + ai * 0.75, WY, -W / 2 - WT * 0.72); }
    } else {
      dW(-L / 2 + 0.82, WY, W / 2 + WT * 0.64); dW(-L / 2 + 0.82, WY, -W / 2 - WT * 0.64);
      dW(-L / 2 + 1.54, WY, W / 2 + WT * 0.64); dW(-L / 2 + 1.54, WY, -W / 2 - WT * 0.64);
    }
  }

  if (type === 'ddeck') {
    const midY = GC + H * 0.475 + 0.06;
    mk(B(L, 0.12, W), mFloor, 0, midY - 0.06, 0);
    const mPl2 = mp(0x7a5218, 8);
    for (let dpi = -L / 2 + 0.3; dpi < L / 2 - 0.1; dpi += 0.3) {
      const dp = new THREE.Mesh(B(0.015, 0.13, W), mPl2); dp.position.set(dpi, midY, 0); tState.vehGrp.add(dp);
    }
    mk(B(L + 0.01, 0.065, 0.065), mFrame, 0, midY, W / 2);
    mk(B(L + 0.01, 0.065, 0.065), mFrame, 0, midY, -W / 2);
  }

  if (type === 'sider') {
    const curtM = new THREE.MeshPhongMaterial({ color: 0x1133aa, transparent: true, opacity: 0.08, side: THREE.DoubleSide });
    mk(B(L + 0.04, 0.065, 0.065), mChr, 0, GC + H + 0.065, W / 2 + 0.03);
    mk(B(L + 0.04, 0.065, 0.065), mChr, 0, GC + H + 0.065, -W / 2 - 0.03);
    mk(B(L + 0.04, 0.04, 0.04), mMetal, 0, GC, W / 2 + 0.03);
    mk(B(L + 0.04, 0.04, 0.04), mMetal, 0, GC, -W / 2 - 0.03);
    const cg = new THREE.BoxGeometry(L, H, 0.015);
    [W / 2 + 0.01, -W / 2 - 0.01].forEach(z => {
      const cm = new THREE.Mesh(cg, curtM); cm.position.set(0, bayY, z); tState.vehGrp.add(cm);
    });
  }

  [W / 2 * 0.63, -W / 2 * 0.63].forEach(z => mk(B(0.055, 0.17, 0.23), mBrake, -L / 2 - 0.02, GC + H * 0.52, z));
  mk(B(0.025, 0.06, W * 0.7), mChr, -L / 2 - 0.02, GC + 0.22, 0);
};

export const placeCargos = (v, cargos, tState, selCid, THREE) => {
  const gc = getGC(v.type);
  const units = [];
  cargos.forEach(c => {
    for (let q = 0; q < c.qty; q++) {
      units.push({ id: c.id, name: c.name, l: c.l, w: c.w, h: c.h, color: c.color, label: c.name + (c.qty > 1 ? ' #' + (q + 1) : ''), unitIdx: q });
    }
  });

  const placeOnDeck = (deckUnits, BL, BW, BH, floorY) => {
    let curX = -BL / 2 + GAP, curZ = -BW / 2 + GAP, curY = floorY + GAP;
    let rowD = 0, layerH = 0;

    deckUnits.forEach(c => {
      const CL = c.l, CW = c.w, CH = c.h;
      if (curZ + CW > BW / 2 - GAP) { curX += rowD + GAP; curZ = -BW / 2 + GAP; rowD = 0; }
      if (curX + CL > BL / 2 - GAP) { curY += layerH + GAP; curX = -BL / 2 + GAP; curZ = -BW / 2 + GAP; rowD = 0; layerH = 0; }

      let cx = curX + CL / 2, cy = curY + CH / 2, cz = curZ + CW / 2;
      const posKey = c.id + '_' + c.unitIdx;
      if (tState.posOv[posKey]) { cx = tState.posOv[posKey].x; cy = tState.posOv[posKey].y; cz = tState.posOv[posKey].z; }

      const inBay = (curX + CL <= BL / 2 + 0.015) && (curZ + CW <= BW / 2 + 0.015) && (curY + CH <= floorY + BH + 0.015);
      const col = new THREE.Color(c.color);

      const geo = new THREE.BoxGeometry(CL, CH, CW);
      const mat = new THREE.MeshPhongMaterial({
        color: col, transparent: true, opacity: inBay ? 0.88 : 0.38, shininess: 85,
        specular: new THREE.Color(0.15, 0.15, 0.15),
        emissive: (selCid === c.id) ? new THREE.Color(0, 0.05, 0.12) : (inBay ? new THREE.Color(0, 0, 0) : new THREE.Color(0.22, 0, 0))
      });
      const mesh = new THREE.Mesh(geo, mat);
      mesh.position.set(cx, cy, cz);
      mesh.castShadow = true; mesh.receiveShadow = true;
      mesh.userData = { movable: true, cid: c.id, label: c.label, unitIdx: c.unitIdx, posKey: posKey, inBay: inBay };
      tState.cargoGrp.add(mesh);

      const edges = new THREE.EdgesGeometry(geo);
      const eMat = new THREE.LineBasicMaterial({ color: col, transparent: true, opacity: inBay ? 0.95 : 0.35 });
      const lines = new THREE.LineSegments(edges, eMat);
      lines.position.copy(mesh.position);
      lines.userData = { linkedTo: mesh.uuid };
      tState.cargoGrp.add(lines);

      const topCol = new THREE.Color(c.color);
      topCol.lerp(new THREE.Color(1, 1, 1), 0.4);
      const tGeo = new THREE.PlaneGeometry(CL - 0.01, CW - 0.01);
      const tMat = new THREE.MeshBasicMaterial({ color: topCol, transparent: true, opacity: inBay ? 0.25 : 0.08, side: THREE.DoubleSide });
      const tFace = new THREE.Mesh(tGeo, tMat);
      tFace.rotation.x = -Math.PI / 2;
      tFace.position.set(cx, cy + CH / 2 + 0.003, cz);
      tFace.userData = { topOf: mesh.uuid };
      tState.cargoGrp.add(tFace);

      const frontCol = new THREE.Color(c.color);
      frontCol.lerp(new THREE.Color(1, 1, 1), 0.18);
      const fGeo = new THREE.PlaneGeometry(CL - 0.01, CH - 0.01);
      const fMat = new THREE.MeshBasicMaterial({ color: frontCol, transparent: true, opacity: inBay ? 0.12 : 0.04, side: THREE.DoubleSide });
      const fFace = new THREE.Mesh(fGeo, fMat);
      fFace.position.set(cx, cy, cz + CW / 2 + 0.003);
      tState.cargoGrp.add(fFace);

      rowD = Math.max(rowD, CL);
      layerH = Math.max(layerH, CH);
      curZ += CW + GAP;
    });
  };

  if (v.type === 'ddeck') {
    const deckH = v.H * 0.475 - 0.08;
    const half = Math.ceil(units.length / 2);
    placeOnDeck(units.slice(0, half), v.L, v.W, deckH, gc);
    placeOnDeck(units.slice(half), v.L, v.W, deckH, gc + v.H * 0.475 + 0.08);
  } else {
    placeOnDeck(units, v.L, v.W, v.H, gc);
  }
};