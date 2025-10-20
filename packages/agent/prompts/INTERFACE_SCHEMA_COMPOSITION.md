# Composition & Reference Decision Rules for DTO Schema Design

## Overview

This document provides comprehensive guidelines for deciding when to use **Composition** (embedding full objects/arrays) versus **Reference** (using IDs or Summary objects) in DTO schemas. Proper application of these rules prevents infinite recursion, performance issues, and ensures maintainable API designs.

## Critical Principles

### The Fundamental Problem

**DTOs MUST NOT be 1:1 mappings of database schemas.** Database schemas contain bidirectional relationships that, if naively translated to DTOs, cause:

1. **Infinite Recursion**: `Article → User → Articles → Users → ...`
2. **Performance Explosions**: Loading one article loads 1000 comments, each loading author with their 1000 articles
3. **Circular Dependencies**: Type definitions that reference each other infinitely

### The Solution

Apply **asymmetric relationship handling**:
- One direction gets **Composition** (full object/array)
- Reverse direction gets **Reference** (Summary object or separate API)

---

## Rule 1: Foreign Key Relationship Analysis (Strongest Signal)

**Foreign key relationships in combination with table naming patterns are the most reliable indicators of ownership.**

### 1.1. Composition Pattern: `{Parent}_{Child}` + Foreign Key Check

When child table name follows the `{parent}_*` or `{parent_singular}_*` pattern **AND** has a foreign key to the parent, check the relationship type:

**✅ Composition (1:N or 1:1 owned)**:
- Child has FK to parent: `parent_id` column
- Parent does NOT have FK to child
- Cascade delete applies
- Child cannot exist without parent

**❌ NOT Composition (Metadata/Lookup)**:
- Table name might follow `{parent}_*` pattern but serves as metadata
- May have reverse FK (parent has FK to this table)
- Independent lifecycle
- Examples: `user_roles` (role metadata), `article_statuses` (status lookup)

### 1.1.1. Metadata Table Examples (NOT Composition)

```prisma
// ❌ Looks like composition by name, but it's a LOOKUP table
model Article {
  id        String
  title     String
  status_id String   // FK pointing TO article_statuses
  status    ArticleStatus @relation(...)  // ❌ NOT composition - it's a reference
}

model ArticleStatus {  // Table: article_statuses
  id          String
  name        String  // "draft", "published", "archived"
  description String
  articles    Article[]  // Reverse relation (not included in DTO)
}

// Result: article_statuses is a LOOKUP table, NOT owned by articles
// DTO: IArticle { status: IArticleStatus { id, name } }  // Reference, not composition
```

```prisma
// ✅ True composition - owned children
model Article {
  id    String
  title String
  files ArticleFile[]  // Reverse relation
}

model ArticleFile {  // Table: article_files
  id         String
  article_id String  // FK pointing TO articles
  url        String
  article    Article @relation(...)
}

// Result: article_files is OWNED by articles
// DTO: IArticle { files: IArticleFile[] }  // Composition
```

**Key Difference:**
- **Lookup/Metadata**: Parent has FK → Child (articles.status_id → statuses.id)
- **Composition**: Child has FK → Parent (files.article_id → articles.id)

```typescript
// ✅ True Composition Examples

// Pattern: bbs_articles → bbs_article_*
interface IBbsArticle {
  files: IBbsArticleFile[];      // bbs_article_files
  images: IBbsArticleImage[];    // bbs_article_images
  // NOTE: snapshots are NOT in main entity - they're audit/history metadata
}

// Snapshots are separate - accessed via dedicated API
// GET /articles/:id/snapshots → IPageIBbsArticleSnapshot
interface IBbsArticleSnapshot {
  id: string;
  article_id: string;
  content: string;
  created_at: string;
  files: IBbsArticleSnapshotFile[];  // ✅ Correct naming
}

// Pattern: shopping_orders → shopping_order_*
interface IShoppingOrder {
  items: IShoppingOrderItem[];       // shopping_order_items
  payments: IShoppingOrderPayment[]; // shopping_order_payments
  shipments: IShoppingOrderShipment[]; // shopping_order_shipments
}

// Pattern: reddit_articles → reddit_article_*
interface IRedditArticle {
  files: IRedditArticleFile[];     // reddit_article_files
  // NOTE: snapshots are audit metadata, not in main entity
}
```

