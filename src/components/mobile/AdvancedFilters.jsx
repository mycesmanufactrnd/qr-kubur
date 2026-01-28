import { useState } from 'react';
import { X, Filter } from 'lucide-react';
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { STATES_MY } from '@/utils/enums';
import { Input } from "@/components/ui/input";
import { translate } from '@/utils/translations';

export default function AdvancedFilters({ onApplyFilter }) {
  const [open, setOpen] = useState(false);
  const [filterState, setFilterState] = useState('');
  const [filterName, setFilterName] = useState('');

  const handleApply = () => {
    onApplyFilter({ state: filterState, name: filterName });
    setOpen(false);
  };

  return (
    <>
      <Button onClick={() => setOpen(true)} className="flex items-center gap-1">
        <Filter className="w-4 h-4" /> {translate('Filter')}
      </Button>

      {open && (
        <div
          className="fixed inset-0 bg-black bg-opacity-40 z-[98]"
          onClick={() => setOpen(false)}
        />
      )}

      <div
        className={`
          fixed bottom-0 left-0 w-full h-3/4 bg-white dark:bg-gray-800 shadow-lg
          z-[99] transform transition-transform duration-300
          ${open ? 'translate-y-0' : 'translate-y-full'}
          rounded-t-xl
        `}
      >
        <Card className="h-full flex flex-col">
          <CardContent className="p-4 flex-1 flex flex-col">
            <div className="flex justify-between items-center mb-4">
              <h3 className="text-lg font-semibold">{translate('Advanced Filter')}</h3>
              <Button type="button" variant="ghost" onClick={() => setOpen(false)}>
                <X className="w-4 h-4" />
              </Button>
            </div>

            <div className="space-y-4 flex-1 overflow-y-auto">
              <Input
                placeholder={translate('Grave Name')}
                value={filterName}
                onChange={(e) => setFilterName(e.target.value)}
                className="h-9"
              />

              <Select value={filterState} onValueChange={setFilterState}>
                <SelectTrigger className="h-9">
                  <SelectValue placeholder={translate('State')} />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="nearby">{translate('Nearby')}</SelectItem>
                  {STATES_MY.map((state) => (
                    <SelectItem key={state} value={state}>
                      {state}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <Button className="mt-auto w-full" onClick={handleApply}>
              {translate('Apply Filter')}
            </Button>
          </CardContent>
        </Card>
      </div>
    </>
  );
}
