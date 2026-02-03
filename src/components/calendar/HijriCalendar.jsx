import { useState, useMemo } from 'react';
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { ChevronLeft, ChevronRight, Calendar } from 'lucide-react';
import { cn } from "@/lib/utils";

const getHijriDate = (gregorianDate) => {
  const islamicEpoch = 1948440;
  const julianDay = Math.floor(gregorianDate.getTime() / 86400000) + 2440588;
  const islamicYear = Math.floor(((julianDay - islamicEpoch) * 30) / 10631) + 1;
  const temp = julianDay - Math.floor(((islamicYear - 1) * 10631) / 30) - islamicEpoch;
  const islamicMonth = Math.min(12, Math.ceil(temp / 29.5));
  const islamicDay = Math.ceil(temp - (islamicMonth - 1) * 29.5);
  
  return {
    year: islamicYear,
    month: islamicMonth,
    day: Math.max(1, islamicDay)
  };
};

const HIJRI_MONTHS = [
  'Muharram', 'Safar', 'Rabi\' al-Awwal', 'Rabi\' al-Thani',
  'Jumada al-Awwal', 'Jumada al-Thani', 'Rajab', 'Sha\'ban',
  'Ramadan', 'Shawwal', 'Dhul-Qi\'dah', 'Dhul-Hijjah'
];

export default function HijriCalendar({ events = [], onDateClick, selectedDate }) {
  const [currentDate, setCurrentDate] = useState(new Date());
  
  const hijriDate = useMemo(() => getHijriDate(currentDate), [currentDate]);
  
  const getDaysInMonth = () => {
    const year = currentDate.getFullYear();
    const month = currentDate.getMonth();
    return new Date(year, month + 1, 0).getDate();
  };
  
  const getFirstDayOfMonth = () => {
    const year = currentDate.getFullYear();
    const month = currentDate.getMonth();
    return new Date(year, month, 1).getDay();
  };
  
  const previousMonth = () => {
    setCurrentDate(new Date(currentDate.getFullYear(), currentDate.getMonth() - 1, 1));
  };
  
  const nextMonth = () => {
    setCurrentDate(new Date(currentDate.getFullYear(), currentDate.getMonth() + 1, 1));
  };
  
  const getEventsForDate = (day) => {
    const date = new Date(currentDate.getFullYear(), currentDate.getMonth(), day);
    const hijri = getHijriDate(date);
    
    return events.filter(event => 
      event.hijrimonth === hijri.month && event.hijriday === hijri.day
    );
  };
  
  const renderDays = () => {
    const daysInMonth = getDaysInMonth();
    const firstDay = getFirstDayOfMonth();
    const days = [];
    
    for (let i = 0; i < firstDay; i++) {
      days.push(<div key={`empty-${i}`} className="p-2" />);
    }
    
    for (let day = 1; day <= daysInMonth; day++) {
      const date = new Date(currentDate.getFullYear(), currentDate.getMonth(), day);
      const dayEvents = getEventsForDate(day);
      const hijri = getHijriDate(date);
      const isToday = date.toDateString() === new Date().toDateString();
      const isSelected = selectedDate && date.toDateString() === selectedDate.toDateString();
      
      days.push(
        <button
          key={day}
          onClick={() => onDateClick?.(date, hijri, dayEvents)}
          className={cn(
            "p-2 rounded-xl text-center transition-all hover:bg-emerald-50 relative group min-h-[80px] flex flex-col",
            isToday && "ring-2 ring-emerald-500 bg-emerald-50",
            isSelected && "bg-emerald-100 ring-2 ring-emerald-600",
            dayEvents.length > 0 && "bg-gradient-to-br from-amber-50 to-orange-50"
          )}
        >
          <div className="flex justify-between items-start mb-1">
            <span className={cn(
              "text-sm font-semibold",
              isToday ? "text-emerald-700" : "text-slate-700"
            )}>
              {day}
            </span>
            <span className="text-[10px] text-slate-400">
              {hijri.day}
            </span>
          </div>
          
          {dayEvents.length > 0 && (
            <div className="space-y-0.5 mt-auto">
              {dayEvents.slice(0, 2).map((event, idx) => (
                <Badge
                  key={idx}
                  className={cn(
                    "text-[9px] px-1 py-0 h-4 w-full justify-center",
                    event.category === 'Fasting' && "bg-purple-100 text-purple-700 border-purple-200",
                    event.category === 'Prayer' && "bg-blue-100 text-blue-700 border-blue-200",
                    event.category === 'Event' && "bg-emerald-100 text-emerald-700 border-emerald-200",
                    event.category === 'Hajj' && "bg-amber-100 text-amber-700 border-amber-200"
                  )}
                >
                  {event.title.length > 12 ? event.title.slice(0, 12) + '...' : event.title}
                </Badge>
              ))}
              {dayEvents.length > 2 && (
                <span className="text-[9px] text-slate-500">+{dayEvents.length - 2}</span>
              )}
            </div>
          )}
        </button>
      );
    }
    
    return days;
  };
  
  return (
    <div className="bg-white rounded-2xl shadow-lg border border-slate-100 p-6">
      <div className="flex items-center justify-between mb-6">
        <div>
          <h3 className="text-xl font-bold text-slate-800">
            {currentDate.toLocaleString('default', { month: 'long', year: 'numeric' })}
          </h3>
          <p className="text-sm text-emerald-600 flex items-center gap-2 mt-1">
            <Calendar className="w-4 h-4" />
            {HIJRI_MONTHS[hijriDate.month - 1]} {hijriDate.year} AH
          </p>
        </div>
        <div className="flex gap-2">
          <Button variant="outline" size="icon" onClick={previousMonth}>
            <ChevronLeft className="w-4 h-4" />
          </Button>
          <Button variant="outline" size="icon" onClick={nextMonth}>
            <ChevronRight className="w-4 h-4" />
          </Button>
        </div>
      </div>
      
      <div className="grid grid-cols-7 gap-2 mb-3">
        {['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'].map(day => (
          <div key={day} className="text-center text-xs font-semibold text-slate-500 p-2">
            {day}
          </div>
        ))}
      </div>
      
      <div className="grid grid-cols-7 gap-2">
        {renderDays()}
      </div>
    </div>
  );
}