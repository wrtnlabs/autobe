# qwen/qwen3.5-35b-a3b 모델 Realize 단계 컴파일 오류 진단서

## 개요

| 시나리오 | 오류 파일 수 | 핵심 오류 유형 |
|----------|-------------|---------------|
| reddit   | 2개 파일    | Prisma select에서 relation 미포함, 존재하지 않는 프로퍼티 접근 |
| shopping | 4개 파일    | Prisma select/include에서 relation 미포함, DTO 타입 불일치, 스키마에 없는 필드 |
| erp      | 5개 파일    | DTO 스펙 불일치(owner_id vs owner), relation 미포함, 스키마에 없는 필드, 타입 불일치 |

총 **11개 컴파일 에러 파일**, 핵심 원인은 **Prisma select 절에서 relation을 포함하지 않고 transform 로직에서 relation 객체에 접근**하는 패턴이 반복적으로 발생하며, **DTO 인터페이스 스펙과 실제 반환값의 구조적 불일치**가 동반됨.

---

## 시나리오 1: reddit (2개 컴파일 에러)

### 에러 1-1: `src/transformers/RedditCommunityCommentAtSummaryTransformer.ts`

#### 컴파일 에러 메시지

```
- Object literal may only specify known properties, and 'userProfiles' does not exist in type 'reddit_community_file_of_usersSelect<DefaultArgs>'.
- Property 'parent' does not exist on type '{ created_at: Date; id: string; updated_at: Date; deleted_at: Date | null; body: string; reddit_community_members_id: string; reddit_community_posts_id: string; parent_comment_id: string | null; }'.
- Property '_count' does not exist on type '{ ... }'.
- Property 'author' does not exist on type '{ ... }'.
```

#### DB 스키마 (`schema-04-comments.prisma`)

```prisma
model reddit_community_comments {
  id                          String    @id @db.Uuid
  reddit_community_members_id String    @db.Uuid
  reddit_community_posts_id   String    @db.Uuid
  parent_comment_id           String?   @db.Uuid
  body                        String
  created_at                  DateTime  @db.Timestamptz
  updated_at                  DateTime  @db.Timestamptz
  deleted_at                  DateTime? @db.Timestamptz

  // BELONGED RELATIONS
  author  reddit_community_members   @relation(fields: [reddit_community_members_id], references: [id], onDelete: Cascade)
  post    reddit_community_posts     @relation(fields: [reddit_community_posts_id], references: [id], onDelete: Cascade)
  parent  reddit_community_comments? @relation("recursive", fields: [parent_comment_id], references: [id], onDelete: Cascade)

  // HAS RELATIONS
  replies reddit_community_comments[] @relation("recursive")
  ...
}
```

```prisma
model reddit_community_members {
  id            String    @id @db.Uuid
  email         String
  username      String
  password_hash String
  created_at    DateTime  @db.Timestamptz
  updated_at    DateTime  @db.Timestamptz
  deleted_at    DateTime? @db.Timestamptz

  // HAS RELATIONS
  userAvatarFiles reddit_community_file_of_users[]
  karma           reddit_community_user_karmas?
  ...
}
```

#### 문제의 코드

```typescript
export namespace RedditCommunityCommentAtSummaryTransformer {
  export function select(): Prisma.reddit_community_commentsFindManyArgs {
    return {
      select: {
        id: true,
        created_at: true,
        parent: {                  // (A) relation 포함 시도
          select: {
            id: true,
            created_at: true,
          },
        },
        _count: {                  // (B) _count 포함 시도
          select: { replies: true },
        },
        author: {                  // (C) relation 포함 시도
          select: {
            id: true,
            username: true,
            created_at: true,
            karma: {
              select: { current_score: true },
            },
            userAvatarFiles: {
              select: {
                id: true,
                userProfiles: {    // (D) 존재하지 않는 relation
                  select: { ... },
                },
              },
            },
          },
        },
      },
    } satisfies Prisma.reddit_community_commentsFindManyArgs;
  }
  export async function transform(input: Payload): Promise<IRedditCommunityComment.ISummary> {
    const parentComment = input.parent ? ... : null;   // parent 접근
    return {
      id: input.id,
      voteScore: 0,
      createdAt: toISOStringSafe(input.created_at),
      parentComment,
      replyCount: input._count.replies,                // _count 접근
      author: await RedditCommunityMemberAtSummaryTransformer.transform(input.author), // author 접근
    };
  }
}
```

#### 오류 원인 분석

**핵심 원인**: `select` 절에서 `parent`, `_count`, `author` relation을 포함하고 있으나, `satisfies Prisma.reddit_community_commentsFindManyArgs` 타입 체크 시점에 Prisma가 생성한 실제 타입과 맞지 않는 문제가 있음. `select`에서 스칼라 필드만 선택하면 Prisma는 relation 필드를 반환 타입에서 제거함.

**구체적 문제점**:
1. **(A)(B)(C)** `select` 절에 `parent`, `_count`, `author`를 넣었지만, `FindManyArgs`의 `select` 타입 정의상 이러한 relation을 포함시키려면 올바른 중첩 select 구조가 필요. Prisma가 생성한 Payload 타입에서는 해당 relation이 포함되지 않아 `input.parent`, `input._count`, `input.author`에서 타입 에러 발생.
2. **(D)** `reddit_community_file_of_users` 모델에는 `userProfiles`라는 relation이 존재하지 않음. `reddit_community_user_profiles`는 `reddit_community_users` 모델의 relation이며, `reddit_community_file_of_users`와는 직접 관계가 없음. 모델이 전혀 다른 테이블의 relation을 혼동하여 참조.

#### 올바른 코드

```typescript
export function select() {
  return {
    select: {
      id: true,
      created_at: true,
      parent_comment_id: true,
      parent: {
        select: {
          id: true,
          created_at: true,
        },
      },
      _count: {
        select: { replies: true },
      },
      author: {
        select: {
          id: true,
          username: true,
          created_at: true,
          karma: {
            select: { current_score: true },
          },
        },
      },
    },
  } satisfies Prisma.reddit_community_commentsFindManyArgs;
}
```

`userAvatarFiles` -> `userProfiles` 체이닝은 제거해야 하며, `reddit_community_file_of_users`에는 `userProfiles` relation이 없으므로 해당 경로 자체가 잘못된 것임.

#### 권고 조치사항

- Prisma 스키마의 relation 구조를 정확히 확인한 후 select 절을 구성할 것
- `satisfies` 타입 체크를 통과하지 못하는 select 구조는 Prisma가 생성한 타입과 불일치를 의미하므로 반드시 수정 필요
- 존재하지 않는 relation(`userProfiles`)을 제거하고, 필요한 경우 올바른 경로로 join할 것

---

### 에러 1-2: `src/transformers/RedditCommunityVoteTransformer.ts`

#### 컴파일 에러 메시지

```
- Property 'author' does not exist on type '{ created_at: Date; id: string; ... author_id: string; community_id: string; title: string; post_type: string; vote_score: number; comment_count: number; }'.
- Property 'community' does not exist on type '{ ... }'. Did you mean 'community_id'?
- Property 'preview_content' does not exist on type '{ ... }'.
- Property 'voteScore' does not exist on type '{ ... body: string; ... parent_comment_id: string | null; }'.
- Property 'createdAt' does not exist on type '{ ... created_at: Date; ... }'. Did you mean 'created_at'?
- Property 'replyCount' does not exist on type '{ ... }'.
- Property 'author' does not exist on type '{ ... body: string; ... }'.
```

#### DB 스키마 (`schema-05-votes.prisma`)

