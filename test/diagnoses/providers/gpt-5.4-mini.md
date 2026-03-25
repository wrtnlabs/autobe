# openai/gpt-5.4-mini Realize 단계 컴파일 에러 상세 진단

## 개요

| 시나리오 | 오류 파일 수 | 핵심 에러 수 | 핵심 오류 패턴 |
|----------|-------------|-------------|---------------|
| shopping | 4 | 4 | 타입명 오타, 관계 누락 select, DTO boolean 오류, nullable 불일치 |
| erp | 6 | 6 | 관계 include 누락, DTO boolean 오류, where 필드명 혼동, 타입 캐스팅 실패 |

**모델**: `gpt-5.4-mini` (provider: openai)
**총 에러 파일**: 10개 (shopping 4 + erp 6)

---

## 시나리오 1: shopping (4 compile errors)

**위치**: `D:/github/wrtnlabs/autobe/test/results/openai/gpt-5.4-mini/shopping/realize`

---

### 에러 1-1: `src/providers/patchShoppingMallAdministratorSellerApprovalRequestsPending.ts`

#### 컴파일 에러 메시지

```
'"src/api/structures/IShoppingMallSeller".IShoppingMallSeller' has no exported member named 'ISSummary'. Did you mean 'ISummary'?
```

#### DB 스키마

```prisma
model shopping_mall_seller_approval_requests {
  id                       String   @id @db.Uuid
  shopping_mall_seller_id  String   @db.Uuid
  status                   String
  rejection_reason         String?
  created_at               DateTime @db.Timestamptz
  updated_at               DateTime @db.Timestamptz

  seller shopping_mall_sellers @relation(fields: [shopping_mall_seller_id], references: [id], onDelete: Cascade)
}

model shopping_mall_sellers {
  id              String    @id @db.Uuid
  email           String
  approval_status String
  rejection_reason String?
  account_status  String
  approved_at     DateTime? @db.Timestamptz
  rejected_at     DateTime? @db.Timestamptz
  suspended_at    DateTime? @db.Timestamptz
  banned_at       DateTime? @db.Timestamptz
  last_login_at   DateTime? @db.Timestamptz
  created_at      DateTime  @db.Timestamptz
  updated_at      DateTime  @db.Timestamptz
  deleted_at      DateTime? @db.Timestamptz

  sellerProfile shopping_mall_seller_profiles?
}
```

#### API 응답 DTO 스펙

```typescript
// IShoppingMallSeller.ts
export namespace IShoppingMallSeller {
  export type ISummary = {
    id: string & tags.Format<"uuid">;
    email: string & tags.Format<"email">;
    approvalStatus: string;
    rejectionReason: string | null;
    accountStatus: string;
    approvedAt: (string & tags.Format<"date-time">) | null;
    rejectedAt: (string & tags.Format<"date-time">) | null;
    suspendedAt: (string & tags.Format<"date-time">) | null;
    bannedAt: (string & tags.Format<"date-time">) | null;
    lastLoginAt: (string & tags.Format<"date-time">) | null;
    createdAt: string & tags.Format<"date-time">;
    updatedAt: string & tags.Format<"date-time">;
    deletedAt: (string & tags.Format<"date-time">) | null;
    sellerProfile: IShoppingMallSellerProfile.ISummary;  // non-nullable!
  };
  // 주의: 'ISSummary'라는 타입은 존재하지 않음
}
```

#### 문제의 코드

```typescript
// 173행
} satisfies IShoppingMallSeller.ISSummary,
//                                ^^^^^^^
//                                오타: 'ISSummary' -> 'ISummary'
```

#### 오류 원인 분석

- **무엇이**: `IShoppingMallSeller.ISSummary`라는 존재하지 않는 타입을 참조
- **왜**: 타입명 `ISummary`를 `ISSummary`로 오타 (S를 중복 입력)
- **LLM이 왜**: `gpt-5.4-mini`가 `satisfies` 절에서 타입명을 생성할 때 prefix 'IS'와 'Summary'를 조합하는 과정에서 'S'를 중복 삽입. 이는 LLM의 토큰 생성 시 camelCase/PascalCase 경계 인식 실패로 발생하는 전형적인 오타 패턴

#### 올바른 코드

```typescript
} satisfies IShoppingMallSeller.ISummary,
```

#### 권고 조치사항

- 시스템 프롬프트에서 `satisfies` 절 작성 시 반드시 실제 DTO 타입명을 정확히 복사하도록 지침 추가
- 타입명 유효성 검증을 위한 사전 체크 단계 도입

---

### 에러 1-2: `src/providers/patchShoppingMallAdministratorSellers.ts`

#### 컴파일 에러 메시지

```
Type '{ id: string; shopName: string; shopDescription: string; logoImageUrl: string;
  created_at: string; updated_at: string; deleted_at: string | null; }' does not satisfy
  the expected type 'ISummary'.
  Property 'seller' is missing in type '...' but required in type 'ISummary'.

Type '... | null' is not assignable to type 'ISummary'.
  Type 'null' is not assignable to type 'ISummary'.
```

#### DB 스키마

```prisma
model shopping_mall_seller_profiles {
  id                       String   @id @db.Uuid
  shopping_mall_seller_id  String   @db.Uuid
  shop_name                String
  shop_description         String
  logo_image_url           String   @db.VarChar(80000)
  created_at               DateTime @db.Timestamptz
  updated_at               DateTime @db.Timestamptz
  deleted_at               DateTime? @db.Timestamptz

  seller shopping_mall_sellers @relation(fields: [shopping_mall_seller_id], references: [id])
}
```

