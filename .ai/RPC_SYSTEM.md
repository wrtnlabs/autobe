# RPC System

## RPC Architecture

AutoBE는 WebSocket 기반의 타입 안전 RPC 통신을 사용한다. Frontend와 Backend 간의 모든 통신은 `@autobe/interface`에 정의된 타입을 통해 이루어지며, 엔드투엔드 타입 안정성을 보장한다.

## WebSocket Communication

**양방향 통신**: WebSocket은 클라이언트와 서버 간의 양방향 실시간 통신을 제공한다. Frontend는 요청을 보내고, Backend는 진행 상황을 실시간으로 스트리밍한다.

**이벤트 스트리밍**: Backend에서 발생하는 모든 이벤트는 WebSocket을 통해 Frontend로 전송된다. `analyzeStart`, `analyzeComplete`, `realizeProgress` 같은 이벤트가 실시간으로 UI에 반영된다.

**타입 안전성**: 모든 메시지는 `@autobe/interface`의 타입으로 정의된다. TypeScript 컴파일러가 송수신 메시지의 타입을 검증하며, 런타임 오류를 방지한다.

## Request-Response Pattern

Frontend는 `IAutoBeFacadeApplicationProps`를 전송하여 작업을 요청한다. `instruction` 필드에 사용자 요구사항이 포함된다.

Backend는 요청을 받아 적절한 Orchestrator를 호출한다. 파이프라인 진행 중 발생하는 모든 이벤트를 WebSocket으로 스트리밍한다.

Frontend는 이벤트를 구독하고 UI를 업데이트한다. 진행률 바, 로그 메시지, 완료 알림이 실시간으로 표시된다.

## Type Safety

`@autobe/interface`는 모든 RPC 메시지 타입을 정의한다. Frontend와 Backend가 동일한 타입을 사용하므로, API 계약이 코드 레벨에서 강제된다.

타입 변경 시 양쪽 모두 컴파일 오류가 발생한다. 이는 호환성 문제를 조기에 발견하게 하며, 런타임 오류를 방지한다.

## Error Handling

RPC 통신 중 오류 발생 시 명확한 오류 메시지와 함께 Frontend에 전달된다. 네트워크 오류, 타임아웃, 서버 오류를 구분하여 처리한다.

재연결 로직도 구현되어 있다. WebSocket 연결이 끊어지면 자동으로 재연결을 시도하며, 진행 중인 작업을 재개할 수 있다.

자세한 RPC 구현은 `@autobe/backend` 패키지의 WebSocket 핸들러를 참조하라.
