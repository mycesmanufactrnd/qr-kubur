import { Link } from "react-router-dom";
import { Trash2, ExternalLink, Layers } from "lucide-react";

const GROUP_ORDER = ["mosque", "tahfiz", "grave", "organisation"];

export default function FamilyTree({ collection, items, typeConfig, onRemove, getDetailUrl }) {
  if (items.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center py-20 text-muted-foreground">
        <Layers className="w-12 h-12 mb-4 opacity-20" />
        <p className="text-base font-medium">No places yet</p>
        <p className="text-sm mt-1">Click "Add Place" to start building your collection</p>
      </div>
    );
  }

  const grouped = {};
  for (const item of items) {
    if (!grouped[item.entity_type]) grouped[item.entity_type] = [];
    grouped[item.entity_type].push(item);
  }

  const activeGroups = GROUP_ORDER.filter((t) => grouped[t]?.length > 0);

  return (
    <div className="flex flex-col items-center gap-0 select-none min-w-max pb-8">
      {/* Root node */}
      <div className="flex flex-col items-center">
        <div className="px-6 py-3 rounded-2xl bg-primary text-primary-foreground font-semibold text-sm shadow-md">
          {collection?.name || "My Collection"}
        </div>
        <div className="w-0.5 h-8 bg-border" />
      </div>

      {/* Type group layer */}
      <div className="relative flex items-start">
        {activeGroups.length > 1 && (
          <div className="absolute top-0 left-[calc(50%_-_0.5px)] right-0 h-0.5 bg-border"
            style={{ left: 0, width: "100%" }}
          />
        )}

        <div className="flex gap-10 items-start">
          {activeGroups.map((type) => {
            const cfg = typeConfig[type];
            if (!cfg) return null;
            const Icon = cfg.icon;
            const typeItems = grouped[type];

            return (
              <div key={type} className="flex flex-col items-center">
                <div className="w-0.5 h-8 bg-border" />

                <div className={`px-4 py-2 rounded-xl border text-xs font-semibold flex items-center gap-1.5 ${cfg.color}`}>
                  <Icon className="w-3.5 h-3.5" />
                  {cfg.label} ({typeItems.length})
                </div>

                <div className="w-0.5 h-6 bg-border" />

                {/* Items row */}
                <div className="relative flex gap-4 items-start">
                  {typeItems.length > 1 && (
                    <div className="absolute top-0 left-0 right-0 h-0.5 bg-border" />
                  )}
                  {typeItems.map((item) => (
                    <div key={item.id} className="flex flex-col items-center">
                      <div className="w-0.5 h-6 bg-border" />
                      <PlaceNode
                        item={item}
                        cfg={cfg}
                        detailUrl={getDetailUrl(item)}
                        onRemove={onRemove}
                      />
                    </div>
                  ))}
                </div>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
}

function PlaceNode({ item, cfg, detailUrl, onRemove }) {
  const Icon = cfg.icon;
  const borderClass = cfg.color.split(" ").find((c) => c.startsWith("border-")) || "border-border";

  return (
    <div className={`w-44 rounded-xl border p-3 bg-card shadow-sm hover:shadow-md transition-shadow ${borderClass}`}>
      <div className="flex items-start gap-1.5 mb-2">
        <Icon className="w-3.5 h-3.5 shrink-0 mt-0.5" />
        <div className="flex-1 min-w-0">
          <span className="text-xs font-semibold truncate block">{item.label || "Unnamed"}</span>
          {item.state && (
            <p className="text-xs text-muted-foreground truncate">{item.state}</p>
          )}
          {item.parentOrg && (
            <p className="text-[10px] text-muted-foreground/70 truncate mt-0.5">
              ↳ {item.parentOrg}
            </p>
          )}
        </div>
      </div>
      <div className="flex gap-1">
        <Link
          to={detailUrl}
          className="flex-1 flex items-center justify-center gap-1 text-xs py-1 px-2 rounded-md bg-background border hover:bg-muted transition-colors"
        >
          <ExternalLink className="w-3 h-3" />
          View
        </Link>
        <button
          onClick={() => onRemove(item.id)}
          className="h-6 w-6 flex items-center justify-center rounded-md text-muted-foreground hover:text-destructive hover:bg-muted transition-colors"
        >
          <Trash2 className="w-3 h-3" />
        </button>
      </div>
    </div>
  );
}
