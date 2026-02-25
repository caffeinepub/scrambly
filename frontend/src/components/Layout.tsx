import React from 'react';
import { Link, useRouterState } from '@tanstack/react-router';
import { Search, Gamepad2, Users, Settings, Shield, Zap, Menu, X, LogOut } from 'lucide-react';
import EmergencyCallButton from './EmergencyCallButton';
import { useInternetIdentity } from '../hooks/useInternetIdentity';
import { useGetCallerUserProfile, useIsCallerAdmin } from '../hooks/useQueries';
import { useQueryClient } from '@tanstack/react-query';
import { useAdBlocker } from '../hooks/useAdBlocker';
import { useState } from 'react';
import { useUsageTimer } from '../hooks/useUsageTimer';
import { isKidMode } from './KidModeWrapper';

interface LayoutProps {
  children: React.ReactNode;
}

export default function Layout({ children }: LayoutProps) {
  const { clear, identity } = useInternetIdentity();
  const queryClient = useQueryClient();
  const { data: profile } = useGetCallerUserProfile();
  const { data: isAdmin } = useIsCallerAdmin();
  const { adBlockerEnabled } = useAdBlocker();
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const routerState = useRouterState();
  const currentPath = routerState.location.pathname;
  const { timeRemaining, formatTime } = useUsageTimer(profile);
  const kidMode = isKidMode(profile);

  const handleLogout = async () => {
    await clear();
    queryClient.clear();
  };

  const navLinks = [
    { to: '/', label: 'Search', icon: <Search size={16} /> },
    { to: '/games', label: 'Games', icon: <Gamepad2 size={16} /> },
    ...(!kidMode ? [{ to: '/community', label: 'Community', icon: <Users size={16} /> }] : []),
    { to: '/settings', label: 'Settings', icon: <Settings size={16} /> },
    { to: '/parental', label: 'Parental', icon: <Shield size={16} /> },
    ...(isAdmin ? [{ to: '/admin/moderation', label: 'Moderation', icon: <Zap size={16} /> }] : []),
  ];

  return (
    <div className="min-h-screen flex flex-col bg-background">
      {/* Header */}
      <header className="sonic-gradient shadow-sonic sticky top-0 z-50">
        <div className="max-w-7xl mx-auto px-4 py-3 flex items-center justify-between">
          {/* Logo */}
          <Link to="/" className="flex items-center gap-2 shrink-0">
            <img
              src="/assets/generated/scrambly-logo.dim_512x256.png"
              alt="Scrambly"
              className="h-10 object-contain"
            />
          </Link>

          {/* Desktop Nav */}
          <nav className="hidden md:flex items-center gap-1">
            {navLinks.map((link) => (
              <Link
                key={link.to}
                to={link.to}
                className={`flex items-center gap-1.5 px-3 py-2 rounded-xl font-nunito font-700 text-sm transition-colors duration-150
                  ${currentPath === link.to
                    ? 'bg-white/20 text-white'
                    : 'text-white/80 hover:bg-white/10 hover:text-white'
                  }`}
              >
                {link.icon}
                {link.label}
              </Link>
            ))}
          </nav>

          {/* Right side */}
          <div className="flex items-center gap-2">
            {/* Ad Blocker Badge */}
            {adBlockerEnabled && (
              <span className="hidden sm:flex items-center gap-1 text-xs font-nunito font-700 bg-white/20 text-white px-2 py-1 rounded-full">
                <Shield size={12} /> Ads Blocked
              </span>
            )}

            {/* Timer */}
            {timeRemaining !== null && (
              <span className="hidden sm:flex items-center gap-1 text-xs font-nunito font-700 bg-secondary/80 text-secondary-foreground px-2 py-1 rounded-full">
                ⏱ {formatTime(timeRemaining)}
              </span>
            )}

            {/* User name */}
            {profile && (
              <span className="hidden sm:block text-white/90 font-nunito text-sm font-700">
                Hi, {profile.name}!
              </span>
            )}

            {/* Emergency */}
            <EmergencyCallButton />

            {/* Logout */}
            {identity && (
              <button
                onClick={handleLogout}
                className="hidden md:flex items-center gap-1 text-white/80 hover:text-white text-sm font-nunito transition-colors"
                title="Logout"
              >
                <LogOut size={16} />
              </button>
            )}

            {/* Mobile menu toggle */}
            <button
              className="md:hidden text-white p-1"
              onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
            >
              {mobileMenuOpen ? <X size={22} /> : <Menu size={22} />}
            </button>
          </div>
        </div>

        {/* Mobile Nav */}
        {mobileMenuOpen && (
          <div className="md:hidden bg-sonic-blue-dark border-t border-white/10 px-4 py-3 space-y-1">
            {navLinks.map((link) => (
              <Link
                key={link.to}
                to={link.to}
                onClick={() => setMobileMenuOpen(false)}
                className={`flex items-center gap-2 px-3 py-2.5 rounded-xl font-nunito font-700 text-sm transition-colors
                  ${currentPath === link.to
                    ? 'bg-white/20 text-white'
                    : 'text-white/80 hover:bg-white/10 hover:text-white'
                  }`}
              >
                {link.icon}
                {link.label}
              </Link>
            ))}
            <button
              onClick={handleLogout}
              className="flex items-center gap-2 px-3 py-2.5 rounded-xl font-nunito font-700 text-sm text-white/80 hover:text-white w-full"
            >
              <LogOut size={16} /> Logout
            </button>
          </div>
        )}
      </header>

      {/* Kid Mode Banner */}
      {kidMode && (
        <div className="bg-secondary text-secondary-foreground text-center py-1.5 text-sm font-nunito font-700">
          🌟 Kid Mode Active — Safe content for young fans!
        </div>
      )}

      {/* Main Content */}
      <main className="flex-1 max-w-7xl mx-auto w-full px-4 py-6">
        {children}
      </main>

      {/* Footer */}
      <footer className="sonic-gradient text-white py-6 mt-auto">
        <div className="max-w-7xl mx-auto px-4">
          <div className="flex flex-col md:flex-row items-center justify-between gap-4">
            <div className="flex items-center gap-2">
              <img
                src="/assets/generated/scrambly-logo.dim_512x256.png"
                alt="Scrambly"
                className="h-8 object-contain"
              />
              <span className="text-white/70 text-sm font-nunito">
                © {new Date().getFullYear()} Scrambly
              </span>
            </div>
            <div className="flex items-center gap-4 text-sm font-nunito text-white/70">
              <EmergencyCallButton />
              <span>
                Built with{' '}
                <span className="text-sonic-yellow">♥</span>{' '}
                using{' '}
                <a
                  href={`https://caffeine.ai/?utm_source=Caffeine-footer&utm_medium=referral&utm_content=${encodeURIComponent(window.location.hostname || 'scrambly')}`}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="text-secondary hover:text-white transition-colors underline"
                >
                  caffeine.ai
                </a>
              </span>
            </div>
          </div>
        </div>
      </footer>
    </div>
  );
}
