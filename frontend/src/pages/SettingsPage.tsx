import React, { useState, useEffect } from 'react';
import { useNavigate } from '@tanstack/react-router';
import { useQueryClient } from '@tanstack/react-query';
import {
  useGetCallerUserProfile,
  useSaveCallerUserProfile,
  useSetPassword,
  useVerifyPassword,
  useSubmitIdea,
  useApplyForModerator,
} from '../hooks/useQueries';
import { useInternetIdentity } from '../hooks/useInternetIdentity';
import { Loader2, Save, Lock, Video, Lightbulb, Shield, Trash2, AlertTriangle, ExternalLink } from 'lucide-react';
import { toast } from 'sonner';

function getAge(profile: { birthYear: bigint } | null | undefined): number {
  if (!profile) return 0;
  return 2024 - Number(profile.birthYear);
}

function isKidMode(profile: { birthYear: bigint } | null | undefined): boolean {
  if (!profile) return false;
  const age = getAge(profile);
  return age < 13;
}

export default function SettingsPage() {
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const { identity, clear } = useInternetIdentity();
  const { data: profile, isLoading: profileLoading } = useGetCallerUserProfile();
  const saveProfile = useSaveCallerUserProfile();
  const setPasswordMutation = useSetPassword();
  const verifyPasswordMutation = useVerifyPassword();
  const submitIdeaMutation = useSubmitIdea();
  const applyModeratorMutation = useApplyForModerator();

  // Profile form state
  const [name, setName] = useState('');
  const [birthYear, setBirthYear] = useState('');

  // Password state
  const [newPassword, setNewPassword] = useState('');
  const [verifyPasswordInput, setVerifyPasswordInput] = useState('');
  const [passwordMessage, setPasswordMessage] = useState('');

  // Idea state
  const [ideaContent, setIdeaContent] = useState('');
  const [ideaMessage, setIdeaMessage] = useState('');

  // Moderator application state
  const [modAnswers, setModAnswers] = useState('');
  const [modMessage, setModMessage] = useState('');

  // Delete account state
  const [deleteConfirmText, setDeleteConfirmText] = useState('');
  const [isDeleting, setIsDeleting] = useState(false);
  const [deleteError, setDeleteError] = useState('');

  useEffect(() => {
    if (profile) {
      setName(profile.name || '');
      setBirthYear(profile.birthYear ? String(profile.birthYear) : '');
    }
  }, [profile]);

  const handleSaveProfile = async () => {
    if (!profile) return;
    try {
      await saveProfile.mutateAsync({
        ...profile,
        name,
        birthYear: BigInt(birthYear || '0'),
      });
      toast.success('Profile saved!');
    } catch (e: any) {
      toast.error('Failed to save profile: ' + (e?.message || 'Unknown error'));
    }
  };

  const handleSetPassword = async () => {
    setPasswordMessage('');
    try {
      await setPasswordMutation.mutateAsync(newPassword);
      setPasswordMessage('Password set successfully!');
      setNewPassword('');
    } catch (e: any) {
      setPasswordMessage('Error: ' + (e?.message || 'Unknown error'));
    }
  };

  const handleVerifyPassword = async () => {
    setPasswordMessage('');
    try {
      const result = await verifyPasswordMutation.mutateAsync(verifyPasswordInput);
      setPasswordMessage(result ? '✅ Password correct!' : '❌ Incorrect password');
      setVerifyPasswordInput('');
    } catch (e: any) {
      setPasswordMessage('Error: ' + (e?.message || 'Unknown error'));
    }
  };

  const handleSubmitIdea = async () => {
    setIdeaMessage('');
    try {
      await submitIdeaMutation.mutateAsync(ideaContent);
      setIdeaMessage('✅ Idea submitted! Thanks for your suggestion.');
      setIdeaContent('');
    } catch (e: any) {
      setIdeaMessage('Error: ' + (e?.message || 'Unknown error'));
    }
  };

  const handleApplyModerator = async () => {
    setModMessage('');
    try {
      const result = await applyModeratorMutation.mutateAsync(modAnswers);
      if (result === 'success') {
        setModMessage('✅ Application submitted successfully!');
      } else if (result === 'incorrectAnswers') {
        setModMessage('❌ Incorrect answers. Please try again.');
      } else if (result === 'applicationFull') {
        setModMessage('ℹ️ Applications are currently full. Try again later.');
      }
      setModAnswers('');
    } catch (e: any) {
      setModMessage('Error: ' + (e?.message || 'Unknown error'));
    }
  };

  const handleDeleteAccount = async () => {
    if (deleteConfirmText !== 'DELETE') return;
    setDeleteError('');
    setIsDeleting(true);
    try {
      await clear();
      queryClient.clear();
      navigate({ to: '/' });
    } catch (e: any) {
      setDeleteError('Failed to delete account: ' + (e?.message || 'Unknown error'));
      setIsDeleting(false);
    }
  };

  if (profileLoading) {
    return (
      <div className="flex items-center justify-center min-h-[60vh]">
        <Loader2 className="animate-spin text-primary w-10 h-10" />
      </div>
    );
  }

  const age = getAge(profile);
  const kidMode = isKidMode(profile);

  return (
    <div className="max-w-2xl mx-auto px-4 py-8 space-y-8">
      <h1 className="text-3xl font-bold text-primary font-display">Settings</h1>

      {/* Account Settings */}
      <section className="sonic-card p-6 space-y-4">
        <h2 className="text-xl font-bold text-foreground font-display flex items-center gap-2">
          <Shield className="w-5 h-5 text-primary" />
          Account Settings
        </h2>
        {profile ? (
          <div className="space-y-3">
            <div>
              <label className="block text-sm font-medium text-muted-foreground mb-1">Display Name</label>
              <input
                className="sonic-input w-full"
                value={name}
                onChange={(e) => setName(e.target.value)}
                placeholder="Your name"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-muted-foreground mb-1">Birth Year</label>
              <input
                className="sonic-input w-full"
                value={birthYear}
                onChange={(e) => setBirthYear(e.target.value)}
                placeholder="e.g. 2010"
                type="number"
              />
            </div>
            <div className="text-sm text-muted-foreground">
              Age: <span className="font-semibold text-foreground">{age}</span>
              {kidMode && <span className="ml-2 text-xs bg-primary/10 text-primary px-2 py-0.5 rounded-full">Kid Mode</span>}
            </div>
            <button
              className="sonic-btn sonic-btn-primary flex items-center gap-2"
              onClick={handleSaveProfile}
              disabled={saveProfile.isPending}
            >
              {saveProfile.isPending ? <Loader2 className="w-4 h-4 animate-spin" /> : <Save className="w-4 h-4" />}
              Save Profile
            </button>
          </div>
        ) : (
          <p className="text-muted-foreground">No profile found. Please complete onboarding.</p>
        )}
      </section>

      {/* Password */}
      <section className="sonic-card p-6 space-y-4">
        <h2 className="text-xl font-bold text-foreground font-display flex items-center gap-2">
          <Lock className="w-5 h-5 text-primary" />
          Password (PIN)
        </h2>
        <div className="space-y-3">
          <div>
            <label className="block text-sm font-medium text-muted-foreground mb-1">Set New PIN (4 or 6 digits)</label>
            <input
              className="sonic-input w-full"
              value={newPassword}
              onChange={(e) => setNewPassword(e.target.value)}
              placeholder="Enter 4 or 6 digit PIN"
              type="password"
              maxLength={6}
            />
            <button
              className="sonic-btn sonic-btn-primary mt-2 flex items-center gap-2"
              onClick={handleSetPassword}
              disabled={setPasswordMutation.isPending || newPassword.length < 4}
            >
              {setPasswordMutation.isPending ? <Loader2 className="w-4 h-4 animate-spin" /> : <Lock className="w-4 h-4" />}
              Set PIN
            </button>
          </div>
          <div>
            <label className="block text-sm font-medium text-muted-foreground mb-1">Verify PIN</label>
            <input
              className="sonic-input w-full"
              value={verifyPasswordInput}
              onChange={(e) => setVerifyPasswordInput(e.target.value)}
              placeholder="Enter PIN to verify"
              type="password"
              maxLength={6}
            />
            <button
              className="sonic-btn sonic-btn-secondary mt-2 flex items-center gap-2"
              onClick={handleVerifyPassword}
              disabled={verifyPasswordMutation.isPending || verifyPasswordInput.length < 4}
            >
              {verifyPasswordMutation.isPending ? <Loader2 className="w-4 h-4 animate-spin" /> : null}
              Verify PIN
            </button>
          </div>
          {passwordMessage && (
            <p className="text-sm font-medium text-foreground">{passwordMessage}</p>
          )}
        </div>
      </section>

      {/* Ideas */}
      <section className="sonic-card p-6 space-y-4">
        <h2 className="text-xl font-bold text-foreground font-display flex items-center gap-2">
          <Lightbulb className="w-5 h-5 text-primary" />
          Submit an Idea
        </h2>
        <div className="space-y-3">
          <textarea
            className="sonic-input w-full min-h-[100px] resize-none"
            value={ideaContent}
            onChange={(e) => setIdeaContent(e.target.value)}
            placeholder="Share your idea for Scrambly (max 600 characters)..."
            maxLength={600}
          />
          <div className="flex items-center justify-between">
            <span className="text-xs text-muted-foreground">{ideaContent.length}/600</span>
            <button
              className="sonic-btn sonic-btn-primary flex items-center gap-2"
              onClick={handleSubmitIdea}
              disabled={submitIdeaMutation.isPending || ideaContent.trim().length === 0}
            >
              {submitIdeaMutation.isPending ? <Loader2 className="w-4 h-4 animate-spin" /> : <Lightbulb className="w-4 h-4" />}
              Submit Idea
            </button>
          </div>
          {ideaMessage && <p className="text-sm font-medium text-foreground">{ideaMessage}</p>}
        </div>
      </section>

      {/* Apply to be a Moderator */}
      <section className="sonic-card p-6 space-y-4">
        <h2 className="text-xl font-bold text-foreground font-display flex items-center gap-2">
          <Shield className="w-5 h-5 text-primary" />
          Apply to be a Moderator
        </h2>
        <p className="text-sm text-muted-foreground">
          Answer the following questions to apply for a moderator role:
        </p>
        <ol className="list-decimal list-inside text-sm text-foreground space-y-1">
          <li>What year was Sonic the Hedgehog first released? (hint: 1991)</li>
          <li>What year was Sonic the Hedgehog 2 released? (hint: 1992)</li>
        </ol>
        <textarea
          className="sonic-input w-full min-h-[80px] resize-none"
          value={modAnswers}
          onChange={(e) => setModAnswers(e.target.value)}
          placeholder="Type your answers here..."
        />
        <button
          className="sonic-btn sonic-btn-primary flex items-center gap-2"
          onClick={handleApplyModerator}
          disabled={applyModeratorMutation.isPending || modAnswers.trim().length === 0}
        >
          {applyModeratorMutation.isPending ? <Loader2 className="w-4 h-4 animate-spin" /> : <Shield className="w-4 h-4" />}
          Submit Application
        </button>
        {modMessage && <p className="text-sm font-medium text-foreground">{modMessage}</p>}
      </section>

      {/* External Links */}
      <section className="sonic-card p-6 space-y-4">
        <h2 className="text-xl font-bold text-foreground font-display flex items-center gap-2">
          <ExternalLink className="w-5 h-5 text-primary" />
          External Links
        </h2>
        <div className="space-y-3">
          <button
            className="sonic-btn sonic-btn-secondary w-full flex items-center justify-center gap-2"
            onClick={() =>
              window.open(
                'https://widespread-crimson-c6q-draft.caffeine.xyz/#caffeineAdminToken=7c4623260dccffc21ab80a4d967ff00efa0fca2d013781ab3aad1fe300afbfce',
                '_blank',
                'noopener,noreferrer'
              )
            }
          >
            <ExternalLink className="w-4 h-4" />
            Parent Review Panel
          </button>
          <button
            className="sonic-btn sonic-btn-secondary w-full flex items-center justify-center gap-2"
            onClick={() =>
              window.open(
                'https://widespread-crimson-c6q-draft.caffeine.xyz/#caffeineAdminToken=5f715f1e5cc968358c700eb3bf931a95e3d054e31855e1cccdc56069da56f4ab',
                '_blank',
                'noopener,noreferrer'
              )
            }
          >
            <ExternalLink className="w-4 h-4" />
            Chat with Friends
          </button>
        </div>
      </section>

      {/* Delete Account */}
      <section className="sonic-card p-6 space-y-4 border-2 border-destructive/30">
        <h2 className="text-xl font-bold text-destructive font-display flex items-center gap-2">
          <Trash2 className="w-5 h-5" />
          Delete Account
        </h2>
        <div className="bg-destructive/5 rounded-xl p-4 flex items-start gap-3">
          <AlertTriangle className="w-5 h-5 text-destructive shrink-0 mt-0.5" />
          <p className="text-sm text-muted-foreground">
            This action is <strong>permanent</strong> and cannot be undone. All your data will be lost.
          </p>
        </div>
        <div className="space-y-3">
          <label className="block text-sm font-medium text-muted-foreground">
            Type <strong>DELETE</strong> to confirm
          </label>
          <input
            className="sonic-input w-full"
            value={deleteConfirmText}
            onChange={(e) => setDeleteConfirmText(e.target.value)}
            placeholder="Type DELETE here"
          />
          {deleteError && <p className="text-sm text-destructive">{deleteError}</p>}
          <button
            className="sonic-btn w-full bg-destructive text-destructive-foreground hover:bg-destructive/90 flex items-center justify-center gap-2 disabled:opacity-50"
            onClick={handleDeleteAccount}
            disabled={deleteConfirmText !== 'DELETE' || isDeleting}
          >
            {isDeleting ? <Loader2 className="w-4 h-4 animate-spin" /> : <Trash2 className="w-4 h-4" />}
            Delete My Account
          </button>
        </div>
      </section>
    </div>
  );
}
