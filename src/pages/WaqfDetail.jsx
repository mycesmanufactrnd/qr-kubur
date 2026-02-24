import {
  MapPin, Calendar, Users, Building2, User, FileText,
  ArrowLeft, TrendingUp, Share2, DollarSign
} from 'lucide-react';
import { format } from 'date-fns';
import { useNavigate } from 'react-router-dom';
import ProgressBar from '@/components/ProgressBar';
import { useGetWaqfProjectById } from '@/hooks/useWaqfProjectMutations';
import PageLoadingComponent from '@/components/PageLoadingComponent';
import NoDataCardComponent from '@/components/NoDataCardComponent';
import { translate } from '@/utils/translations';
import { shareLink } from '@/utils/helpers';

const CATEGORY_COLORS = {
  Education:         'bg-blue-100    text-blue-700    border-blue-200',
  Mosque:            'bg-emerald-100 text-emerald-700  border-emerald-200',
  Healthcare:        'bg-red-100     text-red-700     border-red-200',
  Orphans:           'bg-purple-100  text-purple-700  border-purple-200',
  Water:             'bg-cyan-100    text-cyan-700    border-cyan-200',
  'General Charity': 'bg-amber-100   text-amber-700   border-amber-200',
};

const STATUS_CONFIG = {
  Planned:   { bg: 'bg-slate-100',   text: 'text-slate-700',   dot: 'bg-slate-400'   },
  Ongoing:   { bg: 'bg-blue-100',    text: 'text-blue-700',    dot: 'bg-blue-500'    },
  Completed: { bg: 'bg-emerald-100', text: 'text-emerald-700', dot: 'bg-emerald-500' },
  'On Hold': { bg: 'bg-orange-100',  text: 'text-orange-700',  dot: 'bg-orange-400'  },
};

function SectionCard({ icon: Icon, title, children }) {
  return (
    <div className="bg-white rounded-2xl shadow-sm border border-slate-100 overflow-hidden">
      {title && (
        <div className="flex items-center gap-2 px-4 py-3 border-b border-slate-100">
          {Icon && <Icon className="w-4 h-4 text-emerald-600" />}
          <p className="text-[11px] font-semibold uppercase tracking-widest text-emerald-600">{title}</p>
        </div>
      )}
      {children}
    </div>
  );
}

function DetailRow({ icon: Icon, label, value }) {
  if (!value) return null;
  return (
    <div className="flex items-center gap-3 px-4 py-3">
      <div className="w-8 h-8 rounded-full bg-emerald-50 border border-emerald-100 flex items-center justify-center shrink-0">
        <Icon className="w-3.5 h-3.5 text-emerald-600" />
      </div>
      <div className="flex-1 min-w-0">
        <p className="text-[10px] text-slate-400 font-medium uppercase tracking-wide">{label}</p>
        <p className="text-sm font-semibold text-slate-700">{value}</p>
      </div>
    </div>
  );
}

function TableRow({ label, children }) {
  return (
    <div className="flex justify-between items-center px-4 py-3">
      <span className="text-xs text-slate-400 font-medium uppercase tracking-wide shrink-0">{label}</span>
      <div className="ml-4">{children}</div>
    </div>
  );
}

