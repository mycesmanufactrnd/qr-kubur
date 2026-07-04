// @ts-nocheck
import { useEffect, useState } from "react";
import { Controller, useWatch } from "react-hook-form";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { resolveFileUrl } from "@/utils";
import { compressImage } from "@/utils/fileCompression";
import { FileText, Image as ImageIcon, X } from "lucide-react";
import { showApiError } from "@/components/ToastrNotification";
import FilePreviewDialog from "@/components/forms/FilePreviewDialog";

const isAllowedFile = (file, accept) => {
  const types = (accept || "image/*").split(",").map((t) => t.trim());
  return types.some((t) => {
    if (t === "image/*") return file.type.startsWith("image/");
    return file.type === t;
  });
};

export default function FileUploadForm({
  name,
  control,
  label,
  required = false,
  errors = {},
  bucketName,
  subBucketName = null,
  handleFileUpload,
  uploading = false,
  isNeedPasteURL = true,
  isShowList = false,
  accept = "image/*",
  translate = (v) => v,
}) {
  const errorMessage = errors?.[name]?.message;
  const fieldValue = useWatch({ control, name });
  const [urlInput, setUrlInput] = useState("");
  const [isUrlMode, setIsUrlMode] = useState(false);
  const [fileInputKey, setFileInputKey] = useState(0);
  const [localPreviewSrc, setLocalPreviewSrc] = useState("");
  const [localIsPdf, setLocalIsPdf] = useState(false);
  const [compressing, setCompressing] = useState(false);
  const [previewOpen, setPreviewOpen] = useState(false);

  // Sync URL mode when field value changes externally
  useEffect(() => {
    if (!fieldValue) {
      setIsUrlMode(false);
      setUrlInput("");
      setLocalPreviewSrc("");
      return;
    }
    if (typeof fieldValue === "string" && /^https?:\/\//i.test(fieldValue)) {
      setIsUrlMode(true);
      setUrlInput(fieldValue);
      return;
    }
    if (isUrlMode && fieldValue !== urlInput) {
      setIsUrlMode(false);
      setUrlInput("");
    }
  }, [fieldValue, isUrlMode, urlInput]);

  const busy = compressing || uploading;

  return (
    <div className="space-y-2">
      <Label>
        {label}
        {required && <span className="text-red-500 ml-1">*</span>}
      </Label>

      <Controller
        name={name}
        control={control}
        rules={required ? { required: `${label} is required` } : undefined}
        render={({ field }) => {
          const storedPreviewValue = isUrlMode ? urlInput : field.value;
          const storedPreviewSrc = storedPreviewValue
            ? isUrlMode
              ? storedPreviewValue
              : resolveFileUrl(storedPreviewValue, bucketName)
            : "";

          const fallbackSrc =
            subBucketName && storedPreviewValue && !isUrlMode
              ? resolveFileUrl(storedPreviewValue, subBucketName)
              : null;

          const displaySrc = localPreviewSrc || storedPreviewSrc;
          const isPdfPreview = localPreviewSrc
            ? localIsPdf
            : !isUrlMode && /\.pdf$/i.test(storedPreviewValue || "");

          return (
            <>
              <div className="flex items-center gap-3">
                <Input
                  key={fileInputKey}
                  type="file"
                  accept={accept}
                  className="dark:border-slate-600 dark:bg-slate-700 dark:text-slate-200"
                  disabled={busy}
                  onChange={async (e) => {
                    const file = e.target.files?.[0];
                    if (!file) return;

                    if (!isAllowedFile(file, accept)) {
                      showApiError({ message: "Jenis fail tidak dibenarkan." });
                      setFileInputKey((prev) => prev + 1);
                      return;
                    }

                    // Show preview from original immediately — user sees it at once
                    const objectUrl = URL.createObjectURL(file);
                    setLocalIsPdf(file.type === "application/pdf");
                    setLocalPreviewSrc(objectUrl);

                    // Compress off-thread, show indicator while waiting
                    setCompressing(true);
                    const compressed = await compressImage(file);
                    setCompressing(false);

                    const fileName = await handleFileUpload(
                      compressed,
                      bucketName,
                    );

                    if (fileName) {
                      setIsUrlMode(false);
                      setUrlInput("");
                      field.onChange(fileName);
                    } else {
                      setLocalPreviewSrc("");
                    }
                  }}
                />

                {compressing && (
                  <span className="text-sm text-slate-500 whitespace-nowrap">
                    Memampatkan...
                  </span>
                )}
                {!compressing && uploading && (
                  <span className="text-sm text-slate-500 whitespace-nowrap">
                    {translate("uploading...")}
                  </span>
                )}
              </div>

              {isNeedPasteURL && (
                <div className="space-y-2">
                  <Label className="text-xs text-gray-500">
                    {translate("Or paste image URL")}
                  </Label>
                  <Input
                    type="url"
                    className="dark:border-slate-600 dark:bg-slate-700 dark:text-slate-200"
                    placeholder="https://"
                    value={urlInput}
                    onChange={(e) => {
                      const value = e.target.value;
                      setUrlInput(value);
                      if (value) {
                        setIsUrlMode(true);
                        setLocalPreviewSrc("");
                        setFileInputKey((prev) => prev + 1);
                      } else {
                        setIsUrlMode(false);
                      }
                      field.onChange(value);
                    }}
                  />
                </div>
              )}

              {isShowList && displaySrc && (
                <>
                  <ul className="space-y-1.5">
                    <li className="flex items-center gap-2 bg-slate-50 dark:bg-slate-700/50 border border-slate-200 dark:border-slate-600 rounded-lg px-2.5 py-1.5">
                      {isPdfPreview ? (
                        <FileText className="w-4 h-4 text-red-500 flex-shrink-0" />
                      ) : (
                        <ImageIcon className="w-4 h-4 text-blue-500 flex-shrink-0" />
                      )}
                      <button
                        type="button"
                        onClick={() => setPreviewOpen(true)}
                        className="text-xs text-slate-700 dark:text-slate-200 underline truncate flex-1 text-left"
                      >
                        {(storedPreviewValue || "").replace(
                          /^[0-9a-f-]{36}-/i,
                          "",
                        )}
                      </button>
                      <button
                        type="button"
                        onClick={() => {
                          setLocalPreviewSrc("");
                          field.onChange("");
                        }}
                        className="text-slate-400 hover:text-red-500 flex-shrink-0"
                      >
                        <X className="w-3.5 h-3.5" />
                      </button>
                    </li>
                  </ul>
                  <FilePreviewDialog
                    open={previewOpen}
                    onClose={() => setPreviewOpen(false)}
                    src={displaySrc}
                    isPdf={isPdfPreview}
                    title={label}
                  />
                </>
              )}

              {!isShowList && displaySrc && isPdfPreview && (
                <>
                  <button
                    type="button"
                    onClick={() => setPreviewOpen(true)}
                    className="mt-2 inline-flex items-center gap-1.5 text-sm text-blue-600 dark:text-blue-400 underline"
                  >
                    <FileText className="w-4 h-4" />
                    {translate("View PDF")}
                  </button>
                  <FilePreviewDialog
                    open={previewOpen}
                    onClose={() => setPreviewOpen(false)}
                    src={displaySrc}
                    isPdf
                    title={label}
                  />
                </>
              )}

              {!isShowList && displaySrc && !isPdfPreview && (
                <div className="mt-2 relative inline-block">
                  <img
                    src={displaySrc}
                    alt={translate("Preview")}
                    referrerPolicy={
                      !displaySrc.startsWith("blob:") &&
                      !displaySrc.startsWith("data:") &&
                      !displaySrc.startsWith("/")
                        ? "no-referrer"
                        : undefined
                    }
                    className="max-h-40 rounded border shadow-sm"
                    onError={(e) => {
                      if (
                        fallbackSrc &&
                        !e.currentTarget.src.startsWith("blob:") &&
                        e.currentTarget.src !== fallbackSrc
                      ) {
                        e.currentTarget.src = fallbackSrc;
                      } else {
                        e.currentTarget.style.display = "none";
                      }
                    }}
                  />
                </div>
              )}
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
