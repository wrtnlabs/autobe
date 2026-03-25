# 시나리오별 설계 갭 분석

이 문서는 3개 테스트 시나리오 각각에 대해 DB 스키마 → API 스펙 → 구현 체인을 검토하고, 설계 수준의 불일치가 발생하는 지점을 식별한다.

---

## 1. Reddit 시나리오

### 1.1. 엔티티 계층

```
users
  └── members (join: user → community)
       ├── posts
       │    ├── comments (자기참조: parent_comment)
       │    │    └── comment_votes
       │    └── post_votes
       ├── subscriptions
       │    └── subscription_snapshots
       └── moderation_roles
communities
  ├── bans
  └── content_reports
       └── report_dismissals
admins (members와 별도)
```

### 1.2. 식별된 설계 갭

| 갭 | DB 실제 | API 기대 | 영향 |
|----|---------|---------|------|
| communities의 `owner` | FK 컬럼 `owner_id` + 다른 이름의 릴레이션 (예: `creator` 또는 `ownerMember`) | `owner: IUser` 중첩 객체 | LLM이 `select: { owner: {...} }` 시도 → TS2353 |
| posts/comments의 `vote_score` | 컬럼 없음. `post_votes` / `comment_votes`에서 집계해야 함 | `vote_score: number` 직접 필드 | LLM이 `select: { vote_score: true }` 시도 → TS2353 |
| posts의 `comment_count` | 컬럼 없음. `_count.comments` 사용해야 함 | `comment_count: number` | 동일 유령 컬럼 문제 |
| posts의 `content_preview` | 컬럼 없음. `content.substring()`에서 파생 | `content_preview: string` | 동일 유령 컬럼 문제 |
| comments의 `author` | DB에서 `member` 릴레이션 (member → user) | DTO의 `author: IUser` | LLM이 릴레이션명으로 `author` 사용 → TS2353 |
| 댓글 자기참조 | `parent_comment_id` FK + `parent` 릴레이션 | `parent: IComment` (재귀) | transformer에서 무한 재귀 |

### 1.3. 판정

Reddit 시나리오는 **중간** 수준의 설계 갭 밀도. 주요 이슈:
1. **네이밍 불일치**: DB는 `member`/`creator` 사용하나 API는 `author`/`owner` 사용
2. **계산 집계**: 투표 점수와 카운트가 릴레이션 집계 필요
3. **자기참조 댓글**: 표준 Reddit 스타일 스레드 댓글

**수정 우선순위**: 네이밍 불일치가 가장 큰 영향. Interface 단계에서 DB의 실제 릴레이션명을 사용하는 DTO를 생성하거나 어노테이션이 올바르게 매핑했다면, reddit 오류의 60% 이상이 사라질 것.

---

## 2. Shopping 시나리오

### 2.1. 엔티티 계층

```
customers
  ├── customer_profiles (1:1, nullable!)
  ├── customer_sessions
  ├── carts
  │    └── cart_items → product_variants
  ├── orders
  │    ├── order_items → product_variants
  │    └── shipping_addresses
  └── reviews → products
sellers
  ├── seller_profiles (1:1, nullable!)
  ├── seller_sessions
  ├── products
  │    ├── product_images
  │    ├── product_variants
  │    │    ├── variant_options
  │    │    └── inventory_records
  │    └── product_snapshots
  ├── shipments
  │    ├── shipment_items → order_items
  │    └── deliveries → customers
  └── cancellation_requests
       └── cancellation_request_snapshots
admins
  ├── admin_roles
  └── product_deletion_requests
categories (자기참조: parent)
```

### 2.2. 식별된 설계 갭

| 갭 | DB 실제 | API 기대 | 영향 |
|----|---------|---------|------|
| `seller.profile` nullable | `seller_profiles`가 1:1, null 가능 (신규 판매자) | DTO가 종종 non-nullable 프로필 요구 | LLM이 null 가드 없이 `.profile.shop_name` 접근 (파일당 30개 이상 오류) |
| `seller_profiles` 릴레이션명 | 실제 릴레이션명이 다를 수 있음 (예: `sellerProfile`) | select에서 `seller_profiles` | select에서 TS2353 |
| cart_items의 `productVariant` | Prisma가 생성한 camelCase 릴레이션명 | API가 사용하나 LLM이 잘못된 이름 추측 | TS2353 |
| snapshots의 `cancellationRequest` | Prisma의 릴레이션명 | LLM이 접근하나 select에 포함하지 않음 | 단일 파일에서 80개 이상 TS2339 오류 |
| profiles의 `contact_phone` | DB에 컬럼 없음 | DTO에 포함 | TS2353 |
| customers의 `display_name` | DB에 컬럼 없음 | DTO에 포함 | TS2353 |
| 계산: `average_rating`, `review_count` | 컬럼 없음. reviews 릴레이션에서 계산 | 상품 DTO에 직접 필드 | 유령 컬럼 |
| 상품 삭제 자기참조 | `parent_request_id` + `parentRequest` 릴레이션 | `parentRequest: IDeletion` + `followUpRequests: IDeletion[]` | 재귀 깊이 불일치 |

### 2.3. 판정

