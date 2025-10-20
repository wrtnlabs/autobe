# Composition & Reference Rules for DTO Schema Design

## Core Principle

**Start from table names, then analyze scope boundaries and conceptual independence.**

DTOs are built by:
1. Following the natural hierarchy in table names
2. Respecting scope boundaries (independent concepts = separate scopes)
3. Validating with FK direction
4. Applying actor/category reference rules

**Critical:** Hierarchy indicates ownership and composition direction. Different scopes always use reference. Same scope uses composition unless the child is conceptually independent (has its own lifecycle and can exist meaningfully without parent).

---

## Rule 1: Table Name Hierarchy (Primary Signal)

### 1.1. The Hierarchy Pattern

Table names reveal ownership hierarchy through naming patterns:

```
Root Table:     bbs_articles
  └─ Level 1:   bbs_article_snapshots
       └─ Level 2: bbs_article_snapshot_images
       └─ Level 2: bbs_article_snapshot_files
```

**Key Insight**: Each level adds one more segment to the name.

### 1.2. Hierarchy Signals Ownership (Not Automatic Composition)

**Table hierarchy shows ownership relationship:**
```typescript
// Hierarchy chain: bbs_articles → bbs_article_snapshots → bbs_article_snapshot_*
interface IBbsArticleSnapshot {
  images: IBbsArticleSnapshotImage[];  // ✅ Depth 2: compose when snapshot loaded
  files: IBbsArticleSnapshotFile[];    // ✅ Depth 2: compose when snapshot loaded
}
```

**⚠️ IMPORTANT: Hierarchy ≠ Automatic Composition in Parent**

```typescript
// ❌ WRONG: Auto-composition based on hierarchy alone
interface IBbsArticle {
  snapshots: IBbsArticleSnapshot[];  // ❌ Could be 100+ audit records!
}

// ✅ CORRECT: Analyze usage & size first
interface IBbsArticle {
  snapshots_count: number;  // ✅ Audit data, separate API
  // GET /articles/:id/snapshots → IPage<IBbsArticleSnapshot>
}
```

**❌ Do NOT compose across hierarchy roots:**
```typescript
interface IBbsArticle {
  snapshots: IBbsArticleSnapshot[];  // ✅ Same hierarchy
  comments: IBbsArticleComment[];     // ❌ Different hierarchy root!
}
```

**Why?** `bbs_article_comments` is its own hierarchy root, not a child of `bbs_articles`.

**Key insight:** Hierarchy indicates **ownership and composition direction**. After identifying hierarchy, check:
- Is child conceptually independent? (separate scope)
- Different scope = Reference
- Same scope = Composition

---

## Rule 2: Scope Boundary Detection

### 2.1. What is a Scope?

A **scope** is an independent conceptual entity with its own lifecycle and hierarchy.

**Examples:**
```
Scope A: bbs_articles
  └─ bbs_article_snapshots
      ├─ bbs_article_snapshot_images
      └─ bbs_article_snapshot_files

Scope B: bbs_article_comments (SEPARATE ROOT)
  └─ bbs_article_comment_snapshots
      ├─ bbs_article_comment_snapshot_images
      └─ bbs_article_comment_snapshot_files

Scope C: shopping_orders
  ├─ shopping_order_goods (composite)
  │   └─ shopping_cart_commodities (reference)
  │       └─ shopping_cart_commodity_stocks (composite)
  ├─ shopping_order_deliveries
  ├─ shopping_order_payments
  └─ shopping_customer (reference)

Scope D: shopping_sales
  ├─ shopping_sellers (reference)
  └─ shopping_sale_units (composite)
      ├─ shopping_sale_unit_options (composite)
      │   └─ shopping_sale_unit_option_candidates (composite)
      └─ shopping_sale_unit_stocks (composite)
```

### 2.2. Identifying Scope Boundaries

**Critical question:** "Is this a different event or created by a different actor?"

