import { JitsiMeeting } from "@jitsi/react-sdk";
import { useAdminAccess } from "@/utils/auth";
import NoDataCardComponent from "@/components/NoDataCardComponent";
import { useSearchParams } from "react-router-dom";

export default function JitsiRoom() {
  const [searchParams] = useSearchParams();
  const room = searchParams.get("room");
  const { hasAdminAccess, isTahfizAdmin, currentUser } = useAdminAccess();

  if (!room) {
    return (
      <NoDataCardComponent
        isPage={true}
        description="Tiada Sesi Live Dijumpai"
      />
    );
  }

  return (
    <div className="w-full h-[calc(100vh-4rem)]">
      <JitsiMeeting
        domain="mymeet.quezera.xyz"
        roomName={room}
        getIFrameRef={(iframe) => {
          iframe.style.height = "100%";
          iframe.style.width = "100%";
        }}
        userInfo={{
          email: currentUser?.email ?? "",
          displayName: isTahfizAdmin || hasAdminAccess ? "Admin" : "Viewer",
        }}
        configOverwrite={{
          prejoinPageEnabled: false,
          startWithAudioMuted: !(isTahfizAdmin || hasAdminAccess),
          startWithVideoMuted: !(isTahfizAdmin || hasAdminAccess),
          disableInviteFunctions: true,
          disableDeepLinking: true,
          hideLogo: true,
          defaultLogoUrl: "",
        }}
        interfaceConfigOverwrite={{
          TOOLBAR_BUTTONS:
            isTahfizAdmin || hasAdminAccess
              ? undefined
              : [
                  "microphone",
                  "camera",
                  "fullscreen",
                  "raisehand",
                  "tileview",
                  "chat",
                ],
        }}
      />
    </div>
  );
}
