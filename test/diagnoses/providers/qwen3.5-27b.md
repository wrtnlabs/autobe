# qwen/qwen3.5-27b 모델 Realize 단계 컴파일 오류 진단서

## 개요

| 항목 | 내용 |
|------|------|
| 모델 | `qwen/qwen3.5-27b` (provider: qwen) |
| 테스트 시나리오 | `shopping`, `erp` |
| 총 오류 파일 수 | 2개 (시나리오별 각 1개) |
| 총 컴파일 에러 메시지 수 | 12개 (shopping 2개 + erp 10개) |
| 공통 오류 패턴 | Prisma `select` 절에서 관계(relation) 필드 접근 시 `FindManyArgs` 반환 타입으로 인한 타입 소실 |

두 시나리오 모두 **동일한 근본 원인**을 공유한다: Transformer의 `select()` 함수가 `Prisma.xxxFindManyArgs`를 명시적 반환 타입으로 선언하면, TypeScript가 반환 객체를 해당 타입으로 확장(widen)하여 `GetPayload`가 리터럴 타입을 추론하지 못하게 된다. 그 결과 `Payload` 타입에서 관계(relation) 필드가 완전히 제거되어, `transform()` 함수에서 `input.parent`나 `input.organization` 등에 접근할 때 `Property 'xxx' does not exist on type` 오류가 발생한다.

---

## 에러 케이스 1: Shopping - `ShoppingMallCategoryAtSummaryTransformer.ts`

### 기본 정보

| 항목 | 내용 |
|------|------|
| 시나리오 | `shopping` |
| 오류 파일 | `src/transformers/ShoppingMallCategoryAtSummaryTransformer.ts` |
| 프로젝트 경로 | `test/results/qwen/qwen3.5-27b/shopping/realize` |
| 컴파일 에러 수 | 2개 (동일 에러, 2개 지점에서 발생) |

### 컴파일 에러 메시지

```
Property 'parent' does not exist on type '{ created_at: Date; updated_at: Date; id: string; deleted_at: Date | null; name: string; parent_id: string | null; description: string | null; }'.
```

```
Property 'parent' does not exist on type '{ created_at: Date; updated_at: Date; id: string; deleted_at: Date | null; name: string; parent_id: string | null; description: string | null; }'.
```

에러 메시지의 타입을 보면, `Payload` 타입이 스칼라 컬럼만(`created_at`, `updated_at`, `id`, `deleted_at`, `name`, `parent_id`, `description`) 포함하고 있으며 관계 필드인 `parent`가 완전히 빠져 있음을 확인할 수 있다. 이는 `select()` 함수의 `FindManyArgs` 반환 타입 선언으로 인해 Prisma의 `GetPayload` 유틸리티 타입이 리터럴 추론에 실패했기 때문이다.

### DB 스키마 (Prisma)

```prisma
/// Hierarchical category structure for product organization with one level
/// of nesting.
///
/// Categories enable product taxonomy and support hierarchical navigation
/// for product discovery and filtering. Administrators manage the category
/// structure to organize products logically.
///
/// **Key Relationships**:
/// - Self-referencing hierarchy: Parent categories can have multiple
/// subcategories (one level of nesting only)
/// - Products: Each product belongs to exactly one category via {@link
/// shopping_mall_products.category_id}
///
/// **Business Rules**:
/// - Top-level categories have null parent_id
/// - Subcategories reference a parent category via parent_id
/// - Only one level of nesting is supported (no grandchild categories)
/// - Categories are managed exclusively by administrators
///
/// @namespace Categories
/// @author AutoBE - https://github.com/wrtnlabs/autobe
model shopping_mall_categories {
  //----
  // COLUMNS
  //----
  /// Primary Key.
  id String @id @db.Uuid

  /// Parent category's {@link shopping_mall_categories.id}. Null for top-level
  /// categories. References this same table to create hierarchical structure
  /// with one level of nesting.
  parent_id String? @db.Uuid

  /// Category name displayed to users for browsing and filtering products.
  name String

  /// Optional description providing additional context about the category and
  /// its purpose.
  description String?

  /// Timestamp when the category was created.
  created_at DateTime @db.Timestamptz

  /// Timestamp when the category was last modified.
  updated_at DateTime @db.Timestamptz

  /// Timestamp when the category was soft deleted. Null indicates the category
  /// is active.
  deleted_at DateTime? @db.Timestamptz

  //----
  // BELONGED RELATIONS,
  //   - format: (propertyKey targetModel constraint)
  //----
  parent shopping_mall_categories? @relation("recursive", fields: [parent_id], references: [id], onDelete: Cascade)

  //----
  // HAS RELATIONS
  //   - format: (propertyKey targetModel)
  //----
  subcategories shopping_mall_categories[] @relation("recursive")

  //----
  // INDEXES
  //----
  @@unique([parent_id, name])
  @@index([parent_id])
  @@index([name(ops: raw("gin_trgm_ops"))], type: Gin)
}
```

