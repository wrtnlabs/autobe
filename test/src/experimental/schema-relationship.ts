import { AutoBeAgent } from "@autobe/agent";
import { orchestrateInterfaceSchemas } from "@autobe/agent/src/orchestrate/interface/orchestrateInterfaceSchemas";
import { orchestrateInterfaceSchemasReview } from "@autobe/agent/src/orchestrate/interface/orchestrateInterfaceSchemasReview";
import { AutoBeCompiler } from "@autobe/compiler";
import { AutoBeHistory } from "@autobe/interface";

import { TestGlobal } from "../TestGlobal";
import { TestHistory } from "../internal/TestHistory";

const main = async (): Promise<void> => {
  const histories: AutoBeHistory[] = await TestHistory.getHistories(
    "bbs",
    "interface",
  );
  const agent = new AutoBeAgent({
    model: TestGlobal.schemaModel,
    vendor: TestGlobal.getVendorConfig(),
    config: {
      locale: "en-US",
      timeout:
        TestGlobal.env.TIMEOUT && TestGlobal.env.TIMEOUT !== "NULL"
          ? Number(TestGlobal.env.TIMEOUT)
          : null,
    },
    compiler: (listener) => new AutoBeCompiler(listener),
    histories,
  });
  const { document } = histories.find((h) => h.type === "interface")!;
  const operation = document.operations.find(
    (op) => op.responseBody?.typeName === "IDiscussionBoardArticle",
  )!;

  const schemas = await orchestrateInterfaceSchemas(agent.getContext(), {
    operations: [operation],
    instruction: "",
  });
  Object.assign(
    schemas,
    await orchestrateInterfaceSchemasReview(
      agent.getContext(),
      [operation],
      schemas,
    ),
  );

  console.log(JSON.stringify(schemas.IDiscussionBoardArticle, null, 2));
  console.log("------------------------------------------------------");
  console.log(JSON.stringify(schemas, null, 2));
};
main().catch(console.error);
