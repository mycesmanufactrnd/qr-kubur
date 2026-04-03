import { Card, CardContent } from "@/components/ui/card";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { Building2 } from 'lucide-react';
import moment from 'moment';
import { resolveFileUrl } from '@/utils';

export default function ActivityPostsCard({ post, poster, showPoster = false }) {
  return (
    <Card className="overflow-hidden bg-white border border-slate-100 shadow-sm hover:shadow-md hover:-translate-y-0.5 transition-all duration-200 rounded-2xl">
      {post.photourl && (
        <div className="overflow-hidden">
          <img
            src={resolveFileUrl(post.photourl, 'activity-post')}
            alt={post.title}
            className="w-full h-40 object-cover hover:scale-105 transition-transform duration-500"
          />
        </div>
      )}

      <CardContent className="p-4 space-y-2.5">
        {showPoster && poster && (
          <div className="flex items-center gap-2">
            <Avatar className="h-6 w-6 bg-gradient-to-br from-emerald-400 to-teal-500 shrink-0">
              <AvatarFallback className="bg-transparent text-white text-xs font-semibold">
                {poster[0].toUpperCase()}
              </AvatarFallback>
            </Avatar>
            <span className="text-xs font-semibold text-emerald-700 flex items-center gap-1 truncate">
              <Building2 className="w-3 h-3 shrink-0" />
              {poster}
            </span>
          </div>
        )}

        <h3 className="font-semibold text-slate-800 text-sm leading-snug line-clamp-2">
          {post.title}
        </h3>

        <div
          className="prose prose-xs prose-slate max-w-none text-slate-500 text-xs leading-relaxed line-clamp-3"
          dangerouslySetInnerHTML={{ __html: post.content || '' }}
        />

        <p className="text-[11px] text-slate-400 pt-0.5">
          {moment(post.createdat).fromNow()}
        </p>
      </CardContent>
    </Card>
  );
}
