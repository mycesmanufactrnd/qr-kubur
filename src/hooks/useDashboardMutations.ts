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

  const { data: OSStats, isLoading: isOSLoading } =
    trpc.dashboard.getOSAdminStates.useQuery(
      { currentUserOrganisation: orgId, isSuperAdmin },
      { enabled: enabled && needs("OS") },
    );

  const { data: GDStats, isLoading: isGDLoading } =
    trpc.dashboard.getGDAdminStates.useQuery(
      { currentUserOrganisation: orgId, isSuperAdmin },
      {
        enabled: enabled && needs("GD") && (!needs("OS") || !!OSStats),
      },
    );

  const { data: TTRStats, isLoading: isTTRLoading } =
    trpc.dashboard.getTTRAdminStates.useQuery(
      { currentUserTahfiz: tahfizId, isSuperAdmin },
      {
        enabled:
          enabled &&
          needs("TTR") &&
          (!needs("OS") || !!OSStats) &&
          (!needs("GD") || !!GDStats),
      },
    );

  const { data: DDVStats, isLoading: isDDVLoading } =
    trpc.dashboard.getDDVAdminStates.useQuery(
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

  const { data: CQNStats, isLoading: isCQNLoading } =
    trpc.dashboard.getCQNAdminStates.useQuery(
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

  const { data: CMCStats, isLoading: isCMCLoading } =
    trpc.dashboard.getCMCAdminStates.useQuery(
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

  const { data: QUOStats, isLoading: isQUOLoading } =
    trpc.dashboard.getQuotationStates.useQuery(
      { currentUserOrganisation: orgId, isSuperAdmin },
      { enabled: enabled && needs("QUO") },
    );

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
  };
}
