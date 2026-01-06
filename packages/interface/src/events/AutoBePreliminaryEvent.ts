import { AutoBeOpenApi } from "../openapi/AutoBeOpenApi";
import { AutoBePreliminaryKind } from "../typings/AutoBePreliminaryKind";
import { AutoBeEventSource } from "./AutoBeEventSource";
import { AutoBeEventBase } from "./base/AutoBeEventBase";

/**
 * Event fired when the preliminary validation agent detects inconsistencies
 * between existing and newly requested items.
 *
 * This event occurs during the preliminary validation phase that runs before
 * major pipeline operations. The preliminary agent compares what currently
 * exists in the system (e.g., database schemas, interface operations, analysis
 * files) against what the AI agent is requesting to create or modify. When
 * discrepancies are detected - such as requesting to create items that already
 * exist, or referencing items that don't exist - this event is fired.
 *
 * The preliminary validation serves as a safety mechanism to prevent
 * inconsistent state and ensure that agents have accurate context about what
 * has already been generated. This helps avoid duplicate generation, maintain
 * referential integrity, and catch potential issues early in the pipeline
 * before expensive generation operations begin.
 *
 * The event captures both the existing state and the requested changes,
 * allowing the system to reconcile differences through intelligent merging,
 * correction, or user intervention. The trial counter enables retry logic when
 * the agent needs multiple attempts to align its requests with reality.
 *
 * @author Samchon
 */
export interface AutoBePreliminaryEvent<
  Function extends AutoBePreliminaryKind = AutoBePreliminaryKind,
> extends AutoBeEventBase<"preliminary"> {
  /**
   * Source agent or operation that triggered preliminary validation.
   *
   * Identifies which AutoBE agent or operation is attempting to perform work
   * that requires preliminary validation. This cannot be "facade" or
   * "preliminary" itself, as those don't generate content that needs
   * validation. The source typically represents operations like schema
   * generation, interface design, or test creation.
   */
  source: Exclude<AutoBeEventSource, "facade" | "preliminary">;

  /**
   * Unique identifier of the source event that triggered validation.
   *
   * Provides traceability by linking this preliminary validation event back to
   * the specific source event (e.g., a particular database schema generation
   * or interface operation design) that needed validation. This enables
   * precise tracking of which generation attempt encountered inconsistencies.
   */
  source_id: string;

  /**
   * Type of preliminary validation being performed.
   *
   * Specifies what kind of items are being validated (e.g., "databaseSchemas",
   * "interfaceOperations", "analysisFiles"). The validation type determines
   * how existing and requested items are compared and what reconciliation
   * strategies are appropriate for resolving inconsistencies.
   */
  function: Function;

  /**
   * Items that currently exist in the system.
   *
   * Contains the current state of items that have already been generated or
   * processed. For "interfaceOperations", this is an array of endpoint
   * definitions. For other validation types, this is an array of string
   * identifiers (e.g., schema names, file names).
   *
   * This existing state serves as the ground truth against which new requests
   * are validated to detect inconsistencies and prevent duplicate or
   * conflicting generation.
   */
  existing: Function extends "interfaceOperations"
    ? AutoBeOpenApi.IEndpoint[]
    : string[];

  /**
   * Items that the agent is requesting to create or work with.
   *
   * Contains what the AI agent wants to generate or reference. For
   * "interfaceOperations", this is an array of endpoint definitions the agent
   * wants to create. For other types, this is an array of string identifiers
   * for items the agent intends to work with.
   *
   * The preliminary validator compares these requests against existing items
   * to identify discrepancies such as duplicates, missing dependencies, or
   * inconsistent references that need to be resolved before proceeding.
   */
  requested: Function extends "interfaceOperations"
    ? AutoBeOpenApi.IEndpoint[]
    : string[];

  /**
   * Retry attempt number for this preliminary validation.
   *
   * Tracks how many times the agent has attempted to resolve the
   * inconsistencies detected by preliminary validation. This counter enables
   * intelligent retry logic and prevents infinite loops when the agent
   * struggles to align its requests with existing state, allowing the system
   * to escalate or fail gracefully after reasonable attempts.
   */
  trial: number;
}
