// @ts-nocheck
import { useEffect, useRef, useState } from "react";
import { Document, Page, pdfjs } from "react-pdf";

import { translate } from "@/utils/translations";

import "react-pdf/dist/Page/TextLayer.css";
import "react-pdf/dist/Page/AnnotationLayer.css";

// PDF.js worker
pdfjs.GlobalWorkerOptions.workerSrc = new URL(
  "pdfjs-dist/build/pdf.worker.min.mjs",
  import.meta.url,
).toString();

/**
 * In-app PDF viewer for bundled PDFs in /public (PDF.js).
 * No iframe, no Google Docs Viewer, no browser PDF toolbar.
 */
export default function PDFViewer({ src, title }) {
  const containerRef = useRef(null);

  const [numPages, setNumPages] = useState(0);
  const [width, setWidth] = useState(350);
  const [loaded, setLoaded] = useState(false);
  const [error, setError] = useState(false);

  useEffect(() => {
    const updateWidth = () => {
      if (!containerRef.current) return;
      setWidth(Math.min(containerRef.current.clientWidth - 24, 700));
    };

    updateWidth();

    const observer = new ResizeObserver(updateWidth);
    if (containerRef.current) observer.observe(containerRef.current);

    return () => observer.disconnect();
  }, []);

  useEffect(() => {
    setLoaded(false);
    setError(false);
    setNumPages(0);
  }, [src]);

  return (
    <div
      ref={containerRef}
      className="relative w-full h-[78vh] overflow-y-auto overflow-x-hidden bg-slate-100 dark:bg-slate-900 overscroll-contain"
    >
      {!loaded && !error && (
        <div className="absolute inset-0 z-10 flex flex-col items-center justify-center gap-3 bg-white dark:bg-slate-800">
          <div className="h-10 w-10 animate-spin rounded-full border-4 border-emerald-500 border-t-transparent" />
          <p className="text-xs text-slate-400 dark:text-slate-500">
            {translate("Loading...")}
          </p>
        </div>
      )}

      {error && (
        <div className="absolute inset-0 z-10 flex items-center justify-center p-6 bg-white dark:bg-slate-800">
          <p className="text-sm text-slate-500 dark:text-slate-400 text-center">
            {translate("Unable to load PDF.")}
          </p>
        </div>
      )}

      <Document
        file={src}
        loading={null}
        onLoadSuccess={({ numPages }) => {
          setNumPages(numPages);
          setLoaded(true);
        }}
        onLoadError={(err) => {
          console.error(`PDF loading error: ${title}`, err);
          setError(true);
        }}
      >
        <div className="flex flex-col items-center py-3">
          {Array.from({ length: numPages }, (_, index) => (
            <div key={`page_${index + 1}`} className="mb-3 shadow-md">
              <Page
                pageNumber={index + 1}
                width={width}
                renderTextLayer={false}
                renderAnnotationLayer={false}
              />
            </div>
          ))}
        </div>
      </Document>
    </div>
  );
}
