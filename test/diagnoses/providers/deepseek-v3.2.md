# deepseek/deepseek-v3.2 상세 오류 진단

## 개요
- 시나리오: reddit
- 총 오류 파일 수: 7
- 총 고유 오류 패턴 수: 6가지 유형
- 오류가 발생한 파일 목록:
  1. `src/providers/patchCommunityPlatformMemberSubscriptionSnapshots.ts`
  2. `src/providers/patchCommunityPlatformPostsPostIdComments.ts`
  3. `src/providers/postCommunityPlatformAdminReportsReportIdDismissals.ts`
  4. `src/providers/putCommunityPlatformMemberCommentsCommentIdVotesMine.ts`
  5. `src/transformers/CommunityPlatformBanAssignmentTransformer.ts`
  6. `src/transformers/CommunityPlatformPostSnapshotTransformer.ts`
  7. `src/transformers/CommunityPlatformReportOfCommentTransformer.ts`

---

## 오류 파일 1: patchCommunityPlatformMemberSubscriptionSnapshots.ts

### 오류 내용

**오류 유형 A: Prisma 릴레이션 이름 불일치 (select에 존재하지 않는 프로퍼티)**

```
- Object literal may only specify known properties, and 'id' does not exist in type 'community_platform_subscriptionsFindManyArgs<DefaultArgs>'.
- Object literal may only specify known properties, and 'id' does not exist in type 'community_platform_membersFindManyArgs<DefaultArgs>'.
- Object literal may only specify known properties, and 'id' does not exist in type 'community_platform_communitiesFindManyArgs<DefaultArgs>'.
- Object literal may only specify known properties, and 'user' does not exist in type 'community_platform_subscription_snapshotsSelect<DefaultArgs>'.
```

**오류 유형 B: include 없이 릴레이션 프로퍼티 접근 시도**

```
- Property 'subscription' does not exist on type '{ created_at: Date; id: string; status: string; ... }'.
- Property 'user' does not exist on type '{ created_at: Date; id: string; status: string; ... }'.
- Property 'community' does not exist on type '{ created_at: Date; id: string; status: string; ... }'.
```

**오류 유형 C: nullable 필드를 non-nullable 위치에 전달**

```
- Type '(string & Format<"uuid">) | null' is not assignable to type 'string | UuidFilter<"community_platform_subscription_snapshots"> | undefined'.
- No overload matches this call.
  Argument of type '(string & Format<"date-time">) | null' is not assignable to parameter of type 'string | number | Date'.
```

### 문제 코드

```typescript
// 문제 1: satisfies에 FindManyArgs를 사용 (Select가 아님)
select: {
  id: true,
  email: true,
  // ...
} satisfies Prisma.community_platform_membersFindManyArgs, // <-- 잘못됨

// 문제 2: 스키마에 없는 릴레이션 이름 사용
subscription: {  // <-- community_platform_subscription_snapshots에는 'subscription' 릴레이션이 존재하지 않음
  select: { ... }
},
user: {  // <-- 'user' 릴레이션이 존재하지 않음
  select: { ... }
},
community: {  // <-- 'community' 릴레이션이 존재하지 않음 (직접 릴레이션 없음)
  select: { ... }
},

// 문제 3: nullable 날짜 필드를 new Date()에 직접 전달
gte: new Date(props.body.subscribed_at_start),  // props.body.subscribed_at_start가 null일 수 있음
```

### DB 스키마 실제 구조

`community_platform_subscription_snapshots` 테이블의 릴레이션:

```prisma
model community_platform_subscription_snapshots {
  id                                  String   @id @db.Uuid
  community_platform_subscription_id  String   @db.Uuid
  user_id                             String   @db.Uuid    // FK 컬럼만 존재, 릴레이션 없음
  community_id                        String   @db.Uuid    // FK 컬럼만 존재, 릴레이션 없음
  status                              String
  // ...

  // BELONGED RELATIONS - 유일한 릴레이션:
  subscription community_platform_subscriptions @relation(...)
  // 'user', 'community' 릴레이션은 정의되어 있지 않음!
}
```

핵심: `user_id`와 `community_id`는 단순 컬럼이며, Prisma 릴레이션으로 정의되어 있지 않다. 따라서 Prisma `select`에서 `user`나 `community`로 중첩 쿼리할 수 없다.

### 원인 분석

