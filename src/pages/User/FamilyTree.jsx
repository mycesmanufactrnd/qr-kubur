// @ts-nocheck
import { useMemo, useState } from "react";
import { useForm } from "react-hook-form";
import { Users, Plus, Trash2, User as UserIcon, MapPin } from "lucide-react";
import BackNavigation from "@/components/BackNavigation";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from "@/components/ui/dialog";
import ConfirmDialog from "@/components/ConfirmDialog";
import SelectForm from "@/components/forms/SelectForm";
import Select2Form from "@/components/forms/Select2Form";
import TextInputForm from "@/components/forms/TextInputForm";
import { trpc } from "@/utils/trpc";
import { translate } from "@/utils/translations";
import { STATES_MY, FamilyRelation } from "@/utils/enums";
import { useGetGravesCoordinates } from "@/mutations/useGraveMutations";
import { showApiError, showSuccess } from "@/components/ToastrNotification";
import { getStoredGoogleUser, useLoginGoogle } from "@/utils/auth";

function GoogleIcon({ className }) {
  return (
    <svg viewBox="0 0 24 24" className={className} xmlns="http://www.w3.org/2000/svg">
      <path
        d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"
        fill="#4285F4"
      />
      <path
        d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"
        fill="#34A853"
      />
      <path
        d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"
        fill="#FBBC05"
      />
      <path
        d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"
        fill="#EA4335"
      />
    </svg>
  );
}

const RELATION_LABEL_KEYS = {
  [FamilyRelation.FATHER]: "Father",
  [FamilyRelation.MOTHER]: "Mother",
  [FamilyRelation.GRANDFATHER]: "Grandfather",
  [FamilyRelation.GRANDMOTHER]: "Grandmother",
  [FamilyRelation.SPOUSE]: "Spouse",
  [FamilyRelation.SIBLING]: "Sibling",
  [FamilyRelation.SON]: "Son",
  [FamilyRelation.DAUGHTER]: "Daughter",
  [FamilyRelation.UNCLE]: "Uncle",
  [FamilyRelation.AUNT]: "Aunt",
  [FamilyRelation.OTHER]: "Other",
};

const DEFAULT_FORM = {
  state: "",
  grave: "",
  deadpersonId: "",
  relation: "",
  relationother: "",
};

