import { AutoBeAgent } from "@autobe/agent";
import { AutoBeExampleStorage } from "@autobe/benchmark";
import { AutoBeCompiler } from "@autobe/compiler";
// import { FileSystemIterator } from "@autobe/filesystem";
import { AutoBeHistory, AutoBePhase } from "@autobe/interface";
import { AutoBeExampleProject } from "@autobe/interface";
import { StringUtil } from "@autobe/utils";
// import fs from "fs";
import OpenAI from "openai";
import path from "path";
import typia from "typia";

import { TestGlobal } from "../TestGlobal";

const main = async (): Promise<void> => {
  // if (fs.existsSync(`${TestGlobal.ROOT}/results`) === true)
  //   await fs.promises.rm(`${TestGlobal.ROOT}/results`, {
  //     recursive: true,
  //   });

  type VendorModel =
    | "openai/gpt-4.1"
    | "openai/gpt-4.1-mini"
    | "openai/gpt-5"
    | "openai/gpt-5-mini"
    | "qwen/qwen3-next-80b-a3b-instruct";
  const phaseSequence = [
    "analyze",
    "prisma",
    "interface",
    "test",
    "realize",
  ] as const satisfies AutoBePhase[];

  for (const vendor of typia.misc.literals<VendorModel>())
    for (const project of typia.misc.literals<AutoBeExampleProject>())
      for (const phase of phaseSequence) {
        if (
          (await AutoBeExampleStorage.has({
            project,
            vendor,
            phase,
          })) === false
        )
          continue;

        const histories: AutoBeHistory[] =
          await AutoBeExampleStorage.getHistories({
            project,
            phase,
            vendor,
          });
        const last: AutoBeHistory | undefined = histories.at(-1);
        if (last === undefined) continue;
        else if (
          !(
            (last.type === "prisma" && last.compiled.type === "failure") ||
            (last.type === "interface" && last.missed.length !== 0) ||
            (last.type === "test" && last.compiled.type === "failure") ||
            (last.type === "realize" && last.compiled.type === "failure")
          )
        )
          continue;

        console.log("=======================================================");
        console.log(vendor, project, phase);
        console.log("=======================================================");
        console.log(StringUtil.trim`
          \`\`\`bash
          code results/${AutoBeExampleStorage.slugModel(vendor, false)}/${project}/${phase}
          pnpm run archive --vendor ${vendor} --project ${project} --from ${phase} > archive.${AutoBeExampleStorage.slugModel(vendor, true)}.${project}.log
          \`\`\`
        `);
        console.log("\n");
        if (last.type === "prisma") {
          if (last.compiled.type === "failure")
            console.log(last.compiled.reason);
        } else if (last.type === "interface") console.log(last.missed);
        else if (last.compiled.type === "failure") {
          console.log(last.compiled.diagnostics);
          console.log("\n");
          console.log(
            Array.from(
              new Set(
                last.compiled.diagnostics
                  .map((d) => d.file)
                  .filter((f) => f !== null),
              ),
            ).map((f) =>
              path.resolve(
                `${TestGlobal.ROOT}/results/${vendor}/${project}/${phase}/${f}`,
              ),
            ),
          );
        }
        console.log("-------------------------------------------------------");
        console.log("\n");

        const agent: AutoBeAgent<"chatgpt"> = new AutoBeAgent({
          model: "chatgpt",
          vendor: {
            api: new OpenAI({
              apiKey: "",
            }),
            model: vendor,
          },
          compiler: (listener) => new AutoBeCompiler(listener),
          histories,
        });
        const files: Record<string, string> = await agent.getFiles({
          dbms: "sqlite",
        });
        files;
        // await FileSystemIterator.save({
        //   root: `${TestGlobal.ROOT}/results/${vendor}/${project}/${phase}`,
        //   files: {
        //     ...files,
        //     "pnpm-workspace.yaml": "",
        //   },
        // });
      }
};
main().catch(console.error);
