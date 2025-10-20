# Composition & Reference Rules for DTO Schema Design

## Core Principle

**Start from table names, then carefully analyze business concept, usage patterns, and size.**

DTOs are built by:
1. Following the natural hierarchy in table names
2. Respecting scope boundaries
3. **Analyzing business concept and usage patterns** (core vs auxiliary, always-loaded vs rarely-accessed)
4. **Considering expected size** (10 items vs 1000+ items)
5. Validating with FK direction

**Critical:** Same scope ≠ Automatic composition. Even within the same hierarchy, you must analyze whether the relationship should be composed or separated into a different API based on business logic, size, and usage patterns.

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
  images: IBbsArticleImage[];         // 🤔 Same hierarchy (check size!)
  comments: IBbsArticleComment[];     // ❌ Different hierarchy root!
}
```

**Why?** `bbs_article_comments` is its own hierarchy root, not a child of `bbs_articles`.

**Key insight:** Hierarchy indicates **ownership**, not necessarily **composition**. After identifying hierarchy, analyze:
- Business concept (core vs auxiliary)
- Expected size (< 20 vs 100+)
- Usage pattern (always loaded vs separate feature)

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

**Question to ask:** "Can this entity exist independently and meaningfully?"

```typescript
// ✅ Independent Scope (separate root)
bbs_article_comments
  - Can exist as "user's comments list"
  - Has its own lifecycle and operations
  - Has its own children (comment_snapshots)
  → SEPARATE SCOPE

// ❌ Not Independent (part of parent scope)
bbs_article_snapshot_images
  - Only makes sense in context of snapshot
  - Cannot be queried independently
  - No meaningful operations without parent
  → SAME SCOPE as bbs_article_snapshots
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
// Same scope (bbs_articles hierarchy), but different usage:

// Case 1: Images (always loaded with article)
interface IBbsArticle {
  images: IBbsArticleSnapshotImage[];  // ✅ Composition
  // Reason: < 10 images, always displayed
}

// Case 2: Snapshots (audit trail, rarely accessed)
interface IBbsArticle {
  snapshots_count: number;  // ✅ Count only, separate API
  // Reason: Could be 100+ snapshots, audit-only feature
  // GET /articles/:id/snapshots → IPage<IBbsArticleSnapshot>
}
```

**Decision factors for same-scope relationships:**
1. **Expected size**: How many child records typically? (< 10 vs 100+)
2. **Usage frequency**: Always loaded together? Or separate feature?
3. **Business concept**: Core data vs auxiliary data (audit, history)?
4. **Performance**: Loading children acceptable in main query?

**Examples:**
```typescript
// ✅ COMPOSITION: Same scope + Always together
shopping_orders → shopping_order_goods (typical: 5-20 items)
bbs_articles → bbs_article_snapshot_images (typical: 3-10 images)

// ✅ SEPARATE API: Same scope + Different usage
bbs_articles → bbs_article_snapshots (audit trail, separate page)
shopping_sales → shopping_sale_reviews (could be 1000+ reviews)
```

---

## Rule 3: Domain Independence Test

### 3.1. The Four Questions

Before deciding Composition vs Reference, ask:

1. **Table Name:** Does child extend parent's name? (`parent_*`)
2. **Concept:** Is child an independent concept or just data attached to parent?
3. **Operations:** Can child be queried/managed independently?
4. **Usage & Size:** Always loaded together? How many records? (< 10 vs 100+)

### 3.2. Decision Matrix

| Question | Answer | Signal |
|----------|--------|--------|
| Name pattern | `bbs_article_snapshot_images` | ✅ Composition candidate |
| Concept | "Snapshot Images" (not independent) | ✅ Part of snapshot |
| Operations | Only via parent | ✅ Signals composition |
| Usage & Size | Always shown, < 10 items | ✅ **Composition** |

| Question | Answer | Signal |
|----------|--------|--------|
| Name pattern | `bbs_article_comments` | 🤔 Looks like composition |
| Concept | "Comments" (independent concept) | ❌ Separate entity |
| Operations | User's comments, search, etc. | ❌ Independent operations |
| Usage & Size | Separate page, 100+ items | ❌ **Reference (separate scope)** |

| Question | Answer | Signal |
|----------|--------|--------|
| Name pattern | `bbs_article_snapshots` | ✅ Same hierarchy |
| Concept | "Snapshots" (audit trail) | 🤔 Attached but auxiliary |
| Operations | Only via parent | ✅ Part of article |
| Usage & Size | Audit page, 100+ items | ❌ **Separate API (same scope but large)** |

### 3.3. Examples

```typescript
// ✅ COMPOSITION: Hierarchy chains
bbs_articles → bbs_article_snapshots → bbs_article_snapshot_images
shopping_orders → shopping_order_goods
shopping_orders → shopping_order_deliveries

