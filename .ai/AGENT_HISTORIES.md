# Agent Histories

## History Philosophy

History는 에이전트가 받는 컨텍스트를 말한다. AutoBE에서 History는 단순한 대화 기록이 아니라, 에이전트가 작업을 수행하는 데 필요한 모든 정보를 포함하는 구조화된 데이터이다.

History 설계의 핵심은 **최적화**이다. LLM의 컨텍스트 윈도우는 크지만 무한하지 않으며, 토큰 비용도 고려해야 한다. 불필요한 정보를 제거하고, 필요한 정보만 정확히 제공하는 것이 중요하다.

History는 **에이전트별로 맞춤화**된다. Realize Agent는 Prisma 스키마와 OpenAPI 문서가 필요하지만, 요구사항 수집 과정은 필요 없다. 각 에이전트에게 정확히 필요한 정보만 제공하여 효율을 극대화한다.

History는 **Prompt Caching을 고려**하여 설계된다. 반복적으로 사용되는 컨텍스트는 메시지 앞부분에 배치하여 캐싱되도록 한다. 요청마다 달라지는 내용은 뒷부분에 배치한다. 이를 통해 토큰 비용과 응답 시간을 크게 절감한다.

## History Transformation

History Transformer는 원시 상태를 에이전트용 메시지 배열로 변환한다.

### Transform Function Structure

각 단계는 전용 History Transformer를 가진다. `transformInterfaceAssetHistories`를 예로 들면, 이 함수는 `AutoBeState`를 받아 Interface 단계 에이전트가 필요로 하는 히스토리 메시지 배열을 반환한다.

Transformer는 `d:\github\wrtnlabs\autobe\packages\agent\src\orchestrate\interface\histories\transformInterfaceAssetHistories.ts:12` 같은 위치에 정의되며, 명확한 타입 시그니처를 가진다:

```typescript
export const transformInterfaceAssetHistories = (
  state: AutoBeState,
): Array<
  IAgenticaHistoryJson.IAssistantMessage | IAgenticaHistoryJson.ISystemMessage
> => {
  // transformation logic
}
```

Transformer는 **선택적 추출**을 수행한다. `state`에는 모든 단계의 히스토리가 있지만, 현재 에이전트에 필요한 부분만 추출한다. 예를 들어 Interface 단계는 `state.analyze`와 `state.prisma`만 참조한다.

Transformer는 **형식 변환**을 수행한다. 내부 상태 구조를 Claude API가 기대하는 메시지 형식으로 변환한다. JSON을 마크다운 코드 블록으로 감싸고, 명확한 섹션 제목을 추가한다.

### Message Types

Claude API는 여러 메시지 타입을 지원한다.

**System Message**는 에이전트의 맥락을 설정한다. System Prompt, 참조 데이터, 제약 조건 등이 포함된다. System Message는 캐싱에 적합하므로, 반복되는 컨텍스트는 System Message로 배치한다.

**Assistant Message**는 AI의 이전 응답을 나타낸다. 대화의 맥락을 유지하기 위해 사용되지만, AutoBE에서는 제한적으로 사용한다. 각 에이전트 호출이 독립적이므로, 이전 에이전트의 출력을 Assistant Message로 포함하는 경우가 일반적이다.

**User Message**는 사용자 요청을 나타낸다. 실제 사용자 메시지뿐만 아니라, 에이전트에게 전달하는 지시도 User Message로 표현된다. "아래 OpenAPI 명세를 구현하라"같은 구체적 작업 지시가 User Message에 포함된다.

### Content Formatting

History 내용은 명확하고 구조화된 형식으로 작성된다.

마크다운을 적극 활용한다. 제목, 코드 블록, 리스트를 사용하여 정보를 체계적으로 구성한다. LLM은 마크다운을 잘 이해하며, 구조화된 형식은 파싱을 용이하게 한다.

코드와 데이터는 코드 블록으로 감싼다. JSON 데이터는 `json` 코드 블록, TypeScript 코드는 `typescript` 코드 블록으로 표시한다. 언어 힌트는 LLM의 이해를 돕는다.

섹션 제목을 명확히 한다. "## Prisma DB Schema", "## OpenAPI Document", "## Requirements Analysis Report"처럼 무엇이 제공되는지 즉시 알 수 있도록 작성한다.

