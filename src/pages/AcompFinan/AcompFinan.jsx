// src/pages/AcompFinan/AcompFinan.jsx
import React, { useState, useEffect, useMemo } from 'react';
import { 
  LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer 
} from 'recharts';

// Ícones
const DollarSign = ({ size = 24 }) => <svg xmlns="http://www.w3.org/2000/svg" width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><line x1="12" y1="1" x2="12" y2="23"></line><path d="M17 5H9.5a3.5 3.5 0 0 0 0 7h5a3.5 3.5 0 0 1 0 7H6"></path></svg>;
const SearchIcon = ({ size = 20 }) => <svg xmlns="http://www.w3.org/2000/svg" width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><circle cx="11" cy="11" r="8"></circle><line x1="21" y1="21" x2="16.65" y2="16.65"></line></svg>;

export default function AcompFinan() {
  const [atms, setAtms] = useState([]);
  const [buscaPep, setBuscaPep] = useState(''); // O que o utilizador digita
  const [pepAtivo, setPepAtivo] = useState(''); // O PEP que foi efetivamente pesquisado

  // ==========================================
  // 1. BUSCAR DADOS (SIMULAÇÃO DO BANCO)
  // ==========================================
  useEffect(() => {
    // Aqui você conectaria com a sua API real para buscar os dados de faturamento.
    // Exemplo de dados fictícios para testarmos o gráfico:
    setAtms([
      { id: '1', elemento_pep_cc_wbs: '10025A', valor: 1500, data_solicitacao: '2024-10-01' },
      { id: '2', elemento_pep_cc_wbs: '10025A', valor: 800, data_solicitacao: '2024-10-05' },
      { id: '3', elemento_pep_cc_wbs: '10025A', valor: 2200, data_solicitacao: '2024-10-12' },
      { id: '4', elemento_pep_cc_wbs: '10025A', valor: 1100, data_solicitacao: '2024-10-20' },
      { id: '5', elemento_pep_cc_wbs: '88899B', valor: 3100, data_solicitacao: '2024-10-10' },
      { id: '6', elemento_pep_cc_wbs: '88899B', valor: 450, data_solicitacao: '2024-10-12' },
    ]);
  }, []);

  // ==========================================
  // 2. LÓGICA DE FILTRAGEM PELO PEP
  // ==========================================
  const handlePesquisar = (e) => {
    e.preventDefault();
    setPepAtivo(buscaPep.trim().toUpperCase());
  };

  // Pega apenas os ATMs que correspondem ao PEP pesquisado
  const atmsDoPep = useMemo(() => {
    if (!pepAtivo) return [];
    return atms.filter(atm => {
      const pepAtm = (atm.elemento_pep_cc_wbs || atm.wbs || '').toUpperCase();
      return pepAtm.includes(pepAtivo); // includes permite achar se digitar só um pedaço
    });
  }, [atms, pepAtivo]);

  // ==========================================
  // 3. CÁLCULOS PARA O GRÁFICO E TOTAIS
  // ==========================================
  
  // Calcula o Total Gasto do PEP pesquisado
  const totalGasto = useMemo(() => {
    return atmsDoPep.reduce((acc, atm) => acc + (Number(atm.valor) || Number(atm.valor_nf) || 0), 0);
  }, [atmsDoPep]);

  // Prepara os dados para a Linha do Tempo (Evolução de Gastos)
  const dadosGrafico = useMemo(() => {
    const mapa = {};
    
    atmsDoPep.forEach(atm => {
      const dataStr = atm.data_solicitacao || atm.data_emissao;
      if (!dataStr) return;
      
      const data = dataStr.split('T')[0]; // Extrai apenas YYYY-MM-DD
      const valor = Number(atm.valor) || Number(atm.valor_nf) || 0;
      
      if (valor > 0) {
        if (!mapa[data]) mapa[data] = 0;
        mapa[data] += valor;
      }
    });

    // Ordena por data e formata para exibir no eixo X
    return Object.keys(mapa).sort().map(data => {
      const [ano, mes, dia] = data.split('-');
      return {
        dataOriginal: data,
        dataExibicao: `${dia}/${mes}/${ano}`,
        gasto: mapa[data]
      };
    });
  }, [atmsDoPep]);

  // Função auxiliar para mostrar dinheiro
  const formatarMoeda = (valor) => {
    return new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(valor);
  };

  return (
    <section className="fade-in" style={{ padding: '2rem', maxWidth: '1000px', margin: '0 auto' }}>
      
      {/* CABEÇALHO */}
      <div style={{ marginBottom: '2rem', display: 'flex', alignItems: 'center', gap: '1rem' }}>
        <div style={{ padding: '1rem', backgroundColor: '#ecfdf5', color: '#059669', borderRadius: '50%' }}>
          <DollarSign size={32} />
        </div>
        <div>
          <h2 style={{ margin: 0, fontSize: '1.8rem', color: '#111827' }}>Acompanhamento de Orçamento</h2>
          <p style={{ margin: 0, color: '#6b7280' }}>Pesquise por um Elemento PEP ou WBS para ver a evolução de custos logísticos.</p>
        </div>
      </div>

      {/* BARRA DE PESQUISA */}
      <form onSubmit={handlePesquisar} style={{ display: 'flex', gap: '0.5rem', marginBottom: '2rem' }}>
        <div style={{ position: 'relative', flex: 1 }}>
          <div style={{ position: 'absolute', left: '1rem', top: '50%', transform: 'translateY(-50%)', color: '#9ca3af' }}>
            <SearchIcon size={20} />
          </div>
          <input 
            type="text" 
            placeholder="Digite o código PEP (Ex: 10025A)"
            value={buscaPep}
            onChange={(e) => setBuscaPep(e.target.value)}
            style={{ width: '100%', padding: '1rem 1rem 1rem 3rem', fontSize: '1rem', borderRadius: '0.5rem', border: '1px solid #d1d5db', outline: 'none', boxSizing: 'border-box' }}
          />
        </div>
        <button type="submit" style={{ backgroundColor: '#059669', color: 'white', border: 'none', padding: '0 2rem', borderRadius: '0.5rem', fontWeight: 'bold', fontSize: '1rem', cursor: 'pointer' }}>
          Analisar PEP
        </button>
      </form>

      {/* RESULTADOS (Só mostra se houver um PEP pesquisado) */}
      {pepAtivo && atmsDoPep.length === 0 ? (
        <div style={{ textAlign: 'center', padding: '3rem', backgroundColor: '#f9fafb', borderRadius: '0.75rem', border: '1px dashed #d1d5db' }}>
          <h3 style={{ color: '#4b5563' }}>Nenhum custo encontrado para o PEP: <span style={{ color: '#059669' }}>{pepAtivo}</span></h3>
          <p style={{ color: '#9ca3af' }}>Verifique se o código foi digitado corretamente.</p>
        </div>
      ) : pepAtivo && atmsDoPep.length > 0 ? (
        <div className="fade-in">
          
          {/* TOTAL GASTO CARD */}
          <div style={{ backgroundColor: 'white', padding: '2rem', borderRadius: '0.75rem', boxShadow: '0 4px 6px -1px rgba(0, 0, 0, 0.1)', marginBottom: '2rem', display: 'flex', flexDirection: 'column', alignItems: 'center', borderLeft: '6px solid #059669' }}>
            <span style={{ fontSize: '1rem', color: '#6b7280', fontWeight: 'bold', textTransform: 'uppercase', letterSpacing: '0.05em' }}>
              Total Gasto no PEP: <span style={{ color: '#111827' }}>{pepAtivo}</span>
            </span>
            <span style={{ fontSize: '3.5rem', fontWeight: '900', color: '#059669', marginTop: '0.5rem', lineHeight: '1' }}>
              {formatarMoeda(totalGasto)}
            </span>
            <span style={{ fontSize: '0.85rem', color: '#9ca3af', marginTop: '1rem' }}>
              Baseado em {atmsDoPep.length} solicitações concluídas/faturadas.
            </span>
          </div>

          {/* GRÁFICO DA LINHA DO TEMPO */}
          <div style={{ backgroundColor: 'white', padding: '1.5rem', borderRadius: '0.75rem', boxShadow: '0 4px 6px -1px rgba(0, 0, 0, 0.1)' }}>
            <h3 style={{ margin: '0 0 1.5rem 0', color: '#111827' }}>Evolução de Gastos do Projeto</h3>
            <div style={{ height: '400px', width: '100%' }}>
              <ResponsiveContainer width="100%" height="100%">
                <LineChart data={dadosGrafico} margin={{ top: 20, right: 30, left: 20, bottom: 5 }}>
                  <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#e5e7eb" />
                  <XAxis dataKey="dataExibicao" tick={{ fill: '#4b5563' }} />
                  <YAxis tickFormatter={(val) => `R$ ${val}`} tick={{ fill: '#4b5563' }} />
                  <Tooltip 
                    formatter={(value) => [formatarMoeda(value), "Gasto do Dia"]} 
                    labelStyle={{ color: '#111827', fontWeight: 'bold', marginBottom: '5px' }} 
                  />
                  <Line 
                    type="monotone" 
                    dataKey="gasto" 
                    name="Valor Logístico" 
                    stroke="#10b981" 
                    strokeWidth={4} 
                    dot={{ r: 6, fill: '#10b981', stroke: 'white', strokeWidth: 2 }} 
                    activeDot={{ r: 8 }} 
                  />
                </LineChart>
              </ResponsiveContainer>
            </div>
          </div>

        </div>
      ) : null}

    </section>
  );
}