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

  useEffect(() => {
    if (!fieldValue) {
      setIsUrlMode(false);
      setUrlInput("");
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
          const previewValue = isUrlMode ? urlInput : field.value;
          const previewSrc = previewValue
            ? isUrlMode
              ? previewValue
              : resolveFileUrl(previewValue, bucketName)
            : "";

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

                    const fileName = await handleFileUpload(file, bucketName);
                    if (fileName) {
                      setIsUrlMode(false);
                      setUrlInput("");
                      field.onChange(fileName);
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
                        setFileInputKey((prev) => prev + 1);
                      } else {
                        setIsUrlMode(false);
                      }
                      field.onChange(value);
                    }}
                  />
                </div>
              )}

              {previewSrc && (
                <div className="mt-2 relative inline-block">
                  <img
                    src={previewSrc}
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
