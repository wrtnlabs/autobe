import {
  AutoBeAnalyzeScenarioEvent,
  AutoBeDatabaseGroupEvent,
  AutoBeInterfaceGroupEvent,
  AutoBeRealizeTestResetEvent,
} from "@autobe/interface";
import { JSX } from "react";

import { EventCard, EventContent, EventHeader } from "./common";

export interface IAutoBeScenarioEventMovieProps {
  event:
    | AutoBeAnalyzeScenarioEvent
    | AutoBeDatabaseGroupEvent
    | AutoBeInterfaceGroupEvent
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
    case "databaseGroup":
      return {
        title: "Database Group",
        description: (
          <>
            Generating Database groups.
            <br />
            <br />
            Number of Database groups would be:
            <br />
            <ul>
              <li>namespaces: #{event.groups.length}</li>
            </ul>
          </>
        ),
      };
    case "interfaceGroup":
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
