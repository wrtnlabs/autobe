import {
  AutoBeRealizeCollectorPlan,
  AutoBeRealizeTransformerPlan,
} from "../histories";
import { AutoBeAggregateEventBase } from "./base/AutoBeAggregateEventBase";
import { AutoBeEventBase } from "./base/AutoBeEventBase";
import { AutoBeProgressEventBase } from "./base/AutoBeProgressEventBase";

/**
 * Event fired when the Realize planning phase completes collector and
 * transformer planning.
 *
 * This event occurs after the planning orchestrators (REALIZE_COLLECTOR_PLAN
 * and REALIZE_TRANSFORMER_PLAN) have analyzed operation requirements and
 * determined which collectors and transformers must be generated. The planning
 * phase solves dependency resolution by identifying all required code modules
 * before the write phase begins, enabling parallel generation and ensuring all
 * dependencies exist.
 *
 * The planning results provide visibility into the generation strategy before
 * actual code generation starts, allowing the frontend to display what will be
 * generated and enabling users to track progress as each planned item is
 * realized.
 *
 * @author Samchon
 */
export interface AutoBeRealizePlanEvent
  extends AutoBeEventBase<"realizePlan">,
    AutoBeProgressEventBase,
    AutoBeAggregateEventBase {
  /**
   * Complete list of collectors and transformers planned for generation.
   *
   * Contains planning results from both REALIZE_COLLECTOR_PLAN and
   * REALIZE_TRANSFORMER_PLAN orchestrators. Each plan entry includes:
   *
   * - Kind discriminator ("collector" or "transformer")
   * - Target DTO type name or function name
   * - Agent's reasoning for planning this module
   * - Associated Prisma schema name
   *
   * The order may reflect generation dependencies, though the orchestrator
   * determines actual execution order. The frontend can use this to display a
   * checklist of items to generate and show progress as each item completes.
   */
  plans: Array<AutoBeRealizeCollectorPlan | AutoBeRealizeTransformerPlan>;

  /**
   * Iteration number of the requirements analysis this planning reflects.
   *
   * Indicates which version of the requirements analysis this planning work is
   * based on. This step number ensures that the planning decisions are aligned
   * with the current requirements and helps track the development of
   * implementation strategy as requirements evolve.
   *
   * The step value enables proper synchronization between planning activities
   * and the underlying requirements, ensuring that the generation plan remains
   * relevant to the current project scope and business objectives.
   */
  step: number;
}