1. **릴레이션 이름 환각(hallucination)**: LLM이 `user_id` 컬럼이 있으면 `user`라는 릴레이션도 있을 것이라고 추측했다. 실제로 `community_platform_subscription_snapshots`에는 `subscription` 릴레이션만 존재하고, `user_id`와 `community_id`는 비정규화된 단순 컬럼이다.

2. **`satisfies` 타입 오용**: `satisfies Prisma.community_platform_membersFindManyArgs`를 중첩 릴레이션의 select 내부에 사용했는데, 올바른 타입은 `Prisma.community_platform_membersDefaultArgs` 또는 select 객체에는 `satisfies`를 사용하지 않아야 한다.

3. **nullable 필드 미처리**: `subscribed_at`, `unsubscribed_at` 등 nullable datetime 필드를 `new Date()`에 null 체크 없이 전달했다.

### 수정안

```typescript
// 올바른 select - subscription 릴레이션만 사용
const data = await MyGlobal.prisma.community_platform_subscription_snapshots.findMany({
  where: whereInput,
  skip,
  take: limit,
  orderBy: orderByInput,
  select: {
    id: true,
    status: true,
    posting_permission_granted: true,
    feed_included: true,
    subscribed_at: true,
    unsubscribed_at: true,
    created_at: true,
    user_id: true,       // 단순 컬럼으로 조회
    community_id: true,  // 단순 컬럼으로 조회
    subscription: {      // 유일하게 존재하는 릴레이션
      select: {
        id: true,
        active: true,
        created_at: true,
        updated_at: true,
        deleted_at: true,
        member: {
          select: {
            id: true,
            email: true,
            username: true,
            // ...
          },
        },
        community: {
          select: {
            id: true,
            name: true,
            description: true,
            created_at: true,
            ownerMember: {
              select: { id: true, email: true, username: true /* ... */ },
            },
          },
        },
      },
    },
    // user, community 릴레이션 제거 - 존재하지 않음
  },
});

// user/community 데이터는 subscription 릴레이션을 통해 접근
const user = snapshot.subscription.member;
const community = snapshot.subscription.community;
```

### 프롬프트 개선 제안

- **"Prisma select 절에서 릴레이션 이름은 반드시 스키마의 BELONGED RELATIONS 및 HAS RELATIONS 섹션에 정의된 propertyKey와 정확히 일치해야 한다. FK 컬럼명(예: `user_id`)에서 `_id`를 제거한 이름(예: `user`)이 자동으로 릴레이션이 되는 것이 아니다."**
- **"`satisfies`를 중첩 select에 사용할 때, `FindManyArgs`가 아닌 해당 모델의 `DefaultArgs`를 사용하거나, 아예 `satisfies`를 생략하라."**

---

## 오류 파일 2: patchCommunityPlatformPostsPostIdComments.ts

### 오류 내용

```
- Object literal may only specify known properties, and 'owner' does not exist in type 'community_platform_communitiesSelect<DefaultArgs>'.
- Object literal may only specify known properties, and 'vote_score' does not exist in type 'community_platform_postsSelect<DefaultArgs>'.
- Property 'author' does not exist on type '{ created_at: Date; updated_at: Date; id: string; ... member_id: string; post_id: string; ... }'.
- Property 'post' does not exist on type '{ created_at: Date; updated_at: Date; id: string; ... }'.
- Property 'parent' does not exist on type '{ created_at: Date; updated_at: Date; id: string; ... }'.
```

### 문제 코드

```typescript
// 문제 1: community 테이블에 'owner' 릴레이션이 없음 (실제: 'ownerMember')
community: {
  select: {
    id: true,
    name: true,
    description: true,
    created_at: true,
    owner: { ... },  // <-- 잘못된 릴레이션 이름
  },
},

// 문제 2: posts 테이블에 'vote_score', 'comment_count', 'content_preview' 컬럼이 없음
post: {
  select: {
    id: true,
    title: true,
    vote_score: true,      // <-- 존재하지 않는 컬럼
    comment_count: true,   // <-- 존재하지 않는 컬럼
    content_preview: true, // <-- 존재하지 않는 컬럼
  },
},

// 문제 3: Prisma include 없이 릴레이션 접근 시도
// select에서 author, post, parent를 포함하지 않았는데 결과에서 접근
comment.author.id     // <-- author를 select/include 하지 않음
comment.post.id       // <-- post를 select/include 하지 않음
comment.parent.id     // <-- parent를 select/include 하지 않음
```

