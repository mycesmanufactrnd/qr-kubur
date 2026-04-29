import { trpc } from "@/utils/trpc";

type StatsType = "OGDS" | "TTR" | "DDV" | "CMC" | "QUO";

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

  const { data: OGDSStats, isLoading: isOGDSLoading } =
    trpc.dashboard.getOGDSAdminStates.useQuery(
      {
        currentUserOrganisation: currentUser?.organisation?.id ?? null,
        isSuperAdmin,
      },
      { enabled: enabled && needs("OGDS") },
    );

  const { data: TTRStats, isLoading: isTTRLoading } =
    trpc.dashboard.getTTRAdminStates.useQuery(
      {
        currentUserTahfiz: currentUser?.tahfizcenter?.id ?? null,
        isSuperAdmin,
      },
      {
        enabled: enabled && needs("TTR") && (!needs("OGDS") || !!OGDSStats),
      },
    );

  const { data: DDVStats, isLoading: isDDVLoading } =
    trpc.dashboard.getDDVAdminStates.useQuery(
      {
        currentUserTahfiz: currentUser?.tahfizcenter?.id ?? null,
        currentUserOrganisation: currentUser?.organisation?.id ?? null,
        isSuperAdmin,
      },
      {
        enabled:
          enabled && needs("DDV") &&
          (!needs("OGDS") || !!OGDSStats) &&
          (!needs("TTR") || !!TTRStats),
      },
    );

  const { data: CMCStats, isLoading: isCMCLoading } =
    trpc.dashboard.getCMCAdminStates.useQuery(
      {
        currentUserOrganisation: currentUser?.organisation?.id ?? null,
        isSuperAdmin,
      },
      {
        enabled:
          enabled && needs("CMC") &&
          (!needs("OGDS") || !!OGDSStats) &&
          (!needs("TTR") || !!TTRStats) &&
          (!needs("DDV") || !!DDVStats),
      },
    );

  const { data: QUOStats, isLoading: isQUOLoading } =
    trpc.dashboard.getQuotationStates.useQuery(
      {
        currentUserOrganisation: currentUser?.organisation?.id ?? null,
        isSuperAdmin,
      },
      {
        enabled: enabled && needs("QUO"),
      },
    );

  return {
    OGDSStats,
    TTRStats,
    DDVStats,
    CMCStats,
    QUOStats,
    isOGDSLoading,
    isTTRLoading,
    isDDVLoading,
    isCMCLoading,
    isQUOLoading,
  };
}
