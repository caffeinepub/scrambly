import { useState, useRef } from 'react';
import AdBlockerToggle from '../components/AdBlockerToggle';
import {
  useGetCallerUserProfile,
  useSetPassword,
  useVerifyPassword,
  useGetMyVideos,
  useUploadVideo,
  useSubmitIdea,
} from '../hooks/useQueries';
import { useInternetIdentity } from '../hooks/useInternetIdentity';
import { useQueryClient } from '@tanstack/react-query';
import {
  Settings,
  User,
  Shield,
  LogOut,
  Info,
  Zap,
  Lock,
  KeyRound,
  Video,
  Upload,
  Lightbulb,
  CheckCircle,
  Loader2,
  Eye,
  EyeOff,
  Play,
  Star,
  Send,
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Progress } from '@/components/ui/progress';
import { getAge, isKidMode } from '../components/KidModeWrapper';
import { Link } from '@tanstack/react-router';
import { toast } from 'sonner';
import { ExternalBlob } from '../backend';

// ─── Password Section ─────────────────────────────────────────────────────────

function PasswordSection({ hasPassword }: { hasPassword: boolean }) {
  const [mode, setMode] = useState<'idle' | 'set' | 'change-verify' | 'change-new'>('idle');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [currentPassword, setCurrentPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [validationError, setValidationError] = useState('');

  const setPasswordMutation = useSetPassword();
  const verifyPasswordMutation = useVerifyPassword();

  const validatePassword = (val: string): string => {
    if (!/^\d+$/.test(val) && val.length > 0) return 'Password must contain numbers only.';
    if (val.length > 0 && val.length !== 4 && val.length !== 6) return 'Password must be exactly 4 or 6 digits.';
    return '';
  };

  const handlePasswordInput = (val: string) => {
    const digits = val.replace(/\D/g, '').slice(0, 6);
    setPassword(digits);
    setValidationError(validatePassword(digits));
  };

  const handleConfirmInput = (val: string) => {
    const digits = val.replace(/\D/g, '').slice(0, 6);
    setConfirmPassword(digits);
  };

  const handleCurrentInput = (val: string) => {
    const digits = val.replace(/\D/g, '').slice(0, 6);
    setCurrentPassword(digits);
  };

  const handleSetPassword = async () => {
    const err = validatePassword(password);
    if (err) { setValidationError(err); return; }
    if (password !== confirmPassword) { setValidationError('Passwords do not match.'); return; }

    try {
      await setPasswordMutation.mutateAsync(password);
      toast.success('Password set successfully! 🔒');
      setMode('idle');
      setPassword('');
      setConfirmPassword('');
      setValidationError('');
    } catch {
      toast.error('Failed to set password. Please try again.');
    }
  };

  const handleVerifyCurrentPassword = async () => {
    try {
      const ok = await verifyPasswordMutation.mutateAsync(currentPassword);
      if (ok) {
        setMode('change-new');
        setCurrentPassword('');
      } else {
        toast.error('Incorrect password. Please try again.');
      }
    } catch {
      toast.error('Failed to verify password.');
    }
  };

  const handleChangePassword = async () => {
    const err = validatePassword(password);
    if (err) { setValidationError(err); return; }
    if (password !== confirmPassword) { setValidationError('Passwords do not match.'); return; }

    try {
      await setPasswordMutation.mutateAsync(password);
      toast.success('Password changed successfully! 🔒');
      setMode('idle');
      setPassword('');
      setConfirmPassword('');
      setValidationError('');
    } catch {
      toast.error('Failed to change password. Please try again.');
    }
  };

  const handleCancel = () => {
    setMode('idle');
    setPassword('');
    setConfirmPassword('');
    setCurrentPassword('');
    setValidationError('');
  };

  return (
    <div className="sonic-card p-5 space-y-4">
      <h2 className="font-fredoka text-lg text-foreground flex items-center gap-2">
        <KeyRound size={18} className="text-primary" />
        Account Password
      </h2>

      {mode === 'idle' && (
        <div className="flex items-center justify-between">
          <div>
            <p className="font-nunito text-sm text-foreground">
              {hasPassword ? '🔒 Password is set' : '🔓 No password set'}
            </p>
            <p className="font-nunito text-xs text-muted-foreground mt-0.5">
              4 or 6 digit numeric PIN
            </p>
          </div>
          <Button
            size="sm"
            onClick={() => setMode(hasPassword ? 'change-verify' : 'set')}
            className="rounded-full font-fredoka text-sm"
          >
            {hasPassword ? 'Change Password' : 'Set Password'}
          </Button>
        </div>
      )}

      {mode === 'set' && (
        <div className="space-y-3">
          <div>
            <Label className="font-nunito font-700 text-sm">New Password (4 or 6 digits)</Label>
            <div className="relative mt-1">
              <Input
                type={showPassword ? 'text' : 'tel'}
                inputMode="numeric"
                pattern="[0-9]*"
                placeholder="Enter 4 or 6 digit PIN"
                value={password}
                onChange={(e) => handlePasswordInput(e.target.value)}
                maxLength={6}
                className="rounded-xl font-nunito text-sm pr-10 tracking-widest"
              />
              <button
                type="button"
                onClick={() => setShowPassword(!showPassword)}
                className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground"
              >
                {showPassword ? <EyeOff size={16} /> : <Eye size={16} />}
              </button>
            </div>
          </div>
          <div>
            <Label className="font-nunito font-700 text-sm">Confirm Password</Label>
            <Input
              type="tel"
              inputMode="numeric"
              pattern="[0-9]*"
              placeholder="Re-enter PIN"
              value={confirmPassword}
              onChange={(e) => handleConfirmInput(e.target.value)}
              maxLength={6}
              className="mt-1 rounded-xl font-nunito text-sm tracking-widest"
            />
          </div>
          {validationError && (
            <p className="text-xs text-destructive font-nunito">{validationError}</p>
          )}
          <div className="flex gap-2">
            <Button
              size="sm"
              onClick={handleSetPassword}
              disabled={setPasswordMutation.isPending || password.length < 4}
              className="rounded-full font-fredoka"
            >
              {setPasswordMutation.isPending ? (
                <><Loader2 size={14} className="animate-spin mr-1" />Saving...</>
              ) : (
                <><Lock size={14} className="mr-1" />Set Password</>
              )}
            </Button>
            <Button size="sm" variant="outline" onClick={handleCancel} className="rounded-full font-nunito text-sm">
              Cancel
            </Button>
          </div>
        </div>
      )}

      {mode === 'change-verify' && (
        <div className="space-y-3">
          <div>
            <Label className="font-nunito font-700 text-sm">Current Password</Label>
            <Input
              type="tel"
              inputMode="numeric"
              pattern="[0-9]*"
              placeholder="Enter current PIN"
              value={currentPassword}
              onChange={(e) => handleCurrentInput(e.target.value)}
              maxLength={6}
              className="mt-1 rounded-xl font-nunito text-sm tracking-widest"
            />
          </div>
          <div className="flex gap-2">
            <Button
              size="sm"
              onClick={handleVerifyCurrentPassword}
              disabled={verifyPasswordMutation.isPending || currentPassword.length < 4}
              className="rounded-full font-fredoka"
            >
              {verifyPasswordMutation.isPending ? (
                <><Loader2 size={14} className="animate-spin mr-1" />Verifying...</>
              ) : 'Verify'}
            </Button>
            <Button size="sm" variant="outline" onClick={handleCancel} className="rounded-full font-nunito text-sm">
              Cancel
            </Button>
          </div>
        </div>
      )}

      {mode === 'change-new' && (
        <div className="space-y-3">
          <div>
            <Label className="font-nunito font-700 text-sm">New Password (4 or 6 digits)</Label>
            <div className="relative mt-1">
              <Input
                type={showPassword ? 'text' : 'tel'}
                inputMode="numeric"
                pattern="[0-9]*"
                placeholder="Enter new 4 or 6 digit PIN"
                value={password}
                onChange={(e) => handlePasswordInput(e.target.value)}
                maxLength={6}
                className="rounded-xl font-nunito text-sm pr-10 tracking-widest"
              />
              <button
                type="button"
                onClick={() => setShowPassword(!showPassword)}
                className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground"
              >
                {showPassword ? <EyeOff size={16} /> : <Eye size={16} />}
              </button>
            </div>
          </div>
          <div>
            <Label className="font-nunito font-700 text-sm">Confirm New Password</Label>
            <Input
              type="tel"
              inputMode="numeric"
              pattern="[0-9]*"
              placeholder="Re-enter new PIN"
              value={confirmPassword}
              onChange={(e) => handleConfirmInput(e.target.value)}
              maxLength={6}
              className="mt-1 rounded-xl font-nunito text-sm tracking-widest"
            />
          </div>
          {validationError && (
            <p className="text-xs text-destructive font-nunito">{validationError}</p>
          )}
          <div className="flex gap-2">
            <Button
              size="sm"
              onClick={handleChangePassword}
              disabled={setPasswordMutation.isPending || password.length < 4}
              className="rounded-full font-fredoka"
            >
              {setPasswordMutation.isPending ? (
                <><Loader2 size={14} className="animate-spin mr-1" />Saving...</>
              ) : (
                <><Lock size={14} className="mr-1" />Change Password</>
              )}
            </Button>
            <Button size="sm" variant="outline" onClick={handleCancel} className="rounded-full font-nunito text-sm">
              Cancel
            </Button>
          </div>
        </div>
      )}
    </div>
  );
}

// ─── Video Upload Section ─────────────────────────────────────────────────────

function VideoUploadSection() {
  const { data: myVideos, isLoading: videosLoading } = useGetMyVideos();
  const uploadVideoMutation = useUploadVideo();

  const [videoTitle, setVideoTitle] = useState('');
  const [uploadProgress, setUploadProgress] = useState<number | null>(null);
  const [durationError, setDurationError] = useState('');
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleFileSelect = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setDurationError('');

    const url = URL.createObjectURL(file);
    const videoEl = document.createElement('video');
    videoEl.preload = 'metadata';

    await new Promise<void>((resolve) => {
      videoEl.onloadedmetadata = () => resolve();
      videoEl.onerror = () => resolve();
      videoEl.src = url;
    });

    const duration = videoEl.duration;
    URL.revokeObjectURL(url);

    if (isNaN(duration) || duration > 1000) {
      setDurationError(
        isNaN(duration)
          ? 'Could not read video duration. Please try a different file.'
          : `Video is too long (${Math.round(duration)}s). Maximum allowed is 1000 seconds.`
      );
      if (fileInputRef.current) fileInputRef.current.value = '';
      return;
    }

    if (!videoTitle.trim()) {
      toast.error('Please enter a title for your video first.');
      if (fileInputRef.current) fileInputRef.current.value = '';
      return;
    }

    try {
      const arrayBuffer = await file.arrayBuffer();
      const bytes = new Uint8Array(arrayBuffer);
      const blob = ExternalBlob.fromBytes(bytes).withUploadProgress((pct) => {
        setUploadProgress(pct);
      });

      await uploadVideoMutation.mutateAsync({ title: videoTitle.trim(), blob });
      toast.success('Video uploaded successfully! 🎬');
      setVideoTitle('');
      setUploadProgress(null);
      if (fileInputRef.current) fileInputRef.current.value = '';
    } catch {
      toast.error('Failed to upload video. Please try again.');
      setUploadProgress(null);
    }
  };

  return (
    <div className="sonic-card p-5 space-y-4">
      <h2 className="font-fredoka text-lg text-foreground flex items-center gap-2">
        <Video size={18} className="text-primary" />
        My Videos
      </h2>

      {/* Upload Form */}
      <div className="space-y-3 border border-border rounded-xl p-4 bg-muted/30">
        <p className="font-nunito font-700 text-sm text-foreground">Upload a Video</p>
        <p className="font-nunito text-xs text-muted-foreground">Maximum duration: 1000 seconds</p>
        <div>
          <Label className="font-nunito font-700 text-sm">Video Title</Label>
          <Input
            placeholder="Enter a title..."
            value={videoTitle}
            onChange={(e) => setVideoTitle(e.target.value)}
            className="mt-1 rounded-xl font-nunito text-sm"
            maxLength={100}
          />
        </div>
        {durationError && (
          <p className="text-xs text-destructive font-nunito">{durationError}</p>
        )}
        {uploadProgress !== null && (
          <div className="space-y-1">
            <p className="text-xs font-nunito text-muted-foreground">Uploading... {uploadProgress}%</p>
            <Progress value={uploadProgress} className="h-2" />
          </div>
        )}
        <Button
          size="sm"
          onClick={() => fileInputRef.current?.click()}
          disabled={uploadVideoMutation.isPending || !videoTitle.trim()}
          className="rounded-full font-fredoka"
        >
          {uploadVideoMutation.isPending ? (
            <><Loader2 size={14} className="animate-spin mr-1" />Uploading...</>
          ) : (
            <><Upload size={14} className="mr-1" />Choose Video File</>
          )}
        </Button>
        <input
          ref={fileInputRef}
          type="file"
          accept="video/*"
          className="hidden"
          onChange={handleFileSelect}
        />
      </div>

      {/* Video List */}
      {videosLoading ? (
        <div className="flex items-center gap-2 text-muted-foreground py-2">
          <Loader2 size={16} className="animate-spin" />
          <span className="font-nunito text-sm">Loading videos...</span>
        </div>
      ) : !myVideos || myVideos.length === 0 ? (
        <p className="font-nunito text-sm text-muted-foreground text-center py-4">
          No videos uploaded yet.
        </p>
      ) : (
        <div className="space-y-3">
          {myVideos.map((video, i) => (
            <div key={i} className="border border-border rounded-xl overflow-hidden">
              <div className="flex items-center gap-3 p-3 bg-muted/20">
                <div className="w-8 h-8 bg-primary/10 rounded-lg flex items-center justify-center shrink-0">
                  <Play size={14} className="text-primary" />
                </div>
                <p className="font-nunito font-700 text-sm text-foreground flex-1 truncate">{video.title}</p>
              </div>
              <video
                src={video.blob.getDirectURL()}
                controls
                className="w-full max-h-48 bg-black"
                preload="metadata"
              />
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

// ─── Ideas Section ────────────────────────────────────────────────────────────

function IdeasSection() {
  const [ideaText, setIdeaText] = useState('');
  const [submitted, setSubmitted] = useState(false);
  const submitIdeaMutation = useSubmitIdea();

  const MAX_CHARS = 600;

  const handleSubmit = async () => {
    const trimmed = ideaText.trim();
    if (!trimmed) return;

    try {
      await submitIdeaMutation.mutateAsync(trimmed);
      toast.success('Thank you! Your idea has been submitted. 💡');
      setIdeaText('');
      setSubmitted(true);
      setTimeout(() => setSubmitted(false), 5000);
    } catch {
      toast.error('Failed to submit idea. Please try again.');
    }
  };

  return (
    <div className="sonic-card p-5 space-y-4">
      <h2 className="font-fredoka text-lg text-foreground flex items-center gap-2">
        <Lightbulb size={18} className="text-primary" />
        Send Your Best Ideas as a Sonic Fan
      </h2>
      <p className="font-nunito text-sm text-muted-foreground">
        Have a great idea for Scrambly? Share it with us! The admin (Jourdain Rodriguez) will review your idea and may use it.
      </p>

      {submitted && (
        <div className="flex items-center gap-2 bg-green-500/10 border border-green-500/30 rounded-xl p-3">
          <CheckCircle size={16} className="text-green-600 shrink-0" />
          <p className="font-nunito text-sm text-green-700 dark:text-green-400">
            Your idea has been submitted! Thanks for sharing. ✨
          </p>
        </div>
      )}

      <div className="space-y-2">
        <Textarea
          placeholder="Share your idea here... (e.g. new features, content ideas, improvements)"
          value={ideaText}
          onChange={(e) => setIdeaText(e.target.value.slice(0, MAX_CHARS))}
          className="rounded-xl font-nunito text-sm min-h-[120px] resize-none"
        />
        <div className="flex items-center justify-between">
          <span className={`font-nunito text-xs ${ideaText.length >= MAX_CHARS - 50 ? 'text-destructive' : 'text-muted-foreground'}`}>
            {ideaText.length} / {MAX_CHARS}
          </span>
          <Button
            size="sm"
            onClick={handleSubmit}
            disabled={submitIdeaMutation.isPending || !ideaText.trim()}
            className="rounded-full font-fredoka"
          >
            {submitIdeaMutation.isPending ? (
              <><Loader2 size={14} className="animate-spin mr-1" />Submitting...</>
            ) : (
              <><Send size={14} className="mr-1" />Submit Idea</>
            )}
          </Button>
        </div>
      </div>
    </div>
  );
}

// ─── Moderator Application Section ───────────────────────────────────────────

const MODERATOR_URL = 'https://scrambly-moderator-lq2.caffeine.xyz/#caffeineAdminToken=d56558c15a1ee884ff360f38b77d9e18b6876ade2990f07ccf750d3a64b064b4';
const MOD_MAX_CHARS = 1000;

function ModeratorApplicationSection({ principalId }: { principalId: string }) {
  const [applicationText, setApplicationText] = useState('');
  const [submitted, setSubmitted] = useState(false);

  const isDisabled = !applicationText.trim();

  const handleSubmit = () => {
    const trimmed = applicationText.trim();
    if (!trimmed) return;

    const encodedMessage = encodeURIComponent(trimmed);
    const encodedUser = encodeURIComponent(principalId);
    const fullUrl = `${MODERATOR_URL}&message=${encodedMessage}&user=${encodedUser}`;

    window.open(fullUrl, '_blank', 'noopener,noreferrer');

    toast.success('Your application has been submitted! A moderator will review it soon. 🌟');
    setApplicationText('');
    setSubmitted(true);
    setTimeout(() => setSubmitted(false), 6000);
  };

  return (
    <div className="sonic-card p-5 space-y-4 border-2 border-sonic-yellow/40">
      {/* Header */}
      <div className="flex items-start gap-3">
        <div className="w-10 h-10 rounded-2xl bg-sonic-yellow/20 flex items-center justify-center shrink-0 mt-0.5">
          <Star size={20} className="text-sonic-yellow fill-sonic-yellow" />
        </div>
        <div>
          <h2 className="font-fredoka text-lg text-foreground">
            Apply to be a Moderator
          </h2>
          <p className="font-nunito text-xs text-muted-foreground mt-0.5">
            Think you'd make a great Scrambly moderator? Tell us why!
          </p>
        </div>
      </div>

      <p className="font-nunito text-sm text-muted-foreground">
        Moderators help keep Scrambly safe and fun for everyone. If you're passionate about the Sonic community and want to help out, write us a message below explaining why you'd be a great fit.
      </p>

      {/* Confirmation banner */}
      {submitted && (
        <div className="flex items-center gap-2 bg-sonic-yellow/10 border border-sonic-yellow/40 rounded-xl p-3">
          <CheckCircle size={16} className="text-sonic-yellow shrink-0" />
          <p className="font-nunito text-sm text-foreground">
            Application sent! We'll review it and get back to you. 🌟
          </p>
        </div>
      )}

      {/* Textarea */}
      <div className="space-y-2">
        <Label className="font-nunito font-700 text-sm text-foreground">
          Why do you want to be a moderator?
        </Label>
        <Textarea
          placeholder="Tell us about yourself, why you want to moderate, and what makes you a good fit for the Scrambly community..."
          value={applicationText}
          onChange={(e) => setApplicationText(e.target.value.slice(0, MOD_MAX_CHARS))}
          className="rounded-xl font-nunito text-sm min-h-[160px] resize-none border-sonic-yellow/30 focus-visible:ring-sonic-yellow/50"
        />
        <div className="flex items-center justify-between">
          <span className={`font-nunito text-xs ${applicationText.length >= MOD_MAX_CHARS - 100 ? 'text-destructive' : 'text-muted-foreground'}`}>
            {applicationText.length} / {MOD_MAX_CHARS}
          </span>
          <Button
            size="sm"
            onClick={handleSubmit}
            disabled={isDisabled}
            className="rounded-full font-fredoka bg-sonic-yellow text-sonic-dark hover:bg-sonic-yellow/90 disabled:opacity-50"
          >
            <Send size={14} className="mr-1" />
            Submit Application
          </Button>
        </div>
      </div>

      <p className="font-nunito text-xs text-muted-foreground">
        By submitting, your message will be sent to the Scrambly moderation team for review.
      </p>
    </div>
  );
}

// ─── Main Settings Page ───────────────────────────────────────────────────────

export default function SettingsPage() {
  const { data: profile, isLoading: profileLoading } = useGetCallerUserProfile();
  const { identity, clear } = useInternetIdentity();
  const queryClient = useQueryClient();

  const principalId = identity?.getPrincipal().toString() ?? '';
  // Pass the full profile object to getAge and isKidMode as they expect Profile | null | undefined
  const age = getAge(profile);
  const kidMode = isKidMode(profile);
  const hasPassword = !!profile?.password;

  const handleLogout = async () => {
    await clear();
    queryClient.clear();
  };

  if (profileLoading) {
    return (
      <div className="flex items-center justify-center min-h-[60vh]">
        <div className="flex items-center gap-3 text-muted-foreground">
          <Loader2 size={24} className="animate-spin" />
          <span className="font-nunito text-base">Loading settings...</span>
        </div>
      </div>
    );
  }

  return (
    <div className="max-w-2xl mx-auto px-4 py-8 space-y-6">
      {/* Page Header */}
      <div className="flex items-center gap-3">
        <div className="w-10 h-10 rounded-2xl bg-primary/10 flex items-center justify-center">
          <Settings size={20} className="text-primary" />
        </div>
        <div>
          <h1 className="font-fredoka text-2xl text-foreground">Settings</h1>
          <p className="font-nunito text-sm text-muted-foreground">Manage your Scrambly account</p>
        </div>
      </div>

      {/* Profile Info */}
      {profile && (
        <div className="sonic-card p-5 space-y-3">
          <h2 className="font-fredoka text-lg text-foreground flex items-center gap-2">
            <User size={18} className="text-primary" />
            Account Settings
          </h2>
          <div className="flex items-center gap-3">
            <div className="w-12 h-12 rounded-full bg-primary/10 flex items-center justify-center">
              <span className="font-fredoka text-xl text-primary">
                {profile.name.charAt(0).toUpperCase()}
              </span>
            </div>
            <div>
              <p className="font-fredoka text-base text-foreground">{profile.name}</p>
              <div className="flex items-center gap-2 mt-0.5">
                <Badge variant="secondary" className="font-nunito text-xs rounded-full">
                  Age {age ?? '?'}
                </Badge>
                {kidMode && (
                  <Badge className="font-nunito text-xs rounded-full bg-primary/20 text-primary border-0">
                    Kid Mode
                  </Badge>
                )}
                {profile.isSchoolAccount && (
                  <Badge variant="outline" className="font-nunito text-xs rounded-full">
                    School
                  </Badge>
                )}
              </div>
            </div>
          </div>
          {profile.warnings > 0 && (
            <div className="flex items-center gap-2 bg-destructive/10 border border-destructive/20 rounded-xl p-3">
              <Zap size={14} className="text-destructive shrink-0" />
              <p className="font-nunito text-xs text-destructive">
                {Number(profile.warnings)} warning{Number(profile.warnings) !== 1 ? 's' : ''} on your account
              </p>
            </div>
          )}
        </div>
      )}

      {/* Password Section */}
      <PasswordSection hasPassword={hasPassword} />

      {/* Video Upload Section */}
      <VideoUploadSection />

      {/* Ideas Section */}
      <IdeasSection />

      {/* Moderator Application Section */}
      <ModeratorApplicationSection principalId={principalId} />

      {/* Ad Blocker */}
      <div className="sonic-card p-5 space-y-3">
        <h2 className="font-fredoka text-lg text-foreground flex items-center gap-2">
          <Zap size={18} className="text-primary" />
          Ad Blocker
        </h2>
        <AdBlockerToggle />
      </div>

      {/* Parental Controls */}
      <div className="sonic-card p-5">
        <h2 className="font-fredoka text-lg text-foreground flex items-center gap-2 mb-3">
          <Shield size={18} className="text-primary" />
          Parental Controls
        </h2>
        <p className="font-nunito text-sm text-muted-foreground mb-3">
          Parents can set usage timers and manage safety settings.
        </p>
        <Link to="/parental">
          <Button size="sm" variant="outline" className="rounded-full font-fredoka text-sm">
            Open Parental Dashboard
          </Button>
        </Link>
      </div>

      {/* App Info */}
      <div className="sonic-card p-5 space-y-2">
        <h2 className="font-fredoka text-lg text-foreground flex items-center gap-2">
          <Info size={18} className="text-primary" />
          App Info
        </h2>
        <p className="font-nunito text-sm text-muted-foreground">
          Scrambly — A Sonic fan community for kids aged 10–18.
        </p>
        <p className="font-nunito text-xs text-muted-foreground">
          Built with love for the Sonic fandom. 💙
        </p>
      </div>

      {/* Logout */}
      <div className="sonic-card p-5">
        <h2 className="font-fredoka text-lg text-foreground flex items-center gap-2 mb-3">
          <LogOut size={18} className="text-primary" />
          Account
        </h2>
        <Button
          variant="destructive"
          size="sm"
          onClick={handleLogout}
          className="rounded-full font-fredoka"
        >
          <LogOut size={14} className="mr-1" />
          Log Out
        </Button>
      </div>
    </div>
  );
}
