# `qwen/qwen3-coder-next` Realize 단계 컴파일 에러 상세 진단 보고서

## 개요

| 시나리오 | 오류 파일 수 | 총 컴파일 에러 수 | 핵심 패턴 |
|----------|-------------|------------------|-----------|
| Reddit   | 2           | 2                | 미정의 함수 호출, 재귀 Transformer에서 Prisma select 누락 |
| Shopping | 7           | 7                | nullable 불일치, Prisma 스키마 컬럼 미존재, select 누락으로 `{ id: string }` 타입 축소, 관계명 혼동 |
| ERP      | 3           | 3                | nullable 불일치, Prisma WhereInput 오용, 중복 속성명, 존재하지 않는 컬럼 참조 |

**총합**: 오류 파일 12개, 컴파일 에러 12건

---

## 시나리오 1: Reddit (2건)

### 오류 1-1: `src/providers/getRedditLikeAdminBansBanId.ts`

**경로**: `test/results/qwen/qwen3-coder-next/reddit/realize/src/providers/getRedditLikeAdminBansBanId.ts`

#### 컴파일 에러 메시지

```
TS2304: Cannot find name 'adminAuthorize'.
```

#### DB 스키마 (`reddit_like_bans`)

```prisma
model reddit_like_bans {
  id                       String    @id @db.Uuid
  reddit_like_user_id      String    @db.Uuid
  reddit_like_community_id String    @db.Uuid
  status                   String
  created_at               DateTime  @db.Timestamptz
  updated_at               DateTime  @db.Timestamptz
  deleted_at               DateTime? @db.Timestamptz

  bannedUser      reddit_like_members     @relation(fields: [reddit_like_user_id], references: [id], onDelete: Cascade)
  bannedCommunity reddit_like_communities @relation(fields: [reddit_like_community_id], references: [id], onDelete: Cascade)

  @@unique([reddit_like_user_id, reddit_like_community_id])
}
```

#### API DTO 스펙 (`IRedditLikeBan`)

```typescript
export type IRedditLikeBan = {
  id: string & tags.Format<"uuid">;
  reddit_like_user_id: string & tags.Format<"uuid">;
  reddit_like_community_id: string & tags.Format<"uuid">;
  status: string;
  created_at: string & tags.Format<"date-time">;
  updated_at: string & tags.Format<"date-time">;
  deleted_at: (string & tags.Format<"date-time">) | null;
  bannedUser: IRedditLikeMember.ISummary;
  bannedCommunity: IRedditLikeCommunity.ISummary;
};
```

#### 문제의 코드

```typescript
export async function getRedditLikeAdminBansBanId(props: {
  admin: AdminPayload;
  banId: string;
}): Promise<IRedditLikeBan> {
  // *** 문제 지점: adminAuthorize 함수가 정의/임포트되지 않음 ***
  await adminAuthorize({ headers: { authorization: props.admin.session_id } });
  const ban = await MyGlobal.prisma.reddit_like_bans.findUniqueOrThrow({
    where: { id: props.banId },
    ...RedditLikeBanTransformer.select(),
  });
  return await RedditLikeBanTransformer.transform(ban);
}
```

#### 오류 원인 분석

LLM이 `adminAuthorize`라는 함수를 **정의하지도, 임포트하지도 않은 채** 호출하고 있다. 이 프로젝트의 인증 아키텍처에서는 admin 인증이 이미 `AdminPayload` 데코레이터를 통해 컨트롤러 레벨에서 처리되므로, provider 함수 내부에서 별도의 인증 함수를 호출할 필요가 없다. LLM이 존재하지 않는 유틸리티 함수를 환각(hallucination)으로 생성한 전형적인 사례이다.

#### 올바른 코드

```typescript
export async function getRedditLikeAdminBansBanId(props: {
  admin: AdminPayload;
  banId: string;
}): Promise<IRedditLikeBan> {
  // AdminPayload 데코레이터가 이미 인증을 처리하므로 별도 인증 불필요
  const ban = await MyGlobal.prisma.reddit_like_bans.findUniqueOrThrow({
    where: { id: props.banId },
    ...RedditLikeBanTransformer.select(),
  });
  return await RedditLikeBanTransformer.transform(ban);
}
```

#### 권고 조치사항

- 존재하지 않는 함수 호출을 제거
- 인증은 데코레이터/미들웨어 레벨에서 처리되므로 provider에서 중복 인증 시도를 하지 말 것

---

### 오류 1-2: `src/transformers/RedditLikeCommentTransformer.ts`

**경로**: `test/results/qwen/qwen3-coder-next/reddit/realize/src/transformers/RedditLikeCommentTransformer.ts`

#### 컴파일 에러 메시지

```
TS2345: Argument of type '{ ...; parentComment: { id: string; } | null; }' is not assignable to parameter of type '{ ...; parentComment: { ...; replies: ...[]; votes: ...[]; votesSum: ... | null; revisions: ...[]; reports: ...[]; } | null; replies: ...[]; votes: ...[]; votesSum: ... | null; revisions: ...[]; reports: ...[]; }'.
  Type '...' is missing the following properties: replies, votes, votesSum, revisions, reports

TS2322: Type 'IRedditLikeComment | null' is not assignable to type 'ISummary | null'.
  Property 'parent_comment_id' is missing in type 'IRedditLikeComment' but required in type 'ISummary'.
```

#### DB 스키마 (`reddit_like_comments`)

```prisma
model reddit_like_comments {
  id                String    @id @db.Uuid
  author_id         String    @db.Uuid
  post_id           String    @db.Uuid
  parent_comment_id String?   @db.Uuid
  content           String
  vote_score        Int       @db.Integer
  created_at        DateTime  @db.Timestamptz
  updated_at        DateTime  @db.Timestamptz
  deleted_at        DateTime? @db.Timestamptz

  author        reddit_like_members   @relation(fields: [author_id], references: [id], onDelete: Cascade)
  post          reddit_like_posts     @relation(fields: [post_id], references: [id], onDelete: Cascade)
  parentComment reddit_like_comments? @relation("recursive", fields: [parent_comment_id], references: [id], onDelete: Cascade)

  replies   reddit_like_comments[]        @relation("recursive")
  votes     reddit_like_comment_votes[]
  votesSum  reddit_like_comment_votes_sums?
  revisions reddit_like_comment_revisions[]
  reports   reddit_like_reports[]
}
```

#### API DTO 스펙 (`IRedditLikeComment` / `IRedditLikeComment.ISummary`)

