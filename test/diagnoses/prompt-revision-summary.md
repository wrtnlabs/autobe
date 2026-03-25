# AutoBE Realize 단계 프롬프트 종합 개선안

> 9개 모델 × 21개 테스트 케이스 분석 기반
> deepseek/deepseek-v3.2 배제 (사유: 프롬프트 개선으로 해결 불가능한 구조적 문제 과다)

---

## 1. 오류 패턴 종합 (개별 보고서 → 통합)

| 패턴 ID | 패턴명 | 발생 모델 수 (/9) | 영향 파일 수 | 근거 보고서 |
|---------|--------|:-----------------:|:-----------:|------------|
| P1 | **릴레이션명 환각/오인** — FK 컬럼명에서 릴레이션명을 추측하거나 스키마에 없는 릴레이션명 사용 | 7/9 | 20+ | kimi-k2.5 Shopping `EcommerceMallShipmentTransformer.ts` (`profile` vs `profileSnapshots`), qwen3.5-397b-a17b Shopping `patchShoppingMallSellerOrdersItems.ts` (`order_items` vs `items`, `seller` vs `snapshotBy`), qwen3.5-122b-a10b ERP `patchHrmPlatformMemberProjectsProjectIdTasks.ts` (`parent_department` vs `parent`), `patchHrmPlatformMemberTimers.ts` (`hrm_platform_role_permissions` vs `permissions`), qwen3.5-35b-a3b ERP `putHrmsMemberTimelogsTimelogId.ts` (`permission` vs `permissions`), gpt-5.4-mini ERP `patchHrmTimeTrackingMemberMeTimelogs.ts` (`user_account` vs `userAccount`), minimax-m2.7 전 시나리오 10+ 파일 (`seller_profiles`, `userKarmas` 등), qwen3-coder-next ERP `putHrmTrackerMemberDepartmentsDepartmentId.ts` (`employee_roles` vs `employeeAssignments`), `putErpHrmAdminOrganizationsOrganizationIdReportsReportIdParameters.ts` (`erp_hrm_project` vs `project`, `erp_hrm_member` vs `member`) |
| P2 | **`select()` 반환 타입 `FindManyArgs` 명시로 인한 `GetPayload` 추론 실패** — 릴레이션이 Payload에서 소실 | 5/9 | 8+ | gpt-5.4-nano ERP `ErpHrmTimeTrackingTaskAtSummaryTransformer.ts`, gpt-5.4-mini Shopping `ShoppingMallSellerProfileAtSummaryTransformer.ts`, ERP `HrmTimeTrackingDashboardRecentTimelogTransformer.ts`·`HrmTimeTrackingTaskTransformer.ts`, qwen3.5-27b Shopping `ShoppingMallCategoryAtSummaryTransformer.ts`·ERP `HrmPlatformDepartmentAtSummaryTransformer.ts`, qwen3.5-35b-a3b Reddit `RedditCommunityCommentAtSummaryTransformer.ts`·ERP `HrmPlatformDepartmentAtSummaryTransformer.ts`, qwen3.5-122b-a10b ERP `patchHrmPlatformMemberTimers.ts` |
| P3 | **존재하지 않는 컬럼 참조** — 스키마에 없는 컬럼을 select/where/create에 사용 | 4/9 | 10+ | qwen3.5-35b-a3b ERP `patchHrmsMemberOrganizationMemberships.ts` (`members_count`), `postHrmsMemberTimesheets.ts` (`hrms_employee_id`), qwen3-coder-next ERP `postHrmTrackerMemberProjectsProjectIdStatusChange.ts` (`member_id`, `actor_id`, `session_id`, `target_type`, `target_id`), minimax-m2.7 ERP 다수 파일 (`erp_hrm_parent_department_id`, `subtasks_count`, `deleted_at` on sessions), qwen3.5-122b-a10b ERP `patchHrmPlatformMemberProjectsProjectIdTasks.ts` (DTO 필수 필드 `member_count`, `created_at`, `updated_at` 누락) |
| P4 | **재귀 자기참조 select의 타입 추론 실패** — `select()`가 자기 자신을 재귀 호출하여 반환 타입이 `any`로 폴백 | 4/9 | 6 | kimi-k2.5 Reddit `RedditLikeCommentAtThreadTransformer.ts` (재귀 select → `any` → `author`·`replies` 접근 불가), qwen3.5-397b-a17b Reddit `RedditCloneCommentAtSummaryTransformer.ts`·`RedditCloneCommentTransformer.ts` (직접/간접 재귀), qwen3-coder-next Shopping 재귀 Transformer (select 깊이와 transform 재귀 불일치), qwen3.5-27b Shopping `ShoppingMallCategoryAtSummaryTransformer.ts` (재귀 select + FindManyArgs 복합) |
| P5 | **`satisfies` 키워드 오용** — `where` 절이나 중첩 릴레이션에 `FindManyArgs` 타입을 잘못 적용 | 3/9 | 5+ | gpt-5.4-nano Shopping `deleteShoppingMallMemberShipmentConfirmationsShipmentConfirmationId.ts` (where에 `FindFirstArgs` satisfies), qwen3.5-122b-a10b ERP `patchHrmPlatformMemberTimers.ts` (중첩 select에 `FindManyArgs` satisfies 남용 9회), qwen3.5-35b-a3b ERP `HrmPlatformTaskAtSummaryTransformer.ts` (parent select에 `FindManyArgs` satisfies) |
| P6 | **nullable → non-nullable 타입 불일치** — NOT NULL FK 관계에 불필요한 null 반환 또는 non-nullable DTO에 null 반환 | 3/9 | 5+ | qwen3-coder-next ERP `patchHrmTrackerMemberTimelogs.ts` (NOT NULL FK `organization`에 `? null :` 처리), minimax-m2.7 ERP `ErpHrmTimesheetTimelogAtInvertTransformer.ts` (nullable task에 null 체크 누락), qwen3.5-122b-a10b ERP `getHrmPlatformMemberDashboardPersonal.ts` (`department: undefined` vs `| null`) |
| P7 | **select에 포함하지 않은 필드에 transform에서 접근** — select 범위와 매핑 코드 불일치 | 3/9 | 5+ | kimi-k2.5 Shopping `EcommerceMallShipmentTransformer.ts` (`seller_id`, `order_id` FK 미포함), qwen3-coder-next Shopping 재귀 Transformer (깊이 제한된 parent에서 접근 범위 초과), qwen3.5-35b-a3b Reddit `RedditCommunityCommentAtSummaryTransformer.ts` (select에 미포함 릴레이션 접근) |
| P8 | **Prisma select에 `null` 할당** — 릴레이션 제외 시 `null` 사용 (올바른 방법: 키 생략 또는 `false`) | 2/9 | 3+ | gpt-5.4-mini ERP `patchHrmTimeTrackingMemberMeTimelogs.ts`·`patchHrmTimeTrackingMemberTimelogsOrganizationView.ts` (`assignee: null`, `parent: null` → 전체 select 타입 파괴), minimax-m2.7 Reddit `getRedditCloneMemberMembersSessionsSessionId.ts` (select에 null 사용) |
| P9 | **snake_case vs camelCase 혼동** — Prisma 컬럼명(snake_case)에 camelCase 사용 또는 릴레이션명에 snake_case 사용 | 2/9 | 5+ | minimax-m2.7 Reddit 3파일·Shopping 2파일 (select에서 `originalFilename` vs `original_filename`, `mimeType` vs `mime_type`), gpt-5.4-mini ERP `patchHrmTimeTrackingMemberMeTimelogs.ts` (`user_account` vs `userAccount`) |
| P10 | **select/transform 깊이 불일치** — select는 유한 깊이, transform은 무한 재귀 | 1/9 | 1 | qwen3.5-397b-a17b ERP `HrmPlatformTaskAtSummaryTransformer.ts` (select 3단계, transform 재귀 → 타입 구조 불일치 TS2345) |
| P11 | **`null` vs `undefined` 혼동** — `| null` DTO에 `undefined` 반환 | 2/9 | 3+ | qwen3.5-122b-a10b ERP `getHrmPlatformMemberDashboardPersonal.ts` (`department: undefined` vs `| null`), qwen3.5-35b-a3b ERP `HrmPlatformTaskAtSummaryTransformer.ts` (`project: undefined` vs 필수 ISummary) |
| P12 | **순환 참조 DTO에서 필수 속성 누락** — A → B → A 순환 구조에서 역참조 속성 미포함 | 2/9 | 2 | gpt-5.4-mini Shopping `patchShoppingMallAdministratorSellers.ts` (ISellerProfile.ISummary의 `seller` 필드 누락), qwen3.5-122b-a10b ERP (IEmployee.ISummary의 순환 참조 처리 미흡) |
| P13 | **LLM 구문 붕괴** — `as` 타입 단언이 여러 줄로 분리되어 코드 파손 | 1/9 | 1 | qwen3.5-122b-a10b ERP `patchHrmPlatformMemberTimers.ts` (350행 이후 전체 구문 파괴, 200건+ 연쇄 에러) |
| P14 | **미정의 함수 호출** — 존재하지 않는 유틸리티 함수 호출 | 1/9 | 1 | qwen3-coder-next Reddit `getRedditLikeAdminBansBanId.ts` (`adminAuthorize` 함수 미존재) |
| P15 | **의미 없는 변수 삽입** — 모든 select 블록에 `n` 변수 반복 삽입 | 1/9 | 1 | minimax-m2.7 Shopping (파일 전체에 `n` 변수 반복 삽입으로 사용 불가) |
| P16 | **interface 단계 잘못된 타입 정의** — UUID/DateTime을 `boolean`으로 정의 | 1/9 | 3 | gpt-5.4-mini Shopping `ShoppingMallCartTransformer.ts` (`id: boolean`, `created_at: boolean`), ERP `patchHrmTimeTrackingMemberReportsTime.ts`·`patchHrmTimeTrackingMemberReportsWeeklySummary.ts` (DTO 전체 필드가 boolean) |
| P17 | **객체 리터럴 중복 속성명** | 2/9 | 2 | qwen3-coder-next ERP `postHrmTrackerMemberProjectsProjectIdStatusChange.ts` (`action_type` 2회 선언), minimax-m2.7 Shopping (중복 속성) |
| P18 | **DTO 필수 필드 누락** — DTO의 필수 속성을 변환 코드에서 매핑하지 않음 | 3/9 | 5+ | qwen3.5-122b-a10b ERP `patchHrmPlatformMemberProjectsProjectIdTasks.ts` (IHrmPlatformProject.ISummary의 `member_count`, `created_at`, `updated_at` 누락), minimax-m2.7 전 시나리오 (ISummary 필수 속성 다수 누락), qwen3.5-35b-a3b ERP (IHrmsTimelog DTO 의미 오해로 필드 구조 전체 불일치) |

