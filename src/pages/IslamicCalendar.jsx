import { useState, useMemo } from 'react';
import { Skeleton } from "@/components/ui/skeleton";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Calendar, Moon, Star, Info } from 'lucide-react';
import HijriCalendar from '@/components/calendar/HijriCalendar';
import EventCard from '@/components/calendar/EventCard';
import EventFilters from '@/components/calendar/EventFilters';
import { HIJRI_MONTHS } from '@/utils/enums';
import { trpc } from '@/utils/trpc';
import BackNavigation from '@/components/BackNavigation';
import { translate } from '@/utils/translations';

const TABS = [
  { value: 'calendar', label: 'Calendar', icon: Calendar },
  { value: 'upcoming', label: 'Upcoming', icon: Star },
  { value: 'all', label: 'All Events', icon: Moon },
];

export default function IslamicCalendar() {
  const [selectedCategories, setSelectedCategories] = useState(['Event', 'Fasting', 'Prayer', 'Hajj']);
  const [selectedDate, setSelectedDate] = useState(null);
  const [selectedHijri, setSelectedHijri] = useState(null);
  const [dayEvents, setDayEvents] = useState([]);
  const [showEventDialog, setShowEventDialog] = useState(false);
  const [viewMode, setViewMode] = useState('calendar');

  const { data: events = [], isLoading } = trpc.islamicEvent.getEventsByHijriYear.useQuery();

  const filteredEvents = useMemo(() =>
    events.filter(event => selectedCategories.includes(event.category)),
    [events, selectedCategories]);

  const upcomingEvents = useMemo(() => {
    const today = new Date();
    const currentHijriMonth = Math.floor((today.getTime() / 86400000 + 2440588 - 1948440) * 30 / 10631) % 12 + 1;
    return filteredEvents
      .filter(event => {
        const monthDiff = event.hijrimonth - currentHijriMonth;
        return monthDiff >= 0 && monthDiff <= 2;
      })
      .sort((a, b) => a.hijrimonth !== b.hijrimonth ? a.hijrimonth - b.hijrimonth : a.hijriday - b.hijriday)
      .slice(0, 5);
  }, [filteredEvents]);

  const handleDateClick = (date, hijri, events) => {
    setSelectedDate(date);
    setSelectedHijri(hijri);
    setDayEvents(events);
    if (events.length > 0) setShowEventDialog(true);
  };

  const toggleCategory = (category) => {
    setSelectedCategories(prev =>
      prev.includes(category) ? prev.filter(c => c !== category) : [...prev, category]
    );
  };

  const clearFilters = () => setSelectedCategories(['Event', 'Fasting', 'Prayer', 'Hajj']);

  return (
    <div className="min-h-screen pb-12">
      <BackNavigation title={translate('Islamic Calendar')} />

      <div className="flex flex-col items-center text-center gap-2 px-4 pb-6">
        <div className="w-16 h-16 rounded-2xl bg-gradient-to-br from-emerald-500 to-teal-500 flex items-center justify-center shadow-lg shadow-emerald-200 mb-1">
          <Moon className="w-8 h-8 text-white" />
        </div>
        <h2 className="text-base font-bold text-slate-800">Takwim Islam</h2>
        <p className="text-xs text-slate-400 max-w-[240px] leading-relaxed">
          Track important Islamic dates, worship reminders, and blessed occasions
        </p>
      </div>

      <div className="max-w-7xl mx-auto px-4 space-y-4">

        <div className="bg-white rounded-2xl border border-slate-100 p-1.5 flex gap-1 shadow-sm">
          {TABS.map(({ value, label, icon: Icon }) => {
            const isActive = viewMode === value;
            return (
              <button
                key={value}
                onClick={() => setViewMode(value)}
                className={`flex-1 flex items-center justify-center gap-1.5 py-2.5 rounded-xl text-xs font-semibold transition-all active:scale-95 ${
                  isActive
                    ? 'bg-emerald-500 text-white shadow-sm'
                    : 'text-slate-500 hover:text-slate-700 hover:bg-slate-50'
                }`}
              >
                <Icon className="w-3.5 h-3.5" />
                {label}
              </button>
            );
          })}
        </div>

        <EventFilters
          selectedCategories={selectedCategories}
          onToggleCategory={toggleCategory}
          onClearAll={clearFilters}
        />

        {isLoading ? (
          <div className="space-y-3">
            <Skeleton className="h-96 rounded-2xl" />
            <Skeleton className="h-32 rounded-2xl" />
            <Skeleton className="h-32 rounded-2xl" />
          </div>
        ) : viewMode === 'calendar' ? (
          <div className="grid lg:grid-cols-3 gap-4">
            <div className="lg:col-span-2">
              <HijriCalendar
                events={filteredEvents}
                onDateClick={handleDateClick}
                selectedDate={selectedDate}
              />
            </div>

            <div className="bg-white rounded-2xl shadow-sm border border-slate-100 overflow-hidden">
              <div className="flex items-center gap-2 px-4 py-3 border-b border-slate-100">
                <Star className="w-4 h-4 text-amber-500" />
                <p className="text-[11px] font-semibold uppercase tracking-widest text-emerald-600">Upcoming Events</p>
              </div>
              <div className="p-3">
                {upcomingEvents.length === 0 ? (
                  <div className="flex flex-col items-center justify-center py-10 gap-2">
                    <Info className="w-8 h-8 text-slate-200" />
                    <p className="text-xs text-slate-400">No upcoming events</p>
                  </div>
                ) : (
                  <div className="space-y-2">
                    {upcomingEvents.map(event => (
                      <EventCard key={event.id} event={event} compact />
                    ))}
                  </div>
                )}
              </div>
            </div>
          </div>

        ) : viewMode === 'upcoming' ? (
          upcomingEvents.length === 0 ? (
            <div className="bg-white rounded-2xl border border-slate-100 flex flex-col items-center justify-center py-16 gap-3">
              <Info className="w-10 h-10 text-slate-200" />
              <p className="text-sm text-slate-400">No upcoming events in the next 3 months</p>
            </div>
          ) : (
            <div className="grid md:grid-cols-2 gap-3">
              {upcomingEvents.map(event => (
                <EventCard key={event.id} event={event} />
              ))}
            </div>
          )

        ) : (
          filteredEvents.length === 0 ? (
            <div className="bg-white rounded-2xl border border-slate-100 flex flex-col items-center justify-center py-16 gap-3">
              <Info className="w-10 h-10 text-slate-200" />
              <p className="text-sm text-slate-400 mb-1">No events found with current filters</p>
              <button
                onClick={clearFilters}
                className="px-4 py-2 rounded-xl border border-slate-200 bg-slate-50 text-slate-600 text-xs font-semibold active:opacity-75 transition-opacity"
              >
                Clear Filters
              </button>
            </div>
          ) : (
            <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-3">
              {filteredEvents
                .sort((a, b) => a.hijrimonth !== b.hijrimonth ? a.hijrimonth - b.hijrimonth : a.hijriday - b.hijriday)
                .map(event => (
                  <EventCard key={event.id} event={event} />
                ))}
            </div>
          )
        )}
      </div>

      <Dialog open={showEventDialog} onOpenChange={setShowEventDialog}>
        <DialogContent className="max-w-lg w-[calc(100%-2rem)] max-h-[85vh] overflow-y-auto rounded-2xl p-0 border-0 shadow-2xl bg-white">
          <div className="px-5 pt-5 pb-4 border-b border-slate-100">
            <DialogTitle className="text-[11px] font-semibold uppercase tracking-widest text-slate-400 mb-2">
              Events
            </DialogTitle>
            <div className="flex items-start gap-2">
              <div className="w-8 h-8 rounded-xl bg-emerald-50 border border-emerald-100 flex items-center justify-center shrink-0 mt-0.5">
                <Calendar className="w-4 h-4 text-emerald-600" />
              </div>
              <div>
                <p className="text-sm font-bold text-slate-800">
                  {selectedDate?.toLocaleDateString('en-US', { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' })}
                </p>
                {selectedHijri && (
                  <p className="text-xs text-slate-400 mt-0.5">
                    {selectedHijri.day} {HIJRI_MONTHS[selectedHijri.month - 1]} {selectedHijri.year} AH
                  </p>
                )}
              </div>
            </div>
          </div>
          <div className="p-4 space-y-3">
            {dayEvents.map(event => (
              <EventCard key={event.id} event={event} />
            ))}
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}