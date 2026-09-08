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
  fileInputId,
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
          {/*
            A <label> directly wired to the hidden file input via htmlFor —
            the browser opens the native file/gallery chooser as the direct
            result of this click, in the same gesture. Closing this dialog
            via onSelectFile is just a state update alongside it, not a
            prerequisite — so there's no race with Radix's ~200ms dialog
            close animation like a JS-triggered input.click() from a
            separate callback would have.
          */}
          <label
            htmlFor={fileInputId}
            onClick={onSelectFile}
            className="flex items-center gap-3 rounded-lg border border-slate-200 dark:border-slate-600 px-4 py-3 text-sm font-medium text-slate-700 dark:text-slate-200 hover:bg-slate-50 dark:hover:bg-slate-700 active:opacity-70 cursor-pointer"
          >
            <FolderOpen className="w-5 h-5 text-blue-600 dark:text-blue-400" />
            {translate("Choose File")}
          </label>
        </div>
      </DialogContent>
    </Dialog>
  );
}
