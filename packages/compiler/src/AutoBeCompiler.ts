import {
  AutoBeOpenApi,
  IAutoBeCompiler,
  IAutoBeInterfaceCompiler,
  IAutoBePrismaCompiler,
  IAutoBeTypeScriptCompiler,
  IAutoBeTypeScriptCompilerProps,
  IAutoBeTypeScriptCompilerResult,
} from "@autobe/interface";

import { AutoBeInterfaceCompiler } from "./AutoBeInterfaceCompiler";
import { AutoBePrismaCompiler } from "./AutoBePrismaCompiler";
import { AutoBeTypeScriptCompiler } from "./AutoBeTypeScriptCompiler";

export class AutoBeCompiler implements IAutoBeCompiler {
  public readonly prisma: IAutoBePrismaCompiler = new AutoBePrismaCompiler();

  public interface(
    document: AutoBeOpenApi.IDocument,
  ): Promise<Record<string, string>> {
    return this.interface_compiler_.compile(document);
  }

  public typescript(
    props: IAutoBeTypeScriptCompilerProps,
  ): Promise<IAutoBeTypeScriptCompilerResult> {
    return this.typescript_compiler_.compile(props);
  }

  private readonly interface_compiler_: IAutoBeInterfaceCompiler =
    new AutoBeInterfaceCompiler();

  private readonly typescript_compiler_: IAutoBeTypeScriptCompiler =
    new AutoBeTypeScriptCompiler();
}
