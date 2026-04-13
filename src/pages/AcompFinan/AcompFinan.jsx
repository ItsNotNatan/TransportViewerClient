// src/pages/AcompFinan/AcompFinan.jsx
import React, { useState, useEffect, useMemo } from "react";
import Select from "react-select";
import {
  LineChart, Line, BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip,
  ResponsiveContainer, Cell, PieChart, Pie, Legend
} from "recharts";
import api from "../../services/api";

// ─── COLORS ─────────────────────────────────────────────────────────────────
const BLUE_MAIN   = "#0057A8";
const BLUE_LIGHT  = "#1A7FD4";
const BLUE_PALE   = "#E8F2FC";
const ACCENT      = "#FF6B35";
const GRAY_DARK   = "#1C2B3A";
const GRAY_MED    = "#4A6070";
const GRAY_LIGHT  = "#F0F4F8";
const WHITE       = "#FFFFFF";
const SUCCESS     = "#22C55E";
const WARNING     = "#F59E0B";

const TRANSP_COLORS = [BLUE_MAIN, BLUE_LIGHT, "#2DA8E0", "#5BC4F5", ACCENT, "#FF9D6C", "#FFC2A3", "#FFE0D0", SUCCESS, WARNING];

// ─── UTILS ──────────────────────────────────────────────────────────────────
const fmt = (v) => new Intl.NumberFormat("pt-BR", { style: "currency", currency: "BRL", minimumFractionDigits: 0, maximumFractionDigits: 0 }).format(v || 0);
const fmtK = (v) => (v || 0) >= 1000000 ? `R$ ${(v / 1000000).toFixed(2)}M` : (v || 0) >= 1000 ? `R$ ${(v / 1000).toFixed(0)}K` : fmt(v);

const mesesAbrev = ["Jan", "Fev", "Mar", "Abr", "Mai", "Jun", "Jul", "Ago", "Set", "Out", "Nov", "Dez"];

// ─── ICONS ──────────────────────────────────────────────────────────────────
const DollarSign = ({ size = 24 }) => <svg xmlns="http://www.w3.org/2000/svg" width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><line x1="12" y1="1" x2="12" y2="23"></line><path d="M17 5H9.5a3.5 3.5 0 0 0 0 7h5a3.5 3.5 0 0 1 0 7H6"></path></svg>;
const Loader = () => <svg xmlns="http://www.w3.org/2000/svg" width="48" height="48" viewBox="0 0 24 24" fill="none" stroke="#0057A8" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="lucide lucide-loader-2" style={{animation: 'spin 1s linear infinite'}}><path d="M21 12a9 9 0 1 1-6.219-8.56"/></svg>;

// ─── COMPONENTES AUXILIARES ─────────────────────────────────────────────────
const CustomTooltip = ({ active, payload, label }) => {
  if (!active || !payload?.length) return null;
  return (
    <div style={{ background: WHITE, border: `1px solid ${BLUE_LIGHT}`, borderRadius: 10, padding: "10px 14px", boxShadow: "0 4px 20px rgba(0,87,168,0.15)", fontSize: 13 }}>
      <p style={{ fontWeight: 700, color: GRAY_DARK, marginBottom: 4 }}>{label}</p>
      {payload.map((p, i) => (
        <p key={i} style={{ color: p.color, margin: "2px 0" }}>
          {p.name}: <b>{typeof p.value === "number" && p.value > 1000 ? fmtK(p.value) : p.value}</b>
        </p>
      ))}
    </div>
  );
};

const KpiCard = ({ icon, label, value, sub, color, highlight }) => (
  <div style={{
    background: highlight ? `linear-gradient(135deg, ${BLUE_MAIN} 0%, ${BLUE_LIGHT} 100%)` : WHITE,
    borderRadius: 16, padding: "22px 24px",
    boxShadow: highlight ? "0 8px 32px rgba(0,87,168,0.28)" : "0 2px 12px rgba(28,43,58,0.08)",
    border: highlight ? "none" : `1px solid ${BLUE_PALE}`,
    flex: 1, minWidth: 180,
  }}>
    <div style={{ display: "flex", alignItems: "center", gap: 10, marginBottom: 8 }}>
      <span style={{ fontSize: 22 }}>{icon}</span>
      <span style={{ fontSize: 12, fontWeight: 600, letterSpacing: "0.06em", textTransform: "uppercase", color: highlight ? "rgba(255,255,255,0.75)" : GRAY_MED }}>{label}</span>
    </div>
    <div style={{ fontSize: 28, fontWeight: 800, color: highlight ? WHITE : (color || BLUE_MAIN), lineHeight: 1.1 }}>{value}</div>
    {sub && <div style={{ fontSize: 12, color: highlight ? "rgba(255,255,255,0.65)" : GRAY_MED, marginTop: 4 }}>{sub}</div>}
  </div>
);

