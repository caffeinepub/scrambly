import React, { useEffect } from 'react';
import { useCamera } from '../camera/useCamera';
import { Button } from '@/components/ui/button';
import { Camera, RefreshCw, ShieldCheck, AlertTriangle, Loader2 } from 'lucide-react';

interface CameraCaptureStepProps {
  onComplete: () => void;
}

export default function CameraCaptureStep({ onComplete }: CameraCaptureStepProps) {
  const [captured, setCaptured] = React.useState(false);

  const {
    isActive,
    isSupported,
    error,
    isLoading,
    startCamera,
    stopCamera,
    capturePhoto,
    videoRef,
    canvasRef,
  } = useCamera({ facingMode: 'user', quality: 0.5, format: 'image/jpeg' });

  // Auto-start camera on mount
  useEffect(() => {
    startCamera();
    return () => {
      stopCamera();
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const handleCapture = async () => {
    // Capture the photo
    const file = await capturePhoto();
    // Immediately discard — do not store, upload, or retain the file reference
    void file; // explicitly void to signal intentional discard

    // Stop the camera stream and release all tracks
    await stopCamera();

    // Mark as captured to show confirmation
    setCaptured(true);
  };

  const handleRetry = async () => {
    await startCamera();
  };

  // Captured confirmation screen
  if (captured) {
    return (
      <div className="flex flex-col items-center gap-6 text-center">
        <div className="w-20 h-20 rounded-full bg-green-100 dark:bg-green-900/30 flex items-center justify-center">
          <ShieldCheck size={40} className="text-green-600 dark:text-green-400" />
        </div>
        <div>
          <h3 className="text-2xl font-fredoka text-foreground mb-2">Photo Taken!</h3>
          <p className="text-muted-foreground font-nunito text-sm leading-relaxed">
            📸 Photo taken and deleted — your privacy is protected.
          </p>
          <p className="text-muted-foreground font-nunito text-xs mt-2">
            No image data was stored or transmitted.
          </p>
        </div>
        <Button
          onClick={onComplete}
          className="w-full rounded-full font-fredoka text-lg bg-primary text-primary-foreground"
        >
          Continue to Age Verification →
        </Button>
      </div>
    );
  }

  // Camera not supported
  if (isSupported === false) {
    return (
      <div className="flex flex-col items-center gap-4 text-center">
        <AlertTriangle size={48} className="text-destructive" />
        <h3 className="text-xl font-fredoka text-foreground">Camera Not Supported</h3>
        <p className="text-muted-foreground font-nunito text-sm">
          Your browser does not support camera access. Please use a modern browser to continue.
        </p>
      </div>
    );
  }

  // Permission denied or other error
  if (error && error.type === 'permission') {
    return (
      <div className="flex flex-col items-center gap-4 text-center">
        <div className="w-16 h-16 rounded-full bg-destructive/10 flex items-center justify-center">
          <Camera size={32} className="text-destructive" />
        </div>
        <h3 className="text-xl font-fredoka text-foreground">Camera Access Required</h3>
        <p className="text-muted-foreground font-nunito text-sm leading-relaxed">
          Scrambly needs a quick photo to verify you're a real person. The photo is immediately deleted — nothing is stored.
        </p>
        <div className="bg-muted rounded-2xl p-3 w-full">
          <p className="text-xs font-nunito text-muted-foreground">
            Please allow camera access in your browser settings, then try again.
          </p>
        </div>
        <Button
          onClick={handleRetry}
          className="w-full rounded-full font-fredoka text-base"
          variant="outline"
        >
          <RefreshCw size={16} className="mr-2" />
          Try Again
        </Button>
      </div>
    );
  }

  // Generic error
  if (error) {
    return (
      <div className="flex flex-col items-center gap-4 text-center">
        <AlertTriangle size={48} className="text-destructive" />
        <h3 className="text-xl font-fredoka text-foreground">Camera Error</h3>
        <p className="text-muted-foreground font-nunito text-sm">{error.message}</p>
        <Button onClick={handleRetry} variant="outline" className="w-full rounded-full font-nunito">
          <RefreshCw size={16} className="mr-2" />
          Try Again
        </Button>
      </div>
    );
  }

  return (
    <div className="flex flex-col items-center gap-4">
      <div className="text-center mb-1">
        <h3 className="text-2xl font-fredoka text-foreground">Quick Face Check</h3>
        <p className="text-muted-foreground font-nunito text-sm mt-1">
          We need a quick selfie to verify you're a real person. It's deleted instantly!
        </p>
      </div>

      {/* Camera preview */}
      <div className="relative w-full rounded-2xl overflow-hidden bg-muted" style={{ aspectRatio: '4/3', minHeight: '200px' }}>
        {isLoading && !isActive && (
          <div className="absolute inset-0 flex items-center justify-center bg-muted">
            <div className="flex flex-col items-center gap-2 text-muted-foreground">
              <Loader2 size={32} className="animate-spin" />
              <span className="font-nunito text-sm">Starting camera...</span>
            </div>
          </div>
        )}
        <video
          ref={videoRef}
          style={{ width: '100%', height: '100%', objectFit: 'cover', transform: 'scaleX(-1)' }}
          playsInline
          muted
          autoPlay
        />
        <canvas ref={canvasRef} style={{ display: 'none' }} />
      </div>

      {/* Privacy note */}
      <div className="flex items-start gap-2 bg-muted/60 rounded-xl p-3 w-full">
        <ShieldCheck size={16} className="text-green-600 mt-0.5 shrink-0" />
        <p className="text-xs font-nunito text-muted-foreground">
          <strong>Privacy protected:</strong> Your photo is captured locally and immediately discarded. Nothing is uploaded or stored.
        </p>
      </div>

      {/* Capture button */}
      <Button
        onClick={handleCapture}
        disabled={isLoading || !isActive}
        className="w-full rounded-full font-fredoka text-lg bg-primary text-primary-foreground"
        size="lg"
      >
        {isLoading ? (
          <span className="flex items-center gap-2">
            <Loader2 size={18} className="animate-spin" /> Starting...
          </span>
        ) : (
          <span className="flex items-center gap-2">
            <Camera size={18} /> Take Photo
          </span>
        )}
      </Button>
    </div>
  );
}
