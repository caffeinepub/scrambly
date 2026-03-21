import { Checkbox } from "@/components/ui/checkbox";
import { Label } from "@/components/ui/label";
import { useQueryClient } from "@tanstack/react-query";
import { Zap } from "lucide-react";
import type React from "react";
import { useEffect, useRef, useState } from "react";
import { useInternetIdentity } from "../hooks/useInternetIdentity";
import { useGetCallerUserProfile } from "../hooks/useQueries";
import { useUsageTimer } from "../hooks/useUsageTimer";
import AccountLockedMessage from "./AccountLockedMessage";
import OnboardingFlow from "./OnboardingFlow";
import UsageTimerLockout from "./UsageTimerLockout";

const REMEMBER_ME_KEY = "rememberMe";
const LAST_USERNAME_KEY = "scramblyLastUsername";
const DEFAULT_USERNAME = "TailsTheBeast124";

interface AuthGateProps {
  children: React.ReactNode;
}

export default function AuthGate({ children }: AuthGateProps) {
  const { identity, isInitializing, login, clear, isLoggingIn } =
    useInternetIdentity();
  const queryClient = useQueryClient();
  const isAuthenticated = !!identity;

  const {
    data: userProfile,
    isLoading: profileLoading,
    isFetched,
  } = useGetCallerUserProfile();
  const { isExpired } = useUsageTimer(userProfile);

  // Remember Me state — initialize from localStorage
  const [rememberMe, setRememberMe] = useState<boolean>(() => {
    try {
      return localStorage.getItem(REMEMBER_ME_KEY) === "true";
    } catch {
      return false;
    }
  });

  // Last username — read once on mount; default to TailsTheBeast124 if none stored
  const [lastUsername] = useState<string>(() => {
    try {
      return localStorage.getItem(LAST_USERNAME_KEY) || DEFAULT_USERNAME;
    } catch {
      return DEFAULT_USERNAME;
    }
  });

  // Store username in localStorage when profile loads
  useEffect(() => {
    if (userProfile?.name) {
      try {
        localStorage.setItem(LAST_USERNAME_KEY, userProfile.name);
      } catch {
        // ignore
      }
    }
  }, [userProfile]);

  // Auto-login attempt when rememberMe is set and user is not yet authenticated
  const autoLoginAttempted = useRef(false);
  useEffect(() => {
    if (
      !isInitializing &&
      !isAuthenticated &&
      rememberMe &&
      !autoLoginAttempted.current
    ) {
      autoLoginAttempted.current = true;
      try {
        login();
      } catch {
        // If auto-login fails, just show the login screen normally
      }
    }
  }, [isInitializing, isAuthenticated, rememberMe, login]);

  const handleRememberMeChange = (checked: boolean) => {
    setRememberMe(checked);
    try {
      if (checked) {
        localStorage.setItem(REMEMBER_ME_KEY, "true");
      } else {
        localStorage.removeItem(REMEMBER_ME_KEY);
      }
    } catch {
      // ignore storage errors
    }
  };

  const handleLogin = () => {
    try {
      if (rememberMe) {
        localStorage.setItem(REMEMBER_ME_KEY, "true");
      } else {
        localStorage.removeItem(REMEMBER_ME_KEY);
      }
    } catch {
      // ignore
    }
    login();
  };

  const handleLogout = async () => {
    await clear();
    queryClient.clear();
    // NOTE: intentionally do NOT clear LAST_USERNAME_KEY so "Sign in as USERNAME" persists
  };

  const handleOnboardingComplete = async () => {
    await queryClient.invalidateQueries({ queryKey: ["currentUserProfile"] });
  };

  const showProfileSetup =
    isAuthenticated && !profileLoading && isFetched && userProfile === null;
  const showLocked =
    isAuthenticated &&
    !profileLoading &&
    isFetched &&
    userProfile?.accountLocked === true;
  const showTimerExpired =
    isAuthenticated &&
    !profileLoading &&
    isFetched &&
    userProfile != null &&
    isExpired;

  if (isInitializing) {
    return (
      <div className="min-h-screen flex items-center justify-center sonic-gradient">
        <div className="text-center text-white">
          <div className="text-5xl font-fredoka mb-4 animate-bounce-sonic">
            SCRAMBLY
          </div>
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
          <h1 className="text-4xl font-fredoka text-primary mb-2">
            Welcome to Scrambly!
          </h1>
          <p className="text-muted-foreground font-nunito mb-2">
            The Sonic-powered super app for fans aged 10–18.
          </p>
          <p className="text-sm text-muted-foreground font-nunito mb-6">
            Search Sonic lore, play games, connect with fans your age, and more!
          </p>

          <button
            type="button"
            onClick={handleLogin}
            disabled={isLoggingIn}
            className="sonic-btn-primary w-full flex items-center justify-center gap-2 mb-2"
            data-ocid="auth.primary_button"
          >
            <Zap size={18} />
            {isLoggingIn ? "Logging in..." : `Sign in as ${lastUsername}`}
          </button>

          <p className="text-xs text-muted-foreground mb-4 font-nunito">
            Not you?{" "}
            <button
              type="button"
              onClick={handleLogin}
              className="underline text-primary hover:text-primary/80 transition-colors"
              data-ocid="auth.secondary_button"
            >
              Sign in with a different account
            </button>
          </p>

          {/* Remember Me checkbox */}
          <div className="flex items-center justify-center gap-2 mb-4">
            <Checkbox
              id="remember-me"
              checked={rememberMe}
              onCheckedChange={(checked) =>
                handleRememberMeChange(checked === true)
              }
              className="border-primary data-[state=checked]:bg-primary data-[state=checked]:border-primary"
              data-ocid="auth.checkbox"
            />
            <Label
              htmlFor="remember-me"
              className="text-sm font-nunito text-foreground cursor-pointer select-none"
            >
              Remember me
            </Label>
          </div>

          <p className="text-xs text-muted-foreground mt-2 font-nunito">
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
    return <OnboardingFlow onComplete={handleOnboardingComplete} />;
  }

  return <>{children}</>;
}
