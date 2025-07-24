import {
  AutoBeHistory,
  IAutoBeCompiler,
  IAutoBeGetFilesOptions,
} from "@autobe/interface";

import { AutoBeState } from "../context/AutoBeState";
import { AutoBeTokenUsage } from "../context/AutoBeTokenUsage";

export async function getAutoBeGenerated(
  compiler: IAutoBeCompiler,
  state: AutoBeState,
  histories: AutoBeHistory[],
  tokenUsage: AutoBeTokenUsage,
  options?: Partial<IAutoBeGetFilesOptions>,
): Promise<Record<string, string>> {
  // ANALYZE
  const ret: Record<string, string> = {};
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
        "autobe/prisma.json": JSON.stringify(state.prisma.result.data),
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
        "autobe/document.json": JSON.stringify(state.interface.document),
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
    >(
      ret,
      state.realize.files
        .map((f) => ({ [f.location]: f.content }))
        .reduce((acc, cur) => Object.assign(acc, cur), {}),
      await compiler.realize.getTemplate(),
    );

  // LOGGING
  Object.assign<Record<string, string>, Record<string, string>>(ret, {
    "autobe/histories.json": JSON.stringify(histories),
    "autobe/tokenUsage.json": JSON.stringify(tokenUsage),
  });
  return ret;
}
