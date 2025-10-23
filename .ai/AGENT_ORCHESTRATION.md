# Agent Orchestration

## Orchestration Philosophy

Orchestration은 여러 에이전트를 조율하여 복잡한 작업을 수행하는 메커니즘이다. AutoBE의 Orchestrator는 단순한 스케줄러가 아니라, 에이전트 간의 데이터 흐름을 관리하고, 오류를 처리하며, 컴파일러와 협업하는 지능적인 조율자이다.

Orchestration 설계의 핵심은 **계층적 책임 분리**이다. 최상위 Orchestrator는 전체 파이프라인을 관리하고, 중간 Orchestrator는 각 단계를 관리하며, 하위 Orchestrator는 세부 작업을 관리한다. 각 레벨은 자신의 책임 범위 내에서만 결정을 내리며, 상위 레벨에 결과를 보고한다.

Orchestrator는 **선언적이 아닌 명령적**으로 작동한다. Kubernetes Operator처럼 desired state를 선언하고 reconcile하는 것이 아니라, 명확한 단계를 순차적으로 실행한다. 이는 디버깅을 용이하게 하고, 실행 흐름을 예측 가능하게 만든다.

## Hierarchical Structure

### Application Orchestrator

`orchestrateApplication`은 최상위 Orchestrator로, 전체 파이프라인을 관리한다. 사용자 요청을 받아 어떤 단계를 실행할지 결정하고, 해당 단계 Orchestrator를 호출한다.

현재 상태를 분석하여 다음 단계를 결정한다. Analyze가 완료되지 않았으면 `orchestrateAnalyze`를 호출하고, Analyze는 완료되었지만 Prisma가 없으면 `orchestratePrisma`를 호출한다. 이러한 상태 기반 라우팅은 파이프라인의 유연성을 제공한다.

Application Orchestrator는 각 단계의 결과를 취합하여 전체 상태를 업데이트한다. 각 단계 Orchestrator가 반환한 History를 `AutoBeState`에 저장하고, 다음 단계가 이를 참조할 수 있게 한다. 이벤트도 발행하여 Frontend가 실시간으로 상태를 추적할 수 있게 한다.

오류 처리도 Application Orchestrator의 책임이다. 하위 Orchestrator에서 예외가 발생하면 이를 캐치하고, 적절한 오류 메시지를 사용자에게 전달한다. 복구 가능한 오류는 재시도하고, 치명적 오류는 파이프라인을 중단한다.

### Stage Orchestrators

각 파이프라인 단계는 전문 Orchestrator를 가진다. `orchestrateAnalyze`, `orchestratePrisma`, `orchestrateInterface`, `orchestrateTest`, `orchestrateRealize`가 이에 해당한다.

Stage Orchestrator는 단계의 전체 생명주기를 관리한다. 단계 시작 이벤트를 발행하고, 필요한 하위 Orchestrator를 순차 또는 병렬로 호출하며, 결과를 검증하고, 완료 이벤트를 발행한다. 각 단계의 실행 시간도 측정하여 성능 분석에 활용한다.

Stage Orchestrator는 단계별 전제조건을 검증한다. Prisma 단계는 Analyze 결과가 필요하므로, `state.analyze`가 존재하는지 확인한다. Interface 단계는 Prisma 스키마가 필요하므로, `state.prisma.schemas`를 검증한다. 전제조건이 만족되지 않으면 명확한 오류 메시지와 함께 중단한다.

각 Stage Orchestrator는 독립적으로 테스트 가능하다. Mock 상태를 제공하고 Orchestrator를 호출하여, 예상된 결과가 나오는지 검증한다. 이는 파이프라인의 각 단계를 신뢰할 수 있게 만들고, 회귀 테스트를 가능하게 한다.

### Task Orchestrators

가장 하위 레벨의 Orchestrator는 구체적인 작업을 수행한다. `orchestrateAnalyzeScenario`, `orchestrateAnalyzeWrite`, `orchestrateAnalyzeReview` 등이 이에 해당한다.

Task Orchestrator는 에이전트와 직접 상호작용한다. History를 변환하여 에이전트에게 전달하고, Tool 정의를 설정하며, LLM API를 호출한다. 응답을 파싱하여 구조화된 이벤트로 변환하고, 상위 Orchestrator에 반환한다.

