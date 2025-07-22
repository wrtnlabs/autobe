import {
  AutoBeAnalyzeReviewEvent,
  AutoBeInterfaceComplementEvent,
  AutoBePrismaCorrectEvent,
  AutoBePrismaInsufficientEvent,
  AutoBePrismaValidateEvent,
  AutoBeRealizeValidateEvent,
  AutoBeTestCorrectEvent,
  AutoBeTestValidateEvent,
} from "@autobe/interface";
import ErrorOutlineIcon from "@mui/icons-material/ErrorOutline";
import { Card, CardContent, Chip, LinearProgress } from "@mui/material";

export function AutoBePlaygroundValidateEventMovie<
  Event extends AutoBePlaygroundValidateEventMovie.Supported,
>(props: AutoBePlaygroundValidateEventMovie.IProps<Event>) {
  const state: State = getState<Event>(props.events);
  return (
    <Card
      elevation={3}
      style={{
        marginTop: 15,
        marginBottom: 15,
        marginRight: "15%",
      }}
    >
      <CardContent>
        <Chip
          icon={<ErrorOutlineIcon />}
          label={state.title}
          variant="outlined"
          color="warning"
        />
        <br />
        <br />
        {state.description}
        <br />
        <br />
        {props.last ? (
          <LinearProgress variant="indeterminate" color="warning" />
        ) : (
          <LinearProgress variant="determinate" color="warning" value={100} />
        )}
        <sup>#{props.events.length}</sup>
      </CardContent>
    </Card>
  );
}
export namespace AutoBePlaygroundValidateEventMovie {
  export type Supported =
    | AutoBeAnalyzeReviewEvent
    | AutoBePrismaInsufficientEvent
    | AutoBePrismaValidateEvent
    | AutoBePrismaCorrectEvent
    | AutoBeInterfaceComplementEvent
    | AutoBeTestValidateEvent
    | AutoBeTestCorrectEvent
    | AutoBeRealizeValidateEvent;
  export interface IProps<Event extends Supported> {
    events: Event[];
    last: boolean;
  }
}

function getState<Event extends AutoBePlaygroundValidateEventMovie.Supported>(
  events: Event[],
): State {
  const first: Event = events[0];
  switch (first.type) {
    case "analyzeReview":
      return {
        title: "Analyze Review",
        description: "Reviewing the analysis results",
        files: null,
      };
    case "prismaCorrect":
      return {
        title: "Prisma Correct",
        description: "Correcting the Prisma schemas",
        files: null,
      };
    case "prismaInsufficient":
      return {
        title: "Prisma Insufficient",
        description: "Insufficient Prisma schemas",
        files: null,
      };
    case "prismaValidate":
      return {
        title: "Prisma Validate",
        description: "Validating the Prisma schemas",
        files: null,
      };
    case "interfaceComplement":
      return {
        title: "Interface Complement",
        description: "Complementing the interface operations",
        files: null,
      };
    case "testCorrect":
      return {
        title: "Test Correct",
        description: "Correcting the test cases",
        files: null,
      };
    case "testValidate":
      return {
        title: "Test Validate",
        description: "Validating the test cases",
        files: null,
      };
    case "realizeValidate":
      return {
        title: "Realize Validate",
        description: "Validating the realization of the project",
        files: null,
      };
    default:
      first satisfies never;
      return {
        title: "Unknown Event",
        description: "This event type is not recognized.",
        files: null,
      };
  }
}

interface State {
  title: string;
  description: string;
  files:
    | null
    | ((event: AutoBePlaygroundValidateEventMovie.Supported) => {
        title: string;
        description: string;
        files: Record<string, string>;
      });
}
