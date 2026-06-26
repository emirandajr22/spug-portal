import { useMemo, useRef, useCallback, useState } from "react";
import { useDashboardData } from "../hooks/useDashboardData";
import { useDpiData } from "../hooks/useDpiData";
import DashboardLayout from "../components/DashboardLayout";
import StatCard from "../components/StatCard";
import {
  BarChart, Bar, AreaChart, Area, ComposedChart, Line,
  XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer,
} from "recharts";

const fPHP = (n) => n == null ? "—" : `₱${Number(n).toLocaleString("en-PH", { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;
const fKWh = (n) => n == null ? "—" : `${Number(n).toLocaleString("en-PH")} kWh`;
const shortM = (n) => {
  if (n == null || isNaN(n)) return "—";
  const a = Math.abs(n);
  if (a >= 1e9) return `₱${(n / 1e9).toFixed(2)}B`;
  if (a >= 1e6) return `₱${(n / 1e6).toFixed(2)}M`;
  if (a >= 1e3) return `₱${(n / 1e3).toFixed(1)}K`;
  return `₱${n.toFixed(2)}`;
};
const shortKwh = (n) => {
  if (n == null || isNaN(n)) return "—";
  if (n >= 1e6) return `${(n / 1e6).toFixed(2)}M`;
  if (n >= 1e3) return `${(n / 1e3).toFixed(1)}K`;
  return String(n);
};
const toNum = (v) => {
  if (v == null || v === "") return null;
  const n = parseFloat(String(v).replace(/,/g, ""));
  return isNaN(n) ? null : n;
};
const sum = (arr) => arr.filter((v) => v != null && !isNaN(v)).reduce((a, b) => a + b, 0);
const avg = (arr) => { const v = arr.filter((v) => v != null && !isNaN(v)); return v.length ? sum(v) / v.length : 0; };

const fDate = (d) => {
  if (!d) return "ongoing";
  const dt = new Date(d);
  return dt.toLocaleDateString("en-PH", { month: "short", day: "numeric", year: "numeric" });
};

function getContractsForMonth(month, contracts) {
  const monthMap = { Jan:0,Feb:1,Mar:2,Apr:3,May:4,Jun:5,Jul:6,Aug:7,Sep:8,Oct:9,Nov:10,Dec:11 };
  const [monthStr, yearStr] = month.split(" ");
  const year = parseInt(yearStr);
  const monthIdx = monthMap[monthStr];
  if (monthIdx === undefined || isNaN(year)) return [];
  const periodStart = new Date(year, monthIdx - 1, 25);
  const periodEnd   = new Date(year, monthIdx, 25);
  return contracts.filter((c) => {
    const eff = new Date(c.effective_date);
    const end = c.end_date ? new Date(c.end_date) : new Date("9999-12-31");
    return eff < periodEnd && end >= periodStart;
  });
}

const CONFIG = {
  dpi:          { title: "Delta P, Inc.",                   subtitle: "DPI Energy Dashboard",  table: "dpi_data"          },
  inpc:         { title: "Isla Norte Power Corporation",     subtitle: "INPC Energy Dashboard", table: "inpc_data"         },
  cipc_busuanga:{ title: "CIPC — Busuanga",                 subtitle: "Calamian Islands PC",   table: "cipc_busuanga_data"},
  cipc_coron:   { title: "CIPC — Coron",                    subtitle: "Calamian Islands PC",   table: "cipc_coron_data"   },
  cipc_epsa:    { title: "CIPC — EPSA",                     subtitle: "Calamian Islands PC",   table: "cipc_epsa_data"    },
};

function ChartTooltip({ active, payload, label }) {
  if (!active || !payload?.length) return null;
  return (
    <div className="bg-white border border-sky/40 rounded-xl shadow-card p-3 text-xs max-w-[240px]">
      <p className="font-semibold text-dark mb-2">{label}</p>
      {payload.map((p, i) => (
        <div key={i} className="flex justify-between gap-3" style={{ color: p.color }}>
          <span className="truncate">{p.name}</span>
          <span className="font-mono shrink-0">
            {typeof p.value === "number" && Math.abs(p.value) > 9999 ? shortM(p.value)
              : typeof p.value === "number" ? `₱${p.value.toFixed(4)}` : p.value}
          </span>
        </div>
      ))}
    </div>
  );
}

const LoadingState = () => (
  <div className="flex flex-col items-center justify-center h-64 gap-3">
    <svg className="animate-spin w-8 h-8 text-primary" fill="none" viewBox="0 0 24 24">
      <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"/>
      <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8v8z"/>
    </svg>
    <p className="text-dark/50 text-sm">Loading dashboard data…</p>
  </div>
);
const ErrorState = ({ message, table }) => (
  <div className="bg-accentRed/10 border border-accentRed/30 rounded-2xl p-8 text-center">
    <p className="text-accentRed font-semibold text-lg mb-2">Failed to load data</p>
    <p className="text-dark/60 text-sm">{message}</p>
    <p className="text-dark/40 text-xs mt-3">Table: <code className="font-mono bg-sky/40 px-1 rounded">spug.{table}</code></p>
  </div>
);
const EmptyState = ({ table }) => (
  <div className="bg-sky/20 border border-sky/40 rounded-2xl p-10 text-center">
    <p className="text-dark/60 text-base mb-1">No data found</p>
    <p className="text-dark/40 text-sm">Run the reset SQL in Supabase → SQL Editor.</p>
    <p className="text-dark/30 text-xs mt-1">Table: <code className="font-mono">spug.{table}</code></p>
  </div>
);

const G = (id, color, op = 0.4) => (
  <linearGradient key={id} id={id} x1="0" y1="0" x2="0" y2="1">
    <stop offset="5%" stopColor={color} stopOpacity={op}/>
    <stop offset="95%" stopColor={color} stopOpacity={0}/>
  </linearGradient>
);

function DownloadIcon() {
  return (
    <svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" viewBox="0 0 24 24"
      fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"/>
      <polyline points="7 10 12 15 17 10"/>
      <line x1="12" y1="15" x2="12" y2="3"/>
    </svg>
  );
}

function ChartCard({ title, children, filename = "chart" }) {
  const cardRef = useRef(null);
  const handleDownload = useCallback(async () => {
    if (!cardRef.current) return;
    try {
      const html2canvas = (await import("html2canvas")).default;
      const canvas = await html2canvas(cardRef.current, { backgroundColor: "#ffffff", scale: 2, useCORS: true, logging: false });
      const link = document.createElement("a");
      link.download = `${filename}.png`;
      link.href = canvas.toDataURL("image/png");
      link.click();
    } catch (err) { console.error("Chart download failed:", err); }
  }, [filename]);
  return (
    <div ref={cardRef} className="card" style={{ position: "relative" }}>
      <div className="flex items-center justify-between mb-4">
        <h3 className="font-semibold text-dark text-sm">{title}</h3>
        <button onClick={handleDownload} title="Download chart as PNG"
          className="flex items-center gap-1 text-dark/40 hover:text-primary hover:bg-sky/30 transition-colors rounded-lg px-2 py-1 text-xs"
          style={{ flexShrink: 0 }}>
          <DownloadIcon/><span>PNG</span>
        </button>
      </div>
      {children}
    </div>
  );
}

/* ================================================================ */
/*  DPI Dashboard                                                    */
/* ================================================================ */
function DpiDashboard({ data, contracts }) {
  const [expandedRows, setExpandedRows] = useState(new Set());

  const toggleRow = (month) => {
    setExpandedRows((prev) => {
      const next = new Set(prev);
      next.has(month) ? next.delete(month) : next.add(month);
      return next;
    });
  };

  const tcgr  = data.map((r) => toNum(r.tcgr)).filter(Boolean);
  const energy = data.map((r) => toNum(r.energy_offtake)).filter(Boolean);
  const paleco = data.map((r) => toNum(r.paleco_bill)).filter(Boolean);
  const fuel   = data.map((r) => toNum(r.fuel_fee)).filter(Boolean);

  return (
    <>
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
        <StatCard title="Avg True Cost Gen Rate" value={`₱${avg(tcgr).toFixed(4)}`} suffix="/kWh" sparklineData={tcgr}/>
        <StatCard title="Total Energy Offtake" value={shortKwh(sum(energy))} suffix=" kWh" sparklineData={energy}/>
        <StatCard title="Total Billed to PALECO" value={shortM(sum(paleco))} sparklineData={paleco}/>
        <StatCard title="Total Fuel Fee" value={shortM(sum(fuel))} sparklineData={fuel}/>
      </div>
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-6">
        <ChartCard title="True Cost Generation Rate (₱/kWh)" filename="dpi-tcgr">
          <ResponsiveContainer width="100%" height={220}>
            <BarChart data={data} margin={{ top:4, right:8, bottom:4, left:0 }}>
              <CartesianGrid strokeDasharray="3 3" stroke="#d4eef5"/>
              <XAxis dataKey="month" tick={{ fontSize:10, fill:"#00313a" }}/>
              <YAxis tick={{ fontSize:10, fill:"#00313a" }} domain={["auto","auto"]} tickFormatter={(v) => `₱${v}`}/>
              <Tooltip content={<ChartTooltip/>}/>
              <Bar dataKey="tcgr" name="TCGR (₱/kWh)" fill="#75b5b4" radius={[4,4,0,0]}/>
            </BarChart>
          </ResponsiveContainer>
        </ChartCard>
        <ChartCard title="Energy Offtake vs Contracted Energy (kWh)" filename="dpi-energy-offtake">
          <ResponsiveContainer width="100%" height={220}>
            <ComposedChart data={data} margin={{ top:4, right:8, bottom:4, left:0 }}>
              <defs>{G("dE","#005697",0.3)}</defs>
              <CartesianGrid strokeDasharray="3 3" stroke="#d4eef5"/>
              <XAxis dataKey="month" tick={{ fontSize:10, fill:"#00313a" }}/>
              <YAxis tick={{ fontSize:10, fill:"#00313a" }} tickFormatter={shortKwh}/>
              <Tooltip content={<ChartTooltip/>}/>
              <Legend wrapperStyle={{ fontSize:10 }}/>
              <Area type="monotone" dataKey="energy_offtake" name="Energy Offtake" fill="url(#dE)" stroke="#005697" strokeWidth={2}/>
              <Line type="monotone" dataKey="contracted_energy" name="Contracted Energy" stroke="#a24f4f" strokeWidth={2} strokeDasharray="5 5" dot={false}/>
            </ComposedChart>
          </ResponsiveContainer>
        </ChartCard>
      </div>
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-6">
        <ChartCard title="Cost Breakdown (₱)" filename="dpi-cost-breakdown">
          <ResponsiveContainer width="100%" height={220}>
            <AreaChart data={data} margin={{ top:4, right:8, bottom:4, left:0 }}>
              <defs>{G("dC","#75b5b4")}{G("dV","#9bbfde")}{G("dF","#a24f4f")}</defs>
              <CartesianGrid strokeDasharray="3 3" stroke="#d4eef5"/>
              <XAxis dataKey="month" tick={{ fontSize:10, fill:"#00313a" }}/>
              <YAxis tick={{ fontSize:10, fill:"#00313a" }} tickFormatter={shortM}/>
              <Tooltip content={<ChartTooltip/>}/>
              <Legend wrapperStyle={{ fontSize:10 }}/>
              <Area type="monotone" dataKey="capacity_fee" name="Capacity Fee" stroke="#75b5b4" fill="url(#dC)" strokeWidth={1.5}/>
              <Area type="monotone" dataKey="variable_om_fee" name="Variable O&M" stroke="#9bbfde" fill="url(#dV)" strokeWidth={1.5}/>
              <Area type="monotone" dataKey="fuel_fee" name="Fuel Fee" stroke="#a24f4f" fill="url(#dF)" strokeWidth={1.5}/>
            </AreaChart>
          </ResponsiveContainer>
        </ChartCard>
        <ChartCard title="PALECO Bill Trend (₱)" filename="dpi-paleco-trend">
          <ResponsiveContainer width="100%" height={220}>
            <ComposedChart data={data} margin={{ top:4, right:40, bottom:4, left:0 }}>
              <defs>{G("dP","#00313a",0.15)}</defs>
              <CartesianGrid strokeDasharray="3 3" stroke="#d4eef5"/>
              <XAxis dataKey="month" tick={{ fontSize:10, fill:"#00313a" }}/>
              <YAxis yAxisId="l" tick={{ fontSize:10, fill:"#00313a" }} tickFormatter={shortM}/>
              <YAxis yAxisId="r" orientation="right" tick={{ fontSize:10, fill:"#75b5b4" }} domain={["auto","auto"]} tickFormatter={(v) => `₱${v}`}/>
              <Tooltip content={<ChartTooltip/>}/>
              <Legend wrapperStyle={{ fontSize:10 }}/>
              <Area yAxisId="l" type="monotone" dataKey="paleco_bill" name="PALECO Bill" stroke="#00313a" fill="url(#dP)" strokeWidth={2}/>
              <Line yAxisId="r" type="monotone" dataKey="tcgr" name="TCGR (₱/kWh)" stroke="#75b5b4" strokeWidth={2} dot={{ r:3, fill:"#75b5b4" }}/>
            </ComposedChart>
          </ResponsiveContainer>
        </ChartCard>
      </div>

      {/* ── Monthly Data Table with expandable contract rows ── */}
      <div className="card">
        <h3 className="font-semibold text-dark text-sm mb-4">Monthly Data Table</h3>
        <div className="overflow-x-auto rounded-lg border border-sky/30">
          <table className="w-full text-xs" style={{ minWidth:"900px" }}>
            <thead>
              <tr className="bg-sky/30 border-b border-sky/40">
                {["Month","TCGR (₱/kWh)","Energy Offtake","Contracted Energy","Capacity Fee","Variable O&M Fee","Fuel Fee","PALECO Bill"].map((h) => (
                  <th key={h} className="text-left py-2.5 px-3 text-dark/70 font-semibold whitespace-nowrap">{h}</th>
                ))}
              </tr>
            </thead>
            <tbody>
              {data.map((r, i) => {
                const monthContracts = getContractsForMonth(r.month, contracts);
                const hasMultiple    = monthContracts.length > 1;
                const isExpanded     = expandedRows.has(r.month);
                const rowBg          = i % 2 === 0 ? "bg-white" : "bg-sky/5";
                return (
                  <>
                    <tr
                      key={r.month}
                      onClick={() => hasMultiple && toggleRow(r.month)}
                      className={`border-b border-sky/20 transition-colors ${rowBg} ${hasMultiple ? "cursor-pointer hover:bg-amber-50" : "hover:bg-sky/10"}`}
                    >
                      <td className="py-2.5 px-3 font-semibold text-dark whitespace-nowrap">
                        <div className="flex items-center gap-2">
                          {r.month}
                          {hasMultiple && (
                            <span className="text-xs bg-amber-100 text-amber-700 px-1.5 py-0.5 rounded-full font-medium">
                              {monthContracts.length} contracts
                            </span>
                          )}
                          {hasMultiple && (
                            <svg className={`w-3.5 h-3.5 text-dark/30 transition-transform ${isExpanded ? "rotate-180" : ""}`}
                              fill="none" viewBox="0 0 24 24" stroke="currentColor">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7"/>
                            </svg>
                          )}
                        </div>
                      </td>
                      <td className="py-2.5 px-3 font-mono text-primary whitespace-nowrap">₱{(toNum(r.tcgr) || 0).toFixed(4)}</td>
                      <td className="py-2.5 px-3 font-mono whitespace-nowrap">{fKWh(r.energy_offtake)}</td>
                      <td className="py-2.5 px-3 font-mono whitespace-nowrap">
                        {hasMultiple
                          ? <span className="text-dark/40 italic">see below ↓</span>
                          : r.contracted_energy ? fKWh(r.contracted_energy) : "—"
                        }
                      </td>
                      <td className="py-2.5 px-3 font-mono whitespace-nowrap">{fPHP(r.capacity_fee)}</td>
                      <td className="py-2.5 px-3 font-mono whitespace-nowrap">{fPHP(r.variable_om_fee)}</td>
                      <td className="py-2.5 px-3 font-mono text-accentRed whitespace-nowrap">{fPHP(r.fuel_fee)}</td>
                      <td className="py-2.5 px-3 font-mono font-bold text-dark whitespace-nowrap">{fPHP(r.paleco_bill)}</td>
                    </tr>
                    {hasMultiple && isExpanded && monthContracts.map((c, ci) => (
                      <tr key={`${r.month}-c${ci}`} className="border-b border-amber-100 bg-amber-50/60">
                        <td className="py-2 px-3 whitespace-nowrap" colSpan={1}>
                          <div className="flex items-center gap-1.5 pl-4">
                            <span className="w-1.5 h-1.5 rounded-full bg-amber-400 shrink-0"/>
                            <span className="font-medium text-dark/60 text-xs">{c.label || `Period ${ci + 1}`}</span>
                          </div>
                          <div className="text-dark/30 text-xs mt-0.5 pl-7">
                            {fDate(c.effective_date)} – {fDate(c.end_date)}
                          </div>
                        </td>
                        <td className="py-2 px-3 text-dark/20 text-xs">—</td>
                        <td className="py-2 px-3 text-dark/20 text-xs">—</td>
                        <td className="py-2 px-3 font-mono text-amber-700 whitespace-nowrap text-xs">{fKWh(c.contracted_energy)}</td>
                        <td className="py-2 px-3 text-dark/20 text-xs" colSpan={4}>—</td>
                      </tr>
                    ))}
                  </>
                );
              })}
            </tbody>
          </table>
        </div>
        {contracts.length > 0 && (
          <p className="text-xs text-dark/30 mt-3">
            Rows marked with multiple contracts are clickable — expand to see contract period breakdown.
          </p>
        )}
      </div>
    </>
  );
}

/* ================================================================ */
/*  INPC Dashboard                                                   */
/* ================================================================ */
function InpcDashboard({ data }) {
  const tcgr   = data.map((r) => toNum(r.tcgr)).filter(Boolean);
  const energy  = data.map((r) => toNum(r.energy_offtake)).filter(Boolean);
  const banelco = data.map((r) => toNum(r.banelco_bill)).filter(Boolean);
  const npc     = data.map((r) => toNum(r.npc_bill)).filter(Boolean);
  return (
    <>
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
        <StatCard title="Avg True Cost Gen Rate" value={`₱${avg(tcgr).toFixed(4)}`} suffix="/kWh" sparklineData={tcgr}/>
        <StatCard title="Total Energy Offtake" value={shortKwh(sum(energy))} suffix=" kWh" sparklineData={energy}/>
        <StatCard title="Total Billed to BANELCO" value={shortM(sum(banelco))} sparklineData={banelco}/>
        <StatCard title="Total Billed to NPC" value={shortM(sum(npc))} sparklineData={npc}/>
      </div>
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-6">
        <ChartCard title="True Cost vs SAGR by Month (₱/kWh)" filename="inpc-tcgr-sagr">
          <ResponsiveContainer width="100%" height={220}>
            <ComposedChart data={data} margin={{ top:4, right:8, bottom:4, left:0 }}>
              <CartesianGrid strokeDasharray="3 3" stroke="#d4eef5"/>
              <XAxis dataKey="month" tick={{ fontSize:10, fill:"#00313a" }}/>
              <YAxis tick={{ fontSize:10, fill:"#00313a" }} domain={["auto","auto"]} tickFormatter={(v) => `₱${v}`}/>
              <Tooltip content={<ChartTooltip/>}/>
              <Legend wrapperStyle={{ fontSize:10 }}/>
              <Bar dataKey="tcgr" name="TCGR (₱/kWh)" fill="#75b5b4" radius={[4,4,0,0]}/>
              <Line dataKey="sagr" name="SAGR (₱/kWh)" stroke="#a24f4f" strokeWidth={2} strokeDasharray="5 5" dot={{ r:3 }}/>
            </ComposedChart>
          </ResponsiveContainer>
        </ChartCard>
        <ChartCard title="Billed to BANELCO and NPC (₱)" filename="inpc-banelco-npc">
          <ResponsiveContainer width="100%" height={220}>
            <ComposedChart data={data} margin={{ top:4, right:8, bottom:4, left:0 }}>
              <CartesianGrid strokeDasharray="3 3" stroke="#d4eef5"/>
              <XAxis dataKey="month" tick={{ fontSize:10, fill:"#00313a" }}/>
              <YAxis tick={{ fontSize:10, fill:"#00313a" }} tickFormatter={shortM}/>
              <Tooltip content={<ChartTooltip/>}/>
              <Legend wrapperStyle={{ fontSize:10 }}/>
              <Bar dataKey="banelco_bill" name="BANELCO Bill" stackId="a" fill="#75b5b4"/>
              <Bar dataKey="npc_bill" name="NPC Bill" stackId="a" fill="#f0a85c" radius={[4,4,0,0]}/>
              <Line dataKey="total_fee" name="Total Fee" stroke="#005697" strokeWidth={2} dot={{ r:3 }}/>
            </ComposedChart>
          </ResponsiveContainer>
        </ChartCard>
      </div>
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-6">
        <ChartCard title="Energy Offtake vs Capital Recovery Demand (kWh)" filename="inpc-energy-offtake">
          <ResponsiveContainer width="100%" height={220}>
            <ComposedChart data={data} margin={{ top:4, right:8, bottom:4, left:0 }}>
              <defs>{G("iE","#005697",0.3)}</defs>
              <CartesianGrid strokeDasharray="3 3" stroke="#d4eef5"/>
              <XAxis dataKey="month" tick={{ fontSize:10, fill:"#00313a" }}/>
              <YAxis tick={{ fontSize:10, fill:"#00313a" }} tickFormatter={shortKwh}/>
              <Tooltip content={<ChartTooltip/>}/>
              <Legend wrapperStyle={{ fontSize:10 }}/>
              <Area type="monotone" dataKey="energy_offtake" name="Energy Offtake" fill="url(#iE)" stroke="#005697" strokeWidth={2}/>
              <Line type="monotone" dataKey="contracted_energy" name="Capital Recovery (kWh)" stroke="#a24f4f" strokeWidth={2} strokeDasharray="5 5" dot={false}/>
            </ComposedChart>
          </ResponsiveContainer>
        </ChartCard>
        <ChartCard title="Cost Breakdown (₱)" filename="inpc-cost-breakdown">
          <ResponsiveContainer width="100%" height={220}>
            <AreaChart data={data} margin={{ top:4, right:8, bottom:4, left:0 }}>
              <defs>{G("iF","#75b5b4")}{G("iO","#9bbfde")}{G("iV","#a24f4f")}</defs>
              <CartesianGrid strokeDasharray="3 3" stroke="#d4eef5"/>
              <XAxis dataKey="month" tick={{ fontSize:10, fill:"#00313a" }}/>
              <YAxis tick={{ fontSize:10, fill:"#00313a" }} tickFormatter={shortM}/>
              <Tooltip content={<ChartTooltip/>}/>
              <Legend wrapperStyle={{ fontSize:10 }}/>
              <Area type="monotone" dataKey="fixed_om" name="Fixed O&M" stroke="#75b5b4" fill="url(#iF)" strokeWidth={1.5}/>
              <Area type="monotone" dataKey="variable_om_fee" name="Variable O&M" stroke="#9bbfde" fill="url(#iO)" strokeWidth={1.5}/>
              <Area type="monotone" dataKey="fuel_fee" name="Fuel Fee" stroke="#a24f4f" fill="url(#iV)" strokeWidth={1.5}/>
            </AreaChart>
          </ResponsiveContainer>
        </ChartCard>
      </div>
      <div className="card">
        <h3 className="font-semibold text-dark text-sm mb-4">Monthly Data Table</h3>
        <div className="overflow-x-auto rounded-lg border border-sky/30">
          <table className="w-full text-xs" style={{ minWidth:"1000px" }}>
            <thead>
              <tr className="bg-sky/30 border-b border-sky/40">
                {["Month","TCGR (₱/kWh)","SAGR (₱/kWh)","Energy Offtake","Capital Recovery Fee","Fixed O&M","Variable O&M Fee","Fuel Fee","Total Fee","BANELCO Bill","NPC Bill","PPD"].map((h) => (
                  <th key={h} className="text-left py-2.5 px-3 text-dark/70 font-semibold whitespace-nowrap">{h}</th>
                ))}
              </tr>
            </thead>
            <tbody>
              {data.map((r, i) => (
                <tr key={i} className={`border-b border-sky/20 hover:bg-sky/10 transition-colors ${i % 2 === 0 ? "bg-white" : "bg-sky/5"}`}>
                  <td className="py-2.5 px-3 font-semibold text-dark whitespace-nowrap">{r.month}</td>
                  <td className="py-2.5 px-3 font-mono text-primary whitespace-nowrap">₱{(toNum(r.tcgr) || 0).toFixed(4)}</td>
                  <td className="py-2.5 px-3 font-mono whitespace-nowrap">{r.sagr ? `₱${(toNum(r.sagr) || 0).toFixed(4)}` : "—"}</td>
                  <td className="py-2.5 px-3 font-mono whitespace-nowrap">{fKWh(r.energy_offtake)}</td>
                  <td className="py-2.5 px-3 font-mono whitespace-nowrap">{fPHP(r.capital_recovery_fee)}</td>
                  <td className="py-2.5 px-3 font-mono whitespace-nowrap">{fPHP(r.fixed_om)}</td>
                  <td className="py-2.5 px-3 font-mono whitespace-nowrap">{fPHP(r.variable_om_fee)}</td>
                  <td className="py-2.5 px-3 font-mono text-accentRed whitespace-nowrap">{fPHP(r.fuel_fee)}</td>
                  <td className="py-2.5 px-3 font-mono font-bold text-dark whitespace-nowrap">{fPHP(r.total_fee)}</td>
                  <td className="py-2.5 px-3 font-mono text-primary whitespace-nowrap">{fPHP(r.banelco_bill)}</td>
                  <td className="py-2.5 px-3 font-mono text-accentBlue whitespace-nowrap">{fPHP(r.npc_bill)}</td>
                  <td className="py-2.5 px-3 font-mono text-accentRed whitespace-nowrap">{fPHP(r.ppd)}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </>
  );
}

/* ================================================================ */
/*  CIPC Dashboard                                                   */
/* ================================================================ */
function CipcDashboard({ data, dashboardKey }) {
  const isEpsa = dashboardKey === "cipc_epsa";
  const tcgr   = data.map((r) => toNum(r.tcgr)).filter(Boolean);
  const energy  = data.map((r) => toNum(r.energy_offtake)).filter(Boolean);
  const fuel    = data.map((r) => toNum(isEpsa ? r.fuel_fee : r.fuel_and_lube_oil_fee)).filter(Boolean);
  const total   = data.map((r) => toNum(r.total_fee)).filter(Boolean);
  const biselco = data.map((r) => toNum(r.biselco_bill)).filter(Boolean);
  const slug    = dashboardKey.replace("_", "-");
  return (
    <>
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
        <StatCard title="Avg True Cost Gen Rate" value={`₱${avg(tcgr).toFixed(4)}`} suffix="/kWh" sparklineData={tcgr}/>
        <StatCard title="Total Energy Offtake" value={shortKwh(sum(energy))} suffix=" kWh" sparklineData={energy}/>
        <StatCard title="Total Fee" value={shortM(sum(total))} sparklineData={total}/>
        <StatCard title={isEpsa ? "Total Fuel Fee" : "BISELCO Bill"} value={isEpsa ? shortM(sum(fuel)) : shortM(sum(biselco))} sparklineData={isEpsa ? fuel : biselco}/>
      </div>
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-6">
        <ChartCard title="True Cost Generation Rate (₱/kWh)" filename={`${slug}-tcgr`}>
          <ResponsiveContainer width="100%" height={220}>
            <BarChart data={data} margin={{ top:4, right:8, bottom:4, left:0 }}>
              <CartesianGrid strokeDasharray="3 3" stroke="#d4eef5"/>
              <XAxis dataKey="month" tick={{ fontSize:10, fill:"#00313a" }}/>
              <YAxis tick={{ fontSize:10, fill:"#00313a" }} domain={["auto","auto"]} tickFormatter={(v) => `₱${v}`}/>
              <Tooltip content={<ChartTooltip/>}/>
              <Bar dataKey="tcgr" name="TCGR (₱/kWh)" fill="#75b5b4" radius={[4,4,0,0]}/>
            </BarChart>
          </ResponsiveContainer>
        </ChartCard>
        <ChartCard title={isEpsa ? "Total Fee Trend (₱)" : "Bill Split — BISELCO vs NPC Bill (₱)"} filename={`${slug}-bill-split`}>
          <ResponsiveContainer width="100%" height={220}>
            {isEpsa ? (
              <AreaChart data={data} margin={{ top:4, right:8, bottom:4, left:0 }}>
                <defs>{G("eT","#005697",0.3)}</defs>
                <CartesianGrid strokeDasharray="3 3" stroke="#d4eef5"/>
                <XAxis dataKey="month" tick={{ fontSize:10, fill:"#00313a" }}/>
                <YAxis tick={{ fontSize:10, fill:"#00313a" }} tickFormatter={shortM}/>
                <Tooltip content={<ChartTooltip/>}/>
                <Area type="monotone" dataKey="total_fee" name="Total Fee" stroke="#005697" fill="url(#eT)" strokeWidth={2}/>
              </AreaChart>
            ) : (
              <ComposedChart data={data} margin={{ top:4, right:8, bottom:4, left:0 }}>
                <CartesianGrid strokeDasharray="3 3" stroke="#d4eef5"/>
                <XAxis dataKey="month" tick={{ fontSize:10, fill:"#00313a" }}/>
                <YAxis tick={{ fontSize:10, fill:"#00313a" }} tickFormatter={shortM}/>
                <Tooltip content={<ChartTooltip/>}/>
                <Legend wrapperStyle={{ fontSize:10 }}/>
                <Bar dataKey="biselco_bill" name="BISELCO Bill" stackId="a" fill="#75b5b4"/>
                <Bar dataKey="npc_bill" name="NPC Bill" stackId="a" fill="#a49fc8" radius={[4,4,0,0]}/>
                <Line dataKey="total_fee" name="Total Fee" stroke="#005697" strokeWidth={2} dot={{ r:3 }}/>
              </ComposedChart>
            )}
          </ResponsiveContainer>
        </ChartCard>
      </div>
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-6">
        <ChartCard title="Cost Breakdown (₱)" filename={`${slug}-cost-breakdown`}>
          <ResponsiveContainer width="100%" height={220}>
            <AreaChart data={data} margin={{ top:4, right:8, bottom:4, left:0 }}>
              <defs>{G("cC","#75b5b4")}{G("cV","#9bbfde")}{G("cF","#a24f4f")}</defs>
              <CartesianGrid strokeDasharray="3 3" stroke="#d4eef5"/>
              <XAxis dataKey="month" tick={{ fontSize:10, fill:"#00313a" }}/>
              <YAxis tick={{ fontSize:10, fill:"#00313a" }} tickFormatter={shortM}/>
              <Tooltip content={<ChartTooltip/>}/>
              <Legend wrapperStyle={{ fontSize:10 }}/>
              {isEpsa ? (<>
                <Area type="monotone" dataKey="capacity_and_fixed_om_fee" name="Capacity+Fixed O&M Fee" stroke="#75b5b4" fill="url(#cC)" strokeWidth={1.5}/>
                <Area type="monotone" dataKey="variable_om_fee" name="Variable O&M Fee" stroke="#9bbfde" fill="url(#cV)" strokeWidth={1.5}/>
                <Area type="monotone" dataKey="fuel_fee" name="Fuel Fee" stroke="#a24f4f" fill="url(#cF)" strokeWidth={1.5}/>
              </>) : (<>
                <Area type="monotone" dataKey="capacity_fee" name="Capacity Fee" stroke="#75b5b4" fill="url(#cC)" strokeWidth={1.5}/>
                <Area type="monotone" dataKey="fixed_foreign_om_fee" name="Fixed Foreign O&M Fee" stroke="#9bbfde" fill="url(#cV)" strokeWidth={1.5}/>
                <Area type="monotone" dataKey="fuel_and_lube_oil_fee" name="Fuel & Lube Oil Fee" stroke="#a24f4f" fill="url(#cF)" strokeWidth={1.5}/>
              </>)}
            </AreaChart>
          </ResponsiveContainer>
        </ChartCard>
        <ChartCard title="Energy Offtake Trend (kWh)" filename={`${slug}-energy-offtake`}>
          <ResponsiveContainer width="100%" height={220}>
            <AreaChart data={data} margin={{ top:4, right:8, bottom:4, left:0 }}>
              <defs>{G("cE","#005697",0.3)}</defs>
              <CartesianGrid strokeDasharray="3 3" stroke="#d4eef5"/>
              <XAxis dataKey="month" tick={{ fontSize:10, fill:"#00313a" }}/>
              <YAxis tick={{ fontSize:10, fill:"#00313a" }} tickFormatter={shortKwh}/>
              <Tooltip content={<ChartTooltip/>}/>
              <Area type="monotone" dataKey="energy_offtake" name="Energy Offtake" stroke="#005697" fill="url(#cE)" strokeWidth={2}/>
            </AreaChart>
          </ResponsiveContainer>
        </ChartCard>
      </div>
      <div className="card">
        <h3 className="font-semibold text-dark text-sm mb-4">Monthly Data Table</h3>
        <div className="overflow-x-auto rounded-lg border border-sky/30">
          <table className="w-full text-xs" style={{ minWidth: isEpsa ? "700px" : "1100px" }}>
            <thead>
              <tr className="bg-sky/30 border-b border-sky/40">
                {(isEpsa
                  ? ["Month","TCGR (₱/kWh)","SAGR","Energy Offtake","Capacity & Fixed O&M Fee","Variable O&M Fee","Fuel Fee","Total Fee"]
                  : ["Month","TCGR (₱/kWh)","SAGR","Energy Offtake","Capacity Fee","Fixed Foreign O&M Fee","Var Foreign O&M Fee","Fixed Local O&M Fee","Var Local O&M Fee","Fuel & Lube Oil Fee","Total Fee","BISELCO Bill","NPC Bill","PPD"]
                ).map((h) => (
                  <th key={h} className="text-left py-2.5 px-3 text-dark/70 font-semibold whitespace-nowrap">{h}</th>
                ))}
              </tr>
            </thead>
            <tbody>
              {data.map((r, i) => (
                <tr key={i} className={`border-b border-sky/20 hover:bg-sky/10 transition-colors ${i % 2 === 0 ? "bg-white" : "bg-sky/5"}`}>
                  <td className="py-2.5 px-3 font-semibold text-dark whitespace-nowrap">{r.month}</td>
                  <td className="py-2.5 px-3 font-mono text-primary whitespace-nowrap">₱{(toNum(r.tcgr) || 0).toFixed(4)}</td>
                  <td className="py-2.5 px-3 font-mono whitespace-nowrap">{r.sagr ? `₱${(toNum(r.sagr) || 0).toFixed(4)}` : "—"}</td>
                  <td className="py-2.5 px-3 font-mono whitespace-nowrap">{fKWh(r.energy_offtake)}</td>
                  {isEpsa ? (<>
                    <td className="py-2.5 px-3 font-mono whitespace-nowrap">{fPHP(r.capacity_and_fixed_om_fee)}</td>
                    <td className="py-2.5 px-3 font-mono whitespace-nowrap">{fPHP(r.variable_om_fee)}</td>
                  </>) : (<>
                    <td className="py-2.5 px-3 font-mono whitespace-nowrap">{fPHP(r.capacity_fee)}</td>
                    <td className="py-2.5 px-3 font-mono whitespace-nowrap">{fPHP(r.fixed_foreign_om_fee)}</td>
                    <td className="py-2.5 px-3 font-mono whitespace-nowrap">{fPHP(r.variable_foreign_om_fee)}</td>
                    <td className="py-2.5 px-3 font-mono whitespace-nowrap">{fPHP(r.fixed_local_om_fee)}</td>
                    <td className="py-2.5 px-3 font-mono whitespace-nowrap">{fPHP(r.variable_local_om_fee)}</td>
                  </>)}
                  <td className="py-2.5 px-3 font-mono text-accentRed whitespace-nowrap">{fPHP(isEpsa ? r.fuel_fee : r.fuel_and_lube_oil_fee)}</td>
                  <td className="py-2.5 px-3 font-mono font-bold text-dark whitespace-nowrap">{fPHP(r.total_fee)}</td>
                  {!isEpsa && (<>
                    <td className="py-2.5 px-3 font-mono text-primary whitespace-nowrap">{fPHP(r.biselco_bill)}</td>
                    <td className="py-2.5 px-3 font-mono text-accentPurple whitespace-nowrap">{fPHP(r.npc_bill)}</td>
                    <td className="py-2.5 px-3 font-mono text-accentRed whitespace-nowrap">{fPHP(r.ppd)}</td>
                  </>)}
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </>
  );
}

/* ================================================================ */
/*  Month order helper                                               */
/* ================================================================ */
const MONTH_ORDER = { Jan:0,Feb:1,Mar:2,Apr:3,May:4,Jun:5,Jul:6,Aug:7,Sep:8,Oct:9,Nov:10,Dec:11 };
const ALL_MONTHS  = ["Jan","Feb","Mar","Apr","May","Jun","Jul","Aug","Sep","Oct","Nov","Dec"];

function getYearFromMonth(month) {
  if (!month) return null;
  const parts = month.trim().split(" ");
  const yr = parseInt(parts[parts.length - 1]);
  return isNaN(yr) ? null : yr;
}

/* ================================================================ */
/*  Filter Bar                                                       */
/* ================================================================ */
function FilterBar({ years, selectedYear, onYearChange, selectedMonths, onToggleMonth, onSelectAll, onClearAll }) {
  const allSelected = selectedMonths.length === ALL_MONTHS.length;
  return (
    <div className="mb-6 bg-white rounded-2xl border border-sky/20 shadow-sm px-5 py-4">

      {/* ── Top row: labels + clear all ── */}
      <div className="flex items-center gap-6 mb-2.5">
        <span className="text-[11px] font-semibold text-dark/60 uppercase tracking-wider w-24 shrink-0">Year</span>
        <div className="w-px h-4 bg-dark/20 hidden sm:block" />
        <span className="text-[11px] font-semibold text-dark/60 uppercase tracking-wider flex-1">Months</span>
        <button
          onClick={allSelected ? onClearAll : onSelectAll}
          className="text-[11px] font-medium px-2.5 py-1 rounded-lg border border-sky/30 text-dark/40 hover:text-primary hover:border-primary/40 hover:bg-sky/10 transition shrink-0"
        >
          {allSelected ? "Clear all" : "Select all"}
        </button>
      </div>

      {/* ── Bottom row: year dropdown + month pills ── */}
      <div className="flex items-center gap-6">
        {/* Year dropdown */}
        <div className="relative w-24 shrink-0">
          <select
            value={selectedYear}
            onChange={(e) => onYearChange(Number(e.target.value))}
            className="appearance-none w-full bg-sky/10 border border-sky/30 text-dark font-semibold text-sm rounded-xl pl-3 pr-7 py-2 focus:outline-none focus:ring-2 focus:ring-teal/40 cursor-pointer transition hover:border-teal/40"
          >
            {years.map((y) => (
              <option key={y} value={y}>{y}</option>
            ))}
          </select>
          <svg className="pointer-events-none absolute right-2 top-1/2 -translate-y-1/2 w-3 h-3 text-dark/30" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7"/>
          </svg>
        </div>

        <div className="w-px h-8 bg-dark/20 hidden sm:block shrink-0" />

        {/* Month pills */}
        <div className="flex flex-wrap gap-1.5 flex-1">
          {ALL_MONTHS.map((m) => {
            const active = selectedMonths.includes(m);
            return (
              <button
                key={m}
                onClick={() => onToggleMonth(m)}
                className={`w-11 py-1.5 rounded-lg text-xs font-semibold border transition-all ${
                  active
                    ? "bg-moss text-white border-moss shadow-sm"
                    : "bg-white border-sky/30 text-dark/40 hover:border-moss/40 hover:text-moss/70 hover:bg-sky/10"
                }`}
              >
                {m}
              </button>
            );
          })}
        </div>
      </div>

    </div>
  );
}

/* ================================================================ */
/*  Root                                                             */
/* ================================================================ */
export default function DashboardPage({ dashboardKey, user }) {
  const cfg = CONFIG[dashboardKey] || CONFIG.dpi;
  const isDpi = dashboardKey === "dpi";

  const dpiResult     = useDpiData();
  const defaultResult = useDashboardData(isDpi ? null : cfg.table);

  const rawData = isDpi ? dpiResult.data : defaultResult.data;
  const loading = isDpi ? dpiResult.loading : defaultResult.loading;
  const error   = isDpi ? dpiResult.error   : defaultResult.error;

  // ── Derive available years from data ──
  const years = useMemo(() => {
    const ys = [...new Set(rawData.map((r) => getYearFromMonth(r.month)).filter(Boolean))].sort((a,b) => b - a);
    return ys;
  }, [rawData]);

  const latestYear = years[0] ?? new Date().getFullYear();
  const [selectedYear,   setSelectedYear]   = useState(null);
  const [selectedMonths, setSelectedMonths] = useState([...ALL_MONTHS]);

  const effectiveYear = selectedYear ?? latestYear;

  const handleToggleMonth = (m) => {
    setSelectedMonths((prev) =>
      prev.includes(m) ? prev.filter((x) => x !== m) : [...prev, m]
    );
  };

  // ── Filter data by year + selected months ──
  const data = useMemo(() => {
    if (!rawData.length) return [];
    return rawData.filter((r) => {
      const yr = getYearFromMonth(r.month);
      if (yr !== effectiveYear) return false;
      const monthStr = r.month?.trim().split(" ")[0];
      return selectedMonths.includes(monthStr);
    });
  }, [rawData, effectiveYear, selectedMonths]);

  const tickerItems = useMemo(() => {
    if (!data.length) return [];
    const tcgr  = data.map((r) => toNum(r.tcgr)).filter(Boolean);
    const energy = data.map((r) => toNum(r.energy_offtake)).filter(Boolean);
    return [
      `Avg. TCGR: ₱${avg(tcgr).toFixed(4)}/kWh`,
      `Total Energy Offtake: ${fKWh(sum(energy))}`,
      `Period: ${data[0]?.month} – ${data.at(-1)?.month}`,
    ];
  }, [data]);

  return (
    <DashboardLayout title={cfg.title} subtitle={cfg.subtitle} user={user} tickerItems={tickerItems}>
      {loading && <LoadingState/>}
      {!loading && error && <ErrorState message={error.message} table={cfg.table}/>}
      {!loading && !error && !rawData.length && <EmptyState table={cfg.table}/>}
      {!loading && !error && rawData.length > 0 && (
        <>
          <FilterBar
            years={years}
            selectedYear={effectiveYear}
            onYearChange={(y) => setSelectedYear(y)}
            selectedMonths={selectedMonths}
            onToggleMonth={handleToggleMonth}
            onSelectAll={() => setSelectedMonths([...ALL_MONTHS])}
            onClearAll={() => setSelectedMonths([])}
          />
          {data.length === 0 ? (
            <div className="bg-sky/20 border border-sky/40 rounded-2xl p-10 text-center">
              <p className="text-dark/60 text-base mb-1">No data for this period</p>
              <p className="text-dark/40 text-sm">Try adjusting the year or month range.</p>
            </div>
          ) : isDpi ? (
            <DpiDashboard data={data} contracts={dpiResult.contracts}/>
          ) : dashboardKey === "inpc" ? (
            <InpcDashboard data={data}/>
          ) : (
            <CipcDashboard data={data} dashboardKey={dashboardKey}/>
          )}
        </>
      )}
    </DashboardLayout>
  );
}
