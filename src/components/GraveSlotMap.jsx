// @ts-nocheck
import { useRef } from "react";
import {
  getSlotCorners,
  pointsToSvgPolygon,
  getPolygonCentroid,
} from "@/utils/graveGrid";

const SLOT_COLORS = {
  free: { fill: "rgba(16,185,129,0.28)", stroke: "#10b981" },
  occupied: { fill: "rgba(244,63,94,0.35)", stroke: "#f43f5e" },
  selected: { fill: "rgba(37,99,235,0.55)", stroke: "#2563eb" },
};

export default function GraveSlotMap({
  photoUrl,
  blocks = [],
  selectedSlotId,
  onSlotClick,
  onContainerClick,
  interactiveSlots = true,
  children,
}) {
  const containerRef = useRef(null);

  const handleContainerClick = (e) => {
    if (!onContainerClick || !containerRef.current) return;
    const rect = containerRef.current.getBoundingClientRect();
    const xPercent = ((e.clientX - rect.left) / rect.width) * 100;
    const yPercent = ((e.clientY - rect.top) / rect.height) * 100;
    onContainerClick(xPercent, yPercent);
  };

  return (
    <div
      ref={containerRef}
      className="relative w-full select-none"
      onClick={handleContainerClick}
    >
      <img
        src={photoUrl}
        alt="Cemetery aerial view"
        draggable={false}
        className="w-full h-auto block rounded-xl border border-slate-200 dark:border-slate-700"
      />
      <svg
        viewBox="0 0 100 100"
        preserveAspectRatio="none"
        className="absolute inset-0 w-full h-full"
      >
        {blocks.map((block) => {
          const centroid = getPolygonCentroid(block.corners);
          return (
            <g key={block.id}>
              <polygon
                points={pointsToSvgPolygon(block.corners)}
                fill="none"
                stroke="white"
                strokeWidth="0.35"
                vectorEffect="non-scaling-stroke"
              />
              {(block.slots ?? []).map((slot) => {
                const poly = getSlotCorners(
                  block.corners,
                  block.rows,
                  block.cols,
                  slot.rowIndex,
                  slot.colIndex,
                );
                const isSelected = slot.id === selectedSlotId;
                const status = isSelected
                  ? "selected"
                  : slot.deadperson
                    ? "occupied"
                    : "free";
                const colors = SLOT_COLORS[status];
                return (
                  <polygon
                    key={slot.id}
                    points={pointsToSvgPolygon(poly)}
                    fill={colors.fill}
                    stroke={colors.stroke}
                    strokeWidth="0.15"
                    onClick={
                      interactiveSlots
                        ? (e) => {
                            e.stopPropagation();
                            onSlotClick?.(slot, block);
                          }
                        : undefined
                    }
                    style={{
                      cursor: interactiveSlots ? "pointer" : "default",
                    }}
                  />
                );
              })}
              <text
                x={centroid.x}
                y={centroid.y}
                fontSize="3"
                fill="white"
                stroke="black"
                strokeWidth="0.15"
                textAnchor="middle"
                dominantBaseline="middle"
                style={{ pointerEvents: "none" }}
              >
                {block.label}
              </text>
            </g>
          );
        })}
      </svg>
      {children}
    </div>
  );
}
