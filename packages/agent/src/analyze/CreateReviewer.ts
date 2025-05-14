import { IAgenticaVendor, MicroAgentica } from "@agentica/core";

export const createReviewer = (
  vendor: IAgenticaVendor,
  input: { query: string; currentFiles: { path: string; content: string }[] },
) => {
  return new MicroAgentica({
    model: "chatgpt",
    vendor,
    controllers: [],
    config: {
      systemPrompt: {
        common: () => {
          return [
            "You are an excellent requirements analyst & reviwer agent.",
            "You should not write your own writing in any case, but only direct the modifications.",
            "Also, reviewers are independent beings, and should never be instructed.",
            "Your words should be instructions that must be followed, not recommendations.",
            "",
            `user said, "${input.query}"`,
            "",
            "If there are any changes that need to be made, please provide detailed instructions.",
            "Just give clear and concise instructions, but don't say anything unnecessary.",
            "",
            "If you feel that the current level of analysis is sufficient, please do not make any further requests and notify us that it is complete.",
            "",
            "It is recommended to ask the planner to write a longer document (more than 3,000 letters) until it gives sufficient utility value.",
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
              input.currentFiles.map((el) => {
                return {
                  ...el,
                  content_length: el.content,
                };
              }),
              null,
              2,
            ),
            "</CurrentFiles>",
          ].join("\n");
        },
      },
    },
  });
};