### DB 스키마 실제 구조

**`community_platform_communities`**:
```prisma
model community_platform_communities {
  owner_member_id String @db.Uuid
  // 릴레이션 이름: ownerMember (owner 아님!)
  ownerMember community_platform_members @relation(...)
}
```

**`community_platform_posts`**:
```prisma
model community_platform_posts {
  id                                  String @id @db.Uuid
  community_platform_member_id        String @db.Uuid
  community_platform_community_id     String @db.Uuid
  title                               String
  content_type                        String
  created_at                          DateTime
  updated_at                          DateTime
  deleted_at                          DateTime?
  // vote_score 컬럼 없음!
  // comment_count 컬럼 없음!
  // content_preview 컬럼 없음!
}
```

**`community_platform_comments`**:
```prisma
model community_platform_comments {
  // 릴레이션 이름:
  author  community_platform_members  @relation(...)  // author
  post    community_platform_posts    @relation(...)   // post
  parent  community_platform_comments? @relation(...)  // parent
}
```

### 원인 분석

1. **릴레이션 이름 오류**: `community_platform_communities`의 owner 릴레이션 이름이 `ownerMember`인데 `owner`로 접근했다. 이는 LLM이 API 응답 DTO의 필드명(`owner`)과 Prisma 릴레이션 이름(`ownerMember`)을 혼동한 것이다.

2. **가상 컬럼 환각**: `vote_score`, `comment_count`, `content_preview`는 posts 테이블에 실제로 존재하지 않는다. 스키마 주석에 "Vote scores and comment counts are calculated from related tables"라고 명시되어 있다. LLM이 API 응답에 필요한 필드를 DB 컬럼으로 착각했다.

3. **select와 결과 타입 불일치**: `select`에 `author`, `post`, `parent`를 include했지만 `satisfies Prisma.community_platform_membersFindManyArgs`라는 잘못된 타입 단언 때문에 Prisma가 이 릴레이션들을 인식하지 못했다.

### 수정안

```typescript
select: {
  id: true,
  content: true,
  vote_score: true,
  created_at: true,
  updated_at: true,
  deleted_at: true,
  parent_comment_id: true,
  author: {
    select: {
      id: true,
      email: true,
      username: true,
      nickname: true,
      email_verified: true,
      registered_at: true,
      last_login_at: true,
    },
  },
  post: {
    select: {
      id: true,
      title: true,
      content_type: true,
      created_at: true,
      // vote_score, comment_count는 별도 쿼리로 계산해야 함
      community: {
        select: {
          id: true,
          name: true,
          description: true,
          created_at: true,
          ownerMember: {  // 'owner' 아닌 'ownerMember'
            select: {
              id: true,
              email: true,
              username: true,
              // ...
            },
          },
        },
      },
    },
  },
  parent: {
    select: {
      id: true,
      content: true,
      vote_score: true,
      created_at: true,
      updated_at: true,
      deleted_at: true,
    },
  },
},
```

### 프롬프트 개선 제안

- **"Prisma select에서 릴레이션 프로퍼티는 반드시 스키마의 릴레이션 propertyKey를 사용하라. DTO의 응답 필드명과 Prisma 릴레이션명이 다를 수 있다. 예: DTO에서 `owner`지만 Prisma에서는 `ownerMember`."**
- **"API 응답에 필요한 `vote_score`, `comment_count` 같은 집계 값이 테이블 컬럼에 없는 경우, 별도의 count 쿼리나 관련 테이블에서 계산하라. DB 컬럼에 없는 필드를 select에 포함하지 마라."**

---

## 오류 파일 3: postCommunityPlatformAdminReportsReportIdDismissals.ts

### 오류 내용

```
- Duplicate identifier 'AdminPayload'.
- Cannot redeclare block-scoped variable 'adminSession'.
- Object literal may only specify known properties, but 'member_id' does not exist in type 'community_platform_moderation_rolesWhereInput'. Did you mean to write 'member'?
- Cannot find name 'Need'. / Cannot find name 'to'. / Cannot find name 'The'. (수십 개)
- Parsing error: Expression expected.
```

### 문제 코드

