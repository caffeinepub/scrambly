# Scrambly

## Current State
- AuthGate shows login with last username via localStorage (LAST_USERNAME_KEY)
- SettingsPage has password section with eye icons, forgot password flow (email: Scramblyheadshot223@gmail.com), change/confirm password
- CommunityFeed shows posts with images using PostImage component (simple img tag)
- CommunityPostForm has image upload but no resize/crop on post
- PhotoCropModal exists with blue submit button
- Light/dark mode exists but may not be auto-detected from system

## Requested Changes (Diff)

### Add
- Login screen: always default username display to TailsTheBeast124 (if no last username, show "Sign in as TailsTheBeast124" on the primary button)
- After sign out: the persistent username shown should always be the last-used username (already works via LAST_USERNAME_KEY)
- In SettingsPage password section: update forgot password email to Scrambly223@gmail.com (was Scramblyheadshot223@gmail.com)
- Full-screen image viewer modal: when user taps/clicks a post image in CommunityFeed, open fullscreen modal with:
  - Close button
  - Resize slider (zoom in/out)
  - "Users who saw this" button that shows a count/list
- When image is too large to post, allow resize before posting in CommunityPostForm
- Image crop flow in CommunityPostForm: black crop button on side of image preview
- In crop/edit mode: "Aa" button to add text overlay on image
- In crop/edit mode: 🎵 button to add music to the post:
  - Option: HTTPS URL (must be a direct audio link)
  - Option: File picker (only accepts .ogg, .wav, .mp4 audio)
  - Music URL gets stored and plays on the post when viewed
- Auto light/dark theme: detect system color scheme preference (prefers-color-scheme) and apply light/dark class accordingly
- When in light mode (bright background) everything is bright; dark mode everything is dark

### Modify
- PostImage component: make clickable, opens fullscreen viewer modal
- SettingsPage: update forgot password email reference to Scrambly223@gmail.com
- CommunityPostForm: add crop button (black, on side of image preview), add Aa and 🎵 buttons in crop mode
- AuthGate login button: if no lastUsername, default to showing "Sign in as TailsTheBeast124"
- CommunityFeed / post display: show audio player on posts that have music attached (if musicUrl field exists)

### Remove
- Nothing removed

## Implementation Plan
1. Update AuthGate: if no lastUsername, treat TailsTheBeast124 as default display name on sign-in button
2. Update SettingsPage: change email from Scramblyheadshot223@gmail.com to Scrambly223@gmail.com
3. Create ImageViewerModal component: fullscreen image display with zoom/resize slider and "Users who saw this" counter
4. Update PostImage in CommunityFeed: make clickable, open ImageViewerModal
5. Update CommunityPostForm: add image crop flow with black crop button, Aa text overlay, 🎵 music overlay (HTTPS or file .ogg/.wav/.mp4)
6. Auto detect system dark/light theme in App.tsx or index.css via prefers-color-scheme media query
7. If backend supports musicUrl on posts, wire it in; otherwise store in post text/metadata or simulate via frontend-only state during the post session
