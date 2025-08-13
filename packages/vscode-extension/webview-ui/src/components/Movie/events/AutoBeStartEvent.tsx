import {
  AutoBeAnalyzeStartEvent,
  AutoBeInterfaceStartEvent,
  AutoBePrismaStartEvent,
  AutoBeRealizeStartEvent,
  AutoBeRealizeTestStartEvent,
  AutoBeTestStartEvent,
} from "@autobe/interface";
import { AutoBeRealizeAuthorizationStartEvent } from "@autobe/interface/src/events/AutoBeRealizeAuthorizationStartEvent";

interface IAutoBeStartEventProps {
  event:
    | AutoBeAnalyzeStartEvent
    | AutoBePrismaStartEvent
    | AutoBeInterfaceStartEvent
    | AutoBeTestStartEvent
    | AutoBeRealizeStartEvent
    | AutoBeRealizeAuthorizationStartEvent
    | AutoBeRealizeTestStartEvent;
}

const AutoBeStartEvent = (props: IAutoBeStartEventProps) => {
  const { event } = props;
  const title = getTitle(event);

  return (
    <div className="flex justify-center mb-4">
      <div className="bg-gray-100 border border-gray-200 rounded-full px-4 py-2 shadow-sm">
        <div className="text-sm text-gray-600 font-medium">
          🚀 {title} has started.
        </div>
      </div>
    </div>
  );
};

function getTitle(event: IAutoBeStartEventProps["event"]): string {
  switch (event.type) {
    case "analyzeStart":
      return "Analyze";
    case "prismaStart":
      return "Prisma";
    case "interfaceStart":
      return "Interface";
    case "testStart":
      return "Test";
    case "realizeStart":
      return "Realize";
    case "realizeAuthorizationStart":
      return "Realize Authorization";
    case "realizeTestStart":
      return "Final E2E Test";
    default:
      event satisfies never;
      throw new Error("Unknown event type"); // unreachable
  }
}

export default AutoBeStartEvent;
