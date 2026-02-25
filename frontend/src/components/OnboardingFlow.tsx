import React, { useState } from 'react';
import CameraCaptureStep from './CameraCaptureStep';
import AgeVerificationModal from './AgeVerificationModal';

const SESSION_KEY = 'scrambly_onboarding_camera_done';

interface OnboardingFlowProps {
  onSuccess: () => void;
  onLogout: () => void;
}

type Step = 'camera' | 'age';

export default function OnboardingFlow({ onSuccess, onLogout }: OnboardingFlowProps) {
  // If camera step was already done this session, skip straight to age verification
  const [step, setStep] = useState<Step>(() => {
    return sessionStorage.getItem(SESSION_KEY) === 'true' ? 'age' : 'camera';
  });

  const handleCameraComplete = () => {
    sessionStorage.setItem(SESSION_KEY, 'true');
    setStep('age');
  };

  if (step === 'camera') {
    return (
      <div className="min-h-screen flex items-center justify-center sonic-gradient speed-lines">
        <div className="bg-card rounded-3xl p-8 max-w-md w-full mx-4 shadow-2xl">
          {/* Step indicator */}
          <div className="flex items-center justify-center gap-2 mb-6">
            <div className="flex items-center gap-1.5">
              <div className="w-7 h-7 rounded-full bg-primary text-primary-foreground flex items-center justify-center text-xs font-fredoka font-bold">1</div>
              <span className="text-xs font-nunito text-foreground font-700">Face Check</span>
            </div>
            <div className="w-8 h-0.5 bg-muted-foreground/30 rounded" />
            <div className="flex items-center gap-1.5">
              <div className="w-7 h-7 rounded-full bg-muted text-muted-foreground flex items-center justify-center text-xs font-fredoka">2</div>
              <span className="text-xs font-nunito text-muted-foreground">Age Check</span>
            </div>
          </div>

          <CameraCaptureStep onComplete={handleCameraComplete} />

          <button
            onClick={onLogout}
            className="mt-5 w-full text-center text-sm text-muted-foreground hover:text-foreground font-nunito transition-colors"
          >
            Logout
          </button>
        </div>
      </div>
    );
  }

  // Age verification step — reuse existing modal component
  return (
    <AgeVerificationModal
      onSuccess={onSuccess}
      onLogout={onLogout}
    />
  );
}
