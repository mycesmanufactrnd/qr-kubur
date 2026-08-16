// @ts-nocheck
import { useEffect, useRef, useState } from "react";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";
import { MapPin } from "lucide-react";
import GraveSlotPickerDialog from "@/components/GraveSlotPickerDialog";
import { translate } from "@/utils/translations";

export default function GraveLotPickerField({
  graveId,
  gravelotLabel,
  currentDeadPersonId,
  onPick,
  isMobile = false,
  required = false,
}) {
  const [open, setOpen] = useState(false);

  // A previously-picked slot belongs to whichever cemetery was selected at
  // the time — if the admin switches to a different cemetery afterwards,
  // that slot no longer applies, so clear it (skip the very first render,
  // which just reflects the record's already-saved grave/slot).
  const prevGraveIdRef = useRef(graveId);
  useEffect(() => {
    const prevGraveId = prevGraveIdRef.current;
    prevGraveIdRef.current = graveId;
    if (prevGraveId != null && graveId !== prevGraveId) {
      onPick?.(null);
    }
  }, [graveId]);

  return (
    <div className="space-y-1.5">
      <Label className="text-sm">
        {translate("Grave Lot")}
        {required && <span className="text-red-500 ml-1">*</span>}
      </Label>
      <div className="flex items-center gap-2">
        <div className="flex-1 h-9 px-3 flex items-center rounded-md border border-input bg-slate-50 dark:bg-slate-800 dark:border-slate-600 text-sm text-slate-700 dark:text-slate-300 truncate">
          {gravelotLabel || (
            <span className="text-slate-400">
              {translate("No slot selected")}
            </span>
          )}
        </div>
        <Button
          type="button"
          variant="outline"
          disabled={!graveId}
          onClick={() => setOpen(true)}
          className="shrink-0"
        >
          <MapPin className="w-4 h-4 mr-1.5" />
          {translate("Pick on Map")}
        </Button>
      </div>

      <GraveSlotPickerDialog
        open={open}
        onOpenChange={setOpen}
        graveId={graveId}
        currentDeadPersonId={currentDeadPersonId}
        onPick={onPick}
        isMobile={isMobile}
      />
    </div>
  );
}
