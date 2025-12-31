# Frontend System

## Frontend Philosophy

AutoBE's Frontend is the interface between users and the AI backend generation system. It's not just a simple chat UI, but a sophisticated system that intuitively visualizes the complex backend generation process, provides real-time feedback, and helps users understand and control the entire process.

The core of Frontend design is **transparency**. It shows users what the AI is doing internally, which stage it's at, and what decisions it made. Not a black box, but a transparent glass box where every process is visible.

The Frontend emphasizes **reactivity**. It receives all events from the Backend via WebSocket in real-time and updates the UI immediately. Users always know "what's happening right now" and can accurately track progress.

The Frontend ensures **type safety**. Frontend and Backend share types from `@autobe/interface`, so API contracts are enforced at the code level. All type mismatches are caught at compile time, minimizing runtime errors.

## Package Structure

AutoBE Frontend consists of multiple packages.

### @autobe/ui

`@autobe/ui` is a reusable React component library. It provides core UI elements of AutoBE such as chat interface, event visualization, and configuration modals.

**Component Structure**: Hierarchically designed. Top-level `AutoBeChatMain` manages the entire chat interface, `AutoBeEventGroupMovie` renders event groups, and individual events are handled by `AutoBeEventMovie`, `AutoBeProgressEventMovie`, `AutoBeScenarioEventMovie`, etc.

**Context-based State Management**: `AutoBeAgentContext` manages overall application state. WebSocket connection, event streams, and session lists are shared through Context, avoiding prop drilling and maintaining clean component structure.

**Event Listener**: The `AutoBeListener` class receives and processes all events from Backend. Each event type has a dedicated handler that classifies events into appropriate groups and triggers UI updates. It automatically handles event accumulation, grouping, and completion processing.

**Overlay Kit Integration**: Modals, dialogs, and notifications are managed using `overlay-kit`. Overlays can be opened and closed declaratively, implementing clean UI flow without complex state management.

**Type-Safe Event Handling**: All events are defined by types from `@autobe/interface`. The `AutoBeEvent` union type includes all possible events, and TypeScript guarantees type safety of event handlers. Attempting to handle wrong event types causes compilation errors.

### Website

The Website is AutoBE's official documentation site and landing page. Built with Next.js and uses Fumadocs for documentation management.

**Documentation Structure**: Documents written in MDX format are located in `website/src/content/docs/`. Concepts, API references, tutorials, and roadmaps are systematically organized. Each document includes metadata, and sidebars and navigation are generated automatically.

**Interactive Demo**: The actual AutoBE system can be experienced directly on the website. The `AutoBeDemoMovie` component embeds `@autobe/ui`, allowing users to enter requirements and watch the backend generation process in real-time.

**Automatic Screenshot Generation**: Puppeteer automatically generates documentation screenshots. Code examples, diagrams, and UI screenshots always stay up-to-date. The `build/screenshot.js` script handles this.

**TypeDoc Integration**: API reference is automatically generated through TypeDoc. Documentation is extracted from TypeScript comments in `@autobe/interface`, `@autobe/agent`, `@autobe/compiler` packages and integrated into the website.

### Apps

AutoBE is provided in multiple application forms.

**Playground**: `apps/playground-ui` and `apps/playground-server` form the online Playground. Users can directly use AutoBE in the browser to generate backends and immediately run generated projects through StackBlitz integration. Trial is possible without signup, and sessions are stored in browser local storage.

**VSCode Extension**: `apps/vscode-extension` enables using AutoBE within VSCode. Requirements can be entered directly in the editor and generated code integrated into projects. `webview-ui` is the React UI rendered inside VSCode, and `worker` is the background process handling WebSocket communication.

**Hackathon Platform**: `apps/hackathon-ui`, `apps/hackathon-server`, `apps/hackathon-api` form the AutoBE hackathon platform. Participants can quickly build projects using AutoBE and submit them. Provides team management, project submission, and judging features.

## UI/UX Design Principles

AutoBE Frontend's UI/UX follows clear principles.

### Progressive Disclosure

Don't show all information at once. Disclose important information progressively, allowing users to expand details when desired.

Initial screen is concise. Only chat input and simple guidance are displayed. When users enter requirements, progress starts appearing. When Analyze stage completes, only a summary is shown; clicking expands the detailed analysis report.

Event groups are collapsed by default. Only the stage in progress is automatically expanded, and completed stages are collapsed to save space. Users can always click to view details of previous stages.

### Real-time Feedback

All events from Backend are reflected in UI in real-time. Users always know "what the AI is doing now".

