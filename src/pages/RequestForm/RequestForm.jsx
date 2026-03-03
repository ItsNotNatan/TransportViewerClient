import React, { useState } from 'react';
import { NavLink } from 'react-router-dom';

const Truck = ({ size = 24 }) => <svg xmlns="http://www.w3.org/2000/svg" width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M10 17h4V5H2v12h3"/><path d="M20 17h2v-9h-5V5H10"/><path d="M17 17a2 2 0 1 0 0-4 2 2 0 0 0 0 4Z"/><path d="M7 17a2 2 0 1 0 0-4 2 2 0 0 0 0 4Z"/></svg>;
const Box = ({ size = 24 }) => <svg xmlns="http://www.w3.org/2000/svg" width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M21 8a2 2 0 0 0-1-1.73l-7-4a2 2 0 0 0-2 0l-7 4A2 2 0 0 0 3 8v8a2 2 0 0 0 1 1.73l7 4a2 2 0 0 0 2 0l7-4A2 2 0 0 0 21 16Z"/><path d="m3.3 7 8.7 5 8.7-5"/><path d="M12 22V12"/></svg>;
const Search = ({ size = 24 }) => <svg xmlns="http://www.w3.org/2000/svg" width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><circle cx="11" cy="11" r="8"/><line x1="21" x2="16.65" y1="21" y2="16.65"/></svg>;

export default function TrackOrder() {
  const [trackId, setTrackId] = useState('');
  const [resultVisible, setResultVisible] = useState(false);

  const handleSearch = () => { if (trackId.trim() !== '') setResultVisible(true); };

  return (
    <div className="client-app-bg">
      <header className="client-header">
        <div className="client-logo">
          <Truck size={28} className="text-primary" />
          <h1>ATM<span className="text-primary">Log</span> <span className="logo-badge">Cliente</span></h1>
        </div>
        <nav className="client-nav">
          <NavLink to="/" className={({ isActive }) => isActive ? "client-nav-link active" : "client-nav-link"}>Solicitar Transporte</NavLink>
          <NavLink to="/rastreio" className={({ isActive }) => isActive ? "client-nav-link active" : "client-nav-link"}>Rastrear Carga</NavLink>
        </nav>
        <div className="client-user"><span className="user-name">João Silva</span></div>
      </header>

      <main className="client-main-content">
        <div className="fade-in track-container">
          <div className="track-header-icon">
            <Box size={50} className="text-primary mx-auto" />
            <h2>Rastrear Pedido</h2>
          </div>

          <div className="track-search-box">
            <input type="text" placeholder="ID do ATM..." className="input-field input-large" value={trackId} onChange={(e) => setTrackId(e.target.value)} />
            <button onClick={handleSearch} className="btn-primary btn-large"><Search size={20} /> Buscar</button>
          </div>

          {resultVisible && (
            <div className="fade-in card-container mt-2">
              <div className="track-result-header">
                <div><span className="track-label">Resultado:</span><h3 className="track-id">ATM #{trackId || '17900'}</h3></div>
                <span className="badge-info-large">Em Trânsito</span>
              </div>
              <div className="track-info-grid">
                <div className="info-box"><span className="text-muted">Origem</span><strong>Goiana</strong></div>
                <div className="info-box"><span className="text-muted">Destino</span><strong>Betim</strong></div>
                <div className="info-box"><span className="text-muted">Previsão</span><strong>10/03/2026</strong></div>
                <div className="info-box"><span className="text-muted">Veículo</span><strong>TRUCK</strong></div>
              </div>
              <div className="timeline">
                <div className="timeline-item completed"><h4>Solicitação Aprovada</h4><p>03/03/2026</p></div>
                <div className="timeline-item active"><h4>Em Trânsito</h4><p>Veículo em rota</p></div>
                <div className="timeline-item"><h4>Entregue</h4><p>Aguardando</p></div>
              </div>
            </div>
          )}
        </div>
      </main>
    </div>
  );
}