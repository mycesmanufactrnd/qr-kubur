import BackNavigation from "@/components/BackNavigation";
import { Card, CardContent } from "@/components/ui/card";

export default function SolatJenazah() {
  const PanduanSolatJenazahPdf = "/PanduanSolatJenazah.pdf";

  return (
    <div className="max-w-3xl mx-auto space-y-6">
      <BackNavigation title="Panduan Solat Jenazah" />

      <Card>
        <CardContent className="p-0">
          <iframe
            src={`${PanduanSolatJenazahPdf}#toolbar=0&navpanes=0`}
            className="w-full h-[80vh]"
            title="Panduan Solat Jenazah"
          />
        </CardContent>
      </Card>

      <footer className="text-center text-gray-500 text-sm">
        Semoga dipermudahkan urusan jenazah dan diterima amal 🤲
      </footer>
    </div>
  );
}