Progress bars show exact numbers. Displays current progress concretely like "15 / 40 APIs generating". Not vague "processing..." messages, but precise progress.

Agent activity streams in real-time. Each time Realize Write agent generates an API, a new card appears with code snippets. Users can immediately see the code the AI wrote.

Errors are displayed immediately. When compilation errors occur, clearly shows which file had which errors and how the Correct agent fixes them. The self-healing process is transparently exposed.

### Visual Hierarchy

Important information is prominent, less important information is subdued. Clear visual hierarchy helps users quickly grasp essentials.

Stage progress is most prominent. The 5 stages Analyze → Database → Interface → Test → Realize are clearly distinguished, with the current stage highlighted.

Success and failure are color-coded. Successful tasks are green, in-progress is blue, failures are red. Users can understand status at a glance.

Metadata is displayed small. Auxiliary information like timestamps, token usage, retry count is shown in small font to not obstruct core information.

### Responsive Design

Provides optimal experience on mobile, tablet, and desktop.

On desktop, sidebar and main area are side by side. Left sidebar shows session list, right main area shows chat and events. Wide screen allows viewing much information simultaneously.

On mobile, uses single column layout. Sidebar is hidden in hamburger menu, main area occupies full screen. Optimized for touch gestures with natural scrolling and tapping.

Components adapt to screen size. Event cards display more compactly on small screens, code blocks use horizontal scrolling. All interactions work with both touch and mouse.

## Component Architecture

Frontend components have clear responsibilities and hierarchy.

### Container Components

Top-level components handle business logic and state management.

`AutoBeChatMain` is the container for the entire chat interface. Handles WebSocket connection management, event reception, and message sending. Passes necessary data and callbacks to child components, delegating UI logic.

`AutoBeAgentContext` provides global state. Manages current session, event groups, and connection state. Uses Provider pattern so child components can access state through Context.

`AutoBeAgentSessionList` handles session management. Provides session list retrieval, new session creation, session switching, and session deletion. Synchronizes with local storage for permanent session storage.

### Presentation Components

Presentation components purely handle UI rendering. Receive Props, render to screen, and pass user interactions to callbacks.

`AutoBeEventGroupMovie` renders event groups. Displays events grouped by stage as collapsible cards. In-progress groups automatically expand, completed groups collapse.

`AutoBeEventMovie` renders individual events. Uses different icons and layouts depending on event type. Start events as headers, Progress events as progress bars, Complete events as summaries.

`AutoBeProgressEventMovie` specializes in rendering progress events. Visually displays numeric counter, progress bar, and percentage. Applies animation so progress appears smooth.

`AutoBeScenarioEventMovie` renders scenario events. Shows planned task list where each item displays like a checklist. Users can preview what the AI plans to do.

### Utility Components

Reusable utility components.

`Collapsible` implements collapsible sections. Clicking header expands or collapses content. Includes animation for smooth transitions.

`ProgressBar` renders progress bars. Receives percentage and displays visually, with customizable colors and animations.

`EventCard` is a card component containing events. Provides consistent style and layout, arranging icon, title, content, and metadata.

`ChatBubble` renders chat messages. Distinguishes user messages from assistant messages and supports markdown rendering.

## Real-time Communication

Frontend and Backend communicate in real-time through WebSocket.

### WebSocket Connection

`@autobe/ui` implements type-safe WebSocket RPC using TGrid. Frontend implements Backend's `IAutoBeRpcListener` interface, and TGrid automatically converts method calls to WebSocket messages.

Connection lifecycle is clear. WebSocket connection starts on component mount and closes on unmount. Automatically retries on connection failure and displays reconnection status in UI.

Connection status is tracked via `connectionStatus`. Has states `connecting`, `connected`, `disconnected`, `error`, and UI reacts to them. Shows spinner when connecting, error message on failure.

### Event Streaming

All events published from Backend stream to Frontend via WebSocket.

The `AutoBeListener` class receives all events. Has handler methods for each event type and implements `IAutoBeRpcListener` interface. When Backend publishes an `analyzeStart` event, Frontend's `analyzeStart` method is automatically called.

Event accumulation is handled smartly. `analyzeWrite` events occur multiple times, so they accumulate in the same group. The `accumulate` method handles this, updating the event array. UI rerenders each time a new event is added, showing real-time updates.

Event grouping happens automatically. Groups from `analyzeStart` to `analyzeComplete` into one. The `eventGrouper` utility analyzes the event stream and divides into logical groups. Each group renders as a collapsible section.

### State Synchronization

Frontend state synchronizes according to Backend events.

