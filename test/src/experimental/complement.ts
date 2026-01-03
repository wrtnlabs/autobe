import { IAutoBeInterfaceComplementApplication } from "@autobe/agent/src/orchestrate/interface/structures/IAutoBeInterfaceComplementApplication";
import typia from "typia";

const app = typia.llm.application<IAutoBeInterfaceComplementApplication>();
console.log(JSON.stringify(app, null, 2));