핵심 포인트: `parent`는 **자기 자신을 참조하는 재귀적 관계(self-referencing relation)** 필드이다. `parent_id` FK를 통해 `shopping_mall_categories` 테이블 자신을 참조하며, Prisma 스키마에서 `@relation("recursive")`로 명명되어 있다. 이 관계를 Prisma 쿼리에서 가져오려면 `include` 또는 `select` 내 중첩 객체 구문을 사용해야 한다.

### API 응답 DTO 스펙

```typescript
// IShoppingMallCategory.ISummary - 경량 카테고리 요약 타입
export type ISummary = {
  /**
   * Unique category identifier in UUID format.
   * @x-autobe-database-schema-property id
   */
  id: string & tags.Format<"uuid">;

  /**
   * Category name displayed to users for browsing and filtering products.
   * @x-autobe-database-schema-property name
   */
  name: string;

  /**
   * Optional description providing additional context about the category
   * and its purpose.
   * @x-autobe-database-schema-property description
   */
  description: string | null;

  /**
   * Parent category if this is a subcategory, or null if this is a
   * top-level category. Supports one level of nesting.
   * @x-autobe-database-schema-property parent
   */
  parent: IShoppingMallCategory.ISummary | null;

  /**
   * Timestamp when the category was created.
   * @x-autobe-database-schema-property created_at
   */
  created_at: string & tags.Format<"date-time">;
};
```

DTO 스펙에서 `parent` 필드는 `IShoppingMallCategory.ISummary | null` 타입으로, 재귀적 구조를 갖는다. 이 DTO를 올바르게 매핑하려면 Prisma에서 `parent` 관계를 포함하여 조회해야 한다.

### 문제의 코드

```typescript
// 파일: src/transformers/ShoppingMallCategoryAtSummaryTransformer.ts
// 라인 1-35

import { IEntity } from "@ORGANIZATION/PROJECT-api/lib/structures/IEntity";
import { IShoppingMallCategory } from "@ORGANIZATION/PROJECT-api/lib/structures/IShoppingMallCategory";
import { ArrayUtil } from "@nestia/e2e";
import { Prisma } from "@prisma/sdk";
import typia, { tags } from "typia";

import { toISOStringSafe } from "../utils/toISOStringSafe";

export namespace ShoppingMallCategoryAtSummaryTransformer {
  export type Payload = Prisma.shopping_mall_categoriesGetPayload<
    ReturnType<typeof select>                          // (A) GetPayload로 Payload 타입 추론
  >;
  export function select(): Prisma.shopping_mall_categoriesFindManyArgs {  // (B) 문제: FindManyArgs 반환 타입 명시
    return {
      select: {
        id: true,
        name: true,
        description: true,
        created_at: true,
        parent: ShoppingMallCategoryAtSummaryTransformer.select(),  // (C) 문제: 재귀 호출 + 관계 필드
      },
    } satisfies Prisma.shopping_mall_categoriesFindManyArgs;
  }
  export async function transform(
    input: Payload,
  ): Promise<IShoppingMallCategory.ISummary> {
    return {
      id: input.id,
      name: input.name,
      description: input.description,
      parent: input.parent ? await transform(input.parent) : null,  // (D) 오류 발생: input.parent 없음
      created_at: toISOStringSafe(input.created_at),
    };
  }
}
```

### 오류 원인 분석

**무엇이 문제인가:**

`select()` 함수(라인 13)가 반환 타입을 `Prisma.shopping_mall_categoriesFindManyArgs`로 명시적으로 선언하고 있다. 이로 인해 TypeScript는 반환 객체의 리터럴 타입 정보를 `FindManyArgs`라는 넓은(wide) 타입으로 확장한다. `Prisma.shopping_mall_categoriesGetPayload<FindManyArgs>`는 관계 필드를 포함하지 않는 기본 스칼라 컬럼만의 타입을 생성하므로, `Payload` 타입에서 `parent`가 빠진다.

