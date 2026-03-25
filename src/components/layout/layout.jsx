// src/componentes/layout/layout.jsx
import React from 'react';
import { NavLink, Outlet, useNavigate, Link } from 'react-router-dom';
import './layout.css'; // 👈 Não esqueça de importar o CSS aqui!

export default function Layout() {
  const navigate = useNavigate();

  // 1. Lógica de Autenticação
  const estaLogado = !!localStorage.getItem('accessToken');
  const nomeUsuario = localStorage.getItem('userName');

  const handleLogout = () => {
    localStorage.clear(); 
    navigate('/login');    
  };

  return (
    <div className="app-layout">
      
      {/* CABEÇALHO PRINCIPAL */}
      <header className="app-header">
        
        {/* 1. LADO ESQUERDO: LOGO */}
        <Link to="/" className="logo-container">
          <i className="fa-solid fa-truck-fast"></i>
          <span>ATM<span className="text-primary">Log</span></span>
          <span className="badge-role">Cliente</span>
        </Link>
        
        {/* 2. MEIO: NAVEGAÇÃO CENTRALIZADA */}
        <nav className="nav-links">
          <NavLink 
            to="/" 
            className={({ isActive }) => isActive ? "nav-item active" : "nav-item"}
          >
            Solicitar Transporte
          </NavLink>
          
          <NavLink 
            to="/rastreio" 
            className={({ isActive }) => isActive ? "nav-item active" : "nav-item"}
          >
            Rastrear Carga
          </NavLink>

          {/* Renderização Condicional: Só aparece se o usuário estiver logado */}
          {estaLogado && (
            <>
              <NavLink 
                to="/painelatm" 
                className={({ isActive }) => isActive ? "nav-item active" : "nav-item"}
              >
                Painel ATM
              </NavLink>
              
              <NavLink 
                to="/financeiro" 
                className={({ isActive }) => isActive ? "nav-item active" : "nav-item"}
              >
                Acomp. Financeiro
              </NavLink>
            </>
          )}
        </nav>

        {/* 3. LADO DIREITO: BOTÃO DE LOGIN / PERFIL */}
        <div className="auth-section">
          {estaLogado ? (
            <div style={{ display: 'flex', alignItems: 'center', gap: '15px' }}>
              <span style={{ fontSize: '0.85rem', color: '#64748b' }}>
                Olá, <strong>{nomeUsuario || 'Colaborador'}</strong>
              </span>
              <button className="btn-logout-header" onClick={handleLogout}>
                Sair
              </button>
            </div>
          ) : (
            <Link to="/login" className="btn-login-header">
              Login Colaborador
            </Link>
          )}
        </div>
        
      </header>

      {/* CONTEÚDO DAS PÁGINAS */}
      <main className="app-main">
        <div className="fade-in">
          <Outlet />
        </div>
      </main>
      
    </div>
  );
}