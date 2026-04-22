// src/pages/AcompFinan/AcompFinan.jsx
import React, { useState, useEffect, useMemo } from "react";
import Select from "react-select";
import {
  LineChart, Line, BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip,
  ResponsiveContainer, Cell, PieChart, Pie, Legend, ComposedChart // 👈 ComposedChart adicionado aqui
} from "recharts";
import api from "../../services/api";
import "./AcompFinan.css";

// ─── COLORS (Mantidas no JS para os gráficos do Recharts) ───────────────────
const BLUE_MAIN   = "#0057A8";
const BLUE_LIGHT  = "#1A7FD4";
const BLUE_PALE   = "#E8F2FC";
const ACCENT      = "#FF6B35";
const GRAY_DARK   = "#1C2B3A";
const GRAY_MED    = "#4A6070";
const WHITE       = "#FFFFFF";
const SUCCESS     = "#22C55E";
const WARNING     = "#F59E0B";

const TRANSP_COLORS = [BLUE_MAIN, BLUE_LIGHT, "#2DA8E0", "#5BC4F5", ACCENT, "#FF9D6C", "#FFC2A3", "#FFE0D0", SUCCESS, WARNING];

// ─── UTILS ──────────────────────────────────────────────────────────────────
const fmt = (v) => new Intl.NumberFormat("pt-BR", { style: "currency", currency: "BRL", minimumFractionDigits: 0, maximumFractionDigits: 0 }).format(v || 0);
const fmtK = (v) => (v || 0) >= 1000000 ? `R$ ${(v / 1000000).toFixed(2)}M` : (v || 0) >= 1000 ? `R$ ${(v / 1000).toFixed(0)}K` : fmt(v);

const mesesAbrev = ["Jan", "Fev", "Mar", "Abr", "Mai", "Jun", "Jul", "Ago", "Set", "Out", "Nov", "Dez"];

// ─── DADOS MOCKADOS PARA "PREVISTO VS REALIZADO" (Baseado nas suas imagens) ──
const dadosMensaisPR = [
  { mes: 'Jan', previsto: 595, realizado: 550, dif: -45, difPerc: -7.6 },
  { mes: 'Fev', previsto: 260, realizado: 273, dif: 13, difPerc: 5.0 },
  { mes: 'Mar', previsto: 270, realizado: 250, dif: -19, difPerc: -7.1 },
  { mes: 'Abr', previsto: 481, realizado: 414, dif: -66, difPerc: -13.9 },
  { mes: 'Mai', previsto: 210, realizado: 207, dif: -2, difPerc: -1.3 },
  { mes: 'Jun', previsto: 333, realizado: 361, dif: 28, difPerc: 8.5 },
  { mes: 'Jul', previsto: 325, realizado: 326, dif: 1, difPerc: 0.5 },
  { mes: 'Ago', previsto: 280, realizado: 279, dif: -1, difPerc: -0.4 },
  { mes: 'Set', previsto: 271, realizado: 253, dif: -18, difPerc: -6.9 },
  { mes: 'Out', previsto: 407, realizado: 386, dif: -20, difPerc: -5.1 },
  { mes: 'Nov', previsto: 430, realizado: 480, dif: 50, difPerc: 11.7 },
  { mes: 'Dez', previsto: 566, realizado: 480, dif: -86, difPerc: -15.3 },
];

const dadosDivergencias = [
  { motivo: 'Frete emergencial / urgente', ocorrencias: 47, impacto: 313, desvio: 28.5, cor: '#ef4444' },
  { motivo: 'Mudança de modal', ocorrencias: 15, impacto: 199, desvio: 18.1, cor: '#ef4444' },
  { motivo: 'Reentrega por endereço incorreto', ocorrencias: 33, impacto: 185, desvio: 16.9, cor: '#f59e0b' },
  { motivo: 'Taxa de pedágio não prevista', ocorrencias: 28, impacto: 143, desvio: 13.0, cor: '#f59e0b' },
  { motivo: 'Atraso na coleta / diária extra', ocorrencias: 22, impacto: 88, desvio: 8.0, cor: '#3b82f6' },
  { motivo: 'Carga fracionada não consolidada', ocorrencias: 19, impacto: 76, desvio: 7.0, cor: '#3b82f6' },
  { motivo: 'Excesso de peso / cubagem', ocorrencias: 12, impacto: 55, desvio: 5.0, cor: '#3b82f6' },
  { motivo: 'Seguro adicional não orçado', ocorrencias: 8, impacto: 38, desvio: 3.5, cor: '#3b82f6' },
];

