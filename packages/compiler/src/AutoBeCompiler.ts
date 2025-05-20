import {
  AutoBeOpenApi,
  IAutoBeCompiler,
  IAutoBeInterfaceCompiler,
  IAutoBePrismaCompiler,
  IAutoBePrismaCompilerProps,
  IAutoBePrismaCompilerResult,
  IAutoBeTypeScriptCompiler,
  IAutoBeTypeScriptCompilerProps,
  IAutoBeTypeScriptCompilerResult,
} from "@autobe/interface";

import { AutoBeInterfaceCompiler } from "./AutoBeInterfaceCompiler";
import { AutoBePrismaCompiler } from "./AutoBePrismaCompiler";
import { AutoBeTypeScriptCompiler } from "./AutoBeTypeScriptCompiler";

export class AutoBeCompiler implements IAutoBeCompiler {
  private readonly prisma_: IAutoBePrismaCompiler = new AutoBePrismaCompiler();
  private readonly interface_: IAutoBeInterfaceCompiler =
    new AutoBeInterfaceCompiler();
  private readonly typescript_: IAutoBeTypeScriptCompiler =
    new AutoBeTypeScriptCompiler();

  public prisma(
    props: IAutoBePrismaCompilerProps,
  ): Promise<IAutoBePrismaCompilerResult> {
    return this.prisma_.compile(props);
  }

  public interface(
    document: AutoBeOpenApi.IDocument,
  ): Promise<Record<string, string>> {
    return this.interface_.compile(document);
  }

  public typescript(
    props: IAutoBeTypeScriptCompilerProps,
  ): Promise<IAutoBeTypeScriptCompilerResult> {
    return this.typescript_.compile(props);
  }
}
