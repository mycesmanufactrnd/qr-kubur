// @ts-nocheck
import * as XLSX from "xlsx";
import { jsPDF } from "jspdf";
import autoTable from "jspdf-autotable";

const APP_NAME = "QubuR";
const APP_TAGLINE = "Grave Management & Islamic Services Platform";
const LOGO_URL = "/Logo.jpg";

const PRIMARY = [21, 128, 61]; // emerald-700
const TEXT_DARK = [15, 23, 42]; // slate-900
const TEXT_MUTED = [100, 116, 139]; // slate-500

const loadImageAsDataUrl = (url) =>
  new Promise((resolve, reject) => {
    fetch(url)
      .then((res) => res.blob())
      .then((blob) => {
        const reader = new FileReader();
        reader.onloadend = () => resolve(reader.result);
        reader.onerror = reject;
        reader.readAsDataURL(blob);
      })
      .catch(reject);
  });

const cellValue = (col, row) => {
  const value = col.value ? col.value(row) : row[col.key];
  return value == null || value === "" ? "-" : value;
};

export function exportRowsToExcel({ filename, columns, rows }) {
  const data = rows.map((row) => {
    const record = {};
    columns.forEach((col) => {
      record[col.label] = cellValue(col, row);
    });
    return record;
  });

  const worksheet = XLSX.utils.json_to_sheet(data);
  const workbook = XLSX.utils.book_new();
  XLSX.utils.book_append_sheet(workbook, worksheet, "Data");
  XLSX.writeFile(workbook, `${filename}.xlsx`);
}

export async function exportRowsToPdf({
  filename,
  title,
  subtitle,
  columns,
  rows,
}) {
  const orientation = columns.length > 6 ? "landscape" : "portrait";
  const doc = new jsPDF({ unit: "mm", format: "a4", orientation });
  const pageWidth = doc.internal.pageSize.getWidth();
  const pageHeight = doc.internal.pageSize.getHeight();
  const marginX = 12;
  const headerHeight = 24;

  doc.setFillColor(...PRIMARY);
  doc.rect(0, 0, pageWidth, headerHeight, "F");

  try {
    const logoDataUrl = await loadImageAsDataUrl(LOGO_URL);
    doc.addImage(logoDataUrl, "JPEG", marginX, 3, 18, 18);
  } catch {
    // continue without the logo if it can't be loaded
  }

  doc.setTextColor(255, 255, 255);
  doc.setFont("helvetica", "bold");
  doc.setFontSize(13);
  doc.text(APP_NAME, marginX + 22, 12);
  doc.setFont("helvetica", "normal");
  doc.setFontSize(7);
  doc.text(APP_TAGLINE, marginX + 22, 17);

  doc.setFontSize(7);
  doc.text(
    new Date().toLocaleString("ms-MY", {
      dateStyle: "medium",
      timeStyle: "short",
    }),
    pageWidth - marginX,
    9,
    { align: "right" },
  );

  let y = headerHeight + 8;

  doc.setTextColor(...TEXT_DARK);
  doc.setFont("helvetica", "bold");
  doc.setFontSize(13);
  doc.text(title, marginX, y);
  y += 5;

  if (subtitle) {
    doc.setFont("helvetica", "normal");
    doc.setFontSize(9);
    doc.setTextColor(...TEXT_MUTED);
    doc.text(subtitle, marginX, y);
    y += 5;
  }

  y += 2;

  autoTable(doc, {
    startY: y,
    head: [columns.map((c) => c.label)],
    body: rows.map((row) => columns.map((col) => String(cellValue(col, row)))),
    theme: "grid",
    headStyles: { fillColor: PRIMARY, textColor: 255, fontSize: 8 },
    styles: { fontSize: 7.5, cellPadding: 2 },
    margin: { left: marginX, right: marginX },
  });

  const pageCount = doc.internal.getNumberOfPages();
  for (let p = 1; p <= pageCount; p++) {
    doc.setPage(p);
    doc.setFont("helvetica", "italic");
    doc.setFontSize(7);
    doc.setTextColor(...TEXT_MUTED);
    doc.text(`${p} / ${pageCount}`, pageWidth - marginX, pageHeight - 6, {
      align: "right",
    });
  }

  doc.save(`${filename}.pdf`);
}
