import { Card, CardContent, CardHeader } from "@/components/ui/card";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { Calendar, Building2 } from 'lucide-react';
import moment from 'moment';

export default function ActivityPostsCard({ post, poster, showPoster = false }) {
  return (
    <Card className="overflow-hidden bg-white border-0 shadow-md hover:shadow-lg transition-shadow duration-300">
      <CardHeader className="pb-3">
        <div className="flex items-start gap-3">
          <Avatar className="h-10 w-10 bg-gradient-to-br from-emerald-400 to-teal-500">
            <AvatarFallback className="bg-transparent text-white font-semibold">
              {(poster || 'T')[0].toUpperCase()}
            </AvatarFallback>
          </Avatar>
          <div className="flex-1 min-w-0">
            {showPoster && poster && (
              <div className="flex items-center gap-1.5 text-sm text-emerald-700 font-medium mb-0.5">
                <Building2 className="w-3.5 h-3.5" />
                {poster}
              </div>
            )}
            <h3 className="font-semibold text-slate-800 line-clamp-1">{post.title}</h3>
            <div className="flex items-center gap-1.5 text-xs text-slate-500 mt-1">
              <Calendar className="w-3 h-3" />
              {moment(post.createdat).fromNow()}
            </div>
          </div>
        </div>
      </CardHeader>
      
      <CardContent className="pt-0 space-y-3">
        {post.photourl && (
          <div className="rounded-xl overflow-hidden -mx-2">
            <img 
              src={`/api/file/activity-post/${encodeURIComponent(post.photourl)}`} 
              alt={post.title}
              className="w-full h-48 object-cover"
            />
          </div>
        )}
        
        <div 
          className="prose prose-sm prose-slate max-w-none text-slate-600 line-clamp-4"
          dangerouslySetInnerHTML={{ __html: post.content || '' }}
        />
      </CardContent>
    </Card>
  );
}