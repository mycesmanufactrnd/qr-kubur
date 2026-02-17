import { Controller } from "react-hook-form";
import { Label } from "@/components/ui/label";
import ReactQuill from "react-quill";
import "react-quill/dist/quill.snow.css";

export default function RichTextEditorForm({
  name,
  control,
  label,
  required = false,
  errors = {},
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
          <ReactQuill
            theme="snow"
            value={field.value ?? ""}
            onChange={field.onChange}
            className="bg-white"
          />
        )}
      />

      {required && errorMessage && (
        <p className="text-sm text-red-500">{errorMessage}</p>
      )}
    </div>
  );
}
