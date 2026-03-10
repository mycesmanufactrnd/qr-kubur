import { useState, useMemo, useEffect } from 'react';
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Plus, TrendingUp, CheckCircle, Search, Building2, X } from 'lucide-react';
import WaqfCard from '@/components/waqf/WaqfCard';
import WaqfForm from '@/components/waqf/WaqfForm';
import { useGetWaqfProjectPaginated, useWaqfProjectMutations } from '@/hooks/useWaqfProjectMutations';
import InlineLoadingComponent from '@/components/InlineLoadingComponent';
import NoDataCardComponent from '@/components/NoDataCardComponent';
import Pagination from '@/components/Pagination';
import { translate } from '@/utils/translations';
import { useSearchParams } from 'react-router-dom';
import { defaultWaqfProjectField } from '@/utils/defaultformfields';
import { useCrudPermissions } from '@/components/PermissionsContext';
import { useAdminAccess } from '@/utils/auth';
import PageLoadingComponent from '@/components/PageLoadingComponent';
import AccessDeniedComponent from '@/components/AccessDeniedComponent';
import Breadcrumb from '@/components/Breadcrumb';

export default function ManageWaqfProject() {
    const { currentUser, loadingUser, hasAdminAccess, isSuperAdmin, currentUserStates } = useAdminAccess();
    const { loading: permissionsLoading, canView, canCreate, canEdit, canDelete } = useCrudPermissions('waqf');
    
    const [itemsPerPage, setItemsPerPage] = useState(10);
    const [showDialog, setShowDialog] = useState(false);
    const [editingProject, setEditingProject] = useState(null);
    const [searchParams, setSearchParams] = useSearchParams();
    const urlPage = parseInt(searchParams.get('page') || '1');
    const urlWaqfName = searchParams.get('waqfName') || '';

    const [tempWaqfName, setTempWaqfName] = useState(urlWaqfName);
    
    useEffect(() => {
        setTempWaqfName(urlWaqfName);
    }, [urlWaqfName]);

    const handleSearch = () => {
        const params = { page: '1' };
        if (tempWaqfName) params.waqfName = tempWaqfName;
        setSearchParams(params);
    };

    const handleReset = () => {
        setSearchParams({});
    };

    const { waqfList, waqfStats, totalPages = 0, isLoading, refetch } = useGetWaqfProjectPaginated({ 
        page: urlPage, 
        pageSize: itemsPerPage,
        filterWaqfName: urlWaqfName || undefined,
    });

    const { createWaqfProject, updateWaqfProject, deleteWaqfProject } = useWaqfProjectMutations();

    const stats = useMemo(() => {
        if (!waqfStats) {
            return { total: 0, active: 0, completed: 0 };
        }

        return waqfStats;
    }, [waqfStats]);

    const quickStats = [
        {
            label: 'Total Projects',
            value: stats.total,
            icon: Building2,
            cardGradient: 'from-blue-500 to-blue-600',
            textColor: 'text-blue-100',
        },
        {
            label: 'Active Projects',
            value: stats.active,
            icon: TrendingUp,
            cardGradient: 'from-emerald-500 to-emerald-600',
            textColor: 'text-emerald-100',
        },
        {
            label: 'Completed',
            value: stats.completed,
            icon: CheckCircle,
            cardGradient: 'from-green-500 to-green-600',
            textColor: 'text-green-100',
        },
    ];

    const handleSubmit = async (data) => {
        if (editingProject) {
            updateWaqfProject.mutateAsync({ id: editingProject.id, data })
            .then((res) => {
                if (res) {
                    setShowDialog(false);
                }
            });
        } else {
            createWaqfProject.mutateAsync(data)
            .then((res) => {
                if (res) {
                    setShowDialog(false);
                }
            });
        }
    };

    const handleEdit = (project) => {
        setEditingProject({ ...project });
        setShowDialog(true);
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
                    { label: translate('Super Admin Dashboard'), page: 'SuperadminDashboard' },
                    { label: translate('Manage Waqf Project'), page: 'ManageWaqfProject' }
                ]} />
                <AccessDeniedComponent/>
            </div>
        );
    }

    return (
        <div className="space-y-6">
            <Breadcrumb items={[
                { label: translate('Super Admin Dashboard'), page: 'SuperadminDashboard' },
                { label: translate('Manage Waqf Project'), page: 'ManageWaqfProject' }
            ]} />
            <div className="bg-gradient-to-b from-slate-50 to-white">
                <div className="relative overflow-hidden bg-gradient-to-br from-emerald-600 via-teal-600 to-cyan-700 py-12 px-4">
                    <div className="relative max-w-7xl mx-auto">
                    <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
                        <div>
                        <div className="inline-flex items-center gap-2 bg-white/20 backdrop-blur-sm px-3 py-1.5 rounded-full text-white/90 text-sm mb-4">
                            <Building2 className="w-4 h-4" />
                            <span>Islamic Endowments</span>
                        </div>
                        <h1 className="text-3xl sm:text-4xl font-bold text-white mb-2">
                            Waqf Project Management
                        </h1>
                        <p className="text-white/80 text-sm sm:text-base">
                            Track and manage charitable endowment initiatives
                        </p>
                        </div>
                        <Button
                            onClick={() => {
                                setEditingProject(null);
                                setShowDialog(true);
                            }}
                            className="bg-white text-emerald-600 hover:bg-white/90"
                        >
                        <Plus className="w-4 h-4 mr-2" />
                        New Waqf Project
                        </Button>
                    </div>
                    </div>
                </div>

                <div className="max-w-7xl mx-auto px-4 -mt-8 pb-8 relative z-10">
                    <div className="grid grid-cols-2 lg:grid-cols-3 gap-3 sm:gap-4 mb-6 sm:mb-8">
                        {quickStats.map((stat, i) => (
                        <Card
                            key={i}
                            className={`border-0 shadow-lg bg-gradient-to-br ${stat.cardGradient} text-white`}
                        >
                            <CardContent className="p-4 sm:p-4">
                            <div className="flex items-start justify-between">
                                <div>
                                <p className={`${stat.textColor} text-xs sm:text-sm mb-1`}>
                                    {stat.label}
                                </p>
                                <p className="text-2xl sm:text-3xl font-bold">{stat.value}</p>
                                </div>
                                <stat.icon className="w-6 h-6 sm:w-8 sm:h-8 opacity-80" />
                            </div>
                            </CardContent>
                        </Card>
                        ))}
                    </div>

                    <Card className="border-0 shadow-md mb-6">
                        <CardContent className="p-4 space-y-3">
                        <div className="flex gap-2">
                            <div className="relative flex-1">
                            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
                            <Input
                                placeholder={translate('Waqf Name')}
                                value={tempWaqfName}
                                onChange={(e) => setTempWaqfName(e.target.value)}
                                onKeyDown={(e) => e.key === 'Enter' && handleSearch()}
                                className="pl-10"
                            />
                            </div>
                            <Button
                            onClick={handleSearch}
                            className="bg-emerald-600 hover:bg-emerald-700 px-6"
                            >
                            {translate('Search')}
                            </Button>
                        </div>

                        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
                            <Button variant="outline" onClick={handleReset} className="w-full">
                            <X className="w-4 h-4 mr-2" />
                            {translate('Reset')}
                            </Button>
                        </div>
                        </CardContent>
                    </Card>

                    {isLoading ? (
                        <div className="flex justify-center">
                        <InlineLoadingComponent isGrid />
                        </div>
                    ) : waqfList.items.length === 0 ? (
                        <NoDataCardComponent />
                    ) : (
                        <>
                        <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-4 sm:gap-6 mb-3">
                            {waqfList.items.map((project) => (
                                <WaqfCard key={project.id} project={project} onEditProject={handleEdit}/>
                            ))}
                        </div>

                        {totalPages > 0 && (
                            <Pagination
                                currentPage={urlPage}
                                totalPages={totalPages}
                                onPageChange={(p) =>
                                    setSearchParams({
                                    ...Object.fromEntries(searchParams),
                                    page: p.toString(),
                                    })
                                }
                                itemsPerPage={itemsPerPage}
                                onItemsPerPageChange={(v) => {
                                    setItemsPerPage(v);
                                    setSearchParams({
                                    ...Object.fromEntries(searchParams),
                                    page: '1',
                                    });
                                }}
                                totalItems={waqfList.total}
                            />
                        )}
                        </>
                    )}
                </div>


                <Dialog open={showDialog} onOpenChange={(open) => {
                    if (!open) {
                        setShowDialog(false);
                        setEditingProject(null);
                    }
                }}>

                <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
                    <DialogHeader>
                        <DialogTitle>
                        {editingProject ? 'Edit Waqf Project' : 'Create New Waqf Project'}
                        </DialogTitle>
                    </DialogHeader>
                    <WaqfForm
                        project={editingProject || defaultWaqfProjectField}
                        onSubmit={handleSubmit}
                        onCancel={() => {
                            setShowDialog(false);
                            setEditingProject(null);
                        }}
                    />
                </DialogContent>
                </Dialog>
            </div>
        </div>
    );
}