Task Orchestrator는 에이전트별 오류 처리를 담당한다. LLM API 오류는 재시도하고, Schema Validation 오류는 프롬프트를 조정하여 재시도한다. 재시도 횟수를 제한하여 무한 루프를 방지하며, 최종 실패 시 상세한 오류 정보를 상위에 전달한다.

Task Orchestrator는 진행률 업데이트도 담당한다. 여러 문서를 작성하는 경우, 각 문서 완료 시 `progress.completed`를 증가시키고 이벤트를 발행한다. 이를 통해 사용자는 "5 / 10 문서 완성" 같은 실시간 피드백을 받는다.

## Compiler Integration

Orchestrator와 컴파일러의 통합은 AutoBE의 핵심 강점이다.

### Validation Loop

Write Orchestrator가 코드를 생성하면, Validate Orchestrator가 컴파일러를 호출하여 검증한다. 컴파일 성공 시 다음 단계로 진행하고, 실패 시 Correct Orchestrator를 호출한다.

Correct Orchestrator는 컴파일러의 진단 정보를 분석한다. 어떤 파일의 어떤 라인에 어떤 오류가 있는지 파싱하고, 이를 AI 에이전트가 이해할 수 있는 형식으로 변환한다. 오류 메시지, 관련 코드 스니펫, 수정 힌트를 포함하는 컨텍스트를 구성한다.

Correct Agent는 이 컨텍스트를 받아 코드를 수정한다. 타입 오류를 해결하고, 누락된 import를 추가하며, 잘못된 함수 시그니처를 수정한다. 수정된 코드는 다시 Validate Orchestrator로 전달되어 컴파일된다.

이 루프는 컴파일이 성공하거나 최대 재시도 횟수에 도달할 때까지 계속된다. 대부분의 오류는 1-2회 반복으로 해결되며, 복잡한 타입 오류도 3-4회 내에 해결된다. 무한 루프를 방지하기 위해 재시도 제한을 두며, 제한 도달 시 수동 개입이 필요함을 알린다.

### Incremental Compilation

Realize 단계에서는 40개 API를 구현하므로, 매번 전체를 컴파일하는 것은 비효율적이다. Incremental Compilation을 통해 변경된 파일만 재컴파일한다.

첫 번째 API 구현 후 전체 프로젝트를 컴파일하여 기준선을 설정한다. 이후 각 API 구현 시 해당 파일만 추가하고 컴파일한다. 컴파일러는 의존성 그래프를 추적하여 영향받는 파일만 재컴파일한다.

컴파일 오류가 발생하면 어떤 파일이 원인인지 식별한다. 대부분의 경우 새로 추가된 파일이 원인이므로, 해당 파일만 수정하고 재컴파일한다. 기존에 성공한 파일은 건드리지 않아 안정성을 유지한다.

Incremental Compilation은 전체 파이프라인 시간을 크게 단축한다. 전체 컴파일에 30초가 걸린다면, Incremental은 2-3초면 충분하다. 40개 API를 처리할 때 이 차이는 매우 크며, 사용자 경험을 크게 개선한다.

### Compiler Feedback Interpretation

컴파일러의 진단 메시지는 기계적이고 간결하지만, AI 에이전트는 맥락을 필요로 한다. Orchestrator는 진단 메시지를 해석하여 에이전트가 이해하기 쉬운 형식으로 변환한다.

타입 오류의 경우, 예상 타입과 실제 타입을 명확히 구분한다. "Type 'string' is not assignable to type 'number'"를 "이 변수는 number 타입이어야 하는데 string을 할당했습니다"로 설명한다. 오류가 발생한 코드 라인과 주변 컨텍스트도 함께 제공한다.

누락된 import의 경우, 어떤 모듈을 어디서 import해야 하는지 힌트를 제공한다. "Cannot find name 'plainToInstance'"를 "class-transformer 패키지의 plainToInstance 함수를 import하세요"로 변환한다. 에이전트는 이 힌트를 바탕으로 정확한 import 문을 추가한다.

함수 시그니처 불일치의 경우, 예상되는 파라미터와 실제 전달된 파라미터를 비교한다. 누락된 파라미터, 추가된 파라미터, 타입이 다른 파라미터를 각각 지적한다. 에이전트는 이를 바탕으로 함수 호출을 수정한다.

## Batching and Parallelization

