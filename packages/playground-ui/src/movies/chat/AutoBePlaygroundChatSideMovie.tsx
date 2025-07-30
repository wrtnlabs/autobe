import { IAutoBeRpcHeader, IAutoBeTokenUsageJson } from "@autobe/interface";
import { Typography } from "@mui/material";
import { ILlmSchema } from "@samchon/openapi";

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
      <Typography variant="h5">Agent Information</Typography>
      <hr />
      <ul>
        <li>AI Model: {props.header.vendor.model}</li>
        <li>Schema Model: {props.header.model}</li>
        <li>Locale: {props.header.locale}</li>
        <li>Timezone: {props.header.timezone}</li>
        <li>Semaphore: {props.header.vendor.semaphore ?? 16}</li>
      </ul>
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