const SectionHeader = ({ title, subtitle }) => (
  <div style={{ marginBottom: 18 }}>
    <h2 style={{ fontSize: 16, fontWeight: 800, color: GRAY_DARK, margin: 0, letterSpacing: "-0.01em" }}>{title}</h2>
    {subtitle && <p style={{ fontSize: 12, color: GRAY_MED, margin: "3px 0 0" }}>{subtitle}</p>}
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
  // AGREGAÇÕES DINÂMICAS PARA OS GRÁFICOS
  // ==========================================
  const { totalGasto, totalFretes, mediaCusto, monthlyData, transportadorasData, rotasData } = useMemo(() => {
    if (atmsDoPep.length === 0) return { totalGasto: 0, totalFretes: 0, mediaCusto: 0, monthlyData: [], transportadorasData: [], rotasData: [] };

    let tGasto = 0;
    
    // 1. Mensal
    const mesesMap = {};
    mesesAbrev.forEach((m, i) => mesesMap[i + 1] = { mes: m, num: i + 1, total: 0, count: 0, media: 0 });

    // 2. Transportadoras
    const transMap = {};

    // 3. Rotas
    const rotasMap = {};

    atmsDoPep.forEach(atm => {
      const valor = Number(atm.valor) || Number(atm.valor_nf) || 0;
      tGasto += valor;

      // Mensal Aggregation
      const dataStr = atm.data_solicitacao || atm.created_at;
      if (dataStr) {
        const mesIndex = parseInt(dataStr.split('-')[1], 10);
        if (mesesMap[mesIndex]) {
          mesesMap[mesIndex].total += valor;
          mesesMap[mesIndex].count += 1;
        }
      }

      // Trans Aggregation
      const tNome = atm.transportadora?.nome || 'A Definir';
      if (!transMap[tNome]) transMap[tNome] = { nome: tNome, total: 0, count: 0, media: 0 };
      transMap[tNome].total += valor;
      transMap[tNome].count += 1;

      // Rota Aggregation
      const origem = atm.origem?.municipio || 'N/A';
      const destino = atm.destino?.municipio || 'N/A';
      const rNome = `${origem} → ${destino}`;
      if (!rotasMap[rNome]) rotasMap[rNome] = { rota: rNome, count: 0, total: 0 };
      rotasMap[rNome].total += valor;
      rotasMap[rNome].count += 1;
    });

    // Formatting outputs
    const mData = Object.values(mesesMap)
      .map(m => ({ ...m, media: m.count > 0 ? m.total / m.count : 0 }))
      .filter(m => m.count > 0); // Ocultar meses vazios

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

  // Cálculos de Picos (para os KPIs)
  const picoMes = monthlyData.length > 0 ? monthlyData.reduce((a, b) => b.total > a.total ? b : a) : { mes: '-', total: 0 };
  const minMes = monthlyData.length > 0 ? monthlyData.reduce((a, b) => b.total < a.total ? b : a) : { mes: '-', total: 0 };

  const tabs = [
    { id: "overview",  label: "📊 Visão Geral" },
    { id: "temporal",  label: "📈 Evolução Temporal" },
    { id: "rotas",     label: "🗺️ Rotas" },
    { id: "carriers",  label: "🚛 Transportadoras" },
    { id: "dados",     label: "📑 Registros Brutos" },
  ];

  return (
    <div style={{ fontFamily: "'Segoe UI', system-ui, sans-serif", background: GRAY_LIGHT, minHeight: "100vh", color: GRAY_DARK }}>

      {/* ── HEADER ── */}
      <div style={{ background: `linear-gradient(135deg, ${GRAY_DARK} 0%, #2A3E52 100%)`, padding: "20px 32px", display: "flex", alignItems: "center", justifyContent: "space-between", boxShadow: "0 4px 20px rgba(0,0,0,0.2)" }}>
        <div style={{ display: "flex", alignItems: "center", gap: 16 }}>
          <div style={{ background: WHITE, borderRadius: 10, padding: "8px 12px", display: "flex", alignItems: "center" }}>
            <DollarSign size={24} color={BLUE_MAIN} />
          </div>
          <div>
            <div style={{ fontSize: 18, fontWeight: 700, color: WHITE, letterSpacing: "-0.02em" }}>Business Intelligence Financeiro</div>
            <div style={{ fontSize: 12, color: "rgba(255,255,255,0.55)", marginTop: 2 }}>
              Análise detalhada do centro de custo {pepAtivo ? `(${pepAtivo})` : 'Geral'}
            </div>
          </div>
        </div>
        
        {/* FILTRO DE PEP EMBUTIDO NO HEADER */}
        <div style={{ display: "flex", alignItems: "center", gap: 10, minWidth: "400px" }}>
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
            onClick={() => setPepAtivo(pepSelecionado?.value || '')}
            style={{ background: BLUE_MAIN, color: WHITE, border: "none", padding: "10px 20px", borderRadius: 8, fontWeight: 600, cursor: "pointer", transition: "0.2s" }}
            onMouseOver={(e) => e.target.style.background = BLUE_LIGHT}
            onMouseOut={(e) => e.target.style.background = BLUE_MAIN}
          >
            Filtrar
          </button>
        </div>
      </div>

      {carregando ? (
        <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', height: '60vh', color: BLUE_MAIN }}>
          <Loader />
          <p style={{ marginTop: 16, fontWeight: 600 }}>Processando dados mestres...</p>
        </div>
      ) : !pepAtivo ? (
        <div style={{ textAlign: 'center', padding: '6rem 2rem', background: WHITE, margin: '2rem auto', maxWidth: 600, borderRadius: 16, border: `1px dashed ${GRAY_MED}` }}>
          <DollarSign size={48} style={{ color: BLUE_PALE, marginBottom: '1rem' }} />
          <h3 style={{ color: GRAY_MED }}>Selecione um Centro de Custo no topo para gerar o relatório executivo.</h3>
        </div>
      ) : (
        <>
          {/* ── TABS ── */}
          <div style={{ background: WHITE, borderBottom: `2px solid ${BLUE_PALE}`, padding: "0 32px", display: "flex", gap: 4 }}>
            {tabs.map(t => (
              <button key={t.id} onClick={() => setActiveTab(t.id)}
                style={{
                  background: "none", border: "none", cursor: "pointer",
                  padding: "14px 16px", fontSize: 13, fontWeight: activeTab === t.id ? 700 : 500,
                  color: activeTab === t.id ? BLUE_MAIN : GRAY_MED,
                  borderBottom: activeTab === t.id ? `3px solid ${BLUE_MAIN}` : "3px solid transparent",
                  marginBottom: -2, transition: "all 0.15s",
                }}
              >{t.label}</button>
            ))}
          </div>

          <div className="fade-in" style={{ padding: "28px 32px", maxWidth: 1400, margin: "0 auto" }}>

            {/* ══════════════ OVERVIEW ══════════════ */}
            {activeTab === "overview" && (
              <>
                <div style={{ display: "flex", gap: 16, flexWrap: "wrap", marginBottom: 28 }}>
                  <KpiCard highlight icon="💰" label="Total Gasto no PEP" value={fmtK(totalGasto)} sub={`WBS: ${pepAtivo}`} />
                  <KpiCard icon="📦" label="Volume de Entregas" value={totalFretes.toLocaleString("pt-BR")} sub="Fretes alocados" color={BLUE_LIGHT} />
                  <KpiCard icon="📊" label="Custo Médio / Frete" value={fmt(mediaCusto)} sub="Valor médio unitário" color={BLUE_MAIN} />
                  <KpiCard icon="🔥" label="Pico de Gastos" value={picoMes.mes} sub={fmtK(picoMes.total)} color={ACCENT} />
                  <KpiCard icon="✅" label="Menor Gasto" value={minMes.mes} sub={fmtK(minMes.total)} color={SUCCESS} />
                </div>

                <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 20 }}>
                  {/* Line chart */}
                  <div style={{ background: WHITE, borderRadius: 16, padding: 24, boxShadow: "0 2px 12px rgba(28,43,58,0.07)", border: `1px solid ${BLUE_PALE}` }}>
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

                  {/* Pie chart */}
                  <div style={{ background: WHITE, borderRadius: 16, padding: 24, boxShadow: "0 2px 12px rgba(28,43,58,0.07)", border: `1px solid ${BLUE_PALE}` }}>
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

            {/* ══════════════ TEMPORAL ══════════════ */}
            {activeTab === "temporal" && (
              <div style={{ display: "flex", flexDirection: "column", gap: 20 }}>
                <div style={{ background: WHITE, borderRadius: 16, padding: 28, boxShadow: "0 2px 12px rgba(28,43,58,0.07)", border: `1px solid ${BLUE_PALE}` }}>
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

                <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 20 }}>
                  <div style={{ background: WHITE, borderRadius: 16, padding: 28, boxShadow: "0 2px 12px rgba(28,43,58,0.07)", border: `1px solid ${BLUE_PALE}` }}>
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

                  <div style={{ background: WHITE, borderRadius: 16, padding: 28, boxShadow: "0 2px 12px rgba(28,43,58,0.07)", border: `1px solid ${BLUE_PALE}` }}>
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
              <div style={{ display: "flex", flexDirection: "column", gap: 20 }}>
                <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 20 }}>
                  <div style={{ background: WHITE, borderRadius: 16, padding: 28, boxShadow: "0 2px 12px rgba(28,43,58,0.07)", border: `1px solid ${BLUE_PALE}` }}>
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

                  <div style={{ background: WHITE, borderRadius: 16, padding: 28, boxShadow: "0 2px 12px rgba(28,43,58,0.07)", border: `1px solid ${BLUE_PALE}` }}>
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

                <div style={{ background: WHITE, borderRadius: 16, padding: 28, boxShadow: "0 2px 12px rgba(28,43,58,0.07)", border: `1px solid ${BLUE_PALE}` }}>
                  <SectionHeader title="Detalhamento de Rotas" subtitle="Todas as rotas utilizadas neste PEP" />
                  <table style={{ width: "100%", borderCollapse: "collapse", fontSize: 13 }}>
                    <thead>
                      <tr style={{ background: BLUE_PALE }}>
                        {["#", "Rota", "Fretes", "Custo Total", "Custo Médio"].map(h => (
                          <th key={h} style={{ padding: "10px 14px", textAlign: h === "#" ? "center" : "left", fontWeight: 700, color: GRAY_DARK, fontSize: 12 }}>{h}</th>
                        ))}
                      </tr>
                    </thead>
                    <tbody>
                      {rotasData.map((r, i) => (
                        <tr key={i} style={{ background: i % 2 === 0 ? WHITE : GRAY_LIGHT, borderBottom: `1px solid ${BLUE_PALE}` }}>
                          <td style={{ padding: "9px 14px", textAlign: "center", color: GRAY_MED, fontWeight: 600 }}>{i + 1}</td>
                          <td style={{ padding: "9px 14px", fontWeight: 500 }}>{r.rota}</td>
                          <td style={{ padding: "9px 14px" }}><span style={{ background: BLUE_PALE, color: BLUE_MAIN, borderRadius: 20, padding: "2px 10px", fontWeight: 700, fontSize: 12 }}>{r.count}</span></td>
                          <td style={{ padding: "9px 14px", fontWeight: 600, color: GRAY_DARK }}>{fmtK(r.total)}</td>
                          <td style={{ padding: "9px 14px", color: GRAY_MED }}>{fmt(r.total / r.count)}</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>
            )}

            {/* ══════════════ TRANSPORTADORAS ══════════════ */}
            {activeTab === "carriers" && (
              <div style={{ display: "flex", flexDirection: "column", gap: 20 }}>
                <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 20 }}>
                  <div style={{ background: WHITE, borderRadius: 16, padding: 28, boxShadow: "0 2px 12px rgba(28,43,58,0.07)", border: `1px solid ${BLUE_PALE}` }}>
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

                  <div style={{ background: WHITE, borderRadius: 16, padding: 28, boxShadow: "0 2px 12px rgba(28,43,58,0.07)", border: `1px solid ${BLUE_PALE}` }}>
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

                <div style={{ background: WHITE, borderRadius: 16, padding: 28, boxShadow: "0 2px 12px rgba(28,43,58,0.07)", border: `1px solid ${BLUE_PALE}` }}>
                  <SectionHeader title="Ranking de Transportadoras" subtitle="Desempenho no PEP selecionado" />
                  <table style={{ width: "100%", borderCollapse: "collapse", fontSize: 13 }}>
                    <thead>
                      <tr style={{ background: BLUE_PALE }}>
                        {["#", "Transportadora", "Fretes", "Custo Total", "Custo Médio", "Share (%)"].map(h => (
                          <th key={h} style={{ padding: "10px 14px", textAlign: "left", fontWeight: 700, color: GRAY_DARK, fontSize: 12 }}>{h}</th>
                        ))}
                      </tr>
                    </thead>
                    <tbody>
                      {transportadorasData.map((t, i) => {
                        const share = (t.total / totalGasto * 100).toFixed(1);
                        return (
                          <tr key={i} style={{ background: i % 2 === 0 ? WHITE : GRAY_LIGHT, borderBottom: `1px solid ${BLUE_PALE}` }}>
                            <td style={{ padding: "9px 14px", color: GRAY_MED, fontWeight: 700 }}>{i + 1}</td>
                            <td style={{ padding: "9px 14px", fontWeight: 700 }}>
                              <span style={{ display: "inline-block", width: 10, height: 10, borderRadius: "50%", background: TRANSP_COLORS[i % TRANSP_COLORS.length], marginRight: 8 }} />
                              {t.nome}
                            </td>
                            <td style={{ padding: "9px 14px" }}>{t.count.toLocaleString("pt-BR")}</td>
                            <td style={{ padding: "9px 14px", fontWeight: 600 }}>{fmtK(t.total)}</td>
                            <td style={{ padding: "9px 14px", color: t.media < 1000 ? SUCCESS : t.media > 4000 ? ACCENT : GRAY_DARK }}>{fmt(t.media)}</td>
                            <td style={{ padding: "9px 14px" }}>
                              <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
                                <div style={{ flex: 1, height: 6, background: BLUE_PALE, borderRadius: 3, overflow: "hidden" }}>
                                  <div style={{ height: "100%", width: `${share}%`, background: TRANSP_COLORS[i % TRANSP_COLORS.length], borderRadius: 3 }} />
                                </div>
                                <span style={{ fontSize: 11, fontWeight: 600, width: 36 }}>{share}%</span>
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
              <div style={{ background: WHITE, borderRadius: 16, padding: 28, boxShadow: "0 2px 12px rgba(28,43,58,0.07)", border: `1px solid ${BLUE_PALE}` }}>
                <SectionHeader title="Registros Brutos" subtitle="Todas as notas/fretes computados neste Centro de Custo" />
                <div style={{ overflowX: 'auto' }}>
                  <table style={{ width: '100%', borderCollapse: 'collapse', marginTop: '1rem', fontSize: 13 }}>
                    <thead>
                      <tr style={{ textAlign: 'left', background: BLUE_PALE, color: GRAY_DARK, fontSize: '0.85rem' }}>
                        <th style={{ padding: '12px' }}>ID ATM</th>
                        <th style={{ padding: '12px' }}>DATA</th>
                        <th style={{ padding: '12px' }}>TRANSPORTADORA</th>
                        <th style={{ padding: '12px' }}>NF / CTE</th>
                        <th style={{ padding: '12px', textAlign: 'right' }}>VALOR</th>
                      </tr>
                    </thead>
                    <tbody>
                      {atmsDoPep.map(atm => (
                        <tr key={atm.id} style={{ borderBottom: '1px solid #f1f5f9', fontSize: '0.9rem' }}>
                          <td style={{ padding: '12px', fontWeight: 'bold' }}>#{atm.numero_atm || atm.id.substring(0,8).toUpperCase()}</td>
                          <td style={{ padding: '12px' }}>{new Date(atm.data_solicitacao || atm.created_at).toLocaleDateString()}</td>
                          <td style={{ padding: '12px' }}>{atm.transportadora?.nome || 'Pendente'}</td>
                          <td style={{ padding: '12px' }}>{atm.nf || atm.fatura_cte || '---'}</td>
                          <td style={{ padding: '12px', textAlign: 'right', fontWeight: 'bold', color: BLUE_MAIN }}>
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