---

## 2. 대상 프롬프트별 개선안

### 2.1 REALIZE_OPERATION_WRITE.md

#### 개선 항목 1: Prisma Select 릴레이션명 규칙 (P1 방지)

- **근거 오류**:
  - kimi-k2.5 보고서 > Shopping > `EcommerceMallShipmentTransformer.ts` (패턴 P1: `profile` vs `profileSnapshots`)
  - qwen3.5-397b-a17b 보고서 > Shopping > `patchShoppingMallSellerOrdersItems.ts` (패턴 P1: `order_items` vs `items`, `seller` vs `snapshotBy`)
  - qwen3.5-122b-a10b 보고서 > ERP > `patchHrmPlatformMemberProjectsProjectIdTasks.ts` (패턴 P1: `parent_department` vs `parent`)
  - qwen3.5-122b-a10b 보고서 > ERP > `patchHrmPlatformMemberTimers.ts` (패턴 P1: `hrm_platform_role_permissions` vs `permissions`)
  - minimax-m2.7 보고서 > 전 시나리오 > 10+ 파일 (패턴 P1: `seller_profiles`, `userKarmas`, FK 접두사 기반 추측)
  - qwen3-coder-next 보고서 > ERP > `putHrmTrackerMemberDepartmentsDepartmentId.ts` (패턴 P1: `employee_roles` vs `employeeAssignments`)
  - gpt-5.4-mini 보고서 > ERP > `patchHrmTimeTrackingMemberMeTimelogs.ts` (패턴 P9: `user_account` vs `userAccount`)
