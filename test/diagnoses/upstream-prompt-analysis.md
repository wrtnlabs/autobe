# 상류 프롬프트 분석 — Database 및 Interface 단계

이 문서는 메인 보고서 섹션 9를 뒷받침하는 프롬프트별 상세 분석을 제공한다.

---

## Database 프롬프트 (7개)

7개 database 프롬프트 모두 순수하게 DB에 집중한다. 설계 결정이 API 레이어에 미치는 영향을 고려하는 프롬프트는 없다. 이는 의도된 설계(워터폴 파이프라인)이나, 정규화 패턴(스냅샷, 서브타입, 구체화 뷰)에 대한 결정이 API 소비에 대한 전방 탐색 가이드 없이 이루어짐을 의미한다.

| 프롬프트 | 생성물 | DB-API 가이드 |
|---------|--------|-------------|
| DATABASE_SCHEMA.md | 단일 Prisma 테이블 모델 | 없음 |
| DATABASE_COMPONENT.md | 테이블명 + 설명 | 없음 |
| DATABASE_GROUP.md | 컴포넌트 스켈레톤 | 없음 |
| DATABASE_CORRECT.md | 수정된 모델 | 없음 |
| DATABASE_SCHEMA_REVIEW.md | 검토된 테이블 모델 | 없음 |
| DATABASE_COMPONENT_REVIEW.md | 리비전 연산 | 없음 |
| DATABASE_GROUP_REVIEW.md | 그룹 스켈레톤 리비전 | 없음 |

---

## Interface 프롬프트 (13개)

### 핵심 DB-API 연결 프롬프트

**INTERFACE_SCHEMA.md** — 가장 포괄적인 DB-API 연결 프롬프트:
- FK-to-DTO 변환 규칙 (§2.3): BelongsTo → `$ref`로 `.ISummary`, HasMany → 중첩 배열, Aggregation → count만
- "제로 유령 필드" 규칙 (§3.1): 모든 프로퍼티가 DB 스키마에 존재해야 함 (예외: sort, search, page, limit, *_count)
- Nullable 처리 (§3.2): DB NOT NULL → 필수, DB nullable → null과의 `oneOf`
- **갭**: DTO 프로퍼티가 실제로 테이블 컬럼과 일치하는지 검증하는 메커니즘 없음. LLM 판단에 의존.
- **갭**: 스냅샷 테이블 처리 가이드 없음
- **갭**: composition 깊이 제한 없음

**INTERFACE_SCHEMA_REFINE.md** — DB-API 정합성을 위한 두 번째로 중요한 프롬프트:
- FK 변환 (§4.3): 응답 DTO: FK → `$ref` 객체. 요청 DTO: FK를 스칼라로 유지.
- 계산 필드 (§4.2): 페이지네이션, 세션, 집계, 인증에 대해 `databaseSchemaProperty: null`
- Nullable 규칙 (§4.1): DB nullable → DTO non-null은 금지됨
- DB 타입 매핑 테이블: String→string, Int→integer, BigInt→string, DateTime→string(date-time) 등
- **갭**: `specification` 필드에 Prisma include 패턴 가이드 없음
- **갭**: 릴레이션 해석 깊이 가이드 없음

**INTERFACE_SCHEMA_REVIEW.md** — 스키마 품질 검증:
- 원자적 연산 원칙: 읽기-쓰기 대칭성
- 순환 참조 제거
- Detail vs Summary DTO 규칙
- **갭**: Refine과 동일 — Prisma include 패턴 없음, 깊이 제한 없음

### 지원 프롬프트

| 프롬프트 | 핵심 DB-API 기능 | 갭 |
|---------|----------------|-----|
| INTERFACE_OPERATION.md | 스키마 검증 규칙 (§5.2), stance 기반 연산 | `specification`에 Prisma include 패턴 가이드 없음 |
| INTERFACE_GROUP.md | `databaseSchemas` 배열로 DB 그룹 → API 그룹 매핑 | 그룹 간 릴레이션 처리 없음 |
| INTERFACE_PREREQUISITE.md | 연산 순서를 위한 FK 분석 | 없음 (순서화만) |
| INTERFACE_SCHEMA_COMPLEMENT.md | INTERFACE_SCHEMA 규칙 따라야 함 | INTERFACE_SCHEMA와 동일 갭 |
| INTERFACE_SCHEMA_RENAME.md | 테이블명에서 DTO 네이밍 | 없음 (네이밍만) |
| INTERFACE_BASE_ENDPOINT_WRITE.md | Stance 기반 CRUD 연산 | DTO 구조 가이드 없음 |
| INTERFACE_BASE_ENDPOINT_REVIEW.md | 경로/인증 수정 | DTO 관련 없음 |
| INTERFACE_ACTION_ENDPOINT_WRITE.md | 비-CRUD 엔드포인트 | DB 대비 DTO 검증 없음 |
| INTERFACE_ACTION_ENDPOINT_REVIEW.md | 경로/인증 수정 | DTO 관련 없음 |
| INTERFACE_OPERATION_REVIEW.md | 연산 메타데이터 검증 | DTO 필드 검증을 명시적으로 제외 |

---

## Realize 단계에 미치는 갭의 영향

### 정보 유실 체인

```
INTERFACE_SCHEMA.md           INTERFACE_SCHEMA_REFINE.md       REALIZE_OPERATION_WRITE.md
──────────────────           ──────────────────────────       ──────────────────────────
specification:               databaseSchemaProperty:           LLM이 보는 것:
"BelongsTo relation          "author" (릴레이션명)              - author 필드가 있는 DTO
 from FK author_id"                                           - author_id FK가 있는 DB 스키마
                             specification:                    - @x-autobe-database-schema-property: "author"
                             "Join from posts.author_id
                              to users.id"                    독립적으로 도출해야 하는 것:
                                                              → select: { author: { select: {...} } }
                                                              → author가 필요로 하는 모든 필드
                                                              → 중첩 릴레이션의 깊이
```

`specification` 필드가 자연어("Join from X to Y")를 전달하나 Prisma 코드는 전달하지 않는다. Realize 에이전트가 이를 독립적으로 변환해야 하며, 이것이 Class A 오류의 발생 지점이다.

### 제안 수정: `specification`에 Prisma 패턴 보강

INTERFACE_SCHEMA_REFINE.md에서 `specification` 필드가 Prisma 준비된 패턴을 포함하도록 요구:

```
현재:  "Join from posts.author_id to users.id"
제안:  "Join from posts.author_id to users.id. Prisma: include author with select { id, name, email, avatar_url }"
```

이렇게 하면 Realize 에이전트에게 `select`/`include` 절의 구체적인 출발점을 제공하여, Class A 오류를 극적으로 줄일 수 있다.