```typescript
// 문제 1: adminSession 변수 중복 선언
const adminSession = await MyGlobal.prisma.community_platform_admin_sessions.findUniqueOrThrow({
    where: { id: props.admin.session_id },
});
// ... 60줄 후 ...
const adminSession = await MyGlobal.prisma.community_platform_admin_sessions.findUniqueOrThrow({
    where: { id: props.admin.session_id },
});

// 문제 2: moderation_roles의 where에 잘못된 필드명
const moderationRole = await MyGlobal.prisma.community_platform_moderation_roles.findFirst({
    where: {
        member_id: props.admin.id,       // <-- 잘못됨. 실제 컬럼: community_platform_member_id
        community_id: report.community_id, // <-- 잘못됨. 실제 컬럼: community_platform_community_id
    },
});

// 문제 3: 함수 본문 종료 후 LLM "사고 과정" 텍스트가 코드로 출력됨
};
Need;
to;
fix: The;
admin;
payload;
is;
AdminPayload, but;
moderation_roles;
references;
member_id, not;
admin_id.This;
// ... 170줄에 걸친 영어 문장이 JavaScript 코드로 해석됨
```

### DB 스키마 실제 구조

**`community_platform_moderation_roles`**:
```prisma
model community_platform_moderation_roles {
  community_platform_member_id                String @db.Uuid  // member_id 아님!
  community_platform_community_id             String @db.Uuid  // community_id 아님!
  assigned_by_community_platform_member_id    String? @db.Uuid
  // ...
}
```

### 원인 분석

1. **LLM 사고 과정 누출(Chain-of-Thought Leakage)**: 함수 코드를 생성한 후, LLM이 자신의 내부 추론 과정(자기 반성, 스키마 분석)을 코드 파일 안에 평문으로 출력했다. 이 텍스트가 TypeScript 파서에 의해 코드로 해석되면서 수십 개의 `Cannot find name` 오류가 발생했다.

2. **변수 중복 선언**: 코드를 수정하면서 이전 변수 선언을 삭제하지 않고 새로운 선언을 추가했다.

3. **FK 컬럼명 단축 오류**: `community_platform_moderation_roles` 테이블의 실제 FK 컬럼명은 `community_platform_member_id`와 `community_platform_community_id`인데, LLM이 `member_id`와 `community_id`로 단축하여 사용했다.

4. **Admin-Member 아이덴티티 혼동**: `AdminPayload`의 `id`를 `moderation_roles.member_id`에 직접 매핑했는데, admin과 member는 별개의 엔티티이다. admin의 id로 member 테이블의 moderation role을 찾을 수 없다.

### 수정안

```typescript
export async function postCommunityPlatformAdminReportsReportIdDismissals(props: {
    admin: AdminPayload;
    reportId: string & tags.Format<"uuid">;
    body: ICommunityPlatformReportDismissal.ICreate;
}): Promise<ICommunityPlatformReportDismissal> {
    // admin 세션 1회만 검증
    const adminSession = await MyGlobal.prisma.community_platform_admin_sessions.findUniqueOrThrow({
        where: { id: props.admin.session_id },
    });

    const report = await MyGlobal.prisma.community_platform_content_reports.findUniqueOrThrow({
        where: { id: props.reportId },
        select: { id: true, status: true, community_id: true },
    });

    if (report.status !== 'pending') {
        throw new HttpException('Report is not pending', 400);
    }

    // 올바른 FK 컬럼명 사용 - 단, admin과 member의 관계를 정의하는 별도 로직 필요
    // community_platform_moderation_roles 테이블은 member 기반이므로
    // admin이 해당 커뮤니티에 대한 권한을 별도로 확인해야 함

    // ... 함수 본문만 포함, 사고 과정 텍스트 제거
}
// 함수 종료 후 추가 텍스트 없음
```

### 프롬프트 개선 제안

- **"코드 생성 시 사고 과정(reasoning), 자기 반성(self-reflection), 수정 계획(revision plan) 텍스트를 절대로 코드 파일에 포함하지 마라. 오직 유효한 TypeScript 코드만 출력하라."**
- **"동일 스코프에서 같은 변수를 두 번 선언하지 마라. 변수를 재사용할 경우 기존 선언을 재할당하라."**
- **"Prisma where 절에서 컬럼명을 사용할 때, 스키마에 정의된 정확한 컬럼명을 사용하라. 접두어(예: `community_platform_`)를 생략하지 마라."**

---

## 오류 파일 4: putCommunityPlatformMemberCommentsCommentIdVotesMine.ts

### 오류 내용

