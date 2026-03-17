# playground-server 리라이트 계획: SQLite 기반 전체 DB 영속화

## 배경

현재 playground-server는 완전히 stateless(DB 없음, 메모리 전용). hackathon-server의 영속화 기능을 SQLite 기반 로컬/개인용으로 재구현해야 함. 인증 불필요. 벤더 관리(암호화된 API 키 포함) 필수. 각 세션이 어떤 벤더로 진행되었는지 추적 필수.

---

## 1. 새 인터페이스 타입 (`packages/interface/src/playground/`)

### `IAutoBePlaygroundStoredVendor.ts` (신규)
```typescript
export interface IAutoBePlaygroundStoredVendor {
  id: string;            // UUID
  name: string;          // 사람이 읽을 수 있는 라벨 ("My OpenAI", "로컬 Ollama")
  model: string;         // "gpt-4.1", "claude-3-sonnet" 등
  baseURL: string | null;
  semaphore: number;     // 기본값 16
  created_at: string;    // ISO datetime
}
export namespace IAutoBePlaygroundStoredVendor {
  export interface ICreate {
    name: string;
    model: string;
    apiKey: string;       // 평문으로 보내면 서버가 암호화하여 저장
    baseURL?: string | null;
    semaphore?: number;
  }
  export interface IUpdate {
    name?: string;
    model?: string;
    apiKey?: string;      // 선택사항, 제공 시 재암호화
    baseURL?: string | null;
    semaphore?: number;
  }
}
```

### `IAutoBePlaygroundSession.ts` (신규)
`IAutoBeHackathonSession`을 기반으로 하되 participant/hackathon 제거:
```typescript
export interface IAutoBePlaygroundSession extends IAutoBePlaygroundSession.ISummary {
  histories: AutoBeHistory[];
  event_snapshots: AutoBeEventSnapshot[];
}
export namespace IAutoBePlaygroundSession {
  export interface ISummary {
    id: string;
    vendor: IAutoBePlaygroundStoredVendor;  // 사용된 벤더 설정
    title: string | null;
    locale: string;
    timezone: string;
    phase: AutoBePhase | null;
    token_usage: IAutoBeTokenUsageJson;
    created_at: string;   // ISO datetime
    completed_at: string | null;
  }
  export interface ICreate {
    vendor_id: string;    // 저장된 벤더 참조
    locale: string;
    timezone: string;
    title?: string | null;
  }
  export interface IUpdate {
    title: string | null;
  }
}
```

`packages/interface/src/playground/index.ts`에서 export 추가.

---

## 2. Prisma 스키마 (`apps/playground-server/prisma/schema/main.prisma`)

```prisma
datasource db {
  provider = "sqlite"
  url      = env("PLAYGROUND_DATABASE_URL")
}

generator client {
  provider     = "prisma-client"
  output       = "../../src/prisma"
  moduleFormat = "cjs"
}

model autobe_playground_vendors {
  id                String    @id
  name              String
  model             String
  encrypted_api_key String    // AES-256-GCM 암호화
  base_url          String?
  semaphore         Int       @default(16)
  created_at        DateTime
  deleted_at        DateTime?

  sessions autobe_playground_sessions[]
  @@index([created_at])
}

model autobe_playground_sessions {
  id                          String    @id
  autobe_playground_vendor_id String
  locale                      String
  timezone                    String
  title                       String?
  created_at                  DateTime
  completed_at                DateTime?
  deleted_at                  DateTime?

  vendor      autobe_playground_vendors              @relation(fields: [autobe_playground_vendor_id], references: [id])
  connections autobe_playground_session_connections[]
  histories   autobe_playground_session_histories[]
  events      autobe_playground_session_events[]
  aggregate   autobe_playground_session_aggregates?

  @@index([autobe_playground_vendor_id, created_at])
}

model autobe_playground_session_connections {
  id                           String    @id
  autobe_playground_session_id String
  created_at                   DateTime
  disconnected_at              DateTime?

  session    autobe_playground_sessions              @relation(fields: [autobe_playground_session_id], references: [id], onDelete: Cascade)
  histories  autobe_playground_session_histories[]
  events     autobe_playground_session_events[]

  @@index([autobe_playground_session_id, created_at])
}

model autobe_playground_session_histories {
  id                                      String   @id
  autobe_playground_session_id            String
  autobe_playground_session_connection_id String
  type                                    String
  data                                    String   // JSON
  created_at                              DateTime

  session    autobe_playground_sessions             @relation(fields: [autobe_playground_session_id], references: [id], onDelete: Cascade)
  connection autobe_playground_session_connections   @relation(fields: [autobe_playground_session_connection_id], references: [id], onDelete: Cascade)

  @@index([autobe_playground_session_id, created_at])
  @@index([autobe_playground_session_connection_id, created_at])
}

model autobe_playground_session_events {
  id                                      String   @id
  autobe_playground_session_id            String
  autobe_playground_session_connection_id String
  type                                    String
  data                                    String   // JSON
  created_at                              DateTime

  session    autobe_playground_sessions             @relation(fields: [autobe_playground_session_id], references: [id], onDelete: Cascade)
  connection autobe_playground_session_connections   @relation(fields: [autobe_playground_session_connection_id], references: [id], onDelete: Cascade)

  @@index([autobe_playground_session_id, created_at])
  @@index([autobe_playground_session_connection_id, created_at])
}

model autobe_playground_session_aggregates {
  id                           String  @id
  autobe_playground_session_id String  @unique
  phase                        String?
  enabled                      Boolean
  token_usage                  String  // JSON

  session autobe_playground_sessions @relation(fields: [autobe_playground_session_id], references: [id], onDelete: Cascade)
}
```

