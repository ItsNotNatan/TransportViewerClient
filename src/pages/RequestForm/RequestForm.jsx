import React, { useState, useEffect } from 'react';
import { NavLink } from 'react-router-dom';

import './RequestForm.css'

export default function RequestForm() {
  const [carregando, setCarregando] = useState(false);
  const [dataHoje, setDataHoje] = useState('');
  const [dataLimite, setDataLimite] = useState('');
  const [dataMinima, setDataMinima] = useState('');

  // 1. FORMATO BRASILEIRO (DD/MM/AAAA) E LIMITES DE DATA (PASSADO E FUTURO)
  useEffect(() => {
    const hoje = new Date();
    
    // Data visual para o campo "Data da Solicitação" (DD/MM/AAAA)
    const dataFormatada = hoje.toLocaleDateString('pt-BR'); 
    setDataHoje(dataFormatada);

    // Pegando as partes da data para formatar no padrão do calendário (YYYY-MM-DD)
    const anoAtual = hoje.getFullYear();
    const mesAtual = String(hoje.getMonth() + 1).padStart(2, '0');
    const diaAtual = String(hoje.getDate()).padStart(2, '0');

    // Trava o PASSADO: o mínimo que ele pode selecionar é o dia de hoje
    setDataMinima(`${anoAtual}-${mesAtual}-${diaAtual}`);

    // Trava o FUTURO: o limite de 10 anos para frente (Ex: 2036-12-31)
    const anoMaximo = anoAtual + 10;
    setDataLimite(`${anoMaximo}-12-31`);
  }, []);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setCarregando(true);

    const formData = new FormData(e.target);
    const dadosDoFormulario = Object.fromEntries(formData.entries());
    
    // Anexamos a data formatada no pacote que vai para o servidor
    dadosDoFormulario.dataSolicitacao = dataHoje; 

    try {
      const resposta = await fetch('http://localhost:3000/api/transportes', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(dadosDoFormulario),
      });

      const resultado = await resposta.json();

      if (resposta.ok) {
        alert(`Sucesso! Transporte solicitado! (ID do ATM gerado: ${resultado.id_gerado})`);
        e.target.reset(); 
      } else {
        alert("Erro ao enviar a solicitação.");
      }
    } catch (erro) {
      console.error(erro);
      alert("Erro de conexão. O servidor Node.js está ligado?");
    } finally {
      setCarregando(false);
    }
  };

  return (
    <div className="app-layout">
      {/* CABEÇALHO */}
      <header className="app-header">
        <div className="logo-container">
          <i className="fa-solid fa-truck-fast"></i>
          <span>ATM<span className="text-primary">Log</span></span>
          <span className="badge-role">Cliente</span>
        </div>
        
        <nav className="nav-links">
          <NavLink to="/" className={({ isActive }) => isActive ? "nav-item active" : "nav-item"}>Solicitar Transporte</NavLink>
          <NavLink to="/rastreio" className={({ isActive }) => isActive ? "nav-item active" : "nav-item"}>Rastrear Carga</NavLink>
        </nav>

        <div className="user-profile">
          <div className="avatar"><i className="fa-solid fa-user"></i></div>
          <div className="user-info"><span>Cliente Online</span></div>
        </div>
      </header>

      {/* ÁREA PRINCIPAL */}
      <main className="app-main">
        <section className="form-card fade-in">
          
          <div className="card-header">
            <h3 className="card-title">Solicitação de Transporte</h3>
            <div className="badge-info"><i className="fa-solid fa-clock"></i> Preencha os dados</div>
          </div>
          
          <form onSubmit={handleSubmit}>
            
            {/* SEÇÃO 1 */}
            <h4 className="section-title"><i className="fa-solid fa-user-tag"></i> Dados do Solicitante</h4>
            <div className="form-grid-4">
              
              <div className="input-group">
                <label>Nome completo do solicitante *</label>
                <input type="text" name="solicitante" required className="input-control" placeholder="Seu nome" />
              </div>
              
              <div className="input-group">
                <label>Data da Solicitação</label>
                <input type="text" value={dataHoje} readOnly className="input-control" />
              </div>
              <div className="input-group">
                <label>Nº do Pedido (Auto)</label>
                <input type="text" readOnly className="input-control" placeholder="Gerado automaticamente" />
              </div>
              <div className="input-group">
                <label>WBS / Centro de Custo</label>
                <input 
                  type="text" 
                  disabled 
                  value="Preenchido pelo Admin" 
                  className="input-control" 
                  style={{ color: '#ef4444', fontWeight: 'bold' }} 
                />
              </div>
            </div>

            {/* SEÇÃO 2 */}
            <h4 className="section-title"><i className="fa-solid fa-map-location-dot"></i> Rota e Prazos</h4>
            <div className="form-grid-2">
              <div className="box-highlight">
                <div className="input-group" style={{ marginBottom: '1rem' }}>
                  <label style={{ color: '#1e40af' }}>Origem (Coleta)</label>
                  <input type="text" name="coleta" required placeholder="Local completo" className="input-control" />
                </div>
                
                <div className="input-group" style={{ marginBottom: '1rem' }}>
                  <label style={{ color: '#1e40af' }}>Nome da Emp. de Coleta *</label>
                  <input type="text" name="empresaColeta" required placeholder="Nome da empresa" className="input-control" />
                </div>

                <div className="input-group">
                  <label>Data Desejada Coleta</label>
                  {/* LIMITES MIN E MAX ADICIONADOS AQUI */}
                  <input type="date" name="dataColeta" min={dataMinima} max={dataLimite} required className="input-control" />
                </div>
              </div>
              
              <div className="box-highlight">
                <div className="input-group" style={{ marginBottom: '1rem' }}>
                  <label style={{ color: '#166534' }}>Destino (Entrega)</label>
                  <input type="text" name="entrega" required placeholder="Local completo" className="input-control" />
                </div>
                <div className="input-group">
                  <label>Data Desejada Entrega</label>
                  {/* LIMITES MIN E MAX ADICIONADOS AQUI */}
                  <input type="date" name="dataEntrega" min={dataMinima} max={dataLimite} required className="input-control" />
                </div>
              </div>
            </div>

            {/* SEÇÃO 3 */}
            <h4 className="section-title"><i className="fa-solid fa-box-open"></i> Características</h4>
            <div className="form-grid-3">
              <div className="input-group">
                <label>Peso Estimado (kg) *</label>
                <input type="number" name="peso" step="0.01" min="0" required className="input-control" />
              </div>
              <div className="input-group">
                <label>Volume Total (m³) *</label>
                <input type="number" name="volume" step="0.01" min="0" required className="input-control" />
              </div>
              <div className="input-group"><label>Medidas (C x L x A)</label><input type="text" name="medidas" placeholder="Ex: 2m x 1m x 1.5m" className="input-control" /></div>
              
              <div className="input-group">
                <label>Tipo de Veículo *</label>
                <select name="veiculo" required className="input-control">
                  <option value="">Selecione...</option>
                  <option value="VAN">VAN</option>
                  <option value="TRUCK">TRUCK</option>
                  <option value="CARRETA">CARRETA</option>
                </select>
              </div>
              <div className="input-group">
                <label>Tipo de Frete *</label>
                <select name="frete" required className="input-control">
                  <option value="">Selecione...</option><option value="Dedicado">Dedicado</option><option value="Fracionado">Fracionado</option>
                </select>
              </div>
              <div className="input-group"><label>Nota Fiscal</label><input type="text" name="nf" className="input-control" placeholder="Opcional" /></div>
            </div>

            {/* SEÇÃO 4 */}
            <div className="input-group" style={{ marginTop: '1rem' }}>
              <label>Observações Adicionais</label>
              <textarea name="obs" rows="3" className="input-control"></textarea>
            </div>

            {/* BOTÕES */}
            <div className="form-actions">
              <button type="reset" className="btn btn-outline">Limpar</button>
              <button type="submit" disabled={carregando} className="btn btn-primary">
                <i className="fa-solid fa-floppy-disk"></i> {carregando ? 'Salvando...' : 'Salvar Solicitação'}
              </button>
            </div>

          </form>
        </section>
      </main>
    </div>
  );
}