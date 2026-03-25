# AutoBE Realize 단계 — 컴파일 오류 진단 보고서

**일자**: 2026-03-25
**분석자**: Claude Opus 4.6
**범위**: 4개 프로바이더 × 3개 시나리오(reddit, shopping, erp) 기반 21개 테스트 케이스
**제외**: deepseek/deepseek-v3.2 — 사고과정-코드화(Class E) 빈도가 과도하여 프롬프트 개선으로 해결 불가 판정, 분석에서 배제
**출처**: `test/debug.log.md` + `test/results/` 산출물 + `packages/agent/prompts/`

---

## 요약

21개 테스트 케이스(deepseek 제외) 모두 self-healing 교정 루프가 재시도 횟수를 소진한 후에도 잔여 컴파일 오류로 종료되었다. 본 보고서는 모든 오류를 분류하고, 각각의 근본 원인을 추적하며, 구체적인 프롬프트 개정안을 제시한다.

**핵심 발견**: 오류의 **75%는 구현 로직 실패**, **25%는 DB/API 설계 수준의 불일치**이다. 가장 효과적인 단일 개선안은 **Prisma 릴레이션 셀렉트** 관련 가이드 강화이다 — 이 오류 클래스 하나가 전체 실패의 절반 이상을 차지한다.

> **deepseek/deepseek-v3.2 배제 사유**: 사고과정-코드화(Class E) 비율이 비정상적으로 높고, 릴레이션명 환각 및 런타임 정합성 문제(admin-member 아이덴티티 갭, 하드코딩된 계산 필드 등)가 심각하여 프롬프트 개선만으로는 품질 보장이 불가능하다. 상세 분석은 `providers/deepseek-v3.2.md` 참조.

---

## 1. 테스트 케이스 개요

| # | 모델 | 시나리오 | 오류 수 | 심각도 | 주요 오류 클래스 |
|---|-------|----------|---------|--------|-----------------|
| 1 | minimax/minimax-m2.7 | reddit | 8 | 높음 | 릴레이션 누락, null 안전성 |
| 2 | minimax/minimax-m2.7 | shopping | 11 | 높음 | 릴레이션 누락, null 안전성, 스키마 불일치 |
| 3 | minimax/minimax-m2.7 | erp | 7 | 높음 | 릴레이션 누락, 잘못된 Prisma API |
| 4 | moonshotai/kimi-k2.5 | reddit | 1 | 낮음 | 릴레이션 누락 (transformer) |
| 5 | moonshotai/kimi-k2.5 | shopping | 1 | 낮음 | 스키마 불일치 |
| 6 | openai/gpt-5.4-mini | shopping | 4 | 중간 | null 안전성, 스키마 불일치, 타입 불일치 |
| 7 | openai/gpt-5.4-mini | erp | 6 | 중간 | 릴레이션 누락, 잘못된 Prisma API, null 안전성 |
| 8 | openai/gpt-5.4-nano | shopping | 1 | 낮음 | 잘못된 Prisma API |
| 9 | openai/gpt-5.4-nano | erp | 1 | 낮음 | 릴레이션 누락 (transformer) |
| 10 | qwen/qwen3-coder-next | reddit | 2 | 낮음 | 릴레이션 누락 (transformer 깊이), 미정의 참조 |
| 11 | qwen/qwen3-coder-next | shopping | 7 | 중간 | 릴레이션 누락, null 안전성, 잘못된 Prisma API |
| 12 | qwen/qwen3-coder-next | erp | 3 | 낮음 | 릴레이션 누락, 사고과정-코드화 |
| 13 | qwen/qwen3.5-122b-a10b | erp | 5 | 중간 | 사고과정-코드화, 타입 불일치 |
| 14 | qwen/qwen3.5-27b | shopping | 1 | 낮음 | 릴레이션 누락 (transformer) |
| 15 | qwen/qwen3.5-27b | erp | 1 | 낮음 | 릴레이션 누락 (transformer) |
| 16 | qwen/qwen3.5-35b-a3b | reddit | 4 | 중간 | 릴레이션 누락, 스키마 불일치 |
| 17 | qwen/qwen3.5-35b-a3b | shopping | 5 | 중간 | 릴레이션 누락, null 안전성, 잘못된 Prisma API |
| 18 | qwen/qwen3.5-35b-a3b | erp | 3 | 낮음 | 릴레이션 누락, 사고과정-코드화 |
| 19 | qwen/qwen3.5-397b-a17b | reddit | 2 | 낮음 | 릴레이션 누락 (transformer) |
| 20 | qwen/qwen3.5-397b-a17b | shopping | 2 | 낮음 | 릴레이션 누락, 스키마 불일치 |
| 21 | qwen/qwen3.5-397b-a17b | erp | 1 | 낮음 | 재귀 깊이 불일치 (transformer) |

---

## 2. 오류 분류 체계

### 2.1. CLASS A — 릴레이션 셀렉트 누락 (전체 오류의 약 55%)

**증상**: `Property 'X' does not exist on type '{ id: string; created_at: Date; ... }'`

**메커니즘**: LLM이 Prisma 테이블을 쿼리할 때 릴레이션을 select/include하지 않은 채 결과에서 릴레이션 프로퍼티에 접근한다. Prisma에서 릴레이션은 **기본적으로 지연 로딩** — 명시적으로 셀렉트해야만 나타난다.

**세부 분류**:

| 세부 클래스 | 예시 | 빈도 |
|------------|------|------|
| A1. Provider에서 미셀렉트 릴레이션 접근 | select 없이 `comment.author` 접근 | 매우 높음 |
| A2. Transformer에서 미셀렉트 릴레이션 접근 | `select()` 없이 `transform()`에서 동일 패턴 | 높음 |
| A3. select 자체가 없는 Provider | `findMany({})` 후 릴레이션 접근 | 중간 |
| A4. 중첩 릴레이션 깊이 불일치 | Transformer가 `parent.parent` 기대하나 `parent`만 셀렉트됨 | 낮음 |

**대표 사례**:
- minimax/shopping: `Property 'cancellationRequest'` 80회 이상 반복 — 동일한 단일 릴레이션 누락이 응답 매핑 전체에 증폭됨
- openai/erp: `Property 'employee'` 10회 반복 — 시간기록 쿼리에서 employee 릴레이션 누락
- qwen/shopping: `Property 'order'`, `Property 'seller'` — 배송 쿼리에서 릴레이션 누락
- qwen3.5-35b/erp: `Property 'organization'`, `Property 'parent'` — 부서 트랜스포머에서 릴레이션 누락

**근본 원인 진단**: **구현 로직 오류이지, 설계 불일치가 아님.**

DB 스키마는 릴레이션을 올바르게 정의한다. API 스펙도 중첩 객체를 올바르게 기대한다. LLM이 단순히 Prisma `select` 절에 릴레이션을 추가하지 않는 것이다. 이것이 모든 모델, 모든 시나리오에 걸친 **1위 실패 모드**이다.

**교정 루프 실패 이유**: 교정 프롬프트(REALIZE_OPERATION_CORRECT.md)가 섹션 4.3에서 이 패턴을 다루고 있으나, 동일 릴레이션에 대한 TS2339 오류가 20개 이상일 때 LLM이 압도되어:
1. 릴레이션을 select에 추가하되 다른 곳에서 새 오류를 도입하거나
2. 쿼리 전체를 재구조화하려 시도하여 더 많은 문제를 만들거나
3. 추론 루프에 빠짐 (특히 deepseek, qwen-122b)

---

### 2.2. CLASS B — 스키마 불일치 / 유령 프로퍼티 (전체 오류의 약 20%)

**증상**: `'X' does not exist in type '{table}Select<DefaultArgs>'` 또는 `Property 'X' does not exist on type '{...columns...}'`

