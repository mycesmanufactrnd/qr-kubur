// @ts-nocheck
import { useEffect, useRef, useState } from "react";
import { Document, Page, pdfjs } from "react-pdf";

import BackNavigation from "@/components/BackNavigation";
import { Card, CardContent } from "@/components/ui/card";
import { translate } from "@/utils/translations";

import "react-pdf/dist/Page/TextLayer.css";
import "react-pdf/dist/Page/AnnotationLayer.css";

// PDF.js worker
pdfjs.GlobalWorkerOptions.workerSrc = new URL(
  "pdfjs-dist/build/pdf.worker.min.mjs",
  import.meta.url,
).toString();

const PDF_URL = "/PanduanSolatJenazah.pdf";

export default function SolatJenazah() {
  const containerRef = useRef(null);

  const [numPages, setNumPages] = useState(0);
  const [width, setWidth] = useState(350);
  const [loaded, setLoaded] = useState(false);

  useEffect(() => {
    const updateWidth = () => {
      if (!containerRef.current) return;

      const containerWidth = containerRef.current.clientWidth;

      // Leave some padding
      setWidth(Math.min(containerWidth - 24, 700));
    };

    updateWidth();

    const observer = new ResizeObserver(updateWidth);

    if (containerRef.current) {
      observer.observe(containerRef.current);
    }

    return () => observer.disconnect();
  }, []);

  return (
    <div className="max-w-3xl mx-auto space-y-6">
      <BackNavigation title={translate("Funeral Prayer Guide")} />

      <Card className="overflow-hidden">
        <CardContent className="p-0">
          <div
            ref={containerRef}
            className="
              relative
              w-full
              h-[80vh]
              overflow-y-auto
              overflow-x-hidden
              bg-slate-100
              dark:bg-slate-900
              overscroll-contain
            "
          >
            {!loaded && (
              <div
                className="
                absolute
                inset-0
                z-10
                flex
                flex-col
                items-center
                justify-center
                gap-3
                bg-white
                dark:bg-slate-800
              "
              >
                <div
                  className="
                  h-10
                  w-10
                  animate-spin
                  rounded-full
                  border-4
                  border-emerald-500
                  border-t-transparent
                "
                />

                <p
                  className="
                  text-xs
                  text-slate-400
                  dark:text-slate-500
                "
                >
                  {translate("Loading...")}
                </p>
              </div>
            )}

            <Document
              file={PDF_URL}
              loading={null}
              onLoadSuccess={({ numPages }) => {
                setNumPages(numPages);
                setLoaded(true);
              }}
              onLoadError={(error) => {
                console.error("PDF loading error:", error);
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
        </CardContent>
      </Card>

      <div className="flex justify-center">
        <a
          href={PDF_URL}
          target="_blank"
          rel="noopener noreferrer"
          className="
            text-sm
            text-emerald-600
            underline
            underline-offset-2
          "
        >
          {translate("Open PDF")}
        </a>
      </div>

      <footer className="text-center text-gray-500 text-sm">
        {translate(
          "May the matters of the deceased be eased and their deeds be accepted.",
        )}{" "}
        🤲
      </footer>
    </div>
  );
}
