import { AutoBeOpenApi, IAutoBeCompiler } from "@autobe/interface";
import { ILlmSchema, IValidation, OpenApiTypeChecker } from "@samchon/openapi";

import { AutoBeContext } from "../../../context/AutoBeContext";

export namespace AutoBeRealizeTransformerProgrammer {
  export function getName(dtoTypeName: string): string {
    return (
      dtoTypeName
        .split(".")
        .map((s) => (s.startsWith("I") ? s.substring(1) : s))
        .join("At") + "Transformer"
    );
  }

  export function getNeighbors(code: string): string[] {
    const transformerNames: Set<string> = new Set();
    const regex: RegExp = /(\w+Transformer)\.(select|transform)/g;
    while (true) {
      const match: RegExpExecArray | null = regex.exec(code);
      if (match === null) break;
      transformerNames.add(match[1]!);
    }
    return Array.from(transformerNames);
  }

  export function writeImportStatements(props: {
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
      "",
      ...Array.from(typeReferences).map(
        (ref) =>
          `import { ${ref} } from "@ORGANIZATION/PROJECT-api/lib/structures/${ref}";`,
      ),
    ];
    return imports;
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
    schemas: Record<string, AutoBeOpenApi.IJsonSchemaDescriptive>;
    dtoTypeName: string;
    draft: string;
    revise: {
      review: string;
      final: string | null;
    };
  }): IValidation.IError[] {
    const errors: IValidation.IError[] = [];
    validateEmptyCode({
      dtoTypeName: props.dtoTypeName,
      content: props.draft,
      path: "$input.request.draft",
      errors,
    });
    validateNeighbors({
      schemas: props.schemas,
      dtoTypeName: props.dtoTypeName,
      content: props.draft,
      path: "$input.request.draft",
      errors,
    });
    if (props.revise.final !== null) {
      validateEmptyCode({
        dtoTypeName: props.dtoTypeName,
        content: props.revise.final,
        path: "$input.request.revise.final",
        errors,
      });
      validateNeighbors({
        schemas: props.schemas,
        dtoTypeName: props.dtoTypeName,
        content: props.revise.final,
        path: "$input.request.revise.final",
        errors,
      });
    }
    return errors;
  }

  function validateEmptyCode(props: {
    dtoTypeName: string;
    content: string;
    path: string;
    errors: IValidation.IError[];
  }): void {
    const name: string = getName(props.dtoTypeName);
    if (props.content.includes(`export namespace ${name}`) === false)
      props.errors.push({
        path: props.path,
        expected: `Namespace '${name}' to be present in the code.`,
        value: props.content,
        description: `The generated code does not contain the expected namespace '${name}'.`,
      });
  }

  function validateNeighbors(props: {
    schemas: Record<string, AutoBeOpenApi.IJsonSchemaDescriptive>;
    dtoTypeName: string;
    content: string;
    path: string;
    errors: IValidation.IError[];
  }): void {
    props;
  }
}
