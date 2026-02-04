import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Calendar, Moon, Sun, BookOpen, MapPin, CheckCircle2, Clock } from 'lucide-react';

const CATEGORY_CONFIG = {
  Event: { icon: Calendar, color: 'emerald', label: 'Event' },
  Fasting: { icon: Moon, color: 'purple', label: 'Puasa' },
  Prayer: { icon: Sun, color: 'blue', label: 'Solat' },
  Hajj: { icon: MapPin, color: 'amber', label: 'Hajj' },
};

export default function EventCard({ event, compact = false }) {
  const config = CATEGORY_CONFIG[event.category] || CATEGORY_CONFIG.Event;
  const Icon = config.icon;
  
  if (compact) {
    return (
      <div className="p-4 bg-gradient-to-r from-white to-slate-50 rounded-xl border border-slate-100 hover:shadow-md transition-all">
        <div className="flex items-start gap-3">
          <div className={`w-10 h-10 rounded-lg bg-${config.color}-100 flex items-center justify-center flex-shrink-0`}>
            <Icon className={`w-5 h-5 text-${config.color}-600`} />
          </div>
          <div className="flex-1 min-w-0">
            <div className="flex items-start justify-between gap-2">
              <h4 className="font-semibold text-slate-800 line-clamp-1">{event.title}</h4>
              <Badge className={`bg-${config.color}-100 text-${config.color}-700 border-${config.color}-200`}>
                {config.label}
              </Badge>
            </div>
            {event.virtue && (
              <p className="text-sm text-slate-500 line-clamp-2 mt-1">{event.virtue}</p>
            )}
          </div>
        </div>
      </div>
    );
  }
  
  return (
    <Card className="border-0 shadow-md hover:shadow-lg transition-all overflow-hidden group">
      <div className={`h-1 bg-gradient-to-r from-${config.color}-400 to-${config.color}-600`} />
      <CardHeader className="pb-3">
        <div className="flex items-start justify-between">
          <div className="flex items-center gap-3">
            <div className={`w-12 h-12 rounded-xl bg-${config.color}-100 flex items-center justify-center`}>
              <Icon className={`w-6 h-6 text-${config.color}-600`} />
            </div>
            <div>
              <CardTitle className="text-lg">{event.title}</CardTitle>
              <Badge variant="secondary" className={`mt-1 bg-${config.color}-50 text-${config.color}-700`}>
                {config.label}
              </Badge>
            </div>
          </div>
        </div>
      </CardHeader>
      
      <CardContent className="space-y-4">
        {event.description && (
          <p className="text-slate-600 text-sm leading-relaxed">{event.description}</p>
        )}
        
        {event.virtue && (
          <div className="p-3 bg-amber-50 rounded-lg border border-amber-100">
            <p className="text-sm text-amber-900">
              <span className="font-semibold">Keutamaan:</span> {event.virtue}
            </p>
          </div>
        )}
        
        {event.recommendedamal && event.recommendedamal.length > 0 && (
          <div className="space-y-2">
            <h4 className="text-sm font-semibold text-slate-700 flex items-center gap-2">
              <CheckCircle2 className="w-4 h-4 text-emerald-500" />
              Amalan Yang Disunnahkan:
            </h4>
            <ul className="space-y-1.5">
              {event.recommendedamal.map((amal, idx) => (
                <li key={idx} className="text-sm text-slate-600 flex items-start gap-2">
                  <span className="text-emerald-500 mt-0.5">•</span>
                  <span>{amal}</span>
                </li>
              ))}
            </ul>
          </div>
        )}
        
        {(event.quranreference || event.hadithreference) && (
          <div className="pt-3 border-t space-y-2">
            {event.quranreference && (
              <div className="flex items-start gap-2">
                <BookOpen className="w-4 h-4 text-emerald-600 mt-0.5 flex-shrink-0" />
                <p className="text-xs text-slate-600 italic">{event.quranreference}</p>
              </div>
            )}
            {event.hadithreference && (
              <div className="flex items-start gap-2">
                <BookOpen className="w-4 h-4 text-blue-600 mt-0.5 flex-shrink-0" />
                <p className="text-xs text-slate-600 italic">{event.hadithreference}</p>
              </div>
            )}
          </div>
        )}
        
        {event.reminderdaysbefore > 0 && (
          <div className="flex items-center gap-2 text-xs text-slate-500">
            <Clock className="w-3 h-3" />
            <span>Reminder {event.reminderdaysbefore} day(s) before</span>
          </div>
        )}
      </CardContent>
    </Card>
  );
}