import type { Principal } from "@dfinity/principal";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import {
  AgeCheckResult,
  ApprovalStatus,
  type Post,
  type Profile,
  UserRole,
} from "../backend";
import { useActor } from "./useActor";

// ─── Auth / Profile ───────────────────────────────────────────────────────────

export function useGetCallerUserProfile() {
  const { actor, isFetching: actorFetching } = useActor();

  const query = useQuery<Profile | null>({
    queryKey: ["currentUserProfile"],
    queryFn: async () => {
      if (!actor) throw new Error("Actor not available");
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
      if (!actor) throw new Error("Actor not available");
      return actor.saveCallerUserProfile(profile);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["currentUserProfile"] });
    },
  });
}

export function useVerifyAge() {
  const { actor } = useActor();
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({
      name,
      birthYear,
    }: { name: string; birthYear: bigint }) => {
      if (!actor) throw new Error("Actor not available");
      return actor.verifyAge(name, birthYear);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["currentUserProfile"] });
      queryClient.invalidateQueries({ queryKey: ["allUsers"] });
    },
  });
}

export function useGetUserProfile(user: Principal | null) {
  const { actor, isFetching } = useActor();

  return useQuery<Profile>({
    queryKey: ["userProfile", user?.toString()],
    queryFn: async () => {
      if (!actor || !user) throw new Error("Actor or user not available");
      return actor.getUserProfile(user);
    },
    enabled: !!actor && !isFetching && !!user,
    retry: false,
  });
}

// ─── Admin ────────────────────────────────────────────────────────────────────

export function useIsCallerAdmin() {
  const { actor, isFetching } = useActor();

  return useQuery<boolean>({
    queryKey: ["isCallerAdmin"],
    queryFn: async () => {
      if (!actor) return false;
      return actor.isCallerAdmin();
    },
    enabled: !!actor && !isFetching,
  });
}

export function useGetAllUsers() {
  const { actor, isFetching } = useActor();

  return useQuery<[string, Principal][]>({
    queryKey: ["allUsers"],
    queryFn: async () => {
      if (!actor) return [];
      return actor.getAllUsers();
    },
    enabled: !!actor && !isFetching,
    retry: false,
  });
}

export function useAdminBanUser() {
  const { actor } = useActor();
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (target: Principal) => {
      if (!actor) throw new Error("Actor not available");
      return actor.adminBanUser(target);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["banList"] });
      queryClient.invalidateQueries({ queryKey: ["allUsers"] });
    },
  });
}

export function useAdminUnbanUser() {
  const { actor } = useActor();
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (target: Principal) => {
      if (!actor) throw new Error("Actor not available");
      return actor.adminUnbanUser(target);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["banList"] });
      queryClient.invalidateQueries({ queryKey: ["allUsers"] });
    },
  });
}

export function useAdminWarnUser() {
  const { actor } = useActor();
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (target: Principal) => {
      if (!actor) throw new Error("Actor not available");
      return actor.adminWarnUser(target);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["warnList"] });
      queryClient.invalidateQueries({ queryKey: ["allUsers"] });
    },
  });
}

export function usePromoteUserToModerator() {
  const { actor } = useActor();
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (target: Principal) => {
      if (!actor) throw new Error("Actor not available");
      return actor.promoteUserToModerator(target);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["allUsers"] });
    },
  });
}

export function useGetBanList() {
  const { actor, isFetching } = useActor();

  return useQuery<Principal[]>({
    queryKey: ["banList"],
    queryFn: async () => {
      if (!actor) return [];
      return actor.getBanList();
    },
    enabled: !!actor && !isFetching,
    retry: false,
  });
}

export function useGetWarnList() {
  const { actor, isFetching } = useActor();

  return useQuery<Principal[]>({
    queryKey: ["warnList"],
    queryFn: async () => {
      if (!actor) return [];
      return actor.getWarnList();
    },
    enabled: !!actor && !isFetching,
    retry: false,
  });
}

export function useListApprovals() {
  const { actor, isFetching } = useActor();

  return useQuery({
    queryKey: ["approvals"],
    queryFn: async () => {
      if (!actor) return [];
      return actor.listApprovals();
    },
    enabled: !!actor && !isFetching,
    retry: false,
  });
}

export function useIssueWarning() {
  const { actor } = useActor();
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({
      target,
      reason,
    }: { target: Principal; reason: string }) => {
      if (!actor) throw new Error("Actor not available");
      return actor.issueWarning(target, reason);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["warnList"] });
    },
  });
}