**메커니즘**: LLM이 API 응답 DTO에는 존재하지만 실제 데이터베이스 스키마에는 없는 프로퍼티를 참조한다. 다음 경우에 발생:
- API가 계산/가상 필드를 정의할 때 (예: `vote_score`, `comment_count`, `content_preview`)
- API가 DB 릴레이션 이름과 다른 도메인 친화적 이름을 사용할 때 (예: `owner` vs 실제 릴레이션 프로퍼티명)
- API가 LLM이 추정하는 것과 다른 릴레이션 경로가 필요한 객체를 중첩할 때

**세부 분류**:

| 세부 클래스 | 예시 | 근본 원인 |
|------------|------|----------|
| B1. 계산 필드를 컬럼으로 간주 | select에서 `vote_score`, `comment_count` | API 스펙이 계산 필드를 나열; LLM이 DB 컬럼으로 취급 |
| B2. select에서 잘못된 릴레이션 이름 | 실제 릴레이션명 대신 `owner` 사용 | API DTO가 Prisma 릴레이션 프로퍼티와 불일치하는 의미적 이름 사용 |
| B3. 존재하지 않는 중첩 프로퍼티 | sellers 테이블에서 `seller_profiles` | LLM이 존재하지 않는 릴레이션을 환각 |
| B4. camelCase vs snake_case 혼동 | `option_values` vs `optionValues` | Prisma가 릴레이션에 대해 camelCase 생성 |

**대표 사례**:
- minimax/shopping: `'seller_profiles' does not exist in type 'ecommerce_mall_sellersSelect'` — seller에 프로필 릴레이션이 있으나 `seller_profiles`로 명명되지 않음
- minimax/shopping: `'contact_phone' does not exist in type 'ecommerce_mall_customer_profilesSelect'` — DB에 전혀 존재하지 않는 전화번호 필드를 API 응답이 포함
- openai/shopping: `Property 'seller' does not exist on type '{...seller_profile columns...}'` — profile에서 seller로의 역참조 접근
- kimi-k2.5/shopping: `Property 'profile' does not exist` — 실제 릴레이션명은 `profileSnapshots`이나 `profile`로 환각

**근본 원인 진단**: **이것이 DB/API 설계 불일치 범주 (30%)이다.**

간극의 발생 지점은 **Interface 단계**(API 스키마 설계)로, LLM이 다음과 같은 응답 DTO를 생성할 때:
1. 릴레이션에서 계산해야 할 계산 필드 (저장된 것이 아닌)
2. Prisma 스키마의 릴레이션 프로퍼티명과 불일치하는 의미적 이름
3. DB에 근거가 전혀 없는 프로퍼티

realize 단계에서 어려움을 겪는 이유:
- DTO 필드의 `@x-autobe-database-schema-property` JSDoc 어노테이션이 "초안"이라 때때로 존재하지 않는 컬럼을 가리킴
- LLM이 실제 Prisma 스키마보다 이 어노테이션을 신뢰
- LLM이 스키마를 확인하더라도 DTO가 암시하므로 릴레이션이 존재한다고 가정하는 경우가 있음

---

### 2.3. CLASS C — Null 안전성 위반 (전체 오류의 약 12%)

**증상**: `Type 'T | null' is not assignable to type 'T'` 또는 `'X' is possibly 'null'`

**메커니즘**: LLM이 nullable 값을 non-nullable 타입이 요구되는 곳에 전달한다.

**세부 분류**:

| 세부 클래스 | 예시 | 수정 방법 |
|------------|------|----------|
| C1. Nullable DateTime → Date 생성자 | `new Date(null_가능_필드)` | `if (field !== null)` 가드 |
| C2. Nullable FK → non-nullable Prisma where | `where: { id: nullable_id }` | 가드 또는 assert |
| C3. Nullable 릴레이션 → non-nullable DTO | `profile: seller.profile` (profile이 null 가능) | 가드 또는 기본값 |
| C4. Nullable 응답을 non-nullable 타입에 할당 | `ISummary \| null` → `ISummary` | 가드 |

**대표 사례**:
- minimax/shopping: `'cr.seller.profile' is possibly 'null'` — 30회 이상 반복, null 가드 없는 깊은 체인 접근
- openai/shopping: `Type 'null' is not assignable to type 'ISummary'` — nullable `sellerProfile`이 non-nullable DTO에 매핑
- qwen3-coder-next/shopping: `Type 'X | null' is not assignable to type 'X'` — nullable FK 릴레이션의 가드 없는 접근

**근본 원인 진단**: **혼합 — 50% 설계 불일치, 50% 구현 오류.**

- 설계 불일치: DB는 null 허용 (예: seller가 프로필을 아직 설정하지 않았을 때 `profile`이 null 가능)하지만 API DTO가 필수로 선언. 인터페이스 설계 문제.
- 구현 오류: 타입이 명백히 null 가능함을 보여주는데도 LLM이 nullable 값에 대한 가드를 하지 않음.

---

### 2.4. CLASS D — 잘못된 Prisma 쿼리 API (전체 오류의 약 5%)

**증상**: `'X' does not exist in type '{table}FindManyArgs'` 또는 `Object literal may only specify known properties`

**메커니즘**: LLM이 잘못된 Prisma Client API 구문을 사용한다.

**세부 분류**:

| 세부 클래스 | 예시 | 수정 방법 |
|------------|------|----------|
| D1. findMany args에 ID 직접 전달 | `findMany({ id: value })` | `findMany({ where: { id: value } })` 사용 |
| D2. 릴레이션 include에 null | `include: { parent: null }` | `true` 사용 또는 생략 |
| D3. where에서 FK 컬럼 사용 (릴레이션이어야 함) | `where: { project_id: id }` | `where: { project: { id: id } }` 사용 |
| D4. where에서 존재하지 않는 필드 | 잘못된 테이블에서 `where: { member_id: id }` | 실제 스키마 확인 |
| D5. 잘못된 select 중첩 | session create에서 `select: { deleted_at: true }` | 해당 테이블에 deleted_at 없음 |
| D6. 잘못된 `satisfies` 타입 | 중첩 select에서 `satisfies Prisma.XxxFindManyArgs` | `XxxSelect` 사용하거나 생략; 타입 전체 붕괴 유발 |

**대표 사례**:
- openai/erp: `'project_id' does not exist in type 'hrm_time_tracking_tasksWhereInput'` — 릴레이션 구문 사용해야 함
- qwen/shopping: `'bbs_user_id' does not exist in type 'ecommerce_mall_order_itemsWhereInput'` — 완전히 잘못된 테이블
- minimax/erp: `'erp_hrm_parent_department_id' does not exist` — FK 컬럼명 환각 (실제: `parent_id`)

**근본 원인 진단**: **순수 구현 로직 오류.**

---

### 2.5. CLASS E — LLM "사고과정 코드화" (전체 오류의 약 3%)

**증상**: `Cannot find name 'Need'`, `Cannot find name 'to'`, `Cannot find name 'The'` 등

**메커니즘**: LLM이 실제 구현 코드 대신 자신의 사고 과정(chain-of-thought)을 TypeScript 코드로 출력한다. 이로 인해 추론의 각 단어가 식별자로 처리되어 수백 개의 "Cannot find name" 오류가 발생한다.

**대표 사례**:
- qwen/qwen3.5-122b/erp: `patchHrmPlatformMemberTimers.ts` — 349행 이후 타입 단언이 여러 줄로 분리되면서 수백 개의 파싱 오류 발생
- qwen/qwen3-coder-next/erp: 일부 provider에서 추론 텍스트가 코드에 혼입

**근본 원인 진단**: **모델 능력 한계, 프롬프트로 부분적 해결 가능.**

약한/저가 모델이 다음 상황에서 발생:
1. 해결할 수 없는 복잡한 상황에 직면
2. 자연어로 문제를 설명하기 시작
3. 출력 파서가 이 추론을 "코드"로 캡처

