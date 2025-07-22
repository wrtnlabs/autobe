import {
  AutoBeInterfaceEndpointsEvent,
  AutoBePrismaComponentsEvent,
  AutoBeRealizeDecoratorCorrectEvent,
  AutoBeRealizeDecoratorEvent,
  AutoBeRealizeDecoratorValidateEvent,
  AutoBeRealizeTestResetEvent,
  AutoBeTestScenarioEvent,
} from "@autobe/interface";
import DonutLargeIcon from "@mui/icons-material/DonutLarge";
import { Card, CardContent, Chip } from "@mui/material";

export function AutoBePlaygroundRoutineEventMovie(
  props: AutoBePlaygroundRoutineEventMovie.IProps,
) {
  const state: IState = getState(props.event);
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
          icon={<DonutLargeIcon />}
          label={state.title}
          variant="outlined"
          color="success"
        />
        <br />
        <br />
        {state.description}
      </CardContent>
    </Card>
  );
}
export namespace AutoBePlaygroundRoutineEventMovie {
  export interface IProps {
    event:
      | AutoBePrismaComponentsEvent
      | AutoBeInterfaceEndpointsEvent
      | AutoBeTestScenarioEvent
      | AutoBeRealizeTestResetEvent
      | AutoBeRealizeDecoratorEvent
      | AutoBeRealizeDecoratorCorrectEvent
      | AutoBeRealizeDecoratorValidateEvent;
  }
}

interface IState {
  title: string;
  description: string;
}

function getState(
  event: AutoBePlaygroundRoutineEventMovie.IProps["event"],
): IState {
  switch (event.type) {
    case "prismaComponents":
      return {
        title: "Prisma Components",
        description: "Generating Prisma components",
      };
    case "interfaceEndpoints":
      return {
        title: "Interface Endpoints",
        description: "Generating interface endpoints",
      };
    case "testScenario":
      return {
        title: "Test Scenario",
        description: "Generating test scenarios",
      };
    case "realizeTestReset":
      return {
        title: "Realize Test Reset",
        description: "Resetting test environment",
      };
    case "realizeDecorator":
      return {
        title: "Realize Decorator",
        description: "Realizing decorator functions",
      };
    case "realizeDecoratorCorrect":
      return {
        title: "Realize Decorator Correct",
        description: "Correcting decorator functions",
      };
    case "realizeDecoratorValidate":
      return {
        title: "Realize Decorator Validate",
        description: "Validating decorator functions",
      };
    default:
      throw new Error("Unknown event type");
  }
}
