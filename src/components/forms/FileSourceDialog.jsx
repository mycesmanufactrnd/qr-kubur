// @ts-nocheck
import { Camera, FolderOpen } from "lucide-react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { translate } from "@/utils/translations";

export default function FileSourceDialog({
  open,
  onOpenChange,
  onSelectCamera,
  onSelectFile,
  allowCamera = true,
}) {
  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-xs dark:bg-slate-800">
        <DialogHeader>
          <DialogTitle>{translate("Add Photo")}</DialogTitle>
        </DialogHeader>
        <div className="flex flex-col gap-2">
          {allowCamera && (
            <button
              type="button"
              onClick={onSelectCamera}
              className="flex items-center gap-3 rounded-lg border border-slate-200 dark:border-slate-600 px-4 py-3 text-sm font-medium text-slate-700 dark:text-slate-200 hover:bg-slate-50 dark:hover:bg-slate-700 active:opacity-70"
            >
              <Camera className="w-5 h-5 text-emerald-600 dark:text-emerald-400" />
              {translate("Take Photo")}
            </button>
          )}
          <button
            type="button"
            onClick={onSelectFile}
            className="flex items-center gap-3 rounded-lg border border-slate-200 dark:border-slate-600 px-4 py-3 text-sm font-medium text-slate-700 dark:text-slate-200 hover:bg-slate-50 dark:hover:bg-slate-700 active:opacity-70"
          >
            <FolderOpen className="w-5 h-5 text-blue-600 dark:text-blue-400" />
            {translate("Choose File")}
          </button>
        </div>
      </DialogContent>
    </Dialog>
  );
}
