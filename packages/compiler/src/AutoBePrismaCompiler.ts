import {
  AutoBePrisma,
  IAutoBePrismaCompileResult,
  IAutoBePrismaCompiler,
  IAutoBePrismaCompilerProps,
  IAutoBePrismaValidation,
} from "@autobe/interface";
import { EmbedPrisma } from "embed-prisma";

import { validatePrismaApplication } from "./prisma/validatePrismaApplication";
import { writePrismaApplication } from "./prisma/writePrismaApplication";

/**
 * Custom Prisma compiler that handles database schema validation and
 * generation.
 *
 * This compiler provides the foundational compilation layer that transforms
 * business requirements into validated database architectures through
 * sophisticated AST manipulation. The AutoBePrismaCompiler operates exclusively
 * on {@link AutoBePrisma.IApplication} structures, eliminating error-prone
 * text-based schema authoring while ensuring perfect consistency between
 * business logic and data storage design.
 *
 * The implementation leverages EmbedPrisma for robust schema compilation,
 * custom validation logic for comprehensive AST analysis, and specialized
 * writing utilities for deterministic code generation. The compiler ensures
 * 100% syntactic correctness and semantic integrity through multi-layered
 * validation including relationship graph analysis, business logic validation,
 * and performance optimization.
 *
 * The compilation process produces comprehensive documentation, optimal
 * indexes, proper constraints, and ERD diagrams ready for production deployment
 * while maintaining perfect alignment with business requirements throughout the
 * automated development pipeline.
 *
 * @author Samchon
 */
export class AutoBePrismaCompiler implements IAutoBePrismaCompiler {
  public async compile(
    props: IAutoBePrismaCompilerProps,
  ): Promise<IAutoBePrismaCompileResult> {
    const compiler: EmbedPrisma = new EmbedPrisma();
    return compiler.compile(props.files);
  }

  public async validate(
    application: AutoBePrisma.IApplication,
  ): Promise<IAutoBePrismaValidation> {
    return validatePrismaApplication(application);
  }

  public async write(
    application: AutoBePrisma.IApplication,
    dbms: "postgres" | "sqlite" = "postgres",
  ): Promise<Record<string, string>> {
    return writePrismaApplication({
      application,
      dbms,
    });
  }
}
