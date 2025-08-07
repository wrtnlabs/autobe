import { IAutoBeRpcHeader, IAutoBeTokenUsageJson } from "@autobe/interface";
import { Typography } from "@mui/material";
import { ILlmSchema } from "@samchon/openapi";

import { AutoBePlaygroundChatSideConfigMovie } from "./AutoBePlaygroundChatSideConfigMovie";
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
      <AutoBePlaygroundChatSideConfigMovie header={props.header} />
      <br />
      <br />
      {props.tokenUsage !== null ? (
        <AutoBePlaygroundChatTokenUsageMovie tokenUsage={props.tokenUsage} />
      ) : null}
    </div>
  );
}
export namespace AutoBePlaygroundChatSideMovie {
  export interface IProps {
    header: IAutoBeRpcHeader<ILlmSchema.Model>;
    tokenUsage: IAutoBeTokenUsageJson | null;
    error: Error | null;
  }
}