```typescript
// ✅ Different Event/Actor = Separate Scope
bbs_article_comments
  - Created by readers (different actor from article author)
  - Different event: "commenting" vs "writing article"
  - Can exist as "user's comments list"
  → SEPARATE SCOPE → Reference

shopping_sale_questions
  - Created by potential buyers (different actor from seller)
  - Different event: "asking question" vs "registering sale"
  - Has its own lifecycle
  → SEPARATE SCOPE → Reference

shopping_sale_reviews
  - Created by customers (different actor from seller)
  - Different event: "writing review" vs "registering sale"
  - Independent feature (product reviews page)
  → SEPARATE SCOPE → Reference

// ❌ Same Event/Actor = Same Scope
bbs_article_snapshots
  - Created by article author (same actor)
  - Same event: "editing article" creates snapshot
  - Part of article's version history
  → SAME SCOPE → Composition

shopping_sale_units
  - Created by seller (same actor as sale)
  - Same event: "registering sale" includes units
  - Cannot exist without sale
  → SAME SCOPE → Composition
```

### 2.3. Scope Crossing = Reference

**When tables are from different scopes, use Reference:**

```typescript
// Scopes: articles vs snapshots vs comments vs members
interface IBbsArticle {
  snapshots: IBbsArticleSnapshot[];  // 🤔 Same scope, but check usage!

  // Different scopes → Reference
  comments_count: number;  // ✅ Count only
  author: IBbsMember.ISummary;  // ✅ Reference
}

interface IBbsArticleSnapshot {
  images: IBbsArticleSnapshotImage[];  // ✅ Same scope → Composition
  files: IBbsArticleSnapshotFile[];    // ✅ Same scope → Composition
}

interface IBbsArticleComment {
  // ✅ Comment scope (no owned children in this example)

  // Different scopes → Reference
  author: IBbsMember.ISummary;  // ✅ Reference
  article: IBbsArticle.ISummary;  // ✅ Reference (via IInvert)
}
```

### 2.4. Same Scope ≠ Automatic Composition

**CRITICAL:** Even within same scope, consider business logic and usage patterns.

```typescript
// Same scope: Direct ownership in hierarchy
interface IShoppingOrder {
  goods: IShoppingOrderGoods[];  // ✅ Composition
  deliveries: IShoppingOrderDelivery[];  // ✅ Composition
  payments: IShoppingOrderPayment[];  // ✅ Composition
}

interface IBbsArticle {
  snapshots: IBbsArticleSnapshot[];  // ✅ Composition
}

interface IBbsArticleSnapshot {
  images: IBbsArticleSnapshotImage[];  // ✅ Composition
  files: IBbsArticleSnapshotFile[];  // ✅ Composition
}
```

**Examples:**
```typescript
// ✅ COMPOSITION: Same scope (hierarchy chain)
shopping_orders → shopping_order_goods
bbs_articles → bbs_article_snapshots
bbs_article_snapshots → bbs_article_snapshot_images
shopping_sales → shopping_sale_units → shopping_sale_unit_options
```

---

## Rule 3: Domain Independence Test

### 3.1. The Three Questions

Before deciding Composition vs Reference, ask:

1. **Table Name:** Does child extend parent's name? (`parent_*`)
2. **Event/Actor:** Is this created by the same actor in the same event?
3. **Operations:** Can child be queried/managed independently?

### 3.2. Decision Matrix

| Question | Answer | Signal |
|----------|--------|--------|
| Name pattern | `bbs_article_snapshot_images` | ✅ Composition candidate |
| Event/Actor | Same event (editing), same actor | ✅ Part of snapshot |
| Operations | Only via parent | ✅ **Composition** |

| Question | Answer | Signal |
|----------|--------|--------|
| Name pattern | `bbs_article_comments` | 🤔 Looks like composition |
| Event/Actor | Different event (commenting), different actor (readers) | ❌ Separate scope |
| Operations | User's comments, search, etc. | ❌ **Reference** |

| Question | Answer | Signal |
|----------|--------|--------|
| Name pattern | `shopping_sale_reviews` | 🤔 Looks like composition |
| Event/Actor | Different event (reviewing), different actor (customers) | ❌ Separate scope |
| Operations | Product reviews page, rating aggregation | ❌ **Reference** |

