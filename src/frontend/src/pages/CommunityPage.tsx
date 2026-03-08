import { Button } from "@/components/ui/button";
import { ChevronDown, Eye, MessageSquare, ShieldAlert } from "lucide-react";
import React, { useRef, useState } from "react";
import CommunityFeed from "../components/CommunityFeed";
import CommunityPostForm from "../components/CommunityPostForm";
import { useInternetIdentity } from "../hooks/useInternetIdentity";
import { useGetAllPosts, useIsCallerBanned } from "../hooks/useQueries";

export default function CommunityPage() {
  const { identity } = useInternetIdentity();
  const { data: posts = [], isLoading: postsLoading } = useGetAllPosts();
  const { data: isBanned = false } = useIsCallerBanned();

  const [banOverlayVisible, setBanOverlayVisible] = useState(true);
  const feedRef = useRef<HTMLDivElement>(null);

  const scrollToFeed = () => {
    feedRef.current?.scrollIntoView({ behavior: "smooth" });
  };

  const currentUserPrincipal = identity?.getPrincipal().toString() ?? "";

  // Ban overlay for banned users
  if (isBanned && banOverlayVisible) {
    return (
      <div className="fixed inset-0 z-50 flex flex-col items-center justify-center bg-background/95 backdrop-blur-sm">
        <div className="max-w-md w-full mx-4 rounded-2xl border border-destructive/40 bg-card shadow-2xl p-8 flex flex-col items-center gap-6">
          <div className="w-16 h-16 rounded-full bg-destructive/10 flex items-center justify-center">
            <ShieldAlert className="w-8 h-8 text-destructive" />
          </div>
          <div className="text-center">
            <h2 className="text-2xl font-bold text-destructive mb-2">
              You Are Banned
            </h2>
            <p className="text-muted-foreground text-sm leading-relaxed">
              Your account has been banned. You cannot post, reply, or interact
              with the community. You may view posts in read-only mode.
            </p>
          </div>
          <div className="flex flex-col gap-3 w-full">
            <Button
              onClick={() => setBanOverlayVisible(false)}
              className="w-full gap-2"
              variant="outline"
            >
              <Eye className="w-4 h-4" />
              View Posts (Read Only)
            </Button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background">
      <div className="max-w-2xl mx-auto px-4 py-8">
        {/* Header */}
        <div className="flex items-center gap-3 mb-6">
          <div className="w-10 h-10 rounded-full bg-primary/10 flex items-center justify-center">
            <MessageSquare className="w-5 h-5 text-primary" />
          </div>
          <div>
            <h1 className="text-2xl font-bold text-foreground">Community</h1>
            <p className="text-sm text-muted-foreground">
              Share with the Scrambly community
            </p>
          </div>
        </div>

        {/* AppealMe button for banned users in read-only mode */}
        {isBanned && !banOverlayVisible && (
          <div className="mb-4 p-4 rounded-xl border border-destructive/30 bg-destructive/5 flex items-center justify-between">
            <div className="flex items-center gap-2">
              <ShieldAlert className="w-4 h-4 text-destructive" />
              <span className="text-sm text-destructive font-medium">
                You are in read-only mode (banned)
              </span>
            </div>
            <Button
              variant="destructive"
              size="sm"
              onClick={() => setBanOverlayVisible(true)}
            >
              AppealMe
            </Button>
          </div>
        )}

        {/* Post creation form — hidden for banned users */}
        {!isBanned && identity && (
          <div className="mb-6">
            <CommunityPostForm />
          </div>
        )}

        {/* View All Posts button */}
        <div className="mb-6 flex justify-center">
          <Button
            variant="outline"
            onClick={scrollToFeed}
            className="gap-2 rounded-full px-6"
          >
            <ChevronDown className="w-4 h-4" />
            View All Posts
          </Button>
        </div>

        {/* Post feed */}
        <div ref={feedRef}>
          {postsLoading ? (
            <div className="space-y-4">
              {[1, 2, 3].map((i) => (
                <div
                  key={i}
                  className="rounded-xl border border-border bg-card p-4 animate-pulse"
                >
                  <div className="flex items-center gap-3 mb-3">
                    <div className="w-8 h-8 rounded-full bg-muted" />
                    <div className="h-4 w-32 bg-muted rounded" />
                  </div>
                  <div className="h-4 w-full bg-muted rounded mb-2" />
                  <div className="h-4 w-3/4 bg-muted rounded" />
                </div>
              ))}
            </div>
          ) : (
            <CommunityFeed
              posts={posts}
              currentUserPrincipal={currentUserPrincipal}
              isBanned={isBanned}
            />
          )}
        </div>
      </div>
    </div>
  );
}
