import Set "mo:core/Set";
import Principal "mo:core/Principal";

module {
  type OldActor = {};
  type NewActor = {
    bannedUsers : Set.Set<Principal>;
    warnedUsers : Set.Set<Principal>;
    moderatorUsers : Set.Set<Principal>;
  };

  public func run(_old : OldActor) : NewActor {
    {
      bannedUsers = Set.empty<Principal>();
      warnedUsers = Set.empty<Principal>();
      moderatorUsers = Set.empty<Principal>();
    };
  };
};
