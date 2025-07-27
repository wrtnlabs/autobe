import { IAgenticaHistoryJson } from "@agentica/core";
import { AutoBeAnalyzeRole } from "@autobe/interface";
import { ILlmSchema } from "@samchon/openapi";
import { v4 } from "uuid";

import { AutoBeSystemPromptConstant } from "../../constants/AutoBeSystemPromptConstant";
import { AutoBeContext } from "../../context/AutoBeContext";
import { IFile } from "./AutoBeAnalyzeFileSystem";

export const transformAnalyzeWriteHistories = <Model extends ILlmSchema.Model>(
  ctx: AutoBeContext<Model>,
  input: {
    /** Total file names */
    totalFiles: Pick<IFile, "filename" | "reason">[];
    targetFile: string;
    roles: AutoBeAnalyzeRole[];
    review: string | null;
  },
): Array<
  IAgenticaHistoryJson.IAssistantMessage | IAgenticaHistoryJson.ISystemMessage
> => {
  return [
    ...(input.review !== null
      ? ([
          {
            id: v4(),
            created_at: new Date().toISOString(),
            type: "assistantMessage",
            text: [
              input.totalFiles.find((el) => el.filename === input.targetFile),
            ].join("\n"),
          },
          {
            id: v4(),
            created_at: new Date().toISOString(),
            type: "assistantMessage",
            text: [
              `You previously wrote a piece of content.`,
              `The following review has been received regarding your writing:`,
              input.review,
              `You must revise your content to reflect the feedback in this review.`,
            ].join(),
          },
        ] as const)
      : []),
    {
      id: v4(),
      created_at: new Date().toISOString(),
      type: "systemMessage",
      text: AutoBeSystemPromptConstant.ANALYZE.replace(
        "{% User Locale %}",
        ctx.config?.locale ?? "en-US",
      ),
    },
    {
      id: v4(),
      created_at: new Date().toISOString(),
      type: "systemMessage",
      text: [
        "# Guidelines",
        "If the user specifies the exact number of pages, please follow it precisely.",
        AutoBeSystemPromptConstant.ANALYZE_GUIDELINE,
      ].join("\n"),
    },
    {
      id: v4(),
      created_at: new Date().toISOString(),
      type: "systemMessage",
      text: [
        `# Instruction`,
        `The names of all the files are as follows: ${input.totalFiles
          .map((f) => f.filename)
          .join(",")}`,
        "Assume that all files are in the same folder. Also, when pointing to the location of a file, go to the relative path.",
        "",
        `The following user roles have been defined for this system:`,
        ...input.roles.map((role) => `- ${role.name}: ${role.description}`),
        "These roles will be used for API authentication and should be considered when creating documentation.",
        "",
        `Document Length Specification:`,
        `- You are responsible for writing ONLY ONE document: ${input.targetFile}`,
        `- Each page should contain approximately 2,000 characters`,
        `- DO NOT write content for other documents - focus only on ${input.targetFile}`,
        "",
        `Among the various documents, the part you decided to take care of is as follows.: ${input.targetFile}`,
        `Only write this document named '${input.targetFile}'.`,
        "Never write other documents.",
        "",
        "# Reason to write this document",
        `- ${input.totalFiles.find((el) => el.filename === input.targetFile)?.reason}`,
      ].join("\n"),
    },
  ];
};
