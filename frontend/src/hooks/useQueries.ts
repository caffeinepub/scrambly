import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { useActor } from './useActor';
import { Post, Profile, AgeCheckResult, AppealStatus, ModeratorApplicationResult, PostRole } from '../backend';
import { Principal } from '@dfinity/principal';

// ---- Profile / Auth ----

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

export function useVerifyAge() {
  const { actor } = useActor();
  const queryClient = useQueryClient();

  return useMutation<AgeCheckResult, Error, { name: string; birthYear: bigint }>({
    mutationFn: async ({ name, birthYear }) => {
      if (!actor) throw new Error('Actor not available');
      return actor.verifyAge(name, birthYear);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['currentUserProfile'] });
    },
  });
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

export function useIsCallerAdmin() {
  const { actor, isFetching } = useActor();

  return useQuery<boolean>({
    queryKey: ['isCallerAdmin'],
    queryFn: async () => {
      if (!actor) return false;
      return actor.isCallerAdmin();
    },
    enabled: !!actor && !isFetching,
  });
}

export function useIsCallerBanned() {
  const { actor, isFetching } = useActor();

  return useQuery<boolean>({
    queryKey: ['isCallerBanned'],
    queryFn: async () => {
      if (!actor) return false;
      return actor.isCallerBanned();
    },
    enabled: !!actor && !isFetching,
  });
}

// ---- Posts (new model) ----

export function useGetAllPosts() {
  const { actor, isFetching } = useActor();

  return useQuery<Post[]>({
    queryKey: ['allPosts'],
    queryFn: async () => {
      if (!actor) return [];
      return actor.getAllPosts();
    },
    enabled: !!actor && !isFetching,
  });
}

export function useGetReplies(parentId: bigint | null) {
  const { actor, isFetching } = useActor();

  return useQuery<Post[]>({
    queryKey: ['replies', parentId?.toString()],
    queryFn: async () => {
      if (!actor || parentId === null) return [];
      return actor.getReplies(parentId);
    },
    enabled: !!actor && !isFetching && parentId !== null,
  });
}

export function useCreatePost() {
  const { actor } = useActor();
  const queryClient = useQueryClient();

  return useMutation<bigint, Error, { text: string; image: Uint8Array | null }>({
    mutationFn: async ({ text, image }) => {
      if (!actor) throw new Error('Actor not available');
      return actor.createPost(text, image);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['allPosts'] });
    },
  });
}

export function useEditPost() {
  const { actor } = useActor();
  const queryClient = useQueryClient();

  return useMutation<void, Error, { postId: bigint; newText: string; newImage: Uint8Array | null }>({
    mutationFn: async ({ postId, newText, newImage }) => {
      if (!actor) throw new Error('Actor not available');
      return actor.editPost(postId, newText, newImage);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['allPosts'] });
      queryClient.invalidateQueries({ queryKey: ['replies'] });
    },
  });
}

export function useDeletePost() {
  const { actor } = useActor();
  const queryClient = useQueryClient();

  return useMutation<void, Error, bigint>({
    mutationFn: async (postId) => {
      if (!actor) throw new Error('Actor not available');
      return actor.deletePost(postId);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['allPosts'] });
      queryClient.invalidateQueries({ queryKey: ['replies'] });
    },
  });
}

export function useReplyToPost() {
  const { actor } = useActor();
  const queryClient = useQueryClient();

  return useMutation<bigint, Error, { parentId: bigint; text: string; image: Uint8Array | null }>({
    mutationFn: async ({ parentId, text, image }) => {
      if (!actor) throw new Error('Actor not available');
      return actor.replyToPost(parentId, text, image);
    },
    onSuccess: (_data, variables) => {
      queryClient.invalidateQueries({ queryKey: ['replies', variables.parentId.toString()] });
      queryClient.invalidateQueries({ queryKey: ['allPosts'] });
    },
  });
}

// ---- Legacy community posts (used by ModerationDashboard) ----

export function useGetCommunityPosts() {
  const { actor, isFetching } = useActor();

  return useQuery({
    queryKey: ['communityPosts'],
    queryFn: async () => {
      if (!actor) return [];
      return actor.getCommunityPosts();
    },
    enabled: !!actor && !isFetching,
  });
}

// ---- Sonic Content Search ----

export function useSearchSonicContent(searchText: string) {
  const { actor, isFetching } = useActor();

  return useQuery({
    queryKey: ['sonicContent', searchText],
    queryFn: async () => {
      if (!actor || !searchText.trim()) return [];
      return actor.searchSonicContent(searchText);
    },
    enabled: !!actor && !isFetching && !!searchText.trim(),
  });
}

