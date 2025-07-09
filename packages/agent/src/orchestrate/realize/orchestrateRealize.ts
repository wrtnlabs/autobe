import {
  AutoBeAssistantMessageHistory,
  AutoBeOpenApi,
  AutoBeRealizeHistory,
  IAutoBeTypeScriptCompileResult,
} from "@autobe/interface";
import { ILlmSchema } from "@samchon/openapi";
import { readFile } from "node:fs/promises";
import path from "node:path";
import { v4 } from "uuid";

import { AutoBeContext } from "../../context/AutoBeContext";
import { IAutoBeApplicationProps } from "../../context/IAutoBeApplicationProps";
import { orchestrateRealizeCoder } from "./orchestrateRealizeCoder";
import { orchestrateRealizeIntegrator } from "./orchestrateRealizeIntegrator";
import { orchestrateRealizePlanner } from "./orchestrateRealizePlanner";
import {
  RealizeValidatorOutput,
  orchestrateRealizeValidator,
} from "./orchestrateRealizeValidator";
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
    console.log(`${i + 1}번째 시도`);

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

export const orchestrateRealize =
  <Model extends ILlmSchema.Model>(ctx: AutoBeContext<Model>) =>
  async (
    props: IAutoBeApplicationProps,
  ): Promise<AutoBeAssistantMessageHistory | AutoBeRealizeHistory> => {
    props;

    const ops = ctx.state().interface?.document.operations;
    if (!ops) {
      throw new Error("Can't do realize agent beacuse operations are nothing.");
    }

    const codes = await writeCodeUntilCompilePassed(ctx, ops, 3);
    const vaildates: (RealizeValidatorOutput | FAILED)[] = await Promise.all(
      codes.map(async (c) =>
        pipe(
          c,
          (c) => orchestrateRealizeIntegrator(ctx, c),
          (i) => orchestrateRealizeValidator(ctx, i),
        ),
      ),
    );

    if (vaildates.length) {
      if (vaildates.every((v) => v !== FAILED)) {
        const files = {
          ...ctx.state().interface?.files,
          ...vaildates
            .map((v) => ({ [v.location]: v.content }))
            .reduce((acc, cur) => Object.assign(acc, cur), {}),
        };

        const compiled = await ctx.compiler.typescript.compile({ files });

        const now = new Date().toISOString();
        ctx.dispatch({
          type: "realizeComplete",
          compiled: compiled,
          created_at: now,
          files: files,
          step: ctx.state().analyze?.step ?? 0,
        });

        return {
          id: v4(),
          type: "realize",
          completed_at: now,
          created_at: now,
          compiled,
          files,
          reason: props.reason,
          step: ctx.state().analyze?.step ?? 0,
        } satisfies AutoBeRealizeHistory;
      } else {
        const total = codes.length;
        const failedCount = codes.length;
        const successCount = total - failedCount;

        const now = new Date().toISOString();
        ctx.dispatch({
          type: "assistantMessage",
          text: [
            `Out of ${total} code blocks, ${successCount} succeeded, but ${failedCount} failed.`,
            `The process has been stopped due to the failure. Please review the failed steps and try again.`,
          ].join("\n"),
          created_at: now,
        });

        return {
          id: v4(),
          type: "assistantMessage",
          completed_at: now,
          created_at: now,
          text: [
            `Out of ${total} code blocks, ${successCount} succeeded, but ${failedCount} failed.`,
            `The process has been stopped due to the failure. Please review the failed steps and try again.`,
          ].join("\n"),
        } satisfies AutoBeAssistantMessageHistory;
      }
    }

    const now = new Date().toISOString();
    ctx.dispatch({
      type: "assistantMessage",
      text: "Any codes can not be generated.",
      created_at: now,
    });

    return {
      id: v4(),
      type: "assistantMessage",
      completed_at: now,
      created_at: now,
      text: "Any codes can not be generated.",
    } satisfies AutoBeAssistantMessageHistory;
  };

export function pipe<A, B>(
  a: A,
  ab: (a: A) => Promise<B | FAILED>,
): Promise<B | FAILED>;

export function pipe<A, B, C>(
  a: A,
  ab: (a: A) => Promise<B | FAILED>,
  bc: (b: B) => Promise<C | FAILED>,
): Promise<C | FAILED>;

export function pipe<A, B, C, D>(
  a: A,
  ab: (a: A) => Promise<B | FAILED>,
  bc: (b: B) => Promise<C | FAILED>,
  cd: (c: C) => Promise<D | FAILED>,
): Promise<D | FAILED>;

export function pipe<A, B, C, D, E>(
  a: A,
  ab: (a: A) => Promise<B | FAILED>,
  bc: (b: B) => Promise<C | FAILED>,
  cd: (c: C) => Promise<D | FAILED>,
  de: (d: D) => Promise<E | FAILED>,
): Promise<E | FAILED>;

export function pipe(
  a: any,
  ...fns: Array<(arg: any) => Promise<any>>
): Promise<any> {
  return fns.reduce((prev, fn) => {
    return prev.then((result) => {
      if (result === FAILED) return FAILED;
      return fn(result);
    });
  }, Promise.resolve(a));
}
