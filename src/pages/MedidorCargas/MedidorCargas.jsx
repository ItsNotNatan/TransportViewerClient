import React, { useState, useEffect, useRef, useCallback } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import * as THREE from 'three';
import api from '../../services/api'; 
import './MedidorCargas.css';

// ─── DATA & CONSTANTS ─────────────────────────────────────────────────────────
const PALETTE = ['#00d4ff', '#00e676', '#ff6b35', '#ffd600', '#ff4444', '#cc44ff', '#ff69b4', '#7fff00'];
const GAP = 0.10;

// ─── HELPER FUNCTIONS (THREEJS LOGIC) ─────────────────────────────────────────
const getGC = (type) => {
  const map = { small: 0.28, van: 0.40, truck: 0.55, semi: 0.72, sider: 0.72, ddeck: 0.72 };
  return map[type] || 0.55;
};

const buildVehicle = (v, tState, THREE) => {
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
  mk(B(L + 0.01, T, T), mFrame, 0, GC + H, W / 2);
  mk(B(L + 0.01, T, T), mFrame, 0, GC + H, -W / 2);
  mk(B(L + 0.01, T, T), mFrame, 0, GC, W / 2);
  mk(B(L + 0.01, T, T), mFrame, 0, GC, -W / 2);
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

  // WHEELS
  const WR = { small: 0.27, van: 0.31, truck: 0.43, semi: 0.52, sider: 0.52, ddeck: 0.52 }[type] || 0.43;
  const WT = WR * 0.55, WY = WR;
  const addW = (x, y, z) => {
    const tc = new THREE.Mesh(Cy(WR, WT, 24), mWheel);
    tc.rotation.z = Math.PI / 2; tc.position.set(x, y, z); tc.castShadow = true; tState.vehGrp.add(tc);
    const sw = new THREE.Mesh(Cy(WR * 0.96, WT + 0.005, 24), mRub); sw.rotation.z = Math.PI / 2; sw.position.set(x, y, z);
    tState.vehGrp.add(sw);
    const rd = new THREE.Mesh(Cy(WR * 0.62, WT * 0.45, 10), mRim); rd.rotation.z = Math.PI / 2;
    rd.position.set(x, y, z); tState.vehGrp.add(rd);
    for (let si = 0; si < 5; si++) {
      const a = si * (Math.PI * 2 / 5);
      const sp = new THREE.Mesh(B(WT * 0.38, WR * 0.09, WR * 0.44), mChr);
      sp.rotation.z = Math.PI / 2 + a; sp.position.set(x, y + Math.sin(a) * WR * 0.34, z + Math.cos(a) * WR * 0.34);
      tState.vehGrp.add(sp);
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
    addW(CABX + CABL * 0.24, WY, W / 2 + WT * 0.54);
    addW(CABX + CABL * 0.24, WY, -W / 2 - WT * 0.54);
    addW(-L / 2 + 0.22, WY, W / 2 + WT * 0.54);
    addW(-L / 2 + 0.22, WY, -W / 2 - WT * 0.54);
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
    addW(CABX + CABL * 0.27, WY, W / 2 + WT * 0.58);
    addW(CABX + CABL * 0.27, WY, -W / 2 - WT * 0.58);
    addW(-L / 2 + 0.2, WY, W / 2 + WT * 0.58);
    addW(-L / 2 + 0.2, WY, -W / 2 - WT * 0.58);
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
    addW(CABX + CABL * 0.23, WY, W / 2 + WT * 0.64);
    addW(CABX + CABL * 0.23, WY, -W / 2 - WT * 0.64);
    if (isSemi) {
      dW(CABX - CABL * 0.27, WY, W / 2 + WT * 0.72);
      dW(CABX - CABL * 0.27, WY, -W / 2 - WT * 0.72);
      const nAx = v.L > 12 ? 3 : 2;
      for (let ai = 0; ai < nAx; ai++) { 
        dW(-L / 2 + 0.65 + ai * 0.75, WY, W / 2 + WT * 0.72);
        dW(-L / 2 + 0.65 + ai * 0.75, WY, -W / 2 - WT * 0.72);
      }
    } else {
      dW(-L / 2 + 0.82, WY, W / 2 + WT * 0.64);
      dW(-L / 2 + 0.82, WY, -W / 2 - WT * 0.64);
      dW(-L / 2 + 1.54, WY, W / 2 + WT * 0.64);
      dW(-L / 2 + 1.54, WY, -W / 2 - WT * 0.64);
    }
  }

  if (type === 'ddeck') {
    const midY = GC + H * 0.475 + 0.06;
    mk(B(L, 0.12, W), mFloor, 0, midY - 0.06, 0);
    const mPl2 = mp(0x7a5218, 8);
    for (let dpi = -L / 2 + 0.3; dpi < L / 2 - 0.1; dpi += 0.3) {
      const dp = new THREE.Mesh(B(0.015, 0.13, W), mPl2);
      dp.position.set(dpi, midY, 0); tState.vehGrp.add(dp);
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

const placeCargos = (v, cargos, tState, selCid, THREE) => {
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


// ─── MAIN APP COMPONENT ───────────────────────────────────────────────────────
export default function MedidorCargas() {
  const navigate = useNavigate();
  const location = useLocation();

  // Routing e API states
  const [veiculosBD, setVeiculosBD] = useState([]);
  const [carregando, setCarregando] = useState(true);
  const [showRelatorio, setShowRelatorio] = useState(false);

  // App / UI States
  const canvasRef = useRef(null);
  const wrapRef = useRef(null);
  const selBarWrapperRef = useRef(null);

  const [unit, setUnit] = useState('m');
  const [selColor, setSelColor] = useState(PALETTE[0]);
  const [cargos, setCargos] = useState([]);
  const [selVeh, setSelVeh] = useState(null);
  const [selCid, setSelCid] = useState(null);
  const [mode, setMode] = useState('orbit');
  const [form, setForm] = useState({ name: '', l: '0.40', w: '0.40', h: '0.40', qty: 10 });

  const panelRefs = useRef({});
  const selBarRefs = useRef({ sx: null, sy: null, sz: null, sn: null });

  // ThreeJS Mutable Engine State
  const tState = useRef({
    scene: null, cam: null, renderer: null, raycaster: null,
    vehGrp: null, cargoGrp: null,
    theta: 0.7, phi: 0.42, radius: 18, panX: 0, panY: 0,
    orbiting: false, panning: false, lastMX: 0, lastMY: 0,
    dragging: false, dragObj: null, dragPlane: null, dragOff: null,
    hovered: null, posOv: {}, nextId: 0,
    selCid: null, mode: 'orbit', selVeh: null
  }).current;

  // Sync React State to Engine
  useEffect(() => { tState.selCid = selCid; }, [selCid]);
  useEffect(() => { tState.mode = mode; }, [mode]);
  useEffect(() => { tState.selVeh = selVeh; }, [selVeh]);

  // Fetch Veiculos from API
  useEffect(() => {
    const fetchVeiculos = async () => {
      try {
        const response = await api.get('/admin/veiculos');
        const veiculosFormatados = response.data.map((v, index) => {
          const L = parseFloat(v.comprimento);
          const W = parseFloat(v.largura);
          const H = parseFloat(v.altura);
          const vol = L * W * H;

          // Inferir tipo caso não venha
          let type = 'truck';
          if (L < 4) type = 'small';
          else if (L < 5) type = 'van';
          else if (L > 10) type = 'semi';

          return {
            id: v.id || `v_${index}`,
            name: v.nome || v.name || `Veículo ${index + 1}`,
            icon: v.icon || '🚛',
            L, W, H, vol,
            type: v.tipo || type,
            original: v
          };
        });

        setVeiculosBD(veiculosFormatados);
        if (veiculosFormatados.length > 0) {
          setSelVeh(veiculosFormatados[0].id);
        }
      } catch (error) {
        console.error("Erro ao buscar veículos:", error);
        alert("Erro ao carregar os veículos do banco de dados.");
      } finally {
        setCarregando(false);
      }
    };
    fetchVeiculos();
  }, []);

  useEffect(() => {
    if (location.state?.abrirRelatorio) {
      setShowRelatorio(true);
      window.history.replaceState({}, document.title);
    }
  }, [location]);

  // ─── UTILS ──────────────────────────────────────────────────────────────────
  const toM = (v) => unit === 'cm' ? v / 100 : v;
  const fmt = (v) => unit === 'm' ? v.toFixed(2) + 'm' : (v * 100).toFixed(0) + 'cm';
  const totalVol = () => cargos.reduce((s, c) => s + c.l * c.w * c.h * c.qty, 0);
  
  const getSelMesh = (cid) => {
    if (!tState.cargoGrp) return null;
    return tState.cargoGrp.children.find(c => c.isMesh && c.userData.movable && c.userData.cid === cid);
  };
  
  const updateSelBar = (mesh) => {
    if (!mesh) {
      if (selBarWrapperRef.current) selBarWrapperRef.current.style.display = 'none';
      return;
    }
    if (selBarWrapperRef.current) selBarWrapperRef.current.style.display = 'flex';
    if (selBarRefs.current.sn) selBarRefs.current.sn.textContent = mesh.userData.label;
    if (selBarRefs.current.sx) selBarRefs.current.sx.textContent = mesh.position.x.toFixed(2) + 'm';
    if (selBarRefs.current.sy) selBarRefs.current.sy.textContent = mesh.position.y.toFixed(2) + 'm';
    if (selBarRefs.current.sz) selBarRefs.current.sz.textContent = mesh.position.z.toFixed(2) + 'm';
  };

  const syncPanel = (mesh) => {
    if (!mesh) return;
    const cid = mesh.userData.cid;
    const refs = panelRefs.current[cid];
    if (refs) {
      if (refs.px) refs.px.value = mesh.position.x.toFixed(3);
      if (refs.py) refs.py.value = mesh.position.y.toFixed(3);
      if (refs.pz) refs.pz.value = mesh.position.z.toFixed(3);
    }
  };
  
  const syncEdges = (mesh) => {
    tState.cargoGrp.children.forEach(c => {
      if (c.isLineSegments && c.userData.linkedTo === mesh.uuid) c.position.copy(mesh.position);
      if (c.userData.topOf === mesh.uuid) { c.position.x = mesh.position.x; c.position.z = mesh.position.z; }
    });
  };

  const updateCam = useCallback(() => {
    if (!tState.cam) return;
    const x = tState.radius * Math.sin(tState.phi) * Math.sin(tState.theta);
    const y = tState.radius * Math.cos(tState.phi);
    const z = tState.radius * Math.sin(tState.phi) * Math.cos(tState.theta);
    tState.cam.position.set(x + tState.panX, Math.max(0.3, y + tState.panY), z);
    tState.cam.lookAt(tState.panX, tState.panY, 0);
  }, []);
  
  const resetCam = () => {
    const v = veiculosBD.find(x => x.id === tState.selVeh);
    if (!v) return;
    tState.radius = Math.max(v.L, v.H) * 1.9 + 8;
    tState.theta = 0.7; tState.phi = 0.42; tState.panX = 0;
    tState.panY = v.H * 0.5;
    updateCam();
  };

  const setView = (t) => {
    if (t === 'top') { tState.phi = 0.04; tState.theta = 0.001; }
    if (t === 'front') { tState.phi = Math.PI / 2 - 0.04; tState.theta = 0.001; }
    if (t === 'side') { tState.phi = Math.PI / 2 - 0.04; tState.theta = Math.PI / 2; }
    updateCam();
  };

  // ─── THREEJS SETUP ──────────────────────────────────────────────────────────
  useEffect(() => {
    if (tState.scene || !canvasRef.current || !wrapRef.current || carregando) return;

    tState.scene = new THREE.Scene();
    tState.scene.background = new THREE.Color(0x060910);
    tState.scene.fog = new THREE.FogExp2(0x060910, 0.009);

    tState.cam = new THREE.PerspectiveCamera(40, wrapRef.current.clientWidth / wrapRef.current.clientHeight, 0.05, 600);
    updateCam();

    tState.renderer = new THREE.WebGLRenderer({ canvas: canvasRef.current, antialias: true });
    tState.renderer.setSize(wrapRef.current.clientWidth, wrapRef.current.clientHeight);
    tState.renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
    tState.renderer.shadowMap.enabled = true;
    tState.renderer.shadowMap.type = THREE.PCFSoftShadowMap;
    tState.renderer.toneMapping = THREE.ACESFilmicToneMapping;
    tState.renderer.toneMappingExposure = 1.18;

    tState.raycaster = new THREE.Raycaster();

    tState.scene.add(new THREE.AmbientLight(0xccddf0, 0.5));
    const sun = new THREE.DirectionalLight(0xfffaf0, 3.2);
    sun.position.set(30, 55, 25);
    sun.castShadow = true;
    sun.shadow.mapSize.set(2048, 2048);
    sun.shadow.camera.near = 0.5; sun.shadow.camera.far = 350;
    sun.shadow.camera.left = -90; sun.shadow.camera.right = 90;
    sun.shadow.camera.top = 90; sun.shadow.camera.bottom = -90;
    tState.scene.add(sun);
    
    const fill = new THREE.DirectionalLight(0x88aaee, 0.65);
    fill.position.set(-25, 15, -20); tState.scene.add(fill);
    tState.scene.add(new THREE.HemisphereLight(0x445566, 0x111122, 0.5));

    const grid = new THREE.GridHelper(160, 100, 0x192438, 0x101c2e);
    tState.scene.add(grid);
    
    const fMesh = new THREE.Mesh(new THREE.PlaneGeometry(160, 160), new THREE.ShadowMaterial({ opacity: 0.28 }));
    fMesh.rotation.x = -Math.PI / 2; fMesh.receiveShadow = true;
    tState.scene.add(fMesh);

    tState.vehGrp = new THREE.Group(); tState.scene.add(tState.vehGrp);
    tState.cargoGrp = new THREE.Group(); tState.scene.add(tState.cargoGrp);
    tState.dragPlane = new THREE.Plane();
    tState.dragOff = new THREE.Vector3();
    
    const loop = () => {
      requestAnimationFrame(loop);
      if (tState.renderer && tState.scene && tState.cam) tState.renderer.render(tState.scene, tState.cam);
    };
    loop();

    const onResize = () => {
      if (!wrapRef.current || !tState.cam || !tState.renderer) return;
      tState.cam.aspect = wrapRef.current.clientWidth / wrapRef.current.clientHeight;
      tState.cam.updateProjectionMatrix();
      tState.renderer.setSize(wrapRef.current.clientWidth, wrapRef.current.clientHeight);
    };
    window.addEventListener('resize', onResize);
    return () => window.removeEventListener('resize', onResize);
  }, [updateCam, carregando, tState]);

  // ─── SCENE BUILDING ─────────────────────────────────────────────────────────
  const buildScene = useCallback(() => {
    if (!tState.scene || !tState.vehGrp || !tState.cargoGrp) return;
    while (tState.vehGrp.children.length) tState.vehGrp.remove(tState.vehGrp.children[0]);
    while (tState.cargoGrp.children.length) tState.cargoGrp.remove(tState.cargoGrp.children[0]);

    const v = veiculosBD.find(x => x.id === selVeh);
    if (!v) return;

    buildVehicle(v, tState, THREE);
    placeCargos(v, cargos, tState, selCid, THREE);

    if (selCid !== null) {
      const mesh = getSelMesh(selCid);
      if (mesh) { mesh.material.emissive.setHex(0x001a2a); syncPanel(mesh); updateSelBar(mesh); }
    } else {
      updateSelBar(null);
    }
  }, [selVeh, cargos, selCid, veiculosBD, tState]);
  
  useEffect(() => { buildScene(); }, [selVeh, cargos, buildScene]);

  // ─── EVENT HANDLERS ─────────────────────────────────────────────────────────
  const getNDC = (e) => {
    const r = tState.renderer.domElement.getBoundingClientRect();
    return new THREE.Vector2(((e.clientX - r.left) / r.width) * 2 - 1, -((e.clientY - r.top) / r.height) * 2 + 1);
  };
  
  const getHit = (ndc) => {
    tState.raycaster.setFromCamera(ndc, tState.cam);
    const meshes = tState.cargoGrp.children.filter(c => c.isMesh && c.userData.movable);
    const hits = tState.raycaster.intersectObjects(meshes, false);
    return hits.length ? hits[0] : null;
  };
  
  const onMD = (e) => {
    tState.lastMX = e.clientX; tState.lastMY = e.clientY;
    if (tState.mode === 'drag') {
      const hit = getHit(getNDC(e));
      if (hit && hit.object.userData.movable) {
        tState.dragging = true; tState.dragObj = hit.object;
        setSelCid(hit.object.userData.cid);
        const ch = tState.dragObj.geometry.parameters.height;
        tState.dragPlane.set(new THREE.Vector3(0, 1, 0), -(tState.dragObj.position.y - ch / 2));
        const pt = new THREE.Vector3();
        tState.raycaster.ray.intersectPlane(tState.dragPlane, pt);
        tState.dragOff.copy(pt).sub(tState.dragObj.position); tState.dragOff.y = 0;
      } else { tState.orbiting = true; }
    } else {
      if (e.buttons === 1) {
        const hit2 = getHit(getNDC(e));
        if (hit2 && hit2.object.userData.movable) setSelCid(hit2.object.userData.cid);
        tState.orbiting = true;
      }
      if (e.buttons === 2) tState.panning = true;
    }
  };

  const onMM = (e) => {
    const dx = e.clientX - tState.lastMX;
    const dy = e.clientY - tState.lastMY;
    tState.lastMX = e.clientX; tState.lastMY = e.clientY;
    
    if (tState.dragging && tState.dragObj) {
      tState.raycaster.setFromCamera(getNDC(e), tState.cam);
      const pt = new THREE.Vector3();
      if (tState.raycaster.ray.intersectPlane(tState.dragPlane, pt)) {
        const v = veiculosBD.find(x => x.id === tState.selVeh);
        if (!v) return;
        const newX = pt.x - tState.dragOff.x; const newZ = pt.z - tState.dragOff.z;
        const hw = v.L / 2, hd = v.W / 2;
        const chl = tState.dragObj.geometry.parameters.width / 2;
        const chd = tState.dragObj.geometry.parameters.depth / 2;
        tState.dragObj.position.x = Math.max(-hw + chl, Math.min(hw - chl, newX));
        tState.dragObj.position.z = Math.max(-hd + chd, Math.min(hd - chd, newZ));
        syncEdges(tState.dragObj);
        const key = tState.dragObj.userData.posKey;
        if (key) tState.posOv[key] = { x: tState.dragObj.position.x, y: tState.dragObj.position.y, z: tState.dragObj.position.z };
        updateSelBar(tState.dragObj);
        syncPanel(tState.dragObj);
      }
      return;
    }
    
    if (tState.orbiting) {
      tState.theta -= dx * 0.007;
      tState.phi = Math.max(0.04, Math.min(Math.PI / 2 - 0.03, tState.phi + dy * 0.007));
      updateCam();
    }
    if (tState.panning) {
      const s = tState.radius * 0.0014;
      tState.panX -= dx * s; tState.panY += dy * s; updateCam();
    }
    
    if (tState.mode === 'drag') {
      const hit = getHit(getNDC(e));
      const obj = hit ? hit.object : null;
      if (obj !== tState.hovered) {
        if (tState.hovered && tState.hovered.userData.cid !== tState.selCid) {
          tState.hovered.material.emissive.setHex(tState.hovered.userData.inBay ? 0 : 0x380000);
        }
        tState.hovered = (obj && obj.userData.movable) ? obj : null;
        if (tState.hovered && tState.hovered.userData.cid !== tState.selCid) {
          tState.hovered.material.emissive.setHex(0x0a1a0a);
        }
        if (canvasRef.current) canvasRef.current.style.cursor = tState.hovered ? 'grab' : 'crosshair';
      }
    }
  };

  const onMU = () => {
    tState.orbiting = false;
    tState.panning = false;
    if (tState.dragging) {
      tState.dragging = false; tState.dragObj = null;
      if (canvasRef.current) canvasRef.current.style.cursor = tState.mode === 'drag' ? 'crosshair' : 'default';
    }
  };
  
  const onWheel = (e) => { tState.radius = Math.max(1.5, Math.min(130, tState.radius + e.deltaY * 0.05)); updateCam(); };
  
  // Update emissive on selection change
  useEffect(() => {
    if (!tState.cargoGrp) return;
    tState.cargoGrp.children.forEach(c => {
      if (c.isMesh && c.userData.movable) {
        if (c.userData.cid === selCid) c.material.emissive.setHex(0x001a2a);
        else c.material.emissive.setHex(c.userData.inBay ? 0 : 0x380000);
      }
    });
  }, [selCid, tState]);
  
  // Mode change
  useEffect(() => {
    if (canvasRef.current) canvasRef.current.style.cursor = mode === 'drag' ? 'crosshair' : 'default';
    if (mode === 'orbit' && tState.hovered) {
      if (tState.hovered.userData.cid !== selCid) tState.hovered.material.emissive.setHex(tState.hovered.userData.inBay ? 0 : 0x380000);
      tState.hovered = null;
    }
  }, [mode, selCid, tState]);

  // ─── UI LOGIC ───────────────────────────────────────────────────────────────
  const checkFit = (v) => {
    if (!cargos.length) return '';
    const vol = totalVol();
    const bv = v.vol || (v.L * v.W * v.H);
    const dimOk = cargos.every(c => c.l <= v.L && c.w <= v.W && c.h <= v.H);
    if (!dimOk || vol > bv) return 'over';
    if (vol / bv > 0.85) return 'tight';
    return 'ok';
  };
  
  const handleAddCargo = () => {
    const name = form.name.trim() || ('Carga ' + (cargos.length + 1));
    const lv = parseFloat(form.l), wv = parseFloat(form.w), hv = parseFloat(form.h);
    const qty = parseInt(form.qty) || 1;
    if (!lv || !wv || !hv || lv <= 0 || wv <= 0 || hv <= 0) {
      alert('Preencha todas as dimensões com valores maiores que zero.');
      return;
    }
    tState.nextId++;
    setCargos([...cargos, { id: tState.nextId, name, l: toM(lv), w: toM(wv), h: toM(hv), qty, color: selColor }]);
    setForm({ ...form, name: '' });
  };

  const handleDelCargo = (id) => {
    setCargos(c => c.filter(x => x.id !== id));
    Object.keys(tState.posOv).forEach(k => { if (k.split('_')[0] == id) delete tState.posOv[k]; });
    if (selCid === id) setSelCid(null);
  };
  
  const handleSelectVeh = (id) => {
    setSelVeh(id);
    resetCam();
  };
  
  const applyPos = (cid) => {
    const v = veiculosBD.find(x => x.id === tState.selVeh);
    if (!v) return;
    const gc = getGC(v.type);
    const px = parseFloat(panelRefs.current[cid]?.px?.value) || 0;
    const py = parseFloat(panelRefs.current[cid]?.py?.value) || 0;
    const pz = parseFloat(panelRefs.current[cid]?.pz?.value) || 0;
    const mesh = getSelMesh(cid);
    if (!mesh) return;
    
    const hw = v.L / 2, hd = v.W / 2;
    const chl = mesh.geometry.parameters.width / 2;
    const chv = mesh.geometry.parameters.height / 2;
    const chd = mesh.geometry.parameters.depth / 2;
    mesh.position.x = Math.max(-hw + chl, Math.min(hw - chl, px));
    mesh.position.y = Math.max(gc + chv, Math.min(gc + v.H - chv, py));
    mesh.position.z = Math.max(-hd + chd, Math.min(hd - chd, pz));
    syncEdges(mesh);

    const key = mesh.userData.posKey;
    if (key) tState.posOv[key] = { x: mesh.position.x, y: mesh.position.y, z: mesh.position.z };
    updateSelBar(mesh);
    syncPanel(mesh);
  };
  
  const nudge = (cid, axis, delta) => {
    const el = panelRefs.current[cid]?.[`p${axis}`];
    if (el) {
      el.value = (parseFloat(el.value) || 0) + delta;
      applyPos(cid);
    }
  };
  
  const resetPos = (cid) => {
    Object.keys(tState.posOv).forEach(k => { if (k.split('_')[0] == cid) delete tState.posOv[k]; });
    buildScene();
  };

  const focusCargo = (cid) => {
    const mesh = getSelMesh(cid);
    if (!mesh) return;
    tState.panX = mesh.position.x;
    tState.panY = mesh.position.y; updateCam();
  };

  if (carregando) return <div style={{ color: 'white', padding: 20 }}>Carregando Motor 3D e Frota...</div>;
  if (!veiculosBD || veiculosBD.length === 0) return <div style={{ color: 'white', padding: 20 }}>Nenhum veículo cadastrado no sistema.</div>;

  // Stats Logic
  const actVeh = veiculosBD.find(x => x.id === selVeh);
  const vVol = totalVol();
  const vBv = actVeh ? (actVeh.vol || (actVeh.L * actVeh.W * actVeh.H)) : 0;
  const vPct = vBv ? Math.round(vVol / vBv * 100) : 0;
  
  let fCls = '', fChip = 'Aguardando', fChipCls = 'chip-idle', fSv = '—', fBg = 'var(--muted)';
  if (actVeh) {
    if (!cargos.length) { fChip = 'Sem cargas'; fBg = 'var(--muted)'; }
    else if (vPct > 100) { fCls = 'sv-over'; fChip = 'Excede capacidade'; fChipCls = 'chip-over'; fSv = 'Excede!'; fBg = 'var(--red)'; }
    else if (vPct > 85) { fCls = 'sv-tight'; fChip = 'Espaço apertado'; fChipCls = 'chip-tight'; fSv = 'Ajustado'; fBg = 'var(--yellow)'; }
    else { fCls = 'sv-ok'; fChip = 'Cabe perfeitamente'; fChipCls = 'chip-ok'; fSv = '✓ OK'; fBg = 'var(--green)'; }
  }

  return (
    <div className="medidor-wrapper-3d">
      <header className="header-top">
        <div className="logo-txt">
          <button onClick={() => navigate(-1)} className="btn-voltar" title="Voltar">
            <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M18 6 6 18"/><path d="m6 6 12 12"/></svg>
            VOLTAR
          </button>
          <span>CARGO<em>FIT</em> <span style={{ fontSize: '0.7rem', color: 'var(--muted)', fontWeight: 400, letterSpacing: '1px', marginLeft: '3px' }}>3D</span></span>
        </div>
        <div className="hrtags">
          <span className="tag tag-b">VISUALIZAÇÃO 3D</span>
          <span className="tag tag-o" onClick={() => setShowRelatorio(true)}>📄 VER MANIFESTO</span>
        </div>
      </header>

      <div className="layout">
        <aside className="sidebar">
          <div className="sb-scroll">
            <div className="sec">
              <div className="stitle">Unidade de Medida</div>
              <div className="urow">
                <button className={`ubtn ${unit === 'm' ? 'on' : ''}`} onClick={() => setUnit('m')}>Metros (m)</button>
                <button className={`ubtn ${unit === 'cm' ? 'on' : ''}`} onClick={() => setUnit('cm')}>Centímetros (cm)</button>
              </div>
            </div>

            <div className="sec">
              <div className="stitle">Nova Carga</div>
              <div style={{ display: 'flex', flexDirection: 'column', gap: '7px' }}>
                <div className="field">
                  <label>Nome</label>
                  <input type="text" value={form.name} onChange={e => setForm({ ...form, name: e.target.value })} placeholder="Ex: Pallet A" />
                </div>
                <div className="g3">
                  <div className="field">
                    <label>Comp.</label>
                    <input type="number" value={form.l} onChange={e => setForm({ ...form, l: e.target.value })} placeholder={unit === 'm' ? '0.00' : '0'} step={unit === 'm' ? '0.01' : '1'} min={unit === 'm' ? '0.01' : '1'} />
                  </div>
                  <div className="field">
                    <label>Larg.</label>
                    <input type="number" value={form.w} onChange={e => setForm({ ...form, w: e.target.value })} placeholder={unit === 'm' ? '0.00' : '0'} step={unit === 'm' ? '0.01' : '1'} min={unit === 'm' ? '0.01' : '1'} />
                  </div>
                  <div className="field">
                    <label>Alt.</label>
                    <input type="number" value={form.h} onChange={e => setForm({ ...form, h: e.target.value })} placeholder={unit === 'm' ? '0.00' : '0'} step={unit === 'm' ? '0.01' : '1'} min={unit === 'm' ? '0.01' : '1'} />
                  </div>
                </div>
                <div className="field">
                  <label>Quantidade</label>
                  <input type="number" value={form.qty} onChange={e => setForm({ ...form, qty: e.target.value })} min="1" max="200" />
                </div>
                <div className="field">
                  <label>Cor</label>
                  <div className="clrs">
                    {PALETTE.map(c => (
                      <div key={c} className={`clr ${selColor === c ? 'on' : ''}`} style={{ background: c }} onClick={() => setSelColor(c)}></div>
                    ))}
                  </div>
                </div>
              </div>
              <button className="btn-add" onClick={handleAddCargo}>＋ ADICIONAR CARGA</button>
            </div>

            <div className="sec">
              <div className="stitle">
                Cargas
                <span id="cnt" style={{ background: 'var(--accent)', color: '#000', padding: '1px 7px', borderRadius: '10px', fontSize: '0.56rem' }}>{cargos.length}</span>
                <span style={{ color: 'var(--muted)', fontSize: '0.56rem', marginLeft: 'auto', fontWeight: 400, textTransform: 'none', letterSpacing: 0 }}>Clique para posicionar</span>
              </div>
              <div className="clist">
                {cargos.length === 0 ? (
                  <div className="no-c">Nenhuma carga adicionada.</div>
                ) : (
                  cargos.map(c => {
                    const vol = (c.l * c.w * c.h * c.qty).toFixed(3);
                    const isSel = selCid === c.id;
                    return (
                      <div key={c.id} className={`ci ${isSel ? 'sel' : ''}`} onClick={() => setSelCid(c.id)}>
                        <div className="ci-top">
                          <div className="ci-dot" style={{ background: c.color }}></div>
                          <div className="ci-body">
                            <div className="ci-name">{c.name}{c.qty > 1 && <span className="ci-qty">×{c.qty}</span>}</div>
                            <div className="ci-dim">{fmt(c.l)} × {fmt(c.w)} × {fmt(c.h)}</div>
                            <div className="ci-vol">{vol} m³ total</div>
                          </div>
                          <div className="ci-acts">
                            <button className="ci-act" onClick={(e) => { e.stopPropagation(); focusCargo(c.id); }} title="Focar">◎</button>
                            <button className="ci-act ci-del" onClick={(e) => { e.stopPropagation(); handleDelCargo(c.id); }} title="Remover">✕</button>
                          </div>
                        </div>
                        <div className="pp" onClick={(e) => e.stopPropagation()}>
                          <div className="pp-title">📍 Posição Manual</div>
                          <div className="pp-grid">
                            <div className="pp-field">
                              <label style={{ color: '#ff8866' }}>Eixo X</label>
                              <div className="pp-iw">
                                <input type="number" defaultValue="0" step="0.05" onChange={() => applyPos(c.id)} ref={el => { if (!panelRefs.current[c.id]) panelRefs.current[c.id] = {}; panelRefs.current[c.id].px = el; }} />
                                <span className="pp-suf">m</span>
                              </div>
                              <div className="pp-arrows">
                                <div className="pp-arr" onClick={() => nudge(c.id, 'x', -0.1)}>◀</div>
                                <div className="pp-arr" onClick={() => nudge(c.id, 'x', 0.1)}>▶</div>
                              </div>
                            </div>
                            <div className="pp-field">
                              <label style={{ color: '#88ff88' }}>Eixo Y</label>
                              <div className="pp-iw">
                                <input type="number" defaultValue="0" step="0.05" onChange={() => applyPos(c.id)} ref={el => { if (!panelRefs.current[c.id]) panelRefs.current[c.id] = {}; panelRefs.current[c.id].py = el; }} />
                                <span className="pp-suf">m</span>
                              </div>
                              <div className="pp-arrows">
                                <div className="pp-arr" onClick={() => nudge(c.id, 'y', -0.1)}>▼</div>
                                <div className="pp-arr" onClick={() => nudge(c.id, 'y', 0.1)}>▲</div>
                              </div>
                            </div>
                            <div className="pp-field">
                              <label style={{ color: '#66aaff' }}>Eixo Z</label>
                              <div className="pp-iw">
                                <input type="number" defaultValue="0" step="0.05" onChange={() => applyPos(c.id)} ref={el => { if (!panelRefs.current[c.id]) panelRefs.current[c.id] = {}; panelRefs.current[c.id].pz = el; }} />
                                <span className="pp-suf">m</span>
                              </div>
                              <div className="pp-arrows">
                                <div className="pp-arr" onClick={() => nudge(c.id, 'z', -0.1)}>◀</div>
                                <div className="pp-arr" onClick={() => nudge(c.id, 'z', 0.1)}>▶</div>
                              </div>
                            </div>
                          </div>
                          <div className="pp-btns">
                            <div className="pp-btn ok" onClick={() => applyPos(c.id)}>✓ Aplicar</div>
                            <div className="pp-btn" onClick={() => resetPos(c.id)}>↺ Resetar</div>
                          </div>
                        </div>
                      </div>
                    );
                  })
                )}
              </div>
            </div>

            <div className="sec" style={{ paddingBottom: '18px' }}>
              <div className="stitle">Veículo</div>
              <div className="vgrid">
                {veiculosBD.map(v => (
                  <div key={v.id} className={`vc ${selVeh === v.id ? 'on' : ''}`} onClick={() => handleSelectVeh(v.id)}>
                    <div className={`fdot ${checkFit(v)}`}></div>
                    <span className="vc-icon">{v.icon}</span>
                    <div className="vc-name">{v.name}</div>
                    <div className="vc-dim">{v.L}×{v.W}×{v.H}m · {v.vol ? v.vol.toFixed(1) + ' m³' : '2×deck'}</div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </aside>

        <div className="main-view">
          <div className="topbar">
            <div>
              <div className="veh-lbl">{actVeh ? actVeh.name : 'Selecione um veículo →'}</div>
              <div className="veh-sub">{actVeh ? `Baú: ${actVeh.L}m × ${actVeh.W}m × ${actVeh.H}m  |  Vol: ${actVeh.vol ? actVeh.vol.toFixed(1) + ' m³' : '2 compartimentos'}` : 'Escolha na lista à esquerda'}</div>
            </div>
            <div className={`chip ${fChipCls}`}>{fChip}</div>
          </div>

          <div id="cwrap" ref={wrapRef}>
            <canvas id="c" tabIndex={0} ref={canvasRef}
              onMouseDown={onMD} onMouseMove={onMM} onMouseUp={onMU} onMouseLeave={onMU} onWheel={onWheel}
              onContextMenu={e => e.preventDefault()} />

            {!selVeh && (
              <div className="hint"><h3>🚛 VISUALIZAÇÃO 3D</h3><p>Adicione cargas e selecione um veículo</p></div>
            )}

            {selVeh && (
              <>
                <div className="modebar">
                  <button className={`mbtn ${mode === 'orbit' ? 'on' : ''}`} onClick={() => setMode('orbit')}>⟳ Girar Câmera</button>
                  <div className="msep"></div>
                  <button className={`mbtn ${mode === 'drag' ? 'on' : ''}`} onClick={() => setMode('drag')}>✥ Arrastar Carga</button>
                </div>

                <div className="info">
                  <b>Girar:</b> Arrastar<br />
                  <b>Zoom:</b> Scroll<br />
                  <b>Pan:</b> Btn direito<br />
                  <b>Arrastar carga:</b> Modo ✥
                </div>

                <div className="cambtns">
                  <div className="cbtn" onClick={resetCam} title="Reset">⟳</div>
                  <div className="cbtn" onClick={() => setView('top')} title="Topo">⊤</div>
                  <div className="cbtn" onClick={() => setView('front')} title="Frontal">▣</div>
                  <div className="cbtn" onClick={() => setView('side')} title="Lateral">◧</div>
                </div>

                <div className="selbar" ref={selBarWrapperRef}>
                  <span className="sn" ref={el => selBarRefs.current.sn = el}>—</span>
                  <div className="sc">
                    <span>X:<span className="sx" ref={el => selBarRefs.current.sx = el}>0</span></span>
                    <span>Y:<span className="sy" ref={el => selBarRefs.current.sy = el}>0</span></span>
                    <span>Z:<span className="sz" ref={el => selBarRefs.current.sz = el}>0</span></span>
                  </div>
                </div>
              </>
            )}
          </div>

          {selVeh && (
            <div className="statsbar">
              <div className="stat"><div className="sl">Vol. Cargas</div><div className="sv">{vVol.toFixed(3)} m³</div></div>
              <div className="stat"><div className="sl">Vol. Baú</div><div className="sv">{actVeh.vol || vBv.toFixed(1)} m³</div></div>
              <div className="occ">
                <div className="occ-row">
                  <span className="sl">Ocupação</span>
                  <span className={`sv ${fCls}`} style={{ fontSize: '0.88rem' }}>{Math.min(200, vPct)}%</span>
                </div>
                <div className="occ-track"><div className="occ-fill" style={{ width: `${Math.min(100, vPct)}%`, background: fBg }}></div></div>
              </div>
              <div className="stat"><div className="sl">Status</div><div className={`sv ${fCls}`}>{fSv}</div></div>
            </div>
          )}
        </div>
      </div>

      {showRelatorio && (
        <ModalRelatorio veiculo={actVeh} cargas={cargos} volumeTotal={vVol} ocupacao={vPct} onClose={() => setShowRelatorio(false)} />
      )}
    </div>
  );
}

function ModalRelatorio({ veiculo, cargas, volumeTotal, ocupacao, onClose }) {
  if (!veiculo) return null;
  return (
    <div className="modal-overlay-3d">
      <div className="modal-backdrop-3d" onClick={onClose}></div>
      <div className="modal-card-3d">
        <header className="modal-header-3d">
          <h2 className="modal-title-3d">Resumo do Carregamento</h2>
          <button onClick={onClose} className="modal-close-btn-3d">✕</button>
        </header>
        <div className="modal-body-3d">
          <div className="modal-summary-grid">
            <div className="summary-card-3d">
              <p className="summary-label">Veículo Base</p>
              <p className="summary-value">{veiculo.name}</p>
            </div>
            <div className="summary-card-3d">
              <p className="summary-label">Ocupação Volumétrica</p>
              <p className="summary-value" style={{ color: ocupacao > 100 ? '#ff4444' : '#00e676' }}>{ocupacao}%</p>
            </div>
          </div>
          <div className="modal-table-container">
            {cargas.length === 0 ? <p className="modal-table-empty">Nenhuma carga adicionada.</p> : cargas.map(c => (
              <div key={c.id} className="modal-table-row">
                  <div className="item-with-dot">
                    <div className="item-dot" style={{ backgroundColor: c.color }}></div>
                    <span>{c.name}</span>
                  </div>
                  <strong>{c.qty} un.</strong>
              </div>
            ))}
          </div>
        </div>
        <footer className="modal-footer-3d">
          <button onClick={onClose} className="btn-finalizar-3d">Fechar</button>
        </footer>
      </div>
    </div>
  );
}