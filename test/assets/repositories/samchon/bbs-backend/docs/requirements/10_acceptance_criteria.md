# 10. Acceptance Criteria for Internal Bulletin Board System

This document defines clear, measurable acceptance criteria that must be satisfied for the Internal Bulletin Board System to be considered complete and ready for launch. Each criterion directly maps to one or more functional and non-functional requirements, ensuring traceability and thorough coverage.

---

## 1. Authentication & Access Control
- **Only company emails can log in:**
  - Acceptance Test: All non-company email attempts are rejected.
- **Default password "1234" on first sign-in:**
  - Acceptance Test: New users receive "1234" as their initial password and are immediately forced to reset it.
- **Mandatory password change upon first log-in:**
  - Acceptance Test: Users cannot proceed past password reset screen when first logging in.
- **No access to posts/comments if not logged in:**
  - Acceptance Test: All board and content URLs redirect to the login page when accessed while unauthenticated.

## 2. Posting & Commenting
- **CRUD for posts and comments:**
  - Acceptance Tests: Authenticated users can create, update, and delete their own posts/comments; admins can do so for any post/comment.
- **One-level nested replies in comments:**
  - Acceptance Test: Users can reply to comments, but cannot reply more than one level deep.
- **Likes on posts & comments:**
  - Acceptance Test: Any user can like a given post/comment exactly once; no “like” button available on own posts/comments.
- **Posts/comments hard delete:**
  - Acceptance Test: Deleted items are not retrievable via any UI or API.

## 3. Board Structure & Navigation
- **Announcements, Free Board, Popular Board available from sidebar:**
  - Acceptance Test: All boards are easily discoverable in the sidebar navigation.
- **Popular Board populates automatically:**
  - Acceptance Test: When a post’s like count reaches ≥10, it automatically appears in Popular Board.
- **New Post button is always visible:**
  - Acceptance Test: Button is present in the sidebar on all screens (except login).

## 4. UI/UX & Usability
- **Top-right: login/logout and password change menu:**
  - Acceptance Test: Users can always access login/logout and password change from top-right on all screens.
- **Users experience clear error/success notifications:**
  - Acceptance Test: All actions (post, comment, like, login, failure, etc.) trigger user-friendly feedback messages.
- **Layout adheres to design spec:**
  - Acceptance Test: UI review confirms navigation layout matches requirements document.

## 5. Security & Concurrency
- **Prevention of duplicate likes under concurrency:**
  - Acceptance Test: Simulated concurrent like attempts on the same post/comment from the same user only register a single like.
- **Session expiration & management:**
  - Acceptance Test: Sessions expire after required period; attempts with expired credentials are redirected to login.
- **Audit logging for admin actions:**
  - Acceptance Test: All admin deletes and edits are recorded in the audit log and accessible by superadmin.

## 6. Performance & Reliability
- **System handles 100 concurrent users without error:**
  - Acceptance Test: Load test at 100 concurrent sessions shows no UI or API failures, and page loads within 2 seconds.
- **System uptime meets 99.9% SLA during acceptance period:**
  - Acceptance Test: Uptime logged and monitored for at least 30 days prior to go-live.

## 7. Compliance & Privacy
- **No personally identifiable information (PII) is exposed:**
  - Acceptance Test: User info visible to others is limited to name and company email; no PII leak on pages or API.
- **Password policy enforced:**
  - Acceptance Test: Passwords must meet minimum length/character variety as specified.

## 8. Localization and Accessibility
- **Primary language matches organization standard:**
  - Acceptance Test: All text in UI and emails is in English (en-US locale) or according to organization default.
- **Accessible for screen readers:**
  - Acceptance Test: All navigation and major elements pass accessibility review for common screen readers.

---

For final acceptance, each criterion above must be demonstrated and signed off by business, product, and technical QA stakeholders. 

[Next: Data Model & ERD →](11_data_model_and_erd_high_level.md)
