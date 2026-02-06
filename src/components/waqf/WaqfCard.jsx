import { Link } from 'react-router-dom';
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { MapPin, Calendar, Users, ArrowRight, Edit } from 'lucide-react';
import { format } from 'date-fns';
import { createPageUrl } from '@/utils';
import ProgressBar from '@/components/ProgressBar';

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

export default function WaqfCard({ project, onEditProject, isView = false }) {
  const remainingAmount = (project.totalrequired || 0) - (project.amountcollected || 0);

  return (
    <Card className="border-0 shadow-md hover:shadow-xl transition-all overflow-hidden group">
      <div className={cn("h-1.5", 
        project.status === 'Completed' ? 'bg-green-500' : 
        project.status === 'Ongoing' ? 'bg-blue-500' : 'bg-slate-300'
      )} />
      
      {project.photourl && (
        <div className="relative h-40 overflow-hidden">
          <img 
            src={`/api/file/waqf-project/${encodeURIComponent(project.photourl)}`} 
            alt={project.waqfname}
            className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
          />
          <div className="absolute top-2 right-2 flex gap-2">
            <Badge className={CATEGORY_COLORS[project.category]}>
              {project.category}
            </Badge>
            <Badge className={STATUS_COLORS[project.status]}>
              {project.status}
            </Badge>
          </div>
        </div>
      )}

      <CardHeader className="pb-3">
        <div className="flex items-start justify-between gap-3">
          <CardTitle className="text-lg line-clamp-1">{project.waqfname}</CardTitle>
          {!project.photourl && (
            <div className="flex gap-1.5 flex-wrap">
              <Badge className={CATEGORY_COLORS[project.category]}>
                {project.category}
              </Badge>
              <Badge className={STATUS_COLORS[project.status]}>
                {project.status}
              </Badge>
            </div>
          )}
        </div>
        {project.description && (
          <p className="text-sm text-slate-600 line-clamp-2 mt-2">{project.description}</p>
        )}
      </CardHeader>

      <CardContent className="space-y-4">
        <ProgressBar percentage={project.progresspercentage} />
        <div className="grid grid-cols-2 gap-3 p-3 bg-slate-50 rounded-lg">
          <div>
            <p className="text-xs text-slate-500">Collected</p>
            <p className="text-sm font-bold text-emerald-600">
              RM {(project.amountcollected || 0).toLocaleString()}
            </p>
          </div>
          <div>
            <p className="text-xs text-slate-500">Remaining</p>
            <p className="text-sm font-bold text-slate-700">
              RM {remainingAmount.toLocaleString()}
            </p>
          </div>
        </div>
        <div className="space-y-2 text-sm text-slate-600">
          {project.location && (
            <div className="flex items-center gap-2">
              <MapPin className="w-4 h-4 text-slate-400" />
              <span>{project.location}</span>
            </div>
          )}
          {project.beneficiaries && (
            <div className="flex items-center gap-2">
              <Users className="w-4 h-4 text-slate-400" />
              <span className="line-clamp-1">{project.beneficiaries}</span>
            </div>
          )}
          {project.end_date && (
            <div className="flex items-center gap-2">
              <Calendar className="w-4 h-4 text-slate-400" />
              <span>Target: {format(new Date(project.enddate), 'MMM d, yyyy')}</span>
            </div>
          )}
        </div>

        <div className="flex flex-col sm:flex-row gap-3">
          <Link to={`${createPageUrl('WaqfDetail')}?id=${project.id}`} className="flex-1">
            <Button
              className="w-full bg-blue-600 text-white hover:bg-blue-700 flex items-center justify-center gap-2 transition-all duration-200 shadow-md"
            >
              <span>View Details</span>
              <ArrowRight className="w-4 h-4 transform transition-transform group-hover:translate-x-1" />
            </Button>
          </Link>
          { !isView && (
            <Button
              onClick={() => onEditProject(project)}
              className="w-full bg-emerald-500 text-white hover:bg-emerald-600 flex items-center justify-center gap-2 transition-all duration-200 shadow-md"
            >
              <span>Edit Project</span>
              <Edit className="w-4 h-4 transform transition-transform group-hover:translate-x-1" />
            </Button>
          ) } 
        </div>

      </CardContent>
    </Card>
  );
}

function cn(...classes) {
  return classes.filter(Boolean).join(' ');
}