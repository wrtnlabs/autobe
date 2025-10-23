# Agent System

## Agent Philosophy

AutoBE의 에이전트 시스템은 40개 이상의 전문화된 AI 에이전트가 협업하여 요구사항을 실행 가능한 코드로 변환한다. 각 에이전트는 특정 도메인에 특화되어 있으며, 명확한 책임과 인터페이스를 가진다.

에이전트 설계의 핵심 원칙은 **단일 책임**이다. 각 에이전트는 하나의 명확한 작업만 수행한다. 예를 들어 Requirements Analyzer는 요구사항 분석만 담당하고, Schema Generator는 Prisma 스키마 생성만 담당한다. 이러한 분리는 각 에이전트의 System Prompt를 단순하게 유지하고, 테스트와 디버깅을 용이하게 만든다.

에이전트는 **Function Calling**을 통해 구조화된 출력을 생성한다. 자유 형식의 텍스트를 생성하는 것이 아니라, 미리 정의된 JSON 스키마에 맞춰 출력한다. 이를 통해 출력의 파싱이 필요 없으며, 타입 안정성이 보장된다. LLM이 스키마를 벗어난 출력을 생성하면 자동으로 재시도된다.

에이전트 간의 통신은 **이벤트**를 통해 이루어진다. 한 에이전트의 출력은 다음 에이전트의 입력이 된다. 예를 들어 Analyze 에이전트가 생성한 분석 보고서는 Prisma 에이전트의 입력으로 사용되며, Prisma 스키마는 Interface 에이전트의 입력이 된다. 이러한 파이프라인 구조는 명확한 데이터 흐름을 만들고, 각 단계를 독립적으로 테스트할 수 있게 한다.

## Agent Categories

AutoBE의 에이전트는 기능에 따라 여러 카테고리로 분류된다.

**Planning Agents**는 계획 수립을 담당한다. Scenario Agent는 어떤 작업을 어떤 순서로 수행할지 결정한다. Analyze 단계에서는 어떤 문서를 작성할지, Interface 단계에서는 어떤 API를 생성할지, Test 단계에서는 어떤 테스트를 작성할지 계획한다. Planning Agent의 출력은 후속 에이전트들의 청사진이 된다.

**Generation Agents**는 코드나 문서를 생성한다. Write Agent는 실제 코드를 작성하고, Document Agent는 분석 보고서를 작성한다. 이들은 매우 상세한 System Prompt를 가지며, 코딩 컨벤션, 네이밍 규칙, 아키텍처 패턴을 정확히 따른다. 생성된 코드는 즉시 컴파일 가능해야 하므로, 높은 정확도가 요구된다.

**Review Agents**는 검증과 개선을 수행한다. Analyze Review Agent는 작성된 분석 보고서를 검토하고 개선점을 제안한다. Correct Agent는 컴파일 오류를 분석하고 수정한다. Review Agent는 비판적 사고를 적용하며, 단순히 승인하는 것이 아니라 실제로 문제를 찾아내고 해결한다.

**Specialized Agents**는 특정 도메인 작업을 수행한다. Authorization Agent는 인증/인가 로직을 설계하고, ERD Agent는 엔티티 관계 다이어그램을 생성한다. 이들은 해당 도메인의 전문 지식을 System Prompt에 인코딩하고 있으며, 일반 에이전트가 할 수 없는 전문적인 작업을 수행한다.

## Agent Lifecycle

에이전트의 생명주기는 명확한 단계를 거친다.

**Initialization** 단계에서는 에이전트에 필요한 컨텍스트가 준비된다. System Prompt, Tool 정의, History가 구성되며, LLM 클라이언트가 초기화된다. 이 단계에서 Prompt Caching을 위한 캐시 키도 설정된다.

**Execution** 단계에서는 LLM API를 호출하여 실제 작업을 수행한다. Function Calling을 통해 구조화된 출력을 요청하며, 스트리밍 방식으로 응답을 받는다. 진행률 이벤트를 발행하여 사용자에게 실시간 피드백을 제공한다.

**Validation** 단계에서는 에이전트의 출력을 검증한다. Function Calling 응답이 스키마에 맞는지, 필수 필드가 모두 존재하는지 확인한다. Generation Agent의 경우 생성된 코드를 컴파일러로 검증한다. 검증 실패 시 재시도하거나 Correct Agent를 호출한다.

