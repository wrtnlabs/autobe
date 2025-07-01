// import { orchestrateTestCorrect } from "@autobe/agent/src/orchestrate/test/orchestrateTestCorrect";
// import { FileSystemIterator } from "@autobe/filesystem";
// import {
//   AutoBeTestScenario,
//   AutoBeTestValidateEvent,
//   AutoBeTestWriteEvent,
// } from "@autobe/interface";
// import { TestValidator } from "@nestia/e2e";
// import fs from "fs";

// import { TestFactory } from "../../../TestFactory";
// import { TestGlobal } from "../../../TestGlobal";
// import { TestProject } from "../../../structures/TestProject";
// import { prepare_agent_test } from "./prepare_agent_test";

// export const validate_agent_test_correct = async (
//   factory: TestFactory,
//   project: TestProject,
// ) => {
//   if (TestGlobal.env.CHATGPT_API_KEY === undefined) return false;

//   // PREPARE ASSETS
//   const { agent } = await prepare_agent_test(factory, project);
//   const scenarios: AutoBeTestScenario[] = JSON.parse(
//     await fs.promises.readFile(
//       `${TestGlobal.ROOT}/assets/histories/${project}.test.scenarios.json`,
//       "utf8",
//     ),
//   );
//   const writes: AutoBeTestWriteEvent[] = JSON.parse(
//     await fs.promises.readFile(
//       `${TestGlobal.ROOT}/assets/histories/${project}.test.writes.json`,
//       "utf8",
//     ),
//   );

//   // CORRECT TEST FUNCTIONS
//   const validates: AutoBeTestValidateEvent[] = [];
//   agent.on("testValidate", (event) => {
//     validates.push(event);
//   });
//   const correct: AutoBeTestValidateEvent[] = await orchestrateTestCorrect(
//     agent.getContext(),
//     writes,
//     scenarios,
//   );

//   // ARCHIVE RESULT
//   await FileSystemIterator.save({
//     root: `${TestGlobal.ROOT}/results/${project}/test/correct`,
//     files: {
//       ...(await agent.getFiles()),
//       "logs/correct.json": JSON.stringify(correct, null, 2),
//       "logs/validates.json": JSON.stringify(validates, null, 2),
//     },
//   });
//   TestValidator.equals("result")(correct.result.type)("success");
//   return correct;
// };
