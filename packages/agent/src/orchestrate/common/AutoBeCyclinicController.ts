import { IMicroAgenticaHistoryJson } from "@agentica/core";
import {
  AutoBeEventSource,
  AutoBePreliminaryKind,
} from "@autobe/interface";
import {
  ILlmApplication,
  ILlmSchema,
  LlmTypeChecker,
} from "@samchon/openapi";
import { v7 } from "uuid";

import { AutoBeConfigConstant } from "../../constants/AutoBeConfigConstant";
import { AutoBeContext } from "../../context/AutoBeContext";
import { AutoBeCyclinicExhaustedError } from "../../utils/AutoBeCyclinicExhaustedError";
import { AutoBePreliminaryController } from "./AutoBePreliminaryController";
import { orchestratePreliminary } from "./orchestratePreliminary";

/**
 * Cyclinic controller for unified write-compile-correct loops.
 *
 * Combines preliminary RAG context loading, write submission with external
 * validation (compiler), and iterative correction into a single unified loop.
 *
 * Manages three action types within one loop:
 * - `getXXX` (preliminary): Load context data incrementally
 * - `write`: Submit code/schema for external validation (compile)
 * - `complete`: Finalize after a successful write
 *
 * The `complete` action is only available in the union after a successful
 * write validation. This is enforced by dynamic schema narrowing via
 * {@link fixCompleteAvailability}.
 *
 * @author Samchon
 */
export class AutoBeCyclinicController<
  Kind extends AutoBePreliminaryKind,
