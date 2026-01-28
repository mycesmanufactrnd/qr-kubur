import { trpc } from "@/utils/trpc";

export default function useGetAdminDashboardStats(
    currentUser: any,
    isSuperAdmin: boolean
) {
    const { data: OGDSStats, isLoading: isOGDSLoading } = trpc.dashboard.getOGDSAdminStates.useQuery(
        { 
            currentUserOrganisation: currentUser?.organisation?.id ?? null,
            isSuperAdmin: isSuperAdmin 
        },
        { enabled: isSuperAdmin || (!!currentUser && !!currentUser.organisation) }
    );

    const { data: TTRStats, isLoading: isTTRLoading } = trpc.dashboard.getTTRAdminStates.useQuery(
        { 
            currentUserTahfiz: currentUser?.tahfizcenter?.id ?? null,
            isSuperAdmin: isSuperAdmin 
        },
        { enabled: isSuperAdmin || (!!currentUser && !!currentUser.tahfizcenter) }
    );

    const { data: DDVStats, isLoading: isDDVLoading } = trpc.dashboard.getDDVAdminStates.useQuery(
        { 
            currentUserTahfiz: currentUser?.tahfizcenter?.id ?? null,
            currentUserOrganisation: currentUser?.organisation?.id ?? null,
            isSuperAdmin: isSuperAdmin 
        },
        { 
        enabled: isSuperAdmin ||
            (!!currentUser && !!currentUser.organisation) ||
            (!!currentUser && !!currentUser.tahfizcenter) 
        }
    );

    return {
        OGDSStats,
        TTRStats,
        DDVStats,
        isOGDSLoading,
        isTTRLoading,
        isDDVLoading,
    };
}