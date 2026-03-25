# minimax/minimax-m2.7 Realize 단계 컴파일 에러 상세 진단

## 개요

| 시나리오 | 오류 파일 수 | 주요 오류 패턴 |
|----------|------------|--------------|
| Reddit | 8 | Prisma select에 `null` 사용, camelCase/snake_case 혼동, 릴레이션 include 누락, `file_id` 등 존재하지 않는 프로퍼티, `ISummary` 타입 불일치 |
| Shopping | 11 | `seller_profiles` 등 존재하지 않는 릴레이션명, `cancellationRequest` 릴레이션 include 누락, `null` 미처리, 미선언 변수 `n` 반복 삽입, implicit `any` |
| ERP | 7 | `erp_hrm_parent_department_id` 등 존재하지 않는 프로퍼티, 릴레이션 include 누락 (`project`, `task`, `organization`, `report`), `null` 미처리, DTO 속성 누락 |

총 26개 오류 파일, 3개 시나리오에 걸쳐 수백 건의 개별 컴파일 에러 발생.

---

## 시나리오 1: Reddit (8개 오류 파일)

**위치**: `test/results/minimax/minimax-m2.7/reddit/realize`

---

### 오류 파일 1-1: `src/providers/getRedditCloneMemberMembersSessionsSessionId.ts`

#### 컴파일 에러 메시지

```
- Type 'IRedditCloneUserProfile | { id: string; display_name: string; bio: string | null; ... owner: { ... profile: { ... avatar: { ... file: { ... uploader: { id: string; username: string; created_at: string; }; }; } | undefined; }; karma_count: number; }; avatar: ... }' is not assignable to type 'IRedditCloneUserProfile'.
  The types of 'owner.profile.avatar' are incompatible between these types.
    Type '{ ... file: { ... uploader: { id: string; username: string; created_at: string; }; }; } | undefined' is not assignable to type 'ISummary | null | undefined'.
      The types of 'file.uploader' are incompatible between these types.
        Type '{ id: string; username: string; created_at: string; }' is missing the following properties from type 'ISummary': profile, karma_count
```

#### 오류 원인 분석

`IRedditCloneMemberSession.ISummary` 타입은 `file.uploader`에 `profile`과 `karma_count` 속성을 필수로 요구한다. 그러나 코드에서 중첩된 `uploader` 객체를 구성할 때 `{ id, username, created_at }` 세 가지 속성만 제공하여 `ISummary` 타입과 호환되지 않는다. DB 쿼리의 Prisma select에서 uploader의 `profile`과 `karma` 릴레이션을 포함하지 않았기 때문에 변환 시 해당 속성을 채울 수 없다.

#### 올바른 코드

```typescript
// uploader 객체 구성 시 ISummary에 필요한 모든 속성 포함
uploader: {
  id: uploader.id,
  username: uploader.username,
  created_at: toISOStringSafe(uploader.created_at),
  profile: uploader.profile ? {
    id: uploader.profile.id,
    display_name: uploader.profile.display_name,
    bio: uploader.profile.bio ?? undefined,
    avatar: undefined,
  } : null,
  karma_count: uploader.karma?.karma_score ?? 0,
},
```

#### 권고 조치사항

- Prisma select에서 `uploader` 조회 시 반드시 `profile`과 `karma` 릴레이션을 포함하라.
- `ISummary` 타입의 전체 필드를 확인하고 모든 필수 속성을 빠짐없이 매핑하라.

---

### 오류 파일 1-2: `src/providers/patchRedditCloneMemberPostsHome.ts`

#### 컴파일 에러 메시지

```
- Object literal may only specify known properties, but 'originalFilename' does not exist in type 'reddit_clone_filesSelect<DefaultArgs>'. Did you mean to write 'original_filename'?
- Property 'author' does not exist on type '{ id: string; created_at: Date; ... reddit_clone_member_id: string; reddit_clone_community_id: string; title: string; type: string; vote_score: number; comment_count: number; }'. (19회 반복)
- Property 'community' does not exist on type (같은 타입). (19회 반복)
```

#### DB 스키마

```prisma
model reddit_clone_files {
  id                String   @id @default(uuid()) @db.Uuid
  original_filename String   // snake_case
  mime_type         String   // snake_case
  file_size         Int      // snake_case
  status            String
  created_at        DateTime @default(now())
  // ...
}

model reddit_clone_posts {
  id                        String @id @default(uuid()) @db.Uuid
  reddit_clone_member_id    String @db.Uuid
  reddit_clone_community_id String @db.Uuid
  title                     String
  type                      String
  vote_score                Int    @default(0)
  comment_count             Int    @default(0)
  // 릴레이션:
  author    reddit_clone_members     @relation(fields: [reddit_clone_member_id], ...)
  community reddit_clone_communities @relation(fields: [reddit_clone_community_id], ...)
}
```

#### 문제의 코드

```typescript
// Prisma select에서 camelCase 사용 (오류)
file: {
  select: {
    originalFilename: true,   // 오류: original_filename이어야 함
    mimeType: true,           // 오류: mime_type이어야 함
    fileSize: true,           // 오류: file_size여야 함
    createdAt: true,          // 오류: created_at이어야 함
  },
},
```

#### 오류 원인 분석

1. **camelCase vs snake_case 혼동**: Prisma select 문에서 DB 컬럼명은 스키마에 정의된 snake_case를 사용해야 하는데 camelCase로 접근했다. 이 오류가 전체 select 타입 추론을 깨뜨린다.
2. **릴레이션 타입 폴백**: select 내부의 필드명 불일치로 인해 Prisma 타입 추론이 실패하여, `author`와 `community` 릴레이션이 결과 타입에서 제거되고 기본 컬럼만 남는 타입으로 폴백된다. 이 때문에 변환 로직에서 `post.author`, `post.community` 접근 시 "Property does not exist" 에러가 연쇄 발생한다.

#### 올바른 코드

```typescript
file: {
  select: {
    id: true,
    original_filename: true,
    mime_type: true,
    file_size: true,
    status: true,
    created_at: true,
  },
},
```

#### 권고 조치사항

- Prisma select의 필드명은 반드시 스키마에 정의된 snake_case를 그대로 사용하라.
- select 내부 필드명이 하나라도 틀리면 전체 타입 추론이 깨지므로, 스키마 정의와 1:1 대조 검증을 수행하라.

---

### 오류 파일 1-3: `src/providers/patchRedditCloneMemberUsersUsernameComments.ts`

#### 컴파일 에러 메시지

```
- Object literal may only specify known properties, but 'mimeType' does not exist in type 'reddit_clone_filesSelect<DefaultArgs>'. Did you mean to write 'mime_type'?
- Property 'member' does not exist on type '{ id: string; ... reddit_clone_member_id: string; vote_score: number; reddit_clone_post_id: string; parent_comment_id: string | null; content: string; }'. (반복)
- Property 'post' does not exist on type (같은 타입). (반복)
```

#### DB 스키마

```prisma
model reddit_clone_comments {
  id                     String  @id @default(uuid()) @db.Uuid
  reddit_clone_member_id String  @db.Uuid
  reddit_clone_post_id   String  @db.Uuid
  parent_comment_id      String? @db.Uuid
  content                String
  vote_score             Int     @default(0)
  // 릴레이션:
  member reddit_clone_members @relation(fields: [reddit_clone_member_id], ...)
  post   reddit_clone_posts   @relation(fields: [reddit_clone_post_id], ...)
}
```

#### 문제의 코드

```typescript
file: {
  select: {
    original_filename: true,
    mimeType: true,         // 오류: mime_type이어야 함
    fileSize: true,         // 오류: file_size여야 함
    // ...
  },
},
```

#### 오류 원인 분석