**Why this works**: Table naming `{parent}_{child}` indicates:
- Strong ownership (child cannot exist without parent)
- Cascade deletion (parent deletion removes children)
- Tight coupling (child is part of parent's lifecycle)

### 1.2. Reference Pattern: Different Domains

When referenced table is from a different domain or is an independent entity, use **Reference**.

```typescript
// ✅ Reference Examples

interface IRedditArticle {
  // Different domain: reddit_articles → reddit_members
  // ID field can be omitted if Summary object includes id
  author: IRedditMember.ISummary {
    id: string;  // ID is here, no need for separate reddit_member_id
    nickname: string;
    avatar_url: string;
  };

  // Different domain: reddit_articles → reddit_categories
  category: IRedditCategory {
    id: string;  // ID is here, no need for separate category_id
    name: string;
  };
}

interface IShoppingOrder {
  // Different domain: shopping_orders → shopping_customers
  customer: IShoppingCustomer.ISummary {
    id: string;  // ID is here
    name: string;
    email: string;
  };
}

interface IBbsArticle {
  // Different domain: bbs_articles → bbs_members
  author: IBbsMember.ISummary {
    id: string;  // ID is here
    nickname: string;
  };

  // Different domain: bbs_articles → bbs_categories
  category: IBbsCategory {
    id: string;  // ID is here
    name: string;
  };
}

// ⚠️ NOTE: You may keep both the ID field AND the object for backward compatibility
// or API design preferences, but it's redundant. Choose one pattern consistently:
//
// Option A (Recommended): Object only
//   author: IUser.ISummary { id, name, ... }
//
// Option B: Both (redundant but explicit)
//   author_id: string;
//   author: IUser.ISummary { id, name, ... }
//
// Option C: ID only (minimal, requires separate fetch for details)
//   author_id: string;
```

### 1.3. Decision Algorithm

```typescript
/**
 * Determines if childTable should be composed into parentTable's DTO
 * CRITICAL: Must analyze Prisma schema relationships, not just table names
 */
function shouldCompose(
  parentTable: string,
  childTable: string,
  prismaSchema: PrismaSchema
): boolean {
  // Step 1: Check if child has FK to parent
  const childModel = prismaSchema.models.find(m => m.tableName === childTable);
  const parentModel = prismaSchema.models.find(m => m.tableName === parentTable);

  if (!childModel || !parentModel) return false;

  // Find FK relationship from child to parent
  const fkToParent = childModel.fields.find(f =>
    f.relationToModel === parentModel.name && f.isForeignKey
  );

  // No FK from child to parent → Not composition
  if (!fkToParent) return false;

  // Step 2: Check table name pattern (secondary signal)
  const parentBase = getTableBaseName(parentTable);
  const childBase = getTableBaseName(childTable);

  const hasParentPrefix =
    childBase.startsWith(parentBase + '_') ||
    childBase.startsWith(toSingular(parentBase) + '_');

  // Step 3: Distinguish between owned children and metadata tables

  // Pattern 1: Clear ownership pattern (table name + FK)
  if (hasParentPrefix && fkToParent) {
    // Check if it's a metadata/lookup table by examining other relationships
    const parentHasFkToChild = parentModel.fields.some(f =>
      f.relationToModel === childModel.name && f.isForeignKey
    );

    // If parent has FK to child, it's likely a metadata/lookup table
    if (parentHasFkToChild) {
      return false; // ✅ Reference (e.g., articles.status_id → article_statuses)
    }

    return true; // ✅ Composition
  }

  // Pattern 2: Junction/Mapping tables (many-to-many)
  if (childBase.includes('_to_') ||
      childBase.includes('_x_') ||
      childBase.startsWith('mv_') ||
      childBase.startsWith('map_')) {
    // Verify it has FKs to both sides
    const relationCount = childModel.fields.filter(f => f.isForeignKey).length;
    return relationCount >= 2; // ✅ Composition (junction table)
  }

  // Pattern 3: Different domain → Reference
  if (!hasParentPrefix) {
    return false; // ✅ Reference (e.g., articles → members)
  }

  // Default: Reference (safer choice)
  return false;
}

// Examples with Prisma schema context
shouldCompose('reddit_articles', 'reddit_article_files', schema)
// → Check: reddit_article_files.article_id → reddit_articles.id ✅
// → Check: Table name pattern ✅
// → Result: true (Composition)

shouldCompose('reddit_articles', 'reddit_article_statuses', schema)
// → Check: reddit_articles.status_id → reddit_article_statuses.id ❌
// → Direction is reversed (parent → child, not child → parent)
// → Result: false (Reference - it's a lookup table)

shouldCompose('reddit_articles', 'reddit_members', schema)
// → Check: reddit_articles.member_id → reddit_members.id
// → Check: Table name pattern ❌ (different domain)
// → Result: false (Reference)

shouldCompose('bbs_articles', 'bbs_article_comments', schema)
// → Check: bbs_article_comments.article_id → bbs_articles.id ✅
// → Check: Table name pattern ✅
// → Result: true (Composition)
```

---

## Rule 2: Relationship Semantics

**The meaning of the relationship determines the representation strategy.**

### 2.1. Composition Relationships

Use **Composition** (full array in DTO) when the relationship represents:

#### A. Ownership (Strong Aggregation)
Child entities **belong to** and **cannot exist without** the parent.

```typescript
interface IShoppingOrder {
  // Order OWNS its items - items cannot exist without an order
  items: IShoppingOrderItem[] {
    id: string;
    product_id: string;
    product: IShoppingProduct.ISummary;
    quantity: number;
    price: number;
  }[];
}

interface IBbsArticle {
  // Article OWNS its attachments
  files: IBbsArticleFile[] {
    id: string;
    url: string;
    name: string;
    size: number;
    mime_type: string;
  }[];
}
```

#### B. History/Audit Trail
Tracking changes or historical states of the parent entity.

**IMPORTANT**: History/audit data is often HEAVY and should be accessed via separate APIs, not included in main entity.

```typescript
// ❌ BAD: Including full history in main entity
interface IBbsArticle {
  snapshots: IBbsArticleSnapshot[];  // Could be 100+ snapshots!
}

// ✅ GOOD: Separate API for history
interface IBbsArticle {
  id: string;
  title: string;
  content: string;
  // No snapshots array
}

// Access via: GET /articles/:id/snapshots
// Returns: IPageIBbsArticleSnapshot

// ✅ EXCEPTION: Small, essential status history
interface IShoppingOrder {
  // ONLY if status changes are few (< 10) and essential
  status_history: IShoppingOrderStatusHistory[] {
    id: string;
    status: string;
    changed_at: string;
  }[];  // Limited to recent changes
}
```

#### C. Components (Essential Parts)
Child entities are **integral components** that define the parent's structure.

```typescript
interface ISurvey {
  // Survey is composed of questions
  questions: ISurveyQuestion[] {
    id: string;
    text: string;
    type: 'multiple_choice' | 'text' | 'rating';
    order: number;
    options?: ISurveyQuestionOption[];
  }[];
}

interface IInvoice {
  // Invoice is composed of line items
  line_items: IInvoiceLineItem[] {
    id: string;
    description: string;
    quantity: number;
    unit_price: number;
    total: number;
  }[];
}
```

### 2.2. Reference Relationships

Use **Reference** (Summary object or ID) when the relationship represents:

#### A. Actor (Agent/Subject)
Entities representing **who performed an action** (creator, author, modifier).

```typescript
// ✅ CORRECT: Article references author (Summary object includes id)
interface IRedditArticle {
  author: IRedditMember.ISummary {
    id: string;  // ID is in the object, no separate reddit_member_id needed
    nickname: string;
    avatar_url: string;
    level: number;
  };
}

// ❌ FORBIDDEN: Member contains articles
interface IRedditMember {
  id: string;
  nickname: string;
  // ❌ NEVER DO THIS - creates explosion
  articles: IRedditArticle[];
  comments: IRedditComment[];
  likes: IRedditLike[];
}

// ✅ CORRECT: Use separate API for reverse direction
// GET /members/:id/articles → IPageIRedditArticle.ISummary
```

**Critical Rule**: **NEVER include reverse collections in Actor entities.**

When you see fields like:
- `author_id`, `creator_id`, `writer_id`
- `user_id`, `member_id`, `customer_id`
- `seller_id`, `vendor_id`, `supplier_id`
- `modifier_id`, `updated_by_id`, `created_by_id`

These indicate **Actor relationships** → Use Reference (Summary), never Composition.

#### B. Category/Classification
Entities used for **grouping or classification**.

```typescript
interface IBbsArticle {
  category: IBbsCategory {
    id: string;  // ID is here, no need for separate category_id
    name: string;
    parent_id?: string;
    // ❌ Do NOT include: articles: IBbsArticle[]
  };

  tags: IBbsTag[] {
    id: string;
    name: string;
    // ❌ Do NOT include: articles: IBbsArticle[]
  }[];
}

// ✅ Reverse direction uses separate API
// GET /categories/:id/articles → IPageIBbsArticle.ISummary
```

#### C. Lookup/Master Data
References to **independent entities** that exist separately.

```typescript
interface IShoppingOrderItem {
  product_id: string;
  product: IShoppingProduct.ISummary {
    id: string;
    name: string;
    thumbnail_url: string;
    price: number;
  };
  // Product exists independently, not owned by order item
}

interface IEmployeeAssignment {
  project_id: string;
  project: IProject.ISummary {
    id: string;
    name: string;
    status: string;
  };
  // Project is independent, not owned by assignment
}
```

---

## Rule 3: Reverse Direction Prohibition

**The most critical rule to prevent infinite recursion and performance disasters.**

### 3.1. The Principle

When A references B, **B must NEVER reference back to A** in the same DTO type.

```typescript
// ✅ CORRECT: One-way reference
interface IArticle {
  author: IUser.ISummary;  // Article → User
}

interface IUser {
  id: string;
  name: string;
  // ✅ No articles here
}

// ❌ WRONG: Bidirectional reference
interface IArticle {
  author: IUser;  // Article → User → Articles → Users → ...
}

interface IUser {
  articles: IArticle[];  // ❌ INFINITE RECURSION
}
```

### 3.2. Reverse Queries Use Separate APIs

```typescript
// Primary direction: Article → Author
interface IRedditArticle {
  reddit_member_id: string;
  author: IRedditMember.ISummary;
}

interface IRedditMember {
  id: string;
  nickname: string;
  email: string;
  avatar_url: string;
  // ❌ NO articles array here!
}

// ✅ Reverse direction: Separate API endpoint
// GET /members/:memberId/articles
// Response: IPageIRedditArticle.ISummary
{
  pagination: { ... },
  data: [
    { id: "article-1", title: "...", ... },
    { id: "article-2", title: "...", ... }
  ]
}
```

### 3.3. Statistics and Aggregates

If you need aggregate information on the "reference" side, use a **separate DTO variant**:

```typescript
// Main DTO: Clean, no aggregates
interface IRedditMember {
  id: string;
  nickname: string;
  email: string;
  avatar_url: string;
}

// Statistics DTO: Separate variant
interface IRedditMember.IWithStats {
  id: string;
  nickname: string;
  avatar_url: string;

  // Aggregates
  article_count: number;
  comment_count: number;
  total_likes_received: number;
  reputation_score: number;
}

// Use cases:
// GET /members/:id → IRedditMember
// GET /members/:id?include=stats → IRedditMember.IWithStats
// GET /members (leaderboard) → IRedditMember.IWithStats[]
```

### 3.4. Why This Matters: The Explosion Example

```typescript
// ❌ BAD DESIGN: Bidirectional composition
interface IRedditArticle {
  author: IRedditMember;  // Not Summary!
  comments: IRedditComment[];
}

interface IRedditMember {
  articles: IRedditArticle[];  // Disaster!
  comments: IRedditComment[];
}

interface IRedditComment {
  article: IRedditArticle;
  author: IRedditMember;
  replies: IRedditComment[];
}

// What happens when you GET /articles/1:
{
  id: "article-1",
  title: "Hello",
  author: {
    id: "member-1",
    articles: [  // 1000 articles
      {
        id: "article-2",
        author: {
          articles: [  // Another 1000 articles
            {
              author: {
                articles: [  // INFINITE LOOP
                  ...
                ]
              }
            }
          ]
        },
        comments: [  // 500 comments per article
          {
            article: {
              comments: [  // CIRCULAR REFERENCE
                ...
              ]
            },
            author: {
              articles: [  // More articles
                ...
              ]
            }
          }
        ]
      }
    ]
  },
  comments: [
    // ... same explosion
  ]
}

// Result:
// - Infinite recursion
// - Millions of records loaded
// - Server crashes
// - API timeout
```

### 3.4. Child → Parent Back-Reference Problem

**CRITICAL**: When parent composes children, children must NOT reference back to parent (except by ID).

```typescript
// Prisma Schema
model BbsArticle {
  id       String
  title    String
  comments BbsArticleComment[]  // Parent has children
}

model BbsArticleComment {
  id         String
  content    String
  article_id String  // FK to parent
  article    BbsArticle @relation(...)
}

// ❌ WRONG: Child references full parent
interface IBbsArticle {
  id: string;
  title: string;
  content: string;
  comments: IBbsArticleComment[];  // Composition
}

interface IBbsArticleComment {
  id: string;
  content: string;
  article: IBbsArticle;  // ❌ DISASTER! Full parent reference
}

// What happens when you GET /articles/1:
{
  id: "article-1",
  title: "Hello",
  comments: [
    {
      id: "comment-1",
      content: "Nice post",
      article: {  // ❌ CIRCULAR REFERENCE
        id: "article-1",
        title: "Hello",
        comments: [  // ❌ INFINITE LOOP
          {
            id: "comment-1",
            article: {
              comments: [
                // ... INFINITE RECURSION
              ]
            }
          }
        ]
      }
    }
  ]
}

// ✅ CORRECT: Child uses ID only or Summary without children
interface IBbsArticle {
  id: string;
  title: string;
  content: string;
  comments: IBbsArticleComment[];  // Composition
}

interface IBbsArticleComment {
  id: string;
  content: string;
  article_id: string;  // ✅ ID only (best)

  // OR if you need some parent info:
  article: IBbsArticle.ISummary {  // ✅ Summary WITHOUT comments
    id: string;
    title: string;
    // NO comments array here!
  };
}

interface IBbsArticle.ISummary {
  id: string;
  title: string;
  // ✅ NO comments array - this is for child's back-reference
}
```

**Why this matters:**

1. **Parent → Children Composition**: Article includes `comments[]` array
2. **Child → Parent Reference**: Each comment needs to know which article it belongs to
3. **Problem**: If child includes full parent, parent includes children, which includes parent again → ♾️

**Solution Patterns:**

```typescript
// Pattern 1: Child with ID only (BEST - most common)
interface IBbsArticleComment {
  id: string;
  content: string;
  article_id: string;  // ✅ Just the ID
  // No article object at all
}

// Pattern 2: Child with minimal Summary (when UI needs parent info)
interface IBbsArticleComment {
  id: string;
  content: string;
  article: IBbsArticle.ISummary {  // ✅ Summary variant
    id: string;
    title: string;
    // CRITICAL: No comments, files, images, or any arrays!
  };
}

// Pattern 3: Use IInvert for reverse perspective (RECOMMENDED)
interface IBbsArticleComment {
  // Default: For article detail page - No article info (redundant)
  id: string;
  content: string;
  article_id: string;
  author: IBbsMember.ISummary;
  created_at: string;
}

interface IBbsArticleComment.IInvert {
  // Inverted perspective: For comment-centric views
  // When viewing from comment's perspective, need parent context
  id: string;
  content: string;
  author: IBbsMember.ISummary;
  created_at: string;

  article: IBbsArticle.ISummary {  // ✅ Parent context
    id: string;
    title: string;
    // CRITICAL: No comments array!
  };
}
```

**Real-world scenarios with IInvert:**

```typescript
// Scenario 1: Article detail page
// GET /articles/:id → IBbsArticle
{
  id: "article-1",
  title: "My Post",
  comments: [  // IBbsArticleComment[]
    {
      id: "comment-1",
      content: "Nice",
      article_id: "article-1",  // ✅ ID only (already know the article)
      author: { id: "user-1", nickname: "John" }
    }
  ]
}

// Scenario 2: User's recent comments page (INVERTED perspective)
// GET /users/:id/comments → IPageIBbsArticleComment.IInvert
{
  data: [  // IBbsArticleComment.IInvert[]
    {
      id: "comment-1",
      content: "Nice",
      author: { id: "user-1", nickname: "John" },
      article: {  // ✅ IInvert includes parent context
        id: "article-1",
        title: "My Post"  // No comments array!
      }
    },
    {
      id: "comment-2",
      content: "Great!",
      author: { id: "user-1", nickname: "John" },
      article: {
        id: "article-2",
        title: "Another Post"
      }
    }
  ]
}

// Scenario 3: Recent comments feed (site-wide)
// GET /comments/recent → IPageIBbsArticleComment.IInvert
{
  data: [  // IBbsArticleComment.IInvert[]
    {
      id: "comment-5",
      content: "Interesting",
      author: { id: "user-3", nickname: "Alice" },
      article: {
        id: "article-1",
        title: "My Post"
      }
    }
  ]
}
```

**Key Principles:**
- **Parent → Child**: Can use full composition (array)
- **Child → Parent (default)**: Use ID only
- **Child → Parent (inverted view)**: Use `IEntity.IInvert` with parent Summary (no grandchildren)
- **Never**: Both directions with full objects

**When to use IInvert:**
- ✅ User's comments list (need article context for each comment)
- ✅ Site-wide recent comments feed (need article title)
- ✅ Search results showing comments (need parent entity info)
- ✅ Any view where child entity is the primary focus, but parent context is needed
- ❌ Article detail page (redundant - already have parent context)

**Naming Convention:**
- `IEntity.IInvert`: Alternative representation from child's perspective
- Main entity: `IBbsArticleComment` (default, no parent object)
- Inverted: `IBbsArticleComment.IInvert` (includes parent context)

### 3.5. Recursive Tree Structures with IInvert

**CRITICAL**: For self-referencing tree structures (categories, folders, org charts), use IInvert to avoid infinite recursion.

```typescript
// Prisma Schema
model ShoppingCategory {
  id        String
  name      String
  parent_id String?  // Self-reference
  parent    ShoppingCategory?  @relation("CategoryTree", fields: [parent_id])
  children  ShoppingCategory[] @relation("CategoryTree")
}

// ❌ WRONG: Both directions in one type
interface IShoppingCategory {
  id: string;
  name: string;
  parent: IShoppingCategory;   // ❌ Infinite up
  children: IShoppingCategory[]; // ❌ Infinite down
}

// ✅ CORRECT: Separate by navigation direction
// Top-down navigation (explore children)
interface IShoppingCategory {
  id: string;
  name: string;
  parent_id: string | null;  // ✅ ID only, no object

  // Children for tree exploration (limited depth)
  children: IShoppingCategory[] {
    id: string;
    name: string;
    parent_id: string;
    // NO children here (depth limit = 1)
    // For deeper navigation, use separate API
  }[];
}

// Bottom-up navigation (breadcrumb trail)
interface IShoppingCategory.IInvert {
  id: string;
  name: string;

  // Parent chain for breadcrumb
  parent: IShoppingCategory.IInvert | null {
    id: string;
    name: string;
    parent: IShoppingCategory.IInvert | null;  // ✅ Recursive up
    // NO children array - only upward navigation
  };

  // NO children array here
}
```

**Real-world scenarios:**

```typescript
// Scenario 1: Category tree exploration (top-down)
// GET /categories/:id → IShoppingCategory
{
  id: "electronics",
  name: "Electronics",
  parent_id: null,
  children: [  // ✅ Depth 1
    {
      id: "computers",
      name: "Computers",
      parent_id: "electronics"
      // No children (depth limit)
    },
    {
      id: "smartphones",
      name: "Smartphones",
      parent_id: "electronics"
    }
  ]
}

// Scenario 2: Breadcrumb navigation (bottom-up)
// GET /categories/:id/breadcrumb → IShoppingCategory.IInvert
{
  id: "macbook-pro",
  name: "MacBook Pro",
  parent: {  // ✅ Recursive up
    id: "laptops",
    name: "Laptops",
    parent: {
      id: "computers",
      name: "Computers",
      parent: {
        id: "electronics",
        name: "Electronics",
        parent: null  // Root
      }
    }
  }
}

// Scenario 3: Product with category breadcrumb
// GET /products/:id → IShoppingProduct
{
  id: "product-123",
  name: "MacBook Pro 16\"",
  price: 2499,

  category: IShoppingCategory.IInvert {  // ✅ IInvert for breadcrumb
    id: "macbook-pro",
    name: "MacBook Pro",
    parent: {
      id: "laptops",
      name: "Laptops",
      parent: {
        id: "computers",
        name: "Computers",
        parent: {
          id: "electronics",
          name: "Electronics",
          parent: null
        }
      }
    }
  }
}
```

**Key Principles for Recursive Structures:**

1. **Default (Top-down)**:
   - Include `children` array
   - `parent_id` only (no parent object)
   - Limit depth (1-2 levels max)
   - Deeper navigation via separate API

2. **IInvert (Bottom-up)**:
   - Include `parent` chain (recursive)
   - NO `children` array
   - Full path to root (unlimited depth OK - typically 5-10 levels)
   - Used for breadcrumbs, path display

3. **NEVER**:
   - Both `parent` object AND `children` array in same type
   - Unlimited depth in both directions

**Other recursive structure examples:**
- Organization charts: `IEmployee { subordinates[] }` vs `IEmployee.IInvert { manager, manager.manager... }`
- File system: `IFolder { subfolders[] }` vs `IFolder.IInvert { parent_folder }`
- Comment threads: `IComment { replies[] }` vs `IComment.IInvert { parent_comment }`
- Menu navigation: `IMenuItem { submenu[] }` vs `IMenuItem.IInvert { parent_menu }`

---

## Rule 4: Cascade Delete Test + FK Direction

**Combine two questions:**
1. **FK Direction**: "Who has the foreign key?"
2. **Cascade Delete**: "If the parent is deleted, should the children be deleted?"

### 4.1. Cascade = Composition (Child → Parent FK)

```typescript
// When parent is deleted, children should also be deleted
// CRITICAL: Children have FK pointing TO parent

// Prisma Schema
model BbsArticle {
  id        String
  files     BbsArticleFile[]     // Reverse relation
  snapshots BbsArticleSnapshot[] // Reverse relation
}

model BbsArticleFile {
  id         String
  article_id String  // ✅ FK: Child → Parent
  article    BbsArticle @relation(...)
}

// SQL: ON DELETE CASCADE
DELETE FROM bbs_articles WHERE id = 'article-1';
// Automatically deletes:
// ✅ bbs_article_files (children with article_id = 'article-1')
// ✅ bbs_article_images
// ✅ bbs_article_snapshots (cascade deleted, but NOT in main DTO)

// DTO: Composition (only lightweight children)
interface IBbsArticle {
  files: IBbsArticleFile[];   // Small, essential
  images: IBbsArticleImage[]; // Small, essential
  // snapshots: NOT here (heavy audit data)
}
```

### 4.2. No Cascade = Reference (Parent → Child FK)

```typescript
// When parent is deleted, referenced entities should remain
// CRITICAL: Parent has FK pointing TO referenced entity

// Prisma Schema
model RedditArticle {
  id        String
  member_id String  // ✅ FK: Parent → Referenced entity
  member    RedditMember @relation(...)

  category_id String  // ✅ FK: Parent → Referenced entity
  category    RedditCategory @relation(...)
}

model RedditMember {
  id       String
  articles RedditArticle[]  // Reverse relation (NOT in DTO)
}

// SQL: ON DELETE RESTRICT or SET NULL
DELETE FROM reddit_articles WHERE id = 'article-1';
// Does NOT delete:
// ✅ reddit_members (member is independent)
// ✅ reddit_categories (category is independent)

// But you CANNOT delete:
DELETE FROM reddit_members WHERE id = 'member-1';
// ERROR: Cannot delete - reddit_articles still reference this member
// (unless ON DELETE CASCADE, which would be wrong for this relationship)

// DTO: Reference
interface IRedditArticle {
  author: IRedditMember.ISummary;     // Reference (no FK in child)
  category: IRedditCategory;           // Reference (no FK in child)
}
```

### 4.3. FK Direction Summary

| FK Location | Example | Cascade Behavior | DTO Strategy |
|-------------|---------|------------------|--------------|
| **Child → Parent** | `article_files.article_id → articles.id` | CASCADE | ✅ Composition (array in parent) |
| **Parent → Child** | `articles.member_id → members.id` | RESTRICT/SET NULL | ✅ Reference (object in parent) |
| **Both directions** | Rare, usually metadata | Depends | ❌ Likely metadata table |

### 4.4. Database Constraints as Validation

```sql
-- ✅ Composition: Child has FK, CASCADE delete
CREATE TABLE bbs_article_files (
  id UUID PRIMARY KEY,
  article_id UUID NOT NULL,  -- FK to parent
  url TEXT NOT NULL,
  FOREIGN KEY (article_id)
    REFERENCES bbs_articles(id)
    ON DELETE CASCADE  -- Children deleted with parent
);

-- ✅ Reference: Parent has FK, RESTRICT delete
CREATE TABLE reddit_articles (
  id UUID PRIMARY KEY,
  title TEXT NOT NULL,
  member_id UUID NOT NULL,  -- FK to referenced entity
  FOREIGN KEY (member_id)
    REFERENCES reddit_members(id)
    ON DELETE RESTRICT  -- Cannot delete member if articles exist
);

-- ❌ Metadata/Lookup: Parent has FK, but it's a lookup table
CREATE TABLE article_statuses (
  id UUID PRIMARY KEY,
  name TEXT NOT NULL  -- "draft", "published", "archived"
);

CREATE TABLE articles (
  id UUID PRIMARY KEY,
  status_id UUID NOT NULL,  -- FK to lookup table
  FOREIGN KEY (status_id)
    REFERENCES article_statuses(id)
    ON DELETE RESTRICT  -- Statuses are reusable, not owned
);

-- DTO: articles.status is Reference, NOT Composition
-- Even though table name could be "article_statuses"
```

---

## Rule 5: Array Size Consideration

**The expected volume of child records affects the representation strategy.**

### 5.1. Small Collections (< 100 items): Full Composition

Safe to include full arrays in the DTO.

```typescript
interface IUser {
  // User typically has 1-5 sessions
  sessions: IUserSession[] {
    id: string;
    device: string;
    ip_address: string;
    last_active: string;
  }[];

  // User typically has 1-3 addresses
  addresses: IUserAddress[] {
    id: string;
    street: string;
    city: string;
    postal_code: string;
    is_default: boolean;
  }[];
}
```

### 5.2. Medium Collections (100-1000 items): Count + Optional Composition

Include count in main DTO, provide separate endpoint for full list.

```typescript
// Main DTO: Count only
interface IBbsArticle {
  comment_count: number;  // Could be 500 comments
}

// Detail DTO: Optional composition with pagination
interface IBbsArticle.IWithComments {
  id: string;
  title: string;
  content: string;

  // Top N comments only
  recent_comments: IBbsComment.ISummary[] {  // Top 10
    id: string;
    content: string;
    author: IUser.ISummary;
    created_at: string;
  }[];

  comment_count: number;  // Total count
}

// Full list: Separate API
// GET /articles/:id/comments?page=1&limit=20
// Response: IPageIBbsComment
```

### 5.3. Large Collections (> 1000 items): Separate API Only

Never include in main DTO, always use separate paginated endpoint.

```typescript
// Main DTO: No composition, count only
interface IRedditMember {
  id: string;
  nickname: string;

  // Statistics only
  article_count: number;  // Could be 50,000
  comment_count: number;  // Could be 200,000

  // ❌ NEVER include arrays here
}

// Separate APIs for collections:
// GET /members/:id/articles?page=1&limit=20 → IPageIRedditArticle.ISummary
// GET /members/:id/comments?page=1&limit=20 → IPageIRedditComment.ISummary
```

### 5.4. Decision Matrix

| Expected Size | Main DTO | Detail DTO | Separate API |
|--------------|----------|------------|--------------|
| 1-10 items | Full array ✅ | Full array ✅ | Optional |
| 10-100 items | Full array ✅ | Full array ✅ | Recommended |
| 100-1000 items | Count only | Top N (10-20) | Required ✅ |
| 1000+ items | Count only | Count only | Required ✅ |

---

## Rule 6: DTO Type Specific Rules

**Different DTO types have different composition strategies.**

### 6.1. Main Entity (IEntity) - Full Detail

Used for: `GET /entities/:id` (single item detail view)

```typescript
interface IRedditArticle {
  // Core fields
  id: string;
  title: string;
  content: string;

  // ✅ Composition: Small owned collections
  images: IRedditArticleImage[];       // < 20 images
  files: IRedditArticleFile[];         // < 10 files
  // snapshots: Separate API (audit/history data)

  // ✅ Reference: Actor (Summary)
  author: IRedditMember.ISummary;

  // ✅ Reference: Category (Full or Summary)
  category: IRedditCategory;

  // ✅ Large collections: Count only
  comment_count: number;
  like_count: number;
  view_count: number;
}
```

**Depth limit: Maximum 2 levels**

```typescript
// ✅ ALLOWED: Depth 2
interface IArticle {
  author: IUser.ISummary {           // Level 1
    profile: IUserProfile {           // Level 2
      avatar_url: string;
    }
  }
}

// ❌ FORBIDDEN: Depth 3+
interface IArticle {
  author: IUser {
    profile: IUserProfile {
      badges: IBadge[] {              // Level 3 - TOO DEEP
        achievements: IAchievement[]  // Level 4 - WAY TOO DEEP
      }
    }
  }
}
```

### 6.2. Summary (IEntity.ISummary) - Minimal Info

Used for: `GET /entities` (list view), search results, related items

```typescript
interface IRedditArticle.ISummary {
  // Essential identification
  id: string;
  title: string;

  // ❌ NO Composition - arrays excluded for performance
  // files: IRedditArticleFile[];  ❌
  // images: IRedditArticleImage[];  ❌

  // ✅ Reference: Denormalized essential display fields only
  // No nested objects, all flattened for performance
  author_nickname: string;  // Denormalized from author
  author_avatar_url: string;

  category_name: string;  // Denormalized from category

  // ✅ Counts and stats
  comment_count: number;
  like_count: number;
  view_count: number;

  // ✅ Essential metadata
  created_at: string;
  updated_at: string;
}
```

**Key principle**: Summary DTOs prioritize **performance over completeness**.
- ❌ NO nested objects (not even Summary objects)
- ✅ Denormalize essential reference fields for display
- ✅ All fields are flat primitives (string, number, boolean)

### 6.3. Create (IEntity.ICreate) - Input DTO

Used for: `POST /entities` (creation)

```typescript
interface IRedditArticle.ICreate {
  // Required business fields
  title: string;
  content: string;

  // ✅ Composition: Can create children simultaneously
  images?: IRedditArticleImage.ICreate[] {
    url: string;
    order: number;
  }[];

  files?: IRedditArticleFile.ICreate[] {
    url: string;
    name: string;
    size: number;
  }[];

  // ✅ Reference: FK only (ID)
  category_id: string;

  // ❌ FORBIDDEN: Actor IDs (from auth context)
  // reddit_member_id: string;  ❌ From JWT token

  // ❌ FORBIDDEN: System fields
  // id: string;  ❌ Auto-generated
  // created_at: string;  ❌ System-managed
}
```

### 6.4. Update (IEntity.IUpdate) - Partial Update DTO

Used for: `PUT/PATCH /entities/:id`

```typescript
interface IRedditArticle.IUpdate {
  // Optional business fields
  title?: string;
  content?: string;
  category_id?: string;

  // ❌ NO Composition - use separate APIs
  // images?: IRedditArticleImage[];  ❌ Use PUT /articles/:id/images
  // files?: IRedditArticleFile[];    ❌ Use PUT /articles/:id/files

  // ❌ FORBIDDEN: Ownership change
  // reddit_member_id?: string;  ❌ Owner cannot be changed

  // ❌ FORBIDDEN: System fields
  // created_at?: string;  ❌
  // updated_at?: string;  ❌
}
```

### 6.5. Detail with Relations (IEntity.IWithX) - Optional Composition

Used for: `GET /entities/:id?include=comments` (opt-in detail expansion)

```typescript
// Base entity
interface IRedditArticle {
  id: string;
  title: string;
  comment_count: number;
}

// Optional detail variants
interface IRedditArticle.IWithComments {
  // ...IRedditArticle fields

  // Top N comments
  recent_comments: IRedditComment.ISummary[];  // Top 10
}

interface IRedditArticle.IWithFullDetails {
  // ...IRedditArticle fields

  images: IRedditArticleImage[];
  files: IRedditArticleFile[];
  recent_comments: IRedditComment.ISummary[];  // Top 10
  related_articles: IRedditArticle.ISummary[];  // Top 5
}
```

---

## Rule 7: Common Anti-Patterns to Avoid

### 7.1. ❌ Actor Entity with Collections

```typescript
// ❌ WRONG: User containing all their actions
interface IUser {
  id: string;
  name: string;

  // ❌ Performance bomb - could be 10,000 articles
  articles: IArticle[];

  // ❌ Performance bomb - could be 50,000 comments
  comments: IComment[];

  // ❌ Performance bomb - could be 100,000 likes
  likes: ILike[];
}

// ✅ CORRECT: User with stats only
interface IUser {
  id: string;
  name: string;
  // Clean and simple
}

interface IUser.IWithStats {
  id: string;
  name: string;

  // Counts only
  article_count: number;
  comment_count: number;
  like_count: number;
}

// ✅ CORRECT: Separate APIs
// GET /users/:id/articles
// GET /users/:id/comments
// GET /users/:id/likes
```

### 7.2. ❌ Category Entity with Items

```typescript
// ❌ WRONG: Category containing all articles
interface ICategory {
  id: string;
  name: string;

  // ❌ Could be 50,000 articles in this category
  articles: IArticle[];
}

// ✅ CORRECT: Category without items
interface ICategory {
  id: string;
  name: string;
  parent_id?: string;
  description?: string;
}

// ✅ CORRECT: Separate API
// GET /categories/:id/articles?page=1&limit=20
```

### 7.3. ❌ Bidirectional Full Composition

```typescript
// ❌ WRONG: Both directions have full objects
interface IOrder {
  customer: ICustomer;  // Full object
}

interface ICustomer {
  orders: IOrder[];  // Full objects - CIRCULAR!
}

// ✅ CORRECT: Asymmetric reference
interface IOrder {
  customer: ICustomer.ISummary;  // Summary
}

interface ICustomer {
  id: string;
  name: string;
  // No orders array
}

// ✅ CORRECT: Reverse via API
// GET /customers/:id/orders
```

### 7.4. ❌ Deep Nesting (> 2 levels)

```typescript
// ❌ WRONG: Too many levels
interface IArticle {
  author: IUser {
    profile: IUserProfile {
      avatar: IFile {
        storage: IStorage {
          provider: IStorageProvider {
            config: IProviderConfig {  // 6 levels deep!
              ...
            }
          }
        }
      }
    }
  }
}

// ✅ CORRECT: Maximum 2 levels
interface IArticle {
  author: IUser.ISummary {  // Level 1
    id: string;
    name: string;
    avatar_url: string;  // Flattened, not nested
  }
}
```

### 7.5. ❌ Including Massive Text Fields in Summary

```typescript
// ❌ WRONG: Full content in list view
interface IArticle.ISummary {
  id: string;
  title: string;
  content: string;  // ❌ Could be 50KB of text
}

// ✅ CORRECT: Truncated or excluded
interface IArticle.ISummary {
  id: string;
  title: string;
  content_preview: string;  // First 200 chars
  // or exclude content entirely
}
```

---

## Decision Tree Flowchart

```
START: Analyzing relationship from Parent to Child

┌─────────────────────────────────────────┐
│ 1. Check table names                    │
│    Child is "{Parent}_*" pattern?       │
└─────────────┬───────────────────────────┘
              │
         YES  │  NO
              ├────────────────┐
              │                │
         Composition       ┌───▼────────────────────────────┐
              │            │ 2. Check relationship type     │
              │            │    Is this an Actor field?     │
              │            │    (*_id, author_id, user_id)  │
              │            └───┬────────────────────────────┘
              │                │
              │           YES  │  NO
              │                ├──────────┐
              │                │          │
              │        Reference      ┌───▼─────────────────────┐
              │        (Summary)      │ 3. Check semantics      │
              │                       │    Category/Tag/Lookup? │
              │                       └───┬─────────────────────┘
              │                           │
              │                      YES  │  NO
              │                           ├─────────┐
              │                           │         │
              │                   Reference     ┌───▼──────────────────┐
              │                   (ID+name)     │ 4. Cascade delete?   │
              │                                 │    Parent→Child?     │
              │                                 └───┬──────────────────┘
              │                                     │
              │                                YES  │  NO
              │                                     ├────────┐
              │                                     │        │
              ├─────────────────────────────────────┘   Reference
              │
         ┌────▼─────────────────────┐
         │ 5. Check array size      │
         │    Expected # of items?  │
         └────┬─────────────────────┘
              │
      ┌───────┼────────┬────────────┐
      │       │        │            │
    < 100   100-1K   1K-10K      > 10K
      │       │        │            │
   Full    Count +   Count       Count
   Array   Top N     Only        Only
```

---

## Practical Examples

### Example 1: Reddit System

```typescript
// ✅ Correct Design

interface IRedditArticle {
  id: string;
  title: string;
  content: string;

  // Composition: Table name pattern match (reddit_article_*)
  files: IRedditArticleFile[];      // reddit_article_files
  images: IRedditArticleImage[];    // reddit_article_images
  // snapshots: Separate API (audit/history data)

  // Reference: Actor (Summary object includes id)
  author: IRedditMember.ISummary {
    id: string;  // No need for separate reddit_member_id
    nickname: string;
    avatar_url: string;
    level: number;
  };

  // Reference: Category
  category: IRedditCategory {
    id: string;  // No need for separate category_id
    name: string;
    parent_id?: string;
  };

  // Large collections: Count only
  comment_count: number;
  like_count: number;
  view_count: number;
}

interface IRedditMember {
  id: string;
  nickname: string;
  email: string;
  avatar_url: string;
  level: number;
  created_at: string;

  // ✅ Clean - no reverse collections
}

interface IRedditCategory {
  id: string;
  name: string;
  description?: string;
  parent_id?: string;

  // ✅ Clean - no reverse collections
}

// Reverse queries: Separate APIs
// GET /members/:id/articles → IPageIRedditArticle.ISummary
// GET /categories/:id/articles → IPageIRedditArticle.ISummary
```

### Example 2: BBS System

```typescript
// ✅ Correct Design

interface IBbsArticle {
  id: string;
  title: string;
  content: string;

  // Composition: Ownership (bbs_article_*)
  files: IBbsArticleFile[];
  // snapshots: Separate API (audit/history data)

  // Composition: Small collection (many-to-many)
  tags: IBbsTag[] {  // Typically < 10 tags
    id: string;
    name: string;
  }[];

  // Reference: Actor
  author: IBbsMember.ISummary {
    id: string;  // No need for separate author_id
    nickname: string;
    avatar_url: string;
  };

  // Composition: Comments (with limit)
  recent_comments: IBbsComment.ISummary[];  // Top 5
  comment_count: number;  // Total

  // Reference: Category
  category: IBbsCategory {
    id: string;  // No need for separate category_id
    name: string;
  };
}

interface IBbsArticle.ISummary {
  id: string;
  title: string;

  // ✅ Summary: All flattened, NO nested objects for performance
  author_name: string;
  author_avatar_url: string;

  category_name: string;

  // Counts
  comment_count: number;
  like_count: number;

  created_at: string;
}

interface IBbsMember {
  id: string;
  nickname: string;
  email: string;

  // ✅ No articles, comments, etc.
}
```

### Example 3: Shopping System

```typescript
// ✅ Correct Design

interface IShoppingOrder {
  id: string;
  order_number: string;
  status: string;

  // Composition: Essential components (shopping_order_items)
  items: IShoppingOrderItem[] {
    id: string;
    product: IShoppingProduct.ISummary {
      id: string;  // No need for separate product_id
      name: string;
      thumbnail_url: string;
      price: number;
    };
    quantity: number;
    price: number;
    subtotal: number;
  }[];

  // Composition: Payment info (shopping_order_payments)
  payments: IShoppingOrderPayment[] {
    id: string;
    method: string;
    amount: number;
    status: string;
    paid_at?: string;
  }[];

  // Reference: Customer (Actor - who placed the order)
  customer: IShoppingCustomer.ISummary {
    id: string;  // No need for separate customer_id
    name: string;
    email: string;
  };

  // Reference: Shipping address
  shipping_address: IShoppingAddress {
    id: string;  // No need for separate shipping_address_id
    street: string;
    city: string;
    postal_code: string;
  };

  // Aggregates
  total_amount: number;
  created_at: string;
}

interface IShoppingCustomer {
  id: string;
  name: string;
  email: string;

  // ✅ No orders array
}

// Reverse query
// GET /customers/:id/orders → IPageIShoppingOrder.ISummary
```

---

## Summary Checklist

When designing a DTO with relationships, verify:

### ✅ Composition Checklist
- [ ] **CRITICAL**: Child has FK pointing TO parent (not reversed)
- [ ] Child table name follows `{parent}_*` pattern
- [ ] Parent does NOT have FK to child (would indicate lookup/metadata)
- [ ] Represents ownership (cascade delete applies)
- [ ] Array size is reasonable (< 100 items typically)
- [ ] Children cannot exist independently
- [ ] Depth is ≤ 2 levels
- [ ] Not an actor/category/lookup reference
- [ ] Verified in Prisma schema (not just assumed from name)

### ✅ Child → Parent Back-Reference Checklist
- [ ] **CRITICAL**: If parent composes children, children must NOT include full parent
- [ ] Child (default) uses `parent_id: string` (ID only - BEST for parent-centric views)
- [ ] Child.IInvert uses `parent: IParent.ISummary` (for child-centric views)
- [ ] IInvert variant is created when child needs parent context (user's comments, search results, etc.)
- [ ] Summary variant for parent does NOT include any composition arrays
- [ ] Verified no circular reference (Parent → Child → Parent → ♾️)

### ✅ Recursive Tree Structure Checklist
- [ ] **CRITICAL**: NEVER include both `parent` object AND `children` array in same type
- [ ] Default type has `children` array + `parent_id` only (top-down navigation)
- [ ] IInvert type has `parent` chain + NO `children` (bottom-up navigation/breadcrumb)
- [ ] Children depth limited to 1-2 levels max
- [ ] Parent chain can be unlimited (typically 5-10 levels)
- [ ] Verified for: categories, folders, org charts, menu trees, comment threads

### ✅ Reference Checklist
- [ ] Different domain or independent entity
- [ ] Is an actor field (author, creator, modifier - avoid reverse collections)
- [ ] Is a category/classification field
- [ ] Is a lookup to master data
- [ ] Reverse direction would cause explosion
- [ ] Used Summary variant, not full entity
- [ ] Summary object includes `id` field (no need for separate `*_id` field)
- [ ] In Summary DTOs, denormalized to flat primitives (no nested objects)

### ✅ Reverse Direction Checklist
- [ ] Actor entities do NOT contain action arrays
- [ ] Category entities do NOT contain item arrays
- [ ] Reverse queries use separate APIs
- [ ] Statistics use separate DTO variants (IEntity.IWithStats)

### ❌ Anti-Pattern Checklist
- [ ] NO bidirectional full composition
- [ ] NO depth > 2 levels
- [ ] NO large arrays (> 1000 items) in main DTO
- [ ] NO actor entities with collections
- [ ] NO category entities with items
- [ ] NO circular references

---

## Integration with INTERFACE_SCHEMA.md

This document should be referenced in the main `INTERFACE_SCHEMA.md` as:

```markdown
### 4.X. Composition and Reference Strategy

For detailed rules on when to use Composition (embedding full objects/arrays) versus Reference (using IDs or Summary objects), see the comprehensive guide in `INTERFACE_SCHEMA_COMPOSITION.md`.

**Quick Reference:**
- **Composition**: Child table name is `{parent}_*`, ownership relationship, cascade delete
- **Reference**: Actor fields, categories, different domains, independent entities
- **Reverse Direction**: NEVER include reverse collections in Actor/Category entities

Apply these rules to prevent infinite recursion, performance issues, and circular dependencies.
```

---

## Conclusion

Proper Composition vs Reference decisions are **critical** for:

1. **Performance**: Preventing data explosion and N+1 query problems
2. **Type Safety**: Avoiding circular type dependencies
3. **Maintainability**: Clear ownership and relationship semantics
4. **API Design**: Intuitive and predictable endpoint behavior

**Golden Rules:**
1. **FK Direction is THE strongest signal**:
   - Child → Parent FK + `{parent}_*` naming → ✅ Composition
   - Parent → Child FK → ✅ Reference (even if name looks like composition)
2. **Table name alone is NOT enough**: Always check FK direction in Prisma schema
3. **Metadata/Lookup tables are References**: If parent has FK to child, it's lookup (not composition)
4. **Parent → Child composition is safe, Child → Parent is NOT**:
   - ✅ Article can have `comments: IComment[]`
   - ❌ Comment must NOT have `article: IArticle` (use ID or `IArticle.ISummary` or `IComment.IInvert`)
5. **Recursive structures require IInvert**:
   - ✅ Default: `children[]` + `parent_id` (top-down, depth limit 1-2)
   - ✅ IInvert: `parent` chain + NO children (bottom-up, unlimited depth)
   - ❌ NEVER both directions in same type
6. **One direction gets composition, reverse gets separate API**: Prevent infinite recursion
7. **Actor entities never contain action collections**: User should NOT have `articles[]`
8. **Depth limit of 2 levels maximum**: Prevent deep nesting (except IInvert parent chains)
9. **Reference objects include ID**: No need for separate `*_id` field when using Summary objects
10. **Summary DTOs are flat**: Denormalize references to primitives for performance
11. **When in doubt, use Reference**: Safer default choice

**Key Design Patterns:**

✅ **Main Entity (IEntity)**:
- Composition for owned children (`{parent}_*` tables)
- Reference as Summary objects (author, category)
- Count only for large collections (comments, likes)

✅ **Summary Entity (IEntity.ISummary)**:
- NO nested objects (not even Summary)
- Denormalize reference fields to flat primitives
- Example: `author_name: string` instead of `author: IUser.ISummary`

✅ **Create DTO (IEntity.ICreate)**:
- Composition for children that can be created together
- Foreign keys (IDs) for references
- NEVER accept actor IDs (from auth context)

These rules ensure your DTOs are practical, performant, and maintainable.
