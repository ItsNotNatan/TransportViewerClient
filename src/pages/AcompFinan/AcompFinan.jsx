// src/pages/AcompFinan/AcompFinan.jsx
import React, { useState, useEffect, useMemo } from 'react';
import Select from 'react-select'; 
import { 
  LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer 
} from 'recharts';

const DollarSign = ({ size = 24 }) => <svg xmlns="http://www.w3.org/2000/svg" width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><line x1="12" y1="1" x2="12" y2="23"></line><path d="M17 5H9.5a3.5 3.5 0 0 0 0 7h5a3.5 3.5 0 0 1 0 7H6"></path></svg>;

export default function AcompFinan() {
  const [atms, setAtms] = useState([]);
  const [carregando, setCarregando] = useState(true);
  
  const [pepSelecionado, setPepSelecionado] = useState(null); 
  const [pepAtivo, setPepAtivo] = useState(''); 

  // ==========================================
  // 1. BUSCA DE DADOS
  // ==========================================
  useEffect(() => {
    const carregarDados = async () => {
      try {
        setCarregando(true);
        const resposta = await fetch('http://localhost:3001/api/admin/transportes');
        const dados = await resposta.json();
        if (resposta.ok) {
          setAtms(dados);
        }
      } catch (erro) {
        console.error("Erro ao buscar dados financeiros:", erro);
      } finally {
        setCarregando(false);
      }
    };
    carregarDados();
  }, []);

  // ==========================================
  // 2. EXTRAÇÃO DAS OPÇÕES DE PEP (CORRIGIDO)
  // ==========================================
  const opcoesPep = useMemo(() => {
    const pepsUnicos = new Set();
    
    atms.forEach(atm => {
      // Pega o WBS da logística
      if (atm.wbs) pepsUnicos.add(atm.wbs.toUpperCase().trim());
      
      // Pega o PEP do faturamento (Corrigido para ler direto do objeto atm)
      if (atm.elemento_pep_cc_wbs) {
        pepsUnicos.add(atm.elemento_pep_cc_wbs.toUpperCase().trim());
      }
    });

    return Array.from(pepsUnicos)
      .filter(pep => pep !== '') 
      .sort() 
      .map(pep => ({ value: pep, label: pep }));
  }, [atms]);

  const handlePesquisar = (e) => {
    e.preventDefault();
    setPepAtivo(pepSelecionado ? pepSelecionado.value : '');
  };

  // ==========================================
  // 3. FILTRAGEM INTELIGENTE (CORRIGIDO)
  // ==========================================
  const atmsDoPep = useMemo(() => {
    if (!pepAtivo) return [];
    return atms.filter(atm => {
      const pepLogistica = (atm.wbs || '').toUpperCase();
      const pepFinanceiro = (atm.elemento_pep_cc_wbs || '').toUpperCase();
      
      return pepLogistica.includes(pepAtivo) || pepFinanceiro.includes(pepAtivo);
    });
  }, [atms, pepAtivo]);

  // ==========================================
  // 4. CÁLCULOS E GRÁFICOS (CORRIGIDO)
  // ==========================================
  const totalGasto = useMemo(() => {
    return atmsDoPep.reduce((acc, atm) => {
      // Pega o valor do faturamento, se não tiver, tenta o da NF
      const valor = Number(atm.valor) || Number(atm.valor_nf) || 0;
      return acc + valor;
    }, 0);
  }, [atmsDoPep]);

  const dadosGrafico = useMemo(() => {
    const mapa = {};
    atmsDoPep.forEach(atm => {
      const dataStr = atm.data_solicitacao || atm.created_at;
      if (!dataStr) return;
      
      const data = dataStr.split('T')[0]; 
      const valor = Number(atm.valor) || Number(atm.valor_nf) || 0;
      
      if (valor > 0) {
        mapa[data] = (mapa[data] || 0) + valor;
      }
    });

    return Object.keys(mapa).sort().map(data => {
      const [ano, mes, dia] = data.split('-');
      return {
        dataExibicao: `${dia}/${mes}`,
        gasto: mapa[data]
      };
    });
  }, [atmsDoPep]);

  // Utilitários de formatação
  const formatarMoeda = (valor) => {
    return new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(valor);
  };

  const shortId = (id) => id ? id.substring(0, 8).toUpperCase() : 'N/A';

  const formatarDataBR = (dataStr) => {
    if (!dataStr) return '-';
    const partes = dataStr.split('T')[0].split('-');
    return `${partes[2]}/${partes[1]}/${partes[0]}`;
  };

  // Estilos do Select
  const selectStyles = {
    control: (base) => ({ 
      ...base, padding: '0.4rem', borderRadius: '0.5rem', borderColor: '#d1d5db',
      fontSize: '1rem', boxShadow: 'none', '&:hover': { borderColor: '#059669' }
    }),
    option: (base, state) => ({
      ...base, backgroundColor: state.isSelected ? '#059669' : state.isFocused ? '#ecfdf5' : 'white',
      color: state.isSelected ? 'white' : '#111827', cursor: 'pointer'
    })
  };

  return (
    <section className="fade-in" style={{ padding: '2rem', maxWidth: '1100px', margin: '0 auto' }}>
      
      {/* CABEÇALHO */}
      <div style={{ marginBottom: '2rem', display: 'flex', alignItems: 'center', gap: '1rem' }}>
        <div style={{ padding: '1rem', backgroundColor: '#ecfdf5', color: '#059669', borderRadius: '50%' }}>
          <DollarSign size={32} />
        </div>
        <div>
          <h2 style={{ margin: 0, fontSize: '1.8rem', color: '#111827' }}>Acompanhamento Financeiro</h2>
          <p style={{ margin: 0, color: '#6b7280' }}>Analise os custos consolidados por Elemento PEP / WBS.</p>
        </div>
      </div>

      {/* BARRA DE PESQUISA */}
      <form onSubmit={handlePesquisar} style={{ display: 'flex', gap: '1rem', marginBottom: '2rem', alignItems: 'center' }}>
        <div style={{ flex: 1 }}>
          <Select
            options={opcoesPep}
            value={pepSelecionado}
            onChange={setPepSelecionado}
            placeholder="Selecione ou digite o código PEP..."
            isSearchable
            isClearable
            isDisabled={carregando}
            styles={selectStyles}
            noOptionsMessage={() => "Nenhum projeto encontrado"}
          />
        </div>
        <button 
          type="submit" 
          disabled={carregando || !pepSelecionado} 
          style={{ 
            backgroundColor: (!carregando && pepSelecionado) ? '#059669' : '#9ca3af', 
            color: 'white', border: 'none', padding: '0 2rem', height: '48px', 
            borderRadius: '0.5rem', fontWeight: 'bold', 
            cursor: (!carregando && pepSelecionado) ? 'pointer' : 'not-allowed',
            transition: 'background-color 0.2s'
          }}
        >
          {carregando ? 'Carregando...' : 'Analisar Gastos'}
        </button>
      </form>

      {/* RESULTADOS */}
      {pepAtivo && atmsDoPep.length > 0 ? (
        <div className="fade-in">
          
          {/* CARD DE TOTAL */}
          <div style={{ backgroundColor: 'white', padding: '2rem', borderRadius: '0.75rem', boxShadow: '0 4px 6px -1px rgba(0, 0, 0, 0.1)', marginBottom: '2rem', display: 'flex', flexDirection: 'column', alignItems: 'center', borderLeft: '6px solid #059669' }}>
            <span style={{ fontSize: '1rem', color: '#6b7280', fontWeight: 'bold', textTransform: 'uppercase' }}>
              Total Acumulado no PEP: <span style={{ color: '#111827' }}>{pepAtivo}</span>
            </span>
            <span style={{ fontSize: '3.5rem', fontWeight: '900', color: '#059669', marginTop: '0.5rem' }}>
              {formatarMoeda(totalGasto)}
            </span>
            <span style={{ fontSize: '0.9rem', color: '#6b7280', marginTop: '0.5rem' }}>
              Composto por {atmsDoPep.length} solicitação(ões)
            </span>
          </div>

          {/* GRÁFICO */}
          <div style={{ backgroundColor: 'white', padding: '1.5rem', borderRadius: '0.75rem', boxShadow: '0 4px 6px -1px rgba(0, 0, 0, 0.1)', marginBottom: '2rem' }}>
            <h3 style={{ margin: '0 0 1.5rem 0', color: '#111827' }}>Linha do Tempo de Custos</h3>
            <div style={{ height: '350px', width: '100%' }}>
              <ResponsiveContainer width="100%" height="100%">
                <LineChart data={dadosGrafico} margin={{ top: 10, right: 30, left: 20, bottom: 10 }}>
                  <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#e5e7eb" />
                  <XAxis dataKey="dataExibicao" />
                  <YAxis tickFormatter={(val) => `R$${val}`} />
                  <Tooltip formatter={(val) => formatarMoeda(val)} />
                  <Line type="monotone" dataKey="gasto" stroke="#10b981" strokeWidth={4} dot={{ r: 6 }} activeDot={{ r: 8 }} />
                </LineChart>
              </ResponsiveContainer>
            </div>
          </div>

          {/* 👇 NOVA TABELA DE DETALHAMENTO 👇 */}
          <div style={{ backgroundColor: 'white', padding: '1.5rem', borderRadius: '0.75rem', boxShadow: '0 4px 6px -1px rgba(0, 0, 0, 0.1)' }}>
            <h3 style={{ margin: '0 0 1rem 0', color: '#111827' }}>Detalhamento das Despesas</h3>
            <div style={{ overflowX: 'auto' }}>
              <table style={{ width: '100%', borderCollapse: 'collapse', textAlign: 'left', fontSize: '0.95rem' }}>
                <thead>
                  <tr style={{ backgroundColor: '#f9fafb', borderBottom: '2px solid #e5e7eb' }}>
                    <th style={{ padding: '12px', color: '#4b5563' }}>ID ATM</th>
                    <th style={{ padding: '12px', color: '#4b5563' }}>Data</th>
                    <th style={{ padding: '12px', color: '#4b5563' }}>NF / Fatura</th>
                    <th style={{ padding: '12px', color: '#4b5563' }}>Veículo/Modal</th>
                    <th style={{ padding: '12px', color: '#4b5563', textAlign: 'right' }}>Valor</th>
                  </tr>
                </thead>
                <tbody>
                  {atmsDoPep.map(atm => {
                    const valor = Number(atm.valor) || Number(atm.valor_nf) || 0;
                    return (
                      <tr key={atm.id} style={{ borderBottom: '1px solid #f3f4f6' }}>
                        <td style={{ padding: '12px', fontWeight: 'bold' }}>#{shortId(atm.id)}</td>
                        <td style={{ padding: '12px' }}>{formatarDataBR(atm.data_solicitacao || atm.created_at)}</td>
                        <td style={{ padding: '12px' }}>{atm.nf || atm.fatura_cte || '-'}</td>
                        <td style={{ padding: '12px' }}>{atm.veiculo || atm.modal || '-'}</td>
                        <td style={{ padding: '12px', textAlign: 'right', color: valor > 0 ? '#059669' : '#9ca3af', fontWeight: 'bold' }}>
                          {valor > 0 ? formatarMoeda(valor) : 'Sem custo'}
                        </td>
                      </tr>
                    )
                  })}
                </tbody>
              </table>
            </div>
          </div>
          {/* 👆 ================================ 👆 */}

        </div>
      ) : pepAtivo && (
        <div style={{ textAlign: 'center', padding: '3rem', backgroundColor: '#f9fafb', borderRadius: '0.75rem' }}>
          <p style={{ color: '#6b7280', fontSize: '1.1rem' }}>
            Nenhum dado financeiro encontrado para o PEP <strong>"{pepAtivo}"</strong>.
          </p>
        </div>
      )}
    </section>
  );
}