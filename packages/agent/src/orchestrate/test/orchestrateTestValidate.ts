import { IAgenticaController, MicroAgentica } from "@agentica/core";
import {
  AutoBeTestProgressEvent,
  AutoBeTestValidateEvent,
  IAutoBeTypeScriptCompilerResult,
} from "@autobe/interface";
import { ILlmApplication, ILlmSchema } from "@samchon/openapi";
import { IPointer } from "tstl";
import typia from "typia";

import { AutoBeContext } from "../../context/AutoBeContext";
import { assertSchemaModel } from "../../context/assertSchemaModel";
import { transformTestValidateHistories } from "./transformTestValidateHistories";

export async function orchestrateTestValidate<Model extends ILlmSchema.Model>(
  ctx: AutoBeContext<Model>,
  codes: AutoBeTestProgressEvent[],
  retry: number = 5,
): Promise<AutoBeTestValidateEvent> {
  const codeFiles = Object.fromEntries(
    codes.map((code) => {
      const filename = `test/features/api/${code.filename}`;

      return [filename, code.content];
    }),
  );

  const typescriptFiles = {
    ...ctx.state().interface?.files,
    ...codeFiles,
  };

  const files = Object.keys(typescriptFiles)
    .filter((filename) => {
      return (
        (filename.endsWith(".ts") &&
          !filename.split("/").includes("benchmark")) ||
        filename.endsWith(".json")
      );
    })
    .reduce(
      (obj, key) => {
        obj[key] = typescriptFiles[key];
        return obj;
      },
      {} as Record<string, string>,
    );

  ctx.dispatch({
    type: "testComplete",
    created_at: new Date().toISOString(),
    files,
    step: ctx.state().interface?.step ?? 0,
  });

  return step(ctx, files, retry);
}

/**
 * 파일마다 테스트 코드를 작성하고, 컴파일 오류를 확인한다.
 *
 * @param ctx
 * @param files
 * @returns
 */
async function step<Model extends ILlmSchema.Model>(
  ctx: AutoBeContext<Model>,
  files: Record<string, string>,
  life: number,
): Promise<AutoBeTestValidateEvent> {
  if (life <= 0) throw new Error("Failed to modify test code.");

  const result = await ctx.compiler.typescript({
    files,
  });
  if (result.type === "success") {
    // SUCCESS
    return {
      type: "testValidate",
      created_at: new Date().toISOString(),
      files,
      result,
      step: ctx.state().interface?.step ?? 0,
    };
  }

  ctx.dispatch({
    type: "testValidate",
    created_at: new Date().toISOString(),
    files,
    result,
    step: ctx.state().interface?.step ?? 0,
  });

  // EXCEPTION ERROR
  if (result.type === "exception") {
    throw new Error(result.error as string);
  }

  let completed: number = 0;

  const diagnostics: Record<
    string,
    IAutoBeTypeScriptCompilerResult.IDiagnostic[]
  > = {};

  result.diagnostics.forEach((d) => {
    if (d.file === null) return;

    diagnostics[d.file] = diagnostics[d.file] ?? [];
    diagnostics[d.file].push(d);
  });

  // VALIDATION FAILED
  const validate = await Promise.all(
    Object.entries(diagnostics).map(async ([filename, d]) => {
      const code = files[filename];
      const result = await process(ctx, d, code);

      console.log(
        `${life} - completed for compile: ${++completed} / ${Object.keys(diagnostics).length}`,
      );

      // Return [filename, modified code]
      return [filename, result.content];
    }),
  );

  const newFiles = { ...files, ...Object.fromEntries(validate) };

  return step(ctx, newFiles, life - 1);
}

/**
 * 에러가 발생한 테스트 파일의 코드를 수정한다.
 *
 * @param ctx
 * @returns
 */
async function process<Model extends ILlmSchema.Model>(
  ctx: AutoBeContext<Model>,
  diagnotics: IAutoBeTypeScriptCompilerResult.IDiagnostic[],
  code: string,
): Promise<IModifyTestCodeProps> {
  console.log("filename : ", diagnotics.at(0)?.file);
  console.log("error : ", diagnotics.map((d) => d.messageText).join("\n"));

  const pointer: IPointer<IModifyTestCodeProps | null> = {
    value: null,
  };

  const apiFiles = Object.entries(ctx.state().interface?.files ?? {})
    .filter(([filename]) => {
      return filename.startsWith("src/api/");
    })
    .reduce<Record<string, string>>((acc, [filename, content]) => {
      return Object.assign(acc, { [filename]: content });
    }, {});

  const dtoFiles = Object.entries(ctx.state().interface?.files ?? {})
    .filter(([filename]) => {
      return filename.startsWith("src/api/structures/");
    })
    .reduce<Record<string, string>>((acc, [filename, content]) => {
      return Object.assign(acc, { [filename]: content });
    }, {});

  const agentica = new MicroAgentica({
    model: ctx.model,
    vendor: ctx.vendor,
    config: {
      ...(ctx.config ?? {}),
    },
    histories: transformTestValidateHistories(apiFiles, dtoFiles),
    controllers: [
      createApplication({
        model: ctx.model,
        build: (next) => {
          pointer.value = next;
        },
      }),
    ],
  });

  agentica.on("request", async (event) => {
    if (event.body.tools) event.body.tool_choice = "required";
  });

  await agentica.conversate(
    [
      "Fix the compilation error in the provided code.",
      "",
      "## Original Code",
      "```typescript",
      code,
      "```",
      "",
      diagnotics.map((diagnotic) => {
        if (diagnotic.start === undefined || diagnotic.length === undefined)
          return "";

        return [
          "## Error Information",
          `- Position: Characters ${diagnotic.start} to ${diagnotic.start + diagnotic.length}`,
          `- Error Message: ${diagnotic.messageText}`,
          `- Problematic Code: \`${code.substring(diagnotic.start, diagnotic.start + diagnotic.length)}\``,
          "",
        ].join("\n");
      }),
      "## Instructions",
      "1. Focus on the specific error location and message",
      "2. Provide the corrected TypeScript code",
      "3. Ensure the fix resolves the compilation error",
      "",
      "Return only the fixed code without explanations.",
    ].join("\n"),
  );

  if (pointer.value === null) throw new Error("Failed to modify test code.");

  return pointer.value;
}

function createApplication<Model extends ILlmSchema.Model>(props: {
  model: Model;
  build: (next: IModifyTestCodeProps) => void;
}): IAgenticaController.IClass<Model> {
  assertSchemaModel(props.model);

  const application: ILlmApplication<Model> = collection[
    props.model
  ] as unknown as ILlmApplication<Model>;
  return {
    protocol: "class",
    name: "Modify Test Code",
    application,
    execute: {
      modifyTestCode: (next) => {
        props.build(next);
      },
    } satisfies IApplication,
  };
}

const claude = typia.llm.application<
  IApplication,
  "claude",
  {
    reference: true;
  }
>();
const collection = {
  chatgpt: typia.llm.application<
    IApplication,
    "chatgpt",
    { reference: true }
  >(),
  claude,
  llama: claude,
  deepseek: claude,
  "3.1": claude,
  "3.0": typia.llm.application<IApplication, "3.0">(),
};

interface IApplication {
  modifyTestCode(props: IModifyTestCodeProps): void;
}

interface IModifyTestCodeProps {
  /** Test Code Content */
  content: string;
}
