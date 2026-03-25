// src/pages/AcompFinan/AcompFinan.jsx
import React, { useState, useEffect, useMemo } from 'react';
import Select from 'react-select'; 
import { 
  LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer,
  PieChart, Pie, Cell, BarChart, Bar, Legend, AreaChart, Area
} from 'recharts';
import api from '../../services/api'; 

// --- Ícones ---
const DollarSign = ({ size = 24 }) => <svg xmlns="http://www.w3.org/2000/svg" width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><line x1="12" y1="1" x2="12" y2="23"></line><path d="M17 5H9.5a3.5 3.5 0 0 0 0 7h5a3.5 3.5 0 0 1 0 7H6"></path></svg>;
const TrendingUp = ({ size = 20 }) => <svg xmlns="http://www.w3.org/2000/svg" width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><polyline points="23 6 13.5 15.5 8.5 10.5 1 18"></polyline><polyline points="17 6 23 6 23 12"></polyline></svg>;

const COLORS = ['#059669', '#3b82f6', '#f59e0b', '#ef4444', '#8b5cf6'];

export default function AcompFinan() {
  const [atms, setAtms] = useState([]);
  const [carregando, setCarregando] = useState(true);
  const [pepSelecionado, setPepSelecionado] = useState(null); 
  const [pepAtivo, setPepAtivo] = useState(''); 

  useEffect(() => {
    const carregarDados = async () => {
      try {
        setCarregando(true);
        const resposta = await api.get('/admin/transportes');
        setAtms(resposta.data);
      } catch (erro) {
        console.error("Erro ao buscar dados financeiros:", erro);
      } finally {
        setCarregando(false);
      }
    };
    carregarDados();
  }, []);

  const opcoesPep = useMemo(() => {
    const pepsUnicos = new Set();
    atms.forEach(atm => {
      if (atm.wbs) pepsUnicos.add(atm.wbs.toUpperCase().trim());
      if (atm.elemento_pep_cc_wbs) pepsUnicos.add(atm.elemento_pep_cc_wbs.toUpperCase().trim());
    });
    return Array.from(pepsUnicos).sort().map(pep => ({ value: pep, label: pep }));
  }, [atms]);

  const atmsDoPep = useMemo(() => {
    if (!pepAtivo) return [];
    return atms.filter(atm => {
      const pepLogistica = (atm.wbs || '').toUpperCase();
      const pepFinanceiro = (atm.elemento_pep_cc_wbs || '').toUpperCase();
      return pepLogistica.includes(pepAtivo) || pepFinanceiro.includes(pepAtivo);
    });
  }, [atms, pepAtivo]);

  // ==========================================
  // LÓGICA DE CÁLCULOS AVANÇADOS
  // ==========================================
  const stats = useMemo(() => {
    if (atmsDoPep.length === 0) return null;

    const total = atmsDoPep.reduce((acc, atm) => acc + (Number(atm.valor) || Number(atm.valor_nf) || 0), 0);
    const media = total / atmsDoPep.length;

    // Distribuição por Modal
    const modalMap = {};
    const transportadoraMap = {};

    atmsDoPep.forEach(atm => {
      const modal = atm.modal || 'TERRESTRE';
      const valor = Number(atm.valor) || Number(atm.valor_nf) || 0;
      modalMap[modal] = (modalMap[modal] || 0) + valor;

      const trans = atm.transportadora?.nome || 'A Definir';
      transportadoraMap[trans] = (transportadoraMap[trans] || 0) + valor;
    });

    const modalData = Object.keys(modalMap).map(key => ({ name: key, value: modalMap[key] }));
    const transData = Object.keys(transportadoraMap)
      .map(key => ({ name: key, valor: transportadoraMap[key] }))
      .sort((a, b) => b.valor - a.valor)
      .slice(0, 5);

    return { total, media, modalData, transData };
  }, [atmsDoPep]);

  const dadosGraficoTempo = useMemo(() => {
    const mapa = {};
    let acumulado = 0;
    
    const ordenados = [...atmsDoPep].sort((a, b) => 
      new Date(a.data_solicitacao || a.created_at) - new Date(b.data_solicitacao || b.created_at)
    );

    return ordenados.map(atm => {
      const valor = Number(atm.valor) || Number(atm.valor_nf) || 0;
      acumulado += valor;
      const dataStr = (atm.data_solicitacao || atm.created_at).split('T')[0];
      const [ano, mes, dia] = dataStr.split('-');
      
      return {
        data: `${dia}/${mes}`,
        gasto: valor,
        acumulado: acumulado
      };
    });
  }, [atmsDoPep]);

  const formatarMoeda = (val) => new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(val);

  return (
    <section className="fade-in" style={{ padding: '2rem', maxWidth: '1200px', margin: '0 auto', backgroundColor: '#f8fafc' }}>
      
      <div style={{ marginBottom: '2rem', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '1rem' }}>
          <div style={{ padding: '1rem', backgroundColor: '#059669', color: 'white', borderRadius: '12px' }}>
            <DollarSign size={28} />
          </div>
          <div>
            <h2 style={{ margin: 0, fontSize: '1.5rem', color: '#1e293b' }}>Business Intelligence Financeiro</h2>
            <p style={{ margin: 0, color: '#64748b' }}>Análise detalhada do centro de custo {pepAtivo || '---'}</p>
          </div>
        </div>
      </div>

      {/* FILTRO PRINCIPAL */}
      <div style={{ backgroundColor: 'white', padding: '1.5rem', borderRadius: '12px', boxShadow: '0 1px 3px rgba(0,0,0,0.1)', marginBottom: '2rem' }}>
        <form onSubmit={(e) => { e.preventDefault(); setPepAtivo(pepSelecionado?.value || ''); }} style={{ display: 'flex', gap: '1rem' }}>
          <div style={{ flex: 1 }}>
            <Select options={opcoesPep} value={pepSelecionado} onChange={setPepSelecionado} placeholder="Selecione o Elemento PEP / WBS..." isSearchable styles={{ control: (b) => ({ ...b, borderRadius: '8px', padding: '4px' }) }} />
          </div>
          <button type="submit" style={{ backgroundColor: '#059669', color: 'white', border: 'none', padding: '0 2rem', borderRadius: '8px', fontWeight: '600', cursor: 'pointer' }}>
            Gerar Relatórios
          </button>
        </form>
      </div>

      {stats ? (
        <div className="fade-in">
          
          {/* KPIs */}
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(240px, 1fr))', gap: '1.5rem', marginBottom: '2rem' }}>
            <div style={{ backgroundColor: 'white', padding: '1.5rem', borderRadius: '12px', borderLeft: '4px solid #059669', boxShadow: '0 1px 3px rgba(0,0,0,0.1)' }}>
              <span style={{ color: '#64748b', fontSize: '0.8rem', fontWeight: 'bold' }}>GASTO TOTAL</span>
              <h3 style={{ fontSize: '1.8rem', margin: '0.5rem 0', color: '#059669' }}>{formatarMoeda(stats.total)}</h3>
              <span style={{ color: '#10b981', fontSize: '0.8rem', display: 'flex', alignItems: 'center', gap: '4px' }}><TrendingUp size={14}/> Consolidado</span>
            </div>
            <div style={{ backgroundColor: 'white', padding: '1.5rem', borderRadius: '12px', borderLeft: '4px solid #3b82f6', boxShadow: '0 1px 3px rgba(0,0,0,0.1)' }}>
              <span style={{ color: '#64748b', fontSize: '0.8rem', fontWeight: 'bold' }}>TICKET MÉDIO / ATM</span>
              <h3 style={{ fontSize: '1.8rem', margin: '0.5rem 0', color: '#1e293b' }}>{formatarMoeda(stats.media)}</h3>
              <span style={{ color: '#64748b', fontSize: '0.8rem' }}>Base: {atmsDoPep.length} pedidos</span>
            </div>
          </div>

          {/* GRÁFICOS LINHA 1 */}
          <div style={{ display: 'grid', gridTemplateColumns: '2fr 1fr', gap: '1.5rem', marginBottom: '2rem' }}>
            <div style={{ backgroundColor: 'white', padding: '1.5rem', borderRadius: '12px', boxShadow: '0 1px 3px rgba(0,0,0,0.1)' }}>
              <h4 style={{ marginTop: 0, marginBottom: '1.5rem' }}>Evolução do Gasto (Mensal vs Acumulado)</h4>
              <div style={{ height: '300px' }}>
                <ResponsiveContainer width="100%" height="100%">
                  <AreaChart data={dadosGraficoTempo}>
                    <defs>
                      <linearGradient id="colorGasto" x1="0" y1="0" x2="0" y2="1"><stop offset="5%" stopColor="#059669" stopOpacity={0.1}/><stop offset="95%" stopColor="#059669" stopOpacity={0}/></linearGradient>
                    </defs>
                    <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f1f5f9" />
                    <XAxis dataKey="data" />
                    <YAxis hide />
                    <Tooltip formatter={(v) => formatarMoeda(v)} />
                    <Area type="monotone" dataKey="acumulado" stroke="#059669" fillOpacity={1} fill="url(#colorGasto)" strokeWidth={3} />
                    <Line type="monotone" dataKey="gasto" stroke="#3b82f6" strokeWidth={2} dot={false} />
                  </AreaChart>
                </ResponsiveContainer>
              </div>
            </div>

            <div style={{ backgroundColor: 'white', padding: '1.5rem', borderRadius: '12px', boxShadow: '0 1px 3px rgba(0,0,0,0.1)' }}>
              <h4 style={{ marginTop: 0, marginBottom: '1.5rem' }}>Distribuição por Modal</h4>
              <div style={{ height: '300px' }}>
                <ResponsiveContainer width="100%" height="100%">
                  <PieChart>
                    <Pie data={stats.modalData} innerRadius={60} outerRadius={80} paddingAngle={5} dataKey="value">
                      {stats.modalData.map((entry, index) => <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />)}
                    </Pie>
                    <Tooltip formatter={(v) => formatarMoeda(v)} />
                    <Legend />
                  </PieChart>
                </ResponsiveContainer>
              </div>
            </div>
          </div>

          {/* GRÁFICOS LINHA 2 */}
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1.5rem', marginBottom: '2rem' }}>
            <div style={{ backgroundColor: 'white', padding: '1.5rem', borderRadius: '12px', boxShadow: '0 1px 3px rgba(0,0,0,0.1)' }}>
              <h4 style={{ marginTop: 0, marginBottom: '1.5rem' }}>Top 5 Transportadoras (R$)</h4>
              <div style={{ height: '250px' }}>
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart data={stats.transData} layout="vertical">
                    <CartesianGrid strokeDasharray="3 3" horizontal={true} vertical={false} stroke="#f1f5f9" />
                    <XAxis type="number" hide />
                    <YAxis dataKey="name" type="category" width={100} style={{ fontSize: '12px' }} />
                    <Tooltip formatter={(v) => formatarMoeda(v)} />
                    <Bar dataKey="valor" fill="#3b82f6" radius={[0, 4, 4, 0]} barSize={20} />
                  </BarChart>
                </ResponsiveContainer>
              </div>
            </div>

            <div style={{ backgroundColor: 'white', padding: '1.5rem', borderRadius: '12px', boxShadow: '0 1px 3px rgba(0,0,0,0.1)' }}>
               <h4 style={{ marginTop: 0, marginBottom: '1.5rem' }}>Destaques do Período</h4>
               <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
                  {stats.transData.map((item, i) => (
                    <div key={i} style={{ display: 'flex', justifyContent: 'space-between', paddingBottom: '8px', borderBottom: '1px solid #f1f5f9' }}>
                      <span style={{ fontSize: '0.9rem', color: '#475569' }}>{i+1}. {item.name}</span>
                      <span style={{ fontWeight: '600', color: '#1e293b' }}>{formatarMoeda(item.valor)}</span>
                    </div>
                  ))}
               </div>
            </div>
          </div>

          {/* TABELA DETALHADA */}
          <div style={{ backgroundColor: 'white', padding: '1.5rem', borderRadius: '12px', boxShadow: '0 1px 3px rgba(0,0,0,0.1)' }}>
            <h4 style={{ marginTop: 0 }}>Listagem Consolidada</h4>
            <div style={{ overflowX: 'auto' }}>
              <table style={{ width: '100%', borderCollapse: 'collapse', marginTop: '1rem' }}>
                <thead>
                  <tr style={{ textAlign: 'left', borderBottom: '2px solid #f1f5f9', color: '#64748b', fontSize: '0.85rem' }}>
                    <th style={{ padding: '12px' }}>ID ATM</th>
                    <th style={{ padding: '12px' }}>DATA</th>
                    <th style={{ padding: '12px' }}>TRANSPORTADORA</th>
                    <th style={{ padding: '12px' }}>NF / CTE</th>
                    <th style={{ padding: '12px', textAlign: 'right' }}>VALOR FINAL</th>
                  </tr>
                </thead>
                <tbody>
                  {atmsDoPep.map(atm => (
                    <tr key={atm.id} style={{ borderBottom: '1px solid #f1f5f9', fontSize: '0.9rem' }}>
                      <td style={{ padding: '12px', fontWeight: 'bold' }}>#{atm.id.substring(0,6)}</td>
                      <td style={{ padding: '12px' }}>{new Date(atm.data_solicitacao || atm.created_at).toLocaleDateString()}</td>
                      <td style={{ padding: '12px' }}>{atm.transportadora?.nome || 'Pendente'}</td>
                      <td style={{ padding: '12px' }}>{atm.nf || atm.fatura_cte || '---'}</td>
                      <td style={{ padding: '12px', textAlign: 'right', fontWeight: 'bold', color: '#059669' }}>
                        {formatarMoeda(Number(atm.valor) || Number(atm.valor_nf) || 0)}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>

        </div>
      ) : (
        <div style={{ textAlign: 'center', padding: '5rem', background: '#fff', borderRadius: '12px' }}>
          <DollarSign size={48} style={{ color: '#cbd5e1', marginBottom: '1rem' }} />
          <h3 style={{ color: '#64748b' }}>Aguardando seleção de PEP para análise...</h3>
        </div>
      )}
    </section>
  );
}