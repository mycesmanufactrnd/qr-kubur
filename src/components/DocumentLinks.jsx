// @ts-nocheck
import { useState } from "react";
import FilePreviewDialog from "@/components/forms/FilePreviewDialog";
import { resolveFileUrl } from "@/utils";

const isPdfKey = (key) => /\.pdf$/i.test(key || "");

export default function DocumentLinks({ label, value, bucket }) {
  const [previewKey, setPreviewKey] = useState(null);
  const keys = (value ?? "").split(",").filter(Boolean);
  if (!keys.length) return null;
  return (
    <div className="space-y-1">
      <p className="text-[11px] font-semibold uppercase tracking-wider text-slate-400 dark:text-slate-500">
        {label}
      </p>
      <ul className="space-y-0.5">
        {keys.map((key) => (
          <li key={key}>
            <button
              type="button"
              onClick={() => setPreviewKey(key)}
              className="text-xs text-blue-600 dark:text-blue-400 underline break-all text-left"
            >
              {key.replace(/^[0-9a-f-]{36}-/i, "")}
            </button>
          </li>
        ))}
      </ul>
      <FilePreviewDialog
        open={!!previewKey}
        onClose={() => setPreviewKey(null)}
        src={previewKey ? resolveFileUrl(previewKey, bucket) : null}
        isPdf={isPdfKey(previewKey)}
        title={label}
      />
    </div>
  );
}
