import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import {
  MapPin, Calendar, Users, Building2, User, FileText,
  Edit, ArrowLeft, DollarSign, TrendingUp
} from 'lucide-react';
import { format } from 'date-fns';
import { Link, useNavigate } from 'react-router-dom';
import { createPageUrl } from '@/utils';
import ProgressBar from '@/components/ProgressBar';
import WaqfForm from '@/components/waqf/WaqfForm';
import { useGetWaqfProjectById } from '@/hooks/useWaqfProjectMutations';
import PageLoadingComponent from '@/components/PageLoadingComponent';
import NoDataCardComponent from '@/components/NoDataCardComponent';
import { translate } from '@/utils/translations';

const CATEGORY_COLORS = {
  Education: 'bg-blue-100 text-blue-700 border-blue-200',
  Mosque: 'bg-emerald-100 text-emerald-700 border-emerald-200',
  Healthcare: 'bg-red-100 text-red-700 border-red-200',
  Orphans: 'bg-purple-100 text-purple-700 border-purple-200',
  Water: 'bg-cyan-100 text-cyan-700 border-cyan-200',
  'General Charity': 'bg-amber-100 text-amber-700 border-amber-200'
};

const STATUS_COLORS = {
  Planned: 'bg-slate-100 text-slate-700',
  Ongoing: 'bg-blue-100 text-blue-700',
  Completed: 'bg-green-100 text-green-700',
  'On Hold': 'bg-orange-100 text-orange-700'
};

