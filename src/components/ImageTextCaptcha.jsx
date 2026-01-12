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
      const id = setTimeout(() => {
        generateCaptcha();
        setUserInput('');
        setAttempts(0);
      }, 0);
      return () => clearTimeout(id);
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
      <DialogContent className="max-w-md p-6 sm:p-8">
        <DialogHeader className="space-y-2 pb-4">
          <DialogTitle className="text-2xl font-bold text-center bg-gradient-to-r from-emerald-600 to-teal-600 bg-clip-text text-transparent">
            Pengesahan Captcha
          </DialogTitle>
          <p className="text-sm text-gray-500 text-center">
            Sila masukkan teks yang tertera untuk meneruskan
          </p>
        </DialogHeader>

        <div className="space-y-6 py-4">
          <div className="flex items-center justify-center gap-3 bg-gradient-to-br from-gray-50 to-gray-100 dark:from-gray-800 dark:to-gray-700 p-4 rounded-xl">
            <canvas
              ref={canvasRef}
              width={240}
              height={80}
              className="border-2 border-gray-300 dark:border-gray-600 rounded-lg shadow-sm bg-white"
            />
            <Button
              type="button"
              variant="ghost"
              size="icon"
              onClick={generateCaptcha}
              className="hover:bg-white/50 dark:hover:bg-gray-600"
              title="Tukar captcha"
            >
              <RefreshCw className="w-5 h-5 text-gray-600 dark:text-gray-300" />
            </Button>
          </div>

          {attempts > 0 && (
            <div className="bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-lg p-3">
              <p className="text-sm text-red-600 dark:text-red-400 text-center font-medium">
                ❌ Captcha tidak betul. Cubaan: {attempts}/3
              </p>
            </div>
          )}

          <div className="space-y-2">
            <Label htmlFor="captcha-input" className="text-base font-medium">
              Masukkan teks di atas
            </Label>
            <Input
              id="captcha-input"
              value={userInput}
              onChange={(e) => setUserInput(e.target.value)}
              placeholder="Masukkan 6 aksara"
              className="uppercase text-center text-lg tracking-wider h-12 font-semibold"
              maxLength={6}
              onKeyDown={(e) => {
                if (e.key === 'Enter') {
                  handleVerify();
                }
              }}
              autoFocus
            />
            <p className="text-xs text-gray-500 text-center">
              Huruf besar dan kecil tidak sensitif
            </p>
          </div>
        </div>

        <DialogFooter className="gap-3 pt-4">
          <Button
            type="button"
            variant="outline"
            onClick={() => onOpenChange(false)}
            className="flex-1"
          >
            Batal
          </Button>
          <Button
            type="button"
            onClick={handleVerify}
            disabled={userInput.length !== 6}
            className="flex-1 bg-gradient-to-r from-emerald-500 to-teal-600 hover:from-emerald-600 hover:to-teal-700"
          >
            Sahkan
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}