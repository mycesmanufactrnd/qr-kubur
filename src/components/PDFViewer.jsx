const BASE = 'https://qubur.mycesgroup.com';

export default function PdfViewer({ path = '/Tahlil.pdf', height = '600px' }) {
  const viewerUrl = `https://docs.google.com/viewer?url=${encodeURIComponent(BASE + path)}&embedded=true`;
  return (
    <iframe
      src={viewerUrl}
      style={{ width: '100%', height }}
      allow="autoplay"
      title="PDF Viewer"
    />
  );
}
