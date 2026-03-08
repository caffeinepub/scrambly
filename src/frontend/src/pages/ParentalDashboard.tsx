import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Switch } from "@/components/ui/switch";
import {
  Clock,
  ExternalLink,
  Eye,
  EyeOff,
  Key,
  Lock,
  Save,
  Shield,
  Unlock,
} from "lucide-react";
import React, { useState, useEffect } from "react";
import { toast } from "sonner";
import ParentalFaceScanModal from "../components/ParentalFaceScanModal";

const PARENTAL_PIN_KEY = "scrambly_parental_pin";
const DEFAULT_PIN = "1234";

function getStoredPin(): string {
  const stored = localStorage.getItem(PARENTAL_PIN_KEY);
  if (!stored) {
    localStorage.setItem(PARENTAL_PIN_KEY, DEFAULT_PIN);
    return DEFAULT_PIN;
  }
  return stored;
}

interface ParentalSettings {
  usageTimerMinutes: number;
  hideChat: boolean;
  hideFindFriends: boolean;
  ageRestrictVideos: boolean;
  searchTimeLimitMinutes: number;
}

const DEFAULT_SETTINGS: ParentalSettings = {
  usageTimerMinutes: 720, // 12 hours
  hideChat: false,
  hideFindFriends: false,
  ageRestrictVideos: false,
  searchTimeLimitMinutes: 60,
};

function loadSettings(): ParentalSettings {
  try {
    const stored = localStorage.getItem("scrambly_parental_settings");
    if (stored) return { ...DEFAULT_SETTINGS, ...JSON.parse(stored) };
  } catch {}
  return DEFAULT_SETTINGS;
}

function saveSettings(settings: ParentalSettings) {
  localStorage.setItem("scrambly_parental_settings", JSON.stringify(settings));
}

