# AutoBE 심층 분석: 파이프라인 아키텍처, Orchestrator, 그리고 컴파일러 시스템

이 리포트에서는 AutoBE 파이프라인의 핵심 엔지니어링을 살펴본다. 5단계 waterfall이 어떻게 구현되어 있는지, 74개의 orchestrator가 계층적 분해와 cached batching을 통해 어떻게 협력하는지, 그리고 세 가지 compiler가 어떻게 자기치유(self-healing) 피드백 루프를 형성하는지를 분석한다. 모든 내용은 실제 코드 분석에 근거한다.

---

## 1. 5단계 Waterfall 파이프라인

### 1.1 단계 순서

AutoBE는 엄격한 waterfall 구조를 따른다: **Analyze** (요구사항 도출) -> **Database** (Prisma 스키마 생성) -> **Interface** (OpenAPI 명세) -> **Test** (E2E 테스트 AST 생성) -> **Realize** (NestJS 구현 코드). 각 단계는 타입이 지정된 history 객체(`AutoBeAnalyzeHistory`, `AutoBeDatabaseHistory` 등)를 생성하여 공유 history 배열에 추가한다.

### 1.2 Step Counter 패턴을 통한 상태 무효화

상태 무효화는 모든 history 객체가 보유하는 `step` 필드를 통해 깔끔하게 해결된다. Analyze 단계가 완료되면 단조 증가하는 step 번호를 발행한다. 모든 하류 history(Database, Interface, Test, Realize)는 생성 시점의 `step` 값을 함께 보유한다.

`transformFacadeStateMessage` 함수(`packages/agent/src/orchestrate/facade/structures/transformFacadeStateMessage.ts`에 위치)는 각 하류 history의 `step`을 최신 Analyze step과 비교하여 단계별 최신 여부를 계산한다:

```typescript
const value = (obj: { step: number } | null) => {
  if (state.analyze === null || obj === null) return "none";
  else if (state.analyze.step === obj.step) return "up-to-date";
  else return "out-of-date";
};
```

이 구조는 자동 연쇄 무효화를 구현한다: Analyze를 다시 실행하면 step counter가 증가하고, 명시적인 의존성 추적 없이도 모든 하류 단계가 즉시 "out-of-date" 상태가 된다. 복잡한 의존성 그래프 문제가 될 수 있었던 것을 O(1)로 해결한 깔끔한 설계이다.

### 1.3 Facade Controller

Facade는 최상위 LLM 대면 인터페이스로, function calling을 통해 파이프라인 단계당 하나씩, 정확히 다섯 개의 함수를 노출한다. `packages/agent/src/orchestrate/facade/createAutoBeFacadeController.ts`에 위치하며, `analyze`, `database`, `interface`, `test`, `realize`라는 이름의 함수들로 구성된 `ILlmController`를 생성한다.

각 함수는 대응하는 orchestrator를 호출한 뒤, 결과를 구조화된 응답으로 매핑한다:

```typescript
analyze: async () => {
  const history = await orchestrateAnalyze(props.context);
  if (history.type === "assistantMessage")
    return { type: "in-progress", description: "..." };
  return { type: "success", description: "..." };
},
```

Facade는 `transformFacadeStateMessage`를 통해 현재 파이프라인 상태를 동적으로 계산하여 system prompt에 주입하며, 이를 통해 LLM이 어떤 단계가 오래된(stale) 것인지, 최신인지, 미실행인지를 실시간으로 파악할 수 있다. 이것이 LLM이 다음에 어떤 함수를 호출할지 자율적으로 결정하는 메커니즘이다.

### 1.4 `createAutoBeState`를 통한 상태 복원

`createAutoBeState` 함수(`packages/agent/src/factory/createAutoBeState.ts`에 위치)는 원시 history 배열로부터 현재 파이프라인 상태를 복원한다. 단 20줄이라는 놀라운 간결함을 보여준다:

