import { Button } from "@/components/ui/button";
import { Lock } from "lucide-react";

interface AccountLockedMessageProps {
  onLogout: () => void;
}

export default function AccountLockedMessage({
  onLogout,
}: AccountLockedMessageProps) {
  return (
    <div className="min-h-screen flex items-center justify-center sonic-gradient speed-lines">
      <div className="bg-card rounded-3xl p-10 max-w-md w-full mx-4 shadow-2xl text-center">
        <div className="w-20 h-20 bg-destructive/10 rounded-full flex items-center justify-center mx-auto mb-4">
          <Lock size={40} className="text-destructive" />
        </div>
        <h2 className="text-3xl font-fredoka text-destructive mb-3">
          Account Locked
        </h2>
        <p className="text-muted-foreground font-nunito mb-4">
          Your account has been locked due to repeated violations of Scrambly's
          community guidelines.
        </p>
        <div className="bg-destructive/10 rounded-2xl p-4 mb-6 text-left">
          <p className="text-sm font-nunito font-700 text-destructive mb-2">
            What happened?
          </p>
          <ul className="text-sm font-nunito text-muted-foreground space-y-1 list-disc list-inside">
            <li>You received 3 or more warnings from moderators</li>
            <li>This is usually due to inappropriate behavior</li>
            <li>Your account has been permanently locked</li>
          </ul>
        </div>
        <p className="text-sm font-nunito text-muted-foreground mb-6">
          To continue using Scrambly, you'll need to create a new account and
          follow our community rules.
        </p>
        <Button
          onClick={onLogout}
          variant="destructive"
          className="w-full rounded-full font-fredoka text-lg"
        >
          Logout & Create New Account
        </Button>
      </div>
    </div>
  );
}
