import {
  AutoBeInterfaceComponentsEvent,
  AutoBeInterfaceEndpointsEvent,
  AutoBeInterfaceOperationsEvent,
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
      | AutoBeInterfaceEndpointsEvent
      | AutoBeInterfaceOperationsEvent
      | AutoBeInterfaceComponentsEvent;
  }
}

function getDescription(
  event: AutoBePlaygroundProgressEventMovie.IProps["event"],
): string {
  switch (event.type) {
    case "interfaceEndpoints":
      const count: number = event.endpoints.length;
      return `Composing Endpoints: ${count} of ${count}`;
    case "interfaceOperations":
      return `Designing Operations: ${event.completed} of ${event.total}`;
    case "interfaceComponents":
      return `Defining Type Schemas: ${event.completed} of ${event.total}`;
    default:
      event satisfies never;
      throw new Error("Unknown event type"); // unreachable
  }
}
