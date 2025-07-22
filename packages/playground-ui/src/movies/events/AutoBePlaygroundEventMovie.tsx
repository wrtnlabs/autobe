import { AutoBeEvent, IAutoBeRpcService } from "@autobe/interface";

import { AutoBePlaygroundAssistantMessageEventMovie } from "./AutoBePlaygroundAssistantMessageEventMovie";
import { AutoBePlaygroundCompleteEventMovie } from "./AutoBePlaygroundCompleteEventMovie";
import { AutoBePlaygroundProgressEventMovie } from "./AutoBePlaygroundProgressEventMovie";
import { AutoBePlaygroundRoutineEventMovie } from "./AutoBePlaygroundRoutineEventMovie";
import { AutoBePlaygroundStackEventMovie } from "./AutoBePlaygroundStackEventMovie";
import { AutoBePlaygroundStartEventMovie } from "./AutoBePlaygroundStartEventMovie";
import { AutoBePlaygroundUserMessageEventMovie } from "./AutoBePlaygroundUserMessageEventMovie";

export function AutoBePlaygroundEventMovie<Event extends AutoBeEvent>(
  props: AutoBePlaygroundEventMovie.IProps<Event>,
) {
  const last: Event = props.events[props.events.length - 1];
  switch (last.type) {
    case "userMessage":
      return <AutoBePlaygroundUserMessageEventMovie prompt={last} />;
    case "assistantMessage":
      return <AutoBePlaygroundAssistantMessageEventMovie prompt={last} />;
    // START EVENTS
    case "analyzeStart":
    case "prismaStart":
    case "interfaceStart":
    case "testStart":
    case "realizeStart":
    case "realizeTestStart":
      return <AutoBePlaygroundStartEventMovie event={last} />;
    // ROUTINE EVENTS
    case "prismaComponents":
    case "interfaceEndpoints":
    case "testScenario":
    case "realizeTestReset":
      return <AutoBePlaygroundRoutineEventMovie event={last} />;
    // PROGRESS EVENTS
    case "prismaSchemas":
    case "interfaceOperations":
    case "interfaceComponents":
    case "testWrite":
    case "realizeProgress":
    case "realizeTestOperation":
      return <AutoBePlaygroundProgressEventMovie event={last} />;
    // STACKED EVENTS
    case "analyzeWrite":
    case "analyzeReview":
    case "prismaInsufficient":
    case "prismaValidate":
    case "prismaCorrect":
    case "interfaceComplement":
    case "testValidate":
    case "testCorrect":
    case "realizeValidate":
      last satisfies AutoBePlaygroundStackEventMovie.Supported;
      return (
        <AutoBePlaygroundStackEventMovie
          events={props.events as AutoBePlaygroundStackEventMovie.Supported[]}
        />
      );
    // COMPLETE EVENTS
    case "analyzeComplete":
    case "prismaComplete":
    case "interfaceComplete":
    case "testComplete":
    case "realizeComplete":
    case "realizeTestComplete":
      return (
        <AutoBePlaygroundCompleteEventMovie
          service={props.service}
          event={last}
        />
      );
    default:
      last satisfies never;
      return null;
  }
}
export namespace AutoBePlaygroundEventMovie {
  export interface IProps<Event extends AutoBeEvent> {
    service: IAutoBeRpcService;
    events: Event[];
  }
}
