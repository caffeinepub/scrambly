import { AlertTriangle, X } from 'lucide-react';
import { useState } from 'react';

interface SearchWarningNoticeProps {
  count: number;
  remaining: number;
  message: string;
  onDismiss?: () => void;
}

export default function SearchWarningNotice({
  count,
  remaining,
  message,
  onDismiss,
}: SearchWarningNoticeProps) {
  const [dismissed, setDismissed] = useState(false);

  if (dismissed) return null;

  const handleDismiss = () => {
    setDismissed(true);
    onDismiss?.();
  };

  return (
    <div className="relative rounded-2xl border-2 border-warning bg-warning/10 p-4 flex gap-3 items-start shadow-md">
      <div className="shrink-0 mt-0.5">
        <AlertTriangle size={22} className="text-warning" />
      </div>
      <div className="flex-1 min-w-0">
        <p className="font-fredoka text-base text-warning-foreground mb-1">
          ⚠️ Search Warning — {count} Warning{count !== 1 ? 's' : ''} Issued
        </p>
        <p className="text-sm font-nunito text-warning-foreground/90 leading-relaxed">
          {message}
        </p>
        {remaining > 0 && (
          <div className="mt-2 flex items-center gap-2">
            <div className="flex gap-1">
              {Array.from({ length: 3 }).map((_, i) => (
                <div
                  key={i}
                  className={`w-3 h-3 rounded-full border-2 border-warning ${
                    i < count ? 'bg-warning' : 'bg-transparent'
                  }`}
                />
              ))}
            </div>
            <span className="text-xs font-nunito text-warning-foreground/70">
              {remaining} warning{remaining !== 1 ? 's' : ''} left before ban
            </span>
          </div>
        )}
        {remaining === 0 && (
          <p className="mt-2 text-xs font-nunito font-bold text-destructive">
            🚨 Next violation will result in a ban!
          </p>
        )}
      </div>
      <button
        onClick={handleDismiss}
        className="shrink-0 text-warning-foreground/60 hover:text-warning-foreground transition-colors"
        aria-label="Dismiss warning"
      >
        <X size={16} />
      </button>
    </div>
  );
}
