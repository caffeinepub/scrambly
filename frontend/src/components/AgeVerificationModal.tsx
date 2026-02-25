import React, { useState } from 'react';
import { useVerifyAge } from '../hooks/useQueries';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { AlertCircle, CheckCircle, Zap } from 'lucide-react';

interface AgeVerificationModalProps {
  onSuccess: () => void;
  onLogout: () => void;
}

export default function AgeVerificationModal({ onSuccess, onLogout }: AgeVerificationModalProps) {
  const [name, setName] = useState('');
  const [birthYear, setBirthYear] = useState('');
  const [error, setError] = useState('');
  const [denied, setDenied] = useState(false);
  const [deniedReason, setDeniedReason] = useState('');

  const verifyAge = useVerifyAge();

  const currentYear = new Date().getFullYear();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');

    if (!name.trim()) {
      setError('Please enter your name.');
      return;
    }

    const year = parseInt(birthYear, 10);
    if (isNaN(year) || year < 1900 || year > currentYear) {
      setError('Please enter a valid birth year.');
      return;
    }

    try {
      const result = await verifyAge.mutateAsync({ name: name.trim(), birthYear: BigInt(year) });

      if (result.__kind__ === 'ok') {
        onSuccess();
      } else if (result.__kind__ === 'tooYoung') {
        setDenied(true);
        setDeniedReason(`You must be at least 10 years old to use Scrambly. Come back when you're older!`);
      } else if (result.__kind__ === 'tooOld') {
        setDenied(true);
        setDeniedReason(`Scrambly is designed for users aged 10–18. You're too old for this platform!`);
      } else if (result.__kind__ === 'locked') {
        setDenied(true);
        setDeniedReason(`Your account has been locked. Please create a new account.`);
      } else if (result.__kind__ === 'invalidInput') {
        setError('Invalid birth year. Please check and try again.');
      }
    } catch (err) {
      setError('Something went wrong. Please try again.');
    }
  };

  if (denied) {
    return (
      <div className="min-h-screen flex items-center justify-center sonic-gradient speed-lines">
        <div className="bg-card rounded-3xl p-10 max-w-md w-full mx-4 shadow-2xl text-center">
          <div className="text-6xl mb-4">🚫</div>
          <h2 className="text-3xl font-fredoka text-destructive mb-3">Access Denied</h2>
          <p className="text-muted-foreground font-nunito mb-6">{deniedReason}</p>
          <div className="bg-muted rounded-2xl p-4 mb-6">
            <p className="text-sm font-nunito font-700 text-foreground">
              Scrambly is for users aged <span className="text-primary">10 to 18 years old</span>.
            </p>
          </div>
          <Button onClick={onLogout} variant="outline" className="w-full rounded-full font-nunito font-700">
            Logout
          </Button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen flex items-center justify-center sonic-gradient speed-lines">
      <div className="bg-card rounded-3xl p-10 max-w-md w-full mx-4 shadow-2xl">
        <div className="text-center mb-6">
          <img
            src="/assets/generated/scrambly-logo.dim_512x256.png"
            alt="Scrambly"
            className="h-16 mx-auto mb-3 object-contain"
          />
          <h2 className="text-3xl font-fredoka text-primary">Age Verification</h2>
          <p className="text-muted-foreground font-nunito text-sm mt-1">
            Scrambly is for fans aged 10–18. Let's confirm you're eligible!
          </p>
        </div>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <Label htmlFor="name" className="font-nunito font-700 text-foreground">Your Name</Label>
            <Input
              id="name"
              type="text"
              placeholder="Enter your name"
              value={name}
              onChange={(e) => setName(e.target.value)}
              className="mt-1 rounded-xl font-nunito"
              maxLength={50}
            />
          </div>

          <div>
            <Label htmlFor="birthYear" className="font-nunito font-700 text-foreground">Birth Year</Label>
            <Input
              id="birthYear"
              type="number"
              placeholder={`e.g. ${currentYear - 14}`}
              value={birthYear}
              onChange={(e) => setBirthYear(e.target.value)}
              className="mt-1 rounded-xl font-nunito"
              min={currentYear - 100}
              max={currentYear}
            />
            <p className="text-xs text-muted-foreground mt-1 font-nunito">
              You must be between 10 and 18 years old.
            </p>
          </div>

          {error && (
            <div className="flex items-center gap-2 text-destructive text-sm font-nunito">
              <AlertCircle size={16} />
              {error}
            </div>
          )}

          <Button
            type="submit"
            disabled={verifyAge.isPending}
            className="w-full rounded-full font-fredoka text-lg bg-primary text-primary-foreground"
          >
            {verifyAge.isPending ? (
              <span className="flex items-center gap-2"><Zap size={16} className="animate-spin" /> Verifying...</span>
            ) : (
              <span className="flex items-center gap-2"><CheckCircle size={16} /> Enter Scrambly!</span>
            )}
          </Button>
        </form>

        <button
          onClick={onLogout}
          className="mt-4 w-full text-center text-sm text-muted-foreground hover:text-foreground font-nunito transition-colors"
        >
          Logout
        </button>
      </div>
    </div>
  );
}