- **현재 문제**: 프롬프트에 릴레이션명을 스키마에서 정확히 복사하라는 규칙이 없어, LLM이 FK 컬럼명이나 테이블명에서 릴레이션명을 추측함
- **삽입할 텍스트**:
```
### Prisma Select Relation Name Rules

When writing `select` or `include` objects for Prisma queries, you MUST follow these rules for relation property names:

1. **Use exact relation property names from the Prisma schema.** The relation property name is the field name defined on the left side of the relation type declaration in the model definition, NOT the target model name or table name.
   - Example: if schema says `profileSnapshots ecommerce_mall_seller_profile_snapshots[]` → use `profileSnapshots`, NOT `profile` or `seller_profiles`
   - Example: if schema says `items shopping_mall_order_items[]` → use `items`, NOT `order_items`
   - Example: if schema says `snapshotBy shopping_mall_sellers @relation(...)` → use `snapshotBy`, NOT `seller`
   - Example: if schema says `permissions hrm_platform_role_permissions[]` → use `permissions`, NOT `hrm_platform_role_permissions` or `permission`
   - Example: if schema says `employeeAssignments hrm_tracker_employee_roles[]` → use `employeeAssignments`, NOT `employee_roles`

2. **FK column names and relation property names are DIFFERENT things.**
   - FK column: `shopping_mall_seller_id` (used in `where` for direct value filtering)
   - Relation property: `snapshotBy` (used in `select`/`include` for nested queries)
   - You CANNOT derive the relation name by removing `_id` from the FK column name. The relation name is independently defined in the schema.

3. **Column names in Prisma select MUST use the exact casing from the schema.**
   - If schema defines `original_filename`, use `original_filename`, NOT `originalFilename`.
   - Prisma column names follow the schema definition exactly (typically snake_case).
   - CamelCase conversion is ONLY done in the transform/mapping step for DTO output.

4. **When a single model has multiple relations to the same target model, each relation has a DIFFERENT name.** Always verify which specific relation you need by checking the FK column each relation maps to.
```
- **삽입 위치**: Prisma 쿼리 작성 가이드라인 섹션의 맨 앞 (가장 빈번한 오류이므로 최우선 배치)

---

#### 개선 항목 2: Prisma Select 값 규칙 및 null 금지 (P8 방지)

- **근거 오류**:
  - gpt-5.4-mini 보고서 > ERP > `patchHrmTimeTrackingMemberMeTimelogs.ts` (패턴 P8: `assignee: null`, `parent: null` → 전체 select 타입 파괴, 100+ 연쇄 에러)
  - gpt-5.4-mini 보고서 > ERP > `patchHrmTimeTrackingMemberTimelogsOrganizationView.ts` (패턴 P8: 동일 패턴)
  - minimax-m2.7 보고서 > Reddit > `getRedditCloneMemberMembersSessionsSessionId.ts` (패턴 P8: select에 null 사용)
- **현재 문제**: LLM이 관계를 제외하려는 의도로 `null`을 할당하지만, Prisma select에서 `null`은 유효한 값이 아니며 전체 select 타입 추론을 파괴함
- **삽입할 텍스트**:
```
### Prisma Select Value Rules

In a Prisma `select` object, only the following values are valid for each key:

- `true` — include this field in the result
- `false` — exclude this field (or simply omit the key)
- `{ select: { ... } }` — include this relation with nested field selection

**NEVER use `null` as a value in Prisma `select`.** Using `null` for ANY key in a select object destroys the entire select's type inference, causing ALL relation fields to disappear from the result type and producing dozens of cascading "Property does not exist" errors.

To exclude a relation from the result, simply omit the key entirely or use `false`:

Wrong:
  assignee: null,        // FATAL: destroys ALL type inference
  parent: null,          // FATAL: destroys ALL type inference

Correct:
  // Simply omit `assignee` and `parent` keys entirely
  // Or use: assignee: false, parent: false
```
- **삽입 위치**: 릴레이션명 규칙 바로 아래

---

#### 개선 항목 3: satisfies 사용 제한 규칙 (P5 방지)

- **근거 오류**:
  - gpt-5.4-nano 보고서 > Shopping > `deleteShoppingMallMemberShipmentConfirmationsShipmentConfirmationId.ts` (패턴 P5: where 절 내부에 `satisfies FindFirstArgs` 적용)
  - qwen3.5-122b-a10b 보고서 > ERP > `patchHrmPlatformMemberTimers.ts` (패턴 P5: 중첩 관계 select에 `satisfies FindManyArgs` 남용 9회 → 수백 건 연쇄 에러)
  - qwen3.5-35b-a3b 보고서 > ERP > `HrmPlatformTaskAtSummaryTransformer.ts` (패턴 P5: parent의 중첩 select에 `satisfies FindManyArgs`)
- **현재 문제**: LLM이 타입 안전성을 위해 `satisfies`를 남용하지만, Prisma 타입 계층 구조를 혼동하여 잘못된 위치에 잘못된 타입을 적용함
- **삽입할 텍스트**:
```
### Prisma Query `satisfies` Restriction

**Do NOT use the `satisfies` keyword on Prisma query sub-objects.** Prisma Client already provides full type inference for query arguments through generics.

Specifically forbidden:
- `satisfies Prisma.XxxFindManyArgs` on `where` clause objects (where uses `WhereInput`, not `FindManyArgs`)
- `satisfies Prisma.XxxFindManyArgs` on nested relation sub-objects within `select`
- `satisfies Prisma.XxxFindFirstArgs` on any sub-object

Wrong — where clause with FindFirstArgs (gpt-5.4-nano pattern):
  where: {
    shopping_mall_shipment_id: id,
    deleted_at: null,
  } satisfies Prisma.shopping_mall_shipment_confirmationsFindFirstArgs,

Wrong — nested relation select with FindManyArgs (qwen3.5-122b-a10b pattern):
  role: {
    select: { id: true, name: true },
  } satisfies Prisma.hrm_platform_rolesFindManyArgs,

Correct — no satisfies on sub-objects:
  where: {
    shopping_mall_shipment_id: id,
    deleted_at: null,
  },
  role: {
    select: { id: true, name: true },
  },

The `satisfies` keyword is ONLY acceptable in Transformer `select()` functions at the top-level return statement.
```
- **삽입 위치**: Prisma Select 값 규칙 아래

---

#### 개선 항목 4: nullable 처리 및 null vs undefined 규칙 (P6, P11 방지)

- **근거 오류**:
  - qwen3-coder-next 보고서 > ERP > `patchHrmTrackerMemberTimelogs.ts` (패턴 P6: NOT NULL FK `hrm_tracker_organization_id`에 대해 `organization ? ... : null` 처리 → non-nullable DTO에 null 반환)
  - qwen3.5-122b-a10b 보고서 > ERP > `getHrmPlatformMemberDashboardPersonal.ts` (패턴 P11: `department: undefined` vs DTO의 `| null`)
  - minimax-m2.7 보고서 > ERP > `ErpHrmTimesheetTimelogAtInvertTransformer.ts` (패턴 P6: nullable task에 null 체크 누락 → 13건 `'input' is possibly 'null'`)
