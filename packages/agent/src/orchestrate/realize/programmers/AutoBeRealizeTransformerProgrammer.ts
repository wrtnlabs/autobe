import {
  AutoBeOpenApi,
  AutoBeRealizeTransformerPlan,
  IAutoBeCompiler,
} from "@autobe/interface";
import { StringUtil } from "@autobe/utils";
import { ILlmSchema, IValidation, OpenApiTypeChecker } from "@samchon/openapi";

import { AutoBeContext } from "../../../context/AutoBeContext";

export namespace AutoBeRealizeTransformerProgrammer {
  export function filter(key: string): boolean {
    return (
      key !== "IAuthorizationToken" &&
      key !== "IEntity" &&
      key.startsWith("IPage") === false &&
      key.endsWith(".IRequest") === false &&
      key.endsWith(".ICreate") === false &&
      key.endsWith(".IUpdate") === false &&
      key.endsWith(".IAuthorized") === false &&
      key.endsWith(".IJoin") === false &&
      key.endsWith(".ILogin") === false &&
      key.endsWith(".IRefresh") === false
    );
  }

  export function getName(dtoTypeName: string): string {
    return (
      dtoTypeName
        .split(".")
        .map((s) => (s.startsWith("I") ? s.substring(1) : s))
        .join("At") + "Transformer"
    );
  }

  export function getNeighbors(code: string): string[] {
    const unique: Set<string> = new Set();
    const regex: RegExp = /(\w+Transformer)\.(select|transform)/g;
    while (true) {
      const match: RegExpExecArray | null = regex.exec(code);
      if (match === null) break;
      unique.add(match[1]!);
    }
    return Array.from(unique);
  }

  export function template(plan: AutoBeRealizeTransformerPlan): string {
    return StringUtil.trim`
      export namespace ${getName(plan.dtoTypeName)} {
        export async function transform(input: Payload): Promise<${plan.dtoTypeName}> {
          ...
        }

        export function select() {
          return {
            ...
          } satisfies Prisma.${plan.prismaSchemaName}FindManyArgs;
        }

        export type Payload = Prisma.${plan.prismaSchemaName}GetPayload<ReturnType<typeof select>>;
      }
    `;
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

  export function validate(props: {
    plan: AutoBeRealizeTransformerPlan;
    neighbors: AutoBeRealizeTransformerPlan[];
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
      "",
      ...Array.from(typeReferences).map(
        (ref) =>
          `import { ${ref} } from "@ORGANIZATION/PROJECT-api/lib/structures/${ref}";`,
      ),
      "",
    ];
    return imports;
  }

  function validateEmptyCode(props: {
    plan: AutoBeRealizeTransformerPlan;
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
    neighbors: AutoBeRealizeTransformerPlan[];
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
