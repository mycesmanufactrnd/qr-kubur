import { Controller } from "react-hook-form";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { resolveFileUrl } from '@/utils';

export default function FileUploadForm({
  name,
  control,
  label,
  required = false,
  errors = {},
  bucketName,
  handleFileUpload,
  uploading = false,
  translate = (v) => v,
}) {
  const errorMessage = errors?.[name]?.message;

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
            ? { required: `${label} is required` }
            : undefined
        }
        render={({ field }) => (
          <>
            <div className="flex items-center gap-3">
              <Input
                type="file"
                accept="image/*"
                onChange={async (e) => {
                  const file = e.target.files?.[0];
                  if (!file) return;

                  const fileName = await handleFileUpload(file, bucketName);
                  if (fileName) {
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

            {field.value && (
              <div className="mt-2 relative inline-block">
                <img
                  src={resolveFileUrl(field.value, bucketName)}
                  alt={translate("Preview")}
                  className="max-h-40 rounded border shadow-sm"
                />
              </div>
            )}
          </>
        )}
      />

      {required && errorMessage && (
        <p className="text-sm text-red-500">{errorMessage}</p>
      )}
    </div>
  );
}