#### API 응답 DTO 스펙

```typescript
// IShoppingMallSellerProfile.ts
export namespace IShoppingMallSellerProfile {
  export type ISummary = {
    id: string & tags.Format<"uuid">;
    seller: IShoppingMallSeller.ISummary;  // 필수 필드!
    shopName: string;
    shopDescription: string;
    logoImageUrl: string & tags.MaxLength<80000>;
    created_at: string & tags.Format<"date-time">;
    updated_at: string & tags.Format<"date-time">;
    deleted_at: (string & tags.Format<"date-time">) | null;
  };
}

// IShoppingMallSeller.ts
export namespace IShoppingMallSeller {
  export type ISummary = {
    // ... (모든 seller 필드)
    sellerProfile: IShoppingMallSellerProfile.ISummary;  // non-nullable!
  };
}
```

#### 문제의 코드

```typescript
// 108-120행
sellerProfile: seller.sellerProfile
  ? ({
      id: seller.sellerProfile.id,
      shopName: seller.sellerProfile.shop_name,
      shopDescription: seller.sellerProfile.shop_description,
      logoImageUrl: seller.sellerProfile.logo_image_url,
      created_at: seller.sellerProfile.created_at.toISOString(),
      updated_at: seller.sellerProfile.updated_at.toISOString(),
      deleted_at: seller.sellerProfile.deleted_at?.toISOString() ?? null,
    } satisfies IShoppingMallSellerProfile.ISummary)  // <-- 'seller' 필드 누락!
  : null,  // <-- ISummary는 non-nullable인데 null 반환!
```

#### 오류 원인 분석

- **무엇이**: `IShoppingMallSellerProfile.ISummary` 변환 시 필수 필드 `seller`를 누락했고, `IShoppingMallSeller.ISummary.sellerProfile`이 non-nullable인데 `null`을 반환
- **왜**: 두 가지 문제 복합:
  1. `IShoppingMallSellerProfile.ISummary`에 필수인 `seller: IShoppingMallSeller.ISummary` 필드를 변환 객체에 포함하지 않음
  2. `IShoppingMallSeller.ISummary.sellerProfile`이 `IShoppingMallSellerProfile.ISummary` (non-nullable)로 정의되어 있는데, seller에 프로필이 없는 경우 `null`을 할당
- **LLM이 왜**: DTO 간 순환 참조 관계(`ISeller.ISummary` -> `ISellerProfile.ISummary` -> `ISeller.ISummary`)에서 LLM이 순환을 끊기 위해 `seller` 필드를 의도적으로 생략. 또한 DB 스키마에서 `sellerProfile`이 1:1 optional 관계(`?`)인 것을 보고 nullable로 처리했으나, DTO에서는 non-nullable로 정의됨

#### 올바른 코드

```typescript
sellerProfile: seller.sellerProfile
  ? ({
      id: seller.sellerProfile.id,
      seller: {
        id: seller.id,
        email: seller.email,
        approvalStatus: seller.approval_status,
        rejectionReason: seller.rejection_reason,
        accountStatus: seller.account_status,
        approvedAt: seller.approved_at?.toISOString() ?? null,
        rejectedAt: seller.rejected_at?.toISOString() ?? null,
        suspendedAt: seller.suspended_at?.toISOString() ?? null,
        bannedAt: seller.banned_at?.toISOString() ?? null,
        lastLoginAt: seller.last_login_at?.toISOString() ?? null,
        createdAt: seller.created_at.toISOString(),
        updatedAt: seller.updated_at.toISOString(),
        deletedAt: seller.deleted_at?.toISOString() ?? null,
        sellerProfile: null as never,  // 순환 참조 차단
      },
      shopName: seller.sellerProfile.shop_name,
      shopDescription: seller.sellerProfile.shop_description,
      logoImageUrl: seller.sellerProfile.logo_image_url,
      created_at: seller.sellerProfile.created_at.toISOString(),
      updated_at: seller.sellerProfile.updated_at.toISOString(),
      deleted_at: seller.sellerProfile.deleted_at?.toISOString() ?? null,
    } satisfies IShoppingMallSellerProfile.ISummary)
  : (null as never),  // DTO가 non-nullable이므로 이 경우는 사전에 필터링 필요
```

#### 권고 조치사항

- DTO의 nullable/non-nullable 구분을 명확히 인식하도록 프롬프트 강화
- 순환 참조 DTO 변환 시 `as never` 패턴을 표준화
- DB optional 관계와 DTO non-nullable 필드 간의 불일치 검출 로직 필요

---

### 에러 1-3: `src/transformers/ShoppingMallCartTransformer.ts`

#### 컴파일 에러 메시지

```
Type 'string' is not assignable to type 'boolean'.  (4회 반복)
Type 'string | null' is not assignable to type 'boolean | null'.
  Type 'string' is not assignable to type 'boolean | null'.
```

#### DB 스키마

```prisma
model shopping_mall_carts {
  id                        String    @id @db.Uuid
  shopping_mall_customer_id String    @db.Uuid
  created_at                DateTime  @db.Timestamptz
  updated_at                DateTime  @db.Timestamptz
  deleted_at                DateTime? @db.Timestamptz

  customer shopping_mall_customers @relation(...)
  cartItems shopping_mall_cart_items[]
}
```