```typescript
// IRedditLikeComment (상세)
export type IRedditLikeComment = {
  id: string & tags.Format<"uuid">;
  content: string;
  vote_score: number & tags.Type<"int32">;
  created_at: string & tags.Format<"date-time">;
  updated_at: string & tags.Format<"date-time">;
  deleted_at?: (string & tags.Format<"date-time">) | null | undefined;
  author: IRedditLikeMember.ISummary;
  post: IRedditLikePost.ISummary;
  parentComment: IRedditLikeComment.ISummary | null;  // ISummary를 요구
  replies: IRedditLikeComment[];
};

// IRedditLikeComment.ISummary (요약) - parent_comment_id 필드 포함
export type ISummary = {
  id: string & tags.Format<"uuid">;
  content: string;
  vote_score: number & tags.Type<"int32">;
  created_at: string & tags.Format<"date-time">;
  updated_at: string & tags.Format<"date-time">;
  deleted_at: (string & tags.Format<"date-time">) | null;
  author: IRedditLikeMember.ISummary;
  parent_comment_id: (string & tags.Format<"uuid">) | null;  // *** 핵심 필드 ***
};
```

#### 문제의 코드

```typescript
export namespace RedditLikeCommentTransformer {
  export function select() {
    return {
      select: {
        // ... 기본 필드들 ...
        parentComment: {
          select: {
            // 여기서 replies, votes, votesSum, revisions, reports를 포함하지 않음
            // → parentComment의 Payload 타입에 이 필드들이 없어짐
            id: true,
            content: true,
            vote_score: true,
            // ...
            parentComment: {
              select: { id: true },  // 최소 select
            },
          },
        },
        replies: {
          select: {
            // replies도 마찬가지로 누락
            // ...
            parentComment: {
              select: { id: true },
            },
          },
        },
        votes: { select: { id: true } },
        votesSum: { select: { id: true } },
        revisions: { select: { id: true } },
        reports: { select: { id: true } },
      },
    } satisfies Prisma.reddit_like_commentsFindManyArgs;
  }

  export async function transform(input: Payload): Promise<IRedditLikeComment> {
    // *** 문제 1: parentComment를 재귀적으로 transform() 호출하지만,
    //     parentComment의 Payload에는 replies/votes/votesSum/revisions/reports가 없음 ***
    const parentComment = input.parentComment
      ? await RedditLikeCommentTransformer.transform(input.parentComment)
      : null;

    // *** 문제 2: replies도 마찬가지로 재귀 transform인데 Payload 불일치 ***
    const replies = await ArrayUtil.asyncMap(
      input.replies,
      RedditLikeCommentTransformer.transform,
    );

    return {
      // ...
      parentComment: parentComment,  // IRedditLikeComment | null인데 ISummary | null 필요
      replies: replies,
    };
  }
}
```

#### 오류 원인 분석

**두 가지 근본 원인이 존재한다:**

1. **재귀 Transformer에서 Prisma select 불일치**: `select()` 함수의 최상위 레벨에는 `replies`, `votes`, `votesSum`, `revisions`, `reports` 관계를 포함하지만, `parentComment`와 `replies` 내부의 중첩 select에서는 이 관계들을 포함하지 않았다. 따라서 `Payload` 타입은 최상위에서만 해당 필드를 가지고, 중첩된 레벨에서는 `{ id: string }` 수준의 축소된 타입이 된다. 재귀적으로 `transform()`을 호출하면 타입이 맞지 않게 된다.

2. **`parentComment` 반환 타입 불일치**: `IRedditLikeComment`의 `parentComment` 필드는 `IRedditLikeComment.ISummary | null` 타입을 요구하는데, `transform()`은 `IRedditLikeComment`를 반환한다. `ISummary`에는 `parent_comment_id` 필드가 있지만 `IRedditLikeComment`에는 없으므로 할당 불가능하다.

#### 올바른 코드

```typescript
export namespace RedditLikeCommentTransformer {
  // parentComment에는 ISummary 전용 select를 별도로 사용
  export function selectSummary() {
    return {
      select: {
        id: true,
        content: true,
        vote_score: true,
        created_at: true,
        updated_at: true,
        deleted_at: true,
        parent_comment_id: true,  // ISummary에 필요한 필드
        author: {
          select: {
            id: true,
            username: true,
            display_name: true,
            bio: true,
            avatar_url: true,
            karma_score: true,
            created_at: true,
          },
        },
      },
    };
  }

  export function select() {
    return {
      select: {
        id: true,
        content: true,
        vote_score: true,
        created_at: true,
        updated_at: true,
        deleted_at: true,
        author: { /* ... */ },
        post: { /* ... */ },
        parentComment: selectSummary(),
        replies: {
          select: {
            id: true,
            content: true,
            vote_score: true,
            created_at: true,
            updated_at: true,
            deleted_at: true,
            author: { /* ... */ },
            post: { /* ... */ },
            parentComment: selectSummary(),
            replies: { select: { id: true } },
            votes: { select: { id: true } },
            votesSum: { select: { id: true } },
            revisions: { select: { id: true } },
            reports: { select: { id: true } },
          },
        },
        votes: { select: { id: true } },
        votesSum: { select: { id: true } },
        revisions: { select: { id: true } },
        reports: { select: { id: true } },
      },
    } satisfies Prisma.reddit_like_commentsFindManyArgs;
  }

  // parentComment는 ISummary로 변환하는 별도 함수
  function transformToSummary(input: any): IRedditLikeComment.ISummary {
    return {
      id: input.id,
      content: input.content,
      vote_score: input.vote_score,
      created_at: toISOStringSafe(input.created_at),
      updated_at: toISOStringSafe(input.updated_at),
      deleted_at: input.deleted_at ? toISOStringSafe(input.deleted_at) : null,
      author: { /* ... */ },
      parent_comment_id: input.parent_comment_id ?? null,
    };
  }

  export async function transform(input: Payload): Promise<IRedditLikeComment> {
    return {
      // ...
      parentComment: input.parentComment
        ? transformToSummary(input.parentComment)
        : null,
      replies: [], // 또는 별도 비재귀 변환
    };
  }
}
```

#### 권고 조치사항

- 재귀 Transformer를 사용할 때 중첩된 Prisma select가 동일한 Payload 타입을 보장하는지 확인
- `parentComment`에는 `IRedditLikeComment.ISummary` 타입을 반환하는 별도의 변환 함수 사용
- `ISummary`에 필요한 `parent_comment_id` 필드를 Prisma select에 포함

---

## 시나리오 2: Shopping (7건)

### 오류 2-1: `src/providers/patchEcommerceMallCustomerReviews.ts`

**경로**: `test/results/qwen/qwen3-coder-next/shopping/realize/src/providers/patchEcommerceMallCustomerReviews.ts`

#### 컴파일 에러 메시지

```
TS2322: Type '{ ...; product: { ...; main_image: { ... } | null; }; ... }[]' is not assignable to type 'ISummary[]'.
  The types of 'product.main_image' are incompatible between these types.
    Type '{ ... } | null' is not assignable to type 'ISummary'.
      Type 'null' is not assignable to type 'ISummary'.
```