**Completion** 단계에서는 결과를 이벤트로 발행한다. 에이전트의 출력은 상태에 저장되며, 다음 에이전트가 참조할 수 있게 된다. 완료 이벤트는 WebSocket을 통해 Frontend로 전송되며, UI가 업데이트된다.

에이전트는 **멱등성**을 가진다. 동일한 입력에 대해서는 항상 동일한 출력을 생성해야 한다. 물론 LLM의 비결정성으로 인해 완전한 멱등성은 불가능하지만, System Prompt 설계와 Temperature 설정을 통해 최대한 일관성을 유지한다.

## Context Management

에이전트의 성능은 컨텍스트 관리에 크게 의존한다.

**History Transformation**은 컨텍스트 최적화의 핵심이다. 원시 히스토리는 매우 길고 중복이 많지만, History Transformer는 이를 에이전트에 필요한 핵심 정보만 추출하여 재구성한다. 예를 들어 Realize Agent는 Prisma 스키마와 OpenAPI 문서만 필요하므로, 요구사항 분석 과정은 생략된다.

**Prompt Caching Strategy**는 반복 작업에서 효율을 극대화한다. Realize 단계에서 40개 API를 구현할 때, Prisma 스키마와 OpenAPI 문서는 모든 호출에서 동일하다. 이를 캐싱 가능한 System Message로 배치하고, API별로 다른 내용만 User Message로 전달한다. 첫 호출 이후 캐시가 히트되면 응답 시간과 비용이 크게 감소한다.

**Progressive Context Loading**은 필요한 정보만 단계적으로 로드한다. 초기 Planning 단계에서는 요구사항 요약만 제공하고, 실제 Generation 단계에서 상세 명세를 제공한다. 이를 통해 불필요한 토큰 사용을 방지하고, LLM이 핵심 정보에 집중하도록 돕는다.

**Context Window Management**는 초대형 컨텍스트를 다룬다. Claude 3.7 Sonnet는 200K 토큰 컨텍스트를 지원하지만, 이를 모두 사용하는 것은 비효율적이다. 필요한 정보만 선별하고, 나머지는 참조로 남겨둔다. 예를 들어 특정 API 구현 시 해당 OpenAPI Operation만 상세히 제공하고, 나머지 Operation은 경로와 메서드만 나열한다.

## Error Handling

에이전트는 다양한 오류 상황을 처리해야 한다.

**LLM API Errors**는 네트워크 문제나 rate limit으로 발생한다. 이러한 일시적 오류는 exponential backoff 전략으로 재시도한다. 첫 시도 실패 시 1초 대기, 두 번째 실패 시 2초 대기 방식으로 최대 3회까지 재시도한다. 재시도 중에도 사용자에게 진행 상황을 알린다.

**Schema Validation Errors**는 Function Calling 응답이 스키마에 맞지 않을 때 발생한다. 필수 필드 누락, 타입 불일치, 잘못된 enum 값 등이 원인이다. 이 경우 LLM에게 오류를 피드백하고 재생성을 요청한다. System Prompt에 "스키마를 정확히 따르라"는 강조를 추가하여 재발을 방지한다.

**Compilation Errors**는 생성된 코드가 컴파일러를 통과하지 못할 때 발생한다. Correct Agent가 개입하여 컴파일러의 진단 정보를 분석하고, 오류 위치와 원인을 파악한다. 수정된 코드를 생성하고 다시 컴파일한다. 대부분의 타입 오류는 1-2회 반복으로 해결되며, 무한 루프를 방지하기 위해 최대 재시도 횟수를 제한한다.

**Logical Errors**는 코드가 컴파일되지만 논리적으로 잘못되었을 때 발생한다. 예를 들어 존재하지 않는 테이블을 참조하거나, 잘못된 관계를 설정하는 경우이다. 이는 컴파일러만으로는 탐지할 수 없으며, Review Agent나 Test Agent가 발견한다. 발견 시 해당 에이전트의 System Prompt를 개선하여 유사한 오류를 예방한다.

## Agent Communication Patterns

에이전트 간의 통신은 명확한 패턴을 따른다.

