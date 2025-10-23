# AST Design

## AST Philosophy

AutoBE의 AST(Abstract Syntax Tree) 설계 철학은 **간소화**이다. OpenAPI 3.0 스펙은 매우 복잡하고 유연하지만, AutoBE는 백엔드 생성에 필요한 핵심 정보만 추출하여 간소화된 AST를 사용한다.

간소화의 목적은 **명확성**이다. 복잡한 구조는 AI 에이전트와 컴파일러 모두에게 부담이다. 핵심 정보만 남기면 파싱이 빠르고, 검증이 쉬우며, 오류 추적이 명확해진다.

## AutoBeOpenApi Structure

`AutoBeOpenApi.IDocument`는 AutoBE의 간소화된 OpenAPI 표현이다.

**operations**: 모든 API 엔드포인트의 배열이다. 각 Operation은 경로, 메서드, 파라미터, 요청 body, 응답 스키마를 포함한다. OpenAPI의 복잡한 중첩 구조를 평탄화하여 순회하기 쉽게 만든다.

**schemas**: API에서 사용하는 모든 스키마의 맵이다. DTO 타입 정의가 포함되며, Prisma 모델과 매핑된다. 순환 참조를 해결하고, 타입 안전성을 보장한다.

**security**: 인증/인가 메커니즘을 정의한다. JWT, API Key, OAuth 등의 보안 스킴과, 각 Operation이 요구하는 권한을 명시한다.

## Simplification Strategies

OpenAPI에서 AutoBE AST로 변환 시 다음 전략을 사용한다.

**Flattening**: 중첩된 구조를 평탄화한다. `paths[path][method]` 구조를 `operations[]` 배열로 변환하여 단일 레벨로 만든다.

**Reference Resolution**: `$ref`를 모두 resolve하여 실제 스키마로 치환한다. AI 에이전트가 참조를 따라갈 필요 없이 직접 타입을 볼 수 있다.

**Type Normalization**: OpenAPI의 다양한 타입 표현을 일관된 형식으로 정규화한다. `allOf`, `oneOf`, `anyOf`를 가능한 단일 스키마로 병합한다.

**Metadata Extraction**: 중요한 메타데이터만 추출한다. 설명, 예시, deprecated 플래그 등 생성에 필요한 정보만 유지하고, 나머지는 생략한다.

## AST Validation

AST는 컴파일러에 의해 검증된다.

**구조 검증**: AST가 예상된 타입 구조를 따르는지 확인한다. 필수 필드 존재, 타입 일치, 값 범위를 검증한다.

**의미론 검증**: AST 내용의 논리적 정합성을 확인한다. 경로 충돌, 순환 참조, 존재하지 않는 스키마 참조를 탐지한다.

**Prisma 정합성**: AST가 참조하는 모든 필드가 Prisma 스키마에 실제로 존재하는지 검증한다. 이는 Realize 단계에서 가장 흔한 오류를 예방한다.

## Benefits of Simplified AST

간소화된 AST는 여러 장점을 제공한다.

**빠른 파싱**: 복잡한 OpenAPI 문서를 매번 파싱하는 것보다 AST를 한 번 생성하고 재사용하는 것이 빠르다.

**명확한 검증**: 단순한 구조는 검증 로직을 단순하게 만든다. 오류 메시지도 명확해진다.

**AI 친화적**: AI 에이전트는 간결한 구조를 더 잘 이해한다. 토큰 사용량도 줄어든다.

**타입 안전성**: TypeScript로 정의된 AST 타입은 컴파일 타임에 검증되며, 런타임 오류를 방지한다.

자세한 AST 타입 정의는 `@autobe/interface` 패키지의 `AutoBeOpenApi` 네임스페이스를 참조하라.
