import React, { useState, useEffect } from 'react';
import './RequestForm.css';
// Importando a lista do arquivo que acabamos de criar
import { LISTA_VEICULOS } from './ListaVeiculos.js'; 

export default function RequestForm() {
  const [carregando, setCarregando] = useState(false);
  const [dataHoje, setDataHoje] = useState('');
  const [coleta, setColeta] = useState({ cep: '', logradouro: '', bairro: '', localidade: '', uf: '' });
  const [entrega, setEntrega] = useState({ cep: '', logradouro: '', bairro: '', localidade: '', uf: '' });
  const [dataColeta, setDataColeta] = useState('');
  const [dataEntrega, setDataEntrega] = useState('');
  
  // NOVO: Estado para controlar a máscara do telefone de contato
  const [telefoneContato, setTelefoneContato] = useState('');

  useEffect(() => {
    const hoje = new Date();
    setDataHoje(hoje.toLocaleDateString('pt-BR'));
  }, []);

  const aplicarMascaraData = (valor) => {
    let v = valor.replace(/\D/g, '');
    if (v.length > 2) v = v.slice(0, 2) + '/' + v.slice(2);
    if (v.length > 5) v = v.slice(0, 5) + '/' + v.slice(5, 9);
    return v;
  };

  // NOVO: Função para aplicar máscara de telefone (Fixo ou Celular)
  const aplicarMascaraTelefone = (valor) => {
    let v = valor.replace(/\D/g, '');
    if (v.length <= 10) {
      v = v.replace(/^(\d{2})(\d)/g, '($1) $2');
      v = v.replace(/(\d{4})(\d)/, '$1-$2');
    } else {
      v = v.replace(/^(\d{2})(\d)/g, '($1) $2');
      v = v.replace(/(\d{5})(\d)/, '$1-$2');
    }
    return v;
  };

  const buscarCep = async (valorCep, tipo) => {
    const cepLimpo = valorCep.replace(/\D/g, '');
    if (tipo === 'coleta') setColeta(prev => ({ ...prev, cep: valorCep }));
    else setEntrega(prev => ({ ...prev, cep: valorCep }));

    if (cepLimpo.length === 8) {
      try {
        const res = await fetch(`https://viacep.com.br/ws/${cepLimpo}/json/`);
        const data = await res.json();
        if (data.erro) {
          alert(`O CEP ${valorCep} não foi encontrado. Por favor, verifique ou preencha manualmente.`);
          return;
        }
        if (tipo === 'coleta') {
          setColeta(prev => ({ ...prev, logradouro: data.logradouro || '', bairro: data.bairro || '', localidade: data.localidade || '', uf: data.uf || '' }));
        } else if (tipo === 'entrega') {
          setEntrega(prev => ({ ...prev, logradouro: data.logradouro || '', bairro: data.bairro || '', localidade: data.localidade || '', uf: data.uf || '' }));
        }
      } catch (error) {
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

    // Lógica do modal automático mantida intacta
    dados.modal = dados.veiculo === 'AVIÃO' ? 'AÉREO' : 'TERRESTRE';

    try {
      const resposta = await fetch('http://localhost:3001/api/transportes', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(dados), 
      });

      const resultado = await resposta.json();

      if (resposta.ok) {
        alert(`Sucesso! Transporte solicitado! (ID: ${resultado.id_gerado})`);
        e.target.reset();
        setColeta({ cep: '', logradouro: '', bairro: '', localidade: '', uf: '' });
        setEntrega({ cep: '', logradouro: '', bairro: '', localidade: '', uf: '' });
        setDataColeta('');
        setDataEntrega('');
        setTelefoneContato(''); // NOVO: Limpa o campo de telefone após o envio
      } else {
        alert("ERRO DO SERVIDOR: \n\n" + JSON.stringify(resultado, null, 2));
      }
    } catch (erro) {
      alert("ERRO DE CONEXÃO/REACT: \n\n" + erro.message);
    } finally {
      setCarregando(false);
    }
  };

  return (
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
            <label>Nº do Pedido *</label>
            <input type="text" name="pedidoCompra" required className="input-control" placeholder="Digite o nº do pedido" />
          </div>
          <div className="input-group">
            <label>WBS / Centro de Custo *</label>
            <input type="text" name="wbs" required className="input-control" placeholder="Digite o WBS" />
          </div>
        </div>

        {/* NOVO: DADOS DE CONTATO */}
        <div className="form-grid-2" style={{ marginTop: '1rem' }}>
          <div className="input-group">
            <label>Nome do Contato (Para alinhamentos) *</label>
            <input type="text" name="nomeContato" required className="input-control" placeholder="Com quem a transportadora deve falar?" />
          </div>
          <div className="input-group">
            <label>Telefone do Contato *</label>
            <input 
              type="tel" 
              name="telefoneContato" 
              value={telefoneContato} 
              onChange={(e) => setTelefoneContato(aplicarMascaraTelefone(e.target.value))} 
              maxLength="15" 
              required 
              className="input-control" 
              placeholder="(00) 00000-0000" 
            />
          </div>
        </div>

        {/* SEÇÃO 2: ROTA E PRAZOS (MANTIDA IGUAL) */}
        <h4 className="section-title" style={{ marginTop: '2rem' }}><i className="fa-solid fa-map-location-dot"></i> Rota e Prazos</h4>
        
        {/* Origem */}
        <div className="box-highlight" style={{ marginBottom: '1.5rem' }}>
          <h5 style={{ color: '#1e40af', fontWeight: 'bold', marginBottom: '1rem', borderBottom: '1px solid #e5e7eb', paddingBottom: '0.5rem' }}>1. Origem (Coleta)</h5>
          <div className="form-grid-2">
            <div className="input-group">
              <label>Empresa de Coleta *</label>
              <input type="text" name="empresaColeta" required className="input-control" placeholder="Nome do Fornecedor" />
            </div>
            <div className="input-group">
              <label>Data Desejada Coleta *</label>
              <input type="text" name="dataColeta" value={dataColeta} onChange={(e) => setDataColeta(aplicarMascaraData(e.target.value))} placeholder="DD/MM/AAAA" maxLength="10" required className="input-control" />
            </div>
          </div>
          <div className="form-grid-4">
            <div className="input-group">
              <label>CEP (Apenas números)</label>
              <input type="text" name="cepColeta" maxLength="9" value={coleta.cep} onChange={(e) => buscarCep(e.target.value, 'coleta')} className="input-control" placeholder="00000000" />
            </div>
            <div className="input-group" style={{ gridColumn: 'span 2' }}>
              <label>Logradouro (Rua/Av) *</label>
              <input type="text" name="logradouroColeta" required value={coleta.logradouro} onChange={(e) => setColeta({ ...coleta, logradouro: e.target.value })} className="input-control" />
            </div>
            <div className="input-group">
              <label>Número / Compl.</label>
              <input type="text" name="numeroColeta" className="input-control" />
            </div>
          </div>
          <div className="form-grid-3">
            <div className="input-group">
              <label>Bairro *</label>
              <input type="text" name="bairroColeta" required value={coleta.bairro} onChange={(e) => setColeta({ ...coleta, bairro: e.target.value })} className="input-control" />
            </div>
            <div className="input-group">
              <label>Cidade *</label>
              <input type="text" name="cidadeColeta" required value={coleta.localidade} onChange={(e) => setColeta({ ...coleta, localidade: e.target.value })} className="input-control" />
            </div>
            <div className="input-group">
              <label>UF *</label>
              <input type="text" name="ufColeta" maxLength="2" required value={coleta.uf} onChange={(e) => setColeta({ ...coleta, uf: e.target.value })} className="input-control" />
            </div>
          </div>
        </div>

        {/* Destino */}
        <div className="box-highlight" style={{ marginBottom: '1.5rem' }}>
          <h5 style={{ color: '#166534', fontWeight: 'bold', marginBottom: '1rem', borderBottom: '1px solid #e5e7eb', paddingBottom: '0.5rem' }}>2. Destino (Entrega)</h5>
          <div className="form-grid-2">
            <div className="input-group">
              <label>Empresa de Entrega / Setor</label>
              <input type="text" name="empresaEntrega" className="input-control" placeholder="Destinatário final" />
            </div>
            <div className="input-group">
              <label>Data Desejada Entrega *</label>
              <input type="text" name="dataEntrega" value={dataEntrega} onChange={(e) => setDataEntrega(aplicarMascaraData(e.target.value))} placeholder="DD/MM/AAAA" maxLength="10" required className="input-control" />
            </div>
          </div>
          <div className="form-grid-4">
            <div className="input-group">
              <label>CEP (Apenas números)</label>
              <input type="text" name="cepEntrega" maxLength="9" value={entrega.cep} onChange={(e) => buscarCep(e.target.value, 'entrega')} className="input-control" placeholder="00000000" />
            </div>
            <div className="input-group" style={{ gridColumn: 'span 2' }}>
              <label>Logradouro (Rua/Av) *</label>
              <input type="text" name="logradouroEntrega" required value={entrega.logradouro} onChange={(e) => setEntrega({ ...entrega, logradouro: e.target.value })} className="input-control" />
            </div>
            <div className="input-group">
              <label>Número / Compl.</label>
              <input type="text" name="numeroEntrega" className="input-control" />
            </div>
          </div>
          <div className="form-grid-3">
            <div className="input-group">
              <label>Bairro *</label>
              <input type="text" name="bairroEntrega" required value={entrega.bairro} onChange={(e) => setEntrega({ ...entrega, bairro: e.target.value })} className="input-control" />
            </div>
            <div className="input-group">
              <label>Cidade *</label>
              <input type="text" name="cidadeEntrega" required value={entrega.localidade} onChange={(e) => setEntrega({ ...entrega, localidade: e.target.value })} className="input-control" />
            </div>
            <div className="input-group">
              <label>UF *</label>
              <input type="text" name="ufEntrega" maxLength="2" required value={entrega.uf} onChange={(e) => setEntrega({ ...entrega, uf: e.target.value })} className="input-control" />
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
              {LISTA_VEICULOS.map((veiculo, index) => (
                <option key={index} value={veiculo}>
                  {veiculo}
                </option>
              ))}
            </select>
          </div>
          
          <div className="input-group">
            <label>Tipo de Frete *</label>
            <select name="frete" required className="input-control">
              <option value="">Selecione...</option>
              <option value="Dedicado">Dedicado</option>
              <option value="Fracionado">Fracionado</option>
              <option value="REDESPACHO/FRACIONADO">REDESPACHO/FRACIONADO</option>
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
  );
}