오류 파일 1-2와 동일한 패턴이다. `mimeType`(camelCase)을 `mime_type`(snake_case) 대신 사용했고, 이로 인해 전체 Prisma select 타입 추론이 실패하여 `member`, `post` 릴레이션이 결과 타입에서 사라진다.

#### 올바른 코드

```typescript
file: {
  select: {
    id: true,
    original_filename: true,
    mime_type: true,
    file_size: true,
    status: true,
    created_at: true,
  },
},
```

#### 권고 조치사항

- 파일 관련 필드명(`original_filename`, `mime_type`, `file_size`)은 snake_case를 반드시 사용하라.

---

### 오류 파일 1-4: `src/providers/postRedditCloneAuthMemberLogin.ts`

#### 컴파일 에러 메시지

```
- Object literal may only specify known properties, and 'userKarmas' does not exist in type 'reddit_clone_membersSelect<DefaultArgs>'.
- Property 'profile' does not exist on type '{ email: string; id: string; username: string; password_hash: string; created_at: Date; updated_at: Date; deleted_at: Date | null; }'. (18회 반복)
- Property 'userKarmas' does not exist on type (같은 타입). (30회 반복)
- Type '{ ... file.uploader: { id; username; created_at; profile: { id; display_name; bio; }; }; }' is not assignable to type 'ISummary'.
  Property 'karma_count' is missing in type '{ id; username; created_at; profile: { id; display_name; bio; }; }' but required in type 'ISummary'.
- Type 'ISummary' is missing the following properties from type 'IRedditCloneUserProfile': created_at, updated_at, owner
```

#### DB 스키마

```prisma
model reddit_clone_members {
  id            String   @id @default(uuid()) @db.Uuid
  email         String   @unique
  username      String   @unique
  password_hash String
  created_at    DateTime @default(now())
  updated_at    DateTime @updatedAt
  deleted_at    DateTime?
  // 릴레이션:
  profile         reddit_clone_user_profiles?  @relation(...)
  karma           reddit_clone_user_karmas[]   @relation(...)  // 'userKarmas'가 아님
  sessions        reddit_clone_member_sessions[] @relation(...)
  // ...
}
```

#### 문제의 코드

```typescript
// Prisma select에서 존재하지 않는 릴레이션명 사용
select: {
  // ...
  userKarmas: {   // 오류: 실제 릴레이션명은 'karma' (또는 스키마에서 정의된 이름)
    select: { ... },
  },
}
```

#### 오류 원인 분석

1. **릴레이션명 불일치**: `reddit_clone_members` 모델의 karma 릴레이션명은 `karma`인데, 코드에서는 `userKarmas`라는 존재하지 않는 릴레이션명을 사용했다. 이로 인해 전체 select 타입 추론이 실패한다.
2. **연쇄 타입 추론 실패**: `userKarmas`가 인식되지 않아 select 전체가 무효화되고, `profile` 릴레이션도 결과 타입에서 사라진다.
3. **ISummary 타입 불일치**: `file.uploader` 구성 시 `karma_count` 속성을 누락했다.
4. **IRedditCloneUserProfile 불완전 매핑**: `ISummary` 타입을 `IRedditCloneUserProfile` 위치에 그대로 할당하여, `created_at`, `updated_at`, `owner` 속성이 누락되었다.

#### 올바른 코드

```typescript
select: {
  // ...
  karma: {           // 올바른 릴레이션명 사용
    select: {
      id: true,
      karma_score: true,
      created_at: true,
      updated_at: true,
    },
  },
  profile: {
    select: { /* ... */ },
  },
}
```

#### 권고 조치사항

- Prisma 스키마에 정의된 정확한 릴레이션명을 사용하라. `userKarmas` 대신 `karma`를 사용해야 한다.
- `ISummary` 타입의 필수 필드(`karma_count`, `profile`)를 모두 채워 넣어라.

---

### 오류 파일 1-5: `src/transformers/RedditCloneFileAssociationAtSummaryTransformer.ts`

#### 컴파일 에러 메시지

```
- Type '{ id: string; display_name: string; bio: string | undefined; avatar: { ... } | undefined; } | null' is not assignable to type 'ISummary'.
  Type 'null' is not assignable to type 'ISummary'.
```

#### 문제의 코드

```typescript
export async function transform(input: Payload): Promise<IRedditCloneFileAssociation.ISummary> {
  return {
    // ...
    file: {
      // ...
      uploader: {
        id: input.file.uploader.id,
        username: input.file.uploader.username,
        created_at: toISOStringSafe(input.file.uploader.created_at),
        profile: input.file.uploader.profile
          ? {
              id: input.file.uploader.profile.id,
              display_name: input.file.uploader.profile.display_name,
              bio: input.file.uploader.profile.bio ?? undefined,
              avatar: /* ... */ undefined,
            }
          : null,    // <-- 오류: ISummary 타입에 null 할당 불가
        karma_count: 0,
      },
    },
  };
}
```

#### 오류 원인 분석

`IRedditCloneMemberSession.ISummary` (또는 해당 위치의 `ISummary`) 타입에서 `profile` 필드가 non-nullable로 정의되어 있는데, 코드에서는 profile이 없을 경우 `null`을 반환한다. 또한 전체 반환 객체가 `null`일 수 있는 경우도 처리하지 않았다.

#### 올바른 코드

```typescript
profile: input.file.uploader.profile
  ? {
      id: input.file.uploader.profile.id,
      display_name: input.file.uploader.profile.display_name,
      bio: input.file.uploader.profile.bio ?? undefined,
      avatar: undefined,
    }
  : undefined,  // null 대신 undefined 사용 또는 기본값 객체 제공
```

#### 권고 조치사항

- DTO 타입의 nullable 여부를 정확히 확인하고, `null`과 `undefined`를 혼용하지 마라.
- nullable 필드에는 `| null`이 명시된 경우에만 `null`을 할당하라.

---

### 오류 파일 1-6: `src/transformers/RedditCloneMemberSessionAtInvertTransformer.ts`

#### 컴파일 에러 메시지

```
- Object literal may only specify known properties, and 'file_id' does not exist in type 'reddit_clone_file_associationsSelect<DefaultArgs>'.
- Property 'id' does not exist on type 'never'. (이하 original_filename, mime_type, file_size, status, created_at, uploader 반복)
```

#### 문제의 코드

```typescript
avatarFileAssociation: {
  select: {
    id: true,
    file_id: true,          // 오류: file_id는 Select에 존재하지 않음
    created_at: true,
    updated_at: true,
    target_id: true,
    target_type: true,
    reddit_clone_file: {     // 오류: 릴레이션명이 'file'이어야 할 수 있음
      select: { /* ... */ },
    },
  },
},
```

#### 오류 원인 분석

1. **존재하지 않는 프로퍼티**: `reddit_clone_file_associationsSelect`에 `file_id`라는 필드가 존재하지 않는다. Prisma select에서는 FK 컬럼이 아닌 릴레이션 이름을 사용해야 한다 (예: `reddit_clone_file_id` 또는 관련 FK 컬럼명).
2. **릴레이션명 불일치**: `reddit_clone_file`이라는 릴레이션명을 사용했으나, 실제 Prisma 스키마에서는 `file`로 정의되어 있을 수 있다. `file_id` 프로퍼티가 인식되지 않아 전체 select가 실패하고, 그 결과 `reddit_clone_file`의 모든 하위 필드가 `never` 타입이 된다.

#### 올바른 코드

```typescript
avatarFileAssociation: {
  select: {
    id: true,
    // file_id 제거 (FK 컬럼은 select에 직접 사용하지 않음)
    created_at: true,
    updated_at: true,
    target_id: true,
    target_type: true,
    file: {                  // 올바른 릴레이션명 사용
      select: {
        id: true,
        original_filename: true,
        mime_type: true,
        file_size: true,
        status: true,
        created_at: true,
        uploader: {
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
```

#### 권고 조치사항