```prisma
model reddit_community_votes {
  id                String    @id @db.Uuid
  member_id         String    @db.Uuid
  target_post_id    String?   @db.Uuid
  target_comment_id String?   @db.Uuid
  vote_type         String
  created_at        DateTime  @db.Timestamptz
  updated_at        DateTime  @db.Timestamptz
  deleted_at        DateTime? @db.Timestamptz

  // BELONGED RELATIONS
  member        reddit_community_members   @relation(...)
  targetPost    reddit_community_posts?    @relation(...)
  targetComment reddit_community_comments? @relation(...)

  // HAS RELATIONS
  karmaSnapshots reddit_community_karma_snapshots[]
  postTarget     reddit_community_vote_of_posts?
  commentVote    reddit_community_vote_of_comments?
}
```

```prisma
model reddit_community_posts {
  id            String  @id @db.Uuid
  author_id     String  @db.Uuid
  community_id  String  @db.Uuid
  title         String
  post_type     String
  vote_score    Int     @db.Integer
  comment_count Int     @db.Integer
  -- 주의: preview_content 컬럼 없음 --
  ...
  author    reddit_community_members     @relation(...)
  community reddit_community_communities @relation(...)
}
```

#### 문제의 코드

```typescript
export function select() {
  return {
    select: {
      id: true,
      vote_type: true,
      created_at: true,
      updated_at: true,
      deleted_at: true,
      member: true,           // relation을 true로 포함 (전체 스칼라 필드만 반환)
      targetPost: true,       // relation을 true로 포함 (전체 스칼라 필드만 반환)
      targetComment: true,    // relation을 true로 포함 (전체 스칼라 필드만 반환)
      karmaSnapshots: true,
      postTarget: true,
      commentVote: true,
    },
  } satisfies Prisma.reddit_community_votesFindManyArgs;
}

export async function transform(input: Payload): Promise<IRedditCommunityVote> {
  return {
    ...
    targetPost: input.targetPost ? {
      id: input.targetPost.id,
      title: input.targetPost.title,
      author: {                                    // (A) 없음 - relation 미포함
        id: input.targetPost.author.id,
        ...
      },
      community: {                                 // (B) 없음 - relation 미포함
        id: input.targetPost.community.id,
        ...
      },
      preview_content: input.targetPost.preview_content, // (C) 스키마에 없는 필드
    } : null,
    targetComment: input.targetComment ? ({
      id: input.targetComment.id,
      voteScore: input.targetComment.voteScore,    // (D) 카멜케이스 오류 - 실제는 없음
      createdAt: toISOStringSafe(input.targetComment.createdAt), // (E) created_at이 맞음
      replyCount: input.targetComment.replyCount,  // (F) 없음 - _count 미포함
      author: {                                    // (G) 없음 - relation 미포함
        id: input.targetComment.author.id,
        ...
      },
    }) : null,
    ...
  };
}
```

#### 오류 원인 분석

**핵심 원인**: `select`에서 `targetPost: true`, `targetComment: true`로 포함하면, Prisma는 해당 테이블의 **스칼라 필드만** 반환함. 중첩 relation (`author`, `community`)은 포함되지 않음.

**구체적 문제점**:
1. **(A)(B)** `targetPost: true`는 `reddit_community_posts`의 스칼라 필드(`id`, `author_id`, `community_id`, `title`, `post_type`, `vote_score`, `comment_count`, ...)만 반환. `author`, `community` relation 객체는 포함되지 않아 `input.targetPost.author`가 존재하지 않음.
2. **(C)** `reddit_community_posts` 스키마에 `preview_content` 컬럼이 존재하지 않음. 모델이 hallucination한 필드.
3. **(D)(E)(F)** `targetComment: true`는 `reddit_community_comments`의 스칼라 필드만 반환. `voteScore`, `createdAt`, `replyCount` 같은 camelCase 프로퍼티는 존재하지 않으며, 실제 스칼라 필드는 `body`, `created_at`, `parent_comment_id` 등 snake_case임. `replyCount`는 `_count` 쿼리가 필요하고, `voteScore`는 votes 테이블에서 별도 집계가 필요함.
4. **(G)** `targetComment`에서도 `author` relation이 포함되지 않아 접근 불가.

#### 올바른 코드

```typescript
export function select() {
  return {
    select: {
      id: true,
      vote_type: true,
      created_at: true,
      updated_at: true,
      deleted_at: true,
      member: {
        select: {
          id: true,
          username: true,
          created_at: true,
        },
      },
      targetPost: {
        select: {
          id: true,
          title: true,
          post_type: true,
          vote_score: true,
          comment_count: true,
          created_at: true,
          author: {
            select: {
              id: true,
              username: true,
              created_at: true,
            },
          },
          community: {
            select: {
              id: true,
              name: true,
              description: true,
              subscriber_count: true,
              created_at: true,
              updated_at: true,
              deleted_at: true,
              owner: {
                select: {
                  id: true,
                  username: true,
                  created_at: true,
                },
              },
            },
          },
        },
      },
      targetComment: {
        select: {
          id: true,
          body: true,
          created_at: true,
          parent_comment_id: true,
          _count: {
            select: { replies: true },
          },
          author: {
            select: {
              id: true,
              username: true,
              created_at: true,
            },
          },
        },
      },
    },
  } satisfies Prisma.reddit_community_votesFindManyArgs;
}
```

transform 함수에서는 DB 스칼라 필드명(snake_case)을 사용하여 접근하고, DTO로 변환 시 camelCase로 매핑해야 함.

#### 권고 조치사항

- Prisma `relation: true`는 스칼라 필드만 가져오며, 중첩 relation은 반드시 명시적 select가 필요함을 인지할 것
- DB 스키마에 없는 필드(`preview_content`)를 hallucination하지 않도록 스키마를 먼저 확인할 것
- DB 필드명은 snake_case(`created_at`)이며, DTO 필드명과 혼동하지 말 것

---

## 시나리오 2: shopping (4개 컴파일 에러)

### 에러 2-1: `src/providers/patchEcommerceMallCustomerRefundRequests.ts`

#### 컴파일 에러 메시지

```
- Object literal may only specify known properties, and 'status' does not exist in type 'ecommerce_mall_order_itemsSelect<DefaultArgs>'.
- Type '{ ... customer: { ... }; orderItem: { ... }; ... }[]' is not assignable to type 'ISummary[]'.
  The types of 'orderItem.order.shipping_address' are incompatible.
    Type '{ ... } | null' is not assignable to type 'ISummary'.
      Type 'null' is not assignable to type 'ISummary'.
- Property 'customer' does not exist on type '{ id: string; status: string; ... ecommerce_mall_order_item_id: string; ... ecommerce_mall_customer_id: string; ... }'.
- Property 'orderItem' does not exist on type '{ ... }'.
```

#### DB 스키마 (`schema-11-refundrequest.prisma`)

```prisma
model ecommerce_mall_refund_requests {
  id                          String    @id @db.Uuid
  ecommerce_mall_customer_id  String    @db.Uuid
  ecommerce_mall_order_item_id String   @db.Uuid
  refund_code                 String
  status                      String
  reason                      String
  evidence_description        String?
  seller_response             String?
  rejection_reason            String?
  delivery_date               DateTime  @db.Timestamptz
  submitted_at                DateTime? @db.Timestamptz
  decision_at                 DateTime? @db.Timestamptz
  processed_at                DateTime? @db.Timestamptz
  created_at                  DateTime  @db.Timestamptz
  updated_at                  DateTime  @db.Timestamptz
  deleted_at                  DateTime? @db.Timestamptz

  // BELONGED RELATIONS
  customer  ecommerce_mall_customers    @relation(...)
  orderItem ecommerce_mall_order_items  @relation(...)

  // HAS RELATIONS
  inventoryRecords ecommerce_mall_inventory_records[]
  snapshots        ecommerce_mall_refund_request_snapshots[]
}
```

#### 문제의 코드

