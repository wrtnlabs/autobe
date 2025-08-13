import {
  AutoBeAnalyzeReviewEvent,
  AutoBeAnalyzeWriteEvent,
  AutoBeInterfaceEndpointsEvent,
  AutoBeInterfaceOperationsReviewEvent,
  AutoBeInterfaceSchemasEvent,
  AutoBeInterfaceSchemasReviewEvent,
  AutoBePrismaReviewEvent,
  AutoBePrismaSchemasEvent,
} from "@autobe/interface";

interface IProgressEventsMovieProps {
  event: /** Analyze */
  | AutoBeAnalyzeWriteEvent
    | AutoBeAnalyzeReviewEvent
    /** Prisma */
    | AutoBePrismaSchemasEvent
    | AutoBePrismaReviewEvent

    /** Interface */
    | AutoBeInterfaceEndpointsEvent
    | AutoBeInterfaceOperationsReviewEvent
    | AutoBeInterfaceSchemasEvent
    | AutoBeInterfaceSchemasReviewEvent;
}

const ProgressEventsMovie = (props: IProgressEventsMovieProps) => {
  const { event } = props;
  /**
   * ```json
   * {
   *   "type": type,
   *   "step": step,
   *   "total": total,
   *   "completed": completed,
   *   "created_at": "2025-08-13T05:37:47.899Z"
   * }
   * ```
   */
  return <div>{getTitle(event)}</div>;
};

const getTitle = (event: IProgressEventsMovieProps["event"]) => {
  switch (event.type) {
    case "analyzeWrite":
    case "analyzeReview": {
      return "Analyze";
    }
    case "prismaSchemas":
    case "prismaReview": {
      return "Prisma";
    }
    case "interfaceEndpoints":
    case "interfaceOperationsReview":
    case "interfaceSchemas":
    case "interfaceSchemasReview": {
      return "Interface";
    }
    default: {
      return "Unknown";
    }
  }
};

export default ProgressEventsMovie;
