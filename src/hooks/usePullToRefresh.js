import { useState, useEffect, useRef } from "react";

const THRESHOLD = 72;

export function usePullToRefresh() {
  const [pullY, setPullY] = useState(0);
  const [refreshing, setRefreshing] = useState(false);
  const startYRef = useRef(null);

  useEffect(() => {
    const onStart = (e) => {
      if (window.scrollY > 4) return;
      startYRef.current = e.touches[0].clientY;
    };

    const onMove = (e) => {
      if (startYRef.current === null) return;
      const delta = e.touches[0].clientY - startYRef.current;
      if (delta > 0 && window.scrollY <= 0) {
        setPullY(Math.min(delta * 0.45, THRESHOLD + 16));
      } else {
        setPullY(0);
      }
    };

    const onEnd = () => {
      if (startYRef.current === null) return;
      startYRef.current = null;
      setPullY((y) => {
        if (y >= THRESHOLD) {
          setRefreshing(true);
          sessionStorage.removeItem('user_location');
          setTimeout(() => window.location.reload(), 650);
        }
        return 0;
      });
    };

    document.addEventListener("touchstart", onStart, { passive: true });
    document.addEventListener("touchmove", onMove, { passive: true });
    document.addEventListener("touchend", onEnd, { passive: true });
    return () => {
      document.removeEventListener("touchstart", onStart);
      document.removeEventListener("touchmove", onMove);
      document.removeEventListener("touchend", onEnd);
    };
  }, []);

  return { pullY, refreshing, threshold: THRESHOLD };
}
