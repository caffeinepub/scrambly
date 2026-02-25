import Map "mo:core/Map";
import List "mo:core/List";
import Set "mo:core/Set";
import Principal "mo:core/Principal";

module {
  type OldActor = {
    profiles : Map.Map<Principal, { name : Text; birthYear : Nat; warnings : Nat; accountLocked : Bool; lastLogin : Int; usageTimeRemaining : ?Nat; isSchoolAccount : Bool; password : ?{ password : Text; attemptsLeft : Nat; verified : Bool }; }>;
    appeals : Map.Map<Principal, { attemptsLeft : Nat; appealStatus : { #noAppeal; #pending : { reason : Text; timestamp : Int; adminResponse : ?Text }; #approved; #denied : { reason : Text; timestamp : Int; adminResponse : ?Text }; }; }>;
    modApplications : List.List<{ applicant : Principal; answers : Text; isCorrect : Bool; timestamp : Int }>;
    friendsRequests : List.List<{ principal : Text; birthdate : Text; status : Text; submittedAt : Int }>;
  };

  type NewActor = {
    profiles : Map.Map<Principal, { name : Text; birthYear : Nat; warnings : Nat; accountLocked : Bool; lastLogin : Int; usageTimeRemaining : ?Nat; isSchoolAccount : Bool; password : ?{ password : Text; attemptsLeft : Nat; verified : Bool }; }>;
    appeals : Map.Map<Principal, { attemptsLeft : Nat; appealStatus : { #noAppeal; #pending : { reason : Text; timestamp : Int; adminResponse : ?Text }; #approved; #denied : { reason : Text; timestamp : Int; adminResponse : ?Text }; }; }>;
    modApplications : List.List<{ applicant : Principal; answers : Text; isCorrect : Bool; timestamp : Int }>;
    friendsRequests : List.List<{ principal : Text; birthdate : Text; status : Text; submittedAt : Int }>;
    friendRequests : Map.Map<Principal, List.List<{ requesterId : Principal; recipientId : Principal; status : Text; sentAt : Int }>>;
    friends : Map.Map<Principal, Set.Set<Principal>>;
  };

  public func run(old : OldActor) : NewActor {
    {
      old with
      friendRequests = Map.empty<Principal, List.List<{ requesterId : Principal; recipientId : Principal; status : Text; sentAt : Int }>>();
      friends = Map.empty<Principal, Set.Set<Principal>>();
    };
  };
};
