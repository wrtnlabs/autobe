# Compiler System

## Compiler Philosophy

AutoBE의 컴파일러 시스템은 100% 컴파일 보장의 핵심이다. 3단계 검증 체계(Prisma → Interface → TypeScript)를 통해 각 레이어의 정합성을 검증하고, 오류 발생 시 AI 에이전트에게 구조화된 피드백을 제공한다.

컴파일러는 **검증자**이면서 동시에 **코치**이다. 단순히 통과/실패를 판단하는 것이 아니라, 무엇이 잘못되었고 어떻게 수정해야 하는지 명확히 알려준다. 이를 통해 AI 에이전트는 컴파일러의 피드백을 학습하고, 점진적으로 개선된 코드를 생성한다.

## AutoBE Prisma Compiler

Prisma Compiler는 데이터베이스 스키마의 유효성을 검증한다.

**검증 항목**: 테이블 정의, 필드 타입, 관계 설정, 인덱스, 제약조건을 검증한다. 순환 참조, 잘못된 관계 타입, 누락된 외래 키를 탐지한다.

**출력 생성**: 검증 성공 시 ERD 다이어그램을 Mermaid 형식으로 생성한다. Prisma Client 타입도 생성하여 타입 안전한 데이터베이스 접근을 가능하게 한다.

**오류 피드백**: 실패 시 스키마의 어떤 부분이 문제인지, 어떻게 수정해야 하는지 명확히 지적한다. "User 모델의 posts 관계에서 @relation 속성이 누락됨" 같은 구체적 진단을 제공한다.

## AutoBE OpenAPI Compiler

OpenAPI Compiler는 API 명세의 정합성을 검증한다.

**검증 항목**: OpenAPI 3.0 스펙 준수, Prisma 스키마와의 정합성, 경로 충돌, 스키마 순환 참조를 검증한다. API가 참조하는 모든 필드가 Prisma 스키마에 실제로 존재하는지 확인한다.

**AST 변환**: OpenAPI 문서를 간소화된 AST로 변환한다. 복잡한 OpenAPI 구조를 에이전트가 이해하기 쉬운 형식으로 단순화한다.

**코드 생성**: NestJS 프로젝트 템플릿을 생성한다. Controller 스켈레톤, DTO 타입, Module 설정을 자동으로 작성한다.

**오류 피드백**: "POST /api/users의 requestBody 스키마가 User 테이블의 deleted_at 필드를 참조하지만, Prisma 스키마에 해당 필드가 없음" 같은 구체적 진단을 제공한다.

## TypeScript Compiler

TypeScript Compiler는 최종 관문으로, 생성된 모든 코드의 타입 안정성을 보장한다.

**검증 범위**: 타입 오류, 구문 오류, 모듈 해석 오류, import 누락을 탐지한다. 프로덕션과 동일한 `tsconfig.json` 설정을 사용한다.

**진단 정보**: 파일 경로, 라인 번호, 컬럼 번호, 오류 메시지, 오류 코드를 포함한다. Correct Agent가 정확한 수정을 할 수 있도록 상세한 정보를 제공한다.

**Incremental Compilation**: 변경된 파일만 재컴파일하여 성능을 최적화한다. 의존성 그래프를 추적하여 영향받는 파일만 재검증한다.

## Compiler Integration

컴파일러는 Orchestrator와 밀접하게 협업한다.

**피드백 루프**: Write → Compile → Correct → Compile 루프를 반복한다. 컴파일 성공할 때까지 또는 최대 재시도 횟수에 도달할 때까지 계속된다.

**오류 해석**: 컴파일러의 기계적 진단 메시지를 AI 에이전트가 이해할 수 있는 형식으로 변환한다. 컨텍스트와 힌트를 추가하여 정확한 수정을 유도한다.

**성능 최적화**: 병렬 컴파일, 캐싱, Incremental 빌드를 통해 전체 파이프라인 시간을 단축한다.

자세한 컴파일러별 내용은 `@autobe/compiler` 패키지 코드를 참조하라.
