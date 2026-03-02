import React, { useState } from 'react';
import { useVerifyAge } from '../hooks/useQueries';
import CameraCaptureStep from './CameraCaptureStep';

interface OnboardingFlowProps {
  onComplete: () => void;
}

type Step = 'camera' | 'age';

export default function OnboardingFlow({ onComplete }: OnboardingFlowProps) {
  const cameraAlreadyDone = sessionStorage.getItem('cameraStepDone') === 'true';
  const [step, setStep] = useState<Step>(cameraAlreadyDone ? 'age' : 'camera');
  const [name, setName] = useState('');
  const [birthYear, setBirthYear] = useState('');
  const [error, setError] = useState('');
  const verifyAge = useVerifyAge();

  const handleCameraComplete = () => {
    sessionStorage.setItem('cameraStepDone', 'true');
    setStep('age');
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');

    const trimmedName = name.trim();

    // Reserved username check (case-sensitive, frontend-first)
    if (trimmedName === 'TailsTheBeast124') {
      setError('Cannot be admin — please choose a different username.');
      return;
    }

    const year = parseInt(birthYear, 10);
    if (!trimmedName || isNaN(year)) {
      setError('Please enter a valid name and birth year.');
      return;
    }

    try {
      const result = await verifyAge.mutateAsync({ name: trimmedName, birthYear: BigInt(year) });

      if (result.__kind__ === 'ok') {
        onComplete();
      } else if (result.__kind__ === 'tooYoung') {
        setError('You must be at least 10 years old to use Scrambly.');
      } else if (result.__kind__ === 'tooOld') {
        setError('Scrambly is designed for users aged 10–18.');
      } else if (result.__kind__ === 'invalidInput') {
        setError('Invalid birth year. Please check and try again.');
      } else if (result.__kind__ === 'locked') {
        setError('Your account has been locked. Please contact support.');
      }
    } catch (err: any) {
      const msg: string = err?.message ?? String(err);
      if (msg.includes('already being used')) {
        setError('Error: This username is already being used! Please choose another username.');
      } else if (msg.includes('Cannot be admin')) {
        setError('Cannot be admin — please choose a different username.');
      } else {
        setError(msg || 'Something went wrong. Please try again.');
      }
    }
  };

  if (step === 'camera') {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background p-4">
        <div className="w-full max-w-md">
          <div className="flex justify-center gap-2 mb-6">
            <div className="w-3 h-3 rounded-full bg-primary" />
            <div className="w-3 h-3 rounded-full bg-muted" />
          </div>
          <CameraCaptureStep onComplete={handleCameraComplete} />
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-background p-4">
      <div className="w-full max-w-md bg-card border border-border rounded-2xl shadow-lg p-8">
        <div className="flex justify-center gap-2 mb-6">
          <div className="w-3 h-3 rounded-full bg-muted" />
          <div className="w-3 h-3 rounded-full bg-primary" />
        </div>

        <div className="text-center mb-6">
          <img src="/assets/generated/scrambly-logo.dim_512x256.png" alt="Scrambly" className="h-12 mx-auto mb-3" />
          <h1 className="text-2xl font-bold text-foreground">Welcome to Scrambly!</h1>
          <p className="text-muted-foreground text-sm mt-1">Tell us a bit about yourself to get started.</p>
        </div>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-foreground mb-1">Username</label>
            <input
              type="text"
              value={name}
              onChange={(e) => { setName(e.target.value); setError(''); }}
              placeholder="Choose a username"
              className="w-full px-4 py-2 rounded-lg border border-border bg-background text-foreground focus:outline-none focus:ring-2 focus:ring-primary"
              required
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-foreground mb-1">Birth Year</label>
            <input
              type="number"
              value={birthYear}
              onChange={(e) => { setBirthYear(e.target.value); setError(''); }}
              placeholder="e.g. 2010"
              min={1990}
              max={2024}
              className="w-full px-4 py-2 rounded-lg border border-border bg-background text-foreground focus:outline-none focus:ring-2 focus:ring-primary"
              required
            />
          </div>

          {error && (
            <div className="bg-destructive/10 border border-destructive/30 text-destructive rounded-lg px-4 py-3 text-sm font-medium">
              {error}
            </div>
          )}

          <button
            type="submit"
            disabled={verifyAge.isPending}
            className="w-full py-3 rounded-lg bg-primary text-primary-foreground font-semibold hover:opacity-90 transition disabled:opacity-50"
          >
            {verifyAge.isPending ? 'Checking...' : 'Continue'}
          </button>
        </form>
      </div>
    </div>
  );
}