**왜 이 오류가 발생하는가:**

Prisma의 `GetPayload` 유틸리티 타입은 제네릭 인자의 **리터럴 타입 정보**에 의존하여 반환 타입을 추론한다. 예를 들어:

- `GetPayload<{ select: { id: true, name: true } }>` → `{ id: string; name: string }` (리터럴 추론 성공)
- `GetPayload<FindManyArgs>` → 모든 스칼라 컬럼을 포함하는 기본 타입 (리터럴 정보 소실, 관계 필드 제외)

`select()` 함수가 `FindManyArgs`를 반환 타입으로 명시하면, `ReturnType<typeof select>`가 `FindManyArgs`가 되어 리터럴 정보가 사라진다.

**LLM이 왜 이런 코드를 생성했는가:**

1. LLM은 "Prisma select 절에 관계 필드를 넣으면 JOIN이 된다"는 올바른 직관을 가지고 있었다.
2. 그러나 `FindManyArgs`의 `select` 타입 정의에서 관계 필드가 어떻게 취급되는지(중첩 객체 구문 필요), 그리고 명시적 반환 타입이 `GetPayload` 추론에 미치는 영향을 이해하지 못했다.
3. 추가로, 자기 참조 관계에서 `select()` 함수를 재귀적으로 호출하는 패턴(라인 20)은 **무한 재귀**를 발생시킬 수 있다. 런타임에서는 실제로 Prisma가 이를 처리할 수 있지만, 타입 레벨에서는 `FindManyArgs`로 넓혀지므로 의미가 없다.

### 올바른 코드 (수정 예시)

```typescript
export namespace ShoppingMallCategoryAtSummaryTransformer {
  export type Payload = Prisma.shopping_mall_categoriesGetPayload<
    ReturnType<typeof select>
  >;
  // 수정 1: 반환 타입을 제거하여 TypeScript가 리터럴 타입을 추론하도록 함
  // 수정 2: satisfies 대상을 DefaultArgs로 변경
  export function select() {
    return {
      select: {
        id: true,
        name: true,
        description: true,
        created_at: true,
        // 수정 3: 관계 필드를 { select: { ... } } 형태로 중첩
        // 수정 4: 재귀 호출 대신 한 단계만 명시적으로 펼침
        parent: {
          select: {
            id: true,
            name: true,
            description: true,
            created_at: true,
          },
        },
      },
    } satisfies Prisma.shopping_mall_categoriesDefaultArgs;
  }
  export async function transform(
    input: Payload,
  ): Promise<IShoppingMallCategory.ISummary> {
    return {
      id: input.id,
      name: input.name,
      description: input.description,
      // 수정 5: 재귀 transform 호출 대신 한 단계만 수동 매핑
      parent: input.parent
        ? {
            id: input.parent.id,
            name: input.parent.name,
            description: input.parent.description,
            parent: null, // 한 단계만 펼침 (무한 재귀 방지)
            created_at: toISOStringSafe(input.parent.created_at),
          }
        : null,
      created_at: toISOStringSafe(input.created_at),
    };
  }
}
```

### 권고 조치사항

**프롬프트 수준:**

1. Transformer `select()` 함수 작성 시 `FindManyArgs` 반환 타입을 절대 명시하지 말라는 규칙을 추가해야 한다.
2. 자기 참조(재귀) 관계에서 `select()` 재귀 호출을 금지하고, 한 단계만 명시적으로 펼치는 예시를 제공해야 한다.

**교정 루프 수준:**

1. `Property 'xxx' does not exist on type` 에러에서 타입이 Prisma `GetPayload` 결과이고, 누락된 속성이 관계 필드인 경우를 패턴 매칭하여 "반환 타입 제거 + 관계 필드 중첩 select" 수정을 안내해야 한다.
2. `select()` 함수에 `FindManyArgs` 반환 타입이 있는지 정적 분석하여 사전 경고할 수 있다.

---

## 에러 케이스 2: ERP - `HrmPlatformDepartmentAtSummaryTransformer.ts`

### 기본 정보

| 항목 | 내용 |
|------|------|
| 시나리오 | `erp` |
| 오류 파일 | `src/transformers/HrmPlatformDepartmentAtSummaryTransformer.ts` |
| 프로젝트 경로 | `test/results/qwen/qwen3.5-27b/erp/realize` |
| 컴파일 에러 수 | 10개 (`parent` 관련 9개 + `organization` 관련 1개) |

