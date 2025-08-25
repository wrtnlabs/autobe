import {
  AutoBeAnalyzeScenarioEvent,
  AutoBeInterfaceGroupsEvent,
  AutoBePrismaComponentsEvent,
  AutoBeRealizeTestResetEvent,
} from "@autobe/interface";
import { JSX } from "react";

import { EventCard, EventContent, EventHeader } from "./common";

export interface IAutoBeScenarioEventMovieProps {
  event:
    | AutoBeAnalyzeScenarioEvent
    | AutoBePrismaComponentsEvent
    | AutoBeInterfaceGroupsEvent
    | AutoBeRealizeTestResetEvent;
}
export const AutoBeScenarioEventMovie = (
  props: IAutoBeScenarioEventMovieProps,
) => {
  const { event } = props;
  const { title, description } = getState(event);

  return (
    <EventCard>
      <EventHeader title={title} timestamp={event.created_at} iconType="info" />
      <EventContent>{description}</EventContent>
    </EventCard>
  );
};
export default AutoBeScenarioEventMovie;

interface IState {
  title: string;
  description: string | JSX.Element;
}

function getState(event: IAutoBeScenarioEventMovieProps["event"]): IState {
  switch (event.type) {
    case "analyzeScenario":
      return {
        title: "Analyze Scenario",
        description: (
          <>
            Generating analysis report.
            <br />
            <br />
            Number of documents to write: #{event.files.length}
          </>
        ),
      };
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
    case "realizeTestReset":
      return {
        title: "Realize Test Reset",
        description: "Resetting test environment.",
      };
    default:
      event satisfies never;
      throw new Error("Unknown event type");
  }
}