#### API 응답 DTO 스펙

```typescript
// IShoppingMallCart.ts
export type IShoppingMallCart = {
  id: boolean;          // <-- 잘못된 타입! string & tags.Format<"uuid">여야 함
  customer: IShoppingMallCustomer.ISummary;
  created_at: boolean;  // <-- 잘못된 타입! string & tags.Format<"date-time">여야 함
  updated_at: boolean;  // <-- 잘못된 타입!
  deleted_at: boolean | null;  // <-- 잘못된 타입!
};
```

#### 문제의 코드

```typescript
// ShoppingMallCartTransformer.ts 26-36행
export async function transform(input: Payload): Promise<IShoppingMallCart> {
  return {
    id: input.id,                                    // string -> boolean 에러
    customer: await ShoppingMallCustomerAtSummaryTransformer.transform(
      input.customer,
    ),
    created_at: input.created_at.toISOString(),      // string -> boolean 에러
    updated_at: input.updated_at.toISOString(),      // string -> boolean 에러
    deleted_at: input.deleted_at?.toISOString() ?? null,  // string|null -> boolean|null 에러
  };
}
```

#### 오류 원인 분석

- **무엇이**: `IShoppingMallCart` DTO의 `id`, `created_at`, `updated_at`, `deleted_at` 필드가 모두 `boolean` 타입으로 잘못 정의되어 있음
- **왜**: DTO 자체가 잘못 생성됨. Transformer 코드는 정상적으로 `string`을 반환하지만, DTO가 `boolean`을 기대하므로 타입 불일치 발생
- **LLM이 왜**: 이것은 **realize 단계가 아닌 interface 단계의 오류**. DTO 생성 시 `gpt-5.4-mini`가 필드 타입을 결정할 때, OpenAPI 스펙의 `type` 필드를 파싱하는 과정에서 기본값으로 `boolean`을 할당한 것으로 추정. 특히 `@x-autobe-specification` 어노테이션에 "Direct mapping from ... Expose the UUID/timestamp" 등의 설명이 있음에도 불구하고 `boolean`으로 생성. 이는 LLM이 DTO 구조를 생성할 때 의미론적 설명을 무시하고 타입을 임의로 결정한 전형적인 hallucination

#### 올바른 코드 (DTO 수정 필요)

```typescript
// IShoppingMallCart.ts - 올바른 정의
export type IShoppingMallCart = {
  id: string & tags.Format<"uuid">;
  customer: IShoppingMallCustomer.ISummary;
  created_at: string & tags.Format<"date-time">;
  updated_at: string & tags.Format<"date-time">;
  deleted_at: (string & tags.Format<"date-time">) | null;
};
```

#### 권고 조치사항

- 이 에러는 realize 단계가 아닌 **interface 단계의 DTO 생성 품질 문제**
- DTO 생성 후 Prisma 스키마와의 타입 일관성 검증 단계 도입 필요
- `boolean` 타입이 UUID/timestamp 컬럼에 매핑되지 않도록 타입 매핑 규칙 강화

---

### 에러 1-4: `src/transformers/ShoppingMallSellerProfileAtSummaryTransformer.ts`

#### 컴파일 에러 메시지

```
Property 'seller' does not exist on type '{ id: string; created_at: Date; updated_at: Date;
  deleted_at: Date | null; shopping_mall_seller_id: string; shop_name: string;
  shop_description: string; logo_image_url: string; }'.
```

#### DB 스키마

```prisma
model shopping_mall_seller_profiles {
  id                       String   @id @db.Uuid
  shopping_mall_seller_id  String   @db.Uuid
  shop_name                String
  shop_description         String
  logo_image_url           String   @db.VarChar(80000)
  created_at               DateTime @db.Timestamptz
  updated_at               DateTime @db.Timestamptz
  deleted_at               DateTime? @db.Timestamptz

  // 관계
  seller shopping_mall_sellers @relation(fields: [shopping_mall_seller_id], references: [id])
}
```

#### API 응답 DTO 스펙

```typescript
export namespace IShoppingMallSellerProfile {
  export type ISummary = {
    id: string & tags.Format<"uuid">;
    seller: IShoppingMallSeller.ISummary;  // 필수: seller 관계 포함
    shopName: string;
    shopDescription: string;
    logoImageUrl: string & tags.MaxLength<80000>;
    created_at: string & tags.Format<"date-time">;
    updated_at: string & tags.Format<"date-time">;
    deleted_at: (string & tags.Format<"date-time">) | null;
  };
}
```

#### 문제의 코드

```typescript
// ShoppingMallSellerProfileAtSummaryTransformer.ts
export function select(): Prisma.shopping_mall_seller_profilesFindManyArgs {
  return {
    select: {
      id: true,
      shop_name: true,
      shop_description: true,
      logo_image_url: true,
      created_at: true,
      updated_at: true,
      deleted_at: true,
      seller: ShoppingMallSellerAtSummaryTransformer.select(),  // select에는 포함
    },
  } satisfies Prisma.shopping_mall_seller_profilesFindManyArgs;
}
// 그러나 Payload 타입 추론 시 select()의 반환값에서 seller가 포함되어 있어야 하는데
// 실제 에러는 input.seller 접근 시 발생

// 34행
seller: await ShoppingMallSellerAtSummaryTransformer.transform(
  input.seller,  // <-- Property 'seller' does not exist
),
```

#### 오류 원인 분석

