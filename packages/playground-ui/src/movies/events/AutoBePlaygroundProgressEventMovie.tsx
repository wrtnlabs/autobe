import {
  AutoBeAnalyzeWriteEvent,
  AutoBeInterfaceEndpointsEvent,
  AutoBeInterfaceOperationsEvent,
  AutoBeInterfaceSchemasEvent,
  AutoBePrismaReviewEvent,
  AutoBePrismaSchemasEvent,
  AutoBeRealizeAuthorizationWriteEvent,
  AutoBeRealizeTestOperationEvent,
  AutoBeRealizeWriteEvent,
  AutoBeTestWriteEvent,
} from "@autobe/interface";
import { AutoBeInterfaceAuthorizationEvent } from "@autobe/interface/src/events/AutoBeInterfaceAuthorizationEvent";
import HourglassEmptyIcon from "@mui/icons-material/HourglassEmpty";
import { Card, CardContent, Chip, LinearProgress } from "@mui/material";

export function AutoBePlaygroundProgressEventMovie(
  props: AutoBePlaygroundProgressEventMovie.IProps,
) {
  const state: IState = getState(props.event);
  return (
    <Card
      elevation={1}
      style={{
        marginTop: 15,
        marginBottom: 15,
        marginRight: "15%",
      }}
    >
      <CardContent>
        <Chip
          icon={<HourglassEmptyIcon />}
          label={state.title}
          variant="outlined"
          color="success"
        />
        <br />
        <br />
        {state.description}
        <br />
        <br />
        <LinearProgress
          variant="determinate"
          color="success"
          sx={{
            borderRadius: 10,
            height: 10,
          }}
          value={props.last ? (state.completed / state.total) * 100 : 100}
        />
        <br />
        <sup>
          {props.last ? state.completed : state.total} / {state.total} completed
        </sup>
      </CardContent>
    </Card>
  );
}
export namespace AutoBePlaygroundProgressEventMovie {
  export interface IProps {
    event:
      | AutoBeAnalyzeWriteEvent
      | AutoBePrismaSchemasEvent
      | AutoBePrismaReviewEvent
      | AutoBeInterfaceEndpointsEvent
      | AutoBeInterfaceOperationsEvent
      | AutoBeInterfaceAuthorizationEvent
      | AutoBeInterfaceSchemasEvent
      | AutoBeTestWriteEvent
      | AutoBeRealizeWriteEvent
      | AutoBeRealizeAuthorizationWriteEvent
      | AutoBeRealizeTestOperationEvent;
    last: boolean;
  }
}

interface IState {
  title: string;
  description: string;
  completed: number;
  total: number;
}

function getState(
  event: AutoBePlaygroundProgressEventMovie.IProps["event"],
): IState {
  const content: Pick<IState, "title" | "description"> = (() => {
    switch (event.type) {
      case "analyzeWrite":
        return {
          title: "Analyze Write",
          description: "Analyzing requirements, and writing a report paper",
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
          description: "Designing API endpoints",
        };
      case "interfaceOperations":
        return {
          title: "Interface Operations",
          description: "Designing API operations",
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
