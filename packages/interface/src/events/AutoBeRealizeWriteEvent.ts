import {
  AutoBeRealizeOperationFunction,
  AutoBeRealizeTransformerFunction,
  AutoBeRealizeCollectorFunction,
} from "../histories/contents";
import { AutoBeAggregateEventBase } from "./base/AutoBeAggregateEventBase";
import { AutoBeEventBase } from "./base/AutoBeEventBase";
import { AutoBeProgressEventBase } from "./base/AutoBeProgressEventBase";

/**
 * Event fired during the Realize phase when code files are generated.
 *
 * This unified event covers three types of code generation during the
 * implementation process:
 *
 * - **Operation** (`kind: "operation"`): API operation implementation files
 *   that contain business logic for specific endpoints
 * - **Transformer** (`kind: "transformer"`): DTO transformation modules that
 *   convert Prisma query results to API response DTOs (DB → API)
 * - **Collector** (`kind: "collector"`): Data collection modules that prepare
 *   Prisma input data from API request DTOs (API → DB)
 *
 * Each kind generates reusable TypeScript code that contributes to the complete
 * application implementation, with operation files orchestrating business logic
 * while transformer and collector modules provide shared data transformation
 * utilities.
 *
 * @author Samchon
 */
export interface AutoBeRealizeWriteEvent
  extends AutoBeEventBase<"realizeWrite">,
    AutoBeProgressEventBase,
    AutoBeAggregateEventBase {
  /**
   * Generated function with complete metadata.
   *
   * Contains the complete function information including kind discriminator,
   * file location, implementation content, and type-specific metadata (endpoint,
   * DTO type names, etc).
   *
   * The `kind` discriminator enables type-safe pattern matching:
   * - `kind: "operation"`: API operation implementation with endpoint and name
   * - `kind: "transformer"`: DB → DTO transformer with schema and DTO names
   * - `kind: "collector"`: DTO → DB collector with DTO name
   */
  function:
    | AutoBeRealizeOperationFunction
    | AutoBeRealizeTransformerFunction
    | AutoBeRealizeCollectorFunction;

  /**
   * Iteration number of the requirements analysis this implementation reflects.
   *
   * Indicates which version of the requirements analysis this implementation
   * work is based on. This step number ensures that the implementation progress
   * is aligned with the current requirements and helps track the development of
   * implementation components as they evolve with changing business needs.
   *
   * The step value enables proper synchronization between implementation
   * activities and the underlying requirements, ensuring that the generated
   * code remains relevant to the current project scope and business objectives.
   */
  step: number;
}
