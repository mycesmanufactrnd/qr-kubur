// @ts-nocheck
import { useEffect, useState } from "react";
import { useForm } from "react-hook-form";
import { useNavigate } from "react-router-dom";
import {
  UserPlus,
  Plus,
  Edit,
  Trash2,
  X,
  Save,
  DiamondPlus,
  CreditCard,
} from "lucide-react";
import { Badge } from "@/components/ui/badge";
import AdvancedFilters from "@/components/mobile/AdvancedFilters";
import BackNavigation from "@/components/BackNavigation";
import Pagination from "@/components/Pagination";
import InlineLoadingComponent from "@/components/InlineLoadingComponent";
import LoadingUser from "@/components/PageLoadingComponent";
import AccessDeniedComponent from "@/components/AccessDeniedComponent";
import ConfirmDialog from "@/components/ConfirmDialog";
import TextInputForm from "@/components/Forms/TextInputForm.jsx";
import SelectForm from "@/components/Forms/SelectForm";
import CheckboxForm from "@/components/Forms/CheckboxForm";
import { translate } from "@/utils/translations";
import { useAdminAccess } from "@/utils/auth";
import { useCrudPermissions } from "@/components/PermissionsContext";
import { ClaimStatus } from "@/utils/enums";
import { createPageUrl } from "@/utils";
import {
  useGetDeathCharityMemberPaginated,
  useDeathCharityMemberMutations,
} from "@/hooks/useDeathCharityMemberMutations";
import { useGetDeathCharityByOrganisation } from "@/hooks/useDeathCharityMutations";
import { useDeathCharityClaimMutations } from "@/hooks/useDeathCharityClaimMutations";
import { defaultDeathCharityMemberField } from "@/utils/defaultformfields";

function MemberCard({
  item,
  canEdit,
  canDelete,
  onEdit,
  onDelete,
  onCoverage,
  onClaim,
  onLedger,
}) {
  const hasCoverage =
    !!item.deathcharity &&
    (item.deathcharity.coverschildren || item.deathcharity.coversspouse);

  return (
    <div className="bg-white dark:bg-slate-800 rounded-2xl border border-slate-100 dark:border-slate-700 shadow-sm overflow-hidden">
      <div className="p-4 space-y-2">
        <div className="flex items-start justify-between gap-1">
          <p className="font-semibold text-slate-800 dark:text-slate-100 text-sm leading-tight flex-1 min-w-0">
            {item.fullname}
          </p>
          <>
            <Badge
              className={`shrink-0 h-7 px-2 flex items-center border-0 text-xs ${
                item.isactive
                  ? "bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400"
                  : "bg-slate-100 text-slate-500 dark:bg-slate-700 dark:text-slate-400"
              }`}
            >
              {item.isactive ? translate("Active") : translate("Inactive")}
            </Badge>

            {canDelete && (
              <button
                onClick={() => onDelete(item)}
                className="flex shrink-0 items-center justify-center gap-1.5 h-7 px-1.5 text-xs text-red-500 rounded-lg active:opacity-70 ml-auto"
              >
                <Trash2 className="w-3.5 h-3.5" />
              </button>
            )}
          </>
        </div>

        <div className="flex flex-wrap gap-x-3 gap-y-1 text-xs text-slate-500 dark:text-slate-400">
          {item.icnumber && <span>{item.icnumber}</span>}
          {item.phone && <span>{item.phone}</span>}
        </div>

        {item.deathcharity?.name && (
          <p className="text-xs text-slate-400 dark:text-slate-500">{item.deathcharity.name}</p>
        )}

        <div className="flex items-center gap-2 flex-wrap pt-1">
          {canEdit && (
            <button
              onClick={() => onEdit(item)}
              className="flex items-center gap-1.5 text-xs text-emerald-600 dark:text-emerald-400 border border-emerald-200 dark:border-emerald-800 rounded-lg px-2.5 py-1.5 active:opacity-70"
            >
              <Edit className="w-3.5 h-3.5" />
              {translate("Edit")}
            </button>
          )}
          {canEdit && hasCoverage && (
            <button
              onClick={() => onCoverage(item)}
              className="flex items-center gap-1.5 text-xs text-green-600 dark:text-green-400 border border-green-200 dark:border-green-800 rounded-lg px-2.5 py-1.5 active:opacity-70"
            >
              <UserPlus className="w-3.5 h-3.5" />
              {translate("Coverage")}
            </button>
          )}
          {canEdit && (
            <button
              onClick={() => onClaim(item)}
              className="flex items-center gap-1.5 text-xs text-amber-600 dark:text-amber-400 border border-amber-200 dark:border-amber-800 rounded-lg px-2.5 py-1.5 active:opacity-70"
            >
              <DiamondPlus className="w-3.5 h-3.5" />
              {translate("Claim")}
            </button>
          )}
          {canEdit && (
            <button
              onClick={() => onLedger(item)}
              className="flex items-center gap-1.5 text-xs text-blue-600 dark:text-blue-400 border border-blue-200 dark:border-blue-800 rounded-lg px-2.5 py-1.5 active:opacity-70"
            >
              <CreditCard className="w-3.5 h-3.5" />
              {translate("Ledger")}
            </button>
          )}
        </div>
      </div>
    </div>
  );
}

