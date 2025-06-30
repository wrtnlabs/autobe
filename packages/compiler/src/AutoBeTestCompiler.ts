import {
  IAutoBeTestCompiler,
  IAutoBeTestCompilerProps,
} from "@autobe/interface";

import { writeTestFunction } from "./test/writeTestFunction";

export class AutoBeTestCompiler implements IAutoBeTestCompiler {
  public async write(props: IAutoBeTestCompilerProps): Promise<string> {
    return writeTestFunction(props);
  }
}
