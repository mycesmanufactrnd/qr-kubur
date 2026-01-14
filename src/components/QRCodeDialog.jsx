import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { QRCodeCanvas } from "qrcode.react";

export default function QRCodeDialog({ open, onOpenChange, data }) {
  if (!data) return null;

  const qrValue = JSON.stringify({
    type: data.type,
    id: data.id,
  });

  const downloadQR = () => {
    const canvas = document.getElementById("qr-canvas");
    const pngUrl = canvas
      .toDataURL("image/png")
      .replace("image/png", "image/octet-stream");

    const link = document.createElement("a");
    link.href = pngUrl;
    link.download = `qr-${data.type}-${data.id}.png`;
    link.click();
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-sm text-center">
        <DialogHeader>
          <DialogTitle>Kod QR</DialogTitle>
        </DialogHeader>

        <div className="flex justify-center py-4">
          <QRCodeCanvas
            id="qr-canvas"
            value={qrValue}
            size={220}
          />
        </div>

        <DialogFooter className="flex justify-between">
          <Button variant="outline" onClick={() => onOpenChange(false)}>
            Tutup
          </Button>
          <Button onClick={downloadQR}>
            Muat Turun
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
