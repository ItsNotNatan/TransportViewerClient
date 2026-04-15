// src/pages/MedidorCargas/MedidorCargas.jsx
import React, { useState, useEffect, useRef, useCallback } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import * as THREE from 'three';
import api from '../../services/api';
import './MedidorCargas.css';

import { VEHICLES } from '../../components/CargoForm/constants';
import { buildVehicle, placeCargos } from './engine3D';

// Componentes modulares
import ModalRelatorio from '../../components/ModalRelatorio/ModalRelatorio';
import CargoForm from '../../components/CargoForm/CargoForm';
import VehicleGrid from '../../components/VehicleGrid/VehicleGrid';

export default function MedidorCargas() {
  const navigate = useNavigate();
  const location = useLocation();

  const [veiculosBD, setVeiculosBD] = useState([]);
  const [carregando, setCarregando] = useState(true);
  const [showRelatorio, setShowRelatorio] = useState(false);

  const canvasRef = useRef(null);
  const wrapRef = useRef(null);
  const selBarWrapperRef = useRef(null);

  const [unit, setUnit] = useState('m');
  const [cargos, setCargos] = useState([]);
  const [selVeh, setSelVeh] = useState(null);
  const [selCid, setSelCid] = useState(null);
  const [mode, setMode] = useState('orbit');

  const panelRefs = useRef({});
  const selBarRefs = useRef({ sx: null, sy: null, sz: null, sn: null });

  const tState = useRef({
    scene: null, cam: null, renderer: null, raycaster: null,
    vehGrp: null, cargoGrp: null,
    theta: 0.7, phi: 0.42, radius: 18, panX: 0, panY: 0,
    orbiting: false, panning: false, lastMX: 0, lastMY: 0,
    dragging: false, dragObj: null, dragPlane: null, dragOff: null,
    hovered: null, posOv: {}, nextId: 0,
    selCid: null, mode: 'orbit', selVeh: null
  }).current;

  useEffect(() => { tState.selCid = selCid; }, [selCid]);
  useEffect(() => { tState.mode = mode; }, [mode]);
  useEffect(() => { tState.selVeh = selVeh; }, [selVeh]);

  useEffect(() => {
    const fetchVeiculos = async () => {
      try {
        const response = await api.get('/admin/veiculos');
        const veiculosFormatados = response.data.map((v, index) => {
          const L = parseFloat(v.comprimento);
          const W = parseFloat(v.largura);
          const H = parseFloat(v.altura);
          const vol = L * W * H;

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
        if (veiculosFormatados.length > 0) setSelVeh(veiculosFormatados[0].id);
      } catch (error) {
        console.error("Erro ao buscar veículos, usando fallback:", error);
        setVeiculosBD(VEHICLES);
        if (VEHICLES.length > 0) setSelVeh(VEHICLES[0].id);
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

  // ─── THREEJS SETUP ───────────────
  useEffect(() => {
    if (tState.scene || !canvasRef.current || !wrapRef.current || carregando) return;

    tState.scene = new THREE.Scene();
    tState.scene.background = new THREE.Color(0xf1f5f9);
    tState.scene.fog = new THREE.FogExp2(0xf1f5f9, 0.009);

    tState.cam = new THREE.PerspectiveCamera(40, wrapRef.current.clientWidth / wrapRef.current.clientHeight, 0.05, 600);
    updateCam();

    tState.renderer = new THREE.WebGLRenderer({ canvas: canvasRef.current, antialias: true });
    tState.renderer.setSize(wrapRef.current.clientWidth, wrapRef.current.clientHeight);
    tState.renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
    tState.renderer.shadowMap.enabled = true;
    tState.renderer.shadowMap.type = THREE.PCFSoftShadowMap;
    tState.renderer.toneMapping = THREE.ACESFilmicToneMapping;
    tState.renderer.toneMappingExposure = 1.0;

    tState.raycaster = new THREE.Raycaster();

    tState.scene.add(new THREE.AmbientLight(0xffffff, 0.6));
    const sun = new THREE.DirectionalLight(0xffffff, 2.0);
    sun.position.set(30, 55, 25);
    sun.castShadow = true;
    sun.shadow.mapSize.set(2048, 2048);
    tState.scene.add(sun);
    
    const fill = new THREE.DirectionalLight(0xffffff, 1.2);
    fill.position.set(-25, 15, -20); tState.scene.add(fill);
    tState.scene.add(new THREE.HemisphereLight(0xffffff, 0xe2e8f0, 0.8));

    const grid = new THREE.GridHelper(160, 100, 0x94a3b8, 0xcbd5e1);
    tState.scene.add(grid);
    
    const fMesh = new THREE.Mesh(new THREE.PlaneGeometry(160, 160), new THREE.ShadowMaterial({ opacity: 0.1 }));
    fMesh.rotation.x = -Math.PI / 2; fMesh.receiveShadow = true;
    tState.scene.add(fMesh);

    tState.vehGrp = new THREE.Group(); tState.scene.add(tState.vehGrp);
    tState.cargoGrp = new THREE.Group(); tState.scene.add(tState.cargoGrp);
    tState.dragPlane = new THREE.Plane();
    tState.dragOff = new THREE.Vector3();
    
    let reqId;
    const loop = () => {
      reqId = requestAnimationFrame(loop);
      if (tState.renderer && tState.scene && tState.cam) tState.renderer.render(tState.scene, tState.cam);
    };
    loop();

    const handleResize = () => {
      if (!wrapRef.current || !tState.cam || !tState.renderer) return;
      const width = wrapRef.current.clientWidth;
      const height = wrapRef.current.clientHeight;
      if (width === 0 || height === 0) return; 
      tState.cam.aspect = width / height;
      tState.cam.updateProjectionMatrix();
      tState.renderer.setSize(width, height);
    };

    const resizeObserver = new ResizeObserver(() => handleResize());
    if (wrapRef.current) resizeObserver.observe(wrapRef.current);

    return () => {
      cancelAnimationFrame(reqId);
      resizeObserver.disconnect();
    };
  }, [updateCam, carregando, tState]);

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
      if (mesh) { mesh.material.emissive.setHex(0x222222); syncPanel(mesh); updateSelBar(mesh); }
    } else {
      updateSelBar(null);
    }
  }, [selVeh, cargos, selCid, veiculosBD, tState]);
  
  useEffect(() => { buildScene(); }, [selVeh, cargos, buildScene]);

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

  // ─── 🛡️ LÓGICA DE COLISÃO AABB ───────────────
  const checkCollision = (mesh, newX, newY, newZ) => {
    // Cria a caixa invisível
    const boxA = new THREE.Box3().setFromObject(mesh);
    
    // Calcula para onde ela vai
    const dx = newX - mesh.position.x;
    const dy = newY - mesh.position.y;
    const dz = newZ - mesh.position.z;

    // Move a caixa invisível
    boxA.translate(new THREE.Vector3(dx, dy, dz));
    
    // Contrai a caixa 1 milímetro para não engatar borda com borda
    boxA.expandByScalar(-0.001); 

    // Checa contra todas as outras caixas
    for (let i = 0; i < tState.cargoGrp.children.length; i++) {
      const other = tState.cargoGrp.children[i];
      if (other.isMesh && other.userData.movable && other.uuid !== mesh.uuid) {
        const boxB = new THREE.Box3().setFromObject(other);
        boxB.expandByScalar(-0.001); 
        
        if (boxA.intersectsBox(boxB)) {
          return true; // Colisão detectada!
        }
      }
    }
    return false; // Caminho livre
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

  // ─── 🔄 MOVIMENTO DO MOUSE ATUALIZADO ───────────────
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
        
        const proposedX = pt.x - tState.dragOff.x; 
        const proposedZ = pt.z - tState.dragOff.z;
        
        // Limites das paredes do caminhão
        const hw = v.L / 2, hd = v.W / 2;
        const chl = tState.dragObj.geometry.parameters.width / 2;
        const chd = tState.dragObj.geometry.parameters.depth / 2;
        
        const clampedX = Math.max(-hw + chl, Math.min(hw - chl, proposedX));
        const clampedZ = Math.max(-hd + chd, Math.min(hd - chd, proposedZ));

        let finalX = tState.dragObj.position.x;
        let finalZ = tState.dragObj.position.z;

        // Tenta mover no eixo X
        if (!checkCollision(tState.dragObj, clampedX, tState.dragObj.position.y, finalZ)) {
          finalX = clampedX;
        }

        // Tenta mover no eixo Z
        if (!checkCollision(tState.dragObj, finalX, tState.dragObj.position.y, clampedZ)) {
          finalZ = clampedZ;
        }

        tState.dragObj.position.x = finalX;
        tState.dragObj.position.z = finalZ;
        
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
      tState.phi = Math.max(0.04, Math.min(Math.PI / 2 - 0.03, tState.phi - dy * 0.007));
      updateCam();
    }
    if (tState.panning) {
      const s = tState.radius * 0.0014;
      tState.panX -= dx * s; 
      tState.panY -= dy * s; 
      updateCam();
    }
    
    if (tState.mode === 'drag') {
      const hit = getHit(getNDC(e));
      const obj = hit ? hit.object : null;
      if (obj !== tState.hovered) {
        if (tState.hovered && tState.hovered.userData.cid !== tState.selCid) {
          tState.hovered.material.emissive.setHex(tState.hovered.userData.inBay ? 0x000000 : 0x440000);
        }
        tState.hovered = (obj && obj.userData.movable) ? obj : null;
        if (tState.hovered && tState.hovered.userData.cid !== tState.selCid) {
          tState.hovered.material.emissive.setHex(0x111111);
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
  
  useEffect(() => {
    if (!tState.cargoGrp) return;
    tState.cargoGrp.children.forEach(c => {
      if (c.isMesh && c.userData.movable) {
        if (c.userData.cid === selCid) c.material.emissive.setHex(0x222222);
        else c.material.emissive.setHex(c.userData.inBay ? 0x000000 : 0x440000);
      }
    });
  }, [selCid, tState]);
  
  useEffect(() => {
    if (canvasRef.current) canvasRef.current.style.cursor = mode === 'drag' ? 'crosshair' : 'default';
    if (mode === 'orbit' && tState.hovered) {
      if (tState.hovered.userData.cid !== selCid) tState.hovered.material.emissive.setHex(tState.hovered.userData.inBay ? 0x000000 : 0x440000);
      tState.hovered = null;
    }
  }, [mode, selCid, tState]);

  const checkFit = (v) => {
    if (!cargos.length) return '';
    const vol = totalVol();
    const bv = v.vol || (v.L * v.W * v.H);
    const dimOk = cargos.every(c => c.l <= v.L && c.w <= v.W && c.h <= v.H);
    if (!dimOk || vol > bv) return 'over';
    if (vol / bv > 0.85) return 'tight';
    return 'ok';
  };
  
  const handleAddCargo = (novaCarga) => {
    tState.nextId++;
    setCargos([...cargos, { 
      id: tState.nextId, 
      name: novaCarga.name || `Carga ${cargos.length + 1}`, 
      l: toM(novaCarga.l), 
      w: toM(novaCarga.w), 
      h: toM(novaCarga.h), 
      qty: novaCarga.qty, 
      color: novaCarga.color 
    }]);
  };

  const handleDelCargo = (id) => {
    setCargos(c => c.filter(x => x.id !== id));
    Object.keys(tState.posOv).forEach(k => { if (k.split('_')[0] == id) delete tState.posOv[k]; });
    if (selCid === id) setSelCid(null);
  };
  
const handleSelectVeh = (id) => {
    setSelVeh(id);
    
    // 🧹 Limpa todas as posições salvas ao trocar de veículo
    tState.posOv = {}; 
    
    // 🧹 Limpa também a carga selecionada para não bugar os painéis
    setSelCid(null); 
    
    resetCam();
  };
  
  const applyPos = (cid) => {
    const v = veiculosBD.find(x => x.id === tState.selVeh);
    if (!v) return;
    const px = parseFloat(panelRefs.current[cid]?.px?.value) || 0;
    const py = parseFloat(panelRefs.current[cid]?.py?.value) || 0;
    const pz = parseFloat(panelRefs.current[cid]?.pz?.value) || 0;
    const mesh = getSelMesh(cid);
    if (!mesh) return;
    
    const gc = require('../../components/CargoForm/constants').getGC(v.type);
    const hw = v.L / 2, hd = v.W / 2;
    const chl = mesh.geometry.parameters.width / 2;
    const chv = mesh.geometry.parameters.height / 2;
    const chd = mesh.geometry.parameters.depth / 2;
    
    const newX = Math.max(-hw + chl, Math.min(hw - chl, px));
    const newY = Math.max(gc + chv, Math.min(gc + v.H - chv, py));
    const newZ = Math.max(-hd + chd, Math.min(hd - chd, pz));

    mesh.position.set(newX, newY, newZ);
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

  if (carregando) {
    return (
      <div className="medidor-loading-screen">
        <div className="medidor-loading-content">
          <div className="medidor-spinner"></div>
          <h2 className="medidor-loading-title">Inicializando Motor 3D</h2>
          <p className="medidor-loading-text">Carregando frota de veículos e modelos físicos...</p>
        </div>
      </div>
    );
  }

  if (!veiculosBD || veiculosBD.length === 0) return <div style={{ color: 'var(--text)', padding: 20 }}>Nenhum veículo cadastrado no sistema.</div>;

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
        <div className="logo">
          <button onClick={() => navigate(-1)} style={{ background: 'none', border: 'none', cursor: 'pointer', color: 'var(--text)', display: 'flex', alignItems: 'center' }} title="Voltar">
            <svg xmlns="http://www.w3.org/2000/svg" width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M15 18l-6-6 6-6"/></svg>
          </button>
          <span>CARGO<em>FIT</em> <span style={{ fontSize: '0.7rem', color: 'var(--muted)', fontWeight: 600, letterSpacing: '1px', marginLeft: '3px' }}>3D</span></span>
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

            <CargoForm unit={unit} onAddCargo={handleAddCargo} />

            <div className="sec">
              <div className="stitle">
                Cargas
                <span id="cnt" style={{ background: 'var(--accent)', color: '#fff', padding: '2px 8px', borderRadius: '10px', fontSize: '0.6rem' }}>{cargos.length}</span>
                <span style={{ color: 'var(--muted)', fontSize: '0.6rem', marginLeft: 'auto', fontWeight: 600, textTransform: 'none', letterSpacing: 0 }}>Clique para posicionar</span>
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
                            {['x', 'y', 'z'].map(axis => (
                              <div key={axis} className="pp-field">
                                <label style={{ color: `var(--${axis === 'x' ? 'red' : axis === 'y' ? 'green' : 'accent'})` }}>Eixo {axis.toUpperCase()}</label>
                                <div className="pp-iw">
                                  <input type="number" defaultValue="0" step="0.05" onChange={() => applyPos(c.id)} ref={el => { if (!panelRefs.current[c.id]) panelRefs.current[c.id] = {}; panelRefs.current[c.id][`p${axis}`] = el; }} />
                                  <span className="pp-suf">m</span>
                                </div>
                                <div className="pp-arrows">
                                  <div className="pp-arr" onClick={() => nudge(c.id, axis, -0.1)}>{axis === 'y' ? '▼' : '◀'}</div>
                                  <div className="pp-arr" onClick={() => nudge(c.id, axis, 0.1)}>{axis === 'y' ? '▲' : '▶'}</div>
                                </div>
                              </div>
                            ))}
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

            <VehicleGrid veiculos={veiculosBD} selVeh={selVeh} onSelectVeh={handleSelectVeh} checkFit={checkFit} />

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
              <div className="stat"><div className="sl">Vol. Baú</div><div className="sv">{actVeh.vol ? actVeh.vol.toFixed(1) : vBv.toFixed(1)} m³</div></div>
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
        <ModalRelatorio veiculo={actVeh} cargas={cargos} ocupacao={vPct} onClose={() => setShowRelatorio(false)} />
      )}
    </div>
  );
}