```typescript
const refunds = await MyGlobal.prisma.ecommerce_mall_refund_requests.findMany({
  where: whereInput,
  orderBy: orderByInput,
  skip,
  take: limit,
  select: {
    id: true,
    refund_code: true,
    status: true,
    delivery_date: true,
    submitted_at: true,
    decision_at: true,
    processed_at: true,
    created_at: true,
    updated_at: true,
    deleted_at: true,
    customer: {                    // (A) select에 relation 포함
      select: { id: true, email: true, status: true, created_at: true, deleted_at: true },
    },
    orderItem: {                   // (B) select에 relation 포함
      select: {
        id: true,
        product_name: true,
        ...
        status: true,              // (C) order_items에 'status' 필드가 없을 수 있음
        order: { select: { ... shippingAddress: { select: { ... is_default: true, ... } } } },
      },
    },
  },
});

// transform 로직에서:
const data = await ArrayUtil.asyncMap(refunds, async (refund) => ({
  ...
  customer: {
    id: refund.customer.id,        // (D) customer relation에 접근
    ...
  },
  orderItem: {
    id: refund.orderItem.id,       // (E) orderItem relation에 접근
    ...
    order: {
      ...
      shipping_address: refund.orderItem.order.shippingAddress
        ? ({ ... } satisfies IEcommerceMallAddress.ISummary)
        : null,                    // (F) shipping_address가 null일 수 있지만 ISummary는 null 불허
    },
  },
  ...
}));
```

#### 오류 원인 분석

**핵심 원인**: `select` 절과 `satisfies` 타입 검증 사이의 불일치, 그리고 Prisma Payload 타입 추론 실패.

**구체적 문제점**:
1. **(C)** `ecommerce_mall_order_items`의 select에서 `status` 필드를 포함하려 했지만, 해당 모델의 `Select` 타입에 `status`가 없을 수 있음 (order_items 스키마 확인 필요).
2. **(D)(E)** `select` 절에 `customer`와 `orderItem`을 중첩 select로 포함했음에도, TypeScript가 Payload 타입을 올바르게 추론하지 못해 refund 객체의 타입에 `customer`와 `orderItem`이 없는 것으로 추론됨. 이는 `select` 절의 구조가 `FindManyArgs`의 타입과 맞지 않기 때문.
3. **(F)** `IEcommerceMallRefundRequest.ISummary`의 `orderItem.order.shipping_address` 타입이 `ISummary` (non-null)인데, 실제 데이터에서는 `shippingAddress`가 null일 수 있어 `null`이 할당 불가.

#### 올바른 코드

```typescript
// select 절 자체를 별도 함수로 분리하고 FindManyArgs의 제네릭 타입을 정확히 활용
// order_items에 status 필드가 없다면 제거
// shipping_address null 처리 시 ISummary 타입에 맞게 non-null assertion 또는 타입 수정 필요

const refunds = await MyGlobal.prisma.ecommerce_mall_refund_requests.findMany({
  where: whereInput,
  orderBy: orderByInput,
  skip,
  take: limit,
  select: {
    id: true,
    refund_code: true,
    status: true,
    // ...기타 스칼라 필드
    customer: {
      select: { id: true, email: true, status: true, created_at: true, deleted_at: true },
    },
    orderItem: {
      select: {
        id: true,
        product_name: true,
        product_sku: true,
        variant_name: true,
        quantity: true,
        unit_price: true,
        total_price: true,
        // status 제거 (필드 존재 확인 필요)
        created_at: true,
        updated_at: true,
        deleted_at: true,
        order: {
          select: {
            id: true,
            order_number: true,
            total_price: true,
            status: true,
            created_at: true,
            deleted_at: true,
            shippingAddress: {
              select: {
                id: true,
                recipient_name: true,
                recipient_phone: true,
                street: true,
                city: true,
                state: true,
                is_default: true,
                created_at: true,
                updated_at: true,
                deleted_at: true,
              },
            },
          },
        },
      },
    },
  },
});
```

shipping_address null 처리 시 ISummary 타입이 non-null을 요구한다면, DTO 타입을 `ISummary | null`로 수정하거나, null이 아님을 보장하는 로직 추가가 필요함.

#### 권고 조치사항

- `select` 절의 relation 포함 여부와 Prisma Payload 타입 추론이 일치하는지 확인할 것
- DTO의 nullable 여부와 DB relation의 optional 여부를 일치시킬 것
- 존재하지 않는 스칼라 필드를 select에 포함하지 말 것

---

### 에러 2-2: `src/providers/patchEcommerceMallSellerRefundRequestsPending.ts`

#### 컴파일 에러 메시지

```
- Object literal may only specify known properties, and 'seller_id' does not exist in type '(Without<...> & ...) | (Without<...> & ...)'.
- Property 'orderItemId' does not exist on type 'ecommerce_mall_refund_requestsWhereInput'. Did you mean 'orderItem'?
- Property 'gte' does not exist on type 'string | Date | DateTimeNullableFilter<...>'.
- Object literal may only specify known properties, and 'postal_code' does not exist in type 'ecommerce_mall_addressesSelect<DefaultArgs>'.
- Property 'customer' does not exist on type '{ ... ecommerce_mall_customer_id: string; ... }'.
- Property 'orderItem' does not exist on type '{ ... }'.
- Type '{ ... postal_code: any; country: any; ... }' is not assignable to type 'ISummary'. 'postal_code' does not exist in type 'ISummary'.
```

#### 문제의 코드

```typescript
// (A) where 절에서 잘못된 중첩 relation 접근
const whereInput: Prisma.ecommerce_mall_refund_requestsWhereInput = {
  status: "pending",
  deleted_at: null,
  orderItem: {
    productSnapshot: {
      seller_id: props.seller.id,    // (A-1) productSnapshot에 seller_id 없음
    },
  },
};

// (B) 존재하지 않는 where 필드
if (props.body.orderItemId) {
  whereInput.orderItemId = props.body.orderItemId;  // orderItemId가 아닌 orderItem relation 필터 사용해야 함
}

// (C) submitted_at에 대한 gte 접근 오류
if (props.body.endDate) {
  whereInput.submitted_at = {
    gte: whereInput.submitted_at?.gte ?? null,  // gte가 string 타입에 없음
    lte: new Date(props.body.endDate),
  };
}

// (D) include에서 postal_code 포함
include: {
  ...
  orderItem: {
    select: {
      ...
      order: {
        select: {
          ...
          shippingAddress: {
            select: {
              ...
              postal_code: true,    // ecommerce_mall_addresses에 postal_code 없을 수 있음
              country: true,        // 마찬가지
            },
          },
        },
      },
    },
  },
},

// (E) transform에서 relation 접근 - include 사용했지만 Prisma 타입이 스칼라만 반환
const transformedData = await ArrayUtil.asyncMap(data, async (request) => {
  return {
    ...
    customer: {
      id: request.customer.id,       // customer relation 접근 불가
      ...
    },
    orderItem: {
      id: request.orderItem.id,      // orderItem relation 접근 불가
      ...
      order: {
        ...
        shipping_address: {
          ...
          postal_code: request.orderItem.order.shippingAddress.postal_code,
          country: request.orderItem.order.shippingAddress.country,
          ...
        } satisfies IEcommerceMallAddress.ISummary,  // postal_code가 ISummary에 없음
      },
    },
  };
});
```

#### 오류 원인 분석

**핵심 원인**: 여러 계층에서 동시 다발적 오류 발생.