- Prisma select에서는 FK 컬럼(`file_id`)을 직접 선택하지 말고, 릴레이션명(`file`)을 통해 접근하라.
- 릴레이션명은 Prisma 스키마에 정의된 이름과 정확히 일치해야 한다.

---

### 오류 파일 1-7: `src/transformers/RedditCloneMemberSessionAtSummaryTransformer.ts`

#### 컴파일 에러 메시지

```
- Type '{ id: string; display_name: string; bio: string | undefined; avatar: { ... file: { ... uploader: { id: any; username: any; created_at: string; }; }; } | null; } | null' is not assignable to type 'ISummary'.
  Type 'null' is not assignable to type 'ISummary'.
- Property 'id' does not exist on type 'never'. (이하 original_filename, mime_type 등 반복)
```

#### 오류 원인 분석

오류 파일 1-6과 동일한 패턴으로, 상위 Prisma select 구문에서 인식되지 않는 프로퍼티가 있어 타입 추론이 실패하고 하위 필드들이 `never` 타입이 된다. 또한 `ISummary` 타입에 `null`을 할당하려는 시도가 있다.

#### 권고 조치사항

- Prisma select 구문의 프로퍼티명을 스키마와 정확히 일치시키라.
- `ISummary` 타입이 nullable인지 확인하고, non-nullable이면 기본값을 제공하라.

---

### 오류 파일 1-8: `src/transformers/RedditCloneMemberSessionTransformer.ts`

#### 컴파일 에러 메시지

```
- Type 'null' is not assignable to type 'boolean | reddit_clone_members$sessionsArgs<DefaultArgs> | undefined'.
- Type 'null' is not assignable to type 'boolean | reddit_clone_members$passwordResetsArgs<DefaultArgs> | undefined'.
- (sessions, passwordResets, emailVerifications, ownedCommunities, communityModerations 등 22개 릴레이션에 대해 동일한 오류 반복)
- Object literal may only specify known properties, but 'reddit_clone_member_karma' does not exist in type 'reddit_clone_user_karmasSelect<DefaultArgs>'.
- Type 'ISummary | null' is not assignable to type 'ISummary'.
- Type 'ISummary | null' is not assignable to type 'IRedditCloneUserProfile'.
```

#### 문제의 코드

```typescript
export function select() {
  return {
    select: {
      id: true,
      email: true,
      // ...
      sessions: null,              // 오류: null은 유효하지 않음
      passwordResets: null,        // 오류
      emailVerifications: null,    // 오류
      // ... 18개 이상의 릴레이션에 null 할당
      karma: {
        select: {
          id: true,
          reddit_clone_member_karma: true,  // 오류: 존재하지 않는 컬럼명
          created_at: true,
          updated_at: true,
        },
      },
    },
  } satisfies Prisma.reddit_clone_membersFindManyArgs;
}
```

#### DB 스키마

```prisma
model reddit_clone_user_karmas {
  id                     String   @id @default(uuid()) @db.Uuid
  reddit_clone_member_id String   @db.Uuid
  karma_score            Int      @default(0)  // 'reddit_clone_member_karma'가 아님
  created_at             DateTime @default(now())
  updated_at             DateTime @updatedAt
}
```

#### 오류 원인 분석

1. **Prisma select에 `null` 사용**: 릴레이션을 제외하려면 `null`이 아닌 `false` 또는 프로퍼티 자체를 생략해야 한다. Prisma의 `select` 타입은 `boolean | Args | undefined`만 허용하며 `null`은 허용하지 않는다.
2. **존재하지 않는 컬럼명**: `reddit_clone_member_karma`는 `reddit_clone_user_karmasSelect`에 존재하지 않는다. 실제 컬럼명은 `karma_score`이다.
3. **null/ISummary 불일치**: `profile` 변환 결과가 `ISummary | null`인데, 반환 타입에서는 non-nullable `ISummary`와 `IRedditCloneUserProfile`을 요구한다.

#### 올바른 코드

```typescript
export function select() {
  return {
    select: {
      id: true,
      email: true,
      password_hash: true,
      username: true,
      created_at: true,
      updated_at: true,
      deleted_at: true,
      // sessions: null -> 제거하거나 false 사용
      profile: {
        select: { /* ... */ },
      },
      karma: {
        select: {
          id: true,
          karma_score: true,      // 올바른 컬럼명
          created_at: true,
          updated_at: true,
        },
      },
    },
  } satisfies Prisma.reddit_clone_membersFindManyArgs;
}
```

#### 권고 조치사항

- 릴레이션을 포함하지 않으려면 `null`이 아닌 `false`를 사용하거나 해당 프로퍼티를 완전히 생략하라.
- 컬럼명은 Prisma 스키마에 정의된 이름과 정확히 일치해야 한다.

---

## 시나리오 2: Shopping (11개 오류 파일)

**위치**: `test/results/minimax/minimax-m2.7/shopping/realize`

---

### 오류 파일 2-1: `src/providers/getEcommerceMallCustomerCancellationRequestsRequestIdSnapshotsSnapshotId.ts`

#### 컴파일 에러 메시지

```
- 'cr.seller.profile' is possibly 'null'. (16회 반복)
- Property 'seller' is missing in type '{ id: string; name: string; description: string; logo_uri: string | null; ... }' but required in type 'IEcommerceMallSellerProfile'. (2회)
- An object literal cannot have multiple properties with the same name. (3회)
- 'cr.orderItem.productSnapshot.seller.profile' is possibly 'null'. (16회 반복)
```

#### 오류 원인 분석

1. **null 미처리**: `cr.seller.profile`이 nullable(`| null`)인데, null 체크 없이 직접 프로퍼티에 접근했다. TypeScript strict mode에서는 nullable 값에 대한 접근 전 반드시 null 체크가 필요하다.
2. **DTO 타입 불일치**: `IEcommerceMallSellerProfile` 타입은 `seller` 속성을 필수로 요구하는데, 제공된 객체에는 `seller` 속성이 없다. 이는 seller profile 구성 시 역참조(back-reference)를 누락한 것이다.
3. **중복 프로퍼티**: 객체 리터럴에서 동일한 이름의 프로퍼티를 여러 번 선언했다.

#### 올바른 코드

```typescript
// null 체크 수행
const sellerProfile = cr.seller.profile
  ? {
      id: cr.seller.profile.id,
      name: cr.seller.profile.name,
      description: cr.seller.profile.description,
      logo_uri: cr.seller.profile.logo_uri,
      seller: {
        id: cr.seller.id,
        email: cr.seller.email,
        // ...
      },
      created_at: toISOStringSafe(cr.seller.profile.created_at),
      updated_at: toISOStringSafe(cr.seller.profile.updated_at),
      deleted_at: cr.seller.profile.deleted_at
        ? toISOStringSafe(cr.seller.profile.deleted_at)
        : null,
    }
  : null;
```

#### 권고 조치사항

- nullable 필드 접근 시 반드시 optional chaining(`?.`) 또는 null 체크를 수행하라.
- 중복 프로퍼티가 생기지 않도록 객체 리터럴을 신중하게 구성하라.

---

### 오류 파일 2-2: `src/providers/getEcommerceMallCustomerCheckoutPrepare.ts`

#### 컴파일 에러 메시지

```
- Object literal may only specify known properties, and 'seller_profiles' does not exist in type 'ecommerce_mall_sellersSelect<DefaultArgs>'.
- Property 'productVariant' does not exist on type '{ created_at: Date; id: string; updated_at: Date; quantity: number; ecommerce_mall_product_variant_id: string; ecommerce_mall_cart_id: string; }'. (15회 반복)
- Parameter 'r' implicitly has an 'any' type. (및 'sum', 'v', 'p', 'ov' 등)
```

#### DB 스키마

