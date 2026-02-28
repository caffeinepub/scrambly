# Specification

## Summary
**Goal:** Add Sonic speedrun videos, update parental PIN defaults, add a face scan step to parental access, build an admin panel with ban/warn/unban/mod tools, and tighten post/search moderation for the Scrambly app.

**Planned changes:**
- Replace Videos page content with four Sonic speedrun categories (Sonic 1, Sonic 2, Sonic 3, Sonic Mania), each with at least 3 YouTube entries; remove old unrelated video entries and update category filter buttons accordingly
- Set default parental control PIN to '1234'; allow parents to change it to any 3–4 character value with validation feedback
- Add a camera/face-scan modal step before PIN entry when opening Parental Controls; capture a single frame, show "Verifying parent identity..." message, immediately discard the image, then proceed to PIN entry; fall back to PIN-only if camera permission is denied
- Create an `/admin` route accessible only to TailsTheBeast124, with: Ban section (username input + Ban button), Warn section (username input + Warn button), Unban section (scrollable list of banned users each with an Unban button), Ban List counter showing "Nobody" / "N person(s) banned" up to 100,000,000,000,000, and Warn List counter up to 100,000,000,000,000
- Add a Moderation section in the Admin Panel: username input, reason input, and "Make Moderator" button; on next load after promotion, show a one-time celebratory banner: "Yay, you're a mod! Help with Scrambly to make it better!"
- Remove auto-warn on regular text posts; instantly ban (before saving) any user who posts anime images or uses prohibited keywords (porn, anime, inappropriate anime); show a ban reason message to the affected user
- Update search moderation: when TailsTheBeast124 searches inappropriate terms, silently replace results with Sonic vs Metal Sonic videos; when any user searches "sonic.exe vs metal sonic", show a static list of YouTube entries for that topic; non-admin users searching inappropriate terms still trigger existing moderation
- Add backend (Motoko) support for ban, warn, unban, and mod-role records with counters supporting up to 100,000,000,000,000

**User-visible outcome:** The Videos page shows Sonic speedrun content; parental controls use PIN 1234 by default with a face-scan step; TailsTheBeast124 has a fully functional admin panel to ban, warn, unban, and promote moderators; post and search moderation rules are updated as specified.
