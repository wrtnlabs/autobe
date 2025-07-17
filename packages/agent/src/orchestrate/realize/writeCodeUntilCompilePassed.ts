import {
  AutoBeOpenApi,
  IAutoBeTypeScriptCompileResult,
} from "@autobe/interface";
import { ILlmSchema } from "@samchon/openapi";
import { readFile } from "fs/promises";
import path from "path";

import { AutoBeContext } from "../../context/AutoBeContext";
import { pipe } from "./RealizePipe";
import { orchestrateRealizeCoder } from "./orchestrateRealizeCoder";
import { orchestrateRealizePlanner } from "./orchestrateRealizePlanner";
import { IAutoBeRealizeCoderApplication } from "./structures/IAutoBeRealizeCoderApplication";
import { IAutoBeRealizeCompile } from "./structures/IAutoBeRealizeCompile";
import { FAILED } from "./structures/IAutoBeRealizeFailedSymbol";

export async function writeCodeUntilCompilePassed<
  Model extends ILlmSchema.Model,
>(
  ctx: AutoBeContext<Model>,
  ops: AutoBeOpenApi.IOperation[],
  retry: number = 5,
): Promise<
  Pick<
    IAutoBeRealizeCoderApplication.RealizeCoderOutput,
    "filename" | "implementationCode"
  >[]
> {
  const files = Object.entries(await ctx.files({ dbms: "postgres" }))
    .filter(([key]) => {
      return key.startsWith("src");
    })
    .reduce(
      (acc, [filename, content]) => Object.assign(acc, { [filename]: content }),
      {},
    );

  const templateFiles = ["src/providers/jwtDecode.ts", "src/MyGlobal.ts"];
  const entireCodes: IAutoBeRealizeCompile.FileContentMap = {
    ...(await loadTemplateFiles(templateFiles)),
  };

  let diagnostics: IAutoBeRealizeCompile.CompileDiagnostics = {
    current: [],
    total: [],
  };

  for (let i = 0; i < retry; i++) {
    const generatedCodes: (
      | IAutoBeRealizeCompile.Success
      | IAutoBeRealizeCompile.Fail
    )[] = await Promise.all(
      ops
        .filter((op) => shouldProcessOperation(op, diagnostics.current))
        .map((op) => process(ctx, op, diagnostics, entireCodes)),
    );

    for (const c of generatedCodes) {
      if (c.type === "success") {
        entireCodes[c.result.filename] = {
          content: c.result.implementationCode,
          result: "success",
        };
      }
    }

    const prisma = ctx.state().prisma?.compiled;
    const nodeModules = prisma?.type === "success" ? prisma.nodeModules : {};
    const compiler = await ctx.compiler();
    const compiled = await compiler.typescript.compile({
      files: {
        ...files,
        ...nodeModules,
        ...Object.entries(entireCodes)
          .map(([filename, { content }]) => {
            return {
              [filename]: content,
            };
          })
          .reduce<Record<string, string>>(
            (acc, cur) => Object.assign(acc, cur),
            {},
          ),
      },
    });

    if (
      compiled.type === "success" &&
      generatedCodes.every((c) => c.type === "success")
    ) {
      break;
    } else if (compiled.type === "failure") {
      diagnostics.current = compiled.diagnostics;
      diagnostics.total = [...diagnostics.total, ...compiled.diagnostics];

      console.log(JSON.stringify(diagnostics, null, 2), i);
    }
  }

  return Object.entries(entireCodes).map(([filename, { content }]) => {
    return {
      filename,
      implementationCode: content,
    };
  });
}

async function loadTemplateFiles(
  templateFiles: string[],
): Promise<Record<string, { content: string; result: "success" }>> {
  const templateBasePath = path.join(
    __dirname,
    "../../../../../internals/template/realize",
  );

  const result: Record<string, { content: string; result: "success" }> = {};

  for (const filePath of templateFiles) {
    result[filePath] = {
      content: await readFile(path.join(templateBasePath, filePath), {
        encoding: "utf-8",
      }),
      result: "success",
    };
  }

  return result;
}

async function process<Model extends ILlmSchema.Model>(
  ctx: AutoBeContext<Model>,
  op: AutoBeOpenApi.IOperation,
  diagnostics: IAutoBeRealizeCompile.CompileDiagnostics,
  entireCodes: IAutoBeRealizeCompile.FileContentMap,
) {
  const result = await pipe(
    op,
    (op) => orchestrateRealizePlanner(ctx, op),
    (p) => {
      const filename = `src/providers/${p.functionName}.ts` as const;
      const t = diagnostics.total.filter((el) => el.file === filename);

      const d = diagnostics.current.filter((el) => el.file === filename);
      const c = entireCodes[filename]?.content ?? null;

      return orchestrateRealizeCoder(ctx, op, p, c, t, d);
    },
  );

  if (result === FAILED) {
    return { type: "failed", op, result } as const;
  }

  return { type: "success", op, result: result } as const;
}

function shouldProcessOperation(
  op: AutoBeOpenApi.IOperation,
  currentDiagnostics: IAutoBeTypeScriptCompileResult.IDiagnostic[],
): boolean {
  if (currentDiagnostics.length === 0) {
    return true;
  }

  const operationFilename = generateProviderFilename(op);

  return currentDiagnostics.some(
    (diagnostic) => diagnostic.file === operationFilename,
  );
}

function generateProviderFilename(op: AutoBeOpenApi.IOperation): string {
  return `src/providers/${op.method}_${op.path
    .replaceAll("/", "_")
    .replaceAll("-", "_")
    .replaceAll("{", "$")
    .replaceAll("}", "")}.ts`;
}
