import React from 'react';
import { useInternetIdentity } from '../hooks/useInternetIdentity';
import { useGetCallerUserProfile } from '../hooks/useQueries';
import { useQueryClient } from '@tanstack/react-query';
import OnboardingFlow from './OnboardingFlow';
import AccountLockedMessage from './AccountLockedMessage';
import UsageTimerLockout from './UsageTimerLockout';
import { useUsageTimer } from '../hooks/useUsageTimer';
import { Zap } from 'lucide-react';

interface AuthGateProps {
  children: React.ReactNode;
}

export default function AuthGate({ children }: AuthGateProps) {
  const { identity, isInitializing, login, clear, isLoggingIn } = useInternetIdentity();
  const queryClient = useQueryClient();
  const isAuthenticated = !!identity;

  const { data: userProfile, isLoading: profileLoading, isFetched } = useGetCallerUserProfile();
  const { isExpired } = useUsageTimer(userProfile);

  const showProfileSetup = isAuthenticated && !profileLoading && isFetched && userProfile === null;
  const showLocked = isAuthenticated && !profileLoading && isFetched && userProfile?.accountLocked === true;
  const showTimerExpired = isAuthenticated && !profileLoading && isFetched && userProfile !== null && isExpired;

  const handleLogout = async () => {
    await clear();
    queryClient.clear();
  };

  if (isInitializing) {
    return (
      <div className="min-h-screen flex items-center justify-center sonic-gradient">
        <div className="text-center text-white">
          <div className="text-5xl font-fredoka mb-4 animate-bounce-sonic">SCRAMBLY</div>
          <div className="flex items-center gap-2 justify-center">
            <Zap className="animate-spin" size={20} />
            <span className="font-nunito">Loading...</span>
          </div>
        </div>
      </div>
    );
  }

  if (!isAuthenticated) {
    return (
      <div className="min-h-screen flex items-center justify-center sonic-gradient speed-lines">
        <div className="bg-card rounded-3xl p-10 max-w-md w-full mx-4 shadow-2xl text-center">
          <img
            src="/assets/generated/scrambly-logo.dim_512x256.png"
            alt="Scrambly"
            className="h-20 mx-auto mb-4 object-contain"
          />
          <h1 className="text-4xl font-fredoka text-primary mb-2">Welcome to Scrambly!</h1>
          <p className="text-muted-foreground font-nunito mb-2">
            The Sonic-powered super app for fans aged 10–18.
          </p>
          <p className="text-sm text-muted-foreground font-nunito mb-6">
            Search Sonic lore, play games, connect with fans your age, and more!
          </p>
          <button
            onClick={login}
            disabled={isLoggingIn}
            className="sonic-btn-primary w-full flex items-center justify-center gap-2"
          >
            <Zap size={18} />
            {isLoggingIn ? 'Logging in...' : 'Login to Scrambly'}
          </button>
          <p className="text-xs text-muted-foreground mt-4 font-nunito">
            Ages 10–18 only. Parental guidance recommended.
          </p>
        </div>
      </div>
    );
  }

  if (showLocked) {
    return <AccountLockedMessage onLogout={handleLogout} />;
  }

  if (showTimerExpired) {
    return <UsageTimerLockout onLogout={handleLogout} />;
  }

  if (showProfileSetup) {
    return (
      <OnboardingFlow
        onSuccess={() => queryClient.invalidateQueries({ queryKey: ['currentUserProfile'] })}
        onLogout={handleLogout}
      />
    );
  }

  return <>{children}</>;
}