```
- Object literal may only specify known properties, and 'owner' does not exist in type 'community_platform_communitiesSelect<DefaultArgs>'.
- Property 'member' does not exist on type '{ created_at: Date; ... member_id: string; ... }'.
- Property 'post' does not exist on type '{ created_at: Date; ... post_id: string; ... }'.
```

### 문제 코드

```typescript
// 문제 1: comments에 'member' 릴레이션을 사용 (실제: 'author')
const commentObj = await MyGlobal.prisma.community_platform_comments.findUniqueOrThrow({
  select: {
    member: {          // <-- 잘못됨. 실제 릴레이션 이름: 'author'
      select: { ... },
    },
    post: {
      select: {
        community: {
          select: {
            owner: { ... },  // <-- 잘못됨. 실제 릴레이션 이름: 'ownerMember'
          },
        },
      },
    },
  },
});

// 결과에서도 같은 잘못된 이름 사용
commentObj.member.id     // <-- commentObj에 member 프로퍼티 없음
commentObj.post.id       // <-- select에서 제대로 include 안 되어 없음
```

### DB 스키마 실제 구조

**`community_platform_comments`**:
```prisma
model community_platform_comments {
  member_id   String @db.Uuid  // FK 컬럼
  post_id     String @db.Uuid  // FK 컬럼

  // BELONGED RELATIONS:
  author  community_platform_members   @relation(fields: [member_id], ...)  // 'member' 아닌 'author'!
  post    community_platform_posts     @relation(fields: [post_id], ...)
  parent  community_platform_comments? @relation(...)
}
```

### 원인 분석

1. **릴레이션 이름과 FK 컬럼명 혼동**: `member_id`라는 FK 컬럼에서 릴레이션 이름을 `member`로 추측했으나, 실제 Prisma 릴레이션 이름은 `author`이다. FK 컬럼명과 릴레이션 propertyKey는 별개이다.

2. **`owner` vs `ownerMember` 반복**: 파일 2와 동일한 오류가 반복되었다. communities 테이블의 릴레이션 이름은 `ownerMember`이다.

### 수정안

```typescript
const commentObj = await MyGlobal.prisma.community_platform_comments.findUniqueOrThrow({
  where: { id: vote.community_platform_comment_id, deleted_at: null },
  select: {
    id: true,
    content: true,
    vote_score: true,
    created_at: true,
    updated_at: true,
    deleted_at: true,
    author: {           // 'member' 아닌 'author'
      select: {
        id: true,
        email: true,
        username: true,
        nickname: true,
        email_verified: true,
        registered_at: true,
        last_login_at: true,
      },
    },
    post: {
      select: {
        id: true,
        title: true,
        created_at: true,
        author: { select: { /* ... */ } },
        community: {
          select: {
            id: true,
            name: true,
            description: true,
            created_at: true,
            ownerMember: { select: { /* ... */ } },  // 'owner' 아닌 'ownerMember'
          },
        },
      },
    },
    parent_comment_id: true,
  },
});
```

### 프롬프트 개선 제안

- **"FK 컬럼명(예: `member_id`)에서 릴레이션 이름을 추측하지 마라. Prisma 스키마의 릴레이션 propertyKey(예: `author`)를 정확히 참조하라."**

---

## 오류 파일 5: CommunityPlatformBanAssignmentTransformer.ts

### 오류 내용

```
- Module '"./CommunityPlatformBanAtSummaryTransformer"' has no exported member 'CommunityPlatformBanAtSummaryTransformer'.
- Individual declarations in merged declaration 'CommunityPlatformBanAtSummaryTransformer' must be all exported or all local.
```

### 문제 코드

```typescript
// CommunityPlatformBanAtSummaryTransformer를 import하면서
import { CommunityPlatformBanAtSummaryTransformer } from "./CommunityPlatformBanAtSummaryTransformer";

// 동시에 같은 파일 내에서 동일 이름의 namespace를 재정의
export namespace CommunityPlatformBanAtSummaryTransformer {
  // ...
}
```

### 원인 분석

LLM이 `CommunityPlatformBanAtSummaryTransformer`가 별도 파일에서 제대로 export되지 않는다고 판단하여, 같은 파일 안에서 동일 이름의 namespace를 "보완"으로 재정의했다. 이 결과:

1. import 문과 로컬 namespace 선언이 충돌하여 **merged declaration** 오류가 발생했다.
2. import한 모듈에서 실제로 export하는 형태가 다르므로 import도 실패했다.

### 수정안

```typescript
// 방법 1: import를 제거하고 로컬에서만 정의
// import { CommunityPlatformBanAtSummaryTransformer } from "./CommunityPlatformBanAtSummaryTransformer"; -- 제거

export namespace CommunityPlatformBanAtSummaryTransformer {
  // ... 전체 구현
}

// 방법 2: import만 사용하고 로컬 재정의 제거
import { CommunityPlatformBanAtSummaryTransformer } from "./CommunityPlatformBanAtSummaryTransformer";
// 로컬 namespace 정의 제거
```

### 프롬프트 개선 제안

- **"다른 파일에서 import한 이름과 동일한 이름으로 현재 파일에서 namespace/class/함수를 재정의하지 마라. import가 불완전하다고 판단되면 해당 파일을 수정하거나, import를 제거하고 현재 파일에서만 정의하라."**

---

## 오류 파일 6: CommunityPlatformPostSnapshotTransformer.ts

### 오류 내용

```
- Object literal may only specify known properties, and 'snapshotMember' does not exist in type 'community_platform_post_snapshotsSelect<DefaultArgs>'.
```

### 문제 코드

```typescript
export function select() {
  return {
    select: {
      id: true,
      snapshot_title: true,
      // ...
      post: CommunityPlatformPostAtSummaryTransformer.select(),
      snapshotMember: {       // <-- 존재하지 않는 릴레이션
        select: { ... },
      },
      snapshotCommunity: {    // <-- 존재하지 않는 릴레이션
        select: { ... },
      },
    },
  };
}
```

### DB 스키마 실제 구조

**`community_platform_post_snapshots`**:
```prisma
model community_platform_post_snapshots {
  id                                           String @id @db.Uuid
  community_platform_post_id                   String @db.Uuid
  snapshot_community_platform_member_id         String @db.Uuid  // FK 컬럼만 존재
  snapshot_community_platform_community_id      String @db.Uuid  // FK 컬럼만 존재

  // BELONGED RELATIONS:
  post  community_platform_posts @relation(...)
  // 'snapshotMember', 'snapshotCommunity' 릴레이션은 정의되어 있지 않음!
}
```

### 원인 분석

`community_platform_post_snapshots` 테이블에는 `snapshot_community_platform_member_id`와 `snapshot_community_platform_community_id` FK 컬럼이 있지만, Prisma 릴레이션이 정의되어 있지 않다. 이 테이블은 비정규화 스냅샷이므로 릴레이션 대신 FK 값만 저장한다. LLM은 FK 컬럼이 있으면 릴레이션도 있을 것이라고 추측했다.

### 수정안

```typescript
export function select() {
  return {
    select: {
      id: true,
      snapshot_title: true,
      snapshot_content_type: true,
      snapshot_community_platform_member_id: true,     // 컬럼으로 직접 조회
      snapshot_community_platform_community_id: true,  // 컬럼으로 직접 조회
      snapshot_created_at: true,
      snapshot_updated_at: true,
      snapshot_deleted_at: true,
      created_at: true,
      updated_at: true,
      post: CommunityPlatformPostAtSummaryTransformer.select(),
      // snapshotMember, snapshotCommunity 제거
    },
  };
}

// member/community 데이터가 필요하면 별도 쿼리 수행
```

### 프롬프트 개선 제안

- **"스냅샷 테이블은 비정규화 설계로, FK 컬럼은 있지만 Prisma 릴레이션이 정의되어 있지 않을 수 있다. 릴레이션 이름은 반드시 스키마의 관계 정의 섹션에서 확인하라."**

---

## 오류 파일 7: CommunityPlatformReportOfCommentTransformer.ts

### 오류 내용

```
- Object literal may only specify known properties, and 'name' does not exist in type 'community_platform_membersSelect<DefaultArgs>'.
- Object literal may only specify known properties, and 'content' does not exist in type 'community_platform_postsSelect<DefaultArgs>'.
- Object literal may only specify known properties, and 'resolved_at' does not exist in type 'community_platform_content_reportsSelect<DefaultArgs>'.
- Property 'comment' does not exist on type '{ ... community_platform_comment_id: string; community_platform_content_report_id: string; ... }'.
- Property 'contentReport' does not exist on type '{ ... }'.
- Object literal may only specify known properties, and 'name' does not exist in type 'ISummary'.
```

