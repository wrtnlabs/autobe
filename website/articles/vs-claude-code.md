# AutoBE vs Claude Code: 2세대 코드 어시스턴트와 3세대 자율 에이전트의 해부

> 2026년 4월, Claude Code의 소스코드가 npm publish 시 js.map 포함 사고로 만천하에 공개되었다. 512,000줄, 1,900개 파일, 301개 디렉터리.
> AutoBE는 처음부터 오픈소스였다.
> 이 보고서는 양쪽의 소스코드를 한 줄 한 줄 직접 분석하여, 두 프로젝트의 설계 철학과 아키텍처를 비교한다.

---

## 목차

1. [두 프로젝트의 정체성](#1-두-프로젝트의-정체성)
2. [아키텍처 비교: 전혀 다른 두 개의 세계관](#2-아키텍처-비교-전혀-다른-두-개의-세계관)
3. [에이전트 루프: 대화형 vs 파이프라인형](#3-에이전트-루프-대화형-vs-파이프라인형)
4. [시스템 프롬프트: 범용 지침 vs 도메인 교과서](#4-시스템-프롬프트-범용-지침-vs-도메인-교과서)
5. [도구 시스템: 범용 vs 전용](#5-도구-시스템-범용-vs-전용)
6. [컴파일러와 검증: 최선의 노력 vs 100% 보장](#6-컴파일러와-검증-최선의-노력-vs-100-보장)
7. [Function Calling: 자유도 vs 제약의 미학](#7-function-calling-자유도-vs-제약의-미학)
8. [컨텍스트 관리: 압축의 예술 vs 변환의 정밀함](#8-컨텍스트-관리-압축의-예술-vs-변환의-정밀함)
9. [에러 회복: 인프라 재시도 vs 논리 자가치유](#9-에러-회복-인프라-재시도-vs-논리-자가치유)
10. [상태 관리: Redux 패턴 vs Step Counter 패턴](#10-상태-관리-redux-패턴-vs-step-counter-패턴)
11. [이벤트와 통신: Bridge vs RPC](#11-이벤트와-통신-bridge-vs-rpc)
12. [확장성: 생태계 vs 컴파일러 체인](#12-확장성-생태계-vs-컴파일러-체인)
13. [2세대와 3세대, 그 경계에 대하여](#13-2세대와-3세대-그-경계에-대하여)
14. [AutoBE가 Claude Code로부터 배울 것들](#14-autobe가-claude-code로부터-배울-것들)
15. [Claude Code가 AutoBE로부터 배울 것들](#15-claude-code가-autobe로부터-배울-것들)
16. [병렬 실행: Coordinator vs executeCachedBatch](#16-병렬-실행-coordinator-vs-executecachedbatch)
17. [RAG 패턴: CLAUDE.md vs AutoBePreliminaryController](#17-rag-패턴-claudemd-vs-autobepreliminarycontroller)
18. [재시도 전략: 지수 백오프 vs 컴파일러 루프](#18-재시도-전략-지수-백오프-vs-컴파일러-루프)
19. [AST 설계 철학: 범용 vs AI 최적화](#19-ast-설계-철학-범용-vs-ai-최적화)
20. [Fork Subagent vs 일회성 MicroAgentica](#20-fork-subagent-vs-일회성-microagentica)
21. [설정과 튜닝: Feature Flag vs Config Constant](#21-설정과-튜닝-feature-flag-vs-config-constant)
22. [상태 영속성: 세션 스토리지 vs 이벤트 소싱](#22-상태-영속성-세션-스토리지-vs-이벤트-소싱)
23. [토큰 경제학: 무한 대화 vs 고정 파이프라인](#23-토큰-경제학-무한-대화-vs-고정-파이프라인)
24. [안전성 모델: 6중 방어 vs 컴파일러 게이트](#24-안전성-모델-6중-방어-vs-컴파일러-게이트)
25. [관측성: 64종 Datadog 이벤트 vs 69종 타입 안전 이벤트](#25-관측성-64종-datadog-이벤트-vs-69종-타입-안전-이벤트)
26. [메시지 정규화: 5,800줄의 변환 파이프라인 vs 57개 History Transformer](#26-메시지-정규화-5800줄의-변환-파이프라인-vs-57개-history-transformer)
27. [컴파일러 내부: 874줄 검증기의 세계](#27-컴파일러-내부-874줄-검증기의-세계)
28. [Git 통합: Worktree 관리와 Bare-Repo 방어](#28-git-통합-worktree-관리와-bare-repo-방어)
29. [코드 생성 파이프라인: AST에서 NestJS까지](#29-코드-생성-파이프라인-ast에서-nestjs까지)
30. [권한 시스템 해부: 5계층 규칙 엔진의 내부](#30-권한-시스템-해부-5계층-규칙-엔진의-내부)
31. [투기적 실행: Copy-on-Write 오버레이의 미래](#31-투기적-실행-copy-on-write-오버레이의-미래)
32. [컨텍스트 붕괴: autocompact를 넘어선 단계적 압축](#32-컨텍스트-붕괴-autocompact를-넘어선-단계적-압축)
33. [비용 추적: 실시간 USD 계산 vs 토큰 집계](#33-비용-추적-실시간-usd-계산-vs-토큰-집계)
34. [기여 추적: 문자 수준 어트리뷰션 vs 이벤트 소스 집계](#34-기여-추적-문자-수준-어트리뷰션-vs-이벤트-소스-집계)
35. [메모리 로딩: 4계층 CLAUDE.md vs 85개 시스템 프롬프트](#35-메모리-로딩-4계층-claudemd-vs-85개-시스템-프롬프트)
36. [E2E 테스트 자동 생성: 5단계 파이프라인 vs 부재](#36-e2e-테스트-자동-생성-5단계-파이프라인-vs-부재)
37. [컴파일러 진단의 LLM 최적화: 에러를 읽히게 만드는 기술](#37-컴파일러-진단의-llm-최적화-에러를-읽히게-만드는-기술)
38. [MCP 생태계 vs 폐쇄형 파이프라인: 확장성의 두 모델](#38-mcp-생태계-vs-폐쇄형-파이프라인-확장성의-두-모델)
39. [데이터베이스 스키마 생성: 7-오케스트레이터 파이프라인](#39-데이터베이스-스키마-생성-7-오케스트레이터-파이프라인)
40. [Collector/Transformer: 양방향 매핑의 코드 생성](#40-collectortransformer-양방향-매핑의-코드-생성)
41. [프로바이더 추상화: 4-Provider 지원 vs 벤더 인터페이스](#41-프로바이더-추상화-4-provider-지원-vs-벤더-인터페이스)
42. [파일 히스토리와 파괴적 연산 방어: 안전망의 설계](#42-파일-히스토리와-파괴적-연산-방어-안전망의-설계)
43. [결론: 수렴과 분기](#43-결론-수렴과-분기)

---

## 1. 두 프로젝트의 정체성

### Claude Code: 사람 옆에 앉은 시니어 개발자

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

### AutoBE: 0에서 100까지 혼자 다 하는 백엔드 공장

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

5단계 워터폴 파이프라인(Analyze → Database → Interface → Test → Realize)에 40개 이상의 전문 오케스트레이터가 협업한다. 각 단계마다 내부에 나선형(spiral) 루프가 돌면서 자가 교정한다. 71종 이상의 타입 안전 이벤트가 파이프라인 전체를 실시간으로 추적한다.

---

## 2. 아키텍처 비교: 전혀 다른 두 개의 세계관

### Claude Code의 구조

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

### AutoBE의 구조

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
  [Event System] ─→ 71+ typed events ─→ Real-time UI
```

**다중 에이전트, 전용 오케스트레이터.** Facade가 5개 함수를 노출하고, 각 함수 뒤에 전문화된 오케스트레이터 체인이 있다. 각 오케스트레이터는 일회용 `MicroAgentica`를 생성하고, 작업 완료 후 폐기한다.

### 숫자로 보는 규모 비교

| 차원 | Claude Code | AutoBE |
|------|-------------|--------|
| **코드 규모** | ~512,000줄, 1,900 파일 | ~50,000줄, 400+ 파일 |
| **도구/오케스트레이터 수** | 40+ 범용 도구 | 40+ 전문 오케스트레이터 |
| **이벤트 타입** | 14 훅 이벤트 | 71+ 파이프라인 이벤트 |
| **시스템 프롬프트** | ~2,000줄 (동적 조립) | 85+ 개별 프롬프트 파일 |
| **에이전트 수명** | 세션 전체 유지 | 작업당 생성·폐기 |
| **도구 선택** | LLM이 매 턴 자율 결정 | 오케스트레이터가 사전 결정 |
| **출력 단위** | 파일 편집, 셸 명령 | 전체 백엔드 애플리케이션 |
| **검증 방식** | LSP 진단 + 사용자 확인 | 3단계 컴파일러 + 자가치유 |

---

## 3. 에이전트 루프: 대화형 vs 파이프라인형

### Claude Code: `while(true)` 상태 머신

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

### AutoBE: 5단계 워터폴 + 나선형 루프

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

각 오케스트레이터는 `AutoBePreliminaryController`를 통해 RAG 루프를 내장한다:

```typescript
// RAG 루프: LLM이 추가 데이터를 요청하면 자동으로 로딩
public async orchestrate<T>(ctx, process): Promise<T> {
  for (let i = 0; i < AutoBeConfigConstant.RAG_LIMIT; ++i) {  // 최대 10회
    const result = await process(out);
    if (result.value !== null) return result.value;
    // LLM이 "이 스키마 정보가 더 필요합니다" → 추가 컨텍스트 로딩
    await orchestratePreliminary(ctx, { preliminary: this, ... });
  }
  throw new AutoBePreliminaryExhaustedError();
}
```

RAG에서 관리하는 데이터 종류 10가지:

```
analysisSections / previousAnalysisSections     → 요구사항 문서 섹션
databaseSchemas / previousDatabaseSchemas        → Prisma 스키마 정의
interfaceOperations / previousInterfaceOperations → OpenAPI 오퍼레이션
interfaceSchemas / previousInterfaceSchemas       → JSON 스키마 (DTO)
realizeCollectors / realizeTransformers           → 구현 재사용 함수
```

---

## 4. 시스템 프롬프트: 범용 지침 vs 도메인 교과서

이것은 소스코드 분석에서 가장 흥미로운 부분이다. 두 프로젝트의 프롬프트 설계 철학이 근본적으로 다르다.

### Claude Code: 모듈식 동적 조립

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

CLAUDE.md 파일은 이런 프리앰블과 함께 주입된다:

```
"Codebase and user instructions are shown below. Be sure to adhere to
these instructions. IMPORTANT: These instructions OVERRIDE any default
behavior and you MUST follow them exactly as written."
```

프롬프트 내용 자체는 **범용적**이다. "Don't add features beyond what was asked", "Avoid over-engineering", "Consider reversibility and blast radius" 같은 일반 원칙이 주를 이룬다.

### AutoBE: 85개 도메인 특화 교과서

AutoBE는 `packages/agent/prompts/`에 85개 이상의 개별 Markdown 파일을 가지고 있다. 각각이 하나의 특정 작업에 대한 **교과서 수준의 상세한 지침**이다.

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

## Naming Conventions

- Table names: snake_case, prefixed with domain (shopping_sale, NOT sale)
- Field names: snake_case, descriptive (created_at, NOT createdAt)
- Foreign key fields: MUST end with _id (shopping_sale_id, NOT sale)
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

Available collectors: {% COLLECTORS %}
Available transformers: {% TRANSFORMERS %}
```

`REALIZE_OPERATION_CORRECT.md` (319줄)는 TypeScript 에러 패턴별 수정 가이드다:

```markdown
## Common Error Patterns

### TS2322: Type 'X' is not assignable to type 'Y'
- Check if nullable field needs ?? operator
- Check if array needs .map() for type conversion

### TS2345: Argument of type 'X' is not assignable to parameter of type 'Y'
- Verify function signature matches call site
- Check for missing await on async functions
```

핵심 차이: Claude Code는 "무엇을 하지 마라"(금지 규칙)가 많고, AutoBE는 "이것만 이렇게 해라"(양성 규칙)가 많다. 이것은 Function Calling Harness 아티클에서 말하는 **핑크 코끼리 문제**와 직접 연결된다—"코끼리를 생각하지 마라"보다 "강아지를 생각해라"가 더 효과적이다.

### Coordinator vs Facade: 멀티에이전트 프롬프트

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

## 5. 도구 시스템: 범용 vs 전용

### Claude Code: 40+ 범용 도구의 스위스 아미 나이프

각 도구는 풍부한 메타데이터를 가진 `Tool` 인터페이스를 구현한다. 793줄짜리 `src/Tool.ts`에서 발췌:

```typescript
// src/Tool.ts — Claude Code 도구의 전체 타입 정의 (핵심부 발췌)
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
  call(args: z.infer<Input>, context: ToolUseContext,
       canUseTool: CanUseToolFn, parentMessage: AssistantMessage,
       onProgress?: ToolCallProgress<P>): Promise<ToolResult<Output>>

  // ─── Behavior Flags ───
  isConcurrencySafe(input: z.infer<Input>): boolean  // 기본 false (fail-closed)
  isReadOnly(input: z.infer<Input>): boolean          // 기본 false (쓰기 가정)
  isDestructive?(input: z.infer<Input>): boolean      // 되돌릴 수 없는 작업
  interruptBehavior?(): 'cancel' | 'block'            // 사용자 인터럽트 시

  // ─── Permission ───
  validateInput?(input, context): Promise<ValidationResult>
  checkPermissions(input, context): Promise<PermissionResult>
  preparePermissionMatcher?(input): Promise<(pattern: string) => boolean>

  // ─── Size Control ───
  maxResultSizeChars: number  // 초과 시 디스크 저장 (Infinity = 항상 인라인)
  strict?: boolean            // Tengu strict 모드
  shouldDefer?: boolean       // ToolSearch 레이지 로딩
  alwaysLoad?: boolean        // 항상 초기 프롬프트에 포함

  // ─── UI Rendering (React/Ink) — 12개 렌더링 메서드 ───
  renderToolUseMessage(input, options): React.ReactNode
  renderToolResultMessage?(output, progressMessages, options): React.ReactNode
  renderGroupedToolUse?(toolUses[], options): React.ReactNode | null
  renderToolUseRejectedMessage?(input, options): React.ReactNode
  renderToolUseErrorMessage?(result, options): React.ReactNode
  renderToolUseProgressMessage?(progressMessages, options): React.ReactNode
  // ... 등등

  // ─── Classifier ───
  toAutoClassifierInput(input: z.infer<Input>): unknown  // ML 보안 분류기용
}
```

실제 도구 구현 예시 — GlobTool (파일 검색):

```typescript
// src/tools/GlobTool/GlobTool.ts
const inputSchema = lazySchema(() =>
  z.strictObject({
    pattern: z.string().describe('The glob pattern to match files against'),
    path: z.string().optional().describe('The directory to search in...'),
  }),
)

const outputSchema = lazySchema(() =>
  z.object({
    durationMs: z.number().describe('Time taken in milliseconds'),
    numFiles: z.number().describe('Total number of files found'),
    filenames: z.array(z.string()).describe('Matching file paths'),
    truncated: z.boolean().describe('Whether results were truncated'),
  }),
)

export const GlobTool = buildTool({
  name: GLOB_TOOL_NAME,
  searchHint: 'find files by name pattern or wildcard',
  maxResultSizeChars: 100_000,
  isConcurrencySafe() { return true },
  isReadOnly() { return true },
  toAutoClassifierInput(input) { return input.pattern },
  isSearchOrReadCommand() { return { isSearch: true, isRead: false } },
  async call(input, { abortController, getAppState, globLimits }) {
    const { files, truncated } = await glob(input.pattern, ...);
    return { data: { filenames: files.map(toRelativePath), ... } };
  },
  // ...
} satisfies ToolDef<InputSchema, Output>)
```

`buildTool()`이 7개의 기본값(isEnabled, isConcurrencySafe, isReadOnly 등)을 주입하므로, 도구 정의는 필요한 것만 오버라이드한다.

도구 로딩은 **지연 로딩(deferred loading)** 패턴을 사용한다. `shouldDefer: true`인 도구는 초기 프롬프트에 포함되지 않고, `ToolSearch`를 통해 키워드 매칭으로 필요할 때만 스키마가 로딩된다. 이로써 초기 프롬프트 크기를 제한하면서도 40+ 도구를 모두 사용할 수 있다.

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

**권한 시스템** 상세:

```
Layer 1: Permission Mode (global)
  default → 매 도구 사용마다 사용자에게 물음
  plan → 읽기 전용 자동 승인, 수정은 물음
  bypassPermissions → 모두 자동 승인 (위험)
  auto → ML 분류기가 안전한 명령 자동 승인

Layer 2: Permission Rules (granular)
  도구별, 입력 패턴별 allow/deny/ask 규칙
  영구 규칙: ~/.claude/permissions/에 저장

Layer 3: Auto-Approval Classifier
  Bash 명령의 의미론적 분석
  파괴적 명령 탐지 (~100KB 로직)
  sed 표현식의 뮤테이션 감지
```

### AutoBE: 타입 스키마가 곧 도구인 세계

AutoBE에는 범용 "도구"가 없다. 대신 **TypeScript 인터페이스 자체가 LLM의 함수 호출 스키마**가 된다. `typia.llm.application<T>()`가 컴파일 타임에 인터페이스를 JSON Schema로 변환한다.

**Facade 레벨: 5개 함수를 가진 최상위 에이전트**

```typescript
// packages/agent/src/orchestrate/facade/histories/IAutoBeFacadeApplication.ts
export interface IAutoBeFacadeApplication {
  analyze(): Promise<IAutoBeFacadeApplicationResult>;
  database(props: { instruction: string }): Promise<IAutoBeFacadeApplicationResult>;
  interface(props: { instruction: string }): Promise<IAutoBeFacadeApplicationResult>;
  test(props: { instruction: string }): Promise<IAutoBeFacadeApplicationResult>;
  realize(props: { instruction: string }): Promise<IAutoBeFacadeApplicationResult>;
}

export interface IAutoBeFacadeApplicationResult {
  type: "success" | "failure" | "exception" | "in-progress" | "prerequisites-not-satisfied";
  description: string;
}
```

Facade 에이전트는 5개의 독립적 함수를 가진다. LLM이 대화 맥락에서 어떤 단계를 실행할지 **자율적으로 선택**한다. Claude Code의 도구 선택과 유사하지만, 선택지가 5개로 한정되어 있다.

**오케스트레이터 레벨: 단일 함수 + 유니언 타입의 향연**

대부분(47개)의 에이전트는 `process()`라는 단일 함수를 노출하되, 그 파라미터가 **판별 유니언 타입(discriminated union)**이다. 이것이 핵심이다:

```typescript
// packages/agent/src/orchestrate/interface/structures/IAutoBeInterfaceSchemaRefineApplication.ts
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

  export interface IComplete {
    type: "complete";
    review: string;                                   // 분석 요약
    databaseSchema: string | null;                    // 매핑 대상 테이블 (없으면 null)
    specification: string;                            // 구현 방법 (데이터 매핑, 변환 규칙)
    description: string;                              // API 소비자용 설명
    excludes: AutoBeInterfaceSchemaPropertyExclude[]; // DB 속성 중 제외할 것
    revises: AutoBeInterfaceSchemaPropertyRefine[];   // 속성별 세부 조정
  }
}
```

여기서 `IComplete`의 각 필드를 자세히 뜯어보면, 이것이 단순한 "데이터 구조"가 아니라 **백엔드 개발자의 사고 프로세스를 강제하는 Chain-of-Thought(CoT) 스키마**임을 알 수 있다.

**스키마로 강제되는 사고의 흐름 — 속성 레벨 CoT**

`IComplete.revises`의 타입인 `AutoBeInterfaceSchemaPropertyRefine`은 4종 판별 유니언이다:

```typescript
// packages/interface/src/histories/contents/AutoBeInterfaceSchemaPropertyRefine.ts
type AutoBeInterfaceSchemaPropertyRefine =
  | AutoBeInterfaceSchemaPropertyDepict   // 문서만 수정 (타입은 맞지만 설명이 부족)
  | AutoBeInterfaceSchemaPropertyCreate   // 새 속성 추가 (DB에 있는데 DTO에 빠짐)
  | AutoBeInterfaceSchemaPropertyUpdate   // 타입 자체를 교체 (잘못된 스키마)
  | AutoBeInterfaceSchemaPropertyErase;   // 속성 삭제 (있으면 안 되는 것)
```

각각을 까보면, **모든 조정 행위에 사고의 근거를 구조적으로 요구**한다:

```typescript
// depict: "타입은 맞는데 문서가 부족할 때" — 기존 속성의 설명을 보강
interface AutoBeInterfaceSchemaPropertyDepict {
  type: "depict";
  key: string;                       // 어떤 속성을?
  databaseSchemaProperty: string | null;  // 어떤 DB 컬럼을 참고했는가?
  reason: string;                    // 왜 수정이 필요한가? (근거)
  specification: string;             // 구현 에이전트에게 전달할 내부 스펙
  description: string;               // API 소비자에게 보여줄 외부 설명
}

// create: "빠진 속성을 추가할 때" — 가장 풍부한 사고 요구
interface AutoBeInterfaceSchemaPropertyCreate {
  type: "create";
  key: string;                       // 추가할 속성명
  databaseSchemaProperty: string | null;  // 어떤 DB 컬럼에서 왔는가? (null이면 계산 속성)
  reason: string;                    // 왜 이 속성이 필요한가?
  specification: string;             // null인 경우: JOIN, 집계, 비즈니스 룰 전부 기술
  description: string;               // 소비자에게 보여줄 설명
  schema: AutoBeOpenApi.IJsonSchema; // JSON Schema 정의 ($ref 가능, 인라인 객체 금지)
  required: boolean;                 // 필수 여부
}

// update: "타입이 잘못되었을 때" — FK→객체 변환 등
interface AutoBeInterfaceSchemaPropertyUpdate {
  type: "update";
  key: string;                       // 현재 속성명
  databaseSchemaProperty: string | null;
  reason: string;                    // 현재 스키마의 무엇이 잘못되었는가?
  newKey: string | null;             // 키 변경 (예: author_id → author)
  specification: string;
  description: string;
  schema: AutoBeOpenApi.IJsonSchema; // 교체할 새 스키마
  required: boolean;
}

// erase: "존재하면 안 되는 속성을 삭제할 때"
interface AutoBeInterfaceSchemaPropertyErase {
  type: "erase";
  key: string;                       // 삭제할 속성명
  databaseSchemaProperty: string | null;  // 어떤 DB 속성이 잘못 노출되었는가?
  reason: string;                    // 보안? 팬텀 필드? 시스템 관리 필드?
}

// 그리고 "제외" — DB에 있지만 이 DTO에는 불필요한 것
interface AutoBeInterfaceSchemaPropertyExclude {
  databaseSchemaProperty: string;    // 제외할 DB 속성
  reason: string;                    // id/created_at → Create DTO 불필요, password → Read DTO 보안
}
```

이 구조가 강제하는 것을 정리하면:

```
┌──────────────────────────────────────────────────────────────────────┐
│  백엔드 개발자가 API DTO를 설계할 때의 사고 프로세스                        │
│                                                                      │
│  1. thinking: "지금 무엇이 부족한가?" (현재 상태 진단)                     │
│  2. Preliminary 호출: 필요한 참조 데이터 수집                             │
│     - DB 스키마 조회 → 테이블 구조 파악                                   │
│     - 분석 섹션 조회 → 요구사항 확인                                      │
│     - 기존 오퍼레이션 조회 → API 일관성 확인                               │
│  3. review: "수집한 정보를 바탕으로 한 종합 분석" (판단)                    │
│  4. databaseSchema: "이 DTO가 어떤 테이블에 매핑되는가?" (데이터 소스 결정)  │
│  5. specification: "구현 에이전트가 어떻게 만들어야 하는가?" (설계)         │
│  6. description: "API 소비자에게 어떻게 보여야 하는가?" (문서화)           │
│  7. excludes: 각 제외 속성마다 — "왜 빠져야 하는가?" (보안/설계 판단)       │
│  8. revises: 각 포함 속성마다 —                                          │
│     "어떤 DB 컬럼인가? 왜 이렇게 했는가? 스펙은? 설명은?" (속성별 CoT)      │
└──────────────────────────────────────────────────────────────────────┘
```

**핵심 통찰: `excludes + revises = DB 속성 전수조사`**

`IComplete`의 주석을 다시 보자:

```typescript
excludes: AutoBeInterfaceSchemaPropertyExclude[];
// "Database properties explicitly excluded from this DTO.
//  Together with `revises`, must cover every database property exactly once."

revises: AutoBeInterfaceSchemaPropertyRefine[];
// "Every DTO property must appear exactly once.
//  Database properties go here (via `databaseSchemaProperty`) or in `excludes`.
//  No omissions allowed."
```

`excludes`와 `revises`를 합치면 해당 테이블의 **모든 DB 속성을 빠짐없이 커버**해야 한다. 하나라도 빠뜨리면 검증 실패다. 이것은 인간 백엔드 개발자가 DTO를 설계할 때 "DB 테이블의 모든 컬럼을 하나씩 검토하고, 각각을 포함할지 제외할지 판단하며, 포함하는 것은 어떻게 변환할지 결정하는" 전수조사 프로세스를 **시스템으로 강제**한 것이다.

LLM이 "대충 주요 필드만 넣고 나머지는 생략"하는 것이 원천적으로 불가능하다. `password` 컬럼을 Read DTO에서 빼야 한다면, 반드시 `excludes`에 `{ databaseSchemaProperty: "password", reason: "보안: 비밀번호는 조회 응답에 노출되어서는 안 됨" }`을 명시적으로 기록해야 한다. "빼먹는 것"이 아니라 "의도적으로 제외했음을 선언하는 것"이다.

**두 층위의 하네싱(Harnessing)**

이 구조를 이해하면, AutoBE의 품질 보증이 **단일 계층이 아닌 이중 구조**임이 드러난다:

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

이것이 "프롬프트로 지시"와 "스키마로 강제"의 근본적 차이다. 프롬프트에 "DB 컬럼을 빠짐없이 검토하라"고 써도 LLM은 자주 건너뛴다. 하지만 `excludes`와 `revises` 배열이 합쳐서 전체 컬럼을 커버해야 하는 **구조적 제약**에서는 건너뛸 수가 없다.

그리고 `databaseSchemaProperty: string | null`에서 `null`일 때의 분기도 의미심장하다. `null`이면 "이 속성은 DB에 직접 매핑되지 않는 계산 속성"이라는 뜻이고, 이때 `specification`에 JOIN 쿼리, 집계 공식, 비즈니스 규칙을 **반드시** 기술해야 한다. 타입 시스템이 "계산 속성이면 로직을 설명하라"는 분기를 자연스럽게 만든다.

**Preliminary 유니언과 핑크 코끼리 원리**

`IProps.request`의 유니언 멤버 각각이 `type` 판별자를 가진다:

```typescript
export interface IAutoBePreliminaryGetAnalysisSections {
  type: "getAnalysisSections";
  sectionIds: (number & tags.Type<"uint32">)[] & tags.MinItems<1> & tags.MaxItems<100>;
}

export interface IAutoBePreliminaryGetDatabaseSchemas {
  type: "getDatabaseSchemas";
  schemaNames: string[] & tags.MinItems<1>;
}
```

**핵심 메커니즘**: LLM이 `getAnalysisSections`를 한 번 호출하면, 해당 타입이 유니언에서 **물리적으로 제거**된다. 다음 턴의 스키마에는 이미 호출한 타입이 존재하지 않는다. "같은 데이터를 두 번 요청하지 마라"는 프롬프트 지시 대신, **스키마에서 선택지를 없애는 것**으로 제약을 강제한다. 핑크 코끼리 원리의 실천이다.

**코드 생성 에이전트: plan → draft → revise 워크플로우**

Realize와 Test 단계의 에이전트는 `IComplete` 안에 3단계 워크플로우가 내장되어 있다:

```typescript
// packages/agent/src/orchestrate/realize/structures/IAutoBeRealizeOperationWriteApplication.ts
export namespace IAutoBeRealizeOperationWriteApplication {
  export interface IComplete {
    type: "complete";
    plan: string;        // 전략 분석, 구현 방향 설계
    draft: string;       // 첫 번째 구현 시도
    revise: IReviseProps; // 자가 리뷰 후 최종 코드
  }

  export interface IReviseProps {
    review: string;       // 타입 안전성, DB 쿼리 최적화, 에러 처리 점검
    final: string | null; // 수정된 최종 코드 (draft가 완벽하면 null)
  }
}
```

단일 함수 호출 한 번으로 LLM이 `plan → draft → review → final`을 **한꺼번에 출력**한다. 이것은 Claude Code의 "도구를 여러 번 호출하며 점진적으로 작업"하는 패턴과 정반대다.

**복수 함수 에이전트: rewrite/reject 패턴**

일부 에이전트(3개)는 여러 함수를 가진다:

```typescript
// packages/agent/src/orchestrate/common/structures/IAutoBeCommonCorrectCastingApplication.ts
export interface IAutoBeCommonCorrectCastingApplication {
  rewrite(props: IAutoBeCommonCorrectCastingApplication.IProps): void;
  reject(): void;  // 에러가 자기 관할이 아닐 때 거부
}

// packages/agent/src/orchestrate/test/structures/IAutoBeTestCorrectRequestApplication.ts
export interface IAutoBeTestCorrectRequestApplication {
  rewrite(props: IAutoBeTestCorrectRequestApplication.IProps): void;
  reject(): void;  // 잘못된 타입 API 요청이 없으면 거부
}
```

`reject()`는 파라미터가 없다. LLM이 에러를 분석한 뒤 "이건 내 관할이 아니다"라고 판단하면 `reject()`를 호출하고, 오케스트레이터가 다음 전문 에이전트에게 넘긴다.

**전체 에이전트 함수 패턴 분류**:

| 패턴 | 에이전트 수 | 함수 | 예시 |
|------|-----------|------|------|
| process() + 유니언 | ~44 | 1개 (유니언 분기 5~9종) | SchemaRefine, DatabaseSchema, OperationWrite |
| rename()/generate() | 2 | 1개 (다른 이름) | SchemaRename, TestGeneration |
| rewrite() + reject() | 2 | 2개 (조건부 분기) | CorrectCasting, CorrectRequest |
| Facade (다중 함수) | 1 | 5개 (파이프라인 단계) | FacadeApplication |

40개 이상의 오케스트레이터가 5단계에 걸쳐 배치되어 있다:

| 단계 | 오케스트레이터 | 역할 |
|------|----------------|------|
| Analyze | Scenario, ScenarioReview, WriteUnit, WriteSection, SectionReview, CrossFileReview, ExtractDecisions | 요구사항 분석 |
| Database | Group, GroupReview, Authorization, AuthorizationReview, Component, ComponentReview, Schema, SchemaReview, Correct | DB 스키마 |
| Interface | Group, Authorization, Endpoint, EndpointReview, Operation, OperationReview, Schema, SchemaCasting, SchemaRefine, SchemaReview, SchemaRename, SchemaComplement, Prerequisite | API 명세 |
| Test | Scenario, ScenarioReview, GenerationWrite, OperationWrite, PrepareWrite, CorrectRequest, CorrectOverall, PrepareCorrectOverall | E2E 테스트 |
| Realize | CollectorPlan, CollectorWrite, CollectorCorrect, TransformerPlan, TransformerWrite, TransformerCorrect, AuthorizationWrite, AuthorizationCorrect, OperationWrite, OperationCorrect | 구현 코드 |

각 오케스트레이터에는 전용 `IApplication` 인터페이스, History Transformer, 시스템 프롬프트가 있다.

### 비교 평가

| 측면 | Claude Code | AutoBE |
|------|-------------|--------|
| 유연성 | ★★★★★ (어떤 작업이든) | ★★☆☆☆ (백엔드 생성 특화) |
| 예측 가능성 | ★★☆☆☆ (LLM 자율 결정) | ★★★★★ (결정론적 파이프라인) |
| 안전성 | ★★★★☆ (권한+ML 분류기) | ★★★★★ (컴파일러 게이트) |
| 확장성 | ★★★★★ (MCP/플러그인/스킬) | ★★★☆☆ (오케스트레이터 추가 필요) |
| 결과 품질 보증 | ★★☆☆☆ (LLM 역량 의존) | ★★★★★ (컴파일러가 보증) |
| 스키마 표현력 | ★★★☆☆ (Zod, 얕은 구조) | ★★★★★ (재귀 유니언, 깊은 AST) |
| 개발 비용 | ★★★★★ (도구 추가 쉬움) | ★★☆☆☆ (오케스트레이터+프롬프트+히스토리 트랜스포머+스키마) |

---

## 6. 컴파일러와 검증: 최선의 노력 vs 100% 보장

이것이 두 프로젝트 사이의 **가장 근본적인 차이**다.

### Claude Code: LSP + 사후 확인

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

### AutoBE: 3단계 컴파일러 파이프라인

AutoBE의 컴파일러 시스템은 프로젝트의 **존재 이유**다.

**Tier 1: Prisma Database Compiler**

```typescript
// 검증하는 에러 종류:
- 파일/모델/필드명 중복
- snake_case 네이밍 규칙 위반
- 외래 키 참조 무결성 (존재하지 않는 타겟 모델)
- 순환 참조 감지 (Model A → Model B → Model A)
- 예약어 사용 위반
- 인덱스 최적화 (중복/부분집합 인덱스)
- GIN 인덱스 타입 불일치 (string 필드만 허용)
- 관계 oppositeName 충돌
- 필드명-테이블명 충돌

// 에러 구조 (LLM 소비 최적화):
interface IError {
  path: string       // "application.files[0].models[1].foreignFields[0]"
  table: string | null
  field: string | null
  message: string    // 100줄+ 교육적 설명 (무엇이, 왜, 어떻게 고칠지)
}
```

Prisma 에러 메시지의 실제 예시:

```
"Field name conflicts with an existing table name.

**What happened?**
The field 'user' in model 'order' has the same name as another table 'user'.

**Why is this a problem?**
- Naming conflicts can lead to ambiguous references
- May cause issues with Prisma's relation inference

**How to fix:**
1. If this is a denormalization field: Calculate it dynamically instead
2. If legitimate: Rename to 'user_name' or 'user_id'"
```

이것은 단순한 에러 메시지가 아니라, LLM을 가르치는 **교육 자료**다.

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

**자가치유 루프**의 실제 구현:

```typescript
// orchestratePrismaCorrect.ts
async function iterate(ctx, application, life) {
  const result = await compiler.database.validate(application);
  if (result.success) return result;          // 성공
  if (life < 0) return result;                // 재시도 소진

  ctx.dispatch({ type: "databaseValidate", result, ... });

  // LLM에게 에러와 함께 수정 요청
  const corrected = await process(ctx, result);

  // 수정된 모델만 교체 (전체 재생성 아님)
  const newApplication = {
    files: result.data.files.map(file => ({
      ...file,
      models: file.models.map(model => {
        const fixed = corrected.models.find(m => m.name === model.name);
        return fixed ?? model;  // 수정된 것만 교체
      }),
    })),
  };

  return iterate(ctx, newApplication, life - 1);  // 재귀
}
```

에러가 많으면 배치 처리한다 (기본 8개씩):

```typescript
async function process(ctx, failure, capacity = 8) {
  if (errorCount > capacity) {
    // 8개씩 배치 처리, 교정 결과를 누적 병합
  }
}
```

### Function Calling Harness: AutoBE의 비밀 병기

Qwen Meetup Korea 아티클이 밝히는 구체적 수치:

| 모델 | 첫 시도 FC 성공률 | Harness 적용 후 |
|------|-------------------|-----------------|
| qwen3-coder-next | 6.75% | 99.8%+ |
| GPT-4o (NESTFUL) | 28% | — |

3계층 Harness:

**Layer 1: 관대한 JSON 파싱 (Typia)**
```
- 마크다운 코드 블록 제거: ```json ... ```
- 닫히지 않은 문자열 완성: "hello → "hello"
- 따옴표 없는 키: {name: "x"} → {"name": "x"}
- 후행 쉼표: [1, 2,] → [1, 2]
- 불완전 키워드: tru → true, fal → false, nul → null
- 이중 직렬화: "\"x\"" → "x"
- 괄호 자동 닫기: [1, 2 → [1, 2]
```

**Layer 2: 타입 강제 변환**
```
- 스키마 기반: string이 기대되는 곳에 number가 오면 → String(number)
- 배열 기대에 단일 값 → [단일 값]
- null 기대에 undefined → null
```

**Layer 3: 검증 피드백**
```json
{
  "models": [
    {
      "name": "shopping_sale",
      "fields": [
        {
          "name": "price",
          "type": "varchar"  // ❌ Expected: "boolean" | "int" | "double" | "string" | "uri" | "uuid" | "datetime"
        }
      ]
    }
  ]
}
```

`// ❌` 인라인 에러 마커가 **정확히 어느 필드가 왜 틀렸는지** LLM에게 직접 보여준다.

그리고 **핑크 코끼리 원리**:

```
프롬프트: "varchar, text, bigint를 쓰지 마라" → LLM이 오히려 생각함
스키마: type: "boolean" | "int" | "double" | "string" | "uri" | "uuid" | "datetime"
→ varchar가 선택지에 존재하지 않음 → 물리적으로 생성 불가
```

**부재를 통한 제약**이 **금지를 통한 제약**보다 항상 더 강력하다.

이것이 AutoBE가 "에이전트 기교나 워크플로우 고도화에 손도 대지 않고" 컴파일러와 function calling harness에 올인한 이유다.

---

## 7. Function Calling: 자유도 vs 제약의 미학

이 섹션에서 두 프로젝트의 **스키마 설계 철학**을 실제 소스코드로 1:1 비교한다.

### 1:1 비교: 스키마 정의 방식

**Claude Code — Zod 스키마 → JSON Schema 변환 (런타임)**:

```typescript
// src/tools/GlobTool/GlobTool.ts
const inputSchema = lazySchema(() =>
  z.strictObject({
    pattern: z.string().describe('The glob pattern to match files against'),
    path: z.string().optional().describe('The directory to search in...'),
  }),
)
// zodToJsonSchema()가 Zod v4의 toJSONSchema()를 호출하여 변환
// WeakMap 캐시로 동일 스키마 재변환 방지
```

**AutoBE — TypeScript 인터페이스 → JSON Schema 변환 (컴파일타임)**:

```typescript
// packages/agent/src/orchestrate/prisma/structures/IAutoBeDatabaseSchemaApplication.ts
export interface IAutoBeDatabaseSchemaApplication {
  process(props: IAutoBeDatabaseSchemaApplication.IProps): void;
}
// typia.llm.application<IAutoBeDatabaseSchemaApplication>()가
// 컴파일 타임에 TypeScript AST에서 JSON Schema를 추출
```

| 관점 | Claude Code (Zod) | AutoBE (Typia) |
|------|-------------------|----------------|
| 변환 시점 | 런타임 | **컴파일타임** |
| 스키마 소스 | Zod 체인 DSL | TypeScript 인터페이스 |
| 검증 | `z.parse()` 런타임 | 컴파일타임 + 런타임 |
| JSDoc 활용 | `.describe()` 메서드 | 인터페이스 주석이 그대로 스키마 description |
| 커스텀 태그 | 없음 | `tags.Type<"uint32">`, `tags.MinItems<1>` 등 |

### 1:1 비교: 도구 결과(output) 타입

**Claude Code — 구조화된 결과 + UI 렌더링**:

```typescript
// src/tools/GlobTool/GlobTool.ts — outputSchema
z.object({
  durationMs: z.number(),
  numFiles: z.number(),
  filenames: z.array(z.string()),
  truncated: z.boolean(),
})

// 결과 → LLM 소비용 변환
mapToolResultToToolResultBlockParam(output, toolUseID) {
  return {
    tool_use_id: toolUseID,
    type: 'tool_result',
    content: output.filenames.join('\n'),  // 플레인 텍스트로 축소
  }
}
```

**AutoBE — 구조화된 결과 → 파이프라인 상태로 흡수**:

```typescript
// Preliminary 결과 — 실제 데이터가 스키마 구조로 반환
export interface IAutoBePreliminaryGetDatabaseSchemas {
  type: "getDatabaseSchemas";
  schemaNames: string[] & tags.MinItems<1>;
}
// → 오케스트레이터가 실제 Prisma 모델 정의를 JSON으로 반환
// → LLM의 다음 호출에서 컨텍스트로 주입

// Complete 결과 — IPointer에 캡처
const pointer: IPointer<IAutoBeInterfaceSchemaRefineApplication.IComplete | null> =
  { value: null };
// → pointer.value.revises, pointer.value.excludes 등이
//   다음 오케스트레이터의 입력이 됨
```

Claude Code는 결과를 **플레인 텍스트**로 변환해서 LLM에게 돌려주고, AutoBE는 결과를 **타입 안전한 구조체**로 파이프라인 다음 단계에 전달한다.

### 1:1 비교: 에이전트 실행 모델

**Claude Code — while(true) 자유 루프**:

```typescript
// src/query.ts (핵심 구조)
while (true) {
  const response = callModel(messages, tools);  // 40+ 도구 모두 노출
  const toolCalls = extractToolCalls(response);
  if (toolCalls.length === 0) break;            // LLM이 스스로 종료 결정

  // LLM이 한 턴에 여러 도구를 동시 호출 가능
  const results = await StreamingToolExecutor.execute(toolCalls);
  messages.push(...results);
  // tool_choice = auto (기본) → 텍스트 응답도 가능
}
```

**AutoBE — enforceFunctionCall + 유니언 타입 분기**:

```typescript
// packages/agent/src/factory/createAutoBeContext.ts (핵심 구조)
const result = await ctx.conversate({
  source: "interfaceSchemaRefine",
  controller: createController({ pointer, preliminary }),
  enforceFunctionCall: true,  // tool_choice = "required"
  ...transformHistory(ctx, preliminary),
});

// LLM이 텍스트만 응답하면 강제 재시도:
for (let retry = 0; retry < 3; retry++) {
  await agent.conversate(`You MUST call function: ${name}. Do not explain.`);
  if (pointer.value !== null) break;
}

// 유니언 분기 처리:
// LLM 호출 1: { type: "getAnalysisSections", sectionIds: [1,2,3] }  → 데이터 반환
// LLM 호출 2: { type: "getDatabaseSchemas", schemaNames: ["user"] } → 데이터 반환
// LLM 호출 3: { type: "complete", review: "...", revises: [...] }    → 작업 완료
// → 각 호출 후 사용된 preliminary 타입이 유니언에서 제거됨
```

### 1:1 비교: 실제 스키마 복잡도

Claude Code의 가장 복잡한 도구 스키마 — BashTool:

```typescript
// src/tools/BashTool/BashTool.tsx
z.strictObject({
  command: z.string(),
  timeout: semanticNumber(z.number().optional()),
  description: z.string().optional(),
  run_in_background: semanticBoolean(z.boolean().optional()),
  dangerouslyDisableSandbox: semanticBoolean(z.boolean().optional()),
})
// → 5개 필드, 깊이 1, 재귀 없음
```

AutoBE의 일반적인 에이전트 스키마 — InterfaceSchemaRefine:

```typescript
// IAutoBeInterfaceSchemaRefineApplication.IComplete
{
  type: "complete",
  review: string,
  databaseSchema: string | null,
  specification: string,
  description: string,
  excludes: AutoBeInterfaceSchemaPropertyExclude[],  // 배열 of 객체
  revises: AutoBeInterfaceSchemaPropertyRefine[],    // 배열 of 객체 (4종 유니언)
}
// → 7개 필드, 깊이 3+, 배열 내 판별 유니언 중첩
```

AutoBE의 코드 생성 에이전트 스키마 — RealizeOperationWrite:

```typescript
// IAutoBeRealizeOperationWriteApplication.IComplete
{
  type: "complete",
  plan: string,              // 수천 토큰의 전략 분석
  draft: string,             // 완전한 NestJS provider 코드
  revise: {
    review: string,          // 자가 리뷰
    final: string | null,    // 최종 코드 (null = draft 채택)
  }
}
// → LLM이 한 번의 함수 호출로 plan/draft/review/final을 모두 출력
```

이 차이가 극명하다.

### 1:1 비교: "코드 수정" 작업의 스키마

두 프로젝트에서 가장 비슷한 작업 — "코드를 고치는 것"의 스키마를 나란히 비교하면:

**Claude Code — FileEditTool 입력/출력 스키마**:

```typescript
// src/tools/FileEditTool/types.ts — 입력
z.strictObject({
  file_path: z.string().describe('The absolute path to the file to modify'),
  old_string: z.string().describe('The text to replace'),
  new_string: z.string().describe('The text to replace it with'),
  replace_all: z.boolean().default(false).optional(),
})

// 출력
z.object({
  filePath: z.string(),
  oldString: z.string(),
  newString: z.string(),
  originalFile: z.string(),
  structuredPatch: z.array(hunkSchema()),  // diff 패치
  userModified: z.boolean(),               // 사용자가 수정했는지
  gitDiff: gitDiffSchema().optional(),
})
```

**AutoBE — CorrectCasting 에이전트의 코드 수정 스키마**:

```typescript
// packages/agent/src/orchestrate/common/structures/IAutoBeCommonCorrectCastingApplication.ts
export interface IAutoBeCommonCorrectCastingApplication {
  rewrite(props: IAutoBeCommonCorrectCastingApplication.IProps): void;
  reject(): void;
}

export namespace IAutoBeCommonCorrectCastingApplication {
  export interface IProps {
    think: string;              // 에러 패턴 분석 및 수정 전략
    draft: string;              // 수정된 전체 코드
    revise: {
      review: string;           // 수정 패턴 검증 및 완전성 확인
      final: string | null;     // 최종 코드 (null = draft 채택)
    };
  }
}
```

| 관점 | Claude Code EditTool | AutoBE CorrectCasting |
|------|---------------------|----------------------|
| 입력 | 파일경로 + old/new 문자열 | think + draft + revise (전체 코드) |
| 단위 | 한 번에 **하나의 치환** | 한 번에 **전체 파일 재작성** |
| 판단 | 없음 (LLM이 알아서) | think/review로 **추론 과정을 구조화** |
| 거부 | 불가 | `reject()`로 **관할 외 에러 위임** |
| 반복 | LLM이 여러 턴에 걸쳐 반복 | 오케스트레이터가 컴파일러 루프 관리 |
| 검증 | 사용자가 diff 보고 승인 | 컴파일러가 자동 검증 |

Claude Code에서 "파일 수정"은 LLM이 `EditTool`을 호출하고, 결과를 보고, 다시 `EditTool`을 호출하는 **다회전(multi-turn) 패턴**이다. AutoBE에서 "코드 생성"은 LLM이 계획-초안-리뷰-최종을 **단일 함수 호출(single-turn)**로 한꺼번에 내놓는다.

### 비교: 자유 vs 제약

| 관점 | Claude Code | AutoBE |
|------|-------------|--------|
| tool_choice | 미설정 (auto) | "required" |
| 도구 수/턴 | 1~N개 동시 | 유니언 분기 1개 |
| 자유 텍스트 | 허용 | 금지 (enforceFunctionCall) |
| 스키마 복잡도 | 얕음 (깊이 1, 5~15 필드) | 깊음 (깊이 3+, 재귀적 AST) |
| 함수 수/에이전트 | 40+ (전체 도구 풀) | 1~5개 (유니언 분기 포함) |
| 검증 | Zod (런타임) | Typia (컴파일타임 + 런타임) |
| 실패 처리 | 사용자에게 에러 표시 | 자동 재시도 + 피드백 루프 |
| 출력 패턴 | 점진적 (여러 턴에 걸쳐) | 일괄 (한 턴에 plan→draft→revise) |

---

## 8. 컨텍스트 관리: 압축의 예술 vs 변환의 정밀함

### Claude Code: 5중 압축 전략

Claude Code는 긴 대화에서 컨텍스트 창을 관리하기 위해 5가지 전략을 계층적으로 사용한다:

**1. Snip (무료, 매 반복)**
체크포인트 이전의 오래된 메시지를 제거한다. API 응답의 usage에는 제거 전 토큰이 반영되므로, `snipTokensFreed`를 별도로 차감해야 한다.

**2. Cached Microcompact (캐시 친화적, 매 반복)**
```typescript
// API의 cache_edits 블록을 생성하여 도구 결과를 서버 측에서 삭제
// 로컬 메시지는 수정하지 않음 → 캐시 무효화 없음
const cacheEdits = createCacheEditsBlock(state, toolsToDelete)
pendingCacheEdits = cacheEdits
// 삭제 가능한 도구: Read, Bash, Grep, Glob, WebSearch, WebFetch, Edit, Write
```

**3. Time-based Microcompact (60분 갭)**
```typescript
// 마지막 어시스턴트 메시지 후 60분 이상 경과 시
// 최근 5개만 유지, 나머지 결과를 '[Old tool result content cleared]'로 교체
const keepSet = new Set(compactableIds.slice(-keepRecent))  // 최근 5개
const clearSet = compactableIds.filter(id => !keepSet.has(id))
```

**4. Context Collapse (feature-gated)**
읽기 시점 투영(reader-time projection). 90% 지점에서 커밋, 95%에서 블록. Autocompact를 억제한다.

**5. Autocompact (LLM 요약, 임계값 초과 시)**
```typescript
const effectiveWindow = getContextWindowForModel(model) - 20000  // 요약 예약
const threshold = effectiveWindow - 13000  // 버퍼
// 3회 연속 실패 시 회로 차단
if (tracking?.consecutiveFailures >= 3) return { wasCompacted: false }
```

예산 관리:

```typescript
// 경고/에러 상태 계산
const warningThreshold = threshold - 20000   // 경고 표시
const errorThreshold = threshold - 20000     // 에러 표시
const blockingLimit = contextWindow - 3000   // 완전 차단 (수동 /compact만 가능)
```

### AutoBE: History Transformer의 수술적 정밀함

AutoBE는 압축이 아니라 **변환**을 한다. 각 오케스트레이터는 자체 History Transformer를 가지며, 해당 작업에 **정확히 필요한 컨텍스트만** 조립한다.

```typescript
// Realize Phase의 History Transformer 예시
const transformRealizeWriteHistories = (props) => ({
  histories: [
    { type: "systemMessage", text: REALIZE_OPERATION_WRITE,
      _cache: { type: "ephemeral" } },              // 시스템 프롬프트 (캐시)
    { type: "userMessage", text: formatPrismaSchemas(props.state),
      _cache: { type: "ephemeral" } },              // 관련 Prisma 스키마만 (캐시)
    { type: "userMessage", text: formatOperation(props.operation) },  // 현재 작업
    { type: "userMessage", text: formatCollectors(props.collectors) }, // 재사용 함수
    { type: "userMessage", text: taskInstruction },  // 작업 지시
  ],
  userMessage: "Implement the ${operationName} function.",
});
```

180KB의 전체 컨텍스트 → 8KB의 정밀 컨텍스트. **95% 감소**.

**executeCachedBatch 패턴**으로 프롬프트 캐싱을 극대화한다:

```typescript
// 40개 API 구현 시
const results = await executeCachedBatch(ctx, operations.map(op =>
  async (promptCacheKey) => await processOperation(ctx, { op, promptCacheKey })
));
// 실행 순서:
// 1번: 순차 실행, 10,000 토큰 전액 → 캐시 확립
// 2-40번: 병렬 (세마포어 5), 각 10,000 토큰의 90%가 캐시 히트
// 절약: 39 × 9,000 × $0.003/1k ≈ $1.05 → 원래 $12 대비 91% 절감
```

메시지 순서가 핵심이다:
```
[시스템 프롬프트]     ← 모든 작업에서 동일 (캐시)
[Prisma 스키마]       ← 모든 작업에서 동일 (캐시)
[OpenAPI 공통 스키마]  ← 모든 작업에서 동일 (캐시)
[현재 오퍼레이션]      ← 작업마다 다름 (캐시 미스, 마지막에 배치)
```

### 비교: 양적 압축 vs 질적 선별

| 측면 | Claude Code | AutoBE |
|------|-------------|--------|
| 전략 | 사후 압축 (이미 있는 컨텍스트를 줄임) | 사전 선별 (처음부터 최소한만 조립) |
| 정보 유실 | 요약 시 세부사항 유실 가능 | 유실 없음 (필요한 것만 있음) |
| 개발 비용 | 범용 (한 번 구현) | 작업당 커스텀 (40+ transformer) |
| 캐시 효율 | DYNAMIC_BOUNDARY로 분리 | 메시지 순서로 극대화 |
| 적용 범위 | 어떤 대화든 작동 | 정해진 파이프라인만 |

---

## 9. 에러 회복: 인프라 재시도 vs 논리 자가치유

### Claude Code: 7단계 인프라 회복

Claude Code의 에러 회복은 `query.ts`의 7개 `continue` 지점으로 구현된다:

| 단계 | 트리거 | 회복 메커니즘 |
|------|--------|--------------|
| 1. `collapse_drain_retry` | 413 Prompt Too Long | 스테이지된 context collapse 배출 |
| 2. `reactive_compact_retry` | drain 후에도 413 | 전체 autocompact 실행 |
| 3. `max_output_tokens_escalate` | 8k 출력 한도 | 64k로 에스컬레이션 |
| 4. `max_output_tokens_recovery` | 64k 초과 | "resume directly" 메시지 주입 |
| 5. `streaming_fallback` | 스트리밍 실패 | 전체 재시도, 고아 메시지 tombstone |
| 6. `stop_hook_blocking` | 훅 에러 | 에러를 대화에 추가 후 재시도 |
| 7. `token_budget_continuation` | 예산 내 | 자동 계속 |

API 수준의 재시도 (`withRetry.ts`):

```
지수 백오프: 500ms × 2^(attempt-1), 최대 32s, 25% 지터
529 에러: 3회 연속 → 폴백 모델 전환
429 에러: retry-after 헤더 존중
ANT 전용 (persistent): 무한 재시도, 30초마다 하트비트 yield
최대 입력 토큰 초과: "input + max_tokens > limit" 파싱 → 자동 조정
```

이것은 **인프라 수준의 회복**이다. "LLM이 생성한 코드에 버그가 있다"는 문제에 대해서는 사용자에게 의존한다.

### AutoBE: 4계층 논리 자가치유

AutoBE의 에러 회복은 **코드의 논리적 정합성 수준**에서 작동한다:

```
Layer 1: 인라인 재시도 + forceRetry
  forceRetry(execute, API_ERROR_RETRY=10, isRetryable)
  → API 에러, 429, 529, context_length_exceeded 구분
  → context_length_exceeded는 재시도 안 함 (영구 실패)

Layer 2: Agentica 내부 검증 재시도
  config.retry = VALIDATION_RETRY (5)
  → Typia가 JSON 파싱/검증 실패 시 자동 재시도
  → 재시도마다 이전 실패의 에러 메시지를 컨텍스트에 추가

Layer 3: 교정 루프 (orchestrateCorrect)
  compile → [pass] → 완료
  compile → [fail] → diagnostics 추출
    → LLM에게 실패한 모델/함수만 교정 요청
    → 재컴파일 (최대 DATABASE_CORRECT_RETRY=30, COMPILER_RETRY=4)
  에러가 많으면 capacity=8 단위 배치 처리

Layer 4: RAG 루프 (AutoBePreliminaryController)
  LLM: "이 스키마 정보가 더 필요합니다"
  → orchestratePreliminary로 추가 컨텍스트 로딩
  → 최대 RAG_LIMIT=10 반복
```

구성 상수:

```typescript
VALIDATION_RETRY = 3          // Typia 검증 재시도
API_ERROR_RETRY = 10          // API 에러 재시도
FUNCTION_CALLING_RETRY = 3    // 함수 호출 강제
DATABASE_CORRECT_RETRY = 30   // Prisma 교정 (cascading errors 때문에 높음)
COMPILER_RETRY = 4            // TypeScript 교정
RAG_LIMIT = 10                // RAG 반복
SEMAPHORE = 5                 // 기본 동시성
TIMEOUT = 300000              // 5분 타임아웃
```

핵심 차이: Claude Code는 "API가 실패하면 재시도"이고, AutoBE는 "코드가 틀리면 진단하고 수정"이다.

---

## 10. 상태 관리: Redux 패턴 vs Step Counter 패턴

### Claude Code: 200+ 필드의 중앙 집중 상태

Claude Code의 `State` 객체는 200개 이상의 필드를 포함한다:

```typescript
type State = {
  // 세션 식별
  sessionId: SessionId
  parentSessionId: SessionId | undefined
  projectRoot: string

  // 비용 추적
  totalCostUSD: number
  totalAPIDuration: number
  totalLinesAdded: number
  totalLinesRemoved: number

  // 턴별 메트릭
  turnHookDurationMs: number
  turnToolDurationMs: number
  turnClassifierDurationMs: number

  // 모델 사용량
  modelUsage: { [modelName: string]: ModelUsage }

  // 런타임 플래그
  isInteractive: boolean
  kairosActive: boolean  // Agent 모드
  sessionBypassPermissionsMode: boolean

  // 텔레메트리 (OpenTelemetry)
  meter: Meter | null
  sessionCounter: AttributedCounter | null
  // ... 20+ 카운터

  // 진단
  lastAPIRequest: Omit<BetaMessageStreamParams, 'messages'> | null
  inMemoryErrorLog: Array<{ error: string; timestamp: string }>

  // 플러그인 & 기능
  inlinePlugins: Array<string>
  scheduledTasksEnabled: boolean
  sessionCronTasks: SessionCronTask[]
  sessionCreatedTeams: Set<string>
  // ...
}
```

React의 `useSyncExternalStore`로 UI와 동기화한다. 세션 히스토리는 `~/.claude/sessions/<id>/`에 증분 저장된다.

### AutoBE: Step Counter 패턴

AutoBE의 상태는 정확히 **10개 슬롯**이다:

```typescript
interface AutoBeState {
  analyze: AutoBeAnalyzeHistory | null;          // step: N
  database: AutoBeDatabaseHistory | null;        // step: N, analyzeStep
  interface: AutoBeInterfaceHistory | null;      // step: N, analyzeStep, databaseStep
  test: AutoBeTestHistory | null;                // step: N, analyzeStep, interfaceStep
  realize: AutoBeRealizeHistory | null;          // step: N, analyzeStep, interfaceStep

  previousAnalyze: AutoBeAnalyzeHistory | null;   // 비교용
  previousDatabase: AutoBeDatabaseHistory | null;
  previousInterface: AutoBeInterfaceHistory | null;
  previousTest: AutoBeTestHistory | null;
  previousRealize: AutoBeRealizeHistory | null;
}
```

Step Counter의 자동 무효화:

```
Analyze.step = 1 → 재실행 → Analyze.step = 2
  ↓
Database.analyzeStep = 1 ≠ 2 → 무효!
Interface.analyzeStep = 1 ≠ 2 → 무효!
Test.analyzeStep = 1 ≠ 2 → 무효!
Realize.analyzeStep = 1 ≠ 2 → 무효!
```

이것은 `predicateStateMessage()`에서 전제 조건 검사로 활용된다:

```typescript
// 각 단계 시작 시 호출
const predicate = predicateStateMessage(ctx.state(), "interface");
if (predicate !== null)
  return ctx.assistantMessage({ text: predicate });
// predicate 예: "database 단계가 아직 완료되지 않았습니다"
```

---

## 11. 이벤트와 통신: Bridge vs RPC

### Claude Code: JWT + WebSocket Bridge

Claude Code의 IDE 통합은 복잡한 브릿지 프로토콜을 사용한다:

**v1 프로토콜**: WebSocket(읽기) + HTTP POST(쓰기)
```typescript
class HybridTransport extends WebSocketTransport {
  // stream_event는 100ms 버퍼링 후 배치 POST
  // 그 외는 즉시 POST
  // SerialBatchEventUploader: 직렬화, 배치, 무한 재시도
}
```

**v2 프로토콜**: SSE(읽기) + CCR Worker API(쓰기)
```typescript
// SSE로 읽기: 시퀀스 번호 캐리오버 (재연결 시 히스토리 리플레이 방지)
// CCR v2: PUT /worker, POST /worker/events/{id}/delivery
// JWT 인증: session_id 클레임 검증
```

**메시지 중복 제거** (BoundedUUIDSet):
```typescript
// O(1) 링 버퍼: 자신의 에코와 서버 리플레이를 감지
class BoundedUUIDSet {
  private readonly ring: (string | undefined)[]
  private readonly set = new Set<string>()
  // 용량 초과 시 가장 오래된 항목 축출
}
```

**토큰 갱신 스케줄러**: 만료 5분 전 선제적 갱신, 세대 카운터로 오래된 비동기 갱신 방지, 3회 연속 실패 시 1분 대기 후 재시도.

### AutoBE: 자동 포워딩 RPC

AutoBE의 통신은 극도로 단순하다:

```typescript
// AutoBeRpcService: 모든 이벤트를 자동 포워딩
constructor(props) {
  for (const key of typia.misc.literals<keyof IAutoBeRpcListener>()) {
    if (key === "enable") continue;
    agent.on(key, (event) => {
      listener[key]!(event as any).catch(() => {});
    });
  }
}
```

`typia.misc.literals<keyof T>()`가 인터페이스의 모든 키를 컴파일 타임에 추출한다. 새 이벤트를 `IAutoBeRpcListener`에 추가하면, **코드 수정 없이** 자동으로 포워딩된다.

71+ 이벤트 타입은 완벽한 discriminated union으로 매핑된다:

```typescript
type AutoBeEvent = /* 71+ 타입의 합집합 */
namespace AutoBeEvent {
  type Type = AutoBeEvent["type"];  // 리터럴 유니온
  type Mapper = { [E in AutoBeEvent as E["type"]]: E };  // 타입별 매핑
}

// 사용:
agent.on("databaseValidate", (event) => {
  // event: AutoBeDatabaseValidateEvent (자동 타입 추론)
  console.log(event.result.errors);
});
```

### 비교

| 측면 | Claude Code Bridge | AutoBE RPC |
|------|-------------------|------------|
| 프로토콜 | WebSocket + HTTP POST / SSE + CCR | WebSocket (TGrid) |
| 인증 | JWT + OAuth 2.0 PKCE | 세션 기반 |
| 중복 제거 | BoundedUUIDSet (O(1) 링 버퍼) | 불필요 (단방향 이벤트) |
| 새 이벤트 추가 | 수동 핸들러 등록 | 자동 (인터페이스에 추가만) |
| 이벤트 수 | 14 훅 이벤트 | 71+ 파이프라인 이벤트 |
| 복잡도 | ~200KB 브릿지 코드 | ~50줄 RPC 서비스 |

---

## 12. 확장성: 생태계 vs 컴파일러 체인

### Claude Code: MCP + 플러그인 + 스킬 생태계

Claude Code는 3계층 확장 시스템을 갖추고 있다:

**MCP (Model Context Protocol)**:
- 외부 도구 서버에 연결하여 도구를 동적으로 통합
- 빌트인 도구와 중복 시 빌트인 우선 (`uniqBy('name')`)
- 동시성 세마포어 제한 (2)

**플러그인 시스템**:
```typescript
type LoadedPlugin = {
  commands?: CommandMetadata        // CLI 슬래시 명령
  agents?: AgentDefinition          // 서브에이전트 정의
  skills?: BundledSkillDefinition   // 번들 스킬
  hooks?: HooksSettings             // 라이프사이클 훅
  mcpServers?: McpServerConfig      // MCP 서버
  lspServers?: LspServerConfig      // LSP 서버
  outputStyles?: OutputStyle        // 커스텀 출력 형식
}
```

**스킬 시스템**: 번들 스킬 12개 이상 (verify, debug, simplify, batch, stuck, loop, dream 등). Feature flag로 게이팅.

**Feature Flag (Bun DCE)**:
```typescript
feature('COORDINATOR_MODE')      // 멀티워커 오케스트레이션
feature('VOICE_MODE')            // 음성 입출력
feature('ULTRAPLAN')             // 고급 계획 모드
feature('FORK_SUBAGENT')         // 포크 서브에이전트
feature('KAIROS')                // 에이전트 모드
feature('DAEMON')                // 데몬 모드
// 빌드 시 --define FEATURE_GATE=0으로 전체 분기 제거
```

### AutoBE: 컴파일러 체인 확장

AutoBE의 확장은 **새 컴파일러를 체인에 추가하는 것**이다:

```
현재: Prisma → OpenAPI → TypeScript
Epsilon 예정:
  + Runtime Feedback Compiler (실제 서버 기동 검증)
  + E2E Test Runner (테스트 통과 검증)
  + Database Schema Parser (사용자 수정 역파싱)
  + Interface Schema Parser (사용자 수정 역파싱)
```

새 오케스트레이터 추가 시 필요한 것:
1. `IMyApplication` TypeScript 인터페이스
2. `typia.llm.application<T>()` 스키마 생성
3. 시스템 프롬프트 Markdown
4. History Transformer
5. 오케스트레이터 함수
6. 이벤트 타입 (자동 RPC 포워딩)

---

## 13. 2세대와 3세대, 그 경계에 대하여

### 세대 분류의 기준

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

### 그러나 경계는 흐려지고 있다

Claude Code에도 3세대적 요소가 있다:

- **Coordinator Mode**: 코디네이터가 "작업자를 관리"하며, 작업자는 "내부 신호이지 대화 상대가 아닌" 자율 에이전트
- **Plan Mode V2**: 구독 등급에 따라 1-3개 워커를 병렬 생성, `인터뷰 → 리서치 → 설계 → 구현 → 검증` 5단계
- **Fork Subagent**: 부모 컨텍스트를 공유하면서 독립적으로 코드 수정, 커밋까지 자동 수행

AutoBE에도 2세대적 요소가 있다:

- **Facade의 대화형 인터페이스**: LLM이 사용자와 대화하면서 단계를 결정
- **Epsilon 로드맵의 Human Modification Support**: 사용자 수정을 역파싱하여 재통합
- **Cyclinic Workflow**: 자가 리뷰 루프 (Critic Agent)

### 진정한 차이: 검증의 유무

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

## 14. AutoBE가 Claude Code로부터 배울 것들

AutoBE는 Epsilon에서 워크플로우 고도화를 시작한다. Claude Code의 512,000줄에서 참고할 패턴이 많다.

### 14.1 컨텍스트 압축의 다층 전략

Spiral Workflow(역방향 전파)가 도입되면 대화가 길어질 수 있다. Claude Code의 5중 압축 전략, 특히:

- **Autocompact**: Database→Interface→다시 Database로 돌아갈 때, 중간 과정을 LLM이 요약
- **Cached Microcompact**: 오래된 도구 결과를 `cache_edits`로 서버 측 삭제, 로컬 불변
- **Circuit Breaker**: 3회 연속 실패 시 중단 (무한 루프 방지)

### 14.2 StreamingToolExecutor의 동시성 모델

Runtime Feedback Agent가 도입되면 "컴파일은 병렬, 런타임 테스트는 직렬" 규칙이 필요하다. Claude Code의 모델:

```
isConcurrencySafe(input) → 도구별 동시성 판단
siblingAbortController → Bash 실패 시 형제 취소
독립 에러 → Read/Grep 실패는 다른 도구에 영향 없음
```

### 14.3 Fork Subagent의 캐시 공유

Epsilon의 Multi-draft generation (다중 초안 후 최선안 선택)에 적용 가능:

```typescript
// Claude Code의 Fork: byte-identical prefix로 캐시 공유
function buildForkedMessages(directive) {
  return [
    fullAssistantMessage,           // 모든 fork 동일 → 캐시
    userMessage({
      ...toolResultBlocks,          // placeholder로 동일 → 캐시
      text: FORK_DIRECTIVE_PREFIX + directive  // 여기만 다름
    })
  ]
}
```

AutoBE의 `executeCachedBatch`는 메시지 순서로 캐시를 최적화하지만, Fork는 **전체 대화 히스토리를 공유**한다는 점이 다르다. Critic Agent가 여러 변형을 평가할 때 유용할 수 있다.

### 14.4 Coordinator Mode의 합성 패턴

Claude Code Coordinator의 핵심 원칙:

```
"Workers can't see your conversation. Every prompt must be self-contained."
"When workers report research findings, you must understand them before
directing follow-up work."
"Avoid lazy delegation ('based on your findings')"
```

이것은 AutoBE의 History Transformer 패턴과 동일한 통찰이다—서브에이전트에게 필요한 것만 정확히 전달해야 한다. Epsilon의 Dynamic Agent Routing에 참고할 수 있다.

### 14.5 메모리 시스템

Claude Code의 영구 메모리:

```
~/.claude/projects/<slug>/memory/
  ├── MEMORY.md (인덱스, 최대 25KB, 200줄)
  ├── user_role.md (사용자 정보)
  ├── feedback_testing.md (피드백)
  └── project_deadline.md (프로젝트 상태)
```

AutoBE가 프로젝트별 선호도("이 팀은 jsonb를 좋아한다")를 기억하면 생성 품질이 향상될 수 있다.

### 14.6 Plan Mode의 구독 등급별 워커 수

```typescript
// Claude Max 20x: 3 워커, Enterprise/Team: 3 워커, 기본: 1 워커
function getPlanModeV2AgentCount(): number {
  if (subscriptionType === 'max' && rateLimitTier === '20x') return 3
  if (subscriptionType === 'enterprise' || 'team') return 3
  return 1
}
```

AutoBE도 사용자 등급에 따라 동시 에이전트 수를 조절하는 모델을 도입할 수 있다.

### 14.7 Feature Flag (Bun DCE)

Claude Code는 `feature()` 게이트로 빌드 시 코드를 제거한다. AutoBE도 Epsilon의 실험적 기능(Critic Agent, Runtime Feedback)을 feature flag로 관리하면, 안정 빌드와 실험 빌드를 분리할 수 있다.

---

## 15. Claude Code가 AutoBE로부터 배울 것들

### 15.1 컴파일러 기반 자가치유 루프

Claude Code에 가장 부족한 것. LSP 진단을 스트리밍하지만, 자동 수정 루프가 없다.

AutoBE의 패턴:
```
Write → Compile → [pass] → Done
                    [fail] → Extract diagnostics (LLM 최적화 형태)
                           → Correct (실패한 부분만)
                           → Recompile (최대 N회)
```

특히 Prisma 에러 메시지의 **교육적 형식**—"What happened? Why is this a problem? How to fix?"—이 LLM의 교정 성공률을 크게 높인다.

### 15.2 Function Calling Harness

6.75% → 99.8%. Typia의 3계층 harness를 도입하면 소규모/오픈소스 모델에서도 도구 호출 신뢰성이 급상향한다.

### 15.3 "부재를 통한 제약" 원리

```
"Don't use any type" (프롬프트 금지) → LLM이 오히려 any를 떠올림
스키마에 any 선택지 자체를 제거 → 물리적으로 생성 불가
```

Claude Code의 시스템 프롬프트에도 "Don't X" 패턴이 많다. "Don't add features beyond what was asked", "Don't add docstrings to code you didn't change". 이것을 스키마 제약으로 변환하면 더 효과적일 수 있다.

### 15.4 History Transformer 패턴

Fork Subagent에 전체 대화 히스토리를 넘기는 대신, 작업에 관련된 부분만 선별하면 성능과 비용을 크게 개선할 수 있다.

### 15.5 Step Counter를 통한 의존성 추적

Coordinator Mode에서 여러 워커가 병렬 작업할 때, 파일 수정 의존성을 추적하는 데 Step Counter가 유용하다.

### 15.6 71+ 이벤트 타입의 자동 포워딩

```typescript
// AutoBE: 인터페이스에 키 추가만 하면 자동 포워딩
for (const key of typia.misc.literals<keyof IAutoBeRpcListener>()) {
  agent.on(key, (event) => listener[key]!(event));
}
```

Claude Code의 14 훅 이벤트는 수동 등록이다. Typia 스타일의 자동 포워딩을 도입하면 이벤트 추가 비용이 0에 수렴한다.

---

## 16. 병렬 실행: Coordinator vs executeCachedBatch

두 프로젝트 모두 병렬성을 활용하지만, 그 수준과 방식이 전혀 다르다.

### Claude Code: Coordinator Mode — 인간 팀 리더 패턴

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

워커 재활용 전략도 구조화되어 있다:

```
| 상황                         | 전략       | 이유                    |
|------------------------------|-----------|------------------------|
| 리서치가 구현 파일과 겹침       | Continue  | 이미 파일이 컨텍스트에 있음 |
| 광범위한 리서치 후 좁은 구현    | Spawn New | 탐색 노이즈 제거          |
| 실패 교정                     | Continue  | 에러 컨텍스트 유지         |
| 다른 워커의 코드 검증           | Spawn New | 편견 없이 독립 검증        |
```

**한계**: 코디네이터는 LLM이다. 작업 분배, 종합, 검증 판단 모두 LLM의 추론에 의존한다. 잘못된 판단으로 워커를 잘못된 방향으로 보내거나, 종합이 부실할 수 있다.

### AutoBE: executeCachedBatch — 결정론적 병렬 파이프라인

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

```typescript
// AutoBe의 병렬 실행 설정 상수들
export const enum AutoBeConfigConstant {
  SEMAPHORE = 8,                // 동시 LLM API 호출 수
  VALIDATION_RETRY = 3,         // 검증 재시도
  COMPILER_RETRY = 4,           // 컴파일러 교정 재시도
  DATABASE_CORRECT_RETRY = 30,  // Prisma 교정 (캐스케이딩 에러 때문에 높음)
  FUNCTION_CALLING_RETRY = 3,   // FC 강제 재시도
  ANALYZE_RETRY = 15,           // 분석 단계 재시도
  ANALYZE_CONSECUTIVE_ERROR = 5, // 연속 실패 fast-fail 임계값
  RAG_LIMIT = 7,                // RAG 루프 최대 반복
  TIMEOUT = 20 * 60 * 1000,    // 20분 타임아웃
  ANALYSIS_PAGE_SIZE = 75,      // 분석 섹션 페이지네이션
}
```

### 비교: 적응적 vs 결정론적 병렬성

| 측면 | Claude Code Coordinator | AutoBE executeCachedBatch |
|------|------------------------|--------------------------|
| 분배 결정 | LLM 판단 | 코드 하드코딩 |
| 동시성 제어 | 프롬프트 지침 | Semaphore (tstl) |
| 실패 처리 | "다른 접근을 시도하라" | Fail-fast (하나 실패 → 전체 중단) |
| 결과 종합 | LLM이 종합 | 타입 안전한 배열 반환 |
| 적용 범위 | 어떤 작업이든 | 동일 스키마의 배치 작업 |
| 캐시 최적화 | 없음 (각 워커 독립) | promptCacheKey 공유 |
| 워커 재활용 | SendMessage로 계속 | 일회성 (disposable) |

---

## 17. RAG 패턴: CLAUDE.md vs AutoBePreliminaryController

두 프로젝트 모두 LLM에 외부 정보를 주입하지만, 그 메커니즘이 근본적으로 다르다.

### Claude Code: CLAUDE.md + 메모리 파일 + nested_memory

Claude Code는 프로젝트 맥락을 **파일 시스템 기반**으로 주입한다:

```
계층 1: CLAUDE.md (프로젝트 지시사항)
  ~/.claude/CLAUDE.md        → 글로벌
  ./CLAUDE.md                → 프로젝트 루트
  ./src/CLAUDE.md            → 디렉터리별
  → 대화 시작 시 자동 로딩, 시스템 프롬프트에 주입

계층 2: Memory 파일
  ~/.claude/projects/<slug>/memory/*.md  → 세션 간 영구 저장
  frontmatter로 타입 분류: user, feedback, project, reference
  MEMORY.md 인덱스 → 200줄 이내 유지

계층 3: nested_memory 첨부
  loadedNestedMemoryPaths → Set<string>으로 중복 방지
  nestedMemoryAttachmentTriggers → 자동 트리거
```

**특징**: 모든 것이 **정적**이다. CLAUDE.md 파일이 대화 시작 시 한 번 로딩되고, 이후 컨텍스트에 고정된다. LLM이 능동적으로 "더 필요한 정보가 있으니 로드하겠다"고 결정할 수 없다.

### AutoBE: AutoBePreliminaryController — 동적 RAG 루프

AutoBE의 Preliminary 시스템은 **LLM이 능동적으로 데이터를 요청하는** 구조다:

```typescript
// packages/agent/src/orchestrate/common/AutoBePreliminaryController.ts
public async orchestrate<T>(
  ctx: AutoBeContext,
  process: (...) => Promise<IAutoBeOrchestrateResult<T>>,
): Promise<T | never> {
  for (let i = 0; i < AutoBeConfigConstant.RAG_LIMIT; ++i) {  // 최대 7회
    const result = await process(...);
    if (result.value !== null) return result.value;  // 작업 완료

    // LLM이 "getDatabaseSchemas"를 호출했다면 → 데이터 로딩
    await orchestratePreliminary(ctx, {
      source_id: this.source_id,
      preliminary: this,
      trial: i + 1,
      histories: result.histories,
    });
    // → 다음 반복에서 로딩된 데이터가 컨텍스트에 포함됨
  }
  throw new AutoBePreliminaryExhaustedError();
}
```

Preliminary 컨트롤러의 내부 메커니즘:

```typescript
// 1. 전체 가용 데이터(all)와 현재 로딩된 데이터(local) 분리
private readonly all: Pick<IAutoBePreliminaryCollection, Kind>;   // DB 전체 스키마
private readonly local: Pick<IAutoBePreliminaryCollection, Kind>; // 현재 에이전트 컨텍스트

// 2. 의존성 자동 보완 — $ref로 참조된 스키마를 자동 로딩
complementPreliminaryCollection({
  kinds: props.kinds,
  all: this.all,
  local: this.local,
  prerequisite: false,  // $ref 의존 자동 해결
});

// 3. 스키마 동적 수정 — 이전 이터레이션이 없으면 getPreviousXXX 제거
public fixApplication(application: ILlmApplication): ILlmApplication {
  fixPreliminaryApplication({
    state: this.state,
    preliminary: this,
    application,  // oneOf에서 불필요한 타입 제거 (mutate in-place)
  });
  return application;
}

// 4. 중복 방지 + 존재 확인 검증
public validate(input): IValidation {
  return validatePreliminary(this, input);  // 이미 로딩된 것 중복 요청 → 에러
}

// 5. 페이지네이션 — 1,000+ 분석 섹션 시 75개씩 표시
public advanceAnalysisPage(): void {
  this.analysisPageOffset += AutoBeConfigConstant.ANALYSIS_PAGE_SIZE;
}
```

**동작 흐름 예시** (Interface Schema Refine):

```
┌─ 턴 1: LLM이 thinking + { type: "getDatabaseSchemas", schemaNames: ["user", "order"] }
│  → 컨트롤러가 user, order 스키마를 local에 추가
│  → order가 $ref로 참조하는 product도 자동 보완
│  → 유니언에서 getDatabaseSchemas 제거 (다시 호출 불가)
│
├─ 턴 2: LLM이 thinking + { type: "getInterfaceOperations" }
│  → 관련 API 오퍼레이션 목록 로딩
│  → 유니언에서 getInterfaceOperations 제거
│
└─ 턴 3: LLM이 thinking + { type: "complete", review: "...", revises: [...] }
   → 작업 완료, 결과 반환
```

### 비교: 정적 주입 vs 동적 수집

| 측면 | Claude Code | AutoBE |
|------|-------------|--------|
| 로딩 시점 | 대화 시작 시 일괄 | LLM이 필요할 때 점진적 |
| 데이터 선택 | 사람이 CLAUDE.md 작성 | LLM이 유니언 타입으로 선택 |
| 중복 방지 | loadedNestedMemoryPaths (Set) | 유니언에서 물리적 제거 |
| 의존성 해결 | 없음 | $ref 기반 자동 보완 |
| 크기 제한 | 컨텍스트 창 의존 → 압축 | 필요한 것만 → 애초에 작음 |
| 페이지네이션 | 없음 | 75개씩 자동 페이지네이션 |
| 검증 | 없음 | validatePreliminary (중복/미존재 감지) |

---

## 18. 재시도 전략: 지수 백오프 vs 컴파일러 루프

에러 회복은 두 프로젝트의 본질적 차이를 가장 선명하게 드러낸다.

### Claude Code: withRetry — 인프라 수준 회복력

```typescript
// src/services/api/withRetry.ts — 822줄의 재시도 인프라
const DEFAULT_MAX_RETRIES = 10
const FLOOR_OUTPUT_TOKENS = 3000
const MAX_529_RETRIES = 3
const BASE_DELAY_MS = 500

// 529 (Overloaded) 폴백 — 사용자 대면 요청만 재시도
const FOREGROUND_529_RETRY_SOURCES = new Set([
  'repl_main_thread', 'sdk', 'compact', 'auto_mode', ...
])
// 백그라운드 요청(title, suggestions, classifiers)은 529에서 즉시 포기
// → "capacity cascade에서 각 재시도가 3-10× gateway 증폭"

// 무인 세션 (CI 등) — 무한 재시도 with 높은 백오프
const PERSISTENT_MAX_BACKOFF_MS = 5 * 60 * 1000     // 5분
const PERSISTENT_RESET_CAP_MS = 6 * 60 * 60 * 1000  // 6시간
const HEARTBEAT_INTERVAL_MS = 30_000                  // 30초 킵얼라이브

// 모델 폴백
class FallbackTriggeredError extends Error {
  constructor(originalModel, fallbackModel) { ... }
}
// 529 3회 → fallbackModel로 전환 (e.g., Opus → Sonnet)
```

```
재시도 전략:
  일반 에러 → 지수 백오프 (BASE_DELAY × 2^attempt, jitter 포함)
  429 (Rate Limit) → 서버 retry-after 헤더 존중
  529 (Overloaded) → 3회까지 재시도, 초과 시 모델 폴백
  401 (Auth) → OAuth 토큰 리프레시 후 재시도
  ECONNRESET/EPIPE → 커넥션 재생성 후 즉시 재시도
  Fast Mode 거부 → 쿨다운 진입, 일반 모드 폴백
```

**특징**: 모든 재시도가 **같은 요청을 다시 보내는 것**이다. "서버가 바쁘니까 잠깐 기다렸다 다시 시도하자"는 인프라 수준의 회복이지, "내가 틀린 것을 고쳐서 다시 시도하자"가 아니다.

### AutoBE: 계층별 재시도 — 각 수준마다 다른 전략

```typescript
// AutoBe의 재시도는 4계층으로 나뉜다

// Layer 1: API 인프라 재시도 (Claude Code와 유사)
// randomBackoffRetry: 429/500/503 → 지수 백오프
API_ERROR_RETRY = 3

// Layer 2: Function Calling 강제 재시도
// LLM이 텍스트만 응답했을 때 → "함수를 호출하라" 재요청
FUNCTION_CALLING_RETRY = 3

// Layer 3: 검증 재시도 (Typia 런타임 검증 실패)
// LLM 출력이 스키마에 안 맞을 때 → 인라인 에러 피드백 후 재시도
VALIDATION_RETRY = 3

// Layer 4: 컴파일러 교정 루프 (AutoBE 고유)
// 컴파일러가 의미적 에러를 잡았을 때 → 진단 메시지와 함께 재생성
COMPILER_RETRY = 4           // 일반 컴파일
DATABASE_CORRECT_RETRY = 30  // DB 스키마 (에러가 캐스케이딩하므로 높음)
```

Layer 4가 Claude Code에는 없는 **근본적 차별점**이다:

```
Claude Code:
  LLM 응답 → 사용자에게 표시 → (사용자가 에러 발견) → 사용자가 수정 요청
  ↑ 사람이 검증                                    ↑ 사람이 피드백

AutoBE:
  LLM 응답 → 컴파일러 검증 → (에러 발견) → 진단 추출 → LLM에 피드백 → 재생성
  ↑ 기계가 검증                           ↑ 기계가 피드백
  → 최대 30회 반복 (DB 스키마의 경우)
```

---

## 19. AST 설계 철학: 범용 vs AI 최적화

### Claude Code: 표준 도구 스키마

Claude Code의 도구는 **범용 JSON Schema**로 정의된다. 각 도구는 독립적이고, 도구 간 데이터 흐름은 LLM의 자유 텍스트로 이루어진다:

```
EditTool → 텍스트 결과 → (LLM이 해석) → BashTool → 텍스트 결과 → (LLM이 해석)
```

도구 스키마에 교차 참조가 없다. `EditTool`의 출력이 `BashTool`의 입력을 타입 수준에서 참조하지 않는다.

### AutoBE: AutoBeOpenApi — AI가 생성하기 위한 간소화된 AST

AutoBE의 OpenAPI AST는 표준 OpenAPI 3.1에서 **LLM이 혼동할 수 있는 요소를 제거**한 버전이다:

```typescript
// packages/interface/src/openapi/AutoBeOpenApi.ts
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

  // 컴포넌트 명명 규칙까지 타입 수준에서 강제:
  // IEntityName → 전체 엔티티
  // IEntityName.ICreate → POST 요청 바디
  // IEntityName.IUpdate → PUT 요청 바디
  // IEntityName.ISummary → 리스트용 축약 뷰
  // IPageIEntityName → 페이지네이션 결과
  export interface IComponents {
    schemas: Record<string, IJsonSchema>;
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

**specification vs description 이중 구조**:

```typescript
// 모든 Operation과 Schema에 두 가지 설명이 있다:
specification: string  // 내부용: "어떻게 구현하는가" (DB 쿼리, 비즈니스 규칙)
description: string    // 외부용: "무엇을 하는가" (API 소비자에게 보이는 문서)
```

이 이중 구조가 **에이전트 간 소통 채널**이다. Interface 단계의 에이전트가 `specification`에 기술한 구현 힌트를, Realize 단계의 에이전트가 읽고 따른다. `description`은 최종 Swagger 문서에 그대로 노출된다.

### 비교: 범용 스키마 vs 도메인 특화 AST

| 측면 | Claude Code 도구 스키마 | AutoBE OpenAPI AST |
|------|----------------------|-------------------|
| 설계 기준 | 범용 (어떤 작업이든) | AI 생성 최적화 |
| 도구 간 데이터 흐름 | 자유 텍스트 (LLM 해석) | 타입 안전 ($ref 참조) |
| 모호성 | 허용 (LLM이 판단) | 제거 (선택지 축소) |
| 네이밍 규칙 | 없음 | CamelCasePattern 타입 강제 |
| 이중 문서 | 없음 | specification(내부) + description(외부) |
| 표준 준수 | Zod → JSON Schema (표준) | OpenAPI 3.1 간소화 (비표준) |

---

## 20. Fork Subagent vs 일회성 MicroAgentica

### Claude Code: Fork — 부모 캐시를 공유하는 자식 에이전트

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

### AutoBE: MicroAgentica — 완전 일회용 에이전트

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

### 비교: 장수형 vs 일회용

| 측면 | Claude Code Fork | AutoBE MicroAgentica |
|------|-----------------|---------------------|
| 수명 | 작업 완료까지 존속 | 단일 conversate() 후 폐기 |
| 상태 | 부모로부터 상속 + 누적 | 없음 (매번 새로 조립) |
| 캐시 전략 | 부모 캐시 공유 (CacheSafeParams) | executeCachedBatch의 promptCacheKey |
| 컨텍스트 | 부모 메시지 전체 + 추가 작업 | History Transformer의 최소 선별 |
| 재시도 | SendMessage로 계속 | 새 에이전트 생성 |
| 독립성 | 부분적 (캐시 공유, 상태 분리) | 완전 독립 |

---

## 21. 설정과 튜닝: Feature Flag vs Config Constant

### Claude Code: GrowthBook Feature Flags — 동적 실험

Claude Code는 GrowthBook(Feature Flag 서비스)으로 기능을 동적으로 켜고 끈다:

```typescript
// Bun DCE (Dead Code Elimination) + feature flag 이중 구조
import { feature } from 'bun:bundle'

// 컴파일 타임 게이트 — 빌드에서 코드 자체를 제거
if (feature('COORDINATOR_MODE')) { ... }
if (feature('CONTEXT_COLLAPSE')) { ... }
if (feature('BASH_CLASSIFIER')) { ... }
if (feature('UNATTENDED_RETRY')) { ... }

// 런타임 게이트 — 서버에서 동적 전환
getFeatureValue_CACHED_MAY_BE_STALE('feature_name')
checkStatsigFeatureGate_CACHED_MAY_BE_STALE('gate_name')
```

`CACHED_MAY_BE_STALE` — 이 함수 이름이 모든 것을 말해준다. 네트워크 레이턴시 없이 캐시된 값을 즉시 반환하되, 최신이 아닐 수 있다. A/B 테스트와 점진적 롤아웃에 사용된다.

### AutoBE: const enum — 컴파일 타임 상수

```typescript
// packages/agent/src/constants/AutoBeConfigConstant.ts
export const enum AutoBeConfigConstant {
  VALIDATION_RETRY = 3,
  COMPILER_RETRY = 4,
  DATABASE_CORRECT_RETRY = 30,
  FUNCTION_CALLING_RETRY = 3,
  ANALYZE_RETRY = 15,
  ANALYZE_CONSECUTIVE_ERROR = 5,
  SEMAPHORE = 8,
  RAG_LIMIT = 7,
  TIMEOUT = 20 * 60 * 1000,
  ANALYSIS_PAGE_SIZE = 75,
}
```

`const enum`은 컴파일 타임에 인라인된다. 런타임 객체가 생성되지 않으며, 각 사용처에 리터럴 값이 직접 들어간다. 동적 변경이 **불가능**하다.

### 비교

| 측면 | Claude Code | AutoBE |
|------|-------------|--------|
| 변경 시점 | 런타임 (서버에서 전환) | 컴파일 타임 (코드 수정 필요) |
| A/B 테스트 | 가능 | 불가능 |
| 점진적 롤아웃 | 가능 (1% → 10% → 100%) | 불가능 (전체 배포) |
| 코드 제거 | `feature()` → Bun DCE | `const enum` → TS 인라인 |
| 복잡도 | 높음 (GrowthBook + Statsig + 캐시) | 낮음 (상수 파일 1개) |
| 제어 입도 | 기능 단위 | 수치 단위 |

이 차이는 **조직 규모**를 반영한다. Anthropic은 수백 명의 엔지니어가 동시에 개발하므로, Feature Flag로 개별 팀의 기능을 독립 배포한다. AutoBE는 소규모 팀이므로, 상수 하나 바꾸고 배포하는 것이 더 효율적이다.

---

## 22. 상태 영속성: 세션 스토리지 vs 이벤트 소싱

### Claude Code: 파일 시스템 기반 세션

```
~/.claude/projects/<slug>/
  ├── memory/              ← MEMORY.md + 개별 .md 파일
  ├── sessions/            ← 세션별 대화 기록
  └── permissions/         ← 영구 권한 규칙

세션 복원:
  sessionId → 이전 대화 메시지 로딩
  conversationId → API 레벨 대화 ID
  matchSessionMode() → coordinator/normal 모드 복원
```

Claude Code의 세션은 **파일에 직렬화된 메시지 배열**이다. 복원 시 메시지를 다시 로딩하면 이전 대화가 이어진다.

### AutoBE: 이벤트 소싱으로 상태 재구성

AutoBE의 상태는 **이벤트 시퀀스**로 정의된다:

```typescript
// AutoBeState — 5 슬롯 × 2 (현재 + 이전) = 10 필드
export interface AutoBeState {
  analyze: AutoBeAnalyzeHistory | null;
  database: AutoBeDatabaseHistory | null;
  interface: AutoBeInterfaceHistory | null;
  test: AutoBeTestHistory | null;
  realize: AutoBeRealizeHistory | null;
  previousAnalyze: AutoBeAnalyzeHistory | null;
  previousDatabase: AutoBeDatabaseHistory | null;
  previousInterface: AutoBeInterfaceHistory | null;
  previousTest: AutoBeTestHistory | null;
  previousRealize: AutoBeRealizeHistory | null;
}

// 상태 전이는 이벤트 디스패치로만 발생
ctx.dispatch({ type: "analyzeComplete", ... })
→ state.previousAnalyze = state.analyze  // 현재 → 이전으로 이동
→ state.analyze = newHistory              // 새 결과가 현재로
→ state.database = null                   // 하위 단계 자동 무효화!
→ state.interface = null
→ state.test = null
→ state.realize = null
```

**Step Counter 패턴**의 핵심: Analyze가 재실행되면 Database 이하 **전부 자동 무효화**된다. 코드에서 명시적으로 "이전 DB 결과를 지워라"고 쓸 필요가 없다—이벤트 핸들러가 자동으로 처리한다.

그리고 `previous*` 필드가 있어서, 이전 반복과 현재 반복의 결과를 **비교**할 수 있다. SchemaRefine 에이전트가 "이전에 생성된 스키마"와 "현재 DB 스키마"를 모두 참조하며 판단하는 것이 이 구조 덕분이다.

### 비교

| 측면 | Claude Code | AutoBE |
|------|-------------|--------|
| 상태 모델 | 메시지 배열 (200+ 필드 AppState) | 이벤트 소싱 (10 필드 AutoBeState) |
| 저장 | 파일 시스템 | 이벤트 시퀀스 |
| 복원 | 메시지 재로딩 | 이벤트 재생(replay) |
| 무효화 | 수동 (코드에서 명시) | 자동 (Step Counter) |
| 이전 버전 | 없음 | previous* 필드로 보존 |
| 크기 | 대화가 길어지면 무한 증가 → 압축 필요 | 5단계 × 2 = 고정 |

---

## 23. 토큰 경제학: 무한 대화 vs 고정 파이프라인

### Claude Code: 대화가 길어질수록 비용이 증가하는 구조

```typescript
// autoCompact.ts — 컨텍스트 창 관리 상수들
const MAX_OUTPUT_TOKENS_FOR_SUMMARY = 20_000     // 요약 예약 토큰
const AUTOCOMPACT_BUFFER_TOKENS = 13_000          // 자동 압축 버퍼
const WARNING_THRESHOLD_BUFFER_TOKENS = 20_000    // 경고 임계값
const MANUAL_COMPACT_BUFFER_TOKENS = 3_000        // 차단 시 남은 여유
const MAX_CONSECUTIVE_AUTOCOMPACT_FAILURES = 3    // 압축 실패 회로 차단

// BQ 2026-03-10 데이터: 1,279 세션에서 50+ 연속 실패 (최대 3,272회)
// → 일일 약 250K API 호출 낭비
```

Claude Code의 비용 구조:

```
턴 1: 시스템 프롬프트 (X 토큰) + 사용자 메시지 → 총 X+α
턴 2: X + 턴 1 전체 + 사용자 메시지 → 총 X+2α
턴 3: X + 턴 1~2 전체 + 사용자 메시지 → 총 X+3α
...
턴 N: X + 턴 1~(N-1) 전체 → O(N²) 증가
→ 압축으로 O(N) 근사 시도, 하지만 정보 손실 불가피
```

### AutoBE: 파이프라인 단위 고정 비용

```
Analyze Phase: 시스템 프롬프트 + 사용자 요구사항 → 고정
Database Phase: 시스템 프롬프트 + 분석 결과 요약 → 고정
Interface Phase: 시스템 프롬프트 + DB 스키마 + 분석 → 고정 (× N 오퍼레이션, 캐시)
Test Phase: 시스템 프롬프트 + 인터페이스 + DB → 고정 (× N 테스트, 캐시)
Realize Phase: 시스템 프롬프트 + 모든 이전 단계 → 고정 (× N 구현, 캐시)

총 비용 = Σ(단계별 고정 비용 × 작업 수)
→ O(N) — 대화 길이와 무관
```

executeCachedBatch가 이 구조를 극대화한다:

```
40개 API 엔드포인트 구현 시:
  캐시 없이: 40 × 10K 토큰 = 400K 토큰 (전액 과금)
  캐시 포함: 10K + 39 × (10K × 10% + 1K) = 49.1K 토큰 실효 비용
  절감률: ~88%
```

---

## 24. 안전성 모델: 6중 방어 vs 컴파일러 게이트

이 비교가 두 프로젝트의 **존재 이유 차이**를 가장 명확히 드러낸다.

### Claude Code: "사용자의 컴퓨터를 지키는" 6중 방어

Claude Code는 **사용자의 시스템에서 직접 명령을 실행**하기 때문에, 안전성이 곧 "파괴적 명령으로부터 사용자를 보호하는 것"이다:

```
┌─ Layer 1: Semantic Command Analysis (bashClassifier) ────────────────┐
│  Bash 명령의 의미론적 분석 — 트리시터 AST 파싱으로 구문 분석           │
│  셸 인젝션, 출력 리디렉션, heredoc 치환 탐지                          │
│  MAX_SUBCOMMANDS_FOR_SECURITY_CHECK = 50 (ReDoS 방지)                │
├─ Layer 2: Transcript Classifier (yoloClassifier) ────────────────────┤
│  전체 대화 히스토리를 LLM에 보내 맥락적 안전성 판단                    │
│  2단계 분류: fast → thinking (XML 기반)                               │
│  3회 연속 거부 → 사용자에게 직접 물음 (DENIAL_LIMITS.maxConsecutive=3) │
├─ Layer 3: OS-Level Sandboxing ───────────────────────────────────────┤
│  macOS: seatbelt (네이티브)                                          │
│  Linux: bubblewrap (bwrap) + socat + seccomp                         │
│  네트워크: allowedDomains/deniedDomains, HTTP/SOCKS 프록시            │
│  파일시스템: allowWrite/denyWrite/allowRead/denyRead                  │
├─ Layer 4: Permission Rules (8종 소스) ───────────────────────────────┤
│  userSettings, projectSettings, localSettings, flagSettings,         │
│  policySettings, cliArg, command, session                            │
│  패턴 매칭: Bash(git:*), Edit(/src/**), Read(/tmp/*)                 │
├─ Layer 5: Destructive Pattern Detection ─────────────────────────────┤
│  DANGEROUS_BASH_PATTERNS: python, node, ssh, sudo, eval, exec...     │
│  CROSS_PLATFORM_CODE_EXEC: 15+ 언어 인터프리터                       │
│  git bare-repo 파일 스크러빙 (core.fsmonitor 탈출 방지)              │
├─ Layer 6: Tool Result Budget ────────────────────────────────────────┤
│  DEFAULT_MAX_RESULT_SIZE_CHARS = 50,000                              │
│  MAX_TOOL_RESULT_TOKENS = 100,000                                    │
│  MAX_TOOL_RESULTS_PER_MESSAGE_CHARS = 200,000                        │
│  초과 시 디스크 저장 → <persisted-output> 태그로 참조                 │
└──────────────────────────────────────────────────────────────────────┘
```

위험한 명령 패턴의 실제 정의:

```typescript
// src/utils/permissions/dangerousPatterns.ts
export const DANGEROUS_BASH_PATTERNS = [
  'python', 'python3', 'node', 'deno', 'tsx',
  'ruby', 'perl', 'php', 'lua',
  'npx', 'bunx', 'npm run', 'yarn run', 'pnpm run', 'bun run',
  'bash', 'sh', 'zsh', 'fish',
  'eval', 'exec', 'env', 'xargs', 'sudo', 'ssh',
  'curl', 'wget', 'git', 'kubectl', 'aws', 'gcloud',
]

// 권한 규칙의 위험성 판단
export function isDangerousBashPermission(toolName, ruleContent): boolean {
  // "Bash" (내용 없음) → 모든 명령 허용 → 위험!
  if (ruleContent === undefined || ruleContent === '') return true;
  // "*" → 와일드카드 → 위험!
  if (content === '*') return true;
  // "python:*", "python*", "python *" → 위험!
  for (const pattern of DANGEROUS_BASH_PATTERNS) { ... }
}
```

샌드박스 설정의 깊이:

```typescript
// src/entrypoints/sandboxTypes.ts
SandboxSettings = {
  network: {
    allowedDomains: string[],      // 접근 가능 도메인
    deniedDomains: string[],       // 차단 도메인
    allowManagedDomainsOnly: bool, // 정책 강제
    allowUnixSockets: string[],    // macOS 소켓
    httpProxyPort: number,         // HTTP 프록시
    socksProxyPort: number,        // SOCKS 프록시
  },
  filesystem: {
    allowWrite: string[],          // 쓰기 허용 경로
    denyWrite: string[],           // 쓰기 차단 경로
    denyRead: string[],            // 읽기 차단 경로
    allowManagedReadPathsOnly: bool,
  },
  // .claude/settings.json, .claude/skills/ → 항상 쓰기 금지
  // git bare-repo 파일 → 실행 후 자동 삭제 (fsmonitor 탈출 방지)
}
```

### AutoBE: "생성물이 올바른지 보증하는" 컴파일러 게이트

AutoBE는 사용자의 시스템에서 명령을 실행하지 않는다. 위험은 **잘못된 코드가 생성되는 것**이다. 따라서 안전성은 곧 **정합성 보증**이다:

```
┌─ Gate 1: 스키마 검증 (Typia 런타임) ────────────────────────────────┐
│  LLM의 Function Calling 출력이 TypeScript 인터페이스에 맞는지 검증    │
│  인라인 에러 마커로 정확한 위치 피드백                                │
│  VALIDATION_RETRY = 3                                                │
├─ Gate 2: Prisma Database Compiler ──────────────────────────────────┤
│  파일/모델/필드 중복, snake_case, FK 무결성, 순환참조, 예약어         │
│  교육적 에러 메시지 (What happened? Why? How to fix?)                │
│  DATABASE_CORRECT_RETRY = 30                                         │
├─ Gate 3: OpenAPI Interface Compiler ────────────────────────────────┤
│  스펙 유효성, 스키마 참조, Prisma 교차 검증                          │
│  NestJS 코드 생성 + Prettier 포맷팅                                  │
│  COMPILER_RETRY = 4                                                  │
├─ Gate 4: TypeScript Compiler (strict) ──────────────────────────────┤
│  noImplicitAny, strictNullChecks, strictFunctionTypes               │
│  증분 컴파일 (이전 Program 재사용 → 15배 향상)                       │
│  ESLint no-floating-promises                                         │
└──────────────────────────────────────────────────────────────────────┘
```

### 비교: 근본적으로 다른 위협 모델

| 측면 | Claude Code | AutoBE |
|------|-------------|--------|
| **위협** | LLM이 사용자 시스템을 파괴 | LLM이 잘못된 코드를 생성 |
| **보호 대상** | 파일시스템, 네트워크, 프로세스 | 코드 정합성, 타입 안전성 |
| **방어 계층** | 6중 (분류기→샌드박스→권한→패턴) | 4중 (스키마→Prisma→OpenAPI→TS) |
| **ML 사용** | 2종 분류기 (bash + yolo) | 없음 (결정론적 컴파일러) |
| **OS 통합** | seatbelt, bwrap, seccomp | 없음 (순수 코드 분석) |
| **false positive** | 가능 (안전한 명령 차단) | 없음 (컴파일 성공/실패만 존재) |
| **자가 치유** | 없음 (사용자에게 물음) | 있음 (진단 피드백 → 재생성) |
| **복잡도** | ~100KB 보안 로직 | ~50KB 컴파일러 로직 |

**근본적 통찰**: Claude Code는 "올바르지 않은 행동을 **사전에 차단**"하고, AutoBE는 "올바르지 않은 결과를 **사후에 교정**"한다. 전자는 **예방**, 후자는 **치유**다. 이 차이는 두 프로젝트의 실행 모델 차이에서 필연적으로 나온다—실시간 명령 실행 vs 오프라인 코드 생성.

---

## 25. History Transformer 해부: 57개 트랜스포머의 정밀한 세계

AutoBE의 History Transformer 시스템은 보고서에서 이미 여러 번 언급되었지만, 그 규모와 정교함은 별도의 단원을 할애할 만하다.

### 57개 트랜스포머 전체 인벤토리

| 단계 | 트랜스포머 수 | 핵심 역할 |
|------|-------------|----------|
| Analyze | 8 | 요구사항 분석: 시나리오, 섹션, 유닛, 크로스파일 리뷰, 결정 추출 |
| Common | 3 | **RAG 엔진** (Preliminary), 캐스팅 교정, 에러 요약(P2-3) |
| Database | 9 | 그룹핑, 컴포넌트, 스키마 생성, 인가, 교정, 리뷰 |
| Interface | 16 | 엔드포인트, 오퍼레이션, 스키마 설계/캐스팅/리파인/리네임/보완/리뷰, 전제조건 |
| Test | 8 | 시나리오, 준비, 생성, 오퍼레이션별 테스트, 교정 |
| Realize | 13 | 콜렉터(plan/write/correct), 트랜스포머(plan/write/correct), 인가, 오퍼레이션 |
| **합계** | **57** | |

이것을 Claude Code와 비교하면:

```
Claude Code: 1개의 시스템 프롬프트 조립 함수 (prompts.ts)
  → DYNAMIC_BOUNDARY로 캐시 가능/불가능 구간 분리
  → 모든 도구 호출에 동일한 컨텍스트 적용

AutoBE: 57개의 History Transformer
  → 각 트랜스포머가 해당 작업에 최적화된 컨텍스트 조립
  → 같은 데이터도 다른 형태로 가공하여 제공
```

### P2-3 에러 요약 패턴: 컨텍스트 블로트 방지

컴파일러 교정 루프에서 반복 실패 시, 오래된 에러를 요약하여 컨텍스트가 폭발하지 않게 한다:

```typescript
// transformPreviousAndLatestCorrectHistory.ts
function summarizeFailures(array: FailureEntry[]): FailureEntry[] {
  if (array.length <= 2) return array;  // 2개 이하면 전부 유지

  const olderCount = array.length - 2;
  const olderDiagCount = array.slice(0, -2)
    .reduce((sum, entry) => sum + entry.diagnostics.length, 0);

  // 오래된 실패들을 한 줄로 압축
  const summary = {
    script: "",  // 코드 없음 (토큰 절약)
    diagnostics: [{
      messageText: `[Summary of ${olderCount} previous correction attempts
                     with ${olderDiagCount} total errors...]`
    }]
  };

  return [summary, ...array.slice(-2)];  // 요약 + 최근 2개만 전체 보존
}
```

이것은 Claude Code의 autocompact와 **같은 문제를 다른 방식으로 해결**한다:

```
Claude Code autocompact:
  전체 대화를 LLM에게 요약 시킴 → 정보 손실 불가피
  MAX_CONSECUTIVE_AUTOCOMPACT_FAILURES = 3 → 회로 차단

AutoBE P2-3:
  구조화된 에러 데이터를 규칙적으로 요약 → 정보 손실 최소화
  최근 2개는 항상 전체 보존 → LLM이 최신 에러를 정확히 파악
```

### 컨텍스트 조립의 3계층 구조

모든 57개 트랜스포머가 동일한 3계층 패턴을 따른다:

```typescript
// 보편적 패턴 (모든 트랜스포머에서 반복)
return {
  histories: [
    // Layer 1: 시스템 프롬프트 (캐시 대상)
    { type: "systemMessage",
      text: AutoBeSystemPromptConstant.SPECIFIC_PROMPT,
      _cache: { type: "ephemeral" } },

    // Layer 2: RAG 데이터 (Preliminary, 캐시 대상)
    ...props.preliminary.getHistories(),

    // Layer 3: 작업별 지시 (캐시 미스)
    { type: "assistantMessage",
      text: formatSpecificInstruction(props) },
  ],
  userMessage: "Execute the task.",
};
```

**Layer 2의 LOADED/AVAILABLE 구조**가 특히 중요하다:

```typescript
// transformPreliminaryHistory.ts — RAG 데이터 포맷
// LOADED: LLM에게 이미 제공된 데이터 (전체 JSON)
[AssistantMessage] = {
  prompt: "## LOADED Database Schemas",
  content: toJsonBlock(loadedSchemas),  // 완전한 스키마 정의
}

// AVAILABLE: 아직 제공되지 않은 데이터 (인덱스만)
[SystemMessage] = {
  prompt: "## AVAILABLE Database Schemas",
  available: "| name | fields | relations |\n|------|--------|-----------|",
  loaded: "- user\n- order\n- product",
  exhausted: newbie.length === 0 ? "ALL LOADED — no more available" : "",
}
```

LLM은 AVAILABLE 테이블을 보고 "user_address 스키마가 필요하다"고 판단하면 `getDatabaseSchemas`를 호출한다. 전체 데이터가 아닌 **인덱스(이름, 필드 수, 관계 수)**만 보여주므로 토큰을 절약하면서도 LLM이 무엇이 필요한지 판단할 수 있다.

### 의존성 자동 보완

Preliminary 컨트롤러는 로딩된 데이터의 `$ref` 참조를 추적하여 의존성을 자동으로 해결한다:

```typescript
// complementPreliminaryCollection.ts
for (const dto of Object.values(props.local.interfaceSchemas)) {
  OpenApiTypeChecker.visit({
    schema: dto,
    closure: (next) => {
      if (OpenApiTypeChecker.isReference(next)) {
        const refName = next.$ref.split("/").pop()!;
        if (!loaded.has(refName)) {
          // $ref로 참조된 스키마가 아직 로딩 안 됐으면 자동 추가
          const full = props.all.interfaceSchemas[refName];
          if (full) props.local.interfaceSchemas[refName] = full;
        }
      }
    },
  });
}
```

LLM이 `IShoppingSale` 스키마를 요청하면, 그 안에 `$ref: "#/components/schemas/IShoppingSaleSnapshot"`이 있다면 `IShoppingSaleSnapshot`도 **자동으로 함께 로딩**된다. LLM이 의존성을 직접 추적할 필요가 없다.

### 비교: 단일 프롬프트 vs 57-way 분기

| 측면 | Claude Code | AutoBE |
|------|-------------|--------|
| 컨텍스트 조립 함수 | 1개 (prompts.ts) | 57개 (단계×역할별) |
| 데이터 형태 | 모든 도구에 동일 | 역할에 맞게 변환 |
| RAG | 정적 (CLAUDE.md) | 동적 (LOADED/AVAILABLE + 자동 보완) |
| 에러 히스토리 | 압축 (정보 손실) | P2-3 요약 (최근 2개 보존) |
| 의존성 해결 | 없음 | $ref 자동 보완 |
| 개발 비용 | 낮음 (1개 유지보수) | 높음 (57개 유지보수) |
| 토큰 효율 | 보통 (범용) | 극한 (180KB→8KB, 95% 감소) |

---

## 25. 관측성: 64종 Datadog 이벤트 vs 69종 타입 안전 이벤트

두 프로젝트 모두 내부 동작을 추적하는 관측성(Observability) 시스템을 갖추고 있다. 하지만 설계 철학은 정반대다.

### Claude Code: 다중 싱크의 텔레메트리 파이프라인

Claude Code는 **프로덕션 SaaS 수준**의 관측 인프라를 갖추고 있다:

```typescript
// src/services/analytics/index.ts — 메인 분석 API
logEvent()      // 동기 이벤트 로깅
logEventAsync() // 비동기 이벤트 로깅
// 싱크 연결 전 이벤트는 큐에 보관

// src/services/analytics/datadog.ts — Datadog HTTP Intake
// 64종 이상의 이벤트 타입 허용 목록:
// tengu_api_error, tengu_oauth_success, tengu_tool_use_success,
// tengu_session_file_read, tengu_compact_failed, tengu_exit...
// 배치: 최대 100개/배치, 15초 플러시 간격
// 카디널리티 감소: 모델명 정규화, MCP 도구명 → "mcp", 사용자 30-버킷 해싱
```

**4중 싱크 아키텍처**:

```
이벤트 발생
  ├→ Datadog HTTP Intake (배치 100개, 15초 플러시)
  ├→ 1st Party Event Logger (배치 200개, 10초 스케줄)
  │   └→ 실패 시 ~/.claude/telemetry/ JSONL 저장 + 이차 백오프 재시도
  ├→ OpenTelemetry (메트릭 + 로그 + 트레이스)
  │   ├→ OTLP (gRPC/HTTP)
  │   ├→ BigQuery (5분 간격, 1P API 고객만)
  │   └→ Perfetto (타임라인 시각화)
  └→ 인메모리 에러 로그 (최근 100개 순환 버퍼)
```

**OpenTelemetry Span 계층**:

```
interaction (사용자 요청 → Claude 응답)
  ├── llm_request (API 호출)
  │   └── attempt (재시도 스팬)
  ├── tool (도구 실행)
  │   ├── tool.blocked_on_user (권한 대기)
  │   └── tool.execution (실제 실행)
  └── hook (훅 실행)
```

**메타데이터 풍부화** (`metadata.ts`):

```typescript
// 모든 이벤트에 포함되는 컨텍스트:
{
  session_id, model, user_type, betas,
  platform, arch, node_version, terminal,
  package_managers: ["npm", "pnpm", ...],
  runtimes: ["node", "bun", ...],
  process_uptime, memory_rss, cpu_usage,
  git_repo_remote_hash,   // SHA256 첫 16자 (익명화)
  subscription_tier, agent_identification,

  // PII 보호:
  _PROTO_*: "특권 BQ 컬럼 (Datadog에서는 제거)",
  tool_name: "extractMcpToolDetails()로 정화",
  tool_input: "512자 → 128자 + 메타데이터로 절단",
}
```

### AutoBE: 69종 타입 안전 이벤트 시스템

AutoBE의 관측성은 **타입 시스템에 의해 보증**된다:

```typescript
// packages/interface/src/events/AutoBeEvent.ts (lines 93-171)
// 69종 이벤트의 판별 유니언 타입
export type AutoBeEvent =
  | AutoBeAssistantMessageEvent    // 메시지 (7종)
  | AutoBeUserMessageEvent
  | AutoBeVendorRequestEvent       // AI 벤더 요청/응답/타임아웃
  | AutoBeVendorResponseEvent
  | AutoBeVendorTimeoutEvent
  | AutoBeImageDescribeStartEvent  // 이미지 (3종)
  | AutoBeAnalyzeStartEvent        // 분석 (8종)
  | AutoBeAnalyzeScenarioEvent
  | AutoBeDatabaseStartEvent       // 데이터베이스 (12종)
  | AutoBeDatabaseComponentEvent
  | AutoBeDatabaseValidateEvent
  | AutoBeInterfaceStartEvent      // 인터페이스 (14종)
  | AutoBeInterfaceSchemaRefineEvent
  | AutoBeTestStartEvent           // 테스트 (7종)
  | AutoBeRealizeStartEvent        // 실현 (18종)
  | AutoBeRealizeWriteEvent
  | AutoBeRealizeValidateEvent
  // ... 총 69종

// 타입 안전 매퍼: 컴파일 타임에 모든 이벤트 커버리지 보증
export namespace AutoBeEvent {
  export type Mapper = {
    [E in AutoBeEvent as E["type"]]: E;
  };
}
```

**이벤트 합성 패턴** — 5개 기본 타입의 조합:

```typescript
// 기본 이벤트
interface AutoBeEventBase<Type> {
  id: string;                    // UUID v7
  type: Type;                    // 판별자
  created_at: string;            // ISO 8601
}

// 진행률 추적
interface AutoBeProgressEventBase {
  total: number;
  completed: number;
}

// 집계 메트릭
interface AutoBeAggregateEventBase {
  tokenUsage: IAutoBeTokenUsageJson.IComponent;
  metric: AutoBeFunctionCallingMetric;
}

// RAG 획득 추적
interface AutoBeAcquisitionEventBase<Kind> {
  acquisition: Pick<AutoBePreliminaryAcquisition, Kind>;
}

// 완료 이벤트
interface AutoBeCompleteEventBase<Type> {
  step: number;
  elapsed: number;               // 밀리초
  aggregates: AutoBeProcessAggregateCollection;
}

// 실제 이벤트는 이들의 조합:
interface AutoBeDatabaseComponentEvent extends
  AutoBeEventBase<"databaseComponent">,
  AutoBeAggregateEventBase,
  AutoBeProgressEventBase,
  AutoBeAcquisitionEventBase<"analysisSections" | "previousDatabaseSchemas"> {
  analysis: string;
  component: AutoBeDatabaseComponent;
  step: number;
}
```

**자동 RPC 전달** — 한 줄로 69종 이벤트를 WebSocket에 브릿지:

```typescript
// packages/rpc/src/AutoBeRpcService.ts (lines 53-62)
for (const key of typia.misc.literals<keyof IAutoBeRpcListener>()) {
  if (key === "enable") continue;
  agent.on(key, (event) => {
    listener[key]!(event as any).catch(() => {});
  });
}
// typia.misc.literals가 컴파일 타임에 모든 이벤트 키를 추출
// 새 이벤트 타입 추가 시 RPC 코드 변경 불필요!
```

### 근본적 차이

```
Claude Code 텔레메트리:
  목적: 제품 분석 + 장애 탐지 + 비용 추적
  싱크: Datadog + 1P + OTel + 인메모리
  안전성: PII 제거, 해시 익명화, 킬스위치
  런타임: 동적 (GrowthBook 샘플링)
  변경 비용: 중 (수동 허용 목록 추가)

AutoBE 이벤트:
  목적: 파이프라인 진행률 + 상태 재구성 + UI 갱신
  싱크: WebSocket RPC (자동 전달)
  안전성: 타입 시스템이 보증 (판별 유니언)
  런타임: 정적 (컴파일 타임 결정)
  변경 비용: 저 (타입 추가 → 자동 전파)
```

| 측면 | Claude Code | AutoBE |
|------|-------------|--------|
| 이벤트 수 | 64+ (Datadog 허용 목록) | 69 (판별 유니언) |
| 타입 안전성 | 문자열 기반 | 컴파일 타임 보증 |
| 싱크 수 | 4 (DD + 1P + OTel + 메모리) | 1 (WebSocket RPC) |
| PII 보호 | 해시 + 절단 + 정화 | 해당 없음 (서버 사이드) |
| 프라이버시 레벨 | 3단계 (no-telemetry/essential/full) | 없음 (자체 서버) |
| 상태 재구성 | 불가능 | 이벤트 히스토리에서 재구성 |
| 비용 추적 | 실시간 USD 계산 | 토큰 사용량 집계 |
| 새 이벤트 추가 비용 | 중 (수동 등록) | 저 (타입 추가만) |

두 시스템의 차이는 **제품 형태의 차이**에서 비롯된다. Claude Code는 수백만 사용자의 SaaS이므로 프라이버시, 샘플링, 킬스위치가 필수다. AutoBE는 자체 서버에서 구동되므로 모든 이벤트를 타입 안전하게 실시간 전달할 수 있다.

---

## 26. 메시지 정규화: 5,800줄의 변환 파이프라인 vs 57개 History Transformer

LLM에게 보내는 메시지를 어떻게 준비하는가? 이 질문에 대한 두 프로젝트의 답은 극적으로 다르다.

### Claude Code: 2단계 정규화 파이프라인

Claude Code의 `messages.ts`는 **5,800줄**이 넘는다. 이 파일 하나가 모든 메시지 변환을 담당한다:

```typescript
// src/utils/messages.ts

// 1단계: normalizeMessages() (lines 731-823)
// 다중 콘텐츠 블록을 분리, UUID 생성
function normalizeMessages(messages: Message[]): Message[] {
  // 하나의 메시지에 text + tool_use가 섞여있으면 분리
  // deriveUUID(baseUUID, index)로 결정적 UUID 생성
  // 이미지 붙여넣기 ID 보존
}

// 2단계: normalizeMessagesForAPI() (lines 1989-2288)
// API 전송 직전의 최종 변환
function normalizeMessagesForAPI(messages: Message[]): Message[] {
  // 가상 메시지(display-only) 필터링
  // 첨부파일을 tool_result 앞으로 재배치
  // 연속 user 메시지 병합 (Bedrock 요구사항)
  // tool_reference 블록 제거 (tool search 비활성 시)
  // 도구 입력 정규화
  // 같은 ID의 assistant 메시지 병합
  // PDF/이미지 에러 블록 제거
  // "Tool loaded." 경계 주입
}
```

**특수 처리들**:

```typescript
// 연속 user 메시지 병합 (lines 2411-2449)
function mergeUserMessages(a: UserMessage, b: UserMessage) {
  // non-meta 메시지 UUID 보존 (안정적인 [id:] 태그)
  // tool_result 블록은 콘텐츠 맨 앞으로
  // 텍스트는 \n으로 이음
}

// 고아 도구 호출 정리 (lines 2795-2841)
function filterUnresolvedToolUses(messages: Message[]) {
  // tool_use ID와 매칭되는 tool_result가 없으면 제거
  // 세션 resume 시 발생하는 불일치 복구
}

// 도구 결과 쌍 보장 (lines 5133-5350)
function ensureToolResultPairing(messages: Message[]) {
  // 중복 tool_use 제거 (메시지 간 중복)
  // 고아 서버 tool_use 제거
  // 고아 tool_result 제거
  // 빈 콘텐츠에 플레이스홀더 삽입
}
```

**합성 메시지 종류** (11종):

```typescript
// lines 310-319
const SYNTHETIC_MESSAGES = new Set([
  INTERRUPT_MESSAGE,              // 사용자 취소
  INTERRUPT_MESSAGE_FOR_TOOL_USE, // 도구 사용 중 취소
  CANCEL_MESSAGE,                 // 거부
  REJECT_MESSAGE,                 // 도구 사용 거부
  NO_RESPONSE_REQUESTED,          // 응답 불필요
]);

// + 추가 합성 메시지:
createAssistantMessage()           // model="<synthetic>"
createUserInterruptionMessage()    // 중단 마커
createSyntheticUserCaveatMessage() // 로컬 명령 경고
```

**시스템 프롬프트 조립** — 6단계 우선순위:

```typescript
// src/utils/systemPrompt.ts (lines 41-123)
function buildEffectiveSystemPrompt() {
  // 우선순위 (높은 → 낮은):
  // 1. Override (Loop 모드가 전체 교체)
  // 2. Coordinator 모드 프롬프트
  // 3. Agent 시스템 프롬프트 (proactive: 추가, 아니면: 교체)
  // 4. Custom (--system-prompt 플래그)
  // 5. Default (표준 Claude Code)
  // 6. Append (항상 추가)
}
```

### AutoBE: 57개 History Transformer

AutoBE는 5,800줄 파일 대신 **57개의 작은 트랜스포머 함수**를 사용한다:

```typescript
// 모든 트랜스포머의 공통 패턴:
export const transformXxxHistory = (
  ctx: AutoBeContext,
  preliminary: AutoBePreliminaryController<Kind>,
  feedback?: string,
): IAutoBeOrchestrateHistory => ({
  histories: [
    // Layer 1: 시스템 프롬프트 (캐시 히트)
    { type: "systemMessage",
      text: AutoBeSystemPromptConstant.SPECIFIC_PROMPT,
      _cache: { type: "ephemeral" } },

    // Layer 2: RAG 데이터 (Preliminary)
    ...preliminary.getHistories(),

    // Layer 3: 작업별 지시
    { type: "assistantMessage",
      text: formatSpecificInstruction(props) },
  ],
  userMessage: "Execute the task.",
});
```

각 트랜스포머는 **해당 에이전트가 필요한 정보만** 정확히 조립한다:

```
transformDatabaseComponentHistory:
  → 분석 결과 + 관련 DB 스키마 + 컴포넌트 정보

transformInterfaceSchemaRefineHistory:
  → DB 스키마 + 기존 DTO + 오퍼레이션 명세 + 이전 리파인 결과

transformRealizeOperationWriteHistory:
  → 오퍼레이션 + 콜렉터 + 트랜스포머 + 인가 + 시나리오
```

### 핵심 차이: 범용 파이프라인 vs 전문 조립

```
Claude Code:
  모든 메시지 → normalizeMessages() → normalizeMessagesForAPI()
  5,800줄 단일 파일, 모든 도구에 동일한 컨텍스트
  V8 sliced-string 참조 해제까지 처리하는 메모리 최적화
  MAX_LINES_PER_FILE = 400 (GitHub 한계와 동기화)

AutoBE:
  각 에이전트 → 전용 트랜스포머 → 최적화된 컨텍스트
  57개 소형 함수, 각각 100줄 미만
  같은 데이터도 역할에 따라 다른 형태로 제공
  180KB → 8KB (95% 토큰 절감)
```

| 측면 | Claude Code | AutoBE |
|------|-------------|--------|
| 메시지 변환 코드 | 5,800줄 / 1파일 | ~5,700줄 / 57파일 |
| 변환 단계 | 2단계 (normalize → normalizeForAPI) | 1단계 (트랜스포머) |
| 병합 로직 | 연속 user/assistant 메시지 병합 | 불필요 (매번 새 대화) |
| 고아 처리 | tool_use/tool_result 쌍 정리 | 불필요 (구조적 보장) |
| 합성 메시지 | 11종 (중단, 취소, 거부...) | 없음 |
| V8 메모리 최적화 | `'' + line` 강제 문자열 평탄화 | 불필요 (단발성) |
| API 호환성 | Bedrock/1P/Vertex 분기 | 단일 벤더 인터페이스 |

코드량은 비슷하지만(**~5,800줄**), 분산 방식이 다르다. Claude Code는 **하나의 만능 파이프라인**이고, AutoBE는 **57개의 전문 조립 라인**이다. 이는 각각의 아키텍처에 최적화된 선택이다: 대화형 에이전트는 모든 상황을 하나의 파이프라인으로 처리해야 하고, 파이프라인 시스템은 각 단계에 최적화된 컨텍스트를 제공해야 한다.

---

## 27. 컴파일러 내부: 874줄 검증기의 세계

AutoBE의 3층 컴파일러 체인은 이 프로젝트의 **핵심 경쟁력**이다. Claude Code에는 대응하는 시스템이 없다. 이 단원에서는 컴파일러 내부를 해부한다.

### 1층: Prisma 데이터베이스 컴파일러

```typescript
// packages/compiler/src/database/AutoBeDatabaseCompiler.ts (lines 13-48)
class AutoBeDatabaseCompiler {
  // AST → Prisma 파일 변환
  writePrismaSchemas(app: AutoBeDatabase.IApplication): Record<string, string>

  // Prisma 파일 → Client SDK 컴파일
  compilePrismaSchemas(schemas: Record<string, string>):
    | ISuccess  // schemas + Client SDK + 문서 + ERD
    | IFailure  // 에러 메시지
    | IException // 원시 에러

  // 의미론적 검증 (874줄)
  validate(app): IAutoBeDatabaseValidation[]
}
```

**874줄 검증기의 세계** (`validateDatabaseApplication.ts`):

```typescript
// 7가지 카테고리의 검증:

// 1. 중복 파일명 (lines 67-101)
// 2. 파일 간 중복 모델명 (lines 103-143)
// 3. 모델 내 중복 필드명 (lines 145-233)
// 4. 중복 인덱스 (lines 235-433)
// 5. 중복 관계 반대명 (lines 435-553)
// 6. 유효한 식별자명 (lines 558-634)
// 7. 인덱스 필드 존재성 + 타입 호환성 (lines 636-789)
// 8. 외래키 참조 + 순환 의존성 (lines 791-873)
```

**에러 메시지 형식** — AI가 이해하기 쉬운 구조:

```typescript
// 에러 예시 (lines 197-229)
{
  path: "application.files[0].models[1]",
  table: "shopping_sales",
  field: "seller_id",
  message: `
    **What happened?**
    Duplicate field name "seller_id" found in model "shopping_sales".

    **Why is this a problem?**
    Prisma requires all field names within a model to be unique...

    **How to fix this:**
    Rename one of the duplicate fields. For example:
    - "seller_id" → "primary_seller_id"
    - Or remove the duplicate if it's unintentional
  `
}
```

이 형식은 **사람이 읽기 위한 것이 아니다**. AI 교정 에이전트가 읽고, 정확히 어디를 어떻게 고쳐야 하는지 파악하기 위한 것이다.

### 2층: OpenAPI 인터페이스 컴파일러

```typescript
// packages/compiler/src/interface/AutoBeInterfaceCompiler.ts (lines 33-66)
class AutoBeInterfaceCompiler {
  // AutoBE AST → 표준 OpenAPI v3.1 변환
  transform(doc: AutoBeOpenApi.IDocument): OpenApi.IDocument

  // 표준 OpenAPI v3.1 → AutoBE AST 역변환
  invert(doc: OpenApi.IDocument): AutoBeOpenApi.IDocument

  // AutoBE AST → 전체 NestJS 프로젝트 생성
  async write(doc: AutoBeOpenApi.IDocument): Promise<Record<string, string>>
  // 생성 옵션:
  //   keyword: true     → AI 친화적 키워드 파라미터
  //   simulate: true    → 목업 서버 포함
  //   e2e: true         → E2E 테스트 스캐폴드
  //   → Prettier 포맷팅: JSDoc + import 정렬
}
```

### 3층: TypeScript 컴파일러

```typescript
// packages/compiler/src/AutoBeTypeScriptCompiler.ts (lines 42-136)
const compiler = new EmbedEsLint({
  external: NestJSExternal,        // node_modules 의존성
  compilerOptions: {
    target: ts.ScriptTarget.ESNext,
    module: ts.ModuleKind.CommonJS,
    paths: {
      [alias]: ["./src/api"],
      ["@prisma/sdk"]: ["./src/prisma/client.ts"]
    },
    strict: true,
    experimentalDecorators: true,
    emitDecoratorMetadata: true,
  },
  // 핵심: 2개의 커스텀 트랜스포머
  transformers: (program, diagnostics) => ({
    before: [
      typiaTransform(program, {}, { addDiagnostic }),    // 런타임 검증 코드
      nestiaCoreTransform(program, {}, { addDiagnostic }) // NestJS 데코레이터
    ]
  })
});

// ESLint 규칙: 비동기 누락 감지
rules: { "no-floating-promises": "error" }
```

**진단 구조**:

```typescript
interface IDiagnostic {
  file: string | null;           // 소스 파일 경로
  category: "error" | "warning" | "suggestion" | "message";
  code: number | string;         // TypeScript 에러 코드 (예: 2339)
  start: number | null;          // 파일 내 문자 위치
  length: number | null;         // 텍스트 스팬 길이
  messageText: string;           // 사람/AI 읽기용 설명
}
```

### TS2339 특수 힌트 생성

TypeScript에서 가장 빈번한 에러는 TS2339 ("Property 'X' does not exist on type 'Y'")다. AutoBE는 이 에러를 **특수 분석**한다:

```typescript
// packages/agent/src/orchestrate/realize/utils/generateTS2339Hints.ts
// TS2339: Property 'X' does not exist on type 'Y'
// 패턴 매칭 → 수정 제안 자동 생성:

// 스칼라 필드 → fieldName: true
// 관계 + 트랜스포머 → relation: TransformerName.select()
// 집계 카운트 → _count: { select: { relation: true } }
```

```typescript
// packages/agent/src/orchestrate/realize/utils/printErrorHints.ts
// 에러 위치를 코드에 인라인 주석으로 삽입:

// hint #1:
// ```typescript
// const result = props.customer.membership  // error: TS2339 - Property
//                                           // 'membership' does not exist
//                                           // on type 'CustomerPayload'
// ```
```

### 컴파일러 피드백 루프의 실제

```typescript
// 교정 루프 예시 (orchestratePrismaCorrect.ts)
for (let i = 0; i < AutoBeConfigConstant.DATABASE_CORRECT_RETRY; i++) {
  // 1. 검증 실행
  const result = await compiler.database.validate(application);
  if (result.length === 0) break;  // 성공!

  // 2. 에러를 테이블별로 그룹핑
  const errorsByTable = groupBy(result, e => e.table);

  // 3. 테이블별 배치 교정 (최대 8개 동시)
  await executeCachedBatch(ctx, tables.map(table => async () => {
    // AI에게 해당 테이블의 에러만 제공
    const corrected = await correctTable(ctx, table, errorsByTable[table]);
    return corrected;
  }));

  // 4. 교정 결과로 application 갱신
  application = mergeCorrections(application, corrections);
  // → 다시 루프 처음으로
}
```

**TypeScript 교정은 더 정교하다**:

```typescript
// orchestrateRealizeCorrectCasting.ts (445줄)
for (let i = 0; i < AutoBeConfigConstant.COMPILER_RETRY; i++) {
  // 1. 전체 컴파일
  const compiled = await compileRealizeFiles(ctx, { functions, ... });

  // 2. 파일별 진단 추출 + 함수별 그룹핑
  const errorsByFunction = groupDiagnosticsByFunction(compiled.diagnostics);

  // 3. 병렬 교정 (executeCachedBatch, 세마포어 8)
  const corrected = await executeCachedBatch(ctx,
    failedFunctions.map(func => async () => {
      // 각 함수에게 제공하는 것:
      // - 함수 템플릿
      // - 이전 실패 히스토리 (P2-3 요약)
      // - 현재 진단
      // - TS2339 힌트 (있으면)
      return await correctFunction(ctx, func, errors);
    })
  );

  // 4. 성공/실패/무시 분리
  const { success, failed, ignored } = separateResults(corrected);

  // 5. 실패한 함수만으로 재귀적 재시도
  if (failed.length === 0) break;
  functions = [...success, ...failed];
}
```

### Claude Code와의 비교: 컴파일러가 없다

Claude Code에는 **컴파일러 피드백 루프가 없다**. LSP 진단을 읽을 수는 있지만, 자동으로 교정하는 루프는 구현되어 있지 않다:

```
Claude Code:
  LLM이 코드 작성 → 사용자가 확인 → 에러 발견 시 사용자가 재요청
  "이 파일의 타입 에러를 고쳐줘" → LLM이 다시 시도
  반복 횟수: 사용자 인내심에 의존

AutoBE:
  LLM이 코드 작성 → 3층 컴파일러 자동 검증
  → 에러 발견 시 AI 교정 에이전트 자동 투입
  → 성공/실패 분리 후 실패만 재시도
  → 최대 30회 반복 (DATABASE_CORRECT_RETRY)
  반복 횟수: 설정값에 의존, 사람 불필요
```

| 측면 | Claude Code | AutoBE |
|------|-------------|--------|
| 컴파일러 수 | 0 (자체) | 3 (Prisma + OpenAPI + TS) |
| 검증 규칙 | LSP 의존 (외부) | 874줄 자체 검증기 |
| 교정 루프 | 없음 (수동) | 자동 (최대 30회) |
| 에러 힌트 | LLM 판단 | TS2339 특수 분석 |
| 배치 교정 | 없음 | 세마포어 8 병렬 |
| 에러 이력 | 대화에 누적 (토큰 ↑) | P2-3 요약 (최근 2개 보존) |
| 성공 보장 | 없음 | 99.8% (Qwen3 35B 기준) |

---

## 28. Git 통합: Worktree 관리와 Bare-Repo 방어

Claude Code는 **파일 시스템 기반 도구**이므로 Git 통합이 핵심이다. AutoBE는 파일을 **직접 생성**하므로 Git이 필요 없다. 이 비대칭이 흥미로운 비교를 만든다.

### Claude Code의 Git 인프라

**1. Git 루트 탐지와 Worktree 관리**:

```typescript
// src/utils/git.ts (lines 27-109)
// 디렉토리 트리를 올라가며 .git 파일/디렉터리 탐색
// LRU 캐시 (최대 50개) + worktree .git 파일 → 메인 리포 해석

// src/tools/EnterWorktreeTool/EnterWorktreeTool.ts
const worktreeSession = await createWorktreeForSession(sessionId, slug)
// slug 검증: /^[a-zA-Z0-9._-]+$/, 최대 64자
// canonical git root로 해석 후 생성
// 생성 시 캐시 초기화: 시스템 프롬프트, 메모리, 플랜

// src/tools/ExitWorktreeTool/ExitWorktreeTool.ts
async function countWorktreeChanges(path, originalHeadCommit)
  // 커밋되지 않은 파일 + 베이스라인 이후 커밋 수 카운트
  // git 상태 불안정 시 null 반환 (fail-closed)
```

**2. Diff 추적과 표시**:

```typescript
// src/utils/gitDiff.ts

// fetchGitDiff() — 통계 + 파일별 변경사항
//   git diff HEAD --shortstat → 빠른 프로브
//   git diff HEAD --numstat → 상세 통계
//   MAX_FILES = 50, MAX_DIFF_SIZE_BYTES = 1MB

// parseGitDiff() — 구조화된 패치 파싱
//   MAX_LINES_PER_FILE = 400 (GitHub 자동 로드 한계)
//   V8 sliced-string 해제: '' + line (메모리 누수 방지)

// 일시적 상태 감지 (merge/rebase/cherry-pick 중 diff 건너뛰기)
const transientFiles = ['MERGE_HEAD', 'REBASE_HEAD',
                        'CHERRY_PICK_HEAD', 'REVERT_HEAD']
```

**3. Git 보안 — Bare-Repo 공격 방어**:

```typescript
// src/tools/PowerShellTool/gitSafety.ts
// 공격 시나리오: cd /tmp/malicious && git status
// 악성 디렉터리에 HEAD + objects/ + refs/ 가 있으면
// git이 이를 bare repo로 인식 → hooks/ 실행 가능

// 방어 1: bare repo 감지
function isCurrentDirectoryBareGitRepo(): boolean {
  // HEAD + objects/ + refs/ 존재하면서 .git/HEAD가 없으면 = bare repo
}

// 방어 2: 경로 정규화로 탈출 감지
function resolveEscapingPathToCwdRelative(normalized: string) {
  // ../project/hooks 등으로 cwd 재진입하는 공격 탐지
  // 실제 cwd 기준으로 해석하여 탈출 감지
}

// 방어 3: NTFS 8.3 단축명 차단
const GIT_INTERNAL_PREFIXES = ['head', 'objects', 'refs', 'hooks']
// GIT~1, GIT~2 등 Windows 단축명도 차단

// 방어 4: cd + git 복합 명령 차단 (readOnlyValidation.ts)
// compoundCommandHasCd && hasGitCommand → BLOCKED
```

**4. Git 상태 보존 (이슈 제출용)**:

```typescript
// src/utils/git.ts (lines 528-845)
type PreservedGitState = {
  remote_base_sha: string | null,     // merge-base SHA
  patch: string,                       // diff from merge-base
  untracked_files: Array<{path, content}>,  // 새 파일
  format_patch: string | null,         // git format-patch (커밋 보존)
  head_sha: string | null,
  branch_name: string | null,
}
// 제한: 파일당 500MB, 총 5GB, 최대 20,000개
// 바이너리 감지: 8KB 스니핑 휴리스틱
```

### AutoBE: Git 없는 세계

AutoBE는 파일 시스템을 **직접 제어**한다. Git이 필요 없는 이유:

```typescript
// packages/compiler/src/realize/testRealizeProject.ts
// 1. 임시 디렉터리 생성 (UUID)
// 2. 모든 파일을 임시 디렉터리에 기록
// 3. pnpm install → build:prisma → build:test
// 4. TGrid WorkerConnector로 테스트 실행
// 5. 임시 디렉터리 삭제

// 이 모든 것이 메모리 내 Record<string, string>으로 관리됨
// Git 히스토리 불필요: 이전 상태는 AutoBeState에 보존
```

```
Claude Code: 기존 코드 → 수정 → diff 추적 → 커밋
  → Git이 변경사항의 **진실의 원천(Source of Truth)**
  → bare-repo 공격, worktree 관리, NTFS 단축명 등 방어 필요

AutoBE: 무(無)에서 → 전체 생성 → 컴파일 검증 → 결과 반환
  → 이벤트 히스토리가 **진실의 원천**
  → Git 보안 고려사항 없음
```

| 측면 | Claude Code | AutoBE |
|------|-------------|--------|
| Git 의존도 | 핵심 (diff, commit, worktree) | 없음 |
| Worktree 관리 | 격리된 작업 공간 | 불필요 |
| 보안 위협 | bare-repo, NTFS, 경로 탈출 | 해당 없음 |
| 변경 추적 | git diff (1MB 제한) | 이벤트 히스토리 |
| 이전 상태 | git log / git blame | AutoBeState.previousXxx |
| 파일 관리 | 파일 시스템 직접 접근 | Record<string, string> 메모리 내 |

---

## 29. 코드 생성 파이프라인: AST에서 NestJS까지

AutoBE만의 고유한 영역: **OpenAPI AST → 완전한 NestJS 프로젝트**를 생성하는 파이프라인. Claude Code에는 대응하는 시스템이 없다.

### 간소화된 OpenAPI AST

```typescript
// packages/interface/src/openapi/AutoBeOpenApi.ts

// 루트 문서 — OpenAPI v3.1의 핵심만 추출
interface IDocument {
  operations: IOperation[];  // @minItems 1, 유일해야 함
  components: IComponents;   // 재사용 스키마
}

// API 오퍼레이션 — specification/description 이중 문서화
interface IOperation extends IEndpoint {
  specification: string;     // HOW: Realize 에이전트를 위한 구현 지침
  description: string;       // WHAT: API 소비자를 위한 설명
  authorizationType: "login" | "join" | "refresh" | null;
  parameters: IParameter[];
  requestBody: IRequestBody | null;
  responseBody: IResponseBody | null;
  authorizationActor: (string & CamelCasePattern) | null;
  name: string & CamelCasePattern;  // camelCase, JS 예약어 금지
  prerequisites: IPrerequisite[];   // 비즈니스 로직 의존성
}

// 타입 명명 규약 — AI가 학습하기 쉬운 패턴:
// IShoppingSale         → 전체 상세
// IShoppingSale.ICreate → POST 요청 바디
// IShoppingSale.IUpdate → PUT 요청 바디
// IShoppingSale.IRequest → 검색/필터 파라미터
// IShoppingSale.ISummary → 간소화된 목록 뷰
// IShoppingSale.IAbridge → 중간 상세 수준
// IPageIShoppingSale    → 페이지네이션 결과
```

### 변환 파이프라인: 3단계

```
AutoBeOpenApi.IDocument
  ↓ transformOpenApiDocument()
OpenApi.IDocument (표준 v3.1)
  ↓ NestiaMigrateApplication
NestJS 프로젝트 (컨트롤러 + DTO + SDK + 테스트)
```

```typescript
// packages/utils/src/interface/transformOpenApiDocument.ts (lines 13-94)
function transformOpenApiDocument(input: AutoBeOpenApi.IDocument): OpenApi.IDocument {
  for (const op of input.operations) {
    paths[op.path] ??= {};
    paths[op.path][op.method] = {
      summary: StringUtil.summary(op.description),
      description: op.description + (op.authorizationType !== null
        ? "\n\n@setHeader token.access Authorization" : ""),
      // 커스텀 확장 필드:
      "x-autobe-authorization-type": op.authorizationType,
      "x-autobe-authorization-actor": op.authorizationActor,
      "x-autobe-prerequisites": op.prerequisites,
      "x-autobe-specification": op.specification,
    };
  }
}
```

### Collector/Transformer: 재사용 가능한 변환 유닛

**Collector** (DTO → Prisma 입력):

```typescript
// AutoBeRealizeCollectorProgrammer.ts — 템플릿 생성
export namespace ShoppingSaleCollector {
  export async function collect(props: {
    body: IShoppingSale.ICreate;
    customer: IEntity;        // FK 참조
    session: IEntity;         // FK 참조
    ip: string;               // 특수 필드
  }) {
    return {
      id: ...,
      title: ...,
      customer: ...,          // belongsTo 관계
      snapshots: ...,         // hasMany 관계
    } satisfies Prisma.shopping_salesCreateInput;
  }
}
```

**Transformer** (Prisma 결과 → DTO):

```typescript
// AutoBeRealizeTransformerProgrammer.ts — 템플릿 생성
export namespace ShoppingSaleTransformer {
  export type Payload = Prisma.shopping_salesGetPayload<
    ReturnType<typeof select>
  >;

  export function select() {
    return {
      // implicit return type — 더 나은 타입 추론
      ...
    } satisfies Prisma.shopping_salesFindManyArgs;
  }

  export async function transform(input: Payload): Promise<IShoppingSale> {
    return {
      id: ...,
      title: ...,
      seller: ...,          // 관계 트랜스포머 호출
      snapshots: ...,       // 중첩 트랜스포머 호출
    };
  }
}

// 네이밍 규칙:
// IShoppingSale → ShoppingSaleTransformer
// IShoppingSale.ISummary → ShoppingSaleAtSummaryTransformer
// IBbsArticleComment.IInvert → BbsArticleCommentAtInvertTransformer
```

### 컨트롤러 생성: AST + 비즈니스 로직 결합

```typescript
// packages/compiler/src/realize/writeRealizeControllers.ts (lines 18-151)
// NestJS 컨트롤러 메서드 자동 생성:

@TypedRoute.Post()
async create(
  @TypedHeaders() headers: AuthorizationHeaders,
  @TypedBody() body: IShoppingSale.ICreate,
): Promise<IShoppingSale> {
  try {
    return await postShoppingSales({
      customer: headers.authorization,
      body,
    });
  } catch (error) {
    // 에러 핸들링
  }
}
```

### 생성되는 프로젝트 구조

```
src/
├── controllers/
│   └── shopping/SaleController.ts     ← 자동 생성
├── providers/
│   ├── postShoppingSales.ts           ← AI 생성 + 컴파일러 검증
│   ├── getShoppingSalesById.ts        ← AI 생성 + 컴파일러 검증
│   └── deleteShoppingSalesById.ts     ← AI 생성 + 컴파일러 검증
├── collectors/
│   ├── ShoppingSaleCollector.ts       ← AI 생성 + 컴파일러 검증
│   └── ShoppingSaleTagCollector.ts    ← AI 생성 + 컴파일러 검증
├── transformers/
│   ├── ShoppingSaleTransformer.ts     ← AI 생성 + 컴파일러 검증
│   └── ShoppingSaleAtSummaryTransformer.ts  ← AI 생성 + 컴파일러 검증
├── decorators/payload/
│   └── CustomerPayload.ts            ← 자동 생성
packages/api/
├── swagger.json                       ← 자동 생성
├── lib/structures/*.ts                ← 자동 생성
└── src/*.ts                           ← 타입 안전 SDK
```

**모든 `AI 생성` 파일은 3층 컴파일러를 통과**해야 한다. 통과하지 못하면 교정 루프가 가동된다.

### Claude Code에서의 코드 생성

Claude Code는 **코드 생성 파이프라인이 없다**. LLM이 직접 코드를 작성하고, 사용자가 검수한다:

```
Claude Code:
  "쇼핑몰 백엔드 만들어줘"
  → LLM이 파일 하나씩 생성 (Edit/Write 도구)
  → 일관성 보장 없음 (API↔DB 타입 불일치 가능)
  → 컨트롤러/서비스/모델 간 관계를 LLM이 기억해야 함
  → 프로젝트가 커지면 컨텍스트 한계에 도달

AutoBE:
  "쇼핑몰 백엔드 만들어줘"
  → 요구사항 분석 → DB 스키마 (Prisma 컴파일)
  → API 명세 (OpenAPI 컴파일) → E2E 테스트
  → Collector/Transformer/Operation (TypeScript 컴파일)
  → 컨트롤러 (자동 생성, 컴파일 불필요)
  → 전체 프로젝트가 **하나의 타입 체인**으로 연결됨
```

---

## 30. 권한 시스템 해부: 5계층 규칙 엔진의 내부

Claude Code의 권한 시스템은 이 프로젝트에서 **가장 복잡한 단일 시스템**이다. AutoBE에는 대응하는 시스템이 없다 — 사용자 파일에 접근하지 않으므로.

### 5계층 규칙 소스

```typescript
// src/types/permissions.ts
type PermissionRuleSource =
  | 'policySettings'    // 조직 관리자 설정 (최고 우선순위)
  | 'flagSettings'      // 런타임 Feature Flag
  | 'projectSettings'   // 프로젝트별 설정
  | 'localSettings'     // 사용자 로컬 설정
  | 'userSettings'      // 전역 사용자 설정 (최저 우선순위)
  | 'cliArg'            // CLI 인자
  | 'command'           // 명령 내 설정
  | 'session'           // 세션 내 설정

// 규칙 형식:
type PermissionRule = {
  source: PermissionRuleSource,
  ruleBehavior: 'allow' | 'deny' | 'ask',
  ruleValue: {
    toolName: string,        // "Bash", "Edit", "WebFetch"
    ruleContent?: string,    // "python:*", "/path/to/file", "domain:example.com"
  }
}
```

### 위험한 패턴 감지

```typescript
// src/utils/permissions/dangerousPatterns.ts

// 크로스 플랫폼 코드 실행 진입점
const CROSS_PLATFORM_CODE_EXEC = [
  'python', 'python3', 'node', 'deno', 'tsx',
  'ruby', 'perl', 'php', 'lua',
  'npx', 'bunx',
  'npm run', 'yarn run', 'pnpm run', 'bun run',
  'bash', 'sh', 'ssh',
]

// Auto 모드에서 위험한 권한 감지
function isDangerousBashPermission(toolName: string, ruleContent?: string) {
  // "Bash(*)" → 위험 (모든 명령 허용)
  // "Bash(python:*)" → 위험 (코드 실행)
  // "Bash(git add:*)" → 안전

  for (const pattern of DANGEROUS_BASH_PATTERNS) {
    if (content === pattern) return true;
    if (content === `${pattern}:*`) return true;
    if (content === `${pattern}*`) return true;
    if (content.startsWith(`${pattern} -`) && content.endsWith('*')) return true;
  }
}
```

### 셸 규칙 매칭: 와일드카드 엔진

```typescript
// src/utils/permissions/shellRuleMatching.ts (lines 23-154)
type ShellPermissionRule =
  | { type: 'exact'; command: string }
  | { type: 'prefix'; prefix: string }
  | { type: 'wildcard'; pattern: string }

function matchWildcardPattern(pattern: string, command: string) {
  // 이스케이프 시퀀스: \* → 리터럴 *, \\ → 리터럴 \
  // 패턴 → 정규식 변환: "git *" → "^git .*?$"
  // 특수: "git *"는 bare "git"도 매치
  //   ' .*' → ' (.*)?'로 변환
  // null-byte 센티넬로 이스케이프 시퀀스 보존
}
```

### 주 권한 결정 함수

```typescript
// src/utils/permissions/permissions.ts (lines 473-601)
async function hasPermissionsToUseTool(tool, input, context) {
  const result = await hasPermissionsToUseToolInner(tool, input, context);

  // 허용 시 연속 거부 카운터 리셋
  if (result.behavior === 'allow') {
    resetConsecutiveDenials();
  }

  // dontAsk 모드: 'ask' → 자동 'deny'
  if (result.behavior === 'ask' && mode === 'dontAsk') {
    return { behavior: 'deny', ... };
  }

  // auto 모드: AI 분류기가 결정
  if (result.behavior === 'ask' && mode === 'auto') {
    return await classifyWithTranscript(...);
  }

  return result;
}
```

### 거부 추적과 회로 차단

```typescript
// src/utils/permissions/denialTracking.ts
const DENIAL_LIMITS = {
  maxConsecutive: 3,     // 연속 3회 거부 → 프롬프트로 전환
  maxTotal: 20,          // 총 20회 거부 → 프롬프트로 전환
}

function shouldFallbackToPrompting(state: DenialTrackingState): boolean {
  return (
    state.consecutiveDenials >= DENIAL_LIMITS.maxConsecutive ||
    state.totalDenials >= DENIAL_LIMITS.maxTotal
  );
}
// auto 모드가 계속 거부하면 → 사용자에게 물어보기로 전환
// 이것은 AI 분류기의 오작동에 대한 안전장치
```

### 강제 정책: 조직 관리자의 무기

```typescript
// 특수 강제 설정:
allowManagedPermissionRulesOnly: true
  → policySettings 규칙만 적용, 사용자 규칙 무시
  → addPermissionRulesToSettings() → false 반환

allowManagedSandboxDomainsOnly: true
  → 관리 도메인만 허용

allowManagedReadPathsOnly: true
  → 관리 경로만 읽기 허용
```

### AutoBE와의 비교: 불필요한 복잡성

AutoBE에는 권한 시스템이 **없다**. 이유:

```
Claude Code:
  사용자의 파일을 읽고 수정 → 파괴적 행동 가능
  외부 명령 실행 → 시스템 손상 가능
  네트워크 접근 → 데이터 유출 가능
  → 5계층 권한 + 6중 보안 필수

AutoBE:
  메모리 내 Record<string, string>으로 작업
  외부 명령 = pnpm install + build + test (격리된 임시 디렉터리)
  네트워크 접근 = AI API 호출만
  → 권한 시스템 불필요
```

| 측면 | Claude Code | AutoBE |
|------|-------------|--------|
| 권한 규칙 수 | 수백 개 가능 | 0 |
| 위험 패턴 | 30+ 위험 명령 목록 | 해당 없음 |
| 샌드박스 | bwrap (Linux) + seatbelt (macOS) | 임시 디렉터리 격리 |
| 정책 강제 | 조직 관리자 정책 | 해당 없음 |
| 거부 추적 | 연속 3회 / 총 20회 회로 차단 | 해당 없음 |
| AI 분류기 | auto 모드 (트랜스크립트 분석) | 해당 없음 |

이 차이는 다시 한번 **제품 형태의 차이**를 보여준다. 사용자 환경에서 실행되는 도구는 정교한 권한 관리가 생명이다. 서버에서 격리 실행되는 파이프라인은 물리적 격리가 곧 보안이다.

---

## 31. 투기적 실행: Copy-on-Write 오버레이의 미래

Claude Code에는 AutoBE에 대응물이 없는 **독보적인 기능**이 있다: 사용자가 제안을 검토하는 동안 미리 실행하는 **투기적 실행(Speculation)** 시스템.

### Copy-on-Write 오버레이 파일 시스템

```typescript
// src/services/PromptSuggestion/speculation.ts

// 투기적 실행의 핵심: 격리된 오버레이 디렉터리
// ${tempDir}/speculation/${pid}/${speculationId}

const WRITE_TOOLS = new Set(['Edit', 'Write', 'NotebookEdit'])
const SAFE_READ_ONLY_TOOLS = new Set([
  'Read', 'Glob', 'Grep', 'ToolSearch', 'LSP', 'TaskGet', 'TaskList'
])
const MAX_SPECULATION_TURNS = 20
const MAX_SPECULATION_MESSAGES = 100
```

**작동 원리**:

```
사용자가 제안을 검토하는 동안:
  1. 오버레이 디렉터리 생성
  2. Write 도구 호출 시 → 원본 파일을 오버레이에 복사 (최초 1회)
  3. Read 도구 호출 시 → writtenPaths에 있으면 오버레이에서 읽기
  4. 경계 조건 도달 시 중단:
     - bash 실행 → { type: 'bash', command }
     - 파일 편집 → { type: 'edit', toolName, filePath }
     - 비허용 도구 → { type: 'denied_tool', toolName }
     - 완료 → { type: 'complete' }
```

**도구 허용 규칙**:

```
Write 도구 (Edit/Write/NotebookEdit):
  → acceptEdits 또는 bypassPermissions 모드에서만 허용
  → 실행 전 원본 → 오버레이 복사

Read-only Bash:
  → checkReadOnlyConstraints() 통과 시만 허용
  → 상태 변경 명령 차단

그 외 (WebSearch, Skills 등):
  → 전부 거부
```

### 파이프라인 투기: 이중 예측

```typescript
// 사용자가 제안 A를 검토하는 동안:
//   → 투기 실행 A 진행 (제안 A 수락 시 바로 적용)
//   → 동시에 "파이프라인 제안 B" 생성 (다음 제안 미리 준비)

// 투기 완료 시:
//   → 파이프라인 제안을 메인 제안으로 승격
//   → 승격된 제안에 대해 새 투기 시작 (무한 연쇄)
```

### 시간 절약 추적

```typescript
// 투기 수락 시:
timeSavedMs = min(acceptedAt, boundary.completedAt) - startTime
// 트랜스크립트에 기록: { type: 'speculation-accept', timeSavedMs }
// 세션 누적: appState.speculationSessionTimeSavedMs
```

### AutoBE에서 대응하는 패턴

AutoBE에는 투기적 실행이 **없다**. 대신 **다른 방식으로 대기 시간을 줄인다**:

```
Claude Code 투기적 실행:
  사용자 검토 시간을 활용하여 다음 작업 미리 실행
  Copy-on-Write로 안전한 롤백 보장
  20턴/100메시지 제한

AutoBE 병렬 실행:
  executeCachedBatch로 독립 작업 동시 실행
  세마포어 8로 동시성 제어
  프롬프트 캐시 키 공유로 토큰 절약
  사용자 대기 시간 자체가 없음 (자율 실행)
```

투기적 실행은 **대화형 에이전트만의 최적화**다. 사용자가 생각하는 시간이 있기 때문에 그 시간을 활용할 수 있다. AutoBE는 사용자 입력 없이 자율 실행되므로, 투기가 아닌 **병렬화**로 시간을 줄인다.

---

## 32. 컨텍스트 붕괴: autocompact를 넘어선 단계적 압축

Section 8에서 autocompact를 다뤘지만, Claude Code에는 그보다 더 정교한 시스템이 있다: **Context Collapse** (컨텍스트 붕괴).

### autocompact의 한계

```typescript
// src/services/compact/autoCompact.ts

const AUTOCOMPACT_BUFFER_TOKENS = 13_000    // 자동 압축 버퍼
const MAX_OUTPUT_TOKENS_FOR_SUMMARY = 20_000 // 요약 최대 토큰
const MAX_CONSECUTIVE_AUTOCOMPACT_FAILURES = 3  // 회로 차단

// 임계값 계산:
// effectiveWindow = contextWindow - reservedForSummary(20k)
// autoCompactThreshold = effectiveWindow - 13k

// 회로 차단:
// 3회 연속 실패 → 더 이상 시도하지 않음
// BQ 데이터: 1,279 세션이 50+ 연속 실패, ~250K 낭비 API 호출/일
```

autocompact는 **전체 대화를 LLM에게 요약**시킨다. 정보 손실이 불가피하고, 요약 자체가 실패할 수 있다.

### Context Collapse: 단계적 압축

```
Context Collapse 임계값:
  90% 컨텍스트 → 단계적 압축 커밋 (staged commit)
  95% 컨텍스트 → 차단 수준 (blocking spawn)

autocompact 임계값:
  ~93% 컨텍스트 → LLM 기반 전체 요약

문제: autocompact(93%)와 Context Collapse(90%)가 경쟁
해결: Context Collapse 활성 시 autocompact 억제
```

```typescript
// autoCompact.ts — 억제 규칙
// 1. 재귀 방지: compact 또는 session_memory 소스면 억제
// 2. Reactive-Only 모드: 사전 압축 억제, API의 prompt_too_long만 반응
// 3. Context Collapse 경쟁 방지:
//    Collapse가 90%/95%에서 관리하므로 autocompact의 93%가 간섭하면 안 됨
//    → Context Collapse 활성 시 autocompact 비활성화
```

**압축 시도 순서**:

```
1단계: 세션 메모리 압축 (경량)
  → 성공 시 반환, LLM 호출 불필요

2단계: 레거시 전체 압축 (무거움)
  → compactConversation() 호출
  → 실패 시 회로 차단 카운터 증가
```

### 413 오버플로우 복구

```typescript
// query.ts — Context Collapse와의 통합

// 413 (Payload Too Large) 발생 시:
if (contextCollapse) {
  // 단계적 압축 큐를 강제 드레인
  const result = await contextCollapse.recoverFromOverflow(messages)
  if (result.committed > 0) {
    // 드레인 성공 → collapse_drain_retry로 재시도
    messagesForQuery = result.messages
    continue  // 재시도
  }
}

// 미디어/텍스트가 보류된 메시지 감지:
if (contextCollapse.isWithheldPromptTooLong()) {
  // withheld = true → 조기 종료 훅 건너뛰기
}
```

### AutoBE의 대응: 구조적 압축

AutoBE에는 컨텍스트 붕괴가 **없다**. 대신 **컨텍스트가 폭발하지 않는 구조**를 사용한다:

```
Claude Code:
  대화가 길어짐 → 컨텍스트 팽창 → O(N²) 비용
  → autocompact (93%에서 LLM 요약)
  → Context Collapse (90%에서 단계적 압축)
  → 413 복구 (강제 드레인)

AutoBE:
  각 에이전트가 독립 대화 → 컨텍스트 고정
  → P2-3 요약 (에러 히스토리만 압축, 최근 2개 보존)
  → LOADED/AVAILABLE RAG (필요한 데이터만 로딩)
  → 컨텍스트 폭발 자체가 불가능
```

| 측면 | Claude Code | AutoBE |
|------|-------------|--------|
| 압축 트리거 | 90-95% 컨텍스트 사용 | 해당 없음 |
| 압축 방식 | LLM 요약 (정보 손실) | P2-3 규칙 요약 (정보 보존) |
| 회로 차단 | 3회 실패 → 포기 | 해당 없음 |
| 413 복구 | 단계적 드레인 | 해당 없음 |
| 컨텍스트 증가 패턴 | O(N²) (대화 길이) | O(1) (고정 파이프라인) |

---

## 33. 비용 추적: 실시간 USD 계산 vs 토큰 집계

두 프로젝트 모두 토큰 사용량을 추적하지만, 정밀도와 목적이 다르다.

### Claude Code: 실시간 USD 계산

```typescript
// src/cost-tracker.ts

function addToTotalSessionCost(cost: number, usage: Usage, model: string) {
  const modelUsage = addToTotalModelUsage(cost, usage, model)
  addToTotalCostState(cost, modelUsage, model)

  // OpenTelemetry 카운터 기록
  getCostCounter()?.add(cost, { model, speed: isFast ? 'fast' : undefined })
  getTokenCounter()?.add(usage.input_tokens, { model, type: 'input' })
  getTokenCounter()?.add(usage.output_tokens, { model, type: 'output' })
  getTokenCounter()?.add(usage.cache_read_input_tokens, { model, type: 'cacheRead' })
  getTokenCounter()?.add(usage.cache_creation_input_tokens, { model, type: 'cacheCreation' })
}
```

**모델별 가격 체계**:

```typescript
// src/utils/modelCost.ts

// Opus 4.6 (표준): $15 입력 / $75 출력 / Mtok
// Opus 4.6 (Fast):  $30 입력 / $150 출력 / Mtok (2배)
// Opus 4.5:         $5 입력 / $25 출력 / Mtok
// Sonnet 4.6:       $3 입력 / $15 출력 / Mtok
// Haiku 4.5:        $1 입력 / $5 출력 / Mtok

// 캐시 가격:
// 쓰기: 입력 × 1.25
// 읽기: 입력 × 0.1
// 웹 검색: $0.01/요청
```

**토큰 예산 시스템** — 자연어로 예산 설정:

```typescript
// src/query/tokenBudget.ts

// 사용자가 "+500k" 또는 "use 2M tokens"이라고 입력하면:
// parseBudget("use 2M tokens") → 2_000_000
// parseBudget("+500k") → 500_000
// 단위: k=1,000, m=1,000,000, b=1,000,000,000

const COMPLETION_THRESHOLD = 0.9  // 예산의 90% 도달 시 중단
const DIMINISHING_THRESHOLD = 500 // 토큰 델타 < 500이면 수확체감

// 3회 연속 + 델타 < 500 → 수확체감 감지 → 중단
```

**세션 비용 영속성**:

```typescript
// 세션 전환 시 비용 상태 저장/복원:
saveCurrentSessionCosts()      // → 프로젝트 설정에 기록
restoreCostStateForSession(id) // → 세션 ID 일치 시만 복원
// 다른 세션의 비용을 실수로 합산하지 않음
```

### AutoBE: 구조화된 토큰 집계

```typescript
// packages/interface/src/events/base/AutoBeAggregateEventBase.ts

// 모든 작업별 집계:
interface AutoBeProcessAggregate {
  tokenUsage: IAutoBeTokenUsageJson.IComponent;
  metric: AutoBeFunctionCallingMetric;
}

// 토큰 사용량 구성:
interface IAutoBeTokenUsageJson.IComponent {
  total: { input: number; output: number };
  // 캐시 세분화:
  cache: {
    read: { input: number; output: number };
    creation: { input: number; output: number };
  };
}

// 함수 호출 메트릭:
interface AutoBeFunctionCallingMetric {
  attempt: number;        // 총 시도
  success: number;        // 성공
  invalidJson: number;    // JSON 파싱 실패
  validationFailure: number; // 스키마 검증 실패
}
```

**작업별 집계** — 69종 이벤트 소스마다 독립 추적:

```typescript
// AutoBeProcessAggregateCollection:
// analyzeScenario → { tokenUsage, metric }
// databaseComponent → { tokenUsage, metric }
// interfaceSchemaRefine → { tokenUsage, metric }
// realizeWrite → { tokenUsage, metric }
// ... 69종 모두 독립 집계
```

### 핵심 차이

```
Claude Code:
  단위: USD (실시간 환산)
  추적: 모델별 × 속도별 (표준/Fast)
  예산: 사용자가 자연어로 설정 ("use 2M tokens")
  영속성: 세션별 프로젝트 설정에 저장
  목적: 사용자에게 비용 투명성 제공

AutoBE:
  단위: 토큰 (캐시 읽기/쓰기 세분화)
  추적: 작업 소스별 × 단계별 (69종)
  예산: 없음 (고정 파이프라인, 비용 예측 가능)
  영속성: 이벤트 히스토리에 포함
  목적: 작업별 비용 분석과 최적화
```

| 측면 | Claude Code | AutoBE |
|------|-------------|--------|
| 비용 단위 | USD (실시간) | 토큰 (원시) |
| 가격표 | 6개 모델 티어 | 벤더 독립 (원시 토큰) |
| 예산 시스템 | 자연어 파싱 | 없음 |
| 캐시 추적 | 읽기/쓰기 분리 | 읽기/쓰기 분리 |
| 집계 단위 | 모델별 | 작업 소스별 (69종) |
| 세션 영속성 | 프로젝트 설정 | 이벤트 히스토리 |
| 수확체감 감지 | 3회 + Δ<500 → 중단 | 해당 없음 |

Claude Code는 **사용자에게 비용을 보여주는** 시스템이고, AutoBE는 **개발자가 파이프라인을 최적화하는** 시스템이다. 같은 데이터를 추적하지만 소비자가 다르다.

---

## 34. 기여 추적: 문자 수준 어트리뷰션 vs 이벤트 소스 집계

"AI가 얼마나 기여했는가?"라는 질문에 대한 두 프로젝트의 답.

### Claude Code: 문자 수준 기여도 추적

Claude Code는 **각 파일에서 AI가 작성한 문자 수**를 정밀하게 추적한다:

```typescript
// src/utils/commitAttribution.ts (961줄)

type FileAttributionState = {
  contentHash: string;          // SHA-256 파일 해시
  claudeContribution: number;   // 누적 문자 수
  mtime: number;                // 수정 시간
}

type AttributionState = {
  fileStates: Map<string, FileAttributionState>;
  sessionBaselines: Map<string, { contentHash: string; mtime: number }>;
  surface: string;              // "cli" | "app" | "vscode"
  startingHeadSha: string | null;
  promptCount: number;
  escapeCount: number;          // 사용자 탈출(Ctrl+C) 횟수
}
```

**문자 기여도 계산 알고리즘**:

```typescript
// 새 파일: 전체 내용 길이 = Claude 기여
// 수정된 파일:
//   1. 공통 접두사(prefix) 찾기
//   2. 공통 접미사(suffix) 찾기
//   3. 변경 영역 = 전체 - 접두사 - 접미사
//   4. 기여도 = max(이전 변경 영역 길이, 새 변경 영역 길이)
// 삭제된 파일: 별도 추적 (contentHash = empty)

// "Esc" → "esc" 같은 동일 길이 교체도 정확히 추적
```

**다중 서피스 지원**:

```typescript
// CLAUDE_CODE_ENTRYPOINT 환경 변수로 서피스 결정
// 서피스별 기여도 독립 추적:
// surfaceBreakdown: {
//   "cli/claude-opus-4-6": { claudeChars: 15420, percent: 72.3 },
//   "vscode/claude-sonnet-4-6": { claudeChars: 5890, percent: 27.7 },
// }

// 모델명 정화: 공개 리포에서는 내부 코드명 노출 방지
// anthropics/* 조직만 내부 코드명 사용 허용
```

**파일 히스토리 스냅샷 시스템** (1,115줄):

```typescript
// src/utils/fileHistory.ts

// SHA-256 기반 백업 파일명: ${hash}@v${version}
// 메시지 ID별 스냅샷 → 특정 시점으로 되감기 가능
// MAX_SNAPSHOTS = 100, LRU 방출
// 세션 resume 시 하드링크로 백업 연결 (실패 시 복사)
// 파일 권한(chmod) 백업/복원 포함
```

### AutoBE: 이벤트 소스별 집계

AutoBE는 문자 수가 아닌 **작업 소스별 토큰 사용량**을 추적한다:

```typescript
// 69종 이벤트 소스마다 독립 집계:
type AutoBeProcessAggregateCollection = {
  [source in AutoBeEventSource]: AutoBeProcessAggregate;
}

// 각 작업의 기여도:
interface AutoBeProcessAggregate {
  tokenUsage: {
    total: { input: number; output: number };
    cache: { read: { input; output }; creation: { input; output } };
  };
  metric: {
    attempt: number;
    success: number;
    invalidJson: number;
    validationFailure: number;
  };
}
```

**기여도 질문 자체가 다르다**:

```
Claude Code의 질문:
  "이 커밋에서 AI가 얼마나 기여했나?"
  → 문자 수준 추적 → 72.3% Claude, 27.7% 사람
  → Git 커밋 메타데이터에 기여도 포함

AutoBE의 질문:
  "이 파이프라인에서 어느 단계가 가장 비쌌나?"
  → 토큰 소스별 추적 → interfaceSchemaRefine: 45K 토큰
  → 파이프라인 최적화에 활용
```

| 측면 | Claude Code | AutoBE |
|------|-------------|--------|
| 추적 단위 | 문자 수 / 파일 | 토큰 / 작업 소스 |
| 목적 | AI 기여도 투명성 | 파이프라인 비용 최적화 |
| 정밀도 | 문자 수준 (접두사/접미사 매칭) | 토큰 수준 (입력/출력/캐시) |
| 다중 서피스 | CLI/VSCode/Desktop 분리 | 69종 이벤트 소스 분리 |
| 영속성 | 커밋 메타데이터 | 이벤트 히스토리 |
| 되감기 | SHA-256 스냅샷 (100개 LRU) | 이전 상태 (AutoBeState.previousXxx) |

---

## 35. 메모리 로딩: 4계층 CLAUDE.md vs 85개 시스템 프롬프트

두 프로젝트 모두 LLM에게 "맥락"을 주입하는 시스템이 있다. 하지만 설계가 정반대다.

### Claude Code: 4계층 CLAUDE.md 발견 시스템

```typescript
// src/utils/claudemd.ts (1,479줄)

// 메모리 로드 우선순위 (낮은 → 높은):
// 1. Managed: /etc/claude-code/CLAUDE.md (시스템 전역)
// 2. User:    ~/.claude/CLAUDE.md (사용자 전역)
// 3. Project: ./CLAUDE.md, ./.claude/CLAUDE.md, ./.claude/rules/*.md
// 4. Local:   ./CLAUDE.local.md (개인, 비커밋)
```

**발견 알고리즘**:

```
CWD에서 파일 시스템 루트까지 상향 탐색:
  /home/user/project/src/feature/
    → .claude/CLAUDE.md (있으면 로드)
    → CLAUDE.md (있으면 로드)
  /home/user/project/src/
    → .claude/CLAUDE.md
    → CLAUDE.md
  /home/user/project/
    → .claude/CLAUDE.md
    → .claude/rules/*.md (모든 규칙 파일)
    → CLAUDE.md
    → CLAUDE.local.md
  ... 루트까지 반복

CWD에 가까울수록 높은 우선순위 (나중에 로드 → 모델 컨텍스트에서 아래쪽)
```

**@include 지시어**:

```markdown
<!-- CLAUDE.md에서 -->
@./coding-standards.md    <!-- 상대 경로 -->
@~/global-rules.md        <!-- 홈 디렉터리 -->
@/etc/shared-rules.md     <!-- 절대 경로 -->
```

```typescript
// 순환 참조 방지: processedPaths Set으로 추적
// 존재하지 않는 파일: 조용히 무시
// marked Lexer로 텍스트 노드에서만 추출 (코드 블록 제외)
```

**중첩 메모리 메커니즘** — 파일 읽기가 메모리 로딩을 트리거:

```typescript
// 사용자가 /project/subdir/file.ts를 읽으면:
// 1. nestedMemoryAttachmentTriggers에 경로 추가
// 2. 다음 턴에서 트리거 처리:
//    CWD → /project/subdir/ 경로의 모든 CLAUDE.md 검색
//    발견된 메모리를 어태치먼트로 주입
// 3. 트리거 클리어

// 중복 방지: 2중 메커니즘
// loadedNestedMemoryPaths: 비방출 Set (영구 기억)
// readFileState: 100개 LRU (턴 간 중복 방지)
// LRU 방출 시에도 Set이 재주입 방지
```

**콘텐츠 변환**:

```typescript
// HTML 주석 제거 (블록 레벨만, 코드 블록 제외)
// 프론트매터 파싱 (glob 패턴 추출)
// MEMORY.md 절단 (200줄 제한)
// 변환 시 contentDiffersFromDisk = true 플래그
// → Edit/Write 도구가 원본과 모델이 본 것의 차이를 인식
```

### AutoBE: 85개 정적 시스템 프롬프트

AutoBE는 파일 시스템을 탐색하지 않는다. **85개의 사전 정의된 프롬프트**가 각 에이전트에 정적으로 할당된다:

```typescript
// packages/agent/prompts/*.md → build:prompt → AutoBeSystemPromptConstant.ts

// 컴파일 타임에 모든 프롬프트가 상수로 변환:
export const AutoBeSystemPromptConstant = {
  FACADE: "You are the main agent of AutoBE...",
  ANALYZE_SCENARIO: "You are the analysis scenario planner...",
  DATABASE_COMPONENT: "You are designing database schemas...",
  INTERFACE_SCHEMA_REFINE: "You are refining API DTO schemas...",
  REALIZE_OPERATION_WRITE: "You are implementing provider functions...",
  // ... 85개
} as const;
```

**동적 요소는 RAG로 해결**:

```
Claude Code:
  정적 프롬프트 1개 + 동적 CLAUDE.md 발견 (4계층 × N디렉터리)
  → 사용자 환경에 따라 컨텍스트가 달라짐
  → @include로 모듈화

AutoBE:
  정적 프롬프트 85개 + 동적 RAG (Preliminary Controller)
  → 파이프라인 단계에 따라 프롬프트가 달라짐
  → LOADED/AVAILABLE로 데이터 동적 주입
```

### 근본적 차이

```
Claude Code CLAUDE.md:
  "이 프로젝트에서는 어떻게 작업해야 하는가?"
  → 파일 시스템 탐색으로 발견
  → 사용자가 자유롭게 작성
  → 100+ 텍스트 파일 확장자 허용
  → 발견 코드만 1,479줄

AutoBE 시스템 프롬프트:
  "이 에이전트는 무엇을 해야 하는가?"
  → 빌드 타임에 결정
  → 개발자(Samchon)가 정밀하게 설계
  → Markdown만 허용
  → 빌드 스크립트 100줄 미만
```

| 측면 | Claude Code | AutoBE |
|------|-------------|--------|
| 프롬프트 소스 | 파일 시스템 (런타임 발견) | 소스 코드 (빌드 타임) |
| 계층 수 | 4 (Managed→User→Project→Local) | 1 (상수) |
| 동적 요소 | @include, 중첩 메모리, glob 패턴 | RAG (LOADED/AVAILABLE) |
| 프롬프트 수 | 1 (조립식) | 85 (전용) |
| 사용자 커스터마이징 | 무한 (자유 텍스트) | 없음 (고정 파이프라인) |
| 발견 코드량 | 1,479줄 | 0줄 |
| 중복 방지 | 2중 (Set + LRU) | 불필요 |
| 콘텐츠 변환 | HTML 주석 제거, 프론트매터, 절단 | 없음 (원본 그대로) |

Claude Code의 CLAUDE.md 시스템은 **사용자의 의도를 학습**하는 시스템이다. AutoBE의 시스템 프롬프트는 **개발자의 의도를 강제**하는 시스템이다. 전자는 유연성을, 후자는 정밀성을 극대화한다.

---

## 36. E2E 테스트 자동 생성: 5단계 파이프라인 vs 부재

Claude Code는 테스트를 **작성하지 않는다**. 사용자가 "테스트 작성해줘"라고 요청하면 도구로 코드를 생성할 뿐, 테스트 전략이나 시나리오 설계는 LLM의 자유재량이다.

AutoBE는 **테스트를 공장 라인의 일부로 취급**한다. 5단계 파이프라인이 OpenAPI 스펙에서 E2E 테스트를 완전 자동 생성한다:

```
orchestrateTest()
  ├─ orchestrateTestScenario()      → 오퍼레이션당 1-3개 시나리오
  ├─ orchestrateTestAuthorize()     → 인증 함수 (join/login/refresh)
  ├─ orchestrateTestPrepare()       → 테스트 데이터 준비 함수
  ├─ orchestrateTestGenerate()      → generate_random_* 리소스 생성기
  └─ orchestrateTestOperation()     → 실제 E2E 테스트 코드
```

### 의존성 그래프 자동 해결

시나리오 생성기는 단순히 "이 API를 호출해라"가 아니다. **재귀적으로 전제조건을 추적**한다:

```typescript
// getPrerequisites.ts — 재귀적 전제조건 수집
const traverse = (endpoint: AutoBeOpenApi.IEndpoint): void => {
  const key = `${endpoint.method}:${endpoint.path}`;
  if (visited.has(key)) return;
  visited.add(key);

  const operation = props.document.operations.find(
    (op) => op.method === endpoint.method && op.path === endpoint.path,
  );
  for (const prerequisite of operation.prerequisites) {
    result.set(prerequisite.endpoint, [prerequisite]);
    traverse(prerequisite.endpoint);  // 재귀 탐색
  }
};
```

`POST /shopping/orders`를 테스트하려면 → `POST /shopping/carts/items` 필요 → `POST /shopping/sales` 필요 → `POST /auth/seller/join` 필요. 이 **전체 의존성 체인을 자동으로 해결**한다.

### 절대 금지: 입력 검증 테스트

시스템 프롬프트(`TEST_SCENARIO.md`)에서 명시적으로 금지한다:

```markdown
## ABSOLUTE PROHIBITION: No Input Validation Testing

NEVER create scenarios that test HTTP 400 errors.
AutoBE's three-tier compiler (TypeScript + Typia + NestJS) guarantees type safety.
Testing input validation errors tests the framework, not your business logic.
```

타입 시스템이 보장하는 것을 다시 테스트하지 않는다. 테스트는 **비즈니스 로직**에만 집중한다.

### 4종의 함수 타입: 분업 체계

```typescript
// AutoBeTestFunction.ts
export type AutoBeTestFunction =
  | AutoBeTestAuthorizeFunction   // 인증 (join/login/refresh)
  | AutoBeTestPrepareFunction     // DTO 데이터 준비
  | AutoBeTestGenerateFunction    // 리소스 생성 (API 호출)
  | AutoBeTestOperationFunction;  // 실제 E2E 테스트
```

각 함수 타입은 **독립적으로 생성→컴파일→교정**된다. `discard=true`는 중요한 설계 결정이다—오퍼레이션 테스트가 교정 후에도 컴파일에 실패하면 **조용히 폐기**한다. 컴파일 안 되는 테스트보다 **테스트가 없는 게 낫다**는 판단이다.

| 측면 | Claude Code | AutoBE |
|------|-------------|--------|
| 테스트 생성 | 사용자 요청 시 자유형식 | 자동, 5단계 파이프라인 |
| 시나리오 설계 | LLM 자유재량 | 의존성 그래프 자동 해결 |
| 인증 처리 | 사용자가 직접 | 자동 (actor별 join/login) |
| 데이터 준비 | 사용자가 직접 | prepare/generate 함수 자동 생성 |
| 컴파일 보증 | 없음 | 100% (실패 시 폐기) |
| 입력 검증 테스트 | 포함 가능 | 금지 (컴파일러가 보증) |

---

## 37. 컴파일러 진단의 LLM 최적화: 에러를 읽히게 만드는 기술

AutoBE의 컴파일러 진단 시스템은 단순히 "에러를 전달"하는 것이 아니라, **LLM이 최대한 효과적으로 이해하고 수정할 수 있도록 가공**한다.

### 4단계 진단 파이프라인

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

### 캐스케이딩 에러 압축

하나의 타입 오류가 50~300개의 연쇄 에러를 발생시킬 수 있다:

```typescript
// orchestrateRealizeCorrectOverall.ts
const deduplicateDiagnostics = (diagnostics: IDiagnostic[]): IDiagnostic[] => {
  const byMessage = new Map<string, { diag: IDiagnostic; count: number }>();
  for (const d of diagnostics) {
    const existing = byMessage.get(d.messageText);
    if (existing) existing.count++;
    else byMessage.set(d.messageText, { diag: d, count: 1 });
  }

  const deduped: IDiagnostic[] = [];
  for (const [, { diag, count }] of byMessage) {
    deduped.push({
      ...diag,
      messageText: count > 1
        ? `${diag.messageText} (repeated ${count} times - fix the root cause)`
        : diag.messageText,
    });
  }

  // 25개 상한 — 그 이상은 LLM을 혼란시킬 뿐
  if (deduped.length > 25) {
    const truncated = deduped.slice(0, 25);
    truncated.push({
      ...deduped[0]!,
      messageText: `[+${deduped.length - 25} additional unique errors omitted]`,
    });
    return truncated;
  }
  return deduped;
};
```

### 에러 주석이 달린 코드

단순 에러 메시지 대신, 코드에 **인라인 주석**을 달아 정확한 위치를 보여준다:

```typescript
// printErrorHints.ts — 출력 예시:
// hint #1:
// ```typescript
// const result = selectData(null); // error: Argument of type 'null' is not assignable
// ```
```

### TS2339 특화 힌트: Prisma 관계 필드 가이드

가장 흔한 에러 `Property 'X' does not exist on type 'Y'`에 대해 **도메인 특화 수정 가이드**를 생성한다:

```typescript
// generateTS2339Hints.ts
return [
  "## TS2339 Relation Field Hints",
  "**Fix**: For each property below, add it to `select()`:",
  "- Scalar field → `fieldName: true`",
  "- Relation (has neighbor transformer) → `relation: NeighborTransformer.select()`",
  "- Aggregate count → `_count: { select: { relation: true } }`",
  "Affected properties:",
  ...hints.map((h) => `- \`${h.property}\` on \`${h.modelType}\``),
].join("\n");
```

이것은 **범용 에러 메시지를 도메인 특화 수정 지침으로 변환**하는 것이다.

```
Claude Code: LSP diagnostics → 텍스트 그대로 LLM에 전달 → 가공/힌트 없음
AutoBE: TypeScript diagnostics → 필터링 → 중복 제거 → 주석화 → 힌트 생성
```

---

## 38. MCP 생태계 vs 폐쇄형 파이프라인: 확장성의 두 모델

Claude Code는 **MCP(Model Context Protocol)**를 통해 외부 도구와 통합하는 개방형 생태계를 구축했다. AutoBE는 **폐쇄형 파이프라인**으로 모든 것을 내부에서 해결한다.

### Claude Code의 MCP 아키텍처

MCP 서버는 7가지 소스에서 로딩된다:

```typescript
// types.ts
type ConfigScope = 'local' | 'user' | 'project' | 'dynamic'
                 | 'enterprise' | 'claudeai' | 'managed';

// 전송 프로토콜 6가지
type Transport = 'stdio' | 'sse' | 'sse-ide' | 'http' | 'ws' | 'sdk';
```

도구 이름은 네임스페이스로 구분된다:

```typescript
// mcpStringUtils.ts — mcp__<serverName>__<toolName>
buildMcpToolName("github", "create_issue")
// → "mcp__github__create_issue"
```

### Claude Code의 Hook 시스템

도구 실행 전후에 커스텀 로직을 삽입할 수 있다:

```typescript
// hooks.ts — 비동기 제너레이터 패턴
async function* runPreToolUseHooks(...) {
  yield permissionDecision;    // 허용/거부/질문
  yield updatedInput;          // 입력 수정
  yield preventionSignal;      // 실행 차단
  yield additionalContext;     // 추가 컨텍스트
}

// 6가지 훅 이벤트:
type HookEvent = 'PreToolUse' | 'PostToolUse' | 'PostToolUseFailure'
               | 'PermissionRequest' | 'SessionStart' | 'SessionEnd';
```

### AutoBE의 폐쇄형 설계

AutoBE는 MCP가 **필요 없다**. "외부 도구"에 해당하는 것은 컴파일러와 코드 생성기로, TypeScript 패키지로 직접 통합되어 있다:

```typescript
// AutoBeInterfaceCompiler.ts — 함수 호출 한 번으로 끝
const files: Record<string, string> = migrate.nest({
  keyword: true, simulate: true, e2e: true,
});
```

| 측면 | Claude Code (MCP) | AutoBE (직접 통합) |
|------|-------------------|-------------------|
| 외부 도구 연결 | ★★★★★ (무제한) | ★☆☆☆☆ (불가) |
| 통합 지연시간 | 네트워크 + 직렬화 | 함수 호출 (< 1ms) |
| 타입 안전성 | Zod 런타임 검증 | 컴파일 타임 검증 |
| 도구 발견 | 동적 (ToolSearch) | 정적 (코드에 하드코딩) |
| 정합성 보증 | 도구 출력 무검증 | 컴파일러가 검증 |

---

## 39. 데이터베이스 스키마 생성: 7-오케스트레이터 파이프라인

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

### 도메인 분해: 그룹 → 컴포넌트 → 스키마

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
    ├─ shopping_product_categories
    └─ shopping_product_tags

Step 3 (Schema): 개별 테이블 정밀 설계
  shopping_products: {
    primaryField: { name: "id", type: "uuid" },
    plainFields: [{ name: "name", type: "string" }, ...],
    foreignFields: [{ name: "seller_id", relation: { targetModel: "shopping_sellers" } }],
  }
```

### 구조적 강제: 인증 그룹은 정확히 1개

```typescript
// AutoBeDatabaseGroupProgrammer.validate()
if (authorizationGroups.length !== 1)
  errors.push({ expected: 'exactly 1 group with kind: "authorization"' });
if (domainGroups.length < 1)
  errors.push({ expected: 'at least 1 group with kind: "domain"' });
```

인증은 **반드시 전용 그룹**에서 처리해야 한다. 도메인 에이전트에게는 인증 테이블 생성이 **금지**되어 있다.

### 30회 교정 루프와 배치 분할

`DATABASE_CORRECT_RETRY = 30`은 AutoBE에서 가장 높은 재시도 횟수다:

```typescript
// orchestratePrismaCorrect.ts
async function iterate(ctx, application, life) {
  const result = await compiler.database.validate(application);
  if (result.success) return result;
  if (life < 0) return result;  // 30회 실패 → 포기

  // 한 번에 최대 8개 모델만 교정
  const capacity = 8;
  for (let i = 0; i < Math.ceil(errorModels.length / capacity); i++) {
    const batch = errorModels.slice(i * capacity, (i + 1) * capacity);
    await correct(ctx, batch);
    const midResult = await compiler.database.validate(application);
    if (midResult.success) return midResult;  // 조기 종료
  }
  return iterate(ctx, application, life - 1);
}
```

### 정규화 강제: 프롬프트 420줄의 금기사항

`DATABASE_SCHEMA.md`(420줄)에서 정규화를 체계적으로 강제한다:

```
1NF: JSON/배열을 문자열에 저장 금지
2NF: 모든 비키 속성은 기본키에 완전 의존
3NF: 이행 종속 금지
1:1 관계: 별도 테이블로 분리, nullable 필드 금지
FK 방향: 자식 → 부모만 허용, 역방향 금지
순환 참조 금지
```

Claude Code에서 "정규화된 스키마 만들어줘"라고 하면 LLM이 최선을 다할 것이다. AutoBE에서는 검증기가 위반을 **자동 탐지하고 교정**한다.

---

## 40. Collector/Transformer: 양방향 매핑의 코드 생성

AutoBE의 Realize 단계에서 가장 독특한 패턴은 **Collector/Transformer** 분리다. 모든 CRUD API에는 두 방향의 데이터 변환이 필요하다:

```
API 요청 (DTO)  →  Collector  →  Prisma CreateInput  →  DB
DB  →  Prisma Payload  →  Transformer  →  API 응답 (DTO)
```

### Collector: DTO → Prisma

```typescript
// AutoBeRealizeCollectorProgrammer.ts
// 필터: .ICreate 접미사를 가진 DTO만
filter(key: string): boolean { return key.endsWith(".ICreate"); }

// 네이밍: IShoppingSale.ICreate → ShoppingSaleCollector
getName(dtoTypeName: string): string {
  return dtoTypeName.replace(".ICreate", "").replace(/^I/, "") + "Collector";
}
```

생성되는 코드:

```typescript
// src/collectors/ShoppingSaleCollector.ts (자동 생성)
export namespace ShoppingSaleCollector {
  export async function collect(props: {
    body: IShoppingSale.ICreate;
    seller: IEntity;
  }) {
    return {
      id: v4(), name: props.body.name, seller: { connect: { id: props.seller.id } },
    } satisfies Prisma.shopping_salesCreateInput;
  }
}
```

### Transformer: Prisma → DTO

```typescript
// 네이밍: IShoppingSale → ShoppingSaleTransformer
//        IShoppingSale.ISummary → ShoppingSaleAtSummaryTransformer
getName(dtoTypeName: string): string {
  return dtoTypeName.split(".")
    .map((s) => s.startsWith("I") ? s.substring(1) : s)
    .join("At") + "Transformer";
}
```

### `select()`의 implicit return type: 핵심 제약

Transformer에서 **가장 중요한 제약**은 `select()` 함수에 명시적 반환 타입을 쓰지 않는 것이다:

```typescript
// 검증 코드 — 정규식으로 위반 감지
if (/function\s+select\s*\(\s*\)\s*:/.test(content))
  errors.push({
    description: `select() has an explicit return type annotation.
      This widens the literal type and destroys Prisma GetPayload inference.
      Remove the return type — use satisfies instead.`,
  });
```

`select(): Prisma.FindManyArgs`라고 쓰면 타입이 넓어져서 `GetPayload`가 `any`가 된다. `satisfies`를 쓰면 **리터럴 타입을 보존**하면서 타입 호환성을 검증한다.

### 재귀 DTO: 캐시 기반 N+1 방지

트리 구조(카테고리, 댓글 등)의 재귀적 DTO를 위한 특별 템플릿:

```typescript
export async function transform(
  input: Payload,
  cache: VariadicSingleton<Promise<ICategory>, [string]> = createCache(),
): Promise<ICategory> {
  return {
    parent: input.parent_id ? await cache.get(input.parent_id) : null,
    ...
  };
}

export async function transformAll(inputs: Payload[]): Promise<ICategory[]> {
  const cache = createCache();  // 배치 내 캐시 공유
  return await ArrayUtil.asyncMap(inputs, (x) => transform(x, cache));
}
```

### 전체 매핑 검증: 누락 불가

Collector와 Transformer 모두 **모든 필드가 매핑되었는지** 검증한다:

```
Collector: Prisma CreateInput의 모든 필드 ↔ mappings[]
  → 누락된 필드 → 검증 에러

Transformer: DTO의 모든 속성 ↔ transformMappings[]
            Prisma 모델의 관련 필드 ↔ selectMappings[]
  → 누락된 속성 → 검증 에러
```

이것은 Section 5의 **"excludes + revises = 완전 커버리지"**와 같은 철학이다.

---

## 41. 프로바이더 추상화: 4-Provider 지원 vs 벤더 인터페이스

Claude Code는 **4개의 AI 프로바이더**를 지원하며, AutoBE는 **벤더 추상화 계층**으로 어떤 LLM이든 연결할 수 있다.

### Claude Code의 프로바이더 아키텍처

```typescript
type APIProvider = 'firstParty' | 'bedrock' | 'vertex' | 'foundry';

// Bedrock 특화 처리:
// - 리전 프리픽스: eu.anthropic.claude-sonnet-4-5-v1:0 → eu
// - ARN 기반 모델 ID 추출
// - AWS 자격증명 캐싱 및 갱신
// - HTTP/1.1 강제 (프록시 호환성)
// - Cross-Region Inference Profile 지원

// 메시지 정규화 (normalizeMessagesForAPI):
// 1. 첨부파일 재정렬
// 2. 가상 메시지 필터링
// 3. 에러 기반 블록 제거
// 4. 연속 user 메시지 병합 (Bedrock 제한)
// 5. 도구 참조 필터링
```

### 핵심 차이: 메시지 호환성 vs 스키마 호환성

```
Claude Code:
  메시지 포맷을 프로바이더별로 변환
  → "같은 대화를 다른 API 형식으로 보내기"

AutoBE:
  Function Calling 스키마를 벤더별로 변환
  TypeScript 타입 → JSON Schema → LLM Function Call
  → "같은 함수를 다른 LLM이 호출하게 하기"
```

### 모델 폴백

```typescript
// Claude Code: withRetry.ts — 529 에러 3회 → 자동 폴백
if (is529Error(error) && consecutive529Errors >= MAX_529_RETRIES) {
  throw new FallbackTriggeredError(options.model, options.fallbackModel);
}
// claude-opus-4-6 → claude-sonnet-4-6 자동 전환

// AutoBE: 모델 폴백 대신 동일 모델 재시도에 집중
// 정합성 보증이 특정 모델 성능에 덜 의존하기 때문
```

---

## 42. 파일 히스토리와 파괴적 연산 방어: 안전망의 설계

Claude Code는 파일 편집의 **실행 취소(undo)**를 지원하고, **파괴적 명령어를 사전 감지**한다. AutoBE는 파일 시스템을 직접 조작하지 않으므로 이런 메커니즘이 불필요하다.

### Claude Code의 파일 히스토리: 스냅샷 기반 타임머신

```typescript
// fileHistory.ts (1,116줄)
type FileHistorySnapshot = {
  messageId: UUID,
  trackedFileBackups: Record<string, {
    backupFileName: BackupFileName | null,  // null = 파일 미존재
    version: number,
    backupTime: Date,
  }>,
  timestamp: Date,
};

// 백업 경로: {configDir}/file-history/{sessionId}/{hash}@v{version}
// 동작: 편집 전 백업 → 턴 완료 후 스냅샷 → 되감기 가능
```

### 파괴적 명령어 감지

```typescript
// destructiveCommandWarning.ts
git reset --hard       → "may discard uncommitted changes"
git push --force       → "may overwrite remote history"
rm -rf                 → "may recursively force-remove files"
DROP TABLE             → "may drop or truncate objects"
kubectl delete         → "may delete Kubernetes resources"
terraform destroy      → "may destroy Terraform infrastructure"

// gitSafety.ts — NTFS 8.3 단축명 우회 공격까지 방어
// .git → GIT~1 로 우회 시도 감지
```

### AutoBE는 왜 이것이 불필요한가

AutoBE는 **가상 파일 시스템**에서 작동한다:

```typescript
const files: Record<string, string> = {
  "src/controllers/SaleController.ts": "...",
  "src/providers/postShoppingSales.ts": "...",
};
await compiler.typescript.compile({ files, prisma: client });
```

실제 디스크에 쓰는 것은 **최종 출력 단계** 뿐이다:

- 실행 취소 → 불필요 (이전 상태가 메모리에 있음)
- 파괴적 명령어 → 불가능 (BashTool 없음)
- 파일 백업 → 불필요 (이벤트 소싱으로 상태 재구성 가능)

### 비교: 안전망의 철학

```
Claude Code: "위험한 행동을 감지하고 차단한다"
  → 6중 보안 계층 + 파일 히스토리 + 파괴적 명령 감지
  → 비용: 코드 수천 줄, 디스크 백업, 런타임 오버헤드

AutoBE: "위험한 행동을 원천적으로 불가능하게 한다"
  → 가상 파일 시스템 + 순수 함수 + 이벤트 소싱
  → 비용: 없음 (아키텍처가 안전성을 내장)
```

방화벽을 쌓는 것보다, **불이 날 수 없는 구조를 만드는 것**이 더 안전하다.

---

## 43. 결론: 수렴과 분기

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

그리고 **모델 독립성**이라는 결정적 차이가 있다. Claude Code는 Anthropic의 Claude에 의존한다 (Bedrock/Vertex 지원이 있지만, 핵심은 Claude). AutoBE는 Function Calling Harness 덕분에 **어떤 모델이든** 작동한다—Qwen3 35B에서 6.75%→99.8%, Claude Opus에서는 더 빠르게 수렴할 뿐이다.

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

AutoBE가 백엔드를 통째로 생성한 후, Claude Code에 넘겨서 세밀한 커스터마이징을 하는 시나리오를 상상해보라. 공장에서 찍어낸 제품을 장인이 마감하는 것처럼.

두 프로젝트는 각자의 길을 걸으면서도, 결국 같은 미래를 향해 수렴하고 있다: **AI가 소프트웨어를 만들고, 기계가 그 정합성을 보증하며, 사람은 의도와 판단에 집중하는** 세계.

---

*이 보고서는 Claude Code의 소스코드(512,000줄, npm publish 시 js.map 노출로 공개)와 AutoBE의 오픈소스 코드를 직접 분석하여 작성되었다. 19개의 병렬 분석 에이전트가 양쪽 코드베이스의 모든 핵심 파일—messages.ts(5,800줄), permissions.ts, bashPermissions.ts(1,800줄), gitDiff.ts, gitSafety.ts, analytics/(datadog.ts, firstPartyEventLogger.ts, metadata.ts), sessionTracing.ts, systemPrompt.ts, coordinatorMode.ts, withRetry.ts, compact.ts (Claude Code) 및 AutoBePreliminaryController.ts, executeCachedBatch.ts, validateDatabaseApplication.ts(874줄), AutoBeTypeScriptCompiler.ts, writeRealizeControllers.ts, AutoBeRealizeOperationProgrammer.ts, transformOpenApiDocument.ts, 85개 시스템 프롬프트, 69개 이벤트 타입, 57개 히스토리 트랜스포머, 3개 컴파일러 (AutoBE)—을 읽고 분석한 결과다. 2026년 4월 기준.*
