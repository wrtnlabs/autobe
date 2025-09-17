import { AutoBeEvent, AutoBeProgressEventBase } from "@autobe/interface";

import { EventCard, EventContent, EventHeader, ProgressBar } from "./common";

export function AutoBeProgressEventMovie(
  props: AutoBeProgressEventMovie.IProps,
) {
  const state: IState = getState(props.event);

  return (
    <EventCard>
      <EventHeader
        title={state.title}
        timestamp={props.event.created_at}
        iconType="progress"
      />
      <EventContent>
        <div style={{ marginBottom: 0 }}>{state.description}</div>
        <ProgressBar current={state.completed} total={state.total} />
      </EventContent>
    </EventCard>
  );
}
type ExtractType<T, U> = T extends U ? T : never;

export namespace AutoBeProgressEventMovie {
  export interface IProps {
    event: ExtractType<AutoBeEvent, AutoBeProgressEventBase>;
  }
}

interface IState {
  title: string;
  description: string;
  completed: number;
  total: number;
}

function getState(event: AutoBeProgressEventMovie.IProps["event"]): IState {
  const content: Pick<IState, "title" | "description"> = (() => {
    switch (event.type) {
      case "analyzeWrite":
        return {
          title: "Analyze Write",
          description: "Analyzing requirements, and writing a report paper",
        };
      case "analyzeReview":
        return {
          title: "Analyze Review",
          description: "Reviewing the analysis results",
        };
      case "prismaSchemas":
        return {
          title: "Prisma Schemas",
          description: "Designing Database schemas",
        };
      case "prismaReview":
        return {
          title: "Prisma Review",
          description: "Reviewing the Prisma schemas",
        };
      case "interfaceEndpoints":
        return {
          title: "Interface Endpoints",
          description: "Collecting API endpoints",
        };
      case "interfaceOperations":
        return {
          title: "Interface Operations",
          description: "Designing API operations",
        };
      case "interfaceOperationsReview":
        return {
          title: "Interface Operations Review",
          description: "Reviewing API operations",
        };
      case "interfaceAuthorization":
        return {
          title: "Interface Authorization",
          description: "Designing API authorization operations",
        };
      case "interfaceSchemas":
        return {
          title: "Interface Schemas",
          description: "Designing API type schemas",
        };
      case "interfaceSchemasReview":
        return {
          title: "Interface Schemas Review",
          description: "Reviewing API type schemas",
        };
      case "testScenarios":
        return {
          title: "Test Scenarios",
          description: "Planning E2E test scenarios",
        };
      case "testScenariosReview":
        return {
          title: "Test Scenarios Review",
          description: "Reviewing E2E test scenarios",
        };
      case "testWrite":
        return {
          title: "Test Write",
          description: "Writing E2E test functions",
        };
      case "realizeWrite":
        return {
          title: "Realize Write",
          description: "Realizing the API functions",
        };
      case "realizeAuthorizationWrite":
        return {
          title: "Authorization Write",
          description: "Writing authorization decorators and functions",
        };
      case "realizeTestOperation":
        return {
          title: "Realize Test Operation",
          description:
            "Running the E2E test operations to validate the API functions",
        };
      case "realizeCorrect":
        return {
          title: "Realize Correct",
          description: "Correcting the API functions",
        };
      default:
        event satisfies never;
        return {
          title: "Unknown Event",
          description: "This event type is not recognized.",
        };
    }
  })();
  return {
    ...content,
    completed: event.completed,
    total: event.total,
  };
}
export default AutoBeProgressEventMovie;
