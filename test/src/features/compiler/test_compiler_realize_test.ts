// import { AutoBeCompilerRealizeTemplate } from "@autobe/compiler/src/raw/AutoBeCompilerRealizeTemplate";
// import { FileSystemIterator } from "@autobe/filesystem";
// import {
//   IAutoBeCompiler,
//   IAutoBeRealizeTestOperation,
//   IAutoBeRealizeTestResult,
// } from "@autobe/interface";
// import { StringUtil } from "@autobe/utils";
// import { TestValidator } from "@nestia/e2e";
// import cp from "child_process";
// import fs from "fs";
// import { IPointer } from "tstl";
// import typia from "typia";

// import { TestFactory } from "../../TestFactory";
// import { TestGlobal } from "../../TestGlobal";

// export const test_compiler_realize_test = async (
//   factory: TestFactory,
// ): Promise<void> => {
//   // CLONE DIRECTORY
//   const root: string = `${TestGlobal.ROOT}/results/compiler.realize.test`;
//   if (fs.existsSync(root))
//     await fs.promises.rm(root, {
//       recursive: true,
//       force: true,
//     });
//   if (fs.existsSync(`${TestGlobal.ROOT}/results`) === false)
//     await fs.promises.mkdir(`${TestGlobal.ROOT}/results`);
//   cp.execSync(
//     "git clone https://github.com/samchon/bbs-backend compiler.realize.test",
//     {
//       cwd: `${TestGlobal.ROOT}/results`,
//       stdio: "ignore",
//     },
//   );

//   const operations: IAutoBeRealizeTestOperation[] = [];
//   const reset: IPointer<boolean> = { value: false };
//   const compiler: IAutoBeCompiler = factory.createCompiler({
//     realize: {
//       test: {
//         onOperation: async (o) => {
//           operations.push(o);
//         },
//         onReset: async () => {
//           reset.value = true;
//         },
//       },
//     },
//   });
//   const files: Record<string, string> = Object.fromEntries(
//     Object.entries(
//       await FileSystemIterator.read({
//         root,
//       }),
//     ).map(([key, value]) => [
//       key
//         .replace("BbsBackend.ts", "MyBackend.ts")
//         .replace("BbsConfiguration.ts", "MyConfiguration.ts")
//         .replace("BbsGlobal.ts", "MyGlobal.ts")
//         .replace("BbsSetupWizard.ts", "MySetupWizard.ts"),
//       value
//         .replaceAll("@samchon/bbs", "@ORGANIZATION/PROJECT")
//         .replaceAll("BbsBackend", "MyBackend")
//         .replaceAll("BbsConfiguration", "MyConfiguration")
//         .replaceAll("BbsGlobal", "MyGlobal")
//         .replaceAll("BbsSetupWizard", "MySetupWizard"),
//     ]),
//   );
//   files["pnpm-workspace.yaml"] = "";
//   files[".env.local"] = "BBS_API_PORT = 37000";
//   files["src/MyConfiguration.ts"] = StringUtil.trim`
//     import fs from "fs";
//     import path from "path";

//     import { MyGlobal } from "./MyGlobal";

//     export namespace MyConfiguration {
//       export const API_PORT = () => Number(MyGlobal.env.BBS_API_PORT);
//       export const ROOT = (() => {
//         const split: string[] = __dirname.split(path.sep);
//         return split.at(-1) === "src" && split.at(-2) === "bin"
//           ? path.resolve(__dirname + "/../..")
//           : fs.existsSync(__dirname + "/.env")
//             ? __dirname
//             : path.resolve(__dirname + "/..");
//       })();
//     }
// `;
//   await FileSystemIterator.save({
//     root,
//     files: {
//       ...files,
//       ...AutoBeCompilerRealizeTemplate,
//     },
//   });

//   const result: IAutoBeRealizeTestResult = await compiler.realize.test({
//     files,
//     reset: true,
//     simultaneous: 1,
//   });
//   typia.assert(result);
//   TestValidator.equals("operations.length", !!operations.length, true);
//   TestValidator.equals("reset.value", reset.value, true);
// };
