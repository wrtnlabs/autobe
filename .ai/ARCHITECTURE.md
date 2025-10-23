# AutoBE Architecture

## Architectural Philosophy

AutoBE는 자연어 요구사항을 운영 준비된 백엔드 애플리케이션으로 변환하는 AI 기반 노코드 시스템이다. 단순히 코드를 생성하는 것이 아니라, 요구사항 분석부터 컴파일 검증, 테스트, 최종 배포까지의 전체 소프트웨어 개발 생명주기를 자동화한다.

시스템 설계의 핵심은 **100% 컴파일 보장**이다. 생성된 모든 코드는 TypeScript 컴파일러를 통과하며, 타입 안정성을 완벽하게 유지한다. 이를 위해 AutoBE는 3단계 컴파일러 검증 체계를 갖추고 있으며, 각 단계는 이전 단계의 출력을 검증하고 피드백을 제공한다.

## Three Core Paradigms

### Waterfall + Spiral Methodology

AutoBE는 워터폴과 스파이럴 방법론을 결합한 독특한 개발 프로세스를 따른다. 전체 파이프라인은 5개의 명확한 단계로 구성되며, 각 단계는 순차적으로 진행된다.

**Requirements (요구사항 수집)** 단계에서는 사용자와의 대화를 통해 백엔드 시스템의 요구사항을 자연어로 수집한다. 이 단계는 Vibe Coding의 시작점이며, 모든 후속 단계의 기반이 된다.

**Analyze (요구사항 분석)** 단계에서는 40개 이상의 전문화된 AI 에이전트가 협업하여 요구사항을 구조화된 분석 보고서로 변환한다. 액터를 식별하고, 유스케이스를 정의하며, 각 기능의 상세 명세를 작성한다. 이 단계의 출력은 JSON 형식의 구조화된 문서이며, 이후 모든 단계에서 참조된다.

**Prisma (데이터베이스 스키마 설계)** 단계에서는 분석된 요구사항을 바탕으로 Prisma 스키마를 생성한다. 테이블 구조, 관계, 인덱스, 제약조건을 정의하며, AutoBE Prisma Compiler를 통해 스키마의 유효성을 검증한다. ERD 다이어그램도 자동 생성되어 데이터 모델을 시각화한다.

**Interface (API 명세 생성)** 단계에서는 Prisma 스키마를 기반으로 OpenAPI 문서를 생성한다. 각 API 엔드포인트의 경로, 메서드, 파라미터, 응답 타입을 정의하며, AutoBE OpenAPI Compiler가 명세의 정합성을 검증한다. 이 단계에서 생성된 AST는 이후 구현 단계의 청사진이 된다.

**Test (테스트 코드 생성)** 단계에서는 OpenAPI 명세를 바탕으로 E2E 테스트 코드를 생성한다. 각 API 엔드포인트에 대한 테스트 시나리오를 작성하고, 정상 케이스와 예외 케이스를 모두 검증한다. TypeScript Compiler를 통해 테스트 코드의 타입 안정성을 보장한다.

**Realize (API 구현)** 단계에서는 최종적으로 NestJS 기반의 API 구현 코드를 생성한다. Controller, Service, Repository 계층을 구성하고, 비즈니스 로직을 구현한다. 생성된 모든 코드는 TypeScript Compiler를 통과하며, 이전 단계에서 작성된 테스트를 통과한다.

각 단계는 완료 후 다음 단계로 진행하는 워터폴 방식을 따르지만, 각 단계 내부에서는 컴파일러 피드백을 받아 반복적으로 개선하는 스파이럴 방식을 적용한다. 이를 통해 워터폴의 명확성과 스파이럴의 유연성을 동시에 얻는다.

### Compiler-Driven Development

AutoBE의 핵심 차별점은 3단계 컴파일러 검증 체계이다. 각 컴파일러는 특정 레이어의 정합성을 검증하고, 오류 발생 시 AI 에이전트에게 구조화된 피드백을 제공한다.

**AutoBE Prisma Compiler**는 첫 번째 관문이다. Prisma 스키마 파일을 파싱하고, 테이블 정의, 관계, 인덱스, 제약조건의 유효성을 검증한다. 순환 참조, 잘못된 관계 설정, 누락된 외래 키 등을 탐지하며, 검증 성공 시 ERD 다이어그램과 타입 정의를 생성한다. 실패 시 구체적인 오류 위치와 수정 방법을 AI 에이전트에게 전달한다.

