import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { Link } from "@tanstack/react-router";
import { ArrowLeft, Search, UserCircle, Users } from "lucide-react";
import { useState } from "react";
import { getAge } from "../components/KidModeWrapper";
import { useGetCallerUserProfile, useGetUsersByAge } from "../hooks/useQueries";
import { useIsCallerAdmin } from "../hooks/useQueries";

export default function AgeMatcher() {
  const { data: profile } = useGetCallerUserProfile();
  const { data: isAdmin } = useIsCallerAdmin();
  const [searchEnabled, setSearchEnabled] = useState(false);

  const currentYear = new Date().getFullYear();
  const userAge = getAge(profile);
  const userBirthYear = profile ? Number(profile.birthYear) : null;

  // Search for users born in the same year (same age)
  const fromYear = userBirthYear ? BigInt(userBirthYear) : BigInt(0);
  const toYear = userBirthYear ? BigInt(userBirthYear) : BigInt(0);

  const { data: matchedUsers, isLoading } = useGetUsersByAge(fromYear, toYear);

  const handleFindFriends = () => {
    setSearchEnabled(true);
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center gap-3">
        <Link
          to="/community"
          className="flex items-center gap-1 text-muted-foreground hover:text-foreground font-nunito text-sm transition-colors"
        >
          <ArrowLeft size={16} /> Back to Community
        </Link>
      </div>

      {/* Header */}
      <div className="flex items-center gap-3">
        <div className="w-12 h-12 bg-primary rounded-2xl flex items-center justify-center shadow-sonic">
          <Users size={24} className="text-primary-foreground" />
        </div>
        <div>
          <h1 className="text-3xl font-fredoka text-foreground">
            Find Friends
          </h1>
          <p className="text-muted-foreground font-nunito text-sm">
            Connect with Sonic fans your age!
          </p>
        </div>
      </div>

      {/* Your Profile Card */}
      {profile && (
        <div className="sonic-card p-5">
          <h2 className="font-fredoka text-lg text-foreground mb-3 flex items-center gap-2">
            <UserCircle size={20} className="text-primary" />
            Your Profile
          </h2>
          <div className="flex items-center gap-4">
            <div className="w-14 h-14 bg-primary/10 rounded-full flex items-center justify-center">
              <span className="text-2xl font-fredoka text-primary">
                {profile.name.charAt(0).toUpperCase()}
              </span>
            </div>
            <div>
              <p className="font-nunito font-700 text-foreground">
                {profile.name}
              </p>
              <p className="text-sm text-muted-foreground font-nunito">
                Age: {userAge !== null ? userAge : "Unknown"} • Born:{" "}
                {userBirthYear}
              </p>
            </div>
          </div>
        </div>
      )}

      {/* Age Match Info */}
      <div className="bg-secondary/10 border border-secondary/30 rounded-2xl p-4">
        <p className="font-nunito text-sm text-secondary-foreground">
          <strong>🎯 Age Matching:</strong> Scrambly connects you with fans born
          in <strong>{userBirthYear || "..."}</strong> — the same age as you!
          This keeps conversations fun and age-appropriate.
        </p>
      </div>

      {/* Find Friends Button / Results */}
      {!isAdmin ? (
        <div className="sonic-card p-8 text-center">
          <Users size={40} className="mx-auto mb-3 text-muted-foreground" />
          <h3 className="font-fredoka text-xl text-foreground mb-2">
            Coming Soon!
          </h3>
          <p className="text-muted-foreground font-nunito text-sm max-w-sm mx-auto">
            Age-matched friend discovery is being rolled out. Check back soon to
            connect with Sonic fans your age!
          </p>
          <div className="mt-4 flex flex-wrap gap-2 justify-center">
            {["Sonic Fan", "Shadow Fan", "Tails Fan", "Knuckles Fan"].map(
              (tag) => (
                <span
                  key={tag}
                  className="text-xs font-nunito font-700 bg-primary/10 text-primary px-3 py-1 rounded-full"
                >
                  {tag}
                </span>
              ),
            )}
          </div>
        </div>
      ) : (
        <div className="space-y-4">
          {!searchEnabled ? (
            <Button
              onClick={handleFindFriends}
              className="w-full rounded-full font-fredoka text-lg bg-primary text-primary-foreground"
            >
              <Search size={16} className="mr-2" />
              Find Fans Born in {userBirthYear}
            </Button>
          ) : isLoading ? (
            <div className="space-y-3">
              {Array.from({ length: 3 }).map((_, i) => (
                // biome-ignore lint/suspicious/noArrayIndexKey: skeleton placeholders, order is stable
                <div key={i} className="sonic-card p-4 flex items-center gap-3">
                  <Skeleton className="w-12 h-12 rounded-full" />
                  <div className="flex-1 space-y-2">
                    <Skeleton className="h-4 w-1/3 rounded-full" />
                    <Skeleton className="h-3 w-1/4 rounded-full" />
                  </div>
                </div>
              ))}
            </div>
          ) : matchedUsers && matchedUsers.length > 0 ? (
            <div className="space-y-3">
              <p className="text-sm text-muted-foreground font-nunito">
                Found <strong>{matchedUsers.length}</strong> fan
                {matchedUsers.length !== 1 ? "s" : ""} your age!
              </p>
              {matchedUsers.map((user, i) => (
                // biome-ignore lint/suspicious/noArrayIndexKey: matched users list, no stable unique id
                <div key={i} className="sonic-card p-4 flex items-center gap-3">
                  <div className="w-12 h-12 bg-primary/10 rounded-full flex items-center justify-center shrink-0">
                    <span className="text-xl font-fredoka text-primary">
                      {user.name.charAt(0).toUpperCase()}
                    </span>
                  </div>
                  <div>
                    <p className="font-nunito font-700 text-foreground">
                      {user.name}
                    </p>
                    <p className="text-xs text-muted-foreground font-nunito">
                      Born {Number(user.birthYear)} • Age{" "}
                      {currentYear - Number(user.birthYear)}
                    </p>
                  </div>
                  <div className="ml-auto">
                    <span className="text-xs font-nunito font-700 bg-primary/10 text-primary px-2 py-1 rounded-full">
                      Same Age!
                    </span>
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <div className="sonic-card p-8 text-center">
              <Users size={40} className="mx-auto mb-3 text-muted-foreground" />
              <h3 className="font-fredoka text-xl text-foreground mb-1">
                No matches yet
              </h3>
              <p className="text-muted-foreground font-nunito text-sm">
                No other fans born in {userBirthYear} have joined yet. Invite
                your friends!
              </p>
            </div>
          )}
        </div>
      )}
    </div>
  );
}