중요한 지시는 강조한다. `**IMPORTANT**`, `**CRITICAL**` 같은 표식을 사용하여 LLM의 주의를 끈다. 반드시 따라야 할 제약 조건은 명확히 강조한다.

## Context Optimization Strategies

컨텍스트 최적화는 성능과 비용에 직접 영향을 미친다.

### Selective Inclusion

모든 정보를 포함하지 않는다. 에이전트가 실제로 필요로 하는 정보만 선택적으로 포함한다.

Realize Agent를 예로 들면, 특정 API를 구현할 때 해당 OpenAPI Operation만 상세히 제공한다. 나머지 Operation은 경로와 메서드만 나열하여 전체 구조를 파악하게 한다. 이를 통해 수십만 토큰을 절감할 수 있다.

요구사항 분석 보고서는 전문(full text)이 아니라 요약만 제공한다. Realize 단계에서는 상세 분석이 필요 없고, OpenAPI 명세가 이미 모든 정보를 포함하기 때문이다.

오류 피드백 시에는 관련 부분만 포함한다. 컴파일 오류가 특정 파일에서 발생하면, 해당 파일의 코드와 오류 메시지만 제공한다. 전체 프로젝트를 다시 보낼 필요가 없다.

### Summarization

긴 내용은 요약하여 제공한다. 핵심 정보는 유지하되, 불필요한 세부사항은 생략한다.

데이터베이스 스키마는 전체 Prisma 파일이 아니라 테이블 이름, 주요 필드, 관계만 나열할 수 있다. 에이전트가 전체 구조를 파악하면 충분하고, 모든 필드를 알 필요는 없는 경우에 적용한다.

요구사항은 bullet point로 요약한다. 긴 문단 대신 핵심 기능을 간결한 항목으로 나열한다. LLM은 요약된 정보를 빠르게 이해하고 작업을 수행한다.

이전 단계의 출력은 메타데이터만 포함한다. 예를 들어 "10개의 API가 정의되었으며, 인증 메커니즘은 JWT이다" 같은 핵심 정보만 전달한다.

### Deduplication

중복 정보를 제거한다. 동일한 내용이 여러 곳에 있으면 하나만 남긴다.

Prisma 스키마가 여러 에이전트에게 제공될 때, 매번 전체 내용을 보내는 대신 첫 번째 에이전트에게만 보내고 나머지는 "Prisma schema는 위와 동일"이라고 참조할 수 있다. 단, Prompt Caching을 사용하면 중복이 문제되지 않으므로, 캐싱 전략과 함께 고려한다.

### Compression

가능하면 간결한 표현을 사용한다. 장황한 설명보다 명확하고 간결한 표현이 낫다.

"This API endpoint allows users to retrieve information about a specific user by providing their unique identifier"보다 "Get user by ID"가 간결하다. 물론 맥락에 따라 상세 설명이 필요할 수 있으므로, 균형을 유지한다.

JSON 대신 테이블 형식을 고려한다. 간단한 데이터는 마크다운 테이블이 더 간결할 수 있다. LLM은 테이블도 잘 이해한다.

## Prompt Caching Strategy

Anthropic의 Prompt Caching 기능을 최대한 활용한다.

### Cache-Friendly Structure

캐싱 가능한 컨텍스트는 메시지 배열의 앞부분에 배치한다. System Prompt, Prisma 스키마, OpenAPI 문서처럼 반복적으로 사용되는 내용이 해당한다.

요청마다 달라지는 내용은 뒷부분에 배치한다. "현재 구현할 API: GET /api/users/:id" 같은 특정 작업 지시는 마지막 메시지로 추가한다. 이렇게 하면 앞부분은 캐싱되고, 마지막 메시지만 새로 전송된다.

메시지 순서를 일관되게 유지한다. 메시지 순서가 바뀌면 캐시가 무효화되므로, 항상 동일한 순서로 배치한다. System Message → Context Messages → Task Message 순서를 고정한다.

### Cache Key Management

각 작업 배치에 `promptCacheKey`를 할당한다. 동일한 캐시를 공유해야 하는 작업들은 동일한 키를 사용한다.

