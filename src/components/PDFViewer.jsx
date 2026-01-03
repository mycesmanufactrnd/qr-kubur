import { Worker, Viewer } from '@react-pdf-viewer/core';
import '@react-pdf-viewer/core/lib/styles/index.css';
import '@react-pdf-viewer/default-layout/lib/styles/index.css';
import TahlilPDF from '@/assets/TahlilPDF.pdf';

export default function PdfViewer() {
  return (
    <Worker workerUrl={`https://unpkg.com/pdfjs-dist@3.7.107/build/pdf.worker.min.js`}>
      <div style={{ height: '600px' }}>
        <Viewer fileUrl={TahlilPDF} />
      </div>
    </Worker>
  );
}
