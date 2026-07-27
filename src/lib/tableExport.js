import ExcelJS from "exceljs";
import jsPDF from "jspdf";
import autoTable from "jspdf-autotable";

/* Column shape: { header, key, type, value? }
   type: "text" | "rate4" | "kwh" | "kw" | "money"
   value(row) — optional override instead of row[key] */

function rawValue(col, row) {
  const v = col.value ? col.value(row) : row[col.key];
  if (v == null || v === "") return null;
  if (col.type === "text") return v;
  const n = parseFloat(String(v).replace(/,/g, ""));
  return isNaN(n) ? null : n;
}

function displayValue(col, row) {
  const v = rawValue(col, row);
  if (v == null) return "—";
  switch (col.type) {
    // No currency symbol here — jsPDF's base14 fonts can't render "₱",
    // it falls back to "±" and throws off column-width auto-sizing.
    // A single "amounts in PHP" note is added near the PDF title instead.
    case "money": return Number(v).toLocaleString("en-PH", { minimumFractionDigits: 2, maximumFractionDigits: 2 });
    case "kwh":   return `${Number(v).toLocaleString("en-PH")} kWh`;
    case "kw":    return `${Number(v).toLocaleString("en-PH")} kW`;
    case "rate4": return Number(v).toFixed(4);
    default:      return String(v);
  }
}

// Swap characters jsPDF's standard fonts can't render for ASCII-safe text (PDF headers/titles only)
function pdfSafe(text) {
  return String(text).replace(/₱/g, "PHP");
}

function downloadBlob(blob, filename) {
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = filename;
  document.body.appendChild(a);
  a.click();
  a.remove();
  URL.revokeObjectURL(url);
}

export function exportTableCSV(columns, rows, filename) {
  const esc = (s) => `"${String(s).replace(/"/g, '""')}"`;
  const header = columns.map((c) => esc(c.header)).join(",");
  const lines = rows.map((r) => columns.map((c) => esc(rawValue(c, r) ?? "")).join(","));
  const csv = "\ufeff" + [header, ...lines].join("\r\n");
  downloadBlob(new Blob([csv], { type: "text/csv;charset=utf-8;" }), `${filename}.csv`);
}

const MOSS  = "FF00313A";
const TEAL  = "FF75B5B4";
const BAND  = "FFF2F8F8";
const GRID  = "FFD9E8E8";

const thinBorder = {
  top:    { style: "thin", color: { argb: GRID } },
  left:   { style: "thin", color: { argb: GRID } },
  bottom: { style: "thin", color: { argb: GRID } },
  right:  { style: "thin", color: { argb: GRID } },
};

export async function exportTableExcel(columns, rows, filename, title) {
  const wb = new ExcelJS.Workbook();
  wb.creator = "SPUG Energy Portal";
  wb.created = new Date();

  const sheetName = (title || "Data").replace(/[\\/*?:[\]]/g, "").slice(0, 31) || "Data";
  const ws = wb.addWorksheet(sheetName, { views: [{ state: "frozen", ySplit: title ? 4 : 1 }] });

  let headerRowNum = 1;

  if (title) {
    ws.mergeCells(1, 1, 1, columns.length);
    const titleCell = ws.getCell(1, 1);
    titleCell.value = title;
    titleCell.font = { bold: true, size: 14, color: { argb: MOSS } };
    ws.getRow(1).height = 22;

    ws.mergeCells(2, 1, 2, columns.length);
    const subCell = ws.getCell(2, 1);
    subCell.value = `Generated ${new Date().toLocaleDateString("en-PH", { year: "numeric", month: "long", day: "numeric" })} · SPUG Energy Portal`;
    subCell.font = { italic: true, size: 9, color: { argb: "FF8C8C8C" } };

    headerRowNum = 4; // row 3 left blank as a spacer
  }

  // ── Header row ──
  const headerRow = ws.getRow(headerRowNum);
  columns.forEach((c, i) => {
    const cell = headerRow.getCell(i + 1);
    cell.value = c.header;
    cell.font = { bold: true, color: { argb: "FFFFFFFF" } };
    cell.fill = { type: "pattern", pattern: "solid", fgColor: { argb: MOSS } };
    cell.alignment = { vertical: "middle", horizontal: c.type === "text" ? "left" : "right", wrapText: true };
    cell.border = thinBorder;
  });
  headerRow.height = 26;

  // ── Data rows ──
  rows.forEach((r, ri) => {
    const row = ws.getRow(headerRowNum + 1 + ri);
    columns.forEach((c, ci) => {
      const cell = row.getCell(ci + 1);
      const v = rawValue(c, r);
      cell.value = v;
      cell.alignment = { horizontal: c.type === "text" ? "left" : "right", vertical: "middle" };
      cell.border = thinBorder;
      if (ri % 2 === 1) cell.fill = { type: "pattern", pattern: "solid", fgColor: { argb: BAND } };
      if (v == null) return;
      switch (c.type) {
        case "money": cell.numFmt = '"₱"#,##0.00'; break;
        case "rate4": cell.numFmt = '"₱"0.0000'; break;
        case "kwh":   cell.numFmt = '#,##0" kWh"'; break;
        case "kw":    cell.numFmt = '#,##0" kW"'; break;
      }
    });
  });

  // ── Column widths ──
  columns.forEach((c, i) => {
    ws.getColumn(i + 1).width = Math.max(12, c.header.length + 4);
  });

  const buf = await wb.xlsx.writeBuffer();
  downloadBlob(new Blob([buf], { type: "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet" }), `${filename}.xlsx`);
}

export function exportTablePDF(columns, rows, filename, title) {
  const doc = new jsPDF({ orientation: "landscape", unit: "pt" });
  const safeTitle = pdfSafe(title || filename);

  doc.setFontSize(14);
  doc.setTextColor(0, 49, 58);
  doc.text(safeTitle, 30, 28);

  doc.setFontSize(9);
  doc.setTextColor(140, 140, 140);
  doc.text(
    `Generated ${new Date().toLocaleDateString("en-PH", { year: "numeric", month: "long", day: "numeric" })} · SPUG Energy Portal · Monetary amounts in PHP`,
    30, 42
  );

  const columnStyles = columns.reduce((acc, c, i) => {
    acc[i] = { halign: c.type === "text" ? "left" : "right" };
    return acc;
  }, {});

  autoTable(doc, {
    startY: 54,
    head: [columns.map((c) => pdfSafe(c.header))],
    body: rows.map((r) => columns.map((c) => displayValue(c, r))),
    styles: { fontSize: 6.5, cellPadding: 3, overflow: "linebreak", valign: "middle" },
    headStyles: { fillColor: [0, 49, 58], textColor: 255, fontStyle: "bold", fontSize: 6.5, cellPadding: 3, valign: "middle" },
    alternateRowStyles: { fillColor: [245, 250, 250] },
    columnStyles,
    margin: { left: 20, right: 20 },
    tableWidth: "auto",
    horizontalPageBreak: true,
  });

  doc.save(`${filename}.pdf`);
}
