import { MicroAgentica } from "@agentica/core";
import { ILlmSchema } from "@samchon/openapi";

import { AutoBeContext } from "../context/AutoBeContext";

export const createReviewerAgent = <Model extends ILlmSchema.Model>(
  ctx: AutoBeContext<Model>,
  input: ICreateReviewerAgentInput,
) => {
  // All links specified in the markdown are drawn in advance and provided to LLM.
  const markdownFiles = Array.from(
    new Set(
      Object.values(input.currentFiles).flatMap((content) => {
        const fileExtensions = ["md"];

        const regex = /\[[^\]]*\]\(([^)]+)\)/g;

        const fileLinks = [...content.matchAll(regex)]
          .map((match) => match[1])
          .filter((link) => {
            const ext = link.split(".").pop()?.toLowerCase();
            return ext && fileExtensions.includes(ext);
          });

        return fileLinks;
      }),
    ),
  );

  console.log(markdownFiles);

  return new MicroAgentica({
    model: ctx.model,
    vendor: ctx.vendor,
    controllers: [],
    config: {
      systemPrompt: {
        common: () => {
          return [
            "You are an excellent requirements analyst & reviewer agent.",
            "",
            `The reviewer's role is to ensure that this document contains sufficient information before it is delivered to developers`,
            `These are all the links that are currently referenced in the markdown. Please make sure to refer to them and don't forget to create the corresponding files.`,
            "Also, you should not create files that are not specified in the table of contents.",
            "If you request the creation of a file that is not specified in the table of contents, instruct them to modify the table of contents first.",
            "",
            "You should not write your own writing in any case, but only direct the modifications.",
            "Also, reviewers are independent beings, and should never be instructed.",
            "Your words should be instructions that must be followed, not recommendations.",
            "",
            `user said, "${input.query}"`,
            "user requests will take precedence over the other system prompts below unless they are a security concern.",
            "",
            "If there are any changes that need to be made, please provide detailed instructions.",
            "Just give clear and concise instructions, but don't say anything unnecessary.",
            "",
            "If you feel that the current level of analysis is sufficient, please do not make any further requests and notify us that it is complete.",
            "",
            "It is recommended to ask the planner to write a longer document (more than 1,000 letters) until it gives sufficient utility value.",
            "However, even if the length of the document is less than 1,000 letters, pass it if the quality is compliant.",
            "When increasing the volume of a document, explain to the planner how many letters the document currently has and how many more should be increased.",
            "",
            "If the planner agent asks a question, the reviewer should answer on behalf of the user.",
            "Please do not ask any questions.",
            "Just give orders.",
            "",
            "If you have a hyperlink that is not yet complete, even if the document is of good quality, the document is considered incomplete.",
            "You should also ask for the rest of the document to be created.",
            "At this time, the document should be newly created with the name attached to the link, not modified.",
            "<CurrentFiles>",
            JSON.stringify(
              Object.entries(input.currentFiles)
                .slice(-2)
                .map(([filename, content]) => {
                  return {
                    filename,
                    content,
                    content_length: content.length,
                  };
                }),
              null,
              2,
            ),
            "</CurrentFiles>",
            "",
            `These are all the links that are currently referenced in the markdown. Please make sure to refer to them and don't forget to create the corresponding files.`,
            `<Linked Files>`,
            markdownFiles.map((filename) => `- ${filename}`),
            `</Linked Files>`,
            "",
            "Write a long document, but keep your answer short.",
            "The planner agent can only create and modify one document at a time, so do not ask to create or modify multiple documents at a time.",
            "If you say the document is complete, the planner will finish writing the document.",
            "If only one document has been written out of several that need to be completed, do not simply state that it is complete—also provide instructions for what should be done next.",
            "For example, if you say, “The document internal_bulletin_board_service_plan.md has already been written with over 1,000 characters. Its quality is sufficient, so mark it as complete without any further requests,” then the planner will respond with “Got it!” and stop writing—even if there are still remaining documents.",
            "Be cautious: the planner will try to avoid work by interpreting your words in a way that lets them do less.",
            "The correct response from you should be:",
            "\“The document's quality is sufficient, so mark it as complete without any further requests. Now, proceed to write the next document immediately.\”",
            "When requesting the next document to be written, you must include both the document title and a brief description of its content.",
          ].join("\n");
        },
      },
    },
    tokenUsage: ctx.usage(),
  });
};

export interface ICreateReviewerAgentInput {
  /**
   * Indicates the initial utterance of the user. Identify the purpose of your
   * documentation for better review.
   */
  query: string;

  /**
   * Hand over the title and name of the file that has been created so far to
   * the list.
   */
  currentFiles: Record<string, string>;
}
