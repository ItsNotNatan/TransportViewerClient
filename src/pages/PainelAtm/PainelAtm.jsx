// src/componentes/PainelAtm/PainelAtm.jsx
import React, { useState, useEffect } from 'react';
import { createPortal } from 'react-dom';
import './PainelAtm.css';
import api from '../../services/api'; 

// --- Ícones SVG embutidos ---
const TableList = ({ size = 24, className = "" }) => <svg xmlns="http://www.w3.org/2000/svg" width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className={className}><rect width="18" height="18" x="3" y="3" rx="2" ry="2"/><line x1="3" x2="21" y1="9" y2="9"/><line x1="3" x2="21" y1="15" y2="15"/><line x1="9" x2="9" y1="9" y2="21"/></svg>;
const FolderOpen = ({ size = 24, className = "" }) => <svg xmlns="http://www.w3.org/2000/svg" width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className={className}><path d="m6 14 1.45-2.9A2 2 0 0 1 9.24 10H20a2 2 0 0 1 1.94 2.5l-1.55 6a2 2 0 0 1-1.94 1.5H4a2 2 0 0 1-2-2V5c0-1.1.9-2 2-2h3.93a2 2 0 0 1 1.66.9l.82 1.2a2 2 0 0 0 1.66.9H18a2 2 0 0 1 2 2v2"/></svg>;
const X = ({ size = 24, className = "" }) => <svg xmlns="http://www.w3.org/2000/svg" width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className={className}><line x1="18" y1="6" x2="6" y2="18"/><line x1="6" y1="6" x2="18" y2="18"/></svg>;