The `AutoBeListenerState` class tracks current state. Updates state upon receiving completion events from Analyze, Database, Interface, Test, Realize stages. Final results are stored in fields like `state.analyze`, `state.database`.

State is immutable. On receiving new events, doesn't modify existing state but creates a new state object. Follows React's immutability principle, making state change tracking easy.

State changes immediately reflect in UI. All components subscribing through Context rerender and display latest state. Thanks to React's reactivity, UI automatically updates without additional logic.

## Session Management

User work is managed as sessions.

A session represents one backend generation project. All events and state from requirements input to final code generation are stored in the session. Users can manage multiple sessions simultaneously and switch between them freely.

Session persistence uses browser local storage. Session metadata (ID, title, creation time) and event stream are serialized to JSON and stored. Sessions persist even after closing and reopening the browser, allowing work continuation.

Session list displays in sidebar. Sorted with recent sessions on top, showing each session's title and last modified time. Clicking switches to that session and restores all events.

Creating new sessions is simple. Clicking "New Session" button creates an empty session and focuses the chat input. Existing sessions remain intact and can be returned to anytime.

Session deletion is supported. Deleting a session removes it from local storage and is unrecoverable. Displays confirmation dialog before deletion to prevent accidents.

## Configuration Management

User settings are managed through UI.

The configuration modal is handled by `AutoBeConfigModal` component. Can input API key, model selection, advanced options, etc. Fields are dynamically defined and apps can require different settings.

API keys are encrypted for storage. Stored encrypted in session storage and automatically deleted when closing browser tab. Uses session storage, not local storage, for security.

Configuration validation happens immediately. Save button is disabled if required fields are empty. API key format is also validated, rejecting wrong formats with error messages.

Settings are independent per app. Playground settings and VSCode Extension settings are managed separately. Each app defines required settings through `configFields` prop.

## Error Handling

Frontend gracefully handles various error situations.

WebSocket connection errors are automatically retried. Uses exponential backoff strategy to progressively increase retry intervals. Displays reconnection status in UI and notifies user on final failure.

Backend errors are clearly displayed. Various errors can occur: compilation errors, LLM API errors, timeouts, etc. Each error is sent as an event and displayed as error card in UI. Includes error message, stack trace, and retry availability.

Network errors are detected and handled. Immediately detects when WebSocket connection breaks and attempts reconnection. Informs user of offline status and automatically resumes when connection recovers.

User input errors receive immediate feedback. Attempts to send empty messages or wrong configuration inputs are immediately validated and rejected with clear error messages.

## Performance Optimization

Frontend cares about performance optimization.

Components are memoized. Uses `React.memo` to prevent unnecessary rerenders. Skips rerender if Props haven't changed.

Event processing is batched. When multiple events arrive in short time, batches them for processing at once. Along with React's automatic batching, optimizes UI update frequency.

Virtual scrolling applies to long event lists. When hundreds of events exist, only renders what's visible on screen. Improves scroll performance and reduces memory usage.

Images and icons are optimized. Uses SVG icons for sharp, lightweight UI. Loads only needed icons to reduce bundle size.

Code splitting applies at route level. Landing page, documentation, and Playground are separated into distinct chunks. Initial loading time is reduced, loading only needed code.

## Accessibility

AutoBE Frontend values accessibility.

Keyboard navigation is fully supported. Can access all interactive elements with Tab key and activate with Enter/Space. Focus indicators are clear, making current position easy to identify.

Screen reader support is implemented through ARIA attributes. Assigns appropriate labels and roles to buttons, input fields, and status indicators. Screen reader users can use all features.

Color contrast meets WCAG AA standards. Sufficient contrast between text and background makes it readable for low-vision users. Doesn't convey information through color alone, using icons and text together.

Error messages are clear and specific. Not "Error occurred" but actionable feedback like "API key is invalid. Please enter a valid key in settings".

## Future Enhancements

Frontend continues to evolve.

Dark mode support is planned. Users can switch between light/dark themes according to preference. Syncs with system settings for automatic application.

Multilingual support is on the roadmap. Will support multiple languages including English, Korean, Japanese, Chinese to provide familiar experience for global users.

Offline mode is under consideration. Using Service Workers to enable basic features offline. Stores generated projects locally and syncs when connection recovers.

AI chat enhancement is also planned. Supports modification requests, feature additions, debugging assistance conversationally in natural language. Aims for more intuitive and powerful interface.

AutoBE Frontend is not just UI, but a critical layer making complex AI systems user-friendly. Provides best user experience through transparency, reactivity, and type safety.
