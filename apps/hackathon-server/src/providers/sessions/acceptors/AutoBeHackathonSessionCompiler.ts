import { IAutoBeCompiler, IAutoBeCompilerListener } from "@autobe/interface";
import { ArrayUtil, RandomGenerator } from "@nestia/e2e";
import path from "path";
import { WorkerConnector } from "tgrid";
import { Singleton } from "tstl";

import { AutoBeHackathonConfiguration } from "../../../AutoBeHackathonConfiguration";

export namespace AutoBeHackathonSessionCompiler {
  export const get = async (): Promise<IAutoBeCompiler> => {
    return RandomGenerator.pick(await pool.get());
  };
}

const pool = new Singleton(() =>
  ArrayUtil.asyncRepeat(
    Number(AutoBeHackathonConfiguration.env().HACKATHON_COMPILERS),
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