// ─── Section header ───────────────────────────────────────────────────────────

function FormSection({ title, children }) {
  return (
    <div>
      <h3 className="text-xs font-semibold text-slate-500 dark:text-slate-400 uppercase tracking-wider mb-3 pb-2 border-b border-slate-100 dark:border-slate-700">
        {title}
      </h3>
      <div className="space-y-3">{children}</div>
    </div>
  );
}

// ─── Member form sheet ────────────────────────────────────────────────────────

function MemberFormSheet({
  editing,
  onClose,
  onSubmit,
  isSubmitting,
  deathCharityOptions,
}) {
  const {
    control,
    handleSubmit,
    formState: { errors },
  } = useForm({
    defaultValues: editing
      ? {
          ...editing,
          deathcharity: editing.deathcharity?.id?.toString() ?? "",
        }
      : defaultDeathCharityMemberField,
  });

  useEffect(() => {
    document.body.style.overflow = "hidden";
    document.body.style.touchAction = "none";
    return () => {
      document.body.style.overflow = "";
      document.body.style.touchAction = "";
    };
  }, []);

  return (
    <div className="fixed inset-0 z-50 flex flex-col bg-white dark:bg-slate-900">
      <div className="flex items-center gap-3 px-4 py-3 border-b border-slate-100 dark:border-slate-700 shrink-0">
        <button
          onClick={onClose}
          className="w-8 h-8 flex items-center justify-center rounded-full hover:bg-slate-100 dark:hover:bg-slate-700"
        >
          <X className="w-5 h-5 text-slate-500 dark:text-slate-400" />
        </button>
        <h2 className="font-semibold text-slate-800 dark:text-slate-100 text-sm">
          {editing
            ? translate("Edit Death Charity Member")
            : translate("Add Death Charity Member")}
        </h2>
      </div>

      <div className="flex-1 overflow-y-auto px-4 py-4 space-y-6 pb-28">
        <FormSection title={translate("Death Charity")}>
          <SelectForm
            name="deathcharity"
            control={control}
            label={translate("Death Charity")}
            placeholder={translate("Select Death Charity")}
            options={deathCharityOptions}
          />
        </FormSection>

        <FormSection title={translate("Member Information")}>
          <TextInputForm
            name="fullname"
            control={control}
            label={translate("Full Name")}
            required
            errors={errors}
          />
          <div className="grid grid-cols-2 gap-3">
            <TextInputForm
              name="icnumber"
              control={control}
              label={translate("IC No.")}
              required
              errors={errors}
            />
            <TextInputForm
              name="phone"
              control={control}
              label={translate("Phone")}
              required
              errors={errors}
            />
          </div>
          <TextInputForm
            name="email"
            control={control}
            label={translate("Email")}
            isEmail
            errors={errors}
          />
          <TextInputForm
            name="address"
            control={control}
            label={translate("Address")}
            isTextArea
          />
        </FormSection>

        <FormSection title={translate("Status")}>
          <CheckboxForm
            name="isactive"
            control={control}
            label={translate("Active")}
          />
        </FormSection>
      </div>

      <div className="absolute bottom-0 left-0 right-0 bg-white dark:bg-slate-900 border-t border-slate-100 dark:border-slate-700 p-4 shrink-0">
        <button
          type="button"
          onClick={handleSubmit(onSubmit)}
          disabled={isSubmitting}
          className="w-full h-12 rounded-2xl bg-emerald-600 text-white font-semibold text-sm flex items-center justify-center gap-2 active:opacity-80 disabled:opacity-50"
        >
          <Save className="w-4 h-4" />
          {translate("Save")}
        </button>
      </div>
    </div>
  );
}