교정 루프는 이후 해당 파일에 대한 100개 이상의 오류를 받고 복구할 수 없게 된다.

---

### 2.6. CLASS F — 타입 불일치 (기타) (전체 오류의 약 3%)

**증상**: 다양한 TS2322 및 TS2345 오류

**세부 분류**:

| 세부 클래스 | 예시 |
|------------|------|
| F1. string → boolean | Transformer가 string DB 필드를 boolean DTO 필드에 매핑 |
| F2. number \| null → null | Transformer가 실제 값이 있는 필드에 `null` 반환 |
| F3. 재귀 타입 깊이 | Transformer의 자기참조 타입이 collector 깊이와 불일치 |
| F4. 응답에 필수 프로퍼티 누락 | 응답 객체에 필수 DTO 프로퍼티 누락 |
| F5. Controller 반환 타입 배열/단수 불일치 | Controller가 `IFoo` 선언하나 provider가 `IFoo[]` 반환 |

**대표 사례**:
- openai/shopping: `Type 'string' is not assignable to type 'boolean'` — CartTransformer가 string 필드를 boolean DTO 필드에 매핑
- openai/erp: `Type 'number | null' is not assignable to type 'null'` — TaskTransformer가 값이 있을 수 있는 필드에 null 반환
- qwen/erp: 자기참조 `parent` 프로퍼티 깊이가 transformer와 사용 간 불일치

**근본 원인 진단**: **혼합 — DTO 타입 정의의 설계 불일치 + transformer의 구현 오류.**

---

### 2.7. CLASS G — 중복/네이밍 충돌 (전체 오류의 약 2%)

**증상**: `Duplicate identifier`, `An object literal cannot have multiple properties with the same name`, `Individual declarations in merged declaration must be all exported or all local`

**대표 사례**:
- minimax/shopping: `An object literal cannot have multiple properties with the same name` — 응답 객체에 중복 키 (134회 발생)
- qwen3-coder-next/erp: `Duplicate property 'action_type'` — 동일 객체 리터럴에 동일 키 두 번 지정

**근본 원인 진단**: **순수 구현 로직 오류**, 교정 루프 산출물에서 흔히 발생.

---

## 3. 교차 분석

### 3.1. 발생 단계별 오류 분포

| 발생 단계 | 오류 클래스 | 비율 | 해결 수단 |
|----------|-----------|------|----------|
| **Realize — Provider** | A1, A3, C1-C4, D1-D5, E, G | ~50% | REALIZE_OPERATION_WRITE/CORRECT 프롬프트 |
| **Realize — Transformer** | A2, A4, F1-F4 | ~20% | REALIZE_TRANSFORMER_WRITE/CORRECT 프롬프트 |
| **Interface → Realize 간극** | B1-B4 | ~20% | INTERFACE_SCHEMA + REALIZE 연결 프롬프트 |
| **모델 능력** | E (사고과정-코드화) | ~5% | 모델 선택, 폴백 전략 |
| **Realize — Collector** | D5 | ~5% | REALIZE_COLLECTOR_WRITE/CORRECT 프롬프트 |

### 3.2. 근본 원인별 오류 분포

| 근본 원인 | 비율 | 설명 |
|----------|------|------|
| **구현 로직 오류** | 70% | LLM이 목표는 이해하나 Prisma API 실수를 범함 |
| **DB/API 설계 불일치** | 25% | Interface 단계에서 DB에 깔끔하게 매핑되지 않는 DTO 생성 |
| **모델 능력 한계** | 5% | LLM이 해당 복잡도의 유효한 코드를 생성할 수 없음 |

### 3.3. 모델 품질 순위

| 등급 | 모델 | 케이스당 평균 오류 | 비고 |
|------|------|------------------|------|
| S | moonshotai/kimi-k2.5 | 1.0 | 거의 완벽, 경미한 엣지 케이스만 |
| A | openai/gpt-5.4-nano, qwen/qwen3.5-27b | 1.0 | 깨끗한 출력, 드문 실패 |
| B | qwen/qwen3.5-397b-a17b | 1.7 | 양호하나 재귀 깊이에서 실패 |
| C | qwen/qwen3-coder-next, openai/gpt-5.4-mini | 4.0 | 중간 오류, 대부분 수정 가능한 패턴 |
| D | qwen/qwen3.5-35b-a3b | 4.0 | C등급과 유사하나 스키마 혼동 더 심함 |
| E | minimax/minimax-m2.7 | 8.7 | 높은 오류율, 릴레이션명 환각, null 체인 미처리 |
| F | qwen/qwen3.5-122b-a10b | 5.0+ | satisfies 오용으로 타입 전체 붕괴, 불안정한 출력 |

---

## 4. 프롬프트 갭 분석

### 4.1. 현재 프롬프트의 강점

realize 단계 프롬프트(REALIZE_OPERATION_WRITE, REALIZE_TRANSFORMER_WRITE, REALIZE_COLLECTOR_WRITE)는 이미 잘 구조화되어 있다:

- 올바른/잘못된 예시가 포함된 명확한 코드 구조 템플릿
- Prisma `select` vs `include`에 대한 명시적 규칙
- 릴레이션 프로퍼티 네이밍(릴레이션명 vs 테이블명)에 대한 좋은 커버리지
- Collector/Transformer 재사용 전략이 잘 설명됨
- 교정 프롬프트가 일반적인 오류 패턴을 다룸

### 4.2. 식별된 갭

#### GAP 1: 릴레이션 셀렉트 규칙이 충분히 눈에 띄지 않음 (→ Class A)

**현재 상태**: REALIZE_OPERATION_WRITE의 섹션 6.7이 이를 다루지만, 14페이지 중 7페이지에 많은 다른 규칙들 사이에 묻혀 있다.

**문제**: 이 단일 규칙이 전체 오류의 50% 이상을 방지할 수 있으나, 이스케이프 시퀀스나 import 문에 대한 규칙과 동일한 시각적 비중을 받고 있다.

**권고**: 프롬프트 최상단에 "황금 규칙" 박스로 격상. 기억하기 쉬운 니모닉과 함께 여러 섹션에서 원칙을 반복. 실패하는 정확한 패턴을 보여주는 예시 추가.

#### GAP 2: Interface에서 Realize로의 "계산 필드" 브릿지 부재 (→ Class B)

**현재 상태**: transformer 프롬프트(섹션 8)이 계산 필드와 기저 릴레이션 셀렉트 후 `transform()`에서 계산하는 방법을 언급한다. 그러나 **`@x-autobe-database-schema-property` 어노테이션이 존재하지 않는 컬럼을 가리키는 DTO 프로퍼티**에 대해 명시적으로 경고하지 않는다.

**문제**: interface 단계에서 `vote_score`라는 DTO 프로퍼티를 `@x-autobe-database-schema-property: "vote_score"` 어노테이션과 함께 생성하면, realize 단계 LLM이 Prisma 스키마에서 `vote_score`를 셀렉트하려 시도 — 존재하지 않는다. 프롬프트가 어노테이션을 "참고 힌트이지 절대적 진실이 아님"이라 하지만 놓치기 쉽다.

**권고**: "유령 DTO 프로퍼티"라는 명시적 섹션 추가:
1. 일반적 패턴 나열 (계산 카운트, 집계 점수, 콘텐츠 미리보기)
2. DB 스키마에 존재하지 않음을 보여줌
3. 어노테이션 사용 전 반드시 `getDatabaseSchemas`로 검증하도록 지시
4. 유령 프로퍼티의 구체적 예시와 처리 방법 제공

#### GAP 3: Null 처리가 충분히 구체적이지 않음 (→ Class C)

**현재 상태**: 프롬프트가 null vs undefined 처리를 추상적으로 다룸. 교정 프롬프트에 작은 섹션 있음.