// ✅ REFERENCE: Independent concepts
bbs_articles → bbs_article_comments (separate scope)
bbs_articles → bbs_members (actor)
shopping_orders → shopping_customers (actor)
shopping_order_goods → shopping_products (lookup)
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

### 5.3. Size Considerations (CRITICAL)

**Even if same scope, large collections (100+ records) MUST use separate API.**

```typescript
interface IBbsArticle {
  snapshots: IBbsArticleSnapshot[];  // ✅ < 10 snapshots typical

  // If potentially large (100+):
  comment_count: number;  // ✅ Count only
  like_count: number;
  // ✅ Use separate API: GET /articles/:id/comments
}
```

**Why this matters:**
- Same scope doesn't mean unlimited composition
- Performance: 100+ items = slow response, large payload
- UX: Pagination needed for large lists

**Critical for reverse relationships:**
```typescript
// ❌ DISASTER: Seller with all their sales
interface IShoppingSeller {
  id: string;
  name: string;

  sales: IShoppingSale[];  // ❌❌❌ Could be 1000+ sales!
}

// ✅ CORRECT: Count + separate API
interface IShoppingSeller {
  id: string;
  name: string;

  sales_count: number;  // ✅ Just count
}

// GET /sellers/:id/sales → IPage<IShoppingSale.ISummary>
```

**Domain crossing makes it worse:**
```typescript
// shopping_sales → shopping_sellers (reference)
// But reverse would be catastrophic:

interface IShoppingSeller {
  sales: IShoppingSale[];  // ❌ Different domain + Large size = DISASTER
}
```

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
1. **Size explosion**: Seller might have 1000+ sales
2. **Different domains**: Sales and Sellers are separate business concepts
3. **Performance**: Loading all related entities is catastrophic
4. **Pagination**: Large lists need pagination, not composition

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
   │     │  └─ YES → Separate scope → Reference
   │     │  └─ NO → Continue (same scope)
   │     │
   │     ├─ Check FK direction
   │     │  ├─ Child → Parent FK → Continue
   │     │  └─ Parent → Child FK → Reference (lookup)
   │     │
   │     ├─ Analyze business usage
   │     │  ├─ Core data (always loaded)? → Continue
   │     │  └─ Auxiliary data (audit, history)? → Consider separate API
   │     │
   │     ├─ Check size & frequency
   │     │  ├─ < 20 items, always shown → Composition ✅
   │     │  ├─ 20-100 items, case by case → Carefully decide
   │     │  └─ > 100 items or rarely used → Count + Separate API ✅
   │     │
   │     └─ Final decision
   │        └─ Composition ✅ OR Separate API ✅
   │
   └─ Different hierarchy? (members, sellers, products)
      └─ Reference ✅
```

### Quick Lookup

| Pattern | Example | Rule | Result |
|---------|---------|------|--------|
| `parent_*` data | `snapshot_images` | Same scope + Small | ✅ Composition |
| `parent_*` concept | `article_comments` | Different scope | ❌ Reference |
| Actor | `author`, `creator` | Different domain | ❌ Reference |
| Actor reverse | `seller.sales[]` | Reverse + Large | ❌ Count + API |
| Category | `category`, `tags` | Different domain | ❌ Reference |
| Lookup | `article_statuses` | Reversed FK | ❌ Reference |
| Large collection | `comments` (100+) | Size limit | ❌ Count + API |
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

  // Composition: Same scope (sale's units - Depth 1)
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

### The 6 Essential Rules

1. **Table Name Hierarchy First**
   - Follow naming pattern: `parent_child_grandchild`
   - Same chain = Composition candidate
   - Different chains = Reference

2. **Scope Boundaries Matter**
   - Independent concepts = Separate scopes
   - `article_comments` is NOT part of `articles` scope
   - Cross-scope = Always Reference
   - **CRITICAL: Same scope ≠ Auto-composition** (analyze usage & size!)

3. **FK Direction Validates**
   - Child → Parent FK = Composition ✅
   - Parent → Child FK = Reference (lookup) ❌

4. **Actor/Category = Always Reference**
   - Users, Members, Customers, Sellers = Actors
   - Categories, Tags, Statuses = Classifications
   - Never compose reverse direction (Member with articles, Seller with sales)
   - Large collections (100+) = Count + separate API

5. **Size Limits Override Composition**
   - Even same scope: 100+ items = Separate API
   - Reverse relationships are especially dangerous
   - Count field + pagination endpoint instead
   - Example: seller.sales_count (NOT seller.sales[])

6. **IInvert for Back-References**
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

### ❌ Mistake 2: Actor Collections (Reverse Direction Explosion)

```typescript
// ❌ WRONG: User with articles array
interface IBbsMember {
  articles: IBbsArticle[];  // Could be 100+ articles!
}

