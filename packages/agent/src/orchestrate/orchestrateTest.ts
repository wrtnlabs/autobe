import { AutoBeTestHistory } from "@autobe/interface";
import { AutoBeReplyHistory } from "@autobe/interface/src/histories/AutoBeReplyHistory";
import { ILlmSchema } from "@samchon/openapi";

import { AutoBeContext } from "../context/AutoBeContext";
import { IAutoBeApplicationProps } from "../context/IAutoBeApplicationProps";

export const orchestrateTest =
  <Model extends ILlmSchema.Model>(ctx: AutoBeContext<Model>) =>
  async (
    props: IAutoBeApplicationProps,
  ): Promise<AutoBeReplyHistory | AutoBeTestHistory> => {
    ctx;
    props;
    return null!;
  };
