import { AutoBeOpenApi } from "@autobe/interface";
import { MapUtil } from "@autobe/utils";
import { OpenApiTypeChecker } from "@samchon/openapi";

export namespace JsonSchemaNamingConvention {
  export const operations = (operations: AutoBeOpenApi.IOperation[]): void => {
    const convention: Convention = new Convention();
    for (const op of operations) {
      if (op.requestBody !== null)
        convention.emplace(op.requestBody.typeName, (v) => {
          if (op.requestBody !== null) op.requestBody.typeName = v;
        });
      if (op.responseBody !== null)
        convention.emplace(op.responseBody.typeName, (v) => {
          if (op.responseBody !== null) op.responseBody.typeName = v;
        });
    }
    convention.execute();
  };

  export const schemas = (
    operations: AutoBeOpenApi.IOperation[],
    ...componentSchemas: Record<string, AutoBeOpenApi.IJsonSchemaDescriptive>[]
  ): void => {
    const convention: Convention = new Convention();
    for (const op of operations) {
      if (op.requestBody !== null)
        convention.emplace(op.requestBody.typeName, (v) => {
          if (op.requestBody !== null) op.requestBody.typeName = v;
        });
      if (op.responseBody !== null)
        convention.emplace(op.responseBody.typeName, (v) => {
          if (op.responseBody !== null) op.responseBody.typeName = v;
        });
    }
    for (const schema of componentSchemas) {
      for (const key of Object.keys(schema)) {
        convention.emplace(key, (v) => {
          if (key === v) return;
          schema[v] = schema[key]!;
          delete schema[key];
        });
        for (const value of Object.values(schema))
          OpenApiTypeChecker.visit({
            components: { schemas: schema },
            schema: value,
            closure: (s) => {
              if (OpenApiTypeChecker.isReference(s) === false) return;
              const key: string = s.$ref.split("/").pop()!;
              convention.emplace(
                key,
                (v) => (s.$ref = `#/components/schemas/${v}`),
              );
            },
          });
      }
      convention.execute();
    }
  };
}

const countCapitalLetters = (str: string) => (str.match(/[A-Z]/g) || []).length;

class Convention {
  private readonly dict: Map<string, Set<string>> = new Map();
  private readonly closures: IClosure[] = [];

  public emplace(key: string, setter: (v: string) => void): void {
    this.closures.push({ value: key, setter });

    const top: string = key.split(".")[0]!;
    MapUtil.take(this.dict, top.toLowerCase(), () => new Set()).add(top);
  }

  public execute(): void {
    const mapping: Map<string, string> = new Map();
    for (const [key, value] of this.dict.entries())
      mapping.set(
        key,
        Array.from(value).sort(
          (a, b) => countCapitalLetters(b) - countCapitalLetters(a),
        )[0]!,
      );
    for (const closure of this.closures) {
      const elements: string[] = closure.value.split(".");
      const value: string = mapping.get(elements[0]!.toLowerCase())!;
      closure.setter([value, ...elements.slice(1)].join("."));
    }
  }
}

interface IClosure {
  value: string;
  setter: (v: string) => void;
}
