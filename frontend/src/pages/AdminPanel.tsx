import React, { useState } from 'react';
import { useInternetIdentity } from '../hooks/useInternetIdentity';
import { useIsCallerAdmin, useGetBanList, useGetWarnList, useAdminBanUser, useAdminWarnUser, useAdminUnbanUser, usePromoteUserToModerator, useGetAllUsers } from '../hooks/useQueries';
import { Principal } from '@dfinity/principal';
import { toast } from 'sonner';
import { Shield, Ban, AlertTriangle, UserCheck, Users, Copy } from 'lucide-react';

const ADMIN_USERNAME = 'TailsTheBeast124';

export default function AdminPanel() {
  const { identity } = useInternetIdentity();
  const { data: isAdmin, isLoading: adminLoading } = useIsCallerAdmin();
  const { data: banList = [] } = useGetBanList();
  const { data: warnList = [] } = useGetWarnList();
  const { data: allUsers = [], isLoading: usersLoading } = useGetAllUsers();

  const adminBan = useAdminBanUser();
  const adminWarn = useAdminWarnUser();
  const adminUnban = useAdminUnbanUser();
  const promote = usePromoteUserToModerator();

  const [banTarget, setBanTarget] = useState('');
  const [warnTarget, setWarnTarget] = useState('');
  const [unbanTarget, setUnbanTarget] = useState('');
  const [promoteTarget, setPromoteTarget] = useState('');
  const [activeTab, setActiveTab] = useState<'ban' | 'warn' | 'unban' | 'promote' | 'users'>('ban');

  if (adminLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background">
        <div className="animate-spin rounded-full h-10 w-10 border-b-2 border-primary" />
      </div>
    );
  }

  if (!isAdmin) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background p-4">
        <div className="text-center">
          <Shield className="w-16 h-16 text-destructive mx-auto mb-4" />
          <h1 className="text-2xl font-bold text-foreground mb-2">Access Denied</h1>
          <p className="text-muted-foreground">This panel is only accessible to administrators.</p>
        </div>
      </div>
    );
  }

  const handleBan = async () => {
    if (!banTarget.trim()) return;
    try {
      await adminBan.mutateAsync(Principal.fromText(banTarget.trim()));
      toast.success(`User ${banTarget} has been banned.`);
      setBanTarget('');
    } catch (e: any) {
      toast.error(e?.message ?? 'Failed to ban user');
    }
  };

  const handleWarn = async () => {
    if (!warnTarget.trim()) return;
    try {
      await adminWarn.mutateAsync(Principal.fromText(warnTarget.trim()));
      toast.success(`Warning issued to ${warnTarget}.`);
      setWarnTarget('');
    } catch (e: any) {
      toast.error(e?.message ?? 'Failed to warn user');
    }
  };

  const handleUnban = async () => {
    if (!unbanTarget.trim()) return;
    try {
      await adminUnban.mutateAsync(Principal.fromText(unbanTarget.trim()));
      toast.success(`User ${unbanTarget} has been unbanned.`);
      setUnbanTarget('');
    } catch (e: any) {
      toast.error(e?.message ?? 'Failed to unban user');
    }
  };

  const handlePromote = async () => {
    if (!promoteTarget.trim()) return;
    try {
      await promote.mutateAsync(Principal.fromText(promoteTarget.trim()));
      toast.success(`User ${promoteTarget} promoted to moderator.`);
      setPromoteTarget('');
    } catch (e: any) {
      toast.error(e?.message ?? 'Failed to promote user');
    }
  };

  const copyToClipboard = (text: string) => {
    navigator.clipboard.writeText(text).then(() => toast.success('Copied to clipboard!'));
  };

  const tabs = [
    { id: 'ban' as const, label: 'Ban', icon: Ban },
    { id: 'warn' as const, label: 'Warn', icon: AlertTriangle },
    { id: 'unban' as const, label: 'Unban', icon: UserCheck },
    { id: 'promote' as const, label: 'Promote', icon: Shield },
    { id: 'users' as const, label: 'All Users', icon: Users },
  ];

  return (
    <div className="min-h-screen bg-background p-4 md:p-8">
      <div className="max-w-4xl mx-auto">
        <div className="flex items-center gap-3 mb-8">
          <Shield className="w-8 h-8 text-primary" />
          <div>
            <h1 className="text-3xl font-bold text-foreground">Admin Panel</h1>
            <p className="text-muted-foreground text-sm">Welcome, {ADMIN_USERNAME}</p>
          </div>
        </div>

        {/* Stats */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-8">
          <div className="bg-card border border-border rounded-xl p-4 text-center">
            <div className="text-2xl font-bold text-destructive">{banList.length.toLocaleString()}</div>
            <div className="text-xs text-muted-foreground mt-1">Banned Users</div>
          </div>
          <div className="bg-card border border-border rounded-xl p-4 text-center">
            <div className="text-2xl font-bold text-warning">{warnList.length.toLocaleString()}</div>
            <div className="text-xs text-muted-foreground mt-1">Warned Users</div>
          </div>
          <div className="bg-card border border-border rounded-xl p-4 text-center">
            <div className="text-2xl font-bold text-primary">{allUsers.length.toLocaleString()}</div>
            <div className="text-xs text-muted-foreground mt-1">Total Users</div>
          </div>
          <div className="bg-card border border-border rounded-xl p-4 text-center">
            <div className="text-2xl font-bold text-success">Active</div>
            <div className="text-xs text-muted-foreground mt-1">System Status</div>
          </div>
        </div>

        {/* Tabs */}
        <div className="flex gap-2 mb-6 flex-wrap">
          {tabs.map(({ id, label, icon: Icon }) => (
            <button
              key={id}
              onClick={() => setActiveTab(id)}
              className={`flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-medium transition ${
                activeTab === id
                  ? 'bg-primary text-primary-foreground'
                  : 'bg-card border border-border text-foreground hover:bg-muted'
              }`}
            >
              <Icon className="w-4 h-4" />
              {label}
            </button>
          ))}
        </div>

        {/* Tab Content */}
        <div className="bg-card border border-border rounded-2xl p-6">
          {activeTab === 'ban' && (
            <div className="space-y-4">
              <h2 className="text-lg font-semibold text-foreground flex items-center gap-2">
                <Ban className="w-5 h-5 text-destructive" /> Ban User
              </h2>
              <input
                type="text"
                value={banTarget}
                onChange={(e) => setBanTarget(e.target.value)}
                placeholder="Enter Principal ID to ban"
                className="w-full px-4 py-2 rounded-lg border border-border bg-background text-foreground focus:outline-none focus:ring-2 focus:ring-primary"
              />
              <button
                onClick={handleBan}
                disabled={adminBan.isPending || !banTarget.trim()}
                className="px-6 py-2 bg-destructive text-white rounded-lg font-medium hover:opacity-90 transition disabled:opacity-50"
              >
                {adminBan.isPending ? 'Banning...' : 'Ban User'}
              </button>
              {banList.length > 0 && (
                <div className="mt-4">
                  <h3 className="text-sm font-medium text-muted-foreground mb-2">Currently Banned ({banList.length})</h3>
                  <div className="space-y-1 max-h-48 overflow-y-auto">
                    {banList.map((p, i) => (
                      <div key={i} className="text-xs font-mono bg-muted rounded px-3 py-1 text-foreground truncate">
                        {p.toString()}
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>
          )}

          {activeTab === 'warn' && (
            <div className="space-y-4">
              <h2 className="text-lg font-semibold text-foreground flex items-center gap-2">
                <AlertTriangle className="w-5 h-5 text-warning" /> Warn User
              </h2>
              <input
                type="text"
                value={warnTarget}
                onChange={(e) => setWarnTarget(e.target.value)}
                placeholder="Enter Principal ID to warn"
                className="w-full px-4 py-2 rounded-lg border border-border bg-background text-foreground focus:outline-none focus:ring-2 focus:ring-primary"
              />
              <button
                onClick={handleWarn}
                disabled={adminWarn.isPending || !warnTarget.trim()}
                className="px-6 py-2 bg-warning text-white rounded-lg font-medium hover:opacity-90 transition disabled:opacity-50"
              >
                {adminWarn.isPending ? 'Warning...' : 'Issue Warning'}
              </button>
              {warnList.length > 0 && (
                <div className="mt-4">
                  <h3 className="text-sm font-medium text-muted-foreground mb-2">Currently Warned ({warnList.length})</h3>
                  <div className="space-y-1 max-h-48 overflow-y-auto">
                    {warnList.map((p, i) => (
                      <div key={i} className="text-xs font-mono bg-muted rounded px-3 py-1 text-foreground truncate">
                        {p.toString()}
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>
          )}

          {activeTab === 'unban' && (
            <div className="space-y-4">
              <h2 className="text-lg font-semibold text-foreground flex items-center gap-2">
                <UserCheck className="w-5 h-5 text-success" /> Unban User
              </h2>
              <input
                type="text"
                value={unbanTarget}
                onChange={(e) => setUnbanTarget(e.target.value)}
                placeholder="Enter Principal ID to unban"
                className="w-full px-4 py-2 rounded-lg border border-border bg-background text-foreground focus:outline-none focus:ring-2 focus:ring-primary"
              />
              <button
                onClick={handleUnban}
                disabled={adminUnban.isPending || !unbanTarget.trim()}
                className="px-6 py-2 bg-success text-white rounded-lg font-medium hover:opacity-90 transition disabled:opacity-50"
              >
                {adminUnban.isPending ? 'Unbanning...' : 'Unban User'}
              </button>
            </div>
          )}

          {activeTab === 'promote' && (
            <div className="space-y-4">
              <h2 className="text-lg font-semibold text-foreground flex items-center gap-2">
                <Shield className="w-5 h-5 text-primary" /> Promote to Moderator
              </h2>
              <input
                type="text"
                value={promoteTarget}
                onChange={(e) => setPromoteTarget(e.target.value)}
                placeholder="Enter Principal ID to promote"
                className="w-full px-4 py-2 rounded-lg border border-border bg-background text-foreground focus:outline-none focus:ring-2 focus:ring-primary"
              />
              <button
                onClick={handlePromote}
                disabled={promote.isPending || !promoteTarget.trim()}
                className="px-6 py-2 bg-primary text-primary-foreground rounded-lg font-medium hover:opacity-90 transition disabled:opacity-50"
              >
                {promote.isPending ? 'Promoting...' : 'Promote User'}
              </button>
            </div>
          )}

          {activeTab === 'users' && (
            <div className="space-y-4">
              <h2 className="text-lg font-semibold text-foreground flex items-center gap-2">
                <Users className="w-5 h-5 text-primary" /> All Users & Principal IDs
              </h2>
              <p className="text-xs text-muted-foreground">This section is visible to admins only.</p>
              {usersLoading ? (
                <div className="flex items-center justify-center py-8">
                  <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary" />
                </div>
              ) : allUsers.length === 0 ? (
                <p className="text-muted-foreground text-sm">No users registered yet.</p>
              ) : (
                <div className="overflow-x-auto">
                  <table className="w-full text-sm">
                    <thead>
                      <tr className="border-b border-border">
                        <th className="text-left py-2 px-3 text-muted-foreground font-medium">Username</th>
                        <th className="text-left py-2 px-3 text-muted-foreground font-medium">Principal ID</th>
                        <th className="py-2 px-3 text-muted-foreground font-medium">Copy</th>
                      </tr>
                    </thead>
                    <tbody>
                      {allUsers.map(([username, principal], i) => (
                        <tr key={i} className="border-b border-border/50 hover:bg-muted/30 transition">
                          <td className="py-2 px-3 font-medium text-foreground">{username}</td>
                          <td className="py-2 px-3 font-mono text-xs text-muted-foreground break-all">
                            {principal.toString()}
                          </td>
                          <td className="py-2 px-3 text-center">
                            <button
                              onClick={() => copyToClipboard(principal.toString())}
                              className="p-1 rounded hover:bg-muted transition"
                              title="Copy Principal ID"
                            >
                              <Copy className="w-4 h-4 text-muted-foreground" />
                            </button>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              )}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
