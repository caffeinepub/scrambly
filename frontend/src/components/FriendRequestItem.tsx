import { Check, X, Loader2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Skeleton } from '@/components/ui/skeleton';
import { useQuery } from '@tanstack/react-query';
import { useActor } from '../hooks/useActor';
import { useRespondToFriendRequest } from '../hooks/useQueries';
import { toast } from 'sonner';
import type { FriendRequest } from '../backend';
import type { Principal } from '@dfinity/principal';

interface FriendRequestItemProps {
  request: FriendRequest;
}

export default function FriendRequestItem({ request }: FriendRequestItemProps) {
  const { actor } = useActor();
  const respond = useRespondToFriendRequest();

  const requesterPrincipal = request.requesterId as Principal;

  const { data: profile, isLoading } = useQuery({
    queryKey: ['userProfile', requesterPrincipal.toString()],
    queryFn: async () => {
      if (!actor) throw new Error('Actor not available');
      return actor.getUserProfile(requesterPrincipal);
    },
    enabled: !!actor,
    staleTime: 5 * 60 * 1000,
    retry: false,
  });

  const handleAccept = async () => {
    try {
      await respond.mutateAsync({ requesterId: requesterPrincipal, accept: true });
      toast.success('Friend request accepted! 🎉');
    } catch {
      toast.error('Failed to accept request. Please try again.');
    }
  };

  const handleDecline = async () => {
    try {
      await respond.mutateAsync({ requesterId: requesterPrincipal, accept: false });
      toast.success('Friend request declined.');
    } catch {
      toast.error('Failed to decline request. Please try again.');
    }
  };

  if (isLoading) {
    return (
      <div className="flex items-center gap-3 p-3 rounded-xl">
        <Skeleton className="w-10 h-10 rounded-full" />
        <Skeleton className="h-4 w-28 rounded flex-1" />
        <Skeleton className="h-8 w-16 rounded-full" />
        <Skeleton className="h-8 w-16 rounded-full" />
      </div>
    );
  }

  const displayName = profile?.name || requesterPrincipal.toString().slice(0, 12) + '...';
  const initials = displayName.slice(0, 2).toUpperCase();
  const isPending = respond.isPending;

  return (
    <div className="flex items-center gap-3 p-3 rounded-xl bg-secondary/10 border border-secondary/20">
      <div className="w-10 h-10 rounded-full bg-secondary/20 flex items-center justify-center shrink-0">
        <span className="font-fredoka text-secondary-foreground text-sm font-bold">{initials}</span>
      </div>
      <div className="flex-1 min-w-0">
        <p className="font-nunito font-semibold text-foreground text-sm truncate">{displayName}</p>
        <p className="font-nunito text-xs text-muted-foreground">Wants to be your friend</p>
      </div>
      <div className="flex gap-1.5 shrink-0">
        <Button
          size="sm"
          onClick={handleAccept}
          disabled={isPending}
          className="rounded-full h-8 w-8 p-0 bg-green-500 hover:bg-green-600 text-white"
        >
          {isPending ? <Loader2 size={12} className="animate-spin" /> : <Check size={14} />}
        </Button>
        <Button
          size="sm"
          variant="outline"
          onClick={handleDecline}
          disabled={isPending}
          className="rounded-full h-8 w-8 p-0 border-destructive/40 text-destructive hover:bg-destructive/10"
        >
          <X size={14} />
        </Button>
      </div>
    </div>
  );
}
