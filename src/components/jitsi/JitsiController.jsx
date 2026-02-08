import { useUpdateLiveURLTahlilRequest } from '@/hooks/useTahlilRequestMutations';

export default function JitsiController({ ids = [], onClose }) {
  if (ids.length === 0) return null;

  const updateMutation = useUpdateLiveURLTahlilRequest();

  const startLive = async () => {
    const roomName = 'tahlil-' + Date.now();

    await updateMutation.mutateAsync({ 
      ids: ids, 
      data: { liveurl: roomName } 
    })
    .then((res) => {
      if (res) {
        onClose?.();
      }
    })
  };

  return (
    <div className="space-y-4">
      <button
        onClick={startLive}
        className="px-4 py-2 bg-emerald-500 text-white rounded-md"
      >
        Start Live Tahlil
      </button>
    
    </div>
  );
}
