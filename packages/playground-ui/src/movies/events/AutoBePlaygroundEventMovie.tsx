import { AutoBeEvent } from "@autobe/interface";

import { AutoBePlaygroundAnalyzeReviewMovie } from "./AutoBePlaygroundAnalyzeReviewMovie";
import { AutoBePlaygroundAnalyzeWriteDocumentMovie } from "./AutoBePlaygroundAnalyzeWriteDocumentMovie";
import { AutoBePlaygroundAssistantMessageEventMovie } from "./AutoBePlaygroundAssistantMessageEventMovie";
import { AutoBePlaygroundCompleteEventMovie } from "./AutoBePlaygroundCompleteEventMovie";
import { AutoBePlaygroundProgressEventMovie } from "./AutoBePlaygroundProgressEventMovie";
import { AutoBePlaygroundStartEventMovie } from "./AutoBePlaygroundStartEventMovie";
import { AutoBePlaygroundUserMessageEventMovie } from "./AutoBePlaygroundUserMessageEventMovie";
import { AutoBePlaygroundValidateEventMovie } from "./AutoBePlaygroundValidateEventMovie";

export function AutoBePlaygroundEventMovie(
  props: AutoBePlaygroundEventMovie.IProps,
) {
  switch (props.event.type) {
    case "userMessage":
      return <AutoBePlaygroundUserMessageEventMovie prompt={props.event} />;
    case "assistantMessage":
      return (
        <AutoBePlaygroundAssistantMessageEventMovie prompt={props.event} />
      );
    case "analyzeStart":
    case "prismaStart":
    case "interfaceStart":
    case "testStart":
    case "realizeStart":
      return <AutoBePlaygroundStartEventMovie event={props.event} />;
    case "prismaComponents":
    case "prismaSchemas":
    case "interfaceEndpoints":
    case "interfaceOperations":
    case "interfaceComponents":
    case "testProgress":
    case "realizeProgress":
      return <AutoBePlaygroundProgressEventMovie event={props.event} />;
    case "analyzeWriteDocument":
      return <AutoBePlaygroundAnalyzeWriteDocumentMovie event={props.event} />;
    case "analyzeReview":
      return <AutoBePlaygroundAnalyzeReviewMovie event={props.event} />;
    case "prismaValidate":
    case "testValidate":
    case "realizeValidate":
      return <AutoBePlaygroundValidateEventMovie event={props.event} />;
    case "analyzeComplete":
    case "prismaComplete":
    case "interfaceComplete":
    case "testComplete":
    case "realizeComplete":
      return <AutoBePlaygroundCompleteEventMovie event={props.event} />;
    default:
      props.event satisfies never;
      throw new Error("Unknown event type"); // unreachable
  }
}
export namespace AutoBePlaygroundEventMovie {
  export interface IProps {
    event: AutoBeEvent;
  }
}