**구체적 문제점**:
1. **(A-1)** `ecommerce_mall_snapshots` 모델에는 `seller_id` 필드가 없으며, `orderItem` -> `productSnapshot`이라는 경로도 잘못됨. `ecommerce_mall_order_items`에서 snapshot 참조 시 올바른 relation 이름을 사용해야 함.
2. **(B)** `whereInput.orderItemId`는 Prisma WhereInput 타입에 존재하지 않음. relation 필터는 `orderItem: { ecommerce_mall_order_item_id: ... }` 또는 `ecommerce_mall_order_item_id: ...`로 접근해야 함.
3. **(C)** `submitted_at` 필터를 재할당할 때 이전 값의 `gte` 프로퍼티에 접근하려 하지만, 타입이 `string | Date | DateTimeNullableFilter`의 union이므로 `gte` 접근이 불가. 타입 가드 필요.
4. **(D)** `ecommerce_mall_addresses` 모델의 `Select` 타입에 `postal_code` 필드가 존재하지 않음 (DB 스키마 확인 필요).
5. **(E)** `include`와 `select`를 동시에 사용할 수 없으며, `include`를 사용해도 중첩 relation에 대해 `select`를 지정하면 Prisma 타입이 올바르게 추론되지 않을 수 있음.
6. `IEcommerceMallAddress.ISummary`에 `postal_code`, `country` 필드가 없어 `satisfies` 검증 실패.

#### 올바른 코드

```typescript
// where 절 수정
const whereInput: Prisma.ecommerce_mall_refund_requestsWhereInput = {
  status: "pending",
  deleted_at: null,
  orderItem: {
    order: {
      // seller 필터링을 위한 올바른 경로 확인 필요
    },
  },
};

// orderItemId -> ecommerce_mall_order_item_id로 수정
if (props.body.orderItemId) {
  whereInput.ecommerce_mall_order_item_id = props.body.orderItemId;
}

// submitted_at 필터 수정
if (props.body.startDate) {
  whereInput.submitted_at = { gte: new Date(props.body.startDate) };
}
if (props.body.endDate) {
  const existing = whereInput.submitted_at;
  if (existing && typeof existing === 'object' && 'gte' in existing) {
    whereInput.submitted_at = { ...existing, lte: new Date(props.body.endDate) };
  } else {
    whereInput.submitted_at = { lte: new Date(props.body.endDate) };
  }
}

// postal_code, country 제거 (ISummary에 없는 필드)
// include 대신 select만 사용하여 타입 일관성 확보
```

#### 권고 조치사항

- Prisma WhereInput의 필드명은 모델의 스칼라 필드명 또는 relation 이름과 일치해야 함
- `include`와 `select`는 동시 사용 불가. 하나만 선택할 것
- DTO ISummary에 정의된 필드만 반환하도록 select 절과 transform 로직을 일치시킬 것
- where 절의 중첩 relation 경로가 실제 스키마와 일치하는지 검증할 것

---

### 에러 2-3: `src/transformers/EcommerceMallCategoryAtTreeTransformer.ts`

#### 컴파일 에러 메시지

```
- Property 'children' does not exist on type '{ id: string; created_at: Date; name: string; updated_at: Date; display_order: number; deleted_at: Date | null; slug: string; description: string | null; parent_id: string | null; icon_uri: string | null; is_active: boolean; }'.
```

#### DB 스키마 (`schema-01-categories.prisma`)

```prisma
model ecommerce_mall_categories {
  id            String    @id @db.Uuid
  parent_id     String?   @db.Uuid
  name          String
  slug          String
  description   String?
  display_order Int       @db.Integer
  icon_uri      String?   @db.VarChar(80000)
  is_active     Boolean
  created_at    DateTime  @db.Timestamptz
  updated_at    DateTime  @db.Timestamptz
  deleted_at    DateTime? @db.Timestamptz

  // BELONGED RELATIONS
  parent ecommerce_mall_categories? @relation("recursive", fields: [parent_id], references: [id], onDelete: Cascade)

  // HAS RELATIONS
  children ecommerce_mall_categories[] @relation("recursive")
  snapshots ecommerce_mall_category_snapshots[]
  products  ecommerce_mall_products[]
}
```

#### 문제의 코드

```typescript
export function select(): Prisma.ecommerce_mall_categoriesFindManyArgs {
  return {
    select: {
      id: true,
      name: true,
      slug: true,
      description: true,
      display_order: true,
      icon_uri: true,
      created_at: true,
      updated_at: true,
      children: {                   // (A) select 안에서 children relation 포함
        select: {
          id: true,
          name: true,
          slug: true,
          description: true,
          display_order: true,
          icon_uri: true,
          is_active: true,
          created_at: true,
          updated_at: true,
          deleted_at: true,
        },
      } satisfies Prisma.ecommerce_mall_categoriesFindManyArgs,  // (B) 잘못된 satisfies
    },
  } satisfies Prisma.ecommerce_mall_categoriesFindManyArgs;
}

export async function transform(input: Payload): Promise<IEcommerceMallCategory.ITree> {
  return {
    ...
    children: await ArrayUtil.asyncMap(
      input.children,              // (C) children 접근 실패
      EcommerceMallCategoryAtTreeTransformer.transform,
    ),
  };
}
```

#### 오류 원인 분석

**핵심 원인**: `select` 절 내부에서 `children` relation을 포함했지만 Prisma Payload 타입에 반영되지 않음.

**구체적 문제점**:
1. **(A)** `select` 절에 `children`을 포함하고 중첩 select를 구성했으나, Prisma가 생성한 `Payload` 타입에 `children`이 포함되지 않음. 이는 `FindManyArgs`의 타입 시스템에서 relation 포함 방식이 올바르지 않기 때문.
2. **(B)** `children`의 select 객체에 `satisfies Prisma.ecommerce_mall_categoriesFindManyArgs`를 붙였는데, children의 select는 `FindManyArgs`가 아닌 해당 relation의 select 타입이어야 함.
3. **(C)** `input.children`이 타입에 존재하지 않아 접근 불가.

또한 `children`이 1단계 깊이만 select하므로 재귀적 트리 변환(`transform`을 재귀 호출)에서 2단계 이상 자식의 `children` 필드가 없어 런타임 에러가 발생할 수 있음.

#### 올바른 코드

```typescript
export function select(): Prisma.ecommerce_mall_categoriesFindManyArgs {
  return {
    select: {
      id: true,
      name: true,
      slug: true,
      description: true,
      display_order: true,
      icon_uri: true,
      created_at: true,
      updated_at: true,
      children: {
        select: {
          id: true,
          name: true,
          slug: true,
          description: true,
          display_order: true,
          icon_uri: true,
          is_active: true,
          created_at: true,
          updated_at: true,
          deleted_at: true,
        },
      },
    },
  };
}
```

`satisfies` 제거 또는 올바른 타입으로 변경하고, 재귀 트리 구조가 필요하다면 Prisma의 한계상 raw query 또는 별도 재귀 로직을 구현해야 함.

#### 권고 조치사항

- `satisfies` 타입을 중첩 relation의 select에 잘못 적용하지 말 것
- Prisma는 무한 깊이 재귀 select를 지원하지 않으므로, 트리 구조는 여러 번 쿼리하거나 raw SQL 사용을 고려할 것

---

### 에러 2-4: `src/transformers/EcommerceMallSnapshotTransformer.ts`

#### 컴파일 에러 메시지

```
- Property 'entity_id' does not exist on type '{ id: string; created_at: Date; updated_at: Date; actor: { ... } | null; entity_type: string; snapshot_data: string; version: number; entity: { ... }; ... }'.  Did you mean 'entity'?
- Type '... | { email: string; id: string; status: string; created_at: Date; deleted_at: Date | null; } | null | undefined' is not assignable to type '... ISummary | null | undefined'.
  Type '{ email: string; id: string; status: string; created_at: Date; deleted_at: Date | null; }' is missing: full_name, display_name, grade, updated_at
```

#### DB 스키마 (`schema-09-snapshots.prisma`)