// ❌ WRONG: Seller with sales array
interface IShoppingSeller {
  sales: IShoppingSale[];  // Could be 1000+ sales!
}
```

**Why wrong:**
- Reverse direction creates massive arrays
- Performance catastrophe (loading 1000+ nested objects)
- Different domains (Seller ≠ Sales scope)
- Needs pagination

**Fix:** Count + separate API

```typescript
// ✅ CORRECT
interface IBbsMember {
  id: string;
  nickname: string;
  articles_count: number;  // ✅ Count only
}

interface IShoppingSeller {
  id: string;
  name: string;
  sales_count: number;  // ✅ Count only
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
  images: IBbsArticleImage[];              // ✅ Same scope
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

### ❌ Mistake 5: Same Scope = Auto-Composition (Ignoring Size & Usage)

```typescript
// ❌ WRONG: Same scope but wrong decision
interface IBbsArticle {
  snapshots: IBbsArticleSnapshot[];  // Could be 100+ audit records!
}

interface IShoppingSale {
  reviews: IShoppingSaleReview[];  // Could be 1000+ reviews!
}
```

**Why wrong:**
- Same hierarchy/scope doesn't mean unlimited composition
- Must analyze: Expected size? Usage pattern? Business concept?
- Snapshots = audit trail (rarely viewed, potentially large)
- Reviews = user feedback (separate feature, large volume)

**Fix:** Analyze business concept and size

```typescript
// ✅ CORRECT: Same scope but separate API
interface IBbsArticle {
  id: string;
  title: string;

  snapshots_count: number;  // ✅ Count only
  // GET /articles/:id/snapshots → IPage<IBbsArticleSnapshot>
}

interface IShoppingSale {
  id: string;
  name: string;

  reviews_count: number;  // ✅ Count only
  average_rating: number; // ✅ Denormalized summary
  // GET /sales/:id/reviews → IPage<IShoppingSaleReview>
}
```

**Key insight:** Same scope requires careful analysis:
1. **Core vs Auxiliary**: Images (core) vs Snapshots (audit)
2. **Size expectations**: 5-10 items vs 100+ items
3. **Usage patterns**: Always shown vs separate tab/page
4. **Performance impact**: Acceptable query time?

---

## Checklist

### Before Creating DTOs

- [ ] **Identify root tables** (main entities: articles, orders, members)
- [ ] **Map hierarchy chains** (article → article_images, snapshot → snapshot_images/files)
- [ ] **Identify scope boundaries** (comments is separate from articles)
- [ ] **List actors** (author, creator, customer, seller)
- [ ] **List categories** (category, tags, status)

### For Each DTO

- [ ] **Check table name pattern** (`parent_child_*` = same scope)
- [ ] **Verify independence** (can it exist/operate alone?)
- [ ] **Validate FK direction** (child → parent = composition signal)
- [ ] **Analyze business concept** (core data vs auxiliary data like audit/history)
- [ ] **Check usage pattern** (always loaded together vs separate feature)
- [ ] **Estimate array size** (< 20 = composition, > 100 = separate API)
- [ ] **Performance check** (loading children acceptable in main query?)
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
2. **Respect scope boundaries** - Independent concepts (comments, orders) are separate scopes
3. **Analyze business concept & size** - Core data vs auxiliary data, expected record count
4. **Validate with FK direction** - Child→Parent FK confirms composition signal
5. **Use IInvert for back-references** - When child needs parent context

For detailed rules and examples, see INTERFACE_SCHEMA_COMPOSITION.md.

**Quick Reference:**
- Same scope + Core data + Small size (<20) = Composition
- Same scope + Auxiliary data + Large size (100+) = Separate API
- Different scope or Actor/Category = Reference
- Comments/Orders are separate scopes (not composition)
- Never compose reverse direction (User with articles array)
- Snapshots/Reviews/Audit trails = Usually separate API even if same scope
```

---

## Conclusion

**The hierarchy in table names is your primary guide.** Start there, validate with domain concepts and FK direction, then carefully analyze business usage and size.

**Core workflow:**
1. Identify table name hierarchy chains
2. Detect scope boundaries (independent concepts)
3. **Analyze business concept** (core vs auxiliary data)
4. **Check expected size & usage** (always loaded vs separate feature)
5. Validate with FK direction
6. Apply size limits and performance considerations
7. Use IInvert for reverse perspectives

**Critical insight:** Same scope does NOT mean automatic composition. You must:
- Understand the business concept (core data vs audit/history)
- Estimate typical record counts (5 items vs 500 items)
- Analyze usage patterns (always shown vs rarely accessed)
- Consider performance impact (query time, payload size)

This approach ensures DTOs are **practical, performant, and maintainable** while preventing infinite recursion, circular dependencies, and performance catastrophes.
