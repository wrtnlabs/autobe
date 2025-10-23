# RPC System

## RPC Architecture

AutoBE uses WebSocket-based type-safe RPC communication. All communication between Frontend and Backend occurs through types defined in `@autobe/interface`, ensuring end-to-end type safety.

## WebSocket Communication

**Bidirectional Communication**: WebSocket provides bidirectional real-time communication between client and server. Frontend sends requests, and Backend streams progress in real-time.

**Event Streaming**: All events occurring in Backend are sent to Frontend via WebSocket. Events like `analyzeStart`, `analyzeComplete`, `realizeProgress` are reflected in UI in real-time.

**Type Safety**: All messages are defined by types from `@autobe/interface`. TypeScript compiler validates types of sent and received messages, preventing runtime errors.

## Request-Response Pattern

Frontend sends `IAutoBeFacadeApplicationProps` to request work. The `instruction` field contains user requirements.

Backend receives the request and calls appropriate Orchestrator. Streams all events occurring during pipeline progress via WebSocket.

Frontend subscribes to events and updates UI. Progress bars, log messages, and completion notifications display in real-time.

## Type Safety

`@autobe/interface` defines all RPC message types. Frontend and Backend use the same types, so API contracts are enforced at code level.

Both sides get compilation errors when types change. This enables early detection of compatibility issues and prevents runtime errors.

## Error Handling

Errors during RPC communication are sent to Frontend with clear error messages. Distinguishes network errors, timeouts, and server errors for handling.

Reconnection logic is also implemented. When WebSocket connection breaks, automatically attempts reconnection and can resume in-progress work.

For detailed RPC implementation, refer to WebSocket handlers in the `@autobe/backend` package.
