import { Button } from "@/components/ui/button";
import { Clock, Moon } from "lucide-react";

interface UsageTimerLockoutProps {
  onLogout: () => void;
}

export default function UsageTimerLockout({
  onLogout,
}: UsageTimerLockoutProps) {
  return (
    <div className="min-h-screen flex items-center justify-center sonic-gradient speed-lines">
      <div className="bg-card rounded-3xl p-10 max-w-md w-full mx-4 shadow-2xl text-center">
        <div className="w-20 h-20 bg-secondary/20 rounded-full flex items-center justify-center mx-auto mb-4">
          <Clock size={40} className="text-secondary-foreground" />
        </div>
        <h2 className="text-3xl font-fredoka text-primary mb-3">
          Time's Up! 🌙
        </h2>
        <p className="text-muted-foreground font-nunito mb-4">
          Your screen time limit has been reached for today. Time to take a
          break!
        </p>
        <div className="bg-secondary/20 rounded-2xl p-4 mb-6">
          <div className="flex items-center gap-2 justify-center mb-2">
            <Moon size={20} className="text-primary" />
            <span className="font-nunito font-700 text-foreground">
              Parental Controls Active
            </span>
          </div>
          <p className="text-sm font-nunito text-muted-foreground">
            A parent or guardian has set a daily time limit for your Scrambly
            usage. Come back tomorrow!
          </p>
        </div>
        <p className="text-sm font-nunito text-muted-foreground mb-6">
          💡 Tip: Go outside, read a book, or spend time with family!
        </p>
        <Button
          onClick={onLogout}
          className="w-full rounded-full font-fredoka text-lg bg-primary text-primary-foreground"
        >
          Logout
        </Button>
      </div>
    </div>
  );
}
