# Economic/Political Discussion Board

I want to create a discussion board for economic and political topics.

## User Account

- Users sign up with email and password
- Users log in with email and password
- Users can change their password
- Users can delete their account (all their articles and comments are also deleted)

## User Profile

- Each user has a profile with: display name and bio text
- Users can edit their display name and bio
- Users can view other users' profiles
- A user's profile shows:
  - Their display name and bio
  - A list of all articles they have written
  - A list of all comments they have written

## Sections

- The board is divided into sections (e.g., Politics, Economy, Current Affairs)
- Sections are created and managed by administrators only
- Each section has: name and description
- Users can view the list of all sections
- Users can browse articles within a specific section

## Articles

- Users can create articles in any section
- Every article has:
  - Title (required)
  - Content (required, text)
  - Section (required, must choose one section)
- Users can attach files to their articles
- Users can attach images to their articles
- Multiple files and images can be attached to a single article
- Users can add tags to their articles (free text, multiple tags allowed)
- Users can edit their own articles (title, content, attachments, tags)
- Users can delete their own articles

## Article List

- Users can view the list of articles in a section
- The list is paginated
- Each article in the list shows: title, author, tags, comment count, and time posted
- The list does not show the full content (only title)
- Users can sort articles by:
  - Newest first
  - Oldest first

## Viewing an Article

- Users can view a single article with its full content
- The article page shows: title, author, content, attachments, tags, and time posted
- Users can download attached files and images

## Searching Articles

- Users can search articles by title or content
- Search results are paginated
- Users can filter articles by tags

## Comments

- Users can write comments on articles
- Comments are single-level only (no nested replies)
- Users can view all comments on an article
- Comments are sorted by oldest first
- Each comment shows: author, content, and time posted
- Users can edit their own comments
- Users can delete their own comments

## Administrator System

**Becoming an Administrator**
- Any user can submit a request to become an administrator
- The request includes a reason (text)
- Super administrators can view the list of pending requests
- Super administrators can approve or reject requests
- When approved, the user becomes a regular administrator

**Administrator Grades**
- There are two grades: regular administrator and super administrator
- Super administrators can promote regular administrators to super administrator
- Super administrators can demote other super administrators to regular administrator
- Super administrators cannot demote themselves

**Administrator Capabilities**
- Administrators can do everything regular users can do (write articles, comments, etc.)
- Administrators can create, edit, and delete sections
- Administrators can delete any article
- Administrators can delete any comment
- Administrators can ban users
- Administrators can unban users
- Administrators can view the list of banned users

## Banning

- Banned users cannot log in to the platform
- Banned users' existing articles and comments remain visible
- When a user is banned, a reason is recorded
- Administrators can view the ban reason for each banned user

Please analyze these requirements and create a detailed requirements specification document.