# qwen/qwen3.5-397b-a17b 모델 Realize 단계 컴파일 오류 진단서

## 개요

| 시나리오 | 오류 파일 수 | 핵심 원인 |
|----------|------------|----------|
| reddit | 2 | Transformer `select()` 함수의 재귀적 자기참조로 인한 TypeScript 순환 타입 추론 실패 |
| shopping | 1 | Prisma `select` 객체에서 릴레이션 프로퍼티명을 스키마와 다르게 사용 |
| erp | 1 | 유한 깊이 `select()`와 무한 재귀 `transform()` 간의 타입 구조 불일치 |

---

## 1. Reddit 시나리오 (오류 파일 2개)

### 1-1. `src/transformers/RedditCloneCommentAtSummaryTransformer.ts`

**파일 경로**: `test/results/qwen/qwen3.5-397b-a17b/reddit/realize/src/transformers/RedditCloneCommentAtSummaryTransformer.ts`

#### 컴파일 에러 메시지

```
TS2742: 'select' implicitly has return type 'any' because it does not have a return type annotation
and is referenced directly or indirectly in one of its return expressions.

TS2339: Property 'member' does not exist on type '{ id: string; created_at: Date; updated_at: Date;
deleted_at: Date | null; reddit_clone_post_id: string; body: string; reddit_clone_member_id: string;
parent_comment_id: string | null; }'.

TS2339: Property 'post' does not exist on type '...' (동일 타입)
TS2339: Property 'parent' does not exist on type '...' (동일 타입, 2회)
TS2339: Property 'children' does not exist on type '...' (동일 타입)
```

#### DB 스키마

```prisma
model reddit_clone_comments {
  //----
  // COLUMNS
  //----
  /// Primary Key.
  id String @id @db.Uuid

  /// Author member's {@link reddit_clone_members.id}.
  reddit_clone_member_id String @db.Uuid

  /// Belonged post's {@link reddit_clone_posts.id}.
  reddit_clone_post_id String @db.Uuid

  /// Parent comment's {@link reddit_clone_comments.id} for threaded replies.
  /// Null for top-level comments.
  parent_comment_id String? @db.Uuid

  /// Comment content text.
  body String

  /// Comment creation timestamp.
  created_at DateTime @db.Timestamptz

  /// Last modification timestamp for edit tracking.
  updated_at DateTime @db.Timestamptz

  /// Soft deletion timestamp. Null means active comment.
  deleted_at DateTime? @db.Timestamptz

  //----
  // BELONGED RELATIONS
  //----
  member reddit_clone_members @relation(fields: [reddit_clone_member_id], references: [id], onDelete: Cascade)
  post reddit_clone_posts @relation(fields: [reddit_clone_post_id], references: [id], onDelete: Cascade)
  parent reddit_clone_comments? @relation("recursive", fields: [parent_comment_id], references: [id], onDelete: Cascade)

  //----
  // HAS RELATIONS
  //----
  children reddit_clone_comments[] @relation("recursive")
  snapshots reddit_clone_comment_snapshots[] @relation("reddit_clone_comment_snapshots_of_reddit_clone_comment_id")
  childCommentSnapshots reddit_clone_comment_snapshots[] @relation("reddit_clone_comment_snapshots_of_parent_comment_id")
  reports reddit_clone_report_of_comments[]

  //----
  // INDEXES
  //----
  @@index([reddit_clone_post_id, created_at])
  @@index([parent_comment_id])
  @@index([reddit_clone_member_id, created_at])
  @@index([body(ops: raw("gin_trgm_ops"))], type: Gin)
}
```

#### API DTO 스펙 (`IRedditCloneComment.ISummary`)

```typescript
export type ISummary = {
  id: string & tags.Format<"uuid">;
  body: string;
  author: IRedditCloneMember.ISummary;
  post: IRedditClonePost.ISummary;
  parent: IRedditCloneComment.ISummary | null;
  vote_score: number & tags.Type<"int32">;
  reply_count: number & tags.Type<"int32">;
  created_at: string & tags.Format<"date-time">;
};
```

#### 문제의 코드

```typescript
export namespace RedditCloneCommentAtSummaryTransformer {
  export type Payload = Prisma.reddit_clone_commentsGetPayload<
    ReturnType<typeof select>
  >;
  export function select() {
    return {
      select: {
        id: true,
        body: true,
        created_at: true,
        member: RedditCloneMemberAtSummaryTransformer.select(),
        post: RedditClonePostAtSummaryTransformer.select(),
        parent: RedditCloneCommentAtSummaryTransformer.select(),  // <-- 자기 자신 호출!
        children: {
          select: {
            id: true,
            deleted_at: true,
          },
        } satisfies Prisma.reddit_clone_commentsFindManyArgs,
      },
    } satisfies Prisma.reddit_clone_commentsFindManyArgs;
  }
  export async function transform(
    input: Payload,
  ): Promise<IRedditCloneComment.ISummary> {
    return {
      id: input.id,
      body: input.body,
      author: await RedditCloneMemberAtSummaryTransformer.transform(
        input.member,    // TS2339: Property 'member' does not exist
      ),
      post: await RedditClonePostAtSummaryTransformer.transform(input.post),    // TS2339
      parent: input.parent                                                       // TS2339
        ? await RedditCloneCommentAtSummaryTransformer.transform(input.parent)
        : null,
      vote_score: 0,
      reply_count: input.children.filter(                                        // TS2339
        (c: { id: string; deleted_at: Date | null }) => c.deleted_at === null,
      ).length,
      created_at: toISOStringSafe(input.created_at),
    };
  }
}
```

