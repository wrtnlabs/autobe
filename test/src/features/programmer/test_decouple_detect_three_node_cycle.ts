import { AutoBeInterfaceSchemaDecoupleProgrammer } from "@autobe/agent/src/orchestrate/interface/programmers/AutoBeInterfaceSchemaDecoupleProgrammer";
import {
  AutoBeInterfaceSchemaDecoupleCycle,
  AutoBeOpenApi,
} from "@autobe/interface";
import { TestValidator } from "@nestia/e2e";
import typia from "typia";

interface IUser {
  team: ITeam;
}
interface ITeam {
  org: IOrganization;
}
interface IOrganization {
  admin: IUser;
}

export const test_decouple_detect_three_node_cycle = () => {
  const schemas: Record<string, AutoBeOpenApi.IJsonSchema> = typia.json.schemas<
    [IUser, ITeam, IOrganization]
  >().components.schemas as Record<string, AutoBeOpenApi.IJsonSchema>;

  const cycles: AutoBeInterfaceSchemaDecoupleCycle[] =
    AutoBeInterfaceSchemaDecoupleProgrammer.detectCycles(schemas);
  TestValidator.equals("one cycle detected", 1, cycles.length);

  const top: AutoBeInterfaceSchemaDecoupleCycle = cycles[0]!;
  TestValidator.equals("types", top.types.slice().sort(), [
    "IOrganization",
    "ITeam",
    "IUser",
  ]);
  TestValidator.equals(
    "edges",
    top.edges.slice().sort((a, b) => a.sourceType.localeCompare(b.sourceType)),
    [
      {
        sourceType: "IOrganization",
        propertyName: "admin",
        targetType: "IUser",
      },
      {
        sourceType: "ITeam",
        propertyName: "org",
        targetType: "IOrganization",
      },
      { sourceType: "IUser", propertyName: "team", targetType: "ITeam" },
    ],
  );
};
