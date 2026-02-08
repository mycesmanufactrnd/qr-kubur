import { createPageUrl } from '@/utils';
import { useNavigate } from 'react-router-dom';
import NoDataCardComponent from '../NoDataCardComponent';

export default function JoinLiveButton({ room }) {
    const navigate = useNavigate();

    const joinRoom = () => {
        if (!room) return;

        navigate(createPageUrl('JitsiRoom') + `?room=${room}`);
    };

    if (!room) {
        return (
            <NoDataCardComponent
                description="Tiada Sesi Live Dijumpai"
            />
        );
    }

    return (
        <button
            onClick={joinRoom}
            className="mt-2 px-4 py-2 bg-blue-500 text-white rounded-md"
        >
            Join Live Tahlil
        </button>
    );
}
