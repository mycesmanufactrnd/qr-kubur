import { Card, CardContent } from "@/components/ui/card";
import { AlertCircle, ArrowLeft, Home, RefreshCw } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useNavigate } from "react-router-dom";

export default function NoDataCardComponent({
  title = "Tiada rekod ditemui",
  description = "Tiada data yang sepadan dengan carian anda.",
  isPage = false,
}) {
  const navigate = useNavigate();

  const containerClasses = isPage
    ? "flex flex-col items-center justify-center min-h-[60vh] p-4"
    : "";

  return (
    <div className={containerClasses}>
      <Card className={isPage ? "w-full max-w-md border-0 shadow-lg dark:bg-gray-800" : "border-0 shadow-lg dark:bg-gray-800"}>
        <CardContent className="p-8 text-center space-y-4">
          <div className="mb-10 gap-3">
            <div className="flex justify-center mb-2">
              <AlertCircle className="h-12 w-12 text-gray-400 dark:text-gray-500" />
            </div>
            <h3 className="text-lg mb-2 font-semibold text-gray-900 dark:text-white">{title}</h3>
            <p className="text-sm text-gray-500 dark:text-gray-400">{description}</p>
          </div>

          {isPage && (
            <div className="mt-10 flex justify-around">
              <Button
                variant="ghost"
                className="flex flex-col items-center gap-1 text-xs"
                onClick={() => navigate(-1)}
              >
                <ArrowLeft className="w-5 h-5" />
                Kembali
              </Button>

              <Button
                variant="ghost"
                className="flex flex-col items-center gap-1 text-xs"
                onClick={() => navigate("/")}
              >
                <Home className="w-5 h-5" />
                Utama
              </Button>

              <Button
                variant="ghost"
                className="flex flex-col items-center gap-1 text-xs"
                onClick={() => window.location.reload()}
              >
                <RefreshCw className="w-5 h-5" />
                Refresh
              </Button>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
