import { Inbox } from "lucide-react";

export default function NoDataTableComponent({
  colSpan = 1,
  message = "No data available",
  description = "There is nothing to display at the moment"
}) {
  return (
    <tr>
      <td colSpan={colSpan} className="p-10 text-center">
        <div className="flex flex-col items-center justify-center gap-3 text-gray-500">
          <Inbox className="w-10 h-10 text-gray-300" />
          <p className="text-sm font-medium text-gray-600">
            {message}
          </p>
          <p className="text-xs text-gray-400">
            {description}
          </p>
        </div>
      </td>
    </tr>
  );
}
