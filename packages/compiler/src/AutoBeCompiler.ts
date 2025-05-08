import { IAutoBeCompiler } from "@autobe/interface";

import { AutoBeCompilerBase } from "./internal/AutoBeCompilerBase";
import External from "./raw/typings.json";

export class AutoBeCompiler
  extends AutoBeCompilerBase
  implements IAutoBeCompiler
{
  public constructor() {
    super(
      (k) => (External as Record<string, string>)[k],
      Object.keys(External).filter((f) => f.endsWith(".d.ts")),
    );
  }
}
