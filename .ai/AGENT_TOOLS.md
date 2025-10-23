# Agent Tools

## Tool Philosophy

AutoBE 에이전트는 Function Calling을 통해 구조화된 출력을 생성한다. Tool은 에이전트가 호출할 수 있는 함수를 정의하며, JSON 스키마로 파라미터와 반환 타입을 명시한다. 이를 통해 자유 형식 텍스트가 아닌 타입 안전한 데이터 구조를 얻을 수 있다.

Tool 설계의 핵심 원칙은 **명확성**이다. 도구의 이름, 설명, 파라미터 타입은 매우 명확해야 한다. LLM이 도구를 올바르게 선택하고, 정확한 파라미터를 전달하도록 유도한다. 모호한 Tool 정의는 잘못된 호출이나 Schema Validation 오류를 초래한다.

Tool은 **원자적**이어야 한다. 하나의 Tool은 하나의 명확한 작업만 수행한다. 여러 작업을 하나의 Tool에 묶으면 복잡도가 증가하고, 에이전트가 혼란스러워한다. 필요하면 여러 Tool을 정의하고, 에이전트가 순차적으로 호출하도록 한다.

Tool은 **검증 가능**해야 한다. JSON 스키마를 통해 파라미터 타입, 필수 필드, 값 범위를 명시한다. LLM이 스키마를 벗어난 출력을 생성하면 자동으로 거부되고, 재시도된다. 이를 통해 출력의 품질을 보장한다.

## Function Calling Mechanism

AutoBE는 Anthropic Claude의 Function Calling 기능을 사용한다.

### Tool Definition

Tool은 TypeScript로 정의되며, `@agentica/core`의 타입을 사용한다. 각 Tool은 이름, 설명, 파라미터 스키마를 가진다.

```typescript
{
  name: "generate_api_endpoint",
  description: "Generate a NestJS API endpoint implementation",
  input_schema: {
    type: "object",
    properties: {
      path: {
        type: "string",
        description: "API endpoint path (e.g., /api/users/:id)"
      },
      method: {
        type: "string",
        enum: ["GET", "POST", "PUT", "PATCH", "DELETE"],
        description: "HTTP method"
      },
      implementation: {
        type: "string",
        description: "Complete TypeScript implementation code"
      }
    },
    required: ["path", "method", "implementation"]
  }
}
```

Tool 이름은 동사로 시작하여 작업을 명확히 표현한다. `generate`, `create`, `validate`, `correct` 같은 명확한 동사를 사용한다. 에이전트가 도구의 목적을 즉시 이해할 수 있어야 한다.

Tool 설명은 구체적이고 상세해야 한다. 단순히 "API를 생성한다"가 아니라, "OpenAPI Operation을 NestJS Controller 메서드로 변환하고, Service 계층 로직을 구현하며, Prisma를 사용한 데이터베이스 접근을 포함한다"처럼 작성한다.

파라미터 스키마는 엄격하게 정의한다. 모든 필드의 타입, 설명, 제약을 명시한다. `enum`을 사용하여 허용된 값을 제한하고, `pattern`을 사용하여 문자열 형식을 검증한다. `required` 배열로 필수 필드를 지정한다.

### Tool Invocation

에이전트는 System Prompt의 지시에 따라 Tool을 호출한다. LLM이 Tool 호출을 결정하면, Tool 이름과 파라미터를 JSON으로 출력한다.

AutoBE는 스트리밍 방식으로 Tool 호출을 받는다. LLM이 Tool 파라미터를 생성하는 동안 실시간으로 수신하고, 완료되면 즉시 검증한다. 스트리밍은 응답 시간을 단축하고, 사용자 경험을 개선한다.

Tool 호출 검증은 JSON 스키마 기반으로 이루어진다. 파라미터가 스키마에 맞는지, 필수 필드가 모두 존재하는지, 타입이 올바른지 확인한다. 검증 실패 시 명확한 오류 메시지와 함께 LLM에게 피드백하고, 재시도를 요청한다.

Tool 호출 성공 시 결과를 이벤트로 발행한다. 이벤트는 Tool 이름, 파라미터, 결과를 포함하며, 상태에 저장된다. Frontend는 이벤트를 구독하여 UI를 업데이트한다.

### Tool Response

Tool 호출 후 결과를 LLM에게 반환할 수 있다. 일반적으로 AutoBE는 Tool 호출 자체가 최종 출력이므로 추가 응답이 필요 없지만, 일부 경우 LLM이 Tool 결과를 해석하고 후속 작업을 수행해야 한다.

