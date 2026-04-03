# AutoBE 심층 분석: History Transformer, 캐싱 전략, 그리고 시스템 프롬프트

이 리포트에서는 AutoBE가 History Transformer 시스템을 통해 LLM 컨텍스트를 어떻게 구성하는지, prompt caching을 통해 88% 비용 절감을 달성했다고 주장하는 방식, 88개 시스템 프롬프트가 어떻게 조직되어 있는지, 그리고 이벤트 시스템이 어떻게 타입 안전한 실시간 텔레메트리를 제공하는지 살펴본다. 모든 내용은 실제 코드 분석에 근거한다.

---

## 1. History Transformer 시스템 (총 60개)

### 1.1 구성

History transformer는 각 orchestrator와 함께 `histories/` 하위 디렉터리에 배치되어 있다. 단계별 분포는 다음과 같다:

| 단계      | Transformer 수 |
|-----------|----------------|
| Analyze   | 8              |
| Common    | 3              |
| Facade    | 1              |
| Interface | 19             |
| Prisma    | 9              |
| Realize   | 12             |
| Test      | 8              |

### 1.2 `IAutoBeOrchestrateHistory` 규약

모든 transformer는 단순한 형태의 `IAutoBeOrchestrateHistory`를 반환한다:

```typescript
{
  histories: IMicroAgenticaHistoryJson[];  // [systemMessage, ...context, userMessage]
  userMessage: string;
}
```

`histories` 배열은 일관된 구조를 따른다: 단계별 시스템 프롬프트를 담은 `systemMessage`로 시작하고, 이어서 0개 이상의 컨텍스트 메시지(데이터를 담은 assistant 메시지, RAG 결과를 담은 execute 메시지)가 오며, `userMessage` 필드는 LLM 대화를 트리거하는 최종 사용자 메시지를 제공한다.

### 1.3 선택적 컨텍스트 조립

Transformer 시스템의 강점은 *제외하는 것*에 있다. 각 transformer는 해당 orchestration 단계에 필요한 정확한 컨텍스트만 선별하는 커스텀 함수이다.

**예시: `transformInterfaceSchemaWriteHistory`** (`packages/agent/src/orchestrate/interface/histories/transformInterfaceSchemaWriteHistory.ts`에 위치)

이 transformer는 단일 JSON 스키마 컴포넌트를 작성하기 위한 컨텍스트를 조립한다. 포함하는 것:
- `INTERFACE_SCHEMA` 시스템 프롬프트
- RAG로 로드된 예비 컨텍스트 (데이터베이스 스키마, 인터페이스 연산, 분석 섹션 -- LLM이 요청한 항목만)
- 대상 스키마 타입을 직접 참조하는 연산의 필터링된 목록
- `$ref` 참조에 사용 가능한 다른 DTO 타입명
- 생성할 특정 타입명

의도적으로 제외하는 것: 전체 대화 이력, 관련 없는 연산, 테스트 코드, 구현 코드, 그리고 대상 타입과 무관한 데이터베이스 스키마. 이러한 공격적인 필터링은 컨텍스트 윈도우를 집중시킨다.

**예시: `transformAnalyzeWriteSectionHistory`** (`packages/agent/src/orchestrate/analyze/histories/transformAnalyzeWriteSectionHistory.ts`에 위치)

이 transformer는 다음을 포함한다:
- `ANALYZE_WRITE_SECTION` 시스템 프롬프트
- 원본 사용자 요구사항 (텍스트 콘텐츠만 필터링)
- 권위 있는 범위 참조 (actors, entities, prefix)
- 파일 범위 컨텍스트 (6개 SRS 파일 중 어느 것을 작성 중인지)
- 상위 모듈 및 유닛 컨텍스트
- 형제 유닛 요약 (중복 인식용)
- 이전 시도 피드백 (재시도인 경우)

제외하는 것: 데이터베이스 스키마, 인터페이스 정의, 테스트 코드, 현재 섹션과 무관한 이전 분석 반복.

### 1.4 "180KB에서 8KB로" 주장: RAG를 통한 컨텍스트 압축