- **무엇이**: `select()` 함수에서 `seller` 관계를 포함했으나, Prisma의 `GetPayload` 타입 추론에서 `seller`가 인식되지 않음
- **왜**: `select()` 함수의 반환 타입이 `Prisma.shopping_mall_seller_profilesFindManyArgs`로 선언되어 있어, Prisma가 `select` 내부의 `seller` 관계를 `FindManyArgs` 레벨이 아닌 개별 레코드 레벨로 해석하지 못함. `ShoppingMallSellerAtSummaryTransformer.select()`가 `FindManyArgs` 형태를 반환하는데, 이는 nested select에서 기대하는 `{ select: {...} }` 형태와 일치하지 않아 Prisma가 해당 필드를 스칼라 필드로만 취급
- **LLM이 왜**: `gpt-5.4-mini`가 Transformer 패턴에서 관계 include를 중첩할 때, 다른 Transformer의 `select()` 반환값이 `FindManyArgs` 타입인지 `{ select: {...} }` 서브셋인지를 구분하지 못함. 이는 Prisma의 복잡한 제네릭 타입 시스템을 LLM이 완전히 이해하지 못하는 데서 기인

#### 올바른 코드

```typescript
// select() 반환 타입을 제거하거나, 관계 select를 올바른 형태로 전달
export function select() {
  return {
    select: {
      id: true,
      shop_name: true,
      shop_description: true,
      logo_image_url: true,
      created_at: true,
      updated_at: true,
      deleted_at: true,
      seller: {
        select: {
          id: true,
          email: true,
          approval_status: true,
          // ... 필요한 seller 필드들
        },
      },
    },
  } satisfies Prisma.shopping_mall_seller_profilesFindManyArgs;
}
```

#### 권고 조치사항

- Transformer의 `select()` 함수에서 중첩 관계를 포함할 때, `FindManyArgs` 대신 인라인 `{ select: {...} }` 형태를 사용하도록 프롬프트 수정
- Prisma `GetPayload` 타입 추론 메커니즘에 대한 이해를 프롬프트에 명시

---

## 시나리오 2: erp (6 compile errors)

**위치**: `D:/github/wrtnlabs/autobe/test/results/openai/gpt-5.4-mini/erp/realize`

---

### 에러 2-1: `src/providers/patchHrmTimeTrackingMemberMeTimelogs.ts`

#### 컴파일 에러 메시지 (대표)

```
- Object literal may only specify known properties, but 'project_id' does not exist in type 'hrm_time_tracking_tasksWhereInput'. Did you mean to write 'project'?
- Object literal may only specify known properties, but 'user_account' does not exist in type 'hrm_time_tracking_employeesSelect<DefaultArgs>'. Did you mean to write 'userAccount'?
- Type 'null' is not assignable to type 'boolean | hrm_time_tracking_tasks$assigneeArgs<DefaultArgs> | undefined'.
- Type 'null' is not assignable to type 'boolean | hrm_time_tracking_tasks$parentArgs<DefaultArgs> | undefined'.
- Property 'employee' does not exist on type '{...}'. (x42)
- Property 'project' does not exist on type '{...}'. (x25)
- Property 'task' does not exist on type '{...}'. (x36)
```

#### DB 스키마

```prisma
model hrm_time_tracking_timelogs {
  id               String    @id @db.Uuid
  organization_id  String    @db.Uuid
  employee_id      String    @db.Uuid
  project_id       String    @db.Uuid
  task_id          String?   @db.Uuid
  work_date        DateTime  @db.Timestamptz
  duration_minutes Int       @db.Integer
  description      String?
  billable         Boolean
  created_at       DateTime  @db.Timestamptz
  updated_at       DateTime  @db.Timestamptz
  deleted_at       DateTime? @db.Timestamptz

  // 관계
  organization hrm_time_tracking_organizations @relation(...)
  employee     hrm_time_tracking_employees     @relation(...)
  project      hrm_time_tracking_projects      @relation(...)
  task         hrm_time_tracking_tasks?        @relation(...)
}

model hrm_time_tracking_tasks {
  id                            String    @id @db.Uuid
  hrm_time_tracking_project_id  String    @db.Uuid
  hrm_time_tracking_employee_id String?   @db.Uuid
  parent_id                     String?   @db.Uuid
  title                         String
  // ...

  project   hrm_time_tracking_projects    @relation(...)
  assignee  hrm_time_tracking_employees?  @relation(...)
  parent    hrm_time_tracking_tasks?      @relation("recursive", ...)
  children  hrm_time_tracking_tasks[]     @relation("recursive")
}
```

#### 문제의 코드 (핵심 부분)

```typescript
// 1. where 절에서 스칼라 FK를 직접 사용 (81행)
where: {
  id: props.body.task_id,
  deleted_at: null,
  project_id: props.body.project_id,  // 에러: Prisma where에서 관계 이름 'project'를 사용해야 함
},

// 2. select에서 snake_case 사용 (121행)
user_account: { select: {} },  // 에러: Prisma 관계명은 'userAccount'

// 3. task select에서 null 할당 (228-229행)
assignee: null,  // 에러: Prisma select에서 null은 유효하지 않음 (true/false/{select:...} 또는 생략)
parent: null,    // 에러: 동일

// 4. 응답 매핑에서 관계 필드 접근 (253-424행)
item.employee.id          // 에러: select에 employee 관계를 포함했으나,
item.project.id           //       Prisma GetPayload 타입 추론이 실패하여
item.task.project.id      //       이 필드들이 존재하지 않는 것으로 인식
```