// ─── Coverage sheet ───────────────────────────────────────────────────────────

function CoverageSheet({ member, onClose, onSave, isSaving }) {
  const [spouses, setSpouses] = useState(() => {
    if (!member?.dependents) return [];
    return member.dependents.filter((d) => d.relationship === "spouse");
  });
  const [children, setChildren] = useState(() => {
    if (!member?.dependents) return [];
    return member.dependents.filter((d) => d.relationship === "child");
  });
  const [spouseForm, setSpouseForm] = useState({ fullname: "", icnumber: "" });
  const [childForm, setChildForm] = useState({ fullname: "", icnumber: "" });

  const isCoverSpouse = member?.deathcharity?.coversspouse ?? false;
  const isCoverChildren = member?.deathcharity?.coverschildren ?? false;

  useEffect(() => {
    document.body.style.overflow = "hidden";
    document.body.style.touchAction = "none";
    return () => {
      document.body.style.overflow = "";
      document.body.style.touchAction = "";
    };
  }, []);

  const addSpouse = () => {
    if (!spouseForm.fullname || !spouseForm.icnumber) return;
    if (spouses.length >= 4) return;
    setSpouses([...spouses, { ...spouseForm, relationship: "spouse" }]);
    setSpouseForm({ fullname: "", icnumber: "" });
  };

  const addChild = () => {
    if (!childForm.fullname || !childForm.icnumber) return;
    setChildren([...children, { ...childForm, relationship: "child" }]);
    setChildForm({ fullname: "", icnumber: "" });
  };

  const removeSpouse = (i) => setSpouses(spouses.filter((_, idx) => idx !== i));
  const removeChild = (i) =>
    setChildren(children.filter((_, idx) => idx !== i));

  const handleSave = () => {
    const dependents = [...spouses, ...children].map((d) => ({
      id: d.id,
      fullname: d.fullname,
      icnumber: d.icnumber,
      relationship: d.relationship,
    }));
    onSave(dependents);
  };

  return (
    <div className="fixed inset-0 z-50 flex flex-col bg-white dark:bg-slate-900">
      <div className="flex items-center gap-3 px-4 py-3 border-b border-slate-100 dark:border-slate-700 shrink-0">
        <button
          onClick={onClose}
          className="w-8 h-8 flex items-center justify-center rounded-full hover:bg-slate-100 dark:hover:bg-slate-700"
        >
          <X className="w-5 h-5 text-slate-500 dark:text-slate-400" />
        </button>
        <div className="flex-1 min-w-0">
          <h2 className="font-semibold text-slate-800 dark:text-slate-100 text-sm">
            {translate("Manage Coverage")}
          </h2>
          <p className="text-xs text-slate-400 dark:text-slate-500 truncate">{member?.fullname}</p>
        </div>
      </div>

      <div className="flex-1 overflow-y-auto px-4 py-4 space-y-6 pb-28">
        {isCoverSpouse && (
          <FormSection title={`${translate("Spouse")} (${spouses.length}/4)`}>
            <div className="grid grid-cols-2 gap-2">
              <div>
                <label className="text-xs text-slate-500 dark:text-slate-400 mb-1 block">
                  {translate("Full Name")}
                </label>
                <input
                  className="w-full h-10 rounded-xl border border-slate-200 dark:border-slate-700 dark:bg-slate-800 dark:text-slate-200 px-3 text-sm focus:outline-none focus:ring-2 focus:ring-emerald-300"
                  value={spouseForm.fullname}
                  onChange={(e) =>
                    setSpouseForm({ ...spouseForm, fullname: e.target.value })
                  }
                  placeholder={translate("Full Name")}
                />
              </div>
              <div>
                <label className="text-xs text-slate-500 dark:text-slate-400 mb-1 block">
                  {translate("IC No")}
                </label>
                <input
                  className="w-full h-10 rounded-xl border border-slate-200 dark:border-slate-700 dark:bg-slate-800 dark:text-slate-200 px-3 text-sm focus:outline-none focus:ring-2 focus:ring-emerald-300"
                  value={spouseForm.icnumber}
                  onChange={(e) =>
                    setSpouseForm({ ...spouseForm, icnumber: e.target.value })
                  }
                  placeholder={translate("IC No")}
                />
              </div>
            </div>
            <button
              type="button"
              onClick={addSpouse}
              disabled={spouses.length >= 4}
              className="flex items-center gap-1.5 text-xs text-emerald-600 dark:text-emerald-400 border border-emerald-200 dark:border-emerald-800 rounded-lg px-3 py-2 active:opacity-70 disabled:opacity-40"
            >
              <Plus className="w-3.5 h-3.5" />
              {translate("Add Spouse")}
            </button>
            {spouses.length > 0 && (
              <div className="space-y-2">
                {spouses.map((s, i) => (
                  <div
                    key={i}
                    className="grid grid-cols-[1fr_1fr_auto] gap-2 items-center"
                  >
                    <input
                      className="h-10 rounded-xl border border-slate-200 dark:border-slate-700 dark:bg-slate-800 dark:text-slate-200 px-3 text-sm focus:outline-none focus:ring-2 focus:ring-emerald-300"
                      value={s.fullname}
                      onChange={(e) => {
                        const updated = [...spouses];
                        updated[i] = {
                          ...updated[i],
                          fullname: e.target.value,
                        };
                        setSpouses(updated);
                      }}
                    />
                    <input
                      className="h-10 rounded-xl border border-slate-200 dark:border-slate-700 dark:bg-slate-800 dark:text-slate-200 px-3 text-sm focus:outline-none focus:ring-2 focus:ring-emerald-300"
                      value={s.icnumber}
                      onChange={(e) => {
                        const updated = [...spouses];
                        updated[i] = {
                          ...updated[i],
                          icnumber: e.target.value,
                        };
                        setSpouses(updated);
                      }}
                    />
                    <button
                      type="button"
                      onClick={() => removeSpouse(i)}
                      className="w-8 h-8 flex items-center justify-center text-red-500 dark:text-red-400 rounded-lg border border-red-100 dark:border-red-800 active:opacity-70"
                    >
                      <Trash2 className="w-3.5 h-3.5" />
                    </button>
                  </div>
                ))}
              </div>
            )}
          </FormSection>
        )}

        {isCoverChildren && (
          <FormSection title={`${translate("Children")} (${children.length})`}>
            <div className="grid grid-cols-2 gap-2">
              <div>
                <label className="text-xs text-slate-500 dark:text-slate-400 mb-1 block">
                  {translate("Full Name")}
                </label>
                <input
                  className="w-full h-10 rounded-xl border border-slate-200 dark:border-slate-700 dark:bg-slate-800 dark:text-slate-200 px-3 text-sm focus:outline-none focus:ring-2 focus:ring-emerald-300"
                  value={childForm.fullname}
                  onChange={(e) =>
                    setChildForm({ ...childForm, fullname: e.target.value })
                  }
                  placeholder={translate("Full Name")}
                />
              </div>
              <div>
                <label className="text-xs text-slate-500 dark:text-slate-400 mb-1 block">
                  {translate("IC No")}
                </label>
                <input
                  className="w-full h-10 rounded-xl border border-slate-200 dark:border-slate-700 dark:bg-slate-800 dark:text-slate-200 px-3 text-sm focus:outline-none focus:ring-2 focus:ring-emerald-300"
                  value={childForm.icnumber}
                  onChange={(e) =>
                    setChildForm({ ...childForm, icnumber: e.target.value })
                  }
                  placeholder={translate("IC No")}
                />
              </div>
            </div>
            <button
              type="button"
              onClick={addChild}
              className="flex items-center gap-1.5 text-xs text-emerald-600 dark:text-emerald-400 border border-emerald-200 dark:border-emerald-800 rounded-lg px-3 py-2 active:opacity-70"
            >
              <Plus className="w-3.5 h-3.5" />
              {translate("Add Child")}
            </button>
            {children.length > 0 && (
              <div className="space-y-2">
                {children.map((c, i) => (
                  <div
                    key={i}
                    className="grid grid-cols-[1fr_1fr_auto] gap-2 items-center"
                  >
                    <input
                      className="h-10 rounded-xl border border-slate-200 dark:border-slate-700 dark:bg-slate-800 dark:text-slate-200 px-3 text-sm focus:outline-none focus:ring-2 focus:ring-emerald-300"
                      value={c.fullname}
                      onChange={(e) => {
                        const updated = [...children];
                        updated[i] = {
                          ...updated[i],
                          fullname: e.target.value,
                        };
                        setChildren(updated);
                      }}
                    />
                    <input
                      className="h-10 rounded-xl border border-slate-200 dark:border-slate-700 dark:bg-slate-800 dark:text-slate-200 px-3 text-sm focus:outline-none focus:ring-2 focus:ring-emerald-300"
                      value={c.icnumber}
                      onChange={(e) => {
                        const updated = [...children];
                        updated[i] = {
                          ...updated[i],
                          icnumber: e.target.value,
                        };
                        setChildren(updated);
                      }}
                    />
                    <button
                      type="button"
                      onClick={() => removeChild(i)}
                      className="w-8 h-8 flex items-center justify-center text-red-500 dark:text-red-400 rounded-lg border border-red-100 dark:border-red-800 active:opacity-70"
                    >
                      <Trash2 className="w-3.5 h-3.5" />
                    </button>
                  </div>
                ))}
              </div>
            )}
          </FormSection>
        )}
      </div>

      <div className="absolute bottom-0 left-0 right-0 bg-white dark:bg-slate-900 border-t border-slate-100 dark:border-slate-700 p-4 shrink-0">
        <button
          type="button"
          onClick={handleSave}
          disabled={isSaving}
          className="w-full h-12 rounded-2xl bg-emerald-600 text-white font-semibold text-sm flex items-center justify-center gap-2 active:opacity-80 disabled:opacity-50"
        >
          <Save className="w-4 h-4" />
          {translate("Save Coverage")}
        </button>
      </div>
    </div>
  );
}

