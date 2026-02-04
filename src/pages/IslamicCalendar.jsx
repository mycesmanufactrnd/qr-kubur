import { useState, useMemo } from 'react';
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Button } from "@/components/ui/button";
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

export default function IslamicCalendar() {
  const [selectedCategories, setSelectedCategories] = useState(['Event', 'Fasting', 'Prayer', 'Hajj']);
  const [selectedDate, setSelectedDate] = useState(null);
  const [selectedHijri, setSelectedHijri] = useState(null);
  const [dayEvents, setDayEvents] = useState([]);
  const [showEventDialog, setShowEventDialog] = useState(false);
  const [viewMode, setViewMode] = useState('calendar');

  const { data: events = [], isLoading, error } = trpc.islamicEvent.getEventsByHijriYear.useQuery();

  const filteredEvents = useMemo(() => {
    return events.filter(event => selectedCategories.includes(event.category));
  }, [events, selectedCategories]);

  const upcomingEvents = useMemo(() => {
    const today = new Date();
    const currentHijriMonth = Math.floor((today.getTime() / 86400000 + 2440588 - 1948440) * 30 / 10631) % 12 + 1;
    
    return filteredEvents
      .filter(event => {
        const monthDiff = event.hijrimonth - currentHijriMonth;
        return monthDiff >= 0 && monthDiff <= 2;
      })
      .sort((a, b) => {
        if (a.hijrimonth !== b.hijrimonth) {
          return a.hijrimonth - b.hijrimonth;
        }
        return a.hijriday - b.hijriday;
      })
      .slice(0, 5);
  }, [filteredEvents]);

  const handleDateClick = (date, hijri, events) => {
    setSelectedDate(date);
    setSelectedHijri(hijri);
    setDayEvents(events);
    if (events.length > 0) {
      setShowEventDialog(true);
    }
  };

  const toggleCategory = (category) => {
    setSelectedCategories(prev => 
      prev.includes(category)
        ? prev.filter(c => c !== category)
        : [...prev, category]
    );
  };

  const clearFilters = () => {
    setSelectedCategories(['Event', 'Fasting', 'Prayer', 'Hajj']);
  };

  return (
    <div className="space-y-3 pb-2">
      <BackNavigation title={translate('Islamic Calendar')} />
      <div className="bg-gradient-to-b from-slate-50 to-white">
        <div className="relative overflow-hidden bg-gradient-to-br from-emerald-600 via-teal-600 to-cyan-700 py-16 px-4">
          <div className="absolute inset-0 overflow-hidden">
            <div className="absolute -top-40 -right-40 w-80 h-80 bg-white/10 rounded-full blur-3xl" />
            <div className="absolute -bottom-40 -left-40 w-80 h-80 bg-white/10 rounded-full blur-3xl" />
            <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 text-white/5 text-[200px] font-arabic">
              ☪
            </div>
          </div>
          
          <div className="relative max-w-6xl mx-auto text-center">
            <div className="inline-flex items-center gap-2 bg-white/20 backdrop-blur-sm px-4 py-2 rounded-full text-white/90 text-sm mb-6">
              <Moon className="w-4 h-4" />
              <span>Islamic Calendar & Events</span>
            </div>
            <h1 className="text-4xl md:text-5xl font-bold text-white mb-4">
              Takwim Islam
            </h1>
            <p className="text-lg text-white/80 max-w-2xl mx-auto">
              Track important Islamic dates, worship reminders, and blessed occasions
            </p>
          </div>
        </div>

        <div className="max-w-7xl mx-auto px-4 -mt-8 relative z-10">
          <Tabs value={viewMode} onValueChange={setViewMode} className="w-full flex justify-center mb-5">
            <TabsList className="bg-emerald-200 shadow-sm rounded-lg p-2 flex gap-2 h-15">
              <TabsTrigger
                value="calendar"
                className="px-4 py-2 text-center text-sm sm:text-base font-medium rounded-md text-emerald-800 data-[state=active]:bg-emerald-500 data-[state=active]:text-white flex flex-col items-center"
              >
                <Calendar className="w-4 h-4 sm:w-5 sm:h-5" />
                <span className="hidden sm:inline">Calendar View</span>
                <span className="sm:hidden">Calendar</span>
              </TabsTrigger>

              <TabsTrigger
                value="upcoming"
                className="px-4 py-2 text-center text-sm sm:text-base font-medium rounded-md text-emerald-800 data-[state=active]:bg-emerald-500 data-[state=active]:text-white flex flex-col items-center"
              >
                <Star className="w-4 h-4 sm:w-5 sm:h-5" />
                <span className="hidden sm:inline">Upcoming Events</span>
                <span className="sm:hidden">Upcoming</span>
              </TabsTrigger>

              <TabsTrigger
                value="all"
                className="px-4 py-2 text-center text-sm sm:text-base font-medium rounded-md text-emerald-800 data-[state=active]:bg-emerald-500 data-[state=active]:text-white flex flex-col items-center"
              >
                <Moon className="w-4 h-4 sm:w-5 sm:h-5" />
                <span className="hidden sm:inline">All Events</span>
                <span className="sm:hidden">All Events</span>
              </TabsTrigger>

            </TabsList>
          </Tabs>

          <EventFilters
            selectedCategories={selectedCategories}
            onToggleCategory={toggleCategory}
            onClearAll={clearFilters}
          />

          <div className="mt-8">
            {isLoading ? (
              <div className="grid lg:grid-cols-2 gap-6">
                <Skeleton className="h-96" />
                <div className="space-y-4">
                  {[1,2,3].map(i => <Skeleton key={i} className="h-32" />)}
                </div>
              </div>
            ) : viewMode === 'calendar' ? (
              <div className="grid lg:grid-cols-3 gap-6">
                <div className="lg:col-span-2">
                  <HijriCalendar
                    events={filteredEvents}
                    onDateClick={handleDateClick}
                    selectedDate={selectedDate}
                  />
                </div>
                
                <div className="space-y-4">
                  <div className="bg-white rounded-2xl shadow-lg border border-slate-100 p-6">
                    <h3 className="text-lg font-bold text-slate-800 mb-4 flex items-center gap-2">
                      <Star className="w-5 h-5 text-amber-500" />
                      Upcoming Events
                    </h3>
                    {upcomingEvents.length === 0 ? (
                      <p className="text-slate-500 text-sm text-center py-8">No upcoming events</p>
                    ) : (
                      <div className="space-y-3">
                        {upcomingEvents.map(event => (
                          <EventCard key={event.id} event={event} compact />
                        ))}
                      </div>
                    )}
                  </div>
                </div>
              </div>
            ) : viewMode === 'upcoming' ? (
              <div className="grid md:grid-cols-2 gap-6">
                {upcomingEvents.length === 0 ? (
                  <div className="col-span-2 text-center py-16">
                    <Info className="w-12 h-12 mx-auto text-slate-300 mb-4" />
                    <p className="text-slate-500">No upcoming events in the next 3 months</p>
                  </div>
                ) : (
                  upcomingEvents.map(event => (
                    <EventCard key={event.id} event={event} />
                  ))
                )}
              </div>
            ) : (
              <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
                {filteredEvents.length === 0 ? (
                  <div className="col-span-full text-center py-16">
                    <Info className="w-12 h-12 mx-auto text-slate-300 mb-4" />
                    <p className="text-slate-500 mb-4">No events found with current filters</p>
                    <Button variant="outline" onClick={clearFilters}>Clear Filters</Button>
                  </div>
                ) : (
                  filteredEvents
                    .sort((a, b) => {
                      if (a.hijrimonth !== b.hijrimonth) return a.hijrimonth - b.hijrimonth;
                      return a.hijriday - b.hijriday;
                    })
                    .map(event => (
                      <EventCard key={event.id} event={event}/>
                    ))
                )}
              </div>
            )}
          </div>
        </div>

        <Dialog open={showEventDialog} onOpenChange={setShowEventDialog}>
          <DialogContent className="max-w-2xl max-h-[80vh] overflow-y-auto">
            <DialogHeader>
              <DialogTitle className="flex items-center gap-2">
                <Calendar className="w-5 h-5 text-emerald-600" />
                {selectedDate?.toLocaleDateString('en-US', { 
                  weekday: 'long', 
                  year: 'numeric', 
                  month: 'long', 
                  day: 'numeric' 
                })}
              </DialogTitle>
              {selectedHijri && (
                <p className="text-sm text-slate-500">
                  {selectedHijri.day} {HIJRI_MONTHS[selectedHijri.month - 1]} {selectedHijri.year} AH
                </p>
              )}
            </DialogHeader>
            
            <div className="space-y-4 mt-4">
              {dayEvents.map(event => (
                <EventCard key={event.id} event={event}/>
              ))}
            </div>
          </DialogContent>
        </Dialog>
      </div>
    </div>
  );
}