### 문제 코드

```typescript
select: {
  comment: {                    // <-- report_of_comments에 select 없이 접근 불가
    select: {
      author: {
        select: {
          id: true,
          name: true,           // <-- members 테이블에 'name' 컬럼 없음
          avatar_url: true,     // <-- members 테이블에 'avatar_url' 컬럼 없음
        },
      },
      post: {
        select: {
          content: true,        // <-- posts 테이블에 'content' 컬럼 없음
          vote_score: true,     // <-- posts 테이블에 'vote_score' 컬럼 없음
        },
      },
    },
  },
  contentReport: {              // <-- 릴레이션 접근이 안 됨 (select 미포함)
    select: {
      resolved_at: true,        // <-- content_reports에 'resolved_at' 컬럼 없음
      resolved_by: { ... },     // <-- content_reports에 'resolved_by' 릴레이션 없음
    },
  },
},
```

### DB 스키마 실제 구조

**`community_platform_members`**:
```prisma
model community_platform_members {
  id             String    @id @db.Uuid
  email          String
  password_hash  String
  username       String
  nickname       String?
  email_verified Boolean
  registered_at  DateTime
  last_login_at  DateTime?
  deleted_at     DateTime?
  created_at     DateTime
  updated_at     DateTime
  // 'name' 컬럼 없음! 'avatar_url' 컬럼 없음!
}
```

**`community_platform_posts`**:
```prisma
model community_platform_posts {
  id                                  String
  title                               String
  content_type                        String
  // 'content' 컬럼 없음! (content는 post_texts 별도 테이블)
  // 'vote_score' 컬럼 없음!
}
```

**`community_platform_content_reports`**:
```prisma
model community_platform_content_reports {
  id                  String
  reporter_member_id  String
  community_id        String
  reason              String
  status              String
  created_at          DateTime
  updated_at          DateTime
  // 'resolved_at' 컬럼 없음!
  // 'resolved_by' 릴레이션 없음!
}
```

**`community_platform_report_of_comments`**:
```prisma
model community_platform_report_of_comments {
  id                                    String @id @db.Uuid
  community_platform_content_report_id  String @db.Uuid
  community_platform_comment_id         String @db.Uuid

  // BELONGED RELATIONS:
  contentReport  community_platform_content_reports @relation(...)
  comment        community_platform_comments        @relation(...)
}
```

### 원인 분석

1. **완전히 다른 스키마 상상**: LLM이 members 테이블에 `name`, `avatar_url` 컬럼이 있다고 상상했다. 실제로는 `username`과 `nickname`이며, 아바타 URL은 별도 테이블 관리이다.

2. **posts 테이블 구조 오해**: `content`는 posts 테이블이 아닌 `community_platform_post_texts` 별도 테이블에 저장된다. `vote_score`도 posts 테이블에 없다.

3. **content_reports에 없는 필드**: `resolved_at`, `resolved_by`는 content_reports 테이블에 존재하지 않는다. 해결 처리는 `community_platform_report_dismissals`나 `community_platform_report_approvals` 별도 테이블에서 관리한다.

4. **릴레이션 접근 오류**: `report_of_comments`의 `comment`과 `contentReport` 릴레이션은 실제로 존재하지만, `select`에 포함되지 않은 상태에서 결과 객체에서 접근하려 했다.

5. **DTO 필드 이름 혼동**: DTO의 `ISummary`에 `name` 필드가 없는데 `name`을 매핑하려 해서 DTO 타입 오류도 발생했다.

### 수정안

```typescript
export function select(): Prisma.community_platform_report_of_commentsFindManyArgs {
  return {
    select: {
      id: true,
      created_at: true,
      updated_at: true,
      deleted_at: true,
      comment: {
        select: {
          id: true,
          content: true,
          vote_score: true,
          created_at: true,
          updated_at: true,
          deleted_at: true,
          author: {
            select: {
              id: true,
              email: true,
              username: true,      // 'name' 대신 'username'
              nickname: true,
              email_verified: true,
              registered_at: true,
              last_login_at: true,
            },
          },
          post: {
            select: {
              id: true,
              title: true,
              content_type: true,   // 'content' 대신 'content_type'
              created_at: true,
              updated_at: true,
              deleted_at: true,
            },
          },
          parent: {
            select: {
              id: true,
              content: true,
              vote_score: true,
              created_at: true,
              updated_at: true,
              deleted_at: true,
            },
          },
        },
      },
      contentReport: {
        select: {
          id: true,
          reason: true,
          status: true,
          created_at: true,
          updated_at: true,
          // resolved_at, resolved_by 제거 - 존재하지 않음
        },
      },
    },
  };
}
```