function ClaimSheet({
  claimable,
  deathBenefitAmount,
  onClose,
  onSave,
  isSaving,
}) {
  const [selectedClaims, setSelectedClaims] = useState([]);

  useEffect(() => {
    document.body.style.overflow = "hidden";
    document.body.style.touchAction = "none";
    return () => {
      document.body.style.overflow = "";
      document.body.style.touchAction = "";
    };
  }, []);

  const handleSelect = (item) => {
    const exists = selectedClaims.find(
      (c) => c.deceasedname === item.deceasedname,
    );
    if (exists) {
      setSelectedClaims(
        selectedClaims.filter((c) => c.deceasedname !== item.deceasedname),
      );
    } else {
      setSelectedClaims([
        ...selectedClaims,
        { ...item, payoutamount: deathBenefitAmount },
      ]);
    }
  };

  const unselected = claimable.filter(
    (item) => !selectedClaims.find((c) => c.deceasedname === item.deceasedname),
  );

  return (
    <div className="fixed inset-0 z-50 flex flex-col bg-white dark:bg-slate-900">
      <div className="flex items-center gap-3 px-4 py-3 border-b border-slate-100 dark:border-slate-700 shrink-0">
        <button
          onClick={onClose}
          className="w-8 h-8 flex items-center justify-center rounded-full hover:bg-slate-100 dark:hover:bg-slate-700"
        >
          <X className="w-5 h-5 text-slate-500 dark:text-slate-400" />
        </button>
        <h2 className="font-semibold text-slate-800 dark:text-slate-100 text-sm">
          {translate("Claim List")}
        </h2>
      </div>

      <div className="flex-1 overflow-y-auto px-4 py-4 space-y-6 pb-28">
        <FormSection title={translate("Claimable")}>
          {unselected.length === 0 ? (
            <p className="text-xs text-slate-400 text-center py-3">
              {translate("No claimable items")}
            </p>
          ) : (
            <div className="space-y-2">
              {unselected.map((item, i) => (
                <div
                  key={i}
                  className="bg-white dark:bg-slate-800 rounded-xl border border-slate-100 dark:border-slate-700 p-3 flex items-start justify-between gap-2"
                >
                  <div className="flex-1 min-w-0">
                    <p className="font-medium text-sm text-slate-800 dark:text-slate-100 truncate">
                      {item.deceasedname}
                    </p>
                    <p className="text-xs text-slate-500 dark:text-slate-400 capitalize">
                      {item.relationship}
                    </p>
                    {item.dependentId ? (
                      <p className="text-xs text-slate-400 dark:text-slate-500">
                        {item.claimedamount}
                      </p>
                    ) : (
                      <p className="text-xs text-slate-400 dark:text-slate-500">
                        RM {item.totalAmount} ({item.numberOfClaims}{" "}
                        {translate("claims")})
                      </p>
                    )}
                  </div>
                  <button
                    type="button"
                    onClick={() => handleSelect(item)}
                    className="shrink-0 text-xs text-emerald-600 dark:text-emerald-400 border border-emerald-200 dark:border-emerald-800 rounded-lg px-2.5 py-1.5 active:opacity-70"
                  >
                    {translate("Select")}
                  </button>
                </div>
              ))}
            </div>
          )}
        </FormSection>

        <FormSection title={translate("Selected Claims")}>
          {selectedClaims.length === 0 ? (
            <p className="text-xs text-slate-400 text-center py-3">
              {translate("No selected claims")}
            </p>
          ) : (
            <div className="space-y-3">
              {selectedClaims.map((item, i) => (
                <div
                  key={i}
                  className="bg-emerald-50 dark:bg-emerald-900/20 rounded-xl border border-emerald-100 dark:border-emerald-800 p-3 space-y-2"
                >
                  <div className="flex items-start justify-between gap-2">
                    <div>
                      <p className="font-medium text-sm text-slate-800 dark:text-slate-100">
                        {item.deceasedname}
                      </p>
                      <p className="text-xs text-slate-500 dark:text-slate-400 capitalize">
                        {item.relationship}
                      </p>
                    </div>
                    <button
                      type="button"
                      onClick={() => handleSelect(item)}
                      className="shrink-0 text-xs text-red-500 dark:text-red-400 border border-red-200 dark:border-red-800 rounded-lg px-2.5 py-1.5 active:opacity-70"
                    >
                      {translate("Remove")}
                    </button>
                  </div>
                  <div>
                    <label className="text-xs text-slate-500 dark:text-slate-400 mb-1 block">
                      {translate("Payout Amount (RM)")}
                    </label>
                    <input
                      type="number"
                      min="0"
                      className="w-full h-10 rounded-xl border border-slate-200 dark:border-slate-700 dark:bg-slate-800 dark:text-slate-200 px-3 text-sm focus:outline-none focus:ring-2 focus:ring-emerald-300"
                      value={item.payoutamount}
                      onChange={(e) => {
                        const updated = [...selectedClaims];
                        updated[i] = {
                          ...updated[i],
                          payoutamount: e.target.value,
                        };
                        setSelectedClaims(updated);
                      }}
                    />
                  </div>
                </div>
              ))}
            </div>
          )}
        </FormSection>
      </div>

      <div className="absolute bottom-0 left-0 right-0 bg-white dark:bg-slate-900 border-t border-slate-100 dark:border-slate-700 p-4 shrink-0">
        <button
          type="button"
          onClick={() => onSave(selectedClaims)}
          disabled={isSaving || selectedClaims.length === 0}
          className="w-full h-12 rounded-2xl bg-emerald-600 text-white font-semibold text-sm flex items-center justify-center gap-2 active:opacity-80 disabled:opacity-50"
        >
          <Save className="w-4 h-4" />
          {translate("Save Claim")}
        </button>
      </div>
    </div>
  );
}