| Question | Answer | Signal |
|----------|--------|--------|
| Name pattern | `shopping_sale_units` | ✅ Same hierarchy |
| Event/Actor | Same event (registering sale), same actor (seller) | ✅ Part of sale |
| Operations | Only via parent | ✅ **Composition** |

### 3.3. Examples

```typescript
// ✅ COMPOSITION: Same event/actor
bbs_articles → bbs_article_snapshots (author edits article)
bbs_article_snapshots → bbs_article_snapshot_images (part of edit)
shopping_orders → shopping_order_goods (customer places order)
shopping_sales → shopping_sale_units (seller registers sale)

// ✅ REFERENCE: Different event/actor
bbs_articles → bbs_article_comments (readers comment - different event)
shopping_sales → shopping_sale_reviews (customers review - different event)
shopping_sales → shopping_sale_questions (buyers ask - different event)
bbs_articles → bbs_members (author - different scope)
shopping_orders → shopping_customers (customer - different scope)
```

---

## Rule 4: FK Direction Validation

### 4.1. Purpose

FK direction confirms ownership, but **table name hierarchy comes first**.

### 4.2. Validation Rules

```typescript
// Step 1: Check table name hierarchy
bbs_article_snapshots → bbs_article_snapshot_images
  → Name suggests composition ✅

// Step 2: Validate with FK direction
model BbsArticleSnapshotImage {
  snapshot_id String  // ✅ Child → Parent FK (confirms composition)
  snapshot    BbsArticleSnapshot @relation(...)
}

// Step 3: Check cascade
ON DELETE CASCADE  // ✅ Confirms ownership
```

### 4.3. Conflict Resolution

**When table name and FK conflict:**

```prisma
// Case: article_statuses (looks like child by name)
model Article {
  status_id String  // ❌ Parent → Child FK (reversed!)
  status    ArticleStatus @relation(...)
}

model ArticleStatus {
  id   String
  name String  // "draft", "published"
}
```

**Resolution:** FK direction wins → **Reference (lookup table)**

---

## Rule 5: Composition Depth Limits

### 5.1. The Problem

Hierarchy can go deep. Where to stop?

```
bbs_articles
  └─ bbs_article_snapshots
      ├─ bbs_article_snapshot_images
      └─ bbs_article_snapshot_files
```

### 5.2. Rules by Entity Type

**Main Entity (IEntity):**
- Depth 1: Always include (e.g., `snapshots`)
- Depth 2+: Case by case (usually separate API)

```typescript
interface IBbsArticle {
  snapshots: IBbsArticleSnapshot[];  // ✅ Depth 1

  // Or: Snapshots via separate API (audit/history)
  // GET /articles/:id/snapshots
}

interface IBbsArticleSnapshot {
  images: IBbsArticleSnapshotImage[];  // ✅ Depth 2: If snapshots are loaded, include their children
  files: IBbsArticleSnapshotFile[];
}
```

**Summary Entity (IEntity.ISummary):**
- No composition at all (performance)

```typescript
interface IBbsArticle.ISummary {
  id: string;
  title: string;
  author_name: string;  // Denormalized
  file_count: number;   // Count, not array
}
```

### 5.3. Reverse Relationships (CRITICAL)

**NEVER compose reverse direction - Actor/Parent entities must NOT have child entity arrays.**

```typescript
// ❌ WRONG: Reverse relationship
interface IShoppingSeller {
  sales: IShoppingSale[];  // ❌ Reverse direction!
}

interface IBbsMember {
  articles: IBbsArticle[];  // ❌ Reverse direction!
}

// ✅ CORRECT: Forward direction only
interface IShoppingSale {
  seller: IShoppingSeller.ISummary;  // ✅ Child → Parent reference
}

interface IBbsArticle {
  author: IBbsMember.ISummary;  // ✅ Child → Parent reference
}
```

**Why reverse is forbidden:**
- Violates single direction principle
- Different scopes (Seller scope ≠ Sales scope)
- Actor pattern: Users/Sellers/Members are actors, not containers
- Use separate API: `GET /sellers/:id/sales`

