import { useState } from 'react';
import { trpc } from '@/utils/trpc';
import { useIslamicEventMutations } from '@/hooks/useIslamicEventMutations';
import { Plus, Edit, Trash2, Save, X, Calendar, Loader2, Calendar1 } from 'lucide-react';
import { HIJRI_MONTHS, ISLAMIC_EVENTS_CATEGORIES } from '@/utils/enums';
import { AlertDialog, AlertDialogTrigger, AlertDialogContent, AlertDialogHeader, AlertDialogTitle, AlertDialogDescription, AlertDialogFooter, AlertDialogCancel, AlertDialogAction } from '@/components/ui/alert-dialog';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Label } from '@/components/ui/label';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Switch } from '@/components/ui/switch';
import PageLoadingComponent from '@/components/PageLoadingComponent';
import NoDataCardComponent from '@/components/NoDataCardComponent';
import Breadcrumb from '@/components/Breadcrumb';
import { translate } from '@/utils/translations';
import AccessDeniedComponent from '@/components/AccessDeniedComponent';
import { useCrudPermissions } from '@/components/PermissionsContext';
import { useAdminAccess } from '@/utils/auth';

export default function ManageIslamicEvent() {
  const { currentUser, loadingUser, hasAdminAccess, isSuperAdmin, currentUserStates } = useAdminAccess();
  const { loading: permissionsLoading, canView, canCreate, canEdit, canDelete } = useCrudPermissions('islamic_events');
  const [showDialog, setShowDialog] = useState(false);
  const [editingEvent, setEditingEvent] = useState(null);
  const [formData, setFormData] = useState({
    title: '',
    category: 'Event',
    hijrimonth: 1,
    hijriday: 1,
    description: '',
    virtue: '',
    recommendedamal: [],
    quranreference: '',
    hadithreference: '',
    isactive: true,
    isrecurring: true,
    reminderdaysbefore: 1,
  });
  const [amalInput, setAmalInput] = useState('');

  const trpcUtils = trpc.useContext();
  const { createEvent, updateEvent, deleteEvent } = useIslamicEventMutations();

  const { data: events = [], isLoading } = trpc.islamicEvent.getEventsByHijriYear.useQuery();

  const resetForm = () => {
    setFormData({
      title: '',
      category: 'Event',
      hijrimonth: 1,
      hijriday: 1,
      description: '',
      virtue: '',
      recommendedamal: [],
      quranreference: '',
      hadithreference: '',
      isactive: true,
      isrecurring: true,
      reminderdaysbefore: 1,
    });
    setAmalInput('');
    setEditingEvent(null);
    setShowDialog(false);
  };

  const openAddDialog = () => {
    resetForm();
    setEditingEvent(null);
    setShowDialog(true);
  };

  const handleEdit = (event) => {
    setEditingEvent(event);
    setFormData({
      title: event.title || '',
      category: event.category || 'Event',
      hijrimonth: event.hijrimonth || 1,
      hijriday: event.hijriday || 1,
      description: event.description || '',
      virtue: event.virtue || '',
      recommendedamal: event.recommendedamal || [],
      quranreference: event.quranreference || '',
      hadithreference: event.hadithreference || '',
      isactive: event.isactive ?? true,
      isrecurring: event.isrecurring ?? true,
      reminderdaysbefore: event.reminderdaysbefore || 1,
    });
    setShowDialog(true);
  };

  const handleSubmit = () => {
    if (!formData.title.trim()) return;

    if (editingEvent) {
      updateEvent.mutate({ id: editingEvent.id, data: formData });
    } else {
      createEvent.mutate(formData);
    }

    resetForm();
  };

  const addAmal = () => {
    if (amalInput.trim()) {
      setFormData({
        ...formData,
        recommendedamal: [...formData.recommendedamal, amalInput.trim()],
      });
      setAmalInput('');
    }
  };

  const removeAmal = (index) => {
    setFormData({
      ...formData,
      recommendedamal: formData.recommendedamal.filter((_, i) => i !== index),
    });
  };

  const categoryColors = {
    Event: 'emerald',
    Fasting: 'purple',
    Prayer: 'blue',
    Hajj: 'amber',
    Umrah: 'orange',
    Education: 'teal',
  };

  if (loadingUser || permissionsLoading) {
    return (
      <PageLoadingComponent/>
    );
  }

  if (!hasAdminAccess) {
    return (
      <AccessDeniedComponent/>
    );
  }

  if (!canView) {
    return (
      <div className="space-y-6">
        <Breadcrumb items={[
          { label: translate('Superadmin Dashboard'), page: 'SuperadminDashboard' },
          { label: translate('Manage Islamic Events'), page: 'ManageIslamicEvent' }
        ]} />
        <AccessDeniedComponent/>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <Breadcrumb items={[
        { label: translate('Superadmin Dashboard'), page: 'SuperadminDashboard' },
        { label: translate('Manage Islamic Events'), page: 'ManageIslamicEvent' }
      ]} />
      
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <h1 className="text-2xl font-bold flex items-center gap-2">
          <Calendar1 className="w-6 h-6 text-emerald-600" />
          {translate('Manage Islamic Events')}
        </h1>
        <div className="flex gap-2">
          <Button onClick={openAddDialog} className="bg-emerald-600 hover:bg-emerald-700">
            <Plus className="w-4 h-4 mr-2" />
            {translate('Add Event')}
          </Button>
        </div>
      </div>

      {isLoading ? (
        <PageLoadingComponent/>
      ) : events.length === 0 ? (
        <NoDataCardComponent isPage/>
      ) : (
        <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-4">
          {events.map(event => (
            <Card key={event.id} className={`border-0 shadow-md ${!event.isactive && 'opacity-50'}`}>
              <div className={`h-1 bg-${categoryColors[event.category]}-500`} />
              <CardHeader className="pb-3">
                <div className="flex items-start justify-between">
                  <div className="flex-1">
                    <CardTitle className="text-base line-clamp-1">{event.title}</CardTitle>
                    <div className="flex items-center gap-2 mt-2">
                      <Badge className={`bg-${categoryColors[event.category]}-100 text-${categoryColors[event.category]}-700`}>
                        {event.category}
                      </Badge>
                      <Badge variant="outline" className="text-xs">
                        {event.hijriday} {HIJRI_MONTHS[event.hijrimonth - 1]?.slice(0, 8)}
                      </Badge>
                    </div>
                  </div>
                </div>
              </CardHeader>
              <CardContent className="space-y-3">
                {event.description && (
                  <p className="text-sm text-slate-600 line-clamp-2">{event.description}</p>
                )}
                <div className="flex items-center gap-2">
                  <Button
                    size="sm"
                    variant="outline"
                    onClick={() => handleEdit(event)}
                  >
                    <Edit className="w-3 h-3 mr-1" />
                    Edit
                  </Button>
                  <AlertDialog>
                    <AlertDialogTrigger asChild>
                      <Button size="sm" variant="destructive">
                        <Trash2 className="w-3 h-3 mr-1" />
                        Delete
                      </Button>
                    </AlertDialogTrigger>
                    <AlertDialogContent>
                      <AlertDialogHeader>
                        <AlertDialogTitle>Delete Event?</AlertDialogTitle>
                        <AlertDialogDescription>
                          This will permanently delete "{event.title}"
                        </AlertDialogDescription>
                      </AlertDialogHeader>
                      <AlertDialogFooter>
                        <AlertDialogCancel>Cancel</AlertDialogCancel>
                        <AlertDialogAction
                          onClick={() => deleteEvent.mutate(event.id)}
                          className="bg-red-500 hover:bg-red-600"
                        >
                          Delete
                        </AlertDialogAction>
                      </AlertDialogFooter>
                    </AlertDialogContent>
                  </AlertDialog>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}

      <Dialog open={showDialog} onOpenChange={(open) => !open && resetForm()}>
        <DialogContent className="max-w-3xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>{editingEvent ? 'Edit Event' : 'Create New Event'}</DialogTitle>
          </DialogHeader>

          <div className="space-y-4 py-4">
            <div className="grid md:grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label>Title (English) *</Label>
                <Input
                  value={formData.title}
                  onChange={(e) => setFormData({ ...formData, title: e.target.value })}
                />
              </div>
              <div className="space-y-2">
                <Label>Category *</Label>
                <select
                  value={formData.category}
                  onChange={(e) => setFormData({ ...formData, category: e.target.value })}
                  className="w-full border rounded px-2 py-1"
                >
                  {ISLAMIC_EVENTS_CATEGORIES.map(cat => (
                    <option key={cat} value={cat}>{cat}</option>
                  ))}
                </select>
              </div>
            </div>

            <div className="grid md:grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label>Hijri Month *</Label>
                <select
                  value={formData.hijrimonth}
                  onChange={(e) => setFormData({ ...formData, hijrimonth: parseInt(e.target.value) })}
                  className="w-full border rounded px-2 py-1"
                >
                  {HIJRI_MONTHS.map((month, idx) => (
                    <option key={idx} value={idx + 1}>{idx + 1}. {month}</option>
                  ))}
                </select>
              </div>
              <div className="space-y-2">
                <Label>Hijri Day *</Label>
                <Input
                  type="number"
                  min={1}
                  max={30}
                  value={formData.hijriday}
                  onChange={(e) => setFormData({ ...formData, hijriday: parseInt(e.target.value) })}
                />
              </div>
            </div>

            <div className="space-y-2">
              <Label>Description</Label>
              <Textarea
                value={formData.description}
                onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                rows={3}
              />
            </div>

            <div className="space-y-2">
              <Label>Virtue & Benefits</Label>
              <Textarea
                value={formData.virtue}
                onChange={(e) => setFormData({ ...formData, virtue: e.target.value })}
                rows={2}
              />
            </div>

            <div className="space-y-2">
              <Label>Recommended Amal</Label>
              <div className="flex gap-2">
                <Input
                  value={amalInput}
                  onChange={(e) => setAmalInput(e.target.value)}
                  placeholder="Add recommended action..."
                  onKeyPress={(e) => e.key === 'Enter' && (e.preventDefault(), addAmal())}
                />
                <Button type="button" onClick={addAmal}>Add</Button>
              </div>
              {formData.recommendedamal.length > 0 && (
                <div className="space-y-1.5 mt-2">
                  {formData.recommendedamal.map((amal, idx) => (
                    <div key={idx} className="flex items-center gap-2 p-2 bg-slate-50 rounded">
                      <span className="flex-1 text-sm">{amal}</span>
                      <Button
                        size="icon"
                        variant="ghost"
                        onClick={() => removeAmal(idx)}
                        className="h-6 w-6"
                      >
                        <X className="w-3 h-3" />
                      </Button>
                    </div>
                  ))}
                </div>
              )}
            </div>

            <div className="grid md:grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label>Quran Reference</Label>
                <Input
                  value={formData.quranreference}
                  onChange={(e) => setFormData({ ...formData, quranreference: e.target.value })}
                />
              </div>
              <div className="space-y-2">
                <Label>Hadith Reference</Label>
                <Input
                  value={formData.hadithreference}
                  onChange={(e) => setFormData({ ...formData, hadithreference: e.target.value })}
                />
              </div>
            </div>

            <div className="grid md:grid-cols-3 gap-4">
              <div className="flex items-center gap-2">
                <Switch
                  checked={formData.isactive}
                  onCheckedChange={(v) => setFormData({ ...formData, isactive: v })}
                />
                <Label>Active</Label>
              </div>
              <div className="flex items-center gap-2">
                <Switch
                  checked={formData.isrecurring}
                  onCheckedChange={(v) => setFormData({ ...formData, isrecurring: v })}
                />
                <Label>Recurring Annually</Label>
              </div>
              <div className="space-y-2">
                <Label>Remind (days before)</Label>
                <Input
                  type="number"
                  min={0}
                  max={7}
                  value={formData.reminderdaysbefore}
                  onChange={(e) => setFormData({ ...formData, reminderdaysbefore: parseInt(e.target.value) || 0 })}
                />
              </div>
            </div>

            <div className="flex justify-end gap-3 pt-4 border-t">
              <Button variant="outline" onClick={resetForm}>
                <X className="w-4 h-4 mr-2" />
                Cancel
              </Button>
              <Button
                onClick={handleSubmit}
                disabled={!formData.title.trim() || createEvent.isPending || updateEvent.isPending}
                className="bg-emerald-500 hover:bg-emerald-600"
              >
                {(createEvent.isPending || updateEvent.isPending) ? (
                  <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                ) : (
                  <Save className="w-4 h-4 mr-2" />
                )}
                {editingEvent ? 'Update' : 'Create'}
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}
