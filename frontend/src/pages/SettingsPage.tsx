import AdBlockerToggle from '../components/AdBlockerToggle';
import { useGetCallerUserProfile } from '../hooks/useQueries';
import { useInternetIdentity } from '../hooks/useInternetIdentity';
import { useQueryClient } from '@tanstack/react-query';
import { Settings, User, Shield, LogOut, Info, Zap } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { getAge, isKidMode } from '../components/KidModeWrapper';
import { Link } from '@tanstack/react-router';

export default function SettingsPage() {
  const { data: profile } = useGetCallerUserProfile();
  const { clear, identity } = useInternetIdentity();
  const queryClient = useQueryClient();

  const userAge = getAge(profile);
  const kidMode = isKidMode(profile);

  const handleLogout = async () => {
    await clear();
    queryClient.clear();
  };

  return (
    <div className="space-y-6 max-w-2xl mx-auto">
      {/* Header */}
      <div className="flex items-center gap-3">
        <div className="w-12 h-12 bg-primary rounded-2xl flex items-center justify-center shadow-sonic">
          <Settings size={24} className="text-primary-foreground" />
        </div>
        <div>
          <h1 className="text-3xl font-fredoka text-foreground">Settings</h1>
          <p className="text-muted-foreground font-nunito text-sm">Customize your Scrambly experience</p>
        </div>
      </div>

      {/* Profile Card */}
      {profile && (
        <div className="sonic-card p-5">
          <h2 className="font-fredoka text-lg text-foreground mb-3 flex items-center gap-2">
            <User size={18} className="text-primary" />
            Your Profile
          </h2>
          <div className="flex items-center gap-4">
            <div className="w-16 h-16 bg-primary/10 rounded-full flex items-center justify-center shrink-0">
              <span className="text-3xl font-fredoka text-primary">
                {profile.name.charAt(0).toUpperCase()}
              </span>
            </div>
            <div className="flex-1">
              <div className="flex items-center gap-2 flex-wrap">
                <p className="font-nunito font-700 text-foreground text-lg">{profile.name}</p>
                {kidMode && (
                  <Badge className="font-nunito text-xs bg-secondary text-secondary-foreground">
                    Kid Mode
                  </Badge>
                )}
                {profile.accountLocked && (
                  <Badge variant="destructive" className="font-nunito text-xs">Locked</Badge>
                )}
              </div>
              <p className="text-sm text-muted-foreground font-nunito">
                Age: {userAge !== null ? userAge : 'Unknown'} • Born: {Number(profile.birthYear)}
              </p>
              {Number(profile.warnings) > 0 && (
                <p className="text-xs text-destructive font-nunito mt-1">
                  ⚠️ {Number(profile.warnings)} warning{Number(profile.warnings) !== 1 ? 's' : ''} on record
                </p>
              )}
            </div>
          </div>
          {identity && (
            <div className="mt-3 pt-3 border-t border-border">
              <p className="text-xs text-muted-foreground font-nunito break-all">
                <strong>Principal:</strong> {identity.getPrincipal().toString()}
              </p>
            </div>
          )}
        </div>
      )}

      {/* Ad Blocker */}
      <div className="space-y-2">
        <h2 className="font-fredoka text-lg text-foreground flex items-center gap-2">
          <Shield size={18} className="text-primary" />
          Privacy & Security
        </h2>
        <AdBlockerToggle />
      </div>

      {/* Parental Controls Link */}
      <div className="sonic-card p-4 flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 bg-secondary/20 rounded-xl flex items-center justify-center">
            <img
              src="/assets/generated/parental-shield-icon.dim_128x128.png"
              alt="Parental"
              className="w-8 h-8 object-contain"
            />
          </div>
          <div>
            <p className="font-nunito font-700 text-foreground">Parental Controls</p>
            <p className="text-xs text-muted-foreground font-nunito">Set timers and manage kid safety</p>
          </div>
        </div>
        <Link
          to="/parental"
          className="flex items-center gap-1 bg-primary text-primary-foreground font-fredoka text-sm px-4 py-2 rounded-full hover:opacity-90 transition-opacity"
        >
          <Shield size={14} />
          Open
        </Link>
      </div>

      {/* App Info */}
      <div className="sonic-card p-5 space-y-3">
        <h2 className="font-fredoka text-lg text-foreground flex items-center gap-2">
          <Info size={18} className="text-primary" />
          About Scrambly
        </h2>
        <div className="space-y-2 text-sm font-nunito text-muted-foreground">
          <div className="flex justify-between">
            <span>Version</span>
            <span className="font-700 text-foreground">1.0.0</span>
          </div>
          <div className="flex justify-between">
            <span>Age Range</span>
            <span className="font-700 text-foreground">10–18 years</span>
          </div>
          <div className="flex justify-between">
            <span>Platform</span>
            <span className="font-700 text-foreground">Internet Computer</span>
          </div>
          <div className="flex justify-between">
            <span>Ad Blocker</span>
            <span className="font-700 text-foreground">Built-in ✓</span>
          </div>
          <div className="flex justify-between">
            <span>Offline Games</span>
            <span className="font-700 text-foreground">Yes ✓</span>
          </div>
        </div>
      </div>

      {/* Features Overview */}
      <div className="bg-primary/5 border border-primary/20 rounded-2xl p-4 space-y-2">
        <h3 className="font-nunito font-700 text-foreground flex items-center gap-2">
          <Zap size={16} className="text-primary" />
          Scrambly Features
        </h3>
        <ul className="text-sm font-nunito text-muted-foreground space-y-1 list-disc list-inside">
          <li>🔍 Sonic Universe Search Engine</li>
          <li>🎮 Offline-playable games (Block Blast, Sonic Runner)</li>
          <li>👥 Age-matched community (13+)</li>
          <li>🛡️ Built-in ad blocker</li>
          <li>⏱️ Parental usage timer</li>
          <li>🚨 Emergency SOS button (always visible)</li>
          <li>🌟 Kid Mode for ages 10–12</li>
        </ul>
      </div>

      {/* Logout */}
      <div className="sonic-card p-4">
        <Button
          onClick={handleLogout}
          variant="outline"
          className="w-full rounded-full font-fredoka text-lg border-destructive text-destructive hover:bg-destructive hover:text-destructive-foreground"
        >
          <LogOut size={16} className="mr-2" />
          Logout from Scrambly
        </Button>
      </div>
    </div>
  );
}