#### 오류 원인 분석

**근본 원인: `select()` 함수의 재귀적 자기참조에 의한 순환 타입 추론 실패**

`select()` 함수가 26행에서 `RedditCloneCommentAtSummaryTransformer.select()`를 호출하여 자기 자신을 재귀 참조한다. TypeScript 컴파일러는 함수의 반환 타입을 추론할 때 순환 참조를 만나면 타입 추론을 포기하고 `any`로 폴백한다.

이로 인한 연쇄 효과:

1. `select()` 반환 타입이 `any`로 추론됨 (TS2742)
2. `Payload` 타입이 `Prisma.reddit_clone_commentsGetPayload<any>`로 해석됨
3. `GetPayload<any>`는 `select` 옵션이 지정되지 않은 것으로 간주하여, 릴레이션 필드(`member`, `post`, `parent`, `children`)를 포함하지 않는 기본 스칼라 컬럼만 반환
4. `transform()` 함수에서 `input.member`, `input.post`, `input.parent`, `input.children`에 접근하면 모두 TS2339 발생

또한 이 코드는 런타임에서도 `select()` -> `select()` -> `select()` -> ...로 무한 재귀 호출되어 **스택 오버플로우**를 유발한다. 컴파일 오류 이전에 설계 자체가 잘못된 것이다.

#### 올바른 코드

```typescript
export namespace RedditCloneCommentAtSummaryTransformer {
  export type Payload = Prisma.reddit_clone_commentsGetPayload<
    ReturnType<typeof select>
  >;
  export function select() {
    return {
      select: {
        id: true,
        body: true,
        created_at: true,
        member: RedditCloneMemberAtSummaryTransformer.select(),
        post: RedditClonePostAtSummaryTransformer.select(),
        parent: {
          select: {
            id: true,
            body: true,
            created_at: true,
            // 재귀를 1단계로 제한: parent의 parent는 포함하지 않음
          },
        },
        children: {
          select: {
            id: true,
            deleted_at: true,
          },
        } satisfies Prisma.reddit_clone_commentsFindManyArgs,
      },
    } satisfies Prisma.reddit_clone_commentsFindManyArgs;
  }
  export async function transform(
    input: Payload,
  ): Promise<IRedditCloneComment.ISummary> {
    return {
      id: input.id,
      body: input.body,
      author: await RedditCloneMemberAtSummaryTransformer.transform(input.member),
      post: await RedditClonePostAtSummaryTransformer.transform(input.post),
      parent: input.parent
        ? {
            id: input.parent.id,
            body: input.parent.body,
            author: null as any,  // 1단계 제한으로 인해 별도 조회 필요
            post: null as any,
            parent: null,
            vote_score: 0,
            reply_count: 0,
            created_at: input.parent.created_at.toISOString(),
          }
        : null,
      vote_score: 0,
      reply_count: input.children.filter(
        (c) => c.deleted_at === null,
      ).length,
      created_at: toISOStringSafe(input.created_at),
    };
  }
}
```

#### 권고 조치사항

- `select()` 함수에서 자기 자신의 `select()`를 절대 호출하지 않아야 한다. 재귀가 필요한 경우 인라인으로 필요한 필드만 직접 명시하고 깊이를 1단계로 제한해야 한다.
- `transform()` 함수에서도 자기 자신을 재귀 호출하지 않고, 각 단계별로 직접 매핑해야 한다.

---

### 1-2. `src/transformers/RedditCloneCommentTransformer.ts`

**파일 경로**: `test/results/qwen/qwen3.5-397b-a17b/reddit/realize/src/transformers/RedditCloneCommentTransformer.ts`

#### 컴파일 에러 메시지

```
TS2742: 'select' implicitly has return type 'any' because it does not have a return type annotation
and is referenced directly or indirectly in one of its return expressions.

TS2339: Property 'post' does not exist on type '...' (10회 반복)
TS2339: Property 'member' does not exist on type '...'
TS2339: Property 'parent' does not exist on type '...' (2회)
TS2339: Property 'children' does not exist on type '...'
```

#### DB 스키마

상기 1-1과 동일한 `reddit_clone_comments` 모델 참조.

#### API DTO 스펙 (`IRedditCloneComment`)

```typescript
export type IRedditCloneComment = {
  id: string & tags.Format<"uuid">;
  body: string;
  author: IRedditCloneMember.ISummary;
  post: IRedditClonePost.ISummary;
  parent: IRedditCloneComment.ISummary | null;
  children: IRedditCloneComment[];
  vote_score: number & tags.Type<"int32">;
  created_at: string & tags.Format<"date-time">;
  updated_at: string & tags.Format<"date-time">;
  deleted_at: (string & tags.Format<"date-time">) | null;
};
```

#### 문제의 코드

