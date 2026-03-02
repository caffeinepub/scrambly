# Specification

## Summary
**Goal:** Restrict app access so that only the user with username `TailsTheBeast124` can log in and use the app.

**Planned changes:**
- In `AuthGate.tsx`, after a user authenticates via Internet Identity, check if their resolved username is `TailsTheBeast124`
- If the username is anything other than `TailsTheBeast124`, immediately display the `AccessDeniedScreen` before any app content renders, regardless of onboarding state or account type
- The `AccessDeniedScreen` includes a logout button that clears the Internet Identity session
- Users logged in as `TailsTheBeast124` continue to have full normal access

**User-visible outcome:** Only the user `TailsTheBeast124` can access the app. Any other authenticated user sees an access denied screen with a logout option and cannot reach any part of the app.
