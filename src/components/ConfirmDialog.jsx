import React from 'react';
import { translate } from '@/utils/translations';
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
}) {

  if (!isDelete && !description) {
    throw new Error("ConfirmDialog: description is required when isDelete is false");
  }

  const finalDescription = description ?? (isDelete 
    ? `${translate('Are you sure to delete')} ${itemToDelete}? ${translate('This action cannot be undone')}`
    : ''
  );

  const finalConfirmText = isDelete ? translate('Delete') : (confirmText ?? translate('Yes'));

  return (
    <AlertDialog open={open} onOpenChange={onOpenChange}>
      <AlertDialogContent>
        <AlertDialogHeader>
          <AlertDialogTitle>{title}</AlertDialogTitle>
          <AlertDialogDescription>{finalDescription}</AlertDialogDescription>
        </AlertDialogHeader>
        <AlertDialogFooter>
          <AlertDialogCancel>{cancelText}</AlertDialogCancel>
          <AlertDialogAction 
            onClick={onConfirm}
            className={variant === "destructive" || isDelete ? "bg-red-600 hover:bg-red-700" : ""}
          >
            {finalConfirmText}
          </AlertDialogAction>
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>
  );
}