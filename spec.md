# Specification

## Summary
**Goal:** Add a friends chat bar and friends panel to FriendsModePage with a full friend request system (send, accept, decline) and a 1000-friend limit enforced on both frontend and backend.

**Planned changes:**
- Add a persistent "Friends" chat bar below the user profile section on FriendsModePage.tsx that opens a slide-up friends panel when tapped
- Display a "No Friends" empty state in the panel when the user has zero accepted friends
- List all accepted friends in the panel; show a "Friend limit reached (1000/1000)" notice and disable adding when the limit is hit
- Add a "Friend Requests" section in the panel showing incoming pending requests with Accept and Decline buttons; accepting immediately moves the user to the friends list
- Add backend data model (`FriendRequest` record with requesterId, recipientId, status, sentAt) and expose `sendFriendRequest`, `respondToFriendRequest`, `getFriends`, and `getFriendRequests` functions in `backend/main.mo`
- Enforce the 1000-friend cap in the backend's `sendFriendRequest` function, returning an error if exceeded

**User-visible outcome:** Users can open a friends panel from FriendsModePage, see their friends list or an empty state, view and respond to incoming friend requests, and are prevented from exceeding 1000 friends on both the UI and backend.
