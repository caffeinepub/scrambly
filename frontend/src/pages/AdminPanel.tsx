import React, { useState } from "react";
import { useNavigate } from "@tanstack/react-router";
import { Shield, Ban, AlertTriangle, UserCheck, Users, Loader2, Crown } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { toast } from "sonner";
import { Principal } from "@dfinity/principal";
import {
  useAdminBanUser,
  useAdminWarnUser,
  useAdminUnbanUser,
  useGetBanList,
  useGetWarnList,
  usePromoteUserToModerator,
} from "../hooks/useQueries";
import { useGetCallerUserProfile } from "../hooks/useQueries";

const ADMIN_USERNAME = "TailsTheBeast124";
const MAX_DISPLAY = 100_000_000_000_000;

function formatBanCount(count: number): string {
  if (count === 0) return "Nobody";
  if (count === 1) return "1 person banned";
  return `${count.toLocaleString()} people banned`;
}

function tryParsePrincipal(input: string): Principal | null {
  try {
    return Principal.fromText(input.trim());
  } catch {
    return null;
  }
}

export default function AdminPanel() {
  const navigate = useNavigate();
  const { data: profile, isLoading: profileLoading } = useGetCallerUserProfile();

  // Ban section
  const [banUsername, setBanUsername] = useState("");
  const adminBan = useAdminBanUser();

  // Warn section
  const [warnUsername, setWarnUsername] = useState("");
  const adminWarn = useAdminWarnUser();

  // Unban section
  const adminUnban = useAdminUnbanUser();

  // Moderation section
  const [modUsername, setModUsername] = useState("");
  const [modReason, setModReason] = useState("");
  const promoteMod = usePromoteUserToModerator();

  // Queries
  const { data: banList = [], isLoading: banListLoading } = useGetBanList();
  const { data: warnList = [], isLoading: warnListLoading } = useGetWarnList();

  // Guard: only TailsTheBeast124
  if (profileLoading) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <Loader2 className="w-8 h-8 animate-spin text-primary" />
      </div>
    );
  }

  if (!profile || profile.name !== ADMIN_USERNAME) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center px-4">
        <div className="bg-card rounded-2xl p-8 max-w-sm w-full text-center border border-border shadow-xl">
          <Shield className="w-14 h-14 text-destructive mx-auto mb-4" />
          <h1 className="text-2xl font-bold text-foreground mb-2">Access Denied</h1>
          <p className="text-muted-foreground mb-6">
            This panel is only accessible to the owner: <strong>{ADMIN_USERNAME}</strong>.
          </p>
          <Button onClick={() => navigate({ to: "/" })}>Go Home</Button>
        </div>
      </div>
    );
  }

  const handleBan = async () => {
    const principal = tryParsePrincipal(banUsername);
    if (!principal) {
      toast.error("Invalid username/principal. Please enter a valid principal ID.");
      return;
    }
    try {
      await adminBan.mutateAsync(principal);
      toast.success(`User ${banUsername} has been banned.`);
      setBanUsername("");
    } catch (e: any) {
      toast.error(`Failed to ban user: ${e?.message || "Unknown error"}`);
    }
  };

  const handleWarn = async () => {
    const principal = tryParsePrincipal(warnUsername);
    if (!principal) {
      toast.error("Invalid username/principal. Please enter a valid principal ID.");
      return;
    }
    try {
      await adminWarn.mutateAsync(principal);
      toast.success(`Warning sent to ${warnUsername}.`);
      setWarnUsername("");
    } catch (e: any) {
      toast.error(`Failed to warn user: ${e?.message || "Unknown error"}`);
    }
  };

  const handleUnban = async (principal: Principal) => {
    try {
      await adminUnban.mutateAsync(principal);
      toast.success(`User ${principal.toText()} has been unbanned.`);
    } catch (e: any) {
      toast.error(`Failed to unban user: ${e?.message || "Unknown error"}`);
    }
  };

  const handleMakeModerator = async () => {
    const principal = tryParsePrincipal(modUsername);
    if (!principal) {
      toast.error("Invalid username/principal. Please enter a valid principal ID.");
      return;
    }
    if (!modReason.trim()) {
      toast.error("Please provide a reason for promoting this user.");
      return;
    }
    try {
      await promoteMod.mutateAsync(principal);
      toast.success(`${modUsername} has been promoted to Moderator!`);
      setModUsername("");
      setModReason("");
    } catch (e: any) {
      toast.error(`Failed to promote user: ${e?.message || "Unknown error"}`);
    }
  };

  const displayedBanCount = Math.min(banList.length, MAX_DISPLAY);
  const displayedWarnCount = Math.min(warnList.length, MAX_DISPLAY);

  return (
    <div className="min-h-screen bg-background">
      <div className="max-w-3xl mx-auto px-4 py-8">
        {/* Header */}
        <div className="flex items-center gap-3 mb-8">
          <Crown className="w-8 h-8 text-yellow-500" />
          <div>
            <h1 className="text-3xl font-bold text-foreground">Admin Panel</h1>
            <p className="text-muted-foreground">Welcome, {ADMIN_USERNAME}! Manage Scrambly users here.</p>
          </div>
        </div>

        {/* Stats Row */}
        <div className="grid grid-cols-2 gap-4 mb-8">
          <div className="bg-card rounded-xl p-4 border border-border text-center">
            <p className="text-3xl font-bold text-destructive">{formatBanCount(displayedBanCount)}</p>
            <p className="text-muted-foreground text-sm mt-1">Banned Users</p>
          </div>
          <div className="bg-card rounded-xl p-4 border border-border text-center">
            <p className="text-3xl font-bold text-yellow-500">
              {displayedWarnCount === 0 ? "Nobody warned" : `${displayedWarnCount.toLocaleString()} warned`}
            </p>
            <p className="text-muted-foreground text-sm mt-1">Warned Users</p>
          </div>
        </div>

        {/* Ban User */}
        <div className="bg-card rounded-xl p-6 border border-border mb-4">
          <div className="flex items-center gap-2 mb-4">
            <Ban className="w-5 h-5 text-destructive" />
            <h2 className="text-lg font-semibold text-foreground">Ban User</h2>
          </div>
          <p className="text-muted-foreground text-sm mb-3">
            Enter the user's principal ID from their public post and press Ban.
          </p>
          <div className="flex gap-3">
            <Input
              placeholder="User principal ID..."
              value={banUsername}
              onChange={(e) => setBanUsername(e.target.value)}
              className="flex-1"
            />
            <Button
              variant="destructive"
              onClick={handleBan}
              disabled={adminBan.isPending || !banUsername.trim()}
            >
              {adminBan.isPending ? <Loader2 className="w-4 h-4 animate-spin" /> : "Ban"}
            </Button>
          </div>
        </div>

        {/* Warn User */}
        <div className="bg-card rounded-xl p-6 border border-border mb-4">
          <div className="flex items-center gap-2 mb-4">
            <AlertTriangle className="w-5 h-5 text-yellow-500" />
            <h2 className="text-lg font-semibold text-foreground">Warn User</h2>
          </div>
          <p className="text-muted-foreground text-sm mb-3">
            Enter the user's principal ID from their public post and press Warn.
          </p>
          <div className="flex gap-3">
            <Input
              placeholder="User principal ID..."
              value={warnUsername}
              onChange={(e) => setWarnUsername(e.target.value)}
              className="flex-1"
            />
            <Button
              className="bg-yellow-500 hover:bg-yellow-600 text-white"
              onClick={handleWarn}
              disabled={adminWarn.isPending || !warnUsername.trim()}
            >
              {adminWarn.isPending ? <Loader2 className="w-4 h-4 animate-spin" /> : "Warn"}
            </Button>
          </div>
        </div>

        {/* Unban Section */}
        <div className="bg-card rounded-xl p-6 border border-border mb-4">
          <div className="flex items-center gap-2 mb-4">
            <UserCheck className="w-5 h-5 text-green-500" />
            <h2 className="text-lg font-semibold text-foreground">Unban Users</h2>
          </div>

          {banListLoading ? (
            <div className="flex items-center gap-2 text-muted-foreground">
              <Loader2 className="w-4 h-4 animate-spin" />
              <span>Loading ban list...</span>
            </div>
          ) : banList.length === 0 ? (
            <div className="text-center py-6">
              <Users className="w-10 h-10 text-muted-foreground mx-auto mb-2" />
              <p className="text-muted-foreground font-medium">Nobody is currently banned 🎉</p>
            </div>
          ) : (
            <div className="space-y-2 max-h-64 overflow-y-auto">
              {banList.slice(0, MAX_DISPLAY).map((principal) => (
                <div
                  key={principal.toText()}
                  className="flex items-center justify-between bg-background rounded-lg px-4 py-2 border border-border"
                >
                  <span className="text-sm text-foreground font-mono truncate flex-1 mr-3">
                    {principal.toText()}
                  </span>
                  <Button
                    size="sm"
                    variant="outline"
                    className="text-green-600 border-green-600 hover:bg-green-50 shrink-0"
                    onClick={() => handleUnban(principal)}
                    disabled={adminUnban.isPending}
                  >
                    {adminUnban.isPending ? <Loader2 className="w-3 h-3 animate-spin" /> : "Unban"}
                  </Button>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Moderation Promotion */}
        <div className="bg-card rounded-xl p-6 border border-border mb-4">
          <div className="flex items-center gap-2 mb-4">
            <Shield className="w-5 h-5 text-primary" />
            <h2 className="text-lg font-semibold text-foreground">Moderation</h2>
          </div>
          <p className="text-muted-foreground text-sm mb-4">
            Promote a user to Moderator. Enter their principal ID and a reason, then press Make Moderator.
          </p>
          <div className="space-y-3">
            <Input
              placeholder="User principal ID..."
              value={modUsername}
              onChange={(e) => setModUsername(e.target.value)}
            />
            <Input
              placeholder="Reason for promotion..."
              value={modReason}
              onChange={(e) => setModReason(e.target.value)}
            />
            <Button
              className="w-full bg-primary hover:bg-primary/90"
              onClick={handleMakeModerator}
              disabled={promoteMod.isPending || !modUsername.trim() || !modReason.trim()}
            >
              {promoteMod.isPending ? (
                <Loader2 className="w-4 h-4 animate-spin mr-2" />
              ) : (
                <Shield className="w-4 h-4 mr-2" />
              )}
              Make Moderator
            </Button>
          </div>
        </div>
      </div>
    </div>
  );
}
