import React from "react";

export default function Field({ label, value }) {
  const empty = value == null || value.toString().trim() === "";
  return (
    <div className="py-3 border-b border-gray-100 dark:border-gray-700 last:border-0">
      <p className="text-emerald-700 dark:text-emerald-400 text-xs uppercase tracking-widest font-semibold mb-1">{label}</p>
      <p className={`text-sm ${empty ? "text-gray-400 dark:text-gray-500" : "text-gray-900 dark:text-white font-medium"}`}>
        {empty ? "—" : value}
      </p>
    </div>
  );
}