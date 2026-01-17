import {
  AutoBeDatabase,
  AutoBeOpenApi,
  AutoBeRealizeCollectorMapping,
  AutoBeRealizeCollectorPlan,
  IAutoBeCompiler,
} from "@autobe/interface";
import { AutoBeOpenApiTypeChecker, StringUtil } from "@autobe/utils";
import {
  ILlmApplication,
  ILlmSchema,
  IValidation,
  LlmTypeChecker,
  OpenApiTypeChecker,
} from "@samchon/openapi";
import typia from "typia";
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

  export function getMappingMetadata(props: {
    application: AutoBeDatabase.IApplication;
    model: AutoBeDatabase.IModel;
  }): AutoBeRealizeCollectorMapping.Metadata[] {
    return [
      {
        member: props.model.primaryField.name,
        kind: "scalar",
        nullable: false,
      },
      ...props.model.plainFields.map(
        (pf) =>
          ({
            member: pf.name,
            kind: "scalar",
            nullable: pf.nullable,
          }) satisfies AutoBeRealizeCollectorMapping.Metadata,
      ),
      ...props.model.foreignFields.map(
        (f) =>
          ({
            member: f.relation.name,
            kind: "belongsTo",
            nullable: f.nullable,
          }) satisfies AutoBeRealizeCollectorMapping.Metadata,
      ),
      ...props.application.files
        .map((f) => f.models)
        .flat()
        .map((om) =>
          om.foreignFields
            .filter((fk) => fk.relation.targetModel === props.model.name)
            .map(
              (fk) =>
                ({
                  member: fk.relation.mappingName ?? om.name,
                  kind: fk.unique ? "hasOne" : "hasMany",
                  nullable: null,
                }) satisfies AutoBeRealizeCollectorMapping.Metadata,
            ),
        )
        .flat(),
    ];
  }

  export function writeTemplate(props: {
    plan: AutoBeRealizeCollectorPlan;
    body: AutoBeOpenApi.IJsonSchema;
    model: AutoBeDatabase.IModel;
    application: AutoBeDatabase.IApplication;
  }): string {
    const mappings: string[] = getMappingMetadata(props).map((r) => r.member);
    return StringUtil.trim`
      export namespace ${getName(props.plan.dtoTypeName)} {
        export async function collect(props: {
          body: ${props.plan.dtoTypeName};
          ${
            //references
            props.plan.references
              .map(
                (r) =>
                  `${NamingConvention.camel(r.databaseSchemaName)}: IEntity; // ${r.source}`,
              )
              .join("\n")
          }
          ${
            // ip
            AutoBeOpenApiTypeChecker.isObject(props.body) &&
            props.body.properties.ip !== undefined &&
            props.model.plainFields.some((f) => f.name === "ip")
              ? `ip: string;`
              : ""
          }
          ${
            // sequence
            AutoBeOpenApiTypeChecker.isObject(props.body) &&
            props.body.properties.sequence !== undefined &&
            AutoBeOpenApiTypeChecker.isString(props.body.properties.sequence) &&
            props.model.plainFields.some(
              (f) => f.name === "sequence" && f.type === "int",
            )
              ? `sequence: number;`
              : ""
          }
        }) {
          return {
${mappings.map((r) => `      ${r}: ...,`).join("\n")}
          } satisfies Prisma.${props.plan.databaseSchemaName}CreateInput;
        }
      }
    `;
  }

  export async function writeStructures(
    ctx: AutoBeContext,
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

  export async function replaceImportStatements(
    ctx: AutoBeContext,
    props: {
      dtoTypeName: string;
      schemas: Record<string, AutoBeOpenApi.IJsonSchemaDescriptive>;
      code: string;
    },
  ): Promise<string> {
    const compiler: IAutoBeCompiler = await ctx.compiler();
    let code: string = await compiler.typescript.removeImportStatements(
      props.code,
    );

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
    application: AutoBeDatabase.IApplication;
    plan: AutoBeRealizeCollectorPlan;
    mappings: AutoBeRealizeCollectorMapping[];
    neighbors: AutoBeRealizeCollectorPlan[];
    draft: string;
    revise: {
      review: string;
      final: string | null;
    };
  }): IValidation.IError[] {
    const errors: IValidation.IError[] = [];
    validateMappings({
      application: props.application,
      errors,
      plan: props.plan,
      mappings: props.mappings,
    });
    validateEmptyCode({
      plan: props.plan,
      content: props.draft,
      path: "$input.request.draft",
      errors,
    });
    validateNeighbors({
      plan: props.plan,
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
        plan: props.plan,
        neighbors: props.neighbors,
        content: props.revise.final,
        path: "$input.request.revise.final",
        errors,
      });
    }
    return errors;
  }

  function validateMappings(props: {
    application: AutoBeDatabase.IApplication;
    errors: IValidation.IError[];
    plan: AutoBeRealizeCollectorPlan;
    mappings: AutoBeRealizeCollectorMapping[];
  }): void {
    const model: AutoBeDatabase.IModel = props.application.files
      .map((f) => f.models)
      .flat()
      .find((m) => m.name === props.plan.databaseSchemaName)!;
    const required: AutoBeRealizeCollectorMapping.Metadata[] =
      getMappingMetadata({
        application: props.application,
        model,
      });
    props.mappings.forEach((m, i) => {
      const metadata: AutoBeRealizeCollectorMapping.Metadata | undefined =
        required.find((r) => r.member === m.member);
      if (metadata === undefined)
        props.errors.push({
          path: `$input.request.mappings[${i}].member`,
          value: m.member,
          expected: required.map((r) => JSON.stringify(r)).join(" | "),
          description: StringUtil.trim`
          '${m.member}' is not a valid Prisma member.

          Please provide mapping only for existing Prisma members:

          ${required.map((r) => `- ${r.member}`).join("\n")}
        `,
        });
      else {
        if (metadata.kind !== m.kind)
          props.errors.push({
            path: `$input.request.mappings[${i}].kind`,
            value: m.kind,
            expected: `"${metadata.kind}"`,
            description: StringUtil.trim`
              The mapping kind for Prisma member '${m.member}' is invalid.

              Expected kind is '${metadata.kind}', but received kind is '${m.kind}'.
          `,
          });
        if (metadata.nullable !== m.nullable)
          props.errors.push({
            path: `$input.request.mappings[${i}].nullable`,
            value: m.nullable,
            expected: `${metadata.nullable}`,
            description: StringUtil.trim`
            The mapping nullable for Prisma member '${m.member}' is invalid.

            Expected nullable is '${metadata.nullable}', but received nullable is '${m.nullable}'.
          `,
          });
      }
    });
    for (const r of required) {
      if (props.mappings.some((m) => m.member === r.member)) continue;
      props.errors.push({
        path: "$input.request.mappings[]",
        value: undefined,
        expected: StringUtil.trim`{
            member: "${r.member}";
            kind: "${r.kind}";
            how: string;
          }`,
        description: StringUtil.trim`
            You missed mapping for required Prisma member '${r.member}'.

            Make sure to provide mapping for all required members.
          `,
      });
    }
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
    plan: AutoBeRealizeCollectorPlan;
    neighbors: AutoBeRealizeCollectorPlan[];
    content: string;
    path: string;
    errors: IValidation.IError[];
  }): void {
    const selfName: string = getName(props.plan.dtoTypeName);
    const neighborNames: string[] = getNeighbors(props.content);
    for (const x of neighborNames)
      if (
        x !== selfName &&
        props.neighbors.some((y) => getName(y.dtoTypeName) === x) === false
      )
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

  export const fixApplication = (props: {
    definition: ILlmApplication;
    application: AutoBeDatabase.IApplication;
    model: AutoBeDatabase.IModel;
  }): void => {
    const mapping: ILlmSchema | undefined =
      props.definition.functions[0].parameters.$defs[
        typia.reflect.name<AutoBeRealizeCollectorMapping>()
      ];
    if (mapping === undefined || LlmTypeChecker.isObject(mapping) === false)
      throw new Error(
        "AutoBeRealizeCollectorMapping type is not defined in the function calling schema.",
      );

    const member: ILlmSchema | undefined = mapping.properties.member;
    if (member === undefined || LlmTypeChecker.isString(member) === false)
      throw new Error(
        "AutoBeRealizeCollectorMapping.member is not defined or string type.",
      );

    member.enum = getMappingMetadata(props).map((m) => m.member);
  };
}
