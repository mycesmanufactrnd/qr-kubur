import { useEffect, useState } from "react";
import { Controller, useWatch } from "react-hook-form";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { resolveFileUrl } from "@/utils";

export default function FileUploadForm({
  name,
  control,
  label,
  required = false,
  errors = {},
  bucketName,
  handleFileUpload,
  uploading = false,
  isNeedPasteURL = true,
  translate = (v) => v,
}) {
  const errorMessage = errors?.[name]?.message;
  const fieldValue = useWatch({ control, name });
  const [urlInput, setUrlInput] = useState("");
  const [isUrlMode, setIsUrlMode] = useState(false);
  const [fileInputKey, setFileInputKey] = useState(0);
  const [localPreviewSrc, setLocalPreviewSrc] = useState("");

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

          // Local blob URL takes priority; falls back to stored/resolved URL
          const displaySrc = localPreviewSrc || storedPreviewSrc;

          return (
            <>
              <div className="flex items-center gap-3">
                <Input
                  key={fileInputKey}
                  type="file"
                  accept="image/*"
                  onChange={async (e) => {
                    const file = e.target.files?.[0];
                    if (!file) return;

                    // Show local preview immediately so user sees the image
                    const objectUrl = URL.createObjectURL(file);
                    setLocalPreviewSrc(objectUrl);

                    const fileName = await handleFileUpload(file, bucketName);
                    if (fileName) {
                      setIsUrlMode(false);
                      setUrlInput("");
                      field.onChange(fileName);
                      // Keep local preview until field value resolves in next render
                    } else {
                      setLocalPreviewSrc("");
                    }
                  }}
                  disabled={uploading}
                />

                {uploading && (
                  <span className="text-sm text-gray-500">
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

              {displaySrc && (
                <div className="mt-2 relative inline-block">
                  <img
                    src={displaySrc}
                    alt={translate("Preview")}
                    className="max-h-40 rounded border shadow-sm"
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
