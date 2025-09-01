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

export const Title = ({ name }: { name: string }) => {
  return (
    <>
      <h4 style={{ margin: 0 }}>{name}</h4>
      <hr />
    </>
  );
};
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

      <Title name="Agent Information" />
      <AutoBeAgentInformation header={props.header} />
      <br />
      {props.tokenUsage !== null ? (
        <>
          <Title name="Token Usage" />
          <AutoBeTokenUsage tokenUsage={props.tokenUsage} />
        </>
      ) : null}
      <br />
      <Title name="State" />
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
