import { useGetCallerUserProfile } from '../hooks/useQueries';
import CommunityPostForm from '../components/CommunityPostForm';
import CommunityFeed from '../components/CommunityFeed';
import { Link } from '@tanstack/react-router';
import { Users, UserSearch, Shield } from 'lucide-react';
import { isKidMode } from '../components/KidModeWrapper';

export default function CommunityPage() {
  const { data: profile } = useGetCallerUserProfile();
  const kidMode = isKidMode(profile);

  if (kidMode) {
    return (
      <div className="text-center py-16">
        <div className="text-6xl mb-4">🌟</div>
        <h2 className="text-3xl font-fredoka text-primary mb-3">Kid Mode Active</h2>
        <p className="text-muted-foreground font-nunito max-w-md mx-auto">
          The community features are available for users aged 13 and up. Keep exploring games and search!
        </p>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between flex-wrap gap-3">
        <div className="flex items-center gap-3">
          <img
            src="/assets/generated/community-icon.dim_128x128.png"
            alt="Community"
            className="w-12 h-12 rounded-2xl object-cover"
          />
          <div>
            <h1 className="text-3xl font-fredoka text-foreground">Community</h1>
            <p className="text-muted-foreground font-nunito text-sm">Connect with Sonic fans your age!</p>
          </div>
        </div>
        <Link
          to="/age-matcher"
          className="flex items-center gap-2 bg-secondary text-secondary-foreground font-fredoka px-4 py-2 rounded-full hover:opacity-90 transition-opacity text-sm"
        >
          <UserSearch size={16} />
          Find Friends
        </Link>
      </div>

      {/* Warnings display */}
      {profile && Number(profile.warnings) > 0 && (
        <div className="bg-destructive/10 border border-destructive/30 rounded-2xl p-4 flex items-center gap-3">
          <Shield size={20} className="text-destructive shrink-0" />
          <div>
            <p className="font-nunito font-700 text-destructive text-sm">
              ⚠️ You have {Number(profile.warnings)} warning{Number(profile.warnings) !== 1 ? 's' : ''}
            </p>
            <p className="text-xs text-muted-foreground font-nunito mt-0.5">
              After 3 warnings your account will be locked. Please follow community guidelines.
            </p>
          </div>
        </div>
      )}

      {/* Community Guidelines */}
      <div className="bg-primary/5 border border-primary/20 rounded-2xl p-4">
        <div className="flex items-center gap-2 mb-2">
          <Users size={16} className="text-primary" />
          <span className="font-nunito font-700 text-foreground text-sm">Community Guidelines</span>
        </div>
        <ul className="text-xs font-nunito text-muted-foreground space-y-1 list-disc list-inside">
          <li>Be kind and respectful to all Sonic fans</li>
          <li>No inappropriate language or content</li>
          <li>3 warnings = account locked permanently</li>
          <li>Have fun and share your love of Sonic! 🦔</li>
        </ul>
      </div>

      {/* Post Form */}
      <div>
        <h2 className="text-xl font-fredoka text-foreground mb-3">Share with the Community</h2>
        <CommunityPostForm />
      </div>

      {/* Feed */}
      <div>
        <h2 className="text-xl font-fredoka text-foreground mb-3">Community Feed</h2>
        <CommunityFeed />
      </div>
    </div>
  );
}
