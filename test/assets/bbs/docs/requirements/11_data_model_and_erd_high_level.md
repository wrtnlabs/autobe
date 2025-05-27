# 11. High-Level Data Model and ERD: Internal Bulletin Board System

## Overview
This document outlines the high-level data model and Entity Relationship Diagram (ERD) for the Internal Bulletin Board System (IBBS). It captures the core entities, their key attributes, and the relationships between them to guide development and ensure robust, scalable, and maintainable implementation.

---

## Core Entities and Key Attributes

### 1. User
- **user_id** (PK)
- name
- email (company-only, unique)
- password_hash
- role (enum: employee, admin)
- status (active/inactive/locked)
- password_changed (boolean)
- created_at
- updated_at

### 2. Board
- **board_id** (PK)
- name (e.g., Announcements, Free Board, Popular Board)
- description
- created_at
- updated_at

### 3. Post
- **post_id** (PK)
- board_id (FK → Board)
- author_id (FK → User)
- title
- content
- is_deleted (boolean)
- likes_count (integer)
- created_at
- updated_at

### 4. Comment
- **comment_id** (PK)
- post_id (FK → Post)
- parent_comment_id (FK → Comment, nullable, for 1-level nesting)
- author_id (FK → User)
- content
- is_deleted (boolean)
- likes_count (integer)
- created_at
- updated_at

### 5. Like
- **like_id** (PK)
- user_id (FK → User)
- target_type (enum: post, comment)
- target_id (FK → Post or Comment)
- created_at

---

## Entity Relationship Diagram (ERD)

```mermaid
erDiagram
    User ||--o{ Post : "writes"
    User ||--o{ Comment : "writes"
    User ||--o{ Like : "gives"
    Board ||--o{ Post : "contains"
    Post ||--o{ Comment : "receives"
    Post ||--o{ Like : "receives"
    Comment ||--o{ Like : "receives"
    Comment ||--|o Comment : "is parent of"

    User {
        string user_id PK
        string name
        string email
        string password_hash
        enum role
        string status
        boolean password_changed
        datetime created_at
        datetime updated_at
    }
    Board {
        string board_id PK
        string name
        string description
        datetime created_at
        datetime updated_at
    }
    Post {
        string post_id PK
        string board_id FK
        string author_id FK
        string title
        string content
        boolean is_deleted
        int likes_count
        datetime created_at
        datetime updated_at
    }
    Comment {
        string comment_id PK
        string post_id FK
        string parent_comment_id FK?
        string author_id FK
        string content
        boolean is_deleted
        int likes_count
        datetime created_at
        datetime updated_at
    }
    Like {
        string like_id PK
        string user_id FK
        enum target_type
        string target_id FK
        datetime created_at
    }
```

---

## Relationship Notes
- **User–Post/Comment**: One user may create multiple posts and comments.
- **Board–Post**: Each board contains many posts; a post belongs to one board.
- **Post–Comment**: A post can have multiple comments; comments are attached to a post.
- **Comment–Comment (Parent)**: Supports one-level nesting by allowing a comment to reference another as its parent.
- **Like**: Can target either a post or a comment (but not both simultaneously). Constraint to ensure a single user may only like a unique target once.

---

## Special Handling
- **Cascade Deletion**: When a post or comment is deleted (hard delete), all related likes and nested comments are also deleted.
- **Like Uniqueness**: There must be a uniqueness constraint for (user_id, target_type, target_id) to prevent duplicate likes.
- **Board Promotion Logic**: The system automatically promotes posts to Popular Board when likes_count ≥ 10 (logic handled at application/business layer, but ERD supports tracking likes_count efficiently).

---

## Future Expandability
- Add support for attachments/media by associating a new entity (e.g., Attachment) to posts/comments.
- Track edit history with an entity (e.g., PostRevision, CommentRevision) for auditing.

---

[← Back to Table of Contents](01_internal_bulletin_board_requirements_toc.md)

[Next: 12_risks_and_constraints.md →](12_risks_and_constraints.md)
