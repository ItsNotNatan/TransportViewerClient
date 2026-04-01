import React, { useState } from 'react';
import api from '../../services/api';
import './TrackOrder.css';

// Ícones
const Box = ({ size = 24 }) => (
  <svg xmlns="http://www.w3.org/2000/svg" width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <path d="M21 8a2 2 0 0 0-1-1.73l-7-4a2 2 0 0 0-2 0l-7 4A2 2 0 0 0 3 8v8a2 2 0 0 0 1 1.73l7 4a2 2 0 0 0 2 0l7-4A2 2 0 0 0 21 16Z"/>
    <path d="m3.3 7 8.7 5 8.7-5"/><path d="M12 22V12"/>
  </svg>
);

const Search = ({ size = 24 }) => (
  <svg xmlns="http://www.w3.org/2000/svg" width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <circle cx="11" cy="11" r="8"/><line x1="21" x2="16.65" y1="21" y2="16.65"/>
  </svg>
);

export default function TrackOrder() {
  const [trackId, setTrackId] = useState('');
  const [resultado, setResultado] = useState(null);
  const [carregando, setCarregando] = useState(false);
  const [erro, setErro] = useState(null);

  const handleSearch = async () => {
    if (trackId.trim() === '') return;
    
    setCarregando(true);
    setErro(null);
    setResultado(null);

    try {
      const resposta = await api.get('/admin/transportes');
      const dados = resposta.data; 
      const termoBusca = trackId.toLowerCase().trim();
      
      const pedidoEncontrado = dados.find(atm => {
        const idMatch = atm.id && String(atm.id).toLowerCase().includes(termoBusca);
        const numeroAtmMatch = atm.numero_atm && String(atm.numero_atm).toLowerCase().includes(termoBusca);
        return idMatch || numeroAtmMatch;
      });

      if (pedidoEncontrado) {
        setResultado(pedidoEncontrado);
      } else {
        setErro("Nenhum pedido encontrado com este código de ATM.");
      }
    } catch (e) {
      if (e.response && e.response.status === 401) {
        setErro("Acesso não autorizado. Verifique seu login.");
      } else {
        setErro("Erro de conexão com o servidor.");
      }
    } finally {
      setCarregando(false);
    }
  };

  const formatarData = (dataStr) => {
    if (!dataStr) return 'Não informada';
    const partes = dataStr.split('-');
    if (partes.length === 3) return `${partes[2]}/${partes[1]}/${partes[0]}`; 
    return dataStr;
  };

  const formatarValor = (valor) => {
    if (!valor || isNaN(valor)) return 'Sob Consulta';
    return Number(valor).toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' });
  };

  const getTimelineClasses = (status) => {
    let s1 = '', s2 = '', s3 = '';
    if (status === 'Entregue') {
      s1 = 'completed'; s2 = 'completed'; s3 = 'active';
    } else if (status === 'Em Trânsito' || status === 'Aprovado') {
      s1 = 'completed'; s2 = 'active'; s3 = '';
    } else { 
      s1 = 'active'; s2 = ''; s3 = '';
    }
    return { s1, s2, s3 };
  };

  return (
    <div className="fade-in track-container">
      
      <div className="track-header-icon">
        <Box size={50} className="icon-blue" />
        <h2 className="track-title">Rastrear Pedido</h2>
      </div>

      <div className="track-search-box">
        <input 
          type="text" 
          placeholder="Digite o ID do ATM..." 
          className="input-control track-input" 
          value={trackId} 
          onChange={(e) => setTrackId(e.target.value)}
          onKeyDown={(e) => e.key === 'Enter' && handleSearch()} 
        />
        <button onClick={handleSearch} disabled={carregando} className="btn btn-primary track-btn">
          <Search size={20} /> {carregando ? 'Buscando...' : 'Buscar'}
        </button>
      </div>

      {erro && (
        <div className="fade-in error-banner">
          <strong>Atenção:</strong> {erro}
        </div>
      )}

      {resultado && (
        <div className="fade-in result-card">
          <div className="track-result-header">
            <div>
              <span className="result-label">Resultado:</span>
              <h3 className="atm-id-title">ATM #{resultado.numero_atm || resultado.id.substring(0,8)}</h3>
            </div>
            <span className="status-badge">
              {resultado.status}
            </span>
          </div>
          
          <div className="track-info-grid">
            <div className="grid-item">
               <span className="grid-label">Origem</span>
               <strong className="grid-value">{resultado.origem?.municipio} - {resultado.origem?.uf}</strong>
            </div>
            <div className="grid-item">
               <span className="grid-label">Destino</span>
               <strong className="grid-value">{resultado.destino?.municipio} - {resultado.destino?.uf}</strong>
            </div>
            <div className="grid-item">
               <span className="grid-label">Previsão</span>
               <strong className="grid-value">{formatarData(resultado.data_entrega)}</strong>
            </div>
            <div className="grid-item">
               <span className="grid-label">Veículo</span>
               <strong className="grid-value">{resultado.veiculo || 'N/A'}</strong>
            </div>
            <div className="grid-item">
               <span className="grid-label">Valor</span>
               <strong className="grid-value">{formatarValor(resultado.valor || resultado.valor_frete)}</strong>
            </div>
          </div>
          
          <div className="timeline-container">
            <div className={`timeline-step ${getTimelineClasses(resultado.status).s1}`}>
              <h4 className="timeline-title">Solicitação</h4>
              <p className="timeline-desc">Recebida</p>
            </div>
            <div className={`timeline-step ${getTimelineClasses(resultado.status).s2}`}>
              <h4 className="timeline-title">Em Trânsito</h4>
              <p className="timeline-desc">Aprovado/Rota</p>
            </div>
            <div className={`timeline-step ${getTimelineClasses(resultado.status).s3}`}>
              <h4 className="timeline-title">Entregue</h4>
              <p className="timeline-desc">Finalizado</p>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}