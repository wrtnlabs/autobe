import {
  AutoBeOpenApi,
  AutoBeRealizeAuthorization,
  AutoBeRealizeFunction,
  IAutoBeTypeScriptCompileResult,
} from "@autobe/interface";
import { ILlmSchema } from "@samchon/openapi";
import { HashMap } from "tstl";

import { AutoBeContext } from "../../context/AutoBeContext";
import { ProviderCodeComparator } from "./ProviderCodeComparator";
import { pipe } from "./RealizePipe";
import { orchestrateRealizeCoder } from "./orchestrateRealizeCoder";
import {
  RealizePlannerOutput,
  orchestrateRealizePlanner,
} from "./orchestrateRealizePlanner";
import { IAutoBeRealizeCompile } from "./structures/IAutoBeRealizeCompile";
import { FAILED } from "./structures/IAutoBeRealizeFailedSymbol";
import { RealizeFileSystem } from "./utils/ProviderFileSystem";

export function writeCodeUntilCompilePassed<Model extends ILlmSchema.Model>(
  ctx: AutoBeContext<Model>,
) {
  return async function (props: {
    operations: AutoBeOpenApi.IOperation[];
    authorizations: AutoBeRealizeAuthorization[];
    retry: number;
  }): Promise<{
    compiled: IAutoBeTypeScriptCompileResult;
    functions: AutoBeRealizeFunction[];
  }> {
    const payloads: Record<string, string> = Object.fromEntries(
      props.authorizations.map((el) => [
        el.payload.location,
        el.payload.content,
      ]),
    );

    const files: Record<string, string> = Object.fromEntries(
      Object.entries(await ctx.files({ dbms: "postgres" })).filter(([key]) =>
        key.startsWith("src"),
      ),
    );

    const templateFiles = await getTemplates(ctx);

    let diagnostics: IAutoBeRealizeCompile.CompileDiagnostics = {
      current: [],
      total: [],
    };

    const histories: HashMap<
      AutoBeOpenApi.IEndpoint,
      IAutoBeRealizeCompile.Success[]
    > = new HashMap(
      ProviderCodeComparator.hashCode,
      ProviderCodeComparator.equals,
    );

    for (const operation of props.operations) {
      histories.set(operation, []);
    }

    let compiled: IAutoBeTypeScriptCompileResult | null = null;
    const entireCodes: IAutoBeRealizeCompile.FileContentMap = {};
    for (let i = 0; i < props.retry; i++) {
      const targets = props.operations.filter((op) =>
        shouldProcessOperation(op, diagnostics.current),
      );

      const metadata = { total: targets.length, count: 0 } as const;
      const generatedCodes = await Promise.all(
        targets.map((operation) => {
          const role: string | null = operation.authorizationRole;
          const authorization: AutoBeRealizeAuthorization | undefined =
            props.authorizations.find((el) => el.role === role);

          return process(ctx)({
            metadata,
            operation,
            previousCodes: histories.get(operation),
            diagnostics,
            entireCodes,
            authorization,
          });
        }),
      );

      for (const code of generatedCodes) {
        if (code.type === "success") {
          const response = histories.get(code.operation);
          response.push(code);
          histories.set(code.operation, response);

          entireCodes[code.result.filename] = {
            content: code.result.implementationCode,
            result: "success",
            endpoint: {
              method: code.operation.method,
              path: code.operation.path,
            },
            location: code.result.filename,
            name: code.result.name,
          };
        }
      }

      const prisma = ctx.state().prisma?.compiled;
      const nodeModules = prisma?.type === "success" ? prisma.nodeModules : {};
      const compiler = await ctx.compiler();
      compiled = await compiler.typescript.compile({
        files: {
          ...payloads,
          ...files,
          ...nodeModules,
          ...Object.fromEntries(
            templateFiles.map((file) => [file.location, file.content]),
          ),
          ...Object.fromEntries(
            Object.entries(entireCodes).map(([filename, { content }]) => [
              filename,
              content,
            ]),
          ),
        },
      });

      if (compiled && compiled.type !== "success") {
        ctx.dispatch({
          type: "realizeValidate",
          created_at: new Date().toISOString(),
          files:
            compiled.type === "failure"
              ? Object.fromEntries(
                  compiled.diagnostics.map((diagnostic) => [
                    diagnostic.file,
                    diagnostic.code,
                  ]),
                )
              : {},
          result: compiled,
          step: ctx.state().analyze?.step ?? 0,
        });
      }

      if (
        compiled.type === "success" &&
        generatedCodes.every((c) => c.type === "success")
      ) {
        break;
      } else if (compiled.type === "failure") {
        diagnostics.current = compiled.diagnostics;
        diagnostics.total = [...diagnostics.total, ...compiled.diagnostics];
      }
    }

    const functions = Object.entries(entireCodes)
      .filter(([filename]) => filename.startsWith("src/providers")) // filter only provider files
      .map(([filename, value]) => {
        return {
          filename,
          content: value.content,
          endpoint: value.endpoint!,
          location: value.location!,
          name: value.name!,
          role: value.role ?? null,
        };
      });

    return { functions, compiled: compiled ? compiled : { type: "success" } };
  };
}

