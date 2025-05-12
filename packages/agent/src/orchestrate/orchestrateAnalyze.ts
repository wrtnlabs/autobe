import { AutoBeAnalyzeHistory } from "@autobe/interface";
import { AutoBeReplyHistory } from "@autobe/interface/src/histories/AutoBeReplyHistory";
import { ILlmSchema } from "@samchon/openapi";

import { AutoBeContext } from "../context/AutoBeContext";
import { IAutoBeApplicationProps } from "../context/IAutoBeApplicationProps";

/**
 * @todo Kakasoo
 */
export const orchestrateAnalyze =
  <Model extends ILlmSchema.Model>(ctx: AutoBeContext<Model>) =>
  async (
    props: IAutoBeApplicationProps,
  ): Promise<AutoBeReplyHistory | AutoBeAnalyzeHistory> => {
    ctx;
    props;
    return null!;
  };