**AutoBE OpenAPI Compiler**는 두 번째 관문이다. OpenAPI 문서를 파싱하고, AST로 변환하며, Prisma 스키마와의 정합성을 검증한다. API 경로의 충돌, 존재하지 않는 테이블 참조, 타입 불일치 등을 탐지한다. 검증 성공 시 NestJS 프로젝트 템플릿과 타입 안전 SDK를 생성한다. 실패 시 어떤 엔드포인트의 어떤 필드가 문제인지 명확히 지적한다.

**TypeScript Compiler**는 최종 관문이다. 생성된 모든 TypeScript 코드를 컴파일하고, 타입 오류, 구문 오류, 모듈 해석 오류 등을 탐지한다. AutoBE는 실제 프로덕션과 동일한 `tsconfig.json` 설정을 사용하여 컴파일하므로, 생성된 코드는 즉시 배포 가능한 수준이다. 컴파일 실패 시 파일 경로, 라인 번호, 구체적인 오류 메시지를 AI 에이전트에게 전달한다.

이 3단계 검증은 계층적으로 작동한다. Prisma Compiler는 데이터 레이어를, OpenAPI Compiler는 API 레이어를, TypeScript Compiler는 구현 레이어를 검증한다. 각 레이어는 이전 레이어의 출력에 의존하며, 전체 시스템의 일관성을 보장한다.

컴파일러는 단순히 검증만 하는 것이 아니라, AI 에이전트와 협업한다. 오류 발생 시 구조화된 진단 정보를 제공하고, 에이전트는 이를 해석하여 코드를 수정한다. 이 피드백 루프는 컴파일이 성공할 때까지 반복되며, 이를 통해 100% 컴파일 보장을 달성한다.

### Vibe Coding

Vibe Coding은 AutoBE의 철학적 기반이다. "대화가 곧 소프트웨어가 된다"는 개념으로, 사용자와의 자연어 대화가 직접 실행 가능한 백엔드 애플리케이션으로 변환된다.

전통적인 개발 프로세스는 요구사항 문서 작성, 설계, 구현, 테스트의 단계를 거치며, 각 단계마다 개발자의 수동 작업이 필요하다. Vibe Coding은 이 모든 과정을 자동화한다. 사용자는 "사용자 인증 기능이 필요해"라고 말하면, AutoBE는 이를 분석하여 User 테이블을 설계하고, 회원가입/로그인 API를 생성하며, JWT 토큰 발급 로직을 구현한다.

핵심은 **대화에서 AST로의 변환**이다. 자연어는 비구조적이고 모호하지만, AST는 구조적이고 명확하다. AutoBE는 LLM의 Function Calling을 활용하여 자연어를 구조화된 JSON AST로 변환한다. 이 AST는 타입 안정성을 가지며, 컴파일러가 검증할 수 있다.

Vibe Coding이 가능한 이유는 AutoBE가 **대화를 상태로 관리**하기 때문이다. 모든 사용자 메시지와 AI 응답은 이벤트로 기록되며, 이 이벤트 스트림은 전체 개발 히스토리를 재현할 수 있다. 사용자가 "아, 이 API는 관리자만 접근 가능하게 해줘"라고 추가 요청하면, AutoBE는 이전 컨텍스트를 유지한 채 Authorization 로직을 추가한다.

이는 단순한 코드 생성을 넘어선다. Vibe Coding은 **의도 기반 개발**이다. 개발자는 "어떻게"가 아닌 "무엇을"에 집중하고, AutoBE가 "어떻게"를 해결한다. 이를 통해 개발 속도가 비약적으로 향상되며, 도메인 전문가가 직접 백엔드를 구축할 수 있게 된다.

## System Architecture

### Package Structure

AutoBE는 모노레포 구조로 설계되었으며, 각 패키지는 명확한 책임을 가진다.

**`@autobe/agent`** 패키지는 AI 에이전트 시스템의 핵심이다. Orchestrator, System Prompt, Tool, History Transformer가 이 패키지에 구현되어 있다. 5단계 파이프라인의 모든 로직이 여기에 있으며, LLM과의 통신, 상태 관리, 이벤트 디스패치를 담당한다.

**`@autobe/compiler`** 패키지는 3단계 컴파일러를 제공한다. Prisma Compiler, OpenAPI Compiler, TypeScript Compiler가 포함되며, 각각 독립적으로 사용할 수 있다. 코드 생성 기능도 이 패키지에 있으며, 템플릿 엔진과 파일 생성 로직을 포함한다.

