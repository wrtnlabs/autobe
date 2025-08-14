import { AutoBeEvent, AutoBeUserMessageHistory } from "@autobe/interface";

import AssistantMessage from "../AutoBeAssistantMessage";
import AutoBeUserMessage from "../AutoBeUserMessage";
import AutoBeStartEvent from "./AutoBeStartEvent";
import ProgressEventsMovie from "./ProgressEventsMovie";
import AnalyzeComplete from "./analyze/AnalyzeComplete";
import AnalyzeScenario from "./analyze/AnalyzeScenario";
import PrismaComponents from "./prisma/PrismaComponents";

interface IAutoBeEventsMovieProps {
  event: AutoBeEvent;
}

const AutoBeEventsMovie = (props: IAutoBeEventsMovieProps) => {
  const { event } = props;
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

    case "analyzeWrite":
    case "analyzeReview":
    case "prismaSchemas":
    case "prismaReview":
    case "interfaceEndpoints":
    case "interfaceOperationsReview":
    case "interfaceSchemas":
    case "interfaceSchemasReview": {
      return <ProgressEventsMovie event={event} />;
    }

    case "analyzeComplete":
      return <AnalyzeComplete event={event} />;
    case "interfaceGroups":
    case "interfaceOperations":
    case "interfaceAuthorization":
    case "interfaceComplement":
    case "interfaceComplete":
    case "prismaInsufficient":
    case "prismaValidate":
    case "prismaCorrect":
    case "prismaComplete":
    case "testScenarios":
    case "testWrite":
    case "testValidate":
    case "testCorrect":
    case "testComplete":
    case "realizeWrite":
    case "realizeCorrect":
    case "realizeValidate":
    case "realizeComplete":
    case "realizeAuthorizationWrite":
    case "realizeAuthorizationValidate":
    case "realizeAuthorizationCorrect":
    case "realizeAuthorizationComplete":
    case "realizeTestReset":
    case "realizeTestOperation":
    case "realizeTestComplete":
      return <div>{event.type}</div>;
    default:
      event satisfies never;
      return <div>Unknown Event</div>;
  }
};

export default AutoBeEventsMovie;