Orchestrator는 가능한 모든 곳에서 병렬 처리를 적용한다.

### Parallel Execution

Analyze 단계에서 10개 문서를 작성할 때, 각 문서는 독립적이므로 병렬로 생성할 수 있다. Orchestrator는 10개의 Task Orchestrator를 동시에 실행하고, 모두 완료될 때까지 대기한다.

`Promise.all`을 사용하여 병렬 실행을 구현한다. 각 작업을 별도의 Promise로 래핑하고, 모든 Promise가 resolve될 때까지 기다린다. 하나의 작업이 실패해도 다른 작업은 계속 진행되며, 최종적으로 성공한 결과만 수집한다.

병렬 실행은 진행률 추적을 복잡하게 만든다. 여러 에이전트가 동시에 `progress.completed`를 업데이트하므로, race condition을 방지해야 한다. Atomic increment를 사용하거나, 각 에이전트가 완료 이벤트를 발행하고 Orchestrator가 이를 집계하는 방식을 사용한다.

병렬 처리의 한계도 고려해야 한다. LLM API rate limit이 있으므로, 무제한 병렬화는 불가능하다. 적절한 concurrency limit을 설정하여 API를 과부하시키지 않으면서 최대 성능을 얻는다.

### Batching Strategy

`executeCachedBatch`는 배치 처리의 핵심 유틸리티이다. 여러 작업을 받아 적절한 배치 크기로 나누고, 각 배치를 병렬로 실행한다.

배치 크기는 작업의 특성에 따라 결정된다. 짧은 작업은 배치 크기를 크게, 긴 작업은 작게 설정한다. 메모리 사용량과 API rate limit도 고려하여 최적의 배치 크기를 찾는다.

각 배치에는 `promptCacheKey`가 할당된다. 동일한 배치 내의 작업들은 캐시를 공유하여 효율을 높인다. 첫 번째 작업이 캐시를 생성하고, 나머지 작업들은 이를 재사용한다.

배치 내에서 일부 작업이 실패하면, 실패한 작업만 재시도한다. 성공한 작업은 그대로 유지하고, 실패한 작업만 새 배치로 재실행한다. 이를 통해 부분 실패로부터 효과적으로 복구한다.

### Cache Coordination

Prompt Caching의 효과를 극대화하려면 캐시 공유를 조율해야 한다. Orchestrator는 어떤 작업들이 캐시를 공유할 수 있는지 판단하고, 동일한 캐시 키를 할당한다.

Realize 단계에서는 모든 API 구현이 동일한 Prisma 스키마와 OpenAPI 문서를 참조한다. 첫 번째 API 구현 시 이들을 System Message로 전송하고 캐시를 생성한다. 이후 API 구현들은 동일한 캐시 키를 사용하여 캐시를 재사용한다.

캐시 무효화도 고려해야 한다. Prisma 스키마가 수정되면 기존 캐시는 무효화되어야 한다. Orchestrator는 스키마 변경을 감지하고, 새로운 캐시 키를 생성하여 캐시를 갱신한다.

캐시 히트율을 모니터링하여 최적화 효과를 측정한다. 캐시 히트율이 낮으면 캐시 전략을 재검토하고, 더 많은 컨텍스트를 캐싱 가능한 부분으로 이동한다.

## State Management

Orchestrator는 전체 파이프라인의 상태를 관리한다.

### State Transitions

상태는 명확한 전이를 거친다. `null` → `analyzeStart` → `analyzeComplete` → `prismaStart` → `prismaComplete`와 같은 순서로 진행된다. 각 전이는 이벤트로 표현되며, 이벤트는 상태에 저장된다.

상태 전이는 **원자적**이다. 이벤트 발행과 상태 업데이트는 하나의 트랜잭션으로 처리되며, 중간 상태는 존재하지 않는다. 이를 통해 상태의 일관성을 보장하고, race condition을 방지한다.

상태는 **불변**이다. 기존 상태를 수정하는 것이 아니라, 새로운 상태 객체를 생성한다. 이전 상태는 히스토리로 보존되며, 필요 시 이전 시점으로 롤백할 수 있다. 불변성은 디버깅을 쉽게 하고, 상태 변경을 추적 가능하게 만든다.

