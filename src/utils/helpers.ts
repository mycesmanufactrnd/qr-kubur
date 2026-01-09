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

export async function hashPassword(password: string): Promise<string> {
  if (!password) {
    throw new Error("Password is required");
  }

  // Encode the password as UTF-8
  const encoder = new TextEncoder();
  const data = encoder.encode(password);

  // Hash using SHA-256
  const hashBuffer = await crypto.subtle.digest("SHA-256", data);

  // Convert hash to hex string
  const hashArray = Array.from(new Uint8Array(hashBuffer));
  const hashed = hashArray.map(b => b.toString(16).padStart(2, "0")).join("");

  return hashed;
}

export function getClientIP() {}