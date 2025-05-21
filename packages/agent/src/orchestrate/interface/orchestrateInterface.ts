import {
  AutoBeAssistantMessageHistory,
  AutoBeInterfaceHistory,
  AutoBeOpenApi,
} from "@autobe/interface";
import { ILlmSchema } from "@samchon/openapi";
import { v4 } from "uuid";

import { AutoBeContext } from "../../context/AutoBeContext";
import { IAutoBeApplicationProps } from "../../context/IAutoBeApplicationProps";
import { orchestrateInterfaceComponents } from "./orchestrateInterfaceComponents";
import { orchestrateInterfaceEndpoints } from "./orchestrateInterfaceEndpoints";
import { orchestrateInterfaceOperations } from "./orchestrateInterfaceOperations";

export const orchestrateInterface =
  <Model extends ILlmSchema.Model>(ctx: AutoBeContext<Model>) =>
  async (
    props: IAutoBeApplicationProps,
  ): Promise<AutoBeAssistantMessageHistory | AutoBeInterfaceHistory> => {
    const start: Date = new Date();
    const endpoints: AutoBeOpenApi.IEndpoint[] =
      await orchestrateInterfaceEndpoints(ctx);
    const operations: AutoBeOpenApi.IOperation[] =
      await orchestrateInterfaceOperations(ctx, endpoints);
    const components: AutoBeOpenApi.IComponents =
      await orchestrateInterfaceComponents(ctx, operations);

    const document: AutoBeOpenApi.IDocument = {
      operations,
      components,
    };
    return {
      type: "interface",
      id: v4(),
      document,
      files: await ctx.compiler.interface(document),
      reason: props.reason,
      step: ctx.state().analyze?.step ?? 0,
      started_at: start.toISOString(),
      completed_at: new Date().toISOString(),
    };
  };
