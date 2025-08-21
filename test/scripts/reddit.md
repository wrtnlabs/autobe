Please make a service following the requirements below.

Even though there are some things unclear, don't ask me anything. Since I'm not familiar with programming, I can't clearly answer any of your questions. Just make every determination by yourself about that, filling the gaps as best you can, and just show me the final analysis report.

-------------

# **Community Platform — Product Requirements**

## **1. Service Overview**

- A service where users can create **topic-based sub-communities**, post within them, and discuss via comments and **upvotes/downvotes like Reddit.**
- On the **home (/**) main content area**, show **posts from sub-communities I’ve joined**, sorted by the selected **sort order**.
- On the **right sidebar of Home**, always show the **latest posts from all sub-communities**.
- **Every page** has a fixed **left sidebar** with **Home / Explore / Create** buttons and a **Recent Communities** list.
- For **users who haven’t joined any community yet**, the home feed shows **latest or top posts across all communities**, along with **guidance to explore/join communities** at the top or in the right sidebar.

---

## **2. Core Principles**

1. **Reading is open to everyone.** **Posting, commenting, voting, creating sub-communities, and joining/leaving** require login.
2. Keep the **login session generously long**. When it expires, **prompt a smooth re-login** without interrupting the current screen.
3. **Ownership is account-based.** Users can edit or delete **only the posts/comments they authored**.
4. **Minimize validation** and prioritize **smooth, error-free user flows** and UI behavior.

---

## **3. Major Features**

### **3.1 Sub-Communities**

- **Name**: Recommend short, readable alphanumeric names; allow hyphen (-) and underscore (_). **Names must be unique.**
- **Description**: Optional summary of the community.
- **Logo/Banner**: Display if provided (fallback to a default image).
- **Rules**: Keep brief, numbered if needed.
- **Create**: Any logged-in user can create (only check name uniqueness and basic format).
- **Edit**: Only the creator can edit title/description/logo/banner/rules. **Name is immutable.**
- **Member Count** = number of users who have joined (for display).
- **Category**: Choose 1 from: [Tech & Programming] [Science] [Movies & TV] [Games] [Sports] [Lifestyle & Wellness] [Study & Education] [Art & Design] [Business & Finance] [News & Current Affairs]
- **Delete**: Deleting a sub-community removes all posts within it.

### **3.1.a Join / Leave**

- Use the **top-level button** on the community page to toggle between **“Join” ↔ “Joined.”**
- **Effects**
    - The community’s posts are **included in** or **excluded from** the **home main feed**.
    - The **left sidebar’s Recent Communities list** (up to 5, by most recent activity) updates immediately.
    - Joining is unrelated to moderation privileges; it’s purely for **personalized display** (no mod/admin rights granted).

### **3.2 Posts**

- **Type**: Text-only (title + body).
- **Composition rules**
    - **Selecting a target sub-community is required.**
    - **Title**: 5–120 characters.
    - **Body**: 10-10,000 characters. Plain text and line breaks only (scripts/code prohibited).
    - **Author display name**: Optional (if empty, use a default like “Anonymous”).
- **Card display fields**: Community name (e.g., /c/ai), title, author, created time, comment count, score (upvotes − downvotes).
- **Permissions**: **Only the author** can edit/delete their post. **Posting does not require membership** in the target community.

### **3.3 Comments**

- **Create/Edit/Delete** require login, and **only the author** may edit/delete their comments.
- **Length**: 2-2,000 characters.
- **Structure**: Supports reply threads (nested replies).

### **3.4 Voting**

- **One user has a single state per item (post/comment)**:
    - “None” → can switch to **Upvote** or **Downvote**.
    - **Upvote ↔ Downvote** can be toggled directly.
    - Pressing the same button again reverts to **None**.
- **Score** is calculated as **upvotes − downvotes**.
- **Users cannot vote on their own posts/comments.**

### **3.5 Sorting & Pagination (Clear Rules)**

- **Sort orders**
    - **Newest**: **Most recently created items first.**
        - If created times are equal, **the more recently generated item (larger identifier)** comes first.
    - **Top**: **Higher score first.**
        - If scores are equal, **more recent creation time** comes first.
        - If created times are also equal, **the more recently generated item (larger identifier)** comes first.
- **Pagination**
    - **Main feeds** (Home, Community Home): **Show 20 cards at a time**; **[Load more]** reveals the next 20.
    - **Right sidebar Global Latest** (sitewide latest posts): **Always show 10** items.

### **3.6 Search**

- **Post search**: Match words in title/body. **Query must be at least 2 characters**. **Default sort is Newest**.
- **Sub-community search**: By name/title (query ≥ 2 chars).
- **Comment search**: Sorted by Newest.
- **Results are shown 20 per page**.

---

## **4. Information Architecture & Layout**

### **4.1 Global Layout (All Pages)**

- **Left Sidebar (fixed)**
    - **Home** button → home feed.
    - **Explore** button → community discovery.
    - **Create** button → create sub-community.
    - **Recent Communities**: **Up to 5 I recently visited or interacted with**, ordered by **most recent activity**. Each shows the community name and a small icon (if absent, show a default), linking to that community’s home.
- **Main Content Area**: Shows the page’s primary content.
- **Right Sidebar**: Shows page-specific secondary info.
    - **Home**: Always shows **Global Latest** (sitewide latest posts).
    - **Community Home/Post Detail**: Shows **Community Info + Rules** box (details below).

### **4.2 Sitemap**

```
[HOME] /                         — Unified feed (prioritizes joined communities)
 ├─ /submit                      — Global post composer (choose community, login required)
 ├─ /s                           — Global search (sub-communities / posts / comments)
 ├─ /c                           — Explore sub-communities
 │   ├─ /c/create                — Create a sub-community (login required)
 │   ├─ /c/[name]                — Specific sub-community home
 │   │   ├─ /c/[name]/submit     — Post directly to this community (login required)
 │   │   └─ /c/[name]/[postID]   — Post detail + comments
 └─ /login                       — Login (modal; overlays on any screen)
```

### **4.3 Screens (by Page)**

### **A) Home**

/

- **Left Sidebar (global)**
    - Home / Explore / Create buttons
    - Recent Communities (up to 5, by most recent activity)
- **Navbar (global)**
    - Logo (to Home) / global search / **Create (post)** button / Profile (dropdown, logout)
- **Main Content**
    - **Sort control** at top: **Dropdown ([Newest] | [Top])**
        - **Behavior**:
            - [Newest] applies the Newest rules from 3.5
            - [Top] applies the Top rules from 3.5
    - **List: 20 post cards from communities I’ve joined** → **[Load more]** adds 20 more
    - Card fields: community name, title, author, time (**relative**), comment count, score (upvotes − downvotes)
    - If an unauthenticated user attempts to post/comment/vote, show login prompt → after login, return to the original action
- **Right Sidebar — Global Latest**
    - **Header label**: “Global Latest”
    - **Content**: **10 most recently posted items across all communities**. No “load more.”
    - **Each item**: community name, single-line title (ellipsis if long), time (**relative**)

### **B) Sub-Community Home**

/c/[name]

- **Left Sidebar (global)**
    - Home / Explore / Create buttons
    - Recent Communities (up to 5, by most recent activity)
- **Navbar (global)**
    - Logo (to Home) / global search / **Create post** button / Profile (dropdown, logout)
- **Main Content**
    - Header: **Logo (if any) / Create Post button / Join button (Join ↔ Joined)**
    - Sort toggle: **[Newest] | [Top]** (same rules as 3.5)
    - (If logged in) post composer
    - **20 post cards** → **[Load more]** adds 20 more
- **Right Sidebar — Community Info + Rules**
    - **Info box (top)**
        - Fields: community name, short description, created date (optional), last active (optional), rules
        - **Rules**
            - **Section title label**: **“Community Rules”**
            - **Default visible count**: **Top 5 rules**, **numbered (1, 2, 3, …)**
            - **Each rule**: up to **2 lines (~50 chars)**

### **C) Post Detail**

/c/[name]/[postID]

- **Left Sidebar (global)**
    - Home / Explore / Create buttons
    - Recent Communities (up to 5, by most recent activity)
- **Navbar (global)**
    - Logo (to Home) / global search / **Create post** button / Profile (dropdown, logout)
- **Main Content**
    - Top: **Community mini-info** (community name + small logo), **Back**
    - Body: **Title, author, time**, followed by **post content**; below show up/down vote score and comment count
    - Comments: **Comment composer** → **20 comments** → **[Load more]** adds 20 more
    - Edit/Delete: Buttons visible **only on items authored by the current user**
- **Right Sidebar — Community Info + Rules**
    - **Info box (top)**
        - Fields: community name, short description, created date (optional), last active (optional), rules
        - **Rules**
            - **Section title label**: **“Community Rules”**
            - **Default visible count**: **Top 5 rules**, **numbered (1, 2, 3, …)**
            - **Each rule**: up to **2 lines (~50 chars)**

### **D) Global Post Composer**

/submit

- **Left Sidebar (global)**
    - Home / Explore / Create buttons
    - Recent Communities (up to 5)
- **Navbar (global)**
    - Logo (to Home) / global search / **Create post** button / Profile (dropdown, logout)
- **Main Content**
    - Fields in order: **[Community selector (dropdown)] [Title] [Body] [Author display name (optional)] [Submit]**
    - If submission attempted while logged out, prompt login, then return to complete submission

### **E) Create a Community**

/c/create

- **Left Sidebar (global)**
    - Home / Explore / Create buttons
    - Recent Communities (up to 5)
- **Navbar (global)**
    - Logo (to Home) / global search / **Create post** button / Profile (dropdown, logout)
- **Main Content**
    - **[Name] [Description] [Logo/Banner (optional)] [Rules (optional)] [Create]**
    - On success, navigate to that community’s home

### **F) Global Search**

/s

- **Left Sidebar (global)**
    - Home / Explore / Create buttons
    - Recent Communities (up to 5, by most recent activity)
- **Navbar (global)**
    - Logo (to Home) / **global search input (keeps focus)** / Create (post) button / Profile (dropdown, logout)
- **Main Content**
    - **Search header**: Large input + [Search] button
        - Placeholder: “Search communities, posts, and comments (2+ characters)”
    - **Three result tabs**
        1. **Posts** (default)
            - **Sort dropdown**: [Newest] | [Top]
                - Use the exact Newest/Top rules from 3.5
            - **List**: 20 cards → **[Load more]** adds 20 more
            - **Card fields**: community name, title, body excerpt (max 2 lines, ellipsis), author, time (**relative**), comment count, score (upvotes − downvotes)
        2. **Sub-Communities**
            - **Sort dropdown**: [Name Match] | [Recently Created]
                - Default is **Name Match** (similarity to query; ties break by more recent creation)
            - **List**: 20 community cards → **[Load more]**
            - **Card fields**: community name, description (max 2 lines), logo (if any), **[Join | Joined]** button
        3. **Comments**
            - **Sort dropdown**: [Newest]
            - **List**: 20 **comment snippets** → **[Load more]**
            - **Item fields**: comment content (max 2 lines), author, time (**relative**), parent post title (link), community name
    - **Empty states**
        - “Please enter at least 2 characters.”
        - “No matching results. Try different keywords.”

---

### **G) Explore Sub-Communities**

/c

- **Left Sidebar (global)**
    - Home / Explore / Create buttons
    - Recent Communities (up to 5, by most recent activity)
- **Navbar (global)**
    - Logo (to Home) / global search / Create (post) button / Profile (dropdown, logout)
- **Main Content**
    - **Category chips**
        - Clicking a chip filters the grid to that category
    - **Community grid**
        - **Show 20 cards** → **[Load more]** adds 20 more
        - **Card fields**:
            - Top: logo (if any) + community name, member count, Join button
            - Body: description (max 2 lines)

---

### **H) Community-Specific Post Composer**

/c/[name]/submit

- Same as the global composer, with the **community pre-selected**.

---

### **I) Login & Sign Up**

/login **(modal)**

- **Modal content**
    - **Login box**
        - **Inputs**: user identifier (flexible format: email or username), password (simple policy)
        - **Buttons**: [Sign in] / [Sign up]
    - **Error handling**
        - On failure, show a simple retry message (e.g., “Login failed. Please try again.”)
        - Even after multiple failures, the screen should not freeze; keep the flow smooth
    - **On success**
        - **Return to the previous page and resume the in-progress action** (e.g., posting, voting, joining)

---

## **5. Interaction Rules**

- **Guest guard**: When attempting to post/comment/vote/create/join, prompt login → after login, **resume the original action**.
- **Author guard**: Show **Edit/Delete** buttons **only** on items authored by the current user.
- **Join/Leave**: When toggled, update **home feed, Recent Communities list, and button state** **immediately**.
- **Session expiry**: If it expires mid-action, **gently prompt re-login** and, upon success, **resume the prior flow**.
- **Optimistic UI**: Reflect upvotes/downvotes, comment counts, and join status **immediately in the UI**, then **sync with server**.

---

## **6. Input Rules**

- **Community name**: Short, readable alphanumeric; hyphen/underscore allowed; **must be unique**.
- **Title**: 5–120 chars
- **Body**: 10-10,000 chars (plain text, line breaks allowed; scripts/code not allowed)
- **Author display name**: 0–32 chars (if empty, use default)
- **Comment**: 2-2,000 chars

---

## **7. Display Rules & Standard Copy**

- **Time format**: Use friendly **relative timestamps** like “just now,” “X minutes ago,” “X hours ago,” “X days ago.” Display in the **user’s local timezone**.
- **Number abbreviations**: 1,000 → 1.2k / 10,000 → 12.3k / 1,000,000 → 1.2m
- **Standard messages**
    - Login required: “Please sign in to continue.”
    - No permission: “You can edit or delete only items you authored.”
    - Community name taken: “This name is already in use.”
    - Invalid community name format: “This name isn’t available. Please choose something simpler.”
    - No community selected: “Please choose a community to post in.”
    - Query too short: “Please enter at least 2 characters.”
    - Self-vote: “You can’t vote on your own posts/comments.”
    - Temporary error: “A temporary error occurred. Please try again in a moment.”