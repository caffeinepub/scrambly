import Principal "mo:core/Principal";
import Map "mo:core/Map";
import Time "mo:core/Time";
import Array "mo:core/Array";
import Order "mo:core/Order";
import Int "mo:core/Int";
import MixinAuthorization "authorization/MixinAuthorization";
import UserApproval "user-approval/approval";
import AccessControl "authorization/access-control";
import MixinStorage "blob-storage/Mixin";
import Storage "blob-storage/Storage";
import Set "mo:core/Set";
import List "mo:core/List";
import Iter "mo:core/Iter";
import Text "mo:core/Text";
import Runtime "mo:core/Runtime";

actor {
  let accessControlState = AccessControl.initState();
  include MixinAuthorization(accessControlState);

  let approvalState = UserApproval.initState(accessControlState);

  include MixinStorage();

  let bannedUsers = Set.empty<Principal>();
  let warnedUsers = Set.empty<Principal>();
  let moderatorUsers = Set.empty<Principal>();

  // Username Data
  let usernames = Set.empty<Text>();

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
    status : Text;
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

  // Banned content keywords - checked before saving any post
  let bannedKeywords : [Text] = [
    "porn",
    "anime",
    "inappropriate anime",
    "hentai",
    "nsfw",
    "explicit",
    "nude",
    "naked",
    "xxx",
    "adult content",
  ];

  // Check if a message contains banned content
  func containsBannedContent(message : Text) : Bool {
    let lowerMessage = message.toLower();
    for (keyword in bannedKeywords.vals()) {
      if (lowerMessage.contains(#text keyword)) {
        return true;
      };
    };
    false;
  };

  // Auto-ban a user for posting banned content and lock their profile
  func autoBanUser(user : Principal, _ : Text) {
    bannedUsers.add(user);
    switch (profiles.get(user)) {
      case (?profile) {
        profiles.add(user, { profile with accountLocked = true });
      };
      case (null) {};
    };
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
              bannedUsers.remove(user);
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
    if (not (AccessControl.hasPermission(accessControlState, caller, #user))) {
      Runtime.trap("Unauthorized: Only registered users can verify age");
    };

    // Username Checks
    if (usernames.contains(name)) {
      Runtime.trap("Error: This username is already being used! Please choose another username.");
    };

    if (name == "TailsTheBeast124") {
      Runtime.trap("Cannot be admin — this username is reserved.");
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
            profile with
            name;
            birthYear;
          },
        );
        usernames.add(name);
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
        usernames.add(name);
        profiles.add(caller, profile);
        return #ok;
      };
    };
  };

  public shared ({ caller }) func adminSetUsername(user : Principal, _ : Text, new_username : Text) : async () {
    if (not (AccessControl.hasPermission(accessControlState, caller, #admin))) {
      Runtime.trap("Unauthorized: Only admins can perform this action");
    };

    if (usernames.contains(new_username)) {
      Runtime.trap("This username is already being used! Please choose another username.");
    };

    if (new_username == "TailsTheBeast124") {
      Runtime.trap("Cannot be admin — this username is reserved.");
    };

    switch (profiles.get(user)) {
      case (?profile) {
        usernames.remove(profile.name);
        usernames.add(new_username);
        profiles.add(user, { profile with name = new_username });
      };
      case (null) { Runtime.trap("User profile not found") };
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
    switch (profiles.get(caller)) {
      case (null) {
        profiles.add(caller, {
          profile with
          warnings = 0;
          accountLocked = false;
          isSchoolAccount = false;
          password = null;
          name = "UnnamedRushoz";
        });
      };
      case (?existing) {
        profiles.add(caller, {
          profile with
          warnings = existing.warnings;
          accountLocked = existing.accountLocked;
          isSchoolAccount = existing.isSchoolAccount;
          password = existing.password;
          name = existing.name;
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
        if (profile.accountLocked) {
          Runtime.trap("Account locked: You are banned and cannot post");
        };
      };
      case (null) { Runtime.trap("User profile not found") };
    };

    // Auto-ban check: must happen before saving the post
    if (containsBannedContent(message)) {
      autoBanUser(
        caller,
        "Automatic ban: Your post contained prohibited content (anime images, pornographic material, or other inappropriate terms). This action is immediate and permanent pending appeal.",
      );
      Runtime.trap("Your account has been banned. Reason: Your post contained prohibited content including anime images, pornographic material, or other inappropriate terms. Posting such content is strictly forbidden.");
    };

    let newPost = {
      author = caller;
      timestamp = Time.now();
      message;
    };
    posts.add(newPost);
  };

  public query func getCommunityPosts() : async [PostContent] {
    posts.toArray().sort();
  };

  // ---- New Post Data Model ----

  public type PostRole = {
    #admin;
    #moderator;
    #warned;
    #normal;
  };

  public type Post = {
    id : Nat;
    author : Principal;
    authorUsername : Text;
    authorRole : PostRole;
    text : Text;
    image : ?Blob;
    timestamp : Time.Time;
    edited : Bool;
    deleted : Bool;
    parentId : ?Nat;
  };

  var nextPostId : Nat = 0;
  let allPosts = Map.empty<Nat, Post>();

  func getAuthorUsername(author : Principal) : Text {
    switch (profiles.get(author)) {
      case (?profile) { profile.name };
      case (null) { author.toText() };
    };
  };

  func getAuthorPostRole(author : Principal) : PostRole {
    if (AccessControl.isAdmin(accessControlState, author)) {
      return #admin;
    };
    if (moderatorUsers.contains(author)) {
      return #moderator;
    };
    if (warnedUsers.contains(author)) {
      return #warned;
    };
    #normal;
  };

  // createPost: registered user only, not banned
  public shared ({ caller }) func createPost(text : Text, image : ?Blob) : async Nat {
    if (not (AccessControl.hasPermission(accessControlState, caller, #user))) {
      Runtime.trap("Unauthorized: Only registered users can create posts");
    };

    switch (profiles.get(caller)) {
      case (?profile) {
        if (profile.accountLocked) {
          Runtime.trap("Account locked: You are banned and cannot post");
        };
      };
      case (null) { Runtime.trap("User profile not found") };
    };

    if (containsBannedContent(text)) {
      autoBanUser(caller, "Automatic ban: Post contained prohibited content.");
      Runtime.trap("Your account has been banned for posting prohibited content.");
    };

    let postId = nextPostId;
    nextPostId += 1;

    let newPost : Post = {
      id = postId;
      author = caller;
      authorUsername = getAuthorUsername(caller);
      authorRole = getAuthorPostRole(caller);
      text;
      image;
      timestamp = Time.now();
      edited = false;
      deleted = false;
      parentId = null;
    };

    allPosts.add(postId, newPost);
    postId;
  };

  // editPost: registered user only, must be the post's author
  public shared ({ caller }) func editPost(postId : Nat, newText : Text, newImage : ?Blob) : async () {
    if (not (AccessControl.hasPermission(accessControlState, caller, #user))) {
      Runtime.trap("Unauthorized: Only registered users can edit posts");
    };

    switch (allPosts.get(postId)) {
      case (null) { Runtime.trap("Post not found") };
      case (?post) {
        if (post.author != caller) {
          Runtime.trap("Unauthorized: You can only edit your own posts");
        };
        if (post.deleted) {
          Runtime.trap("Cannot edit a deleted post");
        };

        if (containsBannedContent(newText)) {
          autoBanUser(caller, "Automatic ban: Edited post contained prohibited content.");
          Runtime.trap("Your account has been banned for posting prohibited content.");
        };

        allPosts.add(postId, {
          post with
          text = newText;
          image = newImage;
          edited = true;
        });
      };
    };
  };

  // deletePost: registered user only, must be the post's author (hard delete)
  public shared ({ caller }) func deletePost(postId : Nat) : async () {
    if (not (AccessControl.hasPermission(accessControlState, caller, #user))) {
      Runtime.trap("Unauthorized: Only registered users can delete posts");
    };

    switch (allPosts.get(postId)) {
      case (null) { Runtime.trap("Post not found") };
      case (?post) {
        if (post.author != caller) {
          Runtime.trap("Unauthorized: You can only delete your own posts");
        };
        allPosts.remove(postId);
      };
    };
  };

  // getAllPosts: returns non-deleted top-level posts in reverse chronological order, visible to everyone
  public query func getAllPosts() : async [Post] {
    let activePosts = allPosts.values().toArray().filter(
      func(post : Post) : Bool {
        not post.deleted and post.parentId == null
      }
    );
    activePosts.sort(func(a : Post, b : Post) : Order.Order {
      Int.compare(b.timestamp, a.timestamp)
    });
  };

  // replyToPost: registered user only, not banned; reply references a parent post ID
  public shared ({ caller }) func replyToPost(parentId : Nat, text : Text, image : ?Blob) : async Nat {
    if (not (AccessControl.hasPermission(accessControlState, caller, #user))) {
      Runtime.trap("Unauthorized: Only registered users can reply to posts");
    };

    switch (profiles.get(caller)) {
      case (?profile) {
        if (profile.accountLocked) {
          Runtime.trap("Account locked: You are banned and cannot reply");
        };
      };
      case (null) { Runtime.trap("User profile not found") };
    };

    switch (allPosts.get(parentId)) {
      case (null) { Runtime.trap("Parent post not found") };
      case (?parentPost) {
        if (parentPost.deleted) {
          Runtime.trap("Cannot reply to a deleted post");
        };
      };
    };

    if (containsBannedContent(text)) {
      autoBanUser(caller, "Automatic ban: Reply contained prohibited content.");
      Runtime.trap("Your account has been banned for posting prohibited content.");
    };

    let replyId = nextPostId;
    nextPostId += 1;

    let reply : Post = {
      id = replyId;
      author = caller;
      authorUsername = getAuthorUsername(caller);
      authorRole = getAuthorPostRole(caller);
      text;
      image;
      timestamp = Time.now();
      edited = false;
      deleted = false;
      parentId = ?parentId;
    };

    allPosts.add(replyId, reply);
    replyId;
  };

  // getReplies: returns non-deleted replies for a given parent post, visible to everyone
  public query func getReplies(parentId : Nat) : async [Post] {
    let replies = allPosts.values().toArray().filter(
      func(post : Post) : Bool {
        not post.deleted and post.parentId == ?parentId
      }
    );
    replies.sort(func(a : Post, b : Post) : Order.Order {
      Int.compare(a.timestamp, b.timestamp)
    });
  };

  // ---- End New Post Data Model ----

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
      func(entry) { entry.content_type == content_type }
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
    author : Text;
    content : Text;
    timestamp : Time.Time;
    reviewed : Bool;
  };

  let ideas = List.empty<Idea>();

  public shared ({ caller }) func submitIdea(content : Text) : async () {
    if (not (AccessControl.hasPermission(accessControlState, caller, #user))) {
      Runtime.trap("Unauthorized: Only users can submit ideas");
    };

    if (content.size() > 600) {
      Runtime.trap("Idea must have less than 600 characters");
    };

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

    if (recipientRequests.toArray().find(func(req) { req.requesterId == caller and req.status == "pending" }) != null) {
      return "Friend request already pending";
    };

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

  public shared ({ caller }) func adminBanUser(target : Principal) : async () {
    if (not AccessControl.isAdmin(accessControlState, caller)) {
      Runtime.trap("Unauthorized: Only admins can manage bans");
    };
    bannedUsers.add(target);
    // Also lock the profile
    switch (profiles.get(target)) {
      case (?profile) {
        profiles.add(target, { profile with accountLocked = true });
      };
      case (null) {};
    };
  };

  public shared ({ caller }) func adminWarnUser(target : Principal) : async () {
    if (not AccessControl.isAdmin(accessControlState, caller)) {
      Runtime.trap("Unauthorized: Only admins can manage warnings");
    };
    warnedUsers.add(target);
    // Also increment warning count in profile
    switch (profiles.get(target)) {
      case (?profile) {
        let newWarnings = profile.warnings + 1;
        profiles.add(target, {
          profile with
          warnings = newWarnings;
          accountLocked = if (newWarnings >= 3) { true } else { profile.accountLocked };
        });
      };
      case (null) {};
    };
  };

  public shared ({ caller }) func adminUnbanUser(target : Principal) : async () {
    if (not AccessControl.isAdmin(accessControlState, caller)) {
      Runtime.trap("Unauthorized: Only admins can manage bans");
    };
    bannedUsers.remove(target);
    // Also unlock the profile
    switch (profiles.get(target)) {
      case (?profile) {
        profiles.add(target, { profile with accountLocked = false });
      };
      case (null) {};
    };
  };

  public query ({ caller }) func getBanList() : async [Principal] {
    if (not AccessControl.isAdmin(accessControlState, caller)) {
      Runtime.trap("Unauthorized: Only admins can view ban list");
    };
    bannedUsers.toArray();
  };

  public query ({ caller }) func getWarnList() : async [Principal] {
    if (not AccessControl.isAdmin(accessControlState, caller)) {
      Runtime.trap("Unauthorized: Only admins can view warn list");
    };
    warnedUsers.toArray();
  };

  public shared ({ caller }) func promoteUserToModerator(target : Principal) : async () {
    if (not AccessControl.isAdmin(accessControlState, caller)) {
      Runtime.trap("Unauthorized: Only admins can promote users");
    };
    moderatorUsers.add(target);
  };

  public query ({ caller }) func isUserModerator(user : Principal) : async Bool {
    // Any authenticated user can check moderator status (needed for celebratory message on page load)
    moderatorUsers.contains(user);
  };

  public query ({ caller }) func isCallerBanned() : async Bool {
    if (not (AccessControl.hasPermission(accessControlState, caller, #user))) {
      return false;
    };
    bannedUsers.contains(caller);
  };

  // User Management View for Admin — returns username and full Principal ID
  public query ({ caller }) func getAllUsers() : async [(Text, Principal)] {
    if (not (AccessControl.hasPermission(accessControlState, caller, #admin))) {
      Runtime.trap("Unauthorized: Only admins can view all users");
    };
    let users = List.empty<(Text, Principal)>();
    for ((principal, profile) in profiles.entries()) {
      users.add((profile.name, principal));
    };
    users.toArray();
  };
};
