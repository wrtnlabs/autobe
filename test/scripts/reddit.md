# Reddit-like Community Platform

I want to create a Reddit-like community platform.

## User Account

- Users sign up with email and password, and choose a unique username
- Users log in with email and password
- Users can change their password
- Users can delete their account (all their posts and comments are also deleted)

## User Profile

- Each user has a profile with: display name, bio text, and avatar image
- Users can edit their own display name, bio, and avatar
- Users can view any other user's profile
- A user's profile page shows:
  - Their display name, bio, and avatar
  - Their total karma score
  - A list of all posts they have created
  - A list of all comments they have written

## Karma

- Every user has a single karma score (one number)
- When someone upvotes your post or comment, your karma increases by 1
- When someone downvotes your post or comment, your karma decreases by 1
- When someone removes their vote, your karma adjusts accordingly
- Karma can be negative

## Communities

- Any user can create a community
- A community has: unique name, description text, and icon image
- The user who creates a community becomes its owner
- Users can browse all communities in a list
- Users can search for communities by name
- Each community shows its subscriber count

## Subscribing

- Users can subscribe to any community
- Users can unsubscribe from any community
- Users can view a list of all communities they are subscribed to
- Subscribing is required to create posts in that community

## Posts

- Users can create a post in any community they are subscribed to
- Every post has a title (required)
- A post must be one of three types:
  - Text post: has text content
  - Link post: has a URL
  - Image post: has an uploaded image
- Users can edit their own posts
- Users can delete their own posts
- When viewing a single post, users see: title, full content, author, community, vote score, comment count, and when it was posted

## Post Voting

- Users can upvote a post (adds 1 to score)
- Users can downvote a post (subtracts 1 from score)
- Each user can only vote once per post
- Users can change their vote from upvote to downvote or vice versa
- Users can remove their vote entirely
- Vote score = total upvotes minus total downvotes

## Post Feeds

There are three ways to view posts:

**Home Feed**
- Shows posts only from communities the user is subscribed to
- Available only to logged-in users

**Popular Feed**
- Shows posts from all communities across the platform
- Available to everyone (including logged-out users)

**Community Feed**
- Shows posts from one specific community
- Available to everyone

All three feeds support the same sorting options:
- Hot: recent posts with many upvotes appear first
- New: most recently created posts appear first
- Top: highest vote score first (with time filter: today, this week, this month, this year, all time)
- Controversial: posts with many votes but score close to zero appear first

All feeds are paginated.

## Post List Display

When viewing any feed, each post in the list shows:
- Title
- Author username
- Community name
- Vote score
- Comment count
- Time since posted (e.g., "3 hours ago")
- For text posts: first 200 characters of content
- For image posts: thumbnail of the image
- For link posts: the domain name of the URL (e.g., "youtube.com")

## Comments

- Users can write a comment on any post
- Users can reply to any comment
- Replies can have replies, with no depth limit
- Users can edit their own comments
- Users can delete their own comments
- Each comment shows: author, content, vote score, time since posted, and nested replies

## Comment Voting

- Same rules as post voting
- Users can upvote or downvote any comment
- One vote per user per comment
- Can change vote or remove vote

## Comment Sorting

Comments on a post can be sorted by:
- Best: highest vote score first
- New: most recent first
- Controversial: many votes but score close to zero

## Community Moderation

**Moderator Roles**
- The community creator is the owner (highest authority)
- Owner can add moderators
- Owner can remove moderators
- Moderators can add other moderators
- Moderators cannot remove the owner
- Moderators cannot remove each other (only owner can remove moderators)

**Moderator Actions**
- Moderators can delete any post in their community
- Moderators can delete any comment in their community
- Moderators can ban users from their community
- Moderators can unban users
- Moderators can view the list of banned users
- Banned users cannot create posts or comments in that community, but can still view content

## Reporting

- Users can report any post or comment
- When reporting, users must provide a reason (text)
- Moderators can view all reports for their community
- Each report shows: the reported content, who reported it, and the reason
- Moderators can approve a report (deletes the content) or dismiss it (keeps the content)
- Dismissed reports are removed from the report list

Please analyze these requirements and create a detailed requirements specification document.