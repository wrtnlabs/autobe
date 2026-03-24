import { IAutoBeCompiler, IAutoBeCompilerListener } from "@autobe/interface";
import { ArrayUtil, RandomGenerator } from "@nestia/e2e";
import path from "path";
import { WorkerConnector } from "tgrid";
import { Singleton } from "tstl";

import { AutoBePlaygroundGlobal } from "../../../AutoBePlaygroundGlobal";

export namespace AutoBePlaygroundSessionCompiler {
  export const get = async (): Promise<IAutoBeCompiler> => {
    return RandomGenerator.pick(await pool.get());
  };
}

const pool = new Singleton(() =>
  ArrayUtil.asyncRepeat(
    Number(AutoBePlaygroundGlobal.env.PLAYGROUND_COMPILERS),
    async () => {
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
        `${__dirname}/../../../executable/compiler${path.extname(__filename)}`,
      );
      return compiler.getDriver();
    },
  ),
);
