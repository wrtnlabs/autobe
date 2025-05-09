import {
  IAutoBeCompiler,
  IAutoBePrismaCompiler,
  IAutoBePrismaCompilerProps,
  IAutoBePrismaCompilerResult,
  IAutoBeTypeScriptCompiler,
  IAutoBeTypeScriptCompilerProps,
  IAutoBeTypeScriptCompilerResult,
} from "@autobe/interface";

import { AutoBePrismaCompiler } from "./AutoBePrismaCompiler";
import { AutoBeTypeScriptCompiler } from "./AutoBeTypeScriptCompiler";

export class AutoBeCompiler implements IAutoBeCompiler {
  private readonly prisma_: IAutoBePrismaCompiler = new AutoBePrismaCompiler();
  private readonly typescript_: IAutoBeTypeScriptCompiler =
    new AutoBeTypeScriptCompiler();

  public prisma(
    props: IAutoBePrismaCompilerProps,
  ): Promise<IAutoBePrismaCompilerResult> {
    return this.prisma_.compile(props);
  }

  public typescript(
    props: IAutoBeTypeScriptCompilerProps,
  ): Promise<IAutoBeTypeScriptCompilerResult> {
    return this.typescript_.compile(props);
  }
}
