import React, { useState } from 'react';
import './TrackOrder.css';

// Ícones
const Box = ({ size = 24 }) => <svg xmlns="http://www.w3.org/2000/svg" width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M21 8a2 2 0 0 0-1-1.73l-7-4a2 2 0 0 0-2 0l-7 4A2 2 0 0 0 3 8v8a2 2 0 0 0 1 1.73l7 4a2 2 0 0 0 2 0l7-4A2 2 0 0 0 21 16Z"/><path d="m3.3 7 8.7 5 8.7-5"/><path d="M12 22V12"/></svg>;
const Search = ({ size = 24 }) => <svg xmlns="http://www.w3.org/2000/svg" width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><circle cx="11" cy="11" r="8"/><line x1="21" x2="16.65" y1="21" y2="16.65"/></svg>;

export default function TrackOrder() {
  const [trackId, setTrackId] = useState('');
  
  // Novos estados para controlar a mágica dos dados
  const [resultado, setResultado] = useState(null);
  const [carregando, setCarregando] = useState(false);
  const [erro, setErro] = useState(null);

  const handleSearch = async () => {
    if (trackId.trim() === '') return;
    
    setCarregando(true);
    setErro(null);
    setResultado(null);

    try {
      // Vai ao Back-End buscar os dados na porta 3001
      const resposta = await fetch('http://localhost:3001/api/admin/transportes');
      const dados = await resposta.json();

      if (resposta.ok) {
        const termoBusca = trackId.toLowerCase().trim();
        
        // Procura no banco um pedido que bata com o ID, Pedido de Compra ou NF
        const pedidoEncontrado = dados.find(atm => 
          (atm.id && atm.id.toLowerCase().includes(termoBusca)) ||
          (atm.pedido_compra && atm.pedido_compra.toLowerCase().includes(termoBusca)) ||
          (atm.nf && atm.nf.toLowerCase().includes(termoBusca))
        );

        if (pedidoEncontrado) {
          setResultado(pedidoEncontrado);
        } else {
          setErro("Nenhum pedido encontrado com este código ou NF. Verifique e tente novamente.");
        }
      } else {
        setErro("Erro no servidor ao tentar buscar os dados.");
      }
    } catch (e) {
      setErro("Erro de conexão. Verifique se o servidor está rodando na porta 3001.");
    } finally {
      setCarregando(false);
    }
  };

  // Funções de ajuda para deixar a tela bonita
  const shortId = (id) => id ? id.substring(0, 8).toUpperCase() : '';
  const formatarData = (dataStr) => {
    if (!dataStr) return 'Não informada';
    const partes = dataStr.split('-');
    if (partes.length === 3) return `${partes[2]}/${partes[1]}/${partes[0]}`; // Transforma 2026-03-10 em 10/03/2026
    return dataStr;
  };

  // Função para formatar o valor como Moeda Brasileira (Reais)
  const formatarValor = (valor) => {
    if (!valor || isNaN(valor)) return 'Sob Consulta';
    return Number(valor).toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' });
  };

  // Lógica inteligente da Linha do Tempo (Timeline)
  const getTimelineClasses = (status) => {
    let s1 = '', s2 = '', s3 = '';
    if (status === 'Entregue') {
      s1 = 'completed'; s2 = 'completed'; s3 = 'active';
    } else if (status === 'Em Trânsito' || status === 'Aprovado') {
      s1 = 'completed'; s2 = 'active'; s3 = '';
    } else { // Aguardando Aprovação e outros
      s1 = 'active'; s2 = ''; s3 = '';
    }
    return { s1, s2, s3 };
  };

  return (
    <div className="fade-in track-container" style={{ maxWidth: '800px', margin: '0 auto', background: 'white', padding: '2rem', borderRadius: '0.75rem', border: '1px solid #e5e7eb', boxShadow: '0 1px 3px rgba(0,0,0,0.05)' }}>
      
      <div className="track-header-icon" style={{ textAlign: 'center', marginBottom: '2rem' }}>
        <Box size={50} style={{ color: '#2563eb', margin: '0 auto' }} />
        <h2 style={{ fontSize: '1.5rem', fontWeight: 'bold', marginTop: '0.5rem' }}>Rastrear Pedido</h2>
      </div>

      <div className="track-search-box" style={{ display: 'flex', gap: '1rem', marginBottom: '1rem' }}>
        <input 
          type="text" 
          placeholder="ID do ATM, Pedido de Compra ou NF..." 
          className="input-control" 
          style={{ flex: 1, padding: '1rem', fontSize: '1.1rem' }} 
          value={trackId} 
          onChange={(e) => setTrackId(e.target.value)}
          onKeyDown={(e) => e.key === 'Enter' && handleSearch()} 
        />
        <button onClick={handleSearch} disabled={carregando} className="btn btn-primary" style={{ padding: '0 2rem' }}>
          <Search size={20} /> {carregando ? 'Buscando...' : 'Buscar'}
        </button>
      </div>

      {/* Caixa de Erro */}
      {erro && (
        <div className="fade-in" style={{ padding: '1rem', backgroundColor: '#fee2e2', color: '#b91c1c', border: '1px solid #ef4444', borderRadius: '8px', marginBottom: '2rem', textAlign: 'center' }}>
          <strong>Atenção:</strong> {erro}
        </div>
      )}

      {/* Resultado da Busca */}
      {resultado && (
        <div className="fade-in card-container mt-2" style={{ borderTop: '1px solid #e5e7eb', paddingTop: '2rem' }}>
          <div className="track-result-header" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.5rem' }}>
            <div>
              <span style={{ fontSize: '0.875rem', color: '#6b7280', textTransform: 'uppercase', fontWeight: 'bold' }}>Resultado:</span>
              <h3 style={{ fontSize: '1.5rem', fontWeight: 'bold', color: '#111827' }}>ATM #{shortId(resultado.id)}</h3>
            </div>
            <span style={{ backgroundColor: '#dbeafe', color: '#1e40af', padding: '0.5rem 1rem', borderRadius: '2rem', fontWeight: 'bold' }}>
              {resultado.status}
            </span>
          </div>
          
          {/* Mudei gridTemplateColumns para 5 para caber a nova coluna de Valor */}
          <div className="track-info-grid" style={{ display: 'grid', gridTemplateColumns: 'repeat(5, 1fr)', gap: '1rem', marginBottom: '2rem', backgroundColor: '#f9fafb', padding: '1.5rem', borderRadius: '0.5rem', border: '1px solid #e5e7eb' }}>
            <div><span style={{ display: 'block', fontSize: '0.875rem', color: '#6b7280' }}>Origem</span><strong>{resultado.origem?.municipio} - {resultado.origem?.uf}</strong></div>
            <div><span style={{ display: 'block', fontSize: '0.875rem', color: '#6b7280' }}>Destino</span><strong>{resultado.destino?.municipio} - {resultado.destino?.uf}</strong></div>
            <div><span style={{ display: 'block', fontSize: '0.875rem', color: '#6b7280' }}>Previsão</span><strong>{formatarData(resultado.data_entrega)}</strong></div>
            <div><span style={{ display: 'block', fontSize: '0.875rem', color: '#6b7280' }}>Veículo</span><strong>{resultado.veiculo}</strong></div>
          </div>
          
          <div className="timeline-container">
            <div className={`timeline-step ${getTimelineClasses(resultado.status).s1}`}>
              <h4 style={{fontWeight: 'bold'}}>Solicitação</h4>
              <p style={{fontSize: '0.875rem', color: '#6b7280'}}>Recebida</p>
            </div>
            <div className={`timeline-step ${getTimelineClasses(resultado.status).s2}`}>
              <h4 style={{fontWeight: 'bold'}}>Em Trânsito</h4>
              <p style={{fontSize: '0.875rem', color: '#6b7280'}}>Aprovado/Rota</p>
            </div>
            <div className={`timeline-step ${getTimelineClasses(resultado.status).s3}`}>
              <h4 style={{fontWeight: 'bold'}}>Entregue</h4>
              <p style={{fontSize: '0.875rem', color: '#6b7280'}}>Finalizado</p>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}