```typescript
export namespace RedditCloneCommentTransformer {
  export type Payload = Prisma.reddit_clone_commentsGetPayload<
    ReturnType<typeof select>
  >;
  export function select() {
    return {
      select: {
        id: true,
        body: true,
        created_at: true,
        updated_at: true,
        deleted_at: true,
        member: RedditCloneMemberAtSummaryTransformer.select(),
        post: {
          select: {
            id: true,
            title: true,
            post_type: true,
            created_at: true,
            member: RedditCloneMemberAtSummaryTransformer.select(),
            community: {
              select: {
                id: true,
                name: true,
                description: true,
                icon: true,
                subscriber_count: true,
                created_at: true,
                owner: RedditCloneMemberAtSummaryTransformer.select(),
              },
            } satisfies Prisma.reddit_clone_communitiesFindManyArgs,
            text: {
              select: { body: true },
            } satisfies Prisma.reddit_clone_post_textsFindManyArgs,
            link: {
              select: { url: true },
            } satisfies Prisma.reddit_clone_post_linksFindManyArgs,
            postImage: {
              select: { id: true },
            } satisfies Prisma.reddit_clone_post_imagesFindManyArgs,
            comments: {
              select: { id: true },
            } satisfies Prisma.reddit_clone_commentsFindManyArgs,
          },
        } satisfies Prisma.reddit_clone_postsFindManyArgs,
        parent: RedditCloneCommentAtSummaryTransformer.select(),   // 간접 재귀!
        children: RedditCloneCommentTransformer.select(),           // 직접 재귀!
      },
    } satisfies Prisma.reddit_clone_commentsFindManyArgs;
  }
  export async function transform(
    input: Payload,
  ): Promise<IRedditCloneComment> {
    const postPreview = (() => {
      switch (input.post.post_type) {           // TS2339: Property 'post' does not exist
        case "TEXT":
          return input.post.text?.body?.substring(0, 200) ?? "";
        case "LINK":
          return input.post.link?.url
            ? new URL(input.post.link.url).hostname
            : "";
        case "IMAGE":
          return input.post.postImage?.id ?? "";
        default:
          return "";
      }
    })();
    return {
      id: input.id,
      body: input.body,
      author: await RedditCloneMemberAtSummaryTransformer.transform(
        input.member,                            // TS2339
      ),
      post: {
        id: input.post.id,                      // TS2339 (반복)
        title: input.post.title,
        post_type: input.post.post_type,
        author: await RedditCloneMemberAtSummaryTransformer.transform(
          input.post.member,
        ),
        community: await RedditCloneCommunityAtSummaryTransformer.transform(
          input.post.community,
        ),
        vote_score: 0,
        comment_count: input.post.comments.length,
        created_at: input.post.created_at.toISOString(),
        preview: postPreview,
      } satisfies IRedditClonePost.ISummary,
      parent: input.parent                       // TS2339
        ? await RedditCloneCommentAtSummaryTransformer.transform(input.parent)
        : null,
      children: await ArrayUtil.asyncMap(
        input.children,                          // TS2339
        RedditCloneCommentTransformer.transform,
      ),
      vote_score: 0,
      created_at: input.created_at.toISOString(),
      updated_at: input.updated_at.toISOString(),
      deleted_at: input.deleted_at?.toISOString() ?? null,
    };
  }
}
```

#### 오류 원인 분석

**근본 원인: 이중 재귀 참조에 의한 순환 타입 추론 실패**

이 파일은 1-1보다 더 심각한 **이중 재귀 참조** 문제를 가지고 있다:

1. **직접 재귀**: 69행의 `children: RedditCloneCommentTransformer.select()` -- 자기 자신 직접 호출
2. **간접 재귀**: 68행의 `parent: RedditCloneCommentAtSummaryTransformer.select()` -- 이 함수도 내부에서 `RedditCloneCommentAtSummaryTransformer.select()`를 자기참조하는 재귀 함수 (1-1에서 분석한 파일)

TypeScript가 `select()` 반환 타입을 추론하는 과정에서 무한 순환을 감지하고 `any`로 폴백한다. 결과적으로 `Payload` 타입이 릴레이션 필드를 포함하지 않는 스칼라 전용 타입이 되어, `transform()` 함수에서 `input.post`, `input.member`, `input.parent`, `input.children` 모두 접근 불가.

특히 `children: RedditCloneCommentTransformer.select()`는 **런타임에서도 `select()` -> `select()` -> `select()` -> ... 무한 재귀를 유발**하여 즉시 스택 오버플로우가 발생한다. 컴파일 오류 이전에 근본적 설계 결함이다.

#### 올바른 코드

```typescript
export function select() {
  return {
    select: {
      id: true,
      body: true,
      created_at: true,
      updated_at: true,
      deleted_at: true,
      member: RedditCloneMemberAtSummaryTransformer.select(),
      post: {
        select: {
          id: true,
          title: true,
          post_type: true,
          created_at: true,
          member: RedditCloneMemberAtSummaryTransformer.select(),
          community: {
            select: {
              id: true,
              name: true,
              description: true,
              icon: true,
              subscriber_count: true,
              created_at: true,
              owner: RedditCloneMemberAtSummaryTransformer.select(),
            },
          } satisfies Prisma.reddit_clone_communitiesFindManyArgs,
          text: {
            select: { body: true },
          } satisfies Prisma.reddit_clone_post_textsFindManyArgs,
          link: {
            select: { url: true },
          } satisfies Prisma.reddit_clone_post_linksFindManyArgs,
          postImage: {
            select: { id: true },
          } satisfies Prisma.reddit_clone_post_imagesFindManyArgs,
          comments: {
            select: { id: true },
          } satisfies Prisma.reddit_clone_commentsFindManyArgs,
        },
      } satisfies Prisma.reddit_clone_postsFindManyArgs,
      parent: {
        select: {
          id: true,
          body: true,
          created_at: true,
          // parent의 parent는 포함하지 않음 (1단계 제한)
        },
      },
      children: {
        select: {
          id: true,
          body: true,
          created_at: true,
          updated_at: true,
          deleted_at: true,
          // children의 children은 포함하지 않음 (1단계 제한)
        },
      },
    },
  } satisfies Prisma.reddit_clone_commentsFindManyArgs;
}
```

