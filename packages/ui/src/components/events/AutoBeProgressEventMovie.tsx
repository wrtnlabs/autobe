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
      case "prismaSchema":
        return {
          title: "Prisma Schemas",
          description: "Designing Database schemas",
        };
      case "prismaReview":
        return {
          title: "Prisma Review",
          description: "Reviewing the Prisma schemas",
        };
      case "interfaceEndpoint":
        return {
          title: "Interface Endpoints",
          description: "Collecting API endpoints",
        };
      case "interfaceEndpointReview":
        return {
          title: "Interface Endpoints Review",
          description: "Reviewing API endpoints",
        };
      case "interfaceOperation":
        return {
          title: "Interface Operations",
          description: "Designing API operations",
        };
      case "interfaceOperationReview":
        return {
          title: "Interface Operations Review",
          description: "Reviewing API operations",
        };
      case "interfaceAuthorization":
        return {
          title: "Interface Authorization",
          description: "Designing API authorization operations",
        };
      case "interfaceSchema":
        return {
          title: "Interface Schemas",
          description: "Designing API type schemas",
        };
      case "interfaceSchemaReview":
        return {
          title: "Interface Schemas Review",
          description: `Reviewing API type schemas' ${event.kind}`,
        };
      case "interfaceComplement":
        return {
          title: "Interface Complement",
          description: "Complementing missing API type schemas",
        };
      case "interfaceSchemaRename":
        return {
          title: "Interface Schema Rename",
          description: "Renaming API type schemas",
        };
      case "interfacePrerequisite":
        return {
          title: "Interface Prerequisites",
          description: "Defining API prerequisites",
        };
      case "testScenario":
        return {
          title: "Test Scenarios",
          description: "Planning E2E test scenarios",
        };
      case "testScenarioReview":
        return {
          title: "Test Scenarios Review",
          description: "Reviewing E2E test scenarios",
        };
      case "testWrite":
        return {
          title: "Test Write",
          description: "Writing E2E test functions",
        };
      case "realizePlan":
        return {
          title: "Realize Plan",
          description: "Planning the API functions' modularization",
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
      case "imageDescribeDraft":
        return {
          title: "Describe Image Draft",
          description: "Describing the image draft",
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
