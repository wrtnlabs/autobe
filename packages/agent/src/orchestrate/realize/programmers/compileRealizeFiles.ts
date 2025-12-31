import {
  AutoBeRealizeFunction,
  AutoBeRealizeValidateEvent,
  IAutoBeCompiler,
  IAutoBePrismaCompileResult,
  IAutoBeTypeScriptCompileResult,
} from "@autobe/interface";
import { v7 } from "uuid";

import { AutoBeContext } from "../../../context/AutoBeContext";

export async function compileRealizeFiles(
  ctx: AutoBeContext,
  props: {
    functions: AutoBeRealizeFunction[];
    additional: Record<string, string>;
  },
): Promise<AutoBeRealizeValidateEvent> {
  const prisma: IAutoBePrismaCompileResult | undefined =
    ctx.state().database?.compiled;
  const compiler: IAutoBeCompiler = await ctx.compiler();
  const templateFiles: Record<string, string> = await compiler.getTemplate({
    phase: "realize",
    dbms: "sqlite",
  });
  const client: Record<string, string> =
    prisma?.type === "success" ? prisma.client : {};

  const filterTsFiles = (location: string) =>
    location.startsWith("src/") && location.endsWith(".ts");

  const files: Record<string, string> = {
    ...client,
    ...props.additional,
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
      prisma: client,
    });
  return {
    type: "realizeValidate",
    id: v7(),
    files: files,
    result: compiled,
    step: ctx.state().analyze?.step ?? 0,
    created_at: new Date().toISOString(),
  };
}
