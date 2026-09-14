// @ts-nocheck
import { useEffect, useState } from "react";
import { Document, Page, pdfjs } from "react-pdf";
import { Download } from "lucide-react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { translate } from "@/utils/translations";

import "react-pdf/dist/Page/TextLayer.css";
import "react-pdf/dist/Page/AnnotationLayer.css";

// Rendered via pdf.js (canvas) instead of a bare <iframe> — an iframe's PDF
// preview depends on the browser's own PDF plugin and how the server sets
// Content-Disposition, which is what was making previews come up blank/download
// instead of showing inline. Canvas rendering sidesteps all of that.
pdfjs.GlobalWorkerOptions.workerSrc = new URL(
  "pdfjs-dist/build/pdf.worker.min.mjs",
  import.meta.url,
).toString();

export default function FilePreviewDialog({
  open,
  onClose,
  src,
  isPdf,
  title,
  fileName,
}) {
  const resolvedTitle = title ?? translate("Preview File");
  const [numPages, setNumPages] = useState(0);

  useEffect(() => {
    setNumPages(0);
  }, [src]);

  return (
    <Dialog
      open={open}
      onOpenChange={(v) => {
        if (!v) onClose();
      }}
    >
      <DialogContent className="max-w-[80vw] max-h-[90vh] overflow-y-auto dark:bg-slate-800">
        <DialogHeader>
          <div className="flex items-center justify-between gap-3 pr-6">
            <DialogTitle>{resolvedTitle}</DialogTitle>
            {src && (
              <a
                href={src}
                download={fileName || true}
                className="inline-flex items-center gap-1.5 text-xs font-semibold text-emerald-600 dark:text-emerald-400 hover:underline shrink-0"
              >
                <Download className="w-3.5 h-3.5" />
                {translate("Download")}
              </a>
            )}
          </div>
        </DialogHeader>
        {src &&
          (isPdf ? (
            <div className="flex flex-col items-center gap-3 bg-slate-100 dark:bg-slate-900 rounded p-3 max-h-[75vh] overflow-y-auto">
              <Document
                file={src}
                loading={
                  <p className="text-sm text-slate-400 dark:text-slate-500 py-10">
                    {translate("Loading...")}
                  </p>
                }
                onLoadSuccess={({ numPages }) => setNumPages(numPages)}
                onLoadError={(error) =>
                  console.error("PDF preview error:", error)
                }
              >
                {Array.from({ length: numPages }, (_, index) => (
                  <div key={`page_${index + 1}`} className="mb-3 shadow-md">
                    <Page
                      pageNumber={index + 1}
                      width={Math.min(window.innerWidth * 0.7, 800)}
                      renderTextLayer={false}
                      renderAnnotationLayer={false}
                    />
                  </div>
                ))}
              </Document>
            </div>
          ) : (
            <img
              src={src}
              alt={resolvedTitle}
              referrerPolicy={
                !src.startsWith("blob:") &&
                !src.startsWith("data:") &&
                !src.startsWith("/")
                  ? "no-referrer"
                  : undefined
              }
              className="max-h-[75vh] w-auto max-w-full mx-auto rounded"
            />
          ))}
      </DialogContent>
    </Dialog>
  );
}