`transform()` 함수에서도 재귀 호출(`RedditCloneCommentTransformer.transform`, `RedditCloneCommentAtSummaryTransformer.transform`)을 제거하고 각 단계별로 인라인 매핑을 해야 한다.

#### 권고 조치사항

- `select()`에서 직접/간접적으로 자기 자신을 호출하는 재귀 패턴을 완전히 제거해야 한다.
- `children` 및 `parent`는 인라인으로 필요한 필드만 직접 명시하고 깊이를 1단계로 제한해야 한다.
- `transform()`에서도 재귀 호출 대신 직접 매핑 코드를 작성해야 한다.

---

## 2. Shopping 시나리오 (오류 파일 1개)

### 2-1. `src/providers/patchShoppingMallSellerOrdersItems.ts`

**파일 경로**: `test/results/qwen/qwen3.5-397b-a17b/shopping/realize/src/providers/patchShoppingMallSellerOrdersItems.ts`

#### 컴파일 에러 메시지

```
TS2353: Object literal may only specify known properties, and 'order_items' does not exist
in type 'shopping_mall_ordersSelect<DefaultArgs>'.

TS2353: Object literal may only specify known properties, and 'seller' does not exist
in type 'shopping_mall_product_snapshotsSelect<DefaultArgs>'.

TS2339: Property 'order' does not exist on type '{ id: string; created_at: Date; updated_at: Date;
deleted_at: Date | null; shopping_mall_order_id: string; shopping_mall_product_variant_id: string;
shopping_mall_product_snapshot_id: string; shopping_mall_product_variant_snapshot_id: string;
shopping_mall_seller_id: string; quantity: number; unit_price: number; status: string; }'. (5회)

TS2339: Property 'productSnapshot' does not exist on type '...' (27회)
TS2339: Property 'productVariantSnapshot' does not exist on type '...' (6회)
TS2339: Property 'seller' does not exist on type '...' (16회)
```

#### DB 스키마

**`shopping_mall_orders` 모델:**

```prisma
model shopping_mall_orders {
  //----
  // COLUMNS
  //----
  id                        String   @id @db.Uuid
  customer_id               String   @db.Uuid
  order_number              String
  total_price               Float    @db.DoublePrecision
  shipping_address_snapshot String
  created_at                DateTime @db.Timestamptz
  updated_at                DateTime @db.Timestamptz
  deleted_at                DateTime? @db.Timestamptz

  //----
  // BELONGED RELATIONS
  //----
  customer shopping_mall_customers @relation(fields: [customer_id], references: [id], onDelete: Cascade)

  //----
  // HAS RELATIONS
  //----
  items shopping_mall_order_items[]      // <-- 릴레이션 이름: "items"
  shipments shopping_mall_shipments[]

  //----
  // INDEXES
  //----
  @@unique([order_number])
  @@index([customer_id, created_at])
}
```

**`shopping_mall_order_items` 모델:**

```prisma
model shopping_mall_order_items {
  //----
  // COLUMNS
  //----
  id                                      String   @id @db.Uuid
  shopping_mall_order_id                   String   @db.Uuid
  shopping_mall_product_variant_id         String   @db.Uuid
  shopping_mall_product_snapshot_id        String   @db.Uuid
  shopping_mall_product_variant_snapshot_id String  @db.Uuid
  shopping_mall_seller_id                  String   @db.Uuid
  quantity                                 Int      @db.Integer
  unit_price                               Float    @db.DoublePrecision
  status                                   String
  created_at                               DateTime @db.Timestamptz
  updated_at                               DateTime @db.Timestamptz
  deleted_at                               DateTime? @db.Timestamptz

  //----
  // BELONGED RELATIONS
  //----
  order                 shopping_mall_orders                    @relation(fields: [shopping_mall_order_id], references: [id], onDelete: Cascade)
  productVariant        shopping_mall_product_variants          @relation(...)
  productSnapshot       shopping_mall_product_snapshots         @relation(...)
  productVariantSnapshot shopping_mall_product_variant_snapshots @relation(...)
  seller                shopping_mall_sellers                   @relation(...)

  //----
  // HAS RELATIONS
  //----
  shipmentItem shopping_mall_shipment_items?
  review shopping_mall_reviews?
  cancellationRequests shopping_mall_cancellation_requests[]
  refundRequest shopping_mall_refund_requests?
  refundRequestSnapshots shopping_mall_refund_request_snapshots[]
}
```

**`shopping_mall_product_snapshots` 모델:**

```prisma
model shopping_mall_product_snapshots {
  //----
  // COLUMNS
  //----
  id                       String   @id @db.Uuid
  shopping_mall_product_id  String   @db.Uuid
  shopping_mall_category_id String   @db.Uuid
  shopping_mall_seller_id   String   @db.Uuid
  name                      String
  description               String
  base_price                Float    @db.DoublePrecision
  snapshot_at               DateTime @db.Timestamptz
  created_at                DateTime @db.Timestamptz

  //----
  // BELONGED RELATIONS
  //----
  product    shopping_mall_products    @relation(fields: [shopping_mall_product_id], references: [id], onDelete: Cascade)
  category   shopping_mall_categories  @relation(fields: [shopping_mall_category_id], references: [id], onDelete: Cascade)
  snapshotBy shopping_mall_sellers     @relation(fields: [shopping_mall_seller_id], references: [id], onDelete: Cascade)
  //         ^^^^^^^^^^
  //         릴레이션 이름은 "snapshotBy" (NOT "seller")

  //----
  // HAS RELATIONS
  //----
  images          shopping_mall_product_snapshot_images[]
  variantSnapshots shopping_mall_product_variant_snapshots[]
  orderItems      shopping_mall_order_items[]
}
```