문서에서는 극적인 컨텍스트 크기 감소를 언급한다. 이것은 정적 압축이 아니다. `AutoBePreliminaryController` RAG 시스템을 통해 동작하며, LLM에게는 메타데이터(이름, 컴팩트 테이블 형태의 요약)만 보여주고 전체 데이터는 온디맨드로 로드한다.

예를 들어, 80개의 데이터베이스 스키마가 있는 프로젝트에서 LLM은 처음에 다음과 같이 본다:

```
Name | Belonged Group | Stance | Summary
-----|----------------|--------|---------
user | auth | actor | Authenticated user account...
order | commerce | primary | Customer purchase record...
```

LLM이 이름으로 특정 스키마를 요청하면, 전체 AST 또는 Prisma 텍스트가 컨텍스트에 로드된다. 일반적인 orchestration 단계에서는 80개 중 3-5개 스키마를 로드하므로, 압축이 아닌 선택적 로딩을 통해 실질적인 컨텍스트 감소를 달성한다.

---

## 2. 시스템 프롬프트 (88개 파일)

### 2.1 목록

`packages/agent/prompts/` 디렉터리에는 모든 orchestration 단계를 포함하는 88개의 마크다운 파일이 있다. 구성은 다음과 같다:

- **Facade**: 1개 (`AGENTICA_FACADE.md`)
- **Analyze**: 9개 (시나리오, 리뷰, 섹션/유닛/모듈 작성, 결정 추출 등)
- **Database/Prisma**: 7개 (그룹, 컴포넌트, 스키마, 인가, 교정, 리뷰)
- **Interface**: 16개 (그룹, 연산, 엔드포인트, 스키마 변형, 인가, 선행, 캐스팅, 보완, 이름 변경, 리뷰, 분리, 정제)
- **Test**: 10개 (시나리오, 작성 변형, 교정 변형, 리뷰)
- **Realize**: 13개 (연산 작성, collector/transformer 계획 및 작성, 인가, 멤버십 흐름, 교정 변형)
- **Preliminary/RAG**: 18개 (분석 섹션, 데이터베이스 스키마, 인터페이스 연산/스키마, realize collector/transformer -- 각각 loaded, exhausted, previous 변형 포함)
- **Common**: 3개 (consent function call, correct casting, missing schema 변형)
- **Image**: 1개 (image describe draft)

### 2.2 구조 패턴

대부분의 프롬프트는 일관된 구조를 따른다:

1. **역할 선언**: "You are a specialized {X} agent" -- 강한 정체성 프레이밍
2. **의무**: "Function calling is MANDATORY" -- 88개 프롬프트 중 49개에서 발견
3. **빠른 참조 테이블**: LLM을 위한 컴팩트한 결정 테이블
4. **규칙과 제약**: 번호 매긴 해야 할 것/하지 말아야 할 것 목록
5. **금지 행위**: 명시적 환각 방지 목록
6. **AST 스키마 참조**: 예상 출력에 대한 인라인 타입 정의
7. **Function Calling 프로토콜**: 예시를 포함한 예상 FC 패턴
8. **계획 템플릿**: 단계별 추론 스캐폴딩
9. **종료 체크리스트**: 최종 검증 기준

### 2.3 잘 만든 점

- **풍부한 예시**: 프롬프트에 올바른 동작과 잘못된 동작을 보여주는 10-20개 이상의 예시가 자주 포함된다. `INTERFACE_SCHEMA.md` 프롬프트(489줄)가 특히 철저하여, 적절한 `$ref` 사용법, 배열 항목 제약, nullable 타입 패턴에 대한 광범위한 예시를 포함한다.

- **구조화된 결정 테이블**: 산문 대신 많은 프롬프트가 마크다운 테이블로 결정 규칙을 인코딩한다 (예: "stance가 'primary'이면 CRUD 엔드포인트 생성; 'subsidiary'이면 중첩 엔드포인트만 생성").

- **긍정적 지시문**: 프롬프트가 "do Y"가 아닌 "do X" 형태를 일관되게 사용하며, 이는 경험적으로 LLM의 지시 준수에 더 효과적이다.

