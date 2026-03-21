import { useQueryClient } from "@tanstack/react-query";
import { useNavigate } from "@tanstack/react-router";
import {
  AlertTriangle,
  Crop,
  ExternalLink,
  Eye,
  EyeOff,
  Lightbulb,
  Loader2,
  Lock,
  Music,
  Save,
  Shield,
  Trash2,
  Upload,
  Volume2,
  VolumeX,
} from "lucide-react";
import type React from "react";
import { useEffect, useRef, useState } from "react";
import { toast } from "sonner";
import PhotoCropModal from "../components/PhotoCropModal";
import { useInternetIdentity } from "../hooks/useInternetIdentity";
import { useMusicPlayer } from "../hooks/useMusicPlayer";
import {
  useApplyForModerator,
  useGetCallerUserProfile,
  useSaveCallerUserProfile,
  useSetPassword,
  useSubmitIdea,
  useVerifyPassword,
} from "../hooks/useQueries";

function getAge(profile: { birthYear: bigint } | null | undefined): number {
  if (!profile) return 0;
  return 2024 - Number(profile.birthYear);
}

function isKidMode(profile: { birthYear: bigint } | null | undefined): boolean {
  if (!profile) return false;
  const age = getAge(profile);
  return age < 13;
}

export default function SettingsPage() {
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const { clear } = useInternetIdentity();
  const { data: profile, isLoading: profileLoading } =
    useGetCallerUserProfile();
  const saveProfile = useSaveCallerUserProfile();
  const setPasswordMutation = useSetPassword();
  const verifyPasswordMutation = useVerifyPassword();
  const submitIdeaMutation = useSubmitIdea();
  const applyModeratorMutation = useApplyForModerator();

  // Music player
  const { volume, setVolume, isMuted } = useMusicPlayer();

  // Photo crop state
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [cropImageSrc, setCropImageSrc] = useState("");
  const [cropModalOpen, setCropModalOpen] = useState(false);
  const [croppedPhotoUrl, setCroppedPhotoUrl] = useState("");

  // Profile form state
  const [name, setName] = useState("");
  const [birthYear, setBirthYear] = useState("");

  // Password state
  const [newPassword, setNewPassword] = useState("");
  const [showCurrentPin, setShowCurrentPin] = useState(false);
  const [verifyPasswordInput, setVerifyPasswordInput] = useState("");
  const [passwordMessage, setPasswordMessage] = useState("");

  // Forgot Password flow
  const [showForgotSection, setShowForgotSection] = useState(false);
  const [forgotStep, setForgotStep] = useState<
    "initial" | "emailSent" | "resetForm"
  >("initial");
  const [forgotEmail, setForgotEmail] = useState("");
  const [forgotNewPin, setForgotNewPin] = useState("");
  const [forgotConfirmPin, setForgotConfirmPin] = useState("");
  const [showForgotNewPin, setShowForgotNewPin] = useState(false);
  const [showForgotConfirmPin, setShowForgotConfirmPin] = useState(false);
  const [forgotMessage, setForgotMessage] = useState("");

  // Idea state
  const [ideaContent, setIdeaContent] = useState("");
  const [ideaMessage, setIdeaMessage] = useState("");

  // Moderator application state
  const [modAnswers, setModAnswers] = useState("");
  const [modMessage, setModMessage] = useState("");

  // Delete account state
  const [deleteConfirmText, setDeleteConfirmText] = useState("");
  const [isDeleting, setIsDeleting] = useState(false);
  const [deleteError, setDeleteError] = useState("");

  useEffect(() => {
    if (profile) {
      setName(profile.name || "");
      setBirthYear(profile.birthYear ? String(profile.birthYear) : "");
    }
  }, [profile]);

  const handleSaveProfile = async () => {
    if (!profile) return;
    try {
      await saveProfile.mutateAsync({
        ...profile,
        name,
        birthYear: BigInt(birthYear || "0"),
      });
      toast.success("Profile saved!");
    } catch (e: any) {
      toast.error(`Failed to save profile: ${e?.message || "Unknown error"}`);
    }
  };

  const handleSetPassword = async () => {
    setPasswordMessage("");
    try {
      await setPasswordMutation.mutateAsync(newPassword);
      setPasswordMessage("Password set successfully!");
      setNewPassword("");
    } catch (e: any) {
      setPasswordMessage(`Error: ${e?.message || "Unknown error"}`);
    }
  };

  const handleVerifyPassword = async () => {
    setPasswordMessage("");
    try {
      const result =
        await verifyPasswordMutation.mutateAsync(verifyPasswordInput);
      setPasswordMessage(
        result ? "✅ Password correct!" : "❌ Incorrect password",
      );
      setVerifyPasswordInput("");
    } catch (e: any) {
      setPasswordMessage(`Error: ${e?.message || "Unknown error"}`);
    }
  };

  const handleForgotChangePassword = async () => {
    setForgotMessage("");
    if (forgotNewPin.length < 4 || forgotNewPin.length > 6) {
      setForgotMessage("PIN must be 4–6 digits.");
      return;
    }
    if (forgotNewPin !== forgotConfirmPin) {
      setForgotMessage("PINs do not match.");
      return;
    }
    try {
      await setPasswordMutation.mutateAsync(forgotNewPin);
      setForgotMessage("✅ Password changed successfully!");
      setForgotNewPin("");
      setForgotConfirmPin("");
      setTimeout(() => {
        setShowForgotSection(false);
        setForgotStep("initial");
        setForgotMessage("");
      }, 1500);
    } catch (e: any) {
      setForgotMessage(`Error: ${e?.message || "Unknown error"}`);
    }
  };

  const handleSubmitIdea = async () => {
    setIdeaMessage("");
    try {
      await submitIdeaMutation.mutateAsync(ideaContent);
      setIdeaMessage("✅ Idea submitted! Thanks for your suggestion.");
      setIdeaContent("");
    } catch (e: any) {
      setIdeaMessage(`Error: ${e?.message || "Unknown error"}`);
    }
  };

  const handleApplyModerator = async () => {
    setModMessage("");
    try {
      const result = await applyModeratorMutation.mutateAsync(modAnswers);
      if (result === "success") {
        setModMessage("✅ Application submitted successfully!");
      } else if (result === "incorrectAnswers") {
        setModMessage("❌ Incorrect answers. Please try again.");
      } else if (result === "applicationFull") {
        setModMessage("ℹ️ Applications are currently full. Try again later.");
      }
      setModAnswers("");
    } catch (e: any) {
      setModMessage(`Error: ${e?.message || "Unknown error"}`);
    }
  };

  const handleDeleteAccount = async () => {
    if (deleteConfirmText !== "DELETE") return;
    setDeleteError("");
    setIsDeleting(true);
    try {
      await clear();
      queryClient.clear();
      navigate({ to: "/" });
    } catch (e: any) {
      setDeleteError(
        `Failed to delete account: ${e?.message || "Unknown error"}`,
      );
      setIsDeleting(false);
    }
  };

  const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = (ev) => {
      const src = ev.target?.result as string;
      setCropImageSrc(src);
      setCropModalOpen(true);
    };
    reader.readAsDataURL(file);
    // Reset input so same file can be re-selected
    e.target.value = "";
  };

  const handleCropSubmit = (dataUrl: string) => {
    setCroppedPhotoUrl(dataUrl);
    setCropModalOpen(false);
    toast.success("Photo cropped and saved!");
  };

  if (profileLoading) {
    return (
      <div className="flex items-center justify-center min-h-[60vh]">
        <Loader2 className="animate-spin text-primary w-10 h-10" />
      </div>
    );
  }

  const age = getAge(profile);
  const kidMode = isKidMode(profile);

  return (
    <div className="max-w-2xl mx-auto px-4 py-8 space-y-8">
      <h1 className="text-3xl font-bold text-primary font-display">Settings</h1>

      {/* ── MUSIC ── */}
      <section
        className="sonic-card p-6 space-y-4"
        data-ocid="settings.music.panel"
      >
        <h2 className="text-xl font-bold text-foreground font-display flex items-center gap-2">
          <Music className="w-5 h-5 text-primary" />
          Music
        </h2>

        <div className="space-y-3">
          <h3 className="text-sm font-semibold text-muted-foreground uppercase tracking-wider">
            Background Music
          </h3>
          <p className="text-xs text-muted-foreground">
            Casino Night Zone —{" "}
            <span className="italic">Sonic the Hedgehog 2</span>
          </p>

          <div className="flex items-center gap-4">
            {isMuted ? (
              <VolumeX
                className="w-6 h-6 text-destructive shrink-0"
                aria-label="Muted"
              />
            ) : (
              <Volume2
                className="w-6 h-6 text-primary shrink-0"
                aria-label="Playing"
              />
            )}

            <div className="flex-1 space-y-1">
              <input
                type="range"
                min={1}
                max={100}
                value={volume}
                onChange={(e) => setVolume(Number(e.target.value))}
                className="w-full accent-primary cursor-pointer"
                aria-label="Music volume"
                data-ocid="settings.music.input"
              />
              <div className="flex justify-between text-xs text-muted-foreground">
                <span>🔇 Muted</span>
                <span className="font-semibold text-foreground">
                  {isMuted ? "Muted" : `${volume}%`}
                </span>
                <span>🔊 Max</span>
              </div>
            </div>
          </div>

          {isMuted && (
            <p className="text-xs text-destructive flex items-center gap-1">
              <VolumeX className="w-3 h-3" />
              Music is muted. Slide above 1 to enable.
            </p>
          )}
        </div>
      </section>

      {/* ── PHOTO CROP ── */}
      <section
        className="sonic-card p-6 space-y-4"
        data-ocid="settings.photo.panel"
      >
        <h2 className="text-xl font-bold text-foreground font-display flex items-center gap-2">
          <Crop className="w-5 h-5 text-primary" />
          Profile Photo
        </h2>

        <div className="space-y-3">
          {croppedPhotoUrl && (
            <div className="flex items-center gap-4">
              <img
                src={croppedPhotoUrl}
                alt="Cropped profile"
                className="w-20 h-20 rounded-full object-cover border-2 border-primary"
              />
              <span className="text-sm text-muted-foreground">
                Current profile photo
              </span>
            </div>
          )}

          <input
            ref={fileInputRef}
            type="file"
            accept="image/*"
            className="hidden"
            onChange={handleFileSelect}
          />

          <button
            type="button"
            className="sonic-btn sonic-btn-primary flex items-center gap-2"
            onClick={() => fileInputRef.current?.click()}
            data-ocid="settings.photo.upload_button"
          >
            <Upload className="w-4 h-4" />
            Upload Photo
          </button>

          {cropImageSrc && !cropModalOpen && (
            <button
              type="button"
              className="sonic-btn sonic-btn-secondary flex items-center gap-2"
              onClick={() => setCropModalOpen(true)}
              data-ocid="settings.photo.edit_button"
            >
              <Crop className="w-4 h-4" />
              Crop Photo
            </button>
          )}

          <p className="text-xs text-muted-foreground">
            After selecting a photo, use the crop tool to resize and position
            it.
          </p>
        </div>
      </section>

      {/* Account Settings */}
      <section className="sonic-card p-6 space-y-4">
        <h2 className="text-xl font-bold text-foreground font-display flex items-center gap-2">
          <Shield className="w-5 h-5 text-primary" />
          Account Settings
        </h2>
        {profile ? (
          <div className="space-y-3">
            <div>
              <label
                htmlFor="settings-name"
                className="block text-sm font-medium text-muted-foreground mb-1"
              >
                Display Name
              </label>
              <input
                id="settings-name"
                className="sonic-input w-full"
                value={name}
                onChange={(e) => setName(e.target.value)}
                placeholder="Your name"
              />
            </div>
            <div>
              <label
                htmlFor="settings-birth-year"
                className="block text-sm font-medium text-muted-foreground mb-1"
              >
                Birth Year
              </label>
              <input
                id="settings-birth-year"
                className="sonic-input w-full"
                value={birthYear}
                onChange={(e) => setBirthYear(e.target.value)}
                placeholder="e.g. 2010"
                type="number"
              />
            </div>
            <div className="text-sm text-muted-foreground">
              Age: <span className="font-semibold text-foreground">{age}</span>
              {kidMode && (
                <span className="ml-2 text-xs bg-primary/10 text-primary px-2 py-0.5 rounded-full">
                  Kid Mode
                </span>
              )}
            </div>
            <button
              type="button"
              className="sonic-btn sonic-btn-primary flex items-center gap-2"
              onClick={handleSaveProfile}
              disabled={saveProfile.isPending}
            >
              {saveProfile.isPending ? (
                <Loader2 className="w-4 h-4 animate-spin" />
              ) : (
                <Save className="w-4 h-4" />
              )}
              Save Profile
            </button>
          </div>
        ) : (
          <p className="text-muted-foreground">
            No profile found. Please complete onboarding.
          </p>
        )}
      </section>

      {/* Password */}
      <section
        className="sonic-card p-6 space-y-4"
        data-ocid="settings.password.panel"
      >
        <h2 className="text-xl font-bold text-foreground font-display flex items-center gap-2">
          <Lock className="w-5 h-5 text-primary" />
          Password (PIN)
        </h2>
        <div className="space-y-3">
          <div>
            <label
              htmlFor="settings-new-pin"
              className="block text-sm font-medium text-muted-foreground mb-1"
            >
              Set New PIN (4 or 6 digits)
            </label>
            <div className="relative">
              <input
                id="settings-new-pin"
                className="sonic-input w-full pr-10"
                value={newPassword}
                onChange={(e) => setNewPassword(e.target.value)}
                placeholder="Enter 4 or 6 digit PIN"
                type={showCurrentPin ? "text" : "password"}
                maxLength={6}
                data-ocid="settings.forgot_pin.input"
              />
              <button
                type="button"
                onClick={() => setShowCurrentPin((v) => !v)}
                className="absolute right-2 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground transition-colors p-1"
                aria-label={showCurrentPin ? "Hide PIN" : "Show PIN"}
                data-ocid="settings.show_pin.toggle"
              >
                {showCurrentPin ? (
                  <EyeOff className="w-4 h-4" />
                ) : (
                  <Eye className="w-4 h-4" />
                )}
              </button>
            </div>
            <button
              type="button"
              className="sonic-btn sonic-btn-primary mt-2 flex items-center gap-2"
              onClick={handleSetPassword}
              disabled={setPasswordMutation.isPending || newPassword.length < 4}
            >
              {setPasswordMutation.isPending ? (
                <Loader2 className="w-4 h-4 animate-spin" />
              ) : (
                <Lock className="w-4 h-4" />
              )}
              Set PIN
            </button>
          </div>
          <div>
            <label
              htmlFor="settings-verify-pin"
              className="block text-sm font-medium text-muted-foreground mb-1"
            >
              Verify PIN
            </label>
            <input
              id="settings-verify-pin"
              className="sonic-input w-full"
              value={verifyPasswordInput}
              onChange={(e) => setVerifyPasswordInput(e.target.value)}
              placeholder="Enter PIN to verify"
              type="password"
              maxLength={6}
            />
            <button
              type="button"
              className="sonic-btn sonic-btn-secondary mt-2 flex items-center gap-2"
              onClick={handleVerifyPassword}
              disabled={
                verifyPasswordMutation.isPending ||
                verifyPasswordInput.length < 4
              }
            >
              {verifyPasswordMutation.isPending ? (
                <Loader2 className="w-4 h-4 animate-spin" />
              ) : null}
              Verify PIN
            </button>
          </div>
          {passwordMessage && (
            <p className="text-sm font-medium text-foreground">
              {passwordMessage}
            </p>
          )}

          {/* Forgot Password button */}
          {!showForgotSection && (
            <button
              type="button"
              onClick={() => {
                setShowForgotSection(true);
                setForgotStep("initial");
                setForgotMessage("");
              }}
              className="text-sm text-primary underline hover:text-primary/80 transition-colors mt-1"
              data-ocid="settings.forgot_password.button"
            >
              Forgot Password?
            </button>
          )}

          {/* Forgot Password section */}
          {showForgotSection && (
            <div
              className="mt-4 rounded-2xl border-2 border-primary/20 bg-primary/5 p-5 space-y-4"
              data-ocid="settings.forgot_password.panel"
            >
              {forgotStep === "initial" && (
                <>
                  <div className="space-y-1">
                    <h3 className="text-base font-bold text-foreground flex items-center gap-2">
                      <Lock className="w-4 h-4 text-primary" />
                      Forgot Password?
                    </h3>
                    <p className="text-sm text-muted-foreground">
                      We can send a password reset link to your Gmail account.
                      The email will come from{" "}
                      <span className="font-semibold text-foreground">
                        Scrambly223@gmail.com
                      </span>
                    </p>
                  </div>
                  <div>
                    <label
                      htmlFor="forgot-email"
                      className="block text-sm font-medium text-muted-foreground mb-1"
                    >
                      Your Gmail address
                    </label>
                    <input
                      id="forgot-email"
                      className="sonic-input w-full"
                      type="email"
                      placeholder="yourname@gmail.com"
                      value={forgotEmail}
                      onChange={(e) => setForgotEmail(e.target.value)}
                    />
                  </div>
                  <div className="flex flex-col sm:flex-row gap-2">
                    <button
                      type="button"
                      className="sonic-btn sonic-btn-primary flex-1 flex items-center justify-center gap-2"
                      onClick={() => {
                        if (!forgotEmail.includes("@gmail.com")) {
                          setForgotMessage(
                            "Please enter a valid Gmail address.",
                          );
                          return;
                        }
                        setForgotMessage("");
                        setForgotStep("emailSent");
                      }}
                    >
                      Send Reset Email
                    </button>
                    <button
                      type="button"
                      className="sonic-btn sonic-btn-secondary flex-1"
                      onClick={() => {
                        setForgotMessage("");
                        setForgotStep("resetForm");
                      }}
                    >
                      Reset on our app
                    </button>
                  </div>
                  {forgotMessage && (
                    <p className="text-sm text-destructive">{forgotMessage}</p>
                  )}
                  <button
                    type="button"
                    onClick={() => {
                      setShowForgotSection(false);
                      setForgotStep("initial");
                      setForgotMessage("");
                    }}
                    className="text-xs text-muted-foreground underline hover:text-foreground transition-colors"
                  >
                    Cancel
                  </button>
                </>
              )}

              {forgotStep === "emailSent" && (
                <>
                  <div className="bg-green-500/10 border border-green-500/30 rounded-xl p-4 space-y-2">
                    <p className="text-sm font-semibold text-green-700 dark:text-green-400">
                      📧 Email sent!
                    </p>
                    <p className="text-sm text-muted-foreground">
                      Check your Gmail inbox for a message from{" "}
                      <span className="font-semibold">
                        Scrambly223@gmail.com
                      </span>
                      . It says:{" "}
                      <em>
                        "If you want to reset your password, reset it here! Or
                        use our app."
                      </em>
                    </p>
                  </div>
                  <div className="flex flex-col sm:flex-row gap-2">
                    <button
                      type="button"
                      className="sonic-btn sonic-btn-primary flex-1"
                      onClick={() => {
                        setForgotMessage("");
                        setForgotStep("resetForm");
                      }}
                    >
                      Reset on our app instead
                    </button>
                    <button
                      type="button"
                      className="sonic-btn sonic-btn-secondary flex-1"
                      onClick={() => {
                        setForgotMessage("");
                        setForgotStep("initial");
                      }}
                    >
                      Back
                    </button>
                  </div>
                </>
              )}

              {forgotStep === "resetForm" && (
                <>
                  <h3 className="text-base font-bold text-foreground flex items-center gap-2">
                    <Lock className="w-4 h-4 text-primary" />
                    Change Password
                  </h3>
                  <div>
                    <label
                      htmlFor="forgot-new-pin"
                      className="block text-sm font-medium text-muted-foreground mb-1"
                    >
                      New PIN (4–6 digits)
                    </label>
                    <div className="relative">
                      <input
                        id="forgot-new-pin"
                        className="sonic-input w-full pr-10"
                        type={showForgotNewPin ? "text" : "password"}
                        placeholder="Enter new PIN"
                        value={forgotNewPin}
                        onChange={(e) => setForgotNewPin(e.target.value)}
                        maxLength={6}
                        data-ocid="settings.forgot_pin.input"
                      />
                      <button
                        type="button"
                        onClick={() => setShowForgotNewPin((v) => !v)}
                        className="absolute right-2 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground transition-colors p-1"
                        aria-label={showForgotNewPin ? "Hide PIN" : "Show PIN"}
                      >
                        {showForgotNewPin ? (
                          <EyeOff className="w-4 h-4" />
                        ) : (
                          <Eye className="w-4 h-4" />
                        )}
                      </button>
                    </div>
                  </div>
                  <div>
                    <label
                      htmlFor="forgot-confirm-pin"
                      className="block text-sm font-medium text-muted-foreground mb-1"
                    >
                      Confirm New PIN
                    </label>
                    <div className="relative">
                      <input
                        id="forgot-confirm-pin"
                        className="sonic-input w-full pr-10"
                        type={showForgotConfirmPin ? "text" : "password"}
                        placeholder="Confirm new PIN"
                        value={forgotConfirmPin}
                        onChange={(e) => setForgotConfirmPin(e.target.value)}
                        maxLength={6}
                        data-ocid="settings.confirm_pin.input"
                      />
                      <button
                        type="button"
                        onClick={() => setShowForgotConfirmPin((v) => !v)}
                        className="absolute right-2 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground transition-colors p-1"
                        aria-label={
                          showForgotConfirmPin ? "Hide PIN" : "Show PIN"
                        }
                      >
                        {showForgotConfirmPin ? (
                          <EyeOff className="w-4 h-4" />
                        ) : (
                          <Eye className="w-4 h-4" />
                        )}
                      </button>
                    </div>
                  </div>
                  {forgotMessage && (
                    <p
                      className={`text-sm font-medium ${
                        forgotMessage.startsWith("✅")
                          ? "text-green-600 dark:text-green-400"
                          : "text-destructive"
                      }`}
                    >
                      {forgotMessage}
                    </p>
                  )}
                  <div className="flex flex-col sm:flex-row gap-2">
                    <button
                      type="button"
                      className="sonic-btn flex-1 bg-blue-600 hover:bg-blue-700 text-white flex items-center justify-center gap-2 disabled:opacity-50"
                      onClick={handleForgotChangePassword}
                      disabled={
                        setPasswordMutation.isPending ||
                        forgotNewPin.length < 4 ||
                        forgotConfirmPin.length < 4
                      }
                      data-ocid="settings.change_password.submit_button"
                    >
                      {setPasswordMutation.isPending ? (
                        <Loader2 className="w-4 h-4 animate-spin" />
                      ) : (
                        <Lock className="w-4 h-4" />
                      )}
                      Change Password
                    </button>
                    <button
                      type="button"
                      className="sonic-btn sonic-btn-secondary flex-1"
                      onClick={() => {
                        setShowForgotSection(false);
                        setForgotStep("initial");
                        setForgotMessage("");
                        setForgotNewPin("");
                        setForgotConfirmPin("");
                      }}
                      data-ocid="settings.forgot_password.cancel_button"
                    >
                      Cancel
                    </button>
                  </div>
                </>
              )}
            </div>
          )}
        </div>
      </section>

      {/* Ideas */}
      <section className="sonic-card p-6 space-y-4">
        <h2 className="text-xl font-bold text-foreground font-display flex items-center gap-2">
          <Lightbulb className="w-5 h-5 text-primary" />
          Submit an Idea
        </h2>
        <div className="space-y-3">
          <textarea
            className="sonic-input w-full min-h-[100px] resize-none"
            value={ideaContent}
            onChange={(e) => setIdeaContent(e.target.value)}
            placeholder="Share your idea for Scrambly (max 600 characters)..."
            maxLength={600}
          />
          <div className="flex items-center justify-between">
            <span className="text-xs text-muted-foreground">
              {ideaContent.length}/600
            </span>
            <button
              type="button"
              className="sonic-btn sonic-btn-primary flex items-center gap-2"
              onClick={handleSubmitIdea}
              disabled={
                submitIdeaMutation.isPending || ideaContent.trim().length === 0
              }
            >
              {submitIdeaMutation.isPending ? (
                <Loader2 className="w-4 h-4 animate-spin" />
              ) : (
                <Lightbulb className="w-4 h-4" />
              )}
              Submit Idea
            </button>
          </div>
          {ideaMessage && (
            <p className="text-sm font-medium text-foreground">{ideaMessage}</p>
          )}
        </div>
      </section>

      {/* Apply to be a Moderator */}
      <section className="sonic-card p-6 space-y-4">
        <h2 className="text-xl font-bold text-foreground font-display flex items-center gap-2">
          <Shield className="w-5 h-5 text-primary" />
          Apply to be a Moderator
        </h2>
        <p className="text-sm text-muted-foreground">
          Answer the following questions to apply for a moderator role:
        </p>
        <ol className="list-decimal list-inside text-sm text-foreground space-y-1">
          <li>What year was Sonic the Hedgehog first released? (hint: 1991)</li>
          <li>What year was Sonic the Hedgehog 2 released? (hint: 1992)</li>
        </ol>
        <textarea
          className="sonic-input w-full min-h-[80px] resize-none"
          value={modAnswers}
          onChange={(e) => setModAnswers(e.target.value)}
          placeholder="Type your answers here..."
        />
        <button
          type="button"
          className="sonic-btn sonic-btn-primary flex items-center gap-2"
          onClick={handleApplyModerator}
          disabled={
            applyModeratorMutation.isPending || modAnswers.trim().length === 0
          }
        >
          {applyModeratorMutation.isPending ? (
            <Loader2 className="w-4 h-4 animate-spin" />
          ) : (
            <Shield className="w-4 h-4" />
          )}
          Submit Application
        </button>
        {modMessage && (
          <p className="text-sm font-medium text-foreground">{modMessage}</p>
        )}
      </section>

      {/* External Links */}
      <section className="sonic-card p-6 space-y-4">
        <h2 className="text-xl font-bold text-foreground font-display flex items-center gap-2">
          <ExternalLink className="w-5 h-5 text-primary" />
          External Links
        </h2>
        <div className="space-y-3">
          <button
            type="button"
            className="sonic-btn sonic-btn-secondary w-full flex items-center justify-center gap-2"
            onClick={() =>
              window.open(
                "https://widespread-crimson-c6q-draft.caffeine.xyz/#caffeineAdminToken=7c4623260dccffc21ab80a4d967ff00efa0fca2d013781ab3aad1fe300afbfce",
                "_blank",
                "noopener,noreferrer",
              )
            }
          >
            <ExternalLink className="w-4 h-4" />
            Parent Review Panel
          </button>
          <button
            type="button"
            className="sonic-btn sonic-btn-secondary w-full flex items-center justify-center gap-2"
            onClick={() =>
              window.open(
                "https://widespread-crimson-c6q-draft.caffeine.xyz/#caffeineAdminToken=5f715f1e5cc968358c700eb3bf931a95e3d054e31855e1cccdc56069da56f4ab",
                "_blank",
                "noopener,noreferrer",
              )
            }
          >
            <ExternalLink className="w-4 h-4" />
            Chat with Friends
          </button>
        </div>
      </section>

      {/* Delete Account */}
      <section className="sonic-card p-6 space-y-4 border-2 border-destructive/30">
        <h2 className="text-xl font-bold text-destructive font-display flex items-center gap-2">
          <Trash2 className="w-5 h-5" />
          Delete Account
        </h2>
        <div className="bg-destructive/5 rounded-xl p-4 flex items-start gap-3">
          <AlertTriangle className="w-5 h-5 text-destructive shrink-0 mt-0.5" />
          <p className="text-sm text-muted-foreground">
            This action is <strong>permanent</strong> and cannot be undone. All
            your data will be lost.
          </p>
        </div>
        <div className="space-y-3">
          <label
            htmlFor="settings-delete-confirm"
            className="block text-sm font-medium text-muted-foreground"
          >
            Type <strong>DELETE</strong> to confirm
          </label>
          <input
            id="settings-delete-confirm"
            className="sonic-input w-full"
            value={deleteConfirmText}
            onChange={(e) => setDeleteConfirmText(e.target.value)}
            placeholder="Type DELETE here"
          />
          {deleteError && (
            <p className="text-sm text-destructive">{deleteError}</p>
          )}
          <button
            type="button"
            className="sonic-btn w-full bg-destructive text-destructive-foreground hover:bg-destructive/90 flex items-center justify-center gap-2 disabled:opacity-50"
            onClick={handleDeleteAccount}
            disabled={deleteConfirmText !== "DELETE" || isDeleting}
          >
            {isDeleting ? (
              <Loader2 className="w-4 h-4 animate-spin" />
            ) : (
              <Trash2 className="w-4 h-4" />
            )}
            Delete My Account
          </button>
        </div>
      </section>

      {/* Photo Crop Modal */}
      {cropModalOpen && cropImageSrc && (
        <PhotoCropModal
          open={cropModalOpen}
          imageSrc={cropImageSrc}
          onSubmit={handleCropSubmit}
          onClose={() => setCropModalOpen(false)}
        />
      )}
    </div>
  );
}
