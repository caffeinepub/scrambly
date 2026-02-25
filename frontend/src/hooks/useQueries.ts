import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { useActor } from './useActor';
import type { Profile, SonicKnowledgeEntry, PostContent } from '../backend';
import { Principal } from '@dfinity/principal';

// ─── Profile ────────────────────────────────────────────────────────────────

export function useGetCallerUserProfile() {
  const { actor, isFetching: actorFetching } = useActor();

  const query = useQuery<Profile | null>({
    queryKey: ['currentUserProfile'],
    queryFn: async () => {
      if (!actor) throw new Error('Actor not available');
      return actor.getCallerUserProfile();
    },
    enabled: !!actor && !actorFetching,
    retry: false,
  });

  return {
    ...query,
    isLoading: actorFetching || query.isLoading,
    isFetched: !!actor && query.isFetched,
  };
}

export function useSaveCallerUserProfile() {
  const { actor } = useActor();
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (profile: Profile) => {
      if (!actor) throw new Error('Actor not available');
      return actor.saveCallerUserProfile(profile);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['currentUserProfile'] });
    },
  });
}

export function useVerifyAge() {
  const { actor } = useActor();
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({ name, birthYear }: { name: string; birthYear: bigint }) => {
      if (!actor) throw new Error('Actor not available');
      return actor.verifyAge(name, birthYear);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['currentUserProfile'] });
    },
  });
}

export function useGetCallerUserRole() {
  const { actor, isFetching: actorFetching } = useActor();

  return useQuery({
    queryKey: ['callerUserRole'],
    queryFn: async () => {
      if (!actor) throw new Error('Actor not available');
      return actor.getCallerUserRole();
    },
    enabled: !!actor && !actorFetching,
    retry: false,
  });
}

export function useIsCallerAdmin() {
  const { actor, isFetching: actorFetching } = useActor();

  return useQuery({
    queryKey: ['isCallerAdmin'],
    queryFn: async () => {
      if (!actor) throw new Error('Actor not available');
      return actor.isCallerAdmin();
    },
    enabled: !!actor && !actorFetching,
    retry: false,
  });
}

// ─── Community Posts ─────────────────────────────────────────────────────────

export function useGetCommunityPosts() {
  const { actor, isFetching: actorFetching } = useActor();

  return useQuery<PostContent[]>({
    queryKey: ['communityPosts'],
    queryFn: async () => {
      if (!actor) return [];
      return actor.getCommunityPosts();
    },
    enabled: !!actor && !actorFetching,
    refetchInterval: 15000,
  });
}

export function useCreateCommunityPost() {
  const { actor } = useActor();
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (message: string) => {
      if (!actor) throw new Error('Actor not available');
      return actor.createCommunityPost(message);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['communityPosts'] });
    },
  });
}

// ─── Moderation ──────────────────────────────────────────────────────────────

export function useIssueWarning() {
  const { actor } = useActor();
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({ target, reason }: { target: Principal; reason: string }) => {
      if (!actor) throw new Error('Actor not available');
      return actor.issueWarning(target, reason);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['communityPosts'] });
    },
  });
}

export function useGetUsersByAge(fromYear: bigint, toYear: bigint, enabled: boolean) {
  const { actor, isFetching: actorFetching } = useActor();

  return useQuery<Profile[]>({
    queryKey: ['usersByAge', fromYear.toString(), toYear.toString()],
    queryFn: async () => {
      if (!actor) return [];
      return actor.getUsersByAge(fromYear, toYear);
    },
    enabled: !!actor && !actorFetching && enabled,
  });
}

// ─── Sonic Search ────────────────────────────────────────────────────────────

export function useSearchSonicContent(searchText: string) {
  const { actor, isFetching: actorFetching } = useActor();

  return useQuery<SonicKnowledgeEntry[]>({
    queryKey: ['sonicSearch', searchText],
    queryFn: async () => {
      if (!actor) return [];
      if (!searchText.trim()) return [];
      return actor.searchSonicContent(searchText);
    },
    enabled: !!actor && !actorFetching && searchText.trim().length > 0,
    staleTime: 5 * 60 * 1000,
  });
}

export function useGetAllEntriesByType(contentType: string) {
  const { actor, isFetching: actorFetching } = useActor();

  return useQuery<SonicKnowledgeEntry[]>({
    queryKey: ['sonicEntries', contentType],
    queryFn: async () => {
      if (!actor) return [];
      return actor.getAllEntriesByType(contentType);
    },
    enabled: !!actor && !actorFetching,
    staleTime: 10 * 60 * 1000,
  });
}

// ─── Usage Time ──────────────────────────────────────────────────────────────

export function useSetRemainingUsageTime() {
  const { actor } = useActor();
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({ user, timeRemaining }: { user: Principal; timeRemaining: bigint }) => {
      if (!actor) throw new Error('Actor not available');
      return actor.setRemainingUsageTime(user, timeRemaining);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['currentUserProfile'] });
    },
  });
}
