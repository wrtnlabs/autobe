import { AutoBeProgressEventBase } from "@autobe/interface";
import { StringUtil } from "@autobe/utils";
import typia from "typia";

import { IAutoBeExampleBenchmarkState } from "../structures";

export namespace AutoBeExampleDocumentation {
  export const markdown = (state: IAutoBeExampleBenchmarkState): string =>
    StringUtil.trim`
      # AutoBe Example Benchmark Report

      ${markdownIndex(state)}

      ${state.vendors.map(markdownVendor).join("\n\n")}
    `;

  const markdownIndex = (
    state: IAutoBeExampleBenchmarkState,
  ): string => StringUtil.trim`
    ## Table of Contents

    ${state.vendors
      .map(
        (vendor) =>
          `- [\`${vendor.name}\`](#${vendor.name
            .replaceAll("/", "")
            .replaceAll(":", "")})`,
      )
      .join("\n")}
  `;

  const markdownVendor = (
    state: IAutoBeExampleBenchmarkState.IOfVendor,
  ): string => StringUtil.trim`
    ## \`${state.name}\`

    Project | Phase | State | Elapsed Time
    :-------|:------|:------|-------------:
    ${state.projects.map(markdownProject).join("\n")}
  `;

  const markdownProject = (
    state: IAutoBeExampleBenchmarkState.IOfProject,
  ): string => {
    // yellow circle emoji:
    const phase: IAutoBeExampleBenchmarkState.IOfPhase | undefined =
      state.phases.at(-1);
    return [
      state.name,
      !!phase?.name ? `${phase.name} (${phase.trial})` : "-",
      state.completed_at !== null
        ? state.success
          ? "🟢 success"
          : "🔴 failure"
        : phase !== undefined && phase.snapshot !== null
          ? [
              phase.trial !== 1 ? "🟠" : "🟡",
              `\`${phase.snapshot.event.type}\``,
              ...(typia.is<AutoBeProgressEventBase>(phase.snapshot.event)
                ? [
                    `(${phase.snapshot.event.completed} of ${phase.snapshot.event.total})`,
                  ]
                : []),
            ].join(" ")
          : "-",
      state.started_at !== null
        ? elapsedTime({
            started_at: state.started_at,
            completed_at: state.completed_at,
          })
        : "-",
    ].join(" | ");
  };
}

const elapsedTime = (props: {
  started_at: Date;
  completed_at: Date | null;
}): string =>
  Math.round(
    ((props.completed_at ?? new Date()).getTime() -
      props.started_at.getTime()) /
      1_000,
  ).toLocaleString() + " sec";
