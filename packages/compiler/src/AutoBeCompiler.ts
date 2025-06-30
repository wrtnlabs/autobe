import {
  IAutoBeCompiler,
  IAutoBeInterfaceCompiler,
  IAutoBePrismaCompiler,
  IAutoBeTestCompiler,
  IAutoBeTypeScriptCompiler,
} from "@autobe/interface";

import { AutoBeInterfaceCompiler } from "./AutoBeInterfaceCompiler";
import { AutoBePrismaCompiler } from "./AutoBePrismaCompiler";
import { AutoBeTestCompiler } from "./AutoBeTestCompiler";
import { AutoBeTypeScriptCompiler } from "./AutoBeTypeScriptCompiler";

/**
 * Comprehensive compilation infrastructure for the vibe coding pipeline.
 *
 * This class provides the three-tier compiler system that transforms AST
 * structures into production-ready code across all development phases. The
 * AutoBeCompiler integrates the custom Prisma compiler, Interface compiler, and
 * official TypeScript compiler into a unified compilation infrastructure.
 *
 * The compilation system ensures 100% syntactic correctness and semantic
 * integrity throughout the automated development workflow by operating on
 * validated AST data and providing continuous validation feedback loops. This
 * enables the revolutionary "structure first, validate continuously, generate
 * deterministically" approach that guarantees generated applications work
 * correctly on the first attempt.
 *
 * For high-performance scenarios with multiple concurrent users, individual
 * compiler components can be separated into dedicated worker processes to
 * prevent blocking during computationally intensive compilation operations
 * while maintaining the same interface compatibility.
 *
 * @author Samchon
 */
export class AutoBeCompiler implements IAutoBeCompiler {
  public readonly prisma: IAutoBePrismaCompiler = new AutoBePrismaCompiler();

  public readonly interface: IAutoBeInterfaceCompiler =
    new AutoBeInterfaceCompiler();

  public readonly typescript: IAutoBeTypeScriptCompiler =
    new AutoBeTypeScriptCompiler();

  public readonly test: IAutoBeTestCompiler = new AutoBeTestCompiler();
}