#### API DTO 스펙 (`IShoppingMallOrderItem.ISummary`)

```typescript
export type ISummary = {
  id: string & tags.Format<"uuid">;
  quantity: number & tags.Type<"int32"> & tags.Minimum<1>;
  unit_price: number & tags.Minimum<0>;
  status: "PAID" | "SHIPPED" | "DELIVERED" | "CANCELLED" | "REFUNDED";
  order: IShoppingMallOrder.ISummary;
  productSnapshot: IShoppingMallProductSnapshot.ISummary;
  productVariantSnapshot: IShoppingMallProductVariantSnapshot.ISummary;
  seller: IShoppingMallSeller.ISummary;
  created_at: string & tags.Format<"date-time">;
};
```

#### 문제의 코드

```typescript
const data = await MyGlobal.prisma.shopping_mall_order_items.findMany({
  where: whereInput,
  skip,
  take: limit,
  orderBy: orderByInput,
  select: {
    id: true,
    quantity: true,
    unit_price: true,
    status: true,
    created_at: true,
    order: {                             // (A) 릴레이션 이름 올바름
      select: {
        id: true,
        order_number: true,
        total_price: true,
        created_at: true,
        order_items: {                   // (B) 잘못된 이름! 실제: "items"
          select: { status: true },
        },
      },
    },
    productSnapshot: {                   // (C) 릴레이션 이름 올바름
      select: {
        id: true,
        name: true,
        base_price: true,
        snapshot_at: true,
        seller: {                        // (D) 잘못된 이름! 실제: "snapshotBy"
          select: {
            id: true,
            email: true,
            shop_name: true,
            shop_description: true,
            logo_image_url: true,
            approval_status: true,
            suspended: true,
            created_at: true,
            approvedByAdmin: {
              select: {
                id: true,
                email: true,
                grade: true,
                created_at: true,
                updated_at: true,
                deleted_at: true,
              },
            },
          },
        },
        category: {
          select: {
            id: true,
            name: true,
            description: true,
            created_at: true,
          },
        },
      },
    },
    productVariantSnapshot: {
      select: {
        id: true,
        sku_code: true,
        option_values: true,
        price: true,
        stock_quantity: true,
        snapshot_at: true,
      },
    },
    seller: {
      select: {
        id: true,
        email: true,
        shop_name: true,
        shop_description: true,
        logo_image_url: true,
        approval_status: true,
        suspended: true,
        created_at: true,
        approvedByAdmin: {
          select: {
            id: true,
            email: true,
            grade: true,
            created_at: true,
            updated_at: true,
            deleted_at: true,
          },
        },
      },
    },
  },
});
```

이후 transform 매핑에서:

```typescript
return {
  // ...
  data: data.map((item) => {
    const orderStatus = computeOrderStatus(item.order.order_items);  // TS2339
    return {
      id: item.id,
      // ...
      order: {
        id: item.order.id,                          // TS2339
        orderNumber: item.order.order_number,
        totalPrice: item.order.total_price,
        createdAt: toISOStringSafe(item.order.created_at),
        status: orderStatus,
      },
      productSnapshot: {
        id: item.productSnapshot.id,                // TS2339
        name: item.productSnapshot.name,
        base_price: item.productSnapshot.base_price,
        snapshot_at: toISOStringSafe(item.productSnapshot.snapshot_at),
        seller: {
          id: item.productSnapshot.seller.id,       // TS2339
          // ...
        },
        // ...
      },
      productVariantSnapshot: {
        id: item.productVariantSnapshot.id,          // TS2339
        // ...
      },
      seller: {
        id: item.seller.id,                          // TS2339
        // ...
      },
    };
  }),
};
```

#### 오류 원인 분석

**근본 원인: Prisma 릴레이션 프로퍼티명 불일치 2건**

| 위치 | 코드에서 사용한 이름 | Prisma 스키마의 실제 이름 | 설명 |
|------|---------------------|-------------------------|------|
| `shopping_mall_orders` 내부 | `order_items` | `items` | LLM이 FK 컬럼명(`shopping_mall_order_id`)에서 유추하여 `order_items`로 추측했으나, 실제 Prisma 스키마에서는 `items`로 정의됨 |
| `shopping_mall_product_snapshots` 내부 | `seller` | `snapshotBy` | LLM이 FK 컬럼명(`shopping_mall_seller_id`)에서 유추하여 `seller`로 추측했으나, 실제 Prisma 스키마에서는 `snapshotBy`로 정의됨 |

**연쇄 효과 메커니즘:**

