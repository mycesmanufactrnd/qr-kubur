import React from "react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { ArrowLeft } from "lucide-react";

export default function DetailHeader({ status, onBack }) {
  const isBuried = status === "Sudah Dikebumikan";
  return (
    <header className="sticky top-0 z-30 bg-emerald-900 text-white">
      <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="h-16 flex items-center justify-between gap-3">
          <Button
            variant="ghost"
            size="sm"
            onClick={onBack}
            className="text-white hover:bg-emerald-800 hover:text-white px-2"
          >
            <ArrowLeft className="w-4 h-4 mr-2" />
            <span className="hidden sm:inline">Kembali ke Senarai</span>
            <span className="sm:hidden">Kembali</span>
          </Button>
          <h1 className="text-lg font-semibold tracking-tight absolute left-1/2 -translate-x-1/2">
            Detail Jenazah
          </h1>
          <Badge
            className={
              isBuried
                ? "bg-emerald-600 text-white border-0 hover:bg-emerald-600"
                : "bg-amber-100 text-amber-800 border-amber-300 hover:bg-amber-100"
            }
          >
            {status}
          </Badge>
        </div>
      </div>
    </header>
  );
}