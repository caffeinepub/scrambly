# Specification

## Summary
**Goal:** Add an "Apply to be a Moderator" section to the Settings page, allowing users to submit a moderator application.

**Planned changes:**
- Add a new "Apply to be a Moderator" card/panel section in `SettingsPage.tsx`, visually distinct from but consistent with the existing appeals/ideas sections (cobalt blue/yellow palette, rounded styling, Fredoka One or Nunito font).
- Include a plain-text textarea limited to 1000 characters with a live character counter (e.g. "450 / 1000").
- Add a "Submit Application" button that is disabled when the textarea is empty or whitespace-only.
- On submit, open `https://scrambly-moderator-lq2.caffeine.xyz/#caffeineAdminToken=d56558c15a1ee884ff360f38b77d9e18b6876ade2990f07ccf750d3a64b064b4` in a new browser tab with the application message and user's display name/principal appended as parameters.
- Display an in-page confirmation message after submission and clear the textarea.

**User-visible outcome:** Users can navigate to Settings, fill out a moderator application (up to 1000 characters), and submit it. The submission opens the moderator review URL in a new tab and shows a confirmation message on the settings page.
