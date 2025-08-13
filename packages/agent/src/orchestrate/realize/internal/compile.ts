import {
  AutoBeRealizeAuthorization,
  AutoBeRealizeValidateEvent,
  IAutoBeTypeScriptCompileResult,
} from "@autobe/interface";
import { ILlmSchema } from "@samchon/openapi";

import { AutoBeContext } from "../../../context/AutoBeContext";
import { IAutoBeRealizeCompile } from "../structures/IAutoBeRealizeCompile";

export async function compile<Model extends ILlmSchema.Model>(
  ctx: AutoBeContext<Model>,
  props: {
    authorizations: AutoBeRealizeAuthorization[];
    providers: Record<string, string>;
  },
): Promise<
  IAutoBeTypeScriptCompileResult.ISuccess | AutoBeRealizeValidateEvent
> {
  const prisma = ctx.state().prisma?.compiled;
  const payloads: Record<string, string> = Object.fromEntries(
    props.authorizations.map((el) => [el.payload.location, el.payload.content]),
  );
  const templateFiles = await getTemplates(ctx);
  const nodeModules = prisma?.type === "success" ? prisma.nodeModules : {};
  const compiler = await ctx.compiler();
  const compiled = await compiler.typescript.compile({
    files: {
      ...nodeModules,
      ...payloads,
      ...Object.fromEntries(
        Object.entries(await ctx.files({ dbms: "sqlite" })).filter(([key]) =>
          key.startsWith("src"),
        ),
      ),
      ...Object.fromEntries(
        templateFiles.map((file) => [file.location, file.content]),
      ),
      ...props.providers,
    },
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

  return event;
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
