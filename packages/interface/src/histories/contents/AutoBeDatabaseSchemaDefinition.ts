import { AutoBeDatabase } from "../../database/AutoBeDatabase";
import { AutoBeDatabaseComponentTableDesign } from "./AutoBeDatabaseComponentTableDesign";

/**
 * Database schema definition produced by a single schema generation or review
 * call.
 *
 * Each AI function call outputs exactly one target table model together with a
 * list of newly discovered table designs. The single-model constraint keeps the
 * output payload small enough to fit within the LLM's maximum output token
 * limit, while `newDesigns` lets the agent declare additional tables that
 * should be generated in subsequent calls through the normal pipeline.
 *
 * @author Samchon
 */
export interface AutoBeDatabaseSchemaDefinition {
  /**
   * The single database table model produced by this call.
   *
   * Always represents the target table that was assigned to the agent. Limiting
   * the output to one model prevents the response from exceeding the LLM's
   * maximum output token budget.
   */
  model: AutoBeDatabase.IModel;

  /**
   * Lightweight designs for additional tables discovered during generation or
   * review.
   *
   * When the agent determines that 1NF decomposition or other normalization
   * requires child tables that do not yet exist, it declares them here as
   * name+description pairs rather than full model definitions.
   *
   * These designs are fed back into the schema generation pipeline so that each
   * new table is produced by its own dedicated call.
   */
  newDesigns: AutoBeDatabaseComponentTableDesign[];
}
