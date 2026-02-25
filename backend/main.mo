import Principal "mo:core/Principal";
import Map "mo:core/Map";
import Time "mo:core/Time";
import Array "mo:core/Array";
import Order "mo:core/Order";
import Int "mo:core/Int";
import Text "mo:core/Text";
import Runtime "mo:core/Runtime";
import List "mo:core/List";
import Iter "mo:core/Iter";
import Nat "mo:core/Nat";
import Set "mo:core/Set";

import MixinAuthorization "authorization/MixinAuthorization";
import UserApproval "user-approval/approval";
import AccessControl "authorization/access-control";
import MixinStorage "blob-storage/Mixin";
import Storage "blob-storage/Storage";

import Migration "migration";

// Apply the migration module using the \`with\` clause
(with migration = Migration.run)
actor {
  let accessControlState = AccessControl.initState();
  include MixinAuthorization(accessControlState);

  let approvalState = UserApproval.initState(accessControlState);

  include MixinStorage();

  public shared ({ caller }) func requestApproval() : async () {
    UserApproval.requestApproval(approvalState, caller);
  };

  public query ({ caller }) func isCallerApproved() : async Bool {
    AccessControl.hasPermission(accessControlState, caller, #admin) or UserApproval.isApproved(approvalState, caller);
  };

  public shared ({ caller }) func setApproval(user : Principal, status : UserApproval.ApprovalStatus) : async () {
    if (not (AccessControl.hasPermission(accessControlState, caller, #admin))) {
      Runtime.trap("Unauthorized: Only admins can perform this action");
    };
    UserApproval.setApproval(approvalState, user, status);
  };

  public query ({ caller }) func listApprovals() : async [UserApproval.UserApprovalInfo] {
    if (not (AccessControl.hasPermission(accessControlState, caller, #admin))) {
      Runtime.trap("Unauthorized: Only admins can perform this action");
    };
    UserApproval.listApprovals(approvalState);
  };

  public type Profile = {
    name : Text;
    birthYear : Nat;
    warnings : Nat;
    accountLocked : Bool;
    lastLogin : Time.Time;
    usageTimeRemaining : ?Nat;
    isSchoolAccount : Bool;
    password : ?Password;
  };

  public type BanAppeal = {
    attemptsLeft : Nat;
    appealStatus : AppealStatus;
  };

  public type AppealStatus = {
    #noAppeal;
    #pending : AppealRequest;
    #approved;
    #denied : AppealRequest;
  };

  public type AppealRequest = {
    reason : Text;
    timestamp : Time.Time;
    adminResponse : ?Text;
  };

  public type ModeratorApplication = {
    applicant : Principal;
    answers : Text;
    isCorrect : Bool;
    timestamp : Time.Time;
  };

  public type FriendsModeRequest = {
    principal : Text;
    birthdate : Text;
    status : Text;
    submittedAt : Int;
  };

  public type Password = {
    password : Text;
    attemptsLeft : Nat;
    verified : Bool;
  };

  public type FriendRequest = {
    requesterId : Principal;
    recipientId : Principal;
    status : Text; // "pending", "accepted", "declined"
    sentAt : Time.Time;
  };

  let profiles = Map.empty<Principal, Profile>();
  let appeals = Map.empty<Principal, BanAppeal>();
  let modApplications = List.empty<ModeratorApplication>();
  let friendsRequests = List.empty<FriendsModeRequest>();
  let friendRequests = Map.empty<Principal, List.List<FriendRequest>>();
  let friends = Map.empty<Principal, Set.Set<Principal>>();

  func triggerFriendsModeNotification(_status : Text, _principal : Text) {};

  public type FriendsRequestStatus = {
    #pending;
    #approved;
    #denied;
    #none;
  };

  public shared ({ caller }) func submitFriendsModeRequest(birthdate : Text) : async () {
    if (not (AccessControl.hasPermission(accessControlState, caller, #user))) {
      Runtime.trap("Unauthorized: Only registered users can submit a Friends Mode request");
    };

    switch (profiles.get(caller)) {
      case (null) { Runtime.trap("User profile not found") };
      case (?profile) {
        if (profile.accountLocked) {
          Runtime.trap("Account is banned");
        };
      };
    };

    let principalText = caller.toText();

    let newRequest : FriendsModeRequest = {
      principal = principalText;
      birthdate;
      status = "pending";
      submittedAt = Time.now();
    };

    friendsRequests.add(newRequest);
  };

  public shared ({ caller }) func reviewFriendsModeRequest(principal : Text, status : Text) : async Bool {
    if (not (AccessControl.hasPermission(accessControlState, caller, #admin))) {
      Runtime.trap("Unauthorized: Only admins can review Friends Mode requests");
    };

    let updatedRequests = List.empty<FriendsModeRequest>();
    var found = false;

    for (request in friendsRequests.values()) {
      if (request.principal == principal) {
        let updatedRequest : FriendsModeRequest = {
          principal = request.principal;
          birthdate = request.birthdate;
          status;
          submittedAt = request.submittedAt;
        };
        updatedRequests.add(updatedRequest);
        found := true;
      } else {
        updatedRequests.add(request);
      };
    };

    if (found) {
      friendsRequests.clear();
      for (request in updatedRequests.values()) {
        friendsRequests.add(request);
      };

      triggerFriendsModeNotification(status, principal);

      return true;
    } else {
      return false;
    };
  };

  public query ({ caller }) func getFriendsModeStatus() : async ?Text {
    for (request in friendsRequests.values()) {
      if (request.principal == caller.toText()) {
        return ?request.status;
      };
    };
    null;
  };

  public query ({ caller }) func getAllFriendsModeRequests() : async [FriendsModeRequest] {
    if (not (AccessControl.hasPermission(accessControlState, caller, #admin))) {
      Runtime.trap("Unauthorized: Only admins can access all Friends Mode requests");
    };
    friendsRequests.toArray();
  };

  public shared ({ caller }) func submitBanAppeal(reason : Text) : async AppealStatus {
    if (not (AccessControl.hasPermission(accessControlState, caller, #user))) {
      Runtime.trap("Unauthorized: Only registered users can submit ban appeals");
    };

    let user = caller;

    switch (profiles.get(user)) {
      case (null) {
        Runtime.trap("User profile not found");
      };
      case (?profile) {
        if (not profile.accountLocked) {
          Runtime.trap("Account is not banned!");
        };
      };
    };

    let attemptsLeft = switch (appeals.get(user)) {
      case (null) { 2 };
      case (?appeal) { appeal.attemptsLeft };
    };

    if (attemptsLeft == 0) {
      return #denied({
        reason = "Appeal permanently denied (0 appeals left)";
        timestamp = Time.now();
        adminResponse = ?("No appeals remaining");
      });
    };

    let newAppeal : AppealRequest = {
      reason;
      timestamp = Time.now();
      adminResponse = null;
    };

    appeals.add(
      user,
      {
        attemptsLeft = attemptsLeft - 1 : Nat;
        appealStatus = #pending(newAppeal);
      },
    );

    #pending(newAppeal);
  };

  public shared ({ caller }) func reviewAppeal(user : Principal, approve : Bool, adminNote : ?Text) : async AppealStatus {
    if (not (AccessControl.hasPermission(accessControlState, caller, #admin))) {
      Runtime.trap("Unauthorized: Only admins can review appeals");
    };

    switch (appeals.get(user)) {
      case (null) { Runtime.trap("No appeal found for this user") };
      case (?appeal) {
        switch (appeal.appealStatus) {
          case (#pending(request)) {
            let updatedRequest : AppealRequest = {
              request with
              adminResponse = adminNote;
            };
            if (approve) {
              appeals.add(
                user,
                {
                  appeal with
                  appealStatus = #approved;
                },
              );
              switch (profiles.get(user)) {
                case (?profile) {
                  profiles.add(user, { profile with accountLocked = false });
                };
                case (null) {};
              };
              return #approved;
            } else {
              appeals.add(
                user,
                {
                  appeal with
                  appealStatus = #denied(updatedRequest);
                },
              );
              return #denied(updatedRequest);
            };
          };
          case (_) { Runtime.trap("No pending appeal") };
        };
      };
    };
  };

  public type ModeratorApplicationResult = {
    #success;
    #incorrectAnswers;
    #applicationFull;
  };

  public shared ({ caller }) func applyForModerator(answers : Text) : async ModeratorApplicationResult {
    if (not (AccessControl.hasPermission(accessControlState, caller, #user))) {
      Runtime.trap("Unauthorized: Only registered users can apply for moderator");
    };

    let isCorrect = answers.contains(#text "1991") and answers.contains(#text "1992");

    if (not isCorrect) {
      return #incorrectAnswers;
    };

    let correctCount = modApplications.toArray().filter(
      func(app) { app.isCorrect }
    ).size();

    if (correctCount >= 5) {
      return #applicationFull;
    };

    let newApp : ModeratorApplication = {
      applicant = caller;
      answers;
      isCorrect;
      timestamp = Time.now();
    };

    modApplications.add(newApp);

    let newCorrectCount = correctCount + 1;
    if (newCorrectCount == 5) {
      promoteAllToModerators(caller);
    };

    #success;
  };

  func promoteAllToModerators(adminCaller : Principal) {
    let correctApplicants = modApplications.toArray().filter(
      func(app) { app.isCorrect }
    );

    for (app in correctApplicants.vals()) {
      AccessControl.assignRole(accessControlState, adminCaller, app.applicant, #user);
    };
  };

  public type AgeCheckResult = {
    #ok;
    #tooYoung : Nat;
    #tooOld : Nat;
    #invalidInput;
    #locked;
  };

  public shared ({ caller }) func verifyAge(name : Text, birthYear : Nat) : async AgeCheckResult {
    // Only registered users can verify/set their age profile
    if (not (AccessControl.hasPermission(accessControlState, caller, #user))) {
      Runtime.trap("Unauthorized: Only registered users can verify age");
    };

    let currentYear = 2024;

    if (birthYear > currentYear) {
      return #invalidInput;
    };

    let age = currentYear - birthYear;

    switch (profiles.get(caller)) {
      case (?profile) {
        if (profile.accountLocked) { return #locked };
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
            isSchoolAccount = profile.isSchoolAccount;
            password = profile.password;
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
          isSchoolAccount = false;
          password = null;
        };
        profiles.add(caller, profile);
        return #ok;
      };
    };
  };

  public shared ({ caller }) func setSchoolAccountMode(user : Principal, enabled : Bool) : async () {
    if (not (AccessControl.hasPermission(accessControlState, caller, #admin))) {
      Runtime.trap("Unauthorized: Only admins can set school account mode");
    };
    switch (profiles.get(user)) {
      case (null) { Runtime.trap("User profile not found") };
      case (?profile) {
        profiles.add(user, { profile with isSchoolAccount = enabled });
      };
    };
  };

  public query ({ caller }) func isSchoolAccount(user : Principal) : async Bool {
    // Only the user themselves or an admin can check school account status
    if (caller != user and not AccessControl.isAdmin(accessControlState, caller)) {
      Runtime.trap("Unauthorized: Can only view your own account status");
    };
    switch (profiles.get(user)) {
      case (?profile) { profile.isSchoolAccount };
      case (null) { false };
    };
  };

  public query ({ caller }) func getCallerUserProfile() : async ?Profile {
    if (not (AccessControl.hasPermission(accessControlState, caller, #user))) {
      Runtime.trap("Unauthorized: Only users can get their profile");
    };
    profiles.get(caller);
  };

  public shared ({ caller }) func saveCallerUserProfile(profile : Profile) : async () {
    if (not (AccessControl.hasPermission(accessControlState, caller, #user))) {
      Runtime.trap("Unauthorized: Only users can save their profile");
    };
    // Users may not set privileged fields (warnings, accountLocked, isSchoolAccount, password)
    // through this general save function. Password must be set via setPassword.
    switch (profiles.get(caller)) {
      case (null) {
        profiles.add(caller, {
          profile with
          warnings = 0;
          accountLocked = false;
          isSchoolAccount = false;
          password = null;
        });
      };
      case (?existing) {
        profiles.add(caller, {
          profile with
          warnings = existing.warnings;
          accountLocked = existing.accountLocked;
          isSchoolAccount = existing.isSchoolAccount;
          password = existing.password;
        });
      };
    };
  };

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

  public query func getCommunityPosts() : async [PostContent] {
    posts.toArray().sort();
  };

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

  public shared ({ caller }) func addSonicEntry(entry : SonicKnowledgeEntry) : async () {
    if (not (AccessControl.hasPermission(accessControlState, caller, #admin))) {
      Runtime.trap("Unauthorized: Only admins can add Sonic entries");
    };
    sonicData.add(entry);
  };

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

  public query func getAllEntriesByType(content_type : Text) : async [SonicKnowledgeEntry] {
    sonicData.toArray().filter(
      func(entry) { Text.equal(entry.content_type, content_type) }
    );
  };

  public query func suggestSimilarEntries(entryName : Text) : async [SonicKnowledgeEntry] {
    let similarEntries = sonicData.toArray().filter(
      func(entry) {
        entry.name.toLower().contains(#text (entryName.toLower()));
      }
    );
    similarEntries;
  };

  public shared ({ caller }) func setPassword(password : Text) : async () {
    if (not (AccessControl.hasPermission(accessControlState, caller, #user))) {
      Runtime.trap("Unauthorized: Only users can set their password");
    };

    if (password.size() != 4 and password.size() != 6) {
      Runtime.trap("Password must be 4 or 6 digits");
    };

    switch (profiles.get(caller)) {
      case (null) { Runtime.trap("User profile not found") };
      case (?profile) {
        let extendedProfile = { profile with password = ?{ password; attemptsLeft = 3; verified = false } };
        profiles.add(caller, extendedProfile);
      };
    };
  };

  public shared ({ caller }) func verifyPassword(password : Text) : async Bool {
    if (not (AccessControl.hasPermission(accessControlState, caller, #user))) {
      Runtime.trap("Unauthorized: Only users can verify their password");
    };

    switch (profiles.get(caller)) {
      case (null) { Runtime.trap("User not found") };
      case (?profile) {
        switch (profile.password) {
          case (?storedPassword) {
            if (storedPassword.password == password) {
              profiles.add(caller, {
                profile with
                password = ?{ storedPassword with verified = true; attemptsLeft = 3 };
              });
              true;
            } else {
              var attempts = storedPassword.attemptsLeft - 1;
              if (attempts == 0) { attempts := 3 };

              profiles.add(caller, {
                profile with
                password = ?{ storedPassword with attemptsLeft = attempts };
              });
              false;
            };
          };
          case (null) { Runtime.trap("Password not set") };
        };
      };
    };
  };

  public type Video = {
    title : Text;
    blob : Storage.ExternalBlob;
  };

  let userVideos = Map.empty<Principal, List.List<Video>>();

  public shared ({ caller }) func uploadVideo(title : Text, blob : Storage.ExternalBlob) : async () {
    if (not (AccessControl.hasPermission(accessControlState, caller, #user))) {
      Runtime.trap("Unauthorized: Only users can upload videos");
    };

    let video : Video = {
      title;
      blob;
    };

    let userVidList = switch (userVideos.get(caller)) {
      case (null) { List.empty<Video>() };
      case (?videos) { videos };
    };

    userVidList.add(video);
    userVideos.add(caller, userVidList);
  };

  public query ({ caller }) func getMyVideos() : async [Video] {
    if (not (AccessControl.hasPermission(accessControlState, caller, #user))) {
      Runtime.trap("Unauthorized: Only users can get their videos");
    };

    switch (userVideos.get(caller)) {
      case (null) { [] };
      case (?videos) { videos.toArray() };
    };
  };

  public type Idea = {
    // Author is stored as the caller's principal text to prevent impersonation
    author : Text;
    content : Text;
    timestamp : Time.Time;
    reviewed : Bool;
  };

  let ideas = List.empty<Idea>();

  // The author is derived from the caller's principal (or display name from their profile),
  // not from user-supplied input, to prevent impersonation.
  public shared ({ caller }) func submitIdea(content : Text) : async () {
    if (not (AccessControl.hasPermission(accessControlState, caller, #user))) {
      Runtime.trap("Unauthorized: Only users can submit ideas");
    };

    if (content.size() > 600) {
      Runtime.trap("Idea must have less than 600 characters");
    };

    // Derive author from the caller's profile name or fall back to principal text
    let authorName = switch (profiles.get(caller)) {
      case (?profile) { profile.name };
      case (null) { caller.toText() };
    };

    let idea : Idea = {
      author = authorName;
      content;
      timestamp = Time.now();
      reviewed = false;
    };

    ideas.add(idea);
  };

  public shared ({ caller }) func markIdeaReviewed(index : Nat) : async () {
    if (not (AccessControl.hasPermission(accessControlState, caller, #admin))) {
      Runtime.trap("Unauthorized: Only admins can mark ideas as reviewed");
    };

    let newIdeas = List.empty<Idea>();

    for ((i, idea) in ideas.enumerate()) {
      if (i == index) {
        newIdeas.add({ idea with reviewed = true });
      } else {
        newIdeas.add(idea);
      };
    };

    ideas.clear();
    for (idea in newIdeas.values()) {
      ideas.add(idea);
    };
  };

  public query ({ caller }) func getAllIdeas() : async [Idea] {
    if (not (AccessControl.hasPermission(accessControlState, caller, #admin))) {
      Runtime.trap("Unauthorized: Only admins can get all ideas");
    };

    ideas.toArray();
  };

  public shared ({ caller }) func sendFriendRequest(recipientPrincipal : Principal) : async Text {
    if (not (AccessControl.hasPermission(accessControlState, caller, #user))) {
      Runtime.trap("Unauthorized: Only registered users can send friend requests");
    };

    if (caller == recipientPrincipal) {
      Runtime.trap("Request from/to equal principals forbidden!");
    };

    switch (profiles.get(recipientPrincipal)) {
      case (null) {
        Runtime.trap("User profile not found");
      };
      case (?profile) {
        if (profile.accountLocked) {
          Runtime.trap("Profile banned! Cannot send friend requests");
        };
      };
    };

    let senderFriends = switch (friends.get(caller)) {
      case (null) { Set.empty<Principal>() };
      case (?existing) { existing };
    };

    if (senderFriends.size() >= 1000) {
      return "Friend limit reached (1000/1000)";
    };

    let recipientFriends = switch (friends.get(recipientPrincipal)) {
      case (null) { Set.empty<Principal>() };
      case (?existing) { existing };
    };

    if (recipientFriends.size() >= 1000) {
      return "Recipient friend limit reached (1000/1000)";
    };

    let recipientRequests = switch (friendRequests.get(recipientPrincipal)) {
      case (null) { List.empty<FriendRequest>() };
      case (?existing) { existing };
    };

    // Check for existing pending request
    if (recipientRequests.toArray().find(func(req) { req.requesterId == caller and req.status == "pending" }) != null) {
      return "Friend request already pending";
    };

    // Add the friend request to recipient's requests
    let friendRequest : FriendRequest = {
      requesterId = caller;
      recipientId = recipientPrincipal;
      status = "pending";
      sentAt = Time.now();
    };

    recipientRequests.add(friendRequest);
    friendRequests.add(recipientPrincipal, recipientRequests);

    "Friend request sent successfully";
  };

  public shared ({ caller }) func respondToFriendRequest(requesterId : Principal, accept : Bool) : async Text {
    if (not (AccessControl.hasPermission(accessControlState, caller, #user))) {
      Runtime.trap("Unauthorized: Only registered users can respond to friend requests");
    };

    let recipientRequests = switch (friendRequests.get(caller)) {
      case (null) { List.empty<FriendRequest>() };
      case (?existing) { existing };
    };

    var found = false;
    var updatedRequests = List.empty<FriendRequest>();

    for (request in recipientRequests.values()) {
      if (request.requesterId == requesterId and request.status == "pending") {
        found := true;
        let updatedRequest : FriendRequest = {
          request with
          status = if accept { "accepted" } else { "declined" };
        };
        updatedRequests.add(updatedRequest);

        if (accept) {
          let callerFriends = switch (friends.get(caller)) {
            case (null) { Set.empty<Principal>() };
            case (?existing) { existing };
          };

          let requesterFriends = switch (friends.get(requesterId)) {
            case (null) { Set.empty<Principal>() };
            case (?existing) { existing };
          };

          if (callerFriends.size() >= 1000 or requesterFriends.size() >= 1000) {
            return "Friend limit reached";
          };

          callerFriends.add(requesterId);
          friends.add(caller, callerFriends);

          requesterFriends.add(caller);
          friends.add(requesterId, requesterFriends);
        };
      } else {
        updatedRequests.add(request);
      };
    };

    if (found) {
      friendRequests.add(caller, updatedRequests);
      "Friend request response processed";
    } else {
      "No matching pending friend request found";
    };
  };

  public query ({ caller }) func getFriends() : async [Principal] {
    if (not (AccessControl.hasPermission(accessControlState, caller, #user))) {
      Runtime.trap("Unauthorized: Only registered users can get their friends list");
    };

    switch (friends.get(caller)) {
      case (null) { [] };
      case (?friendsSet) { friendsSet.toArray() };
    };
  };

  public query ({ caller }) func getFriendRequests() : async [FriendRequest] {
    if (not (AccessControl.hasPermission(accessControlState, caller, #user))) {
      Runtime.trap("Unauthorized: Only registered users can get their friend requests");
    };

    switch (friendRequests.get(caller)) {
      case (null) { [] };
      case (?requests) { requests.toArray() };
    };
  };
};
