import {
  AutoBeOpenApi,
  AutoBeTestPrepareMapping,
  IAutoBeCompiler,
} from "@autobe/interface";
import { StringUtil } from "@autobe/utils";
import { ILlmSchema, OpenApiTypeChecker } from "@samchon/openapi";
import { IValidation } from "typia";
import { Escaper } from "typia/lib/utils/Escaper";
import { NamingConvention } from "typia/lib/utils/NamingConvention";

import { AutoBeContext } from "../../../context/AutoBeContext";
import { validateEmptyCode } from "../../../utils/validateEmptyCode";
import { AutoBeRealizeCollectorProgrammer } from "../../realize/programmers/AutoBeRealizeCollectorProgrammer";

export namespace AutoBeTestPrepareProgrammer {
  export function getFunctionName(typeName: string): string {
    const snake: string = NamingConvention.snake(
      typeName.split(".")[0]!.slice(1),
    );
    return `prepare_random_${snake}`;
  }

  export function writeTemplateCode(props: {
    typeName: string;
    schema: AutoBeOpenApi.IJsonSchema.IObject;
  }): string {
    return StringUtil.trim`
      export function ${getFunctionName(props.typeName)}(
        input?: DeepPartial<${props.typeName}> | undefined,
      ): ${props.typeName} {
        return {
${Object.keys(props.schema.properties).map(
  (key) =>
    `    ${Escaper.variable(key) ? key : `[${JSON.stringify(key)}]`}: ...,`,
)}
        };
      }
    `;
  }

  export function writeStructures<Model extends ILlmSchema.Model>(
    ctx: AutoBeContext<Model>,
    typeName: string,
  ): Promise<Record<string, string>> {
    return AutoBeRealizeCollectorProgrammer.writeStructures(ctx, typeName);
  }

  export async function replaceImportStatements<Model extends ILlmSchema.Model>(
    ctx: AutoBeContext<Model>,
    props: {
      typeName: string;
      schemas: Record<string, AutoBeOpenApi.IJsonSchemaDescriptive>;
      code: string;
    },
  ): Promise<string> {
    const compiler: IAutoBeCompiler = await ctx.compiler();
    let code: string = props.code;
    code = await compiler.typescript.beautify(code);
    code = code
      .split("\r\n")
      .join("\n")
      .split("\n")
      .filter((str) => str.trim().startsWith("import") === false)
      .join("\n");

    const imports: string[] = writeImportStatements(props);
    code = [...imports, code].join("\n");
    return await compiler.typescript.beautify(code);
  }

  function writeImportStatements(props: {
    typeName: string;
    schemas: Record<string, AutoBeOpenApi.IJsonSchema>;
  }): string[] {
    const typeReferences: Set<string> = new Set();
    const visit = (key: string) =>
      OpenApiTypeChecker.visit({
        schema: {
          $ref: `#/components/schemas/${key}`,
        },
        components: { schemas: props.schemas },
        closure: (next) => {
          if (OpenApiTypeChecker.isReference(next))
            typeReferences.add(next.$ref.split("/").pop()!.split(".")[0]!);
        },
      });
    visit(props.typeName);

    const imports: string[] = [
      `import { ArrayUtil, RandomGenerator } from "@nestia/e2e";`,
      `import { v4 } from "uuid";`,
      "",
      `import { DeepPartial } from "@ORGANIZATION/PROJECT-api/lib/typings/DeepPartial";`,
      `import { IEntity } from "@ORGANIZATION/PROJECT-api/lib/structures/IEntity";`,
      ...Array.from(typeReferences).map(
        (ref) =>
          `import { ${ref} } from "@ORGANIZATION/PROJECT-api/lib/structures/${ref}";`,
      ),
    ];
    return imports;
  }

  export function validate(props: {
    typeName: string;
    schema: AutoBeOpenApi.IJsonSchema.IObject;
    mappings: AutoBeTestPrepareMapping[];
    draft: string;
    revise: {
      final: string | null;
    };
  }): IValidation.IError[] {
    // validate empty code
    const functionName: string = getFunctionName(props.typeName);
    const errors: IValidation.IError[] = validateEmptyCode({
      functionName: functionName,
      draft: props.draft,
      revise: props.revise,
      path: "$input",
    });

    // validate property mapping plans
    const expected: Set<string> = new Set(Object.keys(props.schema.properties));
    const actual: Set<string> = new Set(props.mappings.map((m) => m.property));

    // must be, but non-existing
    for (const e of expected) {
      if (actual.has(e) === true) continue;
      errors.push({
        path: `$input.mappings[]`,
        value: undefined,
        expected: StringUtil.trim`{
          property: ${JSON.stringify(e)},
          how: string;
        }`,
        description: StringUtil.trim`
          You missed mapping for property ${JSON.stringify(e)}.

          Make sure to provide mapping for all properties defined in the schema.
        `,
      });
    }

    // must not be, but existing
    props.mappings.forEach((m, i) => {
      if (expected.has(m.property) === true) return;
      errors.push({
        path: `$input.mappings[${i}].property`,
        value: m.property,
        expected: Array.from(expected)
          .map((s) => JSON.stringify(s))
          .join(" | "),
        description: StringUtil.trim`
          Property ${JSON.stringify(m.property)} does not exist in the schema.

          Actually existing properties are as follows:

          ${Array.from(expected)
            .map((s) => `- ${s}`)
            .join("\n")}
        `,
      });
    });

    return errors;
  }
}