export default function WaqfDetail() {
  const navigate = useNavigate();
  const urlParams = new URLSearchParams(window.location.search);
  const projectId = urlParams.get('id') ? Number(urlParams.get('id')) : null;

  const { data: project, isLoading, isError } = useGetWaqfProjectById(projectId);

  if (isLoading) {
    return (
      <PageLoadingComponent/>
    );  
  }

  if (!project || isError) {
    return (
      <NoDataCardComponent
        isPage={true}
        title={translate('No Waqf Project Details')}
        description="Tiada Maklumat Dijumpai"
      />
    );
  }
  
  const remainingAmount = (project.totalrequired || 0) - (project.amountcollected || 0);
  const fundingProgress = project.totalrequired > 0 
    ? (project.amountcollected / project.totalrequired) * 100 
    : 0;

  return (
    <div className="min-h-screen bg-gradient-to-b from-slate-50 to-white">
      <div className="relative overflow-hidden bg-gradient-to-br from-emerald-600 via-teal-600 to-cyan-700 py-12 px-4">
        <div className="absolute inset-0 overflow-hidden">
          <div className="absolute -top-40 -right-40 w-80 h-80 bg-white/10 rounded-full blur-3xl" />
          <div className="absolute -bottom-40 -left-40 w-80 h-80 bg-white/10 rounded-full blur-3xl" />
        </div>
        
        <div className="relative max-w-6xl mx-auto">
          
          <div className="flex flex-col sm:flex-row items-start justify-between gap-4">
            <div className="flex-1">
              <div className="flex flex-wrap items-center gap-2 mb-3">
                <button
                  onClick={() => navigate(-1)}
                  className="p-2 bg-white/90 backdrop-blur-sm rounded-full shadow-lg"
                >
                  <ArrowLeft className="w-5 h-5 text-stone-700" />
                </button>
                <Badge className={CATEGORY_COLORS[project.category]}>
                  {project.category}
                </Badge>
                <Badge className={STATUS_COLORS[project.status]}>
                  {project.status}
                </Badge>
              </div>
              <h1 className="text-2xl sm:text-3xl md:text-4xl font-bold text-white mb-3">
                {project.waqfname}
              </h1>
              {project.description && (
                <p className="text-white/80 text-sm sm:text-base md:text-lg max-w-3xl">{project.description}</p>
              )}
            </div>
          </div>
        </div>
      </div>

      <div className="max-w-6xl mx-auto px-4 -mt-8 pb-12 relative z-10">
        {project.photourl && (
          <Card className="mb-6 overflow-hidden border-0 shadow-lg">
            <img 
              src={`/api/file/waqf-project/${encodeURIComponent(project.photourl)}`} 
              alt={project.waqfname}
              className="w-full h-64 sm:h-96 object-cover"
            />
          </Card>
        )}

        <div className="grid lg:grid-cols-3 gap-6">
          <div className="lg:col-span-2 space-y-6">
            <Card className="border-0 shadow-lg">
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <TrendingUp className="w-5 h-5 text-emerald-600" />
                  Project Progress
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <ProgressBar percentage={project.progresspercentage} size="lg" />
                
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 sm:gap-4 pt-4">
                  <div className="text-center p-3 sm:p-4 bg-emerald-50 rounded-lg">
                    <p className="text-xs text-slate-500 mb-1">Total Required</p>
                    <p className="text-lg sm:text-xl font-bold text-emerald-700">
                      RM {(project.totalrequired || 0).toLocaleString()}
                    </p>
                  </div>
                  <div className="text-center p-3 sm:p-4 bg-blue-50 rounded-lg">
                    <p className="text-xs text-slate-500 mb-1">Collected</p>
                    <p className="text-lg sm:text-xl font-bold text-blue-700">
                      RM {(project.amountcollected || 0).toLocaleString()}
                    </p>
                  </div>
                  <div className="text-center p-3 sm:p-4 bg-slate-50 rounded-lg">
                    <p className="text-xs text-slate-500 mb-1">Remaining</p>
                    <p className="text-lg sm:text-xl font-bold text-slate-700">
                      RM {remainingAmount.toLocaleString()}
                    </p>
                  </div>
                </div>

                <div className="p-4 bg-gradient-to-br from-amber-50 to-orange-50 rounded-lg border border-amber-100">
                  <p className="text-sm text-amber-900">
                    <span className="font-semibold">Funding Progress: </span>
                    {fundingProgress.toFixed(1)}% of target amount collected
                  </p>
                </div>
              </CardContent>
            </Card>

            <Card className="border-0 shadow-lg">
              <CardHeader>
                <CardTitle>Project Details</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                {project.beneficiaries && (
                  <div className="flex items-start gap-3 p-3 bg-slate-50 rounded-lg">
                    <Users className="w-5 h-5 text-emerald-600 mt-0.5" />
                    <div>
                      <p className="text-sm font-semibold text-slate-700">Beneficiaries</p>
                      <p className="text-sm text-slate-600">{project.beneficiaries}</p>
                    </div>
                  </div>
                )}
                
                {project.location && (
                  <div className="flex items-start gap-3 p-3 bg-slate-50 rounded-lg">
                    <MapPin className="w-5 h-5 text-emerald-600 mt-0.5" />
                    <div>
                      <p className="text-sm font-semibold text-slate-700">Location</p>
                      <p className="text-sm text-slate-600">{project.location}</p>
                    </div>
                  </div>
                )}

                {project.responsibleperson && (
                  <div className="flex items-start gap-3 p-3 bg-slate-50 rounded-lg">
                    <User className="w-5 h-5 text-emerald-600 mt-0.5" />
                    <div>
                      <p className="text-sm font-semibold text-slate-700">Responsible Person</p>
                      <p className="text-sm text-slate-600">{project.responsibleperson}</p>
                    </div>
                  </div>
                )}

                {project.waqftype && (
                  <div className="flex items-start gap-3 p-3 bg-slate-50 rounded-lg">
                    <Building2 className="w-5 h-5 text-emerald-600 mt-0.5" />
                    <div>
                      <p className="text-sm font-semibold text-slate-700">Waqf Type</p>
                      <p className="text-sm text-slate-600">{project.waqftype}</p>
                    </div>
                  </div>
                )}
              </CardContent>
            </Card>

            {project.notes && (
              <Card className="border-0 shadow-lg">
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <FileText className="w-5 h-5 text-emerald-600" />
                    Notes & Updates
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <p className="text-sm text-slate-600 whitespace-pre-wrap">{project.notes}</p>
                </CardContent>
              </Card>
            )}
          </div>

          <div className="space-y-6">
            <Card className="border-0 shadow-lg">
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Calendar className="w-5 h-5 text-emerald-600" />
                  Timeline
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                {project.startdate && (
                  <div>
                    <p className="text-xs text-slate-500 mb-1">Start Date</p>
                    <p className="text-sm font-semibold text-slate-700">
                      {format(new Date(project.startdate), 'MMM d, yyyy')}
                    </p>
                  </div>
                )}
                {project.enddate && (
                  <div>
                    <p className="text-xs text-slate-500 mb-1">Target End Date</p>
                    <p className="text-sm font-semibold text-slate-700">
                      {format(new Date(project.enddate), 'MMM d, yyyy')}
                    </p>
                  </div>
                )}
                {project.startdate && project.enddate && (
                  <div className="pt-3 border-t">
                    <p className="text-xs text-slate-500 mb-1">Duration</p>
                    <p className="text-sm font-semibold text-slate-700">
                      {Math.ceil((new Date(project.enddate) - new Date(project.startdate)) / (1000 * 60 * 60 * 24))} days
                    </p>
                  </div>
                )}
              </CardContent>
            </Card>

            <Card className="border-0 shadow-lg bg-gradient-to-br from-emerald-50 to-teal-50">
              <CardHeader>
                <CardTitle className="text-emerald-700">Impact Summary</CardTitle>
              </CardHeader>
              <CardContent className="space-y-3">
                <div className="flex justify-between items-center">
                  <span className="text-sm text-slate-600">Project Status</span>
                  <Badge className={STATUS_COLORS[project.status]}>
                    {project.status}
                  </Badge>
                </div>
                <div className="flex justify-between items-center">
                  <span className="text-sm text-slate-600">Category</span>
                  <Badge className={CATEGORY_COLORS[project.category]}>
                    {project.category}
                  </Badge>
                </div>
                <div className="flex justify-between items-center pt-2 border-t">
                  <span className="text-sm text-slate-600">Created</span>
                  <span className="text-sm font-medium text-slate-700">
                    {format(new Date(project.createdat), 'MMM d, yyyy')}
                  </span>
                </div>
              </CardContent>
            </Card>
          </div>
        </div>
      </div>
    </div>
  );
}