> {
  // METADATA
  private readonly source: Exclude<
    AutoBeEventSource,
    "facade" | "preliminary"
  >;
  private readonly source_id: string;

  // COMPOSED CONTROLLER
  private readonly preliminary: AutoBePreliminaryController<Kind>;

  // CYCLINIC STATE
  private readonly failures: AutoBeCyclinicController.IFailure[];
  private readonly maxIterations: number;
  private writeSucceeded: boolean;

  /**
   * Initializes cyclinic controller with preliminary data management and
   * cyclinic loop configuration.
   *
   * @param props Constructor configuration including preliminary settings and
   *   max iterations.
   */
  public constructor(props: AutoBeCyclinicController.IProps<Kind>) {
    this.source = props.source;
    this.source_id = v7();
    this.preliminary = new AutoBePreliminaryController(props);
    this.failures = [];
    this.maxIterations =
      props.maxIterations ??
      AutoBeConfigConstant.RAG_LIMIT * AutoBeConfigConstant.COMPILER_RETRY;
    this.writeSucceeded = false;
  }

  /**
   * Returns the composed preliminary controller.
   *
   * Use this to access preliminary data (all/local), generate preliminary
   * histories, fix preliminary application, validate preliminary requests,
   * etc.
   *
   * @returns The inner `AutoBePreliminaryController` instance.
   */
  public getPreliminary(): AutoBePreliminaryController<Kind> {
    return this.preliminary;
  }

  /**
   * Returns accumulated write validation failures.
   *
   * Each entry contains diagnostics from a failed write attempt. Use this
   * to include failure context in conversation histories.
   *
   * @returns Array of failure records with diagnostics and iteration index.
   */
  public getFailures(): AutoBeCyclinicController.IFailure[] {
    return this.failures;
  }

  /**
   * Returns whether any write attempt has passed validation.
   *
   * When `true`, the `complete` action becomes available in the union.
   *
   * @returns `true` if at least one write has been validated successfully.
   */
  public hasWriteSucceeded(): boolean {
    return this.writeSucceeded;
  }

  /**
   * Dynamically adds or removes `IComplete` from the application's request
   * union based on whether a write has succeeded.
   *
   * Uses the same schema mutation pattern as
   * {@link AutoBePreliminaryController.fixApplication} — mutates `anyOf`,
   * `$defs`, and `discriminator.mapping` in-place.
   *
   * When `writeSucceeded === false`, removes the `complete` entry from the
   * union so the LLM cannot call it prematurely.
   *
   * @param application LLM application to modify (mutated in-place).
   * @returns The same application reference for chaining.
   */
  public fixCompleteAvailability(
    application: ILlmApplication,
  ): ILlmApplication {
    if (this.writeSucceeded) return application; // complete stays available

    const func = application.functions.find((f) => f.name === "process");
    if (func === undefined) return application;

    const request: ILlmSchema | undefined =
      func.parameters.properties.request;
    if (request === undefined) return application;
    if (LlmTypeChecker.isAnyOf(request) === false) return application;

    const children: ILlmSchema.IReference[] = request.anyOf.filter(
      (s): s is ILlmSchema.IReference => LlmTypeChecker.isReference(s),
    );
    const mapping: Record<string, string> =
      request["x-discriminator"]?.mapping ?? {};

    // Find and remove IComplete reference from union
    const completeIndex: number = children.findIndex(
      (c) =>
        c.$ref.endsWith("/IComplete") ||
        c.$ref.endsWith(".IComplete"),
    );
    if (completeIndex !== -1) {
      // Remove from anyOf array
      const idx = request.anyOf.indexOf(children[completeIndex]);
      if (idx !== -1) request.anyOf.splice(idx, 1);
    }

    // Remove from discriminator mapping
    delete mapping["complete"];

    return application;
  }

  /**
   * Generates conversation history entries for write validation failures.
   *
   * Each failure produces a system message containing the compiler
   * diagnostics from that attempt. When a write has succeeded, appends a
   * success notification informing the LLM it may call `complete`.
   *
   * Callers should combine these with `preliminary.getHistories()` and
   * phase-specific histories when building the full conversation context.
   *
   * @param formatDiagnostics Callback to format diagnostics into a
   *   human-readable string. Phase-specific (TS errors vs Prisma errors
   *   etc.).
   * @returns Array of history entries to inject into the conversation.
   */
  public getFailureHistories(
    formatDiagnostics: (failure: AutoBeCyclinicController.IFailure) => string,
  ): IMicroAgenticaHistoryJson[] {
    const histories: IMicroAgenticaHistoryJson[] = [];

    for (const failure of this.failures) {
      histories.push({
        id: v7(),
        type: "systemMessage",
        created_at: new Date().toISOString(),
        text: formatDiagnostics(failure),
      });
    }

    if (this.writeSucceeded) {
      histories.push({
        id: v7(),
        type: "systemMessage",
        created_at: new Date().toISOString(),
        text:
          "Your last write attempt passed validation successfully. " +
          'You may now call complete(are_you_sure: true) to finalize.',
      });
    }

    return histories;
  }

  /**
   * Runs the unified cyclinic write-compile-correct loop.
   *
   * Iterates up to `maxIterations` times. Each iteration calls the
   * `process` callback which performs one `ctx.conversate()` call. The
   * callback returns an `IProcessResult` indicating which action the LLM
   * took:
   *
   * - `action === null`: Preliminary data request. Delegates to
   *   `orchestratePreliminary()` and continues the loop.
   * - `action.type === "write"`: Code submission. Calls `validate()`. On
   *   success, stores the result and enables `complete`. On failure, pushes
   *   diagnostics to `failures[]` for the next iteration's history.
   * - `action.type === "complete"`: Finalization. Calls `finalize()` with
   *   the last successful write data and returns.
   *
   * @param ctx AutoBe execution context.
   * @param process Callback that runs one LLM conversate iteration.
   * @param validate Callback that compiles/validates write output.
   * @param finalize Callback that transforms validated write data into final
   *   result.
   * @returns Final result from `finalize()`.
   * @throws AutoBeCyclinicExhaustedError when `maxIterations` exceeded.
   */
  public async orchestrate<WriteData, FinalResult>(
    ctx: AutoBeContext,
    process: (
      context: AutoBeCyclinicController.IProcessContext<Kind>,
    ) => Promise<AutoBeCyclinicController.IProcessResult<WriteData>>,
    validate: (
      writeData: WriteData,
    ) => Promise<AutoBeCyclinicController.IValidation>,
    finalize: (lastWrite: WriteData) => FinalResult,
  ): Promise<FinalResult> {
    let lastWrite: WriteData | null = null;

    for (let i: number = 0; i < this.maxIterations; ++i) {
      const { result, action } = await process({
        preliminary: this.preliminary,
        failures: [...this.failures],
        writeSucceeded: this.writeSucceeded,
        iteration: i,
      });

      // 1. PRELIMINARY (getXXX)
      if (action === null) {
        await orchestratePreliminary(ctx, {
          source_id: this.source_id,
          source: this.source,
          preliminary: this.preliminary,
          trial: i + 1,
          histories: result.histories,
        });
        continue;
      }

      // 2. WRITE (code submission → validation)
      if (action.type === "write") {
        const validation = await validate(action.data);
        if (validation.success) {
          lastWrite = action.data;
          this.writeSucceeded = true;
          // Next iteration: complete becomes available in union
        } else {
          this.failures.push({
            diagnostics: validation.diagnostics,
            iteration: i,
          });
          // Next iteration: diagnostics appear in history
        }
        continue;
      }

      // 3. COMPLETE (finalize)
      if (action.type === "complete") {
        if (lastWrite === null) {
          // Safety: write not yet succeeded but complete was called.
          // This should be prevented by union narrowing, but continue
          // gracefully if it happens.
          continue;
        }
        return finalize(lastWrite);
      }
    }

    // maxIterations exhausted — return last successful write if available
    if (lastWrite !== null) {
      return finalize(lastWrite);
    }

    throw new AutoBeCyclinicExhaustedError();
  }
}