// ─── Community Posts (new model) ──────────────────────────────────────────────

export function useGetAllPosts() {
  const { actor, isFetching } = useActor();

  return useQuery<Post[]>({
    queryKey: ["allPosts"],
    queryFn: async () => {
      if (!actor) return [];
      return actor.getAllPosts();
    },
    enabled: !!actor && !isFetching,
    refetchInterval: 15000,
  });
}

export function useCreatePost() {
  const { actor } = useActor();
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({
      text,
      image,
    }: { text: string; image: Uint8Array | null }) => {
      if (!actor) throw new Error("Actor not available");
      return actor.createPost(text, image);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["allPosts"] });
    },
  });
}

export function useEditPost() {
  const { actor } = useActor();
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({
      postId,
      newText,
      newImage,
    }: {
      postId: bigint;
      newText: string;
      newImage: Uint8Array | null;
    }) => {
      if (!actor) throw new Error("Actor not available");
      return actor.editPost(postId, newText, newImage);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["allPosts"] });
      queryClient.invalidateQueries({ queryKey: ["replies"] });
    },
  });
}

export function useDeletePost() {
  const { actor } = useActor();
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (postId: bigint) => {
      if (!actor) throw new Error("Actor not available");
      return actor.deletePost(postId);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["allPosts"] });
      queryClient.invalidateQueries({ queryKey: ["replies"] });
    },
  });
}

export function useReplyToPost() {
  const { actor } = useActor();
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({
      parentId,
      text,
      image,
    }: {
      parentId: bigint;
      text: string;
      image: Uint8Array | null;
    }) => {
      if (!actor) throw new Error("Actor not available");
      return actor.replyToPost(parentId, text, image);
    },
    onSuccess: (_data, variables) => {
      queryClient.invalidateQueries({
        queryKey: ["replies", variables.parentId.toString()],
      });
    },
  });
}

export function useGetReplies(parentId: bigint) {
  const { actor, isFetching } = useActor();

  return useQuery<Post[]>({
    queryKey: ["replies", parentId.toString()],
    queryFn: async () => {
      if (!actor) return [];
      return actor.getReplies(parentId);
    },
    enabled: !!actor && !isFetching,
    refetchInterval: 15000,
  });
}

// ─── Ban status ───────────────────────────────────────────────────────────────

export function useIsCallerBanned() {
  const { actor, isFetching } = useActor();

  return useQuery<boolean>({
    queryKey: ["isCallerBanned"],
    queryFn: async () => {
      if (!actor) return false;
      return actor.isCallerBanned();
    },
    enabled: !!actor && !isFetching,
  });
}

// ─── Friends Mode ─────────────────────────────────────────────────────────────

export function useGetFriendsModeStatus() {
  const { actor, isFetching } = useActor();

  return useQuery<string | null>({
    queryKey: ["friendsModeStatus"],
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

  return useMutation({
    mutationFn: async (birthdate: string) => {
      if (!actor) throw new Error("Actor not available");
      return actor.submitFriendsModeRequest(birthdate);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["friendsModeStatus"] });
    },
  });
}

export function useGetAllFriendsModeRequests() {
  const { actor, isFetching } = useActor();

  return useQuery({
    queryKey: ["allFriendsModeRequests"],
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

  return useMutation({
    mutationFn: async ({
      principal,
      status,
    }: { principal: string; status: string }) => {
      if (!actor) throw new Error("Actor not available");
      return actor.reviewFriendsModeRequest(principal, status);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["allFriendsModeRequests"] });
    },
  });
}

// ─── Friends ──────────────────────────────────────────────────────────────────

export function useGetFriends() {
  const { actor, isFetching } = useActor();

  return useQuery<Principal[]>({
    queryKey: ["friends"],
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
    queryKey: ["friendRequests"],
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

  return useMutation({
    mutationFn: async (recipientPrincipal: Principal) => {
      if (!actor) throw new Error("Actor not available");
      return actor.sendFriendRequest(recipientPrincipal);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["friendRequests"] });
      queryClient.invalidateQueries({ queryKey: ["friends"] });
    },
  });
}

export function useRespondToFriendRequest() {
  const { actor } = useActor();
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({
      requesterId,
      accept,
    }: { requesterId: Principal; accept: boolean }) => {
      if (!actor) throw new Error("Actor not available");
      return actor.respondToFriendRequest(requesterId, accept);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["friendRequests"] });
      queryClient.invalidateQueries({ queryKey: ["friends"] });
    },
  });
}

