import React, { useEffect, useState } from 'react';
import { translate } from '@/utils/translations';
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
  cancelText = translate('Cancel'),
  variant = "default",
  isDelete = false,
  itemToDelete = null,
  showReasonInput = false,
  reasonLabel = translate('Reason (optional)'),
  reasonPlaceholder = translate('Add a note (optional)'),
}) {
  const [reason, setReason] = useState('');

  if (!isDelete && !description) {
    throw new Error("ConfirmDialog: description is required when isDelete is false");
  }

  const finalDescription = description ?? (isDelete 
    ? `${translate('Are you sure to delete')} ${itemToDelete}? ${translate('This action cannot be undone')}`
    : ''
  );

  const finalConfirmText = isDelete ? translate('Delete') : (confirmText ?? translate('Yes'));

  useEffect(() => {
    if (!open) {
      setReason('');
    }
  }, [open]);

  const handleOpenChange = (nextOpen) => {
    if (!nextOpen) {
      setReason('');
    }
    onOpenChange?.(nextOpen);
  };

  const handleConfirm = () => {
    if (showReasonInput) {
      onConfirm?.(reason.trim() || null);
    } else {
      onConfirm?.();
    }
    setReason('');
  };

  return (
    <AlertDialog open={open} onOpenChange={handleOpenChange}>
      <AlertDialogContent>
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
        <AlertDialogFooter>
          <AlertDialogCancel>{cancelText}</AlertDialogCancel>
          <AlertDialogAction 
            onClick={handleConfirm}
            className={variant === "destructive" || isDelete ? "bg-red-600 hover:bg-red-700" : ""}
          >
            {finalConfirmText}
          </AlertDialogAction>
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>
  );
}
