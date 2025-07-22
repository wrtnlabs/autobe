import {
  AutoBeAnalyzeReviewEvent,
  AutoBeInterfaceComplementEvent,
  AutoBePrismaInsufficientEvent,
  AutoBePrismaValidateEvent,
  AutoBeRealizeValidateEvent,
  AutoBeTestValidateEvent,
} from "@autobe/interface";
import ErrorOutlineIcon from "@mui/icons-material/ErrorOutline";
import { Card, CardContent, Chip, LinearProgress } from "@mui/material";
import { JSX } from "react";

export function AutoBePlaygroundValidateEventMovie<
  Event extends AutoBePlaygroundValidateEventMovie.Supported,
>(props: AutoBePlaygroundValidateEventMovie.IProps<Event>) {
  const state: IState = getState<Event>(props.events);
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
        <LinearProgress
          variant={props.last ? "indeterminate" : "determinate"}
          color="warning"
          sx={{
            borderRadius: 10,
            height: 10,
          }}
          value={100}
        />
        <br />
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
    | AutoBeInterfaceComplementEvent
    | AutoBeTestValidateEvent
    | AutoBeRealizeValidateEvent;
  export interface IProps<Event extends Supported> {
    events: Event[];
    last: boolean;
  }
}

function getState<Event extends AutoBePlaygroundValidateEventMovie.Supported>(
  events: Event[],
): IState {
  const first: Event = events[0];
  switch (first.type) {
    case "analyzeReview":
      return {
        title: "Analyze Review",
        description: "Reviewing the analysis results",
        files: null,
      };
    case "prismaInsufficient":
      return {
        title: "Prisma Insufficient",
        description: (
          <>
            AI wrote insufficient Prisma schema.
            <br />
            <br />
            Trying to fulfill the omitted tables, so that complete the DB
            design.
          </>
        ),
        files: null,
      };
    case "prismaValidate":
      return {
        title: "Prisma Validate",
        description: (
          <>
            AI wrote invalid Prisma schema, so compilation error occurred.
            <br />
            <br />
            Trying to recover the compile error by studying the AI agent.
          </>
        ),
        files: null,
      };
    case "interfaceComplement":
      return {
        title: "Interface Complement",
        description: "Complementing the interface operations",
        files: null,
      };
    case "testValidate":
      return {
        title: "Test Validate",
        description: (
          <>
            AI wrote invalid E2E test function.
            <br />
            <br />
            Trying to recover the test function by studying the AI agent.
          </>
        ),
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

interface IState {
  title: string;
  description: string | JSX.Element;
  files:
    | null
    | ((event: AutoBePlaygroundValidateEventMovie.Supported) => {
        title: string;
        description: string;
        files: Record<string, string>;
      });
}