// ─── Sonic Search ─────────────────────────────────────────────────────────────

export function useSearchSonicContent(query: string) {
  const { actor, isFetching } = useActor();

  return useQuery({
    queryKey: ["sonicSearch", query],
    queryFn: async () => {
      if (!actor || !query.trim()) return [];
      return actor.searchSonicContent(query);
    },
    enabled: !!actor && !isFetching && !!query.trim(),
  });
}

// ─── Ideas ────────────────────────────────────────────────────────────────────

export function useSubmitIdea() {
  const { actor } = useActor();
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (content: string) => {
      if (!actor) throw new Error("Actor not available");
      return actor.submitIdea(content);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["allIdeas"] });
    },
  });
}

export function useGetAllIdeas() {
  const { actor, isFetching } = useActor();

  return useQuery({
    queryKey: ["allIdeas"],
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

  return useMutation({
    mutationFn: async (index: bigint) => {
      if (!actor) throw new Error("Actor not available");
      return actor.markIdeaReviewed(index);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["allIdeas"] });
    },
  });
}

// ─── Moderator ────────────────────────────────────────────────────────────────

export function useApplyForModerator() {
  const { actor } = useActor();

  return useMutation({
    mutationFn: async (answers: string) => {
      if (!actor) throw new Error("Actor not available");
      return actor.applyForModerator(answers);
    },
  });
}

export function useIsUserModerator(user: Principal | null) {
  const { actor, isFetching } = useActor();

  return useQuery<boolean>({
    queryKey: ["isUserModerator", user?.toString()],
    queryFn: async () => {
      if (!actor || !user) return false;
      return actor.isUserModerator(user);
    },
    enabled: !!actor && !isFetching && !!user,
  });
}

// ─── Age Matcher ──────────────────────────────────────────────────────────────

export function useGetUsersByAge(fromYear: bigint, toYear: bigint) {
  const { actor, isFetching } = useActor();

  return useQuery<Profile[]>({
    queryKey: ["usersByAge", fromYear.toString(), toYear.toString()],
    queryFn: async () => {
      if (!actor) return [];
      return actor.getUsersByAge(fromYear, toYear);
    },
    enabled: !!actor && !isFetching,
  });
}

// ─── Community Posts (legacy) ─────────────────────────────────────────────────

export function useGetCommunityPosts() {
  const { actor, isFetching } = useActor();

  return useQuery({
    queryKey: ["communityPosts"],
    queryFn: async () => {
      if (!actor) return [];
      return actor.getCommunityPosts();
    },
    enabled: !!actor && !isFetching,
  });
}

// ─── Password ─────────────────────────────────────────────────────────────────

export function useSetPassword() {
  const { actor } = useActor();

  return useMutation({
    mutationFn: async (password: string) => {
      if (!actor) throw new Error("Actor not available");
      return actor.setPassword(password);
    },
  });
}

export function useVerifyPassword() {
  const { actor } = useActor();

  return useMutation({
    mutationFn: async (password: string) => {
      if (!actor) throw new Error("Actor not available");
      return actor.verifyPassword(password);
    },
  });
}

// ─── Appeal ───────────────────────────────────────────────────────────────────

export function useSubmitBanAppeal() {
  const { actor } = useActor();
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (reason: string) => {
      if (!actor) throw new Error("Actor not available");
      return actor.submitBanAppeal(reason);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["isCallerBanned"] });
    },
  });
}

// ─── Usage Time ───────────────────────────────────────────────────────────────

export function useGetRemainingUsageTime(user: Principal | null) {
  const { actor, isFetching } = useActor();

  return useQuery<bigint | null>({
    queryKey: ["remainingUsageTime", user?.toString()],
    queryFn: async () => {
      if (!actor || !user) return null;
      return actor.getRemainingUsageTime(user);
    },
    enabled: !!actor && !isFetching && !!user,
  });
}

export function useSetRemainingUsageTime() {
  const { actor } = useActor();
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({
      user,
      timeRemaining,
    }: { user: Principal; timeRemaining: bigint }) => {
      if (!actor) throw new Error("Actor not available");
      return actor.setRemainingUsageTime(user, timeRemaining);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["remainingUsageTime"] });
    },
  });
}
