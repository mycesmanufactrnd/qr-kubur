//@ts-nocheck
import { createPageUrl } from "@/utils";
import { useNavigate } from "react-router-dom";
import NoDataCardComponent from "@/components/NoDataCardComponent";
import { translate } from "@/utils/translations";

export default function JoinLiveButton({ room }) {
  const navigate = useNavigate();

  const joinRoom = () => {
    if (!room) return;

    navigate(createPageUrl("JitsiRoom") + `?room=${room}`);
  };

  if (!room) {
    return (
      <NoDataCardComponent isPage description={translate("No Live Session Found")} />
    );
  }

  return (
    <button
      onClick={joinRoom}
      className="mt-2 px-4 py-2 bg-blue-500 text-white rounded-md"
    >
      {translate("Join Live Tahlil")}
    </button>
  );
}
