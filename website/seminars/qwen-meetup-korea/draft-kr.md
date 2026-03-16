# Function Calling All-In: AutoBe가 Qwen으로 컴파일 성공률 100%를 달성하기까지

> Qwen Meetup Korea 발표 초안

---

### TL;DR

1. [AutoBe](https://github.com/wrtnlabs/autobe)
   - function calling 올인으로 만든 백엔드 AI 에이전트
   - LLM이 코드를 쓰지 않는다. 타입 구조체를 채우고, 컴파일러가 코드로 변환
   - Qwen 4종 전부 컴파일 성공률 100%
2. [Typia](https://github.com/samchon/typia)
   - function calling의 전체 라이프사이클을 자동화하는 인프라
   - 스키마 생성 → lenient parsing → type coercion → validation feedback
   - qwen3-coder-next 6.75% → 100%, qwen3.5 시리즈 0% → 100%
3. Function Calling 예찬론
   - 정확성을 요하는 도메인을 위한 방법론
   - 금지가 아닌 구조적 부재로 제약, 모델 중립, 기계적 검증 가능
4. 왜 Qwen인가
   - R&D에 로컬 모델 필수
   - 작은 모델이 최고의 QA
   - 열린 생태계
5. LLM이 정확할 필요는 없다, 교정 가능하면 된다

---

## 1. AutoBe

6.75%.

`qwen3-coder-next` 모델에게 쇼핑몰 백엔드의 API 데이터 타입(상품, 주문, 결제 등의 입출력 구조)을 생성하라고 시켰을 때, 한 번에 올바른 결과를 만들어낼 확률이다. 100번 시도하면 93번이 실패한다.

그런데 AutoBe의 최종 컴파일 성공률은 100%다. Qwen 모델 4종 전부.

### 1.1. AutoBe가 하는 일

[AutoBe](https://github.com/wrtnlabs/autobe)는 자연어 대화로 프로덕션 레디 백엔드를 생성하는 오픈소스 AI 에이전트다. [뤼튼테크놀로지스](https://wrtn.io)가 개발하고 있다.

"쇼핑몰 백엔드를 만들어줘. 상품 등록, 장바구니, 주문, 결제 기능이 필요해." — 이렇게 말하면, AutoBe가 다음을 전부 생성한다:

- 요구사항 분석서 (SRS)
- 데이터베이스 스키마 (Prisma ERD)
- API 명세서 (OpenAPI 3.1)
- E2E 테스트 코드
- 완전한 구현 코드
- 타입 안전 SDK

그리고 이 모든 코드가 컴파일을 통과한다. TypeScript + NestJS + Prisma 기반의 실제로 동작하는 백엔드가 나온다.

![](https://autobe.dev/images/demonstrate/replay-qwen-qwen3.5-122b-a10b.png)

### 1.2. LLM은 코드를 직접 쓰지 않는다

대부분의 AI 코딩 에이전트는 LLM에게 "이런 코드를 작성해줘"라고 시키고, LLM이 출력한 텍스트를 그대로 소스 코드 파일에 저장한다. AutoBe는 이 방식을 쓰지 않는다.

대신 AutoBe는 **function calling**을 사용한다. Function calling이란, LLM에게 자유롭게 텍스트를 생성하도록 두는 것이 아니라, 미리 정의한 구조체(JSON Schema)의 빈칸을 채우도록 시키는 것이다. 빈 양식을 주고 "여기에 맞게 채워넣어"라고 하는 것과 같다.

LLM이 양식을 채워서 구조화된 데이터를 돌려주면, AutoBe의 컴파일러가 이 데이터를 읽어서 실제 코드로 변환한다. **LLM은 구조를 채우고, 컴파일러가 코드를 만든다.**

AutoBe의 전체 파이프라인이 이 방식으로 동작한다:

| 단계 | LLM이 채우는 것 | 컴파일러 검증 |
|------|----------------|--------------|
| 요구사항 | [`AutoBeAnalyzeDocument`](https://github.com/wrtnlabs/autobe/blob/main/packages/interface/src/analyze/AutoBeAnalyzeDocument.ts) — 구조화된 SRS | 구조 검증 |
| 데이터베이스 | [`AutoBeDatabase`](https://github.com/wrtnlabs/autobe/blob/main/packages/interface/src/database/AutoBeDatabase.ts) — Prisma 스키마 구조 | Prisma 컴파일러 |
| API 설계 | [`AutoBeOpenApi`](https://github.com/wrtnlabs/autobe/blob/main/packages/interface/src/openapi/AutoBeOpenApi.ts) — OpenAPI 명세 구조 | OpenAPI 컴파일러 |
| 테스트 | [`AutoBeTest`](https://github.com/wrtnlabs/autobe/blob/main/packages/interface/src/test/AutoBeTest.ts) — 30+ expression 타입 | TypeScript 컴파일러 |
| 구현 | 모듈러 코드 (Collector/Transformer/Operation) | TypeScript 컴파일러 |

매 단계마다 LLM이 구조를 채우고, 컴파일러가 검증한다. 이것이 AutoBe의 **function calling 올인 전략**이다.

### 1.3. LLM에게 시키는 일이 만만치 않다

그런데 LLM이 채워야 할 이 "양식"이 결코 단순하지 않다. 두 가지를 보면 어떤 수준의 정밀도를 요구하는지 감이 올 것이다.

먼저, API 설계 단계에서 LLM이 생성해야 하는 **DTO 스키마 타입**이다. DTO(Data Transfer Object)란 API의 요청/응답에 들어가는 데이터 구조를 말한다. "상품의 가격은 양수 정수이고, 이름은 문자열이고, 카테고리 목록은 문자열 배열이다" 같은 것을 표현한다.

이 DTO 스키마를 정의하는 타입이 `IJsonSchema`인데, 10개의 서로 다른 종류(상수, 불리언, 정수, 숫자, 문자열, 배열, 객체...)가 union으로 묶여 있고, 배열 안에 또 `IJsonSchema`가 들어가는 재귀 구조다:

```typescript
export type IJsonSchema =
  | IJsonSchema.IConstant
  | IJsonSchema.IBoolean
  | IJsonSchema.IInteger
  | IJsonSchema.INumber
  | IJsonSchema.IString
  | IJsonSchema.IArray      // items: IJsonSchema ← 재귀
  | IJsonSchema.IObject     // properties: Record<string, IJsonSchema> ← 재귀
  | IJsonSchema.IReference
  | IJsonSchema.IOneOf      // oneOf: IJsonSchema[] ← 재귀
  | IJsonSchema.INull;
```

10개 variant, 무한 깊이의 재귀 중첩. 앞서 말한 6.75%는 바로 이 타입에 대한 raw function calling 성공률이다.

테스트 단계에서는 복잡도가 한 단계 더 올라간다. E2E 테스트 코드를 생성하려면, "이 API를 호출하고, 응답의 status가 200인지 확인하고, body의 items 배열 길이가 0보다 큰지 검증해라" 같은 로직을 표현해야 한다. 이것을 담는 타입이 `IExpression`이다:

```typescript
export type IExpression =
  | IBooleanLiteral   | INumericLiteral    | IStringLiteral     // 리터럴
  | IArrayLiteralExpression  | IObjectLiteralExpression          // 복합 리터럴
  | INullLiteral      | IUndefinedKeyword                       // null/undefined
  | IIdentifier       | IPropertyAccessExpression               // 접근자
  | IElementAccessExpression | ITypeOfExpression                 // 접근/연산
  | IPrefixUnaryExpression   | IPostfixUnaryExpression           // 단항 연산
  | IBinaryExpression                                            // 이항 연산
  | IArrowFunction    | ICallExpression    | INewExpression      // 함수
  | IArrayFilterExpression   | IArrayForEachExpression           // 배열 연산
  | IArrayMapExpression      | IArrayRepeatExpression            // 배열 연산
  | IPickRandom       | ISampleRandom      | IBooleanRandom     // 랜덤 생성
  | IIntegerRandom    | INumberRandom      | IStringRandom      // 랜덤 생성
  | IPatternRandom    | IFormatRandom      | IKeywordRandom     // 랜덤 생성
  | IEqualPredicate   | INotEqualPredicate                      // 검증 단언
  | IConditionalPredicate    | IErrorPredicate;                  // 검증 단언
```

30개 이상의 variant가 재귀적으로 중첩된다. 사실상 프로그래밍 언어 수준의 복잡도를, LLM이 function calling 하나로 생성해야 한다.

### 1.4. 6.75%를 100%로 만드는 방법

이렇게 복잡한 구조를 LLM에게 시키니, 한 번에 맞출 확률이 6.75%인 것은 당연하다. 문제는 이 6.75%를 어떻게 100%로 끌어올리느냐다.

비결은 **validation feedback loop** — 검증-피드백-교정의 반복 루프다.

LLM이 function call에 실패하면, 그냥 "틀렸다"고만 말하는 것이 아니다. Typia(뒤에서 자세히 소개할 라이브러리)가 LLM이 반환한 원본 JSON 위에, 에러가 발생한 정확한 지점마다 `// ❌` 인라인 주석을 삽입하여 되돌려준다:

```json
{
  "schemas": {
    "properties": {
      "type": "str" // ❌ [{"path":"$input.schemas.properties.type","expected":"string & (\"boolean\" | \"number\" | \"string\" | \"object\" | \"array\")"}]
    }
  },
  "product": {
    "price": -100, // ❌ [{"path":"$input.product.price","expected":"number & Minimum<0>"}]
    "quantity": 2.5 // ❌ [{"path":"$input.product.quantity","expected":"number & Type<\"uint32\">"}]
  }
}
```

`"type": "str"` 옆에 "여기가 틀렸고, `boolean`, `number`, `string` 등의 값이어야 한다"고 정확히 알려준다. `"price": -100` 옆에 "0 이상이어야 한다"고, `"quantity": 2.5` 옆에 "양의 정수여야 한다"고 알려준다.

이 피드백을 받은 LLM은 전체를 다시 생성할 필요 없이, 지적받은 필드만 정확히 교정하여 재시도한다.

컴파일러 검증 → 정밀한 진단 → LLM 교정 → 재검증. 이 루프를 성공할 때까지 반복한다. 한 번에 맞추든, 열 번 만에 맞추든, 결국 100%에 도달한다.

### 1.5. Qwen 3.5: 0%에서 100%까지

`qwen3.5` 시리즈는 더 극적인 사례를 보여준다.

이 모델들은 유니언 타입(여러 종류 중 하나가 들어갈 수 있는 필드)이 등장하면, 객체를 이중으로 stringify하는 특성이 있다. 쉽게 말해, JSON 안에 들어가야 할 객체를 한 번 더 문자열로 감싸버린다:

```json
{
  "payment": "{\"type\":\"card\",\"cardNumber\":\"1234-5678\"}"
}
```

`payment` 필드에는 `{ type: "card", cardNumber: "1234-5678" }` 라는 객체가 들어가야 한다. 그런데 Qwen 3.5는 이 객체를 통째로 문자열로 만들어서 넣는다. 마치 편지를 봉투에 넣고, 그 봉투를 또 다른 봉투에 넣은 것과 같다.

이 문제 때문에 유니언 타입이 포함된 모든 function calling의 raw 성공률이 **0%**였다.

Typia의 type coercion(타입 교정)이 이 문제를 해결했다. JSON Schema를 참조하여 "이 필드는 스키마상 객체여야 한다"는 것을 알고, 문자열로 들어온 값을 자동으로 파싱하여 원래의 객체로 복원한다:

```typescript
// Before (Qwen 3.5 출력):
{ payment: '{"type":"card","cardNumber":"1234-5678"}' }
// After (type coercion 적용):
{ payment: { type: "card", cardNumber: "1234-5678" } }
```

모델 자체를 수정한 것이 아니다. 모델이 주는 출력을, 인프라 수준에서 보정한 것이다. 이것으로 Qwen 3.5의 0%가 100%가 되었다.

### 1.6. 네 모델, 전부 100%

현재 AutoBe는 Qwen 4종으로 테스트하며, 전부 컴파일을 통과한다.

| 모델 | 활성 파라미터 | 특성 |
|------|-------------|------|
| `qwen/qwen3-coder-next` | — | 코딩 특화, tool choice 지원 |
| `qwen/qwen3.5-397b-a17b` | 17B / 397B | 최대 규모 MoE |
| `qwen/qwen3.5-122b-a10b` | 10B / 122B | 중간 규모 MoE |
| `qwen/qwen3.5-35b-a3b` | 3B / 35B | 소형 MoE |

397B부터 35B까지. 3B 활성 파라미터의 소형 모델도 쇼핑몰 백엔드를 완벽하게 생성한다. 동일한 파이프라인, 동일한 스키마, 동일한 결과다.

### 1.7. 시스템 프롬프트 없이도 돌아간다

한 가지 에피소드.

AI 에이전트에는 보통 시스템 프롬프트라는 것이 있다. "너는 백엔드 개발 전문가야. 다음 규칙을 지켜서 코드를 작성해..."와 같이, LLM에게 역할과 규칙을 자연어로 지시하는 문서다. 대부분의 AI 에이전트에서 시스템 프롬프트는 핵심 중의 핵심이다.

한번은 이 시스템 프롬프트가 통째로 빠진 빌드를 배포한 적이 있다. 자연어 지시 없이, function calling 스키마와 validation 로직만으로 동작한 것이다.

아무도 인지하지 못했다. 출력 품질이 동일했다.

한 번이 아니었다. 여러 차례 같은 일이 반복됐고, 매번 결과는 같았다.

**타입이 가장 좋은 프롬프트였고, validation feedback이 가장 좋은 오케스트레이션이었다.**

---

## 2. Typia — 이 모든 것을 가능하게 하는 인프라

1장에서 자연스럽게 등장했던 것들 — 스키마 변환, 깨진 JSON 복구, 타입 교정, 정밀한 에러 피드백 — 을 누가 하는 것일까?

Function calling을 실제 프로덕션에서 쓰려면 해결해야 할 문제가 한둘이 아니다. LLM에게 보낼 JSON Schema를 어떻게 만들 것인지, LLM이 깨진 JSON을 주면 어떻게 할 것인지, 타입이 틀리면 어떻게 교정할 것인지, 에러를 어떻게 LLM이 이해할 수 있는 형태로 전달할 것인지.

이 모든 것을 하나의 라이브러리로 해결하는 것이 [Typia](https://github.com/samchon/typia)다.

### 2.1. TypeScript 타입에서 Function Calling 스키마로

Function calling을 사용하려면 먼저 LLM에게 "이런 구조로 데이터를 줘"라고 알려주는 JSON Schema가 필요하다. 보통은 이 스키마를 개발자가 수동으로 작성한다. 타입을 정의하고, 그에 대응하는 스키마를 따로 작성하고, 둘이 어긋나지 않게 관리해야 한다.

Typia는 이 과정을 자동화한다. TypeScript 타입을 정의하기만 하면, Typia가 **컴파일 타임에** 해당 타입의 JSON Schema를 자동으로 생성한다. 런타임 리플렉션이 아니라, TypeScript 컴파일러의 타입 분석기를 직접 활용하는 방식이다:

```typescript
import typia, { tags } from "typia";

interface IMember {
  /**
   * 회원의 나이.
   *
   * 만 19세 이상의 성인만 가입할 수 있다.
   * 플랫폼의 법적 연령 제한이다.
   */
  age: number & tags.Type<"uint32"> & tags.ExclusiveMinimum<18>;
  email: string & tags.Format<"email">;
  name: string & tags.MinLength<1> & tags.MaxLength<100>;
}

const schema = typia.llm.parameters<IMember>();
// {
//   type: "object",
//   properties: {
//     age: {
//       type: "integer",
//       description: "회원의 나이.\n\n만 19세 이상의 성인만 가입할 수 있다.\n플랫폼의 법적 연령 제한이다.",
//       exclusiveMinimum: 18
//     },
//     email: { type: "string", format: "email" },
//     name: { type: "string", minLength: 1, maxLength: 100 }
//   },
//   required: ["age", "email", "name"]
// }
```

여기서 주목할 점이 두 가지 있다.

첫째, **JSDoc 주석이 `description`으로 변환된다.** LLM은 이 description을 읽고 값을 결정한다. "만 19세 이상의 성인만 가입할 수 있다"는 설명이 스키마에 자동으로 포함되므로, LLM이 문맥을 이해하고 적절한 값을 생성할 수 있다.

둘째, **타입 제약이 validation 규칙이 된다.** `ExclusiveMinimum<18>`은 "18 초과"라는 검증 규칙으로, `Format<"email">`은 이메일 형식 검증 규칙으로 자동 변환된다. 하나의 타입 정의에서 LLM 가이드와 검증 규칙이 동시에 나온다.

스키마를 수동으로 작성하면 타입과 스키마가 시간이 지나며 어긋나기 마련이다. Typia는 이 문제를 원천적으로 제거한다. **타입이 곧 스키마다.**

클래스 단위로는 `typia.llm.application<T>()`으로 모든 public 메서드를 function calling 스키마로 변환할 수 있고, 각 함수에 `parse()`, `coerce()`, `validate()` 메서드가 자동으로 내장된다.

### 2.2. Lenient JSON Parsing: LLM이 뱉는 깨진 JSON 수습

LLM은 완벽한 JSON을 뱉지 않는다. 왜일까? LLM은 토큰 단위로 텍스트를 생성하는 언어 모델이지, JSON 생성기가 아니기 때문이다. 괄호를 닫는 것을 잊고, 쉼표를 잘못 찍고, JSON 앞에 "Here is your answer:" 같은 설명을 붙이고, Markdown 코드블록으로 감싸기도 한다.

`JSON.parse()`는 이런 입력을 전부 거부한다. Typia의 `ILlmFunction.parse()`는 이 모든 경우를 처리한다:

| 문제 유형 | 예시 | 처리 |
|----------|------|------|
| 닫히지 않은 bracket | `{"name": "John"` | 자동 닫기 |
| 후행 쉼표 | `[1, 2, 3, ]` | 무시 |
| JavaScript 주석 | `{"a": 1 /* comment */}` | 제거 |
| 따옴표 없는 key | `{name: "John"}` | 허용 |
| 불완전한 키워드 | `{"done": tru` | `true`로 완성 |
| 설명 텍스트 접두사 | `Here is your JSON: {"a": 1}` | 건너뛰기 |
| Markdown 코드블록 | `` ```json\n{"a": 1}\n``` `` | 내부 추출 |

실제 LLM 출력에서는 이런 문제들이 한꺼번에 발생한다:

```typescript
const llmOutput = `
  > I'd be happy to help you with your order!
  \`\`\`json
  {
    "order": {
      "payment": "{\\"type\\":\\"card\\",\\"cardNumber\\":\\"1234-5678",
      "product": {
        name: "Laptop",
        price: "1299.99",
        quantity: 2,
      },
      "customer": {
        "name": "John Doe",
        "email": "john@example.com",
        vip: tru
  \`\`\` `;

const result = func.parse(llmOutput);
// Markdown 코드블록, 설명 텍스트, 따옴표 없는 key, 후행 쉼표,
// 이중 stringify, string→number, 불완전 키워드, 닫히지 않은 bracket
// — 8가지 문제가 동시에 발생했지만, parse() 한 번으로 전부 처리된다.
```

### 2.3. Schema-Based Type Coercion: 스키마를 아는 교정

LLM은 JSON의 구조뿐 아니라 타입도 자주 틀린다. 숫자 `42`를 써야 하는 곳에 문자열 `"42"`를 주고, 불리언 `true`를 써야 하는 곳에 문자열 `"true"`를 준다. 사람이 보면 같은 의미지만, 프로그램 관점에서는 완전히 다른 타입이다.

단순한 타입 캐스팅으로는 해결할 수 없다. "42"가 숫자인지 문자열인지는, 해당 필드의 스키마가 `number`인지 `string`인지를 알아야만 판단할 수 있기 때문이다.

Typia의 `ILlmFunction.coerce()`는 JSON Schema를 참조하여, 스키마가 기대하는 타입으로 자동 변환한다:

| LLM 출력 | 스키마 기대 타입 | 변환 결과 |
|---------|----------------|----------|
| `"42"` | `number` 또는 `integer` | `42` |
| `"true"` / `"false"` | `boolean` | `true` / `false` |
| `"null"` | `null` | `null` |
| `"{\"x\": 1}"` | `object` | `{ x: 1 }` (재귀적 파싱) |
| `"[1, 2, 3]"` | `array` | `[1, 2, 3]` (재귀적 파싱) |

이것이 실제로 어떻게 동작하는지 보자:

```typescript
const fromLlm = {
  order: {
    payment: '{"type":"card","cardNumber":"1234-5678"}',  // 이중 stringify
    product: {
      name: "Laptop",
      price: "1299.99",     // string인데 스키마는 number
      quantity: "2",        // string인데 스키마는 integer
    },
    customer: {
      name: "John Doe",
      vip: "true",          // string인데 스키마는 boolean
    },
  },
};

const result = func.coerce(fromLlm);
// result.order.product.price === 1299.99      (number)
// result.order.product.quantity === 2          (integer)
// result.order.customer.vip === true           (boolean)
// result.order.payment === { type: "card", cardNumber: "1234-5678" }  (object)
```

discriminated union(여러 타입 중 하나를 선택하는 구조)에 대해서는 `x-discriminator`를 활용하여 올바른 variant를 선택한 후 해당 variant의 coercion 규칙을 적용한다.

**이것이 1장에서 소개한 Qwen 3.5 시리즈의 0% → 100%를 만든 메커니즘이다.** 모델이 유니언 타입에서 객체를 이중 stringify하는 문제를, 스키마 정보를 이용해 인프라 레벨에서 해결했다.

SDK가 이미 JSON을 파싱한 경우(Anthropic SDK, Vercel AI, LangChain, MCP 등)에는 `parse()` 대신 `coerce()`를 사용한다.

### 2.4. Validation과 정밀 피드백

파싱과 타입 교정을 거쳤는데도 값 자체가 잘못된 경우가 있다. 가격에 음수가 들어오거나, 이메일 형식이 아닌 문자열이 들어오거나, 정수여야 할 곳에 소수가 들어오는 경우다.

Typia의 `ILlmFunction.validate()`는 이런 스키마 위반을 탐지하고, 단순히 "틀렸다"가 아니라 **정확한 위치와 원인**을 특정한다:

```typescript
const result = func.validate(input);
// 에러 예시:
// {
//   path: "$input.order.product.price",
//   expected: "number & Minimum<0>",
//   value: -100
// }
```

"order 안의 product 안의 price가 0 이상의 숫자여야 하는데 -100을 줬다" — 이 수준의 정밀도다.

그리고 `LlmJson.stringify()`를 사용하면, 이 에러들을 LLM이 반환한 원본 JSON 위에 `// ❌` 인라인 주석으로 삽입한다:

```json
{
  "order": {
    "payment": {
      "type": "card",
      "cardNumber": 12345678 // ❌ [{"path":"$input.order.payment.cardNumber","expected":"string"}]
    },
    "product": {
      "name": "Laptop",
      "price": -100, // ❌ [{"path":"$input.order.product.price","expected":"number & Minimum<0>"}]
      "quantity": 2.5 // ❌ [{"path":"$input.order.product.quantity","expected":"number & Type<\"uint32\">"}]
    },
    "customer": {
      "email": "invalid-email", // ❌ [{"path":"$input.order.customer.email","expected":"string & Format<\"email\">"}]
      "vip": "yes" // ❌ [{"path":"$input.order.customer.vip","expected":"boolean"}]
    }
  }
}
```

LLM은 자기가 보냈던 JSON 위에서 어디가 왜 틀렸는지 한눈에 파악할 수 있다. 이 피드백을 받으면 전체를 다시 쓸 필요 없이, 지적받은 5개 필드만 정확히 교정하여 재시도하면 된다.

### 2.5. 전체 루프: Parse → Coerce → Validate → Feedback → Retry

지금까지 소개한 것들을 하나의 루프로 조합하면, 1장에서 보여줬던 validation feedback loop의 전체 그림이 완성된다:

```typescript
async function callWithFeedback(
  llm: LLM,
  func: ILlmFunction,
  prompt: string,
  maxRetries: number = 10,
): Promise<unknown> {
  let feedback: string | null = null;

  for (let i = 0; i < maxRetries; i++) {
    // 1. LLM에게 function call 요청 (이전 피드백 포함)
    const rawOutput = await llm.call(prompt, feedback);

    // 2. Lenient JSON parsing + Type coercion
    const parsed = func.parse(rawOutput);
    if (!parsed.success) {
      feedback = `JSON parsing failed: ${JSON.stringify(parsed.errors)}`;
      continue;
    }

    // 3. Schema validation
    const validated = func.validate(parsed.data);
    if (!validated.success) {
      // 4. 구조화된 피드백 생성 (// ❌ 인라인 주석 형태)
      feedback = LlmJson.stringify(validated);
      continue;
    }

    // 5. 성공
    return validated.data;
  }
  throw new Error("Max retries exceeded");
}
```

`parse()`가 깨진 JSON을 살리고 타입을 1차 교정한다. `validate()`가 스키마 위반을 잡아낸다. `LlmJson.stringify()`가 LLM이 읽을 수 있는 형태로 에러를 표시해준다. LLM이 이 피드백을 보고 수정한다. **이것이 6.75%를 100%로 만드는 전체 엔진이다.**

### 2.6. 하나의 타입으로 전부

정리하면, TypeScript 타입을 하나 정의하면 Typia가 나머지를 전부 해결한다:

1. **스키마를 만들고** — `typia.llm.parameters<T>()`, `typia.llm.application<T>()`
2. **파싱하고** — `ILlmFunction.parse()` (깨진 JSON 복구 + 타입 교정)
3. **교정하고** — `ILlmFunction.coerce()` (SDK가 파싱한 객체의 타입 교정)
4. **검증하고** — `ILlmFunction.validate()` (스키마 위반 탐지)
5. **피드백을 만든다** — `LlmJson.stringify()` (LLM이 읽는 `// ❌` 인라인 진단)

**타입이 곧 스키마이자 validator이자 프롬프트다.**

---

## 3. Function Calling 예찬론

지금까지 AutoBe와 Typia를 통해 function calling이 **어떻게** 동작하는지 보았다. 이제부터는 정밀성과 정확성을 요하는 도메인에서 function calling이 **왜** 효과적인 방법론인지 이야기하겠다.

### 3.1. 자연어와 타입

자연어는 자연 발생한 언어다. 수천 년에 걸쳐 인간 사회에서 유기적으로 진화했고, 모호함이 기능이다. 비유, 뉘앙스, 예의, 유머가 전부 모호성 위에서 작동한다. "적당히 해줘"라는 말이 통하는 것이 자연어의 강점이다.

프로그래밍 언어는 설계된 언어다. 누군가 의도적으로 만들어서 해석의 여지를 제거한 것이다. "적당히"는 통하지 않는다. 모호함은 버그다.

**사람들이 자연어로 소통할 때는 서로 오해하고 다투지만, 타입과 설계로 말할 때는 오해가 없다.**

이것을 LLM 프롬프트와 타입 스키마로 대비해보자.

프롬프트로 제약을 전달하면:
> "age 필드는 18보다 큰 양의 정수여야 한다. 숫자 필드에 문자열 타입을 사용하지 마라. 모든 필수 필드가 존재해야 한다..."

여러 문제가 보인다. "18보다 큰"이 >18인지 ≥18인지 불분명하다. LLM이 이 규칙을 따랐는지 결과를 보기 전에는 알 수 없다. 그리고 스키마가 복잡해질수록 이런 규칙도 끝없이 늘어난다.

타입으로 제약을 전달하면:
```typescript
interface IMember {
  /** 만 19세 이상의 성인만 가입 가능 */
  age: number & Type<"uint32"> & ExclusiveMinimum<18>;
}
```

`ExclusiveMinimum<18>`이니까 >18이다. 정수다. 필수 필드다. 명확하고, 기계적으로 검증 가능하다.

정확한 결과가 필요한 영역에서, 스키마를 정의하고 필드마다 설명을 다는 것이 자연어 프롬프트를 작성하는 것보다 훨씬 명확하고 쉬우며, 기계적으로 검증까지 가능하다.

### 3.2. 핑크 코끼리 문제

프롬프트 기반 AI 에이전트를 만들어본 사람이라면, 금지 규칙을 작성해본 경험이 있을 것이다:

- "유틸리티 함수를 만들지 마라"
- "`any` 타입을 쓰지 마라"
- "순환 의존성을 만들지 마라"

"핑크 코끼리를 생각하지 마라"라는 말을 들으면 핑크 코끼리가 떠오르듯, LLM에게 "X를 하지 마라"고 말하면 X가 attention의 중심에 놓인다. 금지된 패턴을 회피하려면 먼저 그 패턴을 떠올려야 하고, 이는 오히려 금지된 패턴을 생성할 확률을 높인다. 토큰 예측 메커니즘에 이 문제가 내재되어 있다.

이 문제를 알면서도 프롬프트에서는 금지 규칙을 안 쓸 수가 없다. 자연어로 제약을 표현하는 수단이 "~하지 마라"뿐이기 때문이다. 실제로, 금지 규칙이 없는 프롬프트 기반 AI 에이전트는 본 적이 없다.

**스키마에서는 이 문제가 존재하지 않는다.**

`any` 타입을 쓰지 말라고 할 필요가 없다 — 스키마에 `any`가 없으면 LLM이 물리적으로 생성할 수 없다. 유틸리티 함수를 만들지 말라고 할 필요가 없다 — 스키마에 유틸리티 함수 슬롯이 없으면 끝이다. 필드 타입이 `"boolean" | "int" | "double" | "string" | "uri" | "uuid" | "datetime"` 7개뿐이면, LLM이 `"varchar"`를 쓸 수 있는 경로 자체가 없다.

금지가 아니라 **부재**. 프롬프트는 원치 않는 것을 금지하려 하고, 스키마는 원하는 것만 허용한다. 정밀한 출력이 필요한 영역에서 function calling이 특히 효과적인 이유다.

### 3.3. 모델 중립성

프롬프트 엔지니어링은 본질적으로 모델 종속적이다. GPT에 최적화한 프롬프트가 Claude에서 다르게 동작하고, Qwen에서는 또 다르다. 새 모델이 나오거나 다른 모델로 실험하려 하면, 프롬프트를 처음부터 재작성해야 하는 경우도 드물지 않다.

Function calling 스키마는 모델 중립적이다. JSON Schema는 JSON Schema다. 어떤 모델이 읽든 같은 의미이고, 모델 간 성능 차이는 validation feedback 루프가 흡수한다. 강한 모델은 1-2번 만에 맞추고, 약한 모델은 10-15번 시도하지만, 둘 다 결국 100%에 수렴한다.

AutoBe가 Qwen, GLM, DeepSeek, OpenAI 모델을 **동일한 스키마, 동일한 파이프라인**으로 돌리면서 전부 100% 컴파일을 달성하는 것이 이 중립성의 증거다. 모델별 프롬프트 튜닝은 한 적이 없다.

이것은 모델 선택의 성격을 바꾼다. "이 모델이 이 작업을 할 수 있는가?"라는 능력 문제에서, "어떤 모델이 비용 대비 효율적인가?"라는 **비용 최적화 문제**로 전환된다: `평균 재시도 횟수 × 시도당 토큰 × 토큰 가격`.

### 3.4. 핵심: 검증 가능성과 피드백 루프

여기까지의 이야기를 관통하는 하나의 핵심이 있다.

Function calling의 가장 강력한 장점은 **LLM의 출력을 소프트웨어 엔지니어링의 영역으로 가져온다는 것**이다.

LLM에게 자유 텍스트를 생성하게 하면, 그 출력이 맞는지 틀린지 판단하는 것 자체가 또 다른 AI 문제가 된다. 파싱도 퍼지하고, 검증도 퍼지하고, 교정도 퍼지하다. 모든 것이 불확실하다.

Function calling이면 출력은 구조화된 데이터다. 그 순간부터 소프트웨어 엔지니어링의 도구를 쓸 수 있다:

1. **검증이 결정론적이다** — JSON Schema validation은 맞다/틀리다가 명확하다
2. **피드백이 정밀하다** — "field X가 type Y여야 하는데 Z를 줬다"까지 특정된다
3. **교정이 수렴한다** — 정밀한 피드백이 있으니 모델이 해당 부분만 고칠 수 있다

이 세 가지가 결정론적 체인으로 엮인다. 모델은 여전히 확률적으로 틀리지만, **모델 바깥의 루프가 결정론적**이니까 결국 100%에 수렴한다.

> **Typed Schema + Deterministic Validator + Structured Error Feedback = Reliable LLM Output**

프롬프트 엔지니어링이 모델 안쪽을 잘 건드려보겠다는 접근이라면, function calling은 모델 바깥을 단단하게 만들겠다는 접근이다. 정밀성이 필요한 도메인에서 후자의 효과는 6.75% → 100%라는 결과로 증명되었다.

**LLM이 정확할 필요가 없다. 교정 가능하면 된다. 그리고 교정 가능성은 모델의 속성이 아니라, validation 인프라의 속성이다.**

### 3.5. 적용 스펙트럼: 어디까지 갈 수 있는가

그렇다면 이 패턴 — function calling + validation feedback — 은 코딩에만 쓸 수 있는 것일까? 아니다. 검증 가능성에 따라 스펙트럼을 이룬다.

#### 3.5.1. 모든 출력을 검증할 수 있는 영역

AutoBe의 Database, Interface, Test, Realize가 여기에 해당한다. 컴파일러가 validator 역할을 하여 100% 정합성을 보장한다.

소프트웨어만의 이야기가 아니다. "맞다/틀리다"를 기계적으로 판정할 수 있는 분야라면 어디든 같은 구조가 가능하고, 검증 비용에 따른 자연스러운 계층이 존재한다:

| 도메인 | 빠름 (ms) | 보통 (sec) | 깊음 (min+) |
|--------|----------|-----------|------------|
| 소프트웨어 | 타입 체크 | 컴파일 | 테스트 실행 |
| 반도체 | DRC | LVS | SPICE 시뮬레이션 |
| 회계 | 산술 검증 | 계정 코드 유효성 | 규제 감사 |
| 법률 | 구조 검증 | 논리 일관성 | 관할권 규칙 |

피드백 루프는 이 계층을 자연스럽게 활용한다: 가장 싼 validator부터 실행하고, 에러를 고친 뒤 다음 수준으로 넘어가면 된다.

#### 3.5.2. 추상성과 정합성이 공존하는 영역

현실에서는 "전부 검증 가능"과 "전혀 검증 불가능" 사이의 영역이 더 넓다. 출력의 일부는 자유롭게 두고, 일부는 엄격하게 검증하는 패턴이다.

AutoBe의 Analyze 페이즈(요구사항 분석서 생성)가 이 사례다. SRS의 구조는 타입으로 검증하지만, 내용의 품질까지 완전히 검증할 수는 없다. 그래도 구조를 잡아주는 것만으로 충분한 효과가 있다. 이것은 가설이 아니다 — AutoBe가 이미 하고 있는 일이다.

이 패턴은 다른 분야로 이식 가능하다. 몇 가지 사례를 타입으로 보여보겠다.

**법률** — AI가 자유롭게 법적 논거를 전개하되, 결론은 구조화된 형태로 분류한다:

```typescript
interface ILegalAnalysis {
  reasoning: string;                 // 추상: AI가 자유롭게 논거 전개
  applicableClauses: IClause[];      // 정합: 해당 조항을 타입으로 분류
  classification: ILegalCategory;    // 정합: 법적 분류
}

interface IClause {
  type: "obligation" | "condition" | "warranty" | "indemnity"
      | "termination" | "confidentiality" | "limitation";
  title: string;
  description: string;
  subclauses: IClause[];  // 재귀적 구조
}
```

`reasoning`은 자유 텍스트이므로 검증하지 않는다. 그러나 조항의 존재 여부, `type` 분류의 유효성은 결정론적으로 검증 가능하다. 검토자는 논거 전체를 읽지 않아도, "이 조항이 실제로 이 분류에 해당하는가?"만 확인하면 된다.

**회계** — 재무제표는 결정론적 규칙의 집합이다:

```typescript
interface ILineItem {
  account_code: string & Pattern<"^[0-9]{4}$">;
  description: string;
  amount: number;
  classification: "current_asset" | "non_current_asset"
    | "current_liability" | "non_current_liability"
    | "equity" | "revenue" | "expense";
}
```

대차대조표 균형 (자산 = 부채 + 자본), 계정 코드 유효성, 소계 산술. 전부 validator로 만들 수 있다. AI가 `description`을 자유롭게 작성하더라도, 금액 합계가 맞는지, 계정 코드가 유효한지는 즉시 검증 가능하다.

**반도체** — 칩 설계의 물리적 규칙은 타협이 없다:

```typescript
interface IChipLayout {
  technology_node: "5nm" | "7nm" | "14nm" | "28nm";
  blocks: IBlock[];
  connections: IConnection[];
}

interface IBlock {
  type: "logic" | "memory" | "io" | "analog" | "pll";
  position: IPoint2D;
  dimensions: IDimension;
  sub_blocks: IBlock[];  // 재귀적 계층
}
```

DRC(Design Rule Check, 빠름), LVS(Layout vs Schematic, 보통), SPICE 시뮬레이션(느림). 비용은 단계별로 다르지만, 전부 결정론적 검증이다. 피드백 루프는 가장 싼 DRC부터 실행한다.

**의료** — 진단은 결정 트리로 구조화할 수 있다:

```typescript
type IDecisionNode =
  | IDecisionNode.ITest
  | IDecisionNode.IDiagnosis
  | IDecisionNode.IBranch;

namespace IDecisionNode {
  export interface IDiagnosis {
    type: "diagnosis";
    icd_code: string & Pattern<"^[A-Z][0-9]{2}(\\.[0-9]{1,4})?$">;
    confidence: number & Minimum<0> & Maximum<1>;
    recommended_treatment: string;
  }

  export interface IBranch {
    type: "branch";
    condition: string;
    if_true: IDecisionNode;   // 재귀
    if_false: IDecisionNode;  // 재귀
  }
}
```

ICD 코드(국제질병분류코드) 유효성, 결정 트리의 완전성(데드엔드 없는지), 임상 가이드라인 준수. 진단 로직 자체의 의학적 타당성은 전문가가 판단해야 하지만, 구조적 정합성은 기계적으로 검증 가능하다.

---

솔직히 말하면, 나는 개발자이고 이 분야들의 도메인 전문가가 아니다. 100% 장담은 못 한다. 그러나 핵심 논리는 동일하다: **해당 분야에 맞다/틀리다를 판정하는 규칙이 존재하면, 이 패턴은 적용 가능하다.** AutoBe가 코딩과 컴파일러에서 이것을 증명했듯, 논리와 검증 가능성이 존재하는 분야라면 이 패턴은 이식 가능하다고 본다.

#### 3.5.3. 적용할 수 없는 영역

반대로, 결정론적 validator를 만들 수 없는 분야에는 이 패턴이 맞지 않는다. 창작, 감정, 전략적 의사결정. "좋은 소설"이나 "현명한 경영 판단"의 validator는 존재하지 않는다. 이것은 솔직하게 인정한다.

---

## 4. 왜 Qwen인가

### 4.1. R&D 비용: 사용자와 개발자의 차이

AutoBe를 **사용**하는 고객에게 모델 비용은 문제가 아니다. 아무리 모델이 비싸봐야 백엔드 개발자를 실제로 고용하는 것보다 싸다.

그러나 AutoBe를 **개발**하는 우리는 다르다. 새로운 타입을 설계할 때마다, 새로운 validation 로직을 추가할 때마다, 전체 파이프라인을 처음부터 끝까지 돌려봐야 한다. 수천 번의 생성-컴파일-피드백 사이클. 매번 상용 모델을 쓰면 파산한다.

로컬 모델은 이 R&D 사이클을 가능하게 한다. 비용 걱정 없이 무제한으로 실험할 수 있다. 6.75% → 100%까지 가는 과정에서 수백 번의 실험 사이클이 필요했고, 그것은 로컬 모델이기에 가능했다.

### 4.2. 작은 모델이 최고의 QA 엔지니어

큰 모델은 실수가 적다. 이것은 장점이지만, 동시에 단점이다.

우리가 미처 생각하지 못한 validation 사각지대가 있어도, 큰 모델에서는 해당 실패가 좀처럼 발생하지 않는다. 스키마의 모호한 부분을 "적절히 추측해서" 맞춰버리기 때문이다. 우리의 실수가 숨겨진다.

35B급 작은 모델을 쓰면 이야기가 달라진다. 반례가 팍팍 튀어나온다:

| 모델 | 성공률 | 발견한 것 |
|------|-------|----------|
| `qwen3-30b-a3b-thinking` | ~10% | 근본적인 스키마 모호성, 누락된 필수 필드 |
| `qwen3-next-80b-a3b-instruct` | ~20% | 복잡한 중첩 관계에서의 미묘한 타입 불일치 |

10% 성공률이 가장 가치 있는 결과였다. 모든 실패가 우리 시스템의 빈틈을 가리켰고, 각 수정은 약한 모델뿐 아니라 **모든 모델**의 파이프라인을 강화했다.

AI는 확률론적이다. 큰 모델이 실수를 **덜** 하는 것이지, **안** 하는 것이 아니다. 작은 모델에서 발생한 반례는 큰 모델에서도 어쩌다 한 번 터진다. 프로덕션에서 "어쩌다 한 번"은 곧 장애다.

**스키마가 35B 모델도 오해할 수 없을 만큼 정밀해지면, 강한 모델이 틀릴 확률은 사실상 0에 수렴한다.**

### 4.3. 벤더 종속 없음

상용 API의 가격 변경, 모델 deprecation, rate limit은 전부 벤더의 결정에 달려 있다. 오늘 쓰는 모델이 내일 사라질 수 있다.

AutoBe의 function calling 스키마는 모델 중립적으로 설계되어 있다. 특정 모델에 최적화된 프롬프트 트릭을 쓰지 않는다. JSON Schema와 타입 기반 validation은 업계 표준이고, 모델이 바뀌어도 코드는 그대로다.

### 4.4. 오픈소스 + 오픈웨이트: 열린 생태계의 선순환

AutoBe는 오픈소스(AGPL 3.0)이고, Qwen은 오픈웨이트다. 둘 다 열린 생태계다.

이 조합이기에 수천 번의 실험이 가능했고, 엣지케이스 발굴이 가능했고, 시스템 강화가 가능했다. 상용 모델이었다면 이 규모의 실험은 비용적으로 불가능했을 것이다.

오픈 생태계가 서로를 강화하는 선순환이 만들어진다:
- AutoBe가 Qwen으로 시스템을 단련한다
- 단련된 시스템이 Qwen의 프로덕션 레벨 활용을 증명한다
- Qwen의 개선이 AutoBe 전체의 성능을 높인다
- AutoBe의 발견(이중 stringify 문제 등)이 Qwen의 개선에 기여할 수 있다

---

## 5. 마무리

AutoBe는 function calling 올인 전략으로, Qwen 모델 4종 전부에서 컴파일 성공률 100%를 달성했다.

가능하게 한 것은 더 똑똑한 프롬프트도, 더 정교한 오케스트레이션도 아니다. Typia가 제공하는 타입 기반 인프라 — 스키마 자동 생성, lenient parsing, type coercion, validation feedback — 가 모델의 확률적 한계를 결정론적으로 극복한 것이다.

타입으로 말하면 오해가 없다. 스키마로 제약하면 핑크 코끼리가 없다. 결정론적 검증 루프가 있으면 6.75%도 100%가 된다.

이 패턴은 코딩에만 국한되지 않는다. 논리와 정합성이 존재하는 분야라면 어디든 이식할 수 있다.

그리고 이 모든 실험과 검증을 가능하게 한 것은, Qwen이라는 오픈웨이트 모델이었다.

LLM이 정확할 필요는 없다. 교정 가능하면 된다.

---

**About AutoBe**: [AutoBe](https://github.com/wrtnlabs/autobe)는 [뤼튼테크놀로지스](https://wrtn.io)가 개발하는 오픈소스 AI 에이전트다. 자연어로 프로덕션 레디 백엔드 애플리케이션을 생성한다.

**About Typia**: [Typia](https://github.com/samchon/typia)는 TypeScript 타입으로부터 runtime validator, JSON Schema, function calling 스키마를 자동 생성하는 컴파일러 라이브러리다.

---

## 부록. 유니언 타입 심화

이 발표에서 유니언 타입은 처음부터 끝까지 등장한다. `IJsonSchema`의 10개 variant(1.3절), `IExpression`의 30+ variant(1.3절), Qwen 3.5의 이중 stringify 문제(1.5절), type coercion(2.3절), validation feedback(2.4절). 유니언 타입을 얼마나 잘 다루느냐가 function calling 인프라의 품질을 결정한다.

### A.1. Discriminated Union이란

유니언 타입(union type)이란 "여러 종류 중 하나"를 표현하는 타입이다. 예를 들어, 결제 수단이 카드 또는 계좌이체일 수 있다면:

```typescript
type Payment =
  | { type: "card"; cardNumber: string; cvc: string }
  | { type: "bank_transfer"; bankCode: string; accountNumber: string }
```

**Discriminated** union은 이 유니언에 **구분자(discriminator) 필드**가 있는 경우를 말한다. 위 예시에서 `type` 필드가 discriminator다. `type`이 `"card"`이면 `cardNumber`와 `cvc`가 있고, `"bank_transfer"`이면 `bankCode`와 `accountNumber`가 있다. **discriminator 값 하나로 나머지 구조가 결정된다.**

이것이 왜 중요한가? LLM이 유니언 타입의 데이터를 생성할 때, 틀린 값을 교정하려면 "이 데이터가 어떤 종류를 의도한 것인지"를 먼저 알아야 하기 때문이다. Discriminator가 없으면 의도를 특정할 수 없고, 의도를 특정할 수 없으면 정확한 피드백도 불가능하다.

AutoBe의 `IJsonSchema`(10개 variant), `IExpression`(30+ variant)이 전부 discriminated union이고, Typia가 이 discriminator를 활용하여 정확한 타입 교정과 validation feedback을 제공하는 것이 6.75% → 100%의 핵심 메커니즘이다.

### A.2. Typia의 `x-discriminator` — `anyOf`에 지능을 더하다

JSON Schema 표준에는 유니언 타입을 표현하는 방법으로 `anyOf`(어느 것이든 매칭)와 `oneOf`(정확히 하나만 매칭)가 있다. 그런데 둘 다 **"어떤 필드로 variant를 구분하라"는 정보가 없다.** 그냥 "이 스키마들 중 하나에 맞으면 된다"일 뿐이다.

OpenAPI 3.x에는 `discriminator`가 있지만 `oneOf` 전용이고, 대부분의 LLM은 `oneOf`를 제대로 지원하지 않는다.

Typia는 이 문제를 `x-discriminator`라는 플러그인 속성으로 해결한다. LLM이 넓게 지원하는 `anyOf`를 쓰면서, discriminator 메타데이터를 함께 전달한다:

```json
// Typia가 생성하는 스키마 (단순화)
{
  "anyOf": [
    { "type": "object", "properties": { "type": { "const": "card" }, "cardNumber": { ... } } },
    { "type": "object", "properties": { "type": { "const": "bank_transfer" }, "bankCode": { ... } } }
  ],
  "x-discriminator": {
    "propertyName": "type",
    "mapping": {
      "card": "#/$defs/CardPayment",
      "bank_transfer": "#/$defs/BankTransferPayment"
    }
  }
}
```

이것으로 세 가지가 가능해진다:

1. **LLM이 스키마를 읽을 때**: `x-discriminator`의 `propertyName`을 보고 "이 `type` 필드 값으로 variant를 골라야 한다"는 힌트를 얻는다
2. **Typia가 타입을 교정할 때**: `coerce()`에서 discriminator 값으로 variant를 특정한 뒤, 해당 variant의 스키마 기준으로 타입 교정을 적용한다. Qwen 3.5의 이중 stringify 문제도 이 메커니즘으로 해결된다
3. **Typia가 에러를 생성할 때**: `validate()`에서 discriminator로 variant를 특정한 뒤, 해당 variant 기준으로 정확한 필드별 에러를 생성한다. "10개 variant 전부에 매칭 안 됨"이 아니라, "card variant의 cardNumber가 string이어야 하는데 number를 줬다"까지 특정된다

**`anyOf`만으로는 유니언 타입에서 정확한 교정도, 정확한 피드백도 불가능하다. `x-discriminator`가 있어서 가능하다.** 이것이 2.3절의 type coercion과 2.4절의 validation feedback이 유니언 타입에서도 작동하는 이유다.

### A.3. 세상은 전부 재귀적 유니언이다

3장에서 보여준 도메인 타입들을 다시 보자:

- 법률: `IClause` → `subclauses: IClause[]` (재귀)
- 반도체: `IBlock` → `sub_blocks: IBlock[]` (재귀)
- 의료: `IDecisionNode` → `if_true: IDecisionNode` (재귀)
- 회계: 계정 체계는 대분류 → 중분류 → 소분류의 트리 (재귀)

이것들은 전부 AutoBe의 `IJsonSchema`(10개 variant), `IExpression`(30+ variant)과 구조가 같다. AST(추상 구문 트리)다. 정형화된 도메인의 데이터는 결국 트리이고, 트리의 노드가 여러 종류를 가지는 순간 **재귀적 유니언 타입**이 된다.

3장에서 "검증 가능한 분야라면 function calling + validation feedback 패턴은 이식 가능하다"고 했다. 그런데 그 분야들의 데이터 구조가 전부 재귀적 유니언이라면, **유니언 타입의 정복이 이식의 전제 조건**이다.

유니언 타입에서 coercion이 안 되면, Qwen 3.5의 이중 stringify가 칩 설계에서도 터진다. Validation feedback이 안 되면, "30개 variant 전부에 매칭 안 됨"으로는 루프가 수렴하지 않는다. Discriminator로 variant를 특정할 수 없으면, 교정 자체가 불가능하다.

Typia의 `x-discriminator`, schema-based coercion, discriminator-aware validation은 이 보편적 구조에 대한 해법이다. AutoBe의 6.75% → 100%는 코드 생성만의 성과가 아니다. **재귀적 유니언이라는 보편 구조에서 100% 신뢰성을 확보한 것이고, 같은 구조를 가진 모든 정형화된 도메인으로 이식 가능한 성과다.**

### A.4. 왜 Zod가 아닌가

Zod는 TypeScript 생태계에서 가장 인기 있는 런타임 validation 라이브러리다. "왜 Zod를 안 쓰느냐"는 질문을 자주 받는다.

AutoBe처럼 30+ variant의 재귀적 discriminated union을 Zod로 정의하면 어떻게 되는지 보자:

```typescript
const ExpressionSchema: z.ZodType<IExpression> = z.lazy(() =>
  z.discriminatedUnion("type", [
    z.object({ type: z.literal("booleanLiteral"), value: z.boolean() }),
    z.object({
      type: z.literal("callExpression"),
      expression: ExpressionSchema,         // 순환 참조
      arguments: z.array(ExpressionSchema),  // 순환 참조
    }),
    // ... 28개 더
  ])
);
```

세 가지 문제가 있다.

**첫째, TypeScript 타입과 Zod 스키마를 이중으로 정의해야 한다.**

Zod 공식 문서가 이를 명시한다: "you can define a recursive schema in Zod, but because of a limitation of TypeScript, their type can't be statically inferred." `z.lazy()`를 쓰면 `z.infer`가 작동하지 않아서, TypeScript 인터페이스를 별도로 정의한 뒤 `z.ZodType<T>`로 타입 힌트를 수동으로 넘겨야 한다:

```typescript
// 1. TypeScript 타입을 먼저 정의하고
type IExpression =
  | { type: "booleanLiteral"; value: boolean }
  | { type: "callExpression"; expression: IExpression; arguments: IExpression[] }
  | { type: "binaryExpression"; left: IExpression; operator: string; right: IExpression }
  // ... 27개 더

// 2. Zod 스키마를 따로 정의하면서, 타입 힌트를 수동으로 연결
const ExpressionSchema: z.ZodType<IExpression> = z.lazy(() =>
  z.discriminatedUnion("type", [
    z.object({ type: z.literal("booleanLiteral"), value: z.boolean() }),
    z.object({ type: z.literal("callExpression"), expression: ExpressionSchema, arguments: z.array(ExpressionSchema) }),
    z.object({ type: z.literal("binaryExpression"), left: ExpressionSchema, operator: z.string(), right: ExpressionSchema }),
    // ... 27개 더
  ])
);
```

30+ variant의 재귀 유니언이면 이 이중 정의가 수백 줄이다. 시간이 지나면 둘이 어긋나고, 그 어긋남을 잡아줄 장치는 없다.

**둘째, 이중 정의를 감수해도 컴파일이 안 된다.**

재귀적 유니언의 깊이가 깊어지면 TypeScript의 제네릭 인스턴스화 한계에 부딪힌다:

> TS2589: Type instantiation is excessively deep and possibly infinite.

Zod 이슈 트래커에서 가장 반복적으로 등장하는 에러다. [#577](https://github.com/colinhacks/zod/issues/577), [#5064](https://github.com/colinhacks/zod/issues/5064), [#5256](https://github.com/colinhacks/zod/issues/5256) — 재귀 스키마에서 이 에러가 발생하고, Zod v4에서도 해결되지 않았다. 심지어 [Discussion #1459](https://github.com/colinhacks/zod/discussions/1459)에서는 재귀가 아닌 복잡한 discriminated union만으로도 같은 에러가 발생한다. `IExpression` 수준의 30+ variant 재귀 유니언에서는 IDE 자동완성이 멈추고, 타입 체커가 포기한다.

**셋째, 그 모든 고생을 감수해도, validation feedback이 원천적으로 불가능하다.**

이것이 가장 근본적인 문제다.

유니언 타입에서 validation이 실패하면, Zod는 "이 값이 어느 variant를 의도한 것인지" 특정하지 못한다. 10개 variant의 유니언에서 에러가 나면, 모든 variant에 대한 에러를 한꺼번에 쏟아내거나([#792](https://github.com/colinhacks/zod/issues/792)), discriminator가 맞지 않으면 다른 필드의 에러를 아예 숨겨버린다([#2202](https://github.com/colinhacks/zod/issues/2202)). Zod v4에서는 오히려 퇴보하여, discriminator 불일치 시 빈 에러 배열과 "No matching discriminator"만 반환한다([#4909](https://github.com/colinhacks/zod/issues/4909), [#5670](https://github.com/colinhacks/zod/issues/5670)).

LLM 입장에서 생각해보자. 자기가 `callExpression` variant를 의도했는데 `arguments` 필드의 타입이 틀렸다면, "arguments가 IExpression 배열이어야 하는데 string을 줬다"는 피드백이 와야 고칠 수 있다. 그런데 Zod는 "10개 variant 전부에 매칭 안 됨"이라고만 말한다. 뭘 고쳐야 하는지 모르는 피드백은 피드백이 아니다.

Typia는 discriminator 필드(`type`)로 variant를 먼저 특정한 뒤, 해당 variant의 스키마 기준으로 정확한 필드별 에러를 생성한다. 이것이 validation feedback loop가 수렴하는 전제 조건이고, Zod에는 이 메커니즘이 없다.

**정리하면: Zod로는 이중 정의에, 컴파일 실패에, 그러고도 feedback loop가 불가능하다.** AutoBe의 6.75% → 100%를 만드는 핵심 엔진 자체가 Zod 위에서는 성립하지 않는다.

Typia는 TypeScript 인터페이스 하나면 된다:

```typescript
const result = typia.validate<AutoBeTest.IExpression>(llmOutput);
```

컴파일러 수준에서 동작하므로 어떤 복잡도의 타입이든 처리한다. 별도의 스키마 정의도, 제네릭 depth 제한도, 불완전한 에러 메시지도 없다.