#### DB 스키마 (`ecommerce_mall_reviews`, `ecommerce_mall_products`)

```prisma
model ecommerce_mall_reviews {
  id           String    @id @db.Uuid
  customer_id  String    @db.Uuid
  product_id   String    @db.Uuid
  order_item_id String   @db.Uuid
  rating       Int       @db.Integer
  text_content String?
  created_at   DateTime  @db.Timestamptz
  updated_at   DateTime  @db.Timestamptz
  deleted_at   DateTime? @db.Timestamptz

  customer  ecommerce_mall_customers   @relation(...)
  product   ecommerce_mall_products    @relation(...)
  orderItem ecommerce_mall_order_items @relation(...)
}
```

#### 문제의 코드 (핵심 부분)

```typescript
// select에서 images를 배열로 조회
product: {
  select: {
    // ...
    images: {
      select: { id: true, image_url: true, sort_order: true, is_main: true, ... },
    },
  },
},

// 변환 시 배열의 첫 번째 요소 또는 null로 main_image 생성
const image = record.product.images.length > 0 ? record.product.images[0] : null;
return {
  // ...
  product: {
    // ...
    main_image: image
      ? ({ id: image.id, image_url: image.image_url, ... } satisfies IEcommerceMallProductImage.ISummary)
      : null,  // *** 문제: null이 ISummary 타입에 할당 불가 ***
  } satisfies IEcommerceMallProduct.ISummary,
};
```

#### 오류 원인 분석

`IEcommerceMallProduct.ISummary`의 `main_image` 필드가 **non-nullable** 타입(`IEcommerceMallProductImage.ISummary`)으로 정의되어 있는데, 코드에서는 이미지가 없는 경우 `null`을 할당하고 있다. 이미지가 없는 상품이 존재할 수 있으므로 DTO 정의가 nullable이어야 하거나, 또는 기본값 객체를 사용해야 한다.

#### 올바른 코드

**방법 A: DTO가 nullable을 허용하는 경우** (DTO 수정이 가능하다면)
```typescript
// IEcommerceMallProduct.ISummary에서:
main_image: IEcommerceMallProductImage.ISummary | null;
```

**방법 B: 기본값 객체 사용** (현 DTO를 유지할 경우)
```typescript
main_image: image
  ? { id: image.id, image_url: image.image_url, ... }
  : {
      id: "" as string & tags.Format<"uuid">,
      image_url: "",
      sort_order: 0,
      is_main: false,
      created_at: "",
      updated_at: "",
      deleted_at: null,
    } satisfies IEcommerceMallProductImage.ISummary,
```

#### 권고 조치사항

- 상품에 이미지가 없는 경우가 비즈니스 로직상 허용된다면, DTO의 `main_image` 타입을 `ISummary | null`로 변경
- nullable이 허용되지 않는 경우 빈 객체 기본값으로 대체

---

### 오류 2-2: `src/providers/postEcommerceMallAdminProductDeletions.ts`

**경로**: `test/results/qwen/qwen3-coder-next/shopping/realize/src/providers/postEcommerceMallAdminProductDeletions.ts`

#### 컴파일 에러 메시지

```
TS2339: Property 'product_id' does not exist on type '{ id: string; }'.
TS2339: Property 'admin_id' does not exist on type '{ id: string; }'.
TS2339: Property 'reason' does not exist on type '{ id: string; }'.
TS2339: Property 'status' does not exist on type '{ id: string; }'.
TS2339: Property 'created_at' does not exist on type '{ id: string; }'.
TS2339: Property 'updated_at' does not exist on type '{ id: string; }'.
TS2339: Property 'product' does not exist on type '{ id: string; }'.
TS2339: Property 'admin' does not exist on type '{ id: string; }'.
(위와 유사한 에러가 parentRequest/followUpRequests 내부에서 반복)
```

#### DB 스키마 (`ecommerce_mall_product_deletions`)

```prisma
model ecommerce_mall_product_deletions {
  id              String    @id @db.Uuid
  product_id      String    @db.Uuid
  admin_id        String    @db.Uuid
  reason          String
  status          String
  responded_at    DateTime? @db.Timestamptz
  approval_notes  String?
  created_at      DateTime  @db.Timestamptz
  updated_at      DateTime  @db.Timestamptz
  deleted_at      DateTime? @db.Timestamptz
  parent_request_id String? @db.Uuid

  product       ecommerce_mall_products            @relation(...)
  admin         ecommerce_mall_admins              @relation(...)
  parentRequest ecommerce_mall_product_deletions?  @relation("recursive", ...)
  followUpRequests ecommerce_mall_product_deletions[] @relation("recursive")
}
```

#### 문제의 코드 (핵심 부분)

```typescript
const created = await MyGlobal.prisma.ecommerce_mall_product_deletions.create({
  data: { /* ... */ },
  select: {
    id: true,
    product_id: true,
    admin_id: true,
    reason: true,
    status: true,
    // ...
    parentRequest: {
      select: {
        id: true,
        product_id: true,
        // ...
        parentRequest: { select: { id: true } },      // *** 문제: { id: string } 타입만 됨 ***
        followUpRequests: { select: { id: true } },    // *** 문제: { id: string } 타입만 됨 ***
      },
    },
    followUpRequests: {
      select: {
        id: true,
        product_id: true,
        // ...
        parentRequest: { select: { id: true } },      // *** 문제 ***
        followUpRequests: { select: { id: true } },    // *** 문제 ***
      },
    },
  },
});

// 이후 변환 코드에서:
created.parentRequest.parentRequest.product_id    // *** 에러: { id: string }에 product_id 없음 ***
created.parentRequest.parentRequest.admin.id      // *** 에러: { id: string }에 admin 없음 ***
created.followUpRequests[i].parentRequest.product_id  // *** 동일 에러 ***
```

#### 오류 원인 분석

2단계 중첩된 `parentRequest`와 `followUpRequests`에 대해 **`{ select: { id: true } }`만** 지정했으므로, Prisma가 반환하는 타입은 `{ id: string }`뿐이다. 그런데 변환 코드에서는 이 2단계 중첩 객체의 `product_id`, `admin_id`, `reason`, `status`, `product`, `admin` 등의 필드에 접근하고 있어 타입 에러가 발생한다.

LLM이 재귀 구조의 깊이에 따른 select 범위를 적절히 관리하지 못한 사례이다. 가장 안쪽 깊이에서는 `{ id: true }`만 선택해 놓고, 변환 코드에서는 마치 전체 필드가 있는 것처럼 접근하고 있다.

#### 올바른 코드

