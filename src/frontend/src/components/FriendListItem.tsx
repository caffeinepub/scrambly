import { Skeleton } from "@/components/ui/skeleton";
import type { Principal } from "@dfinity/principal";
import { useQuery } from "@tanstack/react-query";
import { Users } from "lucide-react";
import { useActor } from "../hooks/useActor";

interface FriendListItemProps {
  friendPrincipal: Principal;
}

export default function FriendListItem({
  friendPrincipal,
}: FriendListItemProps) {
  const { actor } = useActor();

  const { data: profile, isLoading } = useQuery({
    queryKey: ["userProfile", friendPrincipal.toString()],
    queryFn: async () => {
      if (!actor) throw new Error("Actor not available");
      return actor.getUserProfile(friendPrincipal);
    },
    enabled: !!actor,
    staleTime: 5 * 60 * 1000,
    retry: false,
  });

  if (isLoading) {
    return (
      <div className="flex items-center gap-3 p-3 rounded-xl">
        <Skeleton className="w-10 h-10 rounded-full" />
        <Skeleton className="h-4 w-32 rounded" />
      </div>
    );
  }

  const displayName =
    profile?.name || `${friendPrincipal.toString().slice(0, 12)}...`;
  const initials = displayName.slice(0, 2).toUpperCase();

  return (
    <div className="flex items-center gap-3 p-3 rounded-xl hover:bg-primary/5 transition-colors">
      <div className="w-10 h-10 rounded-full bg-primary/15 flex items-center justify-center shrink-0">
        <span className="font-fredoka text-primary text-sm font-bold">
          {initials}
        </span>
      </div>
      <div className="flex-1 min-w-0">
        <p className="font-nunito font-semibold text-foreground text-sm truncate">
          {displayName}
        </p>
        <p className="font-nunito text-xs text-muted-foreground">Friend</p>
      </div>
      <div
        className="w-2 h-2 rounded-full bg-green-400 shrink-0"
        title="Online"
      />
    </div>
  );
}
