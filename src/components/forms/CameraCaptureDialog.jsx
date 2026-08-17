// @ts-nocheck
import { useEffect, useRef, useState } from "react";
import { Capacitor } from "@capacitor/core";
import { Camera as CameraIcon } from "lucide-react";
import { Camera, CameraResultType, CameraSource } from "@capacitor/camera";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { translate } from "@/utils/translations";

const isNative = Capacitor.isNativePlatform();

export default function CameraCaptureDialog({ open, onOpenChange, onCapture }) {
  const videoRef = useRef(null);
  const streamRef = useRef(null);
  const [starting, setStarting] = useState(false);
  const [captureError, setCaptureError] = useState(false);

  // Native platforms: hand off straight to the OS camera app via Capacitor.
  useEffect(() => {
    if (!open || !isNative) return;
    let cancelled = false;

    (async () => {
      try {
        const photo = await Camera.getPhoto({
          quality: 80,
          allowEditing: false,
          resultType: CameraResultType.Uri,
          source: CameraSource.Camera,
        });
        if (cancelled) return;

        const res = await fetch(photo.webPath);
        const blob = await res.blob();
        const file = new File(
          [blob],
          `capture-${Date.now()}.${photo.format || "jpeg"}`,
          { type: blob.type || `image/${photo.format || "jpeg"}` },
        );
        onCapture(file);
      } catch {
        // user cancelled the native camera — nothing to report
      } finally {
        if (!cancelled) onOpenChange(false);
      }
    })();

    return () => {
      cancelled = true;
    };
  }, [open]);

  // Web/desktop: show a live preview via getUserMedia and let the user capture a frame.
  useEffect(() => {
    if (!open || isNative) return;
    let cancelled = false;
    setStarting(true);
    setCaptureError(false);

    navigator.mediaDevices
      .getUserMedia({ video: { facingMode: "environment" }, audio: false })
      .catch(() => navigator.mediaDevices.getUserMedia({ video: true, audio: false }))
      .then((stream) => {
        if (cancelled) {
          stream.getTracks().forEach((t) => t.stop());
          return;
        }
        streamRef.current = stream;
        if (videoRef.current) videoRef.current.srcObject = stream;
      })
      .catch(() => {
        if (!cancelled) setCaptureError(true);
      })
      .finally(() => {
        if (!cancelled) setStarting(false);
      });

    return () => {
      cancelled = true;
      streamRef.current?.getTracks().forEach((t) => t.stop());
      streamRef.current = null;
    };
  }, [open]);

  const handleCapture = () => {
    const video = videoRef.current;
    if (!video || !video.videoWidth) return;

    const canvas = document.createElement("canvas");
    canvas.width = video.videoWidth;
    canvas.height = video.videoHeight;
    canvas.getContext("2d").drawImage(video, 0, 0, canvas.width, canvas.height);

    canvas.toBlob(
      (blob) => {
        if (!blob) return;
        const file = new File([blob], `capture-${Date.now()}.jpg`, {
          type: "image/jpeg",
        });
        onCapture(file);
        onOpenChange(false);
      },
      "image/jpeg",
      0.9,
    );
  };

  if (isNative) return null;

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-md dark:bg-slate-800">
        <DialogHeader>
          <DialogTitle>{translate("Take Photo")}</DialogTitle>
        </DialogHeader>

        {captureError ? (
          <p className="text-sm text-red-500 py-6 text-center">
            {translate("Camera not available. Please check permissions.")}
          </p>
        ) : (
          <div className="relative rounded-lg overflow-hidden bg-black aspect-video">
            <video
              ref={videoRef}
              autoPlay
              playsInline
              muted
              className="w-full h-full object-cover"
            />
            {starting && (
              <div className="absolute inset-0 flex items-center justify-center text-white text-sm">
                {translate("Starting camera...")}
              </div>
            )}
          </div>
        )}

        <DialogFooter>
          <Button
            type="button"
            variant="outline"
            onClick={() => onOpenChange(false)}
          >
            {translate("Cancel")}
          </Button>
          {!captureError && (
            <Button type="button" onClick={handleCapture} disabled={starting}>
              <CameraIcon className="w-4 h-4 mr-2" />
              {translate("Capture")}
            </Button>
          )}
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