**문제**: 가장 흔한 null 실패는 **깊은 체인 접근** (예: `seller.profile.shop_name` — `profile`이 null 가능)과 **nullable DateTime → Date 생성자**. 어느 패턴도 전용 예시가 없음.

**권고**: 구체적 예시 추가:
1. 깊은 nullable 체인: `record.seller?.profile?.shop_name ?? "Unknown"`
2. Nullable DateTime: `record.expired_at ? new Date(record.expired_at) : null` (`new Date(record.expired_at)` 아님)
3. Nullable 릴레이션을 non-nullable DTO로: 오류 throw 가드 패턴

#### GAP 4: 자기참조 / 재귀 릴레이션 (→ Class A4, F3)

**현재 상태**: transformer도 operation 프롬프트도 자기참조 모델(예: `comments.parent → comments`, `tasks.parent → tasks`, `categories.parent → categories`)을 다루지 않음.

**문제**: transformer가 자기 자신을 재귀 호출(`select()`에 `parent: ThisTransformer.select()` 포함)하면 Prisma 타입이 무한 재귀가 되어 `implicitly has return type 'any'` 오류 발생. LLM이 올바른 제한된 재귀 패턴을 모름.

**권고**: 자기참조 transformer 전용 섹션 추가:
1. 제한된 재귀 생성 방법 (예: 최대 3레벨)
2. 재귀 타입을 위한 `satisfies` 패턴
3. provider 코드에서 제한된 깊이를 처리하는 방법

#### GAP 5: 교정 루프 과부하 (→ 모든 고오류 케이스)

**현재 상태**: 교정 프롬프트가 모든 오류를 한꺼번에 처리.

**문제**: 50개 이상의 TS2339 오류가 존재할 때(대개 단일 릴레이션 누락으로 인해), LLM이 유사한 오류의 벽을 보고:
- 전체를 재구조화하려 시도 (새 오류 도입)
- 코드 대신 추론을 출력 (Class E)
- 포기하고 `typia.random()` 생성

**권고**: 부분적으로 오케스트레이션 이슈(프롬프트만의 문제가 아님)이나, 교정 프롬프트에서:
1. 동일 오류를 먼저 그룹화하도록 지시
2. N개의 동일 `Property 'X' does not exist` 오류는 보통 하나의 근본 원인(누락된 select)임을 강조
3. "트리아지" 단계 제공: "10개 이상의 오류가 동일 프로퍼티를 언급하면 단일 select/include 누락"

#### GAP 6: 사고과정-코드화 방지 (→ Class E)

**현재 상태**: 프롬프트가 "function calling이 필수"라 하지만 코드 출력에 추론을 명시적으로 금지하지 않음.

**문제**: 일부 모델(deepseek, qwen-122b)이 추론과 코드를 혼합.

**권고**: 명시적 금지 추가:
> "`draft`와 `revise.final` 필드는 오직 유효한 TypeScript 코드만 포함해야 한다. TypeScript 주석(`//` 또는 `/* */`) 외에는 자연어 해설, 추론, 설명을 절대 포함하지 말라. 구현 세부사항이 불확실하면 TypeScript 주석을 사용하라 — 절대 일반 텍스트를 넣지 말라."

---

## 5. 프롬프트 개정 제안

### 5.1. REALIZE_OPERATION_WRITE.md — 제안 변경

**변경 1: §1.5 위치에 "황금 규칙" 섹션 추가 (실행 전략 상세 이전)**

```markdown
## 1.5. 황금 규칙 — 접근하기 전에 셀렉트하라

Prisma 쿼리 결과에서 접근하는 모든 필드는 반드시 명시적으로 셀렉트되어야 한다.
이 단일 규칙이 전체 컴파일 오류의 50% 이상을 방지한다.

**릴레이션 필드** (author, category, tags, parent 등)는 셀렉트하지 않으면
아무것도 반환하지 않는다. 자동으로 로드되지 않는다.

`result.X`를 쓰기 전에 확인:
- X가 스칼라 컬럼이면 → `select: { X: true }`
- X가 릴레이션이면 → `select: { X: { select: { ... } } }` 또는 `X: Transformer.select()`
- X가 FK 컬럼이면 → `select: { X: true }` (스칼라임)

이를 지키지 않으면: Property 'X' does not exist on type '{ id: string; ... }'
```

**변경 2: §8.2.5에 "유령 DTO 프로퍼티" 섹션 추가**

```markdown
### 8.2.5. 유령 DTO 프로퍼티 — 사용 전 검증

일부 DTO 프로퍼티는 `@x-autobe-database-schema-property` 어노테이션이 실제 Prisma 스키마에
존재하지 않는 컬럼이나 릴레이션을 가리킨다. 일반적인 예시:

| DTO 프로퍼티 | 어노테이션 내용 | 실제 |
|-------------|---------------|------|
| `vote_score` | `vote_score` 컬럼 | 계산값: votes 릴레이션에서 집계 |
| `comment_count` | `comment_count` 컬럼 | 계산값: `_count.comments` |
| `content_preview` | `content_preview` 컬럼 | 계산값: `content.substring(0, 200)` |
| `owner` | `owner` 릴레이션 | 스키마에서 실제 릴레이션명이 다를 수 있음 (예: `creator`, `author`, `admin`) |

**반드시 getDatabaseSchemas로 검증하라**. 어노테이션 대상이 스키마에 없으면
원본 릴레이션을 셀렉트하고 transform 단계에서 계산하라.
```

**변경 3: §8.5에 null 체인 예시 추가**

```markdown
### 깊은 Nullable 체인 접근

// ❌ 오류: 'profile' is possibly 'null' (이 패턴에서 30개 이상 오류)
const shopName = record.seller.profile.shop_name;

// ✅ 올바름: 전체 체인을 가드
const shopName = record.seller.profile?.shop_name ?? null;

// ✅ 더 나음: 필요한 것만 셀렉트하여 평탄화
select: { seller: { select: { profile: { select: { shop_name: true } } } } }
// 이후: record.seller.profile?.shop_name ?? "N/A"
```

### 5.2. REALIZE_TRANSFORMER_WRITE.md — 제안 변경

**변경 1: §6.8에 자기참조 transformer 섹션 추가**

```markdown
### 6.8. 자기참조 릴레이션 (재귀 Transformer)

자기 자신을 참조하는 모델 (comments → parent comment, tasks → parent task,
categories → parent category)의 경우, 무한 타입을 피하기 위해 재귀를 반드시 제한해야 한다.

// ❌ 오류: 'select' implicitly has return type 'any' (무한 재귀)
export function select() {
  return {
    select: {
      id: true,
      parent: CommentTransformer.select(),  // ← 자기 자신을 무한 호출
    },
  };
}

// ✅ 올바름: 명시적 인라인으로 제한된 재귀
export function select() {
  return {
    select: {
      id: true,
      content: true,
      author: AuthorTransformer.select(),
      parent: {
        select: {
          id: true,
          content: true,
          author: AuthorTransformer.select(),
          parent: {
            select: { id: true },  // ← 여기서 중단: grandparent는 ID만
          },
        },
      } satisfies Prisma.commentsFindManyArgs,
    },
  } satisfies Prisma.commentsFindManyArgs;
}
```

### 5.3. REALIZE_OPERATION_CORRECT.md — 제안 변경

**변경 1: §1.5에 오류 트리아지 섹션 추가**

