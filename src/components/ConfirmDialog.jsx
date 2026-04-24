import React, { useEffect, useState } from "react";
import { translate } from "@/utils/translations";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";

export default function ConfirmDialog({
  open,
  onOpenChange,
  title = "Pengesahan",
  description,
  onConfirm,
  confirmText,
  cancelText = translate("Cancel"),
  variant = "default",
  isDelete = false,
  itemToDelete = null,
  showReasonInput = false,
  reasonLabel = translate("Reason (optional)"),
  reasonPlaceholder = translate("Add a note (optional)"),
  isMobile = false,
}) {
  const [reason, setReason] = useState("");

  if (!isDelete && !description) {
    throw new Error(
      "ConfirmDialog: description is required when isDelete is false",
    );
  }

  const finalDescription =
    description ??
    (isDelete
      ? `${translate("Are you sure to delete")} ${itemToDelete}? ${translate("This action cannot be undone")}`
      : "");

  const finalConfirmText = isDelete
    ? translate("Delete")
    : (confirmText ?? translate("Yes"));

  useEffect(() => {
    if (!open) {
      setReason("");
    }
  }, [open]);

  const handleOpenChange = (nextOpen) => {
    if (!nextOpen) {
      setReason("");
    }
    onOpenChange?.(nextOpen);
  };

  const handleConfirm = () => {
    if (showReasonInput) {
      onConfirm?.(reason.trim() || null);
    } else {
      onConfirm?.();
    }
    setReason("");
  };

  return (
    <AlertDialog open={open} onOpenChange={handleOpenChange}>
      <AlertDialogContent
        className={
          isMobile
            ? "w-[95vw] sm:max-w-2xl max-h-[80vh] overflow-y-auto rounded-2xl"
            : "rounded-2xl"
        }
      >
        <AlertDialogHeader>
          <AlertDialogTitle>{title}</AlertDialogTitle>
          <AlertDialogDescription>{finalDescription}</AlertDialogDescription>
        </AlertDialogHeader>
        {showReasonInput && (
          <div className="space-y-2">
            <Label>{reasonLabel}</Label>
            <Textarea
              value={reason}
              onChange={(e) => setReason(e.target.value)}
              placeholder={reasonPlaceholder}
            />
          </div>
        )}
        <AlertDialogFooter
          className={isMobile ? "flex flex-row gap-2" : undefined}
        >
          <AlertDialogCancel
            className={[
              isMobile
                ? "flex-1 mt-0 text-red-600 border-red-200 hover:bg-red-50"
                : "text-red-600 border-red-200 hover:bg-red-50",
            ]
              .filter(Boolean)
              .join(" ")}
          >
            {cancelText}
          </AlertDialogCancel>

          <AlertDialogAction
            onClick={handleConfirm}
            className={[
              isMobile
                ? "flex-1 bg-emerald-600 hover:bg-emerald-700"
                : "bg-emerald-600 hover:bg-emerald-700",
            ]
              .filter(Boolean)
              .join(" ")}
          >
            {finalConfirmText}
          </AlertDialogAction>
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>
  );
}