export default function ManageDeathCharityMember() {
  const navigate = useNavigate();
  const { loadingUser, hasAdminAccess } = useAdminAccess();
  const {
    loading: permissionsLoading,
    canView,
    canCreate,
    canEdit,
    canDelete,
  } = useCrudPermissions("death_charity");

  const [page, setPage] = useState(1);
  const [itemsPerPage] = useState(10);

  const [appliedSearch, setAppliedSearch] = useState("");

  const [formSheet, setFormSheet] = useState(null);
  const [coverageSheet, setCoverageSheet] = useState(null);
  const [claimSheet, setClaimSheet] = useState(null);
  const [deleteDialog, setDeleteDialog] = useState(null);

  const { deathCharityMemberList, totalPages, isLoading } =
    useGetDeathCharityMemberPaginated({
      page,
      pageSize: itemsPerPage,
      filterFullName: appliedSearch,
    });

  const { data: deathCharityList = [] } = useGetDeathCharityByOrganisation();

  const {
    createDeathCharityMember,
    updateDeathCharityMember,
    deleteDeathCharityMember,
    upsertDeathCharityDependents,
  } = useDeathCharityMemberMutations();

  const { createDeathCharityBulkClaims } = useDeathCharityClaimMutations();

  const deathCharityOptions = deathCharityList.map((dc) => ({
    value: dc.id,
    label: dc.name,
  }));

  const handleFormSubmit = async (formData) => {
    const submitData = {
      ...formData,
      deathcharity: formData.deathcharity
        ? { id: Number(formData.deathcharity) }
        : null,
    };
    try {
      if (formSheet?.mode === "edit") {
        await updateDeathCharityMember.mutateAsync({
          id: formSheet.member.id,
          data: submitData,
        });
      } else {
        await createDeathCharityMember.mutateAsync(submitData);
      }
      setFormSheet(null);
    } catch (e) {
      console.error(e);
    }
  };

  const handleSaveCoverage = async (dependents) => {
    try {
      await upsertDeathCharityDependents.mutateAsync({
        member: coverageSheet?.id ? { id: Number(coverageSheet.id) } : null,
        dependents,
      });
    } catch (e) {
      console.error(e);
    } finally {
      setCoverageSheet(null);
    }
  };

  const handleSaveClaim = async (selectedClaims, memberId, deathCharityId) => {
    try {
      const payloadClaims = selectedClaims.map((c) => ({
        deceasedname: c.deceasedname,
        relationship: c.relationship,
        member: memberId ? { id: Number(memberId) } : null,
        dependent: c.dependentId ? { id: Number(c.dependentId) } : null,
        deathcharity: deathCharityId ? { id: Number(deathCharityId) } : null,
        payoutamount: Number(c.payoutamount) ?? 0,
        status: ClaimStatus.PENDING,
      }));
      await createDeathCharityBulkClaims.mutateAsync({ claims: payloadClaims });
    } catch (e) {
      console.error(e);
    } finally {
      setClaimSheet(null);
    }
  };

  const openClaimSheet = (member) => {
    const {
      id: memberId,
      fullname,
      claims = [],
      dependents = [],
      deathcharity,
    } = member;

    const deathBenefitAmount = deathcharity?.deathbenefitamount
      ? Number(deathcharity.deathbenefitamount)
      : 0;

    const memberClaimedAmount = claims.reduce(
      (sum, c) => sum + (Number(c.payoutamount) || 0),
      0,
    );
    const memberClaimsCount = claims.length;

    const claimable = [
      {
        deceasedname: fullname,
        relationship: "member",
        totalAmount: memberClaimedAmount,
        numberOfClaims: memberClaimsCount,
        claims: claims.map((c) => ({
          deceasedname: c.deceasedname,
          payoutamount: Number(c.payoutamount) || 0,
        })),
      },
      ...dependents.map(
        ({ id: dependentId, fullname, relationship, claims = [] }) => {
          const dependentClaimedAmount = claims.reduce(
            (sum, c) => sum + (Number(c.payoutamount) || 0),
            0,
          );
          const dependentClaimsCount = claims.length;
          return {
            dependentId,
            deceasedname: fullname,
            relationship,
            claimedamount: `RM ${dependentClaimedAmount} (${dependentClaimsCount})`,
          };
        },
      ),
    ];

    setClaimSheet({
      claimable,
      deathBenefitAmount,
      memberId: member.id,
      deathCharityId: member?.deathcharity?.id ?? null,
    });
  };

  const confirmDelete = async () => {
    if (!deleteDialog) return;
    try {
      await deleteDeathCharityMember.mutateAsync(deleteDialog.id);
    } catch (e) {
      console.error(e);
    } finally {
      setDeleteDialog(null);
    }
  };

  if (loadingUser || permissionsLoading) return <LoadingUser />;
  if (!hasAdminAccess) return <AccessDeniedComponent />;
  if (!canView) return <AccessDeniedComponent />;

  const items = deathCharityMemberList?.items ?? [];

  return (
    <div className="min-h-screen pb-6 dark:bg-slate-900">
      <BackNavigation title={translate("Death Charity Member")} />

      <div className="max-w-2xl mx-auto px-3 space-y-3">
        <div className="flex items-center gap-2 pt-1">
          <AdvancedFilters
            parameter={[
              {
                label: translate("Full Name"),
                type: "text",
                searchColumn: "search",
              },
            ]}
            onApplyFilter={(f) => {
              setAppliedSearch(f.search || "");
              setPage(1);
            }}
          />
          {canCreate && (
            <button
              onClick={() => setFormSheet({ mode: "add", member: null })}
              className="flex items-center gap-1.5 h-9 px-3 rounded-xl bg-emerald-600 text-white text-xs font-semibold active:opacity-80 shadow-sm ml-auto"
            >
              <Plus className="w-3.5 h-3.5" />
            </button>
          )}
        </div>

        {isLoading ? (
          <InlineLoadingComponent />
        ) : items.length === 0 ? (
          <div className="text-center text-slate-400 dark:text-slate-600 text-sm py-12">
            {translate("No members found")}
          </div>
        ) : (
          <div className="space-y-3">
            {items.map((member) => (
              <MemberCard
                key={member.id}
                item={member}
                canEdit={canEdit}
                canDelete={canDelete}
                onEdit={(m) => setFormSheet({ mode: "edit", member: m })}
                onDelete={(m) => setDeleteDialog(m)}
                onCoverage={(m) => setCoverageSheet(m)}
                onClaim={(m) => openClaimSheet(m)}
                onLedger={(m) =>
                  navigate(
                    createPageUrl("ManageDeathCharityLedger") +
                      `?deathcharity=${m.deathcharity?.id}&member=${m.id}`,
                  )
                }
              />
            ))}
          </div>
        )}

        {totalPages > 1 && (
          <div className="pt-2">
            <Pagination
              currentPage={page}
              totalPages={totalPages}
              onPageChange={setPage}
              itemsPerPage={itemsPerPage}
              totalItems={deathCharityMemberList?.total ?? 0}
            />
          </div>
        )}
      </div>

      {/* Form sheet */}
      {formSheet && (
        <MemberFormSheet
          editing={formSheet.member}
          onClose={() => setFormSheet(null)}
          onSubmit={handleFormSubmit}
          isSubmitting={
            createDeathCharityMember.isPending ||
            updateDeathCharityMember.isPending
          }
          deathCharityOptions={deathCharityOptions}
        />
      )}

      {/* Coverage sheet */}
      {coverageSheet && (
        <CoverageSheet
          member={coverageSheet}
          onClose={() => setCoverageSheet(null)}
          onSave={handleSaveCoverage}
          isSaving={upsertDeathCharityDependents.isPending}
        />
      )}

      {/* Claim sheet */}
      {claimSheet && (
        <ClaimSheet
          claimable={claimSheet.claimable}
          deathBenefitAmount={claimSheet.deathBenefitAmount}
          onClose={() => setClaimSheet(null)}
          onSave={(selected) =>
            handleSaveClaim(
              selected,
              claimSheet.memberId,
              claimSheet.deathCharityId,
            )
          }
          isSaving={createDeathCharityBulkClaims.isPending}
        />
      )}

      {/* Delete confirm */}
      <ConfirmDialog
        open={!!deleteDialog}
        onOpenChange={(open) => !open && setDeleteDialog(null)}
        title={translate("Delete Death Charity Member")}
        isDelete
        itemToDelete={deleteDialog?.fullname}
        onConfirm={confirmDelete}
      />
    </div>
  );
}
