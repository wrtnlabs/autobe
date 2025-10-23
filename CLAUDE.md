# AutoBE Project Context for Claude

## 1. What is AutoBE?

AutoBE는 자연어 요구사항으로부터 운영 준비가 완료된 백엔드 애플리케이션을 자동 생성하는 AI 기반 노코드 시스템이다. 사용자는 채팅 인터페이스를 통해 자연어로 백엔드 요구사항을 설명하고, AutoBE는 완전한 TypeScript + NestJS + Prisma 기반의 백엔드 애플리케이션을 생성한다.

**핵심 특징**:
- 100% 컴파일 보장
- 완전한 타입 안정성
- 포괄적인 문서화 (ERD, OpenAPI, API docs)
- 강력한 E2E 테스트
- 클린 구현 로직

**생성되는 산출물**:
요구사항 분석 보고서 → 데이터베이스 스키마 (Prisma) → API 명세 (OpenAPI) → E2E 테스트 → API 구현 → 타입 안전 SDK

## 2. Core Concepts

AutoBE를 이해하는 세 가지 핵심 개념:

**Waterfall + Spiral**: Requirements → Analyze → Prisma → Interface → Test → Realize의 5단계를 순차 진행하며, 각 단계는 40개 이상의 전문화된 AI 에이전트가 협업 처리한다.

**Compiler-Driven Development**: AutoBE Prisma Compiler → AutoBE OpenAPI Compiler → TypeScript Compiler의 3단계 검증을 거쳐 100% 컴파일을 보장한다.

**Vibe Coding**: 대화가 곧 소프트웨어가 된다. 대화 → 요구사항 → AST → 코드 → 애플리케이션의 자동 변환 파이프라인.

자세한 내용은 [아키텍처 문서](.ai/ARCHITECTURE.md)를 참조하라.

## 3. Documentation Index

상세 문서는 주제별로 분리되어 있다. 작업 시 관련 문서를 반드시 참조하라.

### Architecture & Design
- **[전체 아키텍처](.ai/ARCHITECTURE.md)** - Waterfall+Spiral, 3단계 컴파일러, Vibe Coding 상세
- **[AST 설계](.ai/AST_DESIGN.md)** - 간소화된 AST 설계 철학

### Agent System (`@autobe/agent`)
- **[Agent 시스템](.ai/AGENT_SYSTEM.md)** - 에이전트 시스템 구조와 철학
- **[Orchestration](.ai/AGENT_ORCHESTRATION.md)** - 계층적 오케스트레이션, 자기 치유 메커니즘
- **[System Prompts](.ai/AGENT_SYSTEM_PROMPTS.md)** - 프롬프트 설계 및 편집 가이드 ⭐ 가장 중요!
- **[Tools](.ai/AGENT_TOOLS.md)** - Function Calling 도구 설계
- **[Histories](.ai/AGENT_HISTORIES.md)** - 컨텍스트 최적화와 Prompt Caching

### Compiler System (`@autobe/compiler`)
- **[Compiler 시스템](.ai/COMPILER_SYSTEM.md)** - 컴파일러 철학과 3단계 검증 시스템

### Frontend & UI (`@autobe/ui`, Website, Apps)
- **[Frontend 시스템](.ai/FRONTEND_SYSTEM.md)** - UI 컴포넌트, 실시간 통신, 세션 관리, UX 원칙

### Type System & Communication
- **[RPC 시스템](.ai/RPC_SYSTEM.md)** - WebSocket 기반 타입 안전 RPC 통신

### Development & Best Practices
- **[개발 가이드](.ai/DEVELOPMENT_GUIDE.md)** - 새 기능 추가, 디버깅, 코드 탐색
- **[Best Practices](.ai/BEST_PRACTICES.md)** - System Prompt 편집, 성능 최적화, 문제 해결

## 4. Quick Start for Claude Code

### 첫 작업 시작 전
1. [아키텍처](.ai/ARCHITECTURE.md) 읽기 - 시스템 동작 원리 이해
2. [Agent 시스템](.ai/AGENT_SYSTEM.md) 읽기 - 에이전트 구조 파악
3. 작업 관련 패키지의 개요 문서 읽기

### System Prompt 편집 시 (가장 중요!)
**절대 원칙**: 사용자의 지시사항은 절대적이다. Claude Code는 자신의 판단으로 사용자 명령을 수정, 축소, 생략해서는 안 된다.

1. **[System Prompts 가이드](.ai/AGENT_SYSTEM_PROMPTS.md)** 정독
2. 편집 대상 프롬프트 파일 완전히 읽고 이해
3. 관련 Orchestrator, Tool, History 코드 참조
4. 기존 스토리라인에 자연스럽게 통합하여 수정

### 새 기능 추가 시
1. [개발 가이드](.ai/DEVELOPMENT_GUIDE.md) 참조
2. 기존 유사 기능 분석
3. 관련 문서들을 참조하며 구현

### 디버깅 시
1. [Best Practices](.ai/BEST_PRACTICES.md)의 디버깅 섹션 참조
2. 이벤트 로그와 컴파일러 오류 분석
3. 관련 Orchestrator와 System Prompt 검토

## 5. Absolute Rules for Claude Code

### 사용자 명령의 절대성
사용자의 지시사항은 절대적이다. 명령이 불명확하면 질문하되, 명확한 명령은 무조건 이행한다.

### System Prompt 편집의 중요성
System Prompt 편집은 AutoBE 개발에서 가장 중요하고 민감한 작업이다. 반드시 [System Prompts 가이드](.ai/AGENT_SYSTEM_PROMPTS.md)를 정독한 후 작업한다.

### 빌드 시스템 주의
`packages/agent/src/constants/AutoBeSystemPromptConstant.ts`는 자동 생성 파일이다. 직접 편집하지 말고, `packages/agent/prompts/*.md` 원본을 편집한 후 `pnpm run build:prompt`를 실행한다.

## 6. Repository Information

- Repository: https://github.com/wrtnlabs/autobe
- Documentation: https://autobe.dev/docs/
- Main Branch: `main`
- License: AGPL 3.0
- Discord: https://discord.gg/aMhRmzkqCx

---

**Last Updated**: 2025-10-23
**Version**: 2.0.0

이 문서는 Claude Code가 AutoBE 프로젝트를 이해하고 효과적으로 작업할 수 있도록 작성되었다. 각 주제별 상세 문서를 참조하여 깊이 있는 이해를 바탕으로 작업하라.