Realize 단계에서 40개 API를 구현할 때, 모두 동일한 Prisma 스키마와 OpenAPI 문서를 참조한다. 첫 번째 API 구현 시 캐시가 생성되고, 나머지 39개는 이를 재사용한다. `promptCacheKey: "realize-batch-1"` 같은 형식으로 관리한다.

캐시 무효화를 적절히 처리한다. Prisma 스키마가 수정되면 기존 캐시는 무효가 되어야 한다. 새로운 캐시 키를 생성하여 캐시를 갱신한다. 버전 번호를 키에 포함하여 관리할 수 있다: `promptCacheKey: "prisma-v2"`.

### Cache Monitoring

캐시 히트율을 추적한다. Anthropic API 응답에 캐시 통계가 포함되므로, 이를 로깅하고 분석한다. 히트율이 낮으면 캐싱 전략을 재검토한다.

토큰 절감량을 측정한다. 캐싱 전과 후의 토큰 사용량을 비교하여 효과를 정량화한다. Realize 단계에서는 80% 이상의 토큰 절감이 가능하다.

캐시 만료를 고려한다. Anthropic의 캐시는 5분간 유지되므로, 작업 간격이 5분을 초과하면 캐시가 만료된다. 배치 작업을 5분 내에 완료하도록 조율한다.

## Stage-Specific History Patterns

각 단계는 고유한 History 패턴을 가진다.

### Analyze Stage

Analyze 단계는 사용자 요구사항을 입력으로 받는다. 이전 단계가 없으므로, History는 비교적 단순하다.

사용자 메시지를 정제하여 포함한다. 원시 대화 기록을 그대로 주는 것이 아니라, 요구사항만 추출하고 구조화한다. "사용자는 다음 기능을 요구함: 1) 사용자 관리, 2) 게시글 CRUD, 3) 댓글 시스템"처럼 정리한다.

도메인 지식을 제공한다. 일반적인 웹 애플리케이션 패턴, 인증 메커니즘, CRUD 작업에 대한 컨텍스트를 포함한다. 에이전트가 전문적 분석을 수행하도록 돕는다.

### Prisma Stage

Prisma 단계는 Analyze 결과를 입력으로 받는다. 요구사항 분석 보고서를 Prisma 스키마로 변환한다.

요구사항 분석 보고서 전체를 JSON 형식으로 제공한다. 액터, 유스케이스, 기능 명세가 모두 포함된다. Prisma Agent는 이를 바탕으로 필요한 테이블을 식별한다.

데이터 모델링 best practice를 포함한다. 정규화 원칙, 관계 설정 방법, 인덱스 전략 등을 History에 포함하여 에이전트가 참조하도록 한다.

### Interface Stage

Interface 단계는 Analyze와 Prisma 결과를 모두 참조한다. 가장 복잡한 History 구조를 가진다.

`d:\github\wrtnlabs\autobe\packages\agent\src\orchestrate\interface\histories\transformInterfaceAssetHistories.ts`를 보면, 요구사항 분석 보고서와 Prisma 스키마를 모두 포함한다. 또한 ERD 다이어그램도 제공하여 데이터 관계를 시각화한다.

**Critical Schema Verification Instructions**를 강조한다 (`d:\github\wrtnlabs\autobe\packages\agent\src\orchestrate\interface\histories\transformInterfaceAssetHistories.ts:46-55`). Prisma 스키마에 실제로 존재하는 필드만 참조하도록 명시적으로 지시한다. 이는 Interface 단계에서 가장 흔한 오류를 예방한다.

### Test Stage

Test 단계는 OpenAPI 문서를 입력으로 받는다. API 명세를 E2E 테스트로 변환한다.

OpenAPI 문서 전체를 제공한다. 모든 엔드포인트, 스키마, 인증 메커니즘이 포함된다. Test Agent는 이를 바탕으로 테스트 시나리오를 계획한다.

테스트 전략 가이드를 포함한다. Arrange-Act-Assert 패턴, 테스트 데이터 생성 방법, 예외 케이스 검증 등을 History에 포함한다.

### Realize Stage

Realize 단계는 가장 많은 컨텍스트를 필요로 한다. Prisma 스키마, OpenAPI 문서, Authorization 정보를 모두 참조한다.

Prisma 스키마와 OpenAPI 문서는 캐싱 가능한 메시지로 배치한다. 모든 API 구현에서 동일하므로, 한 번만 전송하고 캐시를 재사용한다.