1. `order_items`가 `shopping_mall_ordersSelect<DefaultArgs>`에 존재하지 않음 (TS2353) -> `order` 서브쿼리의 select 전체가 타입 검사를 통과하지 못함 -> Prisma가 select 옵션을 무효로 처리 -> `item.order`가 릴레이션 없는 스칼라 타입만 반환
2. `seller`가 `shopping_mall_product_snapshotsSelect<DefaultArgs>`에 존재하지 않음 (TS2353) -> `productSnapshot` 서브쿼리의 select 전체가 무효화 -> `item.productSnapshot`이 스칼라 타입만 반환
3. 두 개의 TS2353 오류로 인해 전체 `select` 객체가 유효하지 않은 것으로 간주되어, Prisma 결과 타입이 기본 스칼라 전용으로 폴백 -> `item.order`, `item.productSnapshot`, `item.productVariantSnapshot`, `item.seller` 등 **모든 릴레이션 접근**에서 TS2339 오류가 연쇄 발생 (총 54회)

#### 올바른 코드

핵심 수정 사항 2건:

```typescript
// 수정 1: order_items -> items
order: {
  select: {
    id: true,
    order_number: true,
    total_price: true,
    created_at: true,
    items: {                    // "order_items" -> "items"
      select: { status: true },
    },
  },
},

// 수정 2: seller -> snapshotBy
productSnapshot: {
  select: {
    id: true,
    name: true,
    base_price: true,
    snapshot_at: true,
    snapshotBy: {               // "seller" -> "snapshotBy"
      select: {
        id: true,
        email: true,
        shop_name: true,
        shop_description: true,
        logo_image_url: true,
        approval_status: true,
        suspended: true,
        created_at: true,
        approvedByAdmin: {
          select: {
            id: true,
            email: true,
            grade: true,
            created_at: true,
            updated_at: true,
            deleted_at: true,
          },
        },
      },
    },
    category: {
      select: {
        id: true,
        name: true,
        description: true,
        created_at: true,
      },
    },
  },
},
```

transform 매핑도 수정:

```typescript
// item.order.order_items -> item.order.items
const orderStatus = computeOrderStatus(item.order.items);

// item.productSnapshot.seller -> item.productSnapshot.snapshotBy
seller: {
  id: item.productSnapshot.snapshotBy.id,
  email: item.productSnapshot.snapshotBy.email,
  shop_name: item.productSnapshot.snapshotBy.shop_name,
  // ...
},
```

#### 권고 조치사항

- Prisma `select` 객체를 작성할 때 릴레이션 프로퍼티명은 반드시 Prisma 스키마에 정의된 이름 그대로 사용해야 한다. FK 컬럼명(`shopping_mall_seller_id`)과 릴레이션 프로퍼티명(`snapshotBy`)은 별개이다.
- 특히 하나의 모델이 같은 대상 모델과 여러 릴레이션을 가질 때 (예: `shopping_mall_order_items.seller`와 `shopping_mall_product_snapshots.snapshotBy`가 모두 `shopping_mall_sellers`를 가리킴), 각 릴레이션 이름이 다를 수 있으므로 스키마를 반드시 확인해야 한다.

---

## 3. ERP 시나리오 (오류 파일 1개)

### 3-1. `src/transformers/HrmPlatformTaskAtSummaryTransformer.ts`

**파일 경로**: `test/results/qwen/qwen3.5-397b-a17b/erp/realize/src/transformers/HrmPlatformTaskAtSummaryTransformer.ts`

#### 컴파일 에러 메시지

```
TS2345: Argument of type '{ created_at: Date; status: string; id: string; parent: {
  created_at: Date; status: string; id: string; title: string; priority: string;
  estimated_hours: number | null; due_date: Date | null; assignee: { ... } | null;
} | null; title: string; ... }' is not assignable to parameter of type '{ created_at: Date;
status: string; id: string; parent: { created_at: Date; status: string; id: string;
  parent: { ... } | null; title: string; ... } | null; title: string; ... }'.

  Types of property 'parent' are incompatible.
    Type '{ created_at: Date; status: string; id: string; title: string; priority: string;
    estimated_hours: number | null; due_date: Date | null; assignee: { ... } | null; } | null'
    is not assignable to type '{ created_at: Date; status: string; id: string;
      parent: { ... } | null; title: string; ... } | null'.

      Property 'parent' is missing in type '{ created_at: Date; status: string; id: string;
      title: string; priority: string; estimated_hours: number | null; due_date: Date | null;
      assignee: { ... } | null; }' but required in type '{ created_at: Date; status: string;
      id: string; parent: { ... } | null; title: string; ... }'.
```

#### DB 스키마

```prisma
model hrm_platform_tasks {
  //----
  // COLUMNS
  //----
  id                       String    @id @db.Uuid
  hrm_platform_project_id  String    @db.Uuid
  hrm_platform_employee_id String?   @db.Uuid
  parent_id                String?   @db.Uuid
  title                    String
  description              String?
  status                   String
  priority                 String
  estimated_hours          Float?    @db.DoublePrecision
  due_date                 DateTime? @db.Timestamptz
  created_at               DateTime  @db.Timestamptz
  updated_at               DateTime  @db.Timestamptz
  deleted_at               DateTime? @db.Timestamptz

  //----
  // BELONGED RELATIONS
  //----
  project  hrm_platform_projects  @relation(fields: [hrm_platform_project_id], references: [id], onDelete: Cascade)
  assignee hrm_platform_employees? @relation(fields: [hrm_platform_employee_id], references: [id], onDelete: Cascade)
  parent   hrm_platform_tasks?    @relation("recursive", fields: [parent_id], references: [id], onDelete: Cascade)

  //----
  // HAS RELATIONS
  //----
  children hrm_platform_tasks[] @relation("recursive")
  histories hrm_platform_task_histories[]
  timelogs hrm_platform_timelogs[]
  timers hrm_platform_timers[]

  //----
  // INDEXES
  //----
  @@index([hrm_platform_project_id, status])
  @@index([hrm_platform_employee_id, status])
  @@index([due_date])
  @@index([priority, due_date])
  @@index([parent_id])
  @@index([title(ops: raw("gin_trgm_ops"))], type: Gin)
}
```

