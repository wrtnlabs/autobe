import { ILlmSchema } from "@samchon/openapi";

import { AutoBeContext } from "../context/AutoBeContext";
import { IAutoBeApplicationProps } from "../context/IAutoBeApplicationProps";
import { IAutoBeApplicationResult } from "../context/IAutoBeApplicationResult";

/**
 * @todo Michael
 */
export const orchestratePrisma =
  <Model extends ILlmSchema.Model>(ctx: AutoBeContext<Model>) =>
  async (props: IAutoBeApplicationProps): Promise<IAutoBeApplicationResult> => {
    ctx;
    props;
    return null!;
  };
