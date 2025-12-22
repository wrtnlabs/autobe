import {
  AutoBeOpenApi,
  AutoBeTestPrepareFunction,
  AutoBeTestPrepareMapping,
  AutoBeTestValidateEvent,
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
import { IAutoBeTestPrepareProcedure } from "../structures/IAutoBeTestPrepareProcedure";
import { AutoBeTestFunctionProgrammer } from "./AutoBeTestFunctionProgrammer";

export namespace AutoBeTestPrepareProgrammer {
  /* ----------------------------------------------------------------
    GETTERS
  ---------------------------------------------------------------- */
  export function is(key: string, value: AutoBeOpenApi.IJsonSchema): boolean {
    return (
      key.endsWith(".ICreate") && OpenApiTypeChecker.isObject(value) === true
    );
  }

  export function size(document: AutoBeOpenApi.IDocument): number {
    return Object.entries(document.components.schemas).filter(([key, value]) =>
      AutoBeTestPrepareProgrammer.is(key, value),
    ).length;
  }

  export function getFunctionName(typeName: string): string {
    const snake: string = NamingConvention.snake(
      typeName.split(".")[0]!.slice(1),
    );
    return `prepare_random_${snake}`;
  }

  /* ----------------------------------------------------------------
    WRITERS
  ---------------------------------------------------------------- */
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

  export async function writeStructures<Model extends ILlmSchema.Model>(
    ctx: AutoBeContext<Model>,
    typeName: string,
  ): Promise<Record<string, string>> {
    return {
      ...(await AutoBeRealizeCollectorProgrammer.writeStructures(
        ctx,
        typeName,
      )),
      ...(await (await ctx.compiler()).test.getDefaultTypes()),
    };
  }

  /* ----------------------------------------------------------------
    COMPILERS
  ---------------------------------------------------------------- */
  export async function compile(props: {
    compiler: IAutoBeCompiler;
    document: AutoBeOpenApi.IDocument;
    procedure: IAutoBeTestPrepareProcedure;
    step: number;
  }): Promise<AutoBeTestValidateEvent<AutoBeTestPrepareFunction>> {
    const components: AutoBeOpenApi.IComponents = {
      authorizations: [],
      schemas: {},
    };
    OpenApiTypeChecker.visit({
      components: props.document.components,
      schema: { $ref: `#/components/schemas/${props.procedure.typeName}` },
      closure: (s) => {
        if (OpenApiTypeChecker.isReference(s)) {
          const key: string = s.$ref.split("/").pop()!;
          components.schemas[key] = props.document.components.schemas[key];
        }
      },
    });
    return await AutoBeTestFunctionProgrammer.compile({
      compiler: props.compiler,
      step: props.step,
      document: {
        operations: [],
        components,
      },
      function: props.procedure.function,
      files: {
        [props.procedure.function.location]: props.procedure.function.content,
        ["src/api/functional/index.ts"]:
          "export const NO_SDK_FUNCTION_AT_ALL = 1",
      },
    });
  }

  export async function replaceImportStatements(props: {
    compiler: IAutoBeCompiler;
    typeName: string;
    schemas: Record<string, AutoBeOpenApi.IJsonSchemaDescriptive>;
    content: string;
  }): Promise<string> {
    let code: string = await props.compiler.typescript.removeImportStatements(
      props.content,
    );
    const imports: string[] = writeImportStatements(props);
    code = [...imports, code].join("\n");
    return await props.compiler.typescript.beautify(code);
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
      `import { randint } from "tstl";`,
      `import typia, { tags } from "typia";`,
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

  /* ----------------------------------------------------------------
    VALIDATORS
  ---------------------------------------------------------------- */
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
