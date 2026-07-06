// @ts-nocheck
import { jsPDF } from "jspdf";

const APP_NAME = "QubuR";
const APP_TAGLINE = "Grave Management & Islamic Services Platform";
const LOGO_URL = "/Logo.jpg";

const PRIMARY = [21, 128, 61]; // emerald-700
const PRIMARY_DARK = [6, 78, 59]; // emerald-900
const TEXT_DARK = [15, 23, 42]; // slate-900
const TEXT_MUTED = [100, 116, 139]; // slate-500
const BORDER = [226, 232, 240]; // slate-200
const ROW_ALT_BG = [248, 250, 252]; // slate-50

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

export async function generateJenazahCasePdf(data) {
  const doc = new jsPDF({ unit: "mm", format: "a4" });
  const pageWidth = doc.internal.pageSize.getWidth();
  const pageHeight = doc.internal.pageSize.getHeight();
  const marginX = 15;
  const contentWidth = pageWidth - marginX * 2;
  const headerHeight = 34;
  let y = 0;

  doc.setFillColor(...PRIMARY);
  doc.rect(0, 0, pageWidth, headerHeight, "F");

  try {
    const logoDataUrl = await loadImageAsDataUrl(LOGO_URL);
    doc.addImage(logoDataUrl, "JPEG", marginX, 6, 22, 22);
  } catch {
    // continue without the logo if it can't be loaded
  }

  doc.setTextColor(255, 255, 255);
  doc.setFont("helvetica", "bold");
  doc.setFontSize(18);
  doc.text(APP_NAME, marginX + 28, 17);
  doc.setFont("helvetica", "normal");
  doc.setFontSize(8.5);
  doc.text(APP_TAGLINE, marginX + 28, 23);

  doc.setFontSize(8);
  doc.text(
    `Dijana: ${new Date().toLocaleString("ms-MY", { dateStyle: "medium", timeStyle: "short" })}`,
    pageWidth - marginX,
    28,
    { align: "right" },
  );

  y = headerHeight + 12;

  doc.setTextColor(...TEXT_DARK);
  doc.setFont("helvetica", "bold");
  doc.setFontSize(15);
  doc.text("Permohonan Pengurusan Jenazah", pageWidth / 2, y, {
    align: "center",
  });
  y += 10;

  const refBoxHeight = 20;
  doc.setDrawColor(...PRIMARY);
  doc.setFillColor(240, 253, 244);
  doc.roundedRect(marginX, y, contentWidth, refBoxHeight, 2, 2, "FD");

  doc.setFont("helvetica", "normal");
  doc.setFontSize(8);
  doc.setTextColor(...TEXT_MUTED);
  doc.text("NO. RUJUKAN", marginX + 6, y + 8);
  doc.setFont("helvetica", "bold");
  doc.setFontSize(15);
  doc.setTextColor(...PRIMARY_DARK);
  doc.text(data.referenceno || "-", marginX + 6, y + 16);

  doc.setFont("helvetica", "normal");
  doc.setFontSize(8);
  doc.setTextColor(...TEXT_MUTED);
  doc.text("STATUS", pageWidth - marginX - 6, y + 8, { align: "right" });
  doc.setFont("helvetica", "bold");
  doc.setFontSize(11);
  doc.setTextColor(...PRIMARY_DARK);
  doc.text("Menunggu Kelulusan", pageWidth - marginX - 6, y + 16, {
    align: "right",
  });

  y += refBoxHeight + 10;

  const ensureSpace = (needed) => {
    if (y + needed > pageHeight - 20) {
      doc.addPage();
      y = 15;
    }
  };

  const drawSection = (title, rows) => {
    const visibleRows = rows.filter((r) => r.value != null && r.value !== "");
    if (!visibleRows.length) return;

    ensureSpace(14);
    doc.setFillColor(...PRIMARY);
    doc.rect(marginX, y, contentWidth, 8, "F");
    doc.setTextColor(255, 255, 255);
    doc.setFont("helvetica", "bold");
    doc.setFontSize(9.5);
    doc.text(title.toUpperCase(), marginX + 3, y + 5.5);
    y += 8;

    const labelWidth = 50;
    const valueX = marginX + labelWidth + 4;
    const valueMaxWidth = contentWidth - labelWidth - 8;
    const lineHeight = 5;

    visibleRows.forEach((row, i) => {
      const lines = doc.splitTextToSize(String(row.value), valueMaxWidth);
      const rowHeight = Math.max(9, lines.length * lineHeight + 4);

      ensureSpace(rowHeight);

      const bg = i % 2 === 0 ? [255, 255, 255] : ROW_ALT_BG;
      doc.setFillColor(...bg);
      doc.rect(marginX, y, contentWidth, rowHeight, "F");
      doc.setDrawColor(...BORDER);
      doc.rect(marginX, y, contentWidth, rowHeight);

      const textY = y + (rowHeight - lines.length * lineHeight) / 2 + lineHeight - 1.3;

      doc.setFont("helvetica", "bold");
      doc.setFontSize(9);
      doc.setTextColor(...TEXT_MUTED);
      doc.text(row.label, marginX + 3, textY);

      doc.setFont("helvetica", "normal");
      doc.setTextColor(...TEXT_DARK);
      doc.text(lines, valueX, textY);

      y += rowHeight;
    });

    y += 8;
  };

  drawSection("Maklumat Jenazah", [
    { label: "Nama Penuh", value: data.fullname },
    { label: "No. Kad Pengenalan", value: data.icnumber },
    { label: "No. Telefon", value: data.phone },
    { label: "Tarikh Pengebumian", value: data.burialdate },
  ]);

  drawSection("Maklumat Masjid", [
    { label: "Nama Masjid", value: data.mosqueName },
    { label: "Alamat", value: data.mosqueAddress },
  ]);

  drawSection("Maklumat Waris", [
    { label: "Nama Waris", value: data.heirname },
    { label: "No. Tel. Waris", value: data.heirphoneno },
  ]);

  const pageCount = doc.internal.getNumberOfPages();
  for (let p = 1; p <= pageCount; p++) {
    doc.setPage(p);
    doc.setDrawColor(...BORDER);
    doc.line(marginX, pageHeight - 16, pageWidth - marginX, pageHeight - 16);
    doc.setFont("helvetica", "italic");
    doc.setFontSize(7.5);
    doc.setTextColor(...TEXT_MUTED);
    doc.text(
      "Dokumen ini dijana secara automatik oleh sistem QubuR. Sila simpan no. rujukan ini untuk semakan status permohonan.",
      pageWidth / 2,
      pageHeight - 11,
      { align: "center", maxWidth: contentWidth },
    );
    doc.text(`${p} / ${pageCount}`, pageWidth - marginX, pageHeight - 6, {
      align: "right",
    });
  }

  doc.save(`Jenazah-${data.referenceno || "permohonan"}.pdf`);
}