```prisma
model ecommerce_mall_sellers {
  id              String @id @default(uuid()) @db.Uuid
  email           String @unique
  approval_status String
  // 릴레이션:
  profile         ecommerce_mall_seller_profiles? @relation(...)  // 'seller_profiles'가 아님
  products        ecommerce_mall_products[]       @relation(...)
}

model ecommerce_mall_cart_items {
  id                              String @id @default(uuid()) @db.Uuid
  ecommerce_mall_product_variant_id String @db.Uuid
  ecommerce_mall_cart_id          String @db.Uuid
  quantity                        Int
  // 릴레이션:
  productVariant ecommerce_mall_product_variants @relation(fields: [ecommerce_mall_product_variant_id], ...)
}
```

#### 문제의 코드

```typescript
seller: {
  select: {
    seller_profiles: {     // 오류: 'profile'이어야 함
      select: {
        shop_name: true,
      },
    },
  },
},
```

#### 오류 원인 분석

1. **릴레이션명 불일치**: `ecommerce_mall_sellers` 모델에서 프로필 릴레이션명은 `profile`인데, `seller_profiles`를 사용했다. 이로 인해 seller의 전체 select가 타입 오류를 발생시킨다.
2. **연쇄 릴레이션 실패**: seller select가 실패하면 cart_items의 `productVariant` 릴레이션도 타입에서 누락되어 `Property 'productVariant' does not exist` 에러가 연쇄 발생한다.
3. **implicit any**: 타입 추론 실패로 인해 콜백 함수의 매개변수(`r`, `sum`, `v` 등)가 암묵적 `any` 타입이 된다.

#### 올바른 코드

```typescript
seller: {
  select: {
    id: true,
    email: true,
    approval_status: true,
    profile: {           // 올바른 릴레이션명
      select: {
        name: true,      // 또는 shop_name (스키마에 따라)
      },
    },
  },
},
```

#### 권고 조치사항

- Prisma 릴레이션명은 스키마의 필드명과 정확히 일치해야 한다.
- 콜백 함수에 명시적 타입 어노테이션을 추가하여 `noImplicitAny` 에러를 방지하라.

---

### 오류 파일 2-3: `src/providers/getEcommerceMallSellerCancellationRequestSnapshotsSnapshotId.ts`

#### 컴파일 에러 메시지

```
- Object literal may only specify known properties, and 'contact_phone' does not exist in type 'ecommerce_mall_customer_profilesSelect<DefaultArgs>'. (2회)
- Property 'cancellationRequest' does not exist on type '{ created_at: Date; id: string; status: string; reason: string; ecommerce_mall_cancellation_request_id: string; }'. (50회 이상 반복)
- Object literal may only specify known properties, and 'email' does not exist in type 'ISummary'.
- Object literal may only specify known properties, and 'updated_at' does not exist in type 'ISummary'.
- Object literal may only specify known properties, and 'orderItem' does not exist in type 'ISummary'.
```

#### 오류 원인 분석

1. **존재하지 않는 프로퍼티**: `ecommerce_mall_customer_profilesSelect`에 `contact_phone`이 없다. 이로 인해 customer 관련 전체 select 타입 추론이 실패한다.
2. **릴레이션 include 누락**: cancellation request snapshot의 select에서 `cancellationRequest` 릴레이션을 포함하지 않았거나, 상위 select 오류로 인해 타입이 기본 컬럼만으로 폴백되었다.
3. **ISummary 타입 오남용**: `ISummary`에 `email`, `updated_at`, `orderItem` 등 존재하지 않는 속성을 할당하려 했다. `ISummary`는 요약 정보만 포함하는 간소한 타입인데, 상세 정보를 넣으려 한 것이다.

#### 권고 조치사항

- Prisma select의 프로퍼티명은 스키마 정의와 정확히 일치시키라.
- `ISummary`와 상세 DTO 타입을 구분하여, 각 위치에 맞는 타입을 사용하라.

---

### 오류 파일 2-4: `src/providers/getEcommerceMallSellerCancellationRequestsRequestIdSnapshotsSnapshotId.ts`

#### 컴파일 에러 메시지

```
- Object literal may only specify known properties, and 'display_name' does not exist in type 'ecommerce_mall_customersSelect<DefaultArgs>'. (2회)
- Property 'cancellationRequest' does not exist on type '{ created_at: Date; id: string; status: string; reason: string; ecommerce_mall_cancellation_request_id: string; }'. (50회 이상 반복)
```

#### 오류 원인 분석

오류 파일 2-3과 동일한 패턴이다. `ecommerce_mall_customers` 모델에 `display_name` 필드가 없다(이 필드는 `ecommerce_mall_customer_profiles`에 존재). 최상위 select의 프로퍼티 오류로 전체 타입 추론이 실패하여 `cancellationRequest` 릴레이션 접근이 불가능하다.

#### 권고 조치사항

- customer의 `display_name`은 `profile` 릴레이션을 통해 접근하라.

---

### 오류 파일 2-5: `src/providers/getEcommerceMallSellerProductsProductId.ts`

#### 컴파일 에러 메시지

```
- Property 'seller' does not exist on type '{ created_at: Date; id: string; updated_at: Date; deleted_at: Date | null; ecommerce_mall_seller_id: string; ecommerce_mall_category_id: string; name: string; description: string; base_price: number; }'.
- Property 'category' does not exist on type (같은 타입). (반복)
- Property 'variants' does not exist on type (같은 타입).
- Property 'reviews' does not exist on type (같은 타입).
- Parameter 'img' implicitly has an 'any' type.
- Parameter 'v' implicitly has an 'any' type.
- Parameter 'r' implicitly has an 'any' type.
```

#### 오류 원인 분석

product의 Prisma select에서 다른 오류(예: `seller_profiles` 등 존재하지 않는 프로퍼티)가 있어 전체 타입 추론이 실패하고, product 결과 타입이 기본 컬럼만 포함하는 타입으로 폴백되었다. 그 결과 `seller`, `category`, `variants`, `reviews` 등 모든 릴레이션에 접근할 수 없다.

#### 권고 조치사항

- product의 seller 릴레이션에서 `seller_profiles` 대신 `profile`을 사용하라.
- 모든 중첩 select의 프로퍼티명을 스키마와 대조 검증하라.

---

### 오류 파일 2-6: `src/providers/putEcommerceMallSellerProductsProductId.ts`

#### 오류 원인 분석

오류 파일 2-5와 동일한 패턴으로, product update 로직에서도 같은 릴레이션명 불일치 문제가 발생한다.

---

### 오류 파일 2-7: `src/transformers/EcommerceMallCheckoutPrepareItemTransformer.ts`

#### 컴파일 에러 메시지

```
- Type '{ select: { ... productVariant: { select: { ... product: { select: { ... seller: { select: { seller_profiles: { select: { shop_name: boolean; }; }; }; }; ... }; }; }; }; }; }' does not satisfy the constraint 'boolean | ecommerce_mall_cart_itemsDefaultArgs<DefaultArgs> | null | undefined'.
  The types of 'select.seller' are incompatible:
    Type '{ select: { seller_profiles: ... } }' has no properties in common with type 'ecommerce_mall_sellersSelect<DefaultArgs>'.
- Object literal may only specify known properties, and 'seller_profiles' does not exist in type 'ecommerce_mall_sellersSelect<DefaultArgs>'.
- Argument is missing properties: orderItems, productSnapshots, wishlistItems
- Argument is missing properties: cartItems, inventoryRecords, orderItems
```

#### 문제의 코드

```typescript
seller: {
  select: {
    seller_profiles: {        // 오류: 존재하지 않는 릴레이션명
      select: {
        shop_name: true,
      },
    },
  },
},
```

#### 오류 원인 분석

