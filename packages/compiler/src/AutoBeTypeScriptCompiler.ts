import {
  IAutoBeTypeScriptCompileProps,
  IAutoBeTypeScriptCompileResult,
  IAutoBeTypeScriptCompiler,
} from "@autobe/interface";
import nestiaCoreTransform from "@nestia/core/lib/transform";
import { EmbedTypeScript } from "embed-typescript";
import ts from "typescript";
import typiaTransform from "typia/lib/transform";

import NestJSExternal from "./raw/nestjs.json";
import { FilePrinter } from "./utils/FilePrinter";

/**
 * Official TypeScript compiler for final code validation and quality assurance.
 *
 * This compiler provides the ultimate validation layer that ensures all
 * generated code meets production standards and integrates seamlessly with the
 * TypeScript ecosystem. While the AST-based approach eliminates most potential
 * errors before code generation, the AutoBeTypeScriptCompiler serves as the
 * final quality gate for perfect integration verification throughout the vibe
 * coding pipeline.
 *
 * The implementation validates framework integration with NestJS APIs, type
 * system integrity for complex relationships, dependency resolution across
 * modules, and build system compatibility with standard toolchains. It provides
 * comprehensive IDE support including intelligent autocomplete, real-time error
 * detection, sophisticated refactoring capabilities, and complete navigation
 * features.
 *
 * The compiler enables critical feedback loops necessary for AI self-correction
 * when implementation or test code contains compilation errors requiring
 * iterative refinement. This ensures that generated applications are
 * immediately deployable without manual debugging cycles while maintaining the
 * reliability of the automated development process.
 *
 * @author Samchon
 */
export class AutoBeTypeScriptCompiler implements IAutoBeTypeScriptCompiler {
  public async compile(
    props: IAutoBeTypeScriptCompileProps,
  ): Promise<IAutoBeTypeScriptCompileResult> {
    const alias: string = props.package ?? "@ORGANIZATION/PROJECT-api";
    const compiler: EmbedTypeScript = new EmbedTypeScript({
      external: NestJSExternal as Record<string, string>,
      compilerOptions: {
        target: ts.ScriptTarget.ESNext,
        module: ts.ModuleKind.CommonJS,
        downlevelIteration: true,
        baseUrl: "./",
        paths: {
          [alias]: ["./src/api"],
          [`${alias}/lib/*`]: ["./src/api/*"],
        },
        strict: true,
        skipLibCheck: true,
        esModuleInterop: true,
        experimentalDecorators: true,
        emitDecoratorMetadata: true,
      },
      transformers: (program, diagnostics) => ({
        before: [
          typiaTransform(
            program,
            {},
            {
              addDiagnostic: (input) => diagnostics.push(input),
            },
          ),
          nestiaCoreTransform(
            program,
            {},
            {
              addDiagnostic: (input) => diagnostics.push(input),
            },
          ),
        ],
      }),
    });
    return compiler.compile({
      ...props.files,
      ...(props.prisma ?? {}),
    });
  }

  public async getExternal(location: string): Promise<string | undefined> {
    return (NestJSExternal as Record<string, string>)[location] ?? undefined;
  }

  public beautify(script: string): Promise<string> {
    return FilePrinter.beautify(script);
  }
}
