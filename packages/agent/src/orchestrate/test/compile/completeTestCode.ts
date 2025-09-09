import { StringUtil } from "@autobe/utils";
import { ILlmSchema } from "@samchon/openapi";

import { AutoBeContext } from "../../../context/AutoBeContext";
import { IAutoBeTestCorrectApplication } from "../structures/IAutoBeTestCorrectApplication";
import { IAutoBeTestScenarioArtifacts } from "../structures/IAutoBeTestScenarioArtifacts";
import { getTestImportStatements } from "./getTestImportStatements";

export const completeTestCode = async <Model extends ILlmSchema.Model>(
  ctx: AutoBeContext<Model>,
  artifacts: IAutoBeTestScenarioArtifacts,
  code: string,
  think?: IAutoBeTestCorrectApplication.IThinkProps,
  revise?: IAutoBeTestCorrectApplication.IReviseProps,
): Promise<string> => {
  const compiler = await ctx.compiler();
  code = await compiler.typescript.beautify(code);
  code = code
    .split("\r\n")
    .join("\n")
    .split("\n")
    .filter((str) => str.trim().startsWith("import") === false)
    .join("\n");
  return await compiler.typescript.beautify(StringUtil.trim`
    ${getTestImportStatements(artifacts.document)}
    
    ${code}${think ? "\n\n" + getThinking(think) : ""}${revise ? "\n\n" + getRevise(revise) : ""}
  `);
};

const getThinking = (think: IAutoBeTestCorrectApplication.IThinkProps) => {
  return StringUtil.trim`
    /**
    ${think.overall
      .split("\n")
      .map((s) => ` * ${s}`)
      .join("\n")}
     * 
    ${think.analyses.map((a) =>
      [a.diagnostic, a.analysis, a.solution]
        .map(
          (s) =>
            ` * - ${s
              .split("\n")
              .map((l) => ` *   ${l}`)
              .join("\n")}`,
        )
        .join("\n"),
    )}
     */
    const __thinking = {};
    __thinking;
  `;
};

const getRevise = (revise: IAutoBeTestCorrectApplication.IReviseProps) => {
  return StringUtil.trim`
    /**
    ${revise.review
      .split("\n")
      .map((s) => ` * ${s}`)
      .join("\n")}

     * - Rules
    ${revise.rules.map((r) => ` *   - ${r.state ? "O" : "X"} ${r.title}`).join("\n")}
     * - Check List
    ${revise.checkList.map((c) => ` *   - ${c.state ? "O" : "X"} ${c.title}`).join("\n")}
     */
    const __revise = {};
    __revise;
  `;
};
