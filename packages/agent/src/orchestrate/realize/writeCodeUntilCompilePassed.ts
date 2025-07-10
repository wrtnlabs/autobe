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

export async function writeCodeUntilCompilePassed<
  Model extends ILlmSchema.Model,
>(
  ctx: AutoBeContext<Model>,
  ops: AutoBeOpenApi.IOperation[],
  retry: number = 3,
): Promise<IAutoBeRealizeCoderApplication.RealizeCoderOutput[]> {
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
          "../../../../../internals/template/src/providers/jwtDecode.ts",
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
          "../../../../../internals/template/src/MyGlobal.ts",
        ),
        {
          encoding: "utf-8",
        },
      ),
      result: "success",
    },
  };

  let diagnostics: IAutoBeTypeScriptCompileResult.IDiagnostic[] = [];

  for (let i = 0; i < retry; i++) {
    const generatedCodes: (
      | {
          type: "success";
          op: AutoBeOpenApi.IOperation;
          result: IAutoBeRealizeCoderApplication.RealizeCoderOutput;
        }
      | {
          type: "failed";
          op: AutoBeOpenApi.IOperation;
          result: FAILED;
        }
    )[] = await Promise.all(
      ops
        .filter((op) => {
          if (diagnostics.length === 0) {
            return true;
          }

          return diagnostics.some(
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
              const d = diagnostics.filter(
                (el) => el.file === `src/providers/${p.functionName}.ts`,
              );

              const c =
                entireCodes[`src/providers/${p.functionName}.ts` as const];
              return orchestrateRealizeCoder(
                ctx,
                op,
                p,
                typeof c === "string" ? c : null,
                d,
              );
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
    const compiled = await ctx.compiler.typescript.compile({
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
      diagnostics = compiled.diagnostics;
    }
  }

  return Object.entries(entireCodes).map(([filename, { content }]) => {
    return {
      filename,
      implementationCode: content,
    };
  });
}
