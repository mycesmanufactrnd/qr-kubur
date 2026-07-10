// @ts-nocheck
import { useState, useEffect, useRef } from "react";
import BackNavigation from "@/components/BackNavigation";
import { Card, CardContent } from "@/components/ui/card";
import { translate } from '@/utils/translations';
import { usePdfCache } from "@/hooks/usePdfCache";

const PDF_URL = 'https://qubur.mycesgroup.com/PanduanSolatJenazah.pdf';
const VIEWER_URL = `https://docs.google.com/viewer?url=${encodeURIComponent(PDF_URL)}&embedded=true`;

function IframeWithLoader({ src, title }) {
  const [loaded, setLoaded] = useState(false);
  const iframeRef = useRef(null);

  useEffect(() => {
    setLoaded(false);
  }, [src]);

  return (
    <div className="relative w-full h-[80vh]">
      {!loaded && (
        <div className="absolute inset-0 flex flex-col items-center justify-center gap-3 bg-white dark:bg-slate-800 z-10">
          <div className="h-10 w-10 animate-spin rounded-full border-4 border-emerald-500 border-t-transparent" />
          <p className="text-xs text-slate-400 dark:text-slate-500">{translate("Loading...")}</p>
        </div>
      )}
      <iframe
        ref={iframeRef}
        src={src}
        className="w-full h-full"
        title={title}
        allow="autoplay"
        onLoad={() => setLoaded(true)}
      />
    </div>
  );
}

export default function SolatJenazah() {
  const { objectUrl } = usePdfCache(PDF_URL);

  return (
    <div className="max-w-3xl mx-auto space-y-6">
      <BackNavigation title={translate('Funeral Prayer Guide')}/>

      <Card>
        <CardContent className="p-0">
          <IframeWithLoader src={objectUrl ?? VIEWER_URL} title={translate('Funeral Prayer Guide')} />
        </CardContent>
      </Card>

      <div className="flex justify-center">
        <a
          href={PDF_URL}
          target="_blank"
          rel="noopener noreferrer"
          className="text-sm text-emerald-600 underline underline-offset-2"
        >
          {translate("Open PDF")}
        </a>
      </div>

      <footer className="text-center text-gray-500 text-sm">
        {translate("May the matters of the deceased be eased and their deeds be accepted.")} 🤲
      </footer>
    </div>
  );
}
