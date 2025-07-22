import {
  AutoBeAnalyzeReviewEvent,
  AutoBeInterfaceComplementEvent,
  AutoBePrismaInsufficientEvent,
  AutoBePrismaValidateEvent,
  AutoBeRealizeValidateEvent,
  AutoBeTestValidateEvent,
} from "@autobe/interface";
import ErrorOutlineIcon from "@mui/icons-material/ErrorOutline";
import OpenInNewIcon from "@mui/icons-material/OpenInNew";
import {
  Button,
  Card,
  CardActions,
  CardContent,
  Chip,
  LinearProgress,
} from "@mui/material";
import StackBlitzSDK from "@stackblitz/sdk";
import { JSX } from "react";

import { ErrorUtil } from "../../utils/ErrorUtil";

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
          variant={
            props.last && state.progress === null
              ? "indeterminate"
              : "determinate"
          }
          color="warning"
          sx={{
            borderRadius: 10,
            height: 10,
          }}
          value={
            state.progress !== null && props.last === true
              ? (state.progress.completed / state.progress.total) * 100
              : 100
          }
        />
        <br />
        <sup>#{props.events.length}</sup>
      </CardContent>
      {state.project ? (
        <CardActions>
          <div>
            {props.events.map((event, i) => {
              const project = state.project!(event, i);
              return (
                <>
                  {i === 0 ? null : <br />}
                  <Button
                    startIcon={<OpenInNewIcon />}
                    onClick={() => {
                      StackBlitzSDK.openProject(
                        {
                          files: project.files,
                          title: project.title,
                          description: project.description,
                          template: "node",
                        },
                        { newWindow: true },
                      );
                    }}
                  >
                    {project.title}
                  </Button>
                </>
              );
            })}
          </div>
        </CardActions>
      ) : null}
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
  const last: Event = events[events.length - 1];
  switch (last.type) {
    case "analyzeReview":
      return {
        title: "Analyze Review",
        description: "Reviewing the analysis results",
        progress: {
          completed: last.completed,
          total: last.total,
        },
        project: (event: AutoBeAnalyzeReviewEvent, i: number) => ({
          title: `Analyze Review Report (${i + 1})`,
          description: "Report of Analyze Review Event",
          files: {
            "review.md": event.review,
          },
        }),
      } satisfies IState<AutoBeAnalyzeReviewEvent> as IState;
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
        progress: null,
        project: null,
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
        progress: null,
        project: (event: AutoBePrismaValidateEvent, i: number) => ({
          title: `Prisma Error Report (${i + 1})`,
          description: "Report of Prisma Validate Event (Compilation Error)",
          files: {
            ...event.schemas,
            ...(event.compiled.type === "failure"
              ? {
                  "compile-failure-reason.log": event.compiled.reason,
                }
              : event.compiled.type === "exception"
                ? {
                    "compile-error.json": JSON.stringify(
                      ErrorUtil.toJSON(event.compiled.error),
                      null,
                      2,
                    ),
                  }
                : {}),
          },
        }),
      } satisfies IState<AutoBePrismaValidateEvent> as IState;
    case "interfaceComplement":
      return {
        title: "Interface Complement",
        description: "Complementing the interface operations",
        progress: null,
        project: null,
      };
    case "testValidate":
      return {
        title: "Test Validate",
        description: (
          <>
            AI wrote invalid E2E test function, so compilation error occurred.
            <br />
            <br />
            Trying to recover the compile error by studying the AI agent.
          </>
        ),
        progress: null,
        project: null,
      };
    case "realizeValidate":
      return {
        title: "Realize Validate",
        description: "Validating the realization of the project",
        progress: null,
        project: null,
      };
    default:
      last satisfies never;
      return {
        title: "Unknown Event",
        description: "This event type is not recognized.",
        progress: null,
        project: null,
      };
  }
}

interface IState<
  Event extends
    AutoBePlaygroundValidateEventMovie.Supported = AutoBePlaygroundValidateEventMovie.Supported,
> {
  title: string;
  description: string | JSX.Element;
  progress: {
    completed: number;
    total: number;
  } | null;
  project:
    | null
    | ((
        event: Event,
        i: number,
      ) => {
        title: string;
        description: string;
        files: Record<string, string>;
      });
}
