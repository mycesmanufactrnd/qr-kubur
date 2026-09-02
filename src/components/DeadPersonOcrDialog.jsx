// @ts-nocheck
import { useState } from "react";
import { useForm } from "react-hook-form";
import { ScanText, Loader2 } from "lucide-react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import TextInputForm from "@/components/forms/TextInputForm.jsx";
import FileUploadForm from "@/components/forms/FileUploadForm";
import { translate } from "@/utils/translations";
import {
  showApiError,
  showError,
  showSuccess,
} from "@/components/ToastrNotification";
import { appendCurrentUserToFormData } from "@/utils";
import { useDeadPersonMutations } from "@/mutations/useDeadPersonMutations";
import { parseDobFromIcNumber } from "@/utils/helpers";
import {
  recognizeDocumentText,
  extractDeadPersonFields,
} from "@/utils/deadPersonOcr";

const DEFAULT_FORM = {
  name: "",
  icnumber: "",
  dateofbirth: "",
  dateofdeath: "",
  causeofdeath: "",
  gravelot: "",
  deathconfirmationphotourl: "",
  policereportphotourl: "",
};

export default function DeadPersonOcrDialog({ open, onOpenChange, onSaved }) {
  const {
    control,
    handleSubmit,
    watch,
    setValue,
    reset,
    formState: { errors },
  } = useForm({ defaultValues: DEFAULT_FORM });

  const [uploading, setUploading] = useState(false);
  const [ocrRunning, setOcrRunning] = useState(false);

  const { createDeadPerson } = useDeadPersonMutations();

  const handleFileUpload = async (file, bucketName) => {
    setUploading(true);
    try {
      const formData = new FormData();
      formData.append("file", file);
      appendCurrentUserToFormData(formData);

      const res = await fetch(`/api/upload/${bucketName}`, {
        method: "POST",
        body: formData,
      });

      if (!res.ok) {
        const errData = await res.json().catch(() => ({}));
        showError(errData.error || translate("Failed to upload photo"));
        return null;
      }

      const data = await res.json();
      return data.file_url;
    } catch (err) {
      console.error(err);
      showError(translate("Failed to upload photo"));
      return null;
    } finally {
      setUploading(false);
    }
  };

  const runOcr = async (file) => {
    setOcrRunning(true);
    try {
      const text = await recognizeDocumentText(file);
      const fields = extractDeadPersonFields(text);

      if (fields.name && !watch("name")) setValue("name", fields.name);

      if (fields.icnumber && !watch("icnumber")) {
        setValue("icnumber", fields.icnumber);
        if (!watch("dateofbirth")) {
          const dob = parseDobFromIcNumber(fields.icnumber);
          if (dob) setValue("dateofbirth", dob);
        }
      }

      if (fields.dateofbirth && !watch("dateofbirth")) {
        setValue("dateofbirth", fields.dateofbirth);
      }
      if (fields.dateofdeath && !watch("dateofdeath")) {
        setValue("dateofdeath", fields.dateofdeath);
      }
      if (fields.causeofdeath && !watch("causeofdeath")) {
        setValue("causeofdeath", fields.causeofdeath);
      }
      if (fields.gravelot && !watch("gravelot")) {
        setValue("gravelot", fields.gravelot);
      }

      if (!Object.keys(fields).length) {
        showError(
          translate(
            "Could not read any details from the photo. Please fill in the details manually.",
          ),
        );
      }
    } catch (e) {
      console.error(e);
      showError(
        translate(
          "Could not read any details from the photo. Please fill in the details manually.",
        ),
      );
    } finally {
      setOcrRunning(false);
    }
  };

  const handleFileUploadWithOcr = async (file, bucketName) => {
    runOcr(file);
    return await handleFileUpload(file, bucketName);
  };

  const onSubmit = async (data) => {
    const payload = {
      name: data.name,
      icnumber: data.icnumber?.replace(/-/g, "").trim() || null,
      dateofbirth: data.dateofbirth || null,
      dateofdeath: data.dateofdeath || null,
      causeofdeath: data.causeofdeath?.trim() || null,
      gravelot: data.gravelot?.trim() || undefined,
      biography: null,
      heirname: null,
      heirphoneno: null,
      photourl: null,
      latitude: null,
      longitude: null,
      deathconfirmationphotourl: data.deathconfirmationphotourl || null,
      policereportphotourl: data.policereportphotourl || null,
    };

    try {
      await createDeadPerson.mutateAsync(payload);
      showSuccess(translate("Deceased record added"), "success");
      reset(DEFAULT_FORM);
      onOpenChange(false);
      onSaved?.();
    } catch (err) {
      showApiError(err);
    }
  };

  return (
    <Dialog
      open={open}
      onOpenChange={(v) => {
        if (!v) reset(DEFAULT_FORM);
        onOpenChange(v);
      }}
    >
      <DialogContent className="max-w-lg max-h-[90vh] overflow-y-auto dark:bg-slate-800">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <ScanText className="w-5 h-5 text-blue-600" />
            {translate("Add Deceased by Photo")}
          </DialogTitle>
        </DialogHeader>

        <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
          <p className="text-xs text-slate-500 dark:text-slate-400">
            {translate(
              "Upload or take a photo of the death confirmation letter or police report — details will be read automatically and can be edited before saving.",
            )}
          </p>

          <div className="grid grid-cols-2 gap-3">
            <FileUploadForm
              name="deathconfirmationphotourl"
              control={control}
              label={translate("Death Confirmation")}
              accept="image/*"
              isNeedPasteURL={false}
              bucketName="bucket-death-confirmation"
              uploading={uploading}
              handleFileUpload={handleFileUploadWithOcr}
            />
            <FileUploadForm
              name="policereportphotourl"
              control={control}
              label={translate("Police Report")}
              accept="image/*"
              isNeedPasteURL={false}
              bucketName="bucket-police-report"
              uploading={uploading}
              handleFileUpload={handleFileUploadWithOcr}
            />
          </div>

          {ocrRunning && (
            <div className="flex items-center gap-2 text-xs text-blue-600 dark:text-blue-400 bg-blue-50 dark:bg-blue-900/20 border border-blue-100 dark:border-blue-800 rounded-lg px-3 py-2">
              <Loader2 className="w-3.5 h-3.5 animate-spin" />
              {translate("Reading details from photo...")}
            </div>
          )}

          <div className="grid grid-cols-2 gap-3">
            <TextInputForm
              name="name"
              control={control}
              label={translate("Name")}
              required
              errors={errors}
            />
            <TextInputForm
              name="icnumber"
              control={control}
              isICNumber
              label={translate("IC No.")}
              errors={errors}
            />
          </div>
          <div className="grid grid-cols-2 gap-3">
            <TextInputForm
              name="dateofbirth"
              control={control}
              label={translate("Date of Birth")}
              isDate
              required
              errors={errors}
            />
            <TextInputForm
              name="dateofdeath"
              control={control}
              label={translate("Date of Death")}
              isDate
              required
              errors={errors}
            />
          </div>
          <TextInputForm
            name="causeofdeath"
            control={control}
            label={translate("Cause of Death")}
          />
          <TextInputForm
            name="gravelot"
            control={control}
            label={translate("Grave Lot")}
          />

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
              disabled={createDeadPerson.isPending || uploading}
              className="bg-blue-600 text-white"
            >
              {createDeadPerson.isPending
                ? translate("Saving...")
                : translate("Save")}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
