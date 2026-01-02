import { base44 } from "@/api/base44Client";
import { useEffect, useState } from "react";

/**
 * @param {string} pageName
 */
export function createPageUrl(pageName) {
    return '/' + pageName.toLowerCase().replace(/ /g, '-');
}

export function useAdminAccess() {
  const [currentUser, setCurrentUser] = useState(null);
  const [loadingUser, setLoadingUser] = useState(true);

  useEffect(() => {
    const loadUser = async () => {
      try {
        const appUserAuth = localStorage.getItem("appUserAuth");
        if (appUserAuth) {
          setCurrentUser(JSON.parse(appUserAuth));
        } else {
          const userData = await base44.auth.me();
          setCurrentUser(userData);
        }
      } catch (e) {
        setCurrentUser(null);
      } finally {
        setLoadingUser(false);
      }
    };

    loadUser();
  }, []);

  const isSuperAdmin = currentUser?.role === "superadmin";
  const isAdmin = currentUser?.role === "admin";
  const isEmployee = currentUser?.role === "employee";
  const isTahfizAdmin = isAdmin && !!currentUser?.tahfiz_center_id;

  const hasAdminAccess = isSuperAdmin || isAdmin || isEmployee;

  const currentUserStates = Array.isArray(currentUser?.state) ? currentUser.state : [currentUser?.state].filter(Boolean);

  return { currentUser, loadingUser, hasAdminAccess, isSuperAdmin, isAdmin, isEmployee, isTahfizAdmin, currentUserStates };
}

/**
 * @param {Array} arrayList
 * @param {any} typeId
 */
export function getLabelFromId(arrayList = [], typeId, key = 'name') {
  if (!arrayList || arrayList.length === 0 || !typeId) return '-';

  const item = arrayList.find(t => t.id === typeId);
  return item?.[key] ?? '-';
}

export async function getParentAndChildOrgs(organisationId = null, isIdOnly = true) {
  if (!organisationId) return [];

  const parentOrg = await base44.entities.Organisation.filter({ id: organisationId });
  const childOrgs = await base44.entities.Organisation.filter({ parent_organisation_id: organisationId });

  if (!isIdOnly) {
    return [...new Set([
      ...parentOrg, 
      ...childOrgs
    ])];
  }

  return [...new Set([
    ...parentOrg.map(o => o.id),
    ...childOrgs.map(o => o.id)
  ])];
}