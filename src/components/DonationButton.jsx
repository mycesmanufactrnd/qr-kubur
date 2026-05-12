import clsx from "clsx";
import { translate } from "@/utils/translations";
import { Heart } from "lucide-react";
import { Link } from "react-router-dom";
import { createPageUrl } from "@/utils";

export default function DonationButton({
  recipientId = '',
  recipientType = '',
  state = 'nearby',
  addClass = '',
}) {
  if (recipientId == '' || recipientType == '') return null;

  return (
    <Link to={createPageUrl(`DonationPage?id=${recipientId}&type=${recipientType}&state=${state}`)} className="flex-1">
      <button
        className={clsx(
          "w-full h-8 px-3 text-xs font-medium inline-flex items-center justify-center rounded-md border border-pink-200 dark:border-pink-800 bg-white dark:bg-pink-900/20 text-pink-600 dark:text-pink-400 hover:bg-pink-50 dark:hover:bg-pink-900/30 shadow-md transition-colors",
          addClass
        )}
      >
        <Heart className="w-4 h-4 mr-2" />
        {translate('Donate')}
      </button>
    </Link>
  );
}