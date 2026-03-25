import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import api from '../../services/api';
import './Login.css';

// Importamos o Hook para avisar o sistema que logamos
import { useAuth } from '../../components/context/context'; 

export default function Login() {
  const navigate = useNavigate();
  const { login } = useAuth(); // Puxamos a função que gerencia o estado global

  const [email, setEmail] = useState('');
  const [senha, setSenha] = useState('');
  const [erro, setErro] = useState('');
  const [carregando, setCarregando] = useState(false);

  const handleLogin = async (e) => {
    e.preventDefault();
    setCarregando(true);
    setErro('');

    try {
      // 1. Faz a chamada para o seu Backend
      const resposta = await api.post('/auth/login', { email, senha });
      
      // 2. Usamos a função login do Contexto. 
      // Ela vai salvar no localStorage e avisar o Layout para mostrar o menu!
      login({
        accessToken: resposta.data.accessToken,
        refreshToken: resposta.data.refreshToken,
        nome: resposta.data.nome
      });
      
      // 3. Sucesso! Vamos para o painel restrito
      navigate('/painelatm');
    } catch (err) {
      // Tratamento de erro caso a senha ou e-mail estejam incorretos
      const mensagemErro = err.response?.data?.mensagem || 'E-mail ou senha inválidos.';
      setErro(mensagemErro);
    } finally {
      setCarregando(false);
    }
  };

  return (
    <div className="login-container">
      <form className="login-form" onSubmit={handleLogin}>
        <div className="login-header">
          <i className="fa-solid fa-lock" style={{ color: '#2563eb', fontSize: '2rem', marginBottom: '1rem' }}></i>
          <h2>Acesso Colaborador</h2>
          <p>Entre para gerenciar e visualizar os transportes</p>
        </div>
        
        {/* Exibição de erro caso as credenciais falhem */}
        {erro && <div className="error-message">{erro}</div>}
        
        <div className="input-group">
          <label htmlFor="email">E-mail Corporativo</label>
          <input 
            id="email"
            type="email" 
            value={email} 
            onChange={(e) => setEmail(e.target.value)} 
            required 
            placeholder="exemplo@comau.com"
            autoComplete="email"
          />
        </div>

        <div className="input-group">
          <label htmlFor="password">Senha</label>
          <input 
            id="password"
            type="password" 
            value={senha} 
            onChange={(e) => setSenha(e.target.value)} 
            required 
            placeholder="Digite sua senha"
            autoComplete="current-password"
          />
        </div>

        <button type="submit" className="btn-login" disabled={carregando}>
          {carregando ? (
            <span><i className="fa-solid fa-spinner fa-spin"></i> Validando...</span>
          ) : (
            'Entrar no Sistema'
          )}
        </button>
        
        <button type="button" className="btn-back" onClick={() => navigate('/')}>
          <i className="fa-solid fa-arrow-left"></i> Voltar para Solicitação Pública
        </button>
      </form>
    </div>
  );
}