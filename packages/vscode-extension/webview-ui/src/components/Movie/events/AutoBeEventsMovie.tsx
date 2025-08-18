import { AutoBeEvent } from "@autobe/interface";

import AssistantMessage from "../AutoBeAssistantMessage";
import AutoBeUserMessage from "../AutoBeUserMessage";
import AutoBeStartEvent from "./AutoBeStartEvent";
import ProgressEventsMovie, {
  IProgressEventsMovieProps,
} from "./ProgressEventsMovie";
import AnalyzeComplete from "./analyze/AnalyzeComplete";
import AnalyzeScenario from "./analyze/AnalyzeScenario";
import {
  InterfaceComplement,
  InterfaceComplete,
  InterfaceGroups,
} from "./interface";
import PrismaComplete from "./prisma/PrismaComplete";
import PrismaComponents from "./prisma/PrismaComponents";
import PrismaCorrect from "./prisma/PrismaCorrect";
import PrismaValidate from "./prisma/PrismaValidate";

interface IAutoBeEventsMovieProps {
  event: AutoBeEvent;
}

export const isAutoBeProgressEventBase = (
  event: AutoBeEvent,
): event is IProgressEventsMovieProps["event"] => {
  return (
    "total" in event &&
    "completed" in event &&
    typeof event.total === "number" &&
    typeof event.completed === "number"
  );
};
const AutoBeEventsMovie = (props: IAutoBeEventsMovieProps) => {
  const { event } = props;

  if (isAutoBeProgressEventBase(event)) {
    return <ProgressEventsMovie event={event} />;
  }

  switch (event.type) {
    case "assistantMessage":
      return (
        <AssistantMessage text={event.text} timestamp={event.created_at} />
      );
    case "userMessage":
      return <AutoBeUserMessage message={event.contents} />;

    case "analyzeStart":
    case "interfaceStart":
    case "prismaStart":
    case "testStart":
    case "realizeAuthorizationStart":
    case "realizeTestStart":
    case "realizeStart": {
      return <AutoBeStartEvent event={event} />;
    }

    case "analyzeScenario": {
      return <AnalyzeScenario event={event} />;
    }
    case "prismaComponents": {
      return <PrismaComponents event={event} />;
    }
    case "prismaValidate": {
      return <PrismaValidate event={event} />;
    }
    case "prismaCorrect": {
      return <PrismaCorrect event={event} />;
    }
    case "prismaComplete": {
      return <PrismaComplete event={event} />;
    }
    case "analyzeComplete":
      return <AnalyzeComplete event={event} />;
    case "interfaceGroups": {
      return <InterfaceGroups event={event} />;
    }
    case "interfaceComplement": {
      return <InterfaceComplement event={event} />;
    }
    case "interfaceComplete": {
      return <InterfaceComplete event={event} />;
    }
    case "prismaInsufficient":
    case "testValidate":
    case "testCorrect":
    case "testComplete":
    case "realizeValidate":
    case "realizeComplete":
    case "realizeAuthorizationValidate":
    case "realizeAuthorizationCorrect":
    case "realizeAuthorizationComplete":
    case "realizeTestReset":
    case "realizeTestComplete":
    case "vendorRequest":
    case "vendorResponse":
      return <div>{event.type}</div>;
    default:
      event satisfies never;
      return <div>Unknown Event</div>;
  }
};

export default AutoBeEventsMovie;
