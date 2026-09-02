// @ts-nocheck
import { useState } from "react";
import { FileSpreadsheet, FileText, Loader2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { translate } from "@/utils/translations";
import { showError } from "@/components/ToastrNotification";
import { exportRowsToExcel, exportRowsToPdf } from "@/utils/exportTable";

export default function TableExportButtons({
  fetchRows,
  columns,
  filename,
  pdfTitle,
  pdfSubtitle,
  disabled = false,
  className = "",
}) {
  const [exporting, setExporting] = useState(null);

  const handleExport = async (type) => {
    setExporting(type);
    try {
      const rows = await fetchRows();
      if (type === "xlsx") {
        exportRowsToExcel({ filename, columns, rows });
      } else {
        await exportRowsToPdf({
          filename,
          title: pdfTitle,
          subtitle: pdfSubtitle,
          columns,
          rows,
        });
      }
    } catch (err) {
      console.error(err);
      showError(translate("Failed to export data"));
    } finally {
      setExporting(null);
    }
  };

  const isBusy = !!exporting;

  return (
    <div className={`flex items-center gap-2 ${className}`}>
      <Button
        type="button"
        variant="outline"
        onClick={() => handleExport("xlsx")}
        disabled={disabled || isBusy}
      >
        {exporting === "xlsx" ? (
          <Loader2 className="w-4 h-4 mr-2 animate-spin" />
        ) : (
          <FileSpreadsheet className="w-4 h-4 mr-2" />
        )}
        {translate("Export Excel")}
      </Button>
      <Button
        type="button"
        variant="outline"
        onClick={() => handleExport("pdf")}
        disabled={disabled || isBusy}
      >
        {exporting === "pdf" ? (
          <Loader2 className="w-4 h-4 mr-2 animate-spin" />
        ) : (
          <FileText className="w-4 h-4 mr-2" />
        )}
        {translate("Export PDF")}
      </Button>
    </div>
  );
}