```typescript
export const createAutoBeState = (histories: AutoBeHistory[]): AutoBeState => {
  const reversed = histories.slice().reverse();
  return {
    analyze: reversed.find((h) => h.type === "analyze") ?? null,
    database: reversed.find((h) => h.type === "database") ?? null,
    interface: reversed.find((h) => h.type === "interface") ?? null,
    test: reversed.find((h) => h.type === "test") ?? null,
    realize: reversed.find((h) => h.type === "realize") ?? null,
    previousAnalyze: reversed.filter((h) => h.type === "analyze")[1] ?? null,
    previousDatabase: reversed.filter((h) => h.type === "database")[1] ?? null,
    previousInterface: reversed.filter((h) => h.type === "interface")[1] ?? null,
    previousTest: reversed.filter((h) => h.type === "test")[1] ?? null,
    previousRealize: reversed.filter((h) => h.type === "realize")[1] ?? null,
  };
};
```

**성능 참고**: 이 함수는 역순 배열을 10번 순회한다. "previous" 필드의 경우 `.filter()`를 호출해 모든 매칭을 수집한 뒤 인덱스 `[1]`을 취한다. 즉, 배열을 총 10번 순회하되, 그 중 5번은 전체 배열을 스캔하는 filter 연산이다. 타입별 2슬롯 누산기를 사용한 단일 패스 방식이 더 효율적이겠지만, 실제로는 history 배열이 충분히 작아서 병목이 될 가능성은 낮다.

---

## 2. Orchestrator 시스템 (총 74개)

### 2.1 계층적 분해

Orchestrator는 엄격한 계층 구조를 따른다: 최상위 orchestrator가 작업을 하위 orchestrator로 분해하고, 하위 orchestrator는 더 세분화하여, 최종적으로 리프 레벨에서 `ctx.conversate()`를 호출한다. 이 함수는 임시 MicroAgentica agent를 생성하고, 단일 LLM 대화를 실행한 뒤, agent를 폐기한다.

단계별 계층 구조(소스 코드 기반 카운트):

| 단계       | Orchestrator 수 | 주요 예시 |
|------------|-----------------|----------|
| Analyze    | 9               | orchestrateAnalyze, orchestrateAnalyzeWriteSection, orchestrateAnalyzeScenarioReview |
| Prisma     | 10              | orchestratePrisma, orchestratePrismaSchema, orchestratePrismaCorrect |
| Interface  | 20              | orchestrateInterface, orchestrateInterfaceSchemaWrite, orchestrateInterfaceSchemaCasting |
| Test       | 14              | orchestrateTest, orchestrateTestOperationWrite, orchestrateTestCorrectOverall |
| Realize    | 19              | orchestrateRealize, orchestrateRealizeOperationWrite, orchestrateRealizeCollectorPlan |
| Common     | 2               | orchestratePreliminary, orchestrateCommonCorrectCasting |
| Facade     | 1 (+ 4 지원)    | createAutoBeFacadeController |

### 2.2 MicroAgentica 패턴

모든 `ctx.conversate()` 호출(`packages/agent/src/factory/createAutoBeContext.ts`에 정의)은 단일 controller를 가진 새로운 `MicroAgentica` agent를 생성한다:

```typescript
const agent: MicroAgentica = new MicroAgentica({
  vendor: props.vendor,
  config: { ... },
  histories: next.histories,
  controllers: [next.controller],
});
```

각 agent는 임시적이다 -- 하나의 대화 턴을 위해 생성되고 이후 버려진다. 이는 orchestration 간 상태 누출을 방지하고 agent 동작에 대한 추론을 단순화하지만, 객체 생성 오버헤드가 높아지는 단점이 있다.

### 2.3 `executeCachedBatch`: 동시 배치 처리

병렬 처리의 핵심은 `executeCachedBatch`(`packages/agent/src/utils/executeCachedBatch.ts`에 위치)이다. 구현 방식은 다음과 같다:

1. UUID v7을 `promptCacheKey`로 생성한다 (batch 내 모든 task이 공유)
2. `Math.min(semaphore, queue.length)` 크기의 워커 풀을 생성한다
3. 워커들이 `queue.splice(0, 1)`로 공유 큐에서 task을 꺼낸다
4. 어떤 에러든 발생하면 `aborted = true`로 설정하고 큐를 비운다 (fail-fast)
5. 원래 인덱스 순서로 정렬된 결과를 반환한다

`queue.splice(0, 1)` 패턴이 주목할 만하다: JavaScript가 단일 스레드이기 때문에 동시 접근에 안전하다. 각 `await`에서 제어가 양보되고, splice 연산 자체는 이벤트 루프의 단일 tick 내에서 원자적이다. 워커들은 잠금(lock) 대신 이벤트 루프를 통해 협력한다.

