import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { useNavigate } from "@tanstack/react-router";
import {
  ArrowLeft,
  CheckCircle,
  Send,
  ShieldCheck,
  XCircle,
} from "lucide-react";
import { useState } from "react";
import { useSearchModerator } from "../hooks/useSearchModerator";

const MIN_LENGTH = 20;
const MAX_LENGTH = 500;

// The origin that is allowed to submit appeals
const ALLOWED_ORIGIN = "https://yodelling-chocolate-q60-draft.caffeine.xyz";

export default function AppealPage() {
  const navigate = useNavigate();
  const { appealUsed, processAppeal, isBanned } = useSearchModerator();

  const [appealText, setAppealText] = useState("");
  const [submitted, setSubmitted] = useState(false);
  const [showConfirmation, setShowConfirmation] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const charCount = appealText.length;
  const isValid = charCount >= MIN_LENGTH && charCount <= MAX_LENGTH;

  // Check if this origin is allowed to submit appeals
  const isAllowedOrigin = window.location.origin === ALLOWED_ORIGIN;

  const handleSubmit = () => {
    setError(null);

    if (!isAllowedOrigin) {
      setError(
        `Appeals can only be submitted from the official Scrambly site. Please visit ${ALLOWED_ORIGIN} to submit your appeal.`,
      );
      return;
    }

    if (appealUsed) {
      setError(
        "You have already used your one appeal. No further appeals are available.",
      );
      return;
    }

    if (!isValid) {
      setError(
        `Your appeal must be between ${MIN_LENGTH} and ${MAX_LENGTH} characters.`,
      );
      return;
    }

    // Process the appeal — grants +2% life, clears ban, marks appeal used
    processAppeal();
    setSubmitted(true);
    setShowConfirmation(true);
  };

  const handleAcknowledge = () => {
    setShowConfirmation(false);
    navigate({ to: "/" });
  };

  const handleBack = () => {
    navigate({ to: "/" });
  };

  // If appeal already used and not just submitted now
  if (appealUsed && !submitted) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center p-4">
        <div className="max-w-md w-full sonic-card p-8 text-center space-y-6">
          <div className="flex justify-center">
            <div className="w-20 h-20 rounded-full bg-destructive/10 flex items-center justify-center">
              <XCircle size={40} className="text-destructive" />
            </div>
          </div>
          <div>
            <h1 className="font-fredoka text-3xl text-destructive mb-2">
              Appeal Already Used
            </h1>
            <p className="font-nunito text-muted-foreground text-sm leading-relaxed">
              You have already submitted an appeal. Each account is only allowed
              one appeal. No further appeals are available.
            </p>
          </div>
          <Button
            onClick={handleBack}
            variant="outline"
            className="w-full font-fredoka"
          >
            <ArrowLeft size={16} className="mr-2" />
            Go Back
          </Button>
        </div>
      </div>
    );
  }

  // If not banned and appeal not used, show a "nothing to appeal" state
  if (!isBanned && !submitted) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center p-4">
        <div className="max-w-md w-full sonic-card p-8 text-center space-y-6">
          <div className="flex justify-center">
            <div className="w-20 h-20 rounded-full bg-primary/10 flex items-center justify-center">
              <ShieldCheck size={40} className="text-primary" />
            </div>
          </div>
          <div>
            <h1 className="font-fredoka text-3xl text-primary mb-2">
              No Active Ban
            </h1>
            <p className="font-nunito text-muted-foreground text-sm leading-relaxed">
              You don't currently have an active ban to appeal. Head back to
              search!
            </p>
          </div>
          <Button
            onClick={handleBack}
            className="w-full font-fredoka bg-sonic-blue hover:bg-sonic-blue/90 text-sonic-yellow"
          >
            <ArrowLeft size={16} className="mr-2" />
            Back to Search
          </Button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background flex items-center justify-center p-4">
      {/* Post-appeal confirmation modal */}
      {showConfirmation && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-background/90 backdrop-blur-sm p-4">
          <div className="max-w-sm w-full sonic-card p-8 text-center space-y-6 border-2 border-sonic-yellow/40">
            <div className="flex justify-center">
              <div className="w-20 h-20 rounded-full bg-sonic-yellow/10 flex items-center justify-center">
                <CheckCircle size={40} className="text-sonic-yellow" />
              </div>
            </div>
            <div>
              <h2 className="font-fredoka text-2xl text-foreground mb-3">
                Appeal Approved!
              </h2>
              <div className="bg-sonic-yellow/10 border border-sonic-yellow/30 rounded-xl p-4">
                <p className="font-fredoka text-xl text-sonic-yellow mb-2">
                  ❤️ +1 Life
                </p>
                <p className="font-nunito text-sm text-foreground leading-relaxed font-bold">
                  1+ life — do not do it again, search something that's safe and
                  Sonic related
                </p>
              </div>
              <p className="font-nunito text-xs text-muted-foreground mt-3">
                Your search access has been restored with +2% life. This is your
                final warning — any further violations will result in a
                permanent ban with no appeal.
              </p>
            </div>
            <Button
              onClick={handleAcknowledge}
              className="w-full font-fredoka bg-sonic-blue hover:bg-sonic-blue/90 text-sonic-yellow text-base py-3"
            >
              I Understand — Back to Search
            </Button>
          </div>
        </div>
      )}

      <div className="max-w-lg w-full space-y-6">
        {/* Header */}
        <div className="sonic-card p-6 text-center border-2 border-sonic-blue/30">
          <div className="flex justify-center mb-4">
            <img
              src="/assets/generated/scrambly-logo.dim_512x256.png"
              alt="Scrambly"
              className="h-12 object-contain"
            />
          </div>
          <div className="flex justify-center mb-3">
            <div className="w-16 h-16 rounded-full bg-sonic-blue/10 flex items-center justify-center">
              <ShieldCheck size={32} className="text-sonic-blue" />
            </div>
          </div>
          <h1 className="font-fredoka text-3xl text-foreground mb-1">
            Ban Appeal
          </h1>
          <p className="font-nunito text-muted-foreground text-sm">
            Submit your appeal below. You only get <strong>one chance</strong> —
            make it count!
          </p>
        </div>

        {/* Appeal form */}
        <div className="sonic-card p-6 space-y-4">
          {/* Origin warning */}
          {!isAllowedOrigin && (
            <div className="bg-destructive/10 border border-destructive/30 rounded-xl p-4">
              <p className="font-fredoka text-sm text-destructive mb-1">
                ⚠️ Wrong Site
              </p>
              <p className="font-nunito text-xs text-muted-foreground">
                Appeals must be submitted from{" "}
                <a
                  href={ALLOWED_ORIGIN}
                  className="text-primary underline"
                  target="_blank"
                  rel="noopener noreferrer"
                >
                  {ALLOWED_ORIGIN}
                </a>
                . You are currently on <strong>{window.location.origin}</strong>
                .
              </p>
            </div>
          )}

          <div className="space-y-2">
            <label
              htmlFor="appeal-reason"
              className="font-fredoka text-sm text-foreground block"
            >
              Why should your ban be reconsidered?
            </label>
            <Textarea
              id="appeal-reason"
              value={appealText}
              onChange={(e) => setAppealText(e.target.value)}
              placeholder="Explain why you believe your ban should be lifted. Be honest and respectful..."
              className="font-nunito text-sm resize-none"
              rows={6}
              maxLength={MAX_LENGTH}
              disabled={submitted}
            />
            <div className="flex justify-between items-center">
              <span
                className={`text-xs font-nunito ${charCount < MIN_LENGTH ? "text-destructive" : "text-muted-foreground"}`}
              >
                {charCount < MIN_LENGTH
                  ? `${MIN_LENGTH - charCount} more characters needed`
                  : `${charCount} / ${MAX_LENGTH}`}
              </span>
              <span
                className={`text-xs font-nunito ${charCount > MAX_LENGTH ? "text-destructive" : "text-muted-foreground"}`}
              >
                {charCount > MAX_LENGTH
                  ? `${charCount - MAX_LENGTH} over limit`
                  : ""}
              </span>
            </div>
          </div>

          {/* Error message */}
          {error && (
            <div className="bg-destructive/10 border border-destructive/30 rounded-xl p-3">
              <p className="font-nunito text-sm text-destructive">{error}</p>
            </div>
          )}

          {/* Info box */}
          <div className="bg-sonic-blue/5 border border-sonic-blue/20 rounded-xl p-3">
            <p className="font-nunito text-xs text-muted-foreground leading-relaxed">
              📋 <strong>Important:</strong> This is your one and only appeal.
              If approved, you will receive +2% life (1 life restore) and your
              search access will be restored. Any further violations will result
              in a permanent ban with no further appeals.
            </p>
          </div>

          {/* Submit button */}
          <Button
            onClick={handleSubmit}
            disabled={!isValid || submitted || !isAllowedOrigin}
            className="w-full font-fredoka text-base py-3 bg-sonic-blue hover:bg-sonic-blue/90 text-sonic-yellow disabled:opacity-50"
          >
            <Send size={16} className="mr-2" />
            Submit Appeal
          </Button>

          {/* Back button */}
          <Button
            onClick={handleBack}
            variant="ghost"
            className="w-full font-fredoka text-muted-foreground hover:text-foreground"
          >
            <ArrowLeft size={14} className="mr-2" />
            Back to Search
          </Button>
        </div>
      </div>
    </div>
  );
}
