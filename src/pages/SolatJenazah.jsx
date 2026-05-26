// @ts-nocheck
import BackNavigation from "@/components/BackNavigation";
import { Card, CardContent } from "@/components/ui/card";
import { translate } from '@/utils/translations';

const PDF_URL = 'https://qubur.mycesgroup.com/PanduanSolatJenazah.pdf';
const VIEWER_URL = `https://docs.google.com/viewer?url=${encodeURIComponent(PDF_URL)}&embedded=true`;

export default function SolatJenazah() {
  return (
    <div className="max-w-3xl mx-auto space-y-6">
      <BackNavigation title={translate('Funeral Prayer Guide')}/>

      <Card>
        <CardContent className="p-0">
          <iframe
            src={VIEWER_URL}
            className="w-full h-[80vh]"
            title={translate('Funeral Prayer Guide')}
            allow="autoplay"
          />
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
