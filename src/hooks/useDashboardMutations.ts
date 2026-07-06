import { trpc } from "@/utils/trpc";

type StatsType = "OS" | "GD" | "TTR" | "DDV" | "CQN" | "CMC" | "QUO";

interface UseStatisticChartOptions {
  year: number;
  currentUser: any;
  hasOrg: boolean;
  hasTahfiz: boolean;
  enabled?: boolean;
}

export function useGetStatisticChartData({
  year,
  currentUser,
  hasOrg,
  hasTahfiz,
  enabled = true,
}: UseStatisticChartOptions) {
  return trpc.dashboard.getStatisticChartData.useQuery(
    {
      year,
      currentUserOrganisation: currentUser?.organisation?.id ?? null,
      currentUserTahfiz: currentUser?.tahfizcenter?.id ?? null,
      hasOrg,
      hasTahfiz,
    },
    { enabled },
  );
}

interface UseStatisticListOptions {
  currentUser: any;
  hasOrg: boolean;
  hasTahfiz?: boolean;
  page: number;
  limit?: number;
  enabled?: boolean;
}

export function useGetStatisticOrgList({
  currentUser,
  hasOrg,
  page,
  limit = 8,
  enabled = true,
}: UseStatisticListOptions) {
  return trpc.dashboard.getStatisticOrgList.useQuery(
    {
      page,
      limit,
      currentUserOrganisation: currentUser?.organisation?.id ?? null,
      hasOrg,
    },
    { enabled: enabled && hasOrg },
  );
}

export function useGetStatisticGraveList({
  currentUser,
  hasOrg,
  page,
  limit = 8,
  enabled = true,
}: UseStatisticListOptions) {
  return trpc.dashboard.getStatisticGraveList.useQuery(
    {
      page,
      limit,
      currentUserOrganisation: currentUser?.organisation?.id ?? null,
      hasOrg,
    },
    { enabled: enabled && hasOrg },
  );
}

export function useGetStatisticDonationList({
  currentUser,
  hasOrg,
  hasTahfiz = false,
  page,
  limit = 8,
  enabled = true,
}: UseStatisticListOptions) {
  return trpc.dashboard.getStatisticDonationList.useQuery(
    {
      page,
      limit,
      currentUserOrganisation: currentUser?.organisation?.id ?? null,
      currentUserTahfiz: currentUser?.tahfizcenter?.id ?? null,
      hasOrg,
      hasTahfiz,
    },
    { enabled: enabled && (hasOrg || hasTahfiz) },
  );
}

interface UseDashboardOptions {
  currentUser: any;
  isSuperAdmin: boolean;
  statsNeeded: StatsType[];
  enabled?: boolean;
}

export function useGetAdminDashboardStats({
  currentUser,
  isSuperAdmin,
  statsNeeded,
  enabled = true,
}: UseDashboardOptions) {
  const needs = (s: StatsType) => statsNeeded.includes(s);
  const orgId = currentUser?.organisation?.id ?? null;
  const tahfizId = currentUser?.tahfizcenter?.id ?? null;

  const {
    data: OSStats,
    isLoading: isOSLoading,
    isFetching: isOSFetching,
    refetch: refetchOS,
  } = trpc.dashboard.getOSAdminStates.useQuery(
    { currentUserOrganisation: orgId, isSuperAdmin },
    { enabled: enabled && needs("OS") },
  );

  const {
    data: GDStats,
    isLoading: isGDLoading,
    isFetching: isGDFetching,
    refetch: refetchGD,
  } = trpc.dashboard.getGDAdminStates.useQuery(
    { currentUserOrganisation: orgId, isSuperAdmin },
    {
      enabled: enabled && needs("GD") && (!needs("OS") || !!OSStats),
    },
  );

  const {
    data: TTRStats,
    isLoading: isTTRLoading,
    isFetching: isTTRFetching,
    refetch: refetchTTR,
  } = trpc.dashboard.getTTRAdminStates.useQuery(
    { currentUserTahfiz: tahfizId, isSuperAdmin },
    {
      enabled:
        enabled &&
        needs("TTR") &&
        (!needs("OS") || !!OSStats) &&
        (!needs("GD") || !!GDStats),
    },
  );

  const {
    data: DDVStats,
    isLoading: isDDVLoading,
    isFetching: isDDVFetching,
    refetch: refetchDDV,
  } = trpc.dashboard.getDDVAdminStates.useQuery(
    {
      currentUserTahfiz: tahfizId,
      currentUserOrganisation: orgId,
      isSuperAdmin,
    },
    {
      enabled:
        enabled &&
        needs("DDV") &&
        (!needs("OS") || !!OSStats) &&
        (!needs("GD") || !!GDStats) &&
        (!needs("TTR") || !!TTRStats),
    },
  );

  const {
    data: CQNStats,
    isLoading: isCQNLoading,
    isFetching: isCQNFetching,
    refetch: refetchCQN,
  } = trpc.dashboard.getCQNAdminStates.useQuery(
    { currentUserOrganisation: orgId, isSuperAdmin },
    {
      enabled:
        enabled &&
        needs("CQN") &&
        (!needs("OS") || !!OSStats) &&
        (!needs("GD") || !!GDStats) &&
        (!needs("TTR") || !!TTRStats) &&
        (!needs("DDV") || !!DDVStats),
    },
  );

  const {
    data: CMCStats,
    isLoading: isCMCLoading,
    isFetching: isCMCFetching,
    refetch: refetchCMC,
  } = trpc.dashboard.getCMCAdminStates.useQuery(
    { currentUserOrganisation: orgId, isSuperAdmin },
    {
      enabled:
        enabled &&
        needs("CMC") &&
        (!needs("OS") || !!OSStats) &&
        (!needs("GD") || !!GDStats) &&
        (!needs("TTR") || !!TTRStats) &&
        (!needs("DDV") || !!DDVStats) &&
        (!needs("CQN") || !!CQNStats),
    },
  );

  const {
    data: QUOStats,
    isLoading: isQUOLoading,
    isFetching: isQUOFetching,
    refetch: refetchQUO,
  } = trpc.dashboard.getQuotationStates.useQuery(
    { currentUserOrganisation: orgId, isSuperAdmin },
    { enabled: enabled && needs("QUO") },
  );

  const refetchAll = () =>
    Promise.all(
      [
        needs("OS") && refetchOS,
        needs("GD") && refetchGD,
        needs("TTR") && refetchTTR,
        needs("DDV") && refetchDDV,
        needs("CQN") && refetchCQN,
        needs("CMC") && refetchCMC,
        needs("QUO") && refetchQUO,
      ]
        .filter(Boolean)
        .map((refetchFn: any) => refetchFn()),
    );

  const isRefetching =
    isOSFetching ||
    isGDFetching ||
    isTTRFetching ||
    isDDVFetching ||
    isCQNFetching ||
    isCMCFetching ||
    isQUOFetching;

  return {
    OSStats,
    GDStats,
    TTRStats,
    DDVStats,
    CQNStats,
    CMCStats,
    QUOStats,
    isOSLoading,
    isGDLoading,
    isTTRLoading,
    isDDVLoading,
    isCQNLoading,
    isCMCLoading,
    isQUOLoading,
    refetchAll,
    isRefetching,
  };
}
