// @ts-nocheck
// Status pill for Kariah registrations (qariahmember.status), shared by the
// desktop and mobile ManageQariahRegistration pages.
import { translate } from "@/utils/translations";

export const QARIAH_STATUSES = ["pending", "approved", "rejected"];

const STYLES = {
  pending:
    "bg-amber-100 text-amber-700 dark:bg-amber-900/30 dark:text-amber-400",
  approved:
    "bg-emerald-100 text-emerald-700 dark:bg-emerald-900/30 dark:text-emerald-400",
  rejected: "bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-400",
};

export const qariahStatusLabel = (status) =>
  ({
    pending: translate("Pending"),
    approved: translate("Approved"),
    rejected: translate("Rejected"),
  })[status] ?? status;

const maritalStatusLabel = (s) =>
  ({
    single: translate("Single"),
    married: translate("Married"),
    divorced: translate("Divorced"),
    widowed: translate("Widowed"),
  })[s] ?? "";

// One-line family summary for the admin views; empty when nothing was filled.
export const formatQariahFamily = (m) =>
  [
    maritalStatusLabel(m.maritalstatus),
    m.spousename || m.spouseicno
      ? `${translate("Spouse")}: ${[m.spousename, m.spouseicno && `(${m.spouseicno})`]
          .filter(Boolean)
          .join(" ")}`
      : null,
    m.numberofchildren != null
      ? `${translate("Number of Children")}: ${m.numberofchildren}`
      : null,
    m.numberofhouseholdmembers != null
      ? `${translate("Household Members")}: ${m.numberofhouseholdmembers}`
      : null,
  ]
    .filter(Boolean)
    .join(" · ");

export const qariahGenderLabel = (gender) =>
  ({ male: translate("Male"), female: translate("Female") })[gender] ?? "";

// "street, 43000 Kajang, Selangor" from the separate address columns
export const formatQariahAddress = (m) =>
  [
    m.address,
    [m.postcode, m.city].filter(Boolean).join(" "),
    m.state,
  ]
    .filter(Boolean)
    .join(", ");

export default function QariahStatusBadge({ status, notes, className = "" }) {
  return (
    <span
      className={`inline-flex items-center text-xs font-medium px-2 py-0.5 rounded-full ${STYLES[status] ?? ""} ${className}`}
      title={notes || undefined}
    >
      {qariahStatusLabel(status)}
    </span>
  );
}