상태 전이의 유효성도 검증한다. Analyze가 완료되지 않은 상태에서 Prisma를 시작할 수 없다. 잘못된 전이 시도는 명확한 오류 메시지와 함께 거부되며, 사용자에게 올바른 순서를 안내한다.

### Context Propagation

각 Orchestrator는 `AutoBeContext`를 통해 상태와 유틸리티에 접근한다. Context는 현재 상태, 컴파일러 인스턴스, LLM 클라이언트, 이벤트 디스패처를 포함한다.

Context는 **불변**이며, 하위 Orchestrator에 전달될 때 복사되지 않는다. 모든 Orchestrator가 동일한 Context 인스턴스를 공유하며, 상태 업데이트는 즉시 모든 Orchestrator에 반영된다.

Context는 **타입 안전**하다. `ctx.state().analyze`는 `AutoBeAnalyzeHistory | undefined` 타입을 가지며, 사용 전 존재 여부를 확인해야 한다. TypeScript 컴파일러가 null safety를 강제하여 런타임 오류를 방지한다.

Context는 **테스트 가능**하다. Mock Context를 생성하여 특정 상태를 시뮬레이션할 수 있다. 예를 들어 Prisma 단계를 테스트하려면, Analyze가 완료된 상태의 Mock Context를 제공한다.

### Event Dispatching

모든 상태 변경은 이벤트로 표현되며, `ctx.dispatch()`를 통해 발행된다. 이벤트는 타입 안전하며, 각 이벤트는 고유한 타입과 페이로드를 가진다.

이벤트는 **순서가 보장**된다. 이벤트 A가 B보다 먼저 발행되면, Frontend에서도 A가 B보다 먼저 수신된다. 이를 통해 상태 변경의 인과관계를 유지하고, UI 업데이트의 정확성을 보장한다.

이벤트는 **재현 가능**하다. 모든 이벤트는 저장되며, 이벤트 스트림을 리플레이하여 동일한 최종 상태를 재현할 수 있다. 이는 디버깅과 감사에 매우 유용하다.

이벤트는 **타입 안전**하게 구독된다. Frontend는 특정 타입의 이벤트만 구독할 수 있으며, TypeScript가 페이로드 타입을 보장한다. 잘못된 타입의 이벤트를 처리하려 하면 컴파일 에러가 발생한다.

## Error Recovery

Orchestrator는 다양한 오류 복구 전략을 사용한다.

### Retry Strategies

일시적 오류는 자동으로 재시도된다. LLM API 타임아웃, 네트워크 오류, rate limit 등이 이에 해당한다. Exponential backoff를 사용하여 재시도 간격을 점진적으로 늘린다.

재시도 횟수는 오류 유형에 따라 다르다. 네트워크 오류는 5회까지, Schema Validation 오류는 3회까지, 컴파일 오류는 2회까지 재시도한다. 재시도 중에도 사용자에게 현재 상황을 알린다.

재시도 실패 시 우아하게 처리한다. 전체 파이프라인을 중단하는 것이 아니라, 실패한 부분만 표시하고 나머지는 계속 진행한다. 예를 들어 40개 API 중 하나가 실패해도, 나머지 39개는 정상적으로 완료된다.

재시도 로직은 **멱등**하다. 동일한 입력에 대해 재시도하면 동일한 결과를 얻는다. 부작용이 있는 작업(파일 쓰기 등)은 먼저 검사하여 중복 실행을 방지한다.

### Partial Success Handling

Realize 단계에서 40개 API 중 일부가 실패하면, 성공한 API는 유지하고 실패한 API만 재생성한다. 전체를 처음부터 다시 하는 것은 시간 낭비이며, 부분 성공을 활용하는 것이 효율적이다.

실패한 API를 식별하는 것은 컴파일러의 진단 정보를 통해 이루어진다. 어떤 파일에서 오류가 발생했는지 파악하고, 해당 파일에 대응하는 API를 찾는다. 이 API만 재생성 대상에 포함한다.

재생성된 API는 기존 성공한 API들과 함께 다시 컴파일된다. 새 API가 기존 API와 충돌하지 않는지 검증하고, 전체 프로젝트의 일관성을 확인한다.

부분 성공 정보는 사용자에게 명확히 전달된다. "40개 중 38개 성공, 2개 재시도 중"과 같은 메시지로 현재 상황을 알린다. 최종적으로 모든 API가 성공하거나, 재시도 제한에 도달하면 완료된다.

