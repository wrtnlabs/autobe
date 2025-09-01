import {
  IAutoBePlaygroundHeader,
  IAutoBeTokenUsageJson,
} from "@autobe/interface";
import {
  AutoBeChatState,
  AutoBeListenerState,
  AutoBeTokenUsage,
} from "@autobe/ui";
import { AutoBeAgentInformation } from "@autobe/ui";
import { Typography } from "@mui/material";
import { ILlmSchema } from "@samchon/openapi";

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

      <h4>Agent Information</h4>
      <hr />
      <AutoBeAgentInformation header={props.header} />
      <br />
      {props.tokenUsage !== null ? (
        <>
          <h4>Token Usage</h4>
          <hr />
          <AutoBeTokenUsage tokenUsage={props.tokenUsage} />
        </>
      ) : null}
      <br />
      <h4>State</h4>
      <hr />
      <AutoBeChatState state={props.state} />
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
