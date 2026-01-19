import { Card, CardContent } from "@/components/ui/card";
import { AlertCircle } from "lucide-react";

export default function NoDataCardComponent({
  title = "Tiada rekod ditemui",
  description = "Tiada data yang sepadan dengan carian anda.",
}) {
  return (
    <Card className="border-0 shadow-lg dark:bg-gray-800">
      <CardContent className="p-8 text-center space-y-2">
        <div className="flex justify-center">
          <AlertCircle className="h-12 w-12 text-gray-400 dark:text-gray-500" />
        </div>
        <h3 className="text-lg font-semibold text-gray-900 dark:text-white">{title}</h3>
        <p className="text-sm text-gray-500 dark:text-gray-400">{description}</p>
      </CardContent>
    </Card>
  );
}
