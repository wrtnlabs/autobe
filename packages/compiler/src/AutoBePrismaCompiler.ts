import {
  IAutoBePrismaCompiler,
  IAutoBePrismaCompilerProps,
  IAutoBePrismaCompilerResult,
} from "@autobe/interface";
import { EmbedPrisma } from "embed-prisma";

export class AutoBePrismaCompiler implements IAutoBePrismaCompiler {
  public async compile(
    props: IAutoBePrismaCompilerProps,
  ): Promise<IAutoBePrismaCompilerResult> {
    const compiler: EmbedPrisma = new EmbedPrisma();
    return compiler.compile(props.files);
  }
}