#### API DTO 스펙 (`IHrmPlatformTask.ISummary`)

```typescript
export type ISummary = {
  id: string & tags.Format<"uuid">;
  title: string;
  status: string;
  priority: string;
  estimated_hours: number | null;
  due_date: (string & tags.Format<"date-time">) | null;
  assignee: IHrmPlatformEmployee.ISummary | null;
  parent: IHrmPlatformTask.ISummary | null;         // <-- 재귀적 자기참조 타입
  created_at: string & tags.Format<"date-time">;
};
```

#### 문제의 코드

`select()` 함수:

```typescript
export function select() {
  return {
    select: {
      id: true,
      title: true,
      status: true,
      priority: true,
      estimated_hours: true,
      due_date: true,
      created_at: true,
      assignee: HrmPlatformEmployeeAtSummaryTransformer.select(),
      parent: {                              // 1단계 parent
        select: {
          id: true,
          title: true,
          status: true,
          priority: true,
          estimated_hours: true,
          due_date: true,
          created_at: true,
          assignee: HrmPlatformEmployeeAtSummaryTransformer.select(),
          parent: {                          // 2단계 parent (parent.parent)
            select: {
              id: true,
              title: true,
              status: true,
              priority: true,
              estimated_hours: true,
              due_date: true,
              created_at: true,
              assignee: HrmPlatformEmployeeAtSummaryTransformer.select(),
              // *** 3단계 parent 없음! -- 여기가 문제의 핵심 ***
            },
          },
        },
      },
    },
  } satisfies Prisma.hrm_platform_tasksFindManyArgs;
}
```

`transform()` 함수:

```typescript
export async function transform(
  input: Payload,
): Promise<IHrmPlatformTask.ISummary> {
  return {
    id: input.id,
    title: input.title,
    status: input.status,
    priority: input.priority,
    estimated_hours: input.estimated_hours,
    due_date: input.due_date?.toISOString() ?? null,
    assignee: input.assignee
      ? await HrmPlatformEmployeeAtSummaryTransformer.transform(input.assignee)
      : null,
    parent: input.parent
      ? await HrmPlatformTaskAtSummaryTransformer.transform(input.parent)  // <-- 재귀 호출!
      : null,
    created_at: input.created_at.toISOString(),
  };
}
```

#### 오류 원인 분석

**근본 원인: 유한 깊이 `select()`와 무한 재귀 `transform()` 간의 타입 구조 불일치**

`select()`는 parent를 3단계 깊이로 중첩 정의했다 (루트 -> parent -> parent.parent). 하지만 `transform()`은 재귀적으로 자기 자신을 호출한다.

TypeScript가 추론한 `Payload` 타입의 구조:

```
루트: { parent: { parent: { /* parent 없음 */ } | null } | null }
       ^^^^^^^   ^^^^^^^   ^^^^^^^^^^^^^^^^^^^^^^^^^^^^
       1단계     2단계     3단계 (parent 프로퍼티가 없음)
```

`transform(input)` 호출 시:
1. `input`은 `Payload` 타입 (3단계 중첩)
2. `transform(input.parent)`를 호출하면, `input.parent`의 타입은 2단계 중첩
3. 그런데 `transform`의 매개변수 타입 `Payload`는 3단계 중첩을 **필수로** 요구
4. 2단계 parent 객체에는 `parent` 프로퍼티가 있지만, 그 내부(3단계)에는 `parent` 프로퍼티가 **없음**
5. `Payload`는 `parent.parent` 내부에 다시 `parent`를 필수로 요구하므로 타입 불호환 (TS2345)

요약하면:
- `select()`가 생성하는 실제 타입: `{ parent: { parent: { id, title, status, ... } | null } | null }`
- `Payload`가 요구하는 타입: `{ parent: { parent: { parent: ... | null, id, title, status, ... } | null } | null }`
- 3단계의 `parent` 객체에 `parent` 프로퍼티가 없어서 타입이 호환되지 않음

#### 올바른 코드

**방법 A (권장): transform에서 재귀를 제거하고 각 단계별 직접 매핑**

```typescript
export function select() {
  return {
    select: {
      id: true,
      title: true,
      status: true,
      priority: true,
      estimated_hours: true,
      due_date: true,
      created_at: true,
      assignee: HrmPlatformEmployeeAtSummaryTransformer.select(),
      parent: {
        select: {
          id: true,
          title: true,
          status: true,
          priority: true,
          estimated_hours: true,
          due_date: true,
          created_at: true,
          assignee: HrmPlatformEmployeeAtSummaryTransformer.select(),
          // parent.parent는 select하지 않음 (1단계만)
        },
      },
    },
  } satisfies Prisma.hrm_platform_tasksFindManyArgs;
}

export async function transform(
  input: Payload,
): Promise<IHrmPlatformTask.ISummary> {
  return {
    id: input.id,
    title: input.title,
    status: input.status,
    priority: input.priority,
    estimated_hours: input.estimated_hours,
    due_date: input.due_date?.toISOString() ?? null,
    assignee: input.assignee
      ? await HrmPlatformEmployeeAtSummaryTransformer.transform(input.assignee)
      : null,
    parent: input.parent
      ? {
          id: input.parent.id,
          title: input.parent.title,
          status: input.parent.status,
          priority: input.parent.priority,
          estimated_hours: input.parent.estimated_hours,
          due_date: input.parent.due_date?.toISOString() ?? null,
          assignee: input.parent.assignee
            ? await HrmPlatformEmployeeAtSummaryTransformer.transform(
                input.parent.assignee,
              )
            : null,
          parent: null,  // 재귀 중단
          created_at: input.parent.created_at.toISOString(),
        }
      : null,
    created_at: input.created_at.toISOString(),
  };
}
```

