// src/components/layout/layout.jsx
import React from 'react';
import { NavLink, Outlet } from 'react-router-dom';

export default function Layout() {
  return (
    <div className="app-layout">
      
      {/* A MOLDURA: O CABEÇALHO FIXO */}
      <header className="app-header" style={{ display: 'grid', gridTemplateColumns: '1fr auto 1fr', alignItems: 'center' }}>
        
        {/* 1. Lado Esquerdo: A Logo */}
        <div className="logo-container" style={{ justifySelf: 'start' }}>
          <i className="fa-solid fa-truck-fast"></i>
          <span>ATM<span className="text-primary">Log</span></span>
          <span className="badge-role">Cliente</span>
        </div>
        
        {/* 2. Meio: A Navegação Centralizada */}
        <nav className="nav-links" style={{ justifySelf: 'center', display: 'flex', gap: '1rem' }}>
          <NavLink to="/" className={({ isActive }) => isActive ? "nav-item active" : "nav-item"}>Solicitar Transporte</NavLink>
          <NavLink to="/rastreio" className={({ isActive }) => isActive ? "nav-item active" : "nav-item"}>Rastrear Carga</NavLink>
          <NavLink to="/dashboard" className={({ isActive }) => isActive ? "nav-item active" : "nav-item"}>Painel ATM</NavLink>
          {/* 👇 NOVA ABA DO FINANCEIRO AQUI 👇 */}
          <NavLink to="/financeiro" className={({ isActive }) => isActive ? "nav-item active" : "nav-item"}>Acomp. Financeiro</NavLink>
        </nav>

        {/* 3. Lado Direito: Uma div vazia apenas para manter o equilíbrio do Grid */}
        <div></div>
        
      </header>

      {/* O BURACO DA MOLDURA: ONDE AS TELAS APARECEM */}
      <main className="app-main">
        <Outlet /> 
      </main>
      
    </div>
  );
}