// ─── ICONS ──────────────────────────────────────────────────────────────────
const DollarSign = ({ size = 24, color = "currentColor" }) => <svg xmlns="http://www.w3.org/2000/svg" width={size} height={size} viewBox="0 0 24 24" fill="none" stroke={color} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><line x1="12" y1="1" x2="12" y2="23"></line><path d="M17 5H9.5a3.5 3.5 0 0 0 0 7h5a3.5 3.5 0 0 1 0 7H6"></path></svg>;
const Loader = () => <svg xmlns="http://www.w3.org/2000/svg" width="48" height="48" viewBox="0 0 24 24" fill="none" stroke="#0057A8" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="lucide lucide-loader-2" style={{animation: 'spin 1s linear infinite'}}><path d="M21 12a9 9 0 1 1-6.219-8.56"/></svg>;

// ─── COMPONENTES AUXILIARES ─────────────────────────────────────────────────
const CustomTooltip = ({ active, payload, label }) => {
  if (!active || !payload?.length) return null;
  return (
    <div className="acomp-tooltip">
      <p className="acomp-tooltip-label">{label}</p>
      {payload.map((p, i) => (
        <p key={i} style={{ color: p.color }} className="acomp-tooltip-item">
          {p.name}: <b>{typeof p.value === "number" && p.value > 1000 ? fmtK(p.value) : p.value}</b>
        </p>
      ))}
    </div>
  );
};

const KpiCard = ({ icon, label, value, sub, color, highlight }) => (
  <div className={`acomp-kpi-card ${highlight ? 'highlight' : ''}`}>
    <div className="acomp-kpi-header">
      <span className="acomp-kpi-icon">{icon}</span>
      <span className="acomp-kpi-label">{label}</span>
    </div>
    <div className="acomp-kpi-value" style={{ color: highlight ? WHITE : (color || BLUE_MAIN) }}>{value}</div>
    {sub && <div className="acomp-kpi-sub">{sub}</div>}
  </div>
);

const SectionHeader = ({ title, subtitle }) => (
  <div className="acomp-section-header">
    <h2>{title}</h2>
    {subtitle && <p>{subtitle}</p>}
  </div>
);

