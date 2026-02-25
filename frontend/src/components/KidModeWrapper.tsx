import React from 'react';
import type { Profile } from '../backend';

interface KidModeWrapperProps {
  profile: Profile | null | undefined;
  children: React.ReactNode;
  kidOnlyContent?: React.ReactNode;
  hideInKidMode?: boolean;
}

export function getAge(profile: Profile | null | undefined): number | null {
  if (!profile) return null;
  const currentYear = new Date().getFullYear();
  return currentYear - Number(profile.birthYear);
}

export function isKidMode(profile: Profile | null | undefined): boolean {
  const age = getAge(profile);
  return age !== null && age <= 12;
}

export default function KidModeWrapper({ profile, children, kidOnlyContent, hideInKidMode }: KidModeWrapperProps) {
  const kidMode = isKidMode(profile);

  if (hideInKidMode && kidMode) {
    return null;
  }

  if (kidMode && kidOnlyContent) {
    return <>{kidOnlyContent}</>;
  }

  return <>{children}</>;
}
