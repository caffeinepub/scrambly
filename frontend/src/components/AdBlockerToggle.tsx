import { useAdBlocker } from '../hooks/useAdBlocker';
import { Switch } from '@/components/ui/switch';
import { Label } from '@/components/ui/label';
import { Shield, ShieldOff } from 'lucide-react';

export default function AdBlockerToggle() {
  const { adBlockerEnabled, toggle } = useAdBlocker();

  return (
    <div className="flex items-center justify-between p-4 bg-card rounded-2xl border border-border">
      <div className="flex items-center gap-3">
        {adBlockerEnabled ? (
          <Shield size={24} className="text-primary" />
        ) : (
          <ShieldOff size={24} className="text-muted-foreground" />
        )}
        <div>
          <Label className="font-nunito font-700 text-foreground text-base cursor-pointer">Ad Blocker</Label>
          <p className="text-xs text-muted-foreground font-nunito">
            {adBlockerEnabled ? 'Ads are currently blocked' : 'Ads are currently allowed'}
          </p>
        </div>
      </div>
      <div className="flex items-center gap-2">
        {adBlockerEnabled && (
          <span className="text-xs font-nunito font-700 bg-primary/10 text-primary px-2 py-1 rounded-full">
            Ads Blocked
          </span>
        )}
        <Switch checked={adBlockerEnabled} onCheckedChange={toggle} />
      </div>
    </div>
  );
}
