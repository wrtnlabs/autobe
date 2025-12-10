import {
  AutoBeEvent,
  AutoBeHistory,
  IAutoBeGetFilesOptions,
} from "@autobe/interface";

import { AutoBeTokenUsage } from "./context/AutoBeTokenUsage";
import { emplaceMap } from "./utils/emplaceMap";

/**
 * Base class for AutoBE agents providing event subscription capabilities.
 *
 * Implements Observer pattern with type-safe event handling through generic
 * event type mapping.
 *
 * @author Samchon
 */
export abstract class AutoBeAgentBase {
  /** @internal */
  private readonly listeners_: Map<
    string,
    Set<(event: AutoBeEvent) => Promise<void> | void>
  >;

  public constructor() {
    this.listeners_ = new Map();
  }

  /**
   * Retrieves all generated files from the current development session.
   *
   * Transforms the development process into deployable artifacts including
   * requirements documentation, database schemas, API specifications, NestJS
   * implementation code, and test suites. The generated files represent a fully
   * functional backend application ready for deployment.
   *
   * @param options Configuration specifying database system and code generation
   *   preferences
   * @returns Promise resolving to file paths mapped to complete file contents
   */
  public abstract getFiles(
    options?: Partial<IAutoBeGetFilesOptions>,
  ): Promise<Record<string, string>>;

  /**
   * Retrieves the complete conversation and development history.
   *
   * Returns chronologically ordered record of all events including user
   * messages, assistant responses, development activities, and progress events.
   * This history enables conversation replay and development process analysis.
   *
   * @returns Array of all history records from session start
   */
  public abstract getHistories(): AutoBeHistory[];

  /**
   * Retrieves comprehensive AI token usage statistics for the current session.
   *
   * Returns detailed breakdown of token consumption across all specialized
   * agents and processing phases, enabling cost monitoring and performance
   * analysis. Includes aggregate totals and component-specific breakdowns.
   *
   * @returns Token usage statistics with breakdowns by agent and operation type
   */
  public abstract getTokenUsage(): AutoBeTokenUsage;

  /**
   * Registers an event listener for specific development phase events.
   *
   * Enables real-time notifications about conversation flow, development
   * progress, and completion events. The type-safe event system ensures
   * listeners receive properly typed events corresponding to their registration
   * type.
   *
   * @param type Event type to listen for
   * @param listener Callback function receiving the typed event when fired
   * @returns This instance for method chaining
   */
  public on<Type extends AutoBeEvent.Type>(
    type: Type,
    listener: (event: AutoBeEvent.Mapper[Type]) => Promise<void> | void,
  ): this {
    emplaceMap(this.listeners_, type, () => new Set()).add(
      listener as (event: AutoBeEvent) => any,
    );
    return this;
  }

  /**
   * Unregisters a previously registered event listener.
   *
   * Removes the specified listener from the notification system. The listener
   * function reference must exactly match the function originally registered
   * with {@link on} for successful removal.
   *
   * @param type Event type the listener was registered for
   * @param listener The exact listener function reference to remove
   * @returns This instance for method chaining
   */
  public off<Type extends AutoBeEvent.Type>(
    type: Type,
    listener: (event: AutoBeEvent.Mapper[Type]) => Promise<void> | void,
  ): this {
    const set = this.listeners_.get(type);
    if (set === undefined) return this;

    set.delete(listener as (event: AutoBeEvent) => any);
    if (set.size === 0) this.listeners_.delete(type);
    return this;
  }

  /** @internal */
  protected async dispatch(event: AutoBeEvent): Promise<void> {
    const set = this.listeners_.get(event.type);
    if (set === undefined) return;
    await Promise.all(
      Array.from(set).map(async (listener) => {
        try {
          await listener(event);
        } catch {}
      }),
    );
  }
}
