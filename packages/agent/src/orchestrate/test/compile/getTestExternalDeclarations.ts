import { IAutoBeTestCompiler } from "@autobe/interface";
import { ILlmSchema } from "@samchon/openapi";
import { Singleton } from "tstl";

import { AutoBeContext } from "../../../context/AutoBeContext";

export async function getTestExternalDeclarations<
  Model extends ILlmSchema.Model,
>(ctx: AutoBeContext<Model>): Promise<Record<string, string>> {
  const compiler = await ctx.compiler();
  return singleton.get(compiler.test);
}

const singleton = new Singleton(async (compiler: IAutoBeTestCompiler) => {
  const records: Record<string, string> = await compiler.getExternal();
  const external = (location: string): Record<string, string> => {
    const content: string | undefined = records[location];
    if (content === undefined) throw new Error(`File not found: ${location}`);
    return { [location]: content };
  };
  const filter = (
    closure: (key: string) => boolean,
  ): Record<string, string> => {
    const entries = Object.entries(records).filter(([key]) => closure(key));
    return Object.fromEntries(entries);
  };
  return {
    ...external("node_modules/@nestia/e2e/lib/ArrayUtil.d.ts"),
    ...external("node_modules/@nestia/e2e/lib/RandomGenerator.d.ts"),
    ...external("node_modules/@nestia/e2e/lib/TestValidator.d.ts"),
    ...external("node_modules/@nestia/fetcher/lib/IConnection.d.ts"),
    ...external("node_modules/@samchon/openapi/lib/http/HttpError.d.ts"),
    ...external("node_modules/typia/lib/module.d.ts"),
    ...filter(
      (key) =>
        key.startsWith("node_modules/typia/lib/tags") && key.endsWith(".d.ts"),
    ),
  } satisfies Record<string, string>;
});
