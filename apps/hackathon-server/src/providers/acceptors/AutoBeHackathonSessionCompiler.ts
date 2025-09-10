import { IAutoBeCompiler, IAutoBeCompilerListener } from "@autobe/interface";
import path from "path";
import { WorkerConnector } from "tgrid";
import { Singleton } from "tstl";

export namespace AutoBeHackathonSessionCompiler {
  export const get = (): Promise<IAutoBeCompiler> => compiler.get();
}

const compiler = new Singleton(async (): Promise<IAutoBeCompiler> => {
  const compiler: WorkerConnector<
    null,
    IAutoBeCompilerListener,
    IAutoBeCompiler
  > = new WorkerConnector(
    null,
    {
      realize: {
        test: {
          onOperation: async () => {},
          onReset: async () => {},
        },
      },
    },
    "process",
  );
  await compiler.connect(
    `${__dirname}/../../executable/compiler${path.extname(__filename)}`,
  );
  return compiler.getDriver();
});
