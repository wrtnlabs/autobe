import { AutoBeEvent, AutoBeUserMessageHistory } from "@autobe/interface";

import AssistantMessage from "../AutoBeAssistantMessage";
import AutoBeUserMessage from "../AutoBeUserMessage";
import AutoBeStartEvent from "./AutoBeStartEvent";
import ProgressEventsMovie from "./ProgressEventsMovie";
import AnalyzeScenario from "./analyze/AnalyzeScenario";

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

    case "analyzeScenario":
      // case "prismaComponents":
      // case "interfaceGroups":
      // case "testScenario":
      return <AnalyzeScenario event={event} />;
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
    case "interfaceGroups":
    case "interfaceEndpoints":
    case "interfaceOperationsReview":
    case "interfaceOperations":
    case "interfaceAuthorizations":
    case "interfaceSchemas":
    case "interfaceSchemasReview":
    case "interfaceComplement":
    case "interfaceComplete":
    case "prismaComponents":
    case "prismaSchemas":
    case "prismaInsufficient":
    case "prismaReview":
    case "prismaValidate":
    case "prismaCorrect":
    case "prismaComplete":
    case "testScenario":
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
