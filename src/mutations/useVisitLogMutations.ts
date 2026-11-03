import { trpc } from '@/utils/trpc';

// Silent analytics write (grave/deadperson QR-scan visit log) — no toast, no
// error UI, no cached list anywhere invalidates off it. Callers already
// catch failures locally and only log them to console.
export function useVisitLogMutations() {
  const createVisitLog = trpc.visitLogs.create.useMutation();
  return { createVisitLog };
}
