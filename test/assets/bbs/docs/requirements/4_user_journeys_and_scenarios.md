# 4. User Journeys and Scenarios

## Purpose
This document outlines practical, step-by-step user journeys for the Internal Bulletin Board System (IBBS). Each scenario is mapped to a primary user persona—Employee and Administrator—and demonstrates typical actions including authentication, posting, commenting, liking, and moderation workflows. These user journeys are designed to ensure the system supports seamless internal communication and efficient content management while satisfying security and usability requirements.

---

## Table of Contents
1. [Introduction](#introduction)
2. [Persona A: Employee – Typical Flows](#persona-a-employee--typical-flows)
    1. [Login and Password Reset](#login-and-password-reset)
    2. [Reading and Navigating Boards](#reading-and-navigating-boards)
    3. [Posting Announcements or Free Topics](#posting-announcements-or-free-topics)
    4. [Commenting and Replying](#commenting-and-replying)
    5. [Liking Posts and Comments](#liking-posts-and-comments)
3. [Persona B: Administrator – Moderation and Content Management](#persona-b-administrator--moderation-and-content-management)
    1. [Managing and Deleting Content](#managing-and-deleting-content)
    2. [Monitoring Popular Posts](#monitoring-popular-posts)
4. [Edge Cases and Special Scenarios](#edge-cases-and-special-scenarios)
5. [Summary](#summary)

---

## Introduction
The following user journeys help developers and stakeholders understand exactly how the Internal Bulletin Board System will be used in practice. Each journey demonstrates key functionality, expected system behavior, and the user experience, focusing on critical requirements: authentication, board navigation, posting, commenting, liking, and administration.


## Persona A: Employee – Typical Flows

### 1. Login and Password Reset
**Scenario:** First-time access by a new employee
- The employee visits the IBBS web portal.
- Presented with a login screen, only company email addresses are accepted.
- Employee enters their official company email and the default password (`1234`).
- The system detects the default password and enforces a password change before granting further access.
- Employee creates a new, secure password.
- Upon successful password update, the system logs the employee in and displays the main dashboard with board navigation.

**Scenario:** Returning user authentication
- Employee opens the application, enters their email and set password.
- The system authenticates and grants access to the bulletin board system.


### 2. Reading and Navigating Boards
**Scenario:** Browsing posts on the bulletin board
- Upon login, the employee sees a left navigation bar listing all available boards: Announcements, Free Board, and Popular Board.
- Employee clicks "Announcements" to view official updates from HR or management.
- Employee selects "Free Board" to browse or post discussion topics.
- In each board, posts are listed chronologically (Popular Board sorts by like count).


### 3. Posting Announcements or Free Topics
**Scenario:** Creating a new post
- Employee clicks the "New Post" button in the left navigation.
- A post creation form appears; the employee selects the target board (Announcements or Free Board), writes a title, enters content, and submits.
- The system checks posting permissions, saves the post, and updates the board list.

**Scenario:** Editing or deleting own post
- Employee navigates to their previously submitted post.
- The "Edit" and "Delete" options appear for their content.
- Upon editing, the changes are reflected instantly.
- Deleting removes the post permanently (hard delete).


### 4. Commenting and Replying
**Scenario:** Adding a comment
- Employee opens a post and clicks the "Add Comment" button.
- Types a comment and submits; the comment is displayed below the post.

**Scenario:** Nested (one-level) replies
- Employee views a comment and chooses "Reply."
- Enters a reply (limited to one nesting level), which appears directly below the parent comment.

**Scenario:** Deleting or editing own comments/replies
- Employee finds their comment/reply and selects the edit or delete option—modifications are instantly reflected, and deletions are permanent.


### 5. Liking Posts and Comments
**Scenario:** Liking content
- When viewing posts/comments, the employee clicks the "Like" button.
- The system registers a single like per user per item (no duplicates, even with simultaneous requests).
- Posts or comments with 10+ likes are promoted to the “Popular Board.”
- Unlike actions are not supported; likes are final.

---

## Persona B: Administrator – Moderation and Content Management

### 1. Managing and Deleting Content
**Scenario:** Administrative deletion
- Administrator logs in with higher privileges.
- Can view all posts and comments across boards.
- For policy violations (e.g., inappropriate language or off-topic material), admin selects a post/comment and clicks "Delete." The item is hard deleted.

**Scenario:** Editing Announcements
- Admin creates and edits posts in the "Announcements" board, ensuring only authorized company news is shared.

### 2. Monitoring Popular Posts
**Scenario:** Reviewing the Popular Board
- Admin accesses the "Popular Board" to monitor which posts reach the 10-like threshold and reviews for appropriateness.
- Can remove inappropriate posts from any board, even if popular.

---

## Edge Cases and Special Scenarios
- **Simultaneous Like Clicking:** Multiple users attempt to like a post/comment at the same instant; server logic ensures only unique like per user.
- **Unauthorized Actions:** Non-authenticated users are redirected to the login page if they attempt any operation.
- **Expired Session:** User session expires; prompt appears for login to continue.
- **Hard Deletes:** Deleted items disappear instantly from all interfaces, and no traces remain in the system.

---

## Summary
These user journeys illustrate the end-to-end experience for both employees and administrators. The flows ensure compliance with the requirements for security, usability, and efficient internal communication. Realistic, practical examples help guide developers in building a system that meets both business and user needs.
