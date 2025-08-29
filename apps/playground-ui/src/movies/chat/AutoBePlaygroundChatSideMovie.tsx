import {
  IAutoBePlaygroundHeader,
  IAutoBeTokenUsageJson,
} from "@autobe/interface";
import { AutoBeListenerState } from "@autobe/ui";
import { Typography } from "@mui/material";
import { ILlmSchema } from "@samchon/openapi";

import { AutoBePlaygroundChatSideHeaderMovie } from "./AutoBePlaygroundChatSideHeaderMovie";
import { AutoBePlaygroundChatSideStateMovie } from "./AutoBePlaygroundChatSideStateMovie";
import { AutoBePlaygroundChatTokenUsageMovie } from "./AutoBePlaygroundChatTokenUsageMovie";

export function AutoBePlaygroundChatSideMovie(
  props: AutoBePlaygroundChatSideMovie.IProps,
) {
  return (
    <div
      style={{
        padding: 25,
      }}
    >
      {props.error !== null ? (
        <>
          <Typography variant="h5" color="error">
            OpenAI Error
          </Typography>
          <hr />
          {props.error.message}
        </>
      ) : null}
      <AutoBePlaygroundChatSideHeaderMovie header={props.header} />
      <br />
      {props.tokenUsage !== null ? (
        <AutoBePlaygroundChatTokenUsageMovie tokenUsage={props.tokenUsage} />
      ) : null}
      <br />
      <AutoBePlaygroundChatSideStateMovie state={props.state} />
    </div>
  );
}
export namespace AutoBePlaygroundChatSideMovie {
  export interface IProps {
    header: IAutoBePlaygroundHeader<ILlmSchema.Model>;
    state: AutoBeListenerState;
    tokenUsage: IAutoBeTokenUsageJson | null;
    error: Error | null;
  }
}