**이름 분석**: 이름이 "executeCachedBatch"임에도 불구하고, 이 함수 자체는 어떤 캐싱도 수행하지 않는다. UUID를 생성하여 vendor API에 `prompt_cache_key`로 전달하고, 실제 cache 동작은 vendor에 위임한다. 이름이 오해를 유발할 수 있으며, "executeBatchWithSharedCacheKey"가 더 정확했을 것이다.

### 2.4 동시성 제어

두 가지 동시성 메커니즘이 존재한다:

1. **Semaphore(2)** -- compiler 접근용: `createAutoBeContext`에서 생성되어 `getCriticalCompiler`로 래핑된다. 이 래퍼는 모든 compiler 메서드 호출 주위에 semaphore를 획득/해제하는 proxy를 생성한다. TypeScript/Prisma 컴파일을 동시 2개로 제한한다.

2. **Vendor semaphore** -- LLM API 호출용: `vendor.semaphore`를 통해 설정 가능하며, 기본값은 `AutoBeConfigConstant.SEMAPHORE` (값: 8)이다. `executeCachedBatch`가 동시 LLM 요청을 제한하는 데 사용된다.

`getCriticalCompiler` 구현(`packages/agent/src/factory/getCriticalCompiler.ts`)은 깔끔하다 -- compiler 인터페이스의 모든 메서드를 가로채는 Proxy 스타일 래퍼이다:

```typescript
const lock = async (func: () => Promise<any>) => {
  await critical.acquire();
  try { return await func(); }
  finally { await critical.release(); }
};
```

---

## 3. 컴파일러 시스템

### 3.1 Database Compiler (`AutoBeDatabaseCompiler`)

데이터베이스 검증 레이어(`packages/compiler/src/database/validateDatabaseApplication.ts`, 873줄)는 8개 검증 카테고리를 구현한다:

1. **중복 파일**: 동일한 파일명이 두 번 사용됨
2. **중복 모델**: 파일 간 동일 모델명 존재
3. **중복 필드**: primary/foreign/plain 필드 간 이름 충돌
4. **중복 인덱스**: 동일한 인덱스 정의
5. **유효한 이름**: 예약어 및 식별자 검증
6. **인덱스 검증**: 컬럼 존재 여부, GIN 타입 제약, 상위집합/부분집합 탐지
7. **참조 검증**: 대상 모델 존재 여부, 순환 참조/교차 참조 탐지
8. **중복 관계 반대 이름**: 대상 모델에서의 oppositeName 충돌

에러 메시지의 철저함이 돋보인다 -- AI 소비를 위해 명시적으로 설계되어 있다. 각 메시지는 구조화된 형식을 따른다:

- **무엇이 발생했는가?** -- 구체적 설명
- **왜 문제인가?** -- AI 이해를 위한 근거
- **어떻게 수정하는가?** -- 예시를 포함한 번호 매긴 실행 가능한 단계

예를 들어, 부분집합 유니크 인덱스 에러 메시지는 20줄 이상에 걸쳐 유니크 제약의 수학적 속성을 설명하고, email/name을 사용한 구체적인 예시를 제공하며, 세 가지 상이한 해결 전략을 제시한다. 이러한 수준의 상세함은 의도된 것으로, 컴파일러 에러를 LLM이 자가 교정할 수 있도록 돕는 구조화된 학습 신호로 변환한다.

### 3.2 Interface Compiler (`AutoBeInterfaceCompiler`)

`packages/compiler/src/interface/AutoBeInterfaceCompiler.ts`에 위치하며, 주목할 점은 이것이 검증기(validator)가 아니라 코드 생성기라는 것이다. `AutoBeOpenApi.IDocument`를 입력받아 `NestiaMigrateApplication`을 사용하여 완전한 NestJS 프로젝트로 변환한다:

```typescript
const migrate = new NestiaMigrateApplication(transformOpenApiDocument(document));
const files = migrate.nest({ keyword: true, simulate: true, e2e: true, ... });
```

