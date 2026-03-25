# 프롬프트 개정 제안 — 삽입 가능한 구체적 문안

이 문서는 각 프롬프트 변경에 대해 바로 통합 가능한 텍스트 블록을 제공한다. 각 블록은 기존 프롬프트의 스타일과 흐름에 자연스럽게 맞도록 설계되었다.

---

## 1. REALIZE_OPERATION_WRITE.md

### 1.1. §1 (실행 전략) 뒤에 삽입 — 새 §1.5

**근거**: "접근 전 셀렉트" 규칙이 전체 컴파일 오류의 50% 이상을 방지하지만 현재 §6.7에 묻혀 있다. 눈에 띄는 위치로 격상하면 모든 모델이 이를 조기에 접하게 된다.

```markdown
## 1.5. THE GOLDEN RULE — Select Before You Access

> **Every property you read from a Prisma query result must be explicitly selected.**

This is the single most important rule. Violating it causes `Property 'X' does not exist` — the most frequent compilation error (>50% of all failures).

Prisma returns **only** what you ask for. Unlike SQL `SELECT *`, Prisma with `select` returns **nothing** by default:

| What You Write | What Prisma Returns | What Fails |
|---------------|--------------------|-----------|
| `findFirst({ select: { id: true } })` | `{ id }` | `result.name` ❌, `result.author` ❌ |
| `findFirst({ select: { id: true, name: true, author: { select: { id: true } } } })` | `{ id, name, author: { id } }` | `result.author.email` ❌ |
| `findFirst({})` (no select) | All scalar columns | `result.author` ❌ (relations still excluded!) |

**Before writing `result.X` anywhere in your code, trace back to the query and confirm `X` is selected.**
```

### 1.2. §8.5 (데이터 변환 규칙)에 삽입 — DateTime 블록 뒤

**근거**: Null 체인 접근이 2위 오류 패턴이나 전용 예시가 없다.

```markdown
**CRITICAL — Deep nullable chain access**: When traversing relations that can be null, every step in the chain needs guarding. A single unguarded `.` on a nullable relation produces TS18047/TS18048.

```typescript
// ❌ ERROR: 'profile' is possibly 'null' (repeated 30+ times downstream)
const shopName = record.seller.profile.shop_name;

// ✅ CORRECT: Optional chaining with fallback
const shopName = record.seller.profile?.shop_name ?? null;

// ✅ CORRECT: Guard with early return when profile is required by DTO
if (!record.seller.profile) {
  throw new HttpException("Seller profile not found", 404);
}
const shopName = record.seller.profile.shop_name;  // Narrowed to non-null
```

**Pattern**: If the DTO declares `profile: ISellerProfile` (non-nullable) but the DB relation allows null, you MUST guard and throw — not silently pass null.
```

### 1.3. §8.1 (데이터베이스 스키마가 절대적 원천)에 삽입 — 경고 박스 추가

**근거**: LLM이 유령 컬럼을 가리키는 `@x-autobe-database-schema-property` 어노테이션을 신뢰한다.

```markdown
**WARNING — Phantom DTO Properties**: Some DTO fields have `@x-autobe-database-schema-property` annotations pointing to columns/relations that do NOT exist in the Prisma schema. This happens when the interface phase created computed/aggregated fields.

Before using any `@x-autobe-database-schema-property` value in a `select` or `where` clause, VERIFY it exists in the actual schema via `getDatabaseSchemas`.

Common phantom patterns:
- `vote_score` → Computed from votes relation (`_count` or `reduce`)
- `comment_count` → Computed: `_count.comments`
- `content_preview` → Computed: `content.substring(0, N)`
- `average_rating` → Computed: `reviews.reduce(...)` / `reviews.length`
- `owner` → May be named differently in schema (e.g., `creator`, `author`, `admin`)

When you find a phantom property, select the SOURCE RELATION and compute in the transform step.
```

---

## 2. REALIZE_TRANSFORMER_WRITE.md

### 2.1. §6.7 뒤에 삽입 — 새 §6.8

**근거**: 자기참조 transformer (댓글, 작업, 카테고리)가 `implicitly has return type 'any'` 오류를 발생시킨다. 현재 가이드 없음.

