import Principal "mo:core/Principal";
import Map "mo:core/Map";
import Time "mo:core/Time";
import Array "mo:core/Array";
import Order "mo:core/Order";
import Int "mo:core/Int";
import Text "mo:core/Text";
import Runtime "mo:core/Runtime";
import Nat "mo:core/Nat";
import List "mo:core/List";
import Iter "mo:core/Iter";
import Char "mo:core/Char";
import MixinAuthorization "authorization/MixinAuthorization";
import AccessControl "authorization/access-control";

actor {
  let accessControlState = AccessControl.initState();
  include MixinAuthorization(accessControlState);

  public type Profile = {
    name : Text;
    birthYear : Nat;
    warnings : Nat;
    accountLocked : Bool;
    lastLogin : Time.Time;
    usageTimeRemaining : ?Nat;
  };

  let profiles = Map.empty<Principal, Profile>();

  public type AgeCheckResult = {
    #ok;
    #tooYoung : Nat;
    #tooOld : Nat;
    #invalidInput;
    #locked;
  };

  // Age verification on every login - callable by any principal (including guests)
  public shared ({ caller }) func verifyAge(name : Text, birthYear : Nat) : async AgeCheckResult {
    let currentYear = 2024;

    if (birthYear > currentYear) {
      return #invalidInput;
    };

    let age = currentYear - birthYear;

    // Check existing profile first for lock status
    switch (profiles.get(caller)) {
      case (?profile) {
        if (profile.accountLocked) { return #locked };
        // Age range check for existing users too
        if (age > 18) { return #tooOld(age) };
        if (age < 10) { return #tooYoung(age) };
        profiles.add(
          caller,
          {
            name;
            birthYear;
            warnings = profile.warnings;
            accountLocked = false;
            lastLogin = Time.now();
            usageTimeRemaining = profile.usageTimeRemaining;
          },
        );
        return #ok;
      };
      case (null) {
        if (age > 18) { return #tooOld(age) };
        if (age < 10) { return #tooYoung(age) };

        let profile : Profile = {
          name;
          birthYear;
          warnings = 0;
          accountLocked = false;
          lastLogin = Time.now();
          usageTimeRemaining = null;
        };
        profiles.add(caller, profile);
        return #ok;
      };
    };
  };

  // Required by instructions: get caller's own profile - users only
  public query ({ caller }) func getCallerUserProfile() : async ?Profile {
    if (not (AccessControl.hasPermission(accessControlState, caller, #user))) {
      Runtime.trap("Unauthorized: Only users can get their profile");
    };
    profiles.get(caller);
  };

  // Required by instructions: save caller's own profile - users only
  public shared ({ caller }) func saveCallerUserProfile(profile : Profile) : async () {
    if (not (AccessControl.hasPermission(accessControlState, caller, #user))) {
      Runtime.trap("Unauthorized: Only users can save their profile");
    };
    profiles.add(caller, profile);
  };

  // Get another user's profile - users can view their own, admins can view any
  public query ({ caller }) func getUserProfile(user : Principal) : async Profile {
    if (caller != user and not AccessControl.isAdmin(accessControlState, caller)) {
      Runtime.trap("Unauthorized: Can only view your own profile");
    };
    switch (profiles.get(user)) {
      case (null) { Runtime.trap("User does not exist") };
      case (?profile) { profile };
    };
  };

  type PostContent = {
    author : Principal;
    timestamp : Time.Time;
    message : Text;
  };

  let posts = List.empty<PostContent>();

  module PostContent {
    public func compare(a : PostContent, b : PostContent) : Order.Order {
      Int.compare(b.timestamp, a.timestamp);
    };
  };

  // Community post creation - registered users only
  public shared ({ caller }) func createCommunityPost(message : Text) : async () {
    if (not (AccessControl.hasPermission(accessControlState, caller, #user))) {
      Runtime.trap("Unauthorized: Only users can create community posts");
    };
    switch (profiles.get(caller)) {
      case (?profile) {
        if (profile.accountLocked) { Runtime.trap("Account locked") };
        let newPost = {
          author = caller;
          timestamp = Time.now();
          message;
        };
        posts.add(newPost);
      };
      case (null) { Runtime.trap("User profile not found") };
    };
  };

  // Community feed is public - no auth check needed
  public query func getCommunityPosts() : async [PostContent] {
    posts.toArray().sort();
  };

  // Issue warning - admin only (moderation system)
  public shared ({ caller }) func issueWarning(target : Principal, reason : Text) : async Nat {
    if (not (AccessControl.hasPermission(accessControlState, caller, #admin))) {
      Runtime.trap("Unauthorized: Only admins can issue warnings");
    };

    let maybeProfile = profiles.get(target);

    if (maybeProfile == null) {
      Runtime.trap("User profile not found");
    };

    switch (maybeProfile) {
      case (?profile) {
        let newWarnings = profile.warnings + 1;
        let isLocked = newWarnings >= 3;

        profiles.add(
          target,
          {
            profile with
            warnings = newWarnings;
            accountLocked = isLocked;
          },
        );

        newWarnings;
      };
      case (null) { Runtime.trap("User profile not found") };
    };
  };

  // Get users by age - admin only (sensitive data about minors)
  public query ({ caller }) func getUsersByAge(fromYear : Nat, toYear : Nat) : async [Profile] {
    if (not (AccessControl.hasPermission(accessControlState, caller, #admin))) {
      Runtime.trap("Unauthorized: Only admins can list users by age");
    };
    profiles.values().toArray().filter(
      func(profile) {
        profile.birthYear >= fromYear and profile.birthYear <= toYear
      }
    );
  };

  // Set usage time - admin only (parental controls dashboard)
  public shared ({ caller }) func setRemainingUsageTime(user : Principal, timeRemaining : Nat) : async () {
    if (not (AccessControl.hasPermission(accessControlState, caller, #admin))) {
      Runtime.trap("Unauthorized: Only admins can set usage time");
    };

    switch (profiles.get(user)) {
      case (?profile) {
        profiles.add(
          user,
          {
            profile with
            usageTimeRemaining = ?timeRemaining;
          },
        );
      };
      case (null) { Runtime.trap("User profile not found") };
    };
  };

  // Get remaining usage time - user can check their own, admin can check any
  public query ({ caller }) func getRemainingUsageTime(user : Principal) : async ?Nat {
    if (caller != user and not AccessControl.isAdmin(accessControlState, caller)) {
      Runtime.trap("Unauthorized: Can only view your own usage time");
    };
    switch (profiles.get(user)) {
      case (?profile) { profile.usageTimeRemaining };
      case (null) { Runtime.trap("User profile not found") };
    };
  };

  public type SonicKnowledgeEntry = {
    content_type : Text;
    name : Text;
    description : Text;
    highlights : Text;
  };

  let sonicData = List.empty<SonicKnowledgeEntry>();

  // Add Sonic entry - admin only (curated knowledge base)
  public shared ({ caller }) func addSonicEntry(entry : SonicKnowledgeEntry) : async () {
    if (not (AccessControl.hasPermission(accessControlState, caller, #admin))) {
      Runtime.trap("Unauthorized: Only admins can add Sonic entries");
    };
    sonicData.add(entry);
  };

  // Search Sonic content - public, no auth check needed
  public query func searchSonicContent(searchText : Text) : async [SonicKnowledgeEntry] {
    let lowerSearch = searchText.toLower();

    let results = sonicData.toArray().filter(
      func(entry) {
        entry.name.toLower().contains(#text (lowerSearch)) or
        entry.description.toLower().contains(#text (lowerSearch))
      }
    );

    let sortedResults = results.sort(
      func(a, b) { Text.compare(a.content_type, b.content_type) }
    );
    sortedResults;
  };

  // Get all entries by type - public, no auth check needed
  public query func getAllEntriesByType(content_type : Text) : async [SonicKnowledgeEntry] {
    sonicData.toArray().filter(
      func(entry) { Text.equal(entry.content_type, content_type) }
    );
  };

  // Suggest similar entries - public, no auth check needed
  public query func suggestSimilarEntries(entryName : Text) : async [SonicKnowledgeEntry] {
    let similarEntries = sonicData.toArray().filter(
      func(entry) {
        entry.name.toLower().contains(#text (entryName.toLower()));
      }
    );
    similarEntries;
  };
};