- **종료 체크리스트**: 대부분의 프롬프트가 출력 완료 전에 LLM이 확인해야 할 번호 매긴 체크리스트로 마무리되어, 일반적인 오류를 줄인다.

### 2.4 아쉬운 점

- **극단적인 길이 편차**: `INTERFACE_SCHEMA.md`는 489줄인 반면, 단순한 프롬프트는 30-50줄이다. 가장 긴 프롬프트는 LLM의 효과적인 주의 범위를 초과할 위험이 있다.

- **프롬프트 간 중복**: "Function calling is MANDATORY" 의무가 49개 프롬프트에 나타난다. 반복이 강화 효과를 줄 수 있지만, 49개 파일에 걸쳐 완전히 동일한 상용구 텍스트가 복제되면 유지보수 부담을 만든다. 공유 전문(preamble)이 더 깔끔하다.

- **템플릿 변수 불일치**: 두 가지 다른 템플릿 구문이 사용된다:
  - `{{CONTENT}}`, `{{AVAILABLE}}`, `{{LOADED}}` -- 18개 preliminary 프롬프트에서 `String.replaceAll()`을 통해 사용
  - `{% STATE %}` -- 정확히 1개 프롬프트(`AGENTICA_FACADE.md`)에서 `.replace()`를 통해 사용

  이 불일치로 인해 개발자가 어떤 구문이 예상되는지 알려면 각 프롬프트의 대응 transformer를 확인해야 한다. Preliminary 프롬프트에서는 `{{PREFIX}}`, `{{ACTORS}}`, `{{PREVIOUS}}` 변수도 사용한다.

- **핵심 지시의 매몰**: 긴 프롬프트에서 핵심적인 제약이 수백 줄 중간에 나타나는 경우가 있어, LLM이 통계적으로 이를 따를 확률이 낮아진다. 가장 중요한 지시는 프롬프트의 시작과 끝에 배치해야 한다.

### 2.5 빌드 프로세스

`build:prompt` 프로세스는 각 `.md` 파일을 읽고, CRLF 줄 끝을 제거한 뒤, 내용을 `AutoBeSystemPromptConstant.ts`의 TypeScript `const enum` 멤버로 래핑한다. `const enum` 값은 컴파일 타임에 인라인되므로, 프롬프트 문자열이 런타임 오버헤드 없이 컴파일된 출력에 직접 임베드된다.

---

## 3. 캐싱 전략

### 3.1 `executeCachedBatch`의 동작 방식

이 함수(`packages/agent/src/utils/executeCachedBatch.ts`에 위치)는 공유 `promptCacheKey`로 UUID v7을 생성한 뒤, 모든 task을 즉시 워커 풀로 전달한다:

```typescript
promptCacheKey ??= v7();
// ...
await Promise.allSettled(
  new Array(Math.min(semaphore, queue.length)).fill(0).map(async () => {
    while (queue.length !== 0 && !aborted) {
      const item = queue.splice(0, 1)[0]!;
      const result = await item.first(promptCacheKey!);
      // ...
    }
  }),
);
```

모든 task이 워커 풀에 동시에 전달된다(semaphore 한도까지). "첫 번째 task을 순차 실행하고 나머지를 병렬 실행"하는 동작은 없다. 캐싱은 전적으로 vendor가 요청 본문의 공유 `prompt_cache_key`를 인식하는 것에 의존한다.

### 3.2 Vendor 위임 캐싱

Cache key는 `createAutoBeContext.ts`에서 LLM API 요청에 주입된다:

```typescript
agent.on("request", async (event) => {
  if (next.promptCacheKey)
    event.body.prompt_cache_key = next.promptCacheKey;
});
```

이것은 Anthropic의 `cache_control` block annotation 패턴이 아니다. 코드베이스 어디에도 `{ _cache: { type: "ephemeral" } }` 블록이 없다. 캐싱은 전적으로 키 기반이며 vendor에 위임된다 -- AutoBE가 키를 보내면, vendor(아마도 OpenRouter 또는 커스텀 프록시)가 cache 해석을 처리할 것으로 기대한다.

