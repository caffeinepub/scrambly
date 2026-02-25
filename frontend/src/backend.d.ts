import type { Principal } from "@icp-sdk/core/principal";
export interface Some<T> {
    __kind__: "Some";
    value: T;
}
export interface None {
    __kind__: "None";
}
export type Option<T> = Some<T> | None;
export interface SonicKnowledgeEntry {
    name: string;
    content_type: string;
    description: string;
    highlights: string;
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
export type Time = bigint;
export interface Profile {
    birthYear: bigint;
    name: string;
    usageTimeRemaining?: bigint;
    accountLocked: boolean;
    warnings: bigint;
    lastLogin: Time;
}
export interface PostContent {
    author: Principal;
    message: string;
    timestamp: Time;
}
export enum UserRole {
    admin = "admin",
    user = "user",
    guest = "guest"
}
export interface backendInterface {
    addSonicEntry(entry: SonicKnowledgeEntry): Promise<void>;
    assignCallerUserRole(user: Principal, role: UserRole): Promise<void>;
    createCommunityPost(message: string): Promise<void>;
    getAllEntriesByType(content_type: string): Promise<Array<SonicKnowledgeEntry>>;
    getCallerUserProfile(): Promise<Profile | null>;
    getCallerUserRole(): Promise<UserRole>;
    getCommunityPosts(): Promise<Array<PostContent>>;
    getRemainingUsageTime(user: Principal): Promise<bigint | null>;
    getUserProfile(user: Principal): Promise<Profile>;
    getUsersByAge(fromYear: bigint, toYear: bigint): Promise<Array<Profile>>;
    isCallerAdmin(): Promise<boolean>;
    issueWarning(target: Principal, reason: string): Promise<bigint>;
    saveCallerUserProfile(profile: Profile): Promise<void>;
    searchSonicContent(searchText: string): Promise<Array<SonicKnowledgeEntry>>;
    setRemainingUsageTime(user: Principal, timeRemaining: bigint): Promise<void>;
    suggestSimilarEntries(entryName: string): Promise<Array<SonicKnowledgeEntry>>;
    verifyAge(name: string, birthYear: bigint): Promise<AgeCheckResult>;
}
