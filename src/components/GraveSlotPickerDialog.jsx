// @ts-nocheck
import { useState } from "react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { MapPin, ImageOff, LayoutGrid } from "lucide-react";
import GraveSlotMap from "@/components/GraveSlotMap";
import {
  useGetGraveBlocks,
  useGetGraveSlotOptions,
} from "@/mutations/useGraveMappingMutations";
import { useGetGraveById } from "@/mutations/useGraveMutations";
import { resolveFileUrl, createPageUrl } from "@/utils";
import { translate } from "@/utils/translations";
import { Link } from "react-router-dom";

export default function GraveSlotPickerDialog({
  open,
  onOpenChange,
  graveId,
  currentDeadPersonId,
  onPick,
  isMobile = false,
}) {
  const [warning, setWarning] = useState("");

  const { data: grave } = useGetGraveById(graveId ? Number(graveId) : null);
  const { data: blocks = [], isLoading } = useGetGraveBlocks(graveId);
  useGetGraveSlotOptions(graveId);

  const photoUrl = grave?.gravemappingphotourl
    ? resolveFileUrl(grave.gravemappingphotourl, "bucket-grave-mapping")
    : null;

  const handleSlotClick = (slot) => {
    if (
      slot.deadperson &&
      slot.deadperson.id !== currentDeadPersonId
    ) {
      setWarning(
        `${translate("This slot is already occupied by")} ${slot.deadperson.name}`,
      );
      return;
    }
    setWarning("");
    onPick?.(slot);
    onOpenChange?.(false);
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent
        className={
          isMobile
            ? "w-[95vw] sm:max-w-2xl max-h-[85vh] overflow-y-auto rounded-2xl"
            : "max-w-3xl max-h-[85vh] overflow-y-auto rounded-2xl"
        }
      >
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <MapPin className="w-4.5 h-4.5 text-emerald-600" />
            {translate("Choose Grave Slot")}
          </DialogTitle>
        </DialogHeader>

        {!graveId ? (
          <p className="text-sm text-slate-500 dark:text-slate-400">
            {translate("Please select a cemetery first.")}
          </p>
        ) : isLoading ? (
          <p className="text-sm text-slate-500 dark:text-slate-400">
            {translate("Loading...")}
          </p>
        ) : !photoUrl ? (
          <div className="flex flex-col items-center text-center py-8 px-4">
            <div className="w-14 h-14 rounded-2xl bg-amber-50 dark:bg-amber-900/20 flex items-center justify-center mb-4">
              <ImageOff className="w-6 h-6 text-amber-500" strokeWidth={1.5} />
            </div>
            <p className="text-sm font-semibold text-slate-700 dark:text-slate-200">
              {translate("This cemetery has no aerial photo yet.")}
            </p>
            <p className="text-xs text-slate-400 dark:text-slate-500 mt-1.5 max-w-xs">
              {translate(
                "Upload an aerial photo and set up grave slots first, then come back to pick a lot on the map.",
              )}
            </p>
            <Link
              to={createPageUrl(`ManageGraveMapping?graveId=${graveId}`)}
              className="w-full mt-5"
            >
              <Button type="button" className="w-full">
                <MapPin className="w-4 h-4 mr-1.5" />
                {translate("Set Up Grave Slots")}
              </Button>
            </Link>
          </div>
        ) : blocks.length === 0 ? (
          <div className="flex flex-col items-center text-center py-8 px-4">
            <div className="w-14 h-14 rounded-2xl bg-amber-50 dark:bg-amber-900/20 flex items-center justify-center mb-4">
              <LayoutGrid className="w-6 h-6 text-amber-500" strokeWidth={1.5} />
            </div>
            <p className="text-sm font-semibold text-slate-700 dark:text-slate-200">
              {translate(
                "No grave slots have been set up for this cemetery yet.",
              )}
            </p>
            <p className="text-xs text-slate-400 dark:text-slate-500 mt-1.5 max-w-xs">
              {translate(
                "Draw the cemetery's blocks and slots first, then come back to pick a lot on the map.",
              )}
            </p>
            <Link
              to={createPageUrl(`ManageGraveMapping?graveId=${graveId}`)}
              className="w-full mt-5"
            >
              <Button type="button" className="w-full">
                <MapPin className="w-4 h-4 mr-1.5" />
                {translate("Set Up Grave Slots")}
              </Button>
            </Link>
          </div>
        ) : (
          <div className="space-y-3">
            <div className="flex flex-wrap items-center gap-3 text-xs text-slate-500 dark:text-slate-400">
              <span className="flex items-center gap-1.5">
                <span className="w-3 h-3 rounded-sm bg-emerald-500/40 border border-emerald-500" />
                {translate("Available")}
              </span>
              <span className="flex items-center gap-1.5">
                <span className="w-3 h-3 rounded-sm bg-rose-500/40 border border-rose-500" />
                {translate("Occupied")}
              </span>
            </div>
            {warning && (
              <p className="text-xs text-rose-600 dark:text-rose-400">
                {warning}
              </p>
            )}
            <GraveSlotMap blocks={blocks} photoUrl={photoUrl} onSlotClick={handleSlotClick} />
          </div>
        )}
      </DialogContent>
    </Dialog>
  );
}
