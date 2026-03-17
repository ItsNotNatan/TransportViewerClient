// src/pages/AcompFinan/AcompFinan.jsx
import React, { useState, useEffect, useMemo } from 'react';
import { 
  LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer 
} from 'recharts';

const DollarSign = ({ size = 24 }) => <svg xmlns="http://www.w3.org/2000/svg" width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><line x1="12" y1="1" x2="12" y2="23"></line><path d="M17 5H9.5a3.5 3.5 0 0 0 0 7h5a3.5 3.5 0 0 1 0 7H6"></path></svg>;
const SearchIcon = ({ size = 20 }) => <svg xmlns="http://www.w3.org/2000/svg" width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><circle cx="11" cy="11" r="8"></circle><line x1="21" y1="21" x2="16.65" y2="16.65"></line></svg>;

export default function AcompFinan() {
  const [atms, setAtms] = useState([]);
  const [carregando, setCarregando] = useState(true);
  const [buscaPep, setBuscaPep] = useState(''); 
  const [pepAtivo, setPepAtivo] = useState(''); 

  // ==========================================
  // 1. BUSCA REAL DOS DADOS DO BACKEND
  // ==========================================
  useEffect(() => {
    const carregarDados = async () => {
      try {
        setCarregando(true);
        // Chamada para a rota que criamos no backend
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

  const handlePesquisar = (e) => {
    e.preventDefault();
    setPepAtivo(buscaPep.trim().toUpperCase());
  };

  // ==========================================
  // 2. FILTRAGEM INTELIGENTE (LOGÍSTICA + FINANCEIRO)
  // ==========================================
  const atmsDoPep = useMemo(() => {
    if (!pepAtivo) return [];
    return atms.filter(atm => {
      // Verifica o PEP tanto na tabela de pedido quanto na de faturamento (se existir)
      const pepLogistica = (atm.wbs || '').toUpperCase();
      const pepFinanceiro = (atm.faturamento?.elemento_pep_cc_wbs || '').toUpperCase();
      
      return pepLogistica.includes(pepAtivo) || pepFinanceiro.includes(pepAtivo);
    });
  }, [atms, pepAtivo]);

  // ==========================================
  // 3. SOMA E GRÁFICO
  // ==========================================
  const totalGasto = useMemo(() => {
    return atmsDoPep.reduce((acc, atm) => {
      // Prioriza o valor do faturamento, se não houver, usa o valor_nf da logística
      const valor = Number(atm.faturamento?.valor) || Number(atm.valor_nf) || 0;
      return acc + valor;
    }, 0);
  }, [atmsDoPep]);

  const dadosGrafico = useMemo(() => {
    const mapa = {};
    atmsDoPep.forEach(atm => {
      // Usa a data de solicitação como eixo do tempo
      const dataStr = atm.data_solicitacao;
      if (!dataStr) return;
      
      const data = dataStr.split('T')[0]; 
      const valor = Number(atm.faturamento?.valor) || Number(atm.valor_nf) || 0;
      
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

  const formatarMoeda = (valor) => {
    return new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(valor);
  };

  return (
    <section className="fade-in" style={{ padding: '2rem', maxWidth: '1000px', margin: '0 auto' }}>
      <div style={{ marginBottom: '2rem', display: 'flex', alignItems: 'center', gap: '1rem' }}>
        <div style={{ padding: '1rem', backgroundColor: '#ecfdf5', color: '#059669', borderRadius: '50%' }}>
          <DollarSign size={32} />
        </div>
        <div>
          <h2 style={{ margin: 0, fontSize: '1.8rem', color: '#111827' }}>Acompanhamento Financeiro</h2>
          <p style={{ margin: 0, color: '#6b7280' }}>Analise os custos consolidados por Elemento PEP / WBS.</p>
        </div>
      </div>

      <form onSubmit={handlePesquisar} style={{ display: 'flex', gap: '0.5rem', marginBottom: '2rem' }}>
        <div style={{ position: 'relative', flex: 1 }}>
          <div style={{ position: 'absolute', left: '1rem', top: '50%', transform: 'translateY(-50%)', color: '#9ca3af' }}>
            <SearchIcon size={20} />
          </div>
          <input 
            type="text" 
            placeholder="Digite o código PEP ou WBS (Ex: 10025A)"
            value={buscaPep}
            onChange={(e) => setBuscaPep(e.target.value)}
            style={{ width: '100%', padding: '1rem 1rem 1rem 3rem', fontSize: '1rem', borderRadius: '0.5rem', border: '1px solid #d1d5db', outline: 'none' }}
          />
        </div>
        <button type="submit" disabled={carregando} style={{ backgroundColor: '#059669', color: 'white', border: 'none', padding: '0 2rem', borderRadius: '0.5rem', fontWeight: 'bold', cursor: 'pointer' }}>
          {carregando ? 'Carregando...' : 'Analisar Gastos'}
        </button>
      </form>

      {pepAtivo && atmsDoPep.length > 0 ? (
        <div className="fade-in">
          <div style={{ backgroundColor: 'white', padding: '2rem', borderRadius: '0.75rem', boxShadow: '0 4px 6px -1px rgba(0, 0, 0, 0.1)', marginBottom: '2rem', display: 'flex', flexDirection: 'column', alignItems: 'center', borderLeft: '6px solid #059669' }}>
            <span style={{ fontSize: '1rem', color: '#6b7280', fontWeight: 'bold', textTransform: 'uppercase' }}>Total Acumulado no PEP: {pepAtivo}</span>
            <span style={{ fontSize: '3.5rem', fontWeight: '900', color: '#059669', marginTop: '0.5rem' }}>{formatarMoeda(totalGasto)}</span>
          </div>

          <div style={{ backgroundColor: 'white', padding: '1.5rem', borderRadius: '0.75rem', boxShadow: '0 4px 6px -1px rgba(0, 0, 0, 0.1)' }}>
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
        </div>
      ) : pepAtivo && (
        <div style={{ textAlign: 'center', padding: '3rem', backgroundColor: '#f9fafb', borderRadius: '0.75rem' }}>
          <p style={{ color: '#6b7280' }}>Nenhum dado encontrado para o PEP "{pepAtivo}".</p>
        </div>
      )}
    </section>
  );
}