- **현재 문제**: LLM이 FK의 nullable 여부를 무시하고 불필요한 null 분기를 추가하거나, DTO가 `| null`을 기대하는데 `undefined`를 반환함
- **삽입할 텍스트**:
```
### Nullable Field Handling Rules

1. **Always use `null`, never `undefined`, for absent optional values in DTO responses.**
   TypeScript's `null` and `undefined` are distinct types under `strictNullChecks`. DTO interfaces define optional fields as `T | null`, not `T | undefined`.

   Wrong: `department: e.department ? transform(e.department) : undefined`
   Correct: `department: e.department ? transform(e.department) : null`

2. **Check FK nullability to determine if a null guard is needed.**
   - If the FK column is `String @db.Uuid` (NOT NULL) → the relation ALWAYS exists. Do NOT add a null guard that returns null — this causes a type error if the DTO field is non-nullable.
   - If the FK column is `String? @db.Uuid` (NULLABLE) → the relation may be null. Add a null guard: `relation ? transform(relation) : null`

3. **For nullable relations used as function parameters, use `NonNullable<T>` or add null checks at the call site.**
   Wrong: `function transformTask(input: Payload["task"]): ISummary { return { id: input.id }; }` (input may be null)
   Correct: `task: input.task ? transformTask(input.task) : null` (null check at call site)
```
- **삽입 위치**: 데이터 변환/매핑 가이드라인 섹션

---

#### 개선 항목 5: 스키마 컬럼 존재 확인 규칙 (P3 방지)

- **근거 오류**:
  - qwen3.5-35b-a3b 보고서 > ERP > `patchHrmsMemberOrganizationMemberships.ts` (패턴 P3: `members_count` — 스키마에 없는 집계 컬럼)
  - qwen3.5-35b-a3b 보고서 > ERP > `postHrmsMemberTimesheets.ts` (패턴 P3: `hrms_employee_id` — FK 방향 혼동, 해당 테이블에 없는 컬럼)
  - qwen3-coder-next 보고서 > ERP > `postHrmTrackerMemberProjectsProjectIdStatusChange.ts` (패턴 P3: `member_id`, `actor_id`, `session_id`, `target_type`, `target_id` — 전부 미존재)
  - minimax-m2.7 보고서 > ERP > 다수 파일 (패턴 P3: `erp_hrm_parent_department_id`, `subtasks_count`, `deleted_at` on sessions)
- **현재 문제**: LLM이 API 응답에 필요한 값을 DB 컬럼으로 착각하거나, 다른 모델의 컬럼명을 현재 모델에 적용함
- **삽입할 텍스트**:
```
### Schema Column Verification Rules

1. **Every field name used in `select`, `where`, `create`, or `update` MUST exist in the Prisma schema for that specific model.** If a field does not exist, it causes a compile error that cascades to destroy the entire query's type inference.

2. **Do NOT assume columns exist based on API response needs.** Common hallucinated columns include:
   - `vote_score`, `comment_count`, `members_count` on tables (often computed aggregates, not stored columns — use `_count` instead)
   - `deleted_at` on session/token tables (sessions may use `is_revoked` or `expired_at`)
   - Column names from child tables on parent tables (e.g., `display_name` from `profiles` cannot be selected directly on `members`)

3. **For aggregate values needed in DTO responses, use Prisma's `_count` feature:**
   Wrong: `members_count: true` (column does not exist)
   Correct: `_count: { select: { members: true } }`

4. **Do NOT use column names from other models.** Each model has its own column names:
   - `timelogs` may have `project_id`, but `tasks` may have `hrm_time_tracking_project_id`
   - `organization_members` does NOT have `hrms_employee_id` — that FK is on `employees.organization_member_id`
```
- **삽입 위치**: Prisma 쿼리 작성 가이드라인 섹션

---

#### 개선 항목 6: select와 transform 일관성 규칙 (P7 방지)

- **근거 오류**:
  - kimi-k2.5 보고서 > Shopping > `EcommerceMallShipmentTransformer.ts` (패턴 P7: `seller_id`, `order_id` FK를 select에 미포함하고 transform에서 접근)
  - qwen3.5-35b-a3b 보고서 > Reddit > `RedditCommunityCommentAtSummaryTransformer.ts` (패턴 P7: select에 미포함된 릴레이션 접근)
  - qwen3-coder-next 보고서 > Shopping (패턴 P7: 깊이 제한된 parent의 필드 범위 초과 접근)
- **현재 문제**: LLM이 select에서 선택하지 않은 필드를 transform에서 사용하거나, 릴레이션 객체를 select에 포함해도 FK 컬럼이 자동 포함되지 않는다는 점을 모름
- **삽입할 텍스트**:
```
### Select-Transform Consistency Rule

Every field accessed in the mapping/transform code MUST be included in the Prisma `select` object. Prisma returns ONLY the fields specified in `select` — no more, no less.

1. **If you need a FK column value (e.g., `input.seller_id`), you must select it explicitly.**
   Including a relation (`seller: { select: {...} }`) does NOT automatically include the FK column (`seller_id`).
   If you need both: `seller_id: true, seller: { select: {...} }`

2. **When using depth-limited selects for recursive relations, the mapping code must ONLY access fields that were selected at that depth.**
   Wrong: selecting `parent: { select: { id: true } }` but accessing `parent.title` in transform
   Correct: only access `parent.id`, or expand the select to include `title`
```
- **삽입 위치**: 데이터 변환/매핑 가이드라인 섹션

---

#### 개선 항목 7: 인증 패턴 규칙 (P14 방지)

- **근거 오류**:
  - qwen3-coder-next 보고서 > Reddit > `getRedditLikeAdminBansBanId.ts` (패턴 P14: `adminAuthorize()` 미존재 함수 호출)
- **현재 문제**: LLM이 인증/인가 함수를 스스로 생성하여 호출하지만, 실제로는 Provider 함수 진입 전에 이미 인증이 완료된 상태임
- **삽입할 텍스트**:
```
### Authentication Pattern Rule

Provider functions receive Payload parameters (`props.admin`, `props.member`, `props.customer`, `props.seller`) that represent ALREADY AUTHENTICATED sessions. Authentication and authorization are handled at the controller/decorator level BEFORE the provider function is called.

**Do NOT call any authentication/authorization functions** like `adminAuthorize()`, `authenticate()`, `validateSession()`. These functions do not exist in the codebase and will cause "Cannot find name" compile errors.
```
- **삽입 위치**: Provider 함수 작성 규칙 섹션

