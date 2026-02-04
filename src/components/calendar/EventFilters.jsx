import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Calendar, Moon, Sun, MapPin, GraduationCap, X } from 'lucide-react';
import { cn } from "@/lib/utils";

const CATEGORIES = [
  { value: 'Event', label: 'Events', icon: Calendar, color: 'emerald' },
  { value: 'Fasting', label: 'Puasa', icon: Moon, color: 'purple' },
  { value: 'Prayer', label: 'Solat', icon: Sun, color: 'blue' },
  { value: 'Hajj', label: 'Hajj', icon: MapPin, color: 'amber' },
];

const colorClasses = {
  emerald: {
    selected: "bg-emerald-500 hover:bg-emerald-600 text-white border-emerald-500",
    unselected: "hover:bg-emerald-50 hover:border-emerald-300 hover:text-emerald-700"
  },
  purple: {
    selected: "bg-purple-500 hover:bg-purple-600 text-white border-purple-500",
    unselected: "hover:bg-purple-50 hover:border-purple-300 hover:text-purple-700"
  },
  blue: {
    selected: "bg-blue-500 hover:bg-blue-600 text-white border-blue-500",
    unselected: "hover:bg-blue-50 hover:border-blue-300 hover:text-blue-700"
  },
  amber: {
    selected: "bg-amber-500 hover:bg-amber-600 text-white border-amber-500",
    unselected: "hover:bg-amber-50 hover:border-amber-300 hover:text-amber-700"
  },
  orange: {
    selected: "bg-orange-500 hover:bg-orange-600 text-white border-orange-500",
    unselected: "hover:bg-orange-50 hover:border-orange-300 hover:text-orange-700"
  },
  teal: {
    selected: "bg-teal-500 hover:bg-teal-600 text-white border-teal-500",
    unselected: "hover:bg-teal-50 hover:border-teal-300 hover:text-teal-700"
  }
};

export default function EventFilters({ selectedCategories, onToggleCategory, onClearAll }) {
  const hasFilters = selectedCategories.length > 0 && selectedCategories.length < CATEGORIES.length;

  return (
    <div className="bg-white rounded-xl shadow-md border border-slate-100 p-4">
      <div className="flex items-center justify-between mb-3">
        <h3 className="text-sm font-semibold text-slate-700">Filter Events</h3>
        {hasFilters && (
          <Button
            variant="ghost"
            size="sm"
            onClick={onClearAll}
            className="text-xs h-7 text-slate-500 hover:text-slate-700"
          >
            <X className="w-3 h-3 mr-1" />
            Clear
          </Button>
        )}
      </div>

      <div className="flex flex-wrap gap-2">
        {CATEGORIES.map(category => {
          const Icon = category.icon;
          const isSelected = selectedCategories.includes(category.value);

          return (
            <Badge
              key={category.value}
              variant={isSelected ? "default" : "outline"}
              className={cn(
                "cursor-pointer transition-all px-3 py-1.5",
                isSelected
                  ? colorClasses[category.color].selected
                  : colorClasses[category.color].unselected
              )}
              onClick={() => onToggleCategory(category.value)}
            >
              <Icon className="w-3.5 h-3.5 mr-1.5" />
              {category.label}
            </Badge>
          );
        })}
      </div>
    </div>
  );
}