1. **`seller_profiles` 릴레이션 불일치**: 실제 릴레이션명은 `profile`이다. 이 오류가 전체 Transformer의 Payload 타입을 `never`로 만든다.
2. **Transformer 입력 타입 불일치**: select 타입이 실패하면 Transformer의 `transform` 함수에 전달되는 인자 타입이 필수 속성(`orderItems`, `productSnapshots`, `wishlistItems`, `cartItems`, `inventoryRecords`)을 누락하게 된다.

#### 올바른 코드

```typescript
seller: {
  select: {
    id: true,
    email: true,
    profile: {              // 올바른 릴레이션명
      select: {
        name: true,
      },
    },
  },
},
```

#### 권고 조치사항

- 동일한 `seller_profiles` 오류가 여러 파일에 걸쳐 반복된다. 이는 모델이 하나의 공통된 잘못된 패턴을 학습했음을 시사한다.

---

### 오류 파일 2-8: `src/transformers/EcommerceMallCustomerTransformer.ts`

#### 컴파일 에러 메시지

```
- Argument of type '{ customer: { ... }; ... } | null' is not assignable to parameter of type '{ customer: { ... }; ... }'.
  Type 'null' is not assignable to type '{ customer: { ... }; ... }'.
- Argument is missing properties: product, wishlist
- Type 'IEcommerceMallCart | { id; created_at; updated_at; customer; cart_items: never[]; }' is not assignable to type 'IEcommerceMallCartItem'.
  Type 'IEcommerceMallCart' is missing: cart, product_variant, quantity, subtotal
```

#### 오류 원인 분석

1. **null 미처리**: customer profile 조회 결과가 `null`일 수 있는데, null 체크 없이 그대로 함수에 전달했다.
2. **타입 혼동 (Cart vs CartItem)**: `IEcommerceMallCart`(장바구니 전체)와 `IEcommerceMallCartItem`(장바구니 개별 아이템) 타입을 혼동하여, Cart 객체를 CartItem 위치에 할당했다.
3. **wishlist 구조 불일치**: wishlist 데이터를 변환할 때 `product`와 `wishlist` 속성이 누락되었다.

#### 권고 조치사항

- `IEcommerceMallCart`와 `IEcommerceMallCartItem`의 차이를 명확히 이해하고 올바른 타입을 사용하라.
- nullable 조회 결과에 대해 반드시 null 체크를 수행하라.

---

### 오류 파일 2-9: `src/transformers/EcommerceMallProductTransformer.ts`

#### 컴파일 에러 메시지

```
- Type '{ select: { ... seller: { select: { ... seller_profiles: { select: { id: boolean; name: boolean; ... }; }; }; }; ... reviews: { select: { ... product: { select: { ... seller: { select: { seller_profiles: ... }; }; }; }; }; }; }; }' does not satisfy the constraint.
  'seller_profiles' does not exist in type 'ecommerce_mall_sellersSelect<DefaultArgs>'. (4회)
- Property 'name' does not exist on type 'never'. (반복)
- Property 'description' does not exist on type 'never'. (반복)
- Property 'logo_uri' does not exist on type 'never'. (반복)
- Property 'productImages' does not exist on type '{ ... }'.
- Type '{ ... seller.profile ... }' is not assignable to type 'IEcommerceMallSellerProfile'.
  Property 'seller' is missing in type '{ id; name; description; logo_uri; seller_id; ... }'
```

#### 오류 원인 분석

1. **`seller_profiles` 릴레이션 반복 오류**: 오류 파일 2-7과 동일한 근본 원인. `seller_profiles` 대신 `profile`을 사용해야 한다.
2. **`never` 타입 연쇄**: `seller_profiles`가 인식되지 않아 seller 타입이 `never`가 되고, 이후 `name`, `description`, `logo_uri` 등에 접근 시 모두 "Property does not exist on type 'never'" 에러가 발생한다.
3. **IEcommerceMallSellerProfile 불완전**: seller profile DTO에 `seller` (역참조) 속성이 필수인데 누락되었다.

#### 올바른 코드

```typescript
seller: {
  select: {
    id: true,
    email: true,
    approval_status: true,
    created_at: true,
    profile: {             // 올바른 릴레이션명
      select: {
        id: true,
        name: true,
        description: true,
        logo_uri: true,
        created_at: true,
        updated_at: true,
        deleted_at: true,
      },
    },
  },
},
```

---

### 오류 파일 2-10: `src/transformers/EcommerceMallRefundRequestSnapshotTransformer.ts`

#### 컴파일 에러 메시지

```
- Expected 2 arguments, but got 1.
```

#### 문제의 코드

```typescript
export async function transform(input: Payload): Promise<IEcommerceMallRefundRequestSnapshot> {
  return {
    // ...
    refundRequest: await EcommerceMallRefundRequestTransformer.transform(
      input.refundRequest,    // 인자 1개만 전달
    ),
    // ...
  };
}
```

#### 오류 원인 분석

`EcommerceMallRefundRequestTransformer.transform` 함수가 2개의 인자를 받도록 정의되어 있는데 (`input: Payload, n`), 호출 시 1개만 전달했다. 이 문제의 근본 원인은 `EcommerceMallRefundRequestTransformer`의 `transform` 함수 시그니처에 `n`이라는 불필요한 매개변수가 포함된 것이다 (오류 파일 2-11 참조).

#### 권고 조치사항

- `EcommerceMallRefundRequestTransformer.transform` 함수에서 불필요한 `n` 매개변수를 제거하라.

---

### 오류 파일 2-11: `src/transformers/EcommerceMallRefundRequestTransformer.ts`

#### 컴파일 에러 메시지

```
- No value exists in scope for the shorthand property 'n'. Either declare one or provide an initializer. (40회 이상 반복)
- An object literal cannot have multiple properties with the same name. (20회 이상 반복)
- Object literal may only specify known properties, and 'n' does not exist in type 'ecommerce_mall_order_itemsSelect<DefaultArgs>'. (및 orders, product_snapshots, sellers, seller_profiles 등)
- Parameter 'n' implicitly has an 'any' type. (8회)
- Duplicate identifier 'n'. (8회)
```

#### 문제의 코드

```typescript
export function select() {
  return {
    select: {
      id: true, n, reason: true, n, status: true, n, seller_response_at: true, n, created_at: true, n, updated_at: true, n, deleted_at: true, n, orderItem: {
        select: {
          id: true, n, quantity: true, n, unit_price: true, n, status: true, n, created_at: true, n, order: {
            select: {
              id: true, n, order_number: true, n
            }, n
          } satisfies Prisma.ecommerce_mall_ordersFindManyArgs, n,
          // ... 계속 n 반복 ...
        }, n
      }, n,
      // ...
    }, n
  } satisfies Prisma.ecommerce_mall_refund_requestsFindManyArgs;
}
export async function transform(input: Payload, n): Promise<IEcommerceMallRefundRequest> {
  // ...
}
```

#### 오류 원인 분석

이것은 매우 특이한 오류 패턴으로, **모델이 `n`이라는 미선언 변수를 select 객체 전체에 걸쳐 반복적으로 삽입**했다. 이는 다음과 같은 결과를 초래한다:

1. **미선언 변수 `n`**: 스코프에 `n`이라는 변수가 존재하지 않아, shorthand property `n`을 resolve할 수 없다.
2. **중복 프로퍼티**: 동일한 `n` 프로퍼티가 객체 리터럴에 여러 번 등장하여 중복 프로퍼티 에러가 발생한다.
3. **Prisma select 오염**: `n`이 모든 select 객체에 삽입되어 모든 Prisma 타입 추론을 파괴한다.
4. **함수 시그니처 오염**: `transform(input: Payload, n)` 형태로 함수 매개변수에도 `n`이 삽입되어, 함수 호출부에서 인자 수 불일치가 발생한다.

이는 모델의 코드 생성 로직에 심각한 결함이 있음을 나타내는 것으로, 아마도 토큰 생성 과정에서 줄바꿈이나 구분자 역할을 하는 무의미한 문자가 삽입된 것으로 추정된다.

