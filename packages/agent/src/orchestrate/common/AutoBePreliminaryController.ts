import { IMicroAgenticaHistoryJson } from "@agentica/core";
import { AutoBeEventSource, AutoBePreliminaryKind } from "@autobe/interface";
import {
  ILlmApplication,
  IValidation,
  OpenApiTypeChecker,
} from "@samchon/openapi";
import { IJsonSchemaApplication } from "typia";
import { v7 } from "uuid";

import { AutoBeConfigConstant } from "../../constants/AutoBeConfigConstant";
import { AutoBeContext } from "../../context/AutoBeContext";
import { AutoBeState } from "../../context/AutoBeState";
import { transformPreliminaryHistory } from "./histories/transformPreliminaryHistory";
import { complementPreliminaryCollection } from "./internal/complementPreliminaryCollection";
import { createPreliminaryCollection } from "./internal/createPreliminaryCollection";
import { fixPreliminaryApplication } from "./internal/fixPrelminaryApplication";
import { validatePreliminary } from "./internal/validatePreliminary";
import { orchestratePreliminary } from "./orchestratePreliminary";
import { IAutoBePreliminaryRequest } from "./structures/AutoBePreliminaryRequest";
import { IAutoBeOrchestrateResult } from "./structures/IAutoBeOrchestrateResult";
import { IAutoBePreliminaryCollection } from "./structures/IAutoBePreliminaryCollection";

/**
 * RAG controller for incremental context loading.
 *
 * Manages LLM's incremental data requests via function calling, preventing
 * duplicates and auto-resolving dependencies.
 *
 * - `all`: globally available data (from state)
 * - `local`: currently loaded data (agent context)
 * - Auto-complements prerequisites, $ref dependencies, and neighbors
 *
 * @author Samchon
 */
export class AutoBePreliminaryController<Kind extends AutoBePreliminaryKind> {
  // METADATA
  private readonly source: Exclude<AutoBeEventSource, "facade" | "preliminary">;
  private readonly source_id: string;
  private readonly kinds: Kind[];
  private readonly argumentTypeNames: string[];

  // PRELIMINARY DATA
  private readonly all: Pick<IAutoBePreliminaryCollection, Kind>;
  private readonly local: Pick<IAutoBePreliminaryCollection, Kind>;
  private readonly config: AutoBePreliminaryController.IConfig<Kind>;
  private readonly state: AutoBeState;

  /**
   * Initializes controller with data collections and auto-complements
   * dependencies.
   *
   * @param props Constructor configuration including kinds, state, and initial
   *   data.
   */
  public constructor(props: AutoBePreliminaryController.IProps<Kind>) {
    this.source = props.source;
    this.source_id = v7();
    this.kinds = props.kinds;
    this.config = {
      prisma: props.config?.prisma ?? "text",
    } as any;

    this.argumentTypeNames = (() => {
      const func = props.application.functions.find(
        (f) => f.name === "process",
      );
      if (func === undefined)
        throw new Error("Unable to find 'process' function in application.");

      const param = func.parameters[0]?.schema;
      if (
        param === undefined ||
        OpenApiTypeChecker.isReference(param) === false
      )
        throw new Error(
          "'process' function parameter is not a reference type.",
        );
      const schema =
        props.application.components.schemas?.[param.$ref.split("/").pop()!];
      if (schema === undefined || OpenApiTypeChecker.isObject(schema) === false)
        throw new Error(
          "'process' function parameter reference is not an object type.",
        );
      const request = schema.properties?.request;
      if (
        request === undefined ||
        OpenApiTypeChecker.isOneOf(request) === false
      )
        throw new Error(
          "'process' function parameter.request is not a oneOf type.",
        );
      else if (
        request.oneOf.length === 0 ||
        request.oneOf.every(
          (sch) => OpenApiTypeChecker.isReference(sch) === false,
        )
      )
        throw new Error(
          "'process' function parameter.request oneOf does not contain any reference type.",
        );
      return request.oneOf.map((sch) => {
        const ref = (sch as any).$ref;
        return ref.split("/").pop()!;
      });
    })();

    this.state = props.state;
    this.all = createPreliminaryCollection(props.state, props.all);
    this.local = createPreliminaryCollection(null, props.local);

    complementPreliminaryCollection({
      kinds: props.kinds,
      all: this.all as IAutoBePreliminaryCollection,
      local: this.local as IAutoBePreliminaryCollection,
      prerequisite: false,
    });
  }

  /**
   * Validates request for duplicates and non-existent items.
   *
   * @param input LLM's function calling request to validate.
   * @returns Validation result with errors if duplicates or non-existent items
   *   found.
   */
  public validate(
    input: IAutoBePreliminaryRequest<Kind>,
  ): IValidation<IAutoBePreliminaryRequest<Kind>> {
    return validatePreliminary(this, input);
  }

  /**
   * Generates dynamic system prompts with `LOADED`/`AVAILABLE` lists.
   *
   * @returns Assistant and system messages with loaded/available item lists.
   */
  public getHistories(): IMicroAgenticaHistoryJson[] {
    return transformPreliminaryHistory(this);
  }

