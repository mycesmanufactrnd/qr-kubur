import { isSupabaseMode } from '@/utils/auth';

export function useGetOrganisation() {
    if (isSupabaseMode) {
    } else {

    }
}