---

## 3. 소스 파일 구조 (`apps/playground-server/src/`)

### 핵심 인프라

| 파일 | 기반 | 용도 |
|------|------|------|
| `AutoBePlaygroundConfiguration.ts` | `AutoBeHackathonConfiguration.ts` | 환경설정 (포트, 컴파일러 수, 암호화 키, DB URL) |
| `AutoBePlaygroundGlobal.ts` | `AutoBeHackathonGlobal.ts` | Prisma 싱글톤 (SQLite, 어댑터 불필요) |
| `AutoBePlaygroundModule.ts` | 재작성 | 새 컨트롤러 등록 |
| `AutoBePlaygroundServer.ts` | 재작성 | 설정에서 포트 읽기 |

### 컨트롤러

| 파일 | 기반 | 용도 |
|------|------|------|
| `controllers/HealthCheckController.ts` | 기존 유지 | 헬스체크 |
| `controllers/AutoBePlaygroundVendorController.ts` | 신규 | 벤더 CRUD REST API |
| `controllers/AutoBePlaygroundSessionController.ts` | 해커톤 참가자 세션 컨트롤러 | 세션 CRUD REST API (인증 데코레이터 없음) |
| `controllers/AutoBePlaygroundSessionSocketController.ts` | 해커톤 참가자 세션 소켓 컨트롤러 | WS connect/replay |

### 프로바이더

| 파일 | 기반 | 용도 |
|------|------|------|
| `providers/AutoBePlaygroundVendorProvider.ts` | 신규 | 벤더 CRUD + API 키 암호화/복호화 |
| `providers/sessions/AutoBePlaygroundSessionProvider.ts` | `AutoBeHackathonSessionProvider.ts` | 세션 CRUD (hackathon/participant 없음, 모델 제한 없음) |
| `providers/sessions/AutoBePlaygroundSessionConnectionProvider.ts` | `AutoBeHackathonSessionConnectionProvider.ts` | 연결 추적 |
| `providers/sessions/AutoBePlaygroundSessionEventProvider.ts` | `AutoBeHackathonSessionEventProvider.ts` | 이벤트 영속화 |
| `providers/sessions/AutoBePlaygroundSessionHistoryProvider.ts` | `AutoBeHackathonSessionHistoryProvider.ts` | 히스토리 영속화 |
| `providers/sessions/AutoBePlaygroundSessionSocketProvider.ts` | `AutoBeHackathonSessionSocketProvider.ts` | WS 오케스트레이션 (인증 없이 세션만 조회) |
| `providers/sessions/acceptors/AutoBePlaygroundSessionSocketAcceptor.ts` | `AutoBeHackathonSessionSocketAcceptor.ts` | 핵심 WS 로직 (connect, replay) |
| `providers/sessions/acceptors/AutoBePlaygroundSessionCompiler.ts` | `AutoBeHackathonSessionCompiler.ts` | 컴파일러 워커 풀 |

