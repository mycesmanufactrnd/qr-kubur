import { useRef, useState } from 'react';
import { Loader2 } from 'lucide-react';
import { translate } from '@/utils/translations';

const THRESHOLD = 72;
const MAX_PULL = 120;

export default function PullToRefresh({
  children,
  onRefresh,
  disabled = false,
  className = '',
}) {
  const [pullDistance, setPullDistance] = useState(0);
  const [isPulling, setIsPulling] = useState(false);
  const [isRefreshing, setIsRefreshing] = useState(false);

  const startYRef = useRef(0);
  const canPullRef = useRef(false);

  const resetPull = () => {
    canPullRef.current = false;
    setIsPulling(false);
    setPullDistance(0);
  };

  const handleTouchStart = (e) => {
    if (disabled || isRefreshing) return;
    if (window.scrollY > 0) return;

    startYRef.current = e.touches[0].clientY;
    canPullRef.current = true;
  };

  const handleTouchMove = (e) => {
    if (!canPullRef.current || disabled || isRefreshing) return;

    const currentY = e.touches[0].clientY;
    const deltaY = currentY - startYRef.current;

    if (deltaY <= 0) {
      resetPull();
      return;
    }

    const resisted = Math.min(deltaY * 0.45, MAX_PULL);
    setIsPulling(true);
    setPullDistance(resisted);

    if (e.cancelable) e.preventDefault();
  };

  const runRefresh = async () => {
    setIsRefreshing(true);
    setPullDistance(44);

    try {
      await onRefresh?.();
    } finally {
      setIsRefreshing(false);
      resetPull();
    }
  };

  const handleTouchEnd = async () => {
    if (!canPullRef.current || disabled || isRefreshing) return;

    if (pullDistance >= THRESHOLD) {
      await runRefresh();
      return;
    }

    resetPull();
  };

  const shouldShowIndicator = isRefreshing || pullDistance > 0;
  const isReleaseReady = pullDistance >= THRESHOLD;
  const shouldTranslate = isPulling || isRefreshing || pullDistance > 0;

  let statusLabel = translate('Pull To Refresh');
  if (isRefreshing) statusLabel = translate('Refreshing...');
  else if (isReleaseReady) statusLabel = translate('Release To Refresh');

  return (
    <div
      className={`relative ${className}`}
      onTouchStart={handleTouchStart}
      onTouchMove={handleTouchMove}
      onTouchEnd={handleTouchEnd}
      onTouchCancel={handleTouchEnd}
    >
      <div
        className="fixed left-0 right-0 z-[200] flex justify-center pointer-events-none"
        style={{ top: 'max(env(safe-area-inset-top), 30px)' }}
      >
        <div
          className={`inline-flex items-center gap-2 rounded-full border border-slate-200 bg-white/95 px-3 py-1.5 text-xs font-medium text-slate-600 shadow-sm transition-opacity ${
            shouldShowIndicator ? 'opacity-100' : 'opacity-0'
          }`}
        >
          <Loader2 className={`w-3.5 h-3.5 ${isRefreshing ? 'animate-spin' : ''}`} />
          <span>{statusLabel}</span>
        </div>
      </div>

      <div
        className={`transition-transform ${isPulling || isRefreshing ? 'duration-0' : 'duration-200'} ease-out`}
        style={shouldTranslate ? { transform: `translateY(${pullDistance}px)` } : undefined}
      >
        {children}
      </div>
    </div>
  );
}