### 프롬프트 개선 제안

- **"코드 생성 시 API 응답 DTO의 필드와 DB 컬럼을 구분하라. DTO에 `name`이 있더라도 DB 테이블의 실제 컬럼명은 `username`일 수 있다."**
- **"posts 테이블에 `content` 컬럼이 없는 경우, 별도의 content 테이블(예: `post_texts`, `post_links`)을 릴레이션으로 join해야 한다."**

---

## 종합 조치 사항

### 반복되는 오류 패턴 요약

| 패턴 | 빈도 | 해당 파일 |
|------|------|-----------|
| 릴레이션 이름 환각 (FK명에서 추측) | 5/7 | 파일 1,2,4,6,7 |
| 존재하지 않는 컬럼 사용 | 3/7 | 파일 2,4,7 |
| satisfies 타입 오용 (FindManyArgs) | 3/7 | 파일 1,2,4 |
| LLM 사고 과정 누출 | 1/7 | 파일 3 |
| 동일 이름 import + 재정의 충돌 | 1/7 | 파일 5 |
| nullable 필드 미처리 | 1/7 | 파일 1 |
| DTO 필드와 DB 컬럼 혼동 | 2/7 | 파일 2,7 |

### 프롬프트에 필요한 종합 가이드

1. **릴레이션 이름 규칙 강화**
   > Prisma `select` 또는 `include`에서 사용하는 릴레이션 프로퍼티 키는 반드시 스키마에 정의된 이름과 정확히 일치해야 한다. FK 컬럼명(예: `member_id`, `user_id`)에서 `_id`를 제거한 이름이 자동으로 릴레이션이 되는 것이 아니다. 스키마의 `// BELONGED RELATIONS` 및 `// HAS RELATIONS` 섹션에서 정확한 propertyKey를 확인하라.

2. **스냅샷/비정규화 테이블 규칙**
   > 스냅샷 테이블은 비정규화 설계로, FK 컬럼이 존재하더라도 Prisma 릴레이션이 정의되어 있지 않을 수 있다. 릴레이션을 사용하기 전 반드시 스키마의 관계 정의 섹션을 확인하라. 릴레이션이 없으면 FK 컬럼값을 직접 조회하거나 별도 쿼리를 수행하라.

3. **컬럼 존재 확인 필수**
   > `select` 절에 포함하는 모든 필드명은 해당 모델의 실제 컬럼이어야 한다. API 응답 DTO의 필드명과 DB 컬럼명은 다를 수 있다. 특히:
   > - `vote_score`, `comment_count`는 집계 값으로 별도 테이블이나 계산이 필요할 수 있다
   > - `content`는 posts 자체가 아닌 `post_texts`, `post_links` 등 하위 테이블에 저장될 수 있다
   > - `name`, `avatar_url`은 members에 없고 `username`, `nickname`이 존재할 수 있다

4. **satisfies 올바른 사용**
   > 중첩 릴레이션의 select 객체에 `satisfies Prisma.XXXFindManyArgs`를 사용하지 마라. `FindManyArgs`는 최상위 쿼리에만 적합하다. 중첩 릴레이션에는 `satisfies`를 생략하거나 `DefaultArgs`를 사용하라.

5. **코드만 출력**
   > 생성 파일에는 유효한 TypeScript 코드만 포함하라. 자기 반성, 수정 계획, 스키마 분석 등의 사고 과정 텍스트를 절대 코드 파일에 포함하지 마라. 코드 생성 후 파일이 TypeScript로서 문법적으로 유효한지 검증하라.

6. **nullable 필드 처리**
   > `new Date()` 생성자에 nullable 타입 값을 전달할 때 반드시 null 체크를 수행하라. `prop | null` 타입은 `new Date(prop!)`처럼 non-null assertion을 사용하지 말고, null 가드를 통해 안전하게 처리하라.

7. **import와 로컬 선언 충돌 방지**
   > 다른 파일에서 import한 이름과 동일한 이름의 namespace/class/function을 현재 파일에서 재정의하지 마라.
