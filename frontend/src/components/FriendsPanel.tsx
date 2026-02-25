import { X, Users, UserPlus, MessageCircle } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Badge } from '@/components/ui/badge';
import { Skeleton } from '@/components/ui/skeleton';
import { useGetFriends, useGetFriendRequests } from '../hooks/useQueries';
import FriendListItem from './FriendListItem';
import FriendRequestItem from './FriendRequestItem';
import type { Principal } from '@dfinity/principal';

const FRIEND_LIMIT = 1000;

interface FriendsPanelProps {
  isOpen: boolean;
  onClose: () => void;
}

export default function FriendsPanel({ isOpen, onClose }: FriendsPanelProps) {
  const { data: friends = [], isLoading: friendsLoading } = useGetFriends();
  const { data: friendRequests = [], isLoading: requestsLoading } = useGetFriendRequests();

  const pendingRequests = friendRequests.filter((r) => r.status === 'pending');
  const friendCount = friends.length;
  const atLimit = friendCount >= FRIEND_LIMIT;

  if (!isOpen) return null;

  return (
    <>
      {/* Backdrop */}
      <div
        className="fixed inset-0 bg-black/40 z-40 backdrop-blur-sm"
        onClick={onClose}
        aria-hidden="true"
      />

      {/* Panel — slides up from bottom on mobile, centered on desktop */}
      <div
        className="fixed bottom-0 left-0 right-0 z-50 bg-background rounded-t-3xl shadow-2xl border-t border-border
                   md:bottom-auto md:top-1/2 md:left-1/2 md:-translate-x-1/2 md:-translate-y-1/2
                   md:w-full md:max-w-md md:rounded-2xl md:border md:shadow-2xl"
        style={{ maxHeight: '85vh' }}
      >
        {/* Handle bar (mobile) */}
        <div className="flex justify-center pt-3 pb-1 md:hidden">
          <div className="w-10 h-1 rounded-full bg-muted-foreground/30" />
        </div>

        {/* Header */}
        <div className="flex items-center justify-between px-5 py-4 border-b border-border">
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 rounded-full bg-primary/15 flex items-center justify-center">
              <Users size={16} className="text-primary" />
            </div>
            <h2 className="font-fredoka text-xl text-foreground">Friends</h2>
            {!friendsLoading && (
              <Badge variant="secondary" className="font-nunito text-xs">
                {friendCount}/{FRIEND_LIMIT}
              </Badge>
            )}
          </div>
          <Button
            variant="ghost"
            size="icon"
            onClick={onClose}
            className="rounded-full h-8 w-8 text-muted-foreground hover:text-foreground"
          >
            <X size={16} />
          </Button>
        </div>

        {/* Friend limit warning */}
        {atLimit && (
          <div className="mx-4 mt-3 bg-yellow-500/10 border border-yellow-500/30 rounded-xl px-4 py-2.5">
            <p className="font-nunito text-sm text-yellow-700 dark:text-yellow-400 font-semibold text-center">
              ⚠️ Friend limit reached (1000/1000)
            </p>
          </div>
        )}

        <ScrollArea className="flex-1 overflow-y-auto" style={{ maxHeight: 'calc(85vh - 80px)' }}>
          <div className="px-4 pb-6 space-y-4 pt-3">

            {/* Pending Friend Requests Section */}
            {(requestsLoading || pendingRequests.length > 0) && (
              <div className="space-y-2">
                <div className="flex items-center gap-2">
                  <UserPlus size={14} className="text-primary" />
                  <h3 className="font-fredoka text-base text-foreground">Friend Requests</h3>
                  {!requestsLoading && pendingRequests.length > 0 && (
                    <Badge className="font-nunito text-xs h-5 px-1.5 bg-primary text-primary-foreground">
                      {pendingRequests.length}
                    </Badge>
                  )}
                </div>

                {requestsLoading ? (
                  <div className="space-y-2">
                    {[1, 2].map((i) => (
                      <div key={i} className="flex items-center gap-3 p-3 rounded-xl">
                        <Skeleton className="w-10 h-10 rounded-full" />
                        <Skeleton className="h-4 w-28 rounded flex-1" />
                        <Skeleton className="h-8 w-16 rounded-full" />
                      </div>
                    ))}
                  </div>
                ) : (
                  <div className="space-y-2">
                    {pendingRequests.map((req, idx) => (
                      <FriendRequestItem key={`${req.requesterId.toString()}-${idx}`} request={req} />
                    ))}
                  </div>
                )}

                <div className="border-b border-border/50 pt-1" />
              </div>
            )}

            {/* Friends List Section */}
            <div className="space-y-2">
              <div className="flex items-center gap-2">
                <Users size={14} className="text-primary" />
                <h3 className="font-fredoka text-base text-foreground">My Friends</h3>
              </div>

              {friendsLoading ? (
                <div className="space-y-2">
                  {[1, 2, 3].map((i) => (
                    <div key={i} className="flex items-center gap-3 p-3 rounded-xl">
                      <Skeleton className="w-10 h-10 rounded-full" />
                      <div className="flex-1 space-y-1.5">
                        <Skeleton className="h-4 w-32 rounded" />
                        <Skeleton className="h-3 w-16 rounded" />
                      </div>
                    </div>
                  ))}
                </div>
              ) : friendCount === 0 ? (
                /* Empty state */
                <div className="flex flex-col items-center justify-center py-10 text-center space-y-3">
                  <div className="w-16 h-16 rounded-full bg-primary/10 flex items-center justify-center">
                    <Users size={28} className="text-primary/50" />
                  </div>
                  <div>
                    <p className="font-fredoka text-lg text-foreground">No Friends Yet</p>
                    <p className="font-nunito text-sm text-muted-foreground mt-1">
                      You haven't added any friends yet. Start connecting with other Scrambly fans!
                    </p>
                  </div>
                  <div className="bg-primary/5 border border-primary/15 rounded-xl px-4 py-3 max-w-xs">
                    <p className="font-nunito text-xs text-muted-foreground">
                      💙 Friends Mode lets you connect with Scrambly fans your age safely.
                    </p>
                  </div>
                </div>
              ) : (
                <div className="space-y-1">
                  {(friends as Principal[]).slice(0, FRIEND_LIMIT).map((friendPrincipal, idx) => (
                    <FriendListItem
                      key={`${friendPrincipal.toString()}-${idx}`}
                      friendPrincipal={friendPrincipal}
                    />
                  ))}
                </div>
              )}
            </div>
          </div>
        </ScrollArea>
      </div>
    </>
  );
}
