import { tags } from "typia";

import { AutoBeDatabaseComponentTableDesign } from "./AutoBeDatabaseComponentTableDesign";

/**
 * Interface representing a logical grouping of database tables organized by
 * business domain for schema file generation.
 *
 * Components provide a systematic way to organize database tables into
 * coherent groups following domain-driven design principles. Each component
 * represents a specific business domain or functional area that will be
 * generated as a separate Prisma schema file, ensuring maintainable and
 * logically structured database architecture.
 *
 * This interface is primarily used during the database design phase when the
 * Database agent analyzes requirements and determines the complete scope of
 * tables needed, then organizes them into logical groups based on business
 * relationships and functional dependencies.
 *
 * ## Usage in Schema Generation Process
 *
 * Components serve as the blueprint for generating multiple Prisma schema
 * files:
 *
 * 1. **Requirements Analysis**: AI agent identifies all required tables from
 *    business requirements
 * 2. **Domain Grouping**: Tables are organized into components based on business
 *    domains and functional relationships
 * 3. **File Generation**: Each component becomes a separate .prisma file
 *    containing related models
 * 4. **Dependency Management**: Components are ordered to handle cross-domain
 *    relationships properly
 *
 * ## Domain Organization Examples
 *
 * Based on typical business applications, components commonly include:
 *
 * - **Systematic**: Core system tables (channels, sections, configurations)
 * - **Actors**: User management (customers, citizens, administrators)
 * - **Sales**: Product catalog and sales entities
 * - **Carts**: Shopping cart and item management
 * - **Orders**: Order processing and fulfillment
 * - **Coupons**: Discount and promotion systems
 * - **Coins**: Digital currency and mileage systems
 * - **Inquiries**: Customer support and FAQ systems
 * - **Favorites**: User preference and wishlist management
 * - **Articles**: Content management and BBS systems
 *
 * ## Relationship to {@link AutoBeDatabase.IFile}
 *
 * Each AutoBeDatabaseComponent serves as a blueprint for generating one IFile
 * during the schema generation process. The component's metadata (filename,
 * namespace, tables) is used to structure the actual Prisma schema file with
 * proper models, relationships, and indexes.
 *
 * @see AutoBeDatabase.IFile For the actual schema file structure generated from
 *   components
 * @see AutoBeDatabaseComponentEvent For the event that delivers component
 *   organization results
 * @author Samchon
 */
export interface AutoBeDatabaseComponent {
  /**
   * Target filename for the Prisma schema file containing this component's
   * tables.
   *
   * Follows the naming convention `schema-{number}-{domain}.prisma` where the
   * number indicates dependency order and domain represents the business
   * area.
   */
  filename: string & tags.Pattern<"^[a-zA-Z0-9._-]+\\.prisma$">;

  /**
   * Business domain namespace that groups related models.
   *
   * Used in Prisma documentation comments as "@\namespace directive".
   * Examples from uploaded schemas: "Systematic", "Actors", "Sales", "Carts",
   * "Orders", "Coupons", "Coins", "Inquiries", "Favorites", "Articles"
   */
  namespace: string;

  /**
   * Initial thoughts on why these tables belong together.
   *
   * **Example:**
   *
   *     "These tables all relate to user management and authentication.
   *     They share common patterns like user identification and access control."
   */
  thinking: string;

  /**
   * Review considerations for this component grouping.
   *
   * **Example:**
   *
   *     "Reviewed relationships with other domains. While customers create orders,
   *     the customer entity itself is fundamentally about user identity, not sales."
   */
  review: string;

  /**
   * Final rationale for this component's composition.
   *
   * **Example:**
   *
   *     "This component groups all actor-related tables to maintain a clear
   *     separation between identity management and business transactions."
   */
  rationale: string;

  /**
   * Array of table designs that will be included in this component's schema
   * file.
   *
   * Contains all database tables that belong to this business domain,
   * each with a name and description explaining its purpose. This ensures
   * logical grouping, proper organization, and clear documentation of
   * related data structures.
   */
  tables: Array<AutoBeDatabaseComponentTableDesign> & tags.MinItems<1>;
}