/**
 * Loads template files for the realize agent These files are essential for the
 * realize coder to pass compilation
 *
 * @param ctx Context of agent
 * @returns Template file infomations
 */
async function getTemplates<Model extends ILlmSchema.Model>(
  ctx: AutoBeContext<Model>,
): Promise<IAutoBeRealizeCompile.CodeArtifact[]> {
  const compiler = await ctx.compiler();
  const templateFiles = await compiler.realize.getTemplate();
  const pathnames = ["src/MyGlobal.ts", "src/util/toISOStringSafe.ts"] as const;

  return pathnames.map((pathname): IAutoBeRealizeCompile.CodeArtifact => {
    return {
      content: templateFiles[pathname],
      result: "success",
      location: pathname,
      role: null, // template files doesn't have role.
    } as const;
  });
}

function process<Model extends ILlmSchema.Model>(ctx: AutoBeContext<Model>) {
  return async function (props: {
    metadata: { total: number; count: number };
    operation: AutoBeOpenApi.IOperation;
    previousCodes: IAutoBeRealizeCompile.Success[];
    diagnostics: IAutoBeRealizeCompile.CompileDiagnostics;
    entireCodes: IAutoBeRealizeCompile.FileContentMap;
    authorization?: AutoBeRealizeAuthorization;
  }) {
    const result = await pipe(
      props.operation,
      (operation: AutoBeOpenApi.IOperation) =>
        orchestrateRealizePlanner(ctx, operation, props.authorization),
      async (plan: RealizePlannerOutput) => {
        const filename = RealizeFileSystem.providerPath(plan.functionName);
        const totalDiagnostics: IAutoBeTypeScriptCompileResult.IDiagnostic[] =
          props.diagnostics.total.filter((el) => el.file === filename);
        const currentDiagnostics: IAutoBeTypeScriptCompileResult.IDiagnostic[] =
          props.diagnostics.current.filter((el) => el.file === filename);
        const code = props.entireCodes[filename]?.content ?? null;

        return orchestrateRealizeCoder(
          ctx,
          props.operation,
          props.previousCodes,
          plan,
          code,
          totalDiagnostics,
          currentDiagnostics,
          props.authorization,
        ).then((res) => {
          if (props.previousCodes.length === 0) {
            ctx.dispatch({
              type: "realizeWrite",
              filename: filename,
              content: res === FAILED ? "FAILED" : res.implementationCode,
              completed: ++props.metadata.count,
              created_at: new Date().toISOString(),
              step: ctx.state().analyze?.step ?? 0,
              total: props.metadata.total,
            });
          } else {
            ctx.dispatch({
              type: "realizeCorrect",
              filename: filename,
              content: res === FAILED ? "FAILED" : res.implementationCode,
              completed: ++props.metadata.count,
              created_at: new Date().toISOString(),
              step: ctx.state().analyze?.step ?? 0,
              total: props.metadata.total,
            });
          }

          if (res === FAILED) {
            return res;
          }

          return { ...res, name: plan.functionName };
        });
      },
    );

    if (result === FAILED) {
      return { type: "failed", operation: props.operation, result } as const;
    }

    return { type: "success", operation: props.operation, result } as const;
  };
}

/**
 * Determines whether an operation should be processed in the current iteration.
 * In the initial case (no errors), all operations are processed. When errors
 * exist, only operations with compilation errors are targeted for reprocessing
 * in the next iteration.
 *
 * @param op - The operation to check
 * @param currentDiagnostics - Current compilation errors
 * @returns True if the operation should be processed
 */
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

/**
 * Generates a provider filename for an operation. Converts the operation's HTTP
 * method and path into a valid TypeScript filename. The filename serves as both
 * the function name and the file identifier.
 *
 * @param op - The operation to generate a filename for
 * @returns The generated provider filename with path
 */
function generateProviderFilename(op: AutoBeOpenApi.IOperation): string {
  return `src/providers/${op.method}_${op.path
    .replaceAll("/", "_")
    .replaceAll("-", "_")
    .replaceAll("{", "$")
    .replaceAll("}", "")}.ts`;
}