**방법 A: 2단계 중첩에서도 필요한 필드 select 확장**
```typescript
parentRequest: {
  select: {
    id: true,
    product_id: true,
    admin_id: true,
    reason: true,
    status: true,
    created_at: true,
    updated_at: true,
    product: { select: { /* ... */ } },
    admin: { select: { /* ... */ } },
    // 3단계는 null 처리
    parentRequest: { select: { id: true } },
    followUpRequests: { select: { id: true } },
  },
},
```

**방법 B: 2단계 중첩에서는 null/빈 배열 반환** (권장)
```typescript
// 변환 코드에서:
parentRequest: created.parentRequest
  ? {
      // ...1단계 필드...
      parentRequest: null,       // 더 이상 깊이 들어가지 않음
      followUpRequests: [],
    }
  : null,
```

#### 권고 조치사항

- Prisma select의 깊이와 변환 코드의 필드 접근 깊이를 일치시킬 것
- 재귀 구조에서는 특정 깊이 이하에서 잘라내는 전략을 명시적으로 사용

---

### 오류 2-3: `src/providers/postEcommerceMallAuthSellerJoin.ts`

**경로**: `test/results/qwen/qwen3-coder-next/shopping/realize/src/providers/postEcommerceMallAuthSellerJoin.ts`

#### 컴파일 에러 메시지

```
TS2353: Object literal may only specify known properties, and 'deleted_at' does not exist in type 'Without<ecommerce_mall_seller_sessionsCreateInput, ecommerce_mall_seller_sessionsUncheckedCreateInput> & ecommerce_mall_seller_sessionsUncheckedCreateInput'.

TS2353: Object literal may only specify known properties, and 'deleted_at' does not exist in type 'ecommerce_mall_seller_sessionsSelect<DefaultArgs>'.
```

#### DB 스키마 (`ecommerce_mall_seller_sessions`)

```prisma
model ecommerce_mall_seller_sessions {
  id                        String   @id @db.Uuid
  ecommerce_mall_seller_id  String   @db.Uuid
  access_token              String
  refresh_token             String
  ip                        String
  user_agent                String
  referrer                  String
  created_at                DateTime @db.Timestamptz
  expired_at                DateTime @db.Timestamptz
  is_revoked                Boolean

  seller ecommerce_mall_sellers @relation(fields: [ecommerce_mall_seller_id], references: [id], onDelete: Cascade)
}
```

#### 문제의 코드

```typescript
const session = await MyGlobal.prisma.ecommerce_mall_seller_sessions.create({
  data: {
    id: v4(),
    ecommerce_mall_seller_id: seller.id,
    access_token: v4(),
    refresh_token: v4(),
    expired_at: accessExpires,
    created_at: new Date(),
    deleted_at: null,           // *** 문제: 스키마에 deleted_at 컬럼 없음 ***
  },
  select: {
    id: true,
    ecommerce_mall_seller_id: true,
    access_token: true,
    refresh_token: true,
    expired_at: true,
    created_at: true,
    deleted_at: true,           // *** 문제: 스키마에 deleted_at 컬럼 없음 ***
  },
});
```

#### 오류 원인 분석

`ecommerce_mall_seller_sessions` 테이블에는 `deleted_at` 컬럼이 **존재하지 않는다**. 이 테이블의 컬럼은 `id`, `ecommerce_mall_seller_id`, `access_token`, `refresh_token`, `ip`, `user_agent`, `referrer`, `created_at`, `expired_at`, `is_revoked`이다. LLM이 다른 테이블에서 흔히 보이는 `deleted_at` 패턴을 이 테이블에도 존재한다고 잘못 가정한 것이다.

또한 필수 컬럼인 `ip`, `user_agent`, `referrer`, `is_revoked`도 누락되어 있다 (런타임 에러로 이어짐).

#### 올바른 코드

```typescript
const session = await MyGlobal.prisma.ecommerce_mall_seller_sessions.create({
  data: {
    id: v4(),
    ecommerce_mall_seller_id: seller.id,
    access_token: v4(),
    refresh_token: v4(),
    expired_at: accessExpires,
    created_at: new Date(),
    ip: props.ip,
    user_agent: "",
    referrer: "",
    is_revoked: false,
  },
  select: {
    id: true,
    ecommerce_mall_seller_id: true,
    access_token: true,
    refresh_token: true,
    expired_at: true,
    created_at: true,
  },
});
```

#### 권고 조치사항

- Prisma 스키마를 반드시 확인한 후 data/select 객체를 구성할 것
- 다른 테이블의 공통 패턴(deleted_at 등)을 무조건 적용하지 말 것
- 필수 컬럼 누락 여부를 반드시 검증

---

### 오류 2-4: `src/providers/postEcommerceMallCustomerProductsProductIdReviews.ts`

**경로**: `test/results/qwen/qwen3-coder-next/shopping/realize/src/providers/postEcommerceMallCustomerProductsProductIdReviews.ts`

#### 컴파일 에러 메시지

```
TS2353: Object literal may only specify known properties, and 'bbs_user_id' does not exist in type 'ecommerce_mall_order_itemsWhereInput'.
```

#### DB 스키마 (`ecommerce_mall_order_items`)

```prisma
model ecommerce_mall_order_items {
  id                 String   @id @db.Uuid
  order_id           String   @db.Uuid
  product_id         String   @db.Uuid
  variant_id         String   @db.Uuid
  seller_id          String   @db.Uuid
  quantity           Int      @db.Integer
  product_name       String
  product_description String
  variant_options    String
  product_price      Float    @db.DoublePrecision
  item_status        String
  created_at         DateTime @db.Timestamptz
  updated_at         DateTime @db.Timestamptz

  order   ecommerce_mall_orders           @relation(...)
  product ecommerce_mall_products         @relation(...)
  variant ecommerce_mall_product_variants @relation(...)
  seller  ecommerce_mall_sellers          @relation(...)
}
```

#### 문제의 코드

```typescript
const orderItem = await MyGlobal.prisma.ecommerce_mall_order_items.findFirstOrThrow({
  where: {
    id: props.body.order_item_id,
    bbs_user_id: props.customer.id,   // *** 문제: bbs_user_id 컬럼이 존재하지 않음 ***
    item_status: "delivered",
  },
  select: { id: true, product_id: true },
});
```

#### 오류 원인 분석

`ecommerce_mall_order_items` 테이블에는 `bbs_user_id` 컬럼이 **존재하지 않는다**. LLM이 다른 프로젝트(BBS 게시판 시스템)의 컬럼명을 환각(hallucination)으로 혼입시킨 것이다. 주문 항목이 특정 고객의 것인지 확인하려면 `order` 관계를 통해 `customer_id`로 조인하여 검증해야 한다.

#### 올바른 코드

```typescript
const orderItem = await MyGlobal.prisma.ecommerce_mall_order_items.findFirstOrThrow({
  where: {
    id: props.body.order_item_id,
    order: {
      customer_id: props.customer.id,   // order → customer_id로 간접 검증
    },
    item_status: "delivered",
  },
  select: { id: true, product_id: true },
});
```

