import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import { useQueryClient } from "@tanstack/react-query";
import { Link, useLocation } from "@tanstack/react-router";
import {
  Crown,
  Gamepad2,
  Heart,
  Home,
  LogOut,
  Search,
  Settings,
  Shield,
  Users,
  Video,
} from "lucide-react";
import type React from "react";
import { useState } from "react";
import { useInternetIdentity } from "../hooks/useInternetIdentity";
import { useGetCallerUserProfile } from "../hooks/useQueries";
import ModeratorWelcomeBanner from "./ModeratorWelcomeBanner";

const ADMIN_USERNAME = "TailsTheBeast124";
const REMEMBER_ME_KEY = "rememberMe";

interface NavItem {
  to: string;
  icon: React.ReactNode;
  label: string;
}

const navItems: NavItem[] = [
  { to: "/", icon: <Home className="w-5 h-5" />, label: "Home" },
  { to: "/search", icon: <Search className="w-5 h-5" />, label: "Search" },
  { to: "/videos", icon: <Video className="w-5 h-5" />, label: "Videos" },
  { to: "/games", icon: <Gamepad2 className="w-5 h-5" />, label: "Games" },
  { to: "/community", icon: <Users className="w-5 h-5" />, label: "Community" },
  { to: "/friends", icon: <Heart className="w-5 h-5" />, label: "Friends" },
  {
    to: "/settings",
    icon: <Settings className="w-5 h-5" />,
    label: "Settings",
  },
];

