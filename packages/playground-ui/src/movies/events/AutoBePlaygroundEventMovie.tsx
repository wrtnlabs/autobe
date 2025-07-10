import { AutoBeEvent, IAutoBeRpcService } from "@autobe/interface";

import { AutoBePlaygroundAnalyzeReviewMovie } from "./AutoBePlaygroundAnalyzeReviewMovie";
import { AutoBePlaygroundAnalyzeWriteDocumentMovie } from "./AutoBePlaygroundAnalyzeWriteDocumentMovie";
import { AutoBePlaygroundAssistantMessageEventMovie } from "./AutoBePlaygroundAssistantMessageEventMovie";
import { AutoBePlaygroundCompleteEventMovie } from "./AutoBePlaygroundCompleteEventMovie";
import { AutoBePlaygroundPrismaCorrectEventMovie } from "./AutoBePlaygroundPrismaCorrectEventMovie";
import { AutoBePlaygroundPrismaValidateEventMovie } from "./AutoBePlaygroundPrismaValidateEventMovie";
import { AutoBePlaygroundProgressEventMovie } from "./AutoBePlaygroundProgressEventMovie";
import { AutoBePlaygroundStartEventMovie } from "./AutoBePlaygroundStartEventMovie";
import { AutoBePlaygroundUserMessageEventMovie } from "./AutoBePlaygroundUserMessageEventMovie";

export function AutoBePlaygroundEventMovie(
  props: AutoBePlaygroundEventMovie.IProps,
) {
  switch (props.event.type) {
    // MESSAGES
    case "userMessage":
      return <AutoBePlaygroundUserMessageEventMovie prompt={props.event} />;
    case "assistantMessage":
      return (
        <AutoBePlaygroundAssistantMessageEventMovie prompt={props.event} />
      );
    // START EVENTS
    case "analyzeStart":
    case "prismaStart":
    case "interfaceStart":
    case "testStart":
    case "realizeStart":
      return <AutoBePlaygroundStartEventMovie event={props.event} />;
    // PROGRESS EVENTS
    case "prismaComponents":
    case "prismaSchemas":
    case "interfaceEndpoints":
    case "interfaceOperations":
    case "interfaceComponents":
    case "interfaceComplement":
    case "testWrite":
    case "realizeProgress":
    case "realizeIntegrator":
    case "testScenario":
    case "testCorrect":
    case "testValidate":
    case "realizeValidate":
      return <AutoBePlaygroundProgressEventMovie event={props.event} />;
    // COMPLETE EVENTS
    case "analyzeComplete":
    case "prismaComplete":
    case "interfaceComplete":
    case "testComplete":
    case "realizeComplete":
      return (
        <AutoBePlaygroundCompleteEventMovie
          service={props.service}
          event={props.event}
        />
      );
    // SPECIALIZATIONS
    case "analyzeWrite":
      return <AutoBePlaygroundAnalyzeWriteDocumentMovie event={props.event} />;
    case "analyzeReview":
      return <AutoBePlaygroundAnalyzeReviewMovie event={props.event} />;
    case "prismaValidate":
      return <AutoBePlaygroundPrismaValidateEventMovie event={props.event} />;
    case "prismaCorrect":
      return <AutoBePlaygroundPrismaCorrectEventMovie event={props.event} />;
    default:
      props.event satisfies never;
      return null;
  }
}
export namespace AutoBePlaygroundEventMovie {
  export interface IProps {
    service: IAutoBeRpcService;
    event: AutoBeEvent;
  }
}
