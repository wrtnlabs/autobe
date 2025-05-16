// import { AutoBeAgent, factory, orchestrate } from "@autobe/agent";
// import { AutoBeState } from "@autobe/agent/src/context/AutoBeState";
// import { AutoBeCompiler } from "@autobe/compiler";
// import {
//   AutoBeAnalyzeHistory,
//   AutoBeAssistantMessageHistory,
//   AutoBeInterfaceHistory,
//   AutoBePrismaHistory,
//   IAutoBePrismaCompilerResult,
// } from "@autobe/interface";
// import fs from "fs";
// import OpenAI from "openai";
// import { v4 } from "uuid";

// import { TestGlobal } from "../../TestGlobal";
// import { TestRepositoryUtil } from "../../utils/TestRepositoryUtil";

// export const test_interface_shopping = async () => {
//   if (TestGlobal.env.CHATGPT_API_KEY === undefined) return false;

//   // PREPARE ASSETS
//   const analyzeFiles: Record<string, string> = {
//     "index.md": await fs.promises.readFile(
//       `${TestGlobal.ROOT}/assets/shopping/docs/requirements/index.md`,
//       "utf8",
//     ),
//   };
//   const prismaFiles: Record<string, string> = await TestRepositoryUtil.prisma(
//     "samchon",
//     "shopping-backend",
//   );

//   // COMPILER PRISMA
//   const compiler: AutoBeCompiler = new AutoBeCompiler();
//   const agent: AutoBeAgent<"chatgpt"> = new AutoBeAgent({
//     model: "chatgpt",
//     vendor: {
//       api: new OpenAI({
//         apiKey: TestGlobal.env.CHATGPT_API_KEY,
//       }),
//       model: "gpt-4.1",
//     },
//     compiler,
//   });
//   const prisma: IAutoBePrismaCompilerResult = await compiler.prisma({
//     files: prismaFiles,
//   });
//   if (prisma.type !== "success")
//     throw new Error("Failed to pass prisma generate");

//   // GENERATE INTERFACE
//   const result: AutoBeInterfaceHistory | AutoBeAssistantMessageHistory =
//     await orchestrate.interface({
//       ...agent.getContext(),
//       state: () =>
//         ({
//           analyze: {
//             ...createHistoryProperties(),
//             type: "analyze",
//             reason: "User requested to analyze the requirements",
//             description: "Analysis report about overall e-commerce system",
//             files: analyzeFiles,
//           } satisfies AutoBeAnalyzeHistory,
//           prisma: {
//             ...createHistoryProperties(),
//             type: "prisma",
//             reason:
//               "Step to the DB schema generation referencing the analysis report",
//             description: "DB schema about overall e-commerce system",
//             result: {
//               type: "success",
//               files: prisma.files,
//               document: prisma.document,
//               diagrams: prisma.diagrams,
//             },
//           } satisfies AutoBePrismaHistory,
//           interface: null,
//           test: null,
//           realize: null,
//         }) satisfies AutoBeState,
//     })({
//       reason: "Step to the interface designing after DB schema generation",
//     });

//   // REPORT RESULT
//   try {
//     await fs.promises.mkdir(`${TestGlobal.ROOT}/results/shopping/interface/`, {
//       recursive: true,
//     });
//   } catch {}
//   await fs.promises.writeFile(
//     `${TestGlobal.ROOT}/results/shopping/interface/result.json`,
//     JSON.stringify(result, null, 2),
//     "utf8",
//   );
//   if (result.type === "interface")
//     await fs.promises.writeFile(
//       `${TestGlobal.ROOT}/results/shopping/interface/swagger.json`,
//       JSON.stringify(factory.createOpenApiDocument(result.document), null, 2),
//       "utf8",
//     );
// };

// const createHistoryProperties = () => ({
//   id: v4(),
//   started_at: new Date().toISOString(),
//   completed_at: new Date().toISOString(),
//   step: 1,
// });