#### 올바른 코드

```typescript
export function select() {
  return {
    select: {
      id: true,
      reason: true,
      status: true,
      seller_response_at: true,
      created_at: true,
      updated_at: true,
      deleted_at: true,
      orderItem: {
        select: {
          id: true,
          quantity: true,
          unit_price: true,
          status: true,
          created_at: true,
          order: {
            select: {
              id: true,
              order_number: true,
            },
          },
          // ...
        },
      },
      // ...
    },
  } satisfies Prisma.ecommerce_mall_refund_requestsFindManyArgs;
}
export async function transform(input: Payload): Promise<IEcommerceMallRefundRequest> {
  // n 매개변수 제거
}
```

#### 권고 조치사항

- 모델이 생성하는 코드에서 무의미한 변수(`n`)가 삽입되는 패턴을 식별하고, 후처리 단계에서 제거하거나 프롬프트에서 "Prisma select 객체에 불필요한 변수를 삽입하지 마라"는 지시를 추가하라.

---

## 시나리오 3: ERP (7개 오류 파일)

**위치**: `test/results/minimax/minimax-m2.7/erp/realize`

---

### 오류 파일 3-1: `src/providers/getErpHrmAdminProjectsProjectIdMembersMemberId.ts`

#### 컴파일 에러 메시지

```
- Object literal may only specify known properties, and 'erp_hrm_parent_department_id' does not exist in type 'erp_hrm_departmentsSelect<DefaultArgs>'. (5회)
- Property 'employee' does not exist on type '{ created_at: Date; updated_at: Date; id: string; erp_hrm_project_id: string; erp_hrm_employee_id: string; assigned_role: string; }'. (7회)
- Property 'project' does not exist on type (같은 타입). (20회 이상)
```

#### DB 스키마

```prisma
model erp_hrm_departments {
  id          String   @id @default(uuid()) @db.Uuid
  name        String
  description String?
  parent_id   String?  @db.Uuid  // 'erp_hrm_parent_department_id'가 아님
  created_at  DateTime @default(now())
  updated_at  DateTime @updatedAt
  // 릴레이션:
  parent      erp_hrm_departments?  @relation("DepartmentHierarchy", fields: [parent_id], ...)
}

model erp_hrm_project_memberships {
  id                   String @id @default(uuid()) @db.Uuid
  erp_hrm_project_id   String @db.Uuid
  erp_hrm_employee_id  String @db.Uuid
  assigned_role        String
  created_at           DateTime @default(now())
  updated_at           DateTime @updatedAt
  // 릴레이션:
  project  erp_hrm_projects  @relation(fields: [erp_hrm_project_id], ...)
  employee erp_hrm_employees @relation(fields: [erp_hrm_employee_id], ...)
}
```

#### 문제의 코드

```typescript
department: {
  select: {
    id: true,
    name: true,
    description: true,
    erp_hrm_parent_department_id: true,  // 오류: 'parent_id'여야 함
    created_at: true,
    updated_at: true,
    parent: {
      select: {
        id: true,
        name: true,
        description: true,
        erp_hrm_parent_department_id: true,  // 오류: 'parent_id'여야 함
        created_at: true,
        updated_at: true,
      },
    },
  },
},
```

#### 오류 원인 분석

1. **FK 컬럼명 불일치**: department의 부모 참조 FK 컬럼은 `parent_id`인데, `erp_hrm_parent_department_id`를 사용했다. 모델이 FK 컬럼명을 Prisma의 네이밍 규칙(테이블 접두사 + 컬럼명)으로 "추측"한 것으로 보인다.
2. **연쇄 타입 실패**: department select가 실패하면 상위의 employee, project_membership select도 연쇄적으로 실패한다.

#### 올바른 코드

```typescript
department: {
  select: {
    id: true,
    name: true,
    description: true,
    parent_id: true,        // 올바른 컬럼명
    created_at: true,
    updated_at: true,
    parent: {
      select: {
        id: true,
        name: true,
        description: true,
        parent_id: true,    // 올바른 컬럼명
        created_at: true,
        updated_at: true,
      },
    },
  },
},
```

#### 권고 조치사항

- FK 컬럼명은 Prisma 스키마에 정의된 이름 그대로 사용하라. 테이블 접두사를 붙여 "추측"하지 마라.

---

### 오류 파일 3-2: `src/providers/postErpHrmAdminProjectsProjectIdMembers.ts`

#### 컴파일 에러 메시지

```
- Object literal may only specify known properties, and 'erp_hrm_organization_id' does not exist in type 'erp_hrm_adminsWhereInput'.
- Property 'employee_id' does not exist on type 'ICreate'.
- Property 'assigned_role' does not exist on type 'ICreate'. (3회)
- Object literal may only specify known properties, and 'parent_task_id' does not exist in type 'erp_hrm_tasksSelect<DefaultArgs>'. (3회)
- Argument is missing properties: organization, projectMemberships, tasks, timelogs, and 2 more.
- Type '{ ... }[]' is not assignable to type 'IErpHrmProjectMember[]'. (properties missing: project_members_count, projectMemberships, tasks, tasks_count, 3 more)
- Property 'project' does not exist on type '{ ... erp_hrm_project_id: string; erp_hrm_employee_id: string; assigned_role: string; ... }'. (20회 이상)
```

#### 오류 원인 분석

1. **WhereInput 프로퍼티 불일치**: `erp_hrm_adminsWhereInput`에 `erp_hrm_organization_id`가 존재하지 않는다. admin 테이블의 실제 필터링 조건을 확인해야 한다.
2. **ICreate DTO 속성 누락**: `ICreate` 타입에 `employee_id`와 `assigned_role`이 정의되어 있지 않다. 요청 본문(body)의 DTO 구조를 잘못 이해한 것이다.
3. **tasks select 프로퍼티 오류**: `parent_task_id`가 `erp_hrm_tasksSelect`에 존재하지 않는다 (실제로는 `parent_id`일 수 있음). 이로 인해 task 관련 전체 타입 추론이 실패한다.
4. **IErpHrmProjectMember 불완전 매핑**: 응답 DTO에 필요한 `project_members_count`, `projectMemberships`, `tasks`, `tasks_count`, `timelogs`, `timers`, `_count` 등의 속성이 누락되었다.
5. **릴레이션 include 누락**: project_membership 결과에서 `project` 릴레이션을 select하지 않아 접근 불가하다.

#### 권고 조치사항

- WhereInput, ICreate 등의 타입 정의를 사전에 확인하고, 존재하는 속성만 사용하라.
- 응답 DTO 타입의 모든 필수 속성을 빠짐없이 매핑하라.

---

### 오류 파일 3-3: `src/providers/postErpHrmAuthMemberLogin.ts`

#### 컴파일 에러 메시지

```
- Property 'deleted_at' does not exist on type '{ email: string; created_at: Date; updated_at: Date; id: string; password_hash: string; display_name: string; avatar_uri: string | null; phone: string | null; }'.
- Object literal may only specify known properties, and 'subtasks_count' does not exist in type 'erp_hrm_tasksSelect<DefaultArgs>'.
- Property 'project' does not exist on type '{ ... erp_hrm_project_id: string; erp_hrm_employee_id: string; erp_hrm_task_id: string | null; ... }'. (17회 반복)
- Property 'task' does not exist on type (같은 타입). (40회 이상 반복)
```

#### DB 스키마