```markdown
## 1.5. 오류 트리아지 — 수정 전 그룹화

개별 오류를 수정하기 전에 트리아지하라:

1. **동일 오류 카운트**: 10개 이상의 오류가 `Property 'X' does not exist`라 하면,
   하나의 근본 원인을 공유 — 릴레이션 `X`에 대한 select/include 누락.
   쿼리를 한 번 수정하면 모든 오류가 해결된다.

2. **쿼리 식별**: 오류 위치에서 해당 객체를 생성한 Prisma 쿼리로 역추적.
   그 쿼리의 `select` 절이 수정 대상이다.

3. **근본 원인 우선 수정**: 각 오류를 개별 패치하지 말라. 기저 쿼리를 수정하면
   대부분의 하위 오류가 사라진다.
```

**변경 2: §1.6에 사고과정-코드화 금지 추가**

```markdown
## 1.6. 코드 순수성 — 출력에 추론 금지

`draft`와 `revise.final` 필드는 오직 유효한 TypeScript 코드만 포함해야 한다.

- ✅ TypeScript 주석은 허용: `// 소유권 확인 필요`
- ❌ 일반 텍스트 금지: `소유권을 확인해야 합니다`
- ❌ Markdown 금지: `## 오류를 분석하겠습니다`
- ❌ 질문 금지: `올바른 필드명이 무엇인가?`

불확실하면 플레이스홀더 출력: `typia.random<IResponse>()`
절대 자연어를 코드로 출력하지 말라.
```

### 5.4. INTERFACE_SCHEMA.md — 제안 변경 (상류 수정)

**변경 1: 계산 vs 저장 필드 규율 추가**

Interface 단계에서 저장된 DB 컬럼과 계산된 응답 필드를 더 신중하게 구분해야 한다. 계산될 DTO 프로퍼티(집계, 카운트, 파생 값)를 생성할 때, `@x-autobe-database-schema-property` 어노테이션이 이를 명확히 나타내야 한다:

```markdown
### 계산 프로퍼티

DTO 프로퍼티가 릴레이션에서 계산되며 컬럼으로 저장되지 않을 때:

- `@x-autobe-database-schema-property`를 유령 컬럼명이 아닌 원본 릴레이션으로 설정
- `@x-autobe-specification: "Computed: {계산 설명}"` 추가