#### 권고 조치사항

- WhereInput에서 사용하는 필드가 실제 스키마에 존재하는지 확인
- 간접 관계 검증 시 중첩된 where 조건 사용
- 다른 도메인(BBS 등)의 네이밍 패턴이 혼입되지 않도록 주의

---

### 오류 2-5: `src/providers/postEcommerceMallSellerOrdersOrderIdShipments.ts`

**경로**: `test/results/qwen/qwen3-coder-next/shopping/realize/src/providers/postEcommerceMallSellerOrdersOrderIdShipments.ts`

#### 컴파일 에러 메시지

```
TS2353: Object literal may only specify known properties, and 'is_suspended' does not exist in type 'ecommerce_mall_customersSelect<DefaultArgs>'.
TS2339: Property 'orderItems' does not exist on type '{ id: string; created_at: Date; ... }'.
TS7006: Parameter 'item' implicitly has an 'any' type.
TS2339: Property 'seller' does not exist on type '{ id: string; created_at: Date; ... ecommerce_mall_seller_id: string; ecommerce_mall_order_id: string; carrier_name: string | null; tracking_number: string | null; }'.
TS2339: Property 'order' does not exist on type '{ id: string; created_at: Date; ... }'.
TS2353: Object literal may only specify known properties, but 'shippingAddress' does not exist in type 'ISummary'. Did you mean to write 'shipping_address'?
TS2353: Object literal may only specify known properties, and 'deleted_at' does not exist in type 'ISummary'.
```

#### DB 스키마 (`ecommerce_mall_shipments`)

```prisma
model ecommerce_mall_shipments {
  id                        String    @id @db.Uuid
  ecommerce_mall_order_id   String    @db.Uuid
  ecommerce_mall_seller_id  String    @db.Uuid
  created_at                DateTime  @db.Timestamptz
  updated_at                DateTime  @db.Timestamptz
  deleted_at                DateTime? @db.Timestamptz
  carrier_name              String?
  tracking_number           String?

  order         ecommerce_mall_orders  @relation(fields: [ecommerce_mall_order_id], references: [id], onDelete: Cascade)
  seller        ecommerce_mall_sellers @relation(fields: [ecommerce_mall_seller_id], references: [id], onDelete: Cascade)
  shipmentItems ecommerce_mall_shipment_items[]
}
```

#### 문제의 코드 (다수 에러 요약)

```typescript
// 1. order 조회 시 select에 is_suspended 포함 (customers 테이블에 is_suspended 컬럼 없음)
customer: {
  select: {
    id: true,
    email: true,
    is_suspended: true,  // *** 에러: 컬럼 미존재 ***
    // ...
  },
},

// 2. shipment create 시 seller/order를 connect로 연결했지만, select에 seller/order 관계 포함
//    → Prisma create의 select에서 seller/order 관계를 include했으나
//      실제 반환 타입에서 relation이 없는 경우 에러 발생
select: {
  seller: { select: { ... } },  // 에러 가능성: create select에서 relation
  order: { select: { ... } },   // 에러 가능성
},

// 3. 반환 객체에서 shipment.seller / shipment.order 접근
//    → select에 포함하지 않았거나 올바르게 포함하지 않아 타입에 없음
seller: {
  id: props.seller.id,
  created_at: toISOStringSafe(shipment.seller.created_at),  // *** 에러: seller 없음 ***
},

// 4. shippingAddress vs shipping_address 네이밍 불일치
shippingAddress: {                    // *** 에러: ISummary는 shipping_address 사용 ***
  // ...
} satisfies IEcommerceMallAddress.ISummary,

// 5. 주문 조회에서 orderItems를 select에 넣었지만 반환 타입에서 인식되지 않음
const items = order.orderItems.filter((item) =>  // *** 에러: orderItems 없음 ***
  props.body.order_items.includes(item.id),
);
```

#### 오류 원인 분석

**5가지 서로 다른 에러가 동시에 발생한 복합적 사례이다:**

1. **`is_suspended` 컬럼 미존재**: `ecommerce_mall_customers` 테이블에 `is_suspended` 컬럼이 없다. `ecommerce_mall_sellers`에는 있지만 `customers`에는 없는 필드를 혼동한 것이다.

2. **Prisma create select에서 relation 포함 문제**: `create()` 호출의 `select`에 `seller`, `order` 관계를 포함했는데, 실제 Prisma 타입 추론에서 이 관계들이 제대로 반영되지 않아 반환 타입이 scalar 필드만 포함하게 된다.

3. **반환 타입에서 존재하지 않는 필드 접근**: `shipment.seller`, `shipment.order` 등 관계 필드가 타입에 없으므로 접근 불가.

4. **camelCase vs snake_case 네이밍 불일치**: DTO에서는 `shipping_address`(snake_case)를 사용하는데 코드에서는 `shippingAddress`(camelCase)를 사용.

5. **`deleted_at` DTO 미존재**: ISummary에 `deleted_at`이 정의되지 않은 경우 해당 필드를 포함할 수 없음.

#### 올바른 코드

```typescript
// 1. is_suspended 제거
customer: {
  select: {
    id: true,
    email: true,
    created_at: true,
  },
},

// 2. shipment 생성 후 별도로 include하여 조회하거나, create 시 include 사용
const shipment = await MyGlobal.prisma.ecommerce_mall_shipments.create({
  data: { /* ... */ },
  include: {
    seller: { select: { id: true, shop_name: true, ... } },
    order: {
      include: {
        customer: { select: { id: true, email: true, created_at: true } },
        // shipping_address 사용
      },
    },
    shipmentItems: true,
  },
});

// 3. DTO 필드명에 맞게 shipping_address 사용
shipping_address: { /* ... */ },
```

#### 권고 조치사항

- 각 테이블의 실제 컬럼을 확인한 후 select/where를 작성
- DTO의 속성명(camelCase/snake_case)과 코드를 일치시킬 것
- Prisma `create()`에서 relation을 select하려면 `include`를 사용하는 것이 안전

---

### 오류 2-6: `src/providers/putEcommerceMallAdminAdminRequestsAdminRequestId.ts`

**경로**: `test/results/qwen/qwen3-coder-next/shopping/realize/src/providers/putEcommerceMallAdminAdminRequestsAdminRequestId.ts`

#### 컴파일 에러 메시지

```
TS2353: Object literal may only specify known properties, and 'user_id' does not exist in type '(Without<ecommerce_mall_admin_rolesCreateInput, ecommerce_mall_admin_rolesUncheckedCreateInput> & ecommerce_mall_admin_rolesUncheckedCreateInput) | ...'.
```

#### DB 스키마 (`ecommerce_mall_admin_roles`)

