import { base44 } from "@/api/base44Client";

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