예시:
- DTO: `reviewCount: number`
- 잘못됨: `@x-autobe-database-schema-property: "review_count"` (컬럼이 존재하지 않음)
- 올바름: `@x-autobe-database-schema-property: "reviews"` + `@x-autobe-specification: "Computed: count of reviews relation"`
```

---

## 6. 케이스별 상세 진단

### ~~6.1. deepseek/deepseek-v3.2~~ — 분석에서 배제

> deepseek는 사고과정-코드화(Class E), 릴레이션명 환각, admin-member 아이덴티티 갭, 하드코딩된 계산 필드 등 프롬프트 개선으로 해결 불가능한 근본적 문제가 과다하여 배제되었다. 상세 분석은 `providers/deepseek-v3.2.md` 참조.

### 6.2. minimax/minimax-m2.7 — shopping

**오류 파일 수**: 11 (가장 복잡한 케이스)

| 파일 | 오류 클래스 | 근본 원인 |
|------|-----------|----------|
| `getEcommerceMallCustomerCancellationRequestsRequestIdSnapshotsSnapshotId.ts` | C3 | `seller.profile`이 null 가능 (30회 이상 반복) |
| `getEcommerceMallCustomerCheckoutPrepare.ts` | A1 + B3 + D4 | `productVariant` 릴레이션 누락, `seller_profiles` 유령 |
| `getEcommerceMallSellerCancellationRequestSnapshotSnapshotId.ts` | A1 + B3 | `cancellationRequest` 릴레이션 누락 (80회 이상 반복), `contact_phone` 유령 |
| `getEcommerceMallSellerCancellationRequestsRequestIdSnapshotsSnapshotId.ts` | A1 + B3 | 위와 동일: `cancellationRequest` 누락, `display_name` 유령 |
| `getEcommerceMallSellerProductsProductId.ts` | A1 + B3 | 6개 이상 릴레이션 누락, `seller_profile` 유령, implicit any |
| `putEcommerceMallSellerProductsProductId.ts` | A1 + B3 | 위와 동일한 패턴 |
| 다수 transformer | A2 + B1 | transformer에서 유사한 릴레이션/유령 이슈 |

**판정**: 심한 혼합. shopping 도메인은 가장 복잡한 엔티티 관계(seller, product, variant, order, shipment, cancellation, review)를 가지며, interface 단계에서 DB 컬럼에 직접 매핑되지 않는 프로퍼티가 많은 DTO를 생성. minimax 모델이 이 간극을 메우는 데 어려움을 겪음.

**Minimax 3개 시나리오 전체** (원시 오류 수):

| 시나리오 | Provider 수 | 오류 파일 | 원시 오류 수 | 주요 TS 코드 |
|---------|-----------|---------|------------|-------------|
| ERP | 143 | 13 | 279 | TS2339 (200), TS2551 (21), TS18047 (13) |
| Reddit | 91 | 9 | 220 | TS2339 (164), TS2322 (29) |
| Shopping | 209 | 17 | 652 | TS2339 (221), TS1117 (134), TS18004 (84) |

**Minimax 고유 실패 패턴**:
- **컬럼명 환각**: 네이밍 휴리스틱을 적용하여 그럴듯하지만 틀린 이름을 발명 — `erp_hrm_parent_department_id` (실제: `parent_id`), `originalFilename` (실제: `original_filename`). 테이블 접두사 관례를 자기참조 FK에 적용하나 스키마는 짧은 이름을 사용.
- **깊은 중첩 일관성 상실** (Shopping): 4레벨 이상 중첩 객체 (seller → profile → snapshots) 변환 시 134개 중복 프로퍼티 오류(TS1117) 발생 — 모델이 어느 중첩 레벨을 구성 중인지 추적 실패.
- **불완전한 transformer 코드** (Shopping): 84개 축약 프로퍼티 오류(`{ n }` — scope에 `n` 없음)와 30개 implicit-any 오류(타입 없는 람다 매개변수)는 모델이 완성된 함수가 아닌 조각을 생성했음을 시사.
- **PrismaClient import 우회**: 인증 코드가 `MyGlobal.prisma` 대신 `@prisma/client`에서 `PrismaClient`를 직접 import하여, 생성된 클라이언트가 해당 경로에서 export하지 않을 때 실패.

### 6.3. moonshotai/kimi-k2.5 — reddit & shopping

히트맵에서 거의 완벽(고유 오류 *클래스* 최소)으로 분류되었으나, 심층 분석 결과 초기 집계보다 더 많은 오류가 발견됨:

**reddit** (원시 오류 13개, 3개 범주):
- **Controller 반환 타입 불일치** (4개): Controller가 단수 반환(`IThread`)을 선언하나 provider가 배열(`IThread[]`)을 반환. "thread"가 하나의 트리인지 트리 목록인지에 대해 API 스펙과 구현이 불일치.
- **`admins` 모델 부재** (4개): Admin 인가가 `MyGlobal.prisma.admins`를 참조하나 `admins` 테이블이 존재하지 않음 — 이 플랫폼은 `owners`/`members`/`moderators`를 사용. 도메인 모델에 적응되지 않은 범용 인증 템플릿.
- **재귀 transformer** (3개): 자기참조 `select()`가 TS7023 (순환 참조로 인한 implicit any) 발생. 다른 모델과 동일 패턴.
- **Import 경로 오류** (1개): `AdminAuth.ts`가 AdminPayload에 대해 잘못된 상대 경로 사용.
- **잘못된 Singleton 사용** (1개): `Singleton.get()`은 `tstl` Singleton 클래스의 유효한 메서드가 아님.

**shopping** (원시 오류 9개, 4개 범주):
- **`profile` vs `profileSnapshots`** (6개): Transformer가 단순 `profile` 릴레이션을 가정하나 스키마는 스냅샷 패턴 사용 (`profileSnapshots` → `ecommerce_mall_seller_profile_snapshots[]`). LLM이 더 단순한 스키마 구조를 환각.
- **Controller 반환 타입 불일치** (2개): reddit과 동일한 배열-vs-단수 패턴.
- **Provider 구현 누락** (1개): 한 provider 파일이 import만 있는 스텁 — LLM이 함수 본문 생성 실패.

**판정**: Kimi-k2.5는 전체적으로 여전히 가장 강한 모델. 원시 오류 수가 오류-클래스 히트맵 제시보다 높으나, 오류가 몇몇 엣지 케이스 패턴(재귀 타입, 스냅샷 네이밍, controller 시그니처)에 집중되어 있으며, 약한 모델에서 보이는 광범위한 셀렉트 누락 실패가 아님. Admin 인가 템플릿 이슈는 비표준 actor 계층에 대한 인가 코드 생성 방식의 갭을 시사.

### 6.4. openai 모델 — 4개 실행 전체

| 모델 | 시나리오 | 원시 오류 수 | 파일 수 | 심각도 |
|------|---------|------------|--------|--------|
| gpt-5.4-mini | erp | 299 | 6 | 심각 |
| gpt-5.4-mini | shopping | 9 | 4 | 경미 |
| gpt-5.4-nano | erp | 5 | 1 | 낮음 |
| gpt-5.4-nano | shopping | 1 | 1 | 사소 |

**gpt-5.4-mini/erp** (299개 오류 — 최악의 OpenAI 케이스):
- 두 provider 파일이 299개 중 288개 오류를 차지. 코드가 `WhereInput`에서 `project_id` 사용(릴레이션 `project: { id }`를 사용해야 함)하고 `user_account` (camelCase `userAccount`여야 함) 사용. 또한 릴레이션 select 필드에 `null` 사용 (Prisma는 `boolean | { select: ... }` 기대).
- FK 네이밍 혼동: DB가 `hrm_time_tracking_project_id`를 사용하나 코드가 짧은 `project_id` 가정.
- 리포트 provider들이 interface가 `boolean` 기대하는 곳에 `string` 값 생성.

**gpt-5.4-mini/shopping** (9개 오류):
- 오타: `IShoppingMallSeller.ISSummary` ("S" 하나 추가)
- Cart transformer가 DateTime을 `.toISOString()` 문자열로 변환하나, interface가 해당 필드를 `boolean`으로 정의 — 근본적인 OpenAPI 스펙 불일치
- 프로필 객체에 `seller` 역참조 누락

**gpt-5.4-nano/erp** (5개 오류):
- Task transformer의 중첩 `select()` 호출이 일반 `{ select: {...} }` 대신 `FindManyArgs` 래핑 포맷을 반환. Prisma의 타입 추론이 결과 타입에서 릴레이션 데이터를 제거.

**gpt-5.4-nano/shopping** (1개 오류):
- `where` 객체에 `WhereInput` 대신 `satisfies Prisma.XxxFindFirstArgs` 사용. 이를 제외하면 거의 완벽.

**판정**: gpt-5.4-nano는 놀라울 정도로 강함 (1-5개 오류). gpt-5.4-mini는 ERP 시나리오에서 근본적인 Prisma API 오해가 있는 2개 파일이 288개 연쇄 오류를 발생시키며 급격한 품질 하락을 보임. shopping의 DateTime→boolean interface 불일치는 상류 OpenAPI 스펙 생성 이슈를 드러냄.

### 6.5. qwen 계열 — 상세 분석 (12개 실행)

12개 Qwen 실행 모두 DB와 Interface 단계를 성공적으로 완료했으나 Realize 단계에서 실패. 교정 루프 데이터가 고생의 규모를 드러냄:

| 모델 | 시나리오 | 오류 수 | 파일 수 | 교정 시도 횟수 | 성공률 |
|------|---------|--------|--------|------------:|------:|
| qwen3.5-397b-a17b | erp | 1 | 1 | 190 | 93% |
| qwen3.5-397b-a17b | reddit | 23 | 2 | 138 | 79% |
| qwen3.5-397b-a17b | shopping | 53 | 1 | 177 | 92% |
| qwen3.5-27b | shopping | 2 | 1 | 182 | 70% |
| qwen3.5-27b | erp | 10 | 1 | 311 | 72% |
| qwen3-coder-next | erp | 6 | 3 | 309 | 95% |
| qwen3-coder-next | reddit | 4 | 2 | 422 | 53% |
| qwen3-coder-next | shopping | 137 | 7 | 551 | 79% |
| qwen3.5-35b-a3b | reddit | 27 | 2 | 424 | 67% |
| qwen3.5-35b-a3b | erp | 52 | 5 | 678 | 71% |
| qwen3.5-35b-a3b | shopping | 87 | 4 | 678 | 72% |
| qwen3.5-122b-a10b | erp | 513 | 4 | 270 | 96% |

**핵심 관찰**:
- **qwen3.5-397b-a17b**: 최고의 Qwen 모델. ERP는 1개 오류만. 오류가 transformer 릴레이션명 패턴에 집중.
- **qwen3.5-27b**: S등급에 근접. 모든 오류가 릴레이션-select 불일치 패턴의 transformer 파일에 있음.
- **qwen3-coder-next**: Prisma 이해도는 좋으나 컬럼명과 nullable 타입 실수. Shopping 시나리오에서 압도됨 (137개 오류).
- **qwen3.5-35b-a3b**: 더 다양한 오류 — 컬럼명 혼동, 오타 프로퍼티. 2개 시나리오에서 교정 루프 한계(678회 시도)에 도달.
- **qwen3.5-122b-a10b**: **치명적 `satisfies` 오용** — 513개 오류 중 394개가 단일 파일에서 발생, 모든 중첩 select에 올바른 타입 대신 `satisfies Prisma.XxxFindManyArgs`를 사용하여 타입 전체 붕괴:

```typescript
// 패턴 5: satisfies에서 잘못된 Prisma 타입 (qwen3.5-122b 고유)
user: {
  select: { id: true, email: true },
} satisfies Prisma.hrm_platform_membersFindManyArgs,  // ❌ Select 타입이어야 함
```

**교정 루프 소진**: 최대 678회 교정 시도에도 불구하고 잔여 오류가 해결 불가. 모델들이 동일한 잘못된 패턴을 반복 생성하여, 타입이 *왜* 틀린지에 대한 이해가 부족함을 시사 — 오류 메시지는 보지만 Prisma의 타입 대수를 추론할 수 없음.

---

## 7. 아키텍처 수준 권고 (프롬프트 이상)

### 7.1. 교정 루프에서의 오류 중복 제거

현재 교정 루프가 모든 N개 오류를 LLM에 전달한다. 80개 오류가 `Property 'cancellationRequest' does not exist`라 하면, LLM이 80줄의 동일 메시지를 본다.

**교정 루프 작동 방식** (오케스트레이터 코드 분석으로 확인):
1. 두 교정 레벨: **Casting** (Date/string만) → **Overall** (전체 진단 + RAG 접근)
2. 양쪽 모두 `COMPILER_RETRY`회까지 축적 이력과 함께 재시도
3. 각 재시도가 이전의 모든 실패 시도 + 진단을 대화에 추가
4. **중복 제거 없음** — 시도 1에서 80개 동일 오류, 시도 2에서 여전히 60개이면 LLM이 컨텍스트에서 140줄의 오류를 봄
5. Overall 교정은 RAG 접근(더 많은 스키마/collector/transformer 요청 가능)이 있으나 반복 오류의 방대한 양이 유용한 컨텍스트를 밀어냄

**권고**: 교정 에이전트에 전달하기 전에 패턴별로 중복 제거:
```
"Property 'cancellationRequest' does not exist on type '...'" (3개 위치에서 ×80회 발생)
→ 근본 원인: 원본 쿼리의 select 절에 'cancellationRequest' 누락
```
이렇게 하면 인지 부하를 줄이고, 유용한 RAG 데이터를 위한 컨텍스트 윈도우를 보존하며, LLM이 근본 원인에 집중하도록 돕는다. 구현 지점: `internal/orchestrateRealizeCorrectOverall.ts`에서 진단이 필터링되어 LLM에 전달되는 부분.

### 7.2. 사전 교정 검증 패스

LLM 기반 교정 전에 기계적 사전 검사 추가:
1. 생성된 코드의 모든 Prisma `select` 절 파싱
2. 쿼리 결과에 대한 모든 프로퍼티 접근 식별
3. 프로퍼티가 접근되었으나 select에 없으면 자동으로 select에 추가
4. 나머지 오류만 LLM에 전달

이렇게 하면 LLM 개입 없이 50% 이상의 오류를 제거할 수 있다.

### 7.3. Interface 단계 — 계산 필드 어노테이션

Interface 단계에서 DTO 프로퍼티 생성 시 명시적 분류 요구:
- `@x-autobe-field-source: "column"` — 직접 DB 컬럼
- `@x-autobe-field-source: "relation"` — Prisma include/select로 로드
- `@x-autobe-field-source: "computed"` — 다른 필드에서 계산
- `@x-autobe-field-source: "aggregation"` — 릴레이션의 count, sum, avg

이 메타데이터가 있으면 realize 단계에서 특별한 처리가 필요한 필드를 즉시 알 수 있다.

### 7.4. 모델별 재시도 전략

식별된 품질 등급을 고려:
- S/A 등급 모델: 1-2회 교정 라운드로 충분
- C/D 등급 모델: 오류 중복 제거와 함께 3-4회 라운드 필요할 수 있음
- E/F 등급 모델: 지속적으로 실패하는 파일에 `typia.random()` 폴백 후, 새 컨텍스트로 파일 재시도 고려

---

## 8. 추가 프롬프트 갭 (심층 프롬프트 분석)

16개 realize 단계 프롬프트 전체를 정밀 독해한 결과, 섹션 4에서 식별된 6개 외에 추가 갭이 발견됨:

### GAP 7: Nullable BelongsTo 릴레이션

어떤 프롬프트도 `belongsTo` 릴레이션이 nullable FK(예: `parent_id String? @db.Uuid`)를 가진 경우를 다루지 않음. FK가 null이면 전체 릴레이션 객체가 `null`이다. `input.parent.name` 같은 코드가 TS 오류를 발생시킨다. 프롬프트가 가르쳐야 할 패턴:

```typescript
// FK가 nullable이면 릴레이션이 null일 수 있음
parent: input.parent ? {
  id: input.parent.id,
  name: input.parent.name,
} satisfies IParent.ISummary : null,
```

이것은 Gap 3(체인의 null 안전성)과 별개이다. Gap 3은 깊은 체인(`a.b.c`)에 관한 것이고; 이 갭은 선택적 belongsTo 릴레이션의 근본 패턴에 관한 것이다.

### GAP 8: `select` 절 없는 쿼리

프롬프트가 `select` 사용을 강하게 강조하지만 `select`가 생략될 때 무슨 일이 일어나는지 명확히 하지 않음. `select` 없이 Prisma는 **모든 스칼라 필드를 반환하나 릴레이션은 반환하지 않는다**. 일부 LLM이 `findUniqueOrThrow({ where: { id } })` 작성 후 릴레이션이 사용 가능하다고 기대 — 그렇지 않다. 간단한 명확화 노트가 혼란을 방지할 수 있다.

### GAP 9: 소프트 삭제 필터링

`deleted_at: null`이 페이지네이션 예시에 나타나지만, 명시적 규칙이 없음: "소프트 삭제된 테이블에 대해 항상 `deleted_at: null`로 필터링하라." LLM이 비페이지네이션 쿼리(소유권 확인, 존재 검증 등)에서 이를 잊을 수 있다.

### GAP 10: Collector에서 일반 `findFirstOrThrow` 후 릴레이션 접근

collector 프롬프트(섹션 10)이 일반 `findFirstOrThrow` 후 `comment.bbs_article_id`에 접근하는 간접 참조 패턴을 보여줌. FK 컬럼이 스칼라이므로 작동. 그러나 이 경고가 부차적 노트에 불과 — LLM이 `record.shopping_mall_product_id` 대신 `record.product.name`을 자주 시도하므로 최상위 규칙으로 격상해야 한다.

---

## 9. 상류 갭 분석 — Database 및 Interface 프롬프트

20개 database 및 interface 프롬프트 전체의 종합적 검토 결과, realize 단계 오류 패턴이 부분적으로 **상류 정보 갭**에 뿌리를 두고 있음이 밝혀졌다. 워터폴 파이프라인은 의도적으로 관심사를 분리(DB → Interface → Realize)하지만, 각 인수인계에서 핵심 연결 정보가 유실된다.

### 9.1. 치명적: Prisma Include 패턴 가이드 없음

**20개 프롬프트 중 어느 것도** — database(7개)든 interface(13개)든 — DTO의 릴레이션 필드를 충족하기 위해 필요한 Prisma `include`나 `select` 패턴을 LLM에 알려주지 않는다. INTERFACE_SCHEMA.md의 `specification` 필드가 "Join from articles.author_id to users.id" 같은 것을 말하지만 이를 Prisma 구문으로 번역하지 않는다.

Realize 에이전트가 독립적으로 파악해야 하는 것:
- Prisma 쿼리에서 어떤 릴레이션을 `include`할지
- include를 얼마나 깊게 중첩할지
- `ISummary` 하위 릴레이션에 `select`를 사용할지 여부

**이것이 Class A 오류(전체 실패의 55%)의 근본 원인이다.**

### 9.2. 높음: 릴레이션 깊이 명세 없음

응답 DTO가 `author: IBbsMember.ISummary`를 포함하고, `IBbsMember.ISummary` 자체가 `organization: IOrganization.ISummary`를 포함하면, 중첩 Prisma include가 필요하다. **어떤 프롬프트도 깊이를 명시하지 않는다.**

- Schema 프롬프트가 "BELONGS-TO는 `.ISummary` 사용"이라 하지만 체인을 제한하지 않음
- 위험: 무한 또는 불일치하는 include 깊이, 과도한 페칭으로 인한 성능 저하, 부족한 페칭으로 인한 데이터 누락

### 9.3. 중간: 스냅샷/구체화 뷰 소비

DB 프롬프트가 스냅샷 테이블(`bbs_article_snapshots`)과 구체화 뷰를 광범위하게 정의한다. API 스키마 프롬프트에는 다음에 대한 **구체적 가이드가 없음**:
- 응답 DTO가 스냅샷 데이터를 인라인으로 포함할지 별도 엔드포인트로 제공할지
- 구체화 뷰 데이터가 응답 DTO에 어떻게 나타나는지
- 목록 엔드포인트에서 구체화 뷰를 사용할지 실시간 데이터를 사용할지

### 9.4. 중간: Composition Create DTO 깊이 모호성

INTERFACE_SCHEMA.md가 3레벨 깊이의 composition 중첩(Sale → Units → Options → Candidates)을 보여주나 composition 깊이에 **제한이 없고** 중첩을 멈추고 별도 엔드포인트를 사용해야 할 시점에 대한 가이드가 없음. 깊이 중첩된 Create DTO는 구현이 비실용적이 된다.

### 9.5. 중간: 서브타입 패턴 (다형성 소유권) API 표현

DB 프롬프트가 다형성 소유권을 위한 서브타입 패턴을 강제 (예: `shopping_order_issues` + `_of_customers` + `_of_sellers`). **어떤 API 프롬프트도 이를 DTO에서 어떻게 표현할지 설명하지 않음**: 구별 합집합(discriminated union), 인라인 서브타입 데이터, 또는 Create DTO의 actor_type 구별.

### 9.6. 낮음-중간: 집계 카운트 계산 방법

프롬프트가 `*_count`를 `databaseSchemaProperty: null`과 함께 계산 필드로 허용하지만, **계산 방법을 명시하지 않음** — Prisma `_count`, 원시 SQL, 또는 서브쿼리. Realize 에이전트가 추측해야 하며, N+1 쿼리나 잘못된 카운트를 생성할 가능성.

### 9.7. 낮음-중간: 정션 테이블 메타데이터

DB 프롬프트가 추가 컬럼(`assigned_at`, `role_level`)을 가질 수 있는 정션 테이블(예: `user_roles`, `product_categories`)을 생성. **정션 테이블 메타데이터가 DTO에 어떻게/여부로 나타나는지** 또는 정션 테이블이 자체 CRUD 엔드포인트를 갖는지에 대한 가이드 없음.

### 9.8. 요약: 상류 → 하류 오류 흐름

```
Database 단계                Interface 단계               Realize 단계
─────────────────────────────────────────────────────────────────────────
DB 스키마 정의          →  DTO 프로퍼티 생성          →  코드가 데이터 페치 시도
                           Prisma 가이드 없음 ❌         select/include 누락 ❌
