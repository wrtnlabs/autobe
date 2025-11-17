import { AutoBeAgent } from "@autobe/agent";
import { AutoBeExampleBenchmark } from "@autobe/benchmark";
import { IAutoBeExampleBenchmarkState } from "@autobe/benchmark/src/structures/IAutoBeExampleBenchmarkState";
import { AutoBeCompiler } from "@autobe/compiler";
import {
  AutoBeProgressEventBase,
  IAutoBeCompilerListener,
} from "@autobe/interface";
import { StringUtil } from "@autobe/utils";
import fs from "fs";
import { Singleton, sleep_for } from "tstl";
import typia from "typia";

import { TestGlobal } from "../TestGlobal";

const elapsedTime = (props: {
  started_at: Date;
  completed_at: Date | null;
}): string =>
  Math.round(
    ((props.completed_at ?? new Date()).getTime() -
      props.started_at.getTime()) /
      1_000,
  ).toLocaleString() + " sec";

const printState = (state: IAutoBeExampleBenchmarkState): void => {
  const writeIndex = (): string =>
    StringUtil.trim`
    ## Table of Contents

    ${state.vendors
      .map(
        (vendor) =>
          `- [Vendor \`${vendor.name}\`](#vendor-${vendor.name
            .replaceAll("/", "")
            .replaceAll(":", "")})`,
      )
      .join("\n")}
  `.trim();
  const writeVendor = (
    vendor: IAutoBeExampleBenchmarkState.IOfVendor,
  ): string =>
    StringUtil.trim`
    ## Vendor \`${vendor.name}\`

    ${vendor.projects.map((p) => writeProject(vendor, p)).join("\n\n")}
  `.trim();
  const writeProject = (
    vendor: IAutoBeExampleBenchmarkState.IOfVendor,
    project: IAutoBeExampleBenchmarkState.IOfProject,
  ): string =>
    StringUtil.trim`
      ### Project \`${project.name}\`

      - Success: ${project.success ?? "in progress"}
      - Elapsed Time: ${elapsedTime(project)}
      ${
        project.success === true
          ? ""
          : project.phases
              .map((ph) => writePhase(vendor, project, ph))
              .join("\n\n")
      }
    `.trim();
  const writePhase = (
    _vendor: IAutoBeExampleBenchmarkState.IOfVendor,
    _project: IAutoBeExampleBenchmarkState.IOfProject,
    phase: IAutoBeExampleBenchmarkState.IOfPhase,
  ): string =>
    StringUtil.trim`
    - phase \`${phase.name}\`
      - Success: ${phase.success ?? "in progress"}
      - Elapsed Time: ${elapsedTime(phase)}
    ${
      phase.completed_at === null && phase.snapshot !== null
        ? `  - Event: \`${phase.snapshot.event.type}\``
        : ""
    }
    ${
      phase.completed_at === null &&
      phase.snapshot !== null &&
      typia.is<AutoBeProgressEventBase>(phase.snapshot.event)
        ? `  - Progress: ${phase.snapshot.event.completed} of ${
            phase.snapshot.event.total
          }`
        : ""
    }
  `.trim();
  const task = async () => {
    while (true) {
      await sleep_for(2_500);
      const content: string = StringUtil.trim`
        ${writeIndex()}

        ${state.vendors.map((v) => writeVendor(v)).join("\n\n")}
      `;
      try {
        await fs.promises.writeFile(
          `${TestGlobal.ROOT}/benchmark.log.md`,
          content,
          "utf8",
        );
      } catch {}
      if (
        state.vendors.every((v) =>
          v.projects.every((p) => p.completed_at !== null),
        )
      )
        break;
    }
  };
  task().catch(() => {});
};

const main = async (): Promise<void> => {
  const compiler = new Singleton(
    (listener: IAutoBeCompilerListener) => new AutoBeCompiler(listener),
  );
  const printer = new Singleton(printState);
  await AutoBeExampleBenchmark.execute(
    {
      createAgent: async (next) =>
        new AutoBeAgent({
          model: TestGlobal.schemaModel,
          vendor: TestGlobal.getVendorConfig(),
          config: {
            locale: "en-US",
            timeout:
              TestGlobal.env.TIMEOUT && TestGlobal.env.TIMEOUT !== "NULL"
                ? Number(TestGlobal.env.TIMEOUT)
                : null,
          },
          compiler: (listener) => compiler.get(listener),
          histories: next.histories,
          tokenUsage: next.tokenUsage,
        }),
    },
    {
      vendors: [
        //----
        // COMMERCIAL MODELS
        //----
        "anthropic/claude-haiku-4.5",
        "anthropic/claude-sonnet-4.5",
        "openai/gpt-4.1-mini",
        "openai/gpt-4.1",
        "openai/gpt-5.1",
        "google/gemini-2.5-pro",
        "x-ai/grok-code-fast-1",

        //----
        // OPEN MODELS
        //----
        "deepseek/deepseek-v3.1-terminus:exacto",
        "meta-llama/llama-4-maverick",
        "meta-llama/llama-4-scout",
        "mistralai/codestral-2508",
        "moonshotai/kimi-k2-0905:exacto",
        "qwen/qwen3-next-80b-a3b-instruct",
        "qwen/qwen3-coder:exacto",
        "z-ai/glm-4.6:exacto",
      ],
      projects: ["todo"],
      progress: (state) => printer.get(state),
    },
  );
};
main().catch(console.error);
