import React from "react";
import { Button } from "@/components/ui/button";
import { Printer } from "lucide-react";

export default function BottomActionBar({ onBack }) {
  return (
    <div className="fixed bottom-0 left-0 right-0 bg-white border-t border-gray-200 z-30">
      <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 py-3 flex flex-col sm:flex-row items-center justify-between gap-3">
        <p className="text-sm text-gray-500">
          Data jenazah bersifat sulit. Sila jaga kerahsiaan maklumat ini.
        </p>
        <div className="flex items-center gap-2">
          <Button
            variant="outline"
            className="border-emerald-200 text-emerald-700 hover:bg-emerald-50 hover:text-emerald-800"
            onClick={() => window.print()}
          >
            <Printer className="w-4 h-4 mr-2" />
            Cetak Rekod
          </Button>
          <Button
            variant="ghost"
            onClick={onBack}
            className="text-emerald-700 hover:bg-emerald-50"
          >
            Kembali
          </Button>
        </div>
      </div>
    </div>
  );
}