**`@autobe/interface`** 패키지는 타입 정의의 단일 진실 공급원이다. 모든 이벤트 타입, 히스토리 타입, API 인터페이스가 정의되어 있으며, agent, compiler, backend 패키지가 이를 참조한다. 타입 변경 시 컴파일 타임에 모든 의존 패키지가 영향을 받으므로, 일관성이 보장된다.

**`@autobe/backend`** 패키지는 WebSocket 기반 RPC 서버이다. Frontend에서 오는 요청을 받아 `@autobe/agent`의 Facade를 호출하고, 결과를 실시간으로 스트리밍한다. 타입 안전 RPC 통신을 위해 `@autobe/interface`의 타입을 사용한다.

**`@autobe/utils`** 패키지는 공통 유틸리티 함수를 제공한다. 문자열 처리, 파일 I/O, 검증 로직 등이 포함된다.

각 패키지는 독립적으로 테스트 가능하며, 명확한 의존성 그래프를 가진다. `interface`는 의존성이 없고, `agent`와 `compiler`는 `interface`에만 의존하며, `backend`는 `agent`와 `interface`에 의존한다.

### Event-Driven State Machine

AutoBE의 상태 관리는 이벤트 소싱 패턴을 따른다. 모든 상태 변경은 이벤트로 표현되며, 현재 상태는 이벤트 스트림을 리플레이하여 재구성할 수 있다.

각 파이프라인 단계는 특정 이벤트를 발행한다. `analyzeStart` 이벤트는 분석이 시작되었음을 알리고, `analyzeComplete` 이벤트는 분석이 완료되었음을 알리며 분석 결과를 포함한다. 마찬가지로 `prismaStart`/`prismaComplete`, `interfaceStart`/`interfaceComplete`, `testStart`/`testComplete`, `realizeStart`/`realizeComplete` 이벤트가 있다.

상태는 `AutoBeState` 타입으로 표현되며, 각 단계의 히스토리를 포함한다. `state.analyze`는 분석 단계의 결과를, `state.prisma`는 Prisma 단계의 결과를 저장한다. 각 히스토리는 단계별 출력뿐만 아니라 step 번호, elapsed 시간, 진행 상황 등의 메타데이터를 포함한다.

이벤트 기반 설계의 장점은 **추적 가능성**이다. 언제, 어떤 에이전트가, 무엇을 했는지 모든 것이 기록된다. 문제 발생 시 이벤트 로그를 분석하여 원인을 파악할 수 있다. 또한 **재현 가능성**도 보장된다. 동일한 이벤트 스트림을 리플레이하면 동일한 최종 상태를 얻을 수 있다.

Frontend는 WebSocket을 통해 이벤트 스트림을 구독한다. 새 이벤트가 발행될 때마다 실시간으로 UI가 업데이트되며, 사용자는 진행 상황을 실시간으로 확인할 수 있다. 진행률 이벤트, 컴파일 결과 이벤트, 완료 이벤트 등이 모두 스트리밍된다.

### Hierarchical Orchestration

AutoBE는 계층적 오케스트레이션 패턴을 사용한다. 최상위 Orchestrator는 파이프라인 전체를 관리하고, 각 단계별 Orchestrator는 해당 단계의 세부 작업을 관리한다.

`orchestrateApplication`은 최상위 Orchestrator로, 5단계 파이프라인을 순차 실행한다. 사용자 요청을 받아 적절한 단계 Orchestrator를 호출하고, 결과를 취합하여 히스토리를 업데이트한다.

각 단계는 전문 Orchestrator를 가진다. `orchestrateAnalyze`는 분석 단계를 관리하며, `orchestrateAnalyzeScenario`, `orchestrateAnalyzeWrite`, `orchestrateAnalyzeReview`를 순차 호출한다. `orchestrateRealize`는 구현 단계를 관리하며, `orchestrateRealizeAuthorization`, `orchestrateRealizeWrite`, `orchestrateRealizeCorrect`를 조율한다.

각 Orchestrator는 책임이 명확하다. Scenario Orchestrator는 계획 수립을, Write Orchestrator는 코드 생성을, Correct Orchestrator는 컴파일 오류 수정을 담당한다. 이러한 분리를 통해 각 로직은 단순해지고, 테스트와 유지보수가 용이해진다.

