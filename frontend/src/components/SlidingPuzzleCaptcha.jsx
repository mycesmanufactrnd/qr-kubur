import React, { useState, useEffect, useRef } from 'react';
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { RefreshCw, CheckCircle } from 'lucide-react';

export default function SlidingPuzzleCaptcha({ onVerified }) {
  const [sliderPosition, setSliderPosition] = useState(0);
  const [isDragging, setIsDragging] = useState(false);
  const [targetPosition, setTargetPosition] = useState(0);
  const [isVerified, setIsVerified] = useState(false);
  const [attempts, setAttempts] = useState(0);
  const containerRef = useRef(null);
  const maxPosition = 260; // Container width - slider width

  useEffect(() => {
    generateNewPuzzle();
  }, []);

  const generateNewPuzzle = () => {
    const newTarget = Math.random() * (maxPosition - 40) + 20;
    setTargetPosition(newTarget);
    setSliderPosition(0);
    setIsVerified(false);
    setAttempts(0);
  };

  const handleMouseDown = () => {
    if (!isVerified) {
      setIsDragging(true);
    }
  };

  const handleMouseMove = (e) => {
    if (!isDragging || isVerified) return;

    const container = containerRef.current;
    if (!container) return;

    const rect = container.getBoundingClientRect();
    let newPosition = e.clientX - rect.left - 20;
    newPosition = Math.max(0, Math.min(newPosition, maxPosition));
    setSliderPosition(newPosition);
  };

  const handleTouchMove = (e) => {
    if (!isDragging || isVerified) return;

    const container = containerRef.current;
    if (!container) return;

    const rect = container.getBoundingClientRect();
    let newPosition = e.touches[0].clientX - rect.left - 20;
    newPosition = Math.max(0, Math.min(newPosition, maxPosition));
    setSliderPosition(newPosition);
  };

  const handleMouseUp = () => {
    if (!isDragging) return;
    setIsDragging(false);

    const tolerance = 10;
    if (Math.abs(sliderPosition - targetPosition) < tolerance) {
      setIsVerified(true);
      setSliderPosition(targetPosition);
      onVerified(true);
    } else {
      setAttempts(prev => prev + 1);
      setTimeout(() => {
        setSliderPosition(0);
      }, 500);
    }
  };

  useEffect(() => {
    if (isDragging) {
      window.addEventListener('mousemove', handleMouseMove);
      window.addEventListener('mouseup', handleMouseUp);
      window.addEventListener('touchmove', handleTouchMove);
      window.addEventListener('touchend', handleMouseUp);
      return () => {
        window.removeEventListener('mousemove', handleMouseMove);
        window.removeEventListener('mouseup', handleMouseUp);
        window.removeEventListener('touchmove', handleTouchMove);
        window.removeEventListener('touchend', handleMouseUp);
      };
    }
  }, [isDragging, sliderPosition]);

  return (
    <Card className="p-4 bg-gray-50 dark:bg-gray-800">
      <div className="space-y-3">
        <div className="flex items-center justify-between">
          <p className="text-sm font-medium dark:text-gray-300">
            {isVerified ? 'Pengesahan Berjaya!' : 'Sila geser kepada sasaran'}
          </p>
          {!isVerified && (
            <Button
              type="button"
              variant="ghost"
              size="sm"
              onClick={generateNewPuzzle}
              className="h-7 px-2"
            >
              <RefreshCw className="w-4 h-4" />
            </Button>
          )}
        </div>

        {attempts > 0 && !isVerified && (
          <p className="text-xs text-red-500">Cubaan: {attempts}/3</p>
        )}

        <div
          ref={containerRef}
          className="relative h-12 bg-white dark:bg-gray-700 rounded-lg border-2 border-gray-300 dark:border-gray-600 overflow-hidden"
        >
          {/* Target zone */}
          <div
            className="absolute top-0 bottom-0 w-10 bg-emerald-100 dark:bg-emerald-900/30 border-2 border-dashed border-emerald-500"
            style={{ left: `${targetPosition}px` }}
          />

          {/* Slider */}
          <div
            className={`absolute top-0 bottom-0 w-10 rounded-lg flex items-center justify-center cursor-grab active:cursor-grabbing transition-colors ${
              isVerified 
                ? 'bg-emerald-500' 
                : isDragging 
                ? 'bg-blue-500' 
                : 'bg-blue-400'
            }`}
            style={{ left: `${sliderPosition}px` }}
            onMouseDown={handleMouseDown}
            onTouchStart={handleMouseDown}
          >
            {isVerified ? (
              <CheckCircle className="w-5 h-5 text-white" />
            ) : (
              <div className="flex gap-0.5">
                <div className="w-0.5 h-3 bg-white rounded" />
                <div className="w-0.5 h-3 bg-white rounded" />
                <div className="w-0.5 h-3 bg-white rounded" />
              </div>
            )}
          </div>
        </div>

        <p className="text-xs text-gray-500 dark:text-gray-400 text-center">
          {isVerified ? '✓ Pengesahan selesai' : 'Geser kotak biru ke zon hijau'}
        </p>
      </div>
    </Card>
  );
}