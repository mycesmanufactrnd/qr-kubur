import { useState, useRef, useEffect } from "react";
import { Menu, Home, User, Settings, Bell, AlertTriangle, Repeat, Heart, MapPin, HeartHandshake, MapPinHouse, MapPinned } from "lucide-react";
import { createPageUrl } from "@/utils";
import { useNavigate } from "react-router-dom";

export function DraggableFloatingButton() {
    const navigate = useNavigate();

    const BOTTOM_BAR_HEIGHT = 60;
    const BUTTON_SIZE = 56;
    const MARGIN = 16;

    const [pos, setPos] = useState({
        x: window.innerWidth - BUTTON_SIZE - MARGIN,
        y: window.innerHeight - BUTTON_SIZE - MARGIN - BOTTOM_BAR_HEIGHT,
    });

    const [isExpanded, setIsExpanded] = useState(false);
    const dragging = useRef(false);
    const hasMoved = useRef(false);
    const startPos = useRef({ x: 0, y: 0 });
    const startTime = useRef(0);

    const menuItems = [
        { icon: AlertTriangle, label: "Emergency", color: "bg-red-500", page: 'JenazahEmergency' },
        { icon: MapPinned, label: "Favorited Grave", color: "bg-pink-500", page: 'FavoritedGrave' },
        { icon: MapPinHouse, label: "Favorited Mosque", color: "bg-blue-500", page: 'FavoritedMosque' },
        { icon: Repeat, label: "Digital Tasbih", color: "bg-emerald-500", page: 'DigitalTasbih' },
    ];

    const start = (e) => {
        if (e.target.closest('button[data-menu-item]')) {
        return;
        }

        const p = e.touches ? e.touches[0] : e;
        dragging.current = true;
        hasMoved.current = false;
        startTime.current = Date.now();

        startPos.current = {
        x: p.clientX,
        y: p.clientY,
        };
    };

    const move = (e) => {
        if (!dragging.current) return;
        const p = e.touches ? e.touches[0] : e;

        // Check if moved more than 5px to distinguish from click
        const dx = Math.abs(p.clientX - startPos.current.x);
        const dy = Math.abs(p.clientY - startPos.current.y);
        
        if (dx > 5 || dy > 5) {
        hasMoved.current = true;
        }

        if (hasMoved.current) {
        const newX = Math.max(
            MARGIN,
            Math.min(p.clientX - BUTTON_SIZE / 2, window.innerWidth - BUTTON_SIZE - MARGIN)
        );
        const newY = Math.max(
            MARGIN,
            Math.min(
            p.clientY - BUTTON_SIZE / 2,
            window.innerHeight - BUTTON_SIZE - MARGIN - BOTTOM_BAR_HEIGHT
            )
        );

        setPos({ x: newX, y: newY });
        }
    };

    const stop = (e) => {
        const tapDuration = Date.now() - startTime.current;
        
        // Consider it a tap if it was quick and didn't move much
        if (dragging.current && !hasMoved.current && tapDuration < 300) {
        e.preventDefault();
        setIsExpanded(!isExpanded);
        }
        
        dragging.current = false;
        hasMoved.current = false;
    };

    const handleMenuClick = (e, item) => {
        e.preventDefault();
        e.stopPropagation();
        navigate(createPageUrl(item.page));
        setIsExpanded(false);
    };

    useEffect(() => {
        const handleResize = () => {
        setPos({
            x: window.innerWidth - BUTTON_SIZE - MARGIN,
            y: window.innerHeight - BUTTON_SIZE - MARGIN - BOTTOM_BAR_HEIGHT,
        });
        };
        window.addEventListener("resize", handleResize);
        return () => window.removeEventListener("resize", handleResize);
    }, []);

    // Calculate fan positions - spread upward from bottom in 90 degrees
    const getFanPosition = (index, total) => {
        const radius = 80;
        const angleSpread = 90; // 90 degrees
        const startAngle = 90; // Start from left (90 degrees)
        const endAngle = 180; // End at bottom (180 degrees)
        
        // Calculate angle for this item
        const angle = startAngle + ((endAngle - startAngle) / (total - 1)) * index;
        const radian = (angle * Math.PI) / 180;

        return {
        x: Math.cos(radian) * radius,
        y: -Math.sin(radian) * radius, // Negative to go upward
        };
    };

    return (
        <>
        {isExpanded && (
            <div
            className="fixed inset-0 bg-black/20 z-[9998]"
            onTouchEnd={() => setIsExpanded(false)}
            onClick={() => setIsExpanded(false)}
            />
        )}

        <div
            style={{
            transform: `translate3d(${pos.x}px, ${pos.y}px, 0)`,
            touchAction: "none",
            pointerEvents: "auto",
            willChange: "transform",
            }}
            className="fixed top-0 left-0 z-[9999]"
            onMouseDown={start}
            onMouseMove={move}
            onMouseUp={stop}
            onMouseLeave={stop}
            onTouchStart={start}
            onTouchMove={move}
            onTouchEnd={stop}
        >
            {menuItems.map((item, index) => {
            const fanPos = getFanPosition(index, menuItems.length);
            const Icon = item.icon;

            return (
                <button
                key={index}
                data-menu-item
                onTouchEnd={(e) => {
                    e.preventDefault();
                    e.stopPropagation();
                    handleMenuClick(e, item);
                }}
                onClick={(e) => handleMenuClick(e, item)}
                style={{
                    transform: isExpanded
                    ? `translate(${fanPos.x}px, ${fanPos.y}px) scale(1)`
                    : `translate(0, 0) scale(0)`,
                    opacity: isExpanded ? 1 : 0,
                    transition: `all 0.3s cubic-bezier(0.175, 0.885, 0.32, 1.275) ${
                    index * 0.05
                    }s`,
                    pointerEvents: isExpanded ? "auto" : "none",
                    willChange: "transform, opacity",
                }}
                className={`absolute top-0 left-0 flex items-center justify-center rounded-full ${item.color} w-10 h-10 shadow-lg active:scale-110`}
                >
                <Icon size={16} className="text-white" />
                </button>
            );
            })}

            <div
            style={{
                transform: isExpanded ? "rotate(90deg)" : "rotate(0deg)",
                transition: "transform 0.3s ease",
                willChange: "transform",
            }}
            className="relative flex items-center justify-center rounded-full bg-emerald-600 w-14 h-14 shadow-xl cursor-pointer active:scale-95"
            >
            <Menu
                size={26}
                strokeWidth={2}
                className="text-white pointer-events-none"
            />
            </div>
        </div>
    </>
  );
}