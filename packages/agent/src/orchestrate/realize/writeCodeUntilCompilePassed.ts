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
import { FAILED } from "./structures/IAutoBeReailizeFailedSymbol";
import { IAutoBeRealizeCoderApplication } from "./structures/IAutoBeRealizeCoderApplication";

interface Diagnostic {
  total: IAutoBeTypeScriptCompileResult.IDiagnostic[];
  current: IAutoBeTypeScriptCompileResult.IDiagnostic[];
}

export async function writeCodeUntilCompilePassed<
  Model extends ILlmSchema.Model,
>(
  ctx: AutoBeContext<Model>,
  ops: AutoBeOpenApi.IOperation[],
  retry: number = 3,
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

  const entireCodes: Record<
    string,
    { content: string; result: "failed" | "success" }
  > = {
    "src/providers/jwtDecode.ts": {
      content: await readFile(
        path.join(
          __dirname,
          "../../../../../internals/template/realize/src/providers/jwtDecode.ts",
        ),
        {
          encoding: "utf-8",
        },
      ),
      result: "success",
    },
    "src/MyGlobal.ts": {
      content: await readFile(
        path.join(
          __dirname,
          "../../../../../internals/template/realize/src/MyGlobal.ts",
        ),
        {
          encoding: "utf-8",
        },
      ),
      result: "success",
    },
  };

  let diagnostics: Diagnostic = { current: [], total: [] };

  for (let i = 0; i < retry; i++) {
    const generatedCodes: (
      | {
          type: "success";
          op: AutoBeOpenApi.IOperation;
          result: Pick<
            IAutoBeRealizeCoderApplication.RealizeCoderOutput,
            "filename" | "implementationCode"
          >;
        }
      | {
          type: "failed";
          op: AutoBeOpenApi.IOperation;
          result: FAILED;
        }
    )[] = await Promise.all(
      ops
        .filter((op) => {
          if (diagnostics.current.length === 0) {
            return true;
          }

          return diagnostics.current.some(
            (el) =>
              el.file ===
              `src/providers/${op.method}_${op.path
                .replaceAll("/", "_")
                .replaceAll("-", "_")
                .replaceAll("{", "$")
                .replaceAll("}", "")}.ts`,
          );
        })
        .map(async (op) => {
          const result = await pipe(
            op,
            (op) => orchestrateRealizePlanner(ctx, op),
            (p) => {
              const filename = `src/providers/${p.functionName}.ts` as const;
              const t = diagnostics.total.filter((el) => el.file === filename);

              const d = diagnostics.current.filter(
                (el) => el.file === filename,
              );
              const c = entireCodes[filename]?.content ?? null;

              return orchestrateRealizeCoder(ctx, op, p, c, t, d);
            },
          );

          if (result === FAILED) {
            return {
              type: "failed",
              op,
              result,
            } as const;
          }

          return {
            type: "success",
            op,
            result: result,
          };
        }),
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