### 3.3 88% 비용 절감 주장

수학적 근거: 동일한 시스템 프롬프트를 공유하는 N개의 task batch에서, 공유 prefix가 고유 suffix보다 5배 길고 캐시된 토큰 비용이 90% 저렴하다면:

- 캐싱 없이: N * (shared + unique) 토큰
- 캐싱 시: 1 * shared + N * unique + (N-1) * shared * 0.1 토큰
- N=50, shared=10K, unique=2K인 경우: 절감율 = ~82-88%

대규모 batch에서 그럴듯하지만 **검증되지 않았다** -- AutoBE는 cache hit 메트릭을 수집하지 않는다. 실제 cache hit 비율, 캐시된 vs. 캐시되지 않은 토큰 가격, UUID 기반 cache key 접근 방식의 vendor별 효과를 측정하는 계측이 없다.

### 3.4 문서와의 모순

프로젝트 문서(`OPTIMIZATION.md`, `CLAUDE.md`)에서는 "첫 번째 task을 순차 실행(cache 확립), 나머지를 병렬 실행"이라고 주장한다. 실제 구현은 모든 task을 동시에 전달한다. 이것은 중대한 문서 부정확성이다: 코드는 병렬 요청을 시작하기 전에 cache 항목을 확립하기 위해 첫 번째 요청을 직렬화하려는 어떤 시도도 하지 않는다.

이것이 중요한지는 vendor 구현에 달려 있다. 일부 vendor는 cache 항목을 비동기적으로 확립하여 첫 번째 직렬화 최적화가 불필요할 수 있다. 하지만 문서는 실제 동작을 반영해야 한다.

---

## 4. 이벤트 시스템 (70개 타입)

### 4.1 Discriminated Union 아키텍처

`AutoBeEvent` 타입(`packages/interface/src/events/AutoBeEvent.ts`에 위치)은 70개 이벤트 타입의 discriminated union으로, 문서화된 "65+ 이벤트 타입"을 초과한다. 각 이벤트는 `type` 문자열 discriminator를 보유한다.

### 4.2 Mapper 패턴

Mapper 패턴은 컴파일 타임 문자열-타입 매핑을 제공한다:

```typescript
export type Mapper = {
  [E in AutoBeEvent as E["type"]]: E;
};
```

이를 통해 `AutoBeEvent.Mapper["analyzeComplete"]`가 컴파일 타임에 `AutoBeAnalyzeCompleteEvent`로 해석되어, 타입 안전한 이벤트 핸들러를 가능하게 한다:

```typescript
function handle<T extends AutoBeEvent.Type>(
  type: T,
  handler: (event: AutoBeEvent.Mapper[T]) => void
)
```

### 4.3 `AutoBeEventSource`: 이벤트 타입에서 파생

`AutoBeEventSource` 타입(`packages/interface/src/events/AutoBeEventSource.ts`에 위치)은 특정 이벤트 인터페이스에서 `type` 필드를 추출하여 구성된다:

```typescript
export type AutoBeEventSource =
  | "facade"
  | AutoBePreliminaryEvent["type"]
  | AutoBeAnalyzeScenarioEvent["type"]
  // ...
  | AutoBeRealizeAuthorizationCorrectEvent["type"];
```

이를 통해 `AutoBeEventSource`가 이벤트 타입과 자동으로 동기화된다 -- 새 이벤트 타입을 추가하면 소스 타입도 그에 따라 업데이트된다. 그러나 이것은 명시적으로 나열된 이벤트에만 작동한다. 개발자가 `AutoBeEvent` union에 새 이벤트를 추가하되 `AutoBeEventSource`에 추가하는 것을 잊으면, 소스 타입이 조용히 불완전해진다.

### 4.4 RPC 통합

이벤트는 깔끔한 dispatch 체인을 통해 흐른다:

1. Orchestrator가 `ctx.dispatch(event)`를 호출
2. `createAutoBeContext.ts`의 `createDispatch` 클로저가 완료 이벤트를 가로채고, history 항목을 생성하며, history 배열에 push하고, 상태를 업데이트
3. 원시 이벤트가 `props.dispatch(event).catch(() => {})`를 통해 전달
4. RPC 컨텍스트에서 `props.dispatch`가 WebSocket을 통해 클라이언트에 이벤트를 전송
5. 클라이언트가 수신된 이벤트로부터 상태를 재구성

---

## 5. 비평적 평가

### 5.1 인상적인 설계

- **일관된 transformer 규약**: 모든 transformer가 동일한 `IAutoBeOrchestrateHistory` 형태를 반환하여, 시스템을 예측 가능하고 테스트 가능하게 만든다. 새 transformer는 확립된 패턴을 따른다.

- **타입 안전 이벤트 매핑**: `Mapper` 패턴이 이벤트 핸들러에서의 런타임 타입 단언을 제거한다. TypeScript가 컴파일 타임에 정확성을 강제한다.

- **Function calling 캡처를 위한 IPointer 패턴**: 코드베이스 전반에서 `tstl`의 `IPointer<T>`가 function calling 결과를 캡처하는 데 사용된다:
  ```typescript
  const pointer: IPointer<Result | null> = { value: null };
  // ... pointer.value를 설정하는 콜백으로 agent 설정
  await agent.conversate(message);
  if (pointer.value === null) throw new Error("...");
  ```
  이것은 콜백 피라미드 없이 LLM function call에서 구조화된 데이터를 추출하는 깔끔한 패턴이다.

- **이벤트 기반 상태 복원**: 이벤트 스트림으로부터 전체 파이프라인 상태를 재구성할 수 있어, 크래시 후 재개와 이벤트 리플레이를 통한 디버깅을 가능하게 한다.

- **선택적 컨텍스트 조립**: 각 transformer가 컨텍스트 윈도우에 모든 것을 쏟아붓는 대신, 필요한 컨텍스트만 정확히 큐레이션하는 맞춤 함수이다. 이것이 시스템에서 가장 중요한 비용 최적화이다.

### 5.2 아쉬운 점

- **`executeCachedBatch` 이름이 오해를 유발한다**: 이 함수는 어떤 것도 캐시하지 않는다. UUID를 생성하여 vendor에 cache key로 전달할 뿐이다. 이름이 함수 자체가 캐싱 시맨틱을 제공하는 것처럼 암시한다.

- **첫 번째 순차 실행 강제 없음**: 문서에서는 첫 번째 task이 cache 항목을 확립하기 위해 순차적으로 실행된다고 주장하지만, 코드는 모든 task을 병렬로 전달한다. 이 문서-코드 불일치는 잘못된 최적화 가정으로 이어질 수 있다.

- **Cache 메트릭 없음**: Cache hit 비율을 측정하는 계측이 없다. 메트릭이 없으면 88% 비용 절감 주장은 측정된 결과가 아니라 수학적 투영에 불과하다. Anthropic 응답의 `cache_read_input_tokens`와 `input_tokens`의 간단한 카운터 추가만으로도 주장을 검증할 수 있다.

- **`biome-ignore` 억제**: Agent 패키지에 39건 발생, 거의 모두 정보가 없는 "intended"라는 사유로 주석 처리되어 있다. 예시:
  ```typescript
  // biome-ignore lint: intended
  props.state()[props.history.type] = props.history as any;
  ```
  이것은 타입 시스템의 한계를 해결하기보다 우회하고 있음을 시사한다.

- **`.catch(() => {})`를 통한 에러 삼킴**: `createAutoBeContext.ts` 전반에서 dispatch 에러가 조용히 삼켜진다:
  ```typescript
  void props.dispatch(event).catch(() => {});
  ```
  최소한 진단 채널에 로깅해야 한다. Dispatch 실패는 연결이 끊긴 WebSocket 클라이언트를 나타낼 수 있으며, 시스템이 계속 진행하기로 결정하더라도 이를 인식해야 한다.