Interface 단계에 compile-and-validate 단계가 없다는 점이 눈에 띈다. Database에는 `validateDatabaseApplication`이 있고 TypeScript에는 `EmbedEsLint`가 있지만, Interface 단계는 전용 컴파일 단계 없이 `AutoBeOpenApi`의 AST 타입 제약(Typia 검증으로 강제)에 전적으로 의존한다.

### 3.3 TypeScript Compiler (`AutoBeTypeScriptCompiler`)

`packages/compiler/src/AutoBeTypeScriptCompiler.ts`에 위치하며, 다음을 통합한다:

- **EmbedEsLint** (WASM 기반): 샌드박스 환경에서 ESLint 규칙과 함께 TypeScript 컴파일을 실행
- **Strict mode**: `experimentalDecorators`와 `emitDecoratorMetadata`를 포함한 전체 `strict: true`
- **사전 번들된 외부 의존성**: 런타임 설치를 피하기 위해 NestJS 의존성을 `nestjs.json`으로 제공
- **Typia + Nestia 트랜스폼**: 컴파일 중 두 컴파일러 플러그인 모두 적용
- **ESLint 규칙**: `no-floating-promises: "error"`로 처리되지 않은 비동기 연산을 포착

`removeImportStatements` 메서드에는 주목할 만한 폴백 전략이 있다:

```typescript
try {
  // 기본: AST를 파싱하고 ImportDeclaration 노드를 필터링
  const sourceFile = ts.createSourceFile(...);
  // ...
} catch {
  // 폴백: 문자열 수준 beautify + "import " 줄에 대한 정규식 매칭
  script = await this.beautify(script);
  const lines = script.split("\n");
  // "import "로 시작하는 줄을 splice로 제거
}
```

이 2단계 접근법은 LLM 출력에 문법 오류가 포함되어 AST 파싱이 불가능한 경우에 생성된 코드를 처리한다.

### 3.4 자기치유 컴파일 루프

핵심 교정 루프는 다음 패턴을 따른다: **생성 -> 컴파일 -> 진단 -> 필터링 -> 중복 제거 -> 피드백 -> 재생성**.

에스컬레이션 순서에 따라 두 가지 교정 전략이 사용된다:

1. **CorrectCasting** (빠른, 템플릿 기반): `packages/agent/src/orchestrate/common/orchestrateCommonCorrectCasting.ts`의 `orchestrateCommonCorrectCasting`. 실패한 코드와 진단 정보를 받는 `rewrite` 함수를 가진 임시 agent를 생성하고, LLM을 적용하여 교정된 버전을 생성한다. `COMPILER_RETRY = 4`번의 시도를 사용한다.

2. **CorrectOverall** (깊은, RAG 기반): `orchestrateRealizeCorrectOverall`과 `orchestrateTestCorrectOverall` 같은 단계별 orchestrator에서 발견된다. 교정 전에 전체 `AutoBePreliminaryController` RAG 시스템을 사용하여 관련 컨텍스트(데이터베이스 스키마, 인터페이스 연산)를 로드한다. 비용이 더 높지만 넓은 컨텍스트가 필요한 에러를 처리할 수 있다.

CorrectCasting의 `predicate` 함수에는 흥미로운 에러 처리 특이점이 있다:

```typescript
try {
  return await correct(ctx, factory, failures, script, event, life - 1);
} catch (error) {
  console.log("correctCasting", error);
  return await correct(ctx, factory, failures, script, event, life - 2);
}
```

교정 중 에러가 발생하면 `console.log`(적절한 에러 핸들러가 아님)로 로깅하고, `life - 1`이 아닌 `life - 2`로 재시도하여 페널티로 추가 재시도 슬롯을 소비한다. 기능적이지만 비관습적인 에러 에스컬레이션 방식이다.

### 3.5 재시도 상수

| 상수 | 값 | 용도 |
|------|-----|------|
| `VALIDATION_RETRY` | 3 | 일반 LLM 검증 재시도 |
| `COMPILER_RETRY` | 4 | TypeScript 컴파일 교정 |
| `DATABASE_CORRECT_RETRY` | 30 | Prisma 스키마 교정 (연쇄 에러로 인해 높음) |
| `FUNCTION_CALLING_RETRY` | 3 | Function calling 동의 재시도 |
| `ANALYZE_RETRY` | 15 | 분석 단계 재시도 |
| `RAG_LIMIT` | 7 | 최대 RAG 반복 횟수 |
| `TIMEOUT` | 20분 | 연산별 타임아웃 |
| `SEMAPHORE` | 8 | 기본 동시 LLM 호출 수 |
| `ANALYSIS_PAGE_SIZE` | 75 | 분석 섹션 페이지네이션 |

