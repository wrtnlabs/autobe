import {
  AutoBeInterfaceComponentsEvent,
  AutoBeInterfaceOperationsEvent,
  AutoBePrismaSchemasEvent,
  AutoBeRealizeProgressEvent,
  AutoBeRealizeTestOperationEvent,
  AutoBeTestWriteEvent,
} from "@autobe/interface";
import { LinearProgress } from "@mui/material";

export function AutoBePlaygroundProgressEventMovie(
  props: AutoBePlaygroundProgressEventMovie.IProps,
) {
  const state: IState = getState(props.event);
  return (
    <LinearProgress
      variant="determinate"
      value={state.completed / state.total}
    />
  );
}
export namespace AutoBePlaygroundProgressEventMovie {
  export type Supported =
    | AutoBePrismaSchemasEvent
    | AutoBeInterfaceOperationsEvent
    | AutoBeInterfaceComponentsEvent
    | AutoBeTestWriteEvent
    | AutoBeRealizeProgressEvent
    | AutoBeRealizeTestOperationEvent;
  export interface IProps {
    event: Supported;
  }
}

interface IState {
  title: string;
  completed: number;
  total: number;
}

function getState(event: AutoBePlaygroundProgressEventMovie.Supported): IState {
  return {
    title: "",
    completed: event.completed,
    total: event.total,
  };
}