### 컴파일 에러 메시지

`parent` 관련 (9회 반복):
```
Property 'parent' does not exist on type '{ created_at: Date; updated_at: Date; name: string; id: string; deleted_at: Date | null; description: string | null; hrm_platform_organization_id: string; parent_id: string | null; }'.
```

`organization` 관련 (1회):
```
Property 'organization' does not exist on type '{ created_at: Date; updated_at: Date; name: string; id: string; deleted_at: Date | null; description: string | null; hrm_platform_organization_id: string; parent_id: string | null; }'.
```

에러 메시지의 타입을 보면, `Payload` 타입이 스칼라 컬럼만(`created_at`, `updated_at`, `name`, `id`, `deleted_at`, `description`, `hrm_platform_organization_id`, `parent_id`) 포함하고 있다. FK 컬럼(`hrm_platform_organization_id`, `parent_id`)은 존재하지만, 이에 대응하는 **관계 객체** 필드(`organization`, `parent`)는 완전히 누락되어 있다.

`parent` 에러가 9회 반복되는 이유는 `transform()` 함수 내에서 `input.parent`에 접근하는 지점이 9곳이기 때문이다:
- `input.parent` (조건 검사, 라인 49)
- `input.parent.id` (라인 51)
- `input.parent.name` (라인 52)
- `input.parent.description` (라인 53)
- `input.parent.organization` (라인 57)
- `input.parent.created_at` (라인 59)
- `input.parent.updated_at` (라인 60)
- `input.parent.deleted_at` (라인 61, 조건 검사)
- `input.parent.deleted_at` (라인 62, 값 접근)

### DB 스키마 (Prisma)

```prisma
/// Departmental organizational units within organizations that provide
/// structural grouping for employees. Departments support a one-level
/// hierarchical structure where a department can have one parent department,
/// enabling subdepartment organization. Each department belongs to exactly
/// one organization and must have a unique name within that organization.
/// Departments facilitate employee assignment and organizational reporting
/// structures.
///
/// @namespace Employee
/// @author AutoBE - https://github.com/wrtnlabs/autobe
model hrm_platform_departments {
  //----
  // COLUMNS
  //----
  /// Primary Key.
  id String @id @db.Uuid

  /// The organization that owns this department. {@link
  /// hrm_platform_organizations.id}
  hrm_platform_organization_id String @db.Uuid

  /// Optional parent department for one-level hierarchy. Only one level of
  /// nesting is supported.
  parent_id String? @db.Uuid

  /// Unique name identifying the department within its organization.
  name String

  /// Optional description clarifying the department's business purpose and
  /// responsibilities.
  description String?

  /// Timestamp when the department was created.
  created_at DateTime @db.Timestamptz

  /// Timestamp when the department was last updated.
  updated_at DateTime @db.Timestamptz

  /// Soft delete timestamp for department deactivation.
  deleted_at DateTime? @db.Timestamptz

  //----
  // BELONGED RELATIONS,
  //   - format: (propertyKey targetModel constraint)
  //----
  organization hrm_platform_organizations @relation(fields: [hrm_platform_organization_id], references: [id], onDelete: Cascade)
  parent hrm_platform_departments? @relation("recursive", fields: [parent_id], references: [id], onDelete: Cascade)

  //----
  // HAS RELATIONS
  //   - format: (propertyKey targetModel)
  //----
  employees hrm_platform_employees[]
  childDepartments hrm_platform_departments[] @relation("recursive")
  employeeSnapshots hrm_platform_employee_snapshots[]

  //----
  // INDEXES
  //----
  @@index([parent_id])
  @@unique([hrm_platform_organization_id, name])
  @@index([name(ops: raw("gin_trgm_ops"))], type: Gin)
}
```

핵심 포인트: `hrm_platform_departments` 모델에는 **두 개의 관계(relation) 필드**가 있다:
- `organization`: `hrm_platform_organizations`에 대한 외부 참조 (`hrm_platform_organization_id` FK)
- `parent`: 자기 자신에 대한 재귀적 참조 (`parent_id` FK, `@relation("recursive")`)

두 관계 모두 Transformer에서 조회하여 DTO에 매핑해야 한다.

### API 응답 DTO 스펙

