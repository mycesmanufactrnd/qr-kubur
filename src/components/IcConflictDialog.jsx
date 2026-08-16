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
import { formatICNumber, isCompleteICNumber } from "@/utils/helpers";

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
  const hasChangedIc = cleanedNewIc !== conflict.icnumber;
  const canContinue = hasChangedIc && isCompleteICNumber(cleanedNewIc);

  const handleContinueWithNewIc = () => {
    if (!canContinue) return;
    onChangeIc?.(cleanedNewIc);
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent
        className={
          !isMobile ? "w-[95vw] rounded-2xl" : "rounded-2xl"
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
                onChange={(e) => setNewIc(formatICNumber(e.target.value))}
                maxLength={14}
                placeholder={translate("Enter IC number")}
              />
            </div>
          )}
        </div>

        <DialogFooter className="flex flex-col gap-2">
          {mode === "choose" ? (
            <>
              <Button
                type="button"
                onClick={onReplace}
                disabled={isSubmitting}
                className="w-full min-w-0 h-auto py-2.5 whitespace-normal text-center leading-snug bg-amber-600 hover:bg-amber-700 text-white"
              >
                <Repeat className="w-4 h-4 mr-1.5" />
                {isSubmitting
                  ? translate("Saving...")
                  : translate("Replace Existing Record")}
              </Button>
              <Button
                type="button"
                variant="outline"
                onClick={() => setMode("changeIc")}
                disabled={isSubmitting}
                className="w-full min-w-0 h-auto py-2.5 whitespace-normal text-center leading-snug"
              >
                <UserCog className="w-4 h-4 mr-1.5 shrink-0" />
                {translate("Different Person — Fix IC Number")}
              </Button>
            </>
          ) : (
            <>
              {canContinue && (
                <Button
                  type="button"
                  onClick={handleContinueWithNewIc}
                  disabled={isSubmitting}
                  className="w-full min-w-0 h-auto py-2.5 whitespace-normal text-center leading-snug bg-emerald-600 hover:bg-emerald-700 text-white"
                >
                  {isSubmitting
                    ? translate("Saving...")
                    : translate("Continue")}
                </Button>
              )}
              <Button
                type="button"
                variant="outline"
                onClick={() => setMode("choose")}
                disabled={isSubmitting}
                className="w-full min-w-0 h-auto py-2.5 whitespace-normal text-center leading-snug"
              >
                {translate("Back")}
              </Button>
            </>
          )}
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
