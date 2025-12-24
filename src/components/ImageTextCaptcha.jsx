import React, { useState, useEffect, useRef } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { RefreshCw } from 'lucide-react';

export default function ImageTextCaptcha({ open, onOpenChange, onVerified, onFailed }) {
  const [captchaText, setCaptchaText] = useState('');
  const [userInput, setUserInput] = useState('');
  const [attempts, setAttempts] = useState(0);
  const canvasRef = useRef(null);

  useEffect(() => {
    if (open) {
      generateCaptcha();
      setUserInput('');
      setAttempts(0);
    }
  }, [open]);

  const generateCaptcha = () => {
    const chars = 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789';
    let text = '';
    for (let i = 0; i < 6; i++) {
      text += chars.charAt(Math.floor(Math.random() * chars.length));
    }
    setCaptchaText(text);
    drawCaptcha(text);
  };

  const drawCaptcha = (text) => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const ctx = canvas.getContext('2d');
    ctx.clearRect(0, 0, canvas.width, canvas.height);

    // Background
    ctx.fillStyle = '#f3f4f6';
    ctx.fillRect(0, 0, canvas.width, canvas.height);

    // Add noise lines
    for (let i = 0; i < 5; i++) {
      ctx.strokeStyle = `rgba(${Math.random() * 255}, ${Math.random() * 255}, ${Math.random() * 255}, 0.3)`;
      ctx.beginPath();
      ctx.moveTo(Math.random() * canvas.width, Math.random() * canvas.height);
      ctx.lineTo(Math.random() * canvas.width, Math.random() * canvas.height);
      ctx.stroke();
    }

    // Draw text with random positioning and rotation
    ctx.font = 'bold 32px Arial';
    const letterSpacing = 35;
    for (let i = 0; i < text.length; i++) {
      ctx.save();
      const x = 20 + i * letterSpacing + Math.random() * 10;
      const y = 40 + Math.random() * 10;
      const rotation = (Math.random() - 0.5) * 0.4;
      
      ctx.translate(x, y);
      ctx.rotate(rotation);
      ctx.fillStyle = `rgb(${Math.random() * 100}, ${Math.random() * 100}, ${Math.random() * 100})`;
      ctx.fillText(text[i], 0, 0);
      ctx.restore();
    }

    // Add noise dots
    for (let i = 0; i < 50; i++) {
      ctx.fillStyle = `rgba(0, 0, 0, ${Math.random() * 0.3})`;
      ctx.fillRect(Math.random() * canvas.width, Math.random() * canvas.height, 2, 2);
    }
  };

  const handleVerify = () => {
    if (userInput.toUpperCase() === captchaText) {
      onVerified();
      onOpenChange(false);
    } else {
      setAttempts(prev => prev + 1);
      if (attempts >= 2) {
        onFailed();
        onOpenChange(false);
      } else {
        generateCaptcha();
        setUserInput('');
      }
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-md">
        <DialogHeader>
          <DialogTitle>Pengesahan Captcha</DialogTitle>
        </DialogHeader>

        <div className="space-y-4">
          <div className="flex items-center gap-2">
            <canvas
              ref={canvasRef}
              width={240}
              height={80}
              className="border-2 border-gray-300 rounded-lg"
            />
            <Button
              type="button"
              variant="ghost"
              size="icon"
              onClick={generateCaptcha}
            >
              <RefreshCw className="w-5 h-5" />
            </Button>
          </div>

          {attempts > 0 && (
            <p className="text-sm text-red-500">
              Captcha tidak betul. Cubaan: {attempts}/3
            </p>
          )}

          <div>
            <Label htmlFor="captcha-input">Masukkan teks di atas</Label>
            <Input
              id="captcha-input"
              value={userInput}
              onChange={(e) => setUserInput(e.target.value)}
              placeholder="Masukkan captcha"
              className="uppercase"
              maxLength={6}
              onKeyDown={(e) => {
                if (e.key === 'Enter') {
                  handleVerify();
                }
              }}
            />
          </div>
        </div>

        <DialogFooter>
          <Button
            type="button"
            variant="outline"
            onClick={() => onOpenChange(false)}
          >
            Batal
          </Button>
          <Button
            type="button"
            onClick={handleVerify}
            disabled={userInput.length !== 6}
          >
            Sahkan
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}