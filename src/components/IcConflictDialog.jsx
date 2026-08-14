// @ts-nocheck
import { useEffect, useState } from "react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import { AlertTriangle, Repeat, UserCog } from "lucide-react";
import { translate } from "@/utils/translations";

export default function IcConflictDialog({
  open,
  onOpenChange,
  conflict,
  onReplace,
  onChangeIc,
  isSubmitting = false,
  isMobile = false,
}) {
  const [mode, setMode] = useState("choose");
  const [newIc, setNewIc] = useState("");

  useEffect(() => {
    if (open) {
      setMode("choose");
      setNewIc(conflict?.icnumber ?? "");
    }
  }, [open, conflict?.icnumber]);

  if (!conflict) return null;

  const cleanedNewIc = newIc.replace(/-/g, "").trim();

  const handleContinueWithNewIc = () => {
    if (!cleanedNewIc || cleanedNewIc === conflict.icnumber) return;
    onChangeIc?.(cleanedNewIc);
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent
        className={
          isMobile
            ? "w-[95vw] sm:max-w-md rounded-2xl"
            : "max-w-md rounded-2xl"
        }
      >
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2 text-amber-600">
            <AlertTriangle className="w-4.5 h-4.5" />
            {translate("IC Number Already Registered")}
          </DialogTitle>
        </DialogHeader>

        <div className="space-y-3 text-sm">
          <p className="text-slate-600 dark:text-slate-300">
            {translate(
              "A member with this IC number already exists in the database, but with a different name.",
            )}
          </p>

          <div className="rounded-xl border border-slate-200 dark:border-slate-700 p-3 space-y-1">
            <p className="text-[11px] font-semibold uppercase tracking-wider text-slate-400">
              {translate("Already in Database")}
            </p>
            <p className="font-medium text-slate-800 dark:text-slate-100">
              {conflict.existingMember?.fullname}
            </p>
            <p className="text-xs text-slate-500 dark:text-slate-400">
              {conflict.existingMember?.icnumber}
            </p>
          </div>

          <div className="rounded-xl border border-emerald-200 dark:border-emerald-800 bg-emerald-50 dark:bg-emerald-900/20 p-3 space-y-1">
            <p className="text-[11px] font-semibold uppercase tracking-wider text-emerald-600">
              {translate("Incoming Funeral Case")}
            </p>
            <p className="font-medium text-slate-800 dark:text-slate-100">
              {conflict.incomingFullname}
            </p>
            <p className="text-xs text-slate-500 dark:text-slate-400">
              {conflict.icnumber}
            </p>
          </div>

          {mode === "changeIc" && (
            <div className="space-y-1.5 pt-1">
              <Label className="text-xs">
                {translate("Correct IC Number")}
              </Label>
              <Input
                value={newIc}
                onChange={(e) => setNewIc(e.target.value)}
                placeholder={translate("Enter IC number")}
              />
            </div>
          )}
        </div>

        <DialogFooter
          className={
            isMobile
              ? "flex flex-col gap-2"
              : "flex flex-col sm:flex-row gap-2"
          }
        >
          {mode === "choose" ? (
            <>
              <Button
                type="button"
                variant="outline"
                onClick={() => onOpenChange?.(false)}
                disabled={isSubmitting}
                className="w-full sm:w-auto"
              >
                {translate("Close")}
              </Button>
              <Button
                type="button"
                variant="outline"
                onClick={() => setMode("changeIc")}
                disabled={isSubmitting}
                className="w-full sm:w-auto"
              >
                <UserCog className="w-4 h-4 mr-1.5" />
                {translate("Different Person — Fix IC Number")}
              </Button>
              <Button
                type="button"
                onClick={onReplace}
                disabled={isSubmitting}
                className="w-full sm:w-auto bg-amber-600 hover:bg-amber-700 text-white"
              >
                <Repeat className="w-4 h-4 mr-1.5" />
                {isSubmitting
                  ? translate("Saving...")
                  : translate("Replace Existing Record")}
              </Button>
            </>
          ) : (
            <>
              <Button
                type="button"
                variant="outline"
                onClick={() => setMode("choose")}
                disabled={isSubmitting}
                className="w-full sm:w-auto"
              >
                {translate("Back")}
              </Button>
              <Button
                type="button"
                onClick={handleContinueWithNewIc}
                disabled={isSubmitting || !cleanedNewIc}
                className="w-full sm:w-auto bg-emerald-600 hover:bg-emerald-700 text-white"
              >
                {isSubmitting ? translate("Saving...") : translate("Continue")}
              </Button>
            </>
          )}
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
