import {
  AutoBeInterfaceGroupsEvent,
  AutoBePrismaComponentsEvent,
  AutoBeRealizeTestResetEvent,
  AutoBeTestScenarioEvent,
} from "@autobe/interface";
import ChecklistIcon from "@mui/icons-material/Checklist";
import { Card, CardContent, Chip } from "@mui/material";
import { JSX } from "react";

export function AutoBePlaygroundScenarioEventMovie(
  props: AutoBePlaygroundScenarioEventMovie.IProps,
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
          icon={<ChecklistIcon />}
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
export namespace AutoBePlaygroundScenarioEventMovie {
  export interface IProps {
    event:
      | AutoBePrismaComponentsEvent
      | AutoBeInterfaceGroupsEvent
      | AutoBeTestScenarioEvent
      | AutoBeRealizeTestResetEvent;
  }
}

interface IState {
  title: string;
  description: string | JSX.Element;
}

function getState(
  event: AutoBePlaygroundScenarioEventMovie.IProps["event"],
): IState {
  switch (event.type) {
    case "prismaComponents":
      return {
        title: "Prisma Components",
        description: (
          <>
            Generating Prisma components.
            <br />
            <br />
            Number of Prisma schemas would be:
            <br />
            <ul>
              <li>namespaces: #{event.components.length}</li>
              <li>
                tables: #
                {event.components
                  .map((c) => c.tables.length)
                  .reduce((a, b) => a + b, 0)}
              </li>
            </ul>
          </>
        ),
      };
    case "interfaceGroups":
      return {
        title: "Interface Endpoint Groups",
        description: (
          <>
            Generating interface endpoint groups.
            <br />
            <br />
            Number of API operation groups would be #{event.groups.length}
          </>
        ),
      };
    case "testScenario":
      return {
        title: "Test Scenario",
        description: (
          <>
            Generating E2E test functions.
            <br />
            <br />
            Number of the test functions would be #{event.scenarios.length}
          </>
        ),
      };
    case "realizeTestReset":
      return {
        title: "Realize Test Reset",
        description: "Resetting test environment.",
      };
    default:
      throw new Error("Unknown event type");
  }
}
