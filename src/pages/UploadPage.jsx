import { useAuth } from "../hooks/useAuth";
import { useState, useRef, useCallback } from "react";
import { supabase } from "../lib/supabase";
import DashboardLayout from "../components/DashboardLayout";

/* ─── Table configs — CSV column → DB column mapping ─────────────── */
const TABLE_CONFIGS = {
  inpc_data: {
    label: "INPC — Isla Norte Power Corporation",
    columnMap: {
      "MONTH":                "month",
      "TCGR (P/kWh) ":       "tcgr",
      "SAGR":                 "sagr",
      "Energy Offtake (kWh)": "energy_offtake",
      "CAPITAL RECOVERY FEE": "capital_recovery_fee",
      "FIXED O&M":            "fixed_om",
      "VARIABLE O&M":         "variable_om_fee",
      "Fuel Fee":             "fuel_fee",
      "TOTAL FEE":            "total_fee",
      "BANELCO BILL":         "banelco_bill",
      "NPC BILL":             "npc_bill",
      "PPD":                  "ppd",
    },
  },
  dpi_data: {
    label: "DPI — Delta P, Inc.",
    columnMap: {
      "MONTH":                "month",
      "TCGR (P/kWh) ":       "tcgr",
      "Energy Offtake (kWh)": "energy_offtake",
      "Contracted  Energy":   "contracted_energy",
      "Capacity Fee":         "capacity_fee",
      "Variable O&M Fee":     "variable_om_fee",
      "Fuel Fee":             "fuel_fee",
      "PALECO Bill":          "paleco_bill",
    },
  },
  cipc_epsa_data: {
    label: "CIPC — EPSA",
    columnMap: {
      "MONTH":                        "month",
      "True Cost Generation Rate (P/kWh) ": "tcgr",
      "SAGR":                         "sagr",
      "Energy Offtake (kWh)":         "energy_offtake",
      "Capacity and Fixed O&M Fee":   "capacity_and_fixed_om_fee",
      "Variable O&M Fee":             "variable_om_fee",
      "Fuel Fee":                     "fuel_fee",
      "Total Fee":                    "total_fee",
    },
  },
  cipc_coron_data: {
    label: "CIPC — Coron",
    columnMap: {
      "MONTH":                        "month",
      "True Cost Generation Rate (P/kWh) ": "tcgr",
      "SAGR":                         "sagr",
      "Energy Offtake (kWh)":         "energy_offtake",
      "Capacity Fee":                 "capacity_fee",
      "Fixed Foreign O&M Fee":        "fixed_foreign_om_fee",
      "Variable Foreign O&M Fee":     "variable_foreign_om_fee",
      "Fixed Local O&M Fee":          "fixed_local_om_fee",
      "Variable Local O&M Fee":       "variable_local_om_fee",
      "Fuel & Lube Oil Fee":          "fuel_and_lube_oil_fee",
      "Total Fee":                    "total_fee",
      "BISELCO Bill":                 "biselco_bill",
      "NPC Bill":                     "npc_bill",
      "PPD":                          "ppd",
    },
  },
  cipc_busuanga_data: {
    label: "CIPC — Busuanga",
    columnMap: {
      "MONTH":                        "month",
      "True Cost Generation Rate (P/kWh) ": "tcgr",
      "SAGR":                         "sagr",
      "Energy Offtake(kWh)":          "energy_offtake",
      "Capacity Fee":                 "capacity_fee",
      "Fixed Foreign O&M Fee":        "fixed_foreign_om_fee",
      "Variable Foreign O&M Fee":     "variable_foreign_om_fee",
      "Fixed Local O&M Fee":          "fixed_local_om_fee",
      "Variable Local O&M Fee":       "variable_local_om_fee",
      "Fuel & Lube Oil Fee":          "fuel_and_lube_oil_fee",
      "TOTAL FEE":                    "total_fee",
      "BISELCO BILL":                 "biselco_bill",
      "NPC BILL":                     "npc_bill",
      "PPD":                          "ppd",
    },
  },
};

/* ─── Helpers ─────────────────────────────────────────────────────── */
const parseNum = (v) => {
  if (v == null || v === "") return null;
  const n = parseFloat(String(v).replace(/,/g, ""));
  return isNaN(n) ? null : n;
};

