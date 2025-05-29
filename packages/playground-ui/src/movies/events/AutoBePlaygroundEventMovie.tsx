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
import { AutoBePlaygroundValidateEventMovie } from "./AutoBePlaygroundValidateEventMovie";

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
    case "testProgress":
    case "realizeProgress":
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
    // VALIDATE EVENTS
    case "testValidate":
    case "realizeValidate":
      return <AutoBePlaygroundValidateEventMovie event={props.event} />;
    // SPECIALIZATIONS
    case "analyzeWriteDocument":
      return <AutoBePlaygroundAnalyzeWriteDocumentMovie event={props.event} />;
    case "analyzeReview":
      return <AutoBePlaygroundAnalyzeReviewMovie event={props.event} />;
    case "prismaValidate":
      return <AutoBePlaygroundPrismaValidateEventMovie event={props.event} />;
    case "prismaCorrect":
      return <AutoBePlaygroundPrismaCorrectEventMovie event={props.event} />;
    default:
      props.event satisfies never;
      throw new Error("Unknown event type"); // unreachable
  }
}
export namespace AutoBePlaygroundEventMovie {
  export interface IProps {
    service: IAutoBeRpcService;
    event: AutoBeEvent;
  }
}
