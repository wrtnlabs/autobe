import { AutoBeCompilerBase } from "./internal/AutoBeCompilerBase";
import External from "./raw/external.json";

export class AutoBeCompiler extends AutoBeCompilerBase {
  public constructor() {
    super(
      (k) => (External as Record<string, string>)[k],
      Object.keys(External).filter((f) => f.endsWith(".d.ts")),
    );
  }
}