```typescript
// IHrmPlatformDepartment.ISummary - 경량 부서 요약 타입
export type ISummary = {
  /**
   * Unique identifier for the department.
   * @x-autobe-database-schema-property id
   */
  id: string & tags.Format<"uuid">;

  /**
   * Department name, unique within the organization.
   * @x-autobe-database-schema-property name
   */
  name: string;

  /**
   * Optional description clarifying the department's business purpose
   * and responsibilities.
   * @x-autobe-database-schema-property description
   */
  description: string | null;

  /**
   * Optional parent department for hierarchical organization. Null for
   * top-level departments.
   * @x-autobe-database-schema-property parent
   */
  parent: IHrmPlatformDepartment.ISummary | null;

  /**
   * The organization that owns this department.
   * @x-autobe-database-schema-property organization
   */
  organization: IHrmPlatformOrganization.ISummary;

  /**
   * Timestamp when the department was created.
   * @x-autobe-database-schema-property created_at
   */
  created_at: string & tags.Format<"date-time">;

  /**
   * Timestamp when the department was last updated.
   * @x-autobe-database-schema-property updated_at
   */
  updated_at: string & tags.Format<"date-time">;

  /**
   * Soft delete timestamp. Null if department is active.
   * @x-autobe-database-schema-property deleted_at
   */
  deleted_at: (string & tags.Format<"date-time">) | null;
};
```

DTO 스펙에서 `ISummary`는 `parent`(자기 참조, nullable)와 `organization`(필수) 두 개의 관계 필드를 요구한다. Shopping 케이스보다 복잡한 이유는 관계 필드가 2개이고, `parent` 내부에서도 `organization`을 중첩 참조하기 때문이다.

### 문제의 코드

```typescript
// 파일: src/transformers/HrmPlatformDepartmentAtSummaryTransformer.ts
// 라인 1-74

import { IEntity } from "@ORGANIZATION/PROJECT-api/lib/structures/IEntity";
import { IHrmPlatformDepartment } from "@ORGANIZATION/PROJECT-api/lib/structures/IHrmPlatformDepartment";
import { IHrmPlatformMember } from "@ORGANIZATION/PROJECT-api/lib/structures/IHrmPlatformMember";
import { IHrmPlatformOrganization } from "@ORGANIZATION/PROJECT-api/lib/structures/IHrmPlatformOrganization";
import { IHrmPlatformOrganizationLogo } from "@ORGANIZATION/PROJECT-api/lib/structures/IHrmPlatformOrganizationLogo";
import { IHrmPlatformOrganizationSetting } from "@ORGANIZATION/PROJECT-api/lib/structures/IHrmPlatformOrganizationSetting";
import { ArrayUtil } from "@nestia/e2e";
import { Prisma } from "@prisma/sdk";
import typia, { tags } from "typia";

import { toISOStringSafe } from "../utils/toISOStringSafe";
import { HrmPlatformOrganizationAtSummaryTransformer } from "./HrmPlatformOrganizationAtSummaryTransformer";

export namespace HrmPlatformDepartmentAtSummaryTransformer {
  export type Payload = Prisma.hrm_platform_departmentsGetPayload<     // (A)
    ReturnType<typeof select>
  >;
  export function select(): Prisma.hrm_platform_departmentsFindManyArgs {  // (B) 문제: FindManyArgs 반환 타입
    return {
      select: {
        id: true,
        name: true,
        description: true,
        created_at: true,
        updated_at: true,
        deleted_at: true,
        organization: HrmPlatformOrganizationAtSummaryTransformer.select(),  // (C) 문제: 관계 필드
        parent: {                                                             // (D) 문제: 관계 필드
          select: {
            id: true,
            name: true,
            description: true,
            created_at: true,
            updated_at: true,
            deleted_at: true,
            organization: HrmPlatformOrganizationAtSummaryTransformer.select(),  // (E) 중첩 관계
          },
        },
      },
    } satisfies Prisma.hrm_platform_departmentsFindManyArgs;                // (F) 문제: FindManyArgs로 satisfies
  }
  export async function transform(
    input: Payload,
  ): Promise<IHrmPlatformDepartment.ISummary> {
    return {
      id: input.id,                                                          // OK (스칼라)
      name: input.name,                                                      // OK (스칼라)
      description: input.description ?? null,                                // OK (스칼라)
      parent: input.parent                                                   // (G) 오류: input.parent 없음
        ? {
            id: input.parent.id,                                             // 오류
            name: input.parent.name,                                         // 오류
            description: input.parent.description ?? null,                   // 오류
            parent: null,
            organization:
              await HrmPlatformOrganizationAtSummaryTransformer.transform(
                input.parent.organization,                                   // 오류
              ),
            created_at: toISOStringSafe(input.parent.created_at),            // 오류
            updated_at: toISOStringSafe(input.parent.updated_at),            // 오류
            deleted_at: input.parent.deleted_at                              // 오류
              ? toISOStringSafe(input.parent.deleted_at)                     // 오류
              : null,
          }
        : null,
      organization: await HrmPlatformOrganizationAtSummaryTransformer.transform(
        input.organization,                                                  // (H) 오류: input.organization 없음
      ),
      created_at: toISOStringSafe(input.created_at),                         // OK (스칼라)
      updated_at: toISOStringSafe(input.updated_at),                         // OK (스칼라)
      deleted_at: input.deleted_at ? toISOStringSafe(input.deleted_at) : null, // OK (스칼라)
    };
  }
}
```

