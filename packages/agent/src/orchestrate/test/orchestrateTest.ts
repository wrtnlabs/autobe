import { AgenticaAssistantMessageHistory, MicroAgentica } from "@agentica/core";
import {
  AutoBeAssistantMessageHistory,
  AutoBeOpenApi,
  AutoBeTestHistory,
} from "@autobe/interface";
import { AutoBeTestScenarioEvent } from "@autobe/interface/src/events/AutoBeTestScenarioEvent";
import { ILlmSchema } from "@samchon/openapi";
import { v4 } from "uuid";

import { AutoBeContext } from "../../context/AutoBeContext";
import { IAutoBeApplicationProps } from "../../context/IAutoBeApplicationProps";
import { orchestrateTestScenario } from "./orchestrateTestScenario";
import { transformTestHistories } from "./transformTestHistories";

export const orchestrateTest =
  <Model extends ILlmSchema.Model>(ctx: AutoBeContext<Model>) =>
  async (
    props: IAutoBeApplicationProps,
  ): Promise<AutoBeAssistantMessageHistory | AutoBeTestHistory> => {
    props;
    const start: Date = new Date();

    const files = Object.fromEntries(
      Object.entries(ctx.state().interface?.files ?? {}).filter(
        ([filename, _]) => {
          return filename.startsWith("test/features/api/");
        },
      ),
    );

    const operations = ctx.state().interface?.document.operations ?? [];

    if (operations.length === 0) {
      const agentica: MicroAgentica<Model> = new MicroAgentica({
        model: ctx.model,
        vendor: ctx.vendor,
        config: {
          ...(ctx.config ?? {}),
        },
        histories: transformTestHistories(ctx.state()),
        tokenUsage: ctx.usage(),
        controllers: [],
      });

      const histories = await agentica.conversate(
        "Make API endpoints for the given assets.",
      );

      if (histories.at(-1)?.type === "assistantMessage") {
        return {
          ...(histories.at(-1)! as AgenticaAssistantMessageHistory),
          created_at: start.toISOString(),
          completed_at: new Date().toISOString(),
          id: v4(),
        } satisfies AutoBeAssistantMessageHistory;
      } else throw new Error("Failed to generate Test."); // unreachable
    }

    const endpoints: AutoBeOpenApi.IEndpoint[] = operations.map((it) => {
      return {
        method: it.method,
        path: it.path,
      };
    });

    // SCENARIOS
    const scenarios: AutoBeTestScenarioEvent = await orchestrateTestScenario(
      ctx,
      endpoints,
    );

    // Typescript Compiler 사용시
    // Interface Histories에 Test 추가해서 덮어씌워야함.
    // .ts파일만 들어가야함.
    const typescriptFiles = {};
    const compiled = await ctx.compiler.typescript({
      files: typescriptFiles,
    });

    const history: AutoBeTestHistory = {
      type: "test",
      id: v4(),
      completed_at: new Date().toISOString(),
      created_at: start.toISOString(),
      files: typescriptFiles,
      compiled,
      reason: "Step to the test generation referencing the interface",
      step: ctx.state().interface?.step ?? 0,
    };

    ctx.state().test = history;
    ctx.histories().push(history);

    return history;
  };

// 샘플로 쓸만한 asset들 확보해놓기.
