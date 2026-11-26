import { useCallback, useEffect, useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { trpc, trpcClient } from '@/utils/trpc';
import { useAdminAccess, getStoredGoogleUser, getGoogleIdToken } from '@/utils/auth';
import { showApiError, showSuccess } from '@/components/ToastrNotification';
import {
  type SavedKariahMembership,
  getSavedKariahMembership,
  saveKariahMembership,
  clearSavedKariahMembership,
} from '@/utils/kariahMembership';

// Kariah registrations (qariahmember table). The death-charity register is
// deathCharityMember — see useDeathCharityMemberMutations.ts.

const titleMessage = 'Kariah Registration';

export type QariahMemberStatus = 'pending' | 'approved' | 'rejected';

type useGetQariahMemberPaginatedParams = {
  page?: number;
  pageSize?: number;
  filterFullName?: string | null;
  filterMosqueId?: number | null;
  filterStatus?: QariahMemberStatus | null;
  enabled?: boolean;
};

// Staff list — scoped server-side to the mosque admin's own organisation.
export function useGetQariahMemberPaginated({
  page = 1,
  pageSize = 20,
  filterFullName,
  filterMosqueId,
  filterStatus,
  enabled = true,
}: useGetQariahMemberPaginatedParams) {
  const { hasAdminAccess } = useAdminAccess();

  const { data, isLoading, isFetching, refetch, error } =
    trpc.qariahMember.getPaginated.useQuery(
      {
        page,
        pageSize,
        filterFullName: filterFullName || null,
        filterMosqueId: filterMosqueId || null,
        filterStatus: filterStatus || null,
      },
      { enabled: hasAdminAccess && enabled },
    );

  const qariahMemberList = { items: data?.items ?? [], total: data?.total ?? 0 };
  const totalPages = Math.ceil(qariahMemberList.total / pageSize);

  return { qariahMemberList, totalPages, isLoading, isFetching, refetch, error };
}

export function useQariahMemberMutations() {
  const trpcUtils = trpc.useUtils();

  const invalidateAll = () => {
    trpcUtils.qariahMember.getPaginated.invalidate();
    trpcUtils.qariahMember.checkStatus.invalidate();
  };

  // Public form — the page shows its own success screen, so no toast here.
  const registerQariahMember = trpc.qariahMember.register.useMutation({
    onSuccess: () => invalidateAll(),
    onError: (err) => showApiError(err),
  });

  const approveQariahMember = trpc.qariahMember.approve.useMutation({
    onSuccess: () => {
      showSuccess(titleMessage, 'approve');
      invalidateAll();
    },
    onError: (err) => showApiError(err),
  });

  const rejectQariahMember = trpc.qariahMember.reject.useMutation({
    onSuccess: () => {
      showSuccess(titleMessage, 'deny');
      invalidateAll();
    },
    onError: (err) => showApiError(err),
  });

  return { registerQariahMember, approveQariahMember, rejectQariahMember };
}

// The signed-in Google user's own registrations (MyKariahMosques page).
// listMine is a tRPC mutation (token in the POST body, not the URL), wrapped
// in useQuery for caching/refetch. Errors with GOOGLE_SESSION_EXPIRED when the
// app has a stored Google user but Firebase can't give a token any more.
export const GOOGLE_SESSION_EXPIRED = 'GOOGLE_SESSION_EXPIRED';

export function useMyQariahRegistrations() {
  const googleUserId = getStoredGoogleUser()?.id ?? null;
  return useQuery({
    queryKey: ['qariahMember', 'listMine', googleUserId],
    enabled: !!googleUserId,
    staleTime: 0,
    refetchOnMount: true,
    retry: false,
    queryFn: async () => {
      const googleIdToken = await getGoogleIdToken();
      if (!googleIdToken) throw new Error(GOOGLE_SESSION_EXPIRED);
      return trpcClient.qariahMember.listMine.mutate({ googleIdToken });
    },
  });
}

// Public, user-side Kariah status check — returns only { isapproved, mosque }
// (or null when there's no active registration at that mosque).
export function useCheckKariahStatus(
  params: { icnumber: string; mosqueId: number | null },
  options?: { enabled?: boolean },
) {
  return trpc.qariahMember.checkStatus.useQuery(
    { icnumber: params.icnumber, mosqueId: params.mosqueId as number },
    {
      enabled:
        (options?.enabled ?? true) && !!params.icnumber && !!params.mosqueId,
      staleTime: 0,
      // the app default is refetchOnMount: false — the dashboard card must
      // re-check every time it mounts, not just on a full app load
      refetchOnMount: true,
      refetchOnWindowFocus: false,
    },
  );
}

// The membership saved on this device for the current user (see
// utils/kariahMembership), re-checked against the server on mount so an
// approval — or a rejection — shows up without the user searching again.
// A failed check (offline, rate-limited) keeps the saved record as-is.
export function useSavedKariahMembership() {
  const googleUserId = getStoredGoogleUser()?.id ?? null;
  const [membership, setMembership] = useState<SavedKariahMembership | null>(
    () => getSavedKariahMembership(),
  );

  // re-read when the signed-in Google user changes
  useEffect(() => {
    setMembership(getSavedKariahMembership());
  }, [googleUserId]);

  const { data, isSuccess, isFetching } = useCheckKariahStatus({
    icnumber: membership?.icnumber ?? '',
    mosqueId: membership?.mosqueId ?? null,
  });

  useEffect(() => {
    if (!membership || !isSuccess || isFetching) return;
    if (!data) {
      clearSavedKariahMembership();
      setMembership(null);
      return;
    }
    const mosqueName = data.mosque?.name ?? membership.mosqueName;
    if (
      data.isapproved !== membership.isApproved ||
      mosqueName !== membership.mosqueName
    ) {
      const next = { ...membership, isApproved: data.isapproved, mosqueName };
      saveKariahMembership(next);
      setMembership(next);
    }
  }, [data, isSuccess, isFetching]); // eslint-disable-line react-hooks/exhaustive-deps

  const save = useCallback((record: SavedKariahMembership) => {
    saveKariahMembership(record);
    setMembership(record);
  }, []);

  const forget = useCallback(() => {
    clearSavedKariahMembership();
    setMembership(null);
  }, []);

  return { membership, save, forget, isChecking: isFetching };
}