// ---- Admin ----

export function useGetAllUsers() {
  const { actor, isFetching } = useActor();

  return useQuery<[string, Principal][]>({
    queryKey: ['allUsers'],
    queryFn: async () => {
      if (!actor) return [];
      return actor.getAllUsers();
    },
    enabled: !!actor && !isFetching,
  });
}

export function useAdminBanUser() {
  const { actor } = useActor();
  const queryClient = useQueryClient();

  return useMutation<void, Error, Principal>({
    mutationFn: async (target) => {
      if (!actor) throw new Error('Actor not available');
      return actor.adminBanUser(target);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['banList'] });
      queryClient.invalidateQueries({ queryKey: ['allUsers'] });
    },
  });
}

export function useAdminWarnUser() {
  const { actor } = useActor();
  const queryClient = useQueryClient();

  return useMutation<void, Error, Principal>({
    mutationFn: async (target) => {
      if (!actor) throw new Error('Actor not available');
      return actor.adminWarnUser(target);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['warnList'] });
      queryClient.invalidateQueries({ queryKey: ['allUsers'] });
    },
  });
}

export function useAdminUnbanUser() {
  const { actor } = useActor();
  const queryClient = useQueryClient();

  return useMutation<void, Error, Principal>({
    mutationFn: async (target) => {
      if (!actor) throw new Error('Actor not available');
      return actor.adminUnbanUser(target);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['banList'] });
      queryClient.invalidateQueries({ queryKey: ['allUsers'] });
    },
  });
}

export function useGetBanList() {
  const { actor, isFetching } = useActor();

  return useQuery<Principal[]>({
    queryKey: ['banList'],
    queryFn: async () => {
      if (!actor) return [];
      return actor.getBanList();
    },
    enabled: !!actor && !isFetching,
  });
}

export function useGetWarnList() {
  const { actor, isFetching } = useActor();

  return useQuery<Principal[]>({
    queryKey: ['warnList'],
    queryFn: async () => {
      if (!actor) return [];
      return actor.getWarnList();
    },
    enabled: !!actor && !isFetching,
  });
}

export function useIssueWarning() {
  const { actor } = useActor();
  const queryClient = useQueryClient();

  return useMutation<bigint, Error, { target: Principal; reason: string }>({
    mutationFn: async ({ target, reason }) => {
      if (!actor) throw new Error('Actor not available');
      return actor.issueWarning(target, reason);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['currentUserProfile'] });
    },
  });
}

export function usePromoteUserToModerator() {
  const { actor } = useActor();
  const queryClient = useQueryClient();

  return useMutation<void, Error, Principal>({
    mutationFn: async (target) => {
      if (!actor) throw new Error('Actor not available');
      return actor.promoteUserToModerator(target);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['allUsers'] });
    },
  });
}

export function useIsUserModerator(user: Principal | null) {
  const { actor, isFetching } = useActor();

  return useQuery<boolean>({
    queryKey: ['isUserModerator', user?.toString()],
    queryFn: async () => {
      if (!actor || !user) return false;
      return actor.isUserModerator(user);
    },
    enabled: !!actor && !isFetching && !!user,
  });
}

// ---- Friends ----

export function useGetFriends() {
  const { actor, isFetching } = useActor();

  return useQuery<Principal[]>({
    queryKey: ['friends'],
    queryFn: async () => {
      if (!actor) return [];
      return actor.getFriends();
    },
    enabled: !!actor && !isFetching,
  });
}

export function useGetFriendRequests() {
  const { actor, isFetching } = useActor();

  return useQuery({
    queryKey: ['friendRequests'],
    queryFn: async () => {
      if (!actor) return [];
      return actor.getFriendRequests();
    },
    enabled: !!actor && !isFetching,
  });
}

export function useSendFriendRequest() {
  const { actor } = useActor();
  const queryClient = useQueryClient();

  return useMutation<string, Error, Principal>({
    mutationFn: async (recipientPrincipal) => {
      if (!actor) throw new Error('Actor not available');
      return actor.sendFriendRequest(recipientPrincipal);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['friendRequests'] });
    },
  });
}

