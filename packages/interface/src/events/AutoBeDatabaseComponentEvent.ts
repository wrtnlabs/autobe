import { AutoBeDatabaseComponent } from "../histories/contents";
import { AutoBeAggregateEventBase } from "./base/AutoBeAggregateEventBase";
import { AutoBeEventBase } from "./base/AutoBeEventBase";
import { AutoBeProgressEventBase } from "./base/AutoBeProgressEventBase";

/**
 * Event fired when the Database agent completes table design for a single
 * database component during the database design process.
 *
 * This event occurs when the Database agent has taken a component skeleton
 * (namespace and filename already determined by the DATABASE_GROUP phase) and
 * filled in all the table designs for that specific component. Each event
 * represents the completion of ONE component's table design.
 *
 * Multiple events of this type are emitted in sequence as the Database agent
 * processes each component skeleton from the group, enabling real-time progress
 * tracking for component-by-component table generation.
 *
 * @author Samchon
 */
export interface AutoBeDatabaseComponentEvent
  extends
    AutoBeEventBase<"databaseComponent">,
    AutoBeAggregateEventBase,
    AutoBeProgressEventBase {
  /**
   * Analysis of the component's scope and table requirements.
   *
   * Documents the agent's understanding of this component's domain, including
   * what the component's business purpose is, what entities from the
   * requirements belong to this component, what relationships exist between
   * these entities, and what normalization patterns were identified.
   */
  analysis: string;

  /**
   * Rationale for the table design decisions.
   *
   * Explains why tables were designed this way, including why each table was
   * created, why certain entities were kept separate vs combined, what
   * normalization principles were applied, and how the tables fulfill the
   * component's rationale.
   */
  rationale: string;

  /**
   * The completed database component with its table designs.
   *
   * Contains the single database component that was completed in this event.
   * The component skeleton (namespace, filename, thinking, review, rationale)
   * was provided by the DATABASE_GROUP phase, and this event represents the
   * completion of filling in the tables array for that component.
   *
   * The component includes:
   *
   * - namespace: Business domain namespace (from skeleton)
   * - filename: Prisma schema filename (from skeleton)
   * - thinking: Initial reasoning about component purpose (from skeleton)
   * - review: Review of component scope (from skeleton)
   * - rationale: Final justification for component (from skeleton)
   * - tables: Array of complete table designs (FILLED IN by this agent)
   *
   * Each table in the tables array includes:
   * - name: snake_case plural table name
   * - description: Purpose and contents of the table
   */
  component: AutoBeDatabaseComponent;

  /**
   * Iteration number of the requirements analysis this component organization
   * was performed for.
   *
   * Indicates which version of the requirements analysis this table
   * organization reflects. This step number ensures that the database component
   * structure is aligned with the current requirements and helps track the
   * evolution of database architecture as business requirements change.
   *
   * The step value enables proper synchronization between database organization
   * and the underlying requirements, ensuring that the schema structure remains
   * relevant to the current project scope and business objectives.
   */
  step: number;
}
