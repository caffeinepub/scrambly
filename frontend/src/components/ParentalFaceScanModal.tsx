import React, { useEffect, useState, useRef } from "react";
import { useCamera } from "../camera/useCamera";
import { Button } from "@/components/ui/button";
import { Camera, AlertCircle, CheckCircle, Loader2 } from "lucide-react";

interface ParentalFaceScanModalProps {
  onComplete: () => void;
  onSkip: () => void;
}

type ScanStep = "intro" | "scanning" | "countdown" | "verifying" | "done" | "error";

export default function ParentalFaceScanModal({ onComplete, onSkip }: ParentalFaceScanModalProps) {
  const [step, setStep] = useState<ScanStep>("intro");
  const [countdown, setCountdown] = useState(3);
  const countdownRef = useRef<ReturnType<typeof setInterval> | null>(null);

  const { isActive, isSupported, error, isLoading, startCamera, stopCamera, capturePhoto, videoRef, canvasRef } =
    useCamera({ facingMode: "user", quality: 0.8 });

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      if (countdownRef.current) clearInterval(countdownRef.current);
      stopCamera();
    };
  }, []);

  const handleStartScan = async () => {
    setStep("scanning");
    const success = await startCamera();
    if (!success) {
      setStep("error");
      return;
    }
    // Start countdown
    setStep("countdown");
    setCountdown(3);
    countdownRef.current = setInterval(() => {
      setCountdown((prev) => {
        if (prev <= 1) {
          if (countdownRef.current) clearInterval(countdownRef.current);
          handleCapture();
          return 0;
        }
        return prev - 1;
      });
    }, 1000);
  };

  const handleCapture = async () => {
    setStep("verifying");
    // Capture photo
    const photo = await capturePhoto();
    // Immediately discard - do NOT store in state, localStorage, or send to backend
    // photo is intentionally unused and discarded
    void photo;

    // Stop camera
    await stopCamera();

    // Brief "verifying" display then complete
    setTimeout(() => {
      setStep("done");
      setTimeout(() => {
        onComplete();
      }, 1200);
    }, 1500);
  };

  if (isSupported === false) {
    return (
      <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/70">
        <div className="bg-card rounded-2xl p-8 max-w-sm w-full mx-4 text-center shadow-2xl border border-border">
          <AlertCircle className="w-12 h-12 text-destructive mx-auto mb-4" />
          <h2 className="text-xl font-bold text-foreground mb-2">Camera Not Supported</h2>
          <p className="text-muted-foreground mb-6">
            Your browser does not support camera access. Please proceed with PIN entry.
          </p>
          <Button onClick={onSkip} className="w-full">
            Skip to PIN Entry
          </Button>
        </div>
      </div>
    );
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/70">
      <div className="bg-card rounded-2xl p-6 max-w-md w-full mx-4 shadow-2xl border border-border">
        {/* Intro Step */}
        {step === "intro" && (
          <div className="text-center">
            <Camera className="w-14 h-14 text-primary mx-auto mb-4" />
            <h2 className="text-2xl font-bold text-foreground mb-2">Parent Verification</h2>
            <p className="text-muted-foreground mb-6">
              To access Parental Controls, we need to verify you are a parent. Please allow camera access for a quick
              face scan. Your image is <strong>never stored</strong> and is immediately discarded.
            </p>
            <div className="flex gap-3">
              <Button variant="outline" onClick={onSkip} className="flex-1">
                Skip to PIN
              </Button>
              <Button onClick={handleStartScan} className="flex-1">
                <Camera className="w-4 h-4 mr-2" />
                Start Scan
              </Button>
            </div>
          </div>
        )}

        {/* Scanning / Countdown Step */}
        {(step === "scanning" || step === "countdown") && (
          <div className="text-center">
            <h2 className="text-xl font-bold text-foreground mb-4">
              {step === "scanning" ? "Starting Camera..." : "Look at the camera"}
            </h2>

            {/* Camera Preview */}
            <div
              className="relative mx-auto rounded-xl overflow-hidden bg-black mb-4"
              style={{ width: "100%", aspectRatio: "4/3" }}
            >
              <video
                ref={videoRef}
                autoPlay
                playsInline
                muted
                className="w-full h-full object-cover"
                style={{ transform: "scaleX(-1)" }}
              />
              <canvas ref={canvasRef} className="hidden" />

              {/* Countdown Overlay */}
              {step === "countdown" && countdown > 0 && (
                <div className="absolute inset-0 flex items-center justify-center">
                  <div className="bg-black/60 rounded-full w-20 h-20 flex items-center justify-center">
                    <span className="text-white text-5xl font-bold">{countdown}</span>
                  </div>
                </div>
              )}

              {/* Face outline guide */}
              {step === "countdown" && (
                <div
                  className="absolute inset-0 flex items-center justify-center pointer-events-none"
                  style={{ top: "10%" }}
                >
                  <div
                    className="border-4 border-primary rounded-full opacity-60"
                    style={{ width: "120px", height: "150px" }}
                  />
                </div>
              )}
            </div>

            {isLoading && step === "scanning" && (
              <div className="flex items-center justify-center gap-2 text-muted-foreground">
                <Loader2 className="w-4 h-4 animate-spin" />
                <span>Initializing camera...</span>
              </div>
            )}

            {step === "countdown" && (
              <p className="text-muted-foreground">
                {countdown > 0 ? `Capturing in ${countdown}...` : "Capturing..."}
              </p>
            )}

            <Button variant="outline" onClick={onSkip} className="mt-4">
              Skip to PIN
            </Button>
          </div>
        )}

        {/* Verifying Step */}
        {step === "verifying" && (
          <div className="text-center py-8">
            <Loader2 className="w-14 h-14 text-primary mx-auto mb-4 animate-spin" />
            <h2 className="text-xl font-bold text-foreground mb-2">Verifying parent identity...</h2>
            <p className="text-muted-foreground text-sm">Your image is being checked and immediately discarded.</p>
          </div>
        )}

        {/* Done Step */}
        {step === "done" && (
          <div className="text-center py-8">
            <CheckCircle className="w-14 h-14 text-green-500 mx-auto mb-4" />
            <h2 className="text-xl font-bold text-foreground mb-2">Verification Complete!</h2>
            <p className="text-muted-foreground">Proceeding to PIN entry...</p>
          </div>
        )}

        {/* Error Step */}
        {(step === "error" || error) && (
          <div className="text-center">
            <AlertCircle className="w-12 h-12 text-destructive mx-auto mb-4" />
            <h2 className="text-xl font-bold text-foreground mb-2">Camera Error</h2>
            <p className="text-muted-foreground mb-2">
              {error?.message || "Could not access camera. Please check your permissions."}
            </p>
            <p className="text-sm text-muted-foreground mb-6">You can still access Parental Controls with your PIN.</p>
            <Button onClick={onSkip} className="w-full">
              Skip to PIN Entry
            </Button>
          </div>
        )}
      </div>
    </div>
  );
}
