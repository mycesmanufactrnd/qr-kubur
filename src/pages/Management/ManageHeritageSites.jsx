import { useAdminAccess } from "@/utils/auth";

export default function ManageHeritageSites() {
  const { 
    currentUser, 
    loadingUser, 
    hasAdminAccess, 
    isSuperAdmin, 
    currentUserStates 
  } = useAdminAccess();
}