```prisma
model ecommerce_mall_admin_roles {
  id         String   @id @db.Uuid
  admin_id   String   @db.Uuid
  grade      String
  created_at DateTime @db.Timestamptz
  updated_at DateTime @db.Timestamptz

  admin         ecommerce_mall_admins          @relation(fields: [admin_id], references: [id], onDelete: Cascade)
  adminRequests ecommerce_mall_admin_requests[]
}
```

#### 문제의 코드

```typescript
const adminRole = await MyGlobal.prisma.ecommerce_mall_admin_roles.create({
  data: {
    id: adminRoleId,
    user_id: request.user_id,   // *** 문제: user_id 컬럼 없음, admin_id가 올바름 ***
    grade: "regular",
    created_at: now,
    updated_at: now,
  },
});
```

#### 오류 원인 분석

`ecommerce_mall_admin_roles` 테이블의 FK는 `admin_id`이지 `user_id`가 아니다. LLM이 `admin_requests` 테이블의 `user_id` 필드와 `admin_roles` 테이블의 `admin_id` 필드를 혼동한 것이다.

#### 올바른 코드

```typescript
const adminRole = await MyGlobal.prisma.ecommerce_mall_admin_roles.create({
  data: {
    id: adminRoleId,
    admin_id: request.user_id,  // admin_requests.user_id → admin_roles.admin_id
    grade: "regular",
    created_at: now,
    updated_at: now,
  },
});
```

#### 권고 조치사항

- 테이블 간 FK 매핑을 정확히 파악한 후 create data를 구성
- 서로 다른 테이블의 컬럼명을 혼동하지 않도록 주의

---

### 오류 2-7: `src/transformers/EcommerceMallProductDeletionAtSummaryTransformer.ts`

**경로**: `test/results/qwen/qwen3-coder-next/shopping/realize/src/transformers/EcommerceMallProductDeletionAtSummaryTransformer.ts`

#### 컴파일 에러 메시지

```
TS2345: Argument of type '{ ...; parentRequest: { ...; } | null; }' is not assignable to parameter of type '{ ...; parentRequest: { ...; parentRequest: ... | null; } | null; followUpRequests: ...[]; }'.
  Property 'followUpRequests' is missing in type '...' but required in type '...'.

TS2353: Object literal may only specify known properties, and 'followUpRequests' does not exist in type 'ISummary'.
```

#### 문제의 코드

```typescript
export namespace EcommerceMallProductDeletionAtSummaryTransformer {
  export function select() {
    return {
      select: {
        // ...
        parentRequest: {
          select: {
            // ...
            parentRequest: {
              select: {
                // 2단계 중첩: followUpRequests 미포함
                // ...
              },
            } satisfies Prisma.ecommerce_mall_product_deletionsFindManyArgs,
          },
        } satisfies Prisma.ecommerce_mall_product_deletionsFindManyArgs,
        followUpRequests: {
          select: {
            // followUpRequests 내부: parentRequest/followUpRequests 미포함
            // ...
          },
        } satisfies Prisma.ecommerce_mall_product_deletionsFindManyArgs,
      },
    } satisfies Prisma.ecommerce_mall_product_deletionsFindManyArgs;
  }

  export async function transform(input: Payload): Promise<IEcommerceMallProductDeletion.ISummary> {
    return {
      // ...
      parentRequest: input.parentRequest
        ? await EcommerceMallProductDeletionAtSummaryTransformer.transform(
            input.parentRequest,  // *** 에러: parentRequest Payload에 followUpRequests 없음 ***
          )
        : null,
      followUpRequests: input.followUpRequests
        ? await ArrayUtil.asyncMap(
            input.followUpRequests,  // *** 에러: followUpRequests Payload에 parentRequest/followUpRequests 없음 ***
            EcommerceMallProductDeletionAtSummaryTransformer.transform,
          )
        : [],
    };
  }
}
```

#### 오류 원인 분석

**오류 2-2와 동일한 패턴이다.** 재귀 Transformer에서 `select()`의 중첩 깊이와 `transform()` 함수의 재귀 호출이 불일치한다.

1. `parentRequest`의 중첩 select에는 `followUpRequests`가 포함되지 않았는데, `transform()`에서 재귀적으로 호출하면 `followUpRequests` 필드가 필요하게 된다.
2. `followUpRequests` 내부 select에는 `parentRequest`와 `followUpRequests`가 포함되지 않았는데, 역시 재귀 `transform()`이 이 필드들을 요구한다.
3. 또한 `IEcommerceMallProductDeletion.ISummary`에 `followUpRequests` 필드가 정의되어 있지 않을 수 있어, 반환 객체에 이 필드를 넣으면 excess property 에러가 발생한다.

#### 올바른 코드

```typescript
export async function transform(
  input: Payload,
): Promise<IEcommerceMallProductDeletion.ISummary> {
  return {
    id: input.id,
    reason: input.reason,
    status: typia.assert<"pending" | "approved" | "rejected">(input.status),
    responded_at: input.responded_at ? toISOStringSafe(input.responded_at) : null,
    approval_notes: input.approval_notes ?? null,
    deleted_at: input.deleted_at ? toISOStringSafe(input.deleted_at) : null,
    created_at: toISOStringSafe(input.created_at),
    updated_at: toISOStringSafe(input.updated_at),
    product: await EcommerceMallProductAtSummaryTransformer.transform(input.product),
    admin: await EcommerceMallAdminAtSummaryTransformer.transform(input.admin),
    // parentRequest는 비재귀적으로 변환 (ISummary에 맞는 별도 함수 사용)
    parentRequest: input.parentRequest
      ? {
          id: input.parentRequest.id,
          reason: input.parentRequest.reason,
          // ... 비재귀 변환 ...
        }
      : null,
    // followUpRequests는 ISummary에 정의된 경우에만 포함
  };
}
```

#### 권고 조치사항

- 재귀 Transformer 패턴에서 중첩 깊이를 제한하는 전략 채택
- DTO(ISummary) 정의에 포함된 필드만 반환 객체에 포함
- 재귀 호출 대신 깊이별 전용 변환 로직 사용

---

## 시나리오 3: ERP (3건)

### 오류 3-1: `src/providers/patchHrmTrackerMemberProjectsProjectIdProjectMembers.ts`

**경로**: `test/results/qwen/qwen3-coder-next/erp/realize/src/providers/patchHrmTrackerMemberProjectsProjectIdProjectMembers.ts`

#### 컴파일 에러 메시지

```
TS2322: Type '{ ...; project: { ...; organization: ISummary | null; }; }[]' is not assignable to type 'ISummary[]'.
  The types of 'project.organization' are incompatible between these types.
    Type 'ISummary | null' is not assignable to type 'ISummary'.
      Type 'null' is not assignable to type 'ISummary'.
```

#### DB 스키마 (`hrm_tracker_projects`)