`DATABASE_CORRECT_RETRY = 30`이 눈에 띈다. 문서에서는 이를 정당화한다: "데이터베이스 스키마 교정은 점진적인 경향이 있다 -- 각 반복은 보통 하나 또는 두 개의 이슈를 수정한다." 공격적이지만 Prisma 스키마 에러의 연쇄적 특성을 반영한다: 하나의 외래 키 참조를 수정하면 보통 3-5개의 추가 이슈가 드러난다.

---

## 4. RAG 시스템 (`AutoBePreliminaryController`)

### 4.1 아키텍처

`AutoBePreliminaryController`(`packages/agent/src/orchestrate/common/AutoBePreliminaryController.ts`에 위치)는 LLM 대화를 위한 온디맨드 컨텍스트 로딩을 구현한다. 두 가지 컬렉션을 관리한다:

- **`all`**: 현재 파이프라인 상태에서 사용 가능한 전체 데이터셋 (모든 데이터베이스 스키마, 모든 인터페이스 연산 등)
- **`local`**: 현재 LLM 컨텍스트에 로드된 부분집합

LLM이 추가 컨텍스트가 필요할 때, `process` 함수를 호출하여 `orchestratePreliminary`를 트리거하고 `all`에서 `local`로 추가 항목을 로드한다.

### 4.2 메타데이터 전용 표시 및 온디맨드 로딩

Controller는 LLM에게 사용 가능한 항목의 메타데이터(이름, 요약)만 표시한다. LLM이 이름으로 특정 항목을 요청하면 전체 데이터가 `local`에 로드된다. 이를 통해 전체 데이터셋에 대한 인식을 유지하면서도 컨텍스트 오버플로를 방지한다.

### 4.3 반복 제한

`RAG_LIMIT = 7`로 최대 반복 횟수를 제한한다. 소진되면 controller는 `AutoBePreliminaryExhaustedError`를 던진다. `ANALYSIS_PAGE_SIZE = 75`의 분석 섹션 페이지네이션은 LLM에게 한 번에 너무 많은 섹션 메타데이터가 제공되는 것을 방지한다.

### 4.4 자동 보완

생성자에서 `complementPreliminaryCollection`을 호출하여 선행 데이터와 `$ref` 의존성을 자동으로 로드한다. LLM이 Schema B를 `$ref`로 참조하는 Schema A를 요청하면, Schema B도 자동으로 함께 로드된다.

---

## 5. 코드 품질 평가

### 5.1 잘 만든 점

- **Step counter 무효화**: 명시적 의존성 추적 없이 O(1) 연쇄 무효화를 구현한 우아한 설계
- **Discriminated union 이벤트**: mapper 패턴을 통한 컴파일 타임 타입 안전성을 갖춘 70개 이벤트 타입
- **Semaphore proxy 패턴**: compiler 인터페이스를 수정하지 않는 깔끔한 동시성 제어
- **점진적 템플릿 계층화**: CorrectCasting (빠른) -> CorrectOverall (깊은) 교정 전략
- **AI에 최적화된 에러 메시지**: 학습 신호로 구조화된 컴파일러 진단
- **`executeCachedBatch` 큐 패턴**: JavaScript의 단일 스레드 특성을 활용한 잠금 없는 동시 실행

### 5.2 아쉬운 점

- **주석 처리된 코드**: `supportFunctionCallFallback`이 `createAutoBeContext.ts`와 `consentFunctionCall.ts` 양쪽에서 import된 직후 주석 처리되어 있다. 삭제하거나 설정 플래그로 제어해야 한다.

- **`const enum`과 `isolatedModules`**: `AutoBeConfigConstant`가 `const enum`을 사용하는데, 이는 일부 번들러가 요구하는 `isolatedModules` 모드와 호환되지 않는다. 소비 패키지에서 빌드 이슈를 유발할 수 있다.