### 오류 원인 분석

**무엇이 문제인가:**

Shopping 케이스와 동일한 근본 원인이지만, **이중 관계 필드**(`parent` + `organization`)로 인해 더 많은 오류가 발생한다.

1. **`FindManyArgs` 반환 타입으로 인한 타입 소실 (라인 18)**: `select()` 함수가 `Prisma.hrm_platform_departmentsFindManyArgs`를 반환 타입으로 선언하여, `ReturnType<typeof select>`가 넓은 타입이 되고, `GetPayload`가 리터럴 추론에 실패한다.

2. **`organization` 관계 필드 (라인 27)**: `HrmPlatformOrganizationAtSummaryTransformer.select()`의 반환값을 `organization` 키에 직접 할당했다. 만약 해당 Transformer의 `select()`도 `FindManyArgs`를 반환한다면, 이 중첩 역시 올바른 타입 정보를 전달하지 못한다.

3. **`parent` 관계 필드 (라인 28-38)**: `parent`를 `{ select: { ... } }` 형태로 올바르게 중첩한 것은 좋은 시도였으나, 상위 `select()` 함수의 반환 타입이 `FindManyArgs`로 고정되어 있으므로 모든 관계 필드 정보가 소실된다.

4. **`parent` 내부의 `organization` 중첩 (라인 36)**: `parent.organization`을 `transform()` 함수에서 접근하려면, `parent` select 안에서도 `organization` 관계를 올바르게 포함해야 한다. 현재 코드의 구조 자체는 올바르지만, 반환 타입 문제로 인해 무의미해진다.

**왜 이 오류가 발생하는가:**

`Prisma.hrm_platform_departmentsFindManyArgs`의 `select` 타입은 대략 다음과 같은 구조를 갖는다:

```typescript
type Select = {
  id?: boolean;
  hrm_platform_organization_id?: boolean;
  parent_id?: boolean;
  name?: boolean;
  description?: boolean;
  created_at?: boolean;
  updated_at?: boolean;
  deleted_at?: boolean;
  // 관계 필드는 별도 타입:
  organization?: boolean | Prisma.hrm_platform_organizationsDefaultArgs;
  parent?: boolean | Prisma.hrm_platform_departmentsDefaultArgs;
  // ...
};
```

관계 필드를 `select` 안에 넣는 것 자체는 가능하나, **반환 타입을 `FindManyArgs`로 명시하면 TypeScript가 리터럴 정보를 잃어버려** `GetPayload`가 관계 필드를 포함한 정확한 타입을 생성하지 못한다. 핵심은 반환 타입 명시 여부에 있다.

**LLM이 왜 이런 코드를 생성했는가:**

1. LLM은 DTO 스펙(`ISummary`)을 정확히 읽고, 필요한 관계 필드(`parent`, `organization`)를 모두 `select`에 포함시키려 했다. 이 의도 자체는 완벽히 올바르다.
2. `parent`를 `{ select: { ... } }` 형태로 중첩하는 것도 올바른 Prisma 문법이다.
3. 그러나 `select()` 함수에 `FindManyArgs` 반환 타입을 명시한 것이 근본적인 실수이다. 이는 AutoBE가 생성하는 Transformer 코드의 보일러플레이트 패턴에서 반환 타입을 항상 명시하도록 학습한 결과로 추정된다.
4. Shopping 케이스와 달리 재귀 호출은 하지 않았으나(한 단계만 수동으로 펼침), 반환 타입 문제로 인해 동일한 오류가 발생했다.

### 올바른 코드 (수정 예시)

```typescript
export namespace HrmPlatformDepartmentAtSummaryTransformer {
  export type Payload = Prisma.hrm_platform_departmentsGetPayload<
    ReturnType<typeof select>
  >;
  // 수정 1: 반환 타입 제거 (TypeScript 리터럴 추론 허용)
  // 수정 2: satisfies 대상을 DefaultArgs로 변경
  export function select() {
    return {
      select: {
        id: true,
        name: true,
        description: true,
        created_at: true,
        updated_at: true,
        deleted_at: true,
        organization: HrmPlatformOrganizationAtSummaryTransformer.select(),
        parent: {
          select: {
            id: true,
            name: true,
            description: true,
            created_at: true,
            updated_at: true,
            deleted_at: true,
            organization: HrmPlatformOrganizationAtSummaryTransformer.select(),
          },
        },
      },
    } satisfies Prisma.hrm_platform_departmentsDefaultArgs;
  }
  // transform 함수는 동일 (Payload 타입이 올바르게 추론되면 모든 오류 해소)
  export async function transform(
    input: Payload,
  ): Promise<IHrmPlatformDepartment.ISummary> {
    return {
      id: input.id,
      name: input.name,
      description: input.description ?? null,
      parent: input.parent
        ? {
            id: input.parent.id,
            name: input.parent.name,
            description: input.parent.description ?? null,
            parent: null,
            organization:
              await HrmPlatformOrganizationAtSummaryTransformer.transform(
                input.parent.organization,
              ),
            created_at: toISOStringSafe(input.parent.created_at),
            updated_at: toISOStringSafe(input.parent.updated_at),
            deleted_at: input.parent.deleted_at
              ? toISOStringSafe(input.parent.deleted_at)
              : null,
          }
        : null,
      organization: await HrmPlatformOrganizationAtSummaryTransformer.transform(
        input.organization,
      ),
      created_at: toISOStringSafe(input.created_at),
      updated_at: toISOStringSafe(input.updated_at),
      deleted_at: input.deleted_at ? toISOStringSafe(input.deleted_at) : null,
    };
  }
}
```

핵심 변경점:
- `select()` 함수의 `: Prisma.hrm_platform_departmentsFindManyArgs` 반환 타입 선언 제거
- `satisfies Prisma.hrm_platform_departmentsFindManyArgs`를 `satisfies Prisma.hrm_platform_departmentsDefaultArgs`로 변경
- `transform()` 함수의 로직 자체는 변경 불필요 (타입이 올바르게 추론되면 모든 10개 오류가 자동 해소)

**주의**: `HrmPlatformOrganizationAtSummaryTransformer.select()` 역시 동일한 패턴(`FindManyArgs` 반환 타입 미명시)을 따라야 한다. 그렇지 않으면 `organization` 관계 필드에서 추가 타입 오류가 발생할 수 있다.

### 권고 조치사항

**프롬프트 수준:**

1. Shopping 케이스와 동일한 `FindManyArgs` 반환 타입 금지 규칙 적용
2. 다른 Transformer의 `select()`를 관계 필드 값으로 전달할 때, 해당 Transformer도 반환 타입을 명시하지 않아야 한다는 규칙 명시
3. 복수 관계 필드를 가진 모델(Department처럼 `parent` + `organization`)의 Transformer 작성 예시를 프롬프트에 포함

**교정 루프 수준:**

1. 한 파일에서 동일한 `Property 'xxx' does not exist` 에러가 다수 발생하면, 개별 속성이 아닌 **반환 타입 선언**을 먼저 점검하도록 교정 에이전트에 안내
2. `select()` 함수의 반환 타입과 `satisfies` 대상 타입을 자동으로 검출하여, `FindManyArgs`인 경우 `DefaultArgs`로 변경을 제안하는 규칙 추가

---

## 종합 권고사항

### 1. 공통 근본 원인 요약

두 시나리오의 12개 컴파일 에러는 모두 **단일 근본 원인**에서 비롯된다:

```
Transformer의 select() 함수에서 FindManyArgs 반환 타입을 명시하면,
Prisma GetPayload가 리터럴 타입 추론에 실패하여 관계 필드가 Payload 타입에서 제외된다.
```

잘못된 패턴:
```typescript
// BAD: 반환 타입 명시 → 타입 확장(widening) → 관계 필드 소실
export function select(): Prisma.xxxFindManyArgs {
  return {
    select: {
      scalar_field: true,
      relation_field: { select: { ... } },  // 관계 필드가 타입에서 사라짐
    },
  } satisfies Prisma.xxxFindManyArgs;
}
```

올바른 패턴:
```typescript
// GOOD: 반환 타입 생략 → 리터럴 추론 → 관계 필드 포함
export function select() {
  return {
    select: {
      scalar_field: true,
      relation_field: { select: { ... } },  // 관계 필드가 타입에 정확히 반영됨
    },
  } satisfies Prisma.xxxDefaultArgs;
}
```

### 2. 프롬프트 개선 권고

Realize 단계 시스템 프롬프트에 다음 가이드를 추가해야 한다:

**규칙 A - `select()` 함수 반환 타입:**

> Transformer의 `select()` 함수에 `FindManyArgs` 같은 명시적 반환 타입을 절대 선언하지 마라. TypeScript가 리터럴 타입을 추론하도록 반환 타입을 생략하라. 이렇게 해야 `GetPayload<ReturnType<typeof select>>`가 관계 필드를 포함한 정확한 타입을 생성한다.

**규칙 B - `satisfies` 키워드 대상:**

> `satisfies` 검증 시 `FindManyArgs` 대신 `DefaultArgs`를 사용하라. `FindManyArgs`는 `where`, `orderBy` 등 쿼리 옵션을 포함하는 광범위한 타입이므로, 순수한 select/include 구조 검증에는 `DefaultArgs`가 적합하다.

**규칙 C - 자기 참조(재귀) 관계:**

> 자기 참조 관계(self-referencing relation)에서는 `select()` 함수를 재귀적으로 호출하지 마라. 무한 재귀가 발생할 수 있다. 대신 한 단계만 명시적으로 펼치고, `transform()` 함수에서도 재귀 호출 대신 한 단계만 수동 매핑하라.

**규칙 D - 크로스 Transformer 호출:**

> 다른 Transformer의 `select()` 반환값을 관계 필드에 전달하는 것은 허용되나, 해당 Transformer도 동일한 규칙(반환 타입 미명시, `DefaultArgs` satisfies)을 따라야 한다.

### 3. 교정 루프 개선 권고

1. **패턴 매칭 규칙 추가**: `Property 'xxx' does not exist on type '{ ... }'` 에러에서, 해당 타입이 Prisma `GetPayload` 결과이고 누락된 속성이 Prisma 스키마의 관계 필드인 경우, `select()` 함수의 반환 타입 선언을 제거하라는 수정 지시를 자동 생성해야 한다.

2. **정적 분석 규칙 추가**: 컴파일 전에 Transformer 파일을 정적 분석하여, `select()` 함수에 `FindManyArgs` 반환 타입이 선언되어 있으면 사전 경고를 생성할 수 있다. 이를 통해 컴파일 에러 발생 전에 문제를 예방할 수 있다.

3. **에러 집계 최적화**: ERP 케이스처럼 한 파일에서 동일 원인의 에러가 10개 발생하는 경우, 교정 에이전트에게 개별 에러를 모두 전달하는 대신 "select() 함수의 반환 타입 문제로 관계 필드 10개가 타입에서 누락됨"으로 요약하여 전달하면, 토큰 사용량을 절감하고 교정 정확도를 높일 수 있다.

### 4. 모델 특성 평가

`qwen3.5-27b` 모델은 다음과 같은 특성을 보인다:

- **강점**: DTO 스펙을 정확히 읽고 필요한 관계 필드를 빠짐없이 식별하며, `parent`의 중첩 select 구조(`{ select: { ... } }`)를 올바르게 작성한다.
- **약점**: Prisma의 TypeScript 타입 추론 메커니즘(`GetPayload`와 리터럴 타입의 관계)을 정확히 이해하지 못하여, 관습적으로 `FindManyArgs` 반환 타입을 명시하는 잘못된 패턴을 생성한다.
- **개선 가능성**: 프롬프트에 명확한 코드 패턴 가이드와 구체적 예시를 추가하면, 이 유형의 오류는 높은 확률로 제거 가능하다. 모델이 관계 구조 자체는 정확히 파악하고 있으므로, 타입 표현 방식만 교정하면 된다.
