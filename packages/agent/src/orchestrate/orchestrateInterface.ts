import { AutoBeAnalyzeHistory } from "@autobe/interface";
import { AutoBeReplyHistory } from "@autobe/interface/src/histories/AutoBeReplyHistory";
import { ILlmSchema } from "@samchon/openapi";

import { AutoBeContext } from "../context/AutoBeContext";
import { IAutoBeApplicationProps } from "../context/IAutoBeApplicationProps";
import { IAutoBeApplicationResult } from "../context/IAutoBeApplicationResult";

/**
 * @todo Samchon
 */
export const orchestrateInterface =
  <Model extends ILlmSchema.Model>(ctx: AutoBeContext<Model>) =>
  async (
    props: IAutoBeApplicationProps,
  ): Promise<AutoBeReplyHistory | AutoBeAnalyzeHistory> => {
    ctx;
    props;
    return null!;
  };
