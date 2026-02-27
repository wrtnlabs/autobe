import { AutoBeEvent } from "@autobe/interface";

import {
  AutoBeCompleteEventMovie,
  AutoBeCorrectEventMovie,
  AutoBeProgressEventMovie,
  AutoBeScenarioEventMovie,
  AutoBeStartEventMovie,
  AutoBeValidateEventMovie,
  CorrectEventGroup,
  ICorrectEventGroupProps,
  IValidateEventGroupProps,
  ValidateEventGroup,
} from ".";
import { useAutoBeAgent } from "../../context/AutoBeAgentContext";
import { AutoBeAssistantMessageMovie } from "../AutoBeAssistantMessageMovie";
import { AutoBeUserMessageMovie } from "../AutoBeUserMessageMovie";

export interface IAutoBeEventMovieProps<Event extends AutoBeEvent> {
  events: Event[];
  last: boolean;
}

export function AutoBeEventMovie<Event extends AutoBeEvent>(
  props: IAutoBeEventMovieProps<Event>,
) {
  const { service } = useAutoBeAgent();

  if (service === null) {
    console.error("Service is not available");
    return null;
  }
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
    case "databaseStart":
    case "interfaceStart":
    case "testStart":
    case "realizeStart":
    case "realizeTestStart":
    case "realizeAuthorizationStart":
      return <AutoBeStartEventMovie event={back} />;
    // SCENARIO EVENTS
    case "analyzeScenario":
    case "databaseGroup":
    case "databaseGroupReview":
    case "databaseAuthorization":
    case "databaseAuthorizationReview":
    case "interfaceGroup":
    case "realizeTestReset":
      return <AutoBeScenarioEventMovie event={back} />;
    // PROGRESS EVENTS
    case "analyzeWriteModule":
    case "analyzeModuleReview":
    case "analyzeWriteUnit":
    case "analyzeUnitReview":
    case "analyzeWriteSection":
    case "analyzeSectionReview":
    case "interfaceEndpoint":
    case "interfaceEndpointReview":
    case "databaseComponent":
    case "databaseComponentReview":
    case "databaseSchema":
    case "databaseSchemaReview":
    case "interfaceOperation":
    case "interfaceOperationReview":
    case "interfaceAuthorization":
    case "interfaceSchema":
    case "interfaceSchemaCasting":
    case "interfaceSchemaRefine":
    case "interfaceSchemaReview":
    case "interfaceSchemaComplement":
    case "interfaceSchemaRename":
    case "interfacePrerequisite":
    case "testScenario":
    case "testScenarioReview":
    case "testValidate":
    case "testWrite":
    case "realizePlan":
    case "realizeWrite":
    case "realizeAuthorizationWrite":
    case "realizeTestOperation":
    case "realizeValidate":
      return <AutoBeProgressEventMovie event={back} />;
    // VALIDATE EVENTS
    case "databaseValidate":
    case "realizeAuthorizationValidate":
      if (props.events.length === 1) {
        return <AutoBeValidateEventMovie event={back} />;
      }
      return (
        <ValidateEventGroup
          events={props.events as IValidateEventGroupProps["events"]}
          defaultCollapsed={true}
        />
      );
    // COMPLETE EVENTS
    case "analyzeComplete":
    case "databaseComplete":
    case "interfaceComplete":
    case "testComplete":
    case "realizeComplete":
      return (
        <AutoBeCompleteEventMovie getFiles={service.getFiles} event={back} />
      );
    // CORRECT EVENTS
    case "databaseCorrect":
    case "realizeAuthorizationCorrect": {
      if (props.events.length === 1) {
        return <AutoBeCorrectEventMovie event={back} />;
      }
      return (
        <CorrectEventGroup
          events={props.events as ICorrectEventGroupProps["events"]}
          defaultCollapsed={true}
        />
      );
    }
    // DISCARD
    case "imageDescribeStart":
    case "imageDescribeDraft":
    case "imageDescribeComplete":
    case "realizeTestComplete":
    case "realizeAuthorizationComplete":
    case "vendorRequest":
    case "vendorResponse":
    case "vendorTimeout":
    case "jsonParseError":
    case "jsonValidateError":
    case "consentFunctionCall":
    case "preliminary":
    case "analyzeWriteModule":
    case "analyzeModuleReview":
    case "analyzeWriteUnit":
    case "analyzeUnitReview":
    case "analyzeWriteSection":
    case "analyzeSectionReview":
    case "testCorrect":
    case "realizeCorrect":
      return null;
    default:
      back satisfies never;
      return null;
  }
}

export default AutoBeEventMovie;