export default function Layout({ children }: { children: React.ReactNode }) {
  const location = useLocation();
  const { identity, clear } = useInternetIdentity();
  const queryClient = useQueryClient();
  const { data: profile } = useGetCallerUserProfile();
  const [showSignOutDialog, setShowSignOutDialog] = useState(false);

  const isAdmin = profile?.name === ADMIN_USERNAME;

  const isRememberMeEnabled = (): boolean => {
    try {
      return localStorage.getItem(REMEMBER_ME_KEY) === "true";
    } catch {
      return false;
    }
  };

  const handleSignOutClick = () => {
    if (isRememberMeEnabled()) {
      setShowSignOutDialog(true);
    } else {
      performSignOut();
    }
  };

  const performSignOut = async () => {
    try {
      localStorage.removeItem(REMEMBER_ME_KEY);
    } catch {
      // ignore
    }
    await clear();
    queryClient.clear();
  };

  const handleConfirmSignOut = async () => {
    setShowSignOutDialog(false);
    await performSignOut();
  };

  const handleCancelSignOut = () => {
    setShowSignOutDialog(false);
  };

  return (
    <div className="min-h-screen bg-background flex flex-col">
      {/* Moderator Welcome Banner */}
      <ModeratorWelcomeBanner />

      {/* Header */}
      <header className="bg-card border-b border-border sticky top-0 z-40 shadow-sm">
        <div className="max-w-6xl mx-auto px-4 h-16 flex items-center justify-between">
          {/* Logo */}
          <Link to="/" className="flex items-center gap-2">
            <img
              src="/assets/generated/scrambly-logo.dim_512x256.png"
              alt="Scrambly"
              className="h-8 object-contain"
            />
          </Link>

          {/* Desktop Nav */}
          <nav className="hidden md:flex items-center gap-1">
            {navItems.map((item) => (
              <Link
                key={item.to}
                to={item.to}
                className={`flex items-center gap-1.5 px-3 py-2 rounded-lg text-sm font-medium transition-colors ${
                  location.pathname === item.to
                    ? "bg-primary text-primary-foreground"
                    : "text-muted-foreground hover:text-foreground hover:bg-accent"
                }`}
              >
                {item.icon}
                <span>{item.label}</span>
              </Link>
            ))}

            {/* Admin link — only for TailsTheBeast124 */}
            {isAdmin && (
              <Link
                to="/admin"
                className={`flex items-center gap-1.5 px-3 py-2 rounded-lg text-sm font-medium transition-colors ${
                  location.pathname === "/admin"
                    ? "bg-yellow-500 text-white"
                    : "text-yellow-600 hover:text-yellow-700 hover:bg-yellow-50"
                }`}
              >
                <Crown className="w-5 h-5" />
                <span>Admin</span>
              </Link>
            )}

            {/* Parental Controls */}
            <Link
              to="/parental"
              className={`flex items-center gap-1.5 px-3 py-2 rounded-lg text-sm font-medium transition-colors ${
                location.pathname === "/parental"
                  ? "bg-primary text-primary-foreground"
                  : "text-muted-foreground hover:text-foreground hover:bg-accent"
              }`}
            >
              <Shield className="w-5 h-5" />
              <span>Parental</span>
            </Link>

            {/* Sign Out button */}
            {identity && (
              <button
                type="button"
                onClick={handleSignOutClick}
                className="flex items-center gap-1.5 px-3 py-2 rounded-lg text-sm font-medium transition-colors text-muted-foreground hover:text-destructive hover:bg-destructive/10"
                title="Sign out"
              >
                <LogOut className="w-5 h-5" />
                <span>Sign Out</span>
              </button>
            )}
          </nav>
        </div>
      </header>

      {/* Mobile Nav */}
      <nav className="md:hidden fixed bottom-0 left-0 right-0 bg-card border-t border-border z-40">
        <div className="flex items-center justify-around px-2 py-2">
          {navItems.slice(0, 5).map((item) => (
            <Link
              key={item.to}
              to={item.to}
              className={`flex flex-col items-center gap-0.5 px-2 py-1 rounded-lg text-xs font-medium transition-colors ${
                location.pathname === item.to
                  ? "text-primary"
                  : "text-muted-foreground hover:text-foreground"
              }`}
            >
              {item.icon}
              <span>{item.label}</span>
            </Link>
          ))}
          {isAdmin && (
            <Link
              to="/admin"
              className={`flex flex-col items-center gap-0.5 px-2 py-1 rounded-lg text-xs font-medium transition-colors ${
                location.pathname === "/admin"
                  ? "text-yellow-500"
                  : "text-muted-foreground hover:text-yellow-500"
              }`}
            >
              <Crown className="w-5 h-5" />
              <span>Admin</span>
            </Link>
          )}
          {/* Mobile Sign Out */}
          {identity && (
            <button
              type="button"
              onClick={handleSignOutClick}
              className="flex flex-col items-center gap-0.5 px-2 py-1 rounded-lg text-xs font-medium transition-colors text-muted-foreground hover:text-destructive"
            >
              <LogOut className="w-5 h-5" />
              <span>Sign Out</span>
            </button>
          )}
        </div>
      </nav>

      {/* Main Content */}
      <main className="flex-1 pb-16 md:pb-0">{children}</main>

      {/* Footer */}
      <footer className="bg-card border-t border-border py-6 px-4 text-center text-sm text-muted-foreground md:pb-6 pb-20">
        <p>
          © {new Date().getFullYear()} Scrambly — Built with{" "}
          <span className="text-red-500">❤️</span> using{" "}
          <a
            href={`https://caffeine.ai/?utm_source=Caffeine-footer&utm_medium=referral&utm_content=${encodeURIComponent(
              typeof window !== "undefined"
                ? window.location.hostname
                : "scrambly",
            )}`}
            target="_blank"
            rel="noopener noreferrer"
            className="text-primary hover:underline"
          >
            caffeine.ai
          </a>
        </p>
      </footer>

      {/* Remember Me Sign Out Confirmation Dialog */}
      <AlertDialog open={showSignOutDialog} onOpenChange={setShowSignOutDialog}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Sign out of Scrambly?</AlertDialogTitle>
            <AlertDialogDescription>
              <strong>Remember Me is enabled</strong> — you'll be signed out and
              will need to log in again next time. Are you sure you want to sign
              out?
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel onClick={handleCancelSignOut}>
              Stay Signed In
            </AlertDialogCancel>
            <AlertDialogAction
              onClick={handleConfirmSignOut}
              className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
            >
              Yes, Sign Out
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}