예를 들어 Compiler 검증 Tool을 호출하면, 컴파일 성공 여부와 오류 메시지가 반환된다. LLM은 이를 분석하고, 오류가 있으면 수정된 코드를 생성한다. 이러한 반복적 프로세스는 Tool 응답을 통해 구현된다.

Tool 응답도 구조화된다. 성공/실패 상태, 결과 데이터, 오류 메시지를 명확히 구분한다. LLM이 응답을 파싱하고 적절히 대응하도록 형식을 일관되게 유지한다.

## Tool Categories

AutoBE의 Tool은 기능에 따라 분류된다.

### Generation Tools

코드나 문서를 생성하는 Tool이다. `generate_analysis_document`, `generate_prisma_schema`, `generate_api_operation`, `generate_test_code`, `generate_implementation` 등이 이에 해당한다.

Generation Tool은 **완전한 출력**을 요구한다. 부분적인 코드 스니펫이 아니라, 컴파일 가능한 완전한 파일을 생성해야 한다. 모든 import, 타입 정의, 구현이 포함되어야 한다.

Generation Tool은 **컨텍스트 참조**를 명확히 한다. 어떤 입력을 참조하여 출력을 생성하는지 파라미터와 설명에 명시한다. 예를 들어 `generate_implementation`은 `openapi_operation_id`를 파라미터로 받아, 특정 OpenAPI Operation을 구현한다.

Generation Tool은 **메타데이터**를 포함한다. 생성된 코드뿐만 아니라, 파일 경로, 설명, 의존성 정보도 함께 반환한다. 이를 통해 Orchestrator가 출력을 적절히 처리할 수 있다.

### Review Tools

생성된 출력을 검토하고 개선하는 Tool이다. `review_analysis`, `review_schema`, `review_operation` 등이 이에 해당한다.

Review Tool은 **비판적 평가**를 요구한다. 단순히 승인하는 것이 아니라, 실제 문제를 찾고 개선점을 제안한다. 일관성, 완전성, 품질을 검증한다.

Review Tool은 **구체적 피드백**을 반환한다. "좋다", "나쁘다"가 아니라, "Line 15의 타입 정의가 Prisma 스키마와 불일치", "DELETE 작업에 soft delete 필드가 누락됨" 같은 구체적 지적을 한다.

Review Tool은 **수정안**을 제공할 수 있다. 문제를 지적하는 것뿐만 아니라, 수정된 버전을 함께 반환한다. Orchestrator는 이를 바로 적용하거나, 원본과 비교하여 최종 결정을 내린다.

### Correction Tools

컴파일 오류를 수정하는 Tool이다. `correct_prisma_error`, `correct_typescript_error`, `correct_schema_validation_error` 등이 이에 해당한다.

Correction Tool은 **오류 컨텍스트**를 파라미터로 받는다. 오류 메시지, 오류 위치, 관련 코드 스니펫을 제공하여, LLM이 정확한 수정을 할 수 있도록 한다.

Correction Tool은 **최소 변경 원칙**을 따른다. 전체 코드를 다시 쓰는 것이 아니라, 오류 부분만 수정한다. 이를 통해 기존 작동하는 코드를 보존하고, 새로운 오류를 도입하지 않는다.

Correction Tool은 **학습**을 적용한다. 이전 오류와 동일한 실수를 반복하지 않도록, 오류 패턴을 분석하고 예방 조치를 포함한다. System Prompt에 "이전에 발생한 오류"를 추가하여 재발을 방지한다.

### Planning Tools

작업 계획을 수립하는 Tool이다. `plan_analysis`, `plan_api_endpoints`, `plan_test_scenarios` 등이 이에 해당한다.

Planning Tool은 **우선순위**를 정한다. 여러 작업 중 어떤 것을 먼저 수행할지, 의존성이 무엇인지 명시한다. Orchestrator는 이를 바탕으로 실행 순서를 결정한다.

Planning Tool은 **자원 추정**을 제공할 수 있다. 각 작업에 소요될 시간, 토큰 사용량을 예측한다. 사용자에게 전체 파이프라인의 예상 소요 시간을 알려준다.

Planning Tool은 **검증 가능**해야 한다. 계획이 실행 가능한지, 충돌이 없는지 확인한다. 불가능한 계획은 거부하고, 수정안을 제시한다.

## Schema Design Best Practices

효과적인 Tool 스키마를 설계하려면 다음 원칙을 따른다.

### Type Safety

모든 필드는 명확한 타입을 가져야 한다. `string`, `number`, `boolean`, `array`, `object` 중 하나를 사용한다. `any`나 `unknown` 같은 모호한 타입을 피한다.

