import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Lock, Shield } from "lucide-react";
import type React from "react";
import { useState } from "react";

const PARENT_PIN_KEY = "scrambly_parent_pin";
const DEFAULT_PIN = "1234";

interface PINEntryModalProps {
  open: boolean;
  onSuccess: () => void;
  onClose: () => void;
}

export default function PINEntryModal({
  open,
  onSuccess,
  onClose,
}: PINEntryModalProps) {
  const [pin, setPin] = useState("");
  const [error, setError] = useState("");
  const [isSettingPin, setIsSettingPin] = useState(false);
  const [newPin, setNewPin] = useState("");
  const [confirmPin, setConfirmPin] = useState("");

  const storedPin = localStorage.getItem(PARENT_PIN_KEY) || DEFAULT_PIN;

  const handleVerify = (e: React.FormEvent) => {
    e.preventDefault();
    if (pin === storedPin) {
      setPin("");
      setError("");
      onSuccess();
    } else {
      setError("Incorrect PIN. Try again.");
    }
  };

  const handleSetPin = (e: React.FormEvent) => {
    e.preventDefault();
    if (newPin.length < 4) {
      setError("PIN must be at least 4 digits.");
      return;
    }
    if (newPin !== confirmPin) {
      setError("PINs do not match.");
      return;
    }
    localStorage.setItem(PARENT_PIN_KEY, newPin);
    setIsSettingPin(false);
    setNewPin("");
    setConfirmPin("");
    setError("");
    onSuccess();
  };

  return (
    <Dialog open={open} onOpenChange={(o) => !o && onClose()}>
      <DialogContent className="rounded-2xl max-w-sm">
        <DialogHeader>
          <DialogTitle className="font-fredoka text-2xl flex items-center gap-2 text-primary">
            <Shield size={24} /> Parental Controls
          </DialogTitle>
          <DialogDescription className="font-nunito">
            {isSettingPin
              ? "Set a new parent PIN."
              : "Enter your parent PIN to access parental controls."}
          </DialogDescription>
        </DialogHeader>

        {!isSettingPin ? (
          <form onSubmit={handleVerify} className="space-y-4">
            <div>
              <Label className="font-nunito font-700">Parent PIN</Label>
              <Input
                type="password"
                placeholder="Enter PIN"
                value={pin}
                onChange={(e) => setPin(e.target.value)}
                className="mt-1 rounded-xl font-nunito text-center text-2xl tracking-widest"
                maxLength={8}
                autoFocus
              />
              {storedPin === DEFAULT_PIN && (
                <p className="text-xs text-muted-foreground mt-1 font-nunito">
                  Default PIN: 1234
                </p>
              )}
            </div>
            {error && (
              <p className="text-destructive text-sm font-nunito">{error}</p>
            )}
            <div className="flex gap-2">
              <Button
                type="submit"
                className="flex-1 rounded-full font-fredoka bg-primary text-primary-foreground"
              >
                <Lock size={14} className="mr-1" /> Unlock
              </Button>
              <Button
                type="button"
                variant="outline"
                onClick={() => setIsSettingPin(true)}
                className="rounded-full font-nunito text-sm"
              >
                Change PIN
              </Button>
            </div>
          </form>
        ) : (
          <form onSubmit={handleSetPin} className="space-y-4">
            <div>
              <Label className="font-nunito font-700">New PIN</Label>
              <Input
                type="password"
                placeholder="New PIN (min 4 digits)"
                value={newPin}
                onChange={(e) => setNewPin(e.target.value)}
                className="mt-1 rounded-xl font-nunito text-center text-2xl tracking-widest"
                maxLength={8}
              />
            </div>
            <div>
              <Label className="font-nunito font-700">Confirm PIN</Label>
              <Input
                type="password"
                placeholder="Confirm PIN"
                value={confirmPin}
                onChange={(e) => setConfirmPin(e.target.value)}
                className="mt-1 rounded-xl font-nunito text-center text-2xl tracking-widest"
                maxLength={8}
              />
            </div>
            {error && (
              <p className="text-destructive text-sm font-nunito">{error}</p>
            )}
            <div className="flex gap-2">
              <Button
                type="submit"
                className="flex-1 rounded-full font-fredoka bg-primary text-primary-foreground"
              >
                Save PIN
              </Button>
              <Button
                type="button"
                variant="outline"
                onClick={() => {
                  setIsSettingPin(false);
                  setError("");
                }}
                className="rounded-full font-nunito text-sm"
              >
                Cancel
              </Button>
            </div>
          </form>
        )}
      </DialogContent>
    </Dialog>
  );
}
