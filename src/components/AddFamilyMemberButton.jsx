// @ts-nocheck
import { useState } from "react";
import { useForm } from "react-hook-form";
import { Users, UserCheck } from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from "@/components/ui/dialog";
import ConfirmDialog from "@/components/ConfirmDialog";
import BottomSheetSelectForm from "@/components/forms/BottomSheetSelectForm";
import TextInputForm from "@/components/forms/TextInputForm";
import { trpc } from "@/utils/trpc";
import { translate } from "@/utils/translations";
import { FamilyRelation } from "@/utils/enums";
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

export default function AddFamilyMemberButton({ deadPersonId, compact = false }) {
  const [googleUser] = useState(() => getStoredGoogleUser());
  const [loginDialogOpen, setLoginDialogOpen] = useState(false);
  const [relationDialogOpen, setRelationDialogOpen] = useState(false);
  const [removeConfirmOpen, setRemoveConfirmOpen] = useState(false);
  const [isSigningIn, setIsSigningIn] = useState(false);
  const [signInError, setSignInError] = useState("");

  const trpcUtils = trpc.useUtils();

  const { data: familyMembers = [] } = trpc.familyTree.getByGoogleUser.useQuery(
    { googleUserId: googleUser?.id ?? null },
    { enabled: !!googleUser?.id },
  );

  const existingEntry = familyMembers.find(
    (m) => m.deadperson?.id === deadPersonId,
  );

  const { login, loading: loggingIn, error: loginError } = useLoginGoogle({
    redirectOnSuccess: false,
    onLoginSuccess: () => {
      window.location.reload();
    },
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

  const {
    control,
    handleSubmit,
    watch,
    reset,
    formState: { errors },
  } = useForm({ defaultValues: { relation: "", relationother: "" } });

  const watchRelation = watch("relation");

  const relationOptions = Object.entries(RELATION_LABEL_KEYS).map(
    ([value, labelKey]) => ({ value, label: translate(labelKey) }),
  );

  const createMutation = trpc.familyTree.create.useMutation({
    onSuccess: () => {
      showSuccess(translate("Family member added"), "success");
      reset();
      setRelationDialogOpen(false);
      trpcUtils.familyTree.getByGoogleUser.invalidate();
    },
    onError: (err) => showApiError(err),
  });

  const deleteMutation = trpc.familyTree.delete.useMutation({
    onSuccess: () => {
      showSuccess(translate("Removed from family tree"), "success");
      trpcUtils.familyTree.getByGoogleUser.invalidate();
    },
    onError: (err) => showApiError(err),
  });

  const handleClick = () => {
    if (existingEntry) {
      setRemoveConfirmOpen(true);
      return;
    }
    if (!googleUser?.id) {
      setLoginDialogOpen(true);
    } else {
      setRelationDialogOpen(true);
    }
  };

  const onSubmit = async (data) => {
    if (!data.relation) return;
    await createMutation.mutateAsync({
      googleuserId: googleUser.id,
      deadpersonId: deadPersonId,
      relation: data.relation,
      relationother:
        data.relation === FamilyRelation.OTHER
          ? data.relationother?.trim() || null
          : null,
    });
  };

  const buttonClass = compact
    ? existingEntry
      ? "w-full h-8 px-2 text-[11px] bg-emerald-50 dark:bg-emerald-900/20 text-emerald-700 dark:text-emerald-400 border border-emerald-200 dark:border-emerald-800 hover:bg-emerald-100 dark:hover:bg-emerald-900/30"
      : "w-full h-8 px-2 text-[11px] bg-gradient-to-r from-emerald-600 to-emerald-500 text-white border-0 shadow-sm shadow-emerald-200/50 dark:shadow-emerald-900/30"
    : existingEntry
      ? "w-full bg-emerald-50 dark:bg-emerald-900/20 text-emerald-700 dark:text-emerald-400 border border-emerald-200 dark:border-emerald-800 hover:bg-emerald-100 dark:hover:bg-emerald-900/30"
      : "w-full bg-gradient-to-r from-emerald-600 to-emerald-500 text-white border-0 shadow-md shadow-emerald-200/50 dark:shadow-emerald-900/30 hover:opacity-90";

  return (
    <>
      <Button type="button" onClick={handleClick} className={buttonClass}>
        {existingEntry ? (
          <UserCheck className={compact ? "w-3.5 h-3.5" : "w-4 h-4 mr-2"} />
        ) : (
          <Users className={compact ? "w-3.5 h-3.5" : "w-4 h-4 mr-2"} />
        )}
        {!compact &&
          (existingEntry
            ? translate("Added to Family Tree")
            : translate("Add as Family Member"))}
      </Button>

      <Dialog open={loginDialogOpen} onOpenChange={setLoginDialogOpen}>
        <DialogContent className="max-w-sm dark:bg-slate-800">
          <DialogHeader>
            <DialogTitle>{translate("Sign in required")}</DialogTitle>
          </DialogHeader>
          <p className="text-sm text-slate-500 dark:text-slate-400">
            {translate(
              "Please sign in with Google to add this person to your family tree.",
            )}
          </p>
          <button
            type="button"
            disabled={loggingIn || isSigningIn}
            onClick={handleGoogleSignIn}
            className="w-full h-10 flex items-center justify-center gap-2.5 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-700 hover:bg-slate-50 dark:hover:bg-slate-600 active:scale-95 transition-all text-sm font-medium text-slate-700 dark:text-slate-200 disabled:opacity-50"
          >
            <GoogleIcon className="w-4 h-4" />
            {loggingIn || isSigningIn
              ? translate("Logging in") + "..."
              : translate("Sign in with Google")}
          </button>
          {(signInError || loginError) && (
            <p className="text-xs text-red-500 bg-red-50 dark:bg-red-900/20 border border-red-100 dark:border-red-800 rounded-xl p-2.5">
              {signInError || loginError}
            </p>
          )}
        </DialogContent>
      </Dialog>

      <Dialog
        open={relationDialogOpen}
        onOpenChange={(v) => {
          if (!v) reset();
          setRelationDialogOpen(v);
        }}
      >
        <DialogContent className="max-w-sm dark:bg-slate-800">
          <DialogHeader>
            <DialogTitle>{translate("Add as Family Member")}</DialogTitle>
          </DialogHeader>
          <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
            <BottomSheetSelectForm
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
                onClick={() => setRelationDialogOpen(false)}
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

      <ConfirmDialog
        open={removeConfirmOpen}
        onOpenChange={setRemoveConfirmOpen}
        title={translate("Remove from Family Tree")}
        description={translate(
          "Remove this person from your saved family tree?",
        )}
        confirmText={translate("Remove")}
        variant="destructive"
        onConfirm={() => {
          if (existingEntry) deleteMutation.mutate(existingEntry.id);
        }}
      />
    </>
  );
}
