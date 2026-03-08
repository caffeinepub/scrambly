import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Principal } from "@dfinity/principal";
import {
  AlertTriangle,
  Ban,
  Check,
  Copy,
  Shield,
  Star,
  Users,
} from "lucide-react";
import React, { useState } from "react";
import { toast } from "sonner";
import { useInternetIdentity } from "../hooks/useInternetIdentity";
import {
  useAdminBanUser,
  useAdminUnbanUser,
  useAdminWarnUser,
  useGetAllUsers,
  useGetBanList,
  useGetWarnList,
  useListApprovals,
  usePromoteUserToModerator,
} from "../hooks/useQueries";

export default function AdminPanel() {
  const { identity } = useInternetIdentity();
  const { data: allUsers = [], isLoading: usersLoading } = useGetAllUsers();
  const { data: banList = [] } = useGetBanList();
  const { data: warnList = [] } = useGetWarnList();
  const { data: approvals = [] } = useListApprovals();

  const adminBan = useAdminBanUser();
  const adminUnban = useAdminUnbanUser();
  const adminWarn = useAdminWarnUser();
  const promote = usePromoteUserToModerator();

  const [targetInput, setTargetInput] = useState("");
  const [copiedId, setCopiedId] = useState<string | null>(null);

  const _currentPrincipal = identity?.getPrincipal().toString() ?? "";

  const handleCopy = (text: string) => {
    navigator.clipboard.writeText(text).then(() => {
      setCopiedId(text);
      setTimeout(() => setCopiedId(null), 2000);
      toast.success("Copied to clipboard!");
    });
  };

  const parsePrincipal = (input: string): Principal | null => {
    try {
      return Principal.fromText(input.trim());
    } catch {
      return null;
    }
  };

  const handleBan = async () => {
    const p = parsePrincipal(targetInput);
    if (!p) {
      toast.error("Invalid Principal ID");
      return;
    }
    try {
      await adminBan.mutateAsync(p);
      toast.success("User banned");
      setTargetInput("");
    } catch (e: any) {
      toast.error(e?.message ?? "Failed to ban user");
    }
  };

  const handleUnban = async () => {
    const p = parsePrincipal(targetInput);
    if (!p) {
      toast.error("Invalid Principal ID");
      return;
    }
    try {
      await adminUnban.mutateAsync(p);
      toast.success("User unbanned");
      setTargetInput("");
    } catch (e: any) {
      toast.error(e?.message ?? "Failed to unban user");
    }
  };

  const handleWarn = async () => {
    const p = parsePrincipal(targetInput);
    if (!p) {
      toast.error("Invalid Principal ID");
      return;
    }
    try {
      await adminWarn.mutateAsync(p);
      toast.success("Warning issued");
      setTargetInput("");
    } catch (e: any) {
      toast.error(e?.message ?? "Failed to warn user");
    }
  };

  const handlePromote = async () => {
    const p = parsePrincipal(targetInput);
    if (!p) {
      toast.error("Invalid Principal ID");
      return;
    }
    try {
      await promote.mutateAsync(p);
      toast.success("User promoted to moderator");
      setTargetInput("");
    } catch (e: any) {
      toast.error(e?.message ?? "Failed to promote user");
    }
  };

  const isBanned = (principal: Principal) =>
    banList.some((p) => p.toString() === principal.toString());

  const isWarned = (principal: Principal) =>
    warnList.some((p) => p.toString() === principal.toString());

  return (
    <div className="min-h-screen bg-background">
      <div className="max-w-4xl mx-auto px-4 py-8">
        <div className="flex items-center gap-3 mb-8">
          <div className="w-10 h-10 rounded-full bg-primary/10 flex items-center justify-center">
            <Shield className="w-5 h-5 text-primary" />
          </div>
          <div>
            <h1 className="text-2xl font-bold text-foreground">Admin Panel</h1>
            <p className="text-sm text-muted-foreground">
              Manage users and community
            </p>
          </div>
        </div>

        <Tabs defaultValue="actions">
          <TabsList className="mb-6 flex-wrap h-auto gap-1">
            <TabsTrigger value="actions">Actions</TabsTrigger>
            <TabsTrigger value="users">All Users</TabsTrigger>
            <TabsTrigger value="principals">Principal IDs</TabsTrigger>
            <TabsTrigger value="bans">Ban List</TabsTrigger>
            <TabsTrigger value="warns">Warn List</TabsTrigger>
            <TabsTrigger value="approvals">Approvals</TabsTrigger>
          </TabsList>

          {/* Actions Tab */}
          <TabsContent value="actions">
            <div className="rounded-xl border border-border bg-card p-6 space-y-4">
              <h2 className="font-semibold text-foreground">User Actions</h2>
              <p className="text-sm text-muted-foreground">
                Enter a user's Principal ID to perform actions.
              </p>
              <Input
                value={targetInput}
                onChange={(e) => setTargetInput(e.target.value)}
                placeholder="Principal ID (e.g. aaaaa-aa)"
                className="font-mono text-sm"
              />
              <div className="flex flex-wrap gap-2">
                <Button
                  variant="destructive"
                  size="sm"
                  onClick={handleBan}
                  disabled={adminBan.isPending}
                  className="gap-1.5"
                >
                  <Ban className="w-3.5 h-3.5" />
                  Ban
                </Button>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={handleUnban}
                  disabled={adminUnban.isPending}
                  className="gap-1.5"
                >
                  <Shield className="w-3.5 h-3.5" />
                  Unban
                </Button>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={handleWarn}
                  disabled={adminWarn.isPending}
                  className="gap-1.5"
                >
                  <AlertTriangle className="w-3.5 h-3.5" />
                  Warn
                </Button>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={handlePromote}
                  disabled={promote.isPending}
                  className="gap-1.5"
                >
                  <Star className="w-3.5 h-3.5" />
                  Promote to Mod
                </Button>
              </div>
            </div>
          </TabsContent>

          {/* All Users Tab */}
          <TabsContent value="users">
            <div className="rounded-xl border border-border bg-card p-6">
              <h2 className="font-semibold text-foreground mb-4 flex items-center gap-2">
                <Users className="w-4 h-4" />
                All Registered Users
              </h2>
              {usersLoading ? (
                <div className="space-y-2">
                  {[1, 2, 3].map((i) => (
                    <div
                      key={i}
                      className="h-10 bg-muted rounded animate-pulse"
                    />
                  ))}
                </div>
              ) : allUsers.length === 0 ? (
                <p className="text-muted-foreground text-sm">
                  No users registered yet.
                </p>
              ) : (
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Username</TableHead>
                      <TableHead>Status</TableHead>
                      <TableHead>Action</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {allUsers.map(([username, principal]) => (
                      <TableRow key={principal.toString()}>
                        <TableCell className="font-medium">
                          {username}
                        </TableCell>
                        <TableCell>
                          <div className="flex gap-1 flex-wrap">
                            {isBanned(principal) && (
                              <Badge variant="destructive">Banned</Badge>
                            )}
                            {isWarned(principal) && (
                              <Badge className="bg-yellow-500 text-black">
                                Warned
                              </Badge>
                            )}
                            {!isBanned(principal) && !isWarned(principal) && (
                              <Badge variant="secondary">Active</Badge>
                            )}
                          </div>
                        </TableCell>
                        <TableCell>
                          <Button
                            size="sm"
                            variant="ghost"
                            className="h-7 px-2 text-xs font-mono"
                            onClick={() => setTargetInput(principal.toString())}
                          >
                            Use ID
                          </Button>
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              )}
            </div>
          </TabsContent>

          {/* Principal IDs Tab — Admin Only */}
          <TabsContent value="principals">
            <div className="rounded-xl border border-border bg-card p-6">
              <h2 className="font-semibold text-foreground mb-1 flex items-center gap-2">
                <Shield className="w-4 h-4 text-primary" />
                All Users — Principal IDs
              </h2>
              <p className="text-xs text-muted-foreground mb-4">
                Visible to admins only. These are the unique blockchain
                identifiers for each user.
              </p>
              {usersLoading ? (
                <div className="space-y-2">
                  {[1, 2, 3].map((i) => (
                    <div
                      key={i}
                      className="h-12 bg-muted rounded animate-pulse"
                    />
                  ))}
                </div>
              ) : allUsers.length === 0 ? (
                <p className="text-muted-foreground text-sm">
                  No users registered yet.
                </p>
              ) : (
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Username</TableHead>
                      <TableHead>Principal ID</TableHead>
                      <TableHead className="w-16">Copy</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {allUsers.map(([username, principal]) => {
                      const pidStr = principal.toString();
                      return (
                        <TableRow key={pidStr}>
                          <TableCell className="font-medium">
                            {username}
                          </TableCell>
                          <TableCell>
                            <code className="text-xs bg-muted px-2 py-1 rounded font-mono break-all">
                              {pidStr}
                            </code>
                          </TableCell>
                          <TableCell>
                            <Button
                              size="sm"
                              variant="ghost"
                              className="h-7 w-7 p-0"
                              onClick={() => handleCopy(pidStr)}
                            >
                              {copiedId === pidStr ? (
                                <Check className="w-3.5 h-3.5 text-green-500" />
                              ) : (
                                <Copy className="w-3.5 h-3.5" />
                              )}
                            </Button>
                          </TableCell>
                        </TableRow>
                      );
                    })}
                  </TableBody>
                </Table>
              )}
            </div>
          </TabsContent>

          {/* Ban List Tab */}
          <TabsContent value="bans">
            <div className="rounded-xl border border-border bg-card p-6">
              <h2 className="font-semibold text-foreground mb-4 flex items-center gap-2">
                <Ban className="w-4 h-4 text-destructive" />
                Banned Users
              </h2>
              {banList.length === 0 ? (
                <p className="text-muted-foreground text-sm">
                  No banned users.
                </p>
              ) : (
                <div className="space-y-2">
                  {banList.map((p) => {
                    const pidStr = p.toString();
                    const user = allUsers.find(
                      ([, up]) => up.toString() === pidStr,
                    );
                    return (
                      <div
                        key={pidStr}
                        className="flex items-center justify-between p-3 rounded-lg bg-muted/50"
                      >
                        <div>
                          <p className="font-medium text-sm">
                            {user?.[0] ?? "Unknown"}
                          </p>
                          <code className="text-xs text-muted-foreground font-mono">
                            {pidStr}
                          </code>
                        </div>
                        <Button
                          size="sm"
                          variant="outline"
                          onClick={() => setTargetInput(pidStr)}
                        >
                          Select
                        </Button>
                      </div>
                    );
                  })}
                </div>
              )}
            </div>
          </TabsContent>

          {/* Warn List Tab */}
          <TabsContent value="warns">
            <div className="rounded-xl border border-border bg-card p-6">
              <h2 className="font-semibold text-foreground mb-4 flex items-center gap-2">
                <AlertTriangle className="w-4 h-4 text-yellow-500" />
                Warned Users
              </h2>
              {warnList.length === 0 ? (
                <p className="text-muted-foreground text-sm">
                  No warned users.
                </p>
              ) : (
                <div className="space-y-2">
                  {warnList.map((p) => {
                    const pidStr = p.toString();
                    const user = allUsers.find(
                      ([, up]) => up.toString() === pidStr,
                    );
                    return (
                      <div
                        key={pidStr}
                        className="flex items-center justify-between p-3 rounded-lg bg-muted/50"
                      >
                        <div>
                          <p className="font-medium text-sm">
                            {user?.[0] ?? "Unknown"}
                          </p>
                          <code className="text-xs text-muted-foreground font-mono">
                            {pidStr}
                          </code>
                        </div>
                        <Button
                          size="sm"
                          variant="outline"
                          onClick={() => setTargetInput(pidStr)}
                        >
                          Select
                        </Button>
                      </div>
                    );
                  })}
                </div>
              )}
            </div>
          </TabsContent>

          {/* Approvals Tab */}
          <TabsContent value="approvals">
            <div className="rounded-xl border border-border bg-card p-6">
              <h2 className="font-semibold text-foreground mb-4 flex items-center gap-2">
                <Users className="w-4 h-4" />
                User Approvals
              </h2>
              {approvals.length === 0 ? (
                <p className="text-muted-foreground text-sm">
                  No approval requests.
                </p>
              ) : (
                <div className="space-y-2">
                  {approvals.map((approval) => {
                    const pidStr = approval.principal.toString();
                    const user = allUsers.find(
                      ([, up]) => up.toString() === pidStr,
                    );
                    return (
                      <div
                        key={pidStr}
                        className="flex items-center justify-between p-3 rounded-lg bg-muted/50"
                      >
                        <div>
                          <p className="font-medium text-sm">
                            {user?.[0] ?? "Unknown"}
                          </p>
                          <code className="text-xs text-muted-foreground font-mono">
                            {pidStr}
                          </code>
                          <Badge variant="outline" className="ml-2 text-xs">
                            {approval.status}
                          </Badge>
                        </div>
                      </div>
                    );
                  })}
                </div>
              )}
            </div>
          </TabsContent>
        </Tabs>
      </div>
    </div>
  );
}