#### 오류 원인 분석

- **무엇이**: 4가지 유형의 에러가 복합적으로 발생
  1. `hrm_time_tracking_tasksWhereInput`에서 `project_id` 대신 `project` 관계 필터를 사용해야 함
  2. Prisma 관계명은 camelCase (`userAccount`)인데 snake_case (`user_account`)를 사용
  3. Prisma select 객체에서 관계 필드에 `null`을 할당 (유효값: `true`, `false`, `{ select: {...} }`)
  4. 3번의 `null` 할당으로 인해 Prisma `GetPayload` 타입 추론이 깨져서, select에 포함된 모든 관계 (`employee`, `project`, `task`)가 결과 타입에서 누락
- **왜**: `null`을 `assignee`와 `parent`에 할당한 것이 연쇄적으로 전체 select 타입 추론을 파괴. Prisma의 조건부 타입(conditional types)은 select 객체의 각 값이 `boolean | { select: ... }` 유니온에 할당 가능한지 체크하는데, `null`이 들어가면 전체 타입이 `never`로 폴백
- **LLM이 왜**: `gpt-5.4-mini`가 "assignee와 parent를 로드하지 않겠다"는 의도를 `null`로 표현. Prisma에서는 관계를 제외하려면 해당 키를 select 객체에서 아예 생략하거나 `false`를 사용해야 하는데, LLM이 JavaScript의 일반적인 null 패턴을 Prisma select에 잘못 적용. 또한 `project_id`를 where 조건에서 직접 사용한 것은, FK 컬럼 이름과 관계 이름을 혼동한 것

#### 올바른 코드

```typescript
// 1. where 절 수정
where: {
  id: props.body.task_id,
  deleted_at: null,
  project: { id: props.body.project_id },  // 관계 필터 사용
},

// 2. select에서 camelCase 사용
userAccount: { select: {} },

// 3. task select에서 null 대신 생략 또는 false
task: {
  select: {
    id: true,
    project: { select: { /* ... */ } },
    // assignee, parent는 생략 (로드하지 않음)
    title: true,
    // ...
  },
},

// 4. 응답 매핑에서는 위 수정 후 정상 동작
```

#### 권고 조치사항

- Prisma select 객체에서 관계 필드에 `null`을 할당하지 않도록 명시적 규칙 추가
- where 절에서 FK 컬럼(`project_id`) 대신 관계 필터(`project: { id: ... }`)를 사용하도록 교육
- Prisma의 관계명 네이밍 컨벤션(camelCase)을 프롬프트에 명시

---

### 에러 2-2: `src/providers/patchHrmTimeTrackingMemberReportsTime.ts`

#### 컴파일 에러 메시지

```
- Object literal may only specify known properties, and 'key' does not exist in type
  '(Without<Hrm_time_tracking_role_permissionsScalarRelationFilter, ...> & ...) | ...'.
- Conversion of type '{...}' to type 'IHrmTimeTrackingTimelogReport' may be a mistake
  because neither type sufficiently overlaps with the other.
  Types of property 'dateFrom' are incompatible.
    Type 'string & Format<"date">' is not comparable to type 'boolean'.
```

#### DB 스키마

```prisma
model hrm_time_tracking_role_permissions {
  id                        String   @id @db.Uuid
  hrm_time_tracking_role_id String   @db.Uuid
  permission_id             String   @db.Uuid
  created_at                DateTime @db.Timestamptz
  updated_at                DateTime @db.Timestamptz
  deleted_at                DateTime? @db.Timestamptz

  role       hrm_time_tracking_roles              @relation(...)
  permission hrm_time_tracking_role_permissions    @relation("recursive", ...)
  // 주의: permission은 자기 자신을 참조하는 재귀 관계. 별도의 permissions 테이블이 없음!
}
```

#### API 응답 DTO 스펙

```typescript
// IHrmTimeTrackingTimelogReport.ts
export type IHrmTimeTrackingTimelogReport = {
  groupBy: "employee" | "project" | "task";
  dateFrom: boolean;        // <-- 잘못된 타입! string & tags.Format<"date">여야 함
  dateTo: boolean;          // <-- 잘못된 타입!
  employeeId?: boolean;     // <-- 잘못된 타입! (string & tags.Format<"uuid">) | undefined여야 함
  projectId?: boolean;      // <-- 잘못된 타입!
  taskId?: boolean;         // <-- 잘못된 타입!
  billable?: boolean;
  groupedRows: boolean;     // <-- 잘못된 타입! 배열이어야 함
  totalHours: boolean;      // <-- 잘못된 타입! number여야 함
  totalCount: boolean;      // <-- 잘못된 타입! number여야 함
  page?: boolean;           // <-- 잘못된 타입! number여야 함
  limit?: boolean;          // <-- 잘못된 타입! number여야 함
};
```

#### 문제의 코드

```typescript
// 32-48행: permission where 절
const permission =
  await MyGlobal.prisma.hrm_time_tracking_role_permissions.findFirst({
    where: {
      role: {
        employees: {
          some: {
            id: props.member.id,
          },
        },
      },
      permission: {
        key: "report_view",  // 에러: 'key'는 hrm_time_tracking_role_permissions에 없는 속성
      },
    },
  });

// 145-161행: 타입 캐스팅 실패
data: pageRows.map(
  (row) =>
    ({
      groupBy: props.body.groupBy,
      dateFrom: props.body.dateFrom,    // string & Format<"date"> -> boolean 불일치
      dateTo: props.body.dateTo,        // 동일
      // ...
      totalHours,                        // number -> boolean 불일치
      totalCount,                        // number -> boolean 불일치
    }) as IHrmTimeTrackingTimelogReport,  // 캐스팅 실패
),
```

