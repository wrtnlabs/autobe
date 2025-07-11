import { AutoBeOpenApi } from "@autobe/interface";

import { FAILED } from "../orchestrateRealize";

export interface IAutoBeRealizeCoderApplication {
  programming: (input: IAutoBeRealizeCoderApplication.IProps) => void;
}

export namespace IAutoBeRealizeCoderApplication {
  export interface IProps {
    output: RealizeCoderOutput;
  }

  /**
   * Represents the complete output of a code generation pipeline. Each phase is
   * a progressive refinement of a TypeScript function implementation.
   *
   * All fields contain TypeScript code strings and follow these rules:
   *
   * - The implementation must be valid TypeScript code.
   * - It should focus solely on the logic of the function.
   * - Import statements do **not** need to be included. They will be
   *   automatically inserted by the system.
   * - Any unused imports will be automatically removed by eslint.
   * - Type annotations (e.g. for parameters and return types) should be omitted
   *   if they can be inferred.
   */
  export interface RealizeCoderOutput {
    /** The name of the file to be generated (e.g., "user.create.ts") */
    filename: string;

    /**
     * 🧠 Provider Function Implementation Plan
     *
     * This field outlines the strategic plan for implementing the provider
     * function according to the Realize Coder Agent specification. Before
     * writing the actual code, think through the logic and structure.
     *
     * The plan must consider:
     *
     * - 🧩 Required business entities (e.g., users, posts, logs) and their
     *   relationships
     * - 🛠 Operations needed to fulfill the business scenario (e.g., fetch,
     *   create, update)
     * - 🔄 Data dependencies between steps (e.g., use userId to fetch related
     *   data)
     * - ✅ Validation points (based on business rules, not field presence)
     * - 🚧 Error and edge cases that must be handled explicitly (e.g., missing
     *   records)
     * - 🏗 Structure: always a single `async function`, using only `parameters`
     *   and `body`
     *
     * ⚠️ Important Constraints:
     *
     * - Do NOT perform input validation — assume `parameters` and `body` are
     *   already valid
     * - Use `typia.random<T>()` with an explanatory comment if logic can't be
     *   implemented
     * - Never use `any` or make assumptions without sufficient context
     * - Use only allowed imports — DTOs and Prisma types
     * - Use `MyGlobal.prisma` for DB access and respect Prisma typing rules
     *
     * ✅ Example Structure:
     *
     * ```ts
     * export async function doSomething(
     *   user: { id: string & tags.Format<"uuid">; type: string },
     *   parameters: IParams,
     *   body: IBody
     * ): Promise<IReturn> {
     *   const { id } = parameters;
     *   const { name } = body;
     *   const user = await MyGlobal.prisma.users.findFirst({ where: { id } });
     *   if (!user) throw new Error("User not found");
     *   ...
     *   return result;
     * }
     * ```
     *
     * If required models, types, or fields are not available:
     *
     * - Clearly explain missing parts in a placeholder comment
     * - Return a mock result using `typia.random<T>()`
     *
     * This plan ensures the function will:
     *
     * - Respect the global architecture and coding conventions
     * - Be safe, predictable, and aligned with upstream logic
     */
    plan: string;

    /**
     * Phase 1: Draft code
     *
     * A rough TypeScript draft that outlines the initial structure and logic of
     * the function. This code focuses on the high-level flow, key steps, and
     * placeholder values. It doesn't need to be complete or compilable at this
     * stage.
     */
    draft: string;

    /**
     * Phase 2: Review code
     *
     * A refined version of the draft code that includes more complete logic. It
     * should be closer to a working implementation and ideally compile without
     * errors.
     */
    review: string;

    /**
     * Phase 3: With compiler feedback (optional)
     *
     * A modified version of the review code that addresses any TypeScript
     * compiler errors. This field is **optional** and should only be present if
     * compiler feedback was needed.
     */
    withCompilerFeedback?: string;

    /**
     * Phase 4: Final implementation
     *
     * The complete and correct TypeScript function implementation. This version
     * must successfully compile and reflect all required logic and fixes.
     */
    implementationCode: string;
  }

  export interface IPipeOutput {
    result: RealizeCoderOutput | FAILED;

    operation: AutoBeOpenApi.IOperation;
  }
}
