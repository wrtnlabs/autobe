import {
  AutoBeHistory,
  IAutoBeCompiler,
  IAutoBeGetFilesOptions,
} from "@autobe/interface";
import { ILlmSchema } from "@samchon/openapi";
import typia from "typia";

import { AutoBeContext } from "../context/AutoBeContext";
import { AutoBeState } from "../context/AutoBeState";
import { AutoBeTokenUsage } from "../context/AutoBeTokenUsage";

export async function getAutoBeGenerated<Model extends ILlmSchema.Model>(
  ctx: AutoBeContext<Model>,
  histories: AutoBeHistory[],
  tokenUsage: AutoBeTokenUsage,
  options?: Partial<IAutoBeGetFilesOptions>,
): Promise<Record<string, string>> {
  const state: AutoBeState = ctx.state();
  const ret: Record<string, string> = {};

  // ANALYZE
  if (state.analyze === null) return {};
  Object.assign<Record<string, string>, Record<string, string>>(
    ret,
    Object.fromEntries(
      Object.entries(state.analyze.files).map(([key, value]) => [
        `docs/analysis/${key.split("/").at(-1)}`,
        value,
      ]),
    ),
  );

  // PRISMA
  const compiler: IAutoBeCompiler = await ctx.compiler();
  if (state.prisma?.step === state.analyze.step) {
    const schemaFiles: Record<string, string> =
      (options?.dbms ?? "postgres") === "postgres"
        ? state.prisma.schemas
        : await compiler.prisma.write(state.prisma.result.data, options!.dbms!);
    Object.assign<
      Record<string, string>,
      Record<string, string>,
      Record<string, string>
    >(
      ret,
      Object.fromEntries(
        Object.entries(schemaFiles).map(([key, value]) => [
          `prisma/schema/${key.split("/").at(-1)}`,
          value,
        ]),
      ),
      {
        "autobe/prisma.json": typia.json.stringify(state.prisma.result.data),
      },
    );
    if (state.prisma.compiled.type === "success")
      ret["docs/ERD.md"] = state.prisma.compiled.document;
    else if (state.prisma.compiled.type === "failure")
      ret["prisma/compile-error-reason.log"] = state.prisma.compiled.reason;
  }

  // INTERFACE
  if (state.interface?.step === state.analyze.step) {
    const files: Record<string, string> = await compiler.interface.write(
      state.interface.document,
    );
    Object.assign<
      Record<string, string>,
      Record<string, string>,
      Record<string, string>
    >(
      ret,
      state.test?.step === state.interface.step
        ? Object.fromEntries(
            Object.entries(files).filter(
              ([key]) => key.startsWith("test/features/") === false,
            ),
          )
        : files,
      {
        "autobe/document.json": typia.json.stringify(state.interface.document),
      },
    );
  }

  // TEST
  if (state.test?.step === state.analyze.step)
    Object.assign<
      Record<string, string>,
      Record<string, string>,
      Record<string, string>
    >(
      ret,
      Object.fromEntries(state.test.files.map((f) => [f.location, f.content])),
      await compiler.test.getTemplate(),
    );

  // REALIZE
  if (state.realize?.step === state.analyze.step)
    Object.assign<
      Record<string, string>,
      Record<string, string>,
      Record<string, string>
    >(ret, state.realize.files, await compiler.realize.getTemplate());

  // LOGGING
  Object.assign<Record<string, string>, Record<string, string>>(ret, {
    "autobe/histories.json": typia.json.stringify(histories),
    "autobe/tokenUsage.json": typia.json.stringify(tokenUsage),
  });
  return ret;
}
