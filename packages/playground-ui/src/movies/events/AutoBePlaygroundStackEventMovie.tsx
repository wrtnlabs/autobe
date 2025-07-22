import {
  AutoBeAnalyzeReviewEvent,
  AutoBeAnalyzeWriteEvent,
  AutoBeInterfaceComplementEvent,
  AutoBePrismaCorrectEvent,
  AutoBePrismaInsufficientEvent,
  AutoBePrismaValidateEvent,
  AutoBeRealizeValidateEvent,
  AutoBeTestCorrectEvent,
  AutoBeTestValidateEvent,
} from "@autobe/interface";

export function AutoBePlaygroundStackEventMovie<
  Event extends AutoBePlaygroundStackEventMovie.Supported,
>(props: AutoBePlaygroundStackEventMovie.IProps<Event>) {
  return <>{props.events[0].type}</>;
}
export namespace AutoBePlaygroundStackEventMovie {
  export type Supported =
    | AutoBeAnalyzeWriteEvent
    | AutoBeAnalyzeReviewEvent
    | AutoBePrismaInsufficientEvent
    | AutoBePrismaValidateEvent
    | AutoBePrismaCorrectEvent
    | AutoBeInterfaceComplementEvent
    | AutoBeTestValidateEvent
    | AutoBeTestCorrectEvent
    | AutoBeRealizeValidateEvent;
  export interface IProps<Event extends Supported> {
    events: Event[];
  }
}