#### 오류 원인 분석

- **무엇이**: 두 가지 독립적인 에러
  1. `hrm_time_tracking_role_permissions.permission`은 재귀 자기참조 관계인데, LLM이 별도의 `permissions` 테이블이 있고 거기에 `key` 컬럼이 있다고 가정
  2. `IHrmTimeTrackingTimelogReport` DTO의 거의 모든 필드가 `boolean` 타입으로 잘못 정의됨
- **왜**:
  1. 스키마에 `permission` 관계가 `@relation("recursive")`로 자기참조하는 구조인데, LLM이 "permission"이라는 이름을 보고 일반적인 권한 테이블(`permissions`)로 오해하고 `key` 속성을 사용
  2. DTO가 interface 단계에서 잘못 생성됨 (shopping의 에러 1-3과 동일 패턴)
- **LLM이 왜**: 권한 확인 로직은 RBAC에서 일반적인 패턴이나, 스키마 구조가 비정상적 (role_permissions가 자기 자신을 재귀 참조). LLM이 일반적인 RBAC 패턴의 코드를 생성했으나 실제 스키마와 불일치. DTO의 `boolean` 문제는 interface 단계의 반복적 오류

#### 올바른 코드

```typescript
// 1. permission 확인은 스키마 구조에 맞게 수정 필요
// 현재 스키마에 별도 permissions 테이블이 없으므로 권한 확인 로직 재설계 필요

// 2. DTO 수정 (interface 단계)
export type IHrmTimeTrackingTimelogReport = {
  groupBy: "employee" | "project" | "task";
  dateFrom: string & tags.Format<"date">;
  dateTo: string & tags.Format<"date">;
  employeeId?: (string & tags.Format<"uuid">) | undefined;
  projectId?: (string & tags.Format<"uuid">) | undefined;
  taskId?: (string & tags.Format<"uuid">) | undefined;
  billable?: boolean | undefined;
  groupedRows: Array<{/* ... */}>;
  totalHours: number;
  totalCount: number;
  page?: number | undefined;
  limit?: number | undefined;
};
```

#### 권고 조치사항

- 재귀 자기참조 관계를 LLM이 올바르게 해석할 수 있도록 스키마 설명 강화
- DTO boolean 오류는 interface 단계 개선 필요

---

### 에러 2-3: `src/providers/patchHrmTimeTrackingMemberReportsWeeklySummary.ts`

#### 컴파일 에러 메시지

```
Conversion of type '{ weekStart: string; weekEnd: string; totalHours: number;
  timelogCount: number; employeeCount: number; }[]' to type
  'IHrmTimeTrackingWeeklySummaryReport[]' may be a mistake because neither type
  sufficiently overlaps with the other.
  Types of property 'weekStart' are incompatible.
    Type 'string' is not comparable to type 'boolean'.
```

#### API 응답 DTO 스펙

```typescript
// IHrmTimeTrackingWeeklySummaryReport.ts
export type IHrmTimeTrackingWeeklySummaryReport = {
  weekStart: boolean;       // <-- 잘못된 타입! string & tags.Format<"date-time">여야 함
  weekEnd: boolean;         // <-- 잘못된 타입!
  totalHours: boolean;      // <-- 잘못된 타입! number여야 함
  timelogCount: boolean;    // <-- 잘못된 타입! number여야 함
  employeeCount: boolean;   // <-- 잘못된 타입! number여야 함
};
```

#### 문제의 코드

```typescript
// 105-111행
data: sliced.map((bucket) => ({
  weekStart: bucket.weekStart.toISOString(),    // string -> boolean 불일치
  weekEnd: bucket.weekEnd.toISOString(),        // string -> boolean 불일치
  totalHours: bucket.totalMinutes / 60,          // number -> boolean 불일치
  timelogCount: bucket.timelogCount,             // number -> boolean 불일치
  employeeCount: bucket.employeeIds.size,        // number -> boolean 불일치
})) as IPageIHrmTimeTrackingWeeklySummaryReport["data"],
```

#### 오류 원인 분석

- **무엇이**: `IHrmTimeTrackingWeeklySummaryReport` DTO의 모든 필드가 `boolean`으로 정의됨
- **왜**: interface 단계에서 DTO가 잘못 생성됨. Provider 코드의 비즈니스 로직(주간 집계, 버킷 분류 등)은 정상
- **LLM이 왜**: shopping의 에러 1-3, erp의 에러 2-2와 동일한 패턴. `gpt-5.4-mini`가 interface 단계에서 "computed/derived" 필드를 `boolean`으로 기본 생성하는 체계적 결함. `@x-autobe-specification`에 "Calculated by summing..."처럼 설명이 있음에도 타입을 `boolean`으로 생성

#### 올바른 코드 (DTO 수정 필요)

```typescript
export type IHrmTimeTrackingWeeklySummaryReport = {
  weekStart: string & tags.Format<"date-time">;
  weekEnd: string & tags.Format<"date-time">;
  totalHours: number;
  timelogCount: number & tags.Type<"int32">;
  employeeCount: number & tags.Type<"int32">;
};
```

