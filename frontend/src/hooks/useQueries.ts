import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { useActor } from './useActor';
import type { Profile, SonicKnowledgeEntry, PostContent, FriendsModeRequest, Video, Idea, FriendRequest } from '../backend';
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

// ─── Ban Appeal ──────────────────────────────────────────────────────────────

export function useSubmitBanAppeal() {
  const { actor } = useActor();

  return useMutation({
    mutationFn: async (reason: string) => {
      if (!actor) throw new Error('Actor not available');
      return actor.submitBanAppeal(reason);
    },
  });
}

// ─── Friends Mode ─────────────────────────────────────────────────────────────

export function useGetFriendsModeStatus() {
  const { actor, isFetching: actorFetching } = useActor();

  return useQuery<string | null>({
    queryKey: ['friendsModeStatus'],
    queryFn: async () => {
      if (!actor) throw new Error('Actor not available');
      return actor.getFriendsModeStatus();
    },
    enabled: !!actor && !actorFetching,
    refetchInterval: 30000,
    retry: false,
  });
}

export function useSubmitFriendsModeRequest() {
  const { actor } = useActor();
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (birthdate: string) => {
      if (!actor) throw new Error('Actor not available');
      return actor.submitFriendsModeRequest(birthdate);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['friendsModeStatus'] });
    },
  });
}

export function useGetAllFriendsModeRequests() {
  const { actor, isFetching: actorFetching } = useActor();

  return useQuery<FriendsModeRequest[]>({
    queryKey: ['allFriendsModeRequests'],
    queryFn: async () => {
      if (!actor) throw new Error('Actor not available');
      return actor.getAllFriendsModeRequests();
    },
    enabled: !!actor && !actorFetching,
    retry: false,
  });
}

export function useReviewFriendsModeRequest() {
  const { actor } = useActor();
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({ principal, status }: { principal: string; status: string }) => {
      if (!actor) throw new Error('Actor not available');
      return actor.reviewFriendsModeRequest(principal, status);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['allFriendsModeRequests'] });
    },
  });
}

// ─── Password ─────────────────────────────────────────────────────────────────

export function useSetPassword() {
  const { actor } = useActor();
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (password: string) => {
      if (!actor) throw new Error('Actor not available');
      return actor.setPassword(password);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['currentUserProfile'] });
    },
  });
}

export function useVerifyPassword() {
  const { actor } = useActor();

  return useMutation({
    mutationFn: async (password: string) => {
      if (!actor) throw new Error('Actor not available');
      return actor.verifyPassword(password);
    },
  });
}

// ─── Videos ───────────────────────────────────────────────────────────────────

export function useGetMyVideos() {
  const { actor, isFetching: actorFetching } = useActor();

  return useQuery<Video[]>({
    queryKey: ['myVideos'],
    queryFn: async () => {
      if (!actor) return [];
      return actor.getMyVideos();
    },
    enabled: !!actor && !actorFetching,
  });
}

export function useUploadVideo() {
  const { actor } = useActor();
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({ title, blob }: { title: string; blob: import('../backend').ExternalBlob }) => {
      if (!actor) throw new Error('Actor not available');
      return actor.uploadVideo(title, blob);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['myVideos'] });
    },
  });
}

// ─── Ideas ────────────────────────────────────────────────────────────────────

export function useSubmitIdea() {
  const { actor } = useActor();

  return useMutation({
    mutationFn: async (content: string) => {
      if (!actor) throw new Error('Actor not available');
      return actor.submitIdea(content);
    },
  });
}

export function useGetAllIdeas() {
  const { actor, isFetching: actorFetching } = useActor();

  return useQuery<Idea[]>({
    queryKey: ['allIdeas'],
    queryFn: async () => {
      if (!actor) throw new Error('Actor not available');
      return actor.getAllIdeas();
    },
    enabled: !!actor && !actorFetching,
    retry: false,
  });
}

export function useMarkIdeaReviewed() {
  const { actor } = useActor();
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (index: bigint) => {
      if (!actor) throw new Error('Actor not available');
      return actor.markIdeaReviewed(index);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['allIdeas'] });
    },
  });
}

// ─── Friends ──────────────────────────────────────────────────────────────────

export function useGetFriends() {
  const { actor, isFetching: actorFetching } = useActor();

  return useQuery<Principal[]>({
    queryKey: ['friends'],
    queryFn: async () => {
      if (!actor) return [];
      return actor.getFriends();
    },
    enabled: !!actor && !actorFetching,
    refetchInterval: 30000,
  });
}

export function useGetFriendRequests() {
  const { actor, isFetching: actorFetching } = useActor();

  return useQuery<FriendRequest[]>({
    queryKey: ['friendRequests'],
    queryFn: async () => {
      if (!actor) return [];
      return actor.getFriendRequests();
    },
    enabled: !!actor && !actorFetching,
    refetchInterval: 30000,
  });
}

export function useRespondToFriendRequest() {
  const { actor } = useActor();
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({ requesterId, accept }: { requesterId: Principal; accept: boolean }) => {
      if (!actor) throw new Error('Actor not available');
      return actor.respondToFriendRequest(requesterId, accept);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['friendRequests'] });
      queryClient.invalidateQueries({ queryKey: ['friends'] });
    },
  });
}