function AddFamilyMemberDialog({ open, onOpenChange, onSaved, googleUserId }) {
  const {
    control,
    handleSubmit,
    watch,
    setValue,
    reset,
    formState: { errors },
  } = useForm({ defaultValues: DEFAULT_FORM });

  const watchState = watch("state");
  const watchGrave = watch("grave");
  const watchRelation = watch("relation");

  const { data: graves = [], isLoading: isGravesLoading } =
    useGetGravesCoordinates(null, watchState ? { state: watchState } : {});

  const graveOptions = useMemo(
    () => graves.map((g) => ({ value: String(g.id), label: g.name })),
    [graves],
  );

  const { data: persons = [], isLoading: isPersonsLoading } =
    trpc.deadperson.getDeadPersonByGraveId.useQuery(
      { graveId: Number(watchGrave) || 0 },
      { enabled: !!watchGrave },
    );

  const personOptions = useMemo(
    () =>
      (persons ?? []).map((p) => ({
        value: String(p.id),
        label: p.icnumber ? `${p.name} (${p.icnumber})` : p.name,
      })),
    [persons],
  );

  const relationOptions = Object.entries(RELATION_LABEL_KEYS).map(
    ([value, labelKey]) => ({ value, label: translate(labelKey) }),
  );

  const createMutation = trpc.familyTree.create.useMutation({
    onSuccess: () => {
      showSuccess(translate("Family member added"), "success");
      reset(DEFAULT_FORM);
      onSaved();
    },
    onError: (err) => showApiError(err),
  });

  const onSubmit = async (data) => {
    if (!data.deadpersonId || !data.relation) return;
    await createMutation.mutateAsync({
      googleuserId: googleUserId,
      deadpersonId: Number(data.deadpersonId),
      relation: data.relation,
      relationother:
        data.relation === FamilyRelation.OTHER
          ? data.relationother?.trim() || null
          : null,
    });
  };

  return (
    <Dialog
      open={open}
      onOpenChange={(v) => {
        if (!v) reset(DEFAULT_FORM);
        onOpenChange(v);
      }}
    >
      <DialogContent className="max-w-md dark:bg-slate-800">
        <DialogHeader>
          <DialogTitle>{translate("Add Family Member")}</DialogTitle>
        </DialogHeader>

        <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
          <SelectForm
            name="state"
            control={control}
            label={translate("State")}
            placeholder={translate("Select state")}
            options={STATES_MY}
            required
            errors={errors}
            onValueChange={() => {
              setValue("grave", "");
              setValue("deadpersonId", "");
            }}
          />

          <Select2Form
            name="grave"
            control={control}
            label={translate("Cemetery")}
            placeholder={translate("Select Cemetery")}
            options={graveOptions}
            disabled={!watchState}
            loading={isGravesLoading}
            disabledMessage={
              !watchState ? translate("Select state first") : undefined
            }
            searchPlaceholder={translate("Search grave...")}
            emptyMessage={translate("No grave found")}
            required
            errors={errors}
            onValueChange={() => setValue("deadpersonId", "")}
          />

          <Select2Form
            name="deadpersonId"
            control={control}
            label={translate("Deceased")}
            placeholder={translate("Select Deceased")}
            options={personOptions}
            disabled={!watchGrave}
            loading={isPersonsLoading}
            disabledMessage={
              !watchGrave ? translate("Select Cemetery") : undefined
            }
            searchPlaceholder={translate("Search deceased...")}
            emptyMessage={translate("No deceased found")}
            required
            errors={errors}
          />

          <SelectForm
            name="relation"
            control={control}
            label={translate("Relation")}
            placeholder={translate("Select relation")}
            options={relationOptions}
            required
            errors={errors}
          />

          {watchRelation === FamilyRelation.OTHER && (
            <TextInputForm
              name="relationother"
              control={control}
              label={translate("Specify Relation")}
              placeholder={translate("Specify Relation")}
              required
              errors={errors}
            />
          )}

          <DialogFooter>
            <Button
              type="button"
              variant="outline"
              onClick={() => onOpenChange(false)}
            >
              {translate("Cancel")}
            </Button>
            <Button
              type="submit"
              disabled={createMutation.isPending}
              className="bg-emerald-600 hover:bg-emerald-700 text-white"
            >
              {createMutation.isPending
                ? translate("Saving...")
                : translate("Save")}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}

export default function FamilyTree() {
  const [googleUser, setGoogleUser] = useState(() => getStoredGoogleUser());
  const [signInError, setSignInError] = useState("");
  const [isSigningIn, setIsSigningIn] = useState(false);

  const { login, loading: loggingIn, error: loginError } = useLoginGoogle({
    redirectOnSuccess: false,
    onLoginSuccess: (user) => setGoogleUser(user),
  });

  const handleGoogleSignIn = async () => {
    setSignInError("");
    setIsSigningIn(true);
    try {
      const { signInWithPopup, GoogleAuthProvider } =
        await import("firebase/auth");
      const { auth } = await import("@/firebase/firebase");
      const provider = new GoogleAuthProvider();
      const result = await signInWithPopup(auth, provider);
      const firebaseIdToken = await result.user.getIdToken();
      login(firebaseIdToken);
    } catch (e) {
      const cancelled =
        e?.code === "auth/popup-closed-by-user" ||
        e?.code === "auth/cancelled-popup-request";
      if (!cancelled) setSignInError(e?.message || String(e));
    } finally {
      setIsSigningIn(false);
    }
  };

  const [addDialogOpen, setAddDialogOpen] = useState(false);
  const [memberToDelete, setMemberToDelete] = useState(null);

  const {
    data: members = [],
    isLoading,
    refetch,
  } = trpc.familyTree.getByGoogleUser.useQuery(
    { googleUserId: googleUser?.id ?? null },
    { enabled: !!googleUser?.id },
  );

  const deleteMutation = trpc.familyTree.delete.useMutation({
    onSuccess: () => {
      showSuccess(translate("Deleted"), "success");
      refetch();
      setMemberToDelete(null);
    },
    onError: (err) => showApiError(err),
  });

  const relationLabel = (relation, relationother) => {
    if (relation === FamilyRelation.OTHER) {
      return relationother || translate("Other");
    }
    return translate(RELATION_LABEL_KEYS[relation] || relation);
  };

  return (
    <div className="min-h-screen pb-12 dark:bg-slate-900">
      <BackNavigation title={translate("Family Tree")} />

      <div className="max-w-2xl mx-auto px-3 space-y-4">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <div className="w-9 h-9 rounded-full bg-emerald-50 dark:bg-emerald-900/20 border border-emerald-100 dark:border-emerald-800 flex items-center justify-center">
              <Users className="w-5 h-5 text-emerald-600" />
            </div>
            <p className="text-sm font-semibold text-slate-800 dark:text-slate-100">
              {translate("Your Saved Family Members")}
            </p>
          </div>
          {!!googleUser?.id && (
            <Button
              onClick={() => setAddDialogOpen(true)}
              className="bg-emerald-600 hover:bg-emerald-700 text-white"
            >
              <Plus className="w-4 h-4 mr-2" />
              {translate("Add")}
            </Button>
          )}
        </div>

        {!googleUser?.id ? (
          <div className="bg-white dark:bg-slate-800 rounded-2xl border border-slate-100 dark:border-slate-700 px-4 py-10 flex flex-col items-center gap-4 text-center">
            <div className="w-12 h-12 rounded-full bg-slate-50 dark:bg-slate-700 border border-slate-100 dark:border-slate-600 flex items-center justify-center">
              <UserIcon className="w-6 h-6 text-slate-300 dark:text-slate-500" />
            </div>
            <p className="text-sm text-slate-500 dark:text-slate-400 max-w-[260px] leading-relaxed">
              {translate("Please sign in with Google to build your family tree")}
            </p>
            <button
              type="button"
              disabled={loggingIn || isSigningIn}
              onClick={handleGoogleSignIn}
              className="w-full max-w-[260px] h-10 flex items-center justify-center gap-2.5 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-700 hover:bg-slate-50 dark:hover:bg-slate-600 active:scale-95 transition-all text-sm font-medium text-slate-700 dark:text-slate-200 disabled:opacity-50"
            >
              <GoogleIcon className="w-4 h-4" />
              {loggingIn || isSigningIn
                ? translate("Logging in") + "..."
                : translate("Sign in with Google")}
            </button>
            {(signInError || loginError) && (
              <p className="text-xs text-red-500 bg-red-50 dark:bg-red-900/20 border border-red-100 dark:border-red-800 rounded-xl p-2.5 max-w-[260px]">
                {signInError || loginError}
              </p>
            )}
          </div>
        ) : isLoading ? (
          <div className="space-y-3">
            {[1, 2, 3].map((i) => (
              <div
                key={i}
                className="h-20 rounded-2xl bg-slate-100 dark:bg-slate-800 animate-pulse"
              />
            ))}
          </div>
        ) : members.length === 0 ? (
          <div className="bg-white dark:bg-slate-800 rounded-2xl border border-slate-100 dark:border-slate-700 px-4 py-10 flex flex-col items-center gap-3 text-center">
            <div className="w-12 h-12 rounded-full bg-slate-50 dark:bg-slate-700 border border-slate-100 dark:border-slate-600 flex items-center justify-center">
              <Users className="w-6 h-6 text-slate-300 dark:text-slate-500" />
            </div>
            <p className="text-sm font-medium text-slate-500 dark:text-slate-400">
              {translate("No family members saved yet")}
            </p>
          </div>
        ) : (
          <div className="space-y-3">
            {members.map((member) => (
              <div
                key={member.id}
                className="bg-white dark:bg-slate-800 rounded-2xl border border-slate-100 dark:border-slate-700 p-4 flex items-start gap-3"
              >
                <div className="w-10 h-10 rounded-full bg-emerald-50 dark:bg-emerald-900/20 border border-emerald-100 dark:border-emerald-800 flex items-center justify-center shrink-0">
                  <UserIcon className="w-5 h-5 text-emerald-600" />
                </div>
                <div className="flex-1 min-w-0 space-y-1">
                  <div className="flex items-center gap-2 flex-wrap">
                    <p className="text-sm font-semibold text-slate-800 dark:text-slate-100 truncate">
                      {member.deadperson?.name ?? "-"}
                    </p>
                    <span className="text-[11px] font-medium px-2 py-0.5 rounded-full bg-emerald-50 dark:bg-emerald-900/20 text-emerald-700 dark:text-emerald-400 border border-emerald-100 dark:border-emerald-800">
                      {relationLabel(member.relation, member.relationother)}
                    </span>
                  </div>
                  {member.deadperson?.icnumber && (
                    <p className="text-xs text-slate-400 dark:text-slate-500 font-mono">
                      {member.deadperson.icnumber}
                    </p>
                  )}
                  {member.deadperson?.grave?.name && (
                    <p className="text-xs text-slate-500 dark:text-slate-400 flex items-center gap-1">
                      <MapPin className="w-3 h-3 shrink-0" />
                      {member.deadperson.grave.name}
                    </p>
                  )}
                </div>
                <button
                  onClick={() => setMemberToDelete(member)}
                  className="p-1.5 rounded-lg text-slate-400 hover:text-red-500 hover:bg-red-50 dark:hover:bg-red-900/20 shrink-0"
                >
                  <Trash2 className="w-4 h-4" />
                </button>
              </div>
            ))}
          </div>
        )}
      </div>

      <AddFamilyMemberDialog
        open={addDialogOpen}
        onOpenChange={setAddDialogOpen}
        googleUserId={googleUser?.id ?? null}
        onSaved={() => {
          setAddDialogOpen(false);
          refetch();
        }}
      />

      <ConfirmDialog
        open={!!memberToDelete}
        onOpenChange={(open) => !open && setMemberToDelete(null)}
        title={translate("Delete Family Member")}
        description={`${translate("Delete")} "${memberToDelete?.deadperson?.name ?? ""}"?`}
        onConfirm={() => deleteMutation.mutateAsync(memberToDelete.id)}
        confirmText={translate("Delete")}
        variant="destructive"
      />
    </div>
  );
}