복잡한 타입은 `object`로 정의하고, `properties`로 하위 필드를 명시한다. 중첩된 구조도 명확히 정의하여, LLM이 정확한 형식을 생성하도록 한다.

배열의 항목 타입도 명시한다. `type: "array", items: { type: "string" }`처럼 배열 요소의 타입을 정의한다. 복잡한 객체 배열도 `items: { type: "object", properties: {...} }`로 정의한다.

Enum을 적극 사용한다. 제한된 값만 허용되는 필드는 `enum` 배열로 가능한 값을 나열한다. LLM이 잘못된 값을 생성하는 것을 방지한다.

### Descriptions

모든 필드는 상세한 설명을 가져야 한다. 필드의 목적, 형식, 예시를 포함한다. LLM은 설명을 읽고 올바른 값을 생성한다.

설명은 **명령형**으로 작성한다. "사용자 이름"이 아니라 "사용자의 고유 식별자, 영문 소문자와 숫자만 사용, 3-20자 길이"처럼 구체적으로 작성한다.

예시를 포함한다. `example: "john_doe"`, `example: 42` 같이 실제 값을 제시한다. LLM은 예시를 참조하여 유사한 형식의 값을 생성한다.

제약을 명시한다. 최소/최대 길이, 정규표현식 패턴, 값 범위를 설명에 포함한다. `minLength`, `maxLength`, `pattern` 같은 JSON Schema 키워드를 사용한다.

### Required Fields

필수 필드는 `required` 배열에 명시한다. LLM이 필수 필드를 누락하면 Schema Validation 오류가 발생하고, 재시도된다.

필수 여부를 신중히 결정한다. 너무 많은 필드를 필수로 하면 LLM이 부담스러워하고, 너무 적으면 불완전한 출력이 나온다. 최소한의 필수 필드만 지정하고, 나머지는 선택으로 둔다.

선택 필드는 기본값을 가질 수 있다. 스키마에 `default` 키워드를 사용하여 기본값을 명시한다. LLM이 해당 필드를 생략하면 기본값이 사용된다.

### Validation Rules

JSON Schema의 검증 규칙을 활용한다. `minLength`, `maxLength`, `minimum`, `maximum`, `pattern`, `format` 등을 사용하여 값의 범위를 제한한다.

정규표현식 패턴을 사용하여 문자열 형식을 검증한다. 예를 들어 API 경로는 `/^\/api\/[a-z-]+$/` 같은 패턴으로 검증한다. LLM이 잘못된 형식을 생성하면 즉시 감지된다.

커스텀 검증 로직도 추가할 수 있다. Schema Validation 통과 후, 추가 비즈니스 로직으로 값을 검증한다. 예를 들어 참조하는 테이블이 Prisma 스키마에 실제로 존재하는지 확인한다.

### Nested Structures

복잡한 데이터는 중첩된 객체로 표현한다. 평탄한 구조보다 계층적 구조가 의미를 명확히 전달한다.

```typescript
{
  type: "object",
  properties: {
    endpoint: {
      type: "object",
      properties: {
        path: { type: "string" },
        method: { type: "string", enum: ["GET", "POST", ...] }
      },
      required: ["path", "method"]
    },
    implementation: {
      type: "object",
      properties: {
        controller: { type: "string" },
        service: { type: "string" }
      },
      required: ["controller", "service"]
    }
  },
  required: ["endpoint", "implementation"]
}
```

중첩 깊이는 적절히 유지한다. 너무 깊으면 LLM이 구조를 놓치고, 너무 얕으면 의미가 모호해진다. 일반적으로 2-3 레벨이 적당하다.

## Tool Evolution

Tool은 에이전트와 함께 진화한다.

### Adding New Tools

새로운 기능이 필요하면 새 Tool을 추가한다. 기존 Tool을 무리하게 확장하기보다, 명확한 목적을 가진 새 Tool을 정의하는 것이 낫다.

새 Tool 추가 시 다음을 고려한다:
- 기존 Tool과의 중복은 없는가?
- Tool의 책임이 명확한가?
- 스키마가 충분히 상세한가?
- System Prompt에 Tool 사용법이 설명되어 있는가?

새 Tool은 작게 시작한다. 초기에는 최소한의 파라미터만 정의하고, 사용하면서 점진적으로 확장한다. 한 번에 완벽한 Tool을 만들려 하지 않는다.

### Deprecating Tools

사용되지 않는 Tool은 제거한다. 코드베이스를 깔끔하게 유지하고, LLM이 잘못된 Tool을 선택하는 것을 방지한다.

