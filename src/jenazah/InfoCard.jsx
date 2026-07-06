import React from "react";
import { Card } from "@/components/ui/card";

export default function InfoCard({ title, icon: Icon, children }) {
  return (
    <Card className="border border-gray-200 dark:border-gray-700 dark:bg-gray-800 rounded-lg shadow-sm border-l-4 border-l-emerald-600 overflow-hidden">
      <div className="px-5 py-4 border-b border-gray-100 dark:border-gray-700 flex items-center gap-2">
        {Icon && <Icon className="w-5 h-5 text-emerald-700 dark:text-emerald-400" />}
        <h3 className="font-semibold text-gray-900 dark:text-white">{title}</h3>
      </div>
      <div className="p-5">{children}</div>
    </Card>
  );
}