import { useGetCommunityPosts } from '../hooks/useQueries';
import { Skeleton } from '@/components/ui/skeleton';
import { MessageCircle, AlertTriangle } from 'lucide-react';
import { formatDistanceToNow } from 'date-fns';

export default function CommunityFeed() {
  const { data: posts, isLoading, error } = useGetCommunityPosts();

  if (isLoading) {
    return (
      <div className="space-y-3">
        {Array.from({ length: 4 }).map((_, i) => (
          <div key={i} className="sonic-card p-4 space-y-2">
            <Skeleton className="h-3 w-1/4 rounded-full" />
            <Skeleton className="h-4 w-full rounded-full" />
            <Skeleton className="h-4 w-3/4 rounded-full" />
          </div>
        ))}
      </div>
    );
  }

  if (error) {
    return (
      <div className="sonic-card p-6 text-center text-destructive">
        <AlertTriangle size={24} className="mx-auto mb-2" />
        <p className="font-nunito">Failed to load posts.</p>
      </div>
    );
  }

  if (!posts || posts.length === 0) {
    return (
      <div className="sonic-card p-8 text-center">
        <MessageCircle size={40} className="mx-auto mb-3 text-muted-foreground" />
        <h3 className="font-fredoka text-xl text-foreground mb-1">No posts yet!</h3>
        <p className="text-muted-foreground font-nunito text-sm">Be the first to share something with the community.</p>
      </div>
    );
  }

  return (
    <div className="space-y-3">
      {posts.map((post, i) => {
        const timestamp = Number(post.timestamp) / 1_000_000;
        const date = new Date(timestamp);
        const authorShort = post.author.toString().slice(0, 8) + '...';

        return (
          <div key={i} className="sonic-card p-4 hover:shadow-md transition-shadow">
            <div className="flex items-center justify-between mb-2">
              <span className="text-xs font-nunito font-700 text-primary bg-primary/10 px-2 py-0.5 rounded-full">
                {authorShort}
              </span>
              <span className="text-xs text-muted-foreground font-nunito">
                {formatDistanceToNow(date, { addSuffix: true })}
              </span>
            </div>
            <p className="font-nunito text-foreground text-sm leading-relaxed">{post.message}</p>
          </div>
        );
      })}
    </div>
  );
}
