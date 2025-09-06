import { AutoBeOpenApi } from "@autobe/interface";
import { MapUtil } from "@autobe/utils";
import { OpenApiTypeChecker } from "@samchon/openapi";

export namespace JsonSchemaNamingConvention {
  export const operations = (operations: AutoBeOpenApi.IOperation[]): void => {
    const typeNames: Set<string> = new Set();
    operate(typeNames, operations);
  };

  export const schemas = (
    operations: AutoBeOpenApi.IOperation[],
    ...componentSchemas: Record<string, AutoBeOpenApi.IJsonSchemaDescriptive>[]
  ): void => {
    const typeNames: Set<string> = new Set();
    for (const schemas of componentSchemas)
      for (const key of Object.keys(schemas)) typeNames.add(key);
    const answer = operate(typeNames, operations);

    for (const dict of componentSchemas)
      for (const x of Object.keys(dict)) {
        const y: string = answer(x);
        if (x === y) continue;
        dict[y] = dict[x]!;
        delete dict[x];
      }
    for (const dict of componentSchemas)
      for (const x of Object.values(dict)) {
        OpenApiTypeChecker.visit({
          components: { schemas: dict },
          schema: x,
          closure: (s) => {
            if (OpenApiTypeChecker.isReference(s) === false) return;
            s.$ref = `#/components/schemas/${answer(s.$ref.split("/").pop()!)}`;
          },
        });
      }
  };

  const operate = (
    typeNames: Set<string>,
    operations: AutoBeOpenApi.IOperation[],
  ): ((v: string) => string) => {
    for (const op of operations) {
      if (op.requestBody) typeNames.add(op.requestBody.typeName);
      if (op.responseBody) typeNames.add(op.responseBody.typeName);
    }
    const answer = prepare(typeNames);
    for (const op of operations) {
      if (op.requestBody)
        op.requestBody.typeName = answer(op.requestBody.typeName);
      if (op.responseBody)
        op.responseBody.typeName = answer(op.responseBody.typeName);
    }
    return answer;
  };

  const prepare = (typeNames: Set<string>): ((v: string) => string) => {
    const similar: Map<string, string[]> = new Map();
    const getKey = (v: string) => v.split(".")[0]!.toLowerCase();
    const getValue = (v: string) => v.split(".")[0]!;
    const emplace = (v: string) =>
      MapUtil.take(similar, getKey(v), () => []).push(getValue(v));

    for (const v of typeNames) emplace(v);

    const solution: Map<string, string> = new Map();
    for (const [key, values] of similar) {
      if (values.length === 1) continue;
      const winner: string = values.sort(
        (a, b) => countCapitalLetters(b) - countCapitalLetters(a),
      )[0]!;
      solution.set(key, winner);
    }
    return (v: string) => {
      const key: string = getKey(v);
      if (solution.has(key) === false) return v;
      return [solution.get(key), ...v.split(".").slice(1)].join(".");
    };
  };
}

const countCapitalLetters = (str: string) => (str.match(/[A-Z]/g) || []).length;