---

## Rule 6: Actor & Category References

### 6.1. Actor Pattern

**Actors** create or modify entities. They are ALWAYS from different scopes.

**Rule:** Actor → Entity (reference), but NEVER Entity array in Actor

```typescript
// ✅ CORRECT: Actor as Reference
interface IBbsArticle {
  author: IBbsMember.ISummary {
    id: string;
    nickname: string;
    avatar_url: string;
  };
}

interface IShoppingSale {
  seller: IShoppingSeller.ISummary {
    id: string;
    name: string;
    company: string;
  };
}

// ✅ CORRECT: Actor definition
interface IBbsMember {
  id: string;
  nickname: string;
  // ❌ NEVER: articles: IBbsArticle[]
}

interface IShoppingSeller {
  id: string;
  name: string;
  company: string;
  // ❌ NEVER: sales: IShoppingSale[]  (Could be 1000+ items!)

  sales_count: number;  // ✅ Count only
}

// Reverse direction: Separate API
// GET /members/:id/articles → IPage<IBbsArticle.ISummary>
// GET /sellers/:id/sales → IPage<IShoppingSale.ISummary>
```

**Why NEVER reverse collections:**
1. **Different scopes**: Sales and Sellers are separate scopes
2. **Actor pattern violation**: Actors are not containers
3. **Single direction**: Child → Parent only, never Parent → Children

**Key Fields:** `author_id`, `creator_id`, `user_id`, `member_id`, `customer_id`, `seller_id`

### 6.2. Category Pattern

**Categories/Tags** classify entities. Usually separate scopes.

```typescript
interface IBbsArticle {
  category: IBbsCategory {
    id: string;
    name: string;
  };

  tags: IBbsTag[] {  // ✅ Small lookup (< 10)
    id: string;
    name: string;
  }[];
}

interface IBbsCategory {
  id: string;
  name: string;
  // ❌ NEVER: articles: IBbsArticle[]
}
```

### 6.3. ID Field Convention

**For references, include ID in Summary object (no separate field needed):**

```typescript
// ✅ RECOMMENDED: Object includes ID
interface IBbsArticle {
  author: IBbsMember.ISummary {
    id: string;  // ID is here
    nickname: string;
  };
}

// ⚠️ ACCEPTABLE but redundant:
interface IBbsArticle {
  author_id: string;  // Redundant
  author: IBbsMember.ISummary { id, nickname };
}

// ✅ For Create DTOs: ID only
interface IBbsArticle.ICreate {
  category_id: string;  // ✅ Just ID
  // NO author_id (from auth context)
}
```

---

## Rule 7: IInvert Pattern

### 7.1. The Problem

What if a child scope needs parent context?

```typescript
// Child scope needs parent info:
GET /members/:id/comments → Need article title for each comment
GET /comments/recent → Need article context
```

### 7.2. Solution: IInvert

**IInvert** = Entity from reverse perspective, includes parent context

```typescript
// Default: No parent object (article detail page)
interface IBbsArticleComment {
  id: string;
  content: string;
  article_id: string;  // ✅ ID only
  author: IBbsMember.ISummary;
}

// Inverted: Includes parent context (user's comments list)
interface IBbsArticleComment.IInvert {
  id: string;
  content: string;
  author: IBbsMember.ISummary;

  article: IBbsArticle.ISummary {  // ✅ Parent context
    id: string;
    title: string;
    // CRITICAL: No comments array!
  };
}
```

### 7.3. When to Use IInvert