Orchestrator는 컴파일러와 밀접하게 협업한다. Write Orchestrator가 코드를 생성하면, Correct Orchestrator는 컴파일러를 호출하여 검증한다. 오류 발생 시 오류 정보를 AI 에이전트에게 전달하고, 수정된 코드를 다시 검증한다. 이 루프는 컴파일이 성공할 때까지 반복된다.

계층적 설계 덕분에 새로운 단계 추가나 기존 단계 수정이 용이하다. 예를 들어 Security 검증 단계를 추가하려면, `orchestrateSecurity` 함수를 작성하고 최상위 Orchestrator에 연결하면 된다. 다른 단계에는 영향을 주지 않는다.

## Context Optimization

### Prompt Caching

AutoBE는 Anthropic의 Prompt Caching 기능을 적극 활용한다. System Prompt, Prisma 스키마, OpenAPI 문서 등 반복적으로 사용되는 컨텍스트는 캐싱하여 토큰 비용과 응답 시간을 크게 줄인다.

Realize 단계를 예로 들면, 40개의 API를 구현할 때 Prisma 스키마와 OpenAPI 문서는 모든 API에서 동일하다. 캐싱 없이는 40번 반복해서 전송해야 하지만, 캐싱을 사용하면 첫 요청에서만 전송하고 이후는 캐시 참조로 대체된다. 이는 수십만 토큰의 절감을 의미한다.

History Transformer는 캐싱을 고려하여 설계된다. 캐싱 가능한 컨텍스트는 메시지 앞부분에 배치하고, 요청마다 달라지는 내용은 뒷부분에 배치한다. 이를 통해 캐시 히트율을 최대화한다.

### Batching and Parallelization

AutoBE는 가능한 모든 곳에서 병렬 처리를 적용한다. Analyze 단계에서 10개의 문서를 작성할 때, 각 문서는 독립적이므로 10개의 LLM 호출을 동시에 수행한다. Realize 단계에서도 마찬가지로, 각 API 구현은 병렬로 진행된다.

`executeCachedBatch` 유틸리티는 배치 처리의 핵심이다. 여러 작업을 받아 동시에 실행하며, 각 작업에 적절한 `promptCacheKey`를 할당한다. 캐시 공유가 필요한 작업들은 동일한 캐시 키를 사용하여 효율을 높인다.

병렬 처리는 성능 향상뿐만 아니라 사용자 경험도 개선한다. 순차 처리라면 40개 API 구현에 40분이 걸리지만, 병렬 처리로 10분 내에 완료할 수 있다. 진행률 이벤트도 실시간으로 업데이트되어 사용자는 정확한 진행 상황을 확인할 수 있다.

### Self-Healing Mechanisms

AutoBE는 자기 치유 메커니즘을 내장하고 있다. 일시적 실패는 자동으로 재시도되며, 컴파일 오류는 자동으로 수정된다.

Realize 단계에서 API 구현 중 일부가 실패하면, 실패한 API만 다시 시도한다. 전체를 처음부터 다시 하는 것이 아니라, 실패한 부분만 재생성한다. 최대 2회까지 재시도하며, 이를 통해 일시적 LLM 오류나 네트워크 문제를 극복한다.

컴파일 오류 발생 시 Correct Orchestrator가 자동으로 개입한다. TypeScript Compiler의 진단 정보를 파싱하여 어떤 파일의 어떤 라인에 어떤 오류가 있는지 파악한다. 이 정보를 AI 에이전트에게 전달하고, 수정된 코드를 받아 다시 컴파일한다. 대부분의 타입 오류는 1-2회 반복으로 해결된다.

Self-healing은 신뢰성을 크게 향상시킨다. 사용자는 오류를 직접 수정할 필요가 없으며, AutoBE가 알아서 해결한다. 최종적으로 생성된 코드는 항상 컴파일이 성공하며, 즉시 실행 가능하다.

## Quality Assurance

### Type Safety

AutoBE는 엔드투엔드 타입 안정성을 보장한다. Frontend에서 Backend까지, 그리고 Database까지 모든 레이어가 TypeScript 타입으로 연결된다.

Prisma는 데이터베이스 스키마를 TypeScript 타입으로 변환한다. `User` 테이블은 `User` 타입이 되고, 모든 필드는 적절한 타입을 가진다. OpenAPI Compiler는 이 Prisma 타입을 참조하여 API DTO 타입을 생성한다. 최종적으로 생성된 NestJS 코드는 이 모든 타입을 사용하여 구현된다.