```markdown
### 6.8. Self-Referential Relations (Bounded Recursion)

When a model references itself (e.g., `comments.parent → comments`, `tasks.parentTask → tasks`, `categories.parent → categories`), calling `select()` recursively creates an infinite type.

```typescript
// ❌ ERROR: 'select' implicitly has return type 'any'
export function select() {
  return {
    select: {
      id: true,
      content: true,
      parent: CommentTransformer.select(),  // Infinite recursion!
    },
  } satisfies Prisma.commentsFindManyArgs;
}
```

**Solution**: Inline the self-reference with bounded depth (2-3 levels max).

```typescript
// ✅ CORRECT: Bounded to 2 levels of nesting
export function select() {
  return {
    select: {
      id: true,
      content: true,
      created_at: true,
      author: AuthorAtSummaryTransformer.select(),
      parent: {
        select: {
          id: true,
          content: true,
          created_at: true,
          author: AuthorAtSummaryTransformer.select(),
          // Stop recursion here — grandparent gets ID only
          parent: { select: { id: true } } satisfies Prisma.commentsFindManyArgs,
        },
      } satisfies Prisma.commentsFindManyArgs,
    },
  } satisfies Prisma.commentsFindManyArgs;
}

export async function transform(input: Payload): Promise<IComment> {
  return {
    id: input.id,
    content: input.content,
    created_at: input.created_at.toISOString(),
    author: await AuthorAtSummaryTransformer.transform(input.author),
    parent: input.parent ? {
      id: input.parent.id,
      content: input.parent.content,
      created_at: input.parent.created_at.toISOString(),
      author: await AuthorAtSummaryTransformer.transform(input.parent.author),
      parent: input.parent.parent ? {
        id: input.parent.parent.id,
      } satisfies Pick<IComment, 'id'> : null,
    } satisfies IComment : null,
  };
}
```

**Key rules**:
- Max 2-3 levels of self-reference
- Reuse neighbor transformers (e.g., `AuthorAtSummaryTransformer`) at every level
- Deepest level selects only `id` (or whatever the DTO requires as minimum)
- Use `satisfies` on every nested inline to catch mismatches early
```

---

## 3. REALIZE_OPERATION_CORRECT.md

### 3.1. §1 뒤에 삽입 — 새 §1.5

**근거**: 50개 이상의 오류가 동일할 때, LLM이 압도되지 않도록 트리아지 가이드 필요.

```markdown
## 1.5. Error Triage — Group Before You Fix

Before addressing individual errors, scan the entire error list and GROUP:

**Step 1: Count duplicates**
If you see `Property 'X' does not exist` repeated N times:
- N > 5 → Almost certainly ONE missing `select`/`include`. Fix the query, all N errors resolve.
- N = 1-2 → Likely a typo or wrong field name.

**Step 2: Identify the source query**
Trace from the error location back to the Prisma query that produced the object. The `select` clause on THAT query is where the fix belongs.

**Step 3: Fix root causes first**
A single missing `author` in a `select` clause can produce 20+ errors downstream (every `record.author.X` access). Adding `author: { select: { id: true, name: true, ... } }` to the query eliminates all of them at once.

**Never patch errors individually when they share a root cause.**
```

### 3.2. §4.9 뒤에 삽입 — 새 §4.10

**근거**: LLM이 코드로 자연어를 출력하는 것을 방지.

```markdown
### 4.10. Code Purity — No Reasoning in Output

The `draft` and `revise.final` fields MUST contain only valid TypeScript.

```typescript
// ✅ ALLOWED — TypeScript comment
// TODO: verify ownership before update

// ❌ FORBIDDEN — bare natural language
Need to check the schema structure for this table.
Let me analyze the error and find the correct field name.

// ❌ FORBIDDEN — markdown in code
## Analysis
The moderation_roles table references member_id...
```

If you cannot determine the correct implementation, use:
```typescript
// Cannot implement: [brief reason]
return typia.random<IResponse>();
```

Never output explanatory text outside of `//` comments.
```

---

## 4. REALIZE_COLLECTOR_CORRECT.md & REALIZE_TRANSFORMER_CORRECT.md

### 4.1. 동일한 §1.5 트리아지 및 §4.10 코드 순수성 섹션 추가

REALIZE_OPERATION_CORRECT.md와 동일한 오류 트리아지 및 코드 순수성 규칙을 받아야 하며, 각각의 맥락에 맞게 조정 (collector는 `CreateInput`, transformer는 `FindManyArgs` 사용).

---

## 5. INTERFACE_SCHEMA.md (상류)

### 5.1. 계산 필드 어노테이션 가이드 추가

**근거**: Interface 단계에서 더 나은 어노테이션이 realize 단계 오류의 20%를 방지할 수 있다.

```markdown
### Computed vs Stored Fields

