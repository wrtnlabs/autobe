import { AutoBeAgent } from "@autobe/agent";
import { AutoBeContext } from "@autobe/agent/src/context/AutoBeContext";
import { AutoBeExampleStorage } from "@autobe/benchmark";
import { FileSystemIterator } from "@autobe/filesystem";
import {
  AutoBeExampleProject,
  AutoBeTestFunction,
  IAutoBeCompiler,
  IAutoBeTypeScriptCompileResult,
} from "@autobe/interface";

export const assert_test_compilation = async (props: {
  agent: AutoBeAgent;
  project: AutoBeExampleProject;
  vendor: string;
  functions: AutoBeTestFunction[];
  type: AutoBeTestFunction["type"];
}): Promise<IAutoBeTypeScriptCompileResult> => {
  const ctx: AutoBeContext = props.agent.getContext();
  const compiler: IAutoBeCompiler = await ctx.compiler();

  const result: IAutoBeTypeScriptCompileResult =
    await compiler.typescript.compile({
      files: Object.fromEntries([
        ...Object.entries(
          await ctx.files({
            dbms: "sqlite",
          }),
        ).filter(
          ([key]) =>
            key.endsWith(".ts") && key.startsWith("test/features") === false,
        ),
        ...props.functions.map((f) => [f.location, f.content]),
      ]),
    });
  if (result.type === "success") return result;

  try {
    await FileSystemIterator.save({
      root: `${AutoBeExampleStorage.TEST_ROOT}/results/${AutoBeExampleStorage.slugModel(props.vendor, false)}/${
        props.project
      }/test-${props.type}-failure`,
      files: Object.fromEntries([
        ...Object.entries(
          await ctx.files({
            dbms: "sqlite",
          }),
        ).filter(([key]) => key.startsWith("test/features") === false),
        ...props.functions.map((f) => [f.location, f.content]),
        ["pnpm-workspace.yaml", ""],
      ]),
    });
  } catch {}
  console.log(result);
  console.log(
    `code results/${AutoBeExampleStorage.slugModel(props.vendor, false)}/${props.project}/test-${props.type}-failure`,
  );
  throw new Error(
    `Test ${props.type} functions compilation failed for project ${props.project} of vendor ${props.vendor}`,
  );
};