### 유틸리티

| 파일 | 기반 | 용도 |
|------|------|------|
| `utils/PaginationUtil.ts` | 해커톤에서 복사 | 페이지네이션 유틸 |
| `utils/CryptoUtil.ts` | 신규 | AES-256-GCM API 키 암호화/복호화 |
| `structures/IEntity.ts` | 해커톤에서 복사 | `{ id: string }` 베이스 인터페이스 |

### 실행파일

| 파일 | 기반 | 용도 |
|------|------|------|
| `executable/server.ts` | 재작성 | 설정 사용 |
| `executable/compiler.ts` | 기존 유지 | 컴파일러 워커 |
| `executable/schema.ts` | 신규 | SQLite 마이그레이션 셋업 |

---

## 4. 삭제할 파일

- `src/controllers/AutoBePlaygroundController.ts` → 세션 소켓 컨트롤러로 대체
- `src/controllers/AutoBePlaygroundReplayController.ts` → 세션 소켓 replay로 대체
- `src/providers/AutoBePlaygroundProvider.ts` → 세션 프로바이더들로 대체
- `src/providers/AutoBePlaygroundAcceptor.ts` → acceptor로 대체
- `src/providers/AutoBePlaygroundReplayProvider.ts` → DB 기반 replay로 대체

---

## 5. REST API 엔드포인트

### 벤더 CRUD (`/autobe/playground/vendors`)
| 메서드 | 경로 | Body | 응답 | 용도 |
|--------|------|------|------|------|
| `POST` | `/` | `ICreate` | `IAutoBePlaygroundStoredVendor` | 벤더 생성 |
| `PATCH` | `/` | `IPage.IRequest` | `IPage<IAutoBePlaygroundStoredVendor>` | 벤더 목록 (페이지네이션) |
| `GET` | `/:id` | - | `IAutoBePlaygroundStoredVendor` | 벤더 조회 |
| `PUT` | `/:id` | `IUpdate` | - | 벤더 수정 |
| `DELETE` | `/:id` | - | - | 소프트 삭제 |

**주의**: API 키는 응답에 **절대 포함되지 않음**.

### 세션 CRUD (`/autobe/playground/sessions`)
| 메서드 | 경로 | Body | 응답 | 용도 |
|--------|------|------|------|------|
| `POST` | `/` | `ICreate` | `IAutoBePlaygroundSession` | 세션 생성 |
| `PATCH` | `/` | `IPage.IRequest` | `IPage<ISummary>` | 세션 목록 |
| `GET` | `/:id` | - | `IAutoBePlaygroundSession` | 세션 상세 조회 |
| `PUT` | `/:id` | `IUpdate` | - | 제목 수정 |
| `DELETE` | `/:id` | - | - | 소프트 삭제 |

### 세션 WebSocket (`/autobe/playground/sessions`)
| 메서드 | 경로 | Header | 용도 |
|--------|------|--------|------|
| `WS` | `/:id/connect` | (없음) | 라이브 에이전트 세션 |
| `WS` | `/:id/replay` | (없음) | 세션 이벤트 재생 |

---

## 6. API 키 암호화 (`utils/CryptoUtil.ts`)

Node.js 내장 `crypto` 모듈, AES-256-GCM 사용:
```typescript
export namespace CryptoUtil {
  // 키 출처: 환경변수 PLAYGROUND_ENCRYPTION_KEY (32바이트 hex)
  export const encrypt = (plaintext: string): string => { ... }
  export const decrypt = (ciphertext: string): string => { ... }
}
```
- `iv:authTag:ciphertext` 형식으로 저장 (모두 base64)
- `PLAYGROUND_ENCRYPTION_KEY` 환경변수에서 키 로드

---

## 7. 환경설정 (`AutoBePlaygroundConfiguration.ts`)

```typescript
interface IEnvironments {
  PLAYGROUND_API_PORT: `${number}`;           // 기본값 5890
  PLAYGROUND_COMPILERS: `${number}`;          // 컴파일러 워커 풀 크기
  PLAYGROUND_TIMEOUT?: `${number}` | "NULL";
  PLAYGROUND_DATABASE_URL: string;            // "file:./autobe-playground.db"
  PLAYGROUND_ENCRYPTION_KEY: string;          // AES-256용 32바이트 hex 키
}
```

---

