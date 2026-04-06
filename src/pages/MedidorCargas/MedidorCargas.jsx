import React, { useState, useEffect, useRef } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import * as THREE from 'three';
import { OrbitControls } from 'three/examples/jsm/controls/OrbitControls';
import api from '../../services/api'; // Sua configuração do Axios
import './MedidorCargas.css';

const PALETA_CORES = ['#f97316', '#3b82f6', '#10b981', '#8b5cf6', '#ef4444', '#eab308', '#ec4899'];

export default function MedidorCargas() {
  const navigate = useNavigate();
  const location = useLocation();
  
  // Estados para os dados vindos do banco
  const [veiculosBD, setVeiculosBD] = useState([]);
  const [carregando, setCarregando] = useState(true);
  const [veiculoSelecionado, setVeiculoSelecionado] = useState(null);
  
  const [cargas, setCargas] = useState([]);
  const [showRelatorio, setShowRelatorio] = useState(false);

  // Estados do formulário de carga
  const [inputComp, setInputComp] = useState('1.20');
  const [inputLarg, setInputLarg] = useState('0.80');
  const [inputAlt, setInputAlt] = useState('0.70');
  const [inputQtd, setInputQtd] = useState('1');

  // 1. Busca os veículos no banco de dados ao abrir a tela
  useEffect(() => {
    const fetchVeiculos = async () => {
      try {
        const response = await api.get('/admin/veiculos');
        
        // Mapeia os veículos garantindo que os valores são números e calcula o volume máximo
        const veiculosFormatados = response.data.map(v => ({
          ...v,
          comprimento: parseFloat(v.comprimento),
          largura: parseFloat(v.largura),
          altura: parseFloat(v.altura),
          volumeMax: parseFloat(v.comprimento) * parseFloat(v.largura) * parseFloat(v.altura)
        }));

        setVeiculosBD(veiculosFormatados);
        
        // Se encontrou veículos, seleciona o primeiro por padrão
        if (veiculosFormatados.length > 0) {
          setVeiculoSelecionado(veiculosFormatados[0]);
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

  // Verifica se a tela foi aberta com a intenção de mostrar o relatório
  useEffect(() => {
    if (location.state?.abrirRelatorio) {
      setShowRelatorio(true);
      window.history.replaceState({}, document.title);
    }
  }, [location]);

  // Se ainda estiver carregando, mostra uma tela de aviso
  if (carregando) {
    return <div style={{ padding: '20px', color: 'white' }}>Carregando simulador e frota...</div>;
  }

  // Se não houver veículos cadastrados no banco
  if (!veiculoSelecionado) {
    return <div style={{ padding: '20px', color: 'white' }}>Nenhum veículo cadastrado no sistema. Cadastre um veículo primeiro.</div>;
  }

  // Cálculos volumétricos
  const volumeTotalCargas = cargas.reduce((acc, c) => acc + (c.comp * c.larg * c.alt * c.qtd), 0);
  const ocupacaoPercent = ((volumeTotalCargas / veiculoSelecionado.volumeMax) * 100).toFixed(1);

  const handleAdicionarCarga = () => {
    const c = parseFloat(inputComp), l = parseFloat(inputLarg), a = parseFloat(inputAlt), q = parseInt(inputQtd, 10);
    if (c > 0 && l > 0 && a > 0 && q > 0) {
      setCargas([...cargas, {
        id: Date.now().toString(),
        nome: `Carga ${cargas.length + 1}`,
        comp: c, larg: l, alt: a, qtd: q,
        cor: PALETA_CORES[cargas.length % PALETA_CORES.length]
      }]);
    }
  };

  return (
    <div className="medidor-wrapper">
      <button onClick={() => navigate(-1)} className="btn-voltar-sim" title="Voltar">
        <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M18 6 6 18"/><path d="m6 6 12 12"/></svg>
      </button>

      <aside className="medidor-sidebar">
        <header className="sidebar-header-3d">
          <h1 className="main-title-3d">Cubagem <span className="highlight-text">3D</span></h1>
        </header>

        <section className="form-section-3d">
          <h2 className="label-section-3d">Nova Carga</h2>
          <div className="input-row-3d">
            <div className="input-group-col">
              <label>Comp (m)</label>
              <input type="number" step="0.01" value={inputComp} onChange={e => setInputComp(e.target.value)} className="input-field-3d" />
            </div>
            <div className="input-group-col">
              <label>Larg (m)</label>
              <input type="number" step="0.01" value={inputLarg} onChange={e => setInputLarg(e.target.value)} className="input-field-3d" />
            </div>
            <div className="input-group-col">
              <label>Alt (m)</label>
              <input type="number" step="0.01" value={inputAlt} onChange={e => setInputAlt(e.target.value)} className="input-field-3d" />
            </div>
          </div>
          <div className="btn-row-3d">
            <input type="number" min="1" value={inputQtd} onChange={e => setInputQtd(e.target.value)} className="input-field-3d qtd-input" />
            <button onClick={handleAdicionarCarga} className="btn-primary-3d">Adicionar</button>
          </div>
        </section>

        <section className="resumo-box-3d">
           <div className="resumo-stats-3d">
             <span className="stats-total">Volume: <strong>{volumeTotalCargas.toFixed(3)} m³</strong></span>
             <span className={ocupacaoPercent > 100 ? 'stats-percent-alert' : 'stats-percent'}>{ocupacaoPercent}%</span>
           </div>
           <button onClick={() => setShowRelatorio(true)} className="btn-details-3d">VER MANIFESTO</button>
        </section>

        <div className="cargas-lista-3d">
          {cargas.length === 0 ? <p className="empty-list-text">Nenhuma carga no veículo</p> : 
            cargas.map(c => (
              <div key={c.id} className="item-lista-row">
                <span className="item-info">
                  <div className="item-dot" style={{backgroundColor: c.cor}}></div>
                  {c.nome} ({c.qtd}x)
                </span>
                <button onClick={() => setCargas(cargas.filter(x => x.id !== c.id))} className="btn-remover-item">Excluir</button>
              </div>
            ))
          }
        </div>

        <footer className="veiculos-section-3d">
          <p className="label-section-3d">Tipo de Veículo</p>
          <div className="veiculos-grid-3d">
            {veiculosBD.map(v => (
              <button key={v.id} onClick={() => setVeiculoSelecionado(v)} className={`btn-veiculo-3d ${veiculoSelecionado.id === v.id ? 'active' : ''}`}>
                {v.nome}
              </button>
            ))}
          </div>
        </footer>
      </aside>

      <main className="medidor-visualizacao">
        <div className="overlay-instrucoes">Use o mouse para girar e zoom</div>
        <Scene3D veiculo={veiculoSelecionado} cargas={cargas} />
      </main>

      {showRelatorio && (
        <ModalRelatorio 
          veiculo={veiculoSelecionado} 
          cargas={cargas} 
          volumeTotal={volumeTotalCargas} 
          ocupacao={ocupacaoPercent} 
          onClose={() => setShowRelatorio(false)} 
        />
      )}
    </div>
  );
}

// --- COMPONENTE DO MODAL ---
function ModalRelatorio({ veiculo, cargas, volumeTotal, ocupacao, onClose }) {
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
              <p className="summary-value">{veiculo.nome}</p>
            </div>
            <div className={`summary-card-3d ${ocupacao > 100 ? 'alert' : 'success'}`}>
              <p className="summary-label">Ocupação Volumétrica</p>
              <p className="summary-value">{ocupacao}%</p>
            </div>
          </div>
          <div className="modal-table-container">
            {cargas.map(c => (
              <div key={c.id} className="modal-table-row">
                  <div className="item-with-dot">
                    <div className="item-dot" style={{backgroundColor: c.cor}}></div>
                    <span>{c.nome}</span>
                  </div>
                  <strong>{c.qtd} un.</strong>
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

// --- COMPONENTE SCENE 3D ---
function Scene3D({ veiculo, cargas }) {
  const mountRef = useRef(null);
  const sceneRef = useRef(null);
  const rendererRef = useRef(null);
  const cameraRef = useRef(null);
  const groupRef = useRef(null);

  useEffect(() => {
    if (!mountRef.current) return;

    // 1. Setup da Cena
    const scene = new THREE.Scene();
    scene.background = new THREE.Color(0xe2e8f0);
    sceneRef.current = scene;

    const camera = new THREE.PerspectiveCamera(45, mountRef.current.clientWidth / mountRef.current.clientHeight, 0.1, 1000);
    camera.position.set(8, 8, 8);
    cameraRef.current = camera;

    const renderer = new THREE.WebGLRenderer({ antialias: true });
    renderer.setSize(mountRef.current.clientWidth, mountRef.current.clientHeight);
    renderer.setPixelRatio(window.devicePixelRatio);
    mountRef.current.appendChild(renderer.domElement);
    rendererRef.current = renderer;

    // 2. Controles de Mouse (OrbitControls)
    const controls = new OrbitControls(camera, renderer.domElement);
    controls.enableDamping = true; 

    // 3. Iluminação
    const ambientLight = new THREE.AmbientLight(0xffffff, 0.7);
    scene.add(ambientLight);
    const directionalLight = new THREE.DirectionalLight(0xffffff, 0.8);
    directionalLight.position.set(5, 10, 7);
    scene.add(directionalLight);

    // 4. Grupo de Objetos
    const mainGroup = new THREE.Group();
    scene.add(mainGroup);
    groupRef.current = mainGroup;

    // 5. Redimensionamento Automático
    const handleResize = () => {
      if (!mountRef.current) return;
      const width = mountRef.current.clientWidth;
      const height = mountRef.current.clientHeight;
      camera.aspect = width / height;
      camera.updateProjectionMatrix();
      renderer.setSize(width, height);
    };
    window.addEventListener('resize', handleResize);

    // 6. Loop de Renderização
    const animate = () => {
      requestAnimationFrame(animate);
      controls.update();
      renderer.render(scene, camera);
    };
    animate();

    updateMesh(veiculo, cargas);

    return () => {
      window.removeEventListener('resize', handleResize);
      renderer.dispose();
      if (mountRef.current) mountRef.current.innerHTML = "";
    };
  }, []);

  useEffect(() => {
    if (groupRef.current) updateMesh(veiculo, cargas);
  }, [veiculo, cargas]);

  const updateMesh = (v, cs) => {
    const group = groupRef.current;
    if (!group) return;

    while(group.children.length > 0) {
      const obj = group.children[0];
      group.remove(obj);
      if(obj.geometry) obj.geometry.dispose();
      if(obj.material) obj.material.dispose();
    }

    // 🎯 AQUI UTILIZAMOS AS VARIÁVEIS EXATAS DO BANCO DE DADOS (largura, altura, comprimento)
    const bauGeo = new THREE.BoxGeometry(v.largura, v.altura, v.comprimento);
    const bauMat = new THREE.MeshStandardMaterial({ color: 0x2563eb, transparent: true, opacity: 0.1 });
    const bau = new THREE.Mesh(bauGeo, bauMat);
    bau.position.y = v.altura / 2;
    group.add(bau);

    const edges = new THREE.EdgesGeometry(bauGeo);
    const line = new THREE.LineSegments(edges, new THREE.LineBasicMaterial({ color: 0x1e40af, linewidth: 2 }));
    line.position.copy(bau.position);
    group.add(line);

    // Grid no chão para referência
    const grid = new THREE.GridHelper(10, 10, 0x94a3b8, 0xcbd5e1);
    sceneRef.current.add(grid);

    // Lógica de Empilhamento das cargas
    let currentZ = -v.comprimento / 2;
    cs.forEach(c => {
      for(let i=0; i<c.qtd; i++) {
        const item = new THREE.Mesh(
          new THREE.BoxGeometry(c.larg * 0.98, c.alt * 0.98, c.comp * 0.98),
          new THREE.MeshStandardMaterial({ color: c.cor, roughness: 0.4 })
        );
        item.position.set(0, c.alt/2, currentZ + c.comp/2);
        group.add(item);
        currentZ += c.comp; // Avança o eixo Z com base no comprimento da carga
      }
    });
  };

  return <div ref={mountRef} className="scene-container-3d" />;
}