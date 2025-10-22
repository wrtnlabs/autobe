import { AutoBeEvent, AutoBeEventOfSerializable } from "@autobe/interface";
import { TestValidator } from "@nestia/e2e";
import { OpenApi } from "@samchon/openapi";
import typia from "typia";

export const test_typing_event_type_not_plural = (): void => {
  const typeNames: string[] = typia.misc.literals<AutoBeEvent.Type>();
  for (const before of typeNames)
    TestValidator.equals("Event.type", before, normalize(before));

  const oneOf: OpenApi.IJsonSchema | undefined =
    typia.json.schema<AutoBeEventOfSerializable>().components.schemas
      ?.AutoBeEventOfSerializable;
  typia.assertGuard<OpenApi.IJsonSchema.IOneOf>(oneOf);
  for (const schema of oneOf.oneOf) {
    typia.assertGuard<OpenApi.IJsonSchema.IReference>(schema);
    const before: string = schema.$ref.split("/").pop() as string;
    TestValidator.equals(before, before, normalize(before));
  }
};

const normalize = (before: string): string =>
  before
    .split(/(?=[A-Z])/)
    .map((word) => {
      if (word.length > 1 && word.endsWith("s")) return word.slice(0, -1);
      return word;
    })
    .join("");
