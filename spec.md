# Scrambly

## Current State
AuthGate shows a generic "Login to Scrambly" button. SettingsPage has a Password (PIN) section with set/verify PIN fields but no forgot password or show/hide password feature. Usernames are set during onboarding and stored in the backend.

## Requested Changes (Diff)

### Add
- Store last logged-in username in localStorage after profile loads; on sign-out keep it persisted
- Login screen: if a stored username exists, show "Sign in as [USERNAME]" on the button instead of generic text
- SettingsPage Password section: "Forgot Password" subsection with:
  - Eye icon toggle to show/hide current PIN
  - "Change Password" button that opens in-app reset flow
  - In-app reset: enter new password + confirm password fields with eye toggles
  - Note shown: email would be sent from Scramblyheadshot223@gmail.com (simulated, actual email not available)
  - Submit button to apply the new password

### Modify
- AuthGate.tsx: read stored username from localStorage; display on login button; update stored username when profile loads; clear on explicit logout but keep for "sign in as" display
- SettingsPage.tsx: expand Password section with forgot password UI

### Remove
- Nothing removed

## Implementation Plan
1. AuthGate.tsx: add LAST_USERNAME_KEY localStorage; when userProfile loads and is not null, store username; on login screen show stored username in button label; on logout keep the stored username so next visit shows "Sign in as ..."
2. SettingsPage.tsx: add forgot password state (showForgotPassword, showCurrentPin, showNewPin, showConfirmPin, forgotStep); add eye-toggle show/hide for current PIN; add change password flow with new + confirm password fields
