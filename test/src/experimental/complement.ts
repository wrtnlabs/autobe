import { IAutoBeInterfaceSchemaComplementApplication } from "@autobe/agent/src/orchestrate/interface/structures/IAutoBeInterfaceSchemaComplementApplication";
import typia from "typia";

const app =
  typia.llm.application<IAutoBeInterfaceSchemaComplementApplication>();
console.log(JSON.stringify(app, null, 2));