#### 권고 조치사항

- `gpt-5.4-mini`의 interface 단계에서 computed/aggregated 필드 타입 결정 로직 개선 필요

---

### 에러 2-4: `src/providers/patchHrmTimeTrackingMemberTimelogsOrganizationView.ts`

#### 컴파일 에러 메시지 (대표)

```
- Type 'null' is not assignable to type 'boolean | hrm_time_tracking_tasks$assigneeArgs<DefaultArgs> | undefined'.
- Type 'null' is not assignable to type 'boolean | hrm_time_tracking_tasks$parentArgs<DefaultArgs> | undefined'.
- Property 'employee' does not exist on type '{...}'. (다수)
```

#### 문제의 코드

```typescript
// 315-316행: parent의 task select에서 null 할당
parent: {
  select: {
    // ...
    assignee: null,  // 에러: Prisma select에서 null 불가
    parent: null,    // 에러: 동일
    // ...
  },
},
```

그리고 이 `null` 할당이 **에러 2-1과 동일한 메커니즘**으로 전체 `select` 타입 추론을 파괴하여, `record.employee`, `record.project`, `record.task` 등 모든 관계 접근이 실패.

#### 오류 원인 분석

- **무엇이**: 에러 2-1과 정확히 동일한 패턴. task의 중첩 parent select에서 `assignee: null`, `parent: null`을 사용
- **왜**: Prisma select 객체에서 관계 필드에 `null` 할당 불가
- **LLM이 왜**: 재귀 관계(task -> parent -> parent...)의 무한 중첩을 방지하려는 의도로 `null`을 사용. 올바른 방법은 해당 키를 생략하는 것

#### 올바른 코드

```typescript
parent: {
  select: {
    id: true,
    project: { select: { /* ... */ } },
    // assignee와 parent는 생략 (키 자체를 없앰)
    title: true,
    description: true,
    status: true,
    priority: true,
    estimated_hours: true,
    due_date: true,
    created_at: true,
    updated_at: true,
    deleted_at: true,
  },
},
```

#### 권고 조치사항

- 에러 2-1의 권고사항과 동일

---

### 에러 2-5: `src/transformers/HrmTimeTrackingDashboardRecentTimelogTransformer.ts`

#### 컴파일 에러 메시지

이 파일 자체에는 직접적인 컴파일 에러가 없지만, **의존하는 `HrmTimeTrackingTaskAtSummaryTransformer`의 타입 추론 문제**로 인해 연쇄 에러가 발생.

#### 문제의 코드

```typescript
// HrmTimeTrackingDashboardRecentTimelogTransformer.ts 23-35행
export function select() {
  return {
    select: {
      id: true,
      work_date: true,
      duration_minutes: true,
      description: true,
      billable: true,
      employee: HrmTimeTrackingEmployeeAtSummaryTransformer.select(),
      project: HrmTimeTrackingProjectAtSummaryTransformer.select(),
      task: HrmTimeTrackingTaskAtSummaryTransformer.select(),
      // task의 select()가 FindManyArgs를 반환하므로 중첩 select 타입이 깨짐
    },
  } satisfies Prisma.hrm_time_tracking_timelogsFindManyArgs;
}
```

#### 오류 원인 분석

- **무엇이**: `HrmTimeTrackingTaskAtSummaryTransformer.select()`가 `Prisma.hrm_time_tracking_tasksFindManyArgs` 타입을 반환하는데, 이것을 timelog의 nested select에 직접 할당하면 Prisma 타입 시스템이 올바른 payload 타입을 추론하지 못함
- **왜**: Prisma의 nested relation select는 `{ select: {...} }` 형태를 기대하는데, `FindManyArgs`는 `{ where?: ..., select?: ..., orderBy?: ..., ... }` 형태이므로 타입이 호환되지 않음
- **LLM이 왜**: Transformer 패턴을 재사용하는 과정에서, 각 Transformer의 `select()`가 반환하는 타입이 중첩 select에 바로 사용 가능하다고 가정. 이는 Prisma 타입 시스템의 세밀한 차이를 이해하지 못한 것

#### 올바른 코드

```typescript
export function select() {
  return {
    select: {
      id: true,
      work_date: true,
      duration_minutes: true,
      description: true,
      billable: true,
      employee: { select: { /* employee 필드들 직접 나열 */ } },
      project: { select: { /* project 필드들 직접 나열 */ } },
      task: { select: { /* task 필드들 직접 나열 */ } },
    },
  } satisfies Prisma.hrm_time_tracking_timelogsFindManyArgs;
}
```

#### 권고 조치사항

- Transformer의 `select()` 반환값을 중첩 select에 사용할 때의 타입 호환성 규칙을 프롬프트에 명시
- `FindManyArgs` vs nested relation select args의 차이를 LLM이 인식하도록 교육

---

### 에러 2-6: `src/transformers/HrmTimeTrackingTaskTransformer.ts`

#### 컴파일 에러 메시지

에러 2-5와 동일한 패턴. `HrmTimeTrackingTaskAtSummaryTransformer.select()`를 중첩 select로 사용하여 Prisma 타입 추론 실패.

#### 문제의 코드