function parseCSV(text) {
  const lines = text.trim().split("\n");
  const headers = lines[0].split(",").map((h) => h.trim().replace(/^"|"$/g, ""));
  return lines.slice(1).map((line, idx) => {
    // Handle quoted fields with commas inside
    const cols = [];
    let cur = "", inQ = false;
    for (const ch of line) {
      if (ch === '"') { inQ = !inQ; continue; }
      if (ch === "," && !inQ) { cols.push(cur.trim()); cur = ""; continue; }
      cur += ch;
    }
    cols.push(cur.trim());
    return Object.fromEntries(headers.map((h, i) => [h, cols[i] ?? ""]));
  });
}

function mapRow(row, columnMap, sortOrder) {
  const normalizedRow = Object.fromEntries(
    Object.entries(row).map(([k, v]) => [k.trim(), v])
  );
  // For blank-header columns (e.g. Busuanga PPD), also store value under "" key
  // The raw parsed row already has "" as key from the blank CSV header
  const mapped = { sort_order: sortOrder };
  for (const [csvCol, dbCol] of Object.entries(columnMap)) {
    const trimmedKey = csvCol.trim();
    const val = normalizedRow[trimmedKey] !== undefined
      ? normalizedRow[trimmedKey]
      : normalizedRow[csvCol];
    if (dbCol === "month") {
      // Normalize month format: "Jan-25" → "Jan 2025", "Jan 2025" stays as-is
      const raw = val || null;
      if (raw && /^[A-Za-z]+-\d{2}$/.test(raw.trim())) {
        const [mon, yr] = raw.trim().split("-");
        mapped[dbCol] = `${mon} 20${yr}`;
      } else {
        mapped[dbCol] = raw;
      }
    } else {
      mapped[dbCol] = parseNum(val);
    }
  }
  return mapped;
}

/* ─── Status badge ────────────────────────────────────────────────── */
function StatusBadge({ status }) {
  const styles = {
    idle:     "bg-sky/30 text-dark/50",
    parsing:  "bg-yellow-100 text-yellow-700",
    preview:  "bg-blue-100 text-blue-700",
    uploading:"bg-orange-100 text-orange-700",
    success:  "bg-green-100 text-green-700",
    error:    "bg-red-100 text-red-700",
  };
  const labels = {
    idle:     "Waiting for file",
    parsing:  "Parsing CSV…",
    preview:  "Ready to upload",
    uploading:"Uploading…",
    success:  "Upload successful",
    error:    "Upload failed",
  };
  return (
    <span className={`text-xs font-medium px-2.5 py-1 rounded-full ${styles[status]}`}>
      {labels[status]}
    </span>
  );
}

