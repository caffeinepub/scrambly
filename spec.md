# Specification

## Summary
**Goal:** Add a "Remember Me" feature to the login flow so users can stay signed in across sessions and are protected from accidental sign-outs.

**Planned changes:**
- Add a "Remember Me" checkbox to the login/AuthGate UI, defaulting to unchecked
- Save and restore the "Remember Me" preference in localStorage so it persists across page refreshes
- When "Remember Me" is enabled, maintain the authenticated session on page load without re-prompting login
- When "Remember Me" is enabled and the user clicks sign-out, show a confirmation dialog warning them before proceeding
- If the user confirms sign-out with "Remember Me" active, log them out and clear the preference from localStorage
- If the user cancels, they remain signed in

**User-visible outcome:** Users can check "Remember Me" at login to stay signed in across sessions, and will see a confirmation prompt before being signed out when the feature is active.