```prisma
model ecommerce_mall_snapshots {
  id          String    @id @db.Uuid
  actor_id    String?   @db.Uuid
  entity_id   String    @db.Uuid
  entity_type String
  snapshot_data String
  version     Int       @db.Integer
  created_at  DateTime  @db.Timestamptz
  updated_at  DateTime  @db.Timestamptz

  // BELONGED RELATIONS
  actor  ecommerce_mall_customers? @relation(...)
  entity ecommerce_mall_products   @relation(...)

  // HAS RELATIONS
  orderItemProductSnapshots  ecommerce_mall_order_items[] @relation(...)
  orderItemVariantSnapshots  ecommerce_mall_order_items[] @relation(...)
  orderItemSellerSnapshots   ecommerce_mall_order_items[] @relation(...)
  notificationOfAdminSnapshot ecommerce_mall_notification_of_admin_snapshots?
}
```

#### 문제의 코드

```typescript
export function select() {
  return {
    select: {
      id: true,
      entity_type: true,
      snapshot_data: true,
      version: true,
      created_at: true,
      updated_at: true,
      actor: {
        select: { id: true, email: true, status: true, created_at: true, deleted_at: true },
      },
      entity: true,
      orderItemProductSnapshots: true,
      orderItemVariantSnapshots: true,
      orderItemSellerSnapshots: true,
      notificationOfAdminSnapshot: true,
    },
  } satisfies Prisma.ecommerce_mall_snapshotsFindManyArgs;
}

export async function transform(input: Payload): Promise<IEcommerceMallSnapshot> {
  return {
    id: input.id,
    entity_id: input.entity_id,            // (A) select에서 entity_id를 포함하지 않음
    entity_type: input.entity_type,
    snapshot_data: input.snapshot_data,
    version: input.version,
    created_at: input.created_at.toISOString(),
    updated_at: input.updated_at.toISOString(),
    actor_id: input.actor?.id ?? null,
    actor: input.actor ?? (null as ...),   // (B) actor 타입 불일치
    entity: input.entity as unknown as ...,
  };
}
```

#### 오류 원인 분석

**핵심 원인**: `select`에서 특정 스칼라 필드를 지정하면 나머지 스칼라 필드는 포함되지 않음.

**구체적 문제점**:
1. **(A)** `select` 절에서 `entity_id: true`를 포함하지 않았음. `select`를 사용하면 명시된 필드만 반환되므로, `entity_id`에 접근할 수 없음. `entity: true`를 포함했지만 이는 `entity` relation 객체를 의미하며 `entity_id` 스칼라 필드와는 다름.
2. **(B)** `actor`를 `{ id, email, status, created_at, deleted_at }` 5개 필드만 select했는데, `IEcommerceMallSnapshot`의 `actor` 타입이 `IEcommerceMallCustomer.ISummary | IEcommerceMallSeller.ISummary | IEcommerceMallAdmin.ISummary | IEcommerceMallSuperAdmin.ISummary | null`임. `ISummary` 타입에는 `full_name`, `display_name`, `grade`, `updated_at` 등의 필드가 추가로 필요하여 타입 불일치 발생.

#### 올바른 코드

```typescript
export function select() {
  return {
    select: {
      id: true,
      entity_id: true,          // entity_id 추가
      entity_type: true,
      snapshot_data: true,
      version: true,
      created_at: true,
      updated_at: true,
      actor_id: true,           // actor_id도 필요하면 추가
      actor: {
        select: {
          id: true,
          email: true,
          status: true,
          full_name: true,      // ISummary에 필요한 필드 추가
          display_name: true,
          grade: true,
          created_at: true,
          updated_at: true,
          deleted_at: true,
        },
      },
      entity: true,
    },
  };
}
```

#### 권고 조치사항

- `select`를 사용할 때 `entity_id`처럼 transform에서 접근하는 모든 스칼라 필드를 반드시 포함할 것
- actor relation의 select에서 DTO ISummary가 요구하는 모든 필드를 포함할 것
- polymorphic actor 타입(Customer/Seller/Admin/SuperAdmin)에 대해서는 별도 변환 로직이 필요할 수 있음

---

## 시나리오 3: erp (5개 컴파일 에러)

### 에러 3-1: `src/providers/getHrmsMemberOrganizationsOrganizationId.ts`

#### 컴파일 에러 메시지

```
- Object literal may only specify known properties, and 'owner_id' does not exist in type 'ISummary'.
```

#### DB 스키마 (`schema-03-organizations.prisma`)

```prisma
model hrms_organizations {
  id                String    @id @db.Uuid
  owner_id          String    @db.Uuid
  name              String
  description       String?
  logo_uri          String?   @db.VarChar(80000)
  currency          String
  timezone          String
  fiscal_start_month Int      @db.Integer
  created_at        DateTime  @db.Timestamptz
  updated_at        DateTime  @db.Timestamptz
  deleted_at        DateTime? @db.Timestamptz

  // BELONGED RELATIONS
  owner hrms_members @relation(...)
  ...
}
```

#### API DTO 스펙 (`IHrmsOrganization.ISummary`)

```typescript
export type ISummary = {
  id: string & tags.Format<"uuid">;
  name: string;
  description: string | null;
  logo_uri: string | null;
  currency: string;
  timezone: string;
  fiscal_start_month: number & tags.Type<"int32"> & tags.Minimum<1> & tags.Maximum<12>;
  owner: IHrmsMember.ISummary;    // owner_id가 아닌 owner 객체!
  created_at: string & tags.Format<"date-time">;
  updated_at: string & tags.Format<"date-time">;
  deleted_at: (string & tags.Format<"date-time">) | null;
};
```

#### 문제의 코드

```typescript
const organization = await MyGlobal.prisma.hrms_organizations.findUniqueOrThrow({
  where: { id: props.organizationId, deleted_at: null },
  select: {
    id: true,
    owner_id: true,       // FK 스칼라 필드만 가져옴
    name: true,
    description: true,
    logo_uri: true,
    currency: true,
    timezone: true,
    fiscal_start_month: true,
    created_at: true,
    updated_at: true,
    deleted_at: true,
  },
});

return {
  id: organization.id,
  owner_id: organization.owner_id as string & tags.Format<"uuid">,  // (A) ISummary에 owner_id 없음
  name: organization.name,
  description: organization.description ?? null,
  logo_uri: organization.logo_uri ?? null,
  currency: organization.currency,
  timezone: organization.timezone,
  fiscal_start_month: organization.fiscal_start_month,
  created_at: organization.created_at.toISOString(),
  updated_at: organization.updated_at.toISOString(),
  deleted_at: organization.deleted_at?.toISOString() ?? null,
} satisfies IHrmsOrganization.ISummary;
```

#### 오류 원인 분석

**핵심 원인**: DTO `ISummary`는 `owner: IHrmsMember.ISummary` (객체)를 요구하는데, 코드는 `owner_id: string` (FK 스칼라)을 반환.

**구체적 문제점**:
1. **(A)** `ISummary` 타입에 `owner_id` 프로퍼티가 없음. `owner`라는 `IHrmsMember.ISummary` 타입의 프로퍼티가 있음.
2. select에서 `owner` relation을 포함하지 않고 `owner_id` 스칼라만 가져왔으므로, owner 멤버 정보를 조회할 수 없음.

#### 올바른 코드

