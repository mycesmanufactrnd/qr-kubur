import { trpc } from "@/utils/trpc";

type StatsType = "OGDS" | "TTR" | "DDV" | "CMC";

interface UseDashboardOptions {
  currentUser: any;
  isSuperAdmin: boolean;
  statsNeeded: StatsType[];
}

const ORDER: StatsType[] = ["OGDS", "TTR", "DDV", "CMC"];

export function useGetAdminDashboardStats({
  currentUser,
  isSuperAdmin,
  statsNeeded,
}: UseDashboardOptions) {
  const needs = (s: StatsType) => statsNeeded.includes(s);

  const { data: OGDSStats, isLoading: isOGDSLoading } =
    trpc.dashboard.getOGDSAdminStates.useQuery(
      { currentUserOrganisation: currentUser?.organisation?.id ?? null, isSuperAdmin },
      { enabled: needs("OGDS") }
    );

  const { data: TTRStats, isLoading: isTTRLoading } =
    trpc.dashboard.getTTRAdminStates.useQuery(
      { currentUserTahfiz: currentUser?.tahfizcenter?.id ?? null, isSuperAdmin },
      {
        enabled:
          needs("TTR") &&
          (!needs("OGDS") || !!OGDSStats),
      }
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
          needs("DDV") &&
          (!needs("OGDS") || !!OGDSStats) &&
          (!needs("TTR")  || !!TTRStats),
      }
    );

  const { data: CMCStats, isLoading: isCMCLoading } =
    trpc.dashboard.getCMCAdminStates.useQuery(
      { currentUserOrganisation: currentUser?.organisation?.id ?? null, isSuperAdmin },
      {
        enabled:
          needs("CMC") &&
          (!needs("OGDS") || !!OGDSStats) &&
          (!needs("TTR")  || !!TTRStats) &&
          (!needs("DDV")  || !!DDVStats),
      }
    );

  return {
    OGDSStats,
    TTRStats,
    DDVStats,
    CMCStats,
    isOGDSLoading,
    isTTRLoading,
    isDDVLoading,
    isCMCLoading,
  };
}