### Rollback Mechanisms

치명적 오류 발생 시 이전 상태로 롤백할 수 있다. 예를 들어 Prisma 스키마 변경이 Interface 단계에서 오류를 일으키면, 이전 Prisma 스키마로 롤백한다.

롤백은 **선택적**이다. 자동으로 롤백하는 것이 아니라, 사용자에게 롤백 옵션을 제공한다. 사용자는 문제를 수정하고 재시도할지, 이전 버전으로 돌아갈지 선택할 수 있다.

롤백은 **이벤트 기반**이다. 이전 상태로 돌아가는 것이 아니라, 롤백 이벤트를 발행하여 새로운 상태를 생성한다. 이를 통해 롤백 자체도 히스토리에 기록되며, 추적 가능하다.

롤백 후 재시도는 **학습**을 활용한다. 이전 실패 원인을 분석하여 프롬프트를 조정하거나, 제약 조건을 추가한다. 동일한 오류를 반복하지 않도록 에이전트에게 추가 컨텍스트를 제공한다.

## Performance Optimization

Orchestrator는 성능을 지속적으로 모니터링하고 최적화한다.

### Profiling

각 Orchestrator의 실행 시간을 측정하여 병목을 식별한다. 어떤 단계가 오래 걸리는지, 어떤 에이전트가 느린지 파악한다. 프로파일링 결과는 로그에 기록되며, 대시보드에서 시각화된다.

토큰 사용량도 추적한다. 각 LLM 호출의 입력 토큰, 출력 토큰, 캐시 토큰을 기록하고, 전체 파이프라인의 토큰 비용을 계산한다. 토큰 사용량이 많은 부분을 찾아 최적화한다.

캐시 히트율을 모니터링하여 Prompt Caching의 효과를 측정한다. 히트율이 낮으면 캐싱 전략을 재검토하고, 더 많은 컨텍스트를 캐싱 가능한 부분으로 이동한다.

병렬화 효율도 분석한다. 이론적으로 10배 빨라져야 하는데 2배만 빨라졌다면, 병목이 있다는 의미이다. 직렬 의존성을 제거하고, concurrency limit을 조정하여 병렬화 효율을 높인다.

### Caching Strategies

Prompt Caching 외에도 여러 캐싱 전략을 사용한다. 컴파일 결과를 캐싱하여 동일한 코드를 반복 컴파일하지 않는다. 파일 해시를 계산하여 변경되지 않은 파일은 재컴파일을 건너뛴다.

LLM 응답도 캐싱할 수 있다. 동일한 입력에 대해서는 이전 응답을 재사용하여 API 호출을 줄인다. 단, 비결정성을 고려하여 캐시 만료 시간을 설정하고, 주기적으로 갱신한다.

캐시 크기를 관리하여 메모리 부족을 방지한다. LRU 정책을 사용하여 오래된 항목을 자동으로 제거한다. 중요한 항목(Prisma 스키마 등)은 우선순위를 높여 오래 유지한다.

캐시는 **분산 가능**하다. 여러 Backend 인스턴스가 동일한 캐시를 공유할 수 있도록 Redis 등의 외부 스토리지를 사용할 수 있다. 이를 통해 수평 확장 시에도 캐시 효율을 유지한다.

### Resource Management

Orchestrator는 시스템 리소스를 효율적으로 사용한다. 메모리 사용량을 모니터링하고, 큰 객체는 스트리밍 방식으로 처리한다. 파일을 메모리에 모두 로드하는 것이 아니라, 필요한 부분만 읽는다.

동시성을 제어하여 시스템을 과부하시키지 않는다. LLM API rate limit을 고려하여 적절한 concurrency limit을 설정한다. 컴파일러도 CPU intensive하므로, 동시 컴파일 수를 제한한다.

Graceful shutdown을 구현하여 작업 중 종료 요청이 오면 안전하게 종료한다. 진행 중인 LLM 호출을 완료하고, 상태를 저장한 후 종료한다. 다음 시작 시 이전 상태에서 재개할 수 있다.

리소스 누수를 방지한다. 파일 핸들, 네트워크 연결, 타이머 등을 명시적으로 해제한다. 에러 발생 시에도 finally 블록에서 리소스를 정리하여 누수를 방지한다.