```prisma
model hrm_tracker_projects {
  id                             String    @id @db.Uuid
  hrm_tracker_organization_id    String    @db.Uuid   -- NOT NULL
  name                           String
  description                    String?
  color                          String
  status                         String
  budget_hours                   Float?    @db.DoublePrecision
  start_date                     DateTime? @db.Timestamptz
  end_date                       DateTime? @db.Timestamptz
  created_at                     DateTime  @db.Timestamptz
  updated_at                     DateTime  @db.Timestamptz
  deleted_at                     DateTime? @db.Timestamptz

  organization hrm_tracker_organizations @relation(fields: [hrm_tracker_organization_id], references: [id], onDelete: Cascade)
}
```

#### 문제의 코드

```typescript
const transformData = data.map((item) => ({
  // ...
  project: {
    id: item.project.id as string & tags.Format<"uuid">,
    name: item.project.name,
    color: item.project.color,
    status: item.project.status,
    start_date: item.project.start_date
      ? toISOStringSafe(item.project.start_date)
      : null,
    end_date: item.project.end_date
      ? toISOStringSafe(item.project.end_date)
      : null,
    created_at: toISOStringSafe(item.project.created_at),
    organization: item.project.organization
      ? typia.assert<IHrmTrackerOrganization.ISummary>({
          id: item.project.organization.id as string & tags.Format<"uuid">,
          name: item.project.organization.name,
          // ...
        })
      : null,  // *** 문제: ISummary 타입에 null 할당 불가 ***
  },
}));
```

#### 오류 원인 분석

`hrm_tracker_projects.hrm_tracker_organization_id`는 **NOT NULL** FK이므로, 해당 프로젝트에는 반드시 organization이 존재한다. 그럼에도 불구하고 LLM은 `organization`이 `null`일 수 있다고 가정하고 삼항 연산자로 `null`을 반환했다.

DTO의 `project.organization` 필드가 `IHrmTrackerOrganization.ISummary` (non-nullable) 타입인데, 코드에서 `null`을 반환하므로 타입 불일치가 발생한다.

#### 올바른 코드

```typescript
project: {
  // ...
  organization: typia.assert<IHrmTrackerOrganization.ISummary>({
    id: item.project.organization.id as string & tags.Format<"uuid">,
    name: item.project.organization.name,
    description: item.project.organization.description ?? null,
    logo_image_uri: item.project.organization.logo_image_uri ?? null,
    status: item.project.organization.status as "active" | "archived" | "deleted",
    created_at: toISOStringSafe(item.project.organization.created_at),
  }),
  // null 분기 제거: hrm_tracker_organization_id가 NOT NULL이므로 organization은 항상 존재
},
```

#### 권고 조치사항

- NOT NULL FK 관계에서는 관계 객체도 반드시 존재하므로 null 분기 불필요
- Prisma 스키마의 nullable 여부를 확인하여 불필요한 null 처리 제거

---

### 오류 3-2: `src/providers/postHrmTrackerMemberProjectsProjectIdStatusChange.ts`

**경로**: `test/results/qwen/qwen3-coder-next/erp/realize/src/providers/postHrmTrackerMemberProjectsProjectIdStatusChange.ts`

#### 컴파일 에러 메시지

```
TS2353: Object literal may only specify known properties, and 'member_id' does not exist in type 'Without<...> & hrm_tracker_employeesWhereInput'.

TS2367: This comparison appears to be unintentional because the types '{ id: string; ...; permission: string; ... }' and 'string' have no overlap.

TS2300: An object literal cannot have multiple properties with the same name.

TS2353: Object literal may only specify known properties, and 'actor_id' does not exist in type '... hrm_tracker_activity_logsCreateInput ...'.
```

#### DB 스키마

**`hrm_tracker_employees`** (관련 부분):
```prisma
model hrm_tracker_employees {
  id              String   @id @db.Uuid
  user_id         String   @db.Uuid
  organization_id String   @db.Uuid
  // ... member_id 컬럼은 존재하지 않음
}
```

**`hrm_tracker_activity_logs`**:
```prisma
model hrm_tracker_activity_logs {
  id                   String    @id @db.Uuid
  hrm_tracker_member_id String?  @db.Uuid
  hrm_tracker_guest_id  String?  @db.Uuid
  target_entity_type   String
  target_entity_id     String
  action_type          String
  created_at           DateTime  @db.Timestamptz
  // ... actor_id, session_id 컬럼은 존재하지 않음
}
```

#### 문제의 코드

```typescript
// 문제 1: member_id 컬럼 미존재
const roleAssignment = await MyGlobal.prisma.hrm_tracker_employee_roles.findFirst({
  where: {
    employee: {
      member_id: props.member.id,  // *** 에러: member_id 컬럼 없음, user_id가 올바름 ***
      deleted_at: null,
    },
    // ...
  },
});

// 문제 2: permission은 객체인데 문자열과 비교
if (!role.rolePermissions.some((rp) => rp.permission === "project:manage")) {
  // *** 에러: rp.permission은 { id, permission, ... } 객체이므로 string과 비교 불가 ***
}

// 문제 3: 중복 속성명 action_type
await MyGlobal.prisma.hrm_tracker_activity_logs.create({
  data: {
    id: v4(),
    action_type: newStatus === "archived" ? "project_archived" : "project_completed",
    action_type: "member",           // *** 에러: action_type 중복 선언 ***
    actor_id: props.member.id,       // *** 에러: actor_id 컬럼 미존재 ***
    session_id: props.member.session_id,  // *** 에러: session_id 컬럼 미존재 ***
    target_type: "project",          // *** 에러: target_type 미존재, target_entity_type이 올바름 ***
    target_id: project.id,           // *** 에러: target_id 미존재, target_entity_id가 올바름 ***
    hrm_tracker_organization_id: project.hrm_tracker_organization_id,
    created_at: new Date(),
  },
});
```

#### 오류 원인 분석

**4가지 서로 다른 에러가 복합되어 있다:**

1. **`member_id` 컬럼 미존재**: `hrm_tracker_employees`에는 `user_id`가 있지 `member_id`는 없다. LLM이 `MemberPayload`의 `id`를 직접 `member_id`로 매핑하려 했지만, 실제 스키마에서는 `user_id`를 사용한다.

2. **관계 객체와 스칼라 비교**: `role.rolePermissions`는 `include`로 가져왔으므로 `rp.permission`이 관계 객체(`hrm_tracker_permissions`)이다. 문자열 비교가 아닌 `rp.permission.permission` 등으로 접근해야 한다.

3. **`action_type` 중복 속성**: 객체 리터럴에서 `action_type`를 두 번 선언했다. JavaScript에서는 마지막 값이 적용되지만, TypeScript strict 모드에서는 에러이다.

4. **`actor_id`, `session_id`, `target_type`, `target_id` 컬럼 미존재**: 실제 스키마에는 `hrm_tracker_member_id`, `target_entity_type`, `target_entity_id`가 올바른 컬럼명이다.

