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
import GoogleSignInDialog from "@/components/GoogleSignInDialog";
import BottomSheetSelectForm from "@/components/forms/BottomSheetSelectForm";
import TextInputForm from "@/components/forms/TextInputForm";
import { trpc } from "@/utils/trpc";
import { translate } from "@/utils/translations";
import { FamilyRelation } from "@/utils/enums";
import { showApiError, showSuccess } from "@/components/ToastrNotification";
import { getStoredGoogleUser } from "@/utils/auth";

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

  const trpcUtils = trpc.useUtils();

  const { data: familyMembers = [] } = trpc.familyTree.getByGoogleUser.useQuery(
    { googleUserId: googleUser?.id ?? null },
    { enabled: !!googleUser?.id },
  );

  const existingEntry = familyMembers.find(
    (m) => m.deadperson?.id === deadPersonId,
  );

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

      <GoogleSignInDialog
        open={loginDialogOpen}
        onOpenChange={setLoginDialogOpen}
        message={translate(
          "Please sign in with Google to add this person to your family tree.",
        )}
        onLoginSuccess={() => window.location.reload()}
      />

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