```typescript
const organization = await MyGlobal.prisma.hrms_organizations.findUniqueOrThrow({
  where: { id: props.organizationId, deleted_at: null },
  select: {
    id: true,
    name: true,
    description: true,
    logo_uri: true,
    currency: true,
    timezone: true,
    fiscal_start_month: true,
    created_at: true,
    updated_at: true,
    deleted_at: true,
    owner: {
      select: {
        id: true,
        email: true,
        display_name: true,
        avatar_uri: true,
        phone_number: true,
        created_at: true,
        updated_at: true,
        deleted_at: true,
      },
    },
  },
});

return {
  id: organization.id,
  name: organization.name,
  description: organization.description ?? null,
  logo_uri: organization.logo_uri ?? null,
  currency: organization.currency,
  timezone: organization.timezone,
  fiscal_start_month: organization.fiscal_start_month,
  owner: {
    id: organization.owner.id,
    email: organization.owner.email,
    display_name: organization.owner.display_name,
    avatar_uri: organization.owner.avatar_uri,
    phone_number: organization.owner.phone_number,
    created_at: toISOStringSafe(organization.owner.created_at),
    updated_at: toISOStringSafe(organization.owner.updated_at),
    deleted_at: organization.owner.deleted_at ? toISOStringSafe(organization.owner.deleted_at) : null,
  },
  created_at: toISOStringSafe(organization.created_at),
  updated_at: toISOStringSafe(organization.updated_at),
  deleted_at: organization.deleted_at ? toISOStringSafe(organization.deleted_at) : null,
} satisfies IHrmsOrganization.ISummary;
```

#### 권고 조치사항

- DTO 인터페이스에서 relation 객체를 요구할 때(`owner: IHrmsMember.ISummary`), FK 스칼라(`owner_id`)가 아닌 relation을 select에 포함할 것
- `satisfies` 타입 검증이 실패하면 DTO 정의를 반드시 먼저 확인할 것

---

### 에러 3-2: `src/providers/getHrmsMemberProjectsProjectIdTasksTaskIdStatusHistory.ts`

#### 컴파일 에러 메시지

```
- Type '{ id: string & Format<"uuid">; old_status: string; new_status: string; created_at: string & Format<"date-time">; updated_at: string & Format<"date-time">; deleted_at: string & Format<"date-time">; performed_by: { ... }; task: { ... }; }[]' is not assignable to type 'IHrmsTaskStatusHistory[]'.
```

#### API DTO 스펙

```typescript
export type IHrmsTaskStatusHistory = "open" | "in-progress" | "completed" | "closed";
export namespace IHrmsTaskStatusHistory {
  export type ISummary = {
    id: string & tags.Format<"uuid">;
    old_status: string;
    new_status: string;
    member: IHrmsMember.ISummary;     // 'performed_by'가 아닌 'member'
    task: IHrmsTask.ISummary;         // IHrmsTask.ISummary 전체 (id만이 아님)
    created_at: string & tags.Format<"date-time">;
    updated_at: string & tags.Format<"date-time">;
    deleted_at: (string & tags.Format<"date-time">) | null;
  };
}
```

#### DB 스키마 (`schema-06-projects.prisma`)

```prisma
model hrms_task_status_histories {
  id             String    @id @db.Uuid
  hrms_task_id   String    @db.Uuid
  hrms_member_id String    @db.Uuid
  old_status     String
  new_status     String
  created_at     DateTime  @db.Timestamptz
  updated_at     DateTime  @db.Timestamptz
  deleted_at     DateTime? @db.Timestamptz

  // BELONGED RELATIONS
  task   hrms_tasks   @relation(...)
  member hrms_members @relation(...)
}
```

#### 문제의 코드

```typescript
return await ArrayUtil.asyncMap(statusHistories, async (record) => ({
  id: record.id as string & tags.Format<"uuid">,
  old_status: record.old_status,
  new_status: record.new_status,
  created_at: toISOStringSafe(record.created_at),
  updated_at: toISOStringSafe(record.updated_at),
  deleted_at: toISOStringSafe(record.deleted_at ?? new Date()),  // (A) null이면 new Date()로 대체 -> 항상 non-null
  performed_by: {                  // (B) ISummary에 'performed_by' 없음, 'member'여야 함
    id: record.member.id as string & tags.Format<"uuid">,
    display_name: record.member.display_name,
    avatar_uri: record.member.avatar_uri ?? null,
  },
  task: {
    id: record.task.id as string & tags.Format<"uuid">,  // (C) IHrmsTask.ISummary에는 id 외에 더 많은 필드 필요
  },
}));
```

#### 오류 원인 분석

**핵심 원인**: 반환 타입이 `IHrmsTaskStatusHistory[]`인데 실제 `IHrmsTaskStatusHistory`는 `"open" | "in-progress" | "completed" | "closed"` 문자열 리터럴 union임. 코드에서 반환하는 객체 배열이 문자열 union 타입과 호환되지 않음.

**구체적 문제점**:
1. 함수 반환 타입이 `IHrmsTaskStatusHistory[]`로 선언되었는데, `IHrmsTaskStatusHistory` 자체가 `string` union type임. 실제 의도는 `IHrmsTaskStatusHistory.ISummary[]`여야 함.
2. **(A)** `deleted_at`이 null일 때 `new Date()`로 대체하면 항상 non-null이 되어, `ISummary.deleted_at`의 `... | null` 타입과 의미적으로 불일치.
3. **(B)** DTO에서는 `member` 프로퍼티명을 사용하는데 코드에서는 `performed_by`라는 다른 이름 사용.
4. **(C)** `task`에 `id`만 포함했지만, `IHrmsTask.ISummary`는 더 많은 필드를 요구.

#### 올바른 코드

```typescript
export async function getHrmsMemberProjectsProjectIdTasksTaskIdStatusHistory(
  props: { ... }
): Promise<IHrmsTaskStatusHistory.ISummary[]> {   // ISummary[]로 수정
  ...
  return await ArrayUtil.asyncMap(statusHistories, async (record) => ({
    id: record.id as string & tags.Format<"uuid">,
    old_status: record.old_status,
    new_status: record.new_status,
    created_at: toISOStringSafe(record.created_at),
    updated_at: toISOStringSafe(record.updated_at),
    deleted_at: record.deleted_at ? toISOStringSafe(record.deleted_at) : null,
    member: {                      // 'performed_by' -> 'member'
      id: record.member.id,
      email: record.member.email,
      display_name: record.member.display_name,
      avatar_uri: record.member.avatar_uri,
      phone_number: record.member.phone_number,
      created_at: toISOStringSafe(record.member.created_at),
      updated_at: toISOStringSafe(record.member.updated_at),
      deleted_at: record.member.deleted_at ? toISOStringSafe(record.member.deleted_at) : null,
    },
    task: {
      // IHrmsTask.ISummary의 모든 필드 포함
      id: record.task.id,
      ...
    },
  }));
}
```

#### 권고 조치사항

- 반환 타입을 `IHrmsTaskStatusHistory[]`가 아닌 `IHrmsTaskStatusHistory.ISummary[]`로 지정할 것
- DTO 프로퍼티명(`member`)과 코드의 프로퍼티명(`performed_by`)을 일치시킬 것
- `deleted_at` nullable 처리 시 임의 값(`new Date()`)으로 대체하지 말 것

---

### 에러 3-3: `src/providers/postHrmsAuthMemberJoin.ts`

#### 컴파일 에러 메시지

```
- Object literal may only specify known properties, and 'members_count' does not exist in type 'hrms_organization_rolesSelect<DefaultArgs>'.
- Type '{ ... organizationRole: { ... members_count: any; organization: { id; name; created_at; updated_at; deleted_at } } ... }' is not assignable to type 'ISummary'.
  The types of 'organizationRole.organization' are incompatible.
    Type '{ id; name; created_at; updated_at; deleted_at }' is missing: description, logo_uri, currency, timezone, and 2 more.
- Property 'member' does not exist on type '{ created_at: Date; updated_at: Date; id: string; deleted_at: Date | null; hrms_organization_role_id: string; hrms_organization_id: string; hrms_member_id: string; }'.
- Property 'organization' does not exist on type '{ ... }'.
- Property 'organizationRole' does not exist on type '{ ... }'.
```

#### DB 스키마 (`schema-03-organizations.prisma`)