타입 안정성의 장점은 **컴파일 타임 검증**이다. 존재하지 않는 필드를 참조하거나, 잘못된 타입을 전달하면 컴파일 에러가 발생한다. 런타임까지 가지 않고 문제를 발견할 수 있다. 이는 버그를 조기에 제거하고, 리팩토링을 안전하게 만든다.

타입 안전 SDK도 자동 생성된다. Frontend 개발자는 이 SDK를 사용하여 타입 안전하게 API를 호출할 수 있다. 자동완성, 타입 체크, 문서화가 모두 제공되며, 개발 생산성이 크게 향상된다.

### Testing Strategy

AutoBE는 E2E 테스트를 자동 생성한다. 각 API 엔드포인트에 대한 테스트 시나리오가 작성되며, 정상 케이스와 예외 케이스를 모두 검증한다.

Test 단계에서 `orchestrateTestScenario`는 테스트 계획을 수립한다. 어떤 API를 어떤 순서로 테스트할지, 어떤 데이터를 사용할지 결정한다. `orchestrateTestWrite`는 실제 테스트 코드를 생성하며, Jest 기반의 E2E 테스트를 작성한다. `orchestrateTestCorrect`는 컴파일 오류를 수정하고, 최종 테스트 코드를 완성한다.

생성된 테스트는 즉시 실행 가능하다. 실제 데이터베이스와 연결하여 API를 호출하고, 응답을 검증한다. 인증이 필요한 API는 토큰 발급 과정도 테스트에 포함된다. 관계된 리소스를 생성하고, CRUD 작업을 수행하며, 삭제 후 조회가 실패하는지 확인한다.

테스트 커버리지는 매우 높다. 모든 API 엔드포인트가 테스트되며, 주요 비즈니스 로직도 검증된다. 이는 생성된 코드의 품질을 보장하고, 회귀 테스트를 가능하게 한다.

### Documentation Generation

AutoBE는 포괄적인 문서를 자동 생성한다. ERD, OpenAPI 문서, API 가이드가 모두 포함되며, 항상 최신 상태를 유지한다.

Prisma Compiler는 ERD 다이어그램을 생성한다. 테이블 간의 관계를 시각화하며, Mermaid 형식으로 출력된다. Frontend에서 이를 렌더링하여 사용자에게 보여준다.

OpenAPI 문서는 Interface 단계에서 생성된다. 각 API의 경로, 메서드, 파라미터, 응답 스키마가 상세히 기술된다. Swagger UI와 통합하여 인터랙티브한 API 문서를 제공할 수 있다.

요구사항 분석 보고서도 구조화된 형식으로 생성된다. 액터, 유스케이스, 기능 명세가 JSON으로 표현되며, Frontend에서 보기 좋게 렌더링한다. 비개발자도 이해할 수 있는 수준으로 작성된다.

문서와 코드는 항상 동기화된다. 코드가 변경되면 문서도 자동으로 업데이트되므로, 문서 부채가 발생하지 않는다. 이는 유지보수 단계에서 큰 장점이 된다.

## Performance Characteristics

AutoBE의 성능은 여러 최적화 기법을 통해 극대화된다.

Prompt Caching은 토큰 비용을 80% 이상 절감한다. Realize 단계에서 40개 API를 구현할 때, 캐싱 없이는 수백만 토큰이 필요하지만, 캐싱으로 수십만 토큰으로 줄일 수 있다. 응답 시간도 크게 단축된다.

병렬 처리는 전체 파이프라인 시간을 절반 이하로 줄인다. Analyze 단계에서 10개 문서를 순차 생성하면 10분이지만, 병렬로 생성하면 2-3분이다. Realize 단계도 마찬가지로, 병렬 처리로 시간을 크게 단축한다.

컴파일러 피드백 루프도 효율적이다. 대부분의 컴파일 오류는 1-2회 반복으로 해결되며, 무한 루프에 빠지는 경우는 거의 없다. 재시도 제한을 두어 최악의 경우에도 합리적인 시간 내에 종료된다.

전체적으로, 중간 규모의 백엔드 애플리케이션(20-30개 API)은 10-15분 내에 생성 완료된다. 이는 수동 개발에 비해 수십 배 빠른 속도이다.