```prisma
model erp_hrm_members {
  id            String   @id @default(uuid()) @db.Uuid
  email         String   @unique
  password_hash String
  display_name  String
  avatar_uri    String?
  phone         String?
  created_at    DateTime @default(now())
  updated_at    DateTime @updatedAt
  // deleted_at 없음!
}

model erp_hrm_timers {
  id                   String   @id @default(uuid()) @db.Uuid
  started_at           DateTime
  description          String?
  erp_hrm_project_id   String   @db.Uuid
  erp_hrm_employee_id  String   @db.Uuid
  erp_hrm_task_id      String?  @db.Uuid
  created_at           DateTime @default(now())
  updated_at           DateTime @updatedAt
  // 릴레이션:
  project  erp_hrm_projects  @relation(fields: [erp_hrm_project_id], ...)
  employee erp_hrm_employees @relation(fields: [erp_hrm_employee_id], ...)
  task     erp_hrm_tasks?    @relation(fields: [erp_hrm_task_id], ...)
}
```

#### 오류 원인 분석

1. **존재하지 않는 컬럼 접근**: `erp_hrm_members`에는 `deleted_at` 컬럼이 없는데 접근하려 했다.
2. **`subtasks_count` 프로퍼티 오류**: `erp_hrm_tasksSelect`에 `subtasks_count`가 존재하지 않는다. `_count`를 사용하여 관련 릴레이션 수를 세야 한다.
3. **릴레이션 include 누락**: timer의 select에서 `project`와 `task` 릴레이션을 포함하지 않았거나, 상위 select 오류로 인해 타입 추론이 실패했다.

#### 올바른 코드

```typescript
// deleted_at 접근 제거
// subtasks_count 대신 _count 사용
tasks: {
  select: {
    id: true,
    title: true,
    status: true,
    priority: true,
    // ...
    _count: {
      select: {
        subtasks: true,
        taskHistories: true,
        timelogs: true,
        timers: true,
      },
    },
  },
},
// timer에 project, task 릴레이션 포함
timers: {
  select: {
    id: true,
    started_at: true,
    description: true,
    // ...
    project: { select: { id: true, name: true, /* ... */ } },
    task: { select: { id: true, title: true, /* ... */ } },
  },
},
```

---

### 오류 파일 3-4: `src/providers/postErpHrmAuthMemberRefresh.ts`

#### 컴파일 에러 메시지

```
- Property 'organization' does not exist on type '{ created_at: Date; updated_at: Date; status: string; id: string; erp_hrm_organization_id: string; name: string; description: string | null; start_date: Date | null; end_date: Date | null; color: string; budget_hours: number | null; }'. (28회 반복)
```

#### 오류 원인 분석

`erp_hrm_projects`의 Prisma select에서 `organization` 릴레이션을 포함하지 않았다. 결과 타입에 기본 컬럼만 포함되어, `project.organization` 접근 시 에러가 발생한다.

#### 올바른 코드

```typescript
project: {
  select: {
    id: true,
    name: true,
    status: true,
    // ...
    organization: {
      select: {
        id: true,
        name: true,
        description: true,
        // ...
      },
    },
  },
},
```

#### 권고 조치사항

- 변환 로직에서 접근하는 모든 릴레이션을 Prisma select에 반드시 포함하라.

---

### 오류 파일 3-5: `src/providers/putErpHrmAdminOrganizationsOrganizationIdReportsReportIdParameters.ts`

#### 컴파일 에러 메시지

```
- Object literal may only specify known properties, and 'report_parameters' does not exist in type 'erp_hrm_reportsSelect<DefaultArgs>'.
- Property 'report_parameters' does not exist on type '{ ... erp_hrm_organization_id: string; generated_by_erp_hrm_member_id: string; report_type: string; name: string | null; }'.
- Object literal may only specify known properties, but 'erp_hrm_project' does not exist in type 'erp_hrm_tasksWhereInput'. Did you mean to write 'erp_hrm_project_id'?
- Object literal may only specify known properties, and 'erp_hrm_member' does not exist in type 'erp_hrm_reportsSelect<DefaultArgs>'.
- Object literal may only specify known properties, but 'erp_hrm_member' does not exist in type 'erp_hrm_employeesSelect<DefaultArgs>'. Did you mean to write 'erp_hrm_member_id'?
- Property 'erp_hrm_role' does not exist on type '{ ... erp_hrm_role_id: string; ... }'. Did you mean 'erp_hrm_role_id'? (4회)
- Property 'erp_hrm_member' does not exist on type (같은 타입). Did you mean 'erp_hrm_member_id'? (6회)
- Property 'erp_hrm_department' does not exist on type (같은 타입). Did you mean 'erp_hrm_department_id'?
- Object literal may only specify known properties, but 'task_histories' does not exist in type. Did you mean to write 'taskHistories'?
- Property 'erp_hrm_project' does not exist on type '{ ... erp_hrm_project_id: string; ... }'. Did you mean 'erp_hrm_project_id'? (8회)
- Property 'erp_hrm_employee' does not exist on type (같은 타입). Did you mean 'erp_hrm_employee_id'? (2회)
- Property '_count' does not exist on type '{ ... }'. (4회)
- Property 'report' does not exist on type '{ ... erp_hrm_report_id: string; ... }'. (10회)
```

#### 오류 원인 분석

이 파일은 가장 다양한 오류 패턴을 보여준다:

1. **존재하지 않는 릴레이션명**: `report_parameters`가 `erp_hrm_reportsSelect`에 없다. 릴레이션명을 확인해야 한다.
2. **FK 컬럼명과 릴레이션명 혼동**: `erp_hrm_project`, `erp_hrm_member`, `erp_hrm_role`, `erp_hrm_department` 등은 릴레이션명이 아닌 FK 컬럼 접두사이다. 실제 릴레이션명은 `project`, `member`, `role`, `department`이고, FK 컬럼은 `erp_hrm_project_id`, `erp_hrm_member_id` 등이다.
3. **_count select 누락**: `_count`를 사용하려면 반드시 Prisma select에 `_count: { select: { ... } }` 형태로 포함해야 한다.
4. **릴레이션 이름 대소문자**: `task_histories` 대신 `taskHistories`를 사용해야 한다 (Prisma 스키마의 릴레이션명 규칙을 따라야 함).
5. **report 릴레이션 include 누락**: report_parameters에서 `report` 릴레이션에 접근하려면 select에 포함해야 한다.

#### 올바른 코드

```typescript
// FK 컬럼명 대신 릴레이션명 사용
employee: {
  select: {
    id: true,
    position: true,
    member: { select: { id: true, email: true, display_name: true } },  // erp_hrm_member가 아님
    role: { select: { id: true, name: true } },                         // erp_hrm_role이 아님
    department: { select: { id: true, name: true } },                   // erp_hrm_department가 아님
  },
},
// _count 사용
tasks: {
  select: {
    id: true,
    title: true,
    _count: {
      select: {
        subtasks: true,
        taskHistories: true,    // task_histories가 아님
        timelogs: true,
        timers: true,
      },
    },
  },
},
// report 릴레이션 포함
reportParameters: {
  select: {
    id: true,
    // ...
    report: { select: { id: true, report_type: true, name: true } },
  },
},
```

#### 권고 조치사항

- **FK 컬럼명 vs 릴레이션명을 명확히 구분하라**: `erp_hrm_project_id`는 FK 컬럼, `project`는 릴레이션이다. select에서 릴레이션을 포함하려면 릴레이션명(`project`)을 사용하고, 필터링에서 FK 값을 비교하려면 FK 컬럼명(`erp_hrm_project_id`)을 사용하라.
- Prisma의 `_count` 기능은 반드시 select에서 명시적으로 포함해야 결과 타입에 반영된다.

---

### 오류 파일 3-6: `src/transformers/ErpHrmProjectMemberTransformer.ts`

#### 컴파일 에러 메시지

