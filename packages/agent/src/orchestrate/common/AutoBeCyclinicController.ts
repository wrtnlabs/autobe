import { AutoBeEventSource, AutoBePreliminaryKind } from "@autobe/interface";
import { LlmTypeChecker } from "@typia/utils";
import { ILlmApplication, ILlmSchema } from "typia";
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
   * Removes `IComplete` from the request union when no write has succeeded.
   *
   * Same schema mutation pattern as
   * {@link AutoBePreliminaryController.fixApplication}.
   */
  public fixCompleteAvailability(
    application: ILlmApplication,
  ): ILlmApplication {
    if (this.writeSucceeded) return application;

    const func = application.functions.find((f) => f.name === "process");
    if (func === undefined) return application;

    const request: ILlmSchema | undefined = func.parameters.properties.request;
    if (request === undefined) return application;
    if (LlmTypeChecker.isAnyOf(request) === false) return application;

    // biome-ignore lint: type narrowing insufficient after isAnyOf guard
    const anyOfSchema = request as ILlmSchema.IAnyOf;
    const children = anyOfSchema.anyOf as ILlmSchema.IReference[];
    // biome-ignore lint: x-discriminator is a runtime extension property
    const mapping: Record<string, string> =
      (anyOfSchema as unknown as Record<string, unknown>)["x-discriminator"] !=
      null
        ? ((
            (anyOfSchema as unknown as Record<string, unknown>)[
              "x-discriminator"
            ] as Record<string, Record<string, string>>
          ).mapping ?? {})
        : {};

    // Remove IComplete from anyOf
    const completeIdx = children.findIndex(
      (c) => c.$ref.endsWith("/IComplete") || c.$ref.endsWith(".IComplete"),
    );
    if (completeIdx !== -1) children.splice(completeIdx, 1);

    // Remove from discriminator mapping
    delete mapping["complete"];

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

      // PRELIMINARY
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

      // COMPLETE → finalize
      if (action.type === "complete") {
        if (lastWrite === null) continue; // safety: should not happen via union narrowing
        return finalize(lastWrite);
      }
    }

    // Exhausted — still return last successful write if available
    if (lastWrite !== null) return finalize(lastWrite);
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