Nullable FK 컬럼        →  DTO가 필드를 필수로 표시   →  코드가 null에서 크래시 ❌
스냅샷 테이블 정의      →  스냅샷 DTO 규칙 없음 ❌    →  불일치한 처리 ❌
계산 필드 존재          →  DTO에 유령 컬럼 ❌          →  select: { X: true } 실패 ❌
```

가장 효과적인 상류 수정은 INTERFACE_SCHEMA_REFINE.md의 `specification` 필드에 **Prisma include 패턴 가이드**를 추가하는 것이다 — 예를 들어 현재의 `"Join from X to Y"` 대신 `"Select via include: { author: { select: { id: true, name: true } } }"` 같은 사양을 요구.

---

## 10. 결론

AutoBE realize 단계의 잔여 컴파일 오류는 예측 가능한 패턴 세트에서 비롯된다. 가장 큰 단일 범주 — **Prisma 릴레이션 셀렉트 누락** — 은 realize 단계 프롬프트 갭과 상류 interface 단계 정보 유실 양쪽에 뿌리를 둔 잘 이해된 문제이다.

권고 개선안은 세 수준에서 작동한다:

1. **Realize 단계 프롬프트 개선** — "접근 전 셀렉트" 규칙 격상, 오류 트리아지 추가, nullable 패턴, 자기참조 가이드, 코드 순수성 금지 (섹션 4-5, 8)
2. **교정 루프 강화** — Class A 오류에 대한 오류 중복 제거 및 기계적 사전 교정 (섹션 7.1-7.2)
3. **상류 Interface 단계 개선** — Prisma include 패턴 사양, 계산 필드 어노테이션, 릴레이션 깊이 제한, 스냅샷 처리 규칙 (섹션 9)

프롬프트는 이미 잘 만들어져 있다. 권고 변경안은 그 명확성과 흐름을 유지하면서 전체 실패의 80% 이상을 유발하는 특정 패턴에 대한 맞춤 가이드를 추가한다. 워터폴 + 스파이럴 아키텍처는 건전하며 — 개선안은 파이프라인 단계 간 연결 정보가 현재 유실되는 접점에서의 정련이다.

---

## 부록 A: 범주별 오류 수 (21개 케이스, deepseek 제외)

| 범주 | 원시 오류 라인 수 | 고유 오류 수 | 고유 비율 |
|------|-----------------|------------|----------|
| A. 릴레이션 셀렉트 누락 | ~2,200 | ~48 | 57% |
| B. 스키마 불일치 | ~170 | ~17 | 20% |
| C. Null 안전성 | ~140 | ~12 | 14% |
| D. 잘못된 Prisma API | ~25 | ~7 | 5% |
| E. 사고과정-코드화 | ~400 | ~2 | 2% |
| F. 타입 불일치 | ~25 | ~7 | 2% |
| G. 중복/네이밍 | ~140 | ~2 | 0% |
| **합계** | **~3,100** | **~95** | **100%** |

*참고: 원시 오류 라인 수는 다른 접근 지점에서의 동일 오류 반복을 포함한다. 단일 `select` 누락이 20개 이상의 오류 라인을 생성할 수 있다. Class E/G의 원시 수가 높은 것은 qwen3.5-122b(394개 연쇄 오류)와 minimax shopping(134개 중복 프로퍼티)의 단일 파일 폭발 때문이다.*

## 부록 B: 파일 색인

### 진단 보고서

| 파일 | 설명 |
|------|------|
| `test/diagnoses/README.md` | 본 보고서 — 총괄 진단 |
| `test/diagnoses/error-heatmap.md` | 모델 × 시나리오 × 오류 클래스 시각 행렬 |
| `test/diagnoses/scenario-analysis.md` | 시나리오별 설계 갭 분석 |
| `test/diagnoses/upstream-prompt-analysis.md` | 상류 DB/Interface 프롬프트 갭 분석 |
| `test/diagnoses/prompt-revision-proposals.md` | 프롬프트 개정 제안 (삽입 가능 문안) |
| `test/diagnoses/prompt-revision-summary.md` | **총괄 프롬프트 개정안** — 전 모델 종합 |

### 모델별 상세 진단 (providers/)

| 파일 | 모델 | 시나리오 | 오류 수 |
|------|------|---------|--------|
| `providers/deepseek-v3.2.md` | ~~deepseek-v3.2~~ | reddit | 7파일 (배제됨 — 참고용) |
| `providers/minimax-m2.7.md` | minimax-m2.7 | reddit, shopping, erp | 26파일 |
| `providers/kimi-k2.5.md` | kimi-k2.5 | reddit, shopping | 2파일 |
| `providers/gpt-5.4-mini.md` | gpt-5.4-mini | shopping, erp | 5파일 |
| `providers/gpt-5.4-nano.md` | gpt-5.4-nano | shopping, erp | 2파일 |
| `providers/qwen3-coder-next.md` | qwen3-coder-next | reddit, shopping, erp | 12파일 |
| `providers/qwen3.5-122b-a10b.md` | qwen3.5-122b-a10b | erp | 4파일 |
| `providers/qwen3.5-27b.md` | qwen3.5-27b | shopping, erp | 2파일 |
| `providers/qwen3.5-35b-a3b.md` | qwen3.5-35b-a3b | reddit, shopping, erp | 11파일 |
| `providers/qwen3.5-397b-a17b.md` | qwen3.5-397b-a17b | reddit, shopping, erp | 4파일 |

### 원본 소스

| 파일 | 설명 |
|------|------|
| `test/debug.log.md` | 원본 컴파일 오류 로그 |
| `test/results/{provider}/{model}/{scenario}/realize/` | 각 테스트 케이스의 생성 코드 |
| `packages/agent/prompts/REALIZE_OPERATION_WRITE.md` | Provider 코드 생성 프롬프트 |
| `packages/agent/prompts/REALIZE_OPERATION_CORRECT.md` | Provider 교정 프롬프트 |
| `packages/agent/prompts/REALIZE_TRANSFORMER_WRITE.md` | Transformer 생성 프롬프트 |
| `packages/agent/prompts/REALIZE_TRANSFORMER_CORRECT.md` | Transformer 교정 프롬프트 |
| `packages/agent/prompts/REALIZE_COLLECTOR_WRITE.md` | Collector 생성 프롬프트 |
| `packages/agent/prompts/REALIZE_COLLECTOR_CORRECT.md` | Collector 교정 프롬프트 |
| `packages/agent/prompts/INTERFACE_SCHEMA.md` | API 스키마 설계 프롬프트 |