When defining a DTO property that is NOT a direct database column, explicitly indicate the computation source:

**Stored field** (direct column):
```typescript
/**
 * @x-autobe-database-schema-property created_at
 * @x-autobe-specification Direct mapping from DateTime column
 */
created_at: string & Format<"date-time">;
```

**Computed field** (derived from relation):
```typescript
/**
 * @x-autobe-database-schema-property reviews
 * @x-autobe-specification Computed: count of reviews relation via _count.reviews
 */
review_count: number & Type<"uint32">;
```

**Aggregated field** (calculated from relation data):
```typescript
/**
 * @x-autobe-database-schema-property reviews
 * @x-autobe-specification Computed: average of reviews.rating via reduce
 */
average_rating: number;
```

The `@x-autobe-database-schema-property` for computed fields should point to the SOURCE RELATION, not a phantom column name. This guides the realize phase to select the correct relation.
```

---

## 6. 추가 갭 (심층 프롬프트 리뷰)

### 6.1. 모든 Realize 프롬프트 — Nullable BelongsTo 패턴

```markdown
### Nullable BelongsTo Relations

When a FK is nullable (e.g., `parent_id String? @db.Uuid`), the relation object itself can be `null`:

```typescript
// ❌ ERROR: 'parent' is possibly 'null'
const parentName = input.parent.name;

// ✅ CORRECT: Guard before access
const parentName = input.parent?.name ?? null;

// ✅ CORRECT: For DTO fields requiring non-null
parent: input.parent ? {
  id: input.parent.id,
  name: input.parent.name,
} satisfies IParent.ISummary : null,
```
```

### 6.2. REALIZE_OPERATION_WRITE — 소프트 삭제 리마인더

```markdown
### Soft-Delete Filtering

Tables with `deleted_at` columns use soft-delete. ALWAYS include `deleted_at: null` in
where clauses unless you specifically need deleted records:

```typescript
// ✅ All active record queries
const items = await MyGlobal.prisma.products.findMany({
  where: { deleted_at: null, ...otherFilters },
});

// ✅ Single record lookup (even by ID, the record might be soft-deleted)
const item = await MyGlobal.prisma.products.findFirstOrThrow({
  where: { id: props.productId, deleted_at: null },
});
```
```

### 6.3. REALIZE_COLLECTOR_WRITE — 스칼라 전용 경고 격상

현재 섹션 10의 릴레이션 접근 경고를 최상위 규칙으로 격상해야 한다:

```markdown
### Queries Inside Collectors Return Scalars Only

When you query a related record inside a collector, you can ONLY access scalar columns
and FK columns — NOT relation properties:

```typescript
const variant = await MyGlobal.prisma.product_variants.findFirstOrThrow({
  where: { id: props.body.variantId },
});

// ✅ OK: FK columns are scalars
const productId = variant.shopping_mall_product_id;

// ❌ ERROR: 'product' is a relation, not selected
const productName = variant.product.name;  // TS2339!
```
```

---

## 구현 우선순위

| 우선순위 | 변경 | 효과 | 노력 |
|---------|------|------|------|
| P0 | §1.1 — REALIZE_OPERATION_WRITE의 황금 규칙 | 전체 오류의 55% 방지 | 낮음 (텍스트 추가) |
| P0 | §3.1 — REALIZE_OPERATION_CORRECT의 오류 트리아지 | 고오류 케이스에서 교정 루프 처리 가능 | 낮음 (텍스트 추가) |
| P1 | §1.3 — 유령 DTO 프로퍼티 경고 | 전체 오류의 20% 방지 | 낮음 (텍스트 추가) |
| P1 | §2.1 — 자기참조 transformer 가이드 | 재귀 오류 방지 | 중간 (새 섹션) |
| P1 | §3.2 — 코드 순수성 금지 | 사고과정-코드화 방지 | 낮음 (텍스트 추가) |
| P2 | §1.2 — 깊은 nullable 체인 예시 | 전체 오류의 12% 방지 | 낮음 (예시 추가) |
| P2 | §5.1 — Interface 스키마 계산 필드 어노테이션 | 상류 수정, 장기적 효과 | 중간 (interface 프롬프트 변경 필요) |
| P3 | 아키텍처: 오케스트레이터의 오류 중복 제거 | 교정 루프 과부하 방지 | 중간 (코드 변경) |
| P3 | 아키텍처: 사전 교정 기계적 select 수정 | 전체 오류의 50%를 기계적으로 방지 | 높음 (신규 코드) |