/* ─── Main Upload Page ────────────────────────────────────────────── */
export default function UploadPage() {
  const { user, profile } = useAuth();
  const [selectedTable, setSelectedTable] = useState("");
  const [status, setStatus]               = useState("idle");
  const [rows, setRows]                   = useState([]);
  const [fileName, setFileName]           = useState("");
  const [errorMsg, setErrorMsg]           = useState("");
  const [uploadedCount, setUploadedCount] = useState(0);
  const fileRef = useRef(null);

  const isAdmin = ['superadmin', 'admin'].includes(profile?.role);

  const handleTableChange = useCallback((e) => {
    setSelectedTable(e.target.value);
    setRows([]);
    setStatus("idle");
    setFileName("");
    setErrorMsg("");
    if (fileRef.current) fileRef.current.value = "";
  }, []);

  const handleFile = useCallback((e) => {
    const file = e.target.files?.[0];
    if (!file || !selectedTable) return;

    setFileName(file.name);
    setStatus("parsing");
    setErrorMsg("");

    const reader = new FileReader();
    reader.onload = (ev) => {
      try {
        const config = TABLE_CONFIGS[selectedTable];
        const parsed = parseCSV(ev.target.result);

        // ── Validate CSV headers against expected columnMap keys ──
        const csvHeaders    = Object.keys(parsed[0] || {}).map((h) => h.trim());
        const expectedKeys  = Object.keys(config.columnMap).map((k) => k.trim());
        const missingCols   = expectedKeys.filter((k) => !csvHeaders.includes(k));
        const unknownCols   = csvHeaders.filter((h) => !expectedKeys.includes(h));

        // Fail if more than half the expected columns are missing — likely wrong file
        if (missingCols.length > expectedKeys.length / 2) {
          setErrorMsg(
            `Wrong CSV file for "${config.label}".\n` +
            `Missing columns: ${missingCols.join(", ")}.\n` +
            `Make sure you selected the correct table for this file.`
          );
          setStatus("error");
          setFileName("");
          if (fileRef.current) fileRef.current.value = "";
          return;
        }

        // Warn but still allow if only a few columns are missing
        const mapped = parsed.map((row, i) => mapRow(row, config.columnMap, i + 1));
        setRows(mapped);
        setStatus("preview");

        if (missingCols.length > 0) {
          setErrorMsg(`Note: ${missingCols.length} expected column(s) not found in CSV and will be empty: ${missingCols.join(", ")}`);
        }
      } catch (err) {
        setErrorMsg("Failed to parse CSV: " + err.message);
        setStatus("error");
      }
    };
    reader.readAsText(file);
  }, [selectedTable]);

  const handleUpload = useCallback(async () => {
    if (!rows.length || !selectedTable) return;
    setStatus("uploading");
    setErrorMsg("");

    const { error } = await supabase
      .schema("spug")
      .from(selectedTable)
      .insert(rows);

    if (error) {
      setErrorMsg(error.message);
      setStatus("error");
    } else {
      setUploadedCount(rows.length);
      setStatus("success");
      setRows([]);
      setFileName("");
      if (fileRef.current) fileRef.current.value = "";
    }
  }, [rows, selectedTable]);

  const handleReset = useCallback(() => {
    setStatus("idle");
    setRows([]);
    setFileName("");
    setErrorMsg("");
    setSelectedTable("");
    if (fileRef.current) fileRef.current.value = "";
  }, []);

  /* ── Not admin ── */
  if (!isAdmin) {
    return (
      <DashboardLayout title="Upload Data" subtitle="CSV Import" user={user}>
        <div className="flex flex-col items-center justify-center h-64 gap-3 text-center">
          <svg className="w-12 h-12 text-dark/20" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M12 15v2m0 0v2m0-2h2m-2 0H10m2-11a4 4 0 014 4v1H8v-1a4 4 0 014-4z" />
          </svg>
          <p className="text-dark/50 text-sm">You don't have permission to upload data.</p>
          <p className="text-dark/30 text-xs">Admin access required.</p>
        </div>
      </DashboardLayout>
    );
  }

  return (
    <DashboardLayout title="Upload Data" subtitle="CSV Import" user={user}>
      <div className="max-w-4xl mx-auto space-y-6">

        {/* ── Step 1: Select table ── */}
        <div className="card">
          <div className="flex items-center justify-between mb-4">
            <h3 className="font-semibold text-dark text-sm">1 — Select table</h3>
            <StatusBadge status={status} />
          </div>
          <select
            value={selectedTable}
            onChange={handleTableChange}
            className="w-full border border-sky/40 rounded-lg px-3 py-2.5 text-sm text-dark bg-white focus:outline-none focus:ring-2 focus:ring-primary/30"
          >
            <option value="">— Choose a table —</option>
            {Object.entries(TABLE_CONFIGS).map(([key, cfg]) => (
              <option key={key} value={key}>{cfg.label}</option>
            ))}
          </select>
        </div>

        {/* ── Step 2: Upload file ── */}
        {selectedTable && (
          <div className="card">
            <h3 className="font-semibold text-dark text-sm mb-4">2 — Upload CSV file</h3>
            <label
              className={`flex flex-col items-center justify-center border-2 border-dashed rounded-xl p-10 cursor-pointer transition-colors
                ${status === "preview" || status === "success"
                  ? "border-primary/40 bg-sky/10"
                  : "border-sky/40 hover:border-primary/40 hover:bg-sky/5"}`}
            >
              <svg className="w-10 h-10 text-dark/20 mb-3" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M7 16a4 4 0 01-.88-7.903A5 5 0 1115.9 6L16 6a5 5 0 011 9.9M15 13l-3-3m0 0l-3 3m3-3v12" />
              </svg>
              {fileName
                ? <p className="text-sm font-medium text-dark">{fileName}</p>
                : <p className="text-sm text-dark/40">Click to choose a CSV file</p>
              }
              <p className="text-xs text-dark/30 mt-1">.csv files only</p>
              <input
                ref={fileRef}
                type="file"
                accept=".csv"
                onChange={handleFile}
                className="hidden"
              />
            </label>
          </div>
        )}

        {/* ── Step 3: Preview ── */}
        {status === "preview" && rows.length > 0 && (
          <div className="card">
            <div className="flex items-center justify-between mb-4">
              <h3 className="font-semibold text-dark text-sm">3 — Preview</h3>
              <span className="text-xs text-dark/40">{rows.length} rows to append</span>
            </div>
            <div className="overflow-x-auto rounded-lg border border-sky/30 mb-5">
              <table className="w-full text-xs" style={{ minWidth: "600px" }}>
                <thead>
                  <tr className="bg-sky/30 border-b border-sky/40">
                    {Object.keys(rows[0]).map((col) => (
                      <th key={col} className="text-left py-2 px-3 text-dark/60 font-semibold whitespace-nowrap">
                        {col}
                      </th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {rows.slice(0, 5).map((row, i) => (
                    <tr key={i} className={`border-b border-sky/20 ${i % 2 === 0 ? "bg-white" : "bg-sky/5"}`}>
                      {Object.values(row).map((val, j) => (
                        <td key={j} className="py-2 px-3 font-mono whitespace-nowrap text-dark/70">
                          {val ?? <span className="text-dark/20">—</span>}
                        </td>
                      ))}
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
            {rows.length > 5 && (
              <p className="text-xs text-dark/30 mb-4 text-center">
                Showing 5 of {rows.length} rows
              </p>
            )}
            <div className="flex gap-3">
              <button
                onClick={handleUpload}
                className="flex-1 bg-primary text-white rounded-lg py-2.5 text-sm font-semibold hover:bg-primary/90 transition-colors"
              >
                Upload {rows.length} rows to {TABLE_CONFIGS[selectedTable]?.label}
              </button>
              <button
                onClick={handleReset}
                className="px-4 border border-sky/40 rounded-lg text-sm text-dark/50 hover:bg-sky/10 transition-colors"
              >
                Cancel
              </button>
            </div>
          </div>
        )}

        {/* ── Uploading state ── */}
        {status === "uploading" && (
          <div className="card flex items-center gap-3">
            <svg className="animate-spin w-5 h-5 text-primary shrink-0" fill="none" viewBox="0 0 24 24">
              <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"/>
              <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8v8z"/>
            </svg>
            <p className="text-sm text-dark/60">Uploading {rows.length} rows…</p>
          </div>
        )}

        {/* ── Success ── */}
        {status === "success" && (
          <div className="card border border-green-200 bg-green-50">
            <div className="flex items-center gap-3 mb-4">
              <svg className="w-5 h-5 text-green-600 shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7"/>
              </svg>
              <p className="text-sm font-semibold text-green-700">
                {uploadedCount} rows successfully added to {TABLE_CONFIGS[selectedTable]?.label}
              </p>
            </div>
            <button
              onClick={handleReset}
              className="text-sm text-green-700 underline hover:no-underline"
            >
              Upload another file
            </button>
          </div>
        )}

        {/* ── Error ── */}
        {status === "error" && (
          <div className="card border border-red-200 bg-red-50">
            <div className="flex items-center gap-3 mb-3">
              <svg className="w-5 h-5 text-red-500 shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z"/>
              </svg>
              <p className="text-sm font-semibold text-red-600">Upload failed</p>
            </div>
            <p className="text-xs text-red-500 font-mono mb-4">{errorMsg}</p>
            <button
              onClick={handleReset}
              className="text-sm text-red-600 underline hover:no-underline"
            >
              Try again
            </button>
          </div>
        )}

      </div>
    </DashboardLayout>
  );
}
