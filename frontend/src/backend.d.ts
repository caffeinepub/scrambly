import type { Principal } from "@icp-sdk/core/principal";
export interface Some<T> {
    __kind__: "Some";
    value: T;
}
export interface None {
    __kind__: "None";
}
export type Option<T> = Some<T> | None;
export class ExternalBlob {
    getBytes(): Promise<Uint8Array<ArrayBuffer>>;
    getDirectURL(): string;
    static fromURL(url: string): ExternalBlob;
    static fromBytes(blob: Uint8Array<ArrayBuffer>): ExternalBlob;
    withUploadProgress(onProgress: (percentage: number) => void): ExternalBlob;
}
export interface Video {
    title: string;
    blob: ExternalBlob;
}
export interface SonicKnowledgeEntry {
    name: string;
    content_type: string;
    description: string;
    highlights: string;
}
export type Time = bigint;
export type AppealStatus = {
    __kind__: "pending";
    pending: AppealRequest;
} | {
    __kind__: "noAppeal";
    noAppeal: null;
} | {
    __kind__: "denied";
    denied: AppealRequest;
} | {
    __kind__: "approved";
    approved: null;
};
export interface PostContent {
    author: Principal;
    message: string;
    timestamp: Time;
}
export interface Idea {
    content: string;
    author: string;
    timestamp: Time;
    reviewed: boolean;
}
export interface Profile {
    birthYear: bigint;
    password?: Password;
    name: string;
    isSchoolAccount: boolean;
    usageTimeRemaining?: bigint;
    accountLocked: boolean;
    warnings: bigint;
    lastLogin: Time;
}
export interface FriendsModeRequest {
    status: string;
    principal: string;
    birthdate: string;
    submittedAt: bigint;
}
export type AgeCheckResult = {
    __kind__: "ok";
    ok: null;
} | {
    __kind__: "locked";
    locked: null;
} | {
    __kind__: "invalidInput";
    invalidInput: null;
} | {
    __kind__: "tooOld";
    tooOld: bigint;
} | {
    __kind__: "tooYoung";
    tooYoung: bigint;
};
export interface AppealRequest {
    timestamp: Time;
    adminResponse?: string;
    reason: string;
}
export interface UserApprovalInfo {
    status: ApprovalStatus;
    principal: Principal;
}
export interface FriendRequest {
    status: string;
    sentAt: Time;
    recipientId: Principal;
    requesterId: Principal;
}
export interface Password {
    attemptsLeft: bigint;
    verified: boolean;
    password: string;
}
export enum ApprovalStatus {
    pending = "pending",
    approved = "approved",
    rejected = "rejected"
}
export enum ModeratorApplicationResult {
    incorrectAnswers = "incorrectAnswers",
    success = "success",
    applicationFull = "applicationFull"
}
export enum UserRole {
    admin = "admin",
    user = "user",
    guest = "guest"
}
export interface backendInterface {
    addSonicEntry(entry: SonicKnowledgeEntry): Promise<void>;
    applyForModerator(answers: string): Promise<ModeratorApplicationResult>;
    assignCallerUserRole(user: Principal, role: UserRole): Promise<void>;
    createCommunityPost(message: string): Promise<void>;
    getAllEntriesByType(content_type: string): Promise<Array<SonicKnowledgeEntry>>;
    getAllFriendsModeRequests(): Promise<Array<FriendsModeRequest>>;
    getAllIdeas(): Promise<Array<Idea>>;
    getCallerUserProfile(): Promise<Profile | null>;
    getCallerUserRole(): Promise<UserRole>;
    getCommunityPosts(): Promise<Array<PostContent>>;
    getFriendRequests(): Promise<Array<FriendRequest>>;
    getFriends(): Promise<Array<Principal>>;
    getFriendsModeStatus(): Promise<string | null>;
    getMyVideos(): Promise<Array<Video>>;
    getRemainingUsageTime(user: Principal): Promise<bigint | null>;
    getUserProfile(user: Principal): Promise<Profile>;
    getUsersByAge(fromYear: bigint, toYear: bigint): Promise<Array<Profile>>;
    isCallerAdmin(): Promise<boolean>;
    isCallerApproved(): Promise<boolean>;
    isSchoolAccount(user: Principal): Promise<boolean>;
    issueWarning(target: Principal, reason: string): Promise<bigint>;
    listApprovals(): Promise<Array<UserApprovalInfo>>;
    markIdeaReviewed(index: bigint): Promise<void>;
    requestApproval(): Promise<void>;
    respondToFriendRequest(requesterId: Principal, accept: boolean): Promise<string>;
    reviewAppeal(user: Principal, approve: boolean, adminNote: string | null): Promise<AppealStatus>;
    reviewFriendsModeRequest(principal: string, status: string): Promise<boolean>;
    saveCallerUserProfile(profile: Profile): Promise<void>;
    searchSonicContent(searchText: string): Promise<Array<SonicKnowledgeEntry>>;
    sendFriendRequest(recipientPrincipal: Principal): Promise<string>;
    setApproval(user: Principal, status: ApprovalStatus): Promise<void>;
    setPassword(password: string): Promise<void>;
    setRemainingUsageTime(user: Principal, timeRemaining: bigint): Promise<void>;
    setSchoolAccountMode(user: Principal, enabled: boolean): Promise<void>;
    submitBanAppeal(reason: string): Promise<AppealStatus>;
    submitFriendsModeRequest(birthdate: string): Promise<void>;
    submitIdea(content: string): Promise<void>;
    suggestSimilarEntries(entryName: string): Promise<Array<SonicKnowledgeEntry>>;
    uploadVideo(title: string, blob: ExternalBlob): Promise<void>;
    verifyAge(name: string, birthYear: bigint): Promise<AgeCheckResult>;
    verifyPassword(password: string): Promise<boolean>;
}
