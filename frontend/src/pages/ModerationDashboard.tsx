import { useState } from 'react';
import {
  useGetCommunityPosts,
  useIssueWarning,
  useIsCallerAdmin,
  useGetAllFriendsModeRequests,
  useReviewFriendsModeRequest,
  useGetAllIdeas,
  useMarkIdeaReviewed,
} from '../hooks/useQueries';
import { useActor } from '../hooks/useActor';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Badge } from '@/components/ui/badge';
import {
  Shield,
  AlertTriangle,
  Lock,
  Zap,
  Users,
  Heart,
  CheckCircle,
  XCircle,
  Loader2,
  Clock,
  Lightbulb,
} from 'lucide-react';
import { toast } from 'sonner';
import { Principal } from '@dfinity/principal';
import { formatDistanceToNow } from 'date-fns';

export default function ModerationDashboard() {
  const { data: isAdmin, isLoading: adminLoading } = useIsCallerAdmin();
  const { data: posts, isLoading: postsLoading } = useGetCommunityPosts();
  const { data: friendsRequests, isLoading: friendsLoading } = useGetAllFriendsModeRequests();
  const { data: allIdeas, isLoading: ideasLoading } = useGetAllIdeas();
  const issueWarning = useIssueWarning();
  const reviewFriendsRequest = useReviewFriendsModeRequest();
  const markIdeaReviewed = useMarkIdeaReviewed();
  const { actor } = useActor();

  const [targetPrincipal, setTargetPrincipal] = useState('');
  const [reason, setReason] = useState('');
  const [issuingFor, setIssuingFor] = useState<string | null>(null);
  const [reviewingPrincipal, setReviewingPrincipal] = useState<string | null>(null);
  const [markingIdeaIndex, setMarkingIdeaIndex] = useState<number | null>(null);

  if (adminLoading) {
    return (
      <div className="flex items-center justify-center py-20">
        <div className="text-center">
          <Zap size={40} className="animate-spin text-primary mx-auto mb-3" />
          <p className="font-nunito text-muted-foreground">Checking permissions...</p>
        </div>
      </div>
    );
  }

  if (!isAdmin) {
    return (
      <div className="flex flex-col items-center justify-center py-20 gap-4">
        <div className="w-20 h-20 bg-destructive/10 rounded-full flex items-center justify-center">
          <Lock size={40} className="text-destructive" />
        </div>
        <h2 className="text-3xl font-fredoka text-destructive">Access Denied</h2>
        <p className="text-muted-foreground font-nunito text-center max-w-sm">
          This area is for Scrambly moderators only. You don't have permission to access this page.
        </p>
      </div>
    );
  }

  const handleIssueWarning = async (principalStr: string, warningReason: string) => {
    if (!principalStr.trim() || !warningReason.trim()) {
      toast.error('Please provide both a principal ID and a reason.');
      return;
    }

    try {
      const target = Principal.fromText(principalStr.trim());
      const newCount = await issueWarning.mutateAsync({ target, reason: warningReason.trim() });
      toast.success(`Warning issued! User now has ${Number(newCount)} warning(s).`);
      if (principalStr === targetPrincipal) {
        setTargetPrincipal('');
        setReason('');
      }
      setIssuingFor(null);
    } catch (err) {
      toast.error('Failed to issue warning. Check the principal ID and try again.');
    }
  };

  const handleQuickWarn = (authorStr: string) => {
    setIssuingFor(authorStr);
    setTargetPrincipal(authorStr);
    setReason('');
  };

  const handleReviewFriendsRequest = async (principal: string, status: 'approved' | 'denied') => {
    setReviewingPrincipal(principal + status);
    try {
      const success = await reviewFriendsRequest.mutateAsync({ principal, status });
      if (success) {
        toast.success(`Request ${status === 'approved' ? 'approved' : 'denied'} successfully.`);
      } else {
        toast.error('Request not found. It may have already been reviewed.');
      }
    } catch (err) {
      toast.error('Failed to review request. Please try again.');
    } finally {
      setReviewingPrincipal(null);
    }
  };

  const handleMarkIdeaReviewed = async (index: number) => {
    setMarkingIdeaIndex(index);
    try {
      await markIdeaReviewed.mutateAsync(BigInt(index));
      toast.success('Idea marked as reviewed.');
    } catch {
      toast.error('Failed to mark idea as reviewed.');
    } finally {
      setMarkingIdeaIndex(null);
    }
  };

  const pendingFriendsRequests = friendsRequests?.filter((r) => r.status === 'pending') ?? [];
  const reviewedFriendsRequests = friendsRequests?.filter((r) => r.status !== 'pending') ?? [];
  const unreviewedIdeas = allIdeas?.filter((idea) => !idea.reviewed) ?? [];
  const reviewedIdeas = allIdeas?.filter((idea) => idea.reviewed) ?? [];

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center gap-3">
        <div className="w-12 h-12 bg-destructive/10 rounded-2xl flex items-center justify-center">
          <Shield size={24} className="text-destructive" />
        </div>
        <div>
          <h1 className="text-3xl font-fredoka text-foreground">Moderation Dashboard</h1>
          <p className="text-muted-foreground font-nunito text-sm">Admin-only moderation tools</p>
        </div>
        <Badge variant="destructive" className="ml-auto font-nunito font-700">Admin</Badge>
      </div>

      {/* ── Friends Mode Requests ─────────────────────────────────────────── */}
      <div className="space-y-3">
        <h2 className="font-fredoka text-xl text-foreground flex items-center gap-2">
          <Heart size={20} className="text-primary" />
          Friends Mode Requests
          {pendingFriendsRequests.length > 0 && (
            <Badge className="font-nunito ml-1 bg-primary text-primary-foreground">
              {pendingFriendsRequests.length} pending
            </Badge>
          )}
        </h2>

        {friendsLoading ? (
          <div className="sonic-card p-6 flex items-center justify-center gap-2 text-muted-foreground">
            <Loader2 size={18} className="animate-spin" />
            <span className="font-nunito text-sm">Loading requests...</span>
          </div>
        ) : pendingFriendsRequests.length === 0 ? (
          <div className="sonic-card p-6 text-center text-muted-foreground font-nunito text-sm">
            No pending Friends Mode requests.
          </div>
        ) : (
          <div className="space-y-3">
            {pendingFriendsRequests.map((req) => {
              const submittedDate = new Date(Number(req.submittedAt) / 1_000_000);
              const shortPrincipal = req.principal.slice(0, 14) + '...';
              const isApproving = reviewingPrincipal === req.principal + 'approved';
              const isDenying = reviewingPrincipal === req.principal + 'denied';

              return (
                <div key={req.principal} className="sonic-card p-4 space-y-3">
                  <div className="flex items-start justify-between gap-3 flex-wrap">
                    <div className="space-y-1">
                      <div className="flex items-center gap-2 flex-wrap">
                        <span className="text-xs font-nunito font-700 text-primary bg-primary/10 px-2 py-0.5 rounded-full">
                          {shortPrincipal}
                        </span>
                        <Badge variant="secondary" className="font-nunito text-xs">
                          <Clock size={10} className="mr-1" />
                          Pending
                        </Badge>
                      </div>
                      <p className="font-nunito text-sm text-foreground">
                        🎂 Birthdate: <strong>{req.birthdate}</strong>
                      </p>
                      <p className="font-nunito text-xs text-muted-foreground">
                        Submitted {formatDistanceToNow(submittedDate, { addSuffix: true })}
                      </p>
                    </div>
                    <div className="flex gap-2 shrink-0">
                      <Button
                        size="sm"
                        onClick={() => handleReviewFriendsRequest(req.principal, 'approved')}
                        disabled={isApproving || isDenying}
                        className="rounded-full font-nunito text-xs bg-green-600 hover:bg-green-700 text-white"
                      >
                        {isApproving ? (
                          <Loader2 size={12} className="animate-spin mr-1" />
                        ) : (
                          <CheckCircle size={12} className="mr-1" />
                        )}
                        Approve
                      </Button>
                      <Button
                        size="sm"
                        variant="destructive"
                        onClick={() => handleReviewFriendsRequest(req.principal, 'denied')}
                        disabled={isApproving || isDenying}
                        className="rounded-full font-nunito text-xs"
                      >
                        {isDenying ? (
                          <Loader2 size={12} className="animate-spin mr-1" />
                        ) : (
                          <XCircle size={12} className="mr-1" />
                        )}
                        Deny
                      </Button>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        )}

        {/* Reviewed requests */}
        {reviewedFriendsRequests.length > 0 && (
          <details className="sonic-card p-4">
            <summary className="font-nunito font-700 text-sm text-muted-foreground cursor-pointer select-none">
              Show {reviewedFriendsRequests.length} reviewed request(s)
            </summary>
            <div className="mt-3 space-y-2">
              {reviewedFriendsRequests.map((req) => {
                const shortPrincipal = req.principal.slice(0, 14) + '...';
                return (
                  <div key={req.principal} className="flex items-center justify-between gap-2 py-1.5 border-b border-border last:border-0">
                    <span className="text-xs font-nunito text-muted-foreground">{shortPrincipal}</span>
                    <div className="flex items-center gap-2">
                      <span className="text-xs font-nunito text-muted-foreground">{req.birthdate}</span>
                      <Badge
                        variant={req.status === 'approved' ? 'default' : 'destructive'}
                        className="font-nunito text-xs capitalize"
                      >
                        {req.status}
                      </Badge>
                    </div>
                  </div>
                );
              })}
            </div>
          </details>
        )}
      </div>

      {/* ── Ideas Review ──────────────────────────────────────────────────── */}
      <div className="space-y-3">
        <h2 className="font-fredoka text-xl text-foreground flex items-center gap-2">
          <Lightbulb size={20} className="text-primary" />
          Ideas Review
          {unreviewedIdeas.length > 0 && (
            <Badge className="font-nunito ml-1 bg-primary text-primary-foreground">
              {unreviewedIdeas.length} new
            </Badge>
          )}
        </h2>

        {ideasLoading ? (
          <div className="sonic-card p-6 flex items-center justify-center gap-2 text-muted-foreground">
            <Loader2 size={18} className="animate-spin" />
            <span className="font-nunito text-sm">Loading ideas...</span>
          </div>
        ) : !allIdeas || allIdeas.length === 0 ? (
          <div className="sonic-card p-6 text-center text-muted-foreground font-nunito text-sm">
            No ideas submitted yet.
          </div>
        ) : (
          <div className="space-y-3">
            {unreviewedIdeas.map((idea, i) => {
              const globalIndex = allIdeas.indexOf(idea);
              const submittedDate = new Date(Number(idea.timestamp) / 1_000_000);
              const isMarking = markingIdeaIndex === globalIndex;

              return (
                <div key={i} className="sonic-card p-4 space-y-3">
                  <div className="flex items-start justify-between gap-3 flex-wrap">
                    <div className="space-y-1 flex-1">
                      <div className="flex items-center gap-2 flex-wrap">
                        <span className="text-xs font-nunito font-700 text-primary bg-primary/10 px-2 py-0.5 rounded-full">
                          {idea.author}
                        </span>
                        <span className="text-xs text-muted-foreground font-nunito">
                          {formatDistanceToNow(submittedDate, { addSuffix: true })}
                        </span>
                        <Badge variant="secondary" className="font-nunito text-xs">New</Badge>
                      </div>
                      <p className="font-nunito text-sm text-foreground leading-relaxed mt-1">
                        {idea.content}
                      </p>
                    </div>
                    <Button
                      size="sm"
                      onClick={() => handleMarkIdeaReviewed(globalIndex)}
                      disabled={isMarking}
                      className="rounded-full font-nunito text-xs shrink-0 bg-green-600 hover:bg-green-700 text-white"
                    >
                      {isMarking ? (
                        <Loader2 size={12} className="animate-spin mr-1" />
                      ) : (
                        <CheckCircle size={12} className="mr-1" />
                      )}
                      Mark Reviewed
                    </Button>
                  </div>
                </div>
              );
            })}

            {reviewedIdeas.length > 0 && (
              <details className="sonic-card p-4">
                <summary className="font-nunito font-700 text-sm text-muted-foreground cursor-pointer select-none">
                  Show {reviewedIdeas.length} reviewed idea(s)
                </summary>
                <div className="mt-3 space-y-2">
                  {reviewedIdeas.map((idea, i) => {
                    const submittedDate = new Date(Number(idea.timestamp) / 1_000_000);
                    return (
                      <div key={i} className="py-2 border-b border-border last:border-0 space-y-1">
                        <div className="flex items-center gap-2 flex-wrap">
                          <span className="text-xs font-nunito font-700 text-muted-foreground">{idea.author}</span>
                          <span className="text-xs text-muted-foreground font-nunito">
                            {formatDistanceToNow(submittedDate, { addSuffix: true })}
                          </span>
                          <Badge variant="outline" className="font-nunito text-xs">Reviewed</Badge>
                        </div>
                        <p className="font-nunito text-xs text-muted-foreground leading-relaxed">{idea.content}</p>
                      </div>
                    );
                  })}
                </div>
              </details>
            )}
          </div>
        )}
      </div>

      {/* ── Issue Warning Form ────────────────────────────────────────────── */}
      <div className="sonic-card p-5 space-y-4">
        <h2 className="font-fredoka text-xl text-foreground flex items-center gap-2">
          <AlertTriangle size={20} className="text-destructive" />
          Issue Warning
        </h2>
        <div className="space-y-3">
          <div>
            <Label className="font-nunito font-700">User Principal ID</Label>
            <Input
              placeholder="e.g. aaaaa-aa or full principal..."
              value={targetPrincipal}
              onChange={(e) => setTargetPrincipal(e.target.value)}
              className="mt-1 rounded-xl font-nunito text-sm"
            />
          </div>
          <div>
            <Label className="font-nunito font-700">Reason</Label>
            <Textarea
              placeholder="Describe the violation..."
              value={reason}
              onChange={(e) => setReason(e.target.value)}
              className="mt-1 rounded-xl font-nunito resize-none text-sm"
              rows={2}
              maxLength={200}
            />
          </div>
          <Button
            onClick={() => handleIssueWarning(targetPrincipal, reason)}
            disabled={issueWarning.isPending || !targetPrincipal.trim() || !reason.trim()}
            variant="destructive"
            className="rounded-full font-fredoka"
          >
            <AlertTriangle size={14} className="mr-1" />
            {issueWarning.isPending ? 'Issuing...' : 'Issue Warning'}
          </Button>
        </div>
      </div>

      {/* Warning Info */}
      <div className="bg-destructive/5 border border-destructive/20 rounded-2xl p-4">
        <p className="text-sm font-nunito text-muted-foreground">
          <strong className="text-destructive">⚠️ Warning System:</strong> Users receive warnings for violating community guidelines.
          After <strong>3 warnings</strong>, their account is automatically locked and they must create a new account.
        </p>
      </div>

      {/* ── Community Posts for Review ────────────────────────────────────── */}
      <div>
        <h2 className="font-fredoka text-xl text-foreground mb-3 flex items-center gap-2">
          <Users size={20} className="text-primary" />
          Community Posts
        </h2>

        {postsLoading ? (
          <div className="space-y-3">
            {Array.from({ length: 4 }).map((_, i) => (
              <div key={i} className="sonic-card p-4 animate-pulse">
                <div className="h-3 bg-muted rounded-full w-1/4 mb-2" />
                <div className="h-4 bg-muted rounded-full w-full mb-1" />
                <div className="h-4 bg-muted rounded-full w-2/3" />
              </div>
            ))}
          </div>
        ) : !posts || posts.length === 0 ? (
          <div className="sonic-card p-8 text-center text-muted-foreground font-nunito">
            No community posts yet.
          </div>
        ) : (
          <div className="space-y-3">
            {posts.map((post, i) => {
              const timestamp = Number(post.timestamp) / 1_000_000;
              const date = new Date(timestamp);
              const authorStr = post.author.toString();
              const authorShort = authorStr.slice(0, 12) + '...';

              return (
                <div key={i} className="sonic-card p-4">
                  <div className="flex items-start justify-between gap-3 mb-2">
                    <div className="flex items-center gap-2 flex-wrap">
                      <span className="text-xs font-nunito font-700 text-primary bg-primary/10 px-2 py-0.5 rounded-full">
                        {authorShort}
                      </span>
                      <span className="text-xs text-muted-foreground font-nunito">
                        {formatDistanceToNow(date, { addSuffix: true })}
                      </span>
                    </div>
                    <Button
                      size="sm"
                      variant="destructive"
                      onClick={() => handleQuickWarn(authorStr)}
                      className="rounded-full font-nunito text-xs shrink-0"
                    >
                      <AlertTriangle size={12} className="mr-1" />
                      Warn
                    </Button>
                  </div>
                  <p className="font-nunito text-foreground text-sm leading-relaxed">{post.message}</p>

                  {/* Quick warn form for this post */}
                  {issuingFor === authorStr && (
                    <div className="mt-3 pt-3 border-t border-border space-y-2">
                      <Textarea
                        placeholder="Reason for warning..."
                        value={reason}
                        onChange={(e) => setReason(e.target.value)}
                        className="rounded-xl font-nunito resize-none text-sm"
                        rows={2}
                        maxLength={200}
                        autoFocus
                      />
                      <div className="flex gap-2">
                        <Button
                          size="sm"
                          variant="destructive"
                          onClick={() => handleIssueWarning(authorStr, reason)}
                          disabled={issueWarning.isPending || !reason.trim()}
                          className="rounded-full font-nunito text-xs"
                        >
                          Confirm Warning
                        </Button>
                        <Button
                          size="sm"
                          variant="outline"
                          onClick={() => { setIssuingFor(null); setReason(''); }}
                          className="rounded-full font-nunito text-xs"
                        >
                          Cancel
                        </Button>
                      </div>
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
}