Shopping은 **가장 높은** 설계 갭 밀도. 원인:
1. **깊은 엔티티 체인**: 주문 → 항목 → 상품 → 변형 → 옵션으로 4레벨 이상 include 필요
2. **Nullable 1:1 릴레이션**: `seller_profiles`와 `customer_profiles`가 선택적이나 DTO는 필수로 처리
3. **많은 계산 필드**: 평점, 카운트, 재고 상태
4. **복잡한 스냅샷 패턴**: 취소 요청 스냅샷이 상위 취소 요청 데이터 필요

**수정 우선순위**:
1. `seller.profile` nullable 이슈가 가장 많은 원시 오류 라인 유발 (파일당 30-80개). DTO에서 프로필을 nullable로 표시하거나, nullable 1:1 패턴에 대한 프롬프트 규칙 추가가 가장 높은 효과.
2. `cancellationRequest` 셀렉트 누락은 순수 구현 오류 — 프롬프트 강화로 수정 가능.

---

## 3. ERP 시나리오

### 3.1. 엔티티 계층

```
members (users)
  └── member_sessions
organizations
  ├── organization_roles
  │    └── role_permissions
  ├── departments (자기참조: parent)
  └── employees → members
       ├── time_tracking
       │    ├── projects
       │    │    └── tasks (자기참조: parent_task)
       │    │         └── task_assignments → employees
       │    ├── timelogs → tasks, employees
       │    └── overtime_requests
       └── leave_requests
```

### 3.2. 식별된 설계 갭

| 갭 | DB 실제 | API 기대 | 영향 |
|----|---------|---------|------|
| tasks의 `project` | 릴레이션명이 `project`와 다를 수 있음 | DTO의 `project: IProject` | 미셀렉트 시 TS2339 |
| tasks의 `assignedEmployee` | Prisma에서 `assignee`로 명명될 수 있음 | DTO의 `assignedEmployee: IEmployee` | 이름 불일치 |
| 부서 자기참조 | `parent_department_id` + `parent` 릴레이션 | `parent: IDepartment` (재귀) | 재귀 깊이 |
| 작업 자기참조 | `parent_task_id` + `parentTask` 릴레이션 | `parent: ITask` (재귀) | 재귀 깊이 |
| timelogs의 `employee` | 릴레이션 존재하나 LLM이 셀렉트 잊음 | DTO의 `employee: IEmployee` | 셀렉트 누락 (10개 이상 오류) |
| where 절의 `project_id` | 릴레이션 구문 `project: { id }` 사용해야 함 | where에서 직접 FK | 잘못된 Prisma API |
| `user_account` vs `userAccount` | Prisma가 복합어 릴레이션에 camelCase 생성 | LLM이 snake_case 사용 | TS2353 |

### 3.3. 판정

ERP는 **중간** 수준의 설계 갭 밀도. 주요 패턴:
1. **자기참조 구조**: 부서와 작업 모두 parent 관계를 가짐
2. **camelCase 혼동**: Prisma가 릴레이션에 자동 생성하는 camelCase를 LLM이 때때로 snake_case로 사용
3. **셀렉트 누락**: 표준 Class A 오류, 설계 관련 아님

**수정 우선순위**: transformer 프롬프트 §6.8에 제안된 자기참조 패턴 가이드가 대부분의 ERP 고유 이슈를 수정할 것.

---

## 4. 시나리오 간 패턴

### 4.1. 공통 패턴 (3개 시나리오 모두에 등장)

1. **select에서 릴레이션 누락** — 모든 시나리오, 모든 모델
2. **자기참조 릴레이션 재귀** — 댓글 (reddit), 카테고리 (shopping), 부서/작업 (erp)
3. **유령 컬럼으로서의 계산 필드** — vote_score (reddit), review_count (shopping), erp에서도 유사

### 4.2. 시나리오별 고유 패턴

| 패턴 | Reddit | Shopping | ERP |
|------|--------|----------|-----|
| Nullable 1:1 릴레이션 | 드물음 | **지배적** (프로필) | 드물음 |
| 깊은 엔티티 체인 (4레벨 이상) | 중간 | **지배적** | 중간 |
| 네이밍 불일치 (DB vs DTO) | **높음** (author/owner) | 중간 | 낮음 |
| camelCase 혼동 | 낮음 | 중간 | **높음** |
| 사고과정-코드화 | 모델 의존 | 모델 의존 | 모델 의존 |

### 4.3. 복잡도 순위

```
Shopping ████████████████████████████ 가장 복잡 (깊은 체인, nullable 프로필, 많은 계산 필드)
Reddit   ██████████████████████ 중간 (네이밍 불일치, 집계, 자기참조)
ERP      ████████████████ 가장 덜 복잡 (더 깨끗한 스키마-API 정렬)
```

---

## 5. 시나리오별 권고

### Reddit
- Interface 단계 개선: `@x-autobe-database-schema-property`에 DB 릴레이션명 사용
- `vote_score`, `comment_count`에 대한 명시적 계산 필드 어노테이션 추가
- 자기참조 transformer 가이드 추가

### Shopping
- **핵심**: nullable 1:1 릴레이션 패턴을 프롬프트에 추가
- Interface 단계 개선: DB가 null 허용 시 DTO에서 `profile`을 nullable로 표시
- 깊은 체인 null 가딩 예시 추가
- 취소 요청 스냅샷 패턴 (릴레이션 네이밍) 추가

### ERP
- 자기참조 transformer 가이드 추가 (부서, 작업)
- 복합어 Prisma 릴레이션명에 대한 camelCase 리마인더 추가
- `project_id` → `project: { id }` Prisma where 구문 예시 추가