```prisma
model hrms_organization_members {
  id                       String    @id @db.Uuid
  hrms_member_id           String    @db.Uuid
  hrms_organization_id     String    @db.Uuid
  hrms_organization_role_id String   @db.Uuid
  created_at               DateTime  @db.Timestamptz
  updated_at               DateTime  @db.Timestamptz
  deleted_at               DateTime? @db.Timestamptz

  // BELONGED RELATIONS
  member           hrms_members             @relation(...)
  organization     hrms_organizations       @relation(...)
  organizationRole hrms_organization_roles  @relation(...)

  // HAS RELATIONS
  employees hrms_employees[]
}

model hrms_organization_roles {
  id              String   @id @db.Uuid
  organization_id String   @db.Uuid
  name            String
  is_builtin      Boolean
  created_at      DateTime @db.Timestamptz
  updated_at      DateTime @db.Timestamptz

  // 주의: members_count 컬럼 없음
  // BELONGED RELATIONS
  organization hrms_organizations @relation(...)

  // HAS RELATIONS
  organizationMembers hrms_organization_members[]
  permissions         hrms_organization_role_permissions[]
  employees           hrms_employees[]
}
```

#### 문제의 코드

```typescript
const organizationMemberships = await MyGlobal.prisma.hrms_organization_members.findMany({
  where: { hrms_member_id: member.id, deleted_at: null },
  select: {
    id: true,
    created_at: true,
    updated_at: true,
    deleted_at: true,
    member: {                         // (A) select에 relation 포함
      select: { id: true, email: true, display_name: true, ... },
    },
    organization: {                   // (B) select에 relation 포함
      select: { id: true, name: true, ..., owner: { select: { ... } } },
    },
    organizationRole: {               // (C) select에 relation 포함
      select: {
        id: true,
        name: true,
        is_builtin: true,
        created_at: true,
        updated_at: true,
        members_count: true,          // (D) 스키마에 없는 필드!
        organization: {
          select: { id: true, name: true, created_at: true, updated_at: true, deleted_at: true },
          // (E) organization ISummary에 필요한 description, logo_uri, currency, timezone 등 미포함
        },
      },
    },
  },
});

// transform:
organizationMemberships.map((om) => ({
  id: om.id,
  member: { id: om.member.id, ... },              // (F) member relation 접근
  organization: { id: om.organization.id, ... },   // (G) organization relation 접근
  organizationRole: { id: om.organizationRole.id, ... }, // (H) organizationRole relation 접근
}))
```

#### 오류 원인 분석

**핵심 원인**: select 절에 relation을 포함했지만 Prisma Payload 타입이 스칼라 필드만 포함하는 것으로 추론됨. 또한 존재하지 않는 필드와 불완전한 중첩 select.

**구체적 문제점**:
1. **(D)** `hrms_organization_roles` 모델에 `members_count` 컬럼이 존재하지 않음. 이 값이 필요하면 `_count` 또는 별도 쿼리가 필요.
2. **(E)** `organizationRole.organization`의 select에서 `description`, `logo_uri`, `currency`, `timezone`, `fiscal_start_month`, `owner` 등 `IHrmsOrganization.ISummary`가 요구하는 필드가 누락됨.
3. **(F)(G)(H)** select 절에 relation을 포함했음에도 TypeScript가 relation이 포함된 타입을 추론하지 못함. 이는 `select`의 구조적 문제 또는 Prisma 타입 생성 이슈.

#### 올바른 코드

```typescript
const organizationMemberships = await MyGlobal.prisma.hrms_organization_members.findMany({
  where: { hrms_member_id: member.id, deleted_at: null },
  select: {
    id: true,
    created_at: true,
    updated_at: true,
    deleted_at: true,
    member: {
      select: {
        id: true, email: true, display_name: true, avatar_uri: true,
        phone_number: true, created_at: true, updated_at: true, deleted_at: true,
      },
    },
    organization: {
      select: {
        id: true, name: true, description: true, logo_uri: true,
        currency: true, timezone: true, fiscal_start_month: true,
        created_at: true, updated_at: true, deleted_at: true,
        owner: {
          select: {
            id: true, email: true, display_name: true, avatar_uri: true,
            phone_number: true, created_at: true, updated_at: true, deleted_at: true,
          },
        },
      },
    },
    organizationRole: {
      select: {
        id: true, name: true, is_builtin: true,
        created_at: true, updated_at: true,
        // members_count 제거 (스키마에 없음)
        _count: { select: { organizationMembers: true } },  // 멤버 수 필요시
        organization: {
          select: {
            id: true, name: true, description: true, logo_uri: true,
            currency: true, timezone: true, fiscal_start_month: true,
            created_at: true, updated_at: true, deleted_at: true,
            owner: { select: { id: true, email: true, display_name: true, ... } },
          },
        },
      },
    },
  },
});
```

#### 권고 조치사항

- 스키마에 없는 필드(`members_count`)를 select에 포함하지 말 것. 집계가 필요하면 `_count`를 사용할 것
- 중첩 relation의 select에서 DTO가 요구하는 모든 필드를 포함할 것
- `ISummary` 타입 정의를 확인하여 필요한 필드 목록을 정확히 파악할 것

---

### 에러 3-4: `src/providers/postHrmsMemberTimesheets.ts`

#### 컴파일 에러 메시지

```
- Object literal may only specify known properties, and 'hrms_employee_id' does not exist in type 'hrms_organization_membersSelect<DefaultArgs>'.
- Property 'hrms_employee_id' does not exist on type '{ created_at: Date; updated_at: Date; id: string; deleted_at: Date | null; hrms_organization_role_id: string; hrms_organization_id: string; hrms_member_id: string; }'.
```

#### DB 스키마

```prisma
model hrms_organization_members {
  id                        String    @id @db.Uuid
  hrms_member_id            String    @db.Uuid
  hrms_organization_id      String    @db.Uuid
  hrms_organization_role_id String    @db.Uuid
  created_at                DateTime  @db.Timestamptz
  updated_at                DateTime  @db.Timestamptz
  deleted_at                DateTime? @db.Timestamptz
  -- 주의: hrms_employee_id 컬럼 없음 --

  // HAS RELATIONS
  employees hrms_employees[]  // 역방향 relation (organization_member -> employees)
}

model hrms_employees {
  id                     String @id @db.Uuid
  organization_member_id String @db.Uuid   // 이 쪽에서 FK로 참조
  role_id                String @db.Uuid
  ...
}
```

#### 문제의 코드

```typescript
const organizationMember = await MyGlobal.prisma.hrms_organization_members.findFirstOrThrow({
  where: { hrms_member_id: session.hrms_member_id, deleted_at: null },
  select: {
    hrms_employee_id: true,    // (A) 존재하지 않는 필드
  },
});

// (B) 접근 실패
const existingTimesheet = await MyGlobal.prisma.hrms_timesheets.findFirst({
  where: { hrms_employee_id: organizationMember.hrms_employee_id, ... },
});
```

#### 오류 원인 분석

**핵심 원인**: `hrms_organization_members` 테이블에 `hrms_employee_id` 컬럼이 존재하지 않음.

**구체적 문제점**:
1. **(A)** 관계 방향을 혼동. `hrms_employees`가 `organization_member_id`로 `hrms_organization_members`를 참조하는 구조이므로, organization member에서 employee를 찾으려면 역방향 relation `employees`를 통해 접근해야 함.
2. **(B)** 존재하지 않는 필드를 select했으므로 결과 객체에도 해당 프로퍼티가 없음.

#### 올바른 코드

```typescript
const organizationMember = await MyGlobal.prisma.hrms_organization_members.findFirstOrThrow({
  where: { hrms_member_id: session.hrms_member_id, deleted_at: null },
  select: {
    id: true,
    employees: {
      select: { id: true },
      where: { deleted_at: null },
      take: 1,
    },
  },
});

const employeeId = organizationMember.employees[0]?.id;
if (!employeeId) {
  throw new HttpException("Employee not found", 404);
}

const existingTimesheet = await MyGlobal.prisma.hrms_timesheets.findFirst({
  where: { hrms_employee_id: employeeId, ... },
});
```

