import { useState, useEffect } from "react";

export function useIsNarrow(threshold = 1024) {
  const [isNarrow, setIsNarrow] = useState(() => window.innerWidth < threshold);
  useEffect(() => {
    const mq = window.matchMedia(`(max-width: ${threshold - 1}px)`);
    const handler = (e) => setIsNarrow(e.matches);
    mq.addEventListener("change", handler);
    return () => mq.removeEventListener("change", handler);
  }, [threshold]);
  return isNarrow;
}
