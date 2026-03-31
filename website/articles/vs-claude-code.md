# AutoBE vs Claude Code: 2세대 코드 어시스턴트와 3세대 자율 에이전트의 해부

> 2026년 4월, Claude Code의 소스코드가 npm publish 시 js.map 포함 사고로 만천하에 공개되었다.
> AutoBE는 처음부터 오픈소스였다.
> 이 보고서는 양쪽의 소스코드를 직접 분석하여, 두 프로젝트의 설계 철학과 아키텍처를 비교한다.

---

## 목차

1. [두 프로젝트의 정체성](#1-두-프로젝트의-정체성)
2. [아키텍처 비교: 전혀 다른 두 개의 세계관](#2-아키텍처-비교-전혀-다른-두-개의-세계관)
3. [에이전트 루프: 대화형 vs 파이프라인형](#3-에이전트-루프-대화형-vs-파이프라인형)
4. [도구 시스템: 범용 vs 전용](#4-도구-시스템-범용-vs-전용)
5. [컴파일러와 검증: 최선의 노력 vs 100% 보장](#5-컴파일러와-검증-최선의-노력-vs-100-보장)
6. [컨텍스트 관리: 압축의 예술 vs 변환의 정밀함](#6-컨텍스트-관리-압축의-예술-vs-변환의-정밀함)
7. [에러 회복: 재시도 vs 자가치유](#7-에러-회복-재시도-vs-자가치유)
8. [Function Calling: 자유도 vs 제약의 미학](#8-function-calling-자유도-vs-제약의-미학)
9. [상태 관리: Redux 패턴 vs Step Counter 패턴](#9-상태-관리-redux-패턴-vs-step-counter-패턴)
10. [2세대와 3세대, 그 경계에 대하여](#10-2세대와-3세대-그-경계에-대하여)
11. [AutoBE가 Claude Code로부터 배울 것들](#11-autobe가-claude-code로부터-배울-것들)
12. [Claude Code가 AutoBE로부터 배울 것들](#12-claude-code가-autobe로부터-배울-것들)
13. [결론: 수렴과 분기](#13-결론-수렴과-분기)

---

## 1. 두 프로젝트의 정체성

### Claude Code: 사람 옆에 앉은 시니어 개발자

Claude Code는 Anthropic이 만든 CLI 기반 코딩 어시스턴트다. TypeScript + Bun으로 빌드되었고, React/Ink로 터미널 UI를 렌더링한다. 약 512,000줄, 1,900개 파일, 301개 디렉터리로 구성된 대규모 코드베이스다.

핵심 설계 사상은 **"사람과의 협업"**이다. 사용자가 질문하면 답하고, 파일을 읽어달라 하면 읽고, 코드를 고쳐달라 하면 고친다. 40개 이상의 범용 도구(파일 읽기, 쓰기, 검색, 셸 실행, 웹 검색 등)를 갖추고, 매 턴마다 어떤 도구를 쓸지 LLM이 자율적으로 결정한다.

이것은 본질적으로 **대화형 에이전트**다. 사용자의 의도를 이해하고, 적절한 도구를 선택하며, 결과를 보고한다. `while(true)` 루프 안에서 `callModel → extractToolCalls → executeTools → appendResults → repeat` 순환이 돈다.

### AutoBE: 0에서 100까지 혼자 다 하는 백엔드 공장

AutoBE는 wrtnlabs가 만든 AI 기반 백엔드 코드 생성 시스템이다. 사용자가 "쇼핑몰 백엔드를 만들어줘"라고 말하면, 요구사항 분석부터 데이터베이스 설계, API 명세, E2E 테스트, NestJS 구현체까지 통째로 생성한다. 100% 컴파일 보장.

핵심 설계 사상은 **"결정론적 검증 루프로 확률적 모델을 감싸기"**다. LLM은 확률적으로 코드를 생성하지만, 컴파일러가 결정론적으로 검증한다. 틀리면 진단을 추출하여 LLM에게 돌려주고, 맞을 때까지 반복한다.

5단계 워터폴 파이프라인(Analyze → Database → Interface → Test → Realize)에 40개 이상의 전문 에이전트가 협업한다. 각 단계마다 내부에 나선형(spiral) 루프가 돌면서 자가 교정한다.

---

## 2. 아키텍처 비교: 전혀 다른 두 개의 세계관

### Claude Code의 구조

```
사용자 ←→ [React/Ink UI]
              ↕
         [QueryEngine] ─→ Claude API
              ↕
    [StreamingToolExecutor]
         ↕        ↕        ↕
    [BashTool] [ReadTool] [EditTool] ... (40+ tools)
              ↕
    [Permission System] ─→ [Auto-approval Classifier]
              ↕
    [Context Manager] ─→ [Compaction] / [Memory] / [LSP]
```

**단일 에이전트, 범용 도구 풀.** 하나의 `QueryEngine`이 하나의 LLM 세션을 운영한다. 도구는 파일 I/O, 셸, 웹, 노트북, LSP 등 범용적이며, LLM이 매 턴 자율적으로 선택한다.

### AutoBE의 구조

```
사용자 ←→ [RPC Service] ←WebSocket→ [UI]
              ↕
         [AutoBeAgent] (Facade Controller)
              ↕
    [MicroAgentica] × N (Task-specific disposable agents)
         ↕              ↕              ↕
    [Orchestrator]  [Orchestrator]  [Orchestrator]
         ↕              ↕              ↕
    [Compiler]     [Compiler]     [Compiler]
    (Prisma)       (OpenAPI)      (TypeScript)
         ↕              ↕              ↕
    [History Transformer] ─→ Prompt Cache Optimization
              ↕
    [Event System] ─→ 65+ typed events ─→ Real-time UI
```

**다중 에이전트, 전용 오케스트레이터.** 하나의 `AutoBeAgent`가 Facade를 통해 5개 함수(`analyze`, `database`, `interface`, `test`, `realize`)를 노출한다. 각 함수 뒤에는 전문화된 오케스트레이터 체인이 있고, 각 오케스트레이터는 일회용 `MicroAgentica` 인스턴스를 생성하여 작업을 수행한다.

### 핵심 차이

| 차원 | Claude Code | AutoBE |
|------|-------------|--------|
| **에이전트 수명** | 세션 전체 유지 (persistent) | 작업당 생성·폐기 (disposable) |
| **도구 선택** | LLM이 매 턴 자율 결정 | 오케스트레이터가 사전 결정 |
| **출력 단위** | 파일 편집, 셸 명령 | 전체 애플리케이션 |
| **검증 방식** | LSP 진단 + 사용자 확인 | 3단계 컴파일러 파이프라인 |
| **상호작용** | 실시간 턴 기반 대화 | 비동기 파이프라인 + 이벤트 스트리밍 |

---

## 3. 에이전트 루프: 대화형 vs 파이프라인형

### Claude Code: `while(true)` 상태 머신

Claude Code의 심장부는 `query.ts`의 1,730줄짜리 `while(true)` 루프다.

```
Phase 1: Context Preparation
  ├─ Token count validation
  ├─ Snip compaction (오래된 메시지 제거)
  ├─ Microcompact (캐시 편집)
  ├─ Context collapse (reader-time projection)
  └─ Autocompact (전체 요약)

Phase 2: API Streaming
  ├─ Claude API 호출 (스트리밍)
  ├─ 도구 호출 감지 → StreamingToolExecutor에 추가
  └─ 스트리밍 중에도 도구 실행 시작 (latency 최적화)

Phase 3: Recovery
  ├─ 413 Prompt Too Long → collapse drain → reactive compact
  ├─ Max Output Tokens → 8k→64k 에스컬레이션
  └─ Streaming Fallback → 전체 재시도

Phase 4: Tool Execution
  ├─ Read-only 도구: 병렬 실행
  └─ Write 도구: 직렬 실행

Phase 5: Continuation Decision
  └─ stop_reason === 'tool_use' → continue, else → exit
```

이 루프의 강점은 **유연성**이다. LLM이 "파일을 읽고, 수정하고, 테스트를 돌리고, 결과를 보고"하는 복잡한 멀티스텝 작업을 자유롭게 수행할 수 있다. 사용자가 중간에 개입하여 방향을 전환할 수도 있다.

약점은 **예측 불가능성**이다. 같은 요청에 대해 다른 경로를 타거나, 불필요한 도구를 호출하거나, 중요한 단계를 빠뜨릴 수 있다. 이것은 범용 도구 기반 에이전트의 본질적 한계다.

### AutoBE: 5단계 워터폴 + 나선형 루프

AutoBE의 파이프라인은 결정론적이다. 각 단계는 정해진 순서로 실행되고, 각 단계 내부에서만 반복이 일어난다.

```
orchestratePrisma(ctx, props):
  1. 전제 조건 확인 (analyze 완료 여부)
  2. databaseStart 이벤트 발행
  3. orchestrateGroup → 테이블 그룹 분류
  4. orchestrateComponent → 컴포넌트 생성
  5. orchestrateSchema → 스키마 생성
  6. orchestratePrismaCorrect → 자가치유 루프:
     ├─ compile() → success? → 종료
     └─ fail → diagnostics 추출 → LLM 교정 → 재컴파일 (최대 5회)
  7. databaseComplete 이벤트 발행 + 상태 업데이트
```

이 파이프라인의 강점은 **결정론성과 100% 보장**이다. 어떤 LLM 모델을 쓰든, 파이프라인은 같은 순서로 실행되고, 컴파일러가 최종 게이트키퍼 역할을 한다. Qwen 35B든 Claude Opus든, 수렴 속도만 다를 뿐 결과의 정합성은 동일하다.

약점은 **경직성**이다. 사용자가 "아, Interface 단계에서 DB 스키마에 문제가 있네"라고 발견해도, 현재는 되돌아가서 Database 단계를 재실행해야 한다. (Epsilon 로드맵에서 Spiral Workflow로 개선 예정.)

---

## 4. 도구 시스템: 범용 vs 전용

### Claude Code: 40+ 범용 도구의 스위스 아미 나이프

Claude Code의 도구 시스템은 인상적으로 풍부하다:

| 범주 | 도구들 |
|------|--------|
| 파일 I/O | FileRead, FileEdit, FileWrite, Glob, Grep |
| 셸 | Bash, PowerShell, REPL |
| 웹 | WebFetch, WebSearch |
| 코드 분석 | LSP (hover, definition, references, symbols) |
| 에이전트 | Agent (서브에이전트 생성), Skill |
| 계획 | EnterPlanMode, ExitPlanMode |
| 작업 관리 | TaskCreate, TaskUpdate, TaskGet, TaskList |
| 스케줄링 | CronCreate, CronDelete, CronList |
| MCP | ListMcpResources, ReadMcpResource |

각 도구는 통일된 `Tool` 인터페이스를 구현한다:

```typescript
type Tool = {
  name: string;
  description: string;
  inputSchema: ToolInputJSONSchema;
  isEnabled(): boolean;
  canUse(context): PermissionResult;
  handler(input, context): Promise<string>;
}
```

**권한 시스템**이 특히 정교하다. `BashTool` 하나에 약 100KB의 권한 로직이 들어 있는데, 파괴적 명령 감지(`rm`, `dd`, `truncate` 등), 경로 유효성 검사, `sed` 표현식의 뮤테이션 감지, 자동 승인 분류기(ML 기반)까지 포함된다. 이것은 **사람과 함께 쓰는 도구**이기에 필수적인 안전장치다.

### AutoBE: 전문 오케스트레이터의 조립 라인

AutoBE에는 범용 "도구"가 없다. 대신 각 단계마다 전문화된 **오케스트레이터**가 있다:

```
Analyze Phase:
  orchestrateAnalyzeScenario    → 요구사항 구조화
  orchestrateAnalyzeScenarioReview → 자가 검토
  orchestrateAnalyzeWriteSection → 상세 명세 작성 (배치)
  orchestrateAnalyzeSectionReview → 명세 검토

Database Phase:
  orchestrateGroup              → 테이블 그룹 분류
  orchestrateComponent          → 컴포넌트 생성
  orchestrateSchema             → 스키마 작성
  orchestratePrismaCorrect      → 컴파일러 기반 교정

Interface Phase:
  orchestrateInterfaceGroup     → API 그룹 분류
  orchestrateInterfaceAuthorization → 인증 설계
  orchestrateInterfaceEndpoint  → 엔드포인트 설계
  orchestrateInterfaceOperation → 오퍼레이션 상세화
  orchestrateInterfaceSchema    → DTO 스키마 생성

... (Test, Realize도 유사한 구조)
```

각 오케스트레이터는 **일회용 MicroAgentica 인스턴스**를 생성한다. 이 패턴의 핵심은 "하나의 작업에 하나의 에이전트"다:

```typescript
const agent = new MicroAgentica({
  vendor: props.vendor,
  config: {
    executor: { describe: false },
    retry: AutoBeConfigConstant.VALIDATION_RETRY,
  },
  histories: next.histories,       // 변환된 최소 컨텍스트
  controllers: [next.controller],  // 단일 함수 스키마
});
```

범용 도구 대신 **타입 스키마가 곧 도구**다. `typia.llm.application<IAutoBeAnalyzeScenarioApplication>()`이 TypeScript 인터페이스로부터 JSON Schema를 자동 생성하고, LLM은 이 스키마에 맞춰 구조화된 결과를 반환한다.

### 비교 평가

| 측면 | Claude Code | AutoBE |
|------|-------------|--------|
| 유연성 | ★★★★★ (어떤 작업이든 가능) | ★★☆☆☆ (백엔드 생성에 특화) |
| 예측 가능성 | ★★☆☆☆ (LLM 자율 결정) | ★★★★★ (결정론적 파이프라인) |
| 안전성 | ★★★★☆ (권한 시스템) | ★★★★★ (컴파일러 게이트) |
| 확장성 | ★★★★★ (MCP, 플러그인) | ★★★☆☆ (오케스트레이터 추가 필요) |
| 결과 품질 | ★★★☆☆ (LLM 역량 의존) | ★★★★★ (컴파일러가 보증) |

---

## 5. 컴파일러와 검증: 최선의 노력 vs 100% 보장

이것이 두 프로젝트 사이의 **가장 근본적인 차이**다.

### Claude Code: LSP + 사후 확인

Claude Code는 Language Server Protocol을 통해 코드 분석을 지원한다:

```
LSPClient → LSPServerManager → LSPServerInstance
                                    ↕
                           LSPDiagnosticRegistry
                                    ↕
                           passiveFeedback (진단 스트리밍)
```

LSP가 제공하는 것:
- `hover`: 타입 정보
- `goToDefinition`: 정의로 이동
- `findReferences`: 참조 찾기
- `diagnostics`: 실시간 에러 감지

하지만 이것은 **보조 수단**이다. 코드 생성의 정합성을 보증하지 않는다. LLM이 생성한 코드에 타입 에러가 있어도, 그것을 감지하여 자동 수정하는 루프는 없다. 사용자가 직접 확인하고, 에러를 보고하고, 수정을 요청해야 한다.

### AutoBE: 3단계 컴파일러 파이프라인

AutoBE의 컴파일러 시스템은 프로젝트의 **존재 이유**다:

```
Tier 1: Prisma Compiler
  - Prisma DSL 문법 검증
  - 순환 참조, 관계 무결성 검사
  - ERD 다이어그램 생성
  → 구조화된 진단: { table, field, line, column, message, suggestion }

Tier 2: OpenAPI Compiler
  Layer A: OpenAPI 스펙 유효성 (중복 감지, 스키마 참조, 규격 준수)
  Layer B: Prisma 정합성 (참조하는 필드가 실제 스키마에 존재하는지)
  → 교차 검증: DB 스키마와 API 명세 사이의 불일치 감지

Tier 3: TypeScript Compiler
  - strict 모드: noImplicitAny, strictNullChecks, strictFunctionTypes
  - 증분 컴파일: 이전 ts.Program 재사용으로 15배 속도 향상
  → 최종 게이트키퍼: 컴파일 통과 = 타입 안전 보장
```

각 컴파일러의 진단은 LLM이 소비하기 최적화된 형태로 변환된다:

```typescript
{
  file: "src/providers/User.ts",
  line: 45,
  column: 12,
  message: "Type 'string' is not assignable to type 'number'",
  code: "TS2322",
  context: { expectedType: "number", receivedType: "string" }
}
```

자가치유 루프는 이 진단을 LLM에게 전달하고, LLM은 **실패한 부분만 정밀 수정**한다. 전체를 다시 생성하지 않는다:

```
Write → Compile → [pass] → Done
                    ↓
                  [fail] → Diagnose → Correct → Recompile
                                                   ↓
                                        [pass] → Done
                                        [fail] → Diagnose → ... (최대 5회)
```

### Function Calling Harness: AutoBE의 비밀 병기

AutoBE의 Function Calling Harness 아티클이 밝히는 핵심 통찰이 있다.

Qwen3-coder-next의 복잡한 재귀적 JSON Schema에 대한 첫 시도 function calling 성공률은 **6.75%**에 불과했다. GPT-4o도 28%(NESTFUL 측정). 업계 합의는 "복잡한 재귀적 유니온 타입에 대한 function calling은 안 된다"였다.

AutoBE는 3계층 하니스로 이것을 **99.8%**로 끌어올렸다:

1. **관대한 JSON 파싱**: 깨진 JSON 복구, 마크다운 제거, 불완전 키워드 완성, 괄호 자동 닫기
2. **타입 강제 변환**: 스키마 기반으로 잘못된 타입을 기대 타입으로 변환
3. **검증 피드백**: `// ❌` 인라인 에러 마커로 정확히 무엇이 틀렸는지 표시

그리고 **핑크 코끼리 문제**: "any 타입을 쓰지 마라"라는 금지 규칙은 오히려 생성 확률을 높인다. 반면 스키마에 `any`가 **존재하지 않으면**, LLM은 물리적으로 생성할 수 없다. **부재를 통한 제약**이 **금지를 통한 제약**보다 강력하다.

이것이 AutoBE가 "에이전트 기교나 워크플로우 고도화에 손도 대지 않고" 컴파일러와 function calling harness에 올인한 이유다. 검증 가능한 기반 없이 워크플로우를 아무리 고도화해봐야, 확률적 모델의 출력을 보증할 수 없기 때문이다.

---

## 6. 컨텍스트 관리: 압축의 예술 vs 변환의 정밀함

### Claude Code: 4중 압축 전략

Claude Code는 긴 대화에서 컨텍스트 창을 관리하기 위해 4가지 독립적인 전략을 구사한다:

| 전략 | 트리거 | 메커니즘 | 비용 |
|------|--------|----------|------|
| **Snip** | 매 반복 | 체크포인트 이전 메시지 제거 | 무료 |
| **Microcompact** | 매 반복 | 프롬프트 캐시에서 토큰 삭제 | ~2k 토큰 |
| **Context Collapse** | 사전 대비 | 읽기 시점 투영 (reader-time projection) | 무료 (캐시됨) |
| **Autocompact** | 임계값 초과 (180k 토큰) | LLM으로 전체 대화 요약 | ~50-80k 토큰 입력 |

이것은 **대화의 연속성을 유지하면서 창을 관리하는** 문제에 대한 정교한 해법이다. 특히 Autocompact는 LLM에게 대화를 요약시키므로, 맥락을 잃지 않으면서 토큰을 절약한다.

### AutoBE: History Transformer의 수술적 정밀함

AutoBE는 압축이 아니라 **변환**을 한다. 각 오케스트레이터는 자체 History Transformer를 가지며, 해당 작업에 **정확히 필요한 컨텍스트만** 조립한다:

```typescript
// Realize Phase의 History Transformer 예시
function transformRealizeWriteHistories(props) {
  return [
    { role: "user", text: systemPrompt, _cache: { type: "ephemeral" } },
    { role: "user", text: formatOperation(props.operation), _cache: { type: "ephemeral" } },
    { role: "user", text: formatSchemas(props.operation, props.state) },
    { role: "user", text: taskInstruction },
  ];
}
```

전체 분석 결과(50KB) + 전체 Prisma 스키마(30KB) + 전체 OpenAPI(100KB)를 보내는 대신, **현재 오퍼레이션에 참조되는 스키마만** 추출하여 보낸다. 180KB → 8KB, 95% 감소.

또한 **executeCachedBatch 패턴**으로 프롬프트 캐싱을 극대화한다:

```
40개 API 구현 시:
  첫 번째: 10,000 입력 토큰 (전액)
  나머지 39개: 각 10,000 토큰 (90% 캐시) ≈ 1,000 토큰
  절약: ~$30-40/회
```

첫 번째 작업을 순차 실행하여 캐시를 확립하고, 나머지를 세마포어 제어 하에 병렬 실행한다. 메시지 순서를 `시스템 프롬프트 → Prisma 스키마 → OpenAPI → 특정 작업` 순으로 배치하여, 앞부분 90%가 안정적으로 캐시되도록 한다.

### 비교 평가

Claude Code의 접근법은 **범용적**이다. 어떤 대화든, 어떤 작업이든 작동한다. 그러나 정밀하지 않다—요약 과정에서 세부사항이 유실될 수 있다.

AutoBE의 접근법은 **수술적**이다. 각 작업에 정확히 필요한 것만 제공하므로, 토큰 낭비가 없고 정보 유실도 없다. 그러나 각 오케스트레이터마다 전용 transformer를 작성해야 하므로, 개발 비용이 높다.

---

## 7. 에러 회복: 재시도 vs 자가치유

### Claude Code: 계층적 재시도

Claude Code의 에러 회복은 `query.ts`의 상태 전환으로 구현된다:

| 전환 | 트리거 | 회복 |
|------|--------|------|
| `collapse_drain_retry` | 413 PTL | 스테이지된 collapse 배출 후 재시도 |
| `reactive_compact_retry` | drain 실패 후 413 | 전체 compact 후 재시도 |
| `max_output_tokens_escalate` | 8k 한도 | 64k로 에스컬레이션 |
| `max_output_tokens_recovery` | 64k 한도 | "resume directly" 메시지 주입 |
| `streaming_fallback` | 스트리밍 실패 | 전체 재시도 |
| `stop_hook_blocking` | 훅 에러 | 에러를 메시지에 추가 후 재시도 |

이것은 **인프라 수준의 회복**이다—API 장애, 토큰 한도, 네트워크 에러에 대응한다. 그러나 "LLM이 생성한 코드에 버그가 있다"는 문제에 대해서는 사용자에게 의존한다.

### AutoBE: 다층 자가치유

AutoBE의 에러 회복은 **논리적 정합성 수준**에서 작동한다:

```
Layer 1: 인라인 재시도
  (await write()) ?? (await write())
  → 일시적 실패 포착

Layer 2: 교정 루프 (orchestrateCorrect)
  compile → diagnostics → correct (LLM) → recompile
  → 실패한 함수만 재생성, 최대 5회

Layer 3: 외부 재시도 루프
  실패한 시나리오만 선별하여 재처리
  → 전체가 아닌 일부만 재시도

Layer 4: RAG 루프 (AutoBePreliminaryController)
  LLM이 "이 데이터가 더 필요합니다" → 추가 컨텍스트 로딩
  → 최대 10회 반복
```

핵심 차이: Claude Code는 "API가 실패하면 재시도"이고, AutoBE는 "코드가 틀리면 진단하고 수정"이다. 후자가 **비결정론적 출력에 대한 결정론적 교정**이라는 점에서 근본적으로 다른 접근이다.

---

## 8. Function Calling: 자유도 vs 제약의 미학

### Claude Code: 풀 셋 Function Calling

Claude Code에서 LLM은 40개 이상의 도구 중 **아무거나** 호출할 수 있다. 도구 선택은 완전히 LLM의 자율에 맡겨져 있고, 권한 시스템이 위험한 호출을 필터링한다.

```typescript
// StreamingToolExecutor: 도구를 스트리밍 중에 병렬 실행
addTool(block):
  ├─ isConcurrencySafe? → 즉시 실행
  └─ not safe? → 큐에 대기

// 동시성 규칙:
canExecuteTool(isConcurrencySafe):
  if 실행 중인 도구 없음: true
  if safe AND 모든 실행 중인 것도 safe: true
  else: false
```

이 접근의 장점은 **자유도**다. "파일을 읽고, grep으로 검색하고, 관련 파일을 수정하고, 테스트를 돌려봐"라는 복잡한 지시를 하나의 턴에서 처리할 수 있다.

단점은 **예측 불가능성**과 **낭비**다. LLM이 불필요한 파일을 읽거나, 이미 읽은 파일을 다시 읽거나, 비효율적인 도구를 선택할 수 있다.

### AutoBE: 스키마가 곧 제약

AutoBE에서는 LLM의 출력이 **타입 스키마로 제약**된다:

```typescript
// Facade 수준: 5개 함수만 노출
interface IAutoBeFacadeApplication {
  analyze(): Promise<Result>;
  database(props: { instruction: string }): Promise<Result>;
  interface(props: { instruction: string }): Promise<Result>;
  test(props: { instruction: string }): Promise<Result>;
  realize(props: { instruction: string }): Promise<Result>;
}

// 오케스트레이터 수준: 작업별 전용 스키마
interface IAutoBeAnalyzeScenarioApplication {
  IComplete: {
    prefix: string;
    language: string;
    actors: IAutoBeActorJson[];
    entities: IAutoBeEntityJson[];
    features: IAutoBeFeatureJson[];
  };
}
```

`typia.llm.application<T>()`가 TypeScript 인터페이스에서 JSON Schema를 **컴파일 타임에** 생성한다. LLM은 이 스키마에 맞는 출력만 할 수 있다. `tool_choice = "required"`로 설정되어 LLM이 반드시 함수를 호출해야 하고, 자유 텍스트 응답은 허용되지 않는다.

**데이터베이스 필드 타입 제약** 예시:
```
허용: boolean | int | double | string | uri | uuid | datetime (7가지만)
금지: varchar, text, bigint, decimal, timestamp... (스키마에 존재하지 않음)
```

"varchar를 쓰지 마라"라고 프롬프트에 쓰는 것보다, 스키마에 varchar 옵션을 **아예 넣지 않는 것**이 더 효과적이다. 이것이 "부재를 통한 제약"의 핵심이다.

---

## 9. 상태 관리: Redux 패턴 vs Step Counter 패턴

### Claude Code: 불변 상태 트리

Claude Code는 React의 전통을 따라 Redux 유사 패턴을 사용한다:

```typescript
type AppState = {
  messages: Message[];
  mainLoopModel: string;
  toolPermissionContext: ToolPermissionContext;
  mcp: { servers, tools, commands, resources };
  settings: UserSettings;
  cost: UsageTracker;
  coordinator?: CoordinatorState;
  memories: Memory[];
  fileStateCache: FileStateCache;
  // ...
};

// useSyncExternalStore로 React 통합
store.subscribe(state => onStateChange(state));
```

세션 히스토리는 `~/.claude/sessions/<id>/`에 지속되고, `/resume` 명령으로 복원된다. 메모리는 `~/.claude/projects/<slug>/memory/`에 Markdown 파일로 저장된다.

이 패턴은 **대화형 에이전트에 적합**하다. 상태가 연속적으로 변하고, UI가 실시간으로 반응하며, 사용자가 언제든 개입할 수 있다.

### AutoBE: Step Counter 패턴

AutoBE의 상태 관리에서 가장 독창적인 부분은 **Step Counter**다:

```typescript
interface AutoBeState {
  analyze: AutoBeAnalyzeHistory | null;   // step: 1
  database: AutoBeDatabaseHistory | null;  // step: 2, analyzeStep: 1
  interface: AutoBeInterfaceHistory | null; // step: 3, analyzeStep: 1, databaseStep: 2
  test: AutoBeTestHistory | null;          // step: 4, analyzeStep: 1, interfaceStep: 3
  realize: AutoBeRealizeHistory | null;    // step: 5, analyzeStep: 1, interfaceStep: 3
}
```

각 히스토리에는 `step` 번호가 있고, 상위 단계의 step을 참조한다. 만약 Analyze를 다시 실행하면 `analyze.step`이 2로 증가하고, 하위 단계의 `analyzeStep: 1`은 자동으로 **무효화**된다.

```
Analyze.step = 1 → 재실행 → Analyze.step = 2
  ↓
Database.analyzeStep = 1 ≠ 2 → 무효!
Interface.analyzeStep = 1 ≠ 2 → 무효!
Test.analyzeStep = 1 ≠ 2 → 무효!
Realize.analyzeStep = 1 ≠ 2 → 무효!
```

이 패턴은 **파이프라인형 상태 관리에 이상적**이다. 의존성이 명시적이고, 무효화가 자동이며, 재현 가능하다. 그러나 대화형 에이전트에는 적합하지 않다—단계가 정해져 있지 않기 때문이다.

---

## 10. 2세대와 3세대, 그 경계에 대하여

### 세대 분류의 기준

AI 에이전트의 세대를 "사람을 얼마나 대체하는가"로 분류할 수 있다:

| 세대 | 특성 | 대표 사례 |
|------|------|----------|
| **1세대** | 코드 완성 (Copilot) | 한 줄, 한 함수 단위 제안 |
| **2세대** | 코드 어시스턴트 | 멀티스텝 작업, 도구 사용, 대화형 협업 |
| **3세대** | 자율 코드 생성기 | 명세에서 전체 애플리케이션 생성, 정합성 보증 |

Claude Code는 전형적인 **2세대**다. 사람이 주도하고, AI가 보조한다. 사람이 "이 버그를 고쳐"라고 하면 AI가 파일을 찾고, 수정하고, 테스트를 돌려본다. 사람이 없으면 아무것도 하지 않는다.

AutoBE는 **3세대를 지향**한다. 사람이 "쇼핑몰 백엔드를 만들어"라고 하면, AI가 요구사항을 분석하고, DB를 설계하고, API를 정의하고, 테스트를 작성하고, 구현까지 완성한다. 사람은 결과를 검수만 하면 된다.

### 그러나 경계는 명확하지 않다

Claude Code에도 3세대적 요소가 있다:

- **Coordinator Mode**: 코디네이터 에이전트가 작업자 에이전트를 생성하고 관리
- **Plan Mode**: 요구사항 → 리서치 → 설계 → 구현 → 검증의 자동 파이프라인
- **Fork Subagent**: 부모 컨텍스트를 공유하면서 병렬 작업

AutoBE에도 2세대적 요소가 있다:

- **Facade의 대화형 인터페이스**: LLM이 사용자와 대화하면서 어떤 단계를 실행할지 결정
- **Epsilon 로드맵의 Human Modification Support**: 사용자가 수정한 코드를 역파싱하여 재통합

### 진정한 차이: 검증의 유무

세대를 가르는 진정한 기준은 "자율성의 정도"보다 **"결과의 보증 메커니즘"**이 아닐까.

Claude Code는 LLM의 출력을 **신뢰**한다. LSP 진단이 있지만, 그것은 보조적이다. 생성한 코드가 맞는지 틀리는지의 최종 판단은 사람에게 있다.

AutoBE는 LLM의 출력을 **검증**한다. 컴파일러가 자동으로 확인하고, 틀리면 자동으로 교정한다. 사람 없이도 정합성이 보증된다.

이 관점에서 보면:

- **2세대**: AI가 작업을 수행하되, 정합성 판단은 사람
- **3세대**: AI가 작업을 수행하고, 정합성도 기계가 보증

AutoBE의 "컴파일러에 올인" 전략은 이 관점에서 완벽하게 합리적이었다. 검증 메커니즘 없이 아무리 정교한 워크플로우를 만들어도, 결과를 보증할 수 없다. **먼저 검증 기반을 닦고, 그 위에 워크플로우를 쌓는 것**이 올바른 순서다.

---

## 11. AutoBE가 Claude Code로부터 배울 것들

AutoBE는 이제 Epsilon 로드맵에서 워크플로우 고도화를 시작한다. Claude Code의 소스코드에서 참고할 만한 패턴이 많다.

### 11.1 컨텍스트 압축의 다층 전략

AutoBE는 History Transformer로 **처음부터 최소 컨텍스트를 조립**한다. 그러나 Epsilon의 Spiral Workflow(역방향 전파)와 Cyclinic Workflow(자가 리뷰)가 도입되면, 대화가 길어질 수 있다. Claude Code의 4중 압축 전략을 참고하여, 장기 실행 시 컨텍스트를 관리하는 메커니즘이 필요해질 것이다.

특히 **Autocompact**(LLM 기반 대화 요약)는 Spiral Workflow에서 "Database→Interface→다시 Database로 돌아가기"할 때, 중간 과정을 요약하는 데 유용할 수 있다.

### 11.2 스트리밍 도구 실행과 동시성 제어

Claude Code의 `StreamingToolExecutor`는 정교한 동시성 모델을 가지고 있다:

```
Read-only 도구 → 병렬 실행 가능
Write 도구 → 직렬 실행만
에러 전파 → Bash 에러 시 sibling 취소
```

AutoBE의 `executeCachedBatch`는 세마포어 기반 병렬 실행을 하지만, 도구 종류에 따른 동시성 규칙은 없다. Epsilon에서 Runtime Feedback Agent(실제 백엔드 실행)가 도입되면, "컴파일은 병렬, 런타임 테스트는 직렬" 같은 규칙이 필요해질 것이다.

### 11.3 Permission 시스템의 정교함

Claude Code의 권한 시스템은 AutoBE에 직접 필요하진 않지만, Epsilon의 Human Modification Support 맥락에서 참고할 만하다. 사용자가 생성된 코드를 수정하면, AutoBE가 그 수정을 역파싱한다—이때 "사용자의 수정을 어디까지 수용할 것인가?"의 판단이 필요할 수 있고, Claude Code의 권한 규칙 체계가 참고가 될 수 있다.

### 11.4 서브에이전트 Fork 패턴

Claude Code의 Fork Subagent는 부모의 전체 컨텍스트를 공유하면서 병렬 작업을 수행한다. 핵심 최적화는 **byte-identical prefix**로 프롬프트 캐시를 공유하는 것이다:

```typescript
function buildForkedMessages(directive, assistantMessage) {
  return [
    fullAssistantMessage,           // 모든 fork가 동일
    userMessage({
      ...toolResultBlocks,          // placeholder로 동일하게
      text: FORK_DIRECTIVE_PREFIX + directive  // 여기만 다름
    })
  ];
}
```

AutoBE의 `executeCachedBatch`와 유사하지만, Fork는 **전체 대화 히스토리를 공유**한다는 점이 다르다. Epsilon의 "Multi-draft generation" (다중 초안 생성 후 최선안 선택)에 이 패턴을 적용하면, 같은 컨텍스트에서 여러 변형을 병렬 생성할 때 캐시 효율을 극대화할 수 있다.

### 11.5 Plan Mode의 구조화된 워크플로우

Claude Code의 Plan Mode는 `인터뷰 → 리서치 → 설계 → 구현 → 검증`의 5단계로 구조화되어 있다. Epsilon에서 도입할 Orchestration Experiments (Critic agents, Dynamic agent routing)의 설계 시, 이 구조를 참고할 수 있다.

특히 "독립 검증자(independent verifier)"가 구현 결과를 확인하는 패턴은, AutoBE의 Estimation Agent와 유사한 개념이다.

### 11.6 메모리 시스템

Claude Code의 `~/.claude/projects/<slug>/memory/` 기반 영구 메모리는, AutoBE가 **세션 간 학습**을 구현할 때 참고할 모델이다. "이 프로젝트에서는 PostgreSQL의 jsonb 타입을 선호한다"나 "이 팀은 REST보다 GraphQL을 쓴다" 같은 프로젝트별 선호도를 기억하면, 생성 품질이 향상될 수 있다.

### 11.7 MCP (Model Context Protocol) 통합

Claude Code는 MCP를 통해 외부 도구를 동적으로 통합한다. AutoBE가 프론트엔드 생성이나 인프라 설정으로 확장할 때, MCP 기반 플러그인 시스템을 도입하면 코어 코드를 수정하지 않고도 새 기능을 추가할 수 있다.

---

## 12. Claude Code가 AutoBE로부터 배울 것들

### 12.1 컴파일러 기반 자가치유

Claude Code에 가장 부족한 것은 **생성한 코드의 자동 검증과 교정**이다. LSP 진단을 스트리밍하지만, 이를 자동으로 수정하는 루프는 없다. AutoBE의 `Write → Compile → Diagnose → Correct → Recompile` 패턴을 도입하면, "코드를 수정했는데 타입 에러가 생겼다"는 흔한 시나리오를 사용자 개입 없이 자동 해결할 수 있다.

### 12.2 Function Calling Harness

Claude Code는 LLM의 출력을 자유 텍스트로 받아서 도구 호출을 추출한다. AutoBE의 Typia 기반 harness—관대한 JSON 파싱, 타입 강제 변환, 인라인 에러 피드백—를 도입하면, 특히 소규모 모델이나 오픈소스 모델을 사용할 때 도구 호출 신뢰성을 크게 향상시킬 수 있다.

### 12.3 타입 스키마를 통한 출력 제약

"이것을 하지 마라" 대신 "이것만 할 수 있다"가 더 효과적이라는 AutoBE의 통찰은, Claude Code의 시스템 프롬프트 설계에도 적용될 수 있다. 특히 `FileEditTool`의 `old_string`/`new_string` 제약이 이미 이 방향이긴 하지만, 더 체계적으로 적용할 수 있다.

### 12.4 History Transformer 패턴

Claude Code의 Autocompact는 전체 대화를 요약하는 "수평적 압축"이다. AutoBE의 History Transformer는 작업별로 필요한 정보만 추출하는 "수직적 선별"이다. 서브에이전트에 작업을 위임할 때, 전체 대화 히스토리 대신 작업에 관련된 부분만 선별하여 전달하면 성능과 비용을 크게 개선할 수 있다.

### 12.5 Step Counter를 통한 의존성 관리

Claude Code의 Coordinator Mode에서 여러 작업자 에이전트가 병렬로 작업할 때, "A 작업자가 파일을 수정한 후 B 작업자가 같은 파일을 읽어야 한다"는 의존성이 발생한다. AutoBE의 Step Counter 패턴을 활용하면, 이러한 의존성을 명시적으로 추적하고 자동 무효화할 수 있다.

---

## 13. 결론: 수렴과 분기

### 현재의 위치

Claude Code와 AutoBE는 **전혀 다른 문제를 풀고 있다**:

- **Claude Code**: "이 시니어 개발자가 어떻게 하면 사용자를 더 잘 도울 수 있을까?"
- **AutoBE**: "이 공장이 어떻게 하면 항상 동작하는 백엔드를 만들 수 있을까?"

전자는 **유연성과 안전성**의 균형이 핵심이다. 40개 도구를 자유롭게 쓰되, 위험한 것은 막는다. 후자는 **정합성과 완전성**의 보증이 핵심이다. LLM이 뭘 내놓든, 컴파일러가 검증한다.

### 수렴의 방향

그러나 양쪽 모두 같은 방향으로 진화하고 있다:

1. **Claude Code의 3세대화**: Coordinator Mode, Plan Mode, 서브에이전트 시스템은 자율성을 높이는 방향이다. LSP 진단을 자동 교정 루프에 통합하면, "코드 어시스턴트"에서 "코드 생성기"로의 전환이 가능해진다.

2. **AutoBE의 2세대적 보완**: Epsilon 로드맵의 Human Modification Support, Cyclinic Workflow, Spiral Workflow는 사용자와의 협업을 강화하는 방향이다. 엄격한 파이프라인에서 유연한 대화형 시스템으로 진화하고 있다.

### AutoBE의 전략적 우위

AutoBE가 "에이전트 기교"에 앞서 컴파일러에 올인한 것은 **올바른 순서**였다. 결과를 보증할 수 없는 상태에서 워크플로우를 아무리 정교하게 만들어도, 그것은 **정교한 주사위 굴리기**에 불과하다.

AutoBE는 이제 **검증이 보증된 기반 위에** 워크플로우를 쌓을 수 있다. 이것은 Claude Code가 역방향으로 도달하기 어려운 위치다—범용 도구 시스템 위에 도메인 특화 컴파일러를 얹는 것보다, 도메인 특화 컴파일러 위에 범용적 워크플로우를 얹는 것이 더 자연스럽기 때문이다.

### Claude Code의 전략적 우위

반대로, Claude Code는 **생태계**에서 우위가 있다. MCP 프로토콜로 외부 도구를 통합하고, IDE 브릿지로 VS Code/JetBrains와 연결하며, 플러그인/스킬 시스템으로 확장한다. 이 생태계 위에서 AutoBE 수준의 도메인 특화 기능을 플러그인으로 제공할 수도 있다.

### 최종 평가

| 차원 | Claude Code (2세대) | AutoBE (3세대 지향) |
|------|---------------------|---------------------|
| **자율성** | 사용자 주도, AI 보조 | AI 주도, 사용자 검수 |
| **범용성** | ★★★★★ | ★★☆☆☆ |
| **정합성 보증** | ★★☆☆☆ | ★★★★★ |
| **워크플로우** | ★★★★★ | ★★★☆☆ (개선 중) |
| **컴파일러/검증** | ★★☆☆☆ | ★★★★★ |
| **생태계** | ★★★★★ | ★★☆☆☆ |
| **모델 독립성** | ★★☆☆☆ (Claude 의존) | ★★★★★ (어떤 모델이든) |
| **비용 효율** | ★★★☆☆ | ★★★★☆ (캐시 최적화) |

2세대와 3세대는 대체 관계가 아니라 **보완 관계**다. 사실 AutoBE의 Epsilon 로드맵에는 "Claude Code Handoff Workflow"라는 항목이 있다—AutoBE가 백엔드를 생성한 후, Claude Code에 넘겨서 세밀한 커스터마이징을 하는 시나리오다. 공장에서 찍어낸 제품을 장인이 마감하는 것처럼.

두 프로젝트는 각자의 길을 걸으면서도, 결국 같은 미래를 향해 수렴하고 있다: **AI가 소프트웨어를 만들고, 기계가 그 정합성을 보증하며, 사람은 의도와 판단에 집중하는** 세계.

---

*이 보고서는 Claude Code의 소스코드(js.map 노출 사고로 공개)와 AutoBE의 오픈소스 코드를 직접 분석하여 작성되었다. 2026년 4월 기준.*
