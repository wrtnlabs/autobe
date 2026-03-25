import { AutoBeDatabase } from "../../database/AutoBeDatabase";
import { AutoBeDatabaseComponentTableDesign } from "./AutoBeDatabaseComponentTableDesign";

/**
 * Output of a single schema generation or review call.
 *
 * One target table model + lightweight designs for newly discovered child
 * tables. Single-model constraint keeps output within LLM token budget.
 *
 * @author Samchon
 */
export interface AutoBeDatabaseSchemaDefinition {
  /** The single database table model produced by this call. */
  model: AutoBeDatabase.IModel;

  /**
   * Name+description pairs for child tables discovered during generation (1NF
   * decomposition, junction tables, etc.). Each feeds back into the pipeline as
   * a separate generation call.
   */
  newDesigns: AutoBeDatabaseComponentTableDesign[];
}
