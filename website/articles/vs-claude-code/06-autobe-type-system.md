# AutoBE 심층 분석: AST 타입 시스템, Function Calling, 그리고 타입 주도 설계

이 리포트에서는 네 가지 핵심 AST 타입 시스템(`AutoBeAnalyze`, `AutoBeDatabase`, `AutoBeOpenApi`, `AutoBeTest`), LLM 생성에 효과적인 "부재에 의한 제약(constraint by absence)" 원칙, LLM과 이러한 타입을 연결하는 function calling 인프라, 그리고 컴파일 타임 정확성을 강제하는 고급 TypeScript 패턴을 분석한다. 모든 내용은 실제 코드 분석에 근거한다.

---

## 1. 네 가지 AST 타입

### 1.1 AutoBeAnalyze (127줄)

`packages/interface/src/analyze/AutoBeAnalyze.ts`에 위치하며, 요구사항 문서 구조를 정의하는 가장 단순한 AST이다.

**계층 구조**: `IFile` -> `IModule` (#) -> `IUnit` (##) -> `ISection` (###)

**주요 설계 결정**:
- `IActor`는 정확히 3가지 역할만 가진다: `"guest"`, `"member"`, `"admin"`. 커스텀 역할은 없다.
- Actor 이름은 `CamelCasePattern` 교차 타입을 통해 CamelCase를 강제한다
- `IFileScenario`는 LLM이 생성 전에 계획을 세울 수 있도록 선택적 계획 필드(`documentType`, `audience`, `keyQuestions`, `detailLevel`, `constraints`)를 보유한다
- 파일 내용이 제약된다: "PROHIBITED: questions to the reader, feedback requests, interactive elements, or meta-commentary about the writing process"

이 타입의 강점은 단순함에 있다. 127줄로, LLM에게 에러를 범할 수 있는 최소한의 표면적을 제공하면서도 핵심적인 문서 계층 구조를 포착한다.

### 1.2 AutoBeDatabase (192줄)

`packages/interface/src/database/AutoBeDatabase.ts`에 위치하며, "부재에 의한 제약"의 정수를 보여준다.

**계층 구조**: `IApplication` -> `IFile` -> `IModel` -> Fields + Indexes

**7개 타입 필드 시스템**: `IPlainField.type`은 정확히 7개 값의 union이다:

```typescript
type: "boolean" | "int" | "double" | "string" | "uri" | "uuid" | "datetime"
```

PostgreSQL은 40개 이상의 데이터 타입을 지원한다 (varchar, text, char, smallint, bigint, real, decimal, numeric, bytea, json, jsonb, array, enum 등). 이를 7개로 줄임으로써, AutoBE는 LLM이 빈번히 오용하는 33개 이상의 옵션을 제거한다. `varchar(255)` vs `text` 결정이 없다. `decimal` vs `numeric` vs `float` 모호함이 없다. `json` vs `jsonb` 선택이 없다. LLM은 단순히 이러한 문제적 타입들을 생성할 수 없다.

**Stance discriminator**: `IModel.stance`의 5개 값은 데이터베이스 스키마를 API 엔드포인트 생성과 연결한다:

```typescript
stance: "primary" | "subsidiary" | "snapshot" | "actor" | "session"
```

이 단일 필드가 각 모델의 전체 API 생성 전략을 인코딩한다:
- `"primary"` -> 전체 CRUD 엔드포인트
- `"actor"` -> 인증 엔드포인트 (회원가입, 로그인, 갱신)
- `"session"` -> 인증 흐름을 통해 관리, 독립 엔드포인트 없음
- `"subsidiary"` -> 부모 아래 중첩, 제한된 엔드포인트
- `"snapshot"` -> 읽기 전용, 추가 전용

**외래 키는 항상 UUID**: `IForeignField.type`은 `"uuid"`로 하드코딩되어 있다. 정수 FK도, 복합 FK도, 자연 키도 없다. 이것이 FK 오용의 전체 범주를 제거한다.

**SnakeCase 강제**: 모델명은 `SnakeCasePattern`을, 관계명은 `CamelCasePattern`을 사용한다. 교차 타입을 통해 타입 레벨에서 강제된다.

**`IPrimaryField.nullable`**: `@ignore`와 `@internal`로 표시되어 있지만 타입 정의에는 여전히 노출되어 있다. 기술적으로 데드 코드이다 -- 기본 키는 절대 nullable이면 안 된다 -- 하지만 인터페이스에 남아 있어, LLM 혼란의 잠재적 원인이 될 수 있다.

### 1.3 AutoBeOpenApi (610줄)

`packages/interface/src/openapi/AutoBeOpenApi.ts`에 위치하며, LLM 생성에 최적화된 단순화된 OpenAPI v3.1 명세를 정의한다.

**주요 단순화**:

- **Content-type 모호함 제거**: 모든 요청/응답 본문은 항상 `application/json`. 파일 업로드는 `string & tags.Format<"uri">`를 사용한다.
- **Path 파라미터만**: query, header, cookie 파라미터 없음. Path param은 원시 타입(`IInteger | INumber | IString`)으로 제한된다.
- **소문자 HTTP 메서드**: `"get" | "post" | "put" | "delete" | "patch"` -- 대문자 변형 불허.
- **Actor 기반 인증**: OAuth2/API key/Bearer token 복잡성 대신, 인증은 단순한 actor 이름(`authorizationActor: string | null`)이다.
- **Path 정규식 검증**: `tags.Pattern<"^\\/[a-zA-Z0-9\\/_{}.-]*$">`이 타입 레벨에서 유효한 URL 경로를 강제한다.

**`IJsonSchema` 10개 변형 union**:

```typescript
export type IJsonSchema =
  | IConstant | IBoolean | IInteger | INumber | IString
  | IArray | IObject | IReference | IOneOf | INull;
```

**전략적 `Exclude<>` 제약으로 `$ref` 재사용 강제**:

```typescript
// 배열 항목은 인라인 객체가 될 수 없음 -- $ref를 강제
export interface IArray {
  items: Exclude<IJsonSchema, IJsonSchema.IObject>;
}

// OneOf 멤버는 인라인 객체나 중첩 oneOf가 될 수 없음
export interface IOneOf {
  oneOf: Exclude<IJsonSchema, IJsonSchema.IOneOf | IJsonSchema.IObject>[];
}

// Additional properties는 인라인 객체가 될 수 없음
export interface IObject {
  additionalProperties?: false | Exclude<IJsonSchema, IJsonSchema.IObject>;
}
```

이 `Exclude<>` 제약은 매우 중요하다: 배열, union, 또는 additional properties에 나타나는 모든 객체 타입에 대해 `$ref` 참조를 사용하도록 LLM을 강제한다. 이를 통해 스키마 재사용을 보장하고, 유지보수가 어려운 깊이 중첩된 인라인 타입 정의를 방지한다.

**`IJsonSchemaProperty` 타입은 `IObject`를 제외한다**: 객체 타입은 속성 정의 내에 인라인으로 중첩될 수 없으며, 이 역시 `$ref` 사용을 강제한다. TypeScript 타입 레벨에서 강제되고 Typia에 의해 런타임에 검증된다.

### 1.4 AutoBeTest (3,173줄)

`packages/interface/src/test/AutoBeTest.ts`에 위치하며, 다른 AST와 비교할 수 없을 정도로 복잡하다. 완전한 테스트 표현식 언어를 정의한다.

**`plan -> draft -> statements` 사고 연쇄(chain-of-thought)**:

```typescript
export interface IFunction {
  plan: string;        // 테스트에 대한 전략적 추론
  draft: string;       // 드래프트 TypeScript 구현
  statements: IStatement[];  // 구조화된 AST 표현
}
```

이 3단계 접근법은 LLM이 생성 전에 사고하도록 강제한다. `plan` 필드가 전략적 추론을 포착하고, `draft` 필드가 동작하는 TypeScript 구현을 생성한 뒤, 그제서야 LLM이 구조화된 AST로 변환한다. 구체적인 구현에 AST를 기반시킴으로써 환각을 줄인다.

**5개 statement 타입**: `IApiOperateStatement`, `IExpressionStatement`, `IIfStatement`, `IReturnStatement`, `IThrowStatement`

**31개 expression 타입** -- 카테고리별 구성:
- 리터럴 (7): boolean, numeric, string, array, object, null, undefined
- 접근자 (3): identifier, property access, element access
- 연산자 (4): typeof, prefix unary, postfix unary, binary
- 함수형 (6): arrow function, call, new, array filter/forEach/map/repeat
- 랜덤 생성기 (9): pick, sample, boolean, integer, number, string, pattern, format, keyword
- 술어 (4): equal, not-equal, conditional, error

**금지된 구조**:
- `for`/`while` 루프 없음 -- 배열 메서드만 허용 (`IArrayForEachExpression`, `IArrayMapExpression`)
- `try`/`catch` 없음 -- 에러 테스트는 `IErrorPredicate`만 사용
- 느슨한 동치 없음 -- 엄격한 동치만 허용
- 구조 분해 없음 -- 명시적 속성 접근 필수
- 템플릿 리터럴 없음 -- `IBinaryExpression`을 통한 문자열 연결

**`IKeywordRandom`의 6개 키워드**: `"alphabets"`, `"alphaNumeric"`, `"paragraph"`, `"content"`, `"mobile"`, `"name"`. LLM이 지원되지 않는 `"title"`, `"email"`, `"address"` 같은 키워드 값을 환각하는 경향이 있어 문서가 광범위하다(30줄 이상). 문서에서 지원되지 않는 값을 명시적으로 나열하여 대응한다.

**데드 코드 -- `IConditionalExpression`**: 줄 1613에 타입 discriminator `"conditionalExpression"`으로 정의되어 있지만, `IExpression` union(줄 760-800)에는 포함되어 있지 않다. Union은 줄 800에서 `IErrorPredicate`로 끝나고, `IConditionalExpression`은 800줄 뒤에 정의되지만 참조되지 않는다. 이는 타입이 코드베이스에 존재하지만 LLM이 사용할 수 없다는 의미이다 -- Typia validator가 모든 `conditionalExpression` 타입 값을 거부한다.

---

## 2. 부재에 의한 제약 원칙

### 2.1 핑크 코끼리 문제

전통적인 프롬프트 엔지니어링은 "핑크 코끼리 문제"를 겪는다: LLM에게 "varchar 컬럼을 생성하지 마라"고 말하면 varchar 컬럼을 생성할 가능성이 *더 높아진다*. 모든 금지는 방지하려는 개념 자체를 도입한다.

AutoBE의 해결책: 타입 시스템에서 해당 개념을 완전히 제거한다. 스키마에 `varchar`가 포함되어 있지 않으면, LLM은 그것을 생성할 수 없다. 금지는 텍스트에 존재하지 않는다 -- 타입 구조에 존재한다.

### 2.2 구체적 축소

| 도메인 | 전체 표준 | AutoBE AST | 제거됨 |
|--------|----------|------------|--------|
| 데이터베이스 필드 타입 | PostgreSQL 40+ | 7 | 33+ 타입 |
| API 파라미터 | query, header, cookie, path | path만 | 3개 파라미터 위치 |
| Content type | multipart, form-data, json, xml 등 | json만 | 모든 비JSON |
| 인증 방식 | OAuth2, API key, Bearer, Basic 등 | Actor 이름 | 모든 복잡한 인증 |
| 테스트 제어 흐름 | for, while, do-while, switch, try-catch | 배열 메서드 + IErrorPredicate | 5개 루프/제어 구조 |
| JSON Schema | 전체 OpenAPI v3.1 | Exclude 제약이 있는 10개 변형 union | 중첩 인라인 객체, 중첩 oneOf |

### 2.3 Typia를 통한 런타임 강제

이러한 제약은 단순한 권고가 아니다 -- Typia 검증에 의해 런타임에 강제된다. LLM이 function calling 응답을 생성하면, Typia가 TypeScript 타입에 대해 출력을 검증한다. LLM이 `type: "varchar"`를 생성하면 Typia가 구조화된 검증 에러와 함께 거부하고, 이것이 교정을 위해 피드백된다.

이를 통해 2단계 강제가 만들어진다:
1. **스키마 레벨** (부재에 의한 제약): LLM의 function calling 스키마에 해당 옵션이 포함되어 있지 않음
2. **런타임 레벨** (Typia 검증): LLM이 값을 환각하더라도 검증이 이를 포착함

---

## 3. Function Calling 인프라

### 3.1 MicroAgentica 패턴

AutoBE의 모든 LLM 대화는 MicroAgentica 패턴을 사용한다: `ctx.conversate()` 호출마다 하나 이상의 함수를 포함하는 정확히 하나의 controller로 새로운 `MicroAgentica` agent를 생성한다.

Agent 생명주기:
1. Vendor, config, histories, 단일 controller로 `MicroAgentica` 생성
2. 이벤트 리스너 부착 (request, response, call, jsonParseError, validate)
3. `agent.conversate(userMessage)` 호출
4. `IPointer`를 통해 function calling 결과 추출
5. Agent 폐기 (명시적 disposal 없음)

### 3.2 `enforceFunctionCall`: 동의 메커니즘

`enforceFunctionCall`이 `true`인 경우, 시스템은 다음과 같이 동작한다:

1. API 요청에 `tool_choice = "required"`를 설정
2. 강압적인 지시문으로 사용자 메시지를 보강:
   ```
   You have to call function(s) of below to accomplish my request.
   Never hesitate the function calling. Never ask for me permission...
   ```
3. LLM이 함수를 호출하지 않고 응답하면, 동의 흐름에 진입:
   - `consentFunctionCall` 이벤트를 dispatch
   - 별도의 빠른 LLM으로 assistant의 메시지를 분석
   - 허가 요청 루프를 탈출하기 위한 "동의" 응답을 생성
4. 동의가 실패하면, 재시도 에스컬레이션에 진입 (최대 `FUNCTION_CALLING_RETRY = 3`):
   ```
   "You failed to call any function. You MUST call one of these functions immediately."
   ```

### 3.3 검증 메트릭

시스템은 연산별 상세 function calling 메트릭을 추적한다:

```typescript
interface AutoBeFunctionCallingMetric {
  attempt: number;        // 전체 FC 시도 수
  invalidJson: number;    // JSON 파싱 실패 수
  validationFailure: number; // Typia 검증 실패 수
  consent: number;        // 동의/재시도 시도 수
  success: number;        // 성공한 FC 호출 수
}
```

이 메트릭은 `AutoBeProcessAggregateCollection`을 통해 연산 레벨과 단계 레벨 양쪽에서 집계된다.

### 3.4 `forceRetry` 래퍼

`forceRetry` 유틸리티(`packages/agent/src/utils/forceRetry.ts`에 위치)는 지능적 에러 분류와 함께 전체 `conversate` 호출을 래핑한다:

```typescript
export const forceRetry = async <T>(
  task: () => Promise<T>,
  count: number = 3,
  predicate?: (error: unknown) => boolean,
): Promise<T> => { ... };
```

Predicate 함수가 에러를 분류한다:
- **영구적 에러** (재시도하지 않음): `context_length_exceeded`, `maximum context length`, `request too large`
- **일시적 에러** (재시도): `APIError`, `BadRequestError`, `AgenticaJsonParseError`, `AgenticaValidationError`, `TypeError`, OpenRouter 업스트림 에러

이를 통해 반복으로 해결할 수 없는 에러에 재시도를 낭비하지 않는다.

---

## 4. 타입 안전성 분석

### 4.1 Interface 패키지: `any` 제로

`packages/interface/src/`는 모든 파일에 걸쳐 `any`가 **단 하나도** 없다. 이 규모의 패키지(100개 이상 파일에 걸쳐 4,000줄 이상)에서 이는 주목할 만한 성과이다. 모든 타입이 완전히 명세되어 있다.

### 4.2 Agent 패키지: 통제된 `any` 사용

`packages/agent/src/`는 코드베이스 전체에 25개의 `as any` 캐스트를 포함한다. 이것들은 다음에 국한된다:
- TypeScript가 타입을 좁힐 수 없는 discriminated union에 대한 동적 속성 접근
- 타입 시스템이 관계를 검증할 수 없는 `satisfies` 제약
- 제네릭 LLM 스키마를 조작하는 인프라 코드

`createAutoBeContext.ts`의 예시:
```typescript
// biome-ignore lint: intended
props.state()[props.history.type] = props.history as any;
```

이 코드는 상태 속성을 동적으로 설정한다(예: `state.analyze = history`). `props.history.type`이 타입 레벨에서 문자열이기 때문에 TypeScript가 타입 체크를 할 수 없다. 여기서 `as any`는 진정으로 필요하다.

### 4.3 `biome-ignore` 억제

`packages/` 디렉터리 전체에 59건의 `biome-ignore` 억제가 있다. 거의 모두 구체적인 사유 대신 "intended"로 주석 처리되어 있다. 억제 자체는 진정한 필요성(타입 레벨 한계, 인프라 코드)으로 보이지만, 간결한 "intended" 코멘트는 미래 유지보수자에게 어떤 통찰도 제공하지 않는다.

### 4.4 고급 TypeScript 패턴

**`AutoBeProcessAggregateCollection<Phase>`**: 템플릿 리터럴 필터링을 사용하여 단계별 이벤트 타입을 추출한다:

```typescript
type PhaseEventType<Phase extends AutoBePhase | "all"> =
  Phase extends "all"
    ? Extract<AutoBeEvent, AutoBeAggregateEventBase>["type"] extends infer U
      ? U extends `${string}Complete` ? never : U
      : never
    : Extract<AutoBeEvent, AutoBeAggregateEventBase>["type"] extends infer U
      ? U extends `${Phase}${string}`
        ? U extends `${string}Complete` ? never : U
        : never
      : never;
```

이 타입 레벨 계산은 이벤트 타입을 단계 prefix로 필터링하고 완료 이벤트를 제외하여, 타입 안전한 메트릭 키를 제공한다. 예를 들어, `PhaseEventType<"analyze">`는 `"analyzeScenario" | "analyzeWriteModule" | ...`을 생성하되 `"analyzeComplete"`는 제외한다.

**Mapper 패턴**: `AutoBeEvent.Mapper`가 컴파일 타임 이벤트 조회를 제공한다:
```typescript
type Mapper = { [E in AutoBeEvent as E["type"]]: E };
```

이를 통해 이벤트 콜백에서 완전한 자동완성이 가능하다: `event: AutoBeEvent.Mapper["analyzeComplete"]`는 모든 속성이 사용 가능한 `AutoBeAnalyzeCompleteEvent`로 해석된다.

**`IJsonSchema`의 `Exclude<>` 제약**: 1.3절에서 설명한 바와 같이, LLM이 문제적인 스키마 패턴을 생성하는 것을 방지하는 구조적 불가능성을 만든다.

---

## 5. 발견된 버그 및 이슈

### 5.1 데드 타입: `IConditionalExpression`

`IConditionalExpression`은 `AutoBeTest.ts` 줄 1613에 전체 문서와 함께 정의되어 있다:

```typescript
export interface IConditionalExpression {
  type: "conditionalExpression";
  condition: IExpression;
  whenTrue: IExpression;
  whenFalse: IExpression;
}
```

그러나 `IExpression` union(줄 760-800)에는 포함되어 있지 않다. 결과적으로:
- 타입이 존재하지만 사용할 수 없다
- Typia가 모든 `conditionalExpression` 값을 거부한다
- LLM이 문서에서 이 타입을 볼 수 있지만 생성할 수 없다
- 의도적 제거(타입을 삭제해야 함)이거나 실수에 의한 누락(union에 추가해야 함)이다

### 5.2 `IIdentifier.text` 정규식이 점을 허용

`IIdentifier.text` 필드의 정규식 패턴이 자체 문서와 모순된다:

```typescript
text: string & tags.Pattern<"^[a-zA-Z_$][a-zA-Z0-9_$]*(\.[a-zA-Z_$][a-zA-Z0-9_$]*)*$">;
```

문서에서는 명시적으로 "MUST NOT contain dots, brackets, or any compound access patterns"이라고 기술한다. 하지만 정규식은 `(\.[a-zA-Z_$][a-zA-Z0-9_$]*)*` 그룹을 통해 `foo.bar.baz`를 허용한다. 문서의 예시에서는 `"Array.isArray"`를 **잘못된** 사용으로 보여주지만, 정규식 패턴은 이를 수용한다.

이 정규식-문서 모순은 불일치를 만든다: 타입 시스템은 점이 포함된 식별자를 허용하지만, 문서는 LLM에게 사용하지 말라고 지시한다. 점을 금지하려는 의도라면 정규식은 `^[a-zA-Z_$][a-zA-Z0-9_$]*$`이어야 한다.

### 5.3 `AutoBeEventSource` 수동 유지보수

`AutoBeEventSource`는 이벤트 타입 참조를 수동으로 나열하여 구성된다:

```typescript
export type AutoBeEventSource =
  | "facade"
  | AutoBePreliminaryEvent["type"]
  | AutoBeAnalyzeScenarioEvent["type"]
  // ...
```

개발자가 `AutoBeEvent`에 새 이벤트를 추가하되 그 타입을 `AutoBeEventSource`에 추가하는 것을 잊으면, 소스 타입이 조용히 불완전해진다. 이벤트는 런타임에서 작동하지만 소스 타입으로 사용할 수 없게 된다. 이것은 취약하다.

더 안전한 접근법은 `AutoBeEventSource`를 `AutoBeEvent`에서 직접 파생하는 것이다:
```typescript
type AutoBeEventSource = "facade" | AutoBeEvent["type"];
```

그러나 현재 접근법은 의도적으로 제한적이다 -- `AutoBeEventSource`는 모든 이벤트가 아니라 AI 요청을 트리거하는 이벤트만 포함한다. 따라서 수동 나열이 원칙적으로는 맞지만 실제로는 취약하다.

### 5.4 `IPrimaryField.nullable`

`IPrimaryField`의 `nullable` 필드가 `@ignore`와 `@internal`로 표시되어 있다:

```typescript
export interface IPrimaryField {
  name: string & SnakeCasePattern;
  type: "uuid";
  description: string;
  /** @ignore @internal */
  nullable?: boolean;
}
```

기본 키는 절대 nullable이면 안 된다. 이 필드는 내부 처리를 위해 존재하는 것으로 보이지만 공개 인터페이스를 통해 노출된다. `@ignore` 태그가 LLM function calling 스키마에서 이를 숨길 수 있지만(스키마 생성기에 따라 다름), TypeScript 타입 정의에는 남아 있어 혼란을 야기할 수 있다.

---

## 6. 비평적 평가

### 6.1 인상적인 설계

- **7개 타입 데이터베이스 필드 시스템**: PostgreSQL의 40개 이상 타입을 7개로 줄인 것은 AutoBE에서 가장 영향력 있는 단일 설계 결정이다. 타입 레벨에서 LLM 에러의 전체 범주를 제거한다.

- **Stance discriminator**: 단일 `stance` 필드를 통해 데이터베이스 모델을 API 생성 전략과 연결하는 것이 우아하다. 복잡한 비즈니스 규칙(무엇이 CRUD를 받는지, 무엇이 인증 엔드포인트를 받는지, 무엇이 읽기 전용인지)을 LLM이 신뢰성 있게 생성할 수 있는 방식으로 인코딩한다.

- **`$ref` 재사용을 강제하는 `Exclude<>` 제약**: 배열과 union에서 인라인 객체를 구조적으로 불가능하게 만듦으로써, 타입 시스템이 적절한 스키마 구성을 강제한다. TypeScript의 타입 시스템이 AI 코드 생성 품질을 직접 개선하는 몇 안 되는 사례 중 하나이다.

- **`plan -> draft -> statements` 사고 연쇄**: 사고 연쇄 추론을 프롬프트가 아닌 타입 구조에 인코딩함으로써 LLM이 중간 산출물을 반드시 생성하게 한다. 드래프트 TypeScript가 후속 AST 생성을 위한 기반 앵커 역할을 한다.

- **Dispatch-and-transform 패턴**: 이벤트가 `ctx.dispatch()` -> `createDispatch` 클로저 -> history 생성 -> 상태 업데이트 -> WebSocket 전달로 흐른다. 전체 파이프라인이 투명하고, 디버깅 가능하며, 재구성 가능하다.

- **Semaphore 기반 컴파일 제한**: `getCriticalCompiler` 래퍼가 compiler 인터페이스를 수정하지 않고 동시 컴파일을 깔끔하게 제한한다. 병렬 batch 처리 중 리소스 고갈을 방지한다.

### 6.2 아쉬운 점

- **AutoBeTest의 장황함**: 31개 expression 타입에 3,173줄은 과도하다. 볼륨의 상당 부분이 문서이지만, 파일의 순수한 크기가 탐색과 이해를 어렵게 만든다. Expression 카테고리별(리터럴, 연산자, 함수형, 랜덤, 술어) 별도 파일로 분리하면 타입 시스템을 변경하지 않고도 유지보수성을 개선할 수 있다.

- **데드 `IConditionalExpression`**: 사용할 수 없는 완전히 문서화된 타입은 혼란을 야기한다. Union에서 의도적으로 제거한 것이라면 인터페이스 정의를 삭제해야 한다. 제거가 우발적이었다면 다시 추가해야 한다. 어느 쪽이든 현재 상태는 버그이다.

- **`IIdentifier`의 정규식/문서 모순**: 정규식은 점을 허용하지만 문서는 금지한다. 둘 중 하나를 수정해야 한다. `IPropertyAccessExpression`이 점 접근을 위해 존재하므로, 정규식은 단순 식별자로 제한되어야 할 가능성이 높다.

- **인프라의 `as any` 캐스트**: 74개 orchestrator 시스템에 비해 25개의 `as any` 캐스트는 적은 수이지만, 각각이 잠재적 타입 안전성 구멍이다. 여러 개가 현재 상태 구조에서 동적 속성 접근이 불가피한 `createAutoBeContext.ts` dispatch 체인에 있다. 타입이 지정된 속성명을 가진 객체 대신 `Map<string, History>`를 사용하도록 리팩터링하면 일부를 제거할 수 있다.

### 6.3 대안적 접근법과의 비교

**부재에 의한 제약 vs. 프롬프트 엔지니어링**: 전통적인 AI 코드 생성 시스템은 프롬프트 지시로 오용을 방지한다("varchar를 사용하지 마라"). AutoBE의 접근법은 타입 시스템에서 해당 옵션을 제거하는 것으로, 근본적으로 더 신뢰성이 높다. 스키마가 정의하지 않은 것을 LLM이 생성할 수 없다.

**구조화된 AST vs. 원시 코드 생성**: Claude Code와 유사한 도구들은 원시 소스 코드를 생성한다. AutoBE는 구조화된 AST를 생성한 뒤 이를 코드로 컴파일한다. 트레이드오프: AST 생성이 더 제약적이지만(LLM이 임의의 언어 기능을 사용할 수 없음), 출력이 구조적으로 유효함을 보장한다. AutoBE의 접근법은 표현력을 희생하여 신뢰성을 얻는다.

**런타임 검증 vs. 컴파일**: AutoBE는 TypeScript 타입에 대한 LLM 출력의 런타임 검증에 Typia를 사용한다. 이는 AI 출력을 위한 타입 체커에 해당한다 -- 생성된 AST가 예상 타입과 일치하지 않으면 구조화된 에러와 함께 거부된다. 이를 통해 원시 코드 생성 접근법에서는 사용할 수 없는 피드백 루프가 만들어진다.

---

## 7. 요약

AutoBE의 타입 시스템은 전체 시스템이 기반하는 아키텍처적 토대이다. "부재에 의한 제약" 원칙 -- 에러 범주를 제거하기 위해 타입 표면적을 축소하는 것 -- 이 시스템의 가장 독창적인 기여이다. 7개 타입 데이터베이스 필드 시스템, JSON 스키마의 `Exclude<>` 제약, 테스트 AST에서의 루프/try-catch 금지가 이 원칙의 구체적 구현이다.

Function calling 인프라는 견고하다: `IPointer` 캡처 패턴, `forceRetry` 에러 분류, 다단계 동의 메커니즘이 LLM function calling의 본질적 불안정성을 처리한다. 검증 메트릭은 function calling 성공률에 대한 투명성을 제공한다.

타입 안전성 기록은 우수하다. Interface 패키지의 `any` 제로와 agent 패키지의 통제된 25개 캐스트만으로도 규율 잡힌 타입 주도 개발을 입증한다. 고급 TypeScript 패턴(`AutoBeProcessAggregateCollection` 템플릿 리터럴 필터링, `Mapper` 패턴, `Exclude<>` 구조적 제약)은 컴파일 타임 정확성을 위해 TypeScript의 타입 시스템을 한계까지 밀어붙인다.

주요 관심사는 유지보수 지향적이다: 3,173줄의 `AutoBeTest.ts`는 분리되어야 하고, 데드 `IConditionalExpression`은 해결되어야 하며, `IIdentifier` 정규식은 문서와 일치해야 한다. 이것들은 아키텍처를 훼손하지 않는 수정 가능한 이슈이다.
