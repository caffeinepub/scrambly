import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { AlertCircle, Calendar, User } from "lucide-react";
import type React from "react";
import { useState } from "react";
import type { AgeCheckResult } from "../backend";
import { useGetAllUsers, useVerifyAge } from "../hooks/useQueries";
import CameraCaptureStep from "./CameraCaptureStep";

interface OnboardingFlowProps {
  onComplete: () => void;
}

const RESERVED_USERNAME = "TailsTheBeast124";

export default function OnboardingFlow({ onComplete }: OnboardingFlowProps) {
  const [step, setStep] = useState<"camera" | "form">("camera");
  const [name, setName] = useState("");
  const [birthYear, setBirthYear] = useState("");
  const [error, setError] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);

  const verifyAge = useVerifyAge();
  const { data: allUsers = [] } = useGetAllUsers();

  const handleCameraComplete = () => {
    setStep("form");
  };

  const validateUsername = (username: string): string | null => {
    if (!username.trim()) return "Please enter a username.";

    // Check reserved admin username
    if (username.trim().toLowerCase() === RESERVED_USERNAME.toLowerCase()) {
      return "Cannot be admin — this username is reserved.";
    }

    // Check if username is already taken (case-insensitive)
    const taken = allUsers.some(
      ([existingName]) =>
        existingName.toLowerCase() === username.trim().toLowerCase(),
    );
    if (taken) {
      return "Error: This username is already being used! Please choose another username.";
    }

    return null;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");

    const usernameError = validateUsername(name);
    if (usernameError) {
      setError(usernameError);
      return;
    }

    const year = Number.parseInt(birthYear, 10);
    if (!birthYear || Number.isNaN(year) || year < 1900 || year > 2024) {
      setError("Please enter a valid birth year.");
      return;
    }

    setIsSubmitting(true);
    try {
      const result: AgeCheckResult = await verifyAge.mutateAsync({
        name: name.trim(),
        birthYear: BigInt(year),
      });

      if (result.__kind__ === "ok") {
        onComplete();
      } else if (result.__kind__ === "tooYoung") {
        setError("You must be at least 10 years old to use Scrambly.");
      } else if (result.__kind__ === "tooOld") {
        setError("You must be 18 or younger to use Scrambly.");
      } else if (result.__kind__ === "locked") {
        setError("Your account is locked. Please contact support.");
      } else if (result.__kind__ === "invalidInput") {
        setError("Invalid birth year. Please check and try again.");
      }
    } catch (err: any) {
      const msg: string = err?.message ?? String(err);
      if (msg.includes("already being used")) {
        setError(
          "Error: This username is already being used! Please choose another username.",
        );
      } else if (msg.includes("Cannot be admin")) {
        setError("Cannot be admin — this username is reserved.");
      } else {
        setError(msg || "Something went wrong. Please try again.");
      }
    } finally {
      setIsSubmitting(false);
    }
  };

  if (step === "camera") {
    return <CameraCaptureStep onComplete={handleCameraComplete} />;
  }

  return (
    <div className="min-h-screen bg-background flex items-center justify-center p-4">
      <div className="w-full max-w-md">
        <div className="rounded-2xl border border-border bg-card shadow-lg p-8">
          <div className="text-center mb-6">
            <img
              src="/assets/generated/scrambly-logo.dim_512x256.png"
              alt="Scrambly"
              className="h-12 mx-auto mb-4 object-contain"
            />
            <h1 className="text-2xl font-bold text-foreground">
              Welcome to Scrambly!
            </h1>
            <p className="text-muted-foreground text-sm mt-1">
              Set up your profile to get started
            </p>
          </div>

          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="username" className="flex items-center gap-1.5">
                <User className="w-3.5 h-3.5" />
                Username
              </Label>
              <Input
                id="username"
                type="text"
                value={name}
                onChange={(e) => {
                  setName(e.target.value);
                  setError("");
                }}
                placeholder="Choose a username"
                maxLength={30}
                autoComplete="off"
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="birthYear" className="flex items-center gap-1.5">
                <Calendar className="w-3.5 h-3.5" />
                Birth Year
              </Label>
              <Input
                id="birthYear"
                type="number"
                value={birthYear}
                onChange={(e) => {
                  setBirthYear(e.target.value);
                  setError("");
                }}
                placeholder="e.g. 2010"
                min={1900}
                max={2024}
              />
            </div>

            {error && (
              <div className="flex items-start gap-2 p-3 rounded-lg bg-destructive/10 border border-destructive/20">
                <AlertCircle className="w-4 h-4 text-destructive mt-0.5 shrink-0" />
                <p className="text-sm text-destructive">{error}</p>
              </div>
            )}

            <Button
              type="submit"
              className="w-full"
              disabled={isSubmitting || !name.trim() || !birthYear}
            >
              {isSubmitting ? "Setting up..." : "Get Started"}
            </Button>
          </form>
        </div>
      </div>
    </div>
  );
}
