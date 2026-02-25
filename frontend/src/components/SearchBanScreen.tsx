import { Ban, LogOut, MessageSquare, ShieldAlert } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { useInternetIdentity } from '../hooks/useInternetIdentity';
import { useQueryClient } from '@tanstack/react-query';

interface SearchBanScreenProps {
  banType: 'anime' | 'porn';
  message: string;
  appealUsed: boolean;
  isAppealAvailable: boolean;
  onAppealSubmitted: () => void;
}

export default function SearchBanScreen({
  banType,
  message,
  appealUsed,
  isAppealAvailable,
}: SearchBanScreenProps) {
  const { clear } = useInternetIdentity();
  const queryClient = useQueryClient();

  const handleLogout = async () => {
    await clear();
    queryClient.clear();
  };

  const handleAppeal = () => {
    window.location.href = 'https://yodelling-chocolate-q60-draft.caffeine.xyz/';
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-background/95 backdrop-blur-sm p-4">
      <div className="max-w-md w-full sonic-card p-8 text-center space-y-6 border-2 border-destructive/40">
        {/* Icon */}
        <div className="flex justify-center">
          <div className="w-20 h-20 rounded-full bg-destructive/10 flex items-center justify-center">
            <Ban size={40} className="text-destructive" />
          </div>
        </div>

        {/* Title */}
        <div>
          <h1 className="font-fredoka text-3xl text-destructive mb-2">
            {banType === 'porn' ? 'Permanent Ban' : 'Search Banned'}
          </h1>
          <p className="font-nunito text-muted-foreground text-sm leading-relaxed">
            {message}
          </p>
        </div>

        {/* Warning count indicator */}
        <div className="bg-destructive/5 rounded-xl p-4 border border-destructive/20">
          <div className="flex items-center justify-center gap-2 mb-2">
            <ShieldAlert size={16} className="text-destructive" />
            <span className="font-fredoka text-sm text-destructive">
              {banType === 'porn' ? 'Permanent Ban' : 'Search Access Revoked'}
            </span>
          </div>
          <p className="text-xs font-nunito text-muted-foreground">
            {banType === 'porn'
              ? 'You searched for inappropriate content multiple times.'
              : 'You have searched for too many restricted topics. Search access has been revoked.'}
          </p>
        </div>

        {/* Appeal already used notice */}
        {appealUsed && (
          <div className="bg-muted rounded-xl p-3 text-sm font-nunito text-muted-foreground">
            ❌ You have already used your one appeal. No further appeals are available.
          </div>
        )}

        {/* Can I Appeal? button — only shown when appeal is available */}
        {isAppealAvailable && (
          <Button
            onClick={handleAppeal}
            className="w-full font-fredoka text-base py-3 bg-sonic-blue hover:bg-sonic-blue/90 text-sonic-yellow border-2 border-sonic-yellow/40 shadow-md"
          >
            <MessageSquare size={18} className="mr-2" />
            Can I Appeal?
          </Button>
        )}

        {/* Logout button */}
        <Button
          onClick={handleLogout}
          variant="ghost"
          className="w-full font-fredoka text-muted-foreground hover:text-foreground"
        >
          <LogOut size={14} className="mr-2" />
          Log Out
        </Button>
      </div>
    </div>
  );
}
