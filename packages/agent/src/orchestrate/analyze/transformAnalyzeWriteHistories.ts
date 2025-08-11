import { IAgenticaHistoryJson } from "@agentica/core";
import { AutoBeAnalyzeRole } from "@autobe/interface";
import { AutoBeAnalyzeFile } from "@autobe/interface/src/histories/contents/AutoBeAnalyzeFile";
import { ILlmSchema } from "@samchon/openapi";
import { v4 } from "uuid";

import { AutoBeSystemPromptConstant } from "../../constants/AutoBeSystemPromptConstant";
import { AutoBeContext } from "../../context/AutoBeContext";

const preparePrompt = (
  template: string,
  locale: string,
  totalFiles: Pick<AutoBeAnalyzeFile, "filename" | "reason">[],
  file: Omit<AutoBeAnalyzeFile, "markdown">,
  roles: AutoBeAnalyzeRole[],
  language?: string,
): string => {
  // Prepare replacements
  const userRoles = roles
    .map((role) => `- ${role.name}: ${role.description}`)
    .join("\n");
  const totalFilesList = totalFiles.map((f) => f.filename).join(",");
  const outline =
    file.outline?.map((item, index) => `${index + 1}. ${item}`).join("\n") ||
    "";
  const keyQuestions = file.keyQuestions?.map((q) => `- ${q}`).join("\n") || "";
  const relatedDocs =
    file.relatedDocuments?.map((doc) => `- ${doc}`).join("\n") || "";
  const constraints = file.constraints?.map((c) => `- ${c}`).join("\n") || "";

  return template
    .replace(/{% User Locale %}/g, locale)
    .replace(/{% Document Language %}/g, language || "")
    .replace(/{% Total Files %}/g, totalFilesList)
    .replace(/{% Current File %}/g, file.filename)
    .replace(/{% User Roles %}/g, userRoles)
    .replace(/{% Document Reason %}/g, file.reason)
    .replace(/{% Document Type %}/g, file.documentType || "")
    .replace(/{% Document Outline %}/g, outline)
    .replace(/{% Document Audience %}/g, file.audience || "")
    .replace(/{% Document Key Questions %}/g, keyQuestions)
    .replace(/{% Document Detail Level %}/g, file.detailLevel || "")
    .replace(/{% Document Related Documents %}/g, relatedDocs)
    .replace(/{% Document Constraints %}/g, constraints);
};

export const transformAnalyzeWriteHistories = <Model extends ILlmSchema.Model>(
  ctx: AutoBeContext<Model>,
  input: {
    /** Total file names */
    totalFiles: Pick<AutoBeAnalyzeFile, "filename" | "reason">[];
    file: Omit<AutoBeAnalyzeFile, "markdown">;
    roles: AutoBeAnalyzeRole[];
    review: string | null;
    language?: string;
  },
): Array<
  IAgenticaHistoryJson.IAssistantMessage | IAgenticaHistoryJson.ISystemMessage
> => {
  const reviewMessages: IAgenticaHistoryJson.IAssistantMessage[] = input.review
    ? [
        {
          id: v4(),
          created_at: new Date().toISOString(),
          type: "assistantMessage",
          text: JSON.stringify(
            input.totalFiles.find((el) => el.filename === input.file.filename),
          ),
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
          ].join("\n"),
        },
      ]
    : [];

  return [
    ...reviewMessages,
    {
      id: v4(),
      created_at: new Date().toISOString(),
      type: "systemMessage",
      text: preparePrompt(
        AutoBeSystemPromptConstant.ANALYZE,
        ctx.locale,
        input.totalFiles,
        input.file,
        input.roles,
        input.language,
      ),
    },
  ];
};