---

#### 개선 항목 8: 코드 순수성 규칙 (P13, P15, P17 방지)

- **근거 오류**:
  - qwen3.5-122b-a10b 보고서 > ERP > `patchHrmPlatformMemberTimers.ts` (패턴 P13: 350행 이후 `as string & tags.Format<"date-time">` 타입 단언이 줄바꿈으로 분리되어 구문 파괴, 200건+ 에러)
  - minimax-m2.7 보고서 > Shopping (패턴 P15: 모든 select 블록에 `n` 변수 반복 삽입)
  - qwen3-coder-next 보고서 > ERP > `postHrmTrackerMemberProjectsProjectIdStatusChange.ts` (패턴 P17: `action_type` 속성 2회 선언)
- **현재 문제**: LLM이 타입 단언을 여러 줄에 걸쳐 분리하거나, 무의미한 변수를 삽입하거나, 동일 속성을 중복 선언함
- **삽입할 텍스트**:
```
### Code Purity Rules

1. **Type assertions (`as`) must be on the SAME LINE as the expression.** Never break a type assertion across multiple lines. Multi-line breaks cause syntax collapse where the object literal's braces become mismatched.
   Wrong (causes syntax destruction):
     value.toISOString()
       as string & tags.Format<"date-time">
   Correct:
     value.toISOString() as string & tags.Format<"date-time">

2. **Never insert meaningless variables or shorthand properties.** Every identifier in a `select` object must be a valid column name or relation name. Do not insert undefined variables like `n`, `x`, or any shorthand property.

3. **Never use the same property name twice in an object literal.** TypeScript error TS1117/TS2300 will occur.
   Wrong: `{ action_type: "archived", action_type: "member" }`

4. **Output ONLY valid TypeScript code.** Never include reasoning text, revision plans, or self-reflection as plain text in the code file.
```
- **삽입 위치**: 코드 생성 품질 규칙 섹션

---

### 2.2 REALIZE_TRANSFORMER_WRITE.md

#### 개선 항목 1: select() 함수 반환 타입 규칙 (P2 방지)

- **근거 오류**:
  - gpt-5.4-nano 보고서 > ERP > `ErpHrmTimeTrackingTaskAtSummaryTransformer.ts` (패턴 P2: `select(): Prisma.erp_hrm_time_tracking_tasksFindManyArgs` 반환 타입 명시 → 5건 릴레이션 접근 실패)
  - gpt-5.4-mini 보고서 > Shopping > `ShoppingMallSellerProfileAtSummaryTransformer.ts` (패턴 P2: `select(): Prisma.shopping_mall_seller_profilesFindManyArgs` → `seller` 릴레이션 소실)
  - gpt-5.4-mini 보고서 > ERP > `HrmTimeTrackingDashboardRecentTimelogTransformer.ts`·`HrmTimeTrackingTaskTransformer.ts` (패턴 P2: FindManyArgs 반환 Transformer를 중첩 select에 사용)
  - qwen3.5-27b 보고서 > Shopping > `ShoppingMallCategoryAtSummaryTransformer.ts` (패턴 P2: FindManyArgs 반환 타입 → `parent` 소실, 2건 에러)
  - qwen3.5-27b 보고서 > ERP > `HrmPlatformDepartmentAtSummaryTransformer.ts` (패턴 P2: FindManyArgs 반환 타입 → `parent`·`organization` 소실, 10건 에러)
  - qwen3.5-35b-a3b 보고서 > Reddit·ERP 다수 파일 (패턴 P2: FindManyArgs 반환 타입으로 Transformer 간 select 재사용 시 타입 파괴)
- **현재 문제**: 프롬프트에 select() 함수의 반환 타입을 생략해야 한다는 규칙이 없어, LLM이 관습적으로 `FindManyArgs`를 반환 타입으로 명시하여 GetPayload의 리터럴 타입 추론을 파괴함
- **삽입할 텍스트**:
```
### Transformer select() Return Type Rule — CRITICAL

**NEVER add an explicit return type annotation to the `select()` function.** Let TypeScript infer the return type from the literal object.

This is critical because `Payload` is defined as:
  `type Payload = Prisma.XxxGetPayload<ReturnType<typeof select>>`

If you annotate the return type as `FindManyArgs`, TypeScript widens the type, losing the specific `select` structure. `GetPayload` then cannot determine which relations are included, and falls back to a scalar-only type — causing EVERY `input.relation` access to fail with TS2339.

WRONG (causes ALL relation access to fail):
```typescript
export function select(): Prisma.xxx_modelFindManyArgs {  // FATAL: explicit return type
  return {
    select: {
      id: true,
      author: { select: { id: true } },
    },
  } satisfies Prisma.xxx_modelFindManyArgs;
}
// Result: Payload = { id: string } — author is MISSING
```

CORRECT:
```typescript
export function select() {  // NO return type annotation
  return {
    select: {
      id: true,
      author: { select: { id: true } },
    },
  } satisfies Prisma.xxx_modelFindManyArgs;
}
// Result: Payload = { id: string; author: { id: string } } — author is INCLUDED
```

The `satisfies` keyword at the TOP LEVEL is acceptable (it validates without widening), but the explicit return type annotation (`: Prisma.XxxFindManyArgs`) MUST be omitted.
```
- **삽입 위치**: Transformer `select()` 함수 작성 규칙 섹션의 맨 앞

---

#### 개선 항목 2: 재귀 자기참조 릴레이션 처리 규칙 (P4, P10 방지)

- **근거 오류**:
  - kimi-k2.5 보고서 > Reddit > `RedditLikeCommentAtThreadTransformer.ts` (패턴 P4: `select()` 내 `replies: RedditLikeCommentAtThreadTransformer.select()` 재귀 호출 → `any` 폴백 → `author`·`replies` 접근 불가)
  - qwen3.5-397b-a17b 보고서 > Reddit > `RedditCloneCommentAtSummaryTransformer.ts` (패턴 P4: `parent: RedditCloneCommentAtSummaryTransformer.select()` 직접 재귀)
  - qwen3.5-397b-a17b 보고서 > Reddit > `RedditCloneCommentTransformer.ts` (패턴 P4: 직접 재귀 `children` + 간접 재귀 `parent` → 이중 재귀)
  - qwen3.5-397b-a17b 보고서 > ERP > `HrmPlatformTaskAtSummaryTransformer.ts` (패턴 P10: select 3단계, transform 무한 재귀 → 타입 구조 불일치 TS2345)
  - qwen3.5-27b 보고서 > Shopping > `ShoppingMallCategoryAtSummaryTransformer.ts` (패턴 P4: 재귀 select + FindManyArgs 복합)
  - qwen3-coder-next 보고서 > Shopping (패턴 P4: 재귀 Transformer에서 select 깊이와 transform 재귀 불일치)
