# @autobe/estimate

A CLI tool that evaluates code quality for AutoBE-generated projects.

## Quick Start

```bash
# 1. Build (한 번만)
cd packages/estimate
npx tsc --build

# 2. .env 설정
cp .env.example .env
# OPENROUTER_API_KEY=sk-or-... (AI agent 사용 시)

# 3. 단일 프로젝트 평가
npx tsx dist/bin/estimate.js -i /path/to/project -o ./reports

# 4. 전체 벤치마크
./run-benchmark.sh
```

## CLI Usage

```bash
npx tsx dist/bin/estimate.js -i <path> -o <path> [options]
```

| Option | Description |
|--------|-------------|
| `-i, --input <path>` | 평가할 프로젝트 경로 (required) |
| `-o, --output <path>` | 리포트 저장 경로 (required) |
| `-v, --verbose` | 상세 로그 출력 |
| `--continue-on-gate-failure` | Gate 실패해도 계속 평가 |
| `--use-agent` | AI agent 평가 활성화 (30% of score) |
| `--provider <provider>` | LLM provider: `claude`, `openai`, `openrouter` |
| `--api-key <key>` | API key (또는 `OPENROUTER_API_KEY` 환경변수) |
| `--auto-fix` | 단순 이슈 자동 수정 (TS1161, TS7006) |
| `--run-tests` | Docker 서버 시작 후 e2e 테스트 실행 |
| `--golden` | Golden Set 평가 |
| `--project <project>` | Golden Set 프로젝트 타입: `todo`, `bbs`, `reddit`, `shopping` |

## Scoring System

### Gate Check (pass/fail)

컴파일이 안 되면 0점:
- **Source file check**: `src/`에 TypeScript 파일이 없으면 즉시 실패 (GATE001)
- **TypeScript compilation**: `AutoBeTypeScriptCompiler` (in-memory)
- **Prisma schema validation**: `AutoBeDatabaseCompiler` (in-memory)

### Scoring Phases (70% of total)

| Phase | Weight | What we check |
|-------|--------|---------------|
| Document Quality | 10% | `docs/analysis/` 존재 여부, README |
| Requirements Coverage | 25% | Controllers, providers, DTOs 존재 |
| Test Coverage | 30% | 테스트 수, assertion quality, stub 감지 |
| Logic Completeness | 25% | TODOs, FIXMEs, empty methods, stub returns |
| API Completeness | 10% | Endpoint 구현, provider delegation |

### Penalties (점수 차감)

| Penalty | Trigger | Max Deduction |
|---------|---------|---------------|
| Warning | Warning ratio > 50% | -10 |
| Duplication | > 50 duplicate blocks | -5 |
| JSDoc | > 10% missing | -5 |
| Schema Sync (SYNC001) | > 5 empty types in DTOs | -5 |
| Schema Sync (SYNC002) | >= 3 Prisma ↔ Structure mismatches | -5 |
| Mapping ratio (REQ006) | < 50% controller-provider coverage | -40 |

### Reference Info (점수 영향 없음)

- **Complexity**: cyclomatic complexity > 15인 함수
- **Duplication**: 10줄 이상 중복 블록
- **Naming**: PascalCase 위반
- **JSDoc**: 누락된 문서 주석
- **Schema Sync**: 빈 인터페이스(SYNC001) + Prisma ↔ Structure 매핑 불일치(SYNC002)

### AI Agent Evaluation (30% of total)

`--use-agent` 플래그로 활성화:

- **SecurityAgent**: OWASP Top 10 기반 보안 분석
- **LLMQualityAgent**: hallucination, 불완전 구현, 로직 오류 감지

### Scoring Formula

```
Raw Phase Score = Σ(phase_score × phase_weight)
Penalties       = warning + duplication + jsdoc + schemaSync + mapping (max ~65)
Adjusted Phase  = Raw Phase - Penalties

Without agents:  Final Score = Adjusted Phase (100%)
With agents:     Final Score = (Adjusted Phase × 70%) + (Agent Average × 30%)
```

## Grading

| Grade | Score | Meaning |
|-------|-------|---------|
| A | 90-100 | Production ready |
| B | 80-89 | Minor improvements needed |
| C | 70-79 | Several issues to address |
| D | 60-69 | Significant problems |
| F | 0-59 | Major issues or gate failure |

## Benchmarking

전체 모델 × 프로젝트 벤치마크:

```bash
cd packages/estimate

# Scoring only (LLM 호출 없음, 빠름)
./run-benchmark.sh

# With AI agents (OPENROUTER_API_KEY 필요)
./run-benchmark.sh agent

# Full mode (agents + runtime tests + golden set)
./run-benchmark.sh full
```

결과: `reports/benchmark/<model>/<project>/`

### Compare

여러 프로젝트 비교:

```bash
npx tsx dist/bin/estimate.js compare \
  -p "model-a:/path/to/a" "model-b:/path/to/b" \
  -o ./reports/comparison
```

## Environment Variables

`.env` 파일 (packages/estimate/):

```bash
OPENROUTER_API_KEY=sk-or-...

# Optional: Langfuse telemetry
LANGFUSE_PUBLIC_KEY=pk-lf-...
LANGFUSE_SECRET_KEY=sk-lf-...
LANGFUSE_HOST=https://cloud.langfuse.com
```

## Output

- `estimate-report.md` — 사람이 읽는 요약
- `estimate-report.json` — CI/CD용 기계 판독

## Sample Output

```
📋 Scoring Phases (70% of total score):
─────────────────────────────────────────
   Gate:                    ✅ Pass
   Document Quality         100/100 ✅
   Requirements Coverage    90/100 ✅
   Test Coverage            61/100 ⚠️
   Logic Completeness       100/100 ✅
   API Completeness         100/100 ✅
─────────────────────────────────────────

📋 Reference Info (no score impact):
─────────────────────────────────────────
   Complexity:    2 complex functions (max: 22)
   Duplication:   102 duplicate blocks
   Naming:        0 issues
   JSDoc:         36 missing
   Schema Sync:   0/35 empty types, 0 mismatched
─────────────────────────────────────────

📊 Final Score: 85/100 (Grade: B)
```

## Troubleshooting

**Gate keeps failing**
- `--continue-on-gate-failure`로 전체 이슈 확인
- Gate는 in-memory 컴파일러 사용 — `@nestjs/common` 같은 외부 모듈 미해결은 정상

**AI agent errors**
- API key 확인
- OpenRouter 모델 ID 형식: `provider/model-name`
- Rate limit 시 자동 재시도

**빌드 안 됨**
- `npx tsc --build` 먼저 실행
- `dist/` 디렉토리가 있는지 확인

## License

AGPL-3.0
