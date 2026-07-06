// @ts-nocheck
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";

export default function FilePreviewDialog({
  open,
  onClose,
  src,
  isPdf,
  title = "Pratonton Fail",
}) {
  return (
    <Dialog
      open={open}
      onOpenChange={(v) => {
        if (!v) onClose();
      }}
    >
      <DialogContent className="max-w-[80vw] max-h-[90vh] overflow-y-auto dark:bg-slate-800">
        <DialogHeader>
          <DialogTitle>{title}</DialogTitle>
        </DialogHeader>
        {src &&
          (isPdf ? (
            <iframe src={src} title={title} className="w-full h-[75vh] rounded border" />
          ) : (
            <img
              src={src}
              alt={title}
              referrerPolicy={
                !src.startsWith("blob:") &&
                !src.startsWith("data:") &&
                !src.startsWith("/")
                  ? "no-referrer"
                  : undefined
              }
              className="max-h-[75vh] w-auto max-w-full mx-auto rounded"
            />
          ))}
      </DialogContent>
    </Dialog>
  );
}
