import {
  AutoBeOpenApi,
  AutoBePrisma,
  AutoBeRealizeCollectorPlan,
  IAutoBeCompiler,
} from "@autobe/interface";
import { AutoBeOpenApiTypeChecker, StringUtil } from "@autobe/utils";
import { ILlmSchema, IValidation, OpenApiTypeChecker } from "@samchon/openapi";
import { NamingConvention } from "typia/lib/utils/NamingConvention";

import { AutoBeContext } from "../../../context/AutoBeContext";

export namespace AutoBeRealizeCollectorProgrammer {
  export function filter(key: string): boolean {
    return key.endsWith(".ICreate");
  }

  export function getName(dtoTypeName: string): string {
    const replaced: string = dtoTypeName.replace(".ICreate", "");
    const entity: string = replaced.startsWith("I")
      ? replaced.substring(1)
      : replaced;
    return `${entity}Collector`;
  }

  export function getNeighbors(code: string): string[] {
    const unique: Set<string> = new Set();
    const regex: RegExp = /(\w+Collector)\.collect/g;
    while (true) {
      const match: RegExpExecArray | null = regex.exec(code);
      if (match === null) break;
      unique.add(match[1]!);
    }
    return Array.from(unique);
  }

  export function writeTemplate(props: {
    plan: AutoBeRealizeCollectorPlan;
    body: AutoBeOpenApi.IJsonSchema;
    model: AutoBePrisma.IModel;
  }): string {
    return StringUtil.trim`
      export namespace ${getName(props.plan.dtoTypeName)} {
        export async function collect(props: {
          body: ${props.plan.dtoTypeName};
          ${props.plan.references
            .map(
              (r) =>
                `${NamingConvention.camel(r.prismaSchemaName)}: IEntity; // ${r.source}`,
            )
            .join("\n")}
          ${
            AutoBeOpenApiTypeChecker.isObject(props.body) &&
            props.body.properties.ip !== undefined &&
            props.model.plainFields.some((f) => f.name === "ip")
              ? `ip: string;`
              : ""
          }
        }) {
          return {
            ...
          } satisfies Prisma.${props.plan.prismaSchemaName}CreateInput;
        }
      }
    `;
  }

  export async function writeStructures<Model extends ILlmSchema.Model>(
    ctx: AutoBeContext<Model>,
    dtoTypeName: string,
  ): Promise<Record<string, string>> {
    const document: AutoBeOpenApi.IDocument = ctx.state().interface!.document;
    const components: AutoBeOpenApi.IComponents = {
      authorizations: [],
      schemas: {},
    };
    OpenApiTypeChecker.visit({
      components: document.components,
      schema: { $ref: `#/components/schemas/${dtoTypeName}` },
      closure: (s) => {
        if (OpenApiTypeChecker.isReference(s)) {
          const key: string = s.$ref.split("/").pop()!;
          components.schemas[key] = document.components.schemas[key];
        }
      },
    });

    const compiler: IAutoBeCompiler = await ctx.compiler();
    const entries: [string, string][] = Object.entries(
      await compiler.interface.write(
        {
          components,
          operations: [],
        },
        [],
      ),
    );
    return Object.fromEntries(
      entries.filter(([key]) => key.startsWith("src/api/structures")),
    );
  }

  export async function replaceImportStatements<Model extends ILlmSchema.Model>(
    ctx: AutoBeContext<Model>,
    props: {
      dtoTypeName: string;
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
    code = [
      ...imports,
      "",
      ...getNeighbors(code).map((trs) => `import { ${trs} } from "./${trs}";`),
      "",
      code,
    ].join("\n");
    return await compiler.typescript.beautify(code);
  }

  function writeImportStatements(props: {
    dtoTypeName: string;
    schemas: Record<string, AutoBeOpenApi.IJsonSchemaDescriptive>;
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
    visit(props.dtoTypeName);

    const imports: string[] = [
      `import { Prisma } from "@prisma/sdk";`,
      `import { ArrayUtil } from "@nestia/e2e";`,
      `import { v4 } from "uuid";`,
      "",
      `import { IEntity } from "@ORGANIZATION/PROJECT-api/lib/structures/IEntity";`,
      ...Array.from(typeReferences).map(
        (ref) =>
          `import { ${ref} } from "@ORGANIZATION/PROJECT-api/lib/structures/${ref}";`,
      ),
      "",
      `import { MyGlobal } from "../MyGlobal";`,
      `import { PasswordUtil } from "../utils/PasswordUtil";`,
    ];
    return imports;
  }

  export function validate(props: {
    plan: AutoBeRealizeCollectorPlan;
    neighbors: AutoBeRealizeCollectorPlan[];
    draft: string;
    revise: {
      review: string;
      final: string | null;
    };
  }): IValidation.IError[] {
    const errors: IValidation.IError[] = [];
    validateEmptyCode({
      plan: props.plan,
      content: props.draft,
      path: "$input.request.draft",
      errors,
    });
    validateNeighbors({
      neighbors: props.neighbors,
      content: props.draft,
      path: "$input.request.draft",
      errors,
    });
    if (props.revise.final !== null) {
      validateEmptyCode({
        plan: props.plan,
        content: props.revise.final,
        path: "$input.request.revise.final",
        errors,
      });
      validateNeighbors({
        neighbors: props.neighbors,
        content: props.revise.final,
        path: "$input.request.revise.final",
        errors,
      });
    }
    return errors;
  }

  function validateEmptyCode(props: {
    plan: AutoBeRealizeCollectorPlan;
    content: string;
    path: string;
    errors: IValidation.IError[];
  }): void {
    const name: string = getName(props.plan.dtoTypeName);
    if (props.content.includes(`export namespace ${name}`) === false)
      props.errors.push({
        path: props.path,
        expected: `Namespace '${name}' to be present in the code.`,
        value: props.content,
        description: `The generated code does not contain the expected namespace '${name}'.`,
      });
  }

  function validateNeighbors(props: {
    neighbors: AutoBeRealizeCollectorPlan[];
    content: string;
    path: string;
    errors: IValidation.IError[];
  }): void {
    const neighborNames: string[] = getNeighbors(props.content);
    for (const x of neighborNames)
      if (props.neighbors.some((y) => getName(y.dtoTypeName) === x) === false)
        props.errors.push({
          path: props.path,
          expected: `Use existing transformer.`,
          value: props.content,
          description: StringUtil.trim`
              You've imported and utilized ${x}, but it does not exist.
  
              Use one of them below, or change to another code:
  
              ${props.neighbors
                .map((y) => `- ${getName(y.dtoTypeName)}`)
                .join("\n")}
            `,
        });
  }
}