export default function WaqfDetail() {
  const navigate = useNavigate();
  const urlParams = new URLSearchParams(window.location.search);
  const projectId = urlParams.get('id') ? Number(urlParams.get('id')) : null;

  const { data: project, isLoading, isError } = useGetWaqfProjectById(projectId);

  if (isLoading) return <PageLoadingComponent />;

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
  const statusCfg = STATUS_CONFIG[project.status] || STATUS_CONFIG['Planned'];
  const duration = project.startdate && project.enddate
    ? Math.ceil((new Date(project.enddate) - new Date(project.startdate)) / (1000 * 60 * 60 * 24))
    : null;

  return (
    <div className="min-h-screen pb-6">

      <div className="relative h-64 md:h-96 overflow-hidden">
        {project.photourl ? (
          <img
            src={`/api/file/waqf-project/${encodeURIComponent(project.photourl)}`}
            alt={project.waqfname}
            className="w-full h-full object-cover"
          />
        ) : (
          <div className="w-full h-full bg-gradient-to-br from-emerald-600 via-teal-500 to-cyan-600 flex items-center justify-center">
            <div className="text-white/10 text-[200px] font-arabic leading-none select-none">وقف</div>
          </div>
        )}
        <div className="absolute inset-0 bg-gradient-to-t from-black/75 via-black/20 to-black/10" />

        <button
          onClick={() => navigate(-1)}
          className="absolute top-4 left-4 w-9 h-9 flex items-center justify-center bg-black/30 backdrop-blur-md border border-white/20 rounded-full text-white active:opacity-70 transition-opacity"
        >
          <ArrowLeft className="w-4 h-4" />
        </button>

        <button
          onClick={() => shareLink({ title: project.waqfname, text: `Visit ${project.waqfname}`, url: window.location.href })}
          className="absolute top-4 right-4 w-9 h-9 flex items-center justify-center bg-black/30 backdrop-blur-md border border-white/20 rounded-full text-white active:opacity-70 transition-opacity"
        >
          <Share2 className="w-4 h-4" />
        </button>

        <div className="absolute bottom-0 left-0 right-0 px-5 pb-5 md:px-8 md:pb-8">
          <div className="max-w-6xl mx-auto">
            <div className="flex flex-wrap items-center gap-2 mb-2">
              <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-semibold border ${CATEGORY_COLORS[project.category] || 'bg-slate-100 text-slate-700 border-slate-200'}`}>
                {project.category}
              </span>
              <span className={`inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-xs font-semibold ${statusCfg.bg} ${statusCfg.text}`}>
                <span className={`w-1.5 h-1.5 rounded-full ${statusCfg.dot}`} />
                {project.status}
              </span>
            </div>
            <h1 className="text-2xl md:text-3xl font-bold text-white leading-tight">{project.waqfname}</h1>
            {project.location && (
              <p className="text-white/70 text-xs mt-1 flex items-center gap-1">
                <MapPin className="w-3 h-3" />{project.location}
              </p>
            )}
          </div>
        </div>
      </div>

      <div className="max-w-6xl mx-auto px-4 pt-5 pb-12">
        <div className="grid lg:grid-cols-3 gap-5">

          <div className="lg:col-span-2 space-y-4">

            {project.description && (
              <SectionCard>
                <div className="p-4">
                  <p className="text-[11px] font-semibold uppercase tracking-widest text-emerald-600 mb-1.5">About</p>
                  <p className="text-sm text-slate-600 leading-relaxed">{project.description}</p>
                </div>
              </SectionCard>
            )}

            <SectionCard icon={TrendingUp} title="Project Progress">
              <div className="p-4 space-y-4">
                <ProgressBar percentage={project.progresspercentage} size="lg" />

                <div className="rounded-xl border border-slate-100 overflow-hidden divide-y divide-slate-100">
                  <div className="flex items-center justify-between px-4 py-3 bg-emerald-50">
                    <span className="text-xs font-medium text-emerald-600">Total Required</span>
                    <span className="text-sm font-bold text-emerald-700">RM {(project.totalrequired || 0).toLocaleString()}</span>
                  </div>
                  <div className="flex items-center justify-between px-4 py-3 bg-blue-50">
                    <span className="text-xs font-medium text-blue-600">Collected</span>
                    <span className="text-sm font-bold text-blue-700">RM {(project.amountcollected || 0).toLocaleString()}</span>
                  </div>
                  <div className="flex items-center justify-between px-4 py-3 bg-slate-50">
                    <span className="text-xs font-medium text-slate-500">Remaining</span>
                    <span className="text-sm font-bold text-slate-700">RM {remainingAmount.toLocaleString()}</span>
                  </div>
                </div>

                <div className="flex items-center gap-2 px-3 py-2.5 bg-amber-50 border border-amber-100 rounded-xl text-xs text-amber-700">
                  <DollarSign className="w-3.5 h-3.5 shrink-0" />
                  <span><span className="font-bold">{fundingProgress.toFixed(1)}%</span> of target amount collected</span>
                </div>
              </div>
            </SectionCard>
            {(project.beneficiaries || project.responsibleperson || project.waqftype || project.location) && (
              <SectionCard title="Project Details">
                <div className="divide-y divide-slate-100">
                  <DetailRow icon={Building2} label="Waqf Type"         value={project.waqftype} />
                  <DetailRow icon={Users}     label="Beneficiaries"      value={project.beneficiaries} />
                  <DetailRow icon={User}      label="Responsible Person" value={project.responsibleperson} />
                  <DetailRow icon={MapPin}    label="Location"           value={project.location} />
                </div>
              </SectionCard>
            )}
            {project.notes && (
              <SectionCard icon={FileText} title="Notes & Updates">
                <div className="p-4">
                  <p className="text-sm text-slate-600 leading-relaxed whitespace-pre-wrap">{project.notes}</p>
                </div>
              </SectionCard>
            )}
          </div>

          <div className="space-y-4">
            {(project.startdate || project.enddate || project.createdat) && (
              <SectionCard icon={Calendar} title="Timeline">
                <div className="divide-y divide-slate-100">
                  {project.startdate && (
                    <TableRow label="Start Date">
                      <span className="text-sm font-semibold text-slate-700">{format(new Date(project.startdate), 'MMM d, yyyy')}</span>
                    </TableRow>
                  )}
                  {project.enddate && (
                    <TableRow label="End Date">
                      <span className="text-sm font-semibold text-slate-700">{format(new Date(project.enddate), 'MMM d, yyyy')}</span>
                    </TableRow>
                  )}
                  {duration && (
                    <TableRow label="Duration">
                      <span className="text-sm font-semibold text-slate-700">{duration} days</span>
                    </TableRow>
                  )}
                  {project.createdat && (
                    <TableRow label="Created">
                      <span className="text-sm font-semibold text-slate-700">{format(new Date(project.createdat), 'MMM d, yyyy')}</span>
                    </TableRow>
                  )}
                </div>
              </SectionCard>
            )}
            <SectionCard title="Impact Summary">
              <div className="divide-y divide-slate-100">
                <TableRow label="Status">
                  <span className={`inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-xs font-semibold ${statusCfg.bg} ${statusCfg.text}`}>
                    <span className={`w-1.5 h-1.5 rounded-full ${statusCfg.dot}`} />
                    {project.status}
                  </span>
                </TableRow>
                <TableRow label="Category">
                  <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-semibold border ${CATEGORY_COLORS[project.category] || 'bg-slate-100 text-slate-700 border-slate-200'}`}>
                    {project.category}
                  </span>
                </TableRow>
                <TableRow label="Progress">
                  <span className="text-sm font-bold text-emerald-700">{fundingProgress.toFixed(1)}%</span>
                </TableRow>
              </div>
            </SectionCard>

          </div>
        </div>
      </div>
    </div>
  );
}