# AutoBE vs Claude Code: 2세대 코드 어시스턴트와 3세대 자율 에이전트의 해부

> 2026년 4월, Claude Code의 소스코드가 npm publish 시 js.map 포함 사고로 만천하에 공개되었다. 512,000줄, 1,900개 파일, 301개 디렉터리.
> AutoBE는 처음부터 오픈소스였다.
> 이 보고서는 양쪽의 소스코드를 한 줄 한 줄 직접 분석하여, 두 프로젝트의 설계 철학과 아키텍처를 비교한다.

---

## 목차

1. [서론: 두 프로젝트의 해부](#1-서론-두-프로젝트의-해부)
   1. [두 프로젝트의 정체성](#11-두-프로젝트의-정체성)
   2. [아키텍처 비교: 전혀 다른 두 세계관](#12-아키텍처-비교-전혀-다른-두-세계관)
   3. [2세대와 3세대, 그 경계에 대하여](#13-2세대와-3세대-그-경계에-대하여)
2. [에이전트 오케스트레이션](#2-에이전트-오케스트레이션)
   1. [에이전트 루프: while(true) vs 5단계 워터폴](#21-에이전트-루프-whiletrue-vs-5단계-워터폴)
   2. [병렬 실행: Coordinator vs executeCachedBatch](#22-병렬-실행-coordinator-vs-executecachedbatch)
   3. [서브에이전트: Fork vs MicroAgentica](#23-서브에이전트-fork-vs-microagentica)
3. [LLM 하네싱: 프롬프트, 스키마, 도구](#3-llm-하네싱-프롬프트-스키마-도구)
   1. [시스템 프롬프트: 범용 지침 vs 도메인 교과서](#31-시스템-프롬프트-범용-지침-vs-도메인-교과서)
   2. [도구 시스템과 Function Calling](#32-도구-시스템과-function-calling)
   3. [메모리와 RAG: 정적 주입 vs 동적 수집](#33-메모리와-rag-정적-주입-vs-동적-수집)
4. [컴파일러와 검증](#4-컴파일러와-검증)
   1. [검증 총론: 최선의 노력 vs 100% 보장](#41-검증-총론-최선의-노력-vs-100-보장)
   2. [3층 컴파일러의 내부](#42-3층-컴파일러의-내부)
   3. [진단의 LLM 최적화](#43-진단의-llm-최적화)
5. [코드 생성 파이프라인](#5-코드-생성-파이프라인)
   1. [AST 설계 철학](#51-ast-설계-철학)
   2. [데이터베이스 스키마 생성](#52-데이터베이스-스키마-생성)
   3. [AST에서 NestJS까지](#53-ast에서-nestjs까지)
   4. [Collector/Transformer: 양방향 매핑](#54-collectortransformer-양방향-매핑)
   5. [E2E 테스트 자동 생성](#55-e2e-테스트-자동-생성)
6. [컨텍스트 엔지니어링](#6-컨텍스트-엔지니어링)
   1. [압축의 예술 vs 변환의 정밀함](#61-압축의-예술-vs-변환의-정밀함)
   2. [History Transformer와 메시지 정규화](#62-history-transformer와-메시지-정규화)
   3. [토큰 경제학](#63-토큰-경제학)
7. [에러 회복과 안전성](#7-에러-회복과-안전성)
   1. [에러 회복: 인프라 재시도 vs 논리 자가치유](#71-에러-회복-인프라-재시도-vs-논리-자가치유)
   2. [안전성 모델: 6중 방어 vs 컴파일러 게이트](#72-안전성-모델-6중-방어-vs-컴파일러-게이트)
8. [인프라와 운영](#8-인프라와-운영)
   1. [상태 관리와 영속성](#81-상태-관리와-영속성)
   2. [이벤트 시스템과 통신](#82-이벤트-시스템과-통신)
   3. [비용과 기여 추적](#83-비용과-기여-추적)
   4. [Git 통합과 투기적 실행](#84-git-통합과-투기적-실행)
   5. [설정과 프로바이더 추상화](#85-설정과-프로바이더-추상화)
9. [확장성과 상호 학습](#9-확장성과-상호-학습)
   1. [확장 모델: MCP 생태계 vs 컴파일러 체인](#91-확장-모델-mcp-생태계-vs-컴파일러-체인)
   2. [상호 학습](#92-상호-학습)
10. [결론: 수렴과 분기](#10-결론-수렴과-분기)

---

## 1. 서론: 두 프로젝트의 해부

### 1.1. 두 프로젝트의 정체성

#### Claude Code: 사람 옆에 앉은 시니어 개발자

Claude Code는 Anthropic이 만든 CLI 기반 코딩 어시스턴트다. TypeScript + Bun으로 빌드되었고, React/Ink로 터미널 UI를 렌더링한다.

시스템 프롬프트의 첫 줄이 정체성을 말해준다:

```
"You are Claude Code, Anthropic's official CLI for Claude."
```

그 아래에는 이런 지침이 이어진다:

```
"You are an interactive agent that helps users with software engineering tasks.
Use the instructions below and the tools available to you to assist the user."
```

핵심 설계 사상은 **"사람과의 협업"**이다. 사용자가 질문하면 답하고, 파일을 읽어달라 하면 읽고, 코드를 고쳐달라 하면 고친다. 40개 이상의 범용 도구를 갖추고, 매 턴마다 LLM이 자율적으로 도구를 선택한다. `while(true)` 루프 안에서 `callModel → extractToolCalls → executeTools → appendResults → repeat` 순환이 돈다.

여기에 더해 사용자의 안전을 위한 방대한 인프라가 있다:

- **권한 시스템**: 4단계 모드(default/plan/bypass/auto), ML 기반 자동 승인 분류기, BashTool 하나에 100KB의 파괴적 명령 감지 로직
- **IDE 브릿지**: VS Code/JetBrains와 JWT 인증 WebSocket으로 양방향 통신, v1(WebSocket+HTTP POST) / v2(SSE+CCR) 이중 프로토콜
- **메모리 시스템**: `~/.claude/projects/<slug>/memory/`에 Markdown 파일로 영구 저장
- **14종 훅 이벤트**: `SessionStart`, `PreToolUse`, `PostToolUse`, `FileChanged` 등 라이프사이클 전체를 커스터마이징

이것은 본질적으로 **대화형 에이전트**다.

#### AutoBE: 0에서 100까지 혼자 다 하는 백엔드 공장

AutoBE는 wrtnlabs가 만든 AI 기반 백엔드 코드 생성 시스템이다. 사용자가 "쇼핑몰 백엔드를 만들어줘"라고 말하면, 요구사항 분석부터 데이터베이스 설계, API 명세, E2E 테스트, NestJS 구현체까지 통째로 생성한다. 100% 컴파일 보장.

AutoBE의 Facade 시스템 프롬프트가 정체성을 말해준다:

```
"You are the main agent of AutoBE, an AI-powered system that transforms
natural language into production-ready TypeScript + NestJS + Prisma
backend applications.

You are a professional backend engineer—not an assistant—who converses
with users to understand their needs and builds complete applications
through coordinated agent orchestration.

Your mission: 'Can you converse? Then you're a full-stack developer.'"
```

"assistant"가 아니라 "professional backend engineer". 이 한 문장이 두 프로젝트의 근본적 차이를 드러낸다.

핵심 설계 사상은 **"결정론적 검증 루프로 확률적 모델을 감싸기"**다. LLM은 확률적으로 코드를 생성하지만, 3단계 컴파일러(Prisma → OpenAPI → TypeScript)가 결정론적으로 검증한다. 틀리면 구조화된 진단을 추출하여 LLM에게 돌려주고, 맞을 때까지 반복한다.

5단계 워터폴 파이프라인(Analyze → Database → Interface → Test → Realize)에 40개 이상의 전문 오케스트레이터가 협업한다. 각 단계마다 내부에 나선형(spiral) 루프가 돌면서 자가 교정한다. 75종 이상의 타입 안전 이벤트가 파이프라인 전체를 실시간으로 추적한다.

---

### 1.2. 아키텍처 비교: 전혀 다른 두 세계관

#### Claude Code의 구조

```
사용자 ←→ [React/Ink Terminal UI] ←→ [IDE Bridge (WebSocket/SSE)]
                    ↕
               [QueryEngine] ─→ Claude API (withRetry: 지수 백오프, 529 폴백)
                    ↕
          [StreamingToolExecutor] (스트리밍 중 도구 실행 시작)
           ↕        ↕        ↕
      [BashTool] [ReadTool] [EditTool] [AgentTool] ... (40+ tools)
                    ↕
          [Permission System]
           ├─ [Auto-approval Classifier (ML)]
           ├─ [Hook System (14 events)]
           └─ [Destructive Command Detector]
                    ↕
          [Context Manager]
           ├─ [Snip] (오래된 메시지 제거)
           ├─ [Microcompact] (캐시 편집으로 도구 결과 삭제)
           ├─ [Context Collapse] (reader-time projection)
           ├─ [Autocompact] (LLM 요약, 180k 토큰 임계값)
           └─ [Token Estimator] (4 bytes/token, JSON은 2 bytes/token)
                    ↕
          [Memory System] ─→ ~/.claude/projects/<slug>/memory/MEMORY.md
          [LSP Integration] ─→ hover, definition, references, diagnostics
          [MCP Client] ─→ 외부 도구 서버 연결
          [Plugin System] ─→ 스킬, 훅, MCP 서버, LSP 서버
```

**단일 에이전트, 범용 도구 풀.** 하나의 `QueryEngine`이 하나의 LLM 세션을 운영한다. 도구 풀은 동적으로 조립된다:

```typescript
// 도구 풀 조립 (tools.ts)
const byName = (a, b) => a.name.localeCompare(b.name)
return uniqBy(
  [...builtInTools].sort(byName).concat(allowedMcpTools.sort(byName)),
  'name',  // 빌트인이 MCP보다 우선
)
// 이름 정렬은 프롬프트 캐시 안정성을 위함
```

#### AutoBE의 구조

```
사용자 ←→ [WebSocket RPC] ←→ [React UI]
                ↕
           [AutoBeAgent] (Facade Controller: 5개 함수만 노출)
                ↕
      [MicroAgentica] × N (작업별 일회용 에이전트)
       ↕              ↕              ↕
  [Orchestrator]  [Orchestrator]  [Orchestrator]
   ├─ Group         ├─ Endpoint      ├─ Collector
   ├─ Component     ├─ Operation     ├─ Transformer
   ├─ Schema        ├─ Schema        ├─ Operation
   └─ Correct       └─ Prerequisite  └─ Correct
       ↕              ↕              ↕
  [Compiler]     [Compiler]     [Compiler]
  (Prisma)       (OpenAPI)      (TypeScript)
       ↕              ↕              ↕
  [History Transformer] ─→ Prompt Cache Optimization
                ↕
  [AutoBePreliminaryController] ─→ RAG: 점진적 컨텍스트 로딩
                ↕
  [Event System] ─→ 75+ typed events ─→ Real-time UI
```

**다중 에이전트, 전용 오케스트레이터.** Facade가 5개 함수를 노출하고, 각 함수 뒤에 전문화된 오케스트레이터 체인이 있다. 각 오케스트레이터는 일회용 `MicroAgentica`를 생성하고, 작업 완료 후 폐기한다.

#### 숫자로 보는 규모 비교

| 차원 | Claude Code | AutoBE |
|------|-------------|--------|
| **코드 규모** | ~512,000줄, 1,900 파일 | ~50,000줄, 400+ 파일 |
| **도구/오케스트레이터 수** | 40+ 범용 도구 | 40+ 전문 오케스트레이터 |
| **이벤트 타입** | 14 훅 이벤트 | 75+ 파이프라인 이벤트 |
| **시스템 프롬프트** | ~2,000줄 (동적 조립) | 87개 개별 프롬프트 파일 |
| **에이전트 수명** | 세션 전체 유지 | 작업당 생성·폐기 |
| **도구 선택** | LLM이 매 턴 자율 결정 | 오케스트레이터가 사전 결정 |
| **출력 단위** | 파일 편집, 셸 명령 | 전체 백엔드 애플리케이션 |
| **검증 방식** | LSP 진단 + 사용자 확인 | 3단계 컴파일러 + 자가치유 |

---

### 1.3. 2세대와 3세대, 그 경계에 대하여

#### 세대 분류의 기준

AI 에이전트의 세대를 "결과의 보증 메커니즘"으로 분류할 수 있다:

| 세대 | 특성 | 보증 메커니즘 | 대표 사례 |
|------|------|-------------|----------|
| **1세대** | 코드 완성 | 없음 (사용자 판단) | Copilot, Tabnine |
| **2세대** | 코드 어시스턴트 | LSP 진단 + 사용자 확인 | Claude Code, Cursor, Windsurf |
| **3세대** | 자율 코드 생성 | 컴파일러 + 자가치유 루프 | AutoBE |

Claude Code는 전형적인 **2세대**다. 시스템 프롬프트가 직접 말한다:

```
"You are an interactive agent that helps users with software engineering tasks."
```

"helps users"—사람이 주도하고, AI가 보조한다.

AutoBE는 **3세대를 지향**한다:

```
"You are a professional backend engineer—not an assistant"
```

"not an assistant"—AI가 주도하고, 기계가 검증한다.

#### 그러나 경계는 흐려지고 있다

Claude Code에도 3세대적 요소가 있다:

- **Coordinator Mode**: 코디네이터가 "작업자를 관리"하며, 작업자는 "내부 신호이지 대화 상대가 아닌" 자율 에이전트
- **Plan Mode V2**: 구독 등급에 따라 1-3개 워커를 병렬 생성, `인터뷰 → 리서치 → 설계 → 구현 → 검증` 5단계
- **Fork Subagent**: 부모 컨텍스트를 공유하면서 독립적으로 코드 수정, 커밋까지 자동 수행

AutoBE에도 2세대적 요소가 있다:

- **Facade의 대화형 인터페이스**: LLM이 사용자와 대화하면서 단계를 결정
- **Epsilon 로드맵의 Human Modification Support**: 사용자 수정을 역파싱하여 재통합
- **Cyclinic Workflow**: 자가 리뷰 루프 (Critic Agent)

#### 진정한 차이: 검증의 유무

2세대와 3세대를 가르는 핵심:

- **2세대**: AI가 작업을 수행하되, 정합성 판단은 **사람**
- **3세대**: AI가 작업을 수행하고, 정합성은 **기계**가 보증

AutoBE의 "컴파일러에 올인" 전략은 이 관점에서 올바른 순서였다. 검증 메커니즘 없이 워크플로우를 아무리 정교하게 만들어도, 그것은 **정교한 주사위 굴리기**에 불과하다. **먼저 검증 기반을 닦고, 그 위에 워크플로우를 쌓는 것**이 올바른 순서다.

Epsilon 로드맵이 이를 직접 증명한다:

```
Delta (전 분기): 컴파일 성공률 40% → 100% 복구
  → 모듈화 도입 후 성공률이 급락했으나, 컴파일러 강화로 복구

Epsilon (이번 분기): 런타임 성공률 100% 달성
  → 컴파일 100%를 기반으로, 이제 런타임 검증을 쌓음
  → Estimation Agent: 성공 가능성 사전 평가
  → Runtime Feedback Agent: 실제 서버 기동 + 테스트 실행
  → Benchmark Pipeline: 자동화된 품질 추적
```

---

## 2. 에이전트 오케스트레이션

> 1장에서 두 프로젝트의 정체성과 세대론을 살펴보았다. 이제 그 정체성이 **실행 구조**에서 어떻게 구현되는지 들여다본다.

### 2.1. 에이전트 루프: while(true) vs 5단계 워터폴

#### Claude Code: `while(true)` 상태 머신

Claude Code의 심장부는 `query.ts`의 1,730줄짜리 `while(true)` 루프다. 상태는 다음과 같다:

```typescript
type State = {
  messages: Message[]
  toolUseContext: ToolUseContext
  autoCompactTracking: AutoCompactTrackingState | undefined
  maxOutputTokensRecoveryCount: number
  hasAttemptedReactiveCompact: boolean
  maxOutputTokensOverride: number | undefined
  pendingToolUseSummary: Promise<ToolUseSummaryMessage | null> | undefined
  stopHookActive: boolean | undefined
  turnCount: number
  transition: Continue | undefined  // 왜 이전 반복이 계속되었는지
}
```

루프에는 **7개의 명시적 `continue` 지점**이 있다. 각각이 다른 회복 경로를 나타낸다:

```
Phase 1: Context Preparation
  ├─ tokenCountWithEstimation(messages) 계산
  │    └─ API 응답의 실제 usage + 이후 메시지의 추정치 합산
  │    └─ 추정: 4 bytes/token, JSON은 2 bytes/token, × 4/3 보정
  ├─ Snip compaction (체크포인트 이전 메시지 제거)
  ├─ Microcompact (캐시 편집으로 오래된 도구 결과 삭제)
  │    ├─ Cached MC: API cache_edits 블록 생성 (로컬 메시지 불변)
  │    └─ Time-based MC: 60분 이상 갭 시 최근 5개만 유지
  ├─ Context Collapse (reader-time projection, 90% 커밋 / 95% 블록)
  └─ Autocompact (180k - 13k = 167k 토큰 초과 시)
       └─ LLM에게 대화 요약 요청, 최대 20k 토큰 출력
       └─ 3회 연속 실패 시 회로 차단 (circuit breaker)

Phase 2: API Streaming
  ├─ Claude API 호출 (스트리밍)
  │    └─ withRetry: 지수 백오프, 500ms 기본, 32s 최대, 25% 지터
  │    └─ 529 에러 3회 연속 시 폴백 모델로 전환
  │    └─ ANT 전용: 무한 재시도 + 30초 하트비트
  ├─ 도구 호출 감지 → StreamingToolExecutor에 추가
  │    └─ 스트리밍 중에도 도구 실행 시작 (지연 시간 최적화)
  └─ 응답 위드홀딩: 회복 가능한 에러 시 yield 보류

Phase 3: Recovery (7개 continue 지점)
  ├─ collapse_drain_retry:    413 PTL → 스테이지된 collapse 배출
  ├─ reactive_compact_retry:  drain 실패 → 전체 compact
  ├─ max_output_tokens_escalate: 8k → 64k 에스컬레이션
  ├─ max_output_tokens_recovery: 64k 초과 → "resume directly" 주입
  ├─ streaming_fallback:      스트리밍 실패 → 전체 재시도
  ├─ stop_hook_blocking:      훅 에러 → 에러를 메시지에 추가
  └─ token_budget_continuation: 예산 내 → 자동 계속

Phase 4: Tool Execution
  ├─ StreamingToolExecutor 동시성 모델:
  │    ├─ isConcurrencySafe? → 병렬 실행 가능
  │    └─ not safe? → 단독 실행
  │    └─ Bash 에러 → siblingAbortController로 형제 취소
  │    └─ 비-Bash 에러 → 독립 (다른 도구에 영향 없음)
  └─ 도구 결과 > 100KB → 디스크 저장, 참조만 프롬프트에 삽입

Phase 5: Continuation Decision
  └─ stop_reason === 'tool_use' → continue, else → exit
```

이 루프의 강점은 **유연성**이다. LLM이 "파일을 읽고, 수정하고, 테스트를 돌리고, 결과를 보고"하는 복잡한 멀티스텝 작업을 자유롭게 수행할 수 있다. 사용자가 중간에 개입하여 방향을 전환할 수도 있다.

약점은 **예측 불가능성**이다. 같은 요청에 대해 다른 경로를 타거나, 불필요한 도구를 호출하거나, 중요한 단계를 빠뜨릴 수 있다.

#### AutoBE: 5단계 워터폴 + 나선형 루프

AutoBE의 파이프라인은 결정론적이다. Realize 단계의 구체적인 실행 흐름:

```
orchestrateRealize(ctx, props):
  1. predicateStateMessage(ctx.state(), "realize")  // Interface 완료 확인
  2. ctx.dispatch({ type: "realizeStart" })
  3. orchestrateRealizeCollector:
     ├─ planProgress → LLM이 재사용 가능한 DB 쿼리 함수 계획
     ├─ writeProgress → executeCachedBatch로 병렬 생성
     │    └─ 첫 번째: 순차 (캐시 확립)
     │    └─ 나머지: 병렬 (세마포어 제어, 기본 5)
     └─ validateProgress → TypeScript 컴파일 검증
          └─ 실패 시 → orchestrateRealizeCollectorCorrectOverall
          └─ 타입 에러 시 → orchestrateRealizeCollectorCorrectCasting
  4. orchestrateRealizeTransformer:
     └─ (Collector와 동일한 패턴)
  5. orchestrateRealizeAuthorizationWrite:
     └─ 인증 로직 구현 (login, join, refresh)
  6. orchestrateRealizeOperation:
     ├─ 각 API 엔드포인트의 비즈니스 로직 구현
     ├─ Collector/Transformer 재사용
     └─ 교정 루프:
          ├─ TypeScript 컴파일 검증
          ├─ orchestrateRealizeOperationCorrectCasting (타입 에러)
          └─ orchestrateRealizeOperationCorrectOverall (로직 에러)
  7. compileRealizeFiles → 최종 TypeScript 컴파일
  8. ctx.dispatch({ type: "realizeComplete" })
```

각 오케스트레이터는 `AutoBePreliminaryController`를 통해 **RAG 루프**를 내장한다. LLM이 "이 스키마 정보가 더 필요합니다"라고 판단하면, 유니언 타입에서 해당 데이터 요청을 선택하고, 컨트롤러가 자동으로 추가 컨텍스트를 로딩한다 (최대 7회). 상세 메커니즘은 [3.3절](#33-메모리와-rag-정적-주입-vs-동적-수집)에서 다룬다.

---

### 2.2. 병렬 실행: Coordinator vs executeCachedBatch

#### Claude Code: Coordinator Mode — 인간 팀 리더 패턴

Claude Code의 Coordinator Mode는 **인간 팀 리더가 주니어 개발자들에게 작업을 분배하는** 패턴이다:

```typescript
// src/coordinator/coordinatorMode.ts — 코디네이터 시스템 프롬프트
`You are a **coordinator**. Your job is to:
- Help the user achieve their goal
- Direct workers to research, implement and verify code changes
- Synthesize results and communicate with the user`

// 작업 단계 (시스템 프롬프트에 명시)
| Phase          | Who             | Purpose                                  |
|----------------|-----------------|------------------------------------------|
| Research       | Workers(병렬)   | Investigate codebase, find files         |
| Synthesis      | **Coordinator** | Read findings, craft implementation spec |
| Implementation | Workers         | Make targeted changes per spec, commit   |
| Verification   | Workers         | Test changes work                        |
```

코디네이터는 **반드시 직접 종합(synthesis)**해야 한다. 프롬프트에 명시적으로 금지하는 패턴:

```
// Anti-pattern (금지)
AgentTool({ prompt: "Based on your findings, fix the auth bug" })

// Good (필수)
AgentTool({ prompt: "Fix the null pointer in src/auth/validate.ts:42.
  The user field on Session is undefined when sessions expire but
  the token remains cached. Add a null check before user.id access." })
```

워커 재활용 전략:

```
| 상황                         | 전략       | 이유                    |
|------------------------------|-----------|------------------------|
| 리서치가 구현 파일과 겹침       | Continue  | 이미 파일이 컨텍스트에 있음 |
| 광범위한 리서치 후 좁은 구현    | Spawn New | 탐색 노이즈 제거          |
| 실패 교정                     | Continue  | 에러 컨텍스트 유지         |
| 다른 워커의 코드 검증           | Spawn New | 편견 없이 독립 검증        |
```

**한계**: 코디네이터는 LLM이다. 작업 분배, 종합, 검증 판단 모두 LLM의 추론에 의존한다. 잘못된 판단으로 워커를 잘못된 방향으로 보내거나, 종합이 부실할 수 있다.

#### AutoBE: executeCachedBatch — 결정론적 병렬 파이프라인

AutoBE의 병렬성은 **코드로 하드코딩된 결정론적 분배**다:

```typescript
// packages/agent/src/utils/executeCachedBatch.ts
export const executeCachedBatch = async <T>(
  ctx: AutoBeContext | number,
  taskList: Task<T>[],
  promptCacheKey?: string,
): Promise<T[]> => {
  promptCacheKey ??= v7();  // UUID로 캐시 키 생성
  const semaphore = ctx.vendor.semaphore?.max()
    ?? AutoBeConfigConstant.SEMAPHORE;  // 기본 8

  // 워커 풀 패턴: 세마포어만큼 동시 실행
  await Promise.allSettled(
    new Array(Math.min(semaphore, queue.length)).fill(0).map(async () => {
      while (queue.length !== 0 && !aborted) {
        const item = queue.splice(0, 1)[0]!;
        try {
          const result = await item.first(promptCacheKey!);
          results.push(new Pair(result, item.second));
        } catch (error) {
          aborted = true;       // 하나 실패하면 전체 중단
          queue.length = 0;
          firstError = error;
        }
      }
    }),
  );
  // 원래 순서 유지
  return results.sort((x, y) => x.second - y.second).map((p) => p.first);
};
```

**핵심 차이**: 어떤 작업을 병렬로 돌릴지, 몇 개씩 돌릴지, 실패 시 어떻게 할지가 모두 **코드로 결정**되어 있다. LLM이 "이걸 병렬로 돌려야 할까?" 고민할 필요가 없다.

#### 비교: 적응적 vs 결정론적 병렬성

| 측면 | Claude Code (Coordinator) | AutoBE (executeCachedBatch) |
|------|------------------------|--------------------------|
| 분배 결정 | LLM 판단 | 코드 하드코딩 |
| 동시성 제어 | 프롬프트 지침 | Semaphore (tstl) |
| 실패 처리 | "다른 접근을 시도하라" | Fail-fast (하나 실패 → 전체 중단) |
| 결과 종합 | LLM이 종합 | 타입 안전한 배열 반환 |
| 적용 범위 | 어떤 작업이든 | 동일 스키마의 배치 작업 |
| 캐시 최적화 | 없음 (각 워커 독립) | promptCacheKey 공유 |
| 워커 재활용 | SendMessage로 계속 | 일회성 (disposable) |

---

### 2.3. 서브에이전트: Fork vs MicroAgentica

#### Claude Code: Fork — 부모 캐시를 공유하는 자식 에이전트

```typescript
// src/utils/forkedAgent.ts — CacheSafeParams
export type CacheSafeParams = {
  systemPrompt: SystemPrompt      // 부모와 동일해야 캐시 히트
  tools: Tools                     // 도구 목록도 동일
  model: string                    // 모델도 동일
  messages: Message[]              // 메시지 접두사도 동일
  thinkingConfig: ThinkingConfig   // 사고 설정도 동일
}
```

Fork의 핵심은 **프롬프트 캐시 공유**다. 부모 에이전트의 시스템 프롬프트, 도구 목록, 메시지가 동일하면 Anthropic API의 프롬프트 캐시를 그대로 활용한다. 캐시가 깨지지 않으려면 이 5가지가 **정확히 일치**해야 한다.

```typescript
// Fork 생성 시:
// 1. 부모의 renderedSystemPrompt 스냅샷 (GrowthBook 변동 방지)
// 2. fileStateCache 클론 (읽기 상태 공유)
// 3. contentReplacementState 클론 (도구 결과 예산 공유)
// 4. 독립 AbortController (부모와 독립 취소)
// 5. 독립 DenialTrackingState (권한 거부 추적 분리)
```

Fork Subagent는 이런 지침을 받는다:

```
"STOP. READ THIS FIRST.
You are a forked worker process. You are NOT the main agent.

RULES (non-negotiable):
1. Your system prompt says 'default to forking.' IGNORE IT—
   that's for the parent. You ARE the fork.
2. Do NOT converse, ask questions, or suggest next steps
3. USE your tools directly: Bash, Read, Write, etc.
4. Keep your report under 500 words"
```

#### AutoBE: MicroAgentica — 완전 일회용 에이전트

```typescript
// packages/agent/src/factory/createAutoBeContext.ts
const agent = new MicroAgentica({
  vendor: props.vendor,
  config: { ... },
  histories: next.histories,       // History Transformer가 조립한 최소 컨텍스트
  controllers: [next.controller],  // 정확히 1개의 컨트롤러
});
// conversate() 후 agent는 버려짐 — 상태를 유지하지 않음
```

**MicroAgentica는 진짜 일회용이다.** 한 번의 `conversate()` 호출을 위해 생성되고, 결과를 `IPointer`에 캡처한 후 폐기된다. 다음 작업에는 새로운 MicroAgentica가 새로운 History Transformer 결과와 함께 생성된다.

#### 비교: 장수형 vs 일회용

| 측면 | Claude Code (Fork) | AutoBE (MicroAgentica) |
|------|-----------------|---------------------|
| 수명 | 작업 완료까지 존속 | 단일 conversate() 후 폐기 |
| 상태 | 부모로부터 상속 + 누적 | 없음 (매번 새로 조립) |
| 캐시 전략 | 부모 캐시 공유 (CacheSafeParams) | executeCachedBatch의 promptCacheKey |
| 컨텍스트 | 부모 메시지 전체 + 추가 작업 | History Transformer의 최소 선별 |
| 재시도 | SendMessage로 계속 | 새 에이전트 생성 |
| 독립성 | 부분적 (캐시 공유, 상태 분리) | 완전 독립 |

---

## 3. LLM 하네싱: 프롬프트, 스키마, 도구

> 오케스트레이션이 **구조**라면, 하네싱은 **재료**다. LLM에게 무엇을, 어떻게, 어떤 형식으로 시키는가.

### 3.1. 시스템 프롬프트: 범용 지침 vs 도메인 교과서

#### Claude Code: 모듈식 동적 조립

Claude Code의 시스템 프롬프트는 `getSystemPrompt()`에서 10+ 섹션을 동적으로 조립한다:

```
1. Simple Intro    → "You are an interactive agent..."
2. System          → 도구 실행 모드, 태그 처리, 훅 설명
3. Doing Tasks     → 코딩 가이드라인, 보안, 과잉 엔지니어링 금지
4. Actions         → 가역성/폭발 반경 고려, 위험한 작업 확인
5. Using Tools     → 각 도구의 사용법
6. Tone and Style  → 간결, 이모지 금지
7. Output Efficiency → "Go straight to the point"
8. ───────── DYNAMIC BOUNDARY (캐시 분리 경계) ─────────
9. Session Guidance → 세션별 동적 지침
10. Memory          → CLAUDE.md + MEMORY.md 주입
11. Language        → 사용자 선호 언어
12. MCP Instructions → 외부 도구 서버 설명
13. Token Budget    → 남은 토큰 안내
```

`SYSTEM_PROMPT_DYNAMIC_BOUNDARY` 마커가 핵심이다. 이 마커 **이전**은 `scope: 'global'`로 크로스-세션 캐시 가능하고, **이후**는 세션별 동적 콘텐츠다. 이로써 시스템 프롬프트의 상당 부분이 캐시되어 비용과 지연이 절감된다.

프롬프트 내용 자체는 **범용적**이다. "Don't add features beyond what was asked", "Avoid over-engineering", "Consider reversibility and blast radius" 같은 일반 원칙이 주를 이룬다.

#### AutoBE: 87개 도메인 특화 교과서

AutoBE는 `packages/agent/prompts/`에 87개의 개별 Markdown 파일을 가지고 있다. 각각이 하나의 특정 작업에 대한 **교과서 수준의 상세한 지침**이다.

`DATABASE_SCHEMA.md` (421줄)의 일부:

```markdown
## Field Types

Only these 7 types are permitted. No exceptions:
- boolean, int, double, string, uri, uuid, datetime

## Stance Classification

Every model MUST have exactly one stance:
| Stance | Description | Example |
|--------|-------------|---------|
| primary | Core business entity | shopping_sale, bbs_article |
| subsidiary | Child record that cannot exist alone | shopping_sale_snapshot |
| snapshot | Immutable historical record | mv_shopping_sale_last_snapshot |
| actor | Authentication subject | member, admin |
| session | Login/auth tracking record | member_session |
```

`REALIZE_OPERATION_WRITE.md` (845줄)는 NestJS 구현에 대한 완전한 레퍼런스다:

```markdown
## Function Structure

Every provider function follows this exact pattern:
export const ${operationName} = async (
  prisma: PrismaClient,
  props: ${DtoName},
): Promise<${ReturnType}> => {
  // 1. Authorization check (if needed)
  // 2. Data validation
  // 3. Business logic via Collectors/Transformers
  // 4. Return typed result
};

## Collector Reuse Rules

MUST reuse existing collectors. NEVER write raw Prisma queries
when a collector exists for the same entity.
```

핵심 차이: Claude Code는 "무엇을 하지 마라"(금지 규칙)가 많고, AutoBE는 "이것만 이렇게 해라"(양성 규칙)가 많다. 이것은 Function Calling Harness 아티클에서 말하는 **핑크 코끼리 문제**와 직접 연결된다—"코끼리를 생각하지 마라"보다 "강아지를 생각해라"가 더 효과적이다.

#### Coordinator vs Facade: 멀티에이전트 프롬프트

Claude Code의 Coordinator 프롬프트 (369줄)는 작업자 관리에 초점을 맞춘다:

```
"You are Claude Code, an AI assistant that orchestrates software
engineering tasks across multiple workers.

Workers are 'internal signals, not conversation partners'—never
thank or acknowledge them. Synthesize new information for the user
as it arrives.

Parallelism is your superpower. Workers are async. Launch independent
workers concurrently whenever possible."
```

반면 AutoBE의 Facade는 사용자와의 대화를 통해 5개 함수 중 어떤 것을 호출할지 결정한다:

```
"You orchestrate five agents in a waterfall pipeline.
Each phase builds upon the previous, validated by specialized
compilers before proceeding.

The Golden Rule: If the user wrote 10,000 characters about
databases, database() gets ALL 10,000 characters. Preserve the
user's exact wording, tone, code blocks, and technical specs verbatim."
```

Claude Code의 멀티에이전트는 "범용 작업자에게 자유롭게 위임"이고, AutoBE의 멀티에이전트는 "전문 에이전트에게 정확히 필요한 것만 전달"이다.

---

### 3.2. 도구 시스템과 Function Calling

#### Claude Code: 40+ 범용 도구의 스위스 아미 나이프

각 도구는 풍부한 메타데이터를 가진 `Tool` 인터페이스를 구현한다. 793줄짜리 `src/Tool.ts`에서 발췌:

```typescript
export type Tool<
  Input extends AnyObject = AnyObject,
  Output = unknown,
  P extends ToolProgressData = ToolProgressData,
> = {
  // ─── Identity & Discovery ───
  readonly name: string
  aliases?: string[]                   // 이전 이름 호환
  searchHint?: string                  // ToolSearch 키워드 (3-10 단어)

  // ─── Schema (Zod 기반) ───
  readonly inputSchema: Input          // Zod 스키마 → JSON Schema 자동 변환
  readonly inputJSONSchema?: ToolInputJSONSchema  // MCP 도구용 직접 JSON Schema
  outputSchema?: z.ZodType<unknown>

  // ─── Execution ───
  call(args, context, canUseTool, parentMessage, onProgress?): Promise<ToolResult<Output>>

  // ─── Behavior Flags ───
  isConcurrencySafe(input): boolean  // 기본 false (fail-closed)
  isReadOnly(input): boolean          // 기본 false (쓰기 가정)
  isDestructive?(input): boolean      // 되돌릴 수 없는 작업

  // ─── Permission ───
  validateInput?(input, context): Promise<ValidationResult>
  checkPermissions(input, context): Promise<PermissionResult>

  // ─── Size Control ───
  maxResultSizeChars: number  // 초과 시 디스크 저장
  shouldDefer?: boolean       // ToolSearch 레이지 로딩
}
```

도구 로딩은 **지연 로딩(deferred loading)** 패턴을 사용한다. `shouldDefer: true`인 도구는 초기 프롬프트에 포함되지 않고, `ToolSearch`를 통해 키워드 매칭으로 필요할 때만 스키마가 로딩된다.

**동시성 모델** (StreamingToolExecutor):

```
canExecuteTool(isConcurrencySafe):
  실행 중인 도구 없음 → true
  safe AND 모든 실행 중인 것도 safe → true (병렬)
  그 외 → false (대기)

에러 전파:
  Bash 에러 → siblingAbortController로 형제 도구 취소
  Read/Grep/WebFetch 에러 → 독립 (다른 도구에 영향 없음)
```

#### AutoBE: 타입 스키마가 곧 도구인 세계

AutoBE에는 범용 "도구"가 없다. 대신 **TypeScript 인터페이스 자체가 LLM의 함수 호출 스키마**가 된다. `typia.llm.application<T>()`가 컴파일 타임에 인터페이스를 JSON Schema로 변환한다.

**Facade 레벨: 5개 함수를 가진 최상위 에이전트**

```typescript
export interface IAutoBeFacadeApplication {
  analyze(): Promise<IAutoBeFacadeApplicationResult>;
  database(props: { instruction: string }): Promise<IAutoBeFacadeApplicationResult>;
  interface(props: { instruction: string }): Promise<IAutoBeFacadeApplicationResult>;
  test(props: { instruction: string }): Promise<IAutoBeFacadeApplicationResult>;
  realize(props: { instruction: string }): Promise<IAutoBeFacadeApplicationResult>;
}
```

**오케스트레이터 레벨: 단일 함수 + 유니언 타입의 향연**

대부분(47개)의 에이전트는 `process()`라는 단일 함수를 노출하되, 그 파라미터가 **판별 유니언 타입(discriminated union)**이다:

```typescript
export interface IAutoBeInterfaceSchemaRefineApplication {
  process(props: IAutoBeInterfaceSchemaRefineApplication.IProps): void;
}

export namespace IAutoBeInterfaceSchemaRefineApplication {
  export interface IProps {
    thinking: string;
    request:
      | IComplete                                     // ← 실제 작업 완료
      | IAutoBePreliminaryGetAnalysisSections         // ← RAG: 분석 섹션 조회
      | IAutoBePreliminaryGetDatabaseSchemas          // ← RAG: DB 스키마 조회
      | IAutoBePreliminaryGetInterfaceOperations      // ← RAG: API 오퍼레이션 조회
      | IAutoBePreliminaryGetInterfaceSchemas;        // ← RAG: 인터페이스 스키마 조회
  }
}
```

**두 층위의 하네싱(Dual Harnessing)**

이 구조를 이해하면, AutoBE의 품질 보증이 **이중 구조**임이 드러난다:

```
┌─────────────────────────────────────────────────────────┐
│  Layer 1: 사고 과정의 하네싱 (Process Harnessing)          │
│                                                         │
│  "어떻게 생각할 것인가"를 스키마로 강제                       │
│                                                         │
│  - thinking: 현재 상태 진단                                │
│  - reason: 각 판단의 근거 기술                              │
│  - databaseSchemaProperty: DB 매핑 관계 명시                │
│  - specification: 구현 방법 설계                            │
│  - description: 소비자 관점 문서화                           │
│  - excludes + revises: 전수조사 (누락 불가)                  │
│                                                         │
│  → 사고를 하지 않으면 스키마 검증 실패                        │
│  → LLM이 "올바른 순서로 올바른 것들을 생각하게" 만듦           │
│                                                         │
├─────────────────────────────────────────────────────────┤
│  Layer 2: 결과물의 하네싱 (Output Harnessing)              │
│                                                         │
│  "만든 결과가 맞는가"를 컴파일러로 검증                       │
│                                                         │
│  - Tier 1: Prisma Compiler → DB 스키마 유효성               │
│  - Tier 2: OpenAPI Compiler → API 명세 정합성               │
│  - Tier 3: TypeScript Compiler → 코드 타입 안전성           │
│                                                         │
│  → 결과가 틀리면 진단 + 자가치유 루프                         │
│  → LLM이 "올바른 결과를 낼 때까지" 반복                      │
│                                                         │
└─────────────────────────────────────────────────────────┘
```

Claude Code는 Layer 2조차 제한적이다 (LSP 진단은 있지만 자동 수정 루프 없음). AutoBE는 **Layer 1에서 사고의 질을 통제하고, Layer 2에서 결과의 정확성을 보증**한다.

**스키마로 강제되는 사고의 흐름 — 속성 레벨 CoT**

`IComplete`의 각 필드를 뜯어보면, 이것이 **백엔드 개발자의 사고 프로세스를 강제하는 Chain-of-Thought(CoT) 스키마**임을 알 수 있다:

```typescript
// depict: "타입은 맞는데 문서가 부족할 때"
interface AutoBeInterfaceSchemaPropertyDepict {
  type: "depict";
  key: string;                       // 어떤 속성을?
  databaseSchemaProperty: string | null;  // 어떤 DB 컬럼을 참고했는가?
  reason: string;                    // 왜 수정이 필요한가?
  specification: string;             // 구현 에이전트에게 전달할 내부 스펙
  description: string;               // API 소비자에게 보여줄 외부 설명
}

// create: "빠진 속성을 추가할 때" — 가장 풍부한 사고 요구
interface AutoBeInterfaceSchemaPropertyCreate {
  type: "create";
  key: string;
  databaseSchemaProperty: string | null;  // null이면 계산 속성
  reason: string;
  specification: string;             // null인 경우: JOIN, 집계, 비즈니스 룰 전부 기술
  description: string;
  schema: AutoBeOpenApi.IJsonSchema; // JSON Schema 정의
  required: boolean;
}
```

`excludes`와 `revises`를 합치면 해당 테이블의 **모든 DB 속성을 빠짐없이 커버**해야 한다. 하나라도 빠뜨리면 검증 실패다. LLM이 "대충 주요 필드만 넣고 나머지는 생략"하는 것이 원천적으로 불가능하다.

**핑크 코끼리 원리와 Preliminary 유니언**

LLM이 `getAnalysisSections`를 한 번 호출하면, 해당 타입이 유니언에서 **물리적으로 제거**된다. "같은 데이터를 두 번 요청하지 마라"는 프롬프트 지시 대신, **스키마에서 선택지를 없애는 것**으로 제약을 강제한다.

```
프롬프트: "varchar, text, bigint를 쓰지 마라" → LLM이 오히려 생각함
스키마: type: "boolean" | "int" | "double" | "string" | "uri" | "uuid" | "datetime"
→ varchar가 선택지에 존재하지 않음 → 물리적으로 생성 불가
```

**부재를 통한 제약**이 **금지를 통한 제약**보다 항상 더 강력하다.

**Function Calling Harness: 6.75% → 99.8%**

Typia의 3계층 Harness가 이 모든 것을 가능하게 한다:

| 모델 | 첫 시도 FC 성공률 | Harness 적용 후 |
|------|-------------------|-----------------|
| qwen3-coder-next | 6.75% | 99.8%+ |
| GPT-4o (NESTFUL) | 28% | — |

**Layer 1: 관대한 JSON 파싱 (Typia)**
```
- 마크다운 코드 블록 제거: ```json ... ```
- 닫히지 않은 문자열 완성: "hello → "hello"
- 따옴표 없는 키: {name: "x"} → {"name": "x"}
- 후행 쉼표: [1, 2,] → [1, 2]
- 불완전 키워드: tru → true, fal → false
```

**Layer 2: 타입 강제 변환**
```
- string이 기대되는 곳에 number가 오면 → String(number)
- 배열 기대에 단일 값 → [단일 값]
```

**Layer 3: 검증 피드백**
```json
{
  "models": [{
    "name": "shopping_sale",
    "fields": [{
      "name": "price",
      "type": "varchar"  // ❌ Expected: "boolean" | "int" | "double" | "string" | "uri" | "uuid" | "datetime"
    }]
  }]
}
```

`// ❌` 인라인 에러 마커가 **정확히 어느 필드가 왜 틀렸는지** LLM에게 직접 보여준다.

#### 스키마 비교

| 관점 | Claude Code (Zod) | AutoBE (Typia) |
|------|-------------------|----------------|
| 변환 시점 | 런타임 | **컴파일타임** |
| 스키마 소스 | Zod 체인 DSL | TypeScript 인터페이스 |
| 스키마 복잡도 | 얕음 (깊이 1, 5~15 필드) | 깊음 (깊이 3+, 재귀적 AST) |
| tool_choice | 미설정 (auto) | "required" |
| 자유 텍스트 | 허용 | 금지 (enforceFunctionCall) |
| 출력 패턴 | 점진적 (여러 턴에 걸쳐) | 일괄 (한 턴에 plan→draft→revise) |
| 실패 처리 | 사용자에게 에러 표시 | 자동 재시도 + 피드백 루프 |

---

### 3.3. 메모리와 RAG: 정적 주입 vs 동적 수집

#### Claude Code: 4계층 CLAUDE.md + 메모리 파일

Claude Code는 프로젝트 맥락을 **파일 시스템 기반**으로 주입한다:

```
계층 1: Managed: /etc/claude-code/CLAUDE.md (시스템 전역)
계층 2: User:    ~/.claude/CLAUDE.md (사용자 전역)
계층 3: Project: ./CLAUDE.md, ./.claude/rules/*.md (프로젝트별)
계층 4: Local:   ./CLAUDE.local.md (개인, 비커밋)
```

**발견 알고리즘** (1,479줄):

```
CWD에서 파일 시스템 루트까지 상향 탐색:
  /home/user/project/src/feature/
    → .claude/CLAUDE.md (있으면 로드)
    → CLAUDE.md (있으면 로드)
  ... 루트까지 반복

CWD에 가까울수록 높은 우선순위
```

**@include 지시어**로 모듈화:

```markdown
@./coding-standards.md    <!-- 상대 경로 -->
@~/global-rules.md        <!-- 홈 디렉터리 -->
```

**중첩 메모리**: 파일 읽기가 CLAUDE.md 발견을 트리거한다. `loadedNestedMemoryPaths` Set과 100개 LRU로 이중 중복 방지.

**특징**: 모든 것이 **정적**이다. CLAUDE.md 파일이 대화 시작 시 한 번 로딩되고, 이후 컨텍스트에 고정된다. LLM이 능동적으로 "더 필요한 정보가 있으니 로드하겠다"고 결정할 수 없다.

#### AutoBE: AutoBePreliminaryController — 동적 RAG 루프

AutoBE의 Preliminary 시스템은 **LLM이 능동적으로 데이터를 요청하는** 구조다:

```typescript
public async orchestrate<T>(ctx, process): Promise<T | never> {
  for (let i = 0; i < AutoBeConfigConstant.RAG_LIMIT; ++i) {  // 최대 7회
    const result = await process(...);
    if (result.value !== null) return result.value;  // 작업 완료
    // LLM이 "getDatabaseSchemas"를 호출 → 데이터 로딩
    await orchestratePreliminary(ctx, { ... });
  }
  throw new AutoBePreliminaryExhaustedError();
}
```

**LOADED/AVAILABLE 구조**:

```typescript
// LOADED: LLM에게 이미 제공된 데이터 (전체 JSON)
"## LOADED Database Schemas"
→ 완전한 스키마 정의

// AVAILABLE: 아직 제공되지 않은 데이터 (인덱스만)
"## AVAILABLE Database Schemas"
→ "| name | fields | relations |" (이름만, 토큰 절약)
```

LLM은 AVAILABLE 테이블을 보고 필요한 스키마를 판단하여 `getDatabaseSchemas`를 호출한다. 전체 데이터가 아닌 **인덱스만** 보여주므로 토큰을 절약하면서도 판단에 충분한 정보를 제공한다.

**의존성 자동 보완**: LLM이 `IShoppingSale` 스키마를 요청하면, 그 안에 `$ref: "#/components/schemas/IShoppingSaleSnapshot"`이 있다면 `IShoppingSaleSnapshot`도 **자동으로 함께 로딩**된다.

**동적 스키마 수정**: 이전 이터레이션이 없으면 `getPreviousXXX` 타입이 유니언에서 제거된다. 호출한 Preliminary 타입도 제거된다.

**동작 흐름 예시**:

```
┌─ 턴 1: LLM이 { type: "getDatabaseSchemas", schemaNames: ["user", "order"] }
│  → user, order 스키마를 local에 추가
│  → order가 $ref로 참조하는 product도 자동 보완
│  → 유니언에서 getDatabaseSchemas 제거
├─ 턴 2: LLM이 { type: "getInterfaceOperations" }
│  → 관련 API 오퍼레이션 목록 로딩
└─ 턴 3: LLM이 { type: "complete", review: "...", revises: [...] }
   → 작업 완료, 결과 반환
```

#### 비교: 정적 주입 vs 동적 수집

| 측면 | Claude Code | AutoBE |
|------|-------------|--------|
| 로딩 시점 | 대화 시작 시 일괄 | LLM이 필요할 때 점진적 |
| 데이터 선택 | 사람이 CLAUDE.md 작성 | LLM이 유니언 타입으로 선택 |
| 중복 방지 | loadedNestedMemoryPaths (Set) | 유니언에서 물리적 제거 |
| 의존성 해결 | 없음 | $ref 기반 자동 보완 |
| 크기 제한 | 컨텍스트 창 의존 → 압축 | 필요한 것만 → 애초에 작음 |
| 페이지네이션 | 없음 | 75개씩 자동 페이지네이션 |
| 프롬프트 수 | 1개 (조립식) | 87개 (전용) |
| 사용자 커스터마이징 | 무한 (자유 텍스트) | 없음 (고정 파이프라인) |

Claude Code의 CLAUDE.md 시스템은 **사용자의 의도를 학습**하는 시스템이다. AutoBE의 시스템 프롬프트는 **개발자의 의도를 강제**하는 시스템이다. 전자는 유연성을, 후자는 정밀성을 극대화한다.

---

## 4. 컴파일러와 검증

> 하네싱이 LLM의 **입력**을 통제한다면, 컴파일러는 **출력**을 통제한다. 이것이 두 프로젝트의 가장 근본적인 차이다.

### 4.1. 검증 총론: 최선의 노력 vs 100% 보장

이것이 두 프로젝트 사이의 **가장 근본적인 차이**다.

#### Claude Code: LSP + 사후 확인

Claude Code는 Language Server Protocol을 통해 코드 분석을 지원한다:

```
LSPClient (JSON-RPC) → LSPServerManager → LSPServerInstance (워크스페이스별)
                                               ↕
                                    LSPDiagnosticRegistry (진단 집계)
                                               ↕
                                    passiveFeedback (시스템 프롬프트에 진단 주입)
```

LSP 기능: `hover`, `goToDefinition`, `findReferences`, `documentSymbol`, `workspaceSymbol`, `goToImplementation`, `callHierarchy`

그러나 이것은 **보조 수단**이다. LSP 진단이 시스템 프롬프트에 주입되지만, LLM이 생성한 코드에 타입 에러가 있어도 자동 수정 루프는 **없다**. 사용자가 직접 확인하고, 에러를 보고하고, 수정을 요청해야 한다.

#### AutoBE: 3단계 컴파일러 파이프라인

AutoBE의 컴파일러 시스템은 프로젝트의 **존재 이유**다.

**Tier 1: Prisma Database Compiler** — 874줄 자체 검증기로 8가지 카테고리(중복, 네이밍, FK 무결성, 순환 참조, 예약어, 인덱스 최적화, GIN 타입 호환, 관계 충돌)를 검증한다. 상세 구조는 [4.2절](#42-3층-컴파일러의-내부)에서 다룬다.

**Tier 2: OpenAPI Interface Compiler**

```
Layer A: OpenAPI 스펙 유효성 → 중복 감지, 스키마 참조 해석, 규격 준수
Layer B: Prisma 정합성 → DB 필드가 실제 존재하는지 교차 검증
Layer C: NestJS 생성 → 컨트롤러, DTO, SDK, E2E 테스트 스캐폴드
         + Prettier 포맷팅 + "keyword: true" AI 함수 호출 최적화
```

**Tier 3: TypeScript Compiler**

```
- strict 모드 전체: noImplicitAny, strictNullChecks, strictFunctionTypes
- 증분 컴파일: 이전 ts.Program 재사용 → 30초 → 2초 (15배 향상)
- ESLint 통합: no-floating-promises 등 커스텀 규칙
- 진단 구조: { file, category, code, start, length, messageText }
```

**자가치유 루프**:

```typescript
// orchestratePrismaCorrect.ts
async function iterate(ctx, application, life) {
  const result = await compiler.database.validate(application);
  if (result.success) return result;          // 성공
  if (life < 0) return result;                // 재시도 소진

  ctx.dispatch({ type: "databaseValidate", result, ... });
  const corrected = await process(ctx, result);

  // 수정된 모델만 교체 (전체 재생성 아님)
  const newApplication = {
    files: result.data.files.map(file => ({
      ...file,
      models: file.models.map(model => {
        const fixed = corrected.models.find(m => m.name === model.name);
        return fixed ?? model;
      }),
    })),
  };

  return iterate(ctx, newApplication, life - 1);  // 재귀
}
```

에러가 많으면 배치 처리한다 (기본 8개씩). 진단 메시지의 **교육적 형식**("What happened? → Why? → How to fix?")은 [4.3절](#43-진단의-llm-최적화)에서 상세히 다룬다.

#### 비교

| 측면 | Claude Code | AutoBE |
|------|-------------|--------|
| 컴파일러 수 | 0 (자체) | 3 (Prisma + OpenAPI + TS) |
| 검증 규칙 | LSP 의존 (외부) | 874줄 자체 검증기 |
| 교정 루프 | 없음 (수동) | 자동 (최대 30회) |
| 에러 힌트 | LLM 판단 | TS2339 특수 분석 |
| 배치 교정 | 없음 | 세마포어 8 병렬 |
| 성공 보장 | 없음 | 99.8% (Qwen3 35B 기준) |

---

### 4.2. 3층 컴파일러의 내부

#### 1층: Prisma 데이터베이스 컴파일러

```typescript
// packages/compiler/src/database/AutoBeDatabaseCompiler.ts
class AutoBeDatabaseCompiler {
  writePrismaSchemas(app): Record<string, string>  // AST → Prisma 파일
  compilePrismaSchemas(schemas): ISuccess | IFailure | IException  // Prisma → Client SDK
  validate(app): IAutoBeDatabaseValidation[]  // 의미론적 검증 (874줄)
}
```

**874줄 검증기** (`validateDatabaseApplication.ts`):

```typescript
// 8가지 카테고리의 검증:
// 1. 중복 파일명
// 2. 파일 간 중복 모델명
// 3. 모델 내 중복 필드명
// 4. 중복 인덱스
// 5. 중복 관계 반대명
// 6. 유효한 식별자명
// 7. 인덱스 필드 존재성 + 타입 호환성
// 8. 외래키 참조 + 순환 의존성
```

에러 구조는 **AI가 이해하기 쉬운 형식**으로 설계되어 있다:

```typescript
interface IError {
  path: string       // "application.files[0].models[1].foreignFields[0]"
  table: string | null
  field: string | null
  message: string    // "What happened? Why? How to fix?" 교육적 형식
}
```

#### 2층: OpenAPI 인터페이스 컴파일러

```typescript
class AutoBeInterfaceCompiler {
  transform(doc: AutoBeOpenApi.IDocument): OpenApi.IDocument  // AST → 표준 OpenAPI v3.1
  invert(doc: OpenApi.IDocument): AutoBeOpenApi.IDocument     // 역변환
  async write(doc): Promise<Record<string, string>>           // AST → 전체 NestJS 프로젝트
  // 생성 옵션: keyword: true, simulate: true, e2e: true, + Prettier
}
```

#### 3층: TypeScript 컴파일러

```typescript
const compiler = new EmbedEsLint({
  external: NestJSExternal,
  compilerOptions: { strict: true, experimentalDecorators: true, ... },
  transformers: (program, diagnostics) => ({
    before: [
      typiaTransform(program, {}, { addDiagnostic }),    // 런타임 검증 코드
      nestiaCoreTransform(program, {}, { addDiagnostic }) // NestJS 데코레이터
    ]
  })
});

rules: { "no-floating-promises": "error" }
```

**TypeScript 교정은 더 정교하다**:

```typescript
for (let i = 0; i < AutoBeConfigConstant.COMPILER_RETRY; i++) {
  const compiled = await compileRealizeFiles(ctx, { functions, ... });
  const errorsByFunction = groupDiagnosticsByFunction(compiled.diagnostics);

  const corrected = await executeCachedBatch(ctx,
    failedFunctions.map(func => async () => {
      // 각 함수에게: 템플릿 + 이전 실패 히스토리 (P2-3 요약) + 현재 진단 + TS2339 힌트
      return await correctFunction(ctx, func, errors);
    })
  );

  const { success, failed, ignored } = separateResults(corrected);
  if (failed.length === 0) break;
  functions = [...success, ...failed];
}
```

---

### 4.3. 진단의 LLM 최적화

AutoBE의 컴파일러 진단 시스템은 단순히 "에러를 전달"하는 것이 아니라, **LLM이 최대한 효과적으로 이해하고 수정할 수 있도록 가공**한다.

#### 4단계 진단 파이프라인

```
TypeScript Compiler (EmbedEsLint)
    ↓ raw diagnostics[]
compileWithFiltering()      — 해당 파일의 에러만 추출
    ↓ filtered diagnostics[]
deduplicateDiagnostics()    — 캐스케이딩 에러 압축 (25개 상한)
    ↓ deduplicated diagnostics[]
transformPreviousAndLatestCorrectHistory()  — LLM용 포맷
    ↓ 3-layer presentation
LLM Correction Agent
```

#### 캐스케이딩 에러 압축

하나의 타입 오류가 50~300개의 연쇄 에러를 발생시킬 수 있다:

```typescript
const deduplicateDiagnostics = (diagnostics) => {
  const byMessage = new Map();
  for (const d of diagnostics) {
    const existing = byMessage.get(d.messageText);
    if (existing) existing.count++;
    else byMessage.set(d.messageText, { diag: d, count: 1 });
  }
  // 중복 표시: "... (repeated N times - fix the root cause)"
  // 25개 상한 — 그 이상은 LLM을 혼란시킬 뿐
};
```

#### TS2339 특화 힌트

가장 흔한 에러 `Property 'X' does not exist on type 'Y'`에 대해 **도메인 특화 수정 가이드**를 생성한다:

```typescript
// generateTS2339Hints.ts
return [
  "## TS2339 Relation Field Hints",
  "**Fix**: For each property below, add it to `select()`:",
  "- Scalar field → `fieldName: true`",
  "- Relation (has neighbor transformer) → `relation: NeighborTransformer.select()`",
  "- Aggregate count → `_count: { select: { relation: true } }`",
].join("\n");
```

**범용 에러 메시지를 도메인 특화 수정 지침으로 변환**하는 것이다. 에러 주석이 달린 코드도 생성한다:

```typescript
// hint #1:
// ```typescript
// const result = selectData(null); // error: Argument of type 'null' is not assignable
// ```
```

```
Claude Code: LSP diagnostics → 텍스트 그대로 LLM에 전달 → 가공/힌트 없음
AutoBE: TypeScript diagnostics → 필터링 → 중복 제거 → 주석화 → 힌트 생성
```

---

## 5. 코드 생성 파이프라인

> 컴파일러가 "맞는가?"를 판단한다면, 이 장은 "무엇을 만드는가?"를 다룬다. AST 설계부터 완성된 NestJS 프로젝트까지의 여정이다.

### 5.1. AST 설계 철학

#### Claude Code: 표준 도구 스키마

Claude Code에는 "AST"라는 개념이 없다. 도구는 **범용 JSON Schema**로 정의되고, 각 도구는 독립적이며, 도구 간 데이터 흐름은 LLM의 자유 텍스트를 통한다:

```
EditTool → 텍스트 결과 → (LLM이 해석) → BashTool → 텍스트 결과 → (LLM이 해석)
```

도구 스키마에 교차 참조가 없다. 이것은 **제약이자 자유**다—어떤 프로젝트든, 어떤 언어든 동일한 도구 풀로 작업할 수 있지만, 생성물의 구조적 일관성은 LLM의 능력에 전적으로 의존한다.

#### AutoBE: AutoBeOpenApi — AI가 생성하기 위한 간소화된 AST

AutoBE의 OpenAPI AST는 표준 OpenAPI 3.1에서 **LLM이 혼동할 수 있는 요소를 제거**한 버전이다:

```typescript
export namespace AutoBeOpenApi {
  export interface IOperation extends IEndpoint {
    specification: string;      // 내부 구현 가이드 (Realize/Test 에이전트용)
    description: string;        // 외부 API 문서 (Swagger UI용)
    authorizationType: "login" | "join" | "refresh" | null;
    authorizationActor: (string & CamelCasePattern) | null;
    parameters: IParameter[];
    requestBody: IRequestBody | null;
    responseBody: IResponseBody | null;
  }
}
```

핵심 제거 사항:

```
표준 OpenAPI 3.1 → AutoBeOpenApi
  ❌ oneOf/anyOf 혼용 → ✅ oneOf만 사용
  ❌ type: ["string", "null"] → ✅ oneOf: [string, null] (명시적)
  ❌ inline object → ✅ $ref 강제 (재사용 보장)
  ❌ 임의 content-type → ✅ application/json 고정
  ❌ 파일 binary → ✅ string & Format<"uri"> (URL로 통일)
  ❌ additionalProperties → ✅ 금지 (명시적 속성만)
```

**specification vs description 이중 구조**: 모든 Operation과 Schema에 두 가지 설명이 있다. `specification`은 내부용("어떻게 구현하는가"), `description`은 외부용("무엇을 하는가"). Interface 단계의 에이전트가 `specification`에 기술한 구현 힌트를, Realize 단계의 에이전트가 읽고 따른다.

---

### 5.2. 데이터베이스 스키마 생성

Claude Code에서 데이터베이스 스키마를 만드는 과정: "Prisma 스키마 만들어줘" → LLM이 자유형식으로 생성 → 끝.

AutoBE의 데이터베이스 단계는 **7개의 전문 오케스트레이터**가 순차적으로 실행되는 공장 라인이다:

```
orchestratePrisma() [총괄]
  ├─ orchestratePrismaGroup()           → 도메인 그룹 스켈레톤
  ├─ orchestratePrismaGroupReview()     → 그룹 리뷰
  ├─ orchestratePrismaAuthorization()   → 인증 테이블
  ├─ orchestratePrismaComponent()       → 컴포넌트별 테이블 추출
  ├─ orchestratePrismaComponentReview() → 컴포넌트 리뷰
  ├─ orchestratePrismaSchema()          → 개별 테이블 생성 (이중 루프)
  │   ├─ Write Cycle: 미작성 테이블 생성
  │   └─ Review Cycle: 작성된 테이블 리뷰/교정
  └─ orchestratePrismaCorrect()         → 검증 루프 (최대 30회)
```

#### 도메인 분해: 그룹 → 컴포넌트 → 스키마

쇼핑몰 백엔드를 요청하면:

```
Step 1 (Group): 도메인 스켈레톤
  ├─ schema-01-authentication.prisma  (kind: "authorization")
  ├─ schema-02-products.prisma        (kind: "domain")
  ├─ schema-03-orders.prisma          (kind: "domain")
  └─ schema-04-payments.prisma        (kind: "domain")

Step 2 (Component): 테이블 이름 추출
  schema-02-products:
    ├─ shopping_products
    ├─ shopping_product_snapshots
    └─ shopping_product_tags

Step 3 (Schema): 개별 테이블 정밀 설계
  shopping_products: {
    primaryField: { name: "id", type: "uuid" },
    plainFields: [{ name: "name", type: "string" }, ...],
    foreignFields: [{ name: "seller_id", relation: { targetModel: "shopping_sellers" } }],
  }
```

**구조적 강제**: 인증 그룹은 정확히 1개, 도메인 그룹은 최소 1개. 도메인 에이전트에게 인증 테이블 생성이 **금지**되어 있다.

**30회 교정 루프**: `DATABASE_CORRECT_RETRY = 30`은 AutoBE에서 가장 높은 재시도 횟수다. 한 번에 최대 8개 모델만 교정하되, 중간 검증에서 성공하면 조기 종료한다.

**정규화 강제**: `DATABASE_SCHEMA.md`(420줄)에서 1NF~3NF, FK 방향, 순환 참조 금지를 체계적으로 강제한다. Claude Code에서 "정규화된 스키마 만들어줘"라고 하면 LLM이 최선을 다할 것이다. AutoBE에서는 검증기가 위반을 **자동 탐지하고 교정**한다.

---

### 5.3. AST에서 NestJS까지

AutoBE만의 고유한 영역: **OpenAPI AST → 완전한 NestJS 프로젝트**를 생성하는 파이프라인.

#### 변환 파이프라인: 3단계

```
AutoBeOpenApi.IDocument
  ↓ transformOpenApiDocument()
OpenApi.IDocument (표준 v3.1)
  ↓ NestiaMigrateApplication
NestJS 프로젝트 (컨트롤러 + DTO + SDK + 테스트)
```

생성되는 프로젝트 구조:

```
src/
├── controllers/
│   └── shopping/SaleController.ts     ← 자동 생성
├── providers/
│   ├── postShoppingSales.ts           ← AI 생성 + 컴파일러 검증
│   └── getShoppingSalesById.ts        ← AI 생성 + 컴파일러 검증
├── collectors/
│   └── ShoppingSaleCollector.ts       ← AI 생성 + 컴파일러 검증
├── transformers/
│   └── ShoppingSaleTransformer.ts     ← AI 생성 + 컴파일러 검증
packages/api/
├── swagger.json                       ← 자동 생성
└── src/*.ts                           ← 타입 안전 SDK
```

**모든 `AI 생성` 파일은 3층 컴파일러를 통과**해야 한다. 통과하지 못하면 교정 루프가 가동된다.

Claude Code에서 "쇼핑몰 백엔드 만들어줘"라고 하면 LLM이 파일을 하나씩 생성한다. 일관성 보장이 없고, 프로젝트가 커지면 컨텍스트 한계에 도달한다. AutoBE에서는 전체 프로젝트가 **하나의 타입 체인**으로 연결된다.

---

### 5.4. Collector/Transformer: 양방향 매핑

모든 CRUD API에는 두 방향의 데이터 변환이 필요하다:

```
API 요청 (DTO)  →  Collector  →  Prisma CreateInput  →  DB
DB  →  Prisma Payload  →  Transformer  →  API 응답 (DTO)
```

#### Collector: DTO → Prisma

```typescript
export namespace ShoppingSaleCollector {
  export async function collect(props: {
    body: IShoppingSale.ICreate;
    seller: IEntity;
  }) {
    return {
      id: v4(), name: props.body.name,
      seller: { connect: { id: props.seller.id } },
    } satisfies Prisma.shopping_salesCreateInput;
  }
}
```

#### Transformer: Prisma → DTO

```typescript
export namespace ShoppingSaleTransformer {
  export type Payload = Prisma.shopping_salesGetPayload<ReturnType<typeof select>>;

  export function select() {
    return { ... } satisfies Prisma.shopping_salesFindManyArgs;
    // implicit return type — 더 나은 타입 추론
  }

  export async function transform(input: Payload): Promise<IShoppingSale> {
    return { id: ..., title: ..., seller: ..., snapshots: ... };
  }
}
```

**`select()`의 implicit return type**: 가장 중요한 제약. `select(): Prisma.FindManyArgs`라고 쓰면 타입이 넓어져서 `GetPayload`가 `any`가 된다. `satisfies`를 쓰면 **리터럴 타입을 보존**하면서 타입 호환성을 검증한다. 정규식으로 위반을 감지한다.

**재귀 DTO**: 트리 구조의 재귀적 DTO를 위해 `VariadicSingleton` 캐시 기반 N+1 방지 템플릿을 제공한다.

**전체 매핑 검증**: Collector와 Transformer 모두 **모든 필드가 매핑되었는지** 검증한다. 누락된 필드가 있으면 검증 에러다. 이것은 3.2절의 **"excludes + revises = 완전 커버리지"**와 같은 철학이다.

---

### 5.5. E2E 테스트 자동 생성

Claude Code는 테스트를 **작성하지 않는다**. 사용자가 요청하면 LLM이 자유형식으로 생성할 뿐이다.

AutoBE는 **테스트를 공장 라인의 일부로 취급**한다:

```
orchestrateTest()
  ├─ orchestrateTestScenario()      → 오퍼레이션당 1-3개 시나리오
  ├─ orchestrateTestAuthorize()     → 인증 함수 (join/login/refresh)
  ├─ orchestrateTestPrepare()       → 테스트 데이터 준비 함수
  ├─ orchestrateTestGenerate()      → generate_random_* 리소스 생성기
  └─ orchestrateTestOperation()     → 실제 E2E 테스트 코드
```

#### 의존성 그래프 자동 해결

시나리오 생성기는 **재귀적으로 전제조건을 추적**한다:

```typescript
const traverse = (endpoint) => {
  if (visited.has(key)) return;
  visited.add(key);
  for (const prerequisite of operation.prerequisites) {
    result.set(prerequisite.endpoint, [prerequisite]);
    traverse(prerequisite.endpoint);  // 재귀 탐색
  }
};
```

`POST /shopping/orders` 테스트 → `POST /shopping/carts/items` 필요 → `POST /shopping/sales` 필요 → `POST /auth/seller/join` 필요. **전체 의존성 체인을 자동으로 해결**한다.

#### 설계 결정들

- **입력 검증 테스트 금지**: 타입 시스템이 보장하는 것을 다시 테스트하지 않는다
- **4종 함수 분업**: Authorize, Prepare, Generate, Operation — 각각 독립적으로 생성→컴파일→교정
- **discard=true**: 교정 후에도 컴파일 실패하면 **조용히 폐기**. 컴파일 안 되는 테스트보다 **테스트가 없는 게 낫다**

| 측면 | Claude Code | AutoBE |
|------|-------------|--------|
| 테스트 생성 | 사용자 요청 시 자유형식 | 자동, 5단계 파이프라인 |
| 시나리오 설계 | LLM 자유재량 | 의존성 그래프 자동 해결 |
| 인증 처리 | 사용자가 직접 | 자동 (actor별 join/login) |
| 컴파일 보증 | 없음 | 100% (실패 시 폐기) |

---

## 6. 컨텍스트 엔지니어링

> 파이프라인이 아무리 정교해도, LLM의 컨텍스트 창에 **무엇이 들어가는가**가 품질을 결정한다. 두 프로젝트는 정반대의 전략을 취한다.

### 6.1. 압축의 예술 vs 변환의 정밀함

#### Claude Code: 5중 압축 전략

Claude Code는 긴 대화에서 컨텍스트 창을 관리하기 위해 5가지 전략을 계층적으로 사용한다:

**1. Snip (무료, 매 반복)** — 체크포인트 이전의 오래된 메시지를 제거한다.

**2. Cached Microcompact (캐시 친화적)** — API의 `cache_edits` 블록을 생성하여 도구 결과를 서버 측에서 삭제. 로컬 메시지는 수정하지 않으므로 캐시 무효화 없음.

**3. Time-based Microcompact (60분 갭)** — 마지막 어시스턴트 메시지 후 60분 이상 경과 시, 최근 5개만 유지.

**4. Context Collapse (feature-gated)** — 읽기 시점 투영(reader-time projection). 90% 지점에서 커밋, 95%에서 블록. Autocompact를 억제한다.

```
Context Collapse 임계값:
  90% 컨텍스트 → 단계적 압축 커밋
  95% 컨텍스트 → 차단 수준

문제: autocompact(93%)와 Context Collapse(90%)가 경쟁
해결: Context Collapse 활성 시 autocompact 억제
```

**5. Autocompact (LLM 요약, 임계값 초과 시)**

```typescript
const effectiveWindow = getContextWindowForModel(model) - 20000  // 요약 예약
const threshold = effectiveWindow - 13000  // 버퍼
// 3회 연속 실패 시 회로 차단
// BQ 데이터: 1,279 세션이 50+ 연속 실패, ~250K 낭비 API 호출/일
```

**413 오버플로우 복구**: Context Collapse와 통합하여, 413 발생 시 단계적 압축 큐를 강제 드레인한다.

#### AutoBE: History Transformer의 수술적 정밀함

AutoBE는 압축이 아니라 **변환**을 한다. 각 오케스트레이터는 자체 History Transformer를 가지며, 해당 작업에 **정확히 필요한 컨텍스트만** 조립한다.

```typescript
const transformRealizeWriteHistories = (props) => ({
  histories: [
    { type: "systemMessage", text: REALIZE_OPERATION_WRITE,
      _cache: { type: "ephemeral" } },              // 시스템 프롬프트 (캐시)
    { type: "userMessage", text: formatPrismaSchemas(props.state),
      _cache: { type: "ephemeral" } },              // 관련 Prisma 스키마만 (캐시)
    { type: "userMessage", text: formatOperation(props.operation) },
    { type: "userMessage", text: formatCollectors(props.collectors) },
  ],
  userMessage: "Implement the ${operationName} function.",
});
```

180KB의 전체 컨텍스트 → 8KB의 정밀 컨텍스트. **95% 감소**.

**executeCachedBatch 패턴**으로 프롬프트 캐싱을 극대화한다:

```
메시지 순서:
[시스템 프롬프트]     ← 모든 작업에서 동일 (캐시)
[Prisma 스키마]       ← 모든 작업에서 동일 (캐시)
[OpenAPI 공통 스키마]  ← 모든 작업에서 동일 (캐시)
[현재 오퍼레이션]      ← 작업마다 다름 (캐시 미스, 마지막에 배치)

40개 API 엔드포인트 구현 시:
  1번: 순차 실행, 10,000 토큰 전액 → 캐시 확립
  2-40번: 병렬 (세마포어 8), 90%가 캐시 히트
  절약: ~91%
```

#### 비교

| 측면 | Claude Code | AutoBE |
|------|-------------|--------|
| 전략 | 사후 압축 (이미 있는 컨텍스트를 줄임) | 사전 선별 (처음부터 최소한만 조립) |
| 정보 유실 | 요약 시 세부사항 유실 가능 | 유실 없음 (필요한 것만 있음) |
| 개발 비용 | 범용 (한 번 구현) | 작업당 커스텀 (58개 transformer) |
| 캐시 효율 | DYNAMIC_BOUNDARY로 분리 | 메시지 순서로 극대화 |
| 컨텍스트 증가 | O(N²) (대화 길이) | O(1) (고정 파이프라인) |

---

### 6.2. History Transformer와 메시지 정규화

#### Claude Code: 5,800줄 단일 파이프라인

Claude Code의 `messages.ts`는 **5,800줄**이 넘는다. 이 파일 하나가 모든 메시지 변환을 담당한다:

```typescript
// 1단계: normalizeMessages() — 다중 콘텐츠 블록 분리, UUID 생성
// 2단계: normalizeMessagesForAPI() — API 전송 직전 최종 변환
//   가상 메시지 필터링, 첨부파일 재배치, 연속 user 메시지 병합 (Bedrock),
//   도구 참조 필터링, tool_use/tool_result 쌍 보장

// 고아 도구 호출 정리:
function filterUnresolvedToolUses(messages) {
  // tool_use ID와 매칭되는 tool_result가 없으면 제거
  // 세션 resume 시 발생하는 불일치 복구
}

// 합성 메시지 11종:
// INTERRUPT, CANCEL, REJECT, NO_RESPONSE_REQUESTED, ...

// 시스템 프롬프트 조립 — 6단계 우선순위:
// Override > Coordinator > Agent > Custom > Default > Append
```

#### AutoBE: 58개 History Transformer

AutoBE는 5,800줄 파일 대신 **58개의 작은 트랜스포머 함수**를 사용한다:

| 단계 | 트랜스포머 수 | 핵심 역할 |
|------|-------------|----------|
| Analyze | 8 | 요구사항 분석: 시나리오, 섹션, 유닛, 크로스파일 리뷰, 결정 추출 |
| Common | 3 | RAG 엔진 (Preliminary), 캐스팅 교정, 에러 요약(P2-3) |
| Database | 9 | 그룹핑, 컴포넌트, 스키마 생성, 인가, 교정, 리뷰 |
| Interface | 18 | 엔드포인트, 오퍼레이션, 스키마 설계/캐스팅/리파인/리네임/보완/리뷰, 전제조건 |
| Test | 8 | 시나리오, 준비, 생성, 오퍼레이션별 테스트, 교정 |
| Realize | 12 | 콜렉터, 트랜스포머, 인가, 오퍼레이션 |
| **합계** | **58** | |

모든 58개 트랜스포머가 동일한 **3계층 패턴**을 따른다:

```typescript
return {
  histories: [
    // Layer 1: 시스템 프롬프트 (캐시 대상)
    { type: "systemMessage", text: SPECIFIC_PROMPT, _cache: { type: "ephemeral" } },
    // Layer 2: RAG 데이터 (Preliminary, 캐시 대상)
    ...props.preliminary.getHistories(),
    // Layer 3: 작업별 지시 (캐시 미스)
    { type: "assistantMessage", text: formatSpecificInstruction(props) },
  ],
  userMessage: "Execute the task.",
};
```

**P2-3 에러 요약 패턴**: 컴파일러 교정 루프에서 반복 실패 시, 오래된 에러를 규칙적으로 요약하되 최근 2개는 항상 전체 보존한다:

```typescript
function summarizeFailures(array) {
  if (array.length <= 2) return array;
  const summary = {
    script: "",  // 코드 없음 (토큰 절약)
    diagnostics: [{ messageText: `[Summary of ${olderCount} previous attempts...]` }]
  };
  return [summary, ...array.slice(-2)];
}
```

이것은 Claude Code의 autocompact와 **같은 문제를 다른 방식으로 해결**한다. autocompact는 전체 대화를 LLM에게 요약시키지만(정보 손실 불가피), P2-3는 구조화된 에러 데이터를 규칙적으로 요약한다(정보 손실 최소화).

#### 비교

| 측면 | Claude Code | AutoBE |
|------|-------------|--------|
| 메시지 변환 코드 | 5,800줄 / 1파일 | ~5,700줄 / 58파일 |
| 병합 로직 | 연속 user/assistant 메시지 병합 | 불필요 (매번 새 대화) |
| 고아 처리 | tool_use/tool_result 쌍 정리 | 불필요 (구조적 보장) |
| 합성 메시지 | 11종 | 없음 |
| V8 메모리 최적화 | `'' + line` 강제 문자열 평탄화 | 불필요 (단발성) |
| 토큰 효율 | 보통 (범용) | 극한 (180KB→8KB, 95% 감소) |

코드량은 비슷하지만 분산 방식이 다르다. Claude Code는 **하나의 만능 파이프라인**이고, AutoBE는 **58개의 전문 조립 라인**이다.

---

### 6.3. 토큰 경제학

#### Claude Code: 대화가 길어질수록 비용이 증가

```
턴 1: 시스템 프롬프트 (X 토큰) + 사용자 메시지 → 총 X+α
턴 2: X + 턴 1 전체 + 사용자 메시지 → 총 X+2α
...
턴 N: X + 턴 1~(N-1) 전체 → O(N²) 증가
→ 압축으로 O(N) 근사 시도, 하지만 정보 손실 불가피
```

#### AutoBE: 파이프라인 단위 고정 비용

```
Analyze Phase: 시스템 프롬프트 + 사용자 요구사항 → 고정
Database Phase: 시스템 프롬프트 + 분석 결과 요약 → 고정
Interface Phase: 시스템 프롬프트 + DB 스키마 + 분석 → 고정 (× N, 캐시)
Test Phase: 시스템 프롬프트 + 인터페이스 + DB → 고정 (× N, 캐시)
Realize Phase: 시스템 프롬프트 + 모든 이전 단계 → 고정 (× N, 캐시)

총 비용 = Σ(단계별 고정 비용 × 작업 수) → O(N), 대화 길이와 무관
```

executeCachedBatch가 이 구조를 극대화한다:

```
40개 API 엔드포인트 구현 시:
  캐시 없이: 40 × 10K 토큰 = 400K 토큰 (전액 과금)
  캐시 포함: 10K + 39 × (10K × 10% + 1K) = 49.1K 토큰 실효 비용
  절감률: ~88%
```

---

## 7. 에러 회복과 안전성

> 실패는 불가피하다. 문제는 **무엇이** 실패하고, **어떻게** 회복하느냐다.

### 7.1. 에러 회복: 인프라 재시도 vs 논리 자가치유

#### Claude Code: 7단계 인프라 회복

Claude Code의 에러 회복은 `query.ts`의 7개 `continue` 지점과 API 수준 재시도로 구현된다:

| 단계 | 트리거 | 회복 메커니즘 |
|------|--------|--------------|
| 1. `collapse_drain_retry` | 413 Prompt Too Long | 스테이지된 context collapse 배출 |
| 2. `reactive_compact_retry` | drain 후에도 413 | 전체 autocompact 실행 |
| 3. `max_output_tokens_escalate` | 8k 출력 한도 | 64k로 에스컬레이션 |
| 4. `max_output_tokens_recovery` | 64k 초과 | "resume directly" 메시지 주입 |
| 5. `streaming_fallback` | 스트리밍 실패 | 전체 재시도, 고아 메시지 tombstone |
| 6. `stop_hook_blocking` | 훅 에러 | 에러를 대화에 추가 후 재시도 |
| 7. `token_budget_continuation` | 예산 내 | 자동 계속 |

API 수준의 재시도 (`withRetry.ts`, 822줄):

```
지수 백오프: 500ms × 2^(attempt-1), 최대 32s, 25% 지터
529 에러: 3회 연속 → 폴백 모델 전환 (Opus → Sonnet)
429 에러: retry-after 헤더 존중
401 에러: OAuth 토큰 리프레시 후 재시도
ECONNRESET/EPIPE: 커넥션 재생성 후 즉시 재시도
ANT 전용 (persistent): 무한 재시도, 30초마다 하트비트
529 폴백: 사용자 대면 요청만 재시도, 백그라운드 요청은 즉시 포기
  → "capacity cascade에서 각 재시도가 3-10× gateway 증폭"
```

이것은 **인프라 수준의 회복**이다. "LLM이 생성한 코드에 버그가 있다"는 문제에 대해서는 사용자에게 의존한다.

#### AutoBE: 4계층 논리 자가치유

AutoBE의 에러 회복은 **코드의 논리적 정합성 수준**에서 작동한다:

```
Layer 1: API 인프라 재시도 (Claude Code와 유사)
  randomBackoffRetry: 429/500/503 → 지수 백오프
  API_ERROR_RETRY = 3

Layer 2: Function Calling 강제 재시도
  LLM이 텍스트만 응답했을 때 → "함수를 호출하라" 재요청
  FUNCTION_CALLING_RETRY = 3

Layer 3: 검증 재시도 (Typia 런타임 검증 실패)
  LLM 출력이 스키마에 안 맞을 때 → 인라인 에러 피드백 후 재시도
  VALIDATION_RETRY = 3

Layer 4: 컴파일러 교정 루프 (AutoBE 고유)
  컴파일러가 의미적 에러를 잡았을 때 → 진단 메시지와 함께 재생성
  COMPILER_RETRY = 4           // 일반 컴파일
  DATABASE_CORRECT_RETRY = 30  // DB 스키마 (캐스케이딩 에러)
```

Layer 4가 Claude Code에는 없는 **근본적 차별점**이다:

```
Claude Code:
  LLM 응답 → 사용자에게 표시 → (사용자가 에러 발견) → 사용자가 수정 요청
  ↑ 사람이 검증                                    ↑ 사람이 피드백

AutoBE:
  LLM 응답 → 컴파일러 검증 → (에러 발견) → 진단 추출 → LLM에 피드백 → 재생성
  ↑ 기계가 검증                           ↑ 기계가 피드백
  → 최대 30회 반복
```

구성 상수:

```typescript
VALIDATION_RETRY = 3          // Typia 검증 재시도
API_ERROR_RETRY = 3           // API 에러 재시도
FUNCTION_CALLING_RETRY = 3    // 함수 호출 강제
DATABASE_CORRECT_RETRY = 30   // Prisma 교정
COMPILER_RETRY = 4            // TypeScript 교정
RAG_LIMIT = 7                 // RAG 반복
SEMAPHORE = 8                 // 기본 동시성
TIMEOUT = 20 * 60 * 1000     // 20분 타임아웃
```

---

### 7.2. 안전성 모델: 6중 방어 vs 컴파일러 게이트

이 비교가 두 프로젝트의 **존재 이유 차이**를 가장 명확히 드러낸다.

#### Claude Code: "사용자의 컴퓨터를 지키는" 6중 방어

Claude Code는 **사용자의 시스템에서 직접 명령을 실행**하기 때문에, 안전성이 곧 "파괴적 명령으로부터 사용자를 보호하는 것"이다:

```
┌─ Layer 1: Semantic Command Analysis (bashClassifier) ────────────────┐
│  Bash 명령의 의미론적 분석 — 트리시터 AST 파싱으로 구문 분석           │
│  셸 인젝션, 출력 리디렉션, heredoc 치환 탐지                          │
│  MAX_SUBCOMMANDS_FOR_SECURITY_CHECK = 50 (ReDoS 방지)                │
├─ Layer 2: Transcript Classifier (yoloClassifier) ────────────────────┤
│  전체 대화 히스토리를 LLM에 보내 맥락적 안전성 판단                    │
│  2단계 분류: fast → thinking (XML 기반)                               │
│  3회 연속 거부 → 사용자에게 직접 물음                                  │
├─ Layer 3: OS-Level Sandboxing ───────────────────────────────────────┤
│  macOS: seatbelt (네이티브)                                          │
│  Linux: bubblewrap (bwrap) + socat + seccomp                         │
│  네트워크: allowedDomains/deniedDomains, HTTP/SOCKS 프록시            │
├─ Layer 4: Permission Rules (8종 소스) ───────────────────────────────┤
│  policySettings, flagSettings, projectSettings, localSettings,       │
│  userSettings, cliArg, command, session                              │
│  패턴 매칭: Bash(git:*), Edit(/src/**), Read(/tmp/*)                 │
├─ Layer 5: Destructive Pattern Detection ─────────────────────────────┤
│  DANGEROUS_BASH_PATTERNS: python, node, ssh, sudo, eval, exec...     │
│  git bare-repo 파일 스크러빙 (core.fsmonitor 탈출 방지)              │
│  NTFS 8.3 단축명 차단 (GIT~1, GIT~2)                                │
├─ Layer 6: Tool Result Budget ────────────────────────────────────────┤
│  DEFAULT_MAX_RESULT_SIZE_CHARS = 50,000                              │
│  초과 시 디스크 저장 → <persisted-output> 태그로 참조                 │
└──────────────────────────────────────────────────────────────────────┘
```

**권한 시스템 상세** (5계층 규칙 엔진):

```typescript
type PermissionRuleSource =
  | 'policySettings'    // 조직 관리자 설정 (최고 우선순위)
  | 'flagSettings'      // 런타임 Feature Flag
  | 'projectSettings'   // 프로젝트별 설정
  | 'localSettings'     // 사용자 로컬 설정
  | 'userSettings'      // 전역 사용자 설정 (최저 우선순위)
  | 'cliArg' | 'command' | 'session'
```

**거부 추적과 회로 차단**: auto 모드가 연속 3회 또는 총 20회 거부하면 사용자에게 물어보기로 전환한다. AI 분류기의 오작동에 대한 안전장치다.

**파일 히스토리**: SHA-256 기반 스냅샷 시스템(1,115줄)으로 특정 시점으로 되감기 가능. MAX_SNAPSHOTS = 100, LRU 방출.

**파괴적 명령어 감지**: `git reset --hard`, `rm -rf`, `DROP TABLE`, `kubectl delete`, `terraform destroy` 등.

#### AutoBE: "생성물이 올바른지 보증하는" 컴파일러 게이트

AutoBE는 사용자의 시스템에서 명령을 실행하지 않는다. 위험은 **잘못된 코드가 생성되는 것**이다:

```
┌─ Gate 1: 스키마 검증 (Typia 런타임) ────────────────────────────────┐
│  LLM의 Function Calling 출력이 TypeScript 인터페이스에 맞는지 검증    │
│  인라인 에러 마커로 정확한 위치 피드백                                │
├─ Gate 2: Prisma Database Compiler ──────────────────────────────────┤
│  파일/모델/필드 중복, snake_case, FK 무결성, 순환참조, 예약어         │
│  교육적 에러 메시지 (What happened? Why? How to fix?)                │
├─ Gate 3: OpenAPI Interface Compiler ────────────────────────────────┤
│  스펙 유효성, 스키마 참조, Prisma 교차 검증                          │
├─ Gate 4: TypeScript Compiler (strict) ──────────────────────────────┤
│  noImplicitAny, strictNullChecks, strictFunctionTypes               │
│  증분 컴파일 + ESLint no-floating-promises                           │
└──────────────────────────────────────────────────────────────────────┘
```

AutoBE는 **가상 파일 시스템**(`Record<string, string>`)에서 작동한다. 실제 디스크에 쓰는 것은 최종 출력 단계 뿐이다. 실행 취소 불필요(이전 상태가 메모리에), 파괴적 명령어 불가능(BashTool 없음), 파일 백업 불필요(이벤트 소싱으로 상태 재구성 가능).

#### 비교: 근본적으로 다른 위협 모델

| 측면 | Claude Code | AutoBE |
|------|-------------|--------|
| **위협** | LLM이 사용자 시스템을 파괴 | LLM이 잘못된 코드를 생성 |
| **보호 대상** | 파일시스템, 네트워크, 프로세스 | 코드 정합성, 타입 안전성 |
| **방어 계층** | 6중 (분류기→샌드박스→권한→패턴) | 4중 (스키마→Prisma→OpenAPI→TS) |
| **ML 사용** | 2종 분류기 (bash + yolo) | 없음 (결정론적 컴파일러) |
| **OS 통합** | seatbelt, bwrap, seccomp | 없음 (순수 코드 분석) |
| **false positive** | 가능 (안전한 명령 차단) | 없음 (컴파일 성공/실패만) |
| **자가 치유** | 없음 (사용자에게 물음) | 있음 (진단 → 재생성) |

**근본적 통찰**: Claude Code는 "올바르지 않은 행동을 **사전에 차단**"하고, AutoBE는 "올바르지 않은 결과를 **사후에 교정**"한다. 방화벽을 쌓는 것보다, **불이 날 수 없는 구조를 만드는 것**이 더 안전하다.

---

## 8. 인프라와 운영

> 에이전트, 하네싱, 컴파일러, 컨텍스트, 에러 회복—이 모든 것을 **지탱하는 기반**이다.

### 8.1. 상태 관리와 영속성

#### Claude Code: 200+ 필드의 중앙 집중 상태

```typescript
type State = {
  sessionId: SessionId
  totalCostUSD: number
  totalAPIDuration: number
  modelUsage: { [modelName: string]: ModelUsage }
  isInteractive: boolean
  kairosActive: boolean  // Agent 모드
  meter: Meter | null    // OpenTelemetry
  // ... 200+ 필드
}
```

React의 `useSyncExternalStore`로 UI와 동기화. 세션 히스토리는 `~/.claude/sessions/<id>/`에 증분 저장. 복원 시 메시지를 다시 로딩하면 이전 대화가 이어진다.

#### AutoBE: Step Counter 패턴

AutoBE의 상태는 정확히 **10개 슬롯**이다:

```typescript
interface AutoBeState {
  analyze: AutoBeAnalyzeHistory | null;          // step: N
  database: AutoBeDatabaseHistory | null;        // step: N, analyzeStep
  interface: AutoBeInterfaceHistory | null;      // step: N, analyzeStep, databaseStep
  test: AutoBeTestHistory | null;                // step: N, analyzeStep, interfaceStep
  realize: AutoBeRealizeHistory | null;          // step: N, analyzeStep, interfaceStep
  previousAnalyze: AutoBeAnalyzeHistory | null;
  previousDatabase: AutoBeDatabaseHistory | null;
  previousInterface: AutoBeInterfaceHistory | null;
  previousTest: AutoBeTestHistory | null;
  previousRealize: AutoBeRealizeHistory | null;
}
```

**자동 무효화**: Analyze가 재실행되면 (`step = 1 → 2`), Database 이하 **전부 자동 무효화**된다. `predicateStateMessage()`에서 전제 조건 검사로 활용된다.

`previous*` 필드가 있어서 이전 반복과 현재 반복의 결과를 **비교**할 수 있다. 상태 전이는 이벤트 디스패치로만 발생한다.

| 측면 | Claude Code | AutoBE |
|------|-------------|--------|
| 상태 모델 | 메시지 배열 (200+ 필드) | 이벤트 소싱 (10 필드) |
| 무효화 | 수동 (코드에서 명시) | 자동 (Step Counter) |
| 이전 버전 | 없음 | previous* 필드로 보존 |
| 크기 | 대화가 길어지면 무한 증가 | 5단계 × 2 = 고정 |

---

### 8.2. 이벤트 시스템과 통신

#### Claude Code: JWT + WebSocket Bridge

Claude Code의 IDE 통합은 복잡한 브릿지 프로토콜을 사용한다:

**v1 프로토콜**: WebSocket(읽기) + HTTP POST(쓰기), `stream_event`는 100ms 버퍼링 후 배치 POST

**v2 프로토콜**: SSE(읽기) + CCR Worker API(쓰기), JWT 인증

**중복 제거** (BoundedUUIDSet): O(1) 링 버퍼로 에코와 서버 리플레이를 감지. 토큰 갱신 스케줄러: 만료 5분 전 선제적 갱신, 세대 카운터로 오래된 비동기 갱신 방지.

**4중 텔레메트리 싱크**:

```
이벤트 발생
  ├→ Datadog HTTP Intake (배치 100개, 15초 플러시, 64종 이벤트)
  ├→ 1st Party Event Logger (배치 200개, 실패 시 JSONL 저장)
  ├→ OpenTelemetry (OTLP/BigQuery/Perfetto)
  └→ 인메모리 에러 로그 (최근 100개 순환 버퍼)
```

PII 보호: 해시 익명화, 512자 절단, 모델명 정규화, MCP 도구명 → "mcp".

#### AutoBE: 자동 포워딩 RPC

AutoBE의 통신은 극도로 단순하다:

```typescript
// AutoBeRpcService: 모든 이벤트를 자동 포워딩
for (const key of typia.misc.literals<keyof IAutoBeRpcListener>()) {
  if (key === "enable") continue;
  agent.on(key, (event) => {
    listener[key]!(event as any).catch(() => {});
  });
}
```

`typia.misc.literals<keyof T>()`가 인터페이스의 모든 키를 컴파일 타임에 추출한다. 새 이벤트를 `IAutoBeRpcListener`에 추가하면, **코드 수정 없이** 자동으로 포워딩된다.

75+ 이벤트 타입은 완벽한 discriminated union으로 매핑된다. 이벤트는 5개 기본 타입의 조합으로 합성된다: `EventBase`, `ProgressEventBase`, `AggregateEventBase`, `AcquisitionEventBase`, `CompleteEventBase`.

| 측면 | Claude Code (Bridge) | AutoBE (RPC) |
|------|-------------------|------------|
| 프로토콜 | WebSocket + HTTP POST / SSE + CCR | WebSocket (TGrid) |
| 인증 | JWT + OAuth 2.0 PKCE | 세션 기반 |
| 이벤트 수 | 64+ (Datadog 허용 목록) | 75+ (판별 유니언) |
| 새 이벤트 추가 | 수동 핸들러 등록 | 자동 (인터페이스에 추가만) |
| 싱크 수 | 4 (DD + 1P + OTel + 메모리) | 1 (WebSocket RPC) |
| 복잡도 | ~200KB 브릿지 코드 | ~50줄 RPC 서비스 |
| 상태 재구성 | 불가능 | 이벤트 히스토리에서 재구성 |

---

### 8.3. 비용과 기여 추적

#### 비용 추적

**Claude Code: 실시간 USD 계산**

```typescript
// 모델별 가격: Opus 4.6 $15/$75, Sonnet 4.6 $3/$15, Haiku 4.5 $1/$5 per Mtok
// 캐시: 쓰기 ×1.25, 읽기 ×0.1
// 토큰 예산: 자연어로 설정 ("use 2M tokens"), 90% 도달 시 중단
// 수확체감 감지: 3회 연속 + 델타 < 500 토큰 → 중단
// 세션별 영속성: 프로젝트 설정에 저장/복원
```

**AutoBE: 구조화된 토큰 집계**

```typescript
// 75종 이벤트 소스마다 독립 추적:
interface AutoBeProcessAggregate {
  tokenUsage: { total: { input; output }; cache: { read; creation } };
  metric: { attempt; success; invalidJson; validationFailure };
}
```

Claude Code는 **사용자에게 비용을 보여주는** 시스템이고, AutoBE는 **개발자가 파이프라인을 최적화하는** 시스템이다.

#### 기여 추적

**Claude Code: 문자 수준 기여도** (961줄)

```typescript
// 각 파일에서 AI가 작성한 문자 수를 정밀 추적
// 공통 접두사/접미사를 제외한 변경 영역 = Claude 기여
// 다중 서피스 지원: CLI/VSCode/Desktop 별 분리
// Git 커밋 메타데이터에 기여도 포함
// SHA-256 스냅샷 기반 타임머신 (100개 LRU)
```

**AutoBE: 이벤트 소스별 집계** — 75종 이벤트 소스마다 `tokenUsage`(입출력, 캐시 읽기/생성)와 `metric`(시도, 성공, 검증 실패)을 독립 추적한다. 파이프라인 병목 최적화에 활용.

| 측면 | Claude Code | AutoBE |
|------|-------------|--------|
| 비용 단위 | USD (실시간) | 토큰 (원시) |
| 집계 단위 | 모델별 | 작업 소스별 (75종) |
| 기여 추적 | 문자 수준 (파일별) | 토큰 수준 (작업별) |
| 예산 시스템 | 자연어 파싱 | 없음 (고정 파이프라인) |

---

### 8.4. Git 통합과 투기적 실행

#### Claude Code의 Git 인프라

Claude Code는 **파일 시스템 기반 도구**이므로 Git 통합이 핵심이다:

**Worktree 관리**: LRU 캐시 (최대 50개) + worktree .git 파일 → 메인 리포 해석. 세션별 격리된 작업 공간 생성.

**Diff 추적**: `git diff HEAD --numstat`, MAX_FILES = 50, MAX_DIFF_SIZE = 1MB, MAX_LINES_PER_FILE = 400 (GitHub 한계). V8 sliced-string 해제: `'' + line` (메모리 누수 방지).

**Git 보안 — Bare-Repo 공격 방어**:

```typescript
// 공격: cd /tmp/malicious → HEAD + objects/ + refs/ → bare repo → hooks 실행
// 방어 1: bare repo 감지
// 방어 2: 경로 정규화로 탈출 감지
// 방어 3: NTFS 8.3 단축명 차단 (GIT~1)
// 방어 4: cd + git 복합 명령 차단
```

**Git 상태 보존** (이슈 제출용): merge-base SHA, diff patch, 새 파일, format-patch. 제한: 파일당 500MB, 총 5GB, 최대 20,000개.

#### Claude Code: 투기적 실행 — Copy-on-Write 오버레이

사용자가 제안을 검토하는 동안 미리 실행하는 **투기적 실행(Speculation)** 시스템:

```
사용자가 제안을 검토하는 동안:
  1. 오버레이 디렉터리 생성
  2. Write 도구 → 원본 파일을 오버레이에 복사 (최초 1회)
  3. Read 도구 → writtenPaths에 있으면 오버레이에서 읽기
  4. 경계 조건 도달 시 중단 (bash, 비허용 도구, 완료)

MAX_SPECULATION_TURNS = 20
MAX_SPECULATION_MESSAGES = 100

// 파이프라인 투기: 투기 완료 → 다음 제안 승격 → 새 투기 (무한 연쇄)
// 시간 절약 추적: timeSavedMs = acceptedAt - startTime
```

#### AutoBE: Git 없는 세계

AutoBE는 파일 시스템을 **직접 제어**한다. Git이 필요 없는 이유:

```
모든 파일이 메모리 내 Record<string, string>으로 관리
이전 상태는 AutoBeState에 보존
Git 히스토리 불필요, Git 보안 고려사항 없음
```

투기적 실행 대신 **병렬 실행**(executeCachedBatch)으로 시간을 줄인다. 사용자 대기 시간 자체가 없다 (자율 실행).

---

### 8.5. 설정과 프로바이더 추상화

#### Claude Code: Feature Flags + 4-Provider 지원

```typescript
// Bun DCE + GrowthBook Feature Flag 이중 구조
if (feature('COORDINATOR_MODE')) { ... }  // 컴파일 타임 제거
getFeatureValue_CACHED_MAY_BE_STALE('feature_name')  // 런타임 게이트

// 4개 AI 프로바이더:
type APIProvider = 'firstParty' | 'bedrock' | 'vertex' | 'foundry';
// Bedrock: 리전 프리픽스, ARN, AWS 자격증명 캐싱, HTTP/1.1 강제
// 메시지 정규화: 연속 user 메시지 병합 (Bedrock 제한) 등

// 모델 폴백: 529 3회 → claude-opus → claude-sonnet 자동 전환
```

#### AutoBE: const enum 상수 + 벤더 인터페이스

```typescript
export const enum AutoBeConfigConstant {
  VALIDATION_RETRY = 3,
  COMPILER_RETRY = 4,
  DATABASE_CORRECT_RETRY = 30,
  SEMAPHORE = 8,
  // ... const enum은 컴파일 타임에 인라인, 런타임 객체 없음
}

// 벤더 추상화: TypeScript 타입 → JSON Schema → LLM Function Call
// 어떤 모델이든 작동 (Qwen3 35B에서 6.75%→99.8%)
// 모델 폴백 대신 동일 모델 재시도에 집중 (정합성 보증이 모델 성능에 덜 의존)
```

| 측면 | Claude Code | AutoBE |
|------|-------------|--------|
| 설정 변경 | 런타임 (서버에서 전환) | 컴파일 타임 (코드 수정) |
| A/B 테스트 | 가능 (GrowthBook) | 불가능 |
| 프로바이더 | 4개 (1P/Bedrock/Vertex/Foundry) | 벤더 추상화 (어떤 LLM이든) |
| 모델 폴백 | 529 3회 → 자동 다운그레이드 | 없음 (재시도에 집중) |

이 차이는 **조직 규모**를 반영한다. Anthropic은 수백 명이 동시에 개발하므로 Feature Flag로 독립 배포한다. AutoBE는 소규모 팀이므로 상수 하나 바꾸고 배포하는 것이 더 효율적이다.

---

## 9. 확장성과 상호 학습

> 두 프로젝트는 각각의 방식으로 진화하고 있다. 확장 모델이 다르고, 서로에게서 배울 점도 다르다.

### 9.1. 확장 모델: MCP 생태계 vs 컴파일러 체인

#### Claude Code: 3계층 확장 시스템

**MCP (Model Context Protocol)**: 외부 도구 서버에 연결하여 도구를 동적으로 통합. 7가지 소스(local/user/project/dynamic/enterprise/claudeai/managed), 6가지 전송(stdio/sse/sse-ide/http/ws/sdk). 빌트인과 중복 시 빌트인 우선.

**플러그인 시스템**:

```typescript
type LoadedPlugin = {
  commands?: CommandMetadata        // CLI 슬래시 명령
  agents?: AgentDefinition          // 서브에이전트 정의
  skills?: BundledSkillDefinition   // 번들 스킬
  hooks?: HooksSettings             // 라이프사이클 훅
  mcpServers?: McpServerConfig      // MCP 서버
  lspServers?: LspServerConfig      // LSP 서버
}
```

**Hook 시스템**: 6가지 이벤트(PreToolUse, PostToolUse, PostToolUseFailure, PermissionRequest, SessionStart, SessionEnd). 비동기 제너레이터 패턴으로 권한 결정, 입력 수정, 실행 차단, 추가 컨텍스트 주입 가능.

**스킬**: 번들 스킬 12개 이상 (verify, debug, simplify, batch, stuck, loop, dream 등). Feature flag로 게이팅.

#### AutoBE: 컴파일러 체인 확장

AutoBE의 확장은 **새 컴파일러를 체인에 추가하는 것**이다:

```
현재: Prisma → OpenAPI → TypeScript
Epsilon 예정:
  + Runtime Feedback Compiler (실제 서버 기동 검증)
  + E2E Test Runner (테스트 통과 검증)
  + Database Schema Parser (사용자 수정 역파싱)
```

새 오케스트레이터 추가 시 필요한 것: IApplication 인터페이스, typia 스키마, 시스템 프롬프트, History Transformer, 오케스트레이터 함수, 이벤트 타입 (자동 RPC 포워딩).

| 측면 | Claude Code (MCP) | AutoBE (직접 통합) |
|------|-------------------|-------------------|
| 외부 도구 연결 | ★★★★★ (무제한) | ★☆☆☆☆ (불가) |
| 통합 지연시간 | 네트워크 + 직렬화 | 함수 호출 (< 1ms) |
| 타입 안전성 | Zod 런타임 검증 | 컴파일 타임 검증 |
| 정합성 보증 | 도구 출력 무검증 | 컴파일러가 검증 |

---

### 9.2. 상호 학습

#### AutoBE가 Claude Code로부터 배울 것들

**컨텍스트 압축의 다층 전략**: Spiral Workflow(역방향 전파) 도입 시 대화가 길어질 수 있다. Autocompact, Cached Microcompact, Circuit Breaker 패턴 참고 가능.

**StreamingToolExecutor의 동시성 모델**: Runtime Feedback Agent 도입 시 "컴파일은 병렬, 런타임 테스트는 직렬" 규칙에 `isConcurrencySafe` 패턴 활용 가능.

**Fork Subagent의 캐시 공유**: Multi-draft generation (다중 초안 후 최선안 선택)에 byte-identical prefix 기반 캐시 공유 적용 가능.

**Coordinator Mode의 합성 패턴**: "Workers can't see your conversation. Every prompt must be self-contained." — History Transformer 패턴과 동일한 통찰. Dynamic Agent Routing에 참고 가능.

**메모리 시스템**: 프로젝트별 선호도("이 팀은 jsonb를 좋아한다") 기억으로 생성 품질 향상 가능.

**Feature Flag**: Epsilon의 실험적 기능(Critic Agent, Runtime Feedback)을 feature flag로 관리하면 안정/실험 빌드 분리 가능.

#### Claude Code가 AutoBE로부터 배울 것들

**컴파일러 기반 자가치유 루프**: Claude Code에 가장 부족한 것. LSP 진단 → 자동 수정 루프 도입 가능. 특히 Prisma 에러 메시지의 **교육적 형식**이 LLM의 교정 성공률을 크게 높인다.

**Function Calling Harness**: 6.75% → 99.8%. Typia 3계층 harness로 소규모/오픈소스 모델에서도 도구 호출 신뢰성 급상향 가능.

**"부재를 통한 제약" 원리**: `"Don't use any type"` → LLM이 오히려 any를 떠올림. 스키마에서 any 선택지 자체를 제거 → 물리적으로 생성 불가. Claude Code의 "Don't X" 프롬프트를 스키마 제약으로 변환하면 더 효과적.

**History Transformer 패턴**: Fork Subagent에 전체 대화 히스토리 대신 작업 관련 부분만 선별 → 성능과 비용 개선.

**Step Counter를 통한 의존성 추적**: Coordinator Mode의 병렬 워커 파일 수정 의존성 추적에 유용.

**75+ 이벤트의 자동 포워딩**: `typia.misc.literals<keyof T>()`로 이벤트 추가 비용 0에 수렴.

---

## 10. 결론: 수렴과 분기

### 현재의 위치

Claude Code와 AutoBE는 **전혀 다른 문제를 풀고 있다**:

- **Claude Code**: "이 시니어 개발자가 어떻게 하면 사용자를 더 잘 도울 수 있을까?" — 유연성과 안전성의 균형
- **AutoBE**: "이 공장이 어떻게 하면 항상 동작하는 백엔드를 만들 수 있을까?" — 정합성과 완전성의 보증

### 수렴의 방향

양쪽 모두 같은 방향으로 진화하고 있다:

1. **Claude Code의 3세대화**: Coordinator Mode(멀티워커 오케스트레이션), Plan Mode V2(구조화된 5단계), Fork Subagent(자율적 코드 수정+커밋)는 자율성을 높이는 방향이다. LSP 진단을 자동 교정 루프에 통합하면, "코드 어시스턴트"에서 "코드 생성기"로 전환이 가능해진다.

2. **AutoBE의 2세대적 보완**: Epsilon 로드맵의 Human Modification Support(사용자 수정 역파싱), Cyclinic Workflow(자가 리뷰), Spiral Workflow(역방향 전파)는 사용자와의 협업을 강화하는 방향이다.

### 전략적 우위 비교

AutoBE가 "에이전트 기교"에 앞서 컴파일러에 올인한 것은 **올바른 순서**였다. 검증 기반 없이 워크플로우를 고도화하면 **정교한 주사위 굴리기**에 불과하다. AutoBE는 이제 **검증이 보증된 기반 위에** 워크플로우를 쌓을 수 있다.

반대로 Claude Code는 **생태계**에서 우위가 있다. MCP + 플러그인 + 스킬 + IDE 브릿지 + Feature Flag. 이 위에서 AutoBE 수준의 도메인 특화 기능을 플러그인으로 제공할 수도 있다.

그리고 **모델 독립성**이라는 결정적 차이가 있다. Claude Code는 Anthropic의 Claude에 의존한다. AutoBE는 Function Calling Harness 덕분에 **어떤 모델이든** 작동한다—Qwen3 35B에서 6.75%→99.8%, Claude Opus에서는 더 빠르게 수렴할 뿐이다.

### 최종 비교표

| 차원 | Claude Code (2세대) | AutoBE (3세대 지향) |
|------|---------------------|---------------------|
| **자율성** | 사용자 주도, AI 보조 | AI 주도, 사용자 검수 |
| **범용성** | ★★★★★ | ★★☆☆☆ |
| **정합성 보증** | ★★☆☆☆ | ★★★★★ |
| **워크플로우 성숙도** | ★★★★★ | ★★★☆☆ (개선 중) |
| **컴파일러/검증** | ★★☆☆☆ | ★★★★★ |
| **생태계** | ★★★★★ | ★★☆☆☆ |
| **모델 독립성** | ★★☆☆☆ | ★★★★★ |
| **비용 효율** | ★★★☆☆ | ★★★★☆ |
| **프롬프트 캐싱** | ★★★★☆ (DYNAMIC_BOUNDARY) | ★★★★★ (executeCachedBatch) |
| **에러 회복** | ★★★★☆ (인프라) | ★★★★★ (인프라+논리) |
| **다중 에이전트** | ★★★★☆ (Coordinator+Fork) | ★★★★★ (40+ 전문 오케스트레이터) |

### 보완 관계

2세대와 3세대는 대체가 아니라 **보완**이다.

AutoBE가 백엔드를 통째로 생성한 후, Claude Code에 넘겨서 세밀한 커스터마이징을 하는 시나리오를 상상해보라. 공장에서 찍어낸 제품을 장인이 마감하는 것처럼. AutoBE의 컴파일러가 보증한 기반 위에서, Claude Code의 범용 도구가 비즈니스 로직의 미세 조정을 수행한다. 각자가 가장 잘하는 것에 집중하는 분업이다.

두 프로젝트는 각자의 길을 걸으면서도, 결국 같은 미래를 향해 수렴하고 있다: **AI가 소프트웨어를 만들고, 기계가 그 정합성을 보증하며, 사람은 의도와 판단에 집중하는** 세계.

---

*이 보고서는 Claude Code의 소스코드(512,000줄, npm publish 시 js.map 노출로 공개)와 AutoBE의 오픈소스 코드를 직접 분석하여 작성되었다. 19개의 병렬 분석 에이전트가 양쪽 코드베이스의 모든 핵심 파일—messages.ts(5,800줄), permissions.ts, bashPermissions.ts(1,800줄), gitDiff.ts, gitSafety.ts, analytics/(datadog.ts, firstPartyEventLogger.ts, metadata.ts), sessionTracing.ts, systemPrompt.ts, coordinatorMode.ts, withRetry.ts, compact.ts (Claude Code) 및 AutoBePreliminaryController.ts, executeCachedBatch.ts, validateDatabaseApplication.ts(874줄), AutoBeTypeScriptCompiler.ts, writeRealizeControllers.ts, AutoBeRealizeOperationProgrammer.ts, transformOpenApiDocument.ts, 87개 시스템 프롬프트, 75개 이벤트 타입, 58개 히스토리 트랜스포머, 3개 컴파일러 (AutoBE)—을 읽고 분석한 결과다. 2026년 4월 기준.*