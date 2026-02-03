# Multi-User Todo Application

I want to create a multi-user Todo list application.

## User Account

- Users sign up with email and password
- Users log in with email and password
- Users can change their password
- Users can delete their account (all their todos, including those in trash, are permanently deleted)

## User Profile

- Each user has a profile with: display name
- Users can edit their display name
- Users cannot view other users' profiles (this is a private todo app)

## Creating Todos

- Users can create a todo with:
  - Title (required)
  - Description (optional, can be left empty)
  - Start date (optional, can be left empty)
  - Due date (optional, can be left empty)
- Newly created todos are incomplete by default

## Viewing Todos

- Users can view a list of their own todos
- The list is paginated
- Each todo in the list shows: title, completion status, start date (if set), due date (if set), and creation date
- Users can view a single todo to see all its details including full description

## Completing Todos

- Users can mark a todo as complete
- Users can mark a todo as incomplete
- This is a simple toggle between two states

## Editing Todos

- Users can edit their todo's title, description, start date, and due date
- Every edit is recorded in the todo's history

## Edit History

- Each todo has an edit history
- Every time a todo is edited, a history entry is created
- Each history entry records:
  - When the edit was made
  - What the title was changed to (if changed)
  - What the description was changed to (if changed)
  - What the start date was changed to (if changed)
  - What the due date was changed to (if changed)
- Users can view the full edit history of any of their todos
- History entries are sorted from most recent to oldest

## Deleting Todos

- Users can delete their own todos
- Deleted todos are not permanently removed (soft delete)
- Deleted todos no longer appear in the normal todo list

## Trash

- Users can view a list of their deleted todos (trash)
- The trash list is paginated
- Users can restore a deleted todo from the trash (it returns to the normal todo list)
- Users can permanently delete a todo from the trash
- Permanently deleting a todo also deletes its edit history

## Filtering Todos

- Users can filter their todo list by completion status:
  - All todos
  - Only complete todos
  - Only incomplete todos

## Sorting Todos

- Users can sort their todo list by:
  - Creation date (newest first or oldest first)
  - Start date (earliest first or latest first)
  - Due date (earliest first or latest first)
- Todos without a start date appear at the end when sorting by start date
- Todos without a due date appear at the end when sorting by due date

## Privacy

- Each user's todos are completely private
- Users can only see their own todos
- There is no way to view, access, or share another user's todos

Please analyze these requirements and create a detailed requirements specification document.