**Sequential Pipeline**은 가장 기본적인 패턴이다. 에이전트 A의 출력이 에이전트 B의 입력이 되고, B의 출력이 C의 입력이 된다. Analyze → Prisma → Interface → Test → Realize 파이프라인이 이 패턴을 따른다. 각 단계는 이전 단계가 완료될 때까지 대기하며, 순차적으로 실행된다.

**Parallel Fan-Out**은 하나의 계획을 여러 에이전트가 병렬로 실행하는 패턴이다. Analyze 단계에서 10개 문서 작성이 계획되면, 10개의 Write Agent가 동시에 실행된다. 각 에이전트는 독립적이며, 서로의 결과에 영향을 주지 않는다. 모든 에이전트가 완료되면 다음 단계로 진행한다.

**Iterative Refinement**는 피드백을 받아 반복적으로 개선하는 패턴이다. Write Agent가 코드를 생성하면, Correct Agent가 검증하고, 오류가 있으면 다시 Write Agent에게 피드백한다. 이 루프는 컴파일이 성공할 때까지 계속되며, 점진적으로 품질이 향상된다.

**Hierarchical Delegation**은 상위 에이전트가 하위 에이전트에게 작업을 위임하는 패턴이다. Orchestrator는 전체 흐름을 관리하고, 실제 작업은 전문 에이전트에게 위임한다. 예를 들어 `orchestrateRealize`는 Authorization, Write, Correct 에이전트를 순차적으로 호출하고, 결과를 취합한다.

## Agent Observability

에이전트의 동작을 추적하고 디버깅하는 것은 필수적이다.

**Event Logging**은 모든 에이전트 활동을 기록한다. 에이전트 시작, 완료, 오류, 재시도 등의 이벤트가 타임스탬프와 함께 저장된다. 문제 발생 시 이벤트 로그를 분석하여 어떤 에이전트가 언제 실패했는지 파악할 수 있다.

**Progress Tracking**은 장시간 실행되는 작업의 진행 상황을 보여준다. Realize 단계에서 40개 API를 구현할 때, "completed: 15 / total: 40" 같은 진행률 정보를 실시간으로 업데이트한다. 사용자는 언제 완료될지 예측할 수 있으며, 시스템이 멈추지 않았음을 확인할 수 있다.

**Performance Metrics**는 각 에이전트의 수행 시간과 토큰 사용량을 측정한다. 어떤 에이전트가 병목인지, 어떤 단계에서 토큰을 많이 사용하는지 파악하여 최적화 포인트를 찾는다. Prompt Caching 적용 전후의 성능 차이도 정량적으로 측정할 수 있다.

**Error Analytics**는 반복되는 오류 패턴을 분석한다. 특정 에이전트가 자주 실패하면 System Prompt나 Tool 정의에 문제가 있을 수 있다. 오류 유형별 빈도를 추적하여 우선순위를 정하고, 시스템을 지속적으로 개선한다.

## Agent Evolution

에이전트 시스템은 지속적으로 진화한다.

**Prompt Iteration**은 System Prompt를 개선하는 과정이다. 사용자 피드백, 오류 로그, 생성된 코드 품질을 분석하여 프롬프트를 업데이트한다. 명확하지 않은 지시를 구체화하고, 자주 발생하는 실수를 예방하는 규칙을 추가한다. 프롬프트 변경은 버전 관리되며, A/B 테스트를 통해 개선 효과를 검증한다.

**Tool Enhancement**는 Function Calling 도구를 개선하는 과정이다. 새로운 필드를 추가하거나, 스키마를 더 명확히 정의하거나, 예시를 추가한다. 에이전트가 자주 잘못된 형식으로 출력하면, 스키마 제약을 강화하거나 프롬프트에 추가 설명을 넣는다.

**Architecture Refactoring**은 에이전트 구조를 개선하는 과정이다. 하나의 에이전트가 너무 많은 책임을 가지면 두 개로 분리하고, 반대로 너무 세분화되어 있으면 통합한다. 새로운 기능이 추가되면 적절한 위치에 에이전트를 배치하고, 기존 파이프라인과 통합한다.

**Performance Optimization**은 실행 시간과 비용을 최적화하는 과정이다. 불필요한 컨텍스트를 제거하고, Prompt Caching을 확대 적용하며, 병렬화 가능한 부분을 찾아 개선한다. 프로파일링을 통해 병목을 식별하고, 가장 효과적인 최적화 지점에 집중한다.
