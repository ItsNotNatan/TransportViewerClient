import React, { useState, useEffect } from 'react';
import { NavLink } from 'react-router-dom';

import './RequestForm.css'

export default function RequestForm() {
  const [carregando, setCarregando] = useState(false);
  const [dataHoje, setDataHoje] = useState('');

  // ESTADOS DOS ENDEREÇOS (Coleta e Entrega)
  const [coleta, setColeta] = useState({ cep: '', logradouro: '', bairro: '', localidade: '', uf: '' });
  const [entrega, setEntrega] = useState({ cep: '', logradouro: '', bairro: '', localidade: '', uf: '' });

  // ESTADOS DAS DATAS MANUAIS (Para forçar DD/MM/AAAA)
  const [dataColeta, setDataColeta] = useState('');
  const [dataEntrega, setDataEntrega] = useState('');

  useEffect(() => {
    const hoje = new Date();
    setDataHoje(hoje.toLocaleDateString('pt-BR')); 
  }, []);

  // MÁSCARA INTELIGENTE PARA FORÇAR DD/MM/AAAA NAS DATAS DE COLETA E ENTREga
  const aplicarMascaraData = (valor) => {
    let v = valor.replace(/\D/g, ''); // Tira tudo que não for número
    if (v.length > 2) v = v.slice(0, 2) + '/' + v.slice(2);
    if (v.length > 5) v = v.slice(0, 5) + '/' + v.slice(5, 9);
    return v;
  };

  // FUNÇÃO MÁGICA QUE BUSCA O CEP NA API VIACEP (COLETA E ENTREGA)
  const buscarCep = async (valorCep, tipo) => {
    const cepLimpo = valorCep.replace(/\D/g, ''); 
    
    // Atualiza o que o usuário está digitando na tela
    if (tipo === 'coleta') {
      setColeta(prev => ({ ...prev, cep: valorCep }));
    } else {
      setEntrega(prev => ({ ...prev, cep: valorCep }));
    }

    // Quando bater 8 números exatos, vai na internet buscar!
    if (cepLimpo.length === 8) {
      try {
        const res = await fetch(`https://viacep.com.br/ws/${cepLimpo}/json/`);
        const data = await res.json();
        
        if (data.erro) {
          alert(`O CEP ${valorCep} não foi encontrado. Por favor, verifique ou preencha manualmente.`);
          return; 
        }

        // Se encontrou, preenche os campos automaticamente!
        if (tipo === 'coleta') {
          setColeta(prev => ({ 
            ...prev, 
            logradouro: data.logradouro || '', 
            bairro: data.bairro || '', 
            localidade: data.localidade || '', 
            uf: data.uf || '' 
          }));
        } else if (tipo === 'entrega') {
          setEntrega(prev => ({ 
            ...prev, 
            logradouro: data.logradouro || '', 
            bairro: data.bairro || '', 
            localidade: data.localidade || '', 
            uf: data.uf || '' 
          }));
        }
      } catch (error) {
        console.error("Erro ao buscar o CEP:", error);
        alert("Erro de conexão ao buscar o CEP. Preencha manualmente.");
      }
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setCarregando(true);

    const formData = new FormData(e.target);
    const dados = Object.fromEntries(formData.entries());
    
    dados.dataSolicitacao = dataHoje; 
    
    // Juntando os endereços para salvar certinho no banco de dados
    dados.coleta = `${dados.logradouroColeta}, ${dados.numeroColeta || 'S/N'} - ${dados.bairroColeta}, ${dados.cidadeColeta} - ${dados.ufColeta} (CEP: ${dados.cepColeta})`;
    dados.entrega = `${dados.logradouroEntrega}, ${dados.numeroEntrega || 'S/N'} - ${dados.bairroEntrega}, ${dados.cidadeEntrega} - ${dados.ufEntrega} (CEP: ${dados.cepEntrega})`;

    try {
      const resposta = await fetch('http://localhost:3000/api/transportes', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(dados),
      });

      const resultado = await resposta.json();

      if (resposta.ok) {
        alert(`Sucesso! Transporte solicitado! (ID: ${resultado.id_gerado})`);
        e.target.reset(); 
        
        // Limpa a tela após enviar
        setColeta({ cep: '', logradouro: '', bairro: '', localidade: '', uf: '' });
        setEntrega({ cep: '', logradouro: '', bairro: '', localidade: '', uf: '' });
        setDataColeta('');
        setDataEntrega('');
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

      <main className="app-main">
        <section className="form-card fade-in">
          <div className="card-header">
            <h3 className="card-title">Solicitação de Transporte</h3>
            <div className="badge-info"><i className="fa-solid fa-clock"></i> Preencha os dados</div>
          </div>
          
          <form onSubmit={handleSubmit}>
            
            {/* SEÇÃO 1: DADOS BÁSICOS */}
            <h4 className="section-title"><i className="fa-solid fa-user-tag"></i> Dados do Solicitante</h4>
            <div className="form-grid-4">
              <div className="input-group">
                <label>Nome completo *</label>
                <input type="text" name="solicitante" required className="input-control" placeholder="Seu nome" />
              </div>
              <div className="input-group">
                <label>Data da Solicitação</label>
                <input type="text" value={dataHoje} readOnly className="input-control" />
              </div>
              <div className="input-group">
                <label>Nº do Pedido</label>
                <input type="text" readOnly className="input-control" placeholder="Gerado automaticamente" />
              </div>
              <div className="input-group">
                <label>WBS / Centro de Custo</label>
                <input type="text" disabled value="Preenchido pelo Admin" className="input-control" style={{ color: '#ef4444', fontWeight: 'bold' }} />
              </div>
            </div>

            {/* SEÇÃO 2: ROTA (ORIGEM) */}
            <h4 className="section-title"><i className="fa-solid fa-map-location-dot"></i> Rota e Prazos</h4>
            
            <div className="box-highlight" style={{ marginBottom: '1.5rem' }}>
              <h5 style={{ color: '#1e40af', fontWeight: 'bold', marginBottom: '1rem', borderBottom: '1px solid #e5e7eb', paddingBottom: '0.5rem' }}>1. Origem (Coleta)</h5>
              
              <div className="form-grid-2">
                <div className="input-group">
                  <label>Empresa de Coleta *</label>
                  <input type="text" name="empresaColeta" required className="input-control" placeholder="Nome do Fornecedor" />
                </div>
                <div className="input-group">
                  <label>Data Desejada Coleta *</label>
                  {/* MÁSCARA APLICADA NA COLETA */}
                  <input 
                    type="text" 
                    name="dataColeta" 
                    value={dataColeta} 
                    onChange={(e) => setDataColeta(aplicarMascaraData(e.target.value))} 
                    placeholder="DD/MM/AAAA" 
                    maxLength="10" 
                    required 
                    className="input-control" 
                  />
                </div>
              </div>

              <div className="form-grid-4">
                <div className="input-group">
                  <label>CEP (Apenas números)</label>
                  {/* CHAMANDO BUSCA CEP: COLETA */}
                  <input type="text" name="cepColeta" maxLength="9" value={coleta.cep} onChange={(e) => buscarCep(e.target.value, 'coleta')} className="input-control" placeholder="00000000" />
                </div>
                <div className="input-group" style={{ gridColumn: 'span 2' }}>
                  <label>Logradouro (Rua/Av) *</label>
                  <input type="text" name="logradouroColeta" required value={coleta.logradouro} onChange={(e) => setColeta({...coleta, logradouro: e.target.value})} className="input-control" />
                </div>
                <div className="input-group">
                  <label>Número / Compl.</label>
                  <input type="text" name="numeroColeta" className="input-control" />
                </div>
              </div>

              <div className="form-grid-3">
                <div className="input-group">
                  <label>Bairro *</label>
                  <input type="text" name="bairroColeta" required value={coleta.bairro} onChange={(e) => setColeta({...coleta, bairro: e.target.value})} className="input-control" />
                </div>
                <div className="input-group">
                  <label>Cidade *</label>
                  <input type="text" name="cidadeColeta" required value={coleta.localidade} onChange={(e) => setColeta({...coleta, localidade: e.target.value})} className="input-control" />
                </div>
                <div className="input-group">
                  <label>UF *</label>
                  <input type="text" name="ufColeta" maxLength="2" required value={coleta.uf} onChange={(e) => setColeta({...coleta, uf: e.target.value})} className="input-control" />
                </div>
              </div>
            </div>

            {/* SEÇÃO 2: ROTA (DESTINO) */}
            <div className="box-highlight" style={{ marginBottom: '1.5rem' }}>
              <h5 style={{ color: '#166534', fontWeight: 'bold', marginBottom: '1rem', borderBottom: '1px solid #e5e7eb', paddingBottom: '0.5rem' }}>2. Destino (Entrega)</h5>
              
              <div className="form-grid-2">
                <div className="input-group">
                  <label>Empresa de Entrega / Setor</label>
                  <input type="text" name="empresaEntrega" className="input-control" placeholder="Destinatário final" />
                </div>
                <div className="input-group">
                  <label>Data Desejada Entrega *</label>
                  {/* MÁSCARA APLICADA NA ENTREGA */}
                  <input 
                    type="text" 
                    name="dataEntrega" 
                    value={dataEntrega} 
                    onChange={(e) => setDataEntrega(aplicarMascaraData(e.target.value))} 
                    placeholder="DD/MM/AAAA" 
                    maxLength="10" 
                    required 
                    className="input-control" 
                  />
                </div>
              </div>

              <div className="form-grid-4">
                <div className="input-group">
                  <label>CEP (Apenas números)</label>
                  {/* CHAMANDO BUSCA CEP: ENTREGA */}
                  <input type="text" name="cepEntrega" maxLength="9" value={entrega.cep} onChange={(e) => buscarCep(e.target.value, 'entrega')} className="input-control" placeholder="00000000" />
                </div>
                <div className="input-group" style={{ gridColumn: 'span 2' }}>
                  <label>Logradouro (Rua/Av) *</label>
                  <input type="text" name="logradouroEntrega" required value={entrega.logradouro} onChange={(e) => setEntrega({...entrega, logradouro: e.target.value})} className="input-control" />
                </div>
                <div className="input-group">
                  <label>Número / Compl.</label>
                  <input type="text" name="numeroEntrega" className="input-control" />
                </div>
              </div>

              <div className="form-grid-3">
                <div className="input-group">
                  <label>Bairro *</label>
                  <input type="text" name="bairroEntrega" required value={entrega.bairro} onChange={(e) => setEntrega({...entrega, bairro: e.target.value})} className="input-control" />
                </div>
                <div className="input-group">
                  <label>Cidade *</label>
                  <input type="text" name="cidadeEntrega" required value={entrega.localidade} onChange={(e) => setEntrega({...entrega, localidade: e.target.value})} className="input-control" />
                </div>
                <div className="input-group">
                  <label>UF *</label>
                  <input type="text" name="ufEntrega" maxLength="2" required value={entrega.uf} onChange={(e) => setEntrega({...entrega, uf: e.target.value})} className="input-control" />
                </div>
              </div>
            </div>

            {/* SEÇÃO 3: CARACTERÍSTICAS */}
            <h4 className="section-title"><i className="fa-solid fa-box-open"></i> Características</h4>
            <div className="form-grid-3">
              <div className="input-group"><label>Peso (kg) *</label><input type="number" name="peso" step="0.01" min="0" required className="input-control" /></div>
              <div className="input-group"><label>Volume (m³) *</label><input type="number" name="volume" step="0.01" min="0" required className="input-control" /></div>
              <div className="input-group"><label>Medidas (C x L x A)</label><input type="text" name="medidas" placeholder="Ex: 2m x 1m x 1.5m" className="input-control" /></div>
              
              <div className="input-group">
                <label>Veículo *</label>
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

            <div className="input-group" style={{ marginTop: '1rem' }}>
              <label>Observações Adicionais</label>
              <textarea name="obs" rows="3" className="input-control"></textarea>
            </div>

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