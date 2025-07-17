import { AutoBePrisma } from "../prisma";
import { AutoBeEventBase } from "./AutoBeEventBase";

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
  extends AutoBeEventBase<"prismaComponents"> {
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