- **현재 문제**: LLM이 자기참조 릴레이션을 처리할 때 select() 함수를 재귀 호출하여 TypeScript가 반환 타입을 추론하지 못하거나, select 깊이와 transform 재귀 깊이가 불일치함
- **삽입할 텍스트**:
```
### Self-Referential (Recursive) Relation Handling — CRITICAL

When a model has a self-referential relation (e.g., comments with parent/replies, categories with parent/children, tasks with parent/subtasks), follow these strict rules:

#### Rule 1: NEVER call select() recursively
`select()` must NEVER call itself directly or indirectly. TypeScript cannot infer the return type of a function that references itself in its return expression — it falls back to `any`, destroying ALL type information for the entire Payload.

WRONG (causes ALL relations to be lost):
```typescript
export function select() {
  return {
    select: {
      id: true,
      content: true,
      author: MemberAtSummaryTransformer.select(),
      replies: CommentTransformer.select(),  // FATAL: recursive self-call
      parent: CommentTransformer.select(),   // FATAL: recursive self-call
    },
  };
}
```

CORRECT — inline the nested select with limited depth:
```typescript
export function select() {
  return {
    select: {
      id: true,
      content: true,
      created_at: true,
      author: MemberAtSummaryTransformer.select(),
      parent: {
        select: {
          id: true,
          content: true,
          created_at: true,
          // Do NOT include parent.parent — stop at depth 1
        },
      },
      replies: {
        select: {
          id: true,
          content: true,
          created_at: true,
          // Do NOT include replies.replies — stop at depth 1
        },
      },
    },
  } satisfies Prisma.xxx_commentsFindManyArgs;
}
```

#### Rule 2: NEVER call transform() recursively on depth-limited data
If `select()` only fetches 1 level of parent/children, `transform()` must NOT recursively call itself for that data. The nested data has a shallower type than `Payload`, causing TS2345.

WRONG:
```typescript
parent: input.parent
  ? await SameTransformer.transform(input.parent)  // FATAL: type mismatch
  : null,
```

CORRECT — inline mapping for depth-limited data:
```typescript
parent: input.parent
  ? {
      id: input.parent.id,
      content: input.parent.content,
      created_at: toISOStringSafe(input.parent.created_at),
      parent: null,     // depth limit reached
      replies: [],      // depth limit reached
    }
  : null,
```

#### Rule 3: If you absolutely need recursive types (rare), define an explicit type alias
```typescript
export type SelectArgs = {
  select: {
    id: true;
    content: true;
    created_at: true;
    author: ReturnType<typeof MemberAtSummaryTransformer.select>;
    replies: SelectArgs;  // recursive type reference
  };
};
export function select(): SelectArgs {
  return { ... };
}
```
This is an advanced pattern — prefer depth-limited inline selects (Rule 1) when possible.
```
- **삽입 위치**: 새로운 섹션 "Self-Referential Relation Handling"으로 추가

---

#### 개선 항목 3: 순환 참조 DTO 처리 패턴 (P12 방지)

- **근거 오류**:
  - gpt-5.4-mini 보고서 > Shopping > `patchShoppingMallAdministratorSellers.ts` (패턴 P12: `IShoppingMallSellerProfile.ISummary`의 필수 필드 `seller` 누락, `IShoppingMallSeller.ISummary.sellerProfile`이 non-nullable인데 null 반환)
  - qwen3.5-122b-a10b 보고서 > ERP > (패턴 P12: IEmployee.ISummary의 순환 참조 처리 미흡)
- **현재 문제**: DTO 타입 간 순환 참조가 있을 때 LLM이 역참조 필드를 누락하거나 순환을 끊는 방법을 모름
- **삽입할 텍스트**:
```
### Circular Reference DTO Handling

When DTO types have circular references (e.g., `ISellerProfile.ISummary` requires `seller: ISeller.ISummary`, and `ISeller.ISummary` requires `sellerProfile: ISellerProfile.ISummary`):

1. **Check ALL required properties** of the target `satisfies` type — missing even one required property causes a compile error.

2. **For the back-reference that creates the cycle**, provide a minimal valid object or use type assertion to break the recursion:

```typescript
sellerProfile: {
  id: seller.sellerProfile!.id,
  seller: {
    id: seller.id,
    email: seller.email,
    // ... ALL other required fields of ISeller.ISummary
    sellerProfile: null as never,  // break the cycle here
  } satisfies IShoppingMallSeller.ISummary,
  shopName: seller.sellerProfile!.shop_name,
  // ... other fields
} satisfies IShoppingMallSellerProfile.ISummary,
```
```
- **삽입 위치**: Transformer 변환 패턴 섹션

---

### 2.3 REALIZE_COLLECTOR_WRITE.md

#### 개선 항목 1: Transformer select() 호출 시 주의사항 (P2 간접 방지)

- **근거 오류**: gpt-5.4-mini 보고서 > ERP > `HrmTimeTrackingDashboardRecentTimelogTransformer.ts` (패턴 P2: 다른 Transformer의 FindManyArgs 반환값을 중첩 select에 사용하여 타입 파괴)
- **현재 문제**: Collector가 Transformer의 `select()`를 호출할 때, 해당 Transformer가 FindManyArgs 반환 타입을 가지면 타입 추론이 실패함
- **삽입할 텍스트**:
```
### When Calling Transformer select()

When using a Transformer's `select()` return value in your Prisma query, the Transformer's `select()` function must NOT have an explicit return type annotation. If it has one (e.g., `: Prisma.XxxFindManyArgs`), the type inference will fail and relations will be missing from the result type.

The correct usage pattern:
```typescript
const data = await MyGlobal.prisma.xxx.findMany({
  ...XxxTransformer.select(),
});
```
```
- **삽입 위치**: Collector 작성 규칙 섹션

---

### 2.4 REALIZE_OPERATION_CORRECT.md

#### 개선 항목 1: 연쇄 오류 진단 가이드 (교정 루프 효율화)

