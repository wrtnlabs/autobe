import { AutoBeOpenApi } from "@autobe/interface";
import { AutoBeOpenApiTypeChecker, MapUtil } from "@autobe/utils";
import { singular } from "pluralize";

import { AutoBeJsonSchemaCollection } from "./AutoBeJsonSchemaCollection";

export namespace AutoBeJsonSchemaNamingConvention {
  export const normalize = (props: {
    operations: AutoBeOpenApi.IOperation[];
    collection: AutoBeJsonSchemaCollection;
  }): void => {
    const convention: Convention = new Convention();
    for (const op of props.operations) {
      if (op.requestBody !== null)
        convention.emplace(op.requestBody.typeName, (v) => {
          if (op.requestBody !== null) op.requestBody.typeName = v;
        });
      if (op.responseBody !== null)
        convention.emplace(op.responseBody.typeName, (v) => {
          if (op.responseBody !== null) op.responseBody.typeName = v;
        });
    }
    for (const [key, value] of Object.entries(props.collection.schemas)) {
      convention.emplace(key, (newKey) => {
        if (key === newKey) return;
        props.collection.set(newKey, value);
        props.collection.delete(key);
      });
      AutoBeOpenApiTypeChecker.visit({
        components: {
          schemas: props.collection.schemas,
          authorizations: [],
        },
        schema: value,
        closure: (s) => {
          if (AutoBeOpenApiTypeChecker.isReference(s) === false) return;
          const key: string = s.$ref.split("/").pop()!;
          convention.emplace(
            key,
            (v) => (s.$ref = `#/components/schemas/${v}`),
          );
        },
      });
    }
    convention.execute();
  };
}

const countCapitalLetters = (str: string) => (str.match(/[A-Z]/g) || []).length;

class Convention {
  private readonly dict: Map<string, Set<string>> = new Map();
  private readonly closures: IClosure[] = [];

  public emplace(key: string, setter: (v: string) => void): void {
    const elements: string[] = key.split(".").map(singular);
    this.closures.push({
      value: elements.join("."),
      setter,
    });

    const head: string = elements[0]!;
    MapUtil.take(this.dict, head.toLowerCase(), () => new Set()).add(head);
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
      const head: string = mapping.get(elements[0]!.toLowerCase())!;
      closure.setter([head, ...elements.slice(1)].join("."));
    }
  }
}

interface IClosure {
  value: string;
  setter: (v: string) => void;
}