**방법 B: select 깊이를 통일하고 transform도 동일 깊이로 제한**

원본 코드처럼 3단계 깊이를 유지하되, `transform()`에서 재귀 호출 대신 각 깊이마다 별도의 인라인 매핑을 작성하는 방법이다. 그러나 이 방식은 코드 중복이 심해지므로 방법 A를 권장한다.

#### 권고 조치사항

- `select()`가 유한 깊이(N단계)로 parent를 중첩할 경우, `transform()`에서 동일 Transformer의 `transform()`을 재귀 호출하면 안 된다. select의 N단계 구조와 transform의 무한 재귀가 타입 불일치를 유발하기 때문이다.
- 유한 깊이 select의 마지막 단계에서는 자기참조 릴레이션 필드가 포함되지 않으므로, 해당 단계의 transform은 `parent: null`로 처리해야 한다.

---

## 종합 권고사항

### 공통 오류 패턴 3가지

| 패턴 | 증상 | 원인 | 해당 사례 |
|------|------|------|----------|
| 패턴 1: 재귀적 자기참조 select 호출 | `select()` 반환 타입이 `any`로 추론 (TS2742) -> 모든 릴레이션 접근 TS2339 | `select()` 함수가 직접/간접적으로 자기 자신을 호출하여 TypeScript 순환 타입 추론 실패 | Reddit 1-1, 1-2 |
| 패턴 2: Prisma 릴레이션 프로퍼티명 오류 | `Object literal may only specify known properties` (TS2353) -> 전체 select 무효화 -> 연쇄 TS2339 | LLM이 FK 컬럼명에서 릴레이션 이름을 추측하여 실제 스키마와 불일치 | Shopping 2-1 |
| 패턴 3: select/transform 깊이 불일치 | `Types of property 'parent' are incompatible` (TS2345) | select는 유한 깊이로 정의, transform은 무한 재귀로 정의하여 타입 구조 불일치 | ERP 3-1 |

### 프롬프트 개선 권고

#### 권고 1: 재귀적 자기참조 릴레이션 처리 규칙

자기참조(self-referential) 릴레이션이 있는 모델의 Transformer를 작성할 때:
1. `select()` 함수에서 **절대로 자기 자신의 `select()`를 호출하지 마라**. TypeScript는 순환 참조를 가진 함수의 반환 타입을 추론할 수 없어 `any`로 폴백한다.
2. 재귀가 필요한 경우 **인라인으로 필요한 필드만 직접 명시**하고, 깊이를 1~2단계로 제한하라.
3. `transform()` 함수에서도 **자기 자신을 재귀 호출하지 마라**. select의 유한 깊이와 transform의 무한 재귀가 타입 불일치를 일으킨다. 각 깊이 단계별로 직접 매핑 코드를 작성하라.

#### 권고 2: Prisma 릴레이션 프로퍼티명 확인 규칙

Prisma `select` 객체를 작성할 때:
1. 릴레이션 프로퍼티명은 **반드시 Prisma 스키마에 정의된 이름 그대로** 사용하라. FK 컬럼명에서 추측하지 마라.
2. FK 컬럼명(`shopping_mall_seller_id`)과 릴레이션 프로퍼티명(`snapshotBy`)은 **별개**임을 인지하라.
3. 특히 같은 대상 모델과 여러 릴레이션을 가질 때, 각 릴레이션 이름이 다를 수 있으므로 반드시 스키마를 확인하라.

#### 권고 3: select/transform 깊이 일관성 규칙

Transformer의 `select()`와 `transform()`은 반드시 동일한 깊이 구조를 가져야 한다:
1. `select()`가 N단계 깊이로 parent를 중첩했다면, `transform()`도 정확히 N단계만 처리하라.
2. `transform()`에서 재귀 호출(`SameTransformer.transform(input.parent)`)은 select 깊이가 무한일 때만 가능하며, 유한 깊이 select에서는 **반드시 인라인 매핑**을 사용하라.
3. 유한 깊이 select의 마지막 단계에서는 자기참조 릴레이션 필드를 포함하지 않으므로, 해당 단계의 transform은 `parent: null`로 처리하라.

### qwen3.5-397b-a17b 모델 특성 요약

4개 오류 파일 중 3개가 자기참조 릴레이션(recursive relation) 처리와 관련되어 있다. 이는 qwen3.5-397b-a17b 모델이 Prisma의 자기참조 릴레이션을 다룰 때 TypeScript의 타입 추론 한계를 고려하지 못하는 경향이 있음을 시사한다. 나머지 1개는 Prisma 릴레이션 프로퍼티명을 FK 컬럼명에서 유추하여 잘못 사용하는 전형적인 hallucination 패턴이다.
