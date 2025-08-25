import {
  AutoBeRealizeAuthorization,
  AutoBeRealizeFunction,
  AutoBeRealizeValidateEvent,
  IAutoBeCompiler,
  IAutoBeTypeScriptCompileResult,
} from "@autobe/interface";
import { ILlmSchema } from "@samchon/openapi";

import { AutoBeContext } from "../../../context/AutoBeContext";

export async function compile<Model extends ILlmSchema.Model>(
  ctx: AutoBeContext<Model>,
  props: {
    authorizations: AutoBeRealizeAuthorization[];
    functions: AutoBeRealizeFunction[];
  },
): Promise<IAutoBeTypeScriptCompileResult> {
  const prisma = ctx.state().prisma?.compiled;
  const payloads: Record<string, string> = Object.fromEntries(
    props.authorizations.map((el) => [el.payload.location, el.payload.content]),
  );
  const compiler: IAutoBeCompiler = await ctx.compiler();
  const templateFiles: Record<string, string> =
    await compiler.realize.getTemplate();
  const nodeModules: Record<string, string> =
    prisma?.type === "success" ? prisma.nodeModules : {};

  const filterTsFiles = (location: string) => location.endsWith(".ts");

  const files: Record<string, string> = {
    ...nodeModules,
    ...payloads,
    ...Object.fromEntries(
      Object.entries(await ctx.files({ dbms: "sqlite" })).filter(([key]) =>
        filterTsFiles(key),
      ),
    ),
    ...Object.fromEntries(
      Object.entries(templateFiles).filter(([key]) => filterTsFiles(key)),
    ),
    ...Object.fromEntries(
      props.functions.map((el) => [el.location, el.content]),
    ),
  };

  const compiled: IAutoBeTypeScriptCompileResult =
    await compiler.typescript.compile({
      files: files,
    });
  if (compiled.type === "success") {
    return compiled;
  }

  const event: AutoBeRealizeValidateEvent = {
    type: "realizeValidate",
    result: compiled,
    files: Object.fromEntries(
      compiled.type === "failure"
        ? compiled.diagnostics.map((d) => [d.file, d.code])
        : [],
    ),
    step: ctx.state().analyze?.step ?? 0,
    created_at: new Date().toISOString(),
  };
  ctx.dispatch(event);
  return compiled;
}