```typescript
// HrmTimeTrackingTaskTransformer.ts 22-39행
export function select() {
  return {
    select: {
      id: true,
      title: true,
      description: true,
      status: true,
      priority: true,
      estimated_hours: true,
      due_date: true,
      created_at: true,
      updated_at: true,
      deleted_at: true,
      project: HrmTimeTrackingProjectAtSummaryTransformer.select(),
      assignee: HrmTimeTrackingEmployeeAtSummaryTransformer.select(),
      parent: HrmTimeTrackingTaskAtSummaryTransformer.select(),
      // 모든 관계가 FindManyArgs를 중첩 select로 사용
    },
  } satisfies Prisma.hrm_time_tracking_tasksFindManyArgs;
}
```

#### 오류 원인 분석

- 에러 2-5와 동일한 근본 원인
- `HrmTimeTrackingTaskAtSummaryTransformer.select()`는 `FindManyArgs`를 반환하므로, `parent` 관계의 nested select로 사용 시 타입 불일치

#### 권고 조치사항

- 에러 2-5의 권고사항과 동일

---

## 종합 권고사항

### 1. DTO `boolean` 오류 (interface 단계 결함) -- 가장 심각

**영향**: 에러 1-3, 2-2, 2-3 (3개 파일, 총 에러의 30%)

`gpt-5.4-mini`는 interface 단계에서 **non-DB 매핑 필드**(computed, aggregated, ID, timestamp 등)의 타입을 체계적으로 `boolean`으로 생성하는 결함이 있다. 이는 realize 단계에서 아무리 올바른 코드를 생성해도 수정 불가능한 선행 단계 오류이다.

**권고**:
- interface 단계에서 DTO 필드 타입 생성 시, `@x-autobe-specification` 어노테이션의 의미("Direct mapping from ...", "Calculated by ...")를 기반으로 올바른 타입을 추론하도록 프롬프트 강화
- DTO 생성 후 Prisma 스키마와의 타입 매핑 검증 컴파일러 단계 추가
- `boolean` 타입이 UUID, timestamp, number 컬럼에 매핑될 수 없다는 규칙을 명시

### 2. Prisma select에서 `null` 할당 (realize 단계 반복 결함) -- 높은 심각도

**영향**: 에러 2-1, 2-4 (2개 파일이지만 100+ 에러 행을 연쇄 유발)

`gpt-5.4-mini`는 재귀 관계(task -> parent, task -> assignee)를 Prisma select에서 제외할 때 `null`을 사용하는 패턴을 반복한다. 이 단일 실수가 전체 select 타입 추론을 파괴하여 수십 개의 "Property does not exist" 에러를 연쇄적으로 유발한다.

**권고**:
- 시스템 프롬프트에 **"Prisma select 객체에서 관계 필드 제외 시 해당 키를 생략하거나 `false`를 사용. `null`은 절대 사용하지 않는다"** 규칙을 명시
- 재귀 관계 처리 예시 코드를 프롬프트에 포함

### 3. Transformer `select()` 중첩 사용 타입 불일치 (realize 단계)

**영향**: 에러 1-4, 2-5, 2-6 (3개 파일)

다른 Transformer의 `select()`가 반환하는 `FindManyArgs` 타입을 중첩 관계 select에 직접 할당하면, Prisma의 `GetPayload` 제네릭이 올바른 타입을 추론하지 못한다.

**권고**:
- Transformer 간 select 재사용 패턴을 표준화: 중첩 select에는 인라인 `{ select: {...} }` 사용
- 또는 각 Transformer에 `selectNested()` 메서드를 추가하여 `{ select: {...} }` 서브셋만 반환

### 4. Prisma where 절에서 FK 컬럼명과 관계명 혼동

**영향**: 에러 2-1 (1개 파일)

`project_id`를 where 절에서 직접 사용하는 것은 Prisma의 스칼라 where 필드이므로 사용 가능하지만, `hrm_time_tracking_tasksWhereInput`에서는 `project_id`가 아닌 `hrm_time_tracking_project_id`가 실제 컬럼명이다. LLM이 timelog 테이블의 `project_id`와 task 테이블의 `hrm_time_tracking_project_id`를 혼동했다.

**권고**:
- where 절 생성 시 대상 모델의 실제 컬럼명을 확인하도록 프롬프트 강화

### 5. 순환 참조 DTO 처리 미숙

**영향**: 에러 1-2 (1개 파일)

`ISeller.ISummary` -> `ISellerProfile.ISummary` -> `ISeller.ISummary` 순환에서 LLM이 필수 필드를 누락하거나 nullable 처리를 잘못 적용한다.

**권고**:
- 순환 참조 DTO 변환 시 `as never` 패턴을 표준 해법으로 프롬프트에 제시
- DTO nullable/non-nullable 일관성 검증 추가

### 에러 분류 요약

| 카테고리 | 발생 단계 | 파일 수 | 근본 원인 |
|----------|----------|---------|----------|
| DTO `boolean` 타입 오류 | interface | 3 | LLM이 필드 타입을 boolean으로 hallucinate |
| Prisma select `null` 할당 | realize | 2 | LLM이 관계 제외를 null로 표현 |
| Transformer select 중첩 타입 | realize | 3 | FindManyArgs vs nested select 타입 혼동 |
| 타입명 오타 | realize | 1 | 토큰 생성 시 camelCase 경계 오류 |
| 순환 참조 DTO 처리 | realize | 1 | 필수 필드 누락 + nullable 불일치 |
| where FK/관계명 혼동 | realize | 1 | 서로 다른 모델의 컬럼명 혼동 |
| 스키마 구조 오해 | realize | 1 | 재귀 자기참조를 별도 테이블로 오해 |
