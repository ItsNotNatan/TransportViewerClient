// src/componentes/layout/layout.jsx
import React from 'react';
import { NavLink, Outlet, useNavigate, Link } from 'react-router-dom';
import logoComau from '../../assets/logo-comau.png'; // 👈 Importando o logo
import './layout.css';

export default function Layout() {
  const navigate = useNavigate();

  const estaLogado = !!localStorage.getItem('accessToken');
  const nomeUsuario = localStorage.getItem('userName');

  const handleLogout = () => {
    localStorage.clear(); 
    navigate('/login');    
  };

  return (
    <div className="app-layout">
      
      <header className="app-header">
        
        {/* LADO ESQUERDO: LOGO COMAU + NOME */}
        <Link to="/" className="logo-container">
          <img src={logoComau} alt="Comau" className="logo-img" />
          <span className="logo-text">ATM<span className="text-primary">Log</span></span>
          <span className="badge-role">Cliente</span>
        </Link>
        
        {/* MEIO: NAVEGAÇÃO CENTRALIZADA */}
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

        {/* LADO DIREITO: LOGIN / PERFIL */}
        <div className="auth-section">
          {estaLogado ? (
            <div style={{ display: 'flex', alignItems: 'center', gap: '15px' }}>
              <span className="user-welcome">
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

      <main className="app-main">
        <div className="fade-in">
          <Outlet />
        </div>
      </main>
      
    </div>
  );
}