export default function ParentalDashboard() {
  const [faceScanDone, setFaceScanDone] = useState(false);
  const [showFaceScan, setShowFaceScan] = useState(false);
  const [pinVerified, setPinVerified] = useState(false);
  const [pinInput, setPinInput] = useState("");
  const [pinError, setPinError] = useState("");
  const [_showDashboard, setShowDashboard] = useState(false);

  // PIN change
  const [newPin, setNewPin] = useState("");
  const [confirmPin, setConfirmPin] = useState("");
  const [pinChangeError, setPinChangeError] = useState("");
  const [pinChangeSuccess, setPinChangeSuccess] = useState(false);

  // Settings
  const [settings, setSettings] = useState<ParentalSettings>(loadSettings());

  // On mount, show face scan first
  // biome-ignore lint/correctness/useExhaustiveDependencies: intentional mount-only effect
  useEffect(() => {
    if (!faceScanDone && !pinVerified) {
      setShowFaceScan(true);
    }
  }, []);

  const handleFaceScanComplete = () => {
    setFaceScanDone(true);
    setShowFaceScan(false);
  };

  const handleFaceScanSkip = () => {
    setFaceScanDone(true);
    setShowFaceScan(false);
  };

  const handlePinSubmit = () => {
    const storedPin = getStoredPin();
    if (pinInput === storedPin) {
      setPinVerified(true);
      setShowDashboard(true);
      setPinError("");
    } else {
      setPinError("Incorrect PIN. Please try again.");
      setPinInput("");
    }
  };

  const handlePinChange = () => {
    setPinChangeError("");
    setPinChangeSuccess(false);

    if (newPin.length < 3 || newPin.length > 4) {
      setPinChangeError("PIN must be 3 or 4 characters long.");
      return;
    }
    if (newPin !== confirmPin) {
      setPinChangeError("PINs do not match.");
      return;
    }

    localStorage.setItem(PARENTAL_PIN_KEY, newPin);
    setPinChangeSuccess(true);
    setNewPin("");
    setConfirmPin("");
    toast.success("PIN updated successfully!");
  };

  const handleSettingChange = <K extends keyof ParentalSettings>(
    key: K,
    value: ParentalSettings[K],
  ) => {
    const updated = { ...settings, [key]: value };
    setSettings(updated);
    saveSettings(updated);
    toast.success("Setting saved!");
  };

  // Show face scan modal
  if (showFaceScan && !faceScanDone) {
    return (
      <ParentalFaceScanModal
        onComplete={handleFaceScanComplete}
        onSkip={handleFaceScanSkip}
      />
    );
  }

  // Show PIN entry
  if (!pinVerified) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center px-4">
        <div className="bg-card rounded-2xl p-8 max-w-sm w-full shadow-xl border border-border text-center">
          <img
            src="/assets/generated/parental-shield-icon.dim_128x128.png"
            alt="Parental Controls"
            className="w-16 h-16 mx-auto mb-4"
          />
          <h1 className="text-2xl font-bold text-foreground mb-2">
            Parental Controls
          </h1>
          <p className="text-muted-foreground mb-6">
            Enter your PIN to access parental settings.
          </p>

          <div className="space-y-4">
            <Input
              type="password"
              placeholder="Enter PIN"
              value={pinInput}
              onChange={(e) => setPinInput(e.target.value)}
              onKeyDown={(e) => e.key === "Enter" && handlePinSubmit()}
              maxLength={4}
              className="text-center text-xl tracking-widest"
            />
            {pinError && <p className="text-destructive text-sm">{pinError}</p>}
            <Button onClick={handlePinSubmit} className="w-full">
              <Lock className="w-4 h-4 mr-2" />
              Unlock
            </Button>
          </div>

          <p className="text-xs text-muted-foreground mt-4">
            Default PIN: 1234
          </p>
        </div>
      </div>
    );
  }

  // Show full dashboard
  return (
    <div className="min-h-screen bg-background">
      <div className="max-w-2xl mx-auto px-4 py-8">
        {/* Header */}
        <div className="flex items-center gap-3 mb-8">
          <Shield className="w-8 h-8 text-primary" />
          <div>
            <h1 className="text-3xl font-bold text-foreground">
              Parental Controls
            </h1>
            <p className="text-muted-foreground">
              Manage your child's Scrambly experience
            </p>
          </div>
        </div>

        {/* Usage Timer */}
        <div className="bg-card rounded-xl p-6 border border-border mb-4">
          <div className="flex items-center gap-2 mb-4">
            <Clock className="w-5 h-5 text-primary" />
            <h2 className="text-lg font-semibold text-foreground">
              Usage Timer
            </h2>
          </div>
          <p className="text-muted-foreground text-sm mb-3">
            Set how many minutes per day your child can use Scrambly (max 720
            min = 12 hours).
          </p>
          <div className="flex gap-3 items-center">
            <Input
              type="number"
              min={1}
              max={720}
              value={settings.usageTimerMinutes}
              onChange={(e) =>
                setSettings((s) => ({
                  ...s,
                  usageTimerMinutes: Math.min(
                    720,
                    Math.max(1, Number(e.target.value)),
                  ),
                }))
              }
              className="w-32"
            />
            <span className="text-muted-foreground">minutes</span>
            <Button
              size="sm"
              onClick={() =>
                handleSettingChange(
                  "usageTimerMinutes",
                  settings.usageTimerMinutes,
                )
              }
            >
              <Save className="w-4 h-4 mr-1" />
              Save
            </Button>
          </div>
        </div>

        {/* Search Time Limit */}
        <div className="bg-card rounded-xl p-6 border border-border mb-4">
          <div className="flex items-center gap-2 mb-4">
            <Clock className="w-5 h-5 text-yellow-500" />
            <h2 className="text-lg font-semibold text-foreground">
              Search Time Limit
            </h2>
          </div>
          <p className="text-muted-foreground text-sm mb-3">
            Limit how many minutes per session your child can actively search.
          </p>
          <div className="flex gap-3 items-center">
            <Input
              type="number"
              min={1}
              max={720}
              value={settings.searchTimeLimitMinutes}
              onChange={(e) =>
                setSettings((s) => ({
                  ...s,
                  searchTimeLimitMinutes: Math.min(
                    720,
                    Math.max(1, Number(e.target.value)),
                  ),
                }))
              }
              className="w-32"
            />
            <span className="text-muted-foreground">minutes</span>
            <Button
              size="sm"
              onClick={() =>
                handleSettingChange(
                  "searchTimeLimitMinutes",
                  settings.searchTimeLimitMinutes,
                )
              }
            >
              <Save className="w-4 h-4 mr-1" />
              Save
            </Button>
          </div>
        </div>

        {/* Hide Chat */}
        <div className="bg-card rounded-xl p-6 border border-border mb-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              {settings.hideChat ? (
                <EyeOff className="w-5 h-5 text-destructive" />
              ) : (
                <Eye className="w-5 h-5 text-green-500" />
              )}
              <div>
                <h2 className="text-lg font-semibold text-foreground">
                  Hide Chat
                </h2>
                <p className="text-muted-foreground text-sm">
                  Hide the chat bar and Friends Mode chat from your child.
                </p>
              </div>
            </div>
            <Switch
              checked={settings.hideChat}
              onCheckedChange={(val) => handleSettingChange("hideChat", val)}
            />
          </div>
        </div>

        {/* Hide Find Friends */}
        <div className="bg-card rounded-xl p-6 border border-border mb-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              {settings.hideFindFriends ? (
                <EyeOff className="w-5 h-5 text-destructive" />
              ) : (
                <Eye className="w-5 h-5 text-green-500" />
              )}
              <div>
                <h2 className="text-lg font-semibold text-foreground">
                  Hide Find Friends
                </h2>
                <p className="text-muted-foreground text-sm">
                  Remove the Find Friends / Friends Mode button from navigation.
                </p>
              </div>
            </div>
            <Switch
              checked={settings.hideFindFriends}
              onCheckedChange={(val) =>
                handleSettingChange("hideFindFriends", val)
              }
            />
          </div>
        </div>

        {/* Age Restrict Videos */}
        <div className="bg-card rounded-xl p-6 border border-border mb-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              {settings.ageRestrictVideos ? (
                <Lock className="w-5 h-5 text-destructive" />
              ) : (
                <Unlock className="w-5 h-5 text-green-500" />
              )}
              <div>
                <h2 className="text-lg font-semibold text-foreground">
                  Age-Restrict Videos
                </h2>
                <p className="text-muted-foreground text-sm">
                  Show only kid-friendly Sonic Says content on the Videos page.
                </p>
              </div>
            </div>
            <Switch
              checked={settings.ageRestrictVideos}
              onCheckedChange={(val) =>
                handleSettingChange("ageRestrictVideos", val)
              }
            />
          </div>
        </div>

        {/* Change PIN */}
        <div className="bg-card rounded-xl p-6 border border-border mb-4">
          <div className="flex items-center gap-2 mb-4">
            <Key className="w-5 h-5 text-primary" />
            <h2 className="text-lg font-semibold text-foreground">
              Change PIN
            </h2>
          </div>
          <p className="text-muted-foreground text-sm mb-4">
            Set a new PIN (3–4 characters). Default is <strong>1234</strong>.
          </p>
          <div className="space-y-3">
            <Input
              type="password"
              placeholder="New PIN (3-4 characters)"
              value={newPin}
              onChange={(e) => setNewPin(e.target.value.slice(0, 4))}
              maxLength={4}
            />
            <Input
              type="password"
              placeholder="Confirm new PIN"
              value={confirmPin}
              onChange={(e) => setConfirmPin(e.target.value.slice(0, 4))}
              maxLength={4}
            />
            {pinChangeError && (
              <p className="text-destructive text-sm">{pinChangeError}</p>
            )}
            {pinChangeSuccess && (
              <p className="text-green-500 text-sm">
                ✅ PIN changed successfully!
              </p>
            )}
            <Button onClick={handlePinChange} className="w-full">
              <Key className="w-4 h-4 mr-2" />
              Update PIN
            </Button>
          </div>
        </div>

        {/* Parent Review Panel Link */}
        <div className="bg-card rounded-xl p-6 border border-border mb-4">
          <div className="flex items-center gap-2 mb-3">
            <ExternalLink className="w-5 h-5 text-primary" />
            <h2 className="text-lg font-semibold text-foreground">
              Parent Review Panel
            </h2>
          </div>
          <p className="text-muted-foreground text-sm mb-4">
            Access the parent review panel for additional controls.
          </p>
          <Button
            variant="outline"
            className="w-full"
            onClick={() =>
              window.open(
                "https://widespread-crimson-c6q-draft.caffeine.xyz/#caffeineAdminToken=7c4623260dccffc21ab80a4d967ff00efa0fca2d013781ab3aad1fe300afbfce",
                "_blank",
                "noopener,noreferrer",
              )
            }
          >
            <ExternalLink className="w-4 h-4 mr-2" />
            Open Parent Review Panel
          </Button>
        </div>

        {/* Lock Dashboard */}
        <Button
          variant="outline"
          className="w-full mt-4"
          onClick={() => {
            setPinVerified(false);
            setFaceScanDone(false);
            setPinInput("");
            setShowFaceScan(true);
          }}
        >
          <Lock className="w-4 h-4 mr-2" />
          Lock Parental Controls
        </Button>
      </div>
    </div>
  );
}