**Use IInvert when:**
- ✅ Child is primary focus (user's comments)
- ✅ Need parent context for display (article title)
- ✅ Search results (comments + article info)

**Don't use when:**
- ❌ Parent detail page (redundant)
- ❌ Child is already in parent's composition

### 7.4. Recursive Trees

**Special case:** Self-referencing hierarchies

```typescript
// Top-down navigation (explore children)
interface IShoppingCategory {
  id: string;
  name: string;
  parent_id: string | null;  // ✅ ID only

  children: IShoppingCategory[] {  // ✅ Depth 1-2
    id: string;
    name: string;
    parent_id: string;
    // No children here (depth limit)
  }[];
}

// Bottom-up navigation (breadcrumb)
interface IShoppingCategory.IInvert {
  id: string;
  name: string;

  parent: IShoppingCategory.IInvert | null {  // ✅ Recursive chain
    id: string;
    name: string;
    parent: IShoppingCategory.IInvert | null;
  };
  // NO children array
}

// Usage:
// GET /categories/:id → IShoppingCategory (explore children)
// GET /products/:id → IShoppingProduct { category: IShoppingCategory.IInvert } (breadcrumb)
```

---

## Quick Decision Guide

### Step-by-Step Process

```
1. START with table names
   │
   ├─ Same hierarchy chain? (parent_child_*)
   │  └─ YES → Composition candidate
   │     │
   │     ├─ Independent concept? (comments, orders)
   │     │  └─ YES → Separate scope → Reference ❌
   │     │  └─ NO → Same scope → Continue
   │     │
   │     ├─ Check FK direction
   │     │  ├─ Child → Parent FK → Composition ✅
   │     │  └─ Parent → Child FK → Reference (lookup) ❌
   │     │
   │     └─ Result: Composition ✅
   │
   └─ Different hierarchy? (members, sellers, products)
      └─ Reference ✅
```

### Quick Lookup

| Pattern | Example | Rule | Result |
|---------|---------|------|--------|
| `parent_*` data | `snapshot_images` | Same scope | ✅ Composition |
| `parent_*` concept | `article_comments` | Different scope | ❌ Reference |
| Actor | `author`, `creator` | Different scope | ❌ Reference |
| Actor reverse | `seller.sales[]` | Reverse direction | ❌ Forbidden |
| Category | `category`, `tags` | Different scope | ❌ Reference |
| Lookup | `article_statuses` | Reversed FK | ❌ Reference |
| Recursive | `parent_id` | Self-reference | 🔄 Use IInvert |

---

## Complete Examples

### Example 1: BBS System

```typescript
// =====================
// Scope: bbs_articles
// =====================
interface IBbsArticle {
  id: string;
  title: string;
  content: string;
  created_at: string;

  // Composition: Same scope (article's snapshots)
  snapshots: IBbsArticleSnapshot[] {
    id: string;
    content: string;
    created_at: string;

    images: IBbsArticleSnapshotImage[] {
      id: string;
      url: string;
    }[];

    files: IBbsArticleSnapshotFile[] {
      id: string;
      url: string;
      name: string;
    }[];
  }[];

  // Reference: Different scope (actor)
  author: IBbsMember.ISummary {
    id: string;
    nickname: string;
    avatar_url: string;
  };

  // Reference: Different scope (category)
  category: IBbsCategory {
    id: string;
    name: string;
  };

  // Different scope: Count only (large collection)
  comment_count: number;
  like_count: number;
}

// =====================
// Scope: bbs_article_comments (SEPARATE ROOT)
// =====================
interface IBbsArticleComment {
  id: string;
  content: string;
  created_at: string;

  // Reference: Different scope (actor)
  author: IBbsMember.ISummary {
    id: string;
    nickname: string;
  };

  // Reference: Parent scope (ID only in default)
  article_id: string;
}

// IInvert: For comment-centric views
interface IBbsArticleComment.IInvert {
  id: string;
  content: string;
  created_at: string;

  author: IBbsMember.ISummary {
    id: string;
    nickname: string;
  };

  article: IBbsArticle.ISummary {  // ✅ Parent context
    id: string;
    title: string;
    // NO comments array!
  };
}

// Usage:
// GET /articles/:id → IBbsArticle { comments: IBbsArticleComment[] }
// GET /members/:id/comments → IPageIBbsArticleComment.IInvert
```

### Example 2: Shopping System - Orders

```typescript
// =====================
// Scope: shopping_orders
// =====================
interface IShoppingOrder {
  id: string;
  order_number: string;
  status: string;
  created_at: string;

  // Composition: Same scope (order's components)
  goods: IShoppingOrderGoods[] {
    id: string;
    quantity: number;
    price: number;

    // Reference: Different scope (cart commodity lookup)
    commodity: IShoppingCartCommodity.ISummary {
      id: string;
      name: string;

      // Composition: Stocks belong to commodity
      stocks: IShoppingCartCommodityStock[] {
        id: string;
        inventory_id: string;
        quantity: number;
      }[];
    };
  }[];

  deliveries: IShoppingOrderDelivery[] {
    id: string;
    address: string;
    status: string;
    tracking_number: string;
  }[];

  payments: IShoppingOrderPayment[] {
    id: string;
    method: string;
    amount: number;
    paid_at: string;
  }[];

  // Reference: Different scope (actor)
  customer: IShoppingCustomer.ISummary {
    id: string;
    name: string;
    email: string;
  };

  total_amount: number;
}

// Summary: No composition
interface IShoppingOrder.ISummary {
  id: string;
  order_number: string;
  status: string;

  // Denormalized
  customer_name: string;
  total_amount: number;
  goods_count: number;

  created_at: string;
}
```

### Example 3: Shopping System - Sales (Deep Hierarchy)

```typescript
// =====================
// Scope: shopping_sales
// =====================
interface IShoppingSale {
  id: string;
  name: string;
  description: string;
  created_at: string;

  // Reference: Different scope (actor)
  seller: IShoppingSeller.ISummary {
    id: string;
    name: string;
    company: string;
  };

  // Composition: Same event/actor (seller registers sale with units)
  units: IShoppingSaleUnit[] {
    id: string;
    name: string;
    price: number;

    // Composition: Unit's options (Depth 2)
    options: IShoppingSaleUnitOption[] {
      id: string;
      name: string;
      type: string;

      // Composition: Option's candidates (Depth 3)
      candidates: IShoppingSaleUnitOptionCandidate[] {
        id: string;
        value: string;
        price_delta: number;
      }[];
    }[];

    // Composition: Unit's stocks (Depth 2)
    stocks: IShoppingSaleUnitStock[] {
      id: string;
      warehouse_id: string;
      quantity: number;
      reserved: number;
    }[];
  }[];

  // Different event/actor: Separate API
  reviews_count: number;  // ✅ Customers write reviews (different event)
  questions_count: number;  // ✅ Buyers ask questions (different event)
  average_rating: number;  // ✅ Denormalized from reviews
  // GET /sales/:id/reviews → IPage<IShoppingSaleReview>
  // GET /sales/:id/questions → IPage<IShoppingSaleQuestion>
}

// =====================
// Different scope: Reviews (SEPARATE ROOT)
// =====================
interface IShoppingSaleReview {
  id: string;
  sale_id: string;
  rating: number;
  content: string;
  created_at: string;

  // Reference: Different scope (customer who reviewed)
  customer: IShoppingCustomer.ISummary {
    id: string;
    name: string;
  };
}

// =====================
// Different scope: Questions (SEPARATE ROOT)
// =====================
interface IShoppingSaleQuestion {
  id: string;
  sale_id: string;
  question: string;
  answer: string | null;
  created_at: string;

  // Reference: Different scope (buyer who asked)
  questioner: IShoppingMember.ISummary {
    id: string;
    nickname: string;
  };
}

// When loading individual unit (avoids deep nesting)
interface IShoppingSaleUnit {
  id: string;
  sale_id: string;
  name: string;
  price: number;

  // Depth 2: Include children when unit is loaded
  options: IShoppingSaleUnitOption[] {
    id: string;
    name: string;
    type: string;

    candidates: IShoppingSaleUnitOptionCandidate[] {
      id: string;
      value: string;
      price_delta: number;
    }[];
  }[];

  stocks: IShoppingSaleUnitStock[] {
    id: string;
    warehouse_id: string;
    quantity: number;
    reserved: number;
  }[];
}
```

### Example 4: Hierarchy Chain

```typescript
// =====================
// Chain: articles → snapshots → snapshot_images/files
// =====================

// Depth 0: Root
interface IBbsArticle {
  id: string;
  title: string;

  snapshots: IBbsArticleSnapshot[];  // ✅ Depth 1

  // Or: Depth 1 via separate API
  // GET /articles/:id/snapshots
}

// Depth 1: Loaded when needed
interface IBbsArticleSnapshot {
  id: string;
  article_id: string;
  content: string;
  created_at: string;
  reason: string;

  // Depth 2: When snapshot is loaded, include its children
  images: IBbsArticleSnapshotImage[] {
    id: string;
    url: string;
  }[];

  files: IBbsArticleSnapshotFile[] {
    id: string;
    url: string;
    name: string;
  }[];
}

// =====================
// Separate chain: comments → comment_snapshots → comment_snapshot_images/files
// =====================
interface IBbsArticleComment {
  id: string;
  content: string;

  // Depth 2: Separate API
  // GET /comments/:id/snapshots
}

interface IBbsArticleCommentSnapshot {
  id: string;
  comment_id: string;
  content: string;

  images: IBbsArticleCommentSnapshotImage[] {
    id: string;
    url: string;
  }[];

  files: IBbsArticleCommentSnapshotFile[] {
    id: string;
    url: string;
  }[];
}
```

---

## Critical Rules Summary

### The 4 Essential Rules

1. **Table Name Hierarchy First**
   - Follow naming pattern: `parent_child_grandchild`
   - Same chain = Composition
   - Different chains = Reference

2. **Event/Actor Boundaries Matter**
   - Different event or different actor = Separate scopes
   - `article_comments` (readers commenting) ≠ `articles` (author writing)
   - `sale_reviews` (customers reviewing) ≠ `sales` (seller registering)
   - Cross-scope = Always Reference
   - Same event/actor = Composition

3. **FK Direction Validates**
   - Child → Parent FK = Composition ✅
   - Parent → Child FK = Reference (lookup) ❌

4. **Actor/Category = Always Reference**
   - Users, Members, Customers, Sellers = Actors
   - Categories, Tags, Statuses = Classifications
   - Never compose reverse direction (Member with articles, Seller with sales)
   - Actors are not containers

5. **IInvert for Back-References**
   - Child needs parent context = Use IInvert
   - Recursive trees = Default (children) vs IInvert (parent chain)
   - Never both directions in same type

---

## Common Mistakes

### ❌ Mistake 1: Comments as Composition

```typescript
// ❌ WRONG: Treating comments as same scope
interface IBbsArticle {
  comments: IBbsArticleComment[];  // Different scope!
}
```

**Why wrong:** Comments are independent entities with their own lifecycle.

**Fix:** Count + separate API or IInvert

```typescript
// ✅ CORRECT
interface IBbsArticle {
  comment_count: number;
}

// GET /articles/:id/comments → IPageIBbsArticleComment
```

### ❌ Mistake 2: Actor Collections (Reverse Direction)

```typescript
// ❌ WRONG: User with articles array
interface IBbsMember {
  articles: IBbsArticle[];  // ❌ Reverse direction!
}

// ❌ WRONG: Seller with sales array
interface IShoppingSeller {
  sales: IShoppingSale[];  // ❌ Reverse direction!
}
```

**Why wrong:**
- Violates single direction principle
- Different scopes (Member scope ≠ Articles scope, Seller scope ≠ Sales scope)
- Actor pattern violation: Actors are not containers

**Fix:** Use separate API

```typescript
// ✅ CORRECT
interface IBbsMember {
  id: string;
  nickname: string;
}

interface IShoppingSeller {
  id: string;
  name: string;
}

// GET /members/:id/articles → IPage<IBbsArticle.ISummary>
// GET /sellers/:id/sales → IPage<IShoppingSale.ISummary>
```

### ❌ Mistake 3: Circular References

```typescript
// ❌ WRONG: Both directions with full objects
interface IBbsArticle {
  comments: IBbsArticleComment[];
}

interface IBbsArticleComment {
  article: IBbsArticle;  // Infinite loop!
}
```

**Fix:** Use IInvert

```typescript
// ✅ CORRECT
interface IBbsArticleComment.IInvert {
  article: IBbsArticle.ISummary {  // No comments!
    id: string;
    title: string;
  };
}
```

### ❌ Mistake 4: Ignoring Scope Boundaries

```typescript
// ❌ WRONG: Mixing scopes
interface IBbsArticle {
  snapshots: IBbsArticleSnapshot[];        // ✅ Same scope
  comments: IBbsArticleComment[];          // ❌ Different scope
  comment_images: IBbsArticleCommentImage[]; // ❌❌ Wrong scope entirely!
}
```

**Fix:** Respect hierarchy

```typescript
// ✅ CORRECT
interface IBbsArticle {
  snapshots: IBbsArticleSnapshot[];  // Same scope only
}

interface IBbsArticleSnapshot {
  images: IBbsArticleSnapshotImage[];  // Snapshot's own scope
  files: IBbsArticleSnapshotFile[];
}

interface IBbsArticleComment {
  // Comment's own scope (comment_snapshots)
}
```

---

## Checklist

### Before Creating DTOs

- [ ] **Identify root tables** (main entities: articles, orders, members)
- [ ] **Map hierarchy chains** (article → article_images, snapshot → snapshot_images/files)
- [ ] **Identify scope boundaries** (comments is separate from articles)
- [ ] **List actors** (author, creator, customer, seller)
- [ ] **List categories** (category, tags, status)

### For Each DTO

- [ ] **Check table name pattern** (`parent_child_*` = same scope candidate)
- [ ] **Check event/actor** (different event or actor? = different scope)
- [ ] **Validate FK direction** (child → parent = composition, parent → child = reference)
- [ ] **No reverse collections** (User should NOT have articles array)

### For Back-References

- [ ] **Child default: ID only** (article_id, not article object)
- [ ] **Child.IInvert: Parent Summary** (without grandchildren)
- [ ] **No circular refs** (both directions = disaster)

### For Recursive Trees

- [ ] **Default: children array** (top-down navigation)
- [ ] **IInvert: parent chain** (bottom-up breadcrumb)
- [ ] **Never both** (parent object AND children array)

---

## Integration with INTERFACE_SCHEMA.md

This document provides **detailed decision rules** for composition and reference strategies. The main INTERFACE_SCHEMA.md should reference this with a brief summary:

```markdown
### X.X Composition and Reference Strategy

When designing DTOs with relationships, follow these rules:

1. **Start with table name hierarchy** - `parent_child_*` pattern indicates same scope
2. **Check event/actor boundaries** - Different event or different actor = separate scopes
3. **Validate with FK direction** - Child→Parent FK confirms composition
4. **Use IInvert for back-references** - When child needs parent context

For detailed rules and examples, see INTERFACE_SCHEMA_COMPOSITION.md.

**Quick Reference:**
- Same event/actor + Child→Parent FK = Composition
- Different event/actor or Category = Reference
- Examples:
  - `sale_units` (seller registers) = Composition
  - `sale_reviews` (customers review) = Reference
  - `article_comments` (readers comment) = Reference
- Never compose reverse direction (User with articles array)
```

---

## Conclusion

**The hierarchy in table names is your primary guide.** Start there, check event/actor boundaries, and validate with FK direction.

**Core workflow:**
1. Identify table name hierarchy chains (`parent_child_*`)
2. Check event/actor boundaries (different event or actor = separate scope)
3. Validate with FK direction (child → parent = composition)
4. Apply reference rules (actors, categories)
5. Use IInvert for reverse perspectives

**Critical principle:**
- Same event/actor = Composition
- Different event/actor = Reference
- Never reverse direction

**Key examples:**
- `sale_units` (seller creates) → Composition
- `sale_reviews` (customers write) → Reference
- `article_snapshots` (author edits) → Composition
- `article_comments` (readers comment) → Reference

This approach ensures DTOs are **clear, consistent, and maintainable** while preventing infinite recursion and circular dependencies.
