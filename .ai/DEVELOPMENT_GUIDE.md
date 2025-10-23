# Development Guide

## Getting Started

AutoBE는 모노레포 구조로, pnpm workspace를 사용한다.

### Repository Setup

```bash
git clone https://github.com/wrtnlabs/autobe
cd autobe
pnpm install
pnpm run build
```

### Running in Development

```bash
# Backend 개발 서버 실행
cd packages/backend
pnpm run dev

# Frontend는 별도 저장소에 있음
```

## Project Structure

```
autobe/
├── packages/
│   ├── agent/          # AI 에이전트 시스템
│   ├── compiler/       # 3단계 컴파일러
│   ├── interface/      # 타입 정의
│   ├── backend/        # WebSocket RPC 서버
│   └── utils/          # 공통 유틸리티
├── .ai/                # Claude Code 문서 (이 폴더!)
└── CLAUDE.md           # 프로젝트 개요 (당신이 읽고 있는 문서의 인덱스)
```

## Adding New Features

### 1. 새 에이전트 추가

새로운 파이프라인 단계나 에이전트를 추가하려면:

1. `packages/agent/prompts/`에 새 System Prompt 마크다운 파일 작성
2. `packages/agent/src/orchestrate/`에 새 Orchestrator 함수 작성
3. History Transformer 작성 또는 수정
4. Tool 정의 추가 (필요한 경우)
5. `@autobe/interface`에 이벤트 타입 추가
6. 빌드 후 테스트: `pnpm run build:prompt && pnpm run build`

### 2. System Prompt 수정

**절대 원칙**: 사용자의 지시사항은 절대적이다. 명령이 불명확하면 질문하되, 명확한 명령은 무조건 이행한다.

System Prompt 수정은 매우 민감한 작업이다. 반드시 [AGENT_SYSTEM_PROMPTS.md](AGENT_SYSTEM_PROMPTS.md)를 정독한 후 작업한다.

1. 대상 프롬프트 파일 (`packages/agent/prompts/*.md`) 완전히 읽기
2. 관련 Orchestrator, Tool, History 코드 참조
3. 기존 스토리라인에 자연스럽게 통합하여 수정
4. `pnpm run build:prompt` 실행하여 `AutoBeSystemPromptConstant.ts` 생성
5. 실제 파이프라인 실행하여 검증

**중요**: `packages/agent/src/constants/AutoBeSystemPromptConstant.ts`는 자동 생성 파일이다. 직접 편집하지 말고, 원본 `.md` 파일을 수정한 후 빌드한다.

### 3. 컴파일러 확장

새로운 검증 규칙을 추가하려면:

1. `packages/compiler/src/` 해당 컴파일러 코드 수정
2. 진단 메시지 타입을 `@autobe/interface`에 추가
3. Orchestrator에서 새 진단 정보를 처리하도록 수정
4. 테스트 작성 및 검증

### 4. 타입 추가

`@autobe/interface`에 새 타입을 추가하면:

1. 모든 의존 패키지가 영향을 받음
2. 컴파일 오류를 모두 해결해야 함
3. Breaking change는 신중히 진행

## Debugging

### 이벤트 로그 분석

모든 이벤트는 로그에 기록된다. 문제 발생 시 이벤트 로그를 추적하여 어떤 에이전트가 언제 실패했는지 파악한다.

### 컴파일러 오류 추적

컴파일 오류 발생 시:
1. 어떤 파일에서 오류가 발생했는지 확인
2. 해당 파일을 생성한 에이전트 식별
3. 에이전트의 System Prompt와 History 검토
4. 필요하면 프롬프트 수정

### LLM 응답 디버깅

LLM 응답이 이상하면:
1. System Prompt가 명확한지 확인
2. History에 필요한 컨텍스트가 모두 있는지 확인
3. Tool 스키마가 정확한지 확인
4. 프롬프트에 예시를 추가하여 개선

## Testing

### Unit Tests

각 패키지는 독립적으로 테스트 가능하다:

```bash
cd packages/agent
pnpm test
```

### Integration Tests

전체 파이프라인을 테스트하려면:

```bash
pnpm run test:e2e
```

### Manual Testing

실제 요구사항으로 파이프라인을 실행하여 결과를 확인한다. 생성된 코드가 컴파일되는지, 테스트를 통과하는지 검증한다.

## Code Exploration

### 특정 기능 찾기

파일 이름이나 함수 이름으로 검색:
```bash
# Realize Write Orchestrator 찾기
rg "orchestrateRealizeWrite"

# System Prompt 찾기
ls packages/agent/prompts/REALIZE_WRITE.md
```

### 타입 정의 추적

`@autobe/interface`에서 타입을 찾고, "Find References"로 사용처를 추적한다. TypeScript의 타입 시스템이 모든 의존성을 추적해준다.

### 이벤트 흐름 추적

특정 이벤트 타입을 검색하여 발행 위치와 구독 위치를 파악한다. 이벤트 소싱 패턴 덕분에 데이터 흐름이 명확하다.

## Best Practices

- System Prompt 수정은 신중하게, 테스트 후 커밋
- 타입 변경은 모든 의존 패키지 컴파일 확인 후 커밋
- 새 기능은 작게 시작하여 점진적으로 확장
- 문서를 최신 상태로 유지 (특히 이 `.ai/` 폴더!)
- 커밋 메시지는 명확하게 작성

## Common Issues

### Prompt 빌드 오류

`pnpm run build:prompt` 실패 시 `.md` 파일의 문법을 확인한다. 특히 코드 블록이 올바르게 닫혀있는지 확인한다.

### 컴파일러 타임아웃

컴파일이 너무 오래 걸리면 Incremental Compilation이 제대로 작동하는지 확인한다. 전체 재컴파일이 반복되는지 로그를 확인한다.

### LLM API 오류

Rate limit이나 타임아웃 발생 시 재시도 로직이 작동한다. API 키와 할당량을 확인한다.

## Contributing

기여 전에 Discord에서 논의를 권장한다: https://discord.gg/aMhRmzkqCx

Pull Request는 명확한 설명과 함께 제출하며, 모든 테스트를 통과해야 한다.

## Documentation

코드 변경 시 관련 문서도 업데이트한다:
- System Prompt 변경 → `AGENT_SYSTEM_PROMPTS.md` 업데이트
- 아키텍처 변경 → `ARCHITECTURE.md` 업데이트
- 새 기능 추가 → `DEVELOPMENT_GUIDE.md`와 `CLAUDE.md` 업데이트

AutoBE는 문서와 코드가 일치하는 것을 중요하게 생각한다. 특히 Claude Code가 참조하는 이 `.ai/` 폴더의 문서는 항상 최신 상태를 유지해야 한다.
