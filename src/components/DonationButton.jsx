import { Button } from "./ui/button";
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
        <Button 
          size="sm"
          variant="outline" 
          className={clsx(
            "bg-white border-pink-200 text-pink-600 hover:bg-pink-50 shadow-md",
            addClass
          )}
        >
          <Heart className="w-4 h-4 mr-2" />
          {translate('Donate')}
        </Button>
    </Link>
  );
}