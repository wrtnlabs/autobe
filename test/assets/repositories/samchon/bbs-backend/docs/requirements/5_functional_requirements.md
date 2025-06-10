# 5. Functional Requirements

This section provides an exhaustive enumeration and description of all critical functional requirements for the Internal Bulletin Board System. These requirements are intended to be unambiguous and sufficiently detailed to guide development and testing of the system.

---

## 5.1 User Authentication & Authorization

- **Login and Access Control**
  - Only employees with valid company-issued email addresses may register or log in.
  - Password authentication is mandatory; initial password is fixed (`1234`).
  - On first login, system requires an immediate password change.
  - No browsing, viewing, or interacting with boards, posts, or comments unless authenticated.
  - Session management ensures active logins are maintained and time out securely after inactivity.

- **Password Management**
  - Users can initiate password change anytime from the top-right menu.
  - System enforces password rules (e.g., minimum length, complexity, and no reuse of last N passwords).
  - Passwords are never displayed and changes require re-authentication if session expires.

- **Role-Based Permissions**
  - Standard Employee: can post, comment, like, and edit/delete their own content.
  - Administrator: may delete/edit any post or comment, and manage user accounts.

---

## 5.2 Board Structure and Navigation

- **Boards**
  - Three board types: Announcements, Free Board, Popular Board.
  - **Announcements**: For official company or management posts; only administrators may post or edit.
  - **Free Board**: Open to all employees for general discussions, notices, or sharing.
  - **Popular Board**: Displays posts from Free Board or Announcements that have reached ≥10 likes; posts auto-promote based on this threshold and are demoted if likes fall below.

- **Navigation**
  - Left navigation bar lists all boards and includes a prominent 'New Post' button.
  - Selecting a board loads its post list with title, author, likes, date, and preview snippet.

---

## 5.3 Posting and Content Management

- **Post Actions**
  - Users (with proper permissions) can create a post with title, content, attached files, and tags.
  - Edit and delete actions allowed for authors and admins. Deleted posts are *hard deleted* (permanently removed without recovery).
  - Attachments are checked for allowed file types/size before upload; system displays linking or previews appropriately.

- **Commenting**
  - Each post supports commenting from users.
  - Comments allow one-level nested replies (i.e., users can reply to comments, but not to replies).
  - Comments and replies can be created, edited (by their author or admin), or hard deleted.

---

## 5.4 Interaction Features: Likes

- **Likes**
  - Both posts and any comment/reply may be liked by logged-in users.
  - Only one like per user per entity is permitted (duplicate attempts are silently blocked server-side to prevent race conditions).
  - Like/unlike toggling provides instant UI feedback and updates counters both visually and in the database.

- **Popular Board Mechanism**
  - Auto-promotion occurs immediately upon a post reaching the 10-like threshold; demotion occurs in realtime if likes drop below.
  - Each promoted post retains a visible badge or indicator of 'Popular' status.
  
---

## 5.5 Moderation and Admin Operations

- **Administrative Operations**
  - Admin users may remove, edit, or restore any post or comment across all boards (except hard-deleted content, which is non-recoverable).
  - Admins can issue password resets for users and may audit user activity logs for security or compliance.
  - Admins have access to controls for configuring board categories and their properties.

- **User Management**
  - Standard users can view and manage their own profile and settings.
  - Administrator can view, activate, deactivate, or delete user accounts.

---

## 5.6 Workflow and Notifications

- **System Notifications**
  - Password change prompt and alerts (on first login or password expiry).
  - Notification for new announcement posts (optional email push or in-app alert).
  - Informing users when their post is promoted/demoted to/from the Popular Board.

---

## 5.7 Other Mandatory Constraints

- **Data Deletion**
  - All deletions (posts/comments) are hard deletes; permanently erased from all storage.
  - No archive or undelete option for users or administrators.

- **Concurrency Handling**
  - Simultaneous requests for likes/unlikes are handled atomically to prevent duplicate likes.

---

[Next: Non-Functional Requirements](6_non_functional_requirements.md)