export function useRespondToFriendRequest() {
  const { actor } = useActor();
  const queryClient = useQueryClient();

  return useMutation<string, Error, { requesterId: Principal; accept: boolean }>({
    mutationFn: async ({ requesterId, accept }) => {
      if (!actor) throw new Error('Actor not available');
      return actor.respondToFriendRequest(requesterId, accept);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['friendRequests'] });
      queryClient.invalidateQueries({ queryKey: ['friends'] });
    },
  });
}

export function useGetUserProfile(user: Principal | null) {
  const { actor, isFetching } = useActor();

  return useQuery<Profile>({
    queryKey: ['userProfile', user?.toString()],
    queryFn: async () => {
      if (!actor || !user) throw new Error('Actor or user not available');
      return actor.getUserProfile(user);
    },
    enabled: !!actor && !isFetching && !!user,
  });
}

export function useGetUsersByAge(fromYear: bigint, toYear: bigint) {
  const { actor, isFetching } = useActor();

  return useQuery<Profile[]>({
    queryKey: ['usersByAge', fromYear.toString(), toYear.toString()],
    queryFn: async () => {
      if (!actor) return [];
      return actor.getUsersByAge(fromYear, toYear);
    },
    enabled: !!actor && !isFetching,
  });
}

// ---- Moderation / Ideas ----

export function useGetAllIdeas() {
  const { actor, isFetching } = useActor();

  return useQuery({
    queryKey: ['allIdeas'],
    queryFn: async () => {
      if (!actor) return [];
      return actor.getAllIdeas();
    },
    enabled: !!actor && !isFetching,
  });
}

export function useMarkIdeaReviewed() {
  const { actor } = useActor();
  const queryClient = useQueryClient();

  return useMutation<void, Error, bigint>({
    mutationFn: async (index) => {
      if (!actor) throw new Error('Actor not available');
      return actor.markIdeaReviewed(index);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['allIdeas'] });
    },
  });
}

export function useGetAllFriendsModeRequests() {
  const { actor, isFetching } = useActor();

  return useQuery({
    queryKey: ['friendsModeRequests'],
    queryFn: async () => {
      if (!actor) return [];
      return actor.getAllFriendsModeRequests();
    },
    enabled: !!actor && !isFetching,
  });
}

export function useReviewFriendsModeRequest() {
  const { actor } = useActor();
  const queryClient = useQueryClient();

  return useMutation<boolean, Error, { principal: string; status: string }>({
    mutationFn: async ({ principal, status }) => {
      if (!actor) throw new Error('Actor not available');
      return actor.reviewFriendsModeRequest(principal, status);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['friendsModeRequests'] });
    },
  });
}

export function useSubmitBanAppeal() {
  const { actor } = useActor();

  return useMutation<AppealStatus, Error, string>({
    mutationFn: async (reason) => {
      if (!actor) throw new Error('Actor not available');
      return actor.submitBanAppeal(reason);
    },
  });
}

export function useApplyForModerator() {
  const { actor } = useActor();

  return useMutation<ModeratorApplicationResult, Error, string>({
    mutationFn: async (answers) => {
      if (!actor) throw new Error('Actor not available');
      return actor.applyForModerator(answers);
    },
  });
}

export function useSubmitIdea() {
  const { actor } = useActor();
  const queryClient = useQueryClient();

  return useMutation<void, Error, string>({
    mutationFn: async (content) => {
      if (!actor) throw new Error('Actor not available');
      return actor.submitIdea(content);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['allIdeas'] });
    },
  });
}

export function useGetFriendsModeStatus() {
  const { actor, isFetching } = useActor();

  return useQuery<string | null>({
    queryKey: ['friendsModeStatus'],
    queryFn: async () => {
      if (!actor) return null;
      return actor.getFriendsModeStatus();
    },
    enabled: !!actor && !isFetching,
  });
}

export function useSubmitFriendsModeRequest() {
  const { actor } = useActor();
  const queryClient = useQueryClient();

  return useMutation<void, Error, string>({
    mutationFn: async (birthdate) => {
      if (!actor) throw new Error('Actor not available');
      return actor.submitFriendsModeRequest(birthdate);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['friendsModeStatus'] });
    },
  });
}

export function useSetPassword() {
  const { actor } = useActor();

  return useMutation<void, Error, string>({
    mutationFn: async (password) => {
      if (!actor) throw new Error('Actor not available');
      return actor.setPassword(password);
    },
  });
}

export function useVerifyPassword() {
  const { actor } = useActor();

  return useMutation<boolean, Error, string>({
    mutationFn: async (password) => {
      if (!actor) throw new Error('Actor not available');
      return actor.verifyPassword(password);
    },
  });
}