export default function PainelAtm() {
  const [selectedAtm, setSelectedAtm] = useState(null);
  const [atms, setAtms] = useState([]);
  const [carregando, setCarregando] = useState(true);

  // ==========================================
  // ESTADOS DE PAGINAÇÃO (Reduzido para 12 para não rolar a tela)
  // ==========================================
  const [paginaAtual, setPaginaAtual] = useState(1);
  const itensPorPagina = 12;

  useEffect(() => {
    buscarPedidos();
  }, []);

  const buscarPedidos = async () => {
    setCarregando(true);
    try {
      const resposta = await api.get('/admin/transportes'); 
      setAtms(resposta.data);
    } catch (erro) {
      console.error("Erro detalhado:", erro.response || erro);
      alert("Erro ao puxar dados: " + (erro.response?.status === 403 ? "Acesso Proibido (Token Inválido)" : erro.message));
    } finally {
      setCarregando(false);
    }
  };

  const totalPaginas = Math.ceil(atms.length / itensPorPagina);
  const indiceUltimoItem = paginaAtual * itensPorPagina;
  const indicePrimeiroItem = indiceUltimoItem - itensPorPagina;
  const atmsExibidos = atms.slice(indicePrimeiroItem, indiceUltimoItem);

  const getStatusClass = (status) => {
    if (status === 'Entregue') return 'badge-success';
    if (status === 'Aguardando Aprovação') return 'badge-warning';
    return 'badge-info';
  };

  const shortId = (id) => id ? id.substring(0, 8).toUpperCase() : 'N/A';

  const formatarData = (dataStr) => {
    if (!dataStr) return 'Não informada';
    const partes = dataStr.split('-');
    if (partes.length === 3) return `${partes[2]}/${partes[1]}/${partes[0]}`;
    return dataStr;
  };

  const formatarMoeda = (valor) => {
    if (!valor) return '-';
    return Number(valor).toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' });
  };

  return (
    <>
      <section className="fade-in section-dashboard">
        {/* CONTAINER DA TABELA LARGÃO E SEM SCROLL INTERNO */}
        <div className="table-container" style={{ position: 'relative', borderRadius: '8px', boxShadow: '0 4px 6px -1px rgba(0,0,0,0.1)', width: '100%' }}>
          <table className="data-table" style={{ borderCollapse: 'collapse', width: '100%' }}>
            
            <thead style={{ backgroundColor: '#f3f4f6' }}>
              <tr>
                <th style={{ padding: '12px', borderBottom: '2px solid #e5e7eb' }}>ID ATM</th>
                <th style={{ padding: '12px', borderBottom: '2px solid #e5e7eb' }}>Solicitante</th>
                <th style={{ padding: '12px', borderBottom: '2px solid #e5e7eb' }}>Pedido</th>
                <th style={{ padding: '12px', borderBottom: '2px solid #e5e7eb' }}>NF</th>
                <th style={{ padding: '12px', borderBottom: '2px solid #e5e7eb' }}>WBS</th>
                <th style={{ padding: '12px', borderBottom: '2px solid #e5e7eb' }}>Rota</th>
                <th style={{ padding: '12px', borderBottom: '2px solid #e5e7eb' }}>Veículo</th>
                <th style={{ padding: '12px', borderBottom: '2px solid #e5e7eb' }}>Transportadora</th>
                <th style={{ padding: '12px', borderBottom: '2px solid #e5e7eb' }}>Valor Previsto</th>
                <th style={{ padding: '12px', borderBottom: '2px solid #e5e7eb' }}>Valor Realizado</th>
                <th style={{ padding: '12px', borderBottom: '2px solid #e5e7eb' }}>Status</th>
                <th style={{ padding: '12px', borderBottom: '2px solid #e5e7eb', textAlign: 'center' }}>Ações</th>
              </tr>
            </thead>
            
            <tbody>
              {carregando ? (
                <tr><td colSpan="12" className="text-center" style={{padding: '3rem'}}>Carregando seus pedidos...</td></tr>
              ) : atmsExibidos.length === 0 ? (
                <tr><td colSpan="12" className="text-center" style={{padding: '3rem', color: '#6b7280'}}>Nenhum pedido encontrado.</td></tr>
              ) : atmsExibidos.map((atm) => (
                <tr key={atm.id} style={{ borderBottom: '1px solid #f3f4f6' }}>
                  <td className="font-bold" title={atm.id}>#{atm.numero_atm || shortId(atm.id)}</td>
                  <td>{atm.solicitacao || '-'}</td>
                  <td>{atm.pedido_compra || '-'}</td>
                  <td>{atm.nf || '-'}</td>
                  <td>{atm.wbs || '-'}</td>
                  <td style={{ fontSize: '0.85rem', lineHeight: '1.3' }}>
                    <span style={{color: '#6b7280'}}>De:</span> {atm.origem?.municipio} <br/>
                    <span style={{color: '#6b7280'}}>Para:</span> {atm.destino?.municipio}
                  </td>
                  <td>{atm.veiculo}</td>
                  <td style={{ fontWeight: '500' }}>{atm.transportadora?.nome || <span style={{color: '#9ca3af'}}>A Definir</span>}</td>
                  <td style={{ color: '#059669', fontWeight: 'bold' }}>{formatarMoeda(atm.valor || atm.valor_nf)}</td>
                  <td style={{ textAlign: 'center', color: '#6b7280' }}>-</td>
                  <td><span className={`badge ${getStatusClass(atm.status)}`}>{atm.status}</span></td>
                  <td style={{ textAlign: 'center' }}>
                    <button className="btn-action" onClick={() => setSelectedAtm(atm)} style={{ padding: '6px 12px' }}>
                      <FolderOpen size={16} /> Detalhes
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>

          {/* PAGINAÇÃO FIXA NO FUNDO DA TABELA */}
          {!carregando && totalPaginas > 1 && (
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '1rem 1.5rem', borderTop: '1px solid #e5e7eb', backgroundColor: '#f9fafb' }}>
              <span style={{ fontSize: '0.875rem', color: '#6b7280' }}>
                Mostrando <strong>{indicePrimeiroItem + 1}</strong> a <strong>{Math.min(indiceUltimoItem, atms.length)}</strong> de <strong>{atms.length}</strong> resultados
              </span>
              <div style={{ display: 'flex', gap: '0.5rem' }}>
                <button 
                  onClick={() => setPaginaAtual(prev => Math.max(prev - 1, 1))}
                  disabled={paginaAtual === 1}
                  style={{ padding: '0.375rem 0.75rem', border: '1px solid #d1d5db', backgroundColor: paginaAtual === 1 ? '#f3f4f6' : '#fff', color: paginaAtual === 1 ? '#9ca3af' : '#374151', borderRadius: '0.375rem', cursor: paginaAtual === 1 ? 'not-allowed' : 'pointer', fontWeight: '500' }}
                >
                  Anterior
                </button>
                <span style={{ display: 'flex', alignItems: 'center', padding: '0 0.5rem', fontSize: '0.875rem', fontWeight: 'bold', color: '#111827' }}>
                  Página {paginaAtual} de {totalPaginas}
                </span>
                <button 
                  onClick={() => setPaginaAtual(prev => Math.min(prev + 1, totalPaginas))}
                  disabled={paginaAtual === totalPaginas}
                  style={{ padding: '0.375rem 0.75rem', border: '1px solid #d1d5db', backgroundColor: paginaAtual === totalPaginas ? '#f3f4f6' : '#fff', color: paginaAtual === totalPaginas ? '#9ca3af' : '#374151', borderRadius: '0.375rem', cursor: paginaAtual === totalPaginas ? 'not-allowed' : 'pointer', fontWeight: '500' }}
                >
                  Próxima
                </button>
              </div>
            </div>
          )}
        </div>
      </section>

      {/* MODAL MANTIDO IGUAL */}
      {selectedAtm && createPortal(
        <div className="modal-overlay">
          <div className="modal-content fade-in" style={{ maxWidth: '850px' }}>
            <div className="modal-header">
              <div>
                <span className="modal-subtitle">Ficha Cadastral Completa</span>
                <h2 className="modal-title">ATM #{atm.numero_atm || shortId(selectedAtm.id)}</h2>
              </div>
              <button className="btn-close" onClick={() => setSelectedAtm(null)}><X size={24} /></button>
            </div>
            
            <div className="modal-body" style={{ maxHeight: '70vh', overflowY: 'auto' }}>
              <div className="modal-grid">
                
                <div className="modal-section">
                  <h4>Identificação</h4>
                  <ul>
                    <li><span>Solicitante:</span> <strong>{selectedAtm.solicitacao || 'Não informado'}</strong></li>
                    <li><span>Pedido Compra:</span> <strong>{selectedAtm.pedido_compra || 'Não informado'}</strong></li>
                    <li><span>Nota Fiscal:</span> <strong>{selectedAtm.nf || 'Não informado'}</strong></li>
                    <li><span>Centro de Custo (WBS):</span> <strong>{selectedAtm.wbs || 'Não informado'}</strong></li>
                    <li><span>Data da Solicitação:</span> <strong>{formatarData(selectedAtm.data_solicitacao || selectedAtm.created_at?.split('T')[0])}</strong></li>
                  </ul>
                </div>

                <div className="modal-section">
                  <h4>Carga e Logística</h4>
                  <ul>
                    <li><span>Transportadora:</span> <strong>{selectedAtm.transportadora?.nome || 'A Definir'}</strong></li>
                    <li><span>Valor Previsto:</span> <strong style={{ color: '#059669' }}>{formatarMoeda(selectedAtm.valor || selectedAtm.valor_nf)}</strong></li>
                    <li><span>Valor Realizado:</span> <strong style={{ color: '#6b7280' }}>-</strong></li>
                    <li><span>Tipo de Veículo:</span> <strong>{selectedAtm.veiculo || 'Não informado'}</strong></li>
                    <li><span>Tipo de Frete:</span> <strong>{selectedAtm.tipo_frete || 'Não informado'}</strong></li>
                    <li><span>Peso Estimado:</span> <strong>{selectedAtm.peso ? `${selectedAtm.peso} kg` : 'Não informado'}</strong></li>
                    <li><span>Volume Total:</span> <strong>{selectedAtm.volume ? `${selectedAtm.volume} m³` : 'Não informado'}</strong></li>
                  </ul>
                </div>

                <div className="modal-section">
                  <h4>Detalhes da Rota</h4>
                  <ul>
                    <li><span>Origem:</span> 
                      <strong style={{ textAlign: 'right', display: 'block' }}>
                        {selectedAtm.origem?.nome_local || 'N/A'}<br/>
                        <span style={{ fontSize: '0.8em', color: '#6b7280' }}>{selectedAtm.origem?.municipio} - {selectedAtm.origem?.uf}</span>
                      </strong>
                    </li>
                    <li style={{ marginTop: '0.5rem' }}><span>Destino:</span> 
                      <strong style={{ textAlign: 'right', display: 'block' }}>
                        {selectedAtm.destino?.nome_local || 'N/A'}<br/>
                        <span style={{ fontSize: '0.8em', color: '#6b7280' }}>{selectedAtm.destino?.municipio} - {selectedAtm.destino?.uf}</span>
                      </strong>
                    </li>
                    <li style={{ marginTop: '0.5rem' }}><span>Previsão de Entrega:</span> <strong>{formatarData(selectedAtm.data_entrega)}</strong></li>
                  </ul>
                </div>

                <div className="modal-section">
                  <h4>Status e Observações</h4>
                  <ul>
                    <li><span>Status Atual:</span> <span className={`badge ${getStatusClass(selectedAtm.status)}`}>{selectedAtm.status}</span></li>
                  </ul>
                  
                  <div style={{ marginTop: '1rem', padding: '1rem', backgroundColor: '#f3f4f6', borderRadius: '0.5rem', border: '1px solid #e5e7eb' }}>
                    <span style={{ display: 'block', fontSize: '0.85rem', color: '#6b7280', marginBottom: '0.5rem', fontWeight: 'bold' }}>Observações do Pedido:</span>
                    <p style={{ margin: 0, fontSize: '0.9rem', color: '#1f2937', lineHeight: '1.4' }}>
                      {selectedAtm.observacoes || 'Nenhuma observação registrada pelo solicitante para este pedido.'}
                    </p>
                  </div>
                </div>

              </div>
            </div>

            <div className="modal-footer">
              <button className="btn-secondary" onClick={() => setSelectedAtm(null)}>Fechar</button>
            </div>
          </div>
        </div>,
        document.body
      )}
    </>
  );
}