// ─── MAIN COMPONENT ─────────────────────────────────────────────────────────
export default function AcompFinan() {
  const [atms, setAtms] = useState([]);
  const [carregando, setCarregando] = useState(true);
  const [pepSelecionado, setPepSelecionado] = useState(null);
  const [pepAtivo, setPepAtivo] = useState('');
  const [activeTab, setActiveTab] = useState("overview");

  useEffect(() => {
    const carregarDados = async () => {
      try {
        setCarregando(true);
        const resposta = await api.get('/admin/transportes');
        console.log("Dados que chegaram na tela:", resposta.data);
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
      if (atm.wbs && atm.wbs !== '-') {
        pepsUnicos.add(atm.wbs.toUpperCase().trim());
      }
      if (atm.faturamento?.elemento_pep_cc_wbs && atm.faturamento.elemento_pep_cc_wbs !== '-') {
        pepsUnicos.add(atm.faturamento.elemento_pep_cc_wbs.toUpperCase().trim());
      }
    });
    return Array.from(pepsUnicos)
      .filter(pep => pep.length > 0)
      .sort()
      .map(pep => ({ value: pep, label: pep }));
  }, [atms]);

  const atmsDoPep = useMemo(() => {
    if (!pepAtivo) return [];
    return atms.filter(atm => {
      const pepLogistica = (atm.wbs || '').toUpperCase();
      const pepFinanceiro = (atm.faturamento?.elemento_pep_cc_wbs || '').toUpperCase(); 
      return pepLogistica.includes(pepAtivo) || pepFinanceiro.includes(pepAtivo);
    });
  }, [atms, pepAtivo]);

  // ==========================================
  // AGREGAÇÕES DINÂMICAS PARA OS GRÁFICOS
  // ==========================================
  const { totalGasto, totalFretes, mediaCusto, monthlyData, transportadorasData, rotasData } = useMemo(() => {
    if (atmsDoPep.length === 0) return { totalGasto: 0, totalFretes: 0, mediaCusto: 0, monthlyData: [], transportadorasData: [], rotasData: [] };

    let tGasto = 0;
    const mesesMap = {};
    mesesAbrev.forEach((m, i) => mesesMap[i + 1] = { mes: m, num: i + 1, total: 0, count: 0, media: 0 });
    const transMap = {};
    const rotasMap = {};

    atmsDoPep.forEach(atm => {
      const valor = Number(atm.valor) || Number(atm.valor_nf) || 0;
      tGasto += valor;

      const dataStr = atm.data_solicitacao || atm.created_at;
      if (dataStr) {
        const mesIndex = parseInt(dataStr.split('-')[1], 10);
        if (mesesMap[mesIndex]) {
          mesesMap[mesIndex].total += valor;
          mesesMap[mesIndex].count += 1;
        }
      }

      const tNome = atm.transportadora?.nome || 'A Definir';
      if (!transMap[tNome]) transMap[tNome] = { nome: tNome, total: 0, count: 0, media: 0 };
      transMap[tNome].total += valor;
      transMap[tNome].count += 1;

      const origem = atm.origem?.municipio || 'N/A';
      const destino = atm.destino?.municipio || 'N/A';
      const rNome = `${origem} → ${destino}`;
      if (!rotasMap[rNome]) rotasMap[rNome] = { rota: rNome, count: 0, total: 0 };
      rotasMap[rNome].total += valor;
      rotasMap[rNome].count += 1;
    });

    const mData = Object.values(mesesMap)
      .map(m => ({ ...m, media: m.count > 0 ? m.total / m.count : 0 }))
      .filter(m => m.count > 0); 

    const tData = Object.values(transMap)
      .map(t => ({ ...t, media: t.total / t.count }))
      .sort((a, b) => b.total - a.total);

    const rData = Object.values(rotasMap)
      .sort((a, b) => b.count - a.count);

    return {
      totalGasto: tGasto,
      totalFretes: atmsDoPep.length,
      mediaCusto: atmsDoPep.length > 0 ? tGasto / atmsDoPep.length : 0,
      monthlyData: mData,
      transportadorasData: tData,
      rotasData: rData
    };
  }, [atmsDoPep]);

  const picoMes = monthlyData.length > 0 ? monthlyData.reduce((a, b) => b.total > a.total ? b : a) : { mes: '-', total: 0 };
  const minMes = monthlyData.length > 0 ? monthlyData.reduce((a, b) => b.total < a.total ? b : a) : { mes: '-', total: 0 };

  const tabs = [
    { id: "overview",  label: "📊 Visão Geral" },
    { id: "previsto",  label: "🎯 Previsto vs Realizado" }, // 👈 ABA ADICIONADA
    { id: "temporal",  label: "📈 Evolução Temporal" },
    { id: "rotas",     label: "🗺️ Rotas" },
    { id: "carriers",  label: "🚛 Transportadoras" },
    { id: "dados",     label: "📑 Registros Brutos" },
  ];

  return (
    <div className="acomp-wrapper">
      {/* ── HEADER ── */}
      <div className="acomp-header">
        <div className="acomp-header-left">
          <div className="acomp-logo-box">
            <DollarSign size={24} color={BLUE_MAIN} />
          </div>
          <div>
            <div className="acomp-title">Business Intelligence Financeiro</div>
            <div className="acomp-subtitle">
              Análise detalhada do centro de custo {pepAtivo ? `(${pepAtivo})` : 'Geral'}
            </div>
          </div>
        </div>
        
        <div className="acomp-filter-group">
          <div style={{ flex: 1 }}>
            <Select 
              options={opcoesPep} 
              value={pepSelecionado} 
              onChange={setPepSelecionado} 
              placeholder="Selecione o PEP/WBS..." 
              isSearchable 
              styles={{ 
                control: (b) => ({ ...b, borderRadius: '8px', minHeight: '38px', border: 'none' }),
                menu: (b) => ({ ...b, zIndex: 9999 })
              }} 
            />
          </div>
          <button 
            className="acomp-btn-filter"
            onClick={() => setPepAtivo(pepSelecionado?.value || '')}
          >
            Filtrar
          </button>
        </div>
      </div>

      {carregando ? (
        <div className="acomp-loader-container">
          <Loader />
          <p>Processando dados mestres...</p>
        </div>
      ) : !pepAtivo ? (
        <div className="acomp-empty-state">
          <DollarSign size={48} color={BLUE_PALE} />
          <h3>Selecione um Centro de Custo no topo para gerar o relatório executivo.</h3>
        </div>
      ) : (
        <>
          {/* ── TABS ── */}
          <div className="acomp-tabs">
            {tabs.map(t => (
              <button 
                key={t.id} 
                onClick={() => setActiveTab(t.id)}
                className={`acomp-tab-btn ${activeTab === t.id ? 'active' : ''}`}
              >
                {t.label}
              </button>
            ))}
          </div>

          <div className="acomp-content fade-in">

            {/* ══════════════ OVERVIEW ══════════════ */}
            {activeTab === "overview" && (
              <>
                <div className="acomp-kpi-grid">
                  <KpiCard highlight icon="💰" label="Total Gasto no PEP" value={fmtK(totalGasto)} sub={`WBS: ${pepAtivo}`} />
                  <KpiCard icon="📦" label="Volume de Entregas" value={totalFretes.toLocaleString("pt-BR")} sub="Fretes alocados" color={BLUE_LIGHT} />
                  <KpiCard icon="📊" label="Custo Médio / Frete" value={fmt(mediaCusto)} sub="Valor médio unitário" color={BLUE_MAIN} />
                  <KpiCard icon="🔥" label="Pico de Gastos" value={picoMes.mes} sub={fmtK(picoMes.total)} color={ACCENT} />
                  <KpiCard icon="✅" label="Menor Gasto" value={minMes.mes} sub={fmtK(minMes.total)} color={SUCCESS} />
                </div>

                <div className="acomp-chart-row-2">
                  <div className="acomp-card">
                    <SectionHeader title="Gastos Mensais no PEP" subtitle="Evolução do custo total de fretes" />
                    <ResponsiveContainer width="100%" height={220}>
                      <LineChart data={monthlyData}>
                        <CartesianGrid strokeDasharray="3 3" stroke={BLUE_PALE} />
                        <XAxis dataKey="mes" tick={{ fontSize: 11, fill: GRAY_MED }} />
                        <YAxis tickFormatter={v => `R$${(v/1000).toFixed(0)}K`} tick={{ fontSize: 10, fill: GRAY_MED }} />
                        <Tooltip content={<CustomTooltip />} />
                        <Line type="monotone" dataKey="total" name="Total" stroke={BLUE_MAIN} strokeWidth={3} dot={{ r: 4, fill: BLUE_MAIN }} activeDot={{ r: 6 }} />
                      </LineChart>
                    </ResponsiveContainer>
                  </div>

                  <div className="acomp-card">
                    <SectionHeader title="Participação por Transportadora" subtitle="Share financeiro neste Centro de Custo" />
                    <ResponsiveContainer width="100%" height={220}>
                      <PieChart>
                        <Pie data={transportadorasData} dataKey="total" nameKey="nome" cx="45%" cy="50%" outerRadius={90} innerRadius={45}>
                          {transportadorasData.map((_, i) => <Cell key={i} fill={TRANSP_COLORS[i % TRANSP_COLORS.length]} />)}
                        </Pie>
                        <Tooltip formatter={(v) => fmtK(v)} />
                        <Legend iconType="circle" iconSize={8} wrapperStyle={{ fontSize: 11 }} />
                      </PieChart>
                    </ResponsiveContainer>
                  </div>
                </div>
              </>
            )}

            {/* ══════════════ PREVISTO VS REALIZADO (NOVA ABA) ══════════════ */}
            {activeTab === "previsto" && (
              <div className="acomp-flex-col">
                
                {/* Cards Superiores */}
                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: '20px' }}>
                  <div className="acomp-card" style={{ padding: '20px' }}>
                    <p style={{ color: GRAY_MED, fontSize: '12px', fontWeight: 'bold' }}>📋 TOTAL PREVISTO</p>
                    <h2 style={{ color: BLUE_MAIN, fontSize: '28px', margin: '5px 0' }}>R$ 4.43M</h2>
                    <p style={{ color: GRAY_MED, fontSize: '12px' }}>Orçamento 2025</p>
                  </div>
                  <div className="acomp-card" style={{ padding: '20px' }}>
                    <p style={{ color: GRAY_MED, fontSize: '12px', fontWeight: 'bold' }}>💰 TOTAL REALIZADO</p>
                    <h2 style={{ color: BLUE_MAIN, fontSize: '28px', margin: '5px 0' }}>R$ 4.26M</h2>
                    <p style={{ color: GRAY_MED, fontSize: '12px' }}>Gasto efetivo 2025</p>
                  </div>
                  <div className="acomp-card" style={{ padding: '20px' }}>
                    <p style={{ color: GRAY_MED, fontSize: '12px', fontWeight: 'bold' }}>✅ DIFERENÇA TOTAL</p>
                    <h2 style={{ color: SUCCESS, fontSize: '28px', margin: '5px 0' }}>R$ 168K</h2>
                    <p style={{ color: GRAY_MED, fontSize: '12px' }}>Abaixo do previsto (-3.8%)</p>
                  </div>
                  <div className="acomp-card" style={{ padding: '20px' }}>
                    <p style={{ color: GRAY_MED, fontSize: '12px', fontWeight: 'bold' }}>📊 MESES ACIMA DO PREVISTO</p>
                    <h2 style={{ color: WARNING, fontSize: '28px', margin: '5px 0' }}>4</h2>
                    <p style={{ color: GRAY_MED, fontSize: '12px' }}>de 12 meses</p>
                  </div>
                </div>

                {/* Gráfico Comparativo Mensal */}
                <div className="acomp-card">
                  <SectionHeader title="Comparativo Mensal — Previsto vs Realizado" subtitle="Evolução do orçamento versus gasto efetivo ao longo do ano" />
                  <div style={{ width: '100%', height: 350 }}>
                    <ResponsiveContainer>
                      <ComposedChart data={dadosMensaisPR} margin={{ top: 20, right: 20, bottom: 20, left: 20 }}>
                        <CartesianGrid strokeDasharray="3 3" vertical={false} stroke={BLUE_PALE} />
                        <XAxis dataKey="mes" axisLine={false} tickLine={false} tick={{ fontSize: 12, fill: GRAY_MED }} />
                        <YAxis axisLine={false} tickLine={false} tickFormatter={(val) => `R$${val}K`} tick={{ fontSize: 11, fill: GRAY_MED }} />
                        <Tooltip formatter={(value) => `R$ ${value}K`} />
                        <Legend verticalAlign="bottom" height={36}/>
                        <Bar dataKey="previsto" name="Previsto" barSize={30} fill="#e0f2fe" stroke="#38bdf8" radius={[4, 4, 0, 0]} />
                        <Line type="monotone" dataKey="realizado" name="Realizado" stroke={ACCENT} strokeWidth={3} dot={{ r: 5, fill: ACCENT }} />
                      </ComposedChart>
                    </ResponsiveContainer>
                  </div>
                </div>

                {/* Tabela de Detalhamento Mensal */}
                <div className="acomp-card">
                  <SectionHeader title="Detalhamento Mensal" subtitle="Diferença entre valor previsto e realizado por mês" />
                  <table className="acomp-table">
                    <thead>
                      <tr>
                        <th className="left">Mês</th>
                        <th className="left">Previsto</th>
                        <th className="left">Realizado</th>
                        <th className="left">Diferença (R$)</th>
                        <th className="left">Diferença (%)</th>
                        <th className="center">Status</th>
                      </tr>
                    </thead>
                    <tbody>
                      {dadosMensaisPR.map((row, idx) => (
                        <tr key={idx} className={idx % 2 === 0 ? "row-even" : "row-odd"}>
                          <td className="fw-700">{row.mes}</td>
                          <td>R$ {row.previsto}K</td>
                          <td>R$ {row.realizado}K</td>
                          <td className="fw-700" style={{ color: row.dif > 0 ? '#ef4444' : '#16a34a' }}>
                            {row.dif > 0 ? '+' : ''}R$ {Math.abs(row.dif)}K
                          </td>
                          <td style={{ color: row.difPerc > 0 ? '#ef4444' : '#16a34a' }}>
                            {row.difPerc > 0 ? '+' : ''}{row.difPerc}%
                          </td>
                          <td className="center">
                            <span style={{ 
                              padding: '4px 10px', borderRadius: '20px', fontSize: '12px', fontWeight: 'bold',
                              background: row.dif > 0 ? '#fee2e2' : '#dcfce7',
                              color: row.dif > 0 ? '#b91c1c' : '#15803d'
                            }}>
                              {row.dif > 0 ? 'Acima' : 'Dentro'}
                            </span>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>

                {/* Gráfico Horizontal de Impacto */}
                <div className="acomp-card">
                  <SectionHeader title="Impacto por Motivo de Divergência" subtitle="Distribuição do impacto financeiro por causa identificada" />
                  <div style={{ width: '100%', height: 350 }}>
                    <ResponsiveContainer>
                      <BarChart layout="vertical" data={dadosDivergencias} margin={{ top: 20, right: 30, left: 180, bottom: 5 }}>
                        <CartesianGrid strokeDasharray="3 3" horizontal={false} stroke={BLUE_PALE} />
                        <XAxis type="number" tickFormatter={(val) => `R$${val}K`} tick={{ fontSize: 11, fill: GRAY_MED }} />
                        <YAxis dataKey="motivo" type="category" width={200} tick={{ fontSize: 11, fill: GRAY_DARK }} />
                        <Tooltip formatter={(value) => `R$ ${value}K`} />
                        <Bar dataKey="impacto" radius={[0, 4, 4, 0]}>
                          {dadosDivergencias.map((entry, index) => (
                            <Cell key={`cell-${index}`} fill={entry.cor} />
                          ))}
                        </Bar>
                      </BarChart>
                    </ResponsiveContainer>
                  </div>
                </div>

              </div>
            )}

            {/* ══════════════ TEMPORAL ══════════════ */}
            {activeTab === "temporal" && (
              <div className="acomp-flex-col">
                <div className="acomp-card">
                  <SectionHeader title="Evolução do Custo Total Mensal" subtitle={`Comportamento do PEP ${pepAtivo} ao longo do ano`} />
                  <ResponsiveContainer width="100%" height={300}>
                    <LineChart data={monthlyData}>
                      <CartesianGrid strokeDasharray="3 3" stroke={BLUE_PALE} />
                      <XAxis dataKey="mes" tick={{ fontSize: 12, fill: GRAY_MED }} />
                      <YAxis tickFormatter={v => `R$${(v/1000).toFixed(0)}K`} tick={{ fontSize: 11, fill: GRAY_MED }} />
                      <Tooltip content={<CustomTooltip />} />
                      <Line type="monotone" dataKey="total" name="Total Gasto" stroke={BLUE_MAIN} strokeWidth={3} dot={{ r: 5, fill: BLUE_MAIN }} activeDot={{ r: 7 }} />
                    </LineChart>
                  </ResponsiveContainer>
                </div>

                <div className="acomp-chart-row-2">
                  <div className="acomp-card">
                    <SectionHeader title="Volume de Fretes por Mês" subtitle="Número total de alocações" />
                    <ResponsiveContainer width="100%" height={220}>
                      <BarChart data={monthlyData}>
                        <CartesianGrid strokeDasharray="3 3" stroke={BLUE_PALE} />
                        <XAxis dataKey="mes" tick={{ fontSize: 11, fill: GRAY_MED }} />
                        <YAxis tick={{ fontSize: 10, fill: GRAY_MED }} />
                        <Tooltip content={<CustomTooltip />} />
                        <Bar dataKey="count" name="Fretes" radius={[6, 6, 0, 0]}>
                          {monthlyData.map((m, i) => <Cell key={i} fill={m.total === picoMes.total ? ACCENT : BLUE_LIGHT} />)}
                        </Bar>
                      </BarChart>
                    </ResponsiveContainer>
                  </div>

                  <div className="acomp-card">
                    <SectionHeader title="Custo Médio por Frete — Mensal" subtitle="Ticket médio da operação" />
                    <ResponsiveContainer width="100%" height={220}>
                      <LineChart data={monthlyData}>
                        <CartesianGrid strokeDasharray="3 3" stroke={BLUE_PALE} />
                        <XAxis dataKey="mes" tick={{ fontSize: 11, fill: GRAY_MED }} />
                        <YAxis tickFormatter={v => `R$${v.toFixed(0)}`} tick={{ fontSize: 10, fill: GRAY_MED }} />
                        <Tooltip content={<CustomTooltip />} />
                        <Line type="monotone" dataKey="media" name="Custo Médio" stroke={ACCENT} strokeWidth={3} dot={{ r: 4, fill: ACCENT }} />
                      </LineChart>
                    </ResponsiveContainer>
                  </div>
                </div>
              </div>
            )}

            {/* ══════════════ ROTAS ══════════════ */}
            {activeTab === "rotas" && (
              <div className="acomp-flex-col">
                <div className="acomp-chart-row-2">
                  <div className="acomp-card">
                    <SectionHeader title="Rotas por Frequência" subtitle="Origem → Destino" />
                    <ResponsiveContainer width="100%" height={320}>
                      <BarChart data={rotasData.slice(0, 7)} layout="vertical">
                        <CartesianGrid strokeDasharray="3 3" stroke={BLUE_PALE} horizontal={false} />
                        <XAxis type="number" tick={{ fontSize: 10, fill: GRAY_MED }} />
                        <YAxis type="category" dataKey="rota" width={160} tick={{ fontSize: 10, fill: GRAY_MED }} />
                        <Tooltip content={<CustomTooltip />} />
                        <Bar dataKey="count" name="Fretes" radius={[0, 6, 6, 0]} fill={BLUE_MAIN} />
                      </BarChart>
                    </ResponsiveContainer>
                  </div>

                  <div className="acomp-card">
                    <SectionHeader title="Rotas por Custo Total" subtitle="Acumulado financeiro" />
                    <ResponsiveContainer width="100%" height={320}>
                      <BarChart data={[...rotasData].sort((a,b) => b.total - a.total).slice(0, 7)} layout="vertical">
                        <CartesianGrid strokeDasharray="3 3" stroke={BLUE_PALE} horizontal={false} />
                        <XAxis type="number" tickFormatter={v => `R$${(v/1000).toFixed(0)}K`} tick={{ fontSize: 10, fill: GRAY_MED }} />
                        <YAxis type="category" dataKey="rota" width={160} tick={{ fontSize: 10, fill: GRAY_MED }} />
                        <Tooltip content={<CustomTooltip />} formatter={v => fmtK(v)} />
                        <Bar dataKey="total" name="Custo Total" radius={[0, 6, 6, 0]} fill={ACCENT} />
                      </BarChart>
                    </ResponsiveContainer>
                  </div>
                </div>

                <div className="acomp-card">
                  <SectionHeader title="Detalhamento de Rotas" subtitle="Todas as rotas utilizadas neste PEP" />
                  <table className="acomp-table">
                    <thead>
                      <tr>
                        {["#", "Rota", "Fretes", "Custo Total", "Custo Médio"].map((h, i) => (
                          <th key={h} className={i === 0 ? "center" : "left"}>{h}</th>
                        ))}
                      </tr>
                    </thead>
                    <tbody>
                      {rotasData.map((r, i) => (
                        <tr key={i} className={i % 2 === 0 ? "row-even" : "row-odd"}>
                          <td className="center t-gray-med fw-600">{i + 1}</td>
                          <td className="fw-500">{r.rota}</td>
                          <td><span className="acomp-badge">{r.count}</span></td>
                          <td className="fw-600 t-gray-dark">{fmtK(r.total)}</td>
                          <td className="t-gray-med">{fmt(r.total / r.count)}</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>
            )}

            {/* ══════════════ TRANSPORTADORAS ══════════════ */}
            {activeTab === "carriers" && (
              <div className="acomp-flex-col">
                <div className="acomp-chart-row-2">
                  <div className="acomp-card">
                    <SectionHeader title="Custo por Transportadora" subtitle="Participação no gasto deste PEP" />
                    <ResponsiveContainer width="100%" height={280}>
                      <BarChart data={transportadorasData.slice(0,6)} layout="vertical">
                        <CartesianGrid strokeDasharray="3 3" stroke={BLUE_PALE} horizontal={false} />
                        <XAxis type="number" tickFormatter={v => `R$${(v/1000).toFixed(0)}K`} tick={{ fontSize: 10, fill: GRAY_MED }} />
                        <YAxis type="category" dataKey="nome" width={100} tick={{ fontSize: 11, fill: GRAY_MED }} />
                        <Tooltip content={<CustomTooltip />} formatter={v => fmtK(v)} />
                        <Bar dataKey="total" name="Custo Total" radius={[0, 6, 6, 0]}>
                          {transportadorasData.map((_, i) => <Cell key={i} fill={TRANSP_COLORS[i % TRANSP_COLORS.length]} />)}
                        </Bar>
                      </BarChart>
                    </ResponsiveContainer>
                  </div>

                  <div className="acomp-card">
                    <SectionHeader title="Custo Médio por Frete (Transportadora)" subtitle="Comparativo de ticket médio" />
                    <ResponsiveContainer width="100%" height={280}>
                      <BarChart data={[...transportadorasData].sort((a, b) => a.media - b.media).slice(0,6)} layout="vertical">
                        <CartesianGrid strokeDasharray="3 3" stroke={BLUE_PALE} horizontal={false} />
                        <XAxis type="number" tickFormatter={v => `R$${v.toFixed(0)}`} tick={{ fontSize: 10, fill: GRAY_MED }} />
                        <YAxis type="category" dataKey="nome" width={100} tick={{ fontSize: 11, fill: GRAY_MED }} />
                        <Tooltip content={<CustomTooltip />} formatter={v => fmt(v)} />
                        <Bar dataKey="media" name="Custo Médio" radius={[0, 6, 6, 0]}>
                          {[...transportadorasData].sort((a, b) => a.media - b.media).slice(0,6).map((_, i) => <Cell key={i} fill={i < 2 ? SUCCESS : i > 4 ? ACCENT : BLUE_LIGHT} />)}
                        </Bar>
                      </BarChart>
                    </ResponsiveContainer>
                  </div>
                </div>

                <div className="acomp-card">
                  <SectionHeader title="Ranking de Transportadoras" subtitle="Desempenho no PEP selecionado" />
                  <table className="acomp-table">
                    <thead>
                      <tr>
                        {["#", "Transportadora", "Fretes", "Custo Total", "Custo Médio", "Share (%)"].map(h => (
                          <th key={h} className="left">{h}</th>
                        ))}
                      </tr>
                    </thead>
                    <tbody>
                      {transportadorasData.map((t, i) => {
                        const share = (t.total / totalGasto * 100).toFixed(1);
                        return (
                          <tr key={i} className={i % 2 === 0 ? "row-even" : "row-odd"}>
                            <td className="t-gray-med fw-700">{i + 1}</td>
                            <td className="fw-700">
                              <span className="acomp-color-dot" style={{ background: TRANSP_COLORS[i % TRANSP_COLORS.length] }} />
                              {t.nome}
                            </td>
                            <td>{t.count.toLocaleString("pt-BR")}</td>
                            <td className="fw-600">{fmtK(t.total)}</td>
                            <td style={{ color: t.media < 1000 ? SUCCESS : t.media > 4000 ? ACCENT : GRAY_DARK }}>{fmt(t.media)}</td>
                            <td>
                              <div className="acomp-progress-wrapper">
                                <div className="acomp-progress-track">
                                  {/* Esse width continua inline por ser dinâmico */}
                                  <div className="acomp-progress-fill" style={{ width: `${share}%`, background: TRANSP_COLORS[i % TRANSP_COLORS.length] }} />
                                </div>
                                <span className="acomp-progress-text">{share}%</span>
                              </div>
                            </td>
                          </tr>
                        );
                      })}
                    </tbody>
                  </table>
                </div>
              </div>
            )}

            {/* ══════════════ DADOS BRUTOS ══════════════ */}
            {activeTab === "dados" && (
              <div className="acomp-card">
                <SectionHeader title="Registros Brutos" subtitle="Todas as notas/fretes computados neste Centro de Custo" />
                <div className="acomp-table-overflow">
                  <table className="acomp-table no-bg">
                    <thead>
                      <tr className="t-gray-dark fs-small">
                        <th className="left">ID ATM</th>
                        <th className="left">DATA</th>
                        <th className="left">TRANSPORTADORA</th>
                        <th className="left">NF / CTE</th>
                        <th className="right">VALOR</th>
                      </tr>
                    </thead>
                    <tbody>
                      {atmsDoPep.map(atm => (
                        <tr key={atm.id} className="row-divider fs-body">
                          <td className="fw-bold">#{atm.numero_atm || atm.id.substring(0,8).toUpperCase()}</td>
                          <td>{new Date(atm.data_solicitacao || atm.created_at).toLocaleDateString()}</td>
                          <td>{atm.transportadora?.nome || 'Pendente'}</td>
                          <td>{atm.nf || atm.fatura_cte || '---'}</td>
                          <td className="right fw-bold t-blue-main">
                            {fmt(Number(atm.valor) || Number(atm.valor_nf) || 0)}
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>
            )}

          </div>
        </>
      )}
    </div>
  );
}