특정 API 구현 지시는 마지막 메시지로 추가한다. "현재 구현할 엔드포인트: POST /api/users, 아래 OpenAPI Operation을 참조하라" 같은 구체적 작업을 지시한다.

Authorization 로직은 별도 섹션으로 제공한다. 어떤 엔드포인트가 어떤 권한을 필요로 하는지 명시하여, 에이전트가 적절한 가드를 추가하도록 한다.

## Context Window Management

LLM의 컨텍스트 윈도우를 효과적으로 관리한다.

### Window Size Awareness

Claude 3.7 Sonnet은 200K 토큰 컨텍스트를 지원하지만, 이를 모두 사용하는 것은 비효율적이다. 일반적으로 20-50K 토큰 범위에서 작업하는 것이 최적이다.

컨텍스트 크기를 추정한다. 각 History 컴포넌트의 대략적 토큰 수를 파악하고, 합계가 적절한 범위인지 확인한다. 초과하면 요약이나 생략을 고려한다.

### Progressive Loading

필요한 정보를 단계적으로 로드한다. 초기에는 개요만 제공하고, 에이전트가 추가 정보를 요청하면 제공한다.

단, AutoBE의 Single-Pass 원칙상 에이전트는 한 번의 호출로 완료해야 하므로, Progressive Loading은 제한적으로 사용된다. 주로 Planning 단계에서는 개요를, Generation 단계에서는 상세를 제공하는 방식으로 적용한다.

### Truncation Strategies

컨텍스트가 너무 크면 일부를 truncate한다. 중요도가 낮은 정보부터 제거한다.

긴 목록은 제한한다. 100개의 항목이 있으면 대표적인 10개만 보여주고, "... 나머지 90개 생략"이라고 표시한다. 에이전트는 패턴을 파악하면 충분하다.

오래된 정보는 제거한다. 여러 단계를 거친 정보 중 현재 작업과 관련 없는 것은 History에서 제외한다.

## History Testing

History Transformer는 테스트되어야 한다.

### Structure Validation

생성된 History 구조가 올바른지 검증한다. 메시지 타입, 순서, 필수 필드가 모두 올바른지 확인한다.

각 섹션이 예상된 형식인지 검증한다. JSON 코드 블록이 유효한 JSON인지, 마크다운 구조가 올바른지 파싱하여 확인한다.

### Content Accuracy

History 내용이 실제 상태를 정확히 반영하는지 검증한다. Prisma 스키마가 `state.prisma.schemas`와 일치하는지, OpenAPI 문서가 `state.interface.document`와 일치하는지 확인한다.

### Cache Effectiveness

Prompt Caching이 의도대로 작동하는지 테스트한다. 동일한 캐시 키로 여러 요청을 보내고, 캐시 히트가 발생하는지 확인한다.

캐시 무효화도 테스트한다. 컨텍스트가 변경되면 새로운 캐시가 생성되는지, 이전 캐시는 사용되지 않는지 검증한다.

### Token Usage

History의 토큰 사용량을 측정한다. 예상보다 많이 사용되면 최적화가 필요하다. 각 섹션의 토큰 수를 파악하여 불필요한 부분을 식별한다.

## Evolution and Maintenance

History Transformer는 에이전트 및 프롬프트와 함께 진화한다.

System Prompt가 변경되면 History도 업데이트해야 한다. 프롬프트가 새로운 컨텍스트를 기대하면, Transformer가 이를 제공하도록 수정한다.

에이전트 출력 품질을 모니터링하여 History를 개선한다. 특정 정보가 부족하여 에이전트가 잘못된 출력을 생성하면, 해당 정보를 History에 추가한다.

토큰 비용을 지속적으로 최적화한다. 사용량을 추적하고, 불필요한 컨텍스트를 제거하며, Prompt Caching을 확대 적용한다. 비용 절감과 품질 유지의 균형을 찾는다.

History는 AutoBE 성능의 핵심이다. 좋은 History는 에이전트가 효과적으로 작업하도록 돕고, 토큰 비용을 절감하며, 응답 시간을 단축한다. 지속적으로 모니터링하고 개선하여 최적의 컨텍스트를 제공한다.