#### 올바른 코드

```typescript
// 1. user_id 사용
const roleAssignment = await MyGlobal.prisma.hrm_tracker_employee_roles.findFirst({
  where: {
    employee: {
      user_id: props.member.id,
      deleted_at: null,
    },
    hrm_tracker_organization_id: project.hrm_tracker_organization_id,
  },
});

// 2. permission 객체의 필드에 접근
if (!role.rolePermissions.some((rp) => rp.permission.permission === "project:manage")) {
  throw new HttpException("Forbidden", 403);
}

// 3. 올바른 컬럼명 사용, 중복 제거
await MyGlobal.prisma.hrm_tracker_activity_logs.create({
  data: {
    id: v4(),
    action_type: newStatus === "archived" ? "project_archived" : "project_completed",
    hrm_tracker_member_id: props.member.id,
    target_entity_type: "project",
    target_entity_id: project.id,
    created_at: new Date(),
  },
});
```

#### 권고 조치사항

- Prisma 스키마의 실제 컬럼명과 관계명을 반드시 확인
- `include`로 가져온 관계는 객체이므로 스칼라 비교가 아닌 필드 접근 필요
- 객체 리터럴에서 중복 속성명 사용 금지

---

### 오류 3-3: `src/providers/putHrmTrackerMemberDepartmentsDepartmentId.ts`

**경로**: `test/results/qwen/qwen3-coder-next/erp/realize/src/providers/putHrmTrackerMemberDepartmentsDepartmentId.ts`

#### 컴파일 에러 메시지

```
TS2353: Object literal may only specify known properties, and 'employee_roles' does not exist in type 'hrm_tracker_rolesWhereInput'.
```

#### DB 스키마 (`hrm_tracker_roles`)

```prisma
model hrm_tracker_roles {
  id                             String    @id @db.Uuid
  hrm_tracker_organization_id    String    @db.Uuid
  name                           String
  description                    String?
  is_custom                      Boolean
  is_default                     Boolean
  created_at                     DateTime  @db.Timestamptz
  updated_at                     DateTime  @db.Timestamptz
  deleted_at                     DateTime? @db.Timestamptz

  organization        hrm_tracker_organizations        @relation(...)
  employees           hrm_tracker_employees[]
  permissions         hrm_tracker_permissions[]
  employeeAssignments hrm_tracker_employee_roles[]      -- 관계명: employeeAssignments
  rolePermissions     hrm_tracker_role_permissions[]
  // ...
}
```

#### 문제의 코드

```typescript
const hasOrgManagePermission = await MyGlobal.prisma.hrm_tracker_roles.findFirst({
  where: {
    organization: { id: existing.hrm_tracker_organization_id },
    employee_roles: {                    // *** 에러: employee_roles는 관계명이 아님 ***
      some: { employee_id: employee.id },
    },
    permissions: {
      some: { permission: "org:manage" },
    },
  },
});
```

#### 오류 원인 분석

`hrm_tracker_roles` 모델에서 `hrm_tracker_employee_roles`와의 관계명은 `employeeAssignments`이지 `employee_roles`가 아니다. Prisma WhereInput에서 관계를 참조할 때는 **모델에 정의된 관계 프로퍼티명**을 사용해야 한다. LLM이 테이블명(`hrm_tracker_employee_roles`)에서 유추한 `employee_roles`를 관계명으로 사용했지만, 실제 Prisma 관계명은 `employeeAssignments`이다.

#### 올바른 코드

```typescript
const hasOrgManagePermission = await MyGlobal.prisma.hrm_tracker_roles.findFirst({
  where: {
    organization: { id: existing.hrm_tracker_organization_id },
    employeeAssignments: {               // 올바른 관계명 사용
      some: { employee_id: employee.id },
    },
    permissions: {
      some: { permission: "org:manage" },
    },
  },
});
```

#### 권고 조치사항

- Prisma 모델의 **관계 프로퍼티명**(camelCase)을 정확히 사용
- 테이블명(snake_case)이 아닌 모델 내 정의된 관계명으로 WhereInput을 구성

---

## 종합 권고사항

### 1. 반복 패턴별 분류

| 에러 패턴 | 발생 횟수 | 영향 시나리오 |
|-----------|-----------|--------------|
| **존재하지 않는 컬럼/관계명 참조** | 6건 | Reddit, Shopping, ERP 전체 |
| **재귀 Transformer select/transform 불일치** | 3건 | Reddit, Shopping |
| **nullable 타입 불일치 (null vs non-null)** | 2건 | Shopping, ERP |
| **환각(hallucination) 함수/필드 호출** | 2건 | Reddit, Shopping |
| **중복 속성명/네이밍 혼동** | 2건 | Shopping, ERP |

### 2. 근본 원인

1. **Prisma 스키마 미참조**: LLM이 Prisma 스키마의 실제 컬럼명과 관계명을 확인하지 않고 유추에 의존. `bbs_user_id`, `member_id`, `actor_id`, `employee_roles` 등 실존하지 않는 이름을 사용하는 패턴이 반복됨.

2. **재귀 구조 처리 미숙**: 자기 참조(self-referencing) 관계에서 `select()` 깊이와 `transform()` 재귀 호출의 타입 일관성을 유지하지 못함. 중첩 2단계 이상에서 필드 누락이 발생.

3. **테이블 간 컬럼 혼동**: 서로 다른 테이블의 유사한 컬럼명(`is_suspended` in sellers vs customers, `user_id` vs `admin_id`)을 혼동.

4. **nullable 판단 미흡**: NOT NULL FK 관계에서 관계 객체를 불필요하게 nullable로 처리하거나, non-nullable DTO 필드에 null을 할당.

### 3. 시스템 프롬프트 개선 권고

1. **스키마 참조 강제**: provider/transformer 코드 생성 시 반드시 해당 테이블의 Prisma 스키마를 인라인으로 참조하도록 프롬프트에 명시

2. **재귀 Transformer 가이드라인 추가**: 자기 참조 관계의 `select()` 깊이와 `transform()` 반환 타입의 일관성을 보장하는 패턴을 예시로 제공

3. **nullable 판별 규칙 명시**: FK가 NOT NULL이면 관계 객체도 non-nullable, FK가 nullable이면 관계 객체도 nullable이라는 규칙을 명문화

4. **관계명 vs 테이블명 구분 강조**: Prisma WhereInput에서 관계를 참조할 때 모델에 정의된 camelCase 관계 프로퍼티명을 사용해야 한다는 점을 강조

5. **create/select 타입 검증 단계 추가**: Prisma `create()`의 `data`와 `select`에 사용하는 필드가 실제 스키마에 존재하는지 검증하는 self-check 단계를 프롬프트에 포함