- **에러에 `console.log` 사용**: `orchestrateCommonCorrectCasting.ts`의 교정 루프에서 에러 보고에 `console.log("correctCasting", error)`를 사용한다. 구조화된 에러 이벤트나 적절한 로깅 프레임워크가 더 적합하다.

- **에러 삼킴**: `createAutoBeContext.ts` 전반에 걸쳐 `.catch(() => {})` 패턴으로 dispatch 에러가 조용히 삼켜진다. 파이프라인 크래시를 방지하는 효과가 있지만, dispatch 에러가 투명하지 않게 된다.

- **공격적인 사용자 지시문**: `enforceFunctionCall` 메커니즘이 사용자 메시지에 강압적인 언어("Never hesitate", "Just do it without any explanation")를 추가하며, 재시도 메시지는 더 에스컬레이션된다("You failed to call any function"). 효과적이기는 하지만 모델 의존적이어서 취약하다.

- **Interface 단계 컴파일 부재**: Database(`validateDatabaseApplication`)와 TypeScript(`EmbedEsLint`)와 달리, Interface 단계에는 전용 validator가 없다. 스키마 정확성은 `AutoBeOpenApi` 타입의 Typia 런타임 검증에만 의존한다.

- **대형 파일**: `orchestrateAnalyze.ts`가 1,750줄에 달한다. 최상위 문서화의 이점이 있지만, 순수한 크기 자체가 추론을 어렵게 만든다.

- **분산된 매직 넘버**: `createAutoBeContext.ts`의 `Semaphore(2)` 같은 상수들이 `AutoBeConfigConstant`에 이름 지정되거나 중앙 집중화되지 않았다.

- **일관성 없는 함수 스타일**: 일부 orchestrator는 커링 방식(`orchestrateInterface`가 함수를 반환)이고, 다른 것들은 직접 방식(`orchestrateAnalyze`가 context를 직접 받음)이다. 이 불일치로 인해 호출자가 단계별 호출 규약을 알아야 한다.

### 5.3 기술 부채 지표

- **`process.env` 디버그 플래그**: 리뷰한 파일에서는 관찰되지 않았지만, 아키텍처 문서에서 참조됨
- **`biome-ignore` 억제**: agent 패키지 전체에 39건 발생, 대부분 "intended"로 주석 처리되어 있으나 상세한 사유가 없음
- **`as any` 캐스트**: agent 패키지에 25건, 인프라 코드(discriminated union에 대한 동적 속성 접근, satisfies 제약을 위한 타입 레벨 해킹)에 국한됨
- **상태 변이**: `validateDatabaseApplication.ts`의 `validateIndexes`가 `model.uniqueIndexes`와 `model.plainIndexes`를 재할당하여 입력 모델을 변이시킴(641-650줄). 검증 함수에서 예상치 못한 동작이다.

---

## 6. 요약

AutoBE의 파이프라인 아키텍처는 정교한 엔지니어링의 산물이다. 상태 무효화를 위한 step counter 패턴은 특히 우아하다 -- 단순하고, 정확하며, O(1)이다. 74개의 orchestrator 계층은 명확한 관심사 분리를 제공하고, `executeCachedBatch` 패턴은 JavaScript의 동시성 모델을 사려 깊게 활용한 것을 보여준다.

컴파일러 시스템의 가장 뛰어난 특징은 AI에 최적화된 에러 메시지이다: 간결한 컴파일러 에러가 아닌, 학습 신호로 구조화된 다단락 진단 정보이다. 이것이 자기치유 루프를 "될 때까지 재시도"에서 "LLM에게 무엇이 잘못되었는지 가르치기"로 변환한다.

주요 약점은 아키텍처적이라기보다 조직적이다: 이해를 방해하는 대형 파일, 단계 간 일관성 없는 함수 시그니처, 그리고 철저한 것(데이터베이스 검증)부터 부재한 것(`.catch(() => {})`)까지 범위가 넓은 에러 처리. 데이터베이스 교정의 30회 재시도 제한은 공격적이지만 스키마 에러의 연쇄적 특성으로 정당화된다. Interface 컴파일 단계의 부재는 특정 종류의 OpenAPI 불일치가 TypeScript 컴파일 단계까지 도달할 수 있는 간극이며, 그 단계에서는 진단이 더 어려워진다.
