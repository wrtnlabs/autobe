# 7. Board Structure and Content Management

This section details the architecture and protocols for managing digital content in the Internal Bulletin Board System (IBBS). The objective is to maximize usability, maintain organizational clarity, encourage active participation, and ensure reliable information flow throughout the organization.

---

## 7.1 Overview of Board Structure

### Board Types and Definitions
The IBBS consists of three core board types, each serving a unique purpose within the internal communication environment:

#### 1. **Announcements Board**
- **Purpose**: Centralized platform for official company communications (e.g., HR notices, policy updates, critical project milestones).
- **Access**: Readable by all authenticated users; only users with admin rights or designated communicators can post.
- **Content Examples**: New policy notification, system outage alert, holiday announcements.

#### 2. **Free Board**
- **Purpose**: Open forum for employees to discuss work-related or social topics, share knowledge, or ask questions offline from formal channels.
- **Access**: All authenticated users can create, edit, delete their own posts and interact with others’ content.
- **Content Examples**: Carpooling requests, lunch meetups, tech tips, team celebrations.

#### 3. **Popular Board**
- **Purpose**: Showcases high-engagement content by automatically promoting popular posts from the Free Board.
- **Accessibility**: Mirrors content from other boards but only includes posts that have met popularity criteria.
- **Content Promotion**: Posts with 10 or more likes are dynamically promoted—no direct posting; posts demoted if likes drop below threshold.
- **Content Examples**: Widely-appreciated advice, company-wide questions, trending celebrations.

**See also:** [3_user_personas.md](3_user_personas.md) | [4_user_journeys_and_scenarios.md](4_user_journeys_and_scenarios.md)

---

## 7.2 Board Organization and Navigation

- **Sidebar Navigation**: The left navigation bar persistently lists all available boards and provides a clear entry point for posting and browsing.
- **Board Listings**: Boards are listed in order of organizational priority: Announcements, Free Board, Popular Board.
- **New Post Button**: Visible for all boards, but posting permissions and workflow depend on board type.
- **Board Filtering**: Users can filter by latest, most liked, or by author.

---

## 7.3 Post Promotion Logic (Popular Board)

- **Automatic Promotion Flow:**
  1. A post created on the Free Board receives likes from distinct users.
  2. When the like count reaches **10 or more**, the system copies or flags the post for display in the Popular Board.
  3. If likes fall below 10, the post is automatically removed from the Popular Board (remains on Free Board).
- **De-Duplication**: Only unique posts shown; edits on the original Free Board post are reflected in the Popular Board version.
- **No Manual Posting**: Users cannot create or delete Popular Board-only content directly.

---

## 7.4 Content Management Rules

### CRUD Operations
- **Create**: Users can create posts and comments where permitted.
- **Edit**: Authors (or admins) can edit their own posts/comments; edit history is not tracked (no versioning).
- **Delete**: Only authors and admins can hard-delete content. There is no soft-delete; once deleted, content is not recoverable.

### Commenting System
- Comments and **one-level** nested replies (no deeper threading).
- Both posts and comments support likes (one per user).

### Moderation & Special Workflows
- **Announcements Board**: Admin moderation required for content, ensuring only official communications appear.
- **Free Board**: Moderation/offensive content reporting handled through user flagging and admin review.
- **Popular Board**: Automated, no direct moderation; reflects elsewhere-moderated content.

---

## 7.5 Deletion & Data Handling Policies

- **Permanent (Hard) Delete:**
  - All deletions immediately remove data from the system with no recovery window.
  - Applied equally to posts and comments.
- **Cascade Logic:**
  - Deleting a post automatically deletes all associated comments and likes.
- **Duplicate Like Prevention:**
  - All like operations are validated server-side to prevent race-condition duplicates (see [6_non_functional_requirements.md](6_non_functional_requirements.md)).

---

## 7.6 Workflow Example

1. **User visits Free Board**, browses posts, leaves a comment, and likes a colleague’s post.
2. As likes accumulate and the post crosses the threshold (≥10), it is visible on the Popular Board.
3. The post's author decides to update information—the edit is seen in both Free and Popular Boards.
4. If the author deletes the post, it is removed from all boards and all associated data is deleted permanently.

---

### For related requirements:
- [5_functional_requirements.md](5_functional_requirements.md)
- [6_non_functional_requirements.md](6_non_functional_requirements.md)
- [8_security_and_authentication.md](8_security_and_authentication.md)
- [9_ui_ux_requirements.md](9_ui_ux_requirements.md)
