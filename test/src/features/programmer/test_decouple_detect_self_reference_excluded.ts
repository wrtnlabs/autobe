import { AutoBeInterfaceSchemaDecoupleProgrammer } from "@autobe/agent/src/orchestrate/interface/programmers/AutoBeInterfaceSchemaDecoupleProgrammer";
import {
  AutoBeInterfaceSchemaDecoupleCycle,
  AutoBeOpenApi,
} from "@autobe/interface";
import { TestValidator } from "@nestia/e2e";
import typia from "typia";

interface ICategory {
  children: ICategory[];
  name: string;
}

export const test_decouple_detect_self_reference_excluded = () => {
  const schemas: Record<string, AutoBeOpenApi.IJsonSchema> = typia.json.schemas<
    [ICategory]
  >().components.schemas as Record<string, AutoBeOpenApi.IJsonSchema>;

  const cycles: AutoBeInterfaceSchemaDecoupleCycle[] =
    AutoBeInterfaceSchemaDecoupleProgrammer.detectCycles(schemas);
  TestValidator.equals("self-reference is not a cycle", 0, cycles.length);
};
