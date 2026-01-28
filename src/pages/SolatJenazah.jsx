import BackNavigation from "@/components/BackNavigation";
import { Card, CardContent } from "@/components/ui/card";
import { translate } from '@/utils/translations';


export default function SolatJenazah() {
  const PanduanSolatJenazahPdf = "/PanduanSolatJenazah.pdf";

  return (
    <div className="max-w-3xl mx-auto space-y-6">
      <BackNavigation title={translate('Funeral Prayer Guide')}/>

      <Card>
        <CardContent className="p-0">
          <iframe
            src={`${PanduanSolatJenazahPdf}#toolbar=0&navpanes=0`}
            className="w-full h-[80vh]"
            title={translate('Funeral Prayer Guide')} 
          />
        </CardContent>
      </Card>

      <footer className="text-center text-gray-500 text-sm">
        {translate("May the matters of the deceased be eased and their deeds be accepted")} 🤲
      </footer>
    </div>
  );
}
