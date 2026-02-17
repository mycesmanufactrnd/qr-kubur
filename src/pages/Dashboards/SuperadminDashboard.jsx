import { Link } from 'react-router-dom';
import { Shield, Users, Database, Terminal, Sparkles, List, CreditCard, Settings, UserCheck, UserX, Moon, Sun, Globe, Calendar, Gift, Zap, House } from 'lucide-react';
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { translate } from '@/utils/translations';
import AccessDeniedComponent from '@/components/AccessDeniedComponent.jsx';
import { useAdminAccess } from '@/utils/auth';
import PageLoadingComponent from '@/components/PageLoadingComponent';
import { createPageUrl } from '@/utils';

export default function SuperadminDashboard() {
  const { loadingUser, isSuperAdmin } = useAdminAccess();
  const superadminConfig = [
    {
      value: "users",
      title: translate('User Management'),
      items: [
        { name: translate('Impersonate User'), page: 'ImpersonateUser', icon: UserX, color: 'red' }, 
        { name: translate('Manage Users'), page: 'ManageUsers', icon: Users, color: 'amber' },
        { name: translate('Manage Permissions'), page: 'ManagePermissions', icon: UserCheck, color: 'indigo' },
      ]
    },
    {
      value: "organisation",
      title: translate('Organisation Management'),
      items: [
        { name: translate('Organisation Type'), page: 'ManageOrganisationTypes', icon: List, color: 'purple' },
        { name: translate('Manage Organisations'), page: 'ManageOrganisations', icon: Database, color: 'emerald' },
        { name: translate('Manage Private Organisations'), page: 'ManagePrivateOrganisations', icon: House, color: 'red' },
        { name: translate('Manage Volunteer & NGO'), page: 'ManageVolunteerNGO', icon: House, color: 'yellow' },
      ]
    },
    {
      value: "payment",
      title: translate('Payment Management'), 
      items: [
        { name: translate('Payment Platforms'), page: 'ManagePaymentPlatforms', icon: CreditCard, color: 'green' },
        { name: translate('Payment Fields'), page: 'ManagePaymentFields', icon: Settings, color: 'indigo' },
        { name: translate('ToyyibPay Config'), page: 'ToyyibPayConfigPage', icon: Sun, color: 'yellow' },
        { name: translate('Billpiz Config'), page: 'BillplzConfigPage', icon: Moon, color: 'pink' },
      ]
    },
    {
      value: "system",
      title: translate('System Management'),
      items: [
        { name: translate('Activity Logs'), page: 'ViewLogs', icon: Terminal, color: 'pink' },
        { name: translate('Icons Library'), page: 'IconLibrary', icon: Sparkles, color: 'purple' },
        { name: translate('Manage Heritage'), page: 'ManageHeritageSites', icon: Globe, color: 'red' },
        { name: translate('Manage Islamic Events'), page: 'ManageIslamicEvent', icon: Calendar, color: 'emerald' },
        { name: translate('Manage Waqf Project'), page: 'ManageWaqfProject', icon: Gift, color: 'yellow' },
        { name: translate('Ollama'), page: 'Ollama', icon: Zap, color: 'indigo' },
      ]
    },
  ];

  if (loadingUser) {
    return (
      <PageLoadingComponent/>
    );
  }

  if (!isSuperAdmin) {
    return (
      <AccessDeniedComponent/>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-gray-900 dark:text-white flex items-center gap-2">
            <Shield className="w-6 h-6 text-purple-600 dark:text-purple-400" />
            {translate('Super Admin Dashboard')}
          </h1>
        </div>
        <Link to={createPageUrl('AdminDashboard')}>
          <Badge className="w-fit bg-purple-100 text-purple-700 border-purple-200">
              {translate('To Admin Dashboard')}
          </Badge>
        </Link>
      </div>

      <Tabs defaultValue={superadminConfig[0].value} className="space-y-6">
        <TabsList className="grid w-full grid-cols-2 md:grid-cols-4">
          {superadminConfig.map((tab) => (
            <TabsTrigger key={tab.value} value={tab.value}>
              {tab.title}
            </TabsTrigger>
          ))}
        </TabsList>
        {superadminConfig.map((tab) => (
          <TabsContent key={tab.value} value={tab.value} className="space-y-6">
            <div className="grid md:grid-cols-3 gap-3">
              {tab.items.map((item) => (
                <Link key={item.page} to={createPageUrl(item.page)}>
                  <Card className="border-0 shadow-sm hover:shadow-md transition-shadow cursor-pointer">
                    <CardContent className="p-4">
                      <div className="flex items-center gap-3">
                        <div className={`w-10 h-10 rounded-lg bg-${item.color}-100 flex items-center justify-center flex-shrink-0`}>
                          <item.icon className={`w-5 h-5 text-${item.color}-600`} />
                        </div>
                        <div>
                          <h3 className="font-semibold text-sm">{item.name}</h3>
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                </Link>
              ))}
            </div>
          </TabsContent>
        ))}
      </Tabs>
    </div>
  );
}