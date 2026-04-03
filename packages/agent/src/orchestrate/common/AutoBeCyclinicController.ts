import { AutoBeEventSource, AutoBePreliminaryKind } from "@autobe/interface";
import { ILlmApplication } from "typia";
import { v7 } from "uuid";

import { AutoBeConfigConstant } from "../../constants/AutoBeConfigConstant";
import { AutoBeContext } from "../../context/AutoBeContext";
import { AutoBeCyclinicExhaustedError } from "../../utils/AutoBeCyclinicExhaustedError";
import { AutoBePreliminaryController } from "./AutoBePreliminaryController";
import { orchestratePreliminary } from "./orchestratePreliminary";

/**
 * Unified write-compile-correct loop controller.
 *
 * Manages three action types within a single iteration loop:
 *
 * - `getXXX` (preliminary): Incremental RAG context loading
 * - `write`: Code/schema submission for external validation
 * - `complete`: Finalization after successful write (dynamically gated)
 *
 * @author Samchon
 */
export class AutoBeCyclinicController<Kind extends AutoBePreliminaryKind> {
  // METADATA
  private readonly source: Exclude<AutoBeEventSource, "facade" | "preliminary">;
  private readonly source_id: string;

  // COMPOSED CONTROLLER
  private readonly preliminary: AutoBePreliminaryController<Kind>;

  // CYCLINIC STATE
  private readonly failures: AutoBeCyclinicController.IFailure[];
  private readonly maxIterations: number;
  private writeSucceeded: boolean;

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

  // ── Accessors ──

  public getPreliminary(): AutoBePreliminaryController<Kind> {
    return this.preliminary;
  }

  public getFailures(): AutoBeCyclinicController.IFailure[] {
    return this.failures;
  }

  /** Whether any write has passed validation (gates `complete` availability). */
  public hasWriteSucceeded(): boolean {
    return this.writeSucceeded;
  }

  // ── Schema manipulation ──

  /**
   * No-op: `complete` is kept in the schema at all times.
   *
   * Premature `complete` calls (before any successful write) are handled
   * inside {@link orchestrate} by pushing an explicit failure message and
   * continuing, rather than by removing the action from the schema.
   *
   * Schema-removal caused LLMs to hallucinate `complete` anyway, resulting
   * in silent typia validation failures and wasted iterations.
   */
  public fixCompleteAvailability(
    application: ILlmApplication,
  ): ILlmApplication {
    return application;
  }

  // ── Main loop ──

  /**
   * Runs the unified write-compile-correct loop.
   *
   * Each iteration calls `process()` to get the LLM's action:
   *
   * - `null` → preliminary request → delegate and continue
   * - `write` → validate → accumulate failure or enable `complete`
   * - `complete` → finalize and return
   *
   * @throws AutoBeCyclinicExhaustedError when `maxIterations` exceeded without
   *   a successful finalization.
   */
  public async orchestrate<WriteData, FinalResult>(
    ctx: AutoBeContext,
    process: (
      context: AutoBeCyclinicController.IProcessContext<Kind>,
    ) => Promise<AutoBeCyclinicController.IProcessResult<WriteData>>,
    validate: (
      writeData: WriteData,
    ) => Promise<AutoBeCyclinicController.IValidation>,
    finalize: (
      lastWrite: WriteData,
      result: AutoBeContext.IResult | null,
    ) => FinalResult | Promise<FinalResult>,
  ): Promise<FinalResult> {
    let lastWrite: WriteData | null = null;

    for (let i: number = 0; i < this.maxIterations; ++i) {
      const { result, action } = await process({
        preliminary: this.preliminary,
        failures: [...this.failures],
        writeSucceeded: this.writeSucceeded,
        iteration: i,
      });

      // PRELIMINARY
      if (action === null) {
        if (this.preliminary.getKinds().length === 0) {
          // No preliminary kinds available — LLM failed to call write.
          // Record as a failure so the next iteration's history explicitly
          // instructs the LLM to submit a write instead.
          this.failures.push({
            diagnostics:
              "You did not call write in the previous turn. " +
              "There is no preliminary data left to request. " +
              "You MUST call process({ request: { type: \"write\", ... } }) RIGHT NOW.",
            iteration: i,
          });
        } else {
          await orchestratePreliminary(ctx, {
            source_id: this.source_id,
            source: this.source,
            preliminary: this.preliminary,
            trial: i + 1,
            histories: result.histories,
          });
        }
        continue;
      }

      // WRITE → validate
      if (action.type === "write") {
        const validation = await validate(action.data);
        if (validation.success) {
          lastWrite = action.data;
          this.writeSucceeded = true;
        } else {
          this.failures.push({
            diagnostics: validation.diagnostics,
            iteration: i,
          });
        }
        continue;
      }

      // COMPLETE → finalize (pass result for event dispatch with metrics)
      if (action.type === "complete") {
        if (lastWrite === null) {
          // LLM called complete() before any successful write.
          // Give explicit feedback so the next iteration's history instructs
          // the LLM to submit a write instead.
          this.failures.push({
            diagnostics:
              "You called complete() but have not submitted a successful write yet. " +
              "You MUST call process({ request: { type: \"write\", ... } }) first, " +
              "then call complete() after the write passes validation.",
            iteration: i,
          });
          continue;
        }
        return await finalize(lastWrite, result);
      }
    }

    // Exhausted — still return last successful write if available (no event dispatch)
    if (lastWrite !== null) return await finalize(lastWrite, null);
    throw new AutoBeCyclinicExhaustedError();
  }
}

export namespace AutoBeCyclinicController {
  /** Extends preliminary props with cyclinic loop configuration. */
  export interface IProps<
    Kind extends AutoBePreliminaryKind,
  > extends AutoBePreliminaryController.IProps<Kind> {
    /** Defaults to `RAG_LIMIT * COMPILER_RETRY`. */
    maxIterations?: number;
  }

  /** Context passed to the `process` callback on each iteration. */
  export interface IProcessContext<Kind extends AutoBePreliminaryKind> {
    preliminary: AutoBePreliminaryController<Kind>;
    failures: IFailure[];
    writeSucceeded: boolean;
    iteration: number;
  }

  /** Result returned by the `process` callback. */
  export interface IProcessResult<WriteData> {
    result: AutoBeContext.IResult;
    action: { type: "write"; data: WriteData } | { type: "complete" } | null;
  }

  /** Record of a failed write validation attempt. */
  export interface IFailure {
    diagnostics: unknown;
    iteration: number;
  }

  /** Result of external validation (compilation). */
  export interface IValidation {
    success: boolean;
    diagnostics?: unknown;
  }
}