```
- Type '{ id: string; name: string; color: string; status: string; budget_hours: number | undefined; start_date: string | null; end_date: string | null; created_at: string; organization: ISummary; }[]' is not assignable to type 'IErpHrmProjectMember[]'.
  Type '{ ... }' is missing: project_members_count, projectMemberships, tasks, tasks_count, and 3 more.
- Type 'ISummary[]' is not assignable to type 'IErpHrmTask[]'.
  Type 'ISummary' is missing: created_at, subtasks, taskHistories, timelogs, and 2 more.
- Type 'ISummary[]' is not assignable to type 'IErpHrmTimelog[]'.
  Type 'ISummary' is missing: created_at, updated_at
- Type 'ISummary[]' is not assignable to type 'IErpHrmTimer[]'.
  Type 'ISummary' is missing: started_at, created_at, updated_at, employee
```

#### 오류 원인 분석

1. **IErpHrmProjectMember 불완전 매핑**: project 객체에 `project_members_count`, `projectMemberships`, `tasks`, `tasks_count`, `timelogs`, `timers`, `_count` 속성이 누락되었다. Transformer가 프로젝트의 요약 정보만 반환하는데, DTO는 상세 정보를 요구한다.
2. **ISummary 남용**: tasks, timelogs, timers를 `ISummary[]`로 변환했으나, 실제 DTO 타입은 `IErpHrmTask[]`, `IErpHrmTimelog[]`, `IErpHrmTimer[]`로 더 많은 속성을 요구한다.

#### 올바른 코드

```typescript
// project 변환 시 IErpHrmProjectMember의 모든 필수 속성 포함
return {
  id: project.id,
  name: project.name,
  color: project.color,
  status: project.status,
  budget_hours: project.budget_hours ?? undefined,
  start_date: project.start_date ? toISOStringSafe(project.start_date) : null,
  end_date: project.end_date ? toISOStringSafe(project.end_date) : null,
  created_at: toISOStringSafe(project.created_at),
  organization: transformOrganization(project.organization),
  project_members_count: project._count.projectMemberships,
  projectMemberships: project.projectMemberships.map(transformMembership),
  tasks: project.tasks.map(transformTask),
  tasks_count: project._count.tasks,
  timelogs: project.timelogs.map(transformTimelog),
  timers: project.timers.map(transformTimer),
  _count: project._count,
};
```

#### 권고 조치사항

- 응답 DTO의 전체 필드 목록을 사전에 확인하고, 모든 필수 속성을 빠짐없이 매핑하라.
- `ISummary`는 요약용으로만 사용하고, 상세 DTO가 필요한 위치에서는 전체 DTO 타입에 맞게 변환하라.

---

### 오류 파일 3-7: `src/transformers/ErpHrmTimesheetTimelogAtInvertTransformer.ts`

#### 컴파일 에러 메시지

```
- 'input' is possibly 'null'. (13회 반복)
```

#### 문제의 코드

```typescript
function transformTask(
  input: Payload["timelog"]["task"],  // task는 nullable (string? @db.Uuid FK)
): IErpHrmTask.ISummary {
  return {
    id: input.id,                     // 오류: input이 null일 수 있음
    title: input.title,
    status: input.status,
    priority: input.priority,
    project: transformProject(input.project),  // 오류: input이 null일 수 있음
    assignee: input.assignee ? transformEmployee(input.assignee) : undefined,
    due_date: input.due_date ? input.due_date.toISOString() : undefined,
    subtasks_count: input._count.subtasks,
    task_histories_count: input._count.taskHistories,
    timelogs_count: input._count.timelogs,
    timers_count: input._count.timers,
  };
}
```

#### 오류 원인 분석

`erp_hrm_timelogs.erp_hrm_task_id`가 nullable(`String? @db.Uuid`)이므로, `timelog.task` 릴레이션도 nullable이다. 따라서 `Payload["timelog"]["task"]`의 타입은 `{ ... } | null`이다. 그러나 `transformTask` 함수 내에서 null 체크 없이 `input.id`, `input.title` 등에 접근하고 있다.

#### 올바른 코드

```typescript
function transformTask(
  input: NonNullable<Payload["timelog"]["task"]>,
): IErpHrmTask.ISummary {
  // 또는 호출부에서 null 체크 후 호출:
  // task: input.task ? transformTask(input.task) : undefined,
  return {
    id: input.id,
    title: input.title,
    // ...
  };
}
```

#### 권고 조치사항

- nullable FK에 의한 nullable 릴레이션은 반드시 호출부 또는 함수 시그니처에서 null 처리를 수행하라.
- `NonNullable<T>` 유틸리티 타입을 활용하여 함수 내부에서의 null 체크를 줄일 수 있다.

---

## 종합 권고사항

### 1. 반복 패턴별 근본 원인

| 패턴 | 발생 빈도 | 근본 원인 |
|------|----------|----------|
| **camelCase/snake_case 혼동** | Reddit 3파일, Shopping 2파일 | 모델이 Prisma select의 필드명에 API DTO의 camelCase를 적용 |
| **릴레이션명 불일치** (`seller_profiles`, `userKarmas`, `reddit_clone_file`) | 전 시나리오 10+파일 | 실제 Prisma 스키마의 릴레이션명을 확인하지 않고 추측 |
| **FK 컬럼명과 릴레이션명 혼동** (`erp_hrm_project` vs `project`) | ERP 3파일 | FK 컬럼의 접두사를 릴레이션명으로 오인 |
| **Prisma select에 `null` 사용** | Reddit 1파일 | 릴레이션 제외 시 `false`/생략 대신 `null` 사용 |
| **nullable 미처리** (`'x' is possibly 'null'`) | Shopping 1파일, ERP 1파일 | nullable 릴레이션에 대한 null 체크 누락 |
| **미선언 변수 `n` 삽입** | Shopping 1파일 | 모델의 토큰 생성 결함으로 무의미한 변수가 코드 전반에 삽입 |
| **DTO 타입 불완전 매핑** | 전 시나리오 5+파일 | 응답 DTO의 필수 속성을 누락하거나 ISummary로 대체 |

### 2. 프롬프트 개선 제안

1. **"Prisma select 문의 필드명은 반드시 Prisma 스키마에 정의된 이름을 그대로 사용하라. DB 컬럼은 snake_case이며, API DTO의 camelCase와 혼동하지 마라."**

2. **"Prisma 릴레이션명은 스키마의 `@relation` 데코레이터 옆에 정의된 필드명이다. FK 컬럼명(`erp_hrm_project_id`)에서 `_id`를 떼고 릴레이션명을 추측하지 마라. 반드시 스키마를 확인하라."**

3. **"Prisma select에서 릴레이션을 제외하려면 해당 프로퍼티를 생략하거나 `false`를 사용하라. `null`은 유효하지 않다."**

4. **"nullable FK(`String? @db.Uuid`)로 연결된 릴레이션은 결과 타입이 `T | null`이다. 변환 함수에서 반드시 null 체크를 수행하거나 `NonNullable<T>`를 사용하라."**

5. **"응답 DTO 타입의 모든 필수 속성을 빠짐없이 매핑하라. ISummary를 상세 DTO 위치에 대체 사용하지 마라."**

6. **"코드 생성 시 무의미한 변수나 토큰(`n` 등)을 삽입하지 마라. 객체 리터럴의 프로퍼티 사이에는 쉼표만 사용하라."**

### 3. 모델 특성 요약

`minimax-m2.7` 모델은 전반적으로 **코드 구조의 이해도는 높으나 세부 정확성이 낮다**는 특성을 보인다:

- Transformer 패턴, Prisma select 구조, DTO 변환 패턴 등 아키텍처는 올바르게 파악한다.
- 그러나 **구체적인 필드명, 릴레이션명, 타입 호환성**에서 빈번한 오류가 발생한다.
- 특히 Shopping 시나리오의 `n` 변수 삽입은 모델의 토큰 생성 과정에서의 심각한 결함을 나타내며, 후처리 단계에서의 검증이 필요하다.
- 3개 시나리오 모두에서 동일한 패턴의 오류가 반복되므로, 프롬프트 레벨에서의 명시적 지침 강화가 가장 효과적인 개선 방안이다.
