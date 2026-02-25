import { useState, useEffect, useRef } from 'react';
import { Users, Heart, Clock, CheckCircle, XCircle, Loader2, UserPlus, Star, MessageCircle, ChevronRight } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
import { toast } from 'sonner';
import {
  useGetFriendsModeStatus,
  useSubmitFriendsModeRequest,
  useGetCallerUserProfile,
  useSaveCallerUserProfile,
  useGetFriends,
  useGetFriendRequests,
} from '../hooks/useQueries';
import FriendsPanel from '../components/FriendsPanel';

const FRIEND_LIMIT = 1000;

export default function FriendsModePage() {
  const { data: status, isLoading: statusLoading, isFetched: statusFetched } = useGetFriendsModeStatus();
  const { data: profile, isLoading: profileLoading } = useGetCallerUserProfile();
  const submitRequest = useSubmitFriendsModeRequest();
  const saveProfile = useSaveCallerUserProfile();

  const { data: friends = [] } = useGetFriends();
  const { data: friendRequests = [] } = useGetFriendRequests();

  const [birthdate, setBirthdate] = useState('');
  const [displayName, setDisplayName] = useState('');
  const [submitted, setSubmitted] = useState(false);
  const [nameSaved, setNameSaved] = useState(false);
  const [chatPanelOpen, setChatPanelOpen] = useState(false);

  const pendingRequestCount = friendRequests.filter((r) => r.status === 'pending').length;
  const friendCount = friends.length;

  // Track previous status to detect transitions
  const prevStatusRef = useRef<string | null | undefined>(undefined);

  useEffect(() => {
    if (!statusFetched) return;
    const prev = prevStatusRef.current;
    if (prev !== undefined && prev !== status) {
      if (status === 'approved') {
        toast.success('🎉 Great news! You are eligible for Friends Mode. Welcome!', {
          duration: 6000,
        });
      } else if (status === 'denied') {
        toast.error('Sorry, your Friends Mode request was not approved at this time.', {
          duration: 6000,
        });
      }
    }
    prevStatusRef.current = status;
  }, [status, statusFetched]);

  const handleSubmitBirthdate = async () => {
    if (!birthdate.trim()) {
      toast.error('Please enter your birthdate.');
      return;
    }
    // Validate MM/DD/YYYY format
    const dateRegex = /^(0[1-9]|1[0-2])\/(0[1-9]|[12]\d|3[01])\/\d{4}$/;
    if (!dateRegex.test(birthdate)) {
      toast.error('Please enter a valid date in MM/DD/YYYY format.');
      return;
    }
    try {
      await submitRequest.mutateAsync(birthdate);
      setSubmitted(true);
      toast.success('Request submitted! The owner will review it within 1–2 days.');
    } catch (err: any) {
      toast.error(err?.message || 'Failed to submit request. Please try again.');
    }
  };

  const handleSaveDisplayName = async () => {
    if (!displayName.trim()) {
      toast.error('Please enter a display name.');
      return;
    }
    if (!profile) {
      toast.error('Profile not found.');
      return;
    }
    try {
      await saveProfile.mutateAsync({ ...profile, name: displayName.trim() });
      setNameSaved(true);
      toast.success(`Display name set to "${displayName.trim()}"!`);
    } catch (err: any) {
      toast.error(err?.message || 'Failed to save display name.');
    }
  };

  const isLoading = statusLoading || profileLoading;

  if (isLoading) {
    return (
      <div className="flex items-center justify-center py-20">
        <div className="text-center">
          <Loader2 size={40} className="animate-spin text-primary mx-auto mb-3" />
          <p className="font-nunito text-muted-foreground">Loading Friends Mode...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="max-w-lg mx-auto space-y-6">
      {/* Header */}
      <div className="text-center space-y-2">
        <div className="w-16 h-16 bg-primary/10 rounded-full flex items-center justify-center mx-auto">
          <Users size={32} className="text-primary" />
        </div>
        <h1 className="text-3xl font-fredoka text-foreground">Friends Mode</h1>
        <p className="text-muted-foreground font-nunito text-sm">
          Connect with Scrambly fans your age!
        </p>
      </div>

      {/* ── Chat Bar ── */}
      <button
        onClick={() => setChatPanelOpen(true)}
        className="w-full flex items-center gap-3 px-5 py-4 rounded-2xl bg-primary text-primary-foreground
                   shadow-md hover:bg-primary/90 active:scale-[0.98] transition-all duration-150 group"
        aria-label="Open friends chat panel"
      >
        <div className="w-9 h-9 rounded-full bg-primary-foreground/20 flex items-center justify-center shrink-0">
          <MessageCircle size={18} className="text-primary-foreground" />
        </div>
        <div className="flex-1 text-left">
          <p className="font-fredoka text-lg leading-tight">Chat with Friends</p>
          <p className="font-nunito text-xs text-primary-foreground/70 leading-tight">
            {friendCount === 0
              ? 'No friends yet — tap to see your list'
              : friendCount >= FRIEND_LIMIT
              ? `Friend limit reached (${FRIEND_LIMIT}/${FRIEND_LIMIT})`
              : `${friendCount} friend${friendCount !== 1 ? 's' : ''}${pendingRequestCount > 0 ? ` · ${pendingRequestCount} request${pendingRequestCount !== 1 ? 's' : ''}` : ''}`}
          </p>
        </div>
        {pendingRequestCount > 0 && (
          <Badge className="bg-yellow-400 text-yellow-900 font-fredoka text-xs shrink-0 border-0">
            {pendingRequestCount}
          </Badge>
        )}
        <ChevronRight size={18} className="text-primary-foreground/60 group-hover:translate-x-0.5 transition-transform shrink-0" />
      </button>

      {/* Status: Approved */}
      {status === 'approved' && (
        <div className="space-y-5">
          {/* Approval banner */}
          <div className="bg-green-500/10 border border-green-500/30 rounded-2xl p-4 flex items-start gap-3">
            <CheckCircle size={22} className="text-green-500 shrink-0 mt-0.5" />
            <div>
              <p className="font-fredoka text-green-700 dark:text-green-400 text-lg">
                🎉 You're eligible for Friends Mode!
              </p>
              <p className="font-nunito text-sm text-muted-foreground mt-0.5">
                Your request was approved. Set a display name to get started.
              </p>
            </div>
          </div>

          {/* Display name setup */}
          {!nameSaved ? (
            <div className="sonic-card p-5 space-y-4">
              <h2 className="font-fredoka text-xl text-foreground flex items-center gap-2">
                <UserPlus size={20} className="text-primary" />
                Choose Your Display Name
              </h2>
              <p className="font-nunito text-sm text-muted-foreground">
                This is the name other Scrambly friends will see.
              </p>
              <div className="space-y-2">
                <Label className="font-nunito font-700">Display Name</Label>
                <Input
                  placeholder="e.g. SonicFan2025"
                  value={displayName}
                  onChange={(e) => setDisplayName(e.target.value)}
                  className="rounded-xl font-nunito"
                  maxLength={30}
                  onKeyDown={(e) => e.key === 'Enter' && handleSaveDisplayName()}
                />
              </div>
              <Button
                onClick={handleSaveDisplayName}
                disabled={saveProfile.isPending || !displayName.trim()}
                className="rounded-full font-fredoka w-full sonic-btn-primary"
              >
                {saveProfile.isPending ? (
                  <><Loader2 size={16} className="animate-spin mr-2" /> Saving...</>
                ) : (
                  <><Star size={16} className="mr-2" /> Set Display Name</>
                )}
              </Button>
            </div>
          ) : (
            <div className="sonic-card p-5 space-y-4">
              <div className="flex items-center gap-3">
                <div className="w-12 h-12 bg-primary/10 rounded-full flex items-center justify-center">
                  <Heart size={22} className="text-primary" />
                </div>
                <div>
                  <p className="font-fredoka text-lg text-foreground">Welcome, {displayName}!</p>
                  <p className="font-nunito text-sm text-muted-foreground">
                    You're now part of Friends Mode.
                  </p>
                </div>
              </div>
              <div className="bg-primary/5 border border-primary/20 rounded-xl p-4">
                <p className="font-nunito text-sm text-foreground">
                  🌟 <strong>Friends Mode is active!</strong> You can now connect with other Scrambly fans your age. More features coming soon!
                </p>
              </div>
            </div>
          )}
        </div>
      )}

      {/* Status: Pending */}
      {(status === 'pending' || submitted) && status !== 'approved' && status !== 'denied' && (
        <div className="sonic-card p-6 space-y-4 text-center">
          <div className="w-14 h-14 bg-secondary/20 rounded-full flex items-center justify-center mx-auto">
            <Clock size={28} className="text-secondary-foreground" />
          </div>
          <div>
            <h2 className="font-fredoka text-xl text-foreground">Request Under Review</h2>
            <p className="font-nunito text-sm text-muted-foreground mt-1">
              Your Friends Mode request has been submitted and is being reviewed by the owner.
            </p>
          </div>
          <div className="bg-secondary/10 border border-secondary/20 rounded-xl p-3">
            <p className="font-nunito text-sm text-muted-foreground">
              ⏱ You will be notified within <strong>1–2 days</strong> once a decision has been made.
              This page checks for updates automatically every 30 seconds.
            </p>
          </div>
          <Badge variant="secondary" className="font-nunito">
            Status: Pending Review
          </Badge>
        </div>
      )}

      {/* Status: Denied */}
      {status === 'denied' && (
        <div className="sonic-card p-6 space-y-4 text-center">
          <div className="w-14 h-14 bg-destructive/10 rounded-full flex items-center justify-center mx-auto">
            <XCircle size={28} className="text-destructive" />
          </div>
          <div>
            <h2 className="font-fredoka text-xl text-destructive">Request Not Approved</h2>
            <p className="font-nunito text-sm text-muted-foreground mt-1">
              Sorry, your Friends Mode request was not approved at this time.
            </p>
          </div>
          <div className="bg-destructive/5 border border-destructive/20 rounded-xl p-3">
            <p className="font-nunito text-sm text-muted-foreground">
              If you believe this is a mistake, please reach out to the Scrambly owner for more information.
            </p>
          </div>
          <Badge variant="destructive" className="font-nunito">
            Status: Not Approved
          </Badge>
        </div>
      )}

      {/* Status: No request yet (null) */}
      {!status && !submitted && (
        <div className="sonic-card p-6 space-y-5">
          <div className="space-y-2">
            <h2 className="font-fredoka text-xl text-foreground flex items-center gap-2">
              <Heart size={20} className="text-primary" />
              Join Friends Mode
            </h2>
            <p className="font-nunito text-sm text-muted-foreground">
              Enter your birthdate to request access. The owner will review your request and notify you within 1–2 days.
            </p>
          </div>

          <div className="bg-primary/5 border border-primary/20 rounded-xl p-3">
            <p className="font-nunito text-xs text-muted-foreground">
              🔒 <strong>Privacy:</strong> Your birthdate is only used to match you with friends your age. It is reviewed by the owner and stored securely.
            </p>
          </div>

          <div className="space-y-2">
            <Label className="font-nunito font-700">Your Birthdate</Label>
            <Input
              placeholder="MM/DD/YYYY"
              value={birthdate}
              onChange={(e) => setBirthdate(e.target.value)}
              className="rounded-xl font-nunito text-center tracking-widest"
              maxLength={10}
              onKeyDown={(e) => e.key === 'Enter' && handleSubmitBirthdate()}
            />
            <p className="text-xs text-muted-foreground font-nunito">
              Format: MM/DD/YYYY — e.g. 06/15/2012
            </p>
          </div>

          <Button
            onClick={handleSubmitBirthdate}
            disabled={submitRequest.isPending || !birthdate.trim()}
            className="rounded-full font-fredoka w-full sonic-btn-primary"
          >
            {submitRequest.isPending ? (
              <><Loader2 size={16} className="animate-spin mr-2" /> Submitting...</>
            ) : (
              <><Users size={16} className="mr-2" /> Submit Request</>
            )}
          </Button>
        </div>
      )}

      {/* Info card */}
      <div className="bg-muted/40 rounded-2xl p-4 text-center">
        <p className="font-nunito text-xs text-muted-foreground">
          Friends Mode connects you with Scrambly fans born the same year as you. All requests are reviewed by the owner to keep the community safe. 💙
        </p>
      </div>

      {/* Friends Panel (drawer/modal) */}
      <FriendsPanel isOpen={chatPanelOpen} onClose={() => setChatPanelOpen(false)} />
    </div>
  );
}
