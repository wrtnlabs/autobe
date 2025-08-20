import { AutoBeEvent, IAutoBeRpcService } from "@autobe/interface";
import {
  AutoBeAssistantMessageMovie,
  AutoBeScenarioEventMovie,
  AutoBeStartEventMovie,
  AutoBeUserMessageMovie,
} from "@autobe/ui";

import { AutoBePlaygroundCompleteEventMovie } from "./AutoBePlaygroundCompleteEventMovie";
import { AutoBePlaygroundProgressEventMovie } from "./AutoBePlaygroundProgressEventMovie";
import { AutoBePlaygroundValidateEventMovie } from "./AutoBePlaygroundValidateEventMovie";

export function AutoBePlaygroundEventMovie<Event extends AutoBeEvent>(
  props: AutoBePlaygroundEventMovie.IProps<Event>,
) {
  const back: Event = props.events[props.events.length - 1]!;
  switch (back.type) {
    case "userMessage":
      return <AutoBeUserMessageMovie message={back.contents} />;
    case "assistantMessage":
      return (
        <AutoBeAssistantMessageMovie
          text={back.text}
          isoTimestamp={back.created_at}
        />
      );
    // START EVENTS
    case "analyzeStart":
    case "prismaStart":
    case "interfaceStart":
    case "testStart":
    case "realizeStart":
    case "realizeTestStart":
    case "realizeAuthorizationStart":
      return <AutoBeStartEventMovie event={back} />;
    // SCENARIO EVENTS
    case "analyzeScenario":
    case "prismaComponents":
    case "interfaceGroups":
    case "realizeTestReset":
      return <AutoBeScenarioEventMovie event={back} />;
    // PROGRESS EVENTS
    case "analyzeWrite":
    case "analyzeReview":
    case "interfaceEndpoints":
    case "prismaSchemas":
    case "prismaReview":
    case "interfaceOperations":
    case "interfaceOperationsReview":
    case "interfaceAuthorization":
    case "interfaceSchemas":
    case "interfaceSchemasReview":
    case "testWrite":
    case "testScenarios":
    case "realizeWrite":
    case "realizeAuthorizationWrite":
    case "realizeTestOperation":
      return (
        <AutoBePlaygroundProgressEventMovie event={back} last={props.last} />
      );
    // VALIDATE EVENTS
    case "prismaInsufficient":
    case "prismaValidate":
    case "interfaceComplement":
    case "testValidate":
    case "realizeValidate":
    case "realizeAuthorizationValidate":
      back satisfies AutoBePlaygroundValidateEventMovie.Supported;
      return (
        <AutoBePlaygroundValidateEventMovie
          events={
            props.events as AutoBePlaygroundValidateEventMovie.Supported[]
          }
          last={props.last}
        />
      );
    // COMPLETE EVENTS
    case "analyzeComplete":
    case "prismaComplete":
    case "interfaceComplete":
    case "testComplete":
    case "realizeComplete":
      return (
        <AutoBePlaygroundCompleteEventMovie
          service={props.service}
          event={back}
        />
      );
    // DISCARD
    case "consentFunctionCall":
    case "prismaCorrect":
    case "testCorrect":
    case "realizeAuthorizationCorrect":
    case "realizeCorrect":
    case "realizeTestComplete":
    case "realizeAuthorizationComplete":
    case "vendorRequest":
    case "vendorResponse":
    case "jsonParseError":
    case "jsonValidateError":
    case "consentFunctionCall":
      return null;
    default:
      back satisfies never;
      return null;
  }
}
export namespace AutoBePlaygroundEventMovie {
  export interface IProps<Event extends AutoBeEvent> {
    service: IAutoBeRpcService;
    events: Event[];
    last: boolean;
  }
}
