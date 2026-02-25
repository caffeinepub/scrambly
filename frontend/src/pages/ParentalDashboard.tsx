import { useState } from 'react';
import { useGetCallerUserProfile, useSetRemainingUsageTime } from '../hooks/useQueries';
import { useIsCallerAdmin } from '../hooks/useQueries';
import { useInternetIdentity } from '../hooks/useInternetIdentity';
import PINEntryModal from '../components/PINEntryModal';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Slider } from '@/components/ui/slider';
import { Shield, Clock, Lock, Zap, User } from 'lucide-react';
import { toast } from 'sonner';
import { Principal } from '@dfinity/principal';
import { getAge } from '../components/KidModeWrapper';

export default function ParentalDashboard() {
  const [pinUnlocked, setPinUnlocked] = useState(false);
  const [showPinModal, setShowPinModal] = useState(false);
  const [targetPrincipal, setTargetPrincipal] = useState('');
  const [timeMinutes, setTimeMinutes] = useState(60);

  const { data: profile } = useGetCallerUserProfile();
  const { data: isAdmin } = useIsCallerAdmin();
  const { identity } = useInternetIdentity();
  const setUsageTime = useSetRemainingUsageTime();

  const userAge = getAge(profile);
  const usageRemaining = profile?.usageTimeRemaining !== undefined && profile.usageTimeRemaining !== null
    ? Number(profile.usageTimeRemaining)
    : null;

  const formatTime = (secs: number) => {
    const h = Math.floor(secs / 3600);
    const m = Math.floor((secs % 3600) / 60);
    const s = secs % 60;
    if (h > 0) return `${h}h ${m}m`;
    if (m > 0) return `${m}m ${s}s`;
    return `${s}s`;
  };

  const handleSetTime = async () => {
    if (!targetPrincipal.trim()) {
      toast.error('Please enter a user principal ID.');
      return;
    }
    try {
      const user = Principal.fromText(targetPrincipal.trim());
      const seconds = BigInt(timeMinutes * 60);
      await setUsageTime.mutateAsync({ user, timeRemaining: seconds });
      toast.success(`Usage time set to ${timeMinutes} minutes!`);
      setTargetPrincipal('');
    } catch (err) {
      toast.error('Failed to set usage time. Check the principal ID.');
    }
  };

  const handleSetMyTime = async () => {
    if (!identity) {
      toast.error('Not logged in.');
      return;
    }
    try {
      const user = identity.getPrincipal();
      const seconds = BigInt(timeMinutes * 60);
      await setUsageTime.mutateAsync({ user, timeRemaining: seconds });
      toast.success(`Your usage time set to ${timeMinutes} minutes!`);
    } catch (err) {
      toast.error('Failed to set usage time. Admin access required.');
    }
  };

  if (!pinUnlocked) {
    return (
      <div className="space-y-6">
        <div className="flex items-center gap-3">
          <div className="w-12 h-12 bg-secondary/20 rounded-2xl flex items-center justify-center">
            <img
              src="/assets/generated/parental-shield-icon.dim_128x128.png"
              alt="Parental Controls"
              className="w-10 h-10 object-contain"
            />
          </div>
          <div>
            <h1 className="text-3xl font-fredoka text-foreground">Parental Controls</h1>
            <p className="text-muted-foreground font-nunito text-sm">PIN-protected parent dashboard</p>
          </div>
        </div>

        <div className="sonic-card p-8 text-center max-w-md mx-auto">
          <div className="w-20 h-20 bg-primary/10 rounded-full flex items-center justify-center mx-auto mb-4">
            <Lock size={40} className="text-primary" />
          </div>
          <h2 className="text-2xl font-fredoka text-foreground mb-2">Parent Access Required</h2>
          <p className="text-muted-foreground font-nunito text-sm mb-6">
            This area is for parents and guardians only. Enter your PIN to access parental controls.
          </p>
          <Button
            onClick={() => setShowPinModal(true)}
            className="w-full rounded-full font-fredoka text-lg bg-primary text-primary-foreground"
          >
            <Shield size={16} className="mr-2" />
            Enter Parent PIN
          </Button>
          <p className="text-xs text-muted-foreground font-nunito mt-3">
            Default PIN: 1234 (change it after first login)
          </p>
        </div>

        <PINEntryModal
          open={showPinModal}
          onSuccess={() => { setPinUnlocked(true); setShowPinModal(false); }}
          onClose={() => setShowPinModal(false)}
        />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between flex-wrap gap-3">
        <div className="flex items-center gap-3">
          <img
            src="/assets/generated/parental-shield-icon.dim_128x128.png"
            alt="Parental Controls"
            className="w-12 h-12 object-contain"
          />
          <div>
            <h1 className="text-3xl font-fredoka text-foreground">Parental Controls</h1>
            <p className="text-muted-foreground font-nunito text-sm">Manage your child's Scrambly experience</p>
          </div>
        </div>
        <Button
          variant="outline"
          onClick={() => setPinUnlocked(false)}
          className="rounded-full font-nunito font-700 text-sm"
        >
          <Lock size={14} className="mr-1" /> Lock Dashboard
        </Button>
      </div>

      {/* Current User Stats */}
      {profile && (
        <div className="sonic-card p-5">
          <h2 className="font-fredoka text-lg text-foreground mb-3 flex items-center gap-2">
            <User size={18} className="text-primary" />
            Current User Stats
          </h2>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            <div className="bg-muted rounded-xl p-3 text-center">
              <p className="text-xs text-muted-foreground font-nunito uppercase tracking-wide mb-1">Name</p>
              <p className="font-fredoka text-foreground">{profile.name}</p>
            </div>
            <div className="bg-muted rounded-xl p-3 text-center">
              <p className="text-xs text-muted-foreground font-nunito uppercase tracking-wide mb-1">Age</p>
              <p className="font-fredoka text-foreground">{userAge !== null ? `${userAge} yrs` : 'N/A'}</p>
            </div>
            <div className="bg-muted rounded-xl p-3 text-center">
              <p className="text-xs text-muted-foreground font-nunito uppercase tracking-wide mb-1">Warnings</p>
              <p className={`font-fredoka ${Number(profile.warnings) > 0 ? 'text-destructive' : 'text-foreground'}`}>
                {Number(profile.warnings)} / 3
              </p>
            </div>
            <div className="bg-muted rounded-xl p-3 text-center">
              <p className="text-xs text-muted-foreground font-nunito uppercase tracking-wide mb-1">Time Left</p>
              <p className="font-fredoka text-foreground">
                {usageRemaining !== null ? formatTime(usageRemaining) : 'Unlimited'}
              </p>
            </div>
          </div>
          {userAge !== null && userAge <= 12 && (
            <div className="mt-3 bg-secondary/20 rounded-xl p-3 flex items-center gap-2">
              <Zap size={16} className="text-secondary-foreground" />
              <p className="text-sm font-nunito font-700 text-secondary-foreground">
                Kid Mode is active for this user (age {userAge})
              </p>
            </div>
          )}
        </div>
      )}

      {/* Set My Own Timer */}
      <div className="sonic-card p-5 space-y-4">
        <h2 className="font-fredoka text-xl text-foreground flex items-center gap-2">
          <Clock size={20} className="text-primary" />
          Set My Usage Timer
        </h2>
        <p className="text-sm font-nunito text-muted-foreground">
          Set a daily screen time limit for your own account.
        </p>
        <div className="space-y-3">
          <div className="flex items-center justify-between">
            <Label className="font-nunito font-700">Time Limit</Label>
            <span className="font-fredoka text-primary text-lg">{timeMinutes} min</span>
          </div>
          <Slider
            value={[timeMinutes]}
            onValueChange={(v) => setTimeMinutes(v[0])}
            min={5}
            max={240}
            step={5}
            className="w-full"
          />
          <div className="flex justify-between text-xs text-muted-foreground font-nunito">
            <span>5 min</span>
            <span>1 hour</span>
            <span>2 hours</span>
            <span>4 hours</span>
          </div>
          <Button
            onClick={handleSetMyTime}
            disabled={setUsageTime.isPending || !isAdmin}
            className="w-full rounded-full font-fredoka bg-primary text-primary-foreground"
          >
            <Clock size={14} className="mr-1" />
            {setUsageTime.isPending ? 'Setting...' : `Set ${timeMinutes} Minute Timer`}
          </Button>
          {!isAdmin && (
            <p className="text-xs text-muted-foreground font-nunito text-center">
              Admin access required to set usage timers.
            </p>
          )}
        </div>
      </div>

      {/* Set Timer for Another User (Admin only) */}
      {isAdmin && (
        <div className="sonic-card p-5 space-y-4">
          <h2 className="font-fredoka text-xl text-foreground flex items-center gap-2">
            <Shield size={20} className="text-destructive" />
            Set Timer for Another User
          </h2>
          <p className="text-sm font-nunito text-muted-foreground">
            Admin: Set a usage time limit for any user by their principal ID.
          </p>
          <div className="space-y-3">
            <div>
              <Label className="font-nunito font-700">User Principal ID</Label>
              <Input
                placeholder="Enter user's principal ID..."
                value={targetPrincipal}
                onChange={(e) => setTargetPrincipal(e.target.value)}
                className="mt-1 rounded-xl font-nunito text-sm"
              />
            </div>
            <div className="flex items-center justify-between">
              <Label className="font-nunito font-700">Time Limit</Label>
              <span className="font-fredoka text-primary text-lg">{timeMinutes} min</span>
            </div>
            <Slider
              value={[timeMinutes]}
              onValueChange={(v) => setTimeMinutes(v[0])}
              min={5}
              max={240}
              step={5}
              className="w-full"
            />
            <Button
              onClick={handleSetTime}
              disabled={setUsageTime.isPending || !targetPrincipal.trim()}
              variant="destructive"
              className="w-full rounded-full font-fredoka"
            >
              <Clock size={14} className="mr-1" />
              {setUsageTime.isPending ? 'Setting...' : `Set ${timeMinutes} Min for User`}
            </Button>
          </div>
        </div>
      )}

      {/* Kid Mode Info */}
      <div className="bg-secondary/10 border border-secondary/30 rounded-2xl p-4 space-y-2">
        <h3 className="font-nunito font-700 text-foreground flex items-center gap-2">
          <Zap size={16} className="text-secondary-foreground" />
          Kid Mode (Ages 10–12)
        </h3>
        <ul className="text-sm font-nunito text-muted-foreground space-y-1 list-disc list-inside">
          <li>Automatically activated for users aged 10–12</li>
          <li>Community features are hidden</li>
          <li>Only age-appropriate games and search are shown</li>
          <li>A "Kid Mode Active" banner is displayed</li>
        </ul>
      </div>

      {/* Safety Tips */}
      <div className="bg-primary/5 border border-primary/20 rounded-2xl p-4 space-y-2">
        <h3 className="font-nunito font-700 text-foreground">🛡️ Safety Tips for Parents</h3>
        <ul className="text-sm font-nunito text-muted-foreground space-y-1 list-disc list-inside">
          <li>Set a daily time limit to encourage healthy screen habits</li>
          <li>Review community posts with your child regularly</li>
          <li>Change the default PIN (1234) to something only you know</li>
          <li>The SOS button is always visible for emergencies</li>
          <li>Ad Blocker is ON by default to keep the experience clean</li>
        </ul>
      </div>
    </div>
  );
}
