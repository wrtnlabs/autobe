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
  return {
    ...external("node_modules/@nestia/e2e/lib/ArrayUtil.d.ts"),
    ...external("node_modules/@nestia/e2e/lib/RandomGenerator.d.ts"),
    ...external("node_modules/@nestia/e2e/lib/TestValidator.d.ts"),
    ...external("node_modules/@nestia/fetcher/lib/IConnection.d.ts"),
  } satisfies Record<string, string>;
});
