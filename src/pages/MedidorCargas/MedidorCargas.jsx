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
  
  const [veiculosBD, setVeiculosBD] = useState([]);
  const [carregando, setCarregando] = useState(true);
  const [veiculoSelecionado, setVeiculoSelecionado] = useState(null);
  
  const [cargas, setCargas] = useState([]);
  const [showRelatorio, setShowRelatorio] = useState(false);

  const [inputComp, setInputComp] = useState('0.40'); // Padrão menor para ver o empilhamento
  const [inputLarg, setInputLarg] = useState('0.40');
  const [inputAlt, setInputAlt] = useState('0.40');
  const [inputQtd, setInputQtd] = useState('10');

  useEffect(() => {
    const fetchVeiculos = async () => {
      try {
        const response = await api.get('/admin/veiculos');
        
        const veiculosFormatados = response.data.map(v => ({
          ...v,
          comprimento: parseFloat(v.comprimento),
          largura: parseFloat(v.largura),
          altura: parseFloat(v.altura),
          volumeMax: parseFloat(v.comprimento) * parseFloat(v.largura) * parseFloat(v.altura)
        }));

        setVeiculosBD(veiculosFormatados);
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

  useEffect(() => {
    if (location.state?.abrirRelatorio) {
      setShowRelatorio(true);
      window.history.replaceState({}, document.title);
    }
  }, [location]);

  if (carregando) return <div style={{ padding: '20px', color: 'black' }}>Carregando simulador e frota...</div>;
  if (!veiculoSelecionado) return <div style={{ padding: '20px', color: 'black' }}>Nenhum veículo cadastrado no sistema.</div>;

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

      <main className="medidor-visualizacao" style={{ position: 'relative' }}>
        <div className="overlay-instrucoes" style={{ pointerEvents: 'none', zIndex: 10 }}>
          Use o mouse para girar e dar zoom
        </div>
        <Scene3D veiculo={veiculoSelecionado} cargas={cargas} />
      </main>

      {showRelatorio && (
        <ModalRelatorio veiculo={veiculoSelecionado} cargas={cargas} volumeTotal={volumeTotalCargas} ocupacao={ocupacaoPercent} onClose={() => setShowRelatorio(false)} />
      )}
    </div>
  );
}

function ModalRelatorio({ veiculo, cargas, volumeTotal, ocupacao, onClose }) {
  // Modal mantido idêntico ao seu original
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

// --- COMPONENTE SCENE 3D À PROVA DE FALHAS ---
function Scene3D({ veiculo, cargas }) {
  const canvasRef = useRef(null); // 🟢 Usaremos um Canvas fixo, é a forma 100% segura no React!
  const rendererRef = useRef(null);
  const cameraRef = useRef(null);
  const controlsRef = useRef(null);
  const groupRef = useRef(null);
  const sceneRef = useRef(null);

  // Inicialização Básica (Roda apenas uma vez)
  useEffect(() => {
    if (!canvasRef.current) return;

    // 1. Setup da Cena
    const scene = new THREE.Scene();
    scene.background = new THREE.Color(0xe2e8f0);
    sceneRef.current = scene;

    // 2. Camera e Renderer ligados diretamente ao <canvas> do React
    const width = canvasRef.current.clientWidth || 500;
    const height = canvasRef.current.clientHeight || 500;
    
    const camera = new THREE.PerspectiveCamera(45, width / height, 0.1, 1000);
    camera.position.set(10, 10, 15);
    cameraRef.current = camera;

    const renderer = new THREE.WebGLRenderer({ canvas: canvasRef.current, antialias: true });
    renderer.setSize(width, height, false); // "false" impede de sobrescrever o CSS
    renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
    rendererRef.current = renderer;

    // 3. Controles do Mouse
    const controls = new OrbitControls(camera, renderer.domElement);
    controls.enableDamping = true;
    controlsRef.current = controls;

    // 4. Iluminação e Grid
    const ambientLight = new THREE.AmbientLight(0xffffff, 0.7);
    scene.add(ambientLight);
    const directionalLight = new THREE.DirectionalLight(0xffffff, 0.8);
    directionalLight.position.set(5, 10, 7);
    scene.add(directionalLight);

    const grid = new THREE.GridHelper(30, 30, 0x94a3b8, 0xcbd5e1);
    scene.add(grid);

    // 5. Grupo onde vão o Caminhão e as Caixas
    const mainGroup = new THREE.Group();
    scene.add(mainGroup);
    groupRef.current = mainGroup;

    // 6. Atualizador de Tamanho da Tela Responsivo
    const handleResize = () => {
      if (!canvasRef.current) return;
      const w = canvasRef.current.clientWidth;
      const h = canvasRef.current.clientHeight;
      camera.aspect = w / h;
      camera.updateProjectionMatrix();
      renderer.setSize(w, h, false);
    };
    window.addEventListener('resize', handleResize);

    // 7. Loop de Animação
    let reqId;
    const animate = () => {
      reqId = requestAnimationFrame(animate);
      controls.update();
      renderer.render(scene, camera);
    };
    animate();

    // Limpeza ao sair da tela
    return () => {
      cancelAnimationFrame(reqId);
      window.removeEventListener('resize', handleResize);
      controls.dispose();
      renderer.dispose();
    };
  }, []);

  // Lógica de Atualização (Roda quando muda o veículo ou as cargas)
  useEffect(() => {
    if (!groupRef.current || !veiculo) return;

    const group = groupRef.current;

    // Limpa o caminhão e caixas velhas da tela
    while (group.children.length > 0) {
      const obj = group.children[0];
      group.remove(obj);
      if (obj.geometry) obj.geometry.dispose();
      if (obj.material) {
        if (Array.isArray(obj.material)) obj.material.forEach(m => m.dispose());
        else obj.material.dispose();
      }
    }

    // Pega as medidas do banco de dados de forma segura
    const vLarg = Number(veiculo.largura) || 2;
    const vAlt = Number(veiculo.altura) || 2;
    const vComp = Number(veiculo.comprimento) || 2;

    // Desenha o baú do caminhão
    const bauGeo = new THREE.BoxGeometry(vLarg, vAlt, vComp);
    const bauMat = new THREE.MeshStandardMaterial({ 
      color: 0x3b82f6, 
      transparent: true, 
      opacity: 0.15,
      depthWrite: false // Impede o vidro de esconder as caixas dentro dele
    });
    const bau = new THREE.Mesh(bauGeo, bauMat);
    bau.position.y = vAlt / 2;
    group.add(bau);

    // Contorno do baú
    const edges = new THREE.EdgesGeometry(bauGeo);
    const line = new THREE.LineSegments(edges, new THREE.LineBasicMaterial({ color: 0x1d4ed8, linewidth: 2 }));
    line.position.copy(bau.position);
    group.add(line);

    // 🟢 LÓGICA DE EMPILHAMENTO 3D (O "Tetris")
    const GAP = 0.02; // 2cm de folga entre caixas
    let curX = (-vLarg / 2) + GAP;
    let curZ = (-vComp / 2) + GAP;
    let curY = 0;

    let rowDepth = 0;
    let layerHeight = 0;

    cargas.forEach(c => {
      for (let i = 0; i < c.qtd; i++) {
        const cLarg = Number(c.larg) || 0.5;
        const cAlt = Number(c.alt) || 0.5;
        const cComp = Number(c.comp) || 0.5;

        // Se bater na parede direita, cria fileira nova na frente
        if (curX + cLarg > (vLarg / 2) - GAP + 0.01) {
          curZ += rowDepth + GAP;
          curX = (-vLarg / 2) + GAP;
          rowDepth = 0;
        }

        // Se bater na porta do fundo do baú, sobe um andar (Y)
        if (curZ + cComp > (vComp / 2) - GAP + 0.01) {
          curY += layerHeight + GAP;
          curZ = (-vComp / 2) + GAP;
          curX = (-vLarg / 2) + GAP;
          rowDepth = 0;
          layerHeight = 0;
        }

        // Fica vermelho e transparente se passar do teto do caminhão
        const isOverflow = (curY + cAlt > vAlt);
        const corCaixa = isOverflow ? '#ef4444' : c.cor;

        const itemGeo = new THREE.BoxGeometry(cLarg * 0.98, cAlt * 0.98, cComp * 0.98);
        const itemMat = new THREE.MeshStandardMaterial({ 
          color: corCaixa, 
          roughness: 0.4,
          transparent: isOverflow,
          opacity: isOverflow ? 0.7 : 1
        });
        const item = new THREE.Mesh(itemGeo, itemMat);

        item.position.set(curX + (cLarg / 2), curY + (cAlt / 2), curZ + (cComp / 2));

        // Contorno nas caixas
        const itemEdges = new THREE.EdgesGeometry(itemGeo);
        const itemLine = new THREE.LineSegments(itemEdges, new THREE.LineBasicMaterial({ color: 0x000000, transparent: true, opacity: 0.4 }));
        item.add(itemLine);

        group.add(item);

        rowDepth = Math.max(rowDepth, cComp);
        layerHeight = Math.max(layerHeight, cAlt);
        curX += cLarg + GAP; 
      }
    });

    // Câmera Inteligente
    if (cameraRef.current && controlsRef.current) {
      const maxDim = Math.max(vComp, vLarg, vAlt);
      cameraRef.current.position.set(maxDim * 1.5, maxDim * 1.0, maxDim * 1.5);
      controlsRef.current.target.set(0, vAlt / 2, 0); 
      controlsRef.current.update();
    }

  }, [veiculo, cargas]); 

  // 🟢 A SOLUÇÃO DEFINITIVA: Usando a tag nativa <canvas>
  return (
    <canvas 
      ref={canvasRef} 
      className="scene-container-3d" 
      style={{ display: 'block', width: '100%', height: '100%', position: 'absolute', top: 0, left: 0 }} 
    />
  );
}