  /**
   * Returns the orchestration source that created this controller.
   *
   * @returns Source event type (e.g., `"realizeWrite"`, `"interfaceSchema"`).
   */
  public getSource(): Exclude<AutoBeEventSource, "facade" | "preliminary"> {
    return this.source;
  }

  /**
   * Returns data types enabled for this controller.
   *
   * @returns Array of enabled kinds (e.g., `["databaseSchemas",
   *   "interfaceSchemas"]`).
   */
  public getKinds(): Kind[] {
    return this.kinds;
  }

  /**
   * Returns configuration (e.g., database schema format: `"ast"` | `"text"`).
   *
   * @returns Controller configuration object.
   */
  public getConfig(): AutoBePreliminaryController.IConfig<Kind> {
    return this.config;
  }

  /**
   * Returns function calling type names available in LLM application.
   *
   * @returns Array of request type names from `oneOf` union.
   */
  public getArgumentTypeNames(): string[] {
    return this.argumentTypeNames;
  }

  /**
   * Returns all globally available data from state.
   *
   * @returns Complete dataset that can be requested.
   */
  public getAll(): Pick<IAutoBePreliminaryCollection, Kind> {
    return this.all;
  }

  /**
   * Returns currently loaded data in agent context.
   *
   * @returns Subset of data already provided to LLM.
   */
  public getLocal(): Pick<IAutoBePreliminaryCollection, Kind> {
    return this.local;
  }

  /**
   * Returns the current AutoBe state.
   *
   * @returns Current pipeline state containing all phase histories.
   */
  public getState(): AutoBeState {
    return this.state;
  }

  /**
   * Dynamically adjusts LLM application schema at runtime.
   *
   * Removes `getPreviousXXX` types from union/oneOf when no previous iteration
   * exists. Mutates application's `anyOf`/`oneOf` array, `$defs`, and
   * `discriminator` mapping. Also erases corresponding `kinds` from
   * controller's `all`/`local` collections.
   *
   * @param application LLM application to modify (mutated in-place)
   */
  public fixApplication(
    application: ILlmApplication,
    enumerable: boolean = false,
  ): ILlmApplication {
    fixPreliminaryApplication({
      state: this.state,
      preliminary: this,
      application,
      enumerable,
    });
    return application;
  }

  /**
   * Runs RAG loop for incremental context loading.
   *
   * Repeats until process returns non-null value or exceeds the maximum number
   * of iterations (`AutoBeConfigConstant.RAG_LIMIT`). Each iteration: LLM
   * requests data → `orchestratePreliminary` adds to `local` → next iteration
   * with updated context.
   *
   * @param ctx AutoBe context for `conversate` and state access.
   * @param process Callback that runs LLM `conversate` and returns result.
   * @returns Final value when process returns non-null or throws after
   *   exceeding `AutoBeConfigConstant.RAG_LIMIT` retries.
   */
  public async orchestrate<T>(
    ctx: AutoBeContext,
    process: (
      out: (
        result: AutoBeContext.IResult,
      ) => (value: T | null) => IAutoBeOrchestrateResult<T>,
    ) => Promise<IAutoBeOrchestrateResult<T>>,
  ): Promise<T | never> {
    for (let i: number = 0; i < AutoBeConfigConstant.RAG_LIMIT; ++i) {
      const result: IAutoBeOrchestrateResult<T> = await process(
        (x) => (value) => ({
          ...x,
          value,
        }),
      );
      if (result.value !== null) return result.value;

      await orchestratePreliminary(ctx, {
        source_id: this.source_id,
        source: this.source,
        preliminary: this,
        trial: i + 1,
        histories: result.histories,
      });
    }
    throw new Error(
      "Preliminary process exceeded the maximum number of retries.",
    );
  }
}
export namespace AutoBePreliminaryController {
  /** Constructor props for `AutoBePreliminaryController`. */
  export interface IProps<Kind extends AutoBePreliminaryKind> {
    /** Orchestration source creating this controller. */
    source: Exclude<AutoBeEventSource, "facade" | "preliminary">;

    /** LLM application schema for function calling validation. */
    application: IJsonSchemaApplication;

    /**
     * Data types to enable (e.g., `["databaseSchemas",
     * "interfaceOperations"]`).
     */
    kinds: Kind[];

    /** Current AutoBe state containing generated artifacts. */
    state: AutoBeState;

    /** Override globally available data (defaults to state). */
    all?: Partial<Pick<IAutoBePreliminaryCollection, Kind>>;

    /** Initial loaded data for agent context. */
    local?: Partial<Pick<IAutoBePreliminaryCollection, Kind>>;

    /** Controller configuration options. */
    config?: Partial<IConfig<Kind>>;
  }

  /** Result from orchestration process callback. */
  export interface IProcessResult<T> {
    /** Returned value if task completed, `undefined` if needs more context. */
    value: T | undefined;

    /** Conversation histories including function calling. */
    histories: IMicroAgenticaHistoryJson[];
  }

  /** Controller configuration options. */
  export interface IConfig<Kind extends AutoBePreliminaryKind> {
    /** Database schema format: `"ast"` (JSON) or `"text"` (Prisma DSL). */
    prisma: Kind extends "databaseSchemas" ? "ast" | "text" : never;
  }
}
