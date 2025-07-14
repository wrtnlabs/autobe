import {
  IAutoBeRealizeCompiler,
  IAutoBeRealizeTestProps,
  IAutoBeRealizeTestResult,
} from "@autobe/interface";

import { AutoBeTypeScriptCompiler } from "../AutoBeTypeScriptCompiler";

export class AutoBeRealizeCompiler implements IAutoBeRealizeCompiler {
  public constructor(private readonly tsc: AutoBeTypeScriptCompiler) {}

  public async test(
    props: IAutoBeRealizeTestProps,
  ): Promise<IAutoBeRealizeTestResult> {
    const result = await this.tsc.compile(props);
    if (result.type !== "success")
      throw new Error("Failed to compile TypeScript files.");
    return null!;
  }
}