#### 권고 조치사항

- DB 관계 방향을 정확히 파악할 것. `organization_members` -> `employees`는 1:N 관계이며, FK는 `employees` 쪽에 있음
- 존재하지 않는 FK 컬럼을 가정하지 말고 스키마를 반드시 확인할 것

---

### 에러 3-5: `src/providers/putHrmsMemberTimelogsTimelogId.ts`

#### 컴파일 에러 메시지

```
- Object literal may only specify known properties, but 'permission' does not exist in type 'hrms_organization_rolesSelect<DefaultArgs>'. Did you mean to write 'permissions'?
- Property 'organizationRole' does not exist on type '{ created_at: Date; updated_at: Date; id: string; deleted_at: Date | null; hrms_organization_role_id: string; hrms_organization_id: string; hrms_member_id: string; }'.
- Object literal may only specify known properties, and 'id' does not exist in type 'IHrmsTimelog'.
```

#### DB 스키마

```prisma
model hrms_organization_roles {
  ...
  // HAS RELATIONS
  permissions hrms_organization_role_permissions[]  // 'permission' 아님, 'permissions'
  ...
}
```

#### API DTO 스펙 (`IHrmsTimelog`)

```typescript
export type IHrmsTimelog = {
  active_employees_count: number & tags.Type<"int32">;
  current_week_hours: number;
  pending_timesheets_count: number & tags.Type<"int32">;
  projects_with_high_utilization: IHrmsProject.ISummary[];
  current_week: IWeekRange;
  generated_at: string & tags.Format<"date-time">;
  // 주의: id, employee_id 등의 필드 없음. 이 타입은 조직 메트릭 대시보드 타입임!
};
```

#### 문제의 코드

```typescript
// (A) permission이 아닌 permissions
const employeeOrgMember = await MyGlobal.prisma.hrms_organization_members.findUnique({
  where: { id: employee.organization_member_id },
  select: {
    hrms_organization_id: true,
    organizationRole: { select: { permission: true } },   // 'permission' -> 'permissions'
  },
});

// (B) organizationRole relation 접근 불가 (별도 쿼리에서도 같은 문제)
const memberOrgMember = await MyGlobal.prisma.hrms_organization_members.findFirst({
  ...
  select: {
    organizationRole: { select: { permission: true } },   // 동일 오류
  },
});
const hasTimeManagePermission =
  memberOrgMember?.organizationRole?.permission === "time:manage";  // (C) relation 접근 실패

// (D) 반환 객체에 id 포함 -> IHrmsTimelog에 id 없음
return {
  id: updated.id,                    // IHrmsTimelog에 id 프로퍼티 없음
  employee_id: updated.employee_id,  // 마찬가지
  project_id: updated.project_id,
  ...
} satisfies IHrmsTimelog;
```

#### 오류 원인 분석

**핵심 원인**: 세 가지 별개의 문제가 동시 발생.

**구체적 문제점**:
1. **(A)** `hrms_organization_roles` 모델에서 권한은 `permissions` (복수형) relation이며, `hrms_organization_role_permissions` 테이블에 저장됨. 단수 `permission`은 존재하지 않음.
2. **(B)(C)** `select`에 `organizationRole` relation을 포함했지만 Prisma 타입에서 스칼라 필드만 반환하는 것으로 추론됨. 따라서 `organizationRole` 접근 불가.
3. **(D)** `IHrmsTimelog` 타입이 실제로는 조직 메트릭 대시보드를 표현하는 타입(`active_employees_count`, `current_week_hours`, ...)이며, 개별 timelog 엔티티를 표현하는 타입이 아님. 함수가 `IHrmsTimelog`를 반환 타입으로 사용하고 있으나, 실제 반환하는 데이터는 개별 timelog 엔티티 형태(`id`, `employee_id`, `project_id`, ...). **DTO 타입 자체가 잘못 설계되었거나, 함수의 반환 타입 지정이 잘못됨.**

#### 올바른 코드

```typescript
// permission -> permissions (relation) 수정
const employeeOrgMember = await MyGlobal.prisma.hrms_organization_members.findUnique({
  where: { id: employee.organization_member_id },
  select: {
    hrms_organization_id: true,
    organizationRole: {
      select: {
        permissions: {
          select: { permission: true },
        },
      },
    },
  },
});

// 권한 확인 로직 수정
const hasTimeManagePermission = employeeOrgMember?.organizationRole?.permissions
  ?.some(p => p.permission === "time:manage") ?? false;

// 반환 타입은 IHrmsTimelog가 아닌 별도의 timelog 엔티티 타입이어야 함
// IHrmsTimelog.IUpdate의 응답으로 적절한 타입을 사용하거나,
// 별도 인터페이스를 정의해야 함
```

#### 권고 조치사항

- Prisma relation 이름은 복수형(`permissions`)인지 단수형(`permission`)인지 스키마에서 확인할 것
- DTO 타입의 의미를 정확히 파악할 것. `IHrmsTimelog`가 대시보드 메트릭 타입인지 엔티티 타입인지 혼동하지 말 것
- 1NF 정규화된 permissions 테이블에서 권한 확인 시 배열 조회 로직 사용할 것

---

## 종합 권고사항

### 1. 반복 패턴: Prisma select 절과 relation 접근 불일치

11개 에러 파일 중 **9개 파일**에서 동일한 패턴이 반복됨:
- `select` 절에 relation을 포함했지만, Prisma가 생성한 Payload 타입에 해당 relation이 반영되지 않아 transform 로직에서 타입 에러 발생
- `relation: true`로 포함하면 해당 테이블의 스칼라 필드만 반환되며, 중첩 relation은 포함되지 않음을 반복적으로 무시

**개선 방향**: Realize 단계 시스템 프롬프트에서 Prisma select/include의 동작 방식과 타입 추론 규칙을 더 명확히 설명해야 함.

### 2. 반복 패턴: 스키마에 없는 필드 hallucination

`preview_content`, `members_count`, `hrms_employee_id`, `permission` 등 스키마에 존재하지 않는 필드를 코드에서 참조하는 경우가 다수 발생. 모델이 DB 스키마를 정확히 읽지 못하고 추측한 결과.

**개선 방향**: 코드 생성 전 DB 스키마를 참조하여 필드 존재 여부를 검증하는 단계를 강화해야 함.

### 3. 반복 패턴: DTO 인터페이스 스펙과 반환값 구조 불일치

- `owner_id` (FK 스칼라) vs `owner` (relation 객체)
- `performed_by` vs `member` (프로퍼티명 불일치)
- `IHrmsTimelog`가 대시보드 메트릭 타입인데 개별 엔티티로 사용 (타입 의미 오해)
- `IHrmsTaskStatusHistory[]` vs `IHrmsTaskStatusHistory.ISummary[]` (네임스페이스 타입 혼동)

**개선 방향**: DTO 인터페이스를 정확히 읽고, 각 프로퍼티의 이름과 타입을 코드에 그대로 반영하는 검증 루프를 강화해야 함.

### 4. qwen3.5-35b-a3b 모델 특성

전체 11개 파일에서 에러가 발생하며, 에러 유형은 **Prisma ORM 이해 부족**과 **DTO 스펙 미준수**로 집약됨. 다른 대형 모델 대비 Prisma의 relation select/include 메커니즘과 TypeScript 타입 추론에 대한 이해도가 낮은 편이며, DB 스키마를 충실히 참조하지 않고 필드를 추측하는 경향이 강함. 35B (활성 파라미터 3B) 모델의 한계로, 복잡한 관계형 데이터 매핑 작업에서는 더 큰 모델 사용을 권장함.