- **템플릿 변수 불일치**: 프롬프트 간에 `{{VAR}}`와 `{% VAR %}` 구문을 혼용하면 인지 부하가 생긴다. `{{VAR}}` 패턴은 transformer 코드에서 `String.replaceAll()`을 사용하고, `{% VAR %}`는 facade 코드에서 `.replace()`를 사용한다. 통합된 템플릿 엔진(단순한 것이라도)이 유지보수성을 개선할 것이다.

- **공격적인 동의 재시도 메시지**: 동의/재시도 시스템이 강압적인 언어로 에스컬레이션된다:
  ```
  "You failed to call any function. You MUST call one of these functions immediately.
   Do not explain anything. Just call the function right now."
  ```
  Function calling을 강제하는 데 효과적이지만, 모델 의존적이며 지시를 다르게 처리하는 미래 모델 버전에서는 효과가 떨어지거나 역효과를 낼 수 있다.

- **Transformer의 주석 처리된 코드**: `transformPreliminaryHistory.ts`의 `createFunctionCallingMessage` 함수에 15줄의 주석 처리된 대안 구현이 포함되어, `execute`와 `assistantMessage` history 타입 간 진행 중인 실험을 시사한다. 이를 정리하고 죽은 코드를 제거해야 한다.

### 5.3 Transformer와 캐싱의 관계

Transformer 시스템과 캐싱 전략은 함께 작동하지만 더 잘 협력할 수 있다. 현재 구조:

1. Transformer가 위치 [0]에 system message가 있는 history를 생성한다
2. `executeCachedBatch`가 batch 내 모든 task에 UUID를 공유한다
3. Vendor가 공유 prefix(시스템 프롬프트 + 공통 컨텍스트)를 캐시할 것으로 기대한다

이것의 효과는 전적으로 실제로 얼마나 많은 prefix가 공유되는지에 달려 있다. 단일 `executeCachedBatch` 호출 내에서(예: 20개 타입에 대한 스키마 생성), 모든 task이 동일한 시스템 프롬프트를 공유하지만 서로 다른 컨텍스트 메시지를 가진다. 따라서 공유 prefix 길이는 시스템 프롬프트 자체로 제한되며, 이는 전체 컨텍스트보다 상당히 짧을 수 있다.

더 공격적인 캐싱 전략은 공유 prefix 길이를 극대화하도록 history를 구조화할 것이다 -- 예를 들어, task별 콘텐츠 전에 모든 공유 컨텍스트를 배치하는 것이다. 현재 transformer 아키텍처는 이 순서를 강제하지 않는다.

---

## 6. 요약

AutoBE의 컨텍스트 관리 시스템은 아키텍처적으로 건전하다. Orchestration 단계별 맞춤 컨텍스트 조립이라는 transformer 시스템의 접근법은 LLM 성능(집중된 컨텍스트)과 비용(작은 컨텍스트 윈도우) 양면에서 가장 영향력 있는 최적화이다.

88개 시스템 프롬프트는 상당한 프롬프트 엔지니어링 투자를 보여주며, 일관된 구조, 풍부한 예시, 효과적인 결정 테이블 활용이 돋보인다. 주요 약점은 조직적이다: 프롬프트 간 중복된 상용구, 일관성 없는 템플릿 구문, 극단적인 길이 편차.

캐싱 전략은 이론적으로 그럴듯하지만 실제로 검증되지 않았다. 순차 우선 실행에 관한 문서-코드 불일치는 해결해야 할 명확한 이슈이다. 가장 중요한 것은, cache hit 메트릭의 부재로 시스템이 측정이 아닌 믿음에 기반하여 운영된다는 점이다. 실제 cache 절감을 검증하는 계측 추가는 높은 가치와 낮은 노력의 개선이 될 것이다.

이벤트 시스템은 검토된 하위 시스템 중 가장 깔끔하다: mapper 패턴, 파생된 소스 타입, dispatch 체인이 잘 설계되어 있어 아키텍처적 변경이 필요 없다. 70개 이벤트 타입은 컴파일 타임 타입 안전성과 함께 포괄적인 파이프라인 텔레메트리를 제공한다.
