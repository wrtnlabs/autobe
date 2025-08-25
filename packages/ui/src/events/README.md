# AutoBe Event Components

Event UI components for the AutoBe platform with grouping and collapsible functionality.

## Individual Event Components

### AutoBeProgressEventMovie
Shows progress tracking events with progress bars.

```tsx
import { AutoBeProgressEventMovie } from "@autobe/ui/events";

<AutoBeProgressEventMovie event={progressEvent} />
```

### AutoBeValidateEventMovie
Shows validation events with error/success states.

```tsx
import { AutoBeValidateEventMovie } from "@autobe/ui/events";

<AutoBeValidateEventMovie event={validateEvent} />
```

### AutoBeScenarioEventMovie
Shows scenario analysis and component generation events.

```tsx
import { AutoBeScenarioEventMovie } from "@autobe/ui/events";

<AutoBeScenarioEventMovie event={scenarioEvent} />
```

### AutoBeStartEventMovie
Shows pipeline start events with simple status display.

```tsx
import { AutoBeStartEventMovie } from "@autobe/ui/events";

<AutoBeStartEventMovie event={startEvent} />
```

## Grouped Event Components

### ValidateEventGroup
Groups validation events with success rate statistics.

```tsx
import { ValidateEventGroup } from "@autobe/ui/events";

<ValidateEventGroup 
  events={validateEvents} 
  defaultCollapsed={true} 
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
Basic card container for consistent styling.

```tsx
import { EventCard } from "@autobe/ui/events";

<EventCard>
  <div>Your content here</div>
</EventCard>
```

### EventHeader
Standardized header with icon, title, and timestamp.

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
Consistent content area styling.

```tsx
import { EventContent } from "@autobe/ui/events";

<EventContent>
  <div>Your content here</div>
</EventContent>
```

### EventIcon
Consistent icons for different event states.

```tsx
import { EventIcon } from "@autobe/ui/events";

<EventIcon type="success" size={16} />
```

Available icon types: `success`, `progress`, `warning`, `error`, `info`, `start`

### ProgressBar
Reusable progress bar component.

```tsx
import { ProgressBar } from "@autobe/ui/events";

<ProgressBar 
  current={7} 
  total={10} 
  color="#4caf50"
  showLabel={true}
/>
```

## Features

- 🎯 **Consistent Design**: All components follow the same design system
- 📱 **Responsive**: Works on all screen sizes
- 🔄 **Collapsible**: Group events to reduce visual clutter
- 📊 **Statistics**: Automatic progress and error rate calculations
- 🎨 **Customizable**: Easy to extend and customize
- 💎 **TypeScript**: Full type safety and IntelliSense support
- ⚡ **Performance**: Efficient rendering with minimal re-renders
