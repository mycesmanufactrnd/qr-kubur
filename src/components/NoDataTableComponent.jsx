import { Inbox } from "lucide-react";
import { translate } from "@/utils/translations";

export default function NoDataTableComponent({
  colSpan = 1,
  message,
  description,
}) {
  const displayMessage = message ?? translate("No data available");
  const displayDescription = description ?? translate("There is nothing to display at the moment");

  return (
    <tr>
      <td colSpan={colSpan} className="p-10 text-center">
        <div className="flex flex-col items-center justify-center gap-3 text-gray-500">
          <Inbox className="w-10 h-10 text-gray-300" />
          <p className="text-sm font-medium text-gray-600">
            {displayMessage}
          </p>
          <p className="text-xs text-gray-400">
            {displayDescription}
          </p>
        </div>
      </td>
    </tr>
  );
}
