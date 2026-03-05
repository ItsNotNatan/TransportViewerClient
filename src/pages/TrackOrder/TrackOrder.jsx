import React, { useState } from 'react';

import './TrackOrder.css'

// Mantendo os ícones bonitinhos que você tinha feito!
const Box = ({ size = 24 }) => <svg xmlns="http://www.w3.org/2000/svg" width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M21 8a2 2 0 0 0-1-1.73l-7-4a2 2 0 0 0-2 0l-7 4A2 2 0 0 0 3 8v8a2 2 0 0 0 1 1.73l7 4a2 2 0 0 0 2 0l7-4A2 2 0 0 0 21 16Z"/><path d="m3.3 7 8.7 5 8.7-5"/><path d="M12 22V12"/></svg>;
const Search = ({ size = 24 }) => <svg xmlns="http://www.w3.org/2000/svg" width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><circle cx="11" cy="11" r="8"/><line x1="21" x2="16.65" y1="21" y2="16.65"/></svg>;

export default function TrackOrder() {
  const [trackId, setTrackId] = useState('');
  const [resultVisible, setResultVisible] = useState(false);

  const handleSearch = () => { if (trackId.trim() !== '') setResultVisible(true); };

  // OLHA COMO FICOU LIMPO!
  return (
    <div className="fade-in track-container" style={{ maxWidth: '800px', margin: '0 auto', background: 'white', padding: '2rem', borderRadius: '0.75rem', border: '1px solid #e5e7eb', boxShadow: '0 1px 3px rgba(0,0,0,0.05)' }}>
      
      <div className="track-header-icon" style={{ textAlign: 'center', marginBottom: '2rem' }}>
        <Box size={50} style={{ color: '#2563eb', margin: '0 auto' }} />
        <h2 style={{ fontSize: '1.5rem', fontWeight: 'bold', marginTop: '0.5rem' }}>Rastrear Pedido</h2>
      </div>

      <div className="track-search-box" style={{ display: 'flex', gap: '1rem', marginBottom: '2rem' }}>
        <input 
          type="text" 
          placeholder="ID do ATM ou NF..." 
          className="input-control" 
          style={{ flex: 1, padding: '1rem', fontSize: '1.1rem' }} 
          value={trackId} 
          onChange={(e) => setTrackId(e.target.value)} 
        />
        <button onClick={handleSearch} className="btn btn-primary" style={{ padding: '0 2rem' }}>
          <Search size={20} /> Buscar
        </button>
      </div>

      {resultVisible && (
        <div className="fade-in card-container mt-2" style={{ borderTop: '1px solid #e5e7eb', paddingTop: '2rem' }}>
          <div className="track-result-header" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.5rem' }}>
            <div>
              <span style={{ fontSize: '0.875rem', color: '#6b7280', textTransform: 'uppercase', fontWeight: 'bold' }}>Resultado:</span>
              <h3 style={{ fontSize: '1.5rem', fontWeight: 'bold' }}>ATM #{trackId || '17900'}</h3>
            </div>
            <span style={{ backgroundColor: '#dbeafe', color: '#1e40af', padding: '0.5rem 1rem', borderRadius: '2rem', fontWeight: 'bold' }}>Em Trânsito</span>
          </div>
          
          <div className="track-info-grid" style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: '1rem', marginBottom: '2rem', backgroundColor: '#f9fafb', padding: '1.5rem', borderRadius: '0.5rem', border: '1px solid #e5e7eb' }}>
            <div><span style={{ display: 'block', fontSize: '0.875rem', color: '#6b7280' }}>Origem</span><strong>Goiana</strong></div>
            <div><span style={{ display: 'block', fontSize: '0.875rem', color: '#6b7280' }}>Destino</span><strong>Betim</strong></div>
            <div><span style={{ display: 'block', fontSize: '0.875rem', color: '#6b7280' }}>Previsão</span><strong>10/03/2026</strong></div>
            <div><span style={{ display: 'block', fontSize: '0.875rem', color: '#6b7280' }}>Veículo</span><strong>TRUCK</strong></div>
          </div>
          
          <div className="timeline-container">
            <div className="timeline-step completed"><h4 style={{fontWeight: 'bold'}}>Solicitação Aprovada</h4><p style={{fontSize: '0.875rem', color: '#6b7280'}}>03/03/2026</p></div>
            <div className="timeline-step active"><h4 style={{fontWeight: 'bold'}}>Em Trânsito</h4><p style={{fontSize: '0.875rem', color: '#6b7280'}}>Veículo em rota</p></div>
            <div className="timeline-step"><h4 style={{fontWeight: 'bold'}}>Entregue</h4><p style={{fontSize: '0.875rem', color: '#6b7280'}}>Aguardando</p></div>
          </div>
        </div>
      )}
    </div>
  );
}