- **근거 오류**:
  - qwen3.5-122b-a10b 보고서 > ERP > `patchHrmPlatformMemberTimers.ts` (1개 릴레이션명 오류 → 300건+ 연쇄 에러)
  - qwen3.5-122b-a10b 보고서 > ERP > `patchHrmPlatformMemberProjectsProjectIdTasks.ts` (1개 `parent_department` 오류 → 100건+ 연쇄 에러)
  - gpt-5.4-mini 보고서 > ERP > `patchHrmTimeTrackingMemberMeTimelogs.ts` (2개 `null` 할당 → 100건+ 연쇄 에러)
  - qwen3.5-397b-a17b 보고서 > Shopping > `patchShoppingMallSellerOrdersItems.ts` (2개 릴레이션명 오류 → 54건 연쇄 에러)
- **현재 문제**: 교정 루프가 모든 에러를 동등하게 취급하여, 근본 원인 1-2개 대신 수백 개의 파생 에러를 모두 수정하려 시도함
- **삽입할 텍스트**:
```
### Cascading Error Diagnosis

A single error in a Prisma `select` object can cause the entire query's type inference to fail, producing dozens or hundreds of downstream "Property does not exist" errors. Before fixing individual errors, identify the ROOT CAUSE:

1. **Look for TS2353 or TS2561 errors first** — these indicate unknown properties in select/where objects. A single unknown property name (wrong relation name, non-existent column) can destroy the entire select type, causing all subsequent relation accesses to fail.

2. **Fix root cause errors FIRST, then re-check.** After fixing unknown property errors, most TS2339 ("Property does not exist on type") errors will auto-resolve.

3. **Common root causes that cascade:**
   - Wrong relation name in select (e.g., `parent_department` instead of `parent`) → entire select type falls back to scalar-only
   - `null` value in select object → entire select type falls back to scalar-only
   - `satisfies FindManyArgs` on nested sub-objects → TypeScript misinterprets the select structure
   - Explicit return type on Transformer `select()` function → GetPayload loses relation info

4. **Count unique root errors vs total errors.** If you see 50+ TS2339 errors but only 1-2 TS2353 errors, fix the 1-2 TS2353 errors first — the rest will likely auto-resolve.
```
- **삽입 위치**: 오류 진단 전략 섹션의 맨 앞

---

### 2.5 REALIZE_TRANSFORMER_CORRECT.md

#### 개선 항목 1: Transformer 특화 교정 패턴 (P2, P4 교정)

- **근거 오류**:
  - kimi-k2.5 보고서 > Reddit > `RedditLikeCommentAtThreadTransformer.ts` (패턴 P4: `'select' implicitly has return type 'any'`)
  - gpt-5.4-nano 보고서 > ERP > `ErpHrmTimeTrackingTaskAtSummaryTransformer.ts` (패턴 P2: `Property 'project' does not exist` with scalar-only type)
  - qwen3.5-27b 보고서 > Shopping·ERP (패턴 P2: FindManyArgs 반환 타입으로 인한 릴레이션 소실)
- **현재 문제**: 교정 에이전트가 Transformer 특유의 오류 패턴(재귀 타입 추론 실패, 반환 타입으로 인한 타입 넓히기)을 인식하지 못함
- **삽입할 텍스트**:
```
### Transformer-Specific Error Patterns

1. **"'select' implicitly has return type 'any'"** (TS2742)
   Root cause: `select()` function calls itself recursively (directly or indirectly).
   Fix: Remove the recursive call. Inline the nested select with limited depth instead.

2. **"Property 'xxx' does not exist on type"** where the type shows only scalar columns (no relations)
   Root cause: `select()` function has an explicit return type annotation like `: Prisma.XxxFindManyArgs`.
   Fix: Remove the return type annotation from `select()`. Keep only the `satisfies` at the top level.

3. **"Types of property 'parent' are incompatible"** (TS2345) on recursive transform calls
   Root cause: `select()` uses finite-depth nesting but `transform()` calls itself recursively.
   Fix: Replace recursive `transform()` call with inline mapping. Set `parent: null` at the depth limit.
```
- **삽입 위치**: 오류 패턴 인식 섹션

---

### 2.6 REALIZE_COLLECTOR_CORRECT.md

#### 개선 항목 1: Collector-Transformer 연계 교정 (P2 간접 교정)

- **근거 오류**: gpt-5.4-mini 보고서 > ERP > `HrmTimeTrackingDashboardRecentTimelogTransformer.ts` (패턴 P2: Transformer의 FindManyArgs 반환값이 Collector의 중첩 select로 전파)
- **현재 문제**: Collector의 에러가 실제로는 참조하는 Transformer의 반환 타입 문제에서 기인하는 경우를 인식하지 못함
- **삽입할 텍스트**:
```
### Cross-File Error Diagnosis

If a Collector file shows "Property does not exist" errors for relation fields that ARE present in the Prisma `select`, check the Transformer files being called:

1. Does the Transformer's `select()` function have an explicit return type annotation (e.g., `: Prisma.XxxFindManyArgs`)? If yes, remove it.
2. Does the Transformer's `select()` function call itself recursively? If yes, replace with depth-limited inline select.

Fix the Transformer file first, then re-compile — the Collector errors will likely auto-resolve.
```
- **삽입 위치**: 오류 진단 섹션

---

## 3. 우선순위 매트릭스

### P0 — 즉시 적용 (예상 오류 방지율: ~60%)

| # | 개선 항목 | 대상 프롬프트 | 방지 패턴 | 영향 모델 수 |
|---|---------|------------|----------|:----------:|
| 1 | Prisma Select 릴레이션명 규칙 | REALIZE_OPERATION_WRITE.md | P1, P9 | 7/9 |
| 2 | `select()` 반환 타입 규칙 | REALIZE_TRANSFORMER_WRITE.md | P2 | 5/9 |
| 3 | 재귀 자기참조 처리 규칙 | REALIZE_TRANSFORMER_WRITE.md | P4, P10 | 4/9 |
| 4 | 스키마 컬럼 존재 확인 규칙 | REALIZE_OPERATION_WRITE.md | P3 | 4/9 |
| 5 | `satisfies` 사용 제한 규칙 | REALIZE_OPERATION_WRITE.md | P5 | 3/9 |

**근거**: P1(7모델)과 P2(5모델)가 가장 빈번하며, 모두 연쇄 타입 폴백을 유발하여 실제 에러 건수의 10배~100배에 달하는 파생 에러를 생성함. 이 5개 규칙만으로 전체 고유 오류 패턴의 60% 이상을 방지 가능.

### P1 — 단기 적용 (추가 방지율: ~20%)

| # | 개선 항목 | 대상 프롬프트 | 방지 패턴 | 영향 모델 수 |
|---|---------|------------|----------|:----------:|
| 6 | nullable 처리 규칙 | REALIZE_OPERATION_WRITE.md | P6, P11 | 3/9 |
| 7 | Prisma select null 금지 | REALIZE_OPERATION_WRITE.md | P8 | 2/9 |
| 8 | select-transform 일관성 규칙 | REALIZE_OPERATION_WRITE.md | P7 | 3/9 |
| 9 | 코드 순수성 규칙 | REALIZE_OPERATION_WRITE.md | P13, P15, P17 | 3/9 |
| 10 | 연쇄 오류 진단 가이드 | REALIZE_OPERATION_CORRECT.md | 교정 효율화 | 9/9 |

**근거**: P0과 함께 적용 시 전체 오류의 ~80%를 방지. P8(select null)은 2개 모델에서만 발생하지만 한 번 발생 시 100건+ 연쇄 에러를 유발하므로 P1에 포함.

### P2 — 중기 적용 (추가 방지율: ~15%)

| # | 개선 항목 | 대상 프롬프트 | 방지 패턴 | 영향 모델 수 |
|---|---------|------------|----------|:----------:|
| 11 | 순환 참조 DTO 처리 | REALIZE_TRANSFORMER_WRITE.md | P12 | 2/9 |
| 12 | 인증 패턴 규칙 | REALIZE_OPERATION_WRITE.md | P14 | 1/9 |
| 13 | Transformer 교정 패턴 | REALIZE_TRANSFORMER_CORRECT.md | P2, P4 교정 | 5/9 |
| 14 | Collector-Transformer 연계 교정 | REALIZE_COLLECTOR_CORRECT.md | P2 간접 교정 | 2/9 |
| 15 | Collector Transformer 호출 주의 | REALIZE_COLLECTOR_WRITE.md | P2 간접 | 2/9 |

### P3 — 장기 적용 (추가 방지율: ~5%)

| # | 개선 항목 | 대상 프롬프트 | 방지 패턴 | 비고 |
|---|---------|------------|----------|------|
| 16 | DTO 필수 필드 완전 매핑 규칙 | REALIZE_OPERATION_WRITE.md | P18 | 3/9 모델 영향 |

---

## 4. 기대 효과

### 패턴별 예상 해소율

| 패턴 ID | 현재 영향 파일 수 | 적용 개선안 | 예상 해소율 | 잔여 오류 예상 |
|---------|:----------------:|-----------|:---------:|:----------:|
| P1 (릴레이션명 환각) | 20+ | 개선안 2.1-항목1 | 80% | 일부 복잡한 다중 릴레이션에서 잔존 가능 |
| P2 (select 반환 타입) | 8+ | 개선안 2.2-항목1 | 95% | 프롬프트 지시를 무시하는 소형 모델에서 잔존 가능 |
| P3 (존재하지 않는 컬럼) | 10+ | 개선안 2.1-항목5 | 70% | 도메인 특화 컬럼명 추측은 완전 방지 어려움 |
| P4 (재귀 select) | 6 | 개선안 2.2-항목2 | 90% | 명시적 예시 제공으로 대부분 해소 |
| P5 (satisfies 오용) | 5+ | 개선안 2.1-항목3 | 90% | 최상위 satisfies는 허용하므로 오용 여지 감소 |
| P6 (nullable 불일치) | 5+ | 개선안 2.1-항목4 | 85% | FK nullable 판단 규칙으로 대부분 해소 |
| P7 (select-transform 불일치) | 5+ | 개선안 2.1-항목6 | 80% | 복잡한 중첩 구조에서 일부 잔존 |
| P8 (select null) | 3+ | 개선안 2.1-항목2 | 95% | 단순 규칙이므로 높은 해소율 |
| P9 (snake/camelCase) | 5+ | 개선안 2.1-항목1 | 85% | P1 규칙에 포함되어 함께 해소 |
| P10 (select/transform 깊이) | 1 | 개선안 2.2-항목2 | 95% | P4 규칙의 Rule 2로 함께 해소 |
| P11 (null vs undefined) | 3+ | 개선안 2.1-항목4 | 90% | 명시적 규칙으로 해소 |
| P12 (순환 참조 DTO) | 2 | 개선안 2.2-항목3 | 75% | 복잡한 순환 구조에서 일부 잔존 |
| P13 (구문 붕괴) | 1 | 개선안 2.1-항목8 | 60% | LLM 토큰 한계 문제는 프롬프트만으로 완전 해소 어려움 |
| P14 (미정의 함수) | 1 | 개선안 2.1-항목7 | 95% | 단순 규칙으로 해소 |
| P15 (무의미한 변수) | 1 | 개선안 2.1-항목8 | 70% | 모델 고유 결함이므로 프롬프트 효과 제한적 |
| P16 (interface 타입 오류) | 3 | (upstream 수정 필요) | — | realize 단계 프롬프트로 해결 불가 |
| P17 (중복 속성명) | 2 | 개선안 2.1-항목8 | 90% | 명시적 금지 규칙으로 해소 |
| P18 (DTO 필수 필드 누락) | 5+ | 개선안 P3-항목16 | 70% | DTO 구조 복잡도에 따라 잔존 |

### 종합 예상

| 우선순위 | 개선안 수 | 누적 오류 방지율 | 비고 |
|---------|:--------:|:--------------:|------|
| P0 (즉시) | 5개 | ~60% | P1, P2, P3, P4, P5 — 가장 빈번하고 치명적인 패턴 |
| P0+P1 (단기) | 10개 | ~80% | +P6, P7, P8, P11, P13, P15, P17 |
| P0+P1+P2 (중기) | 15개 | ~92% | +P12, P14, 교정 루프 효율화 |
| 전체 (장기) | 16개 | ~95% | +P18 |

> **참고**: 오류 방지율은 9개 모델 진단에서 관찰된 고유 오류 패턴 기준. P16(interface 단계 boolean 타입)은 realize 프롬프트가 아닌 upstream 수정이 필요하므로 본 개선안에서 제외. 연쇄 에러(1개 근본 원인에서 파생되는 수십~수백 건)를 고려하면 실제 컴파일 에러 건수 기준 방지율은 상기 수치보다 높음.
