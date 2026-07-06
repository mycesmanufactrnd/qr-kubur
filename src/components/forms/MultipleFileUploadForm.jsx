// @ts-nocheck
import { useState } from "react";
import { Controller } from "react-hook-form";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { resolveFileUrl } from "@/utils";
import { compressImage } from "@/utils/fileCompression";
import { FileText, Image as ImageIcon, X, Loader2 } from "lucide-react";
import { showApiError } from "@/components/ToastrNotification";
import FilePreviewDialog from "@/components/forms/FilePreviewDialog";

const DEFAULT_ACCEPT = "image/*,application/pdf";

const isPdfKey = (key) => /\.pdf$/i.test(key || "");

const isAllowedFile = (file) =>
  file.type === "application/pdf" || file.type.startsWith("image/");

export default function MultipleFileUploadForm({
  name,
  control,
  label,
  required = false,
  errors = {},
  bucketName,
  handleFileUpload,
  // accept = DEFAULT_ACCEPT,
  accept = "image/*",
  translate = (v) => v,
}) {
  const errorMessage = errors?.[name]?.message;
  const [busy, setBusy] = useState(false);
  const [fileInputKey, setFileInputKey] = useState(0);
  const [previewKey, setPreviewKey] = useState(null);

  return (
    <div className="space-y-2">
      <Label>
        {label}
        {required && <span className="text-red-500 ml-1">*</span>}
      </Label>

      <Controller
        name={name}
        control={control}
        rules={
          required
            ? {
                validate: (v) =>
                  (v ?? "").split(",").filter(Boolean).length > 0 ||
                  `${label} is required`,
              }
            : undefined
        }
        render={({ field }) => {
          const keys = (field.value ?? "").split(",").filter(Boolean);

          const removeKey = (key) => {
            field.onChange(keys.filter((k) => k !== key).join(","));
          };

          const onFilesSelected = async (e) => {
            const files = Array.from(e.target.files ?? []);
            if (!files.length) return;

            const invalid = files.filter((f) => !isAllowedFile(f));
            if (invalid.length) {
              showApiError({
                message: "Hanya fail imej atau PDF dibenarkan.",
              });
              setFileInputKey((prev) => prev + 1);
              return;
            }

            setBusy(true);
            try {
              const uploaded = [];
              for (const file of files) {
                const compressed = await compressImage(file);
                const fileKey = await handleFileUpload(compressed, bucketName);
                if (fileKey) uploaded.push(fileKey);
              }
              if (uploaded.length) {
                field.onChange([...keys, ...uploaded].join(","));
              }
            } finally {
              setBusy(false);
              setFileInputKey((prev) => prev + 1);
            }
          };

          return (
            <>
              <div className="flex items-center gap-3">
                <Input
                  key={fileInputKey}
                  type="file"
                  accept={accept}
                  multiple
                  className="dark:border-slate-600 dark:bg-slate-700 dark:text-slate-200"
                  disabled={busy}
                  onChange={onFilesSelected}
                />
                {busy && (
                  <span className="flex items-center gap-1.5 text-sm text-slate-500 whitespace-nowrap">
                    <Loader2 className="w-3.5 h-3.5 animate-spin" />
                    {translate("uploading...")}
                  </span>
                )}
              </div>

              {keys.length > 0 && (
                <ul className="space-y-1.5">
                  {keys.map((key) => (
                    <li
                      key={key}
                      className="flex items-center gap-2 bg-slate-50 dark:bg-slate-700/50 border border-slate-200 dark:border-slate-600 rounded-lg px-2.5 py-1.5"
                    >
                      {isPdfKey(key) ? (
                        <FileText className="w-4 h-4 text-red-500 flex-shrink-0" />
                      ) : (
                        <ImageIcon className="w-4 h-4 text-blue-500 flex-shrink-0" />
                      )}
                      <button
                        type="button"
                        onClick={() => setPreviewKey(key)}
                        className="text-xs text-slate-700 dark:text-slate-200 underline truncate flex-1 text-left"
                      >
                        {key.replace(/^[0-9a-f-]{36}-/i, "")}
                      </button>
                      <button
                        type="button"
                        onClick={() => removeKey(key)}
                        className="text-slate-400 hover:text-red-500 flex-shrink-0"
                      >
                        <X className="w-3.5 h-3.5" />
                      </button>
                    </li>
                  ))}
                </ul>
              )}

              <FilePreviewDialog
                open={!!previewKey}
                onClose={() => setPreviewKey(null)}
                src={previewKey ? resolveFileUrl(previewKey, bucketName) : null}
                isPdf={isPdfKey(previewKey)}
                title={label}
              />
            </>
          );
        }}
      />

      {required && errorMessage && (
        <p className="text-sm text-red-500">{errorMessage}</p>
      )}
    </div>
  );
}
