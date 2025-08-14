import { AutoBePrisma } from "../prisma";
import { AutoBeEventBase } from "./AutoBeEventBase";
import { AutoBeTokenUsageEventBase } from "./AutoBeTokenUsageEventBase";

/**
 * Event fired when the Prisma agent organizes database tables into categorized
 * groups during the database design process.
 *
 * This event occurs when the Prisma agent has analyzed the requirements and
 * determined the complete scope of database tables needed, organizing them into
 * logical groups based on business domains and functional relationships. The
 * component organization follows domain-driven design principles to ensure
 * maintainable and coherent database architecture.
 *
 * The categorized components provide a clear roadmap for the schema generation
 * process, enabling systematic development of related tables while maintaining
 * proper dependencies and relationships across the database design.
 *
 * @author Samchon
 */
export interface AutoBePrismaComponentsEvent
  extends AutoBeEventBase<"prismaComponents">,
    AutoBeTokenUsageEventBase {
  /**
   * Initial thoughts on namespace classification criteria.
   *
   * Contains the AI agent's initial analysis and reasoning about how to
   * organize tables into different business domains/namespaces.
   *
   * **Example:**
   *
   *     "Based on the business requirements, I identify several key domains:
   *     - User-related entities should be grouped under 'Actors' namespace
   *     - Product and sales information under 'Sales' namespace
   *     - System configuration under 'Systematic' namespace"
   */
  thinking: string;

  /**
   * Review and refinement of the namespace classification.
   *
   * Contains the AI agent's review process, considering relationships between
   * tables and potential improvements to the initial classification.
   *
   * **Example:**
   *
   *     "Upon review, I noticed that 'shopping_channel_categories' has strong
   *     relationships with both channels and sales. However, since it primarily
   *     defines the channel structure, it should remain in 'Systematic' namespace."
   */
  review: string;

  /**
   * Final decision on namespace classification.
   *
   * Contains the AI agent's final reasoning and rationale for the chosen
   * namespace organization, explaining why this structure best serves the
   * business requirements.
   *
   * **Example:**
   *
   *     "Final decision: Organize tables into 3 main namespaces:
   *     1. Systematic - for channel and system configuration
   *     2. Actors - for all user types (customers, citizens, administrators)
   *     3. Sales - for product sales and related transactional data
   *     This structure provides clear separation of concerns and follows DDD principles."
   */
  decision: string;

  /**
   * Array of component groups organizing tables by business domain and
   * functional relationships.
   *
   * Each component represents a logical grouping of database tables that belong
   * to the same business domain or functional area. The grouping follows
   * domain-driven design principles where related tables are organized together
   * to maintain coherent schema files and enable systematic development.
   *
   * Each component includes the target filename for the schema file and the
   * list of table names that will be included in that domain. This organization
   * ensures that the generated Prisma schema files are logically structured and
   * maintainable, with clear separation of concerns across different business
   * areas.
   */
  components: AutoBePrisma.IComponent[];

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
