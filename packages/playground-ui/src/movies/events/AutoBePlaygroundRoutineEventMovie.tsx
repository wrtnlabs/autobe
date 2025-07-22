import {
  AutoBeInterfaceEndpointsEvent,
  AutoBePrismaComponentsEvent,
  AutoBeRealizeTestResetEvent,
  AutoBeTestScenarioEvent,
} from "@autobe/interface";

export function AutoBePlaygroundRoutineEventMovie(
  props: AutoBePlaygroundRoutineEventMovie.IProps,
) {
  return <></>;
}
export namespace AutoBePlaygroundRoutineEventMovie {
  export interface IProps {
    event:
      | AutoBePrismaComponentsEvent
      | AutoBeInterfaceEndpointsEvent
      | AutoBeTestScenarioEvent
      | AutoBeRealizeTestResetEvent;
  }
}