export namespace AutoBeCyclinicController {
  /**
   * Constructor props for `AutoBeCyclinicController`.
   *
   * Extends `AutoBePreliminaryController.IProps` with cyclinic-specific
   * configuration.
   */
  export interface IProps<Kind extends AutoBePreliminaryKind>
    extends AutoBePreliminaryController.IProps<Kind> {
    /**
     * Maximum total iterations for the cyclinic loop.
     *
     * Covers both preliminary data requests and write-compile-correct
     * cycles. Defaults to `RAG_LIMIT * COMPILER_RETRY`.
     */
    maxIterations?: number;
  }

  /**
   * Context passed to the `process` callback on each iteration.
   */
  export interface IProcessContext<Kind extends AutoBePreliminaryKind> {
    /** Composed preliminary controller for data access and history. */
    preliminary: AutoBePreliminaryController<Kind>;

    /** Accumulated write validation failures from previous iterations. */
    failures: IFailure[];

    /** Whether any write has passed validation (enables `complete`). */
    writeSucceeded: boolean;

    /** Current loop iteration (0-based). */
    iteration: number;
  }

  /**
   * Result returned by the `process` callback.
   *
   * The `action` field indicates what the LLM did:
   * - `null`: Preliminary data request (getXXX). Loop continues.
   * - `{ type: "write", data }`: Write submission. Will be validated.
   * - `{ type: "complete" }`: Finalization request.
   */
  export interface IProcessResult<WriteData> {
    /** LLM conversate result containing histories and metrics. */
    result: AutoBeContext.IResult;

    /**
     * Action the LLM took.
     *
     * - `null` = preliminary request
     * - `{ type: "write", data }` = write submission
     * - `{ type: "complete" }` = finalization
     */
    action:
      | { type: "write"; data: WriteData }
      | { type: "complete" }
      | null;
  }

  /** Record of a failed write validation attempt. */
  export interface IFailure {
    /** Compiler diagnostics or validation errors. Phase-specific type. */
    diagnostics: unknown;

    /** Iteration index when this failure occurred. */
    iteration: number;
  }

  /** Result of external validation (compilation). */
  export interface IValidation {
    /** Whether the write output passed validation. */
    success: boolean;

    /** Diagnostics to feed back on failure. */
    diagnostics?: unknown;
  }
}
