import { Button } from "@/components/ui/button";
import { ShieldOff } from "lucide-react";

interface AccessDeniedScreenProps {
  onLogout: () => void;
}

export default function AccessDeniedScreen({
  onLogout,
}: AccessDeniedScreenProps) {
  return (
    <div className="min-h-screen flex items-center justify-center sonic-gradient speed-lines">
      <div className="bg-card rounded-3xl p-10 max-w-md w-full mx-4 shadow-2xl text-center">
        <div className="w-20 h-20 bg-destructive/10 rounded-full flex items-center justify-center mx-auto mb-4">
          <ShieldOff size={40} className="text-destructive" />
        </div>
        <h2 className="text-3xl font-fredoka text-destructive mb-3">
          Access Denied
        </h2>
        <p className="text-muted-foreground font-nunito mb-4">
          This app is private and only accessible to{" "}
          <span className="font-bold text-primary">TailsTheBeast124</span>.
        </p>
        <div className="bg-destructive/10 rounded-2xl p-4 mb-6 text-left">
          <p className="text-sm font-nunito font-semibold text-destructive mb-2">
            Why am I seeing this?
          </p>
          <ul className="text-sm font-nunito text-muted-foreground space-y-1 list-disc list-inside">
            <li>Scrambly is a private application</li>
            <li>
              Only the user <strong>TailsTheBeast124</strong> is permitted to
              access this app
            </li>
            <li>Your account does not have permission to enter</li>
          </ul>
        </div>
        <p className="text-sm font-nunito text-muted-foreground mb-6">
          If you believe this is a mistake, please contact the app owner.
        </p>
        <Button
          onClick={onLogout}
          variant="destructive"
          className="w-full rounded-full font-fredoka text-lg"
        >
          Logout
        </Button>
      </div>
    </div>
  );
}
