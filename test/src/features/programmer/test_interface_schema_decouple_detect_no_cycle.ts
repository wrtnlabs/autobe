import { AutoBeInterfaceSchemaDecoupleProgrammer } from "@autobe/agent/src/orchestrate/interface/programmers/AutoBeInterfaceSchemaDecoupleProgrammer";
import {
  AutoBeInterfaceSchemaDecoupleCycle,
  AutoBeOpenApi,
} from "@autobe/interface";
import { TestValidator } from "@nestia/e2e";
import typia from "typia";

interface IParent {
  child: IChild;
}
interface IChild {
  name: string;
}

export const test_interface_schema_decouple_detect_no_cycle = () => {
  const schemas: Record<string, AutoBeOpenApi.IJsonSchema> = typia.json.schemas<
    [IParent, IChild]
  >().components.schemas as Record<string, AutoBeOpenApi.IJsonSchema>;

  const cycles: AutoBeInterfaceSchemaDecoupleCycle[] =
    AutoBeInterfaceSchemaDecoupleProgrammer.detectCycles(schemas);
  TestValidator.equals("no cycles in one-way reference", 0, cycles.length);
};