## 8. WebSocket 흐름 (connect)

1. 클라이언트가 REST `POST /autobe/playground/sessions`로 세션 생성 (vendor_id 참조)
2. 클라이언트가 WS `/autobe/playground/sessions/:id/connect`로 접속
3. 서버가 세션 + 벤더 조회 (API 키 복호화)
4. connection 레코드 생성
5. 히스토리가 있으면 → 과거 이벤트 재생, 새 이벤트 폴링 (2.5초 간격)
6. 복호화된 벤더 설정으로 AutoBeAgent 생성
7. 이벤트 리스너 등록 → DB 영속화
8. RPC 연결 수락
9. 대화 완료 시 → 히스토리 저장, enabled=true 설정

---

## 9. 추가할 의존성 (`package.json`)

```json
"uuid": "...",
"dotenv": "...",
"dotenv-expand": "...",
"@nestia/e2e": "..."    // ArrayUtil, RandomGenerator용
```

Prisma는 SQLite 네이티브 프로바이더 사용 (별도 어댑터 불필요).

---

## 10. 구현 순서

1. **인터페이스 타입** — `IAutoBePlaygroundStoredVendor`, `IAutoBePlaygroundSession` (`packages/interface/src/playground/`)
2. **Prisma 스키마** — `apps/playground-server/prisma/schema/main.prisma`
3. **인프라** — Configuration, Global, CryptoUtil, PaginationUtil, IEntity
4. **벤더 프로바이더 + 컨트롤러** — 암호화 포함 CRUD
5. **세션 프로바이더 + 컨트롤러** — REST CRUD
6. **세션 하위 프로바이더** — Connection, Event, History 프로바이더
7. **소켓 acceptor + 컴파일러** — 핵심 WS 로직
8. **소켓 프로바이더 + 컨트롤러** — WS 오케스트레이션
9. **Module + Server 재작성** — 전부 와이어링
10. **기존 파일 삭제** — 대체된 컨트롤러/프로바이더 제거
11. **실행파일** — server.ts, schema.ts 업데이트

---

## 11. 설계 결정 사항

- **벤더 삭제**: Soft delete만 사용 (벤더, 세션 모두). Cascade도 Restrict도 아님. 일관된 패턴.
- **Simulate**: 제외. `connect`와 `replay` WS 엔드포인트만. 개인용이니 심플하게.
- **Report**: 제외. 개인 playground에 불필요.
- **Review 시스템**: 제외. `review_article_url`, `completed_at` 로직 없음.

---

## 12. hackathon-server와 주요 차이점

| 항목 | hackathon-server | playground-server |
|------|-----------------|-------------------|
| DB | PostgreSQL + `@prisma/adapter-pg` | SQLite (Prisma 네이티브) |
| 인증 | JWT + bcrypt | 없음 |
| Hackathon/Participant | 모든 쿼리에 필수 | 완전 제거 |
| 벤더 | 환경변수에 하드코딩 (OPENAI_API_KEY 등) | DB 저장 + 암호화된 키 |
| 모델 제한 | 모델별 10/3/1 제한 | 없음 |
| Review 시스템 | review_article_url + completed_at | 제거 |
| Simulate | 벤치마크에서 MockAgent | 제거 (심플하게) |
| 시딩 | CSV 참가자 + 예제 세션 | 불필요 |
| 리포트 | 마크다운 리포트 생성기 | 제거 |
| 세션 locale | "en-US" 하드코딩 | 세션별 저장 |

---

## 13. 검증

1. `pnpm run build` — TypeScript 컴파일 통과
2. `.env` 생성: `PLAYGROUND_DATABASE_URL`, `PLAYGROUND_ENCRYPTION_KEY`, `PLAYGROUND_API_PORT`, `PLAYGROUND_COMPILERS`
3. `ts-node src/executable/schema.ts` 실행 → SQLite DB 생성 + 마이그레이션
4. 서버 시작: `ts-node src/executable/server.ts`
5. REST로 벤더 CRUD 테스트
6. REST로 세션 생성 테스트
7. tgrid 클라이언트로 WebSocket connect 테스트
8. SQLite에 이벤트/히스토리 영속화 확인
9. replay WS 테스트
10. `nestia sdk` 실행하여 playground-api 재생성 (`src/api/functional`은 **절대 수동 편집 금지**)
