import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { useActor } from "./useActor";
import type { Profile, SonicKnowledgeEntry, AgeCheckResult, AppealStatus, Idea, FriendsModeRequest, FriendRequest } from "../backend";
import { Principal } from "@dfinity/principal";

// ─── Profile ────────────────────────────────────────────────────────────────

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

export function useGetUserProfile(user: Principal | null) {
  const { actor, isFetching } = useActor();
  return useQuery<Profile>({
    queryKey: ["userProfile", user?.toText()],
    queryFn: async () => {
      if (!actor || !user) throw new Error("Actor or user not available");
      return actor.getUserProfile(user);
    },
    enabled: !!actor && !isFetching && !!user,
    retry: false,
  });
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

// ─── Age Verification ────────────────────────────────────────────────────────

export function useVerifyAge() {
  const { actor } = useActor();
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async ({ name, birthYear }: { name: string; birthYear: bigint }) => {
      if (!actor) throw new Error("Actor not available");
      return actor.verifyAge(name, birthYear);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["currentUserProfile"] });
    },
  });
}

// ─── Admin ───────────────────────────────────────────────────────────────────

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

// ─── Users by Age ────────────────────────────────────────────────────────────

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

// ─── Warnings ────────────────────────────────────────────────────────────────

export function useIssueWarning() {
  const { actor } = useActor();
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async ({ target, reason }: { target: Principal; reason: string }) => {
      if (!actor) throw new Error("Actor not available");
      return actor.issueWarning(target, reason);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["currentUserProfile"] });
    },
  });
}

// ─── Usage Time ──────────────────────────────────────────────────────────────

export function useSetRemainingUsageTime() {
  const { actor } = useActor();
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async ({ user, timeRemaining }: { user: Principal; timeRemaining: bigint }) => {
      if (!actor) throw new Error("Actor not available");
      return actor.setRemainingUsageTime(user, timeRemaining);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["currentUserProfile"] });
    },
  });
}

export function useGetRemainingUsageTime(user: Principal | null) {
  const { actor, isFetching } = useActor();
  return useQuery<bigint | null>({
    queryKey: ["remainingUsageTime", user?.toText()],
    queryFn: async () => {
      if (!actor || !user) return null;
      return actor.getRemainingUsageTime(user);
    },
    enabled: !!actor && !isFetching && !!user,
  });
}

// ─── Sonic Content ───────────────────────────────────────────────────────────

export function useSearchSonicContent(searchText: string) {
  const { actor, isFetching } = useActor();
  return useQuery<SonicKnowledgeEntry[]>({
    queryKey: ["sonicContent", searchText],
    queryFn: async () => {
      if (!actor || !searchText.trim()) return [];
      return actor.searchSonicContent(searchText);
    },
    enabled: !!actor && !isFetching && !!searchText.trim(),
  });
}

export function useGetAllEntriesByType(content_type: string) {
  const { actor, isFetching } = useActor();
  return useQuery<SonicKnowledgeEntry[]>({
    queryKey: ["sonicEntriesByType", content_type],
    queryFn: async () => {
      if (!actor) return [];
      return actor.getAllEntriesByType(content_type);
    },
    enabled: !!actor && !isFetching,
  });
}

// ─── Community Posts ─────────────────────────────────────────────────────────

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

export function useCreateCommunityPost() {
  const { actor } = useActor();
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (message: string) => {
      if (!actor) throw new Error("Actor not available");
      return actor.createCommunityPost(message);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["communityPosts"] });
    },
    onError: () => {
      // Invalidate profile to pick up any ban state changes
      queryClient.invalidateQueries({ queryKey: ["currentUserProfile"] });
    },
  });
}

// ─── Appeals ─────────────────────────────────────────────────────────────────

export function useSubmitBanAppeal() {
  const { actor } = useActor();
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (reason: string) => {
      if (!actor) throw new Error("Actor not available");
      return actor.submitBanAppeal(reason);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["currentUserProfile"] });
    },
  });
}

export function useReviewAppeal() {
  const { actor } = useActor();
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async ({
      user,
      approve,
      adminNote,
    }: {
      user: Principal;
      approve: boolean;
      adminNote: string | null;
    }) => {
      if (!actor) throw new Error("Actor not available");
      return actor.reviewAppeal(user, approve, adminNote);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["currentUserProfile"] });
    },
  });
}

// ─── Moderator Application ───────────────────────────────────────────────────

export function useApplyForModerator() {
  const { actor } = useActor();
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (answers: string) => {
      if (!actor) throw new Error("Actor not available");
      return actor.applyForModerator(answers);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["currentUserProfile"] });
    },
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
  return useQuery<FriendsModeRequest[]>({
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
    mutationFn: async ({ principal, status }: { principal: string; status: string }) => {
      if (!actor) throw new Error("Actor not available");
      return actor.reviewFriendsModeRequest(principal, status);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["allFriendsModeRequests"] });
    },
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
  return useQuery<Idea[]>({
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
  return useQuery<FriendRequest[]>({
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
      queryClient.invalidateQueries({ queryKey: ["friends"] });
      queryClient.invalidateQueries({ queryKey: ["friendRequests"] });
    },
  });
}

export function useRespondToFriendRequest() {
  const { actor } = useActor();
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async ({ requesterId, accept }: { requesterId: Principal; accept: boolean }) => {
      if (!actor) throw new Error("Actor not available");
      return actor.respondToFriendRequest(requesterId, accept);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["friends"] });
      queryClient.invalidateQueries({ queryKey: ["friendRequests"] });
    },
  });
}

// ─── Delete Account ───────────────────────────────────────────────────────────

export function useDeleteAccount() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async () => {
      // Client-side only: clear all cached data
      queryClient.clear();
    },
  });
}

// ─── Admin Ban/Warn/Unban ─────────────────────────────────────────────────────

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
      queryClient.invalidateQueries({ queryKey: ["currentUserProfile"] });
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
      queryClient.invalidateQueries({ queryKey: ["currentUserProfile"] });
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
      queryClient.invalidateQueries({ queryKey: ["currentUserProfile"] });
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
  });
}

// ─── Moderator ────────────────────────────────────────────────────────────────

export function usePromoteUserToModerator() {
  const { actor } = useActor();
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (target: Principal) => {
      if (!actor) throw new Error("Actor not available");
      return actor.promoteUserToModerator(target);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["isUserModerator"] });
      queryClient.invalidateQueries({ queryKey: ["currentUserProfile"] });
    },
  });
}

export function useIsUserModerator(user: Principal | null) {
  const { actor, isFetching } = useActor();
  return useQuery<boolean>({
    queryKey: ["isUserModerator", user?.toText()],
    queryFn: async () => {
      if (!actor || !user) return false;
      return actor.isUserModerator(user);
    },
    enabled: !!actor && !isFetching && !!user,
  });
}

// ─── School Account ───────────────────────────────────────────────────────────

export function useIsSchoolAccount(user: Principal | null) {
  const { actor, isFetching } = useActor();
  return useQuery<boolean>({
    queryKey: ["isSchoolAccount", user?.toText()],
    queryFn: async () => {
      if (!actor || !user) return false;
      return actor.isSchoolAccount(user);
    },
    enabled: !!actor && !isFetching && !!user,
  });
}

export function useSetSchoolAccountMode() {
  const { actor } = useActor();
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async ({ user, enabled }: { user: Principal; enabled: boolean }) => {
      if (!actor) throw new Error("Actor not available");
      return actor.setSchoolAccountMode(user, enabled);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["isSchoolAccount"] });
    },
  });
}

// ─── Password ─────────────────────────────────────────────────────────────────

export function useSetPassword() {
  const { actor } = useActor();
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (password: string) => {
      if (!actor) throw new Error("Actor not available");
      return actor.setPassword(password);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["currentUserProfile"] });
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

// ─── Approvals ────────────────────────────────────────────────────────────────

export function useIsCallerApproved() {
  const { actor, isFetching } = useActor();
  return useQuery<boolean>({
    queryKey: ["isCallerApproved"],
    queryFn: async () => {
      if (!actor) return false;
      return actor.isCallerApproved();
    },
    enabled: !!actor && !isFetching,
  });
}

export function useRequestApproval() {
  const { actor } = useActor();
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async () => {
      if (!actor) throw new Error("Actor not available");
      return actor.requestApproval();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["isCallerApproved"] });
    },
  });
}

export function useListApprovals() {
  const { actor, isFetching } = useActor();
  return useQuery({
    queryKey: ["listApprovals"],
    queryFn: async () => {
      if (!actor) return [];
      return actor.listApprovals();
    },
    enabled: !!actor && !isFetching,
  });
}

export function useSetApproval() {
  const { actor } = useActor();
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async ({ user, status }: { user: Principal; status: any }) => {
      if (!actor) throw new Error("Actor not available");
      return actor.setApproval(user, status);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["listApprovals"] });
    },
  });
}

// ─── Caller Banned ────────────────────────────────────────────────────────────

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