Deprecation은 점진적으로 진행한다. 먼저 Tool 설명에 "DEPRECATED: Use xxx instead"를 추가한다. 충분한 기간 후 완전히 제거한다. System Prompt에서도 해당 Tool 언급을 삭제한다.

### Refactoring Tools

Tool 스키마는 리팩토링될 수 있다. 사용 패턴을 분석하여 스키마를 개선한다. 자주 사용되지 않는 필드는 제거하고, 자주 필요한 필드는 추가한다.

Breaking change는 신중히 진행한다. 기존 Tool 사용 코드가 많으면, 새 버전의 Tool을 추가하고 점진적으로 마이그레이션한다. 모든 사용처가 업데이트된 후 이전 버전을 제거한다.

### Monitoring Usage

Tool 사용 통계를 수집한다. 어떤 Tool이 자주 호출되는지, 어떤 Tool이 자주 실패하는지 추적한다. 문제가 있는 Tool을 식별하고 개선한다.

Schema Validation 오류를 분석한다. 특정 필드에서 오류가 자주 발생하면, 스키마나 설명이 불명확할 수 있다. 개선하여 오류율을 낮춘다.

Tool 호출 시간도 측정한다. 일부 Tool이 유독 느리면, 파라미터가 너무 복잡하거나 LLM이 생성하기 어려운 형식일 수 있다. 단순화를 고려한다.

## Integration with System Prompts

Tool과 System Prompt는 밀접하게 협업한다.

System Prompt는 언제, 어떻게 Tool을 사용할지 안내한다. "작업 완료 시 generate_implementation Tool을 호출하라", "모든 필수 필드를 채우고, 코드는 완전히 작성하라" 같은 지시를 포함한다.

Tool 스키마와 프롬프트 설명이 일치해야 한다. 프롬프트에 "path 필드에 API 경로를 넣으라"고 하면, 스키마에도 `path` 필드가 정의되어 있어야 한다. 불일치하면 LLM이 혼란스러워한다.

Tool 예시를 프롬프트에 포함한다. 실제 Tool 호출 예시를 보여주어, LLM이 정확한 형식을 이해하도록 한다. Few-shot learning을 통해 출력 품질이 크게 향상된다.

## Testing Tools

Tool은 독립적으로 테스트 가능해야 한다.

### Schema Validation Testing

다양한 입력으로 스키마 검증을 테스트한다. 유효한 입력은 통과하고, 무효한 입력은 거부되는지 확인한다.

엣지 케이스를 테스트한다. 빈 문자열, null, undefined, 매우 긴 문자열, 음수, 특수 문자 등을 시도한다. 스키마가 모든 예외를 잡는지 검증한다.

### Integration Testing

Tool을 실제 LLM과 통합하여 테스트한다. 간단한 System Prompt와 함께 LLM에게 Tool을 제공하고, 올바르게 호출하는지 확인한다.

여러 시나리오를 테스트한다. 정상 케이스, 복잡한 케이스, 엣지 케이스를 모두 시도한다. LLM이 일관되게 올바른 출력을 생성하는지 검증한다.

### Error Handling Testing

Schema Validation 실패 시 적절한 오류 메시지가 생성되는지 확인한다. 오류 메시지가 명확하고, LLM이 이해하여 수정할 수 있는 수준인지 검증한다.

재시도 로직을 테스트한다. LLM이 오류 피드백을 받고 수정된 출력을 생성하는지 확인한다. 대부분의 오류가 1-2회 재시도로 해결되는지 검증한다.

## Performance Considerations

Tool 설계는 성능에 영향을 미친다.

복잡한 스키마는 LLM이 생성하는 데 더 많은 시간과 토큰을 소비한다. 필요한 필드만 포함하고, 불필요한 복잡성을 제거한다.

스키마 크기를 최적화한다. 매우 상세한 설명은 좋지만, 과도하면 컨텍스트를 소비한다. 핵심 정보만 간결하게 작성한다.

Tool 호출 빈도를 고려한다. 자주 호출되는 Tool은 특히 최적화한다. 스키마를 단순화하고, Prompt Caching을 적용하여 효율을 높인다.

배치 처리를 고려한다. 여러 개의 유사한 작업을 한 번의 Tool 호출로 처리할 수 있다면, 배열 파라미터를 사용한다. 예를 들어 10개 API를 개별 호출하는 대신, 배열로 한 번에 전달한다. 단, 이는 개별 재시도를 어렵게 하므로 트레이드오프를 고려한다.
