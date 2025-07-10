import {
  AutoBeAnalyzeReviewEvent,
  AutoBeAnalyzeWriteEvent,
  AutoBeInterfaceComplementEvent,
  AutoBeInterfaceComponentsEvent,
  AutoBeInterfaceEndpointsEvent,
  AutoBeInterfaceOperationsEvent,
  AutoBePrismaComponentsEvent,
  AutoBePrismaSchemasEvent,
  AutoBeRealizeProgressEvent,
  AutoBeRealizeValidateEvent,
  AutoBeTestCorrectEvent,
  AutoBeTestScenarioEvent,
  AutoBeTestValidateEvent,
  AutoBeTestWriteEvent,
} from "@autobe/interface";

export function AutoBePlaygroundProgressEventMovie(
  props: AutoBePlaygroundProgressEventMovie.IProps,
) {
  return (
    <ul>
      <li>{getDescription(props.event)}</li>
    </ul>
  );
}
export namespace AutoBePlaygroundProgressEventMovie {
  export interface IProps {
    event:
      | AutoBeAnalyzeReviewEvent
      | AutoBeAnalyzeWriteEvent
      | AutoBePrismaComponentsEvent
      | AutoBePrismaSchemasEvent
      | AutoBeInterfaceEndpointsEvent
      | AutoBeInterfaceOperationsEvent
      | AutoBeInterfaceComponentsEvent
      | AutoBeInterfaceComplementEvent
      | AutoBeTestScenarioEvent
      | AutoBeTestWriteEvent
      | AutoBeTestValidateEvent
      | AutoBeTestCorrectEvent
      | AutoBeRealizeProgressEvent
      | AutoBeRealizeValidateEvent;
  }
}

function getDescription(
  event: AutoBePlaygroundProgressEventMovie.IProps["event"],
): string {
  switch (event.type) {
    case "interfaceEndpoints":
      const endpoints: number = event.endpoints.length;
      return `Composing Endpoints: ${endpoints} of ${endpoints}`;
    case "interfaceOperations":
      return `Designing Operations: ${event.completed} of ${event.total}`;
    case "interfaceComponents":
      return `Defining Type Schemas: ${event.completed} of ${event.total}`;
    case "interfaceComplement":
      return "Filling missed type schemas";
    case "prismaComponents":
      const tables: number = event.components
        .map((c) => c.tables.length)
        .reduce((a, b) => a + b, 0);
      return `Composing Prisma Tables: ${tables} of ${tables}`;
    case "prismaSchemas":
      return `Generating Prisma Schemas: ${event.completed} of ${event.total}`;
    case "testScenario":
      return `Generating Test Plan Completed: ${event.scenarios.length}`;
    case "testWrite":
      return `Writing Test Functions: ${event.completed} of ${event.total}`;
    case "testValidate":
      return `Validating Test Function: ${event.result.type}`;
    case "testCorrect":
      return `Correcting Test Function`;
    case "realizeValidate":
      return `Validating Realize Function: ${event.result.type}`;
    case "realizeProgress":
      return `Writing Main Controller: ${event.completed} of ${event.total}`;
    case "analyzeWrite":
      return `Analyze user requirements and write documents`;
    case "analyzeReview":
      return `Reviewing generated documents by Analyze in progress`;
    default:
      event satisfies never;
      throw new Error("Unknown event type"); // unreachable
  }
}
