import {
  AutoBeAnalyzeStartEvent,
  AutoBeInterfaceStartEvent,
  AutoBePrismaStartEvent,
  AutoBeRealizeAuthorizationStartEvent,
  AutoBeRealizeStartEvent,
  AutoBeRealizeTestStartEvent,
  AutoBeTestStartEvent,
} from "@autobe/interface";

interface IAutoBeStartEventProps {
  event:
    | AutoBeAnalyzeStartEvent
    | AutoBePrismaStartEvent
    | AutoBeInterfaceStartEvent
    | AutoBeTestStartEvent
    | AutoBeRealizeStartEvent
    | AutoBeRealizeAuthorizationStartEvent
    | AutoBeRealizeTestStartEvent;
  style?: React.CSSProperties;
  className?: string;
}

const AutoBeStartEventMovie = (props: IAutoBeStartEventProps) => {
  const { event } = props;
  const title = getTitle(event);

  return (
    <div
      style={{
        display: "flex",
        justifyContent: "center",
        marginBottom: "1rem",
      }}
    >
      <div
        className={props.className}
        style={{
          backgroundColor: "#f0f0f0",
          border: "1px solid #e0e0e0",
          borderRadius: "0.5rem",
          padding: "0.5rem 1rem",
          ...props.style,
        }}
      >
        <div
          style={{
            fontSize: "0.875rem",
            color: "#666",
            fontWeight: "medium",
          }}
        >
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

export default AutoBeStartEventMovie;
