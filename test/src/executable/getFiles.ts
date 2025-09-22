import { AutoBeAgent } from "@autobe/agent";
import { AutoBeCompiler } from "@autobe/compiler";
import { FileSystemIterator } from "@autobe/filesystem";

import { TestGlobal } from "../TestGlobal";
import { TestHistory } from "../internal/TestHistory";

const main = async () => {
  const histories = await TestHistory.getHistories("bbs", "realize");
  const agent = new AutoBeAgent({
    model: "chatgpt",
    vendor: TestGlobal.getVendorConfig(),
    compiler: (listener) => new AutoBeCompiler(listener),
    histories,
  });
  for (const dbms of ["postgres", "sqlite"] as const)
    await FileSystemIterator.save({
      root: `${TestGlobal.ROOT}/results/compiler.realize.${dbms}`,
      files: {
        ...(await agent.getFiles({
          dbms,
        })),
        "pnpm-workspace.yaml": "",
      },
    });
};
main().catch(console.error);
