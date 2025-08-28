# AutoBe Event Components

Event UI components for the AutoBe platform with comprehensive event handling, grouping, and collapsible functionality.

## Overview

The AutoBe Event system provides a complete solution for displaying various types of events in the AutoBe workflow. The main entry point is `AutoBeEventMovie`, which intelligently routes different event types to their appropriate components.

## Main Event Router

### AutoBeEventMovie
The central component that handles all event types and routes them to appropriate sub-components.

```tsx
import { AutoBeEventMovie } from "@autobe/ui/events";

<AutoBeEventMovie 
  service={rpcService}
  events={eventArray}
  last={isLastEvent}
/>
```

**Supported Event Types:**
- **Message Events**: `userMessage`, `assistantMessage`
- **Start Events**: `analyzeStart`, `prismaStart`, `interfaceStart`, `testStart`, `realizeStart`, `realizeTestStart`, `realizeAuthorizationStart`
- **Scenario Events**: `analyzeScenario`, `prismaComponents`, `interfaceGroups`, `realizeTestReset`
- **Progress Events**: `analyzeWrite`, `analyzeReview`, `interfaceEndpoints`, `prismaSchemas`, `prismaReview`, `interfaceOperations`, `interfaceOperationsReview`, `interfaceAuthorization`, `interfaceSchemas`, `interfaceSchemasReview`, `testWrite`, `testScenarios`, `realizeWrite`, `realizeAuthorizationWrite`, `realizeTestOperation`
- **Validate Events**: `prismaInsufficient`, `prismaValidate`, `interfaceComplement`, `testValidate`, `realizeValidate`, `realizeAuthorizationValidate`
- **Complete Events**: `analyzeComplete`, `prismaComplete`, `interfaceComplete`, `testComplete`, `realizeComplete`

## Individual Event Components

### AutoBeProgressEventMovie
Shows progress tracking events with animated progress bars and status indicators.

```tsx
import { AutoBeProgressEventMovie } from "@autobe/ui/events";

<AutoBeProgressEventMovie event={progressEvent} />
```

### AutoBeValidateEventMovie
Displays validation events with detailed error/success states and validation results.

```tsx
import { AutoBeValidateEventMovie } from "@autobe/ui/events";

<AutoBeValidateEventMovie event={validateEvent} />
```

### AutoBeScenarioEventMovie
Shows scenario analysis and component generation events with structured data display.

```tsx
import { AutoBeScenarioEventMovie } from "@autobe/ui/events";

<AutoBeScenarioEventMovie event={scenarioEvent} />
```

### AutoBeStartEventMovie
Displays pipeline start events with clean status indicators and timing information.

```tsx
import { AutoBeStartEventMovie } from "@autobe/ui/events";

<AutoBeStartEventMovie event={startEvent} />
```

### AutoBeCompleteEventMovie
Shows completion events with file download capabilities and summary statistics.

```tsx
import { AutoBeCompleteEventMovie } from "@autobe/ui/events";

<AutoBeCompleteEventMovie 
  event={completeEvent}
  getFiles={service.getFiles}
/>
```

## Grouped Event Components

### ValidateEventGroup
Intelligently groups validation events with success rate statistics and collapsible interface.

```tsx
import { ValidateEventGroup } from "@autobe/ui/events";

<ValidateEventGroup 
  events={validateEvents} 
  defaultCollapsed={true} 
/>
```

**Features:**
- Automatic success/failure rate calculation
- Collapsible interface for better UX
- Grouped display for multiple validation events
- Individual event access when expanded

## Message Components

### AutoBeUserMessageMovie
Displays user messages with support for various content types (text, files, images, audio).

```tsx
import { AutoBeUserMessageMovie } from "@autobe/ui";

<AutoBeUserMessageMovie message={userMessageContents} />
```

### AutoBeAssistantMessageMovie
Shows assistant responses with timestamps and custom assistant names.

```tsx
import { AutoBeAssistantMessageMovie } from "@autobe/ui";

<AutoBeAssistantMessageMovie 
  text={responseText}
  isoTimestamp={timestamp}
  assistantName="AutoBe"
/>
```

## Automatic Event Grouping

Use the `groupEvents` utility to automatically group events by type:

```tsx
import { groupEvents } from "@autobe/ui/events/utils/eventGrouper";

const EventList = ({ events }: { events: AutoBeEvent[] }) => {
  const groupedComponents = groupEvents(events, {
    minGroupSize: 3,       // Minimum events to form a group
    defaultCollapsed: true, // Start collapsed
    enableGrouping: true,   // Enable grouping
  });

  return (
    <div>
      {groupedComponents}
    </div>
  );
};
```

## Custom Collapsible Groups

Create custom event groups using the `CollapsibleEventGroup` component:

```tsx
import { CollapsibleEventGroup } from "@autobe/ui/events";

<CollapsibleEventGroup
  events={customEvents}
  title="Custom Event Group"
  iconType="info"
  getTimestamp={(event) => event.created_at}
  renderEvent={(event, index) => <CustomEventComponent event={event} />}
  renderSummary={(events) => <CustomSummary events={events} />}
  defaultCollapsed={true}
  description="Custom grouped events"
/>
```

## Common Components

### EventCard
Basic card container for consistent styling across all event types.

```tsx
import { EventCard } from "@autobe/ui/events";

<EventCard>
  <div>Your content here</div>
</EventCard>
```

### EventHeader
Standardized header with icon, title, timestamp, and step numbering.

```tsx
import { EventHeader } from "@autobe/ui/events";

<EventHeader
  title="Event Title"
  timestamp="2024-01-01T12:00:00Z"
  iconType="success"
  step={1}
/>
```

### EventContent
Consistent content area styling with proper spacing and typography.

```tsx
import { EventContent } from "@autobe/ui/events";

<EventContent>
  <div>Your content here</div>
</EventContent>
```

### EventIcon
Consistent icons for different event states with customizable sizes.

```tsx
import { EventIcon } from "@autobe/ui/events";

<EventIcon type="success" size={16} />
```

**Available icon types:** `success`, `progress`, `warning`, `error`, `info`, `start`

### ProgressBar
Reusable progress bar component with customizable styling.

```tsx
import { ProgressBar } from "@autobe/ui/events";

<ProgressBar 
  current={7} 
  total={10} 
  color="#4caf50"
  showLabel={true}
/>
```

## Event Flow Architecture

The AutoBe event system follows a predictable flow:

1. **Start Events** → Initialize pipeline stages
2. **Scenario Events** → Analyze and plan components
3. **Progress Events** → Track ongoing operations
4. **Validate Events** → Verify outputs and handle errors
5. **Complete Events** → Finalize and provide results

## Advanced Usage

### Custom Event Handlers

```tsx
import { AutoBeEventMovie, IAutoBeEventMovieProps } from "@autobe/ui/events";

const CustomEventHandler = ({ events, service, last }: IAutoBeEventMovieProps<AutoBeEvent>) => {
  // Pre-process events if needed
  const processedEvents = preprocessEvents(events);
  
  return (
    <AutoBeEventMovie 
      events={processedEvents}
      service={service}
      last={last}
    />
  );
};
```

### Event Filtering

```tsx
const filteredEvents = events.filter(event => 
  !['vendorRequest', 'vendorResponse', 'jsonParseError'].includes(event.type)
);
```

## TypeScript Support

All components are fully typed with comprehensive interfaces:

```tsx
interface IAutoBeEventMovieProps<Event extends AutoBeEvent> {
  service: IAutoBeRpcService;
  events: Event[];
  last: boolean;
}
```

## Features

- 🎯 **Intelligent Routing**: Automatic event type detection and routing
- 📱 **Responsive Design**: Works seamlessly on all screen sizes
- 🔄 **Smart Grouping**: Automatic grouping of related events
- 📊 **Rich Statistics**: Built-in progress and error rate calculations
- 🎨 **Consistent Styling**: Unified design system across all components
- 💎 **Full TypeScript**: Complete type safety and IntelliSense support
- ⚡ **Optimized Performance**: Efficient rendering with minimal re-renders
- 🔧 **Highly Customizable**: Easy to extend and customize for specific needs
- 🎪 **Animation Support**: Smooth transitions and progress animations
- 📁 **File Management**: Built-in file download and management capabilities

## Best Practices

1. **Always use AutoBeEventMovie** as the main entry point for event rendering
2. **Group related validation events** for better user experience
3. **Provide meaningful timestamps** for all events
4. **Use consistent naming** for custom event types
5. **Handle edge cases** gracefully with null returns for unsupported events
