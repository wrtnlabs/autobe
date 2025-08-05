import { tags } from "typia";

/**
 * AST type system for programmatic Prisma ORM schema generation through AI
 * function calling.
 *
 * This namespace defines a comprehensive Abstract Syntax Tree structure that
 * enables AI agents to construct complete Prisma schema files at the AST level.
 * Each type corresponds to specific Prisma Schema Language (PSL) constructs,
 * allowing precise control over generated database schemas while maintaining
 * type safety and business logic accuracy.
 *
 * ## Core Purpose
 *
 * The system is designed for systematic generation where AI function calls
 * build database schemas step-by-step, mapping business requirements to
 * executable Prisma schema code. Instead of generating raw PSL strings, AI
 * agents construct structured AST objects that represent:
 *
 * - Complete database schemas organized by business domains
 * - Properly typed models with relationships and constraints
 * - Performance-optimized indexes for common query patterns
 * - Business-appropriate data types and validation rules
 *
 * ## Architecture Overview
 *
 * - **IApplication**: Root container representing the entire database schema
 * - **IFile**: Domain-specific schema files organized by business functionality
 * - **IModel**: Database tables representing business entities with full
 *   relationship mapping
 * - **Fields**: Primary keys, foreign keys, and business data fields with proper
 *   typing
 * - **Indexes**: Performance optimization through unique, regular, and full-text
 *   search indexes
 *
 * ## Domain-Driven Schema Organization
 *
 * Schemas are typically organized into multiple domain-specific files following
 * DDD principles:
 *
 * - Core/System: Foundation entities and application configuration
 * - Identity: User management, authentication, and authorization
 * - Business Logic: Domain-specific entities and workflows
 * - Transactions: Financial operations and payment processing
 * - Communication: Messaging, notifications, and user interactions
 * - Content: Media management, documentation, and publishing systems
 * - Analytics: Reporting, metrics, and business intelligence data
 *
 * ## Database Design Patterns
 *
 * The generated schemas follow enterprise-grade patterns:
 *
 * - UUID primary keys for distributed system compatibility and security
 * - Snapshot/versioning tables for audit trails and data history
 * - Junction tables for many-to-many relationship management
 * - Materialized views for performance optimization of complex queries
 * - Soft deletion patterns with timestamp-based lifecycle management
 * - Full-text search capabilities using PostgreSQL GIN indexes
 *
 * Each generated schema reflects real business workflows where entities
 * maintain proper relationships, data integrity constraints, and performance
 * characteristics suitable for production applications handling complex
 * business logic and high query volumes.
 *
 * @author Samchon
 */
export namespace AutoBePrisma {
  /**
   * Root interface representing the entire Prisma application schema.
   *
   * Contains multiple schema files that will be generated, typically organized
   * by business domain. Based on the uploaded schemas, applications usually
   * contain 8-10 files covering different functional areas like user
   * management, sales, orders, etc.
   */
  export interface IApplication {
    /**
     * Array of Prisma schema files to be generated.
     *
     * Each file represents a specific business domain or functional area.
     * Examples from uploaded schemas: systematic (channels/sections), actors
     * (users/customers), sales (products/snapshots), carts, orders, coupons,
     * coins (deposits/mileage), inquiries, favorites, and articles (BBS
     * system).
     */
    files: IFile[];
  }

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
   * Prisma agent analyzes requirements and determines the complete scope of
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
   * ## Relationship to {@link AutoBePrisma.IFile}
   *
   * Each IComponent serves as a blueprint for generating one IFile during the
   * schema generation process. The component's metadata (filename, namespace,
   * tables) is used to structure the actual Prisma schema file with proper
   * models, relationships, and indexes.
   *
   * @see IFile For the actual schema file structure generated from components
   * @see AutoBePrismaComponentsEvent For the event that delivers component
   * organization results
   */
  export interface IComponent {
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
     * Array of table names that will be included in this component's schema
     * file.
     *
     * Contains all database table names that belong to this business domain,
     * ensuring logical grouping and proper organization of related data
     * structures.
     */
    tables: Array<string & tags.Pattern<"^[a-z][a-z0-9_]*$">> &
      tags.MinItems<1>;
  }

  /**
   * Interface representing a single Prisma schema file within the application.
   *
   * Each file focuses on a specific business domain and contains related
   * models. File organization follows domain-driven design principles as seen
   * in the uploaded schemas.
   */
  export interface IFile {
    /**
     * Name of the schema file to be generated.
     *
     * Should follow the naming convention: "schema-{number}-{domain}.prisma"
     * Examples: "schema-02-systematic.prisma", "schema-03-actors.prisma" The
     * number indicates the dependency order for schema generation.
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
     * Array of Prisma models (database tables) within this domain.
     *
     * Each model represents a business entity or concept within the namespace.
     * Models can reference each other through foreign key relationships.
     */
    models: IModel[] & tags.MinItems<1>;
  }

  /**
   * Interface representing a single Prisma model (database table).
   *
   * Based on the uploaded schemas, models follow specific patterns:
   *
   * - Main business entities (e.g., shopping_sales, shopping_customers)
   * - Snapshot/versioning entities for audit trails (e.g.,
   *   shopping_sale_snapshots)
   * - Junction tables for M:N relationships (e.g.,
   *   shopping_cart_commodity_stocks)
   * - Materialized views for performance (prefixed with mv_)
   */
  export interface IModel {
    /**
     * Name of the Prisma model (database table name).
     *
     * Should follow snake_case convention with domain prefix. Examples:
     * "shopping_customers", "shopping_sale_snapshots", "bbs_articles"
     * Materialized views use "mv_" prefix: "mv_shopping_sale_last_snapshots"
     */
    name: string & tags.Pattern<"^[a-z][a-z0-9_]*$">;

    /**
     * Detailed description explaining the business purpose and usage of the
     * model.
     *
     * Should include:
     *
     * - Business context and purpose
     * - Key relationships with other models
     * - Important behavioral notes or constraints
     * - References to related entities using "{@\link ModelName}" syntax
     * 
     * **IMPORTANT**: Description must be written in English.
     * Example: "Customer information, but not a person but a **connection** basis..."
     */
    description: string;

    /**
     * Indicates whether this model represents a materialized view for
     * performance optimization.
     *
     * Materialized views are read-only computed tables that cache complex query
     * results. They're marked as "@\hidden" in documentation and prefixed with
     * "mv_" in naming. Examples: mv_shopping_sale_last_snapshots,
     * mv_shopping_cart_commodity_prices
     */
    material: boolean;

    //----
    // FIELDS
    //----
    /**
     * The primary key field of the model.
     *
     * In all uploaded schemas, primary keys are always UUID type with "@\id"
     * directive. Usually named "id" and marked with "@\db.Uuid" for PostgreSQL
     * mapping.
     */
    primaryField: IPrimaryField;

    /**
     * Array of foreign key fields that reference other models.
     *
     * These establish relationships between models and include Prisma relation
     * directives. Can be nullable (optional relationships) or required
     * (mandatory relationships). May have unique constraints for 1:1
     * relationships.
     */
    foreignFields: IForeignField[];

    /**
     * Array of regular data fields that don't reference other models.
     *
     * Include business data like names, descriptions, timestamps, flags,
     * amounts, etc. Common patterns: created_at, updated_at, deleted_at for
     * soft deletion and auditing.
     */
    plainFields: IPlainField[];

    //----
    // INDEXES
    //----
    /**
     * Array of unique indexes for enforcing data integrity constraints.
     *
     * Ensure uniqueness across single or multiple columns. Examples: unique
     * email addresses, unique codes within a channel, unique combinations like
     * (channel_id, nickname).
     */
    uniqueIndexes: IUniqueIndex[];

    /**
     * Array of regular indexes for query performance optimization.
     *
     * Speed up common query patterns like filtering by foreign keys, date
     * ranges, or frequently searched fields. Examples: indexes on created_at,
     * foreign key fields, search fields.
     */
    plainIndexes: IPlainIndex[];

    /**
     * Array of GIN (Generalized Inverted Index) indexes for full-text search.
     *
     * Used specifically for PostgreSQL text search capabilities using trigram
     * operations. Applied to text fields that need fuzzy matching or partial
     * text search. Examples: searching names, nicknames, titles, content
     * bodies.
     */
    ginIndexes: IGinIndex[];
  }

  /**
   * Interface representing the primary key field of a Prisma model.
   *
   * All models in the uploaded schemas use UUID as primary key for better
   * distributed system compatibility and security (no sequential ID exposure).
   */
  export interface IPrimaryField {
    /**
     * Name of the primary key field.
     *
     * Consistently named "id" across all models in the uploaded schemas.
     * Represents the unique identifier for each record in the table.
     */
    name: string & tags.Pattern<"^[a-z][a-z0-9_]*$">;

    /**
     * Data type of the primary key field.
     *
     * Always "uuid" in the uploaded schemas for better distributed system
     * support and to avoid exposing sequential IDs that could reveal business
     * information.
     */
    type: "uuid";

    /**
     * Description of the primary key field's purpose.
     *
     * Standard description is "Primary Key." across all models. Serves as the
     * unique identifier for the model instance.
     * 
     * **IMPORTANT**: Description must be written in English.
     */
    description: string;
  }

  /**
   * Interface representing a foreign key field that establishes relationships
   * between models.
   *
   * Foreign keys create associations between models, enabling relational data
   * modeling. They can represent 1:1, 1:N, or participate in M:N relationships
   * through junction tables.
   */
  export interface IForeignField {
    /**
     * Name of the foreign key field.
     *
     * Follows convention: "{target_model_name_without_prefix}_id" Examples:
     * "shopping_customer_id", "bbs_article_id", "attachment_file_id" For
     * self-references: "parent_id" (e.g., in hierarchical structures)
     */
    name: string & tags.Pattern<"^[a-z][a-z0-9_]*$">;

    /**
     * Data type of the foreign key field.
     *
     * Always "uuid" to match the primary key type of referenced models. Ensures
     * referential integrity and consistency across the schema.
     */
    type: "uuid";

    /**
     * Description explaining the purpose and target of this foreign key
     * relationship.
     *
     * Should reference the target model using format: "Target model's {@\link
     * ModelName.id}"
     * Examples: "Belonged customer's {@\link shopping_customers.id}"
     * May include additional context about the relationship's business meaning.
     * 
     * **IMPORTANT**: Description must be written in English.
     */
    description: string;

    /**
     * Prisma relation configuration defining the association details.
     *
     * Specifies how this foreign key connects to the target model, including
     * relation name, target model, and target field. This configuration is used
     * to generate the appropriate Prisma relation directive in the schema.
     */
    relation: IRelation;

    /**
     * Whether this foreign key has a unique constraint.
     *
     * True: Creates a 1:1 relationship (e.g., user profile, order publish
     * details) false: Allows 1:N relationship (e.g., customer to multiple
     * orders) Used for enforcing business rules about relationship
     * cardinality.
     */
    unique: boolean;

    /**
     * Whether this foreign key can be null (optional relationship).
     *
     * True: Relationship is optional, foreign key can be null false:
     * Relationship is required, foreign key cannot be null Reflects business
     * rules about mandatory vs optional associations.
     */
    nullable: boolean;
  }

  /**
   * Interface representing a Prisma relation configuration between models.
   *
   * This interface defines how foreign key fields establish relationships with
   * their target models. It provides the necessary information for Prisma to
   * generate appropriate relation directives (@relation) in the schema,
   * enabling proper relational data modeling and ORM functionality.
   *
   * The relation configuration is essential for:
   *
   * - Generating correct Prisma relation syntax
   * - Establishing bidirectional relationships between models
   * - Enabling proper type-safe querying through Prisma client
   * - Supporting complex relationship patterns (1:1, 1:N, M:N)
   */
  export interface IRelation {
    /**
     * Name of the relation property in the Prisma model.
     *
     * This becomes the property name used to access the related model instance
     * through the Prisma client. Should be descriptive and reflect the business
     * relationship being modeled.
     *
     * Examples:
     *
     * - "customer" for shopping_customer_id field
     * - "channel" for shopping_channel_id field
     * - "parent" for parent_id field in hierarchical structures
     * - "snapshot" for versioning relationships
     * - "article" for bbs_article_id field
     *
     * Naming convention: camelCase, descriptive of the relationship's business
     * meaning
     */
    name: string & tags.Pattern<"^[a-zA-Z_][a-zA-Z0-9_]*$">;

    /**
     * Name of the target model being referenced by this relation.
     *
     * Must exactly match an existing model name in the schema. This is used by
     * Prisma to establish the foreign key constraint and generate the
     * appropriate relation mapping.
     *
     * Examples:
     *
     * - "shopping_customers" for customer relationships
     * - "shopping_channels" for channel relationships
     * - "bbs_articles" for article relationships
     * - "attachment_files" for file attachments
     *
     * The target model should exist in the same schema or be accessible through
     * the Prisma schema configuration.
     */
    targetModel: string;

    /**
     * Optional explicit mapping name for complex relationship scenarios.
     *
     * Used internally by Prisma to handle advanced relationship patterns such
     * as:
     *
     * - Self-referential relationships with multiple foreign keys
     * - Complex many-to-many relationships through junction tables
     * - Relationships that require custom naming to avoid conflicts
     *
     * When not specified, Prisma automatically generates appropriate mapping
     * names based on the model names and field names. This field should only be
     * used when the automatic naming conflicts with other relationships or when
     * specific naming is required for business logic.
     *
     * Examples:
     *
     * - "ParentChild" for hierarchical self-references
     * - "CustomerOrder" for customer-order relationships
     * - "UserProfile" for user-profile 1:1 relationships
     *
     * @internal This field is primarily used by the code generation system
     * and should not be modified unless dealing with complex relationship patterns.
     */
    mappingName?: string;
  }

  /**
   * Interface representing a regular data field that stores business
   * information.
   *
   * These fields contain the actual business data like names, amounts,
   * timestamps, flags, descriptions, and other domain-specific information.
   */
  export interface IPlainField {
    /**
     * Name of the field in the database table.
     *
     * Should use snake_case convention. Common patterns from uploaded schemas:
     *
     * - Timestamps: created_at, updated_at, deleted_at, opened_at, closed_at
     * - Identifiers: code, name, nickname, title
     * - Business data: value, quantity, price, volume, balance
     * - Flags: primary, required, exclusive, secret, multiplicative
     */
    name: string & tags.Pattern<"^[a-z][a-z0-9_]*$">;

    /**
     * Data type of the field for Prisma schema generation.
     *
     * Maps to appropriate Prisma/PostgreSQL types:
     *
     * - Boolean: Boolean flags and yes/no values
     * - Int: Integer numbers, quantities, sequences
     * - Double: Decimal numbers, prices, monetary values, percentages
     * - String: Text data, names, descriptions, codes
     * - Uri: URL/URI fields for links and references
     * - Uuid: UUID fields (for non-foreign-key UUIDs)
     * - Datetime: Timestamp fields with date and time
     */
    type: "boolean" | "int" | "double" | "string" | "uri" | "uuid" | "datetime";

    /**
     * Description explaining the business purpose and usage of this field.
     *
     * Should clearly explain:
     *
     * - What business concept this field represents
     * - Valid values or constraints if applicable
     * - How it relates to business processes
     * - Any special behavioral notes
     * 
     * **IMPORTANT**: Description must be written in English.
     * Example: "Amount of cash payment." or "Whether the unit is required or not."
     */
    description: string;

    /**
     * Whether this field can contain null values.
     *
     * True: Field is optional and can be null (e.g., middle name, description)
     * false: Field is required and cannot be null (e.g., creation timestamp,
     * name) Reflects business rules about mandatory vs optional data.
     */
    nullable: boolean;
  }

  /**
   * Interface representing a unique index constraint on one or more fields.
   *
   * Unique indexes enforce data integrity by ensuring no duplicate values exist
   * for the specified field combination. Essential for business rules that
   * require uniqueness like email addresses, codes, or composite keys.
   */
  export interface IUniqueIndex {
    /**
     * Array of field names that together form the unique constraint.
     *
     * Can be single field (e.g., ["email"]) or composite (e.g., ["channel_id",
     * "code"]). All field names must exist in the model. Order matters for
     * composite indexes. Examples: ["code"], ["shopping_channel_id",
     * "nickname"], ["email"]
     */
    fieldNames: string[] & tags.MinItems<1> & tags.UniqueItems;

    /**
     * Explicit marker indicating this is a unique index.
     *
     * Always true to distinguish from regular indexes. Used by code generator
     * to emit "@@unique" directive in Prisma schema instead of "@@index".
     */
    unique: true;
  }

  /**
   * Interface representing a regular (non-unique) index for query performance.
   *
   * Regular indexes speed up database queries by creating optimized data
   * structures for common search patterns. Essential for foreign keys, date
   * ranges, and frequently filtered fields.
   */
  export interface IPlainIndex {
    /**
     * Array of field names to include in the performance index.
     *
     * Can be single field (e.g., ["created_at"]) or composite (e.g.,
     * ["customer_id", "created_at"]). All field names must exist in the model.
     * Order matters for composite indexes and should match common query
     * patterns. Examples: ["created_at"], ["shopping_customer_id",
     * "created_at"], ["ip"]
     */
    fieldNames: string[] & tags.MinItems<1> & tags.UniqueItems;
  }

  /**
   * Interface representing a GIN (Generalized Inverted Index) for full-text
   * search.
   *
   * GIN indexes enable advanced PostgreSQL text search capabilities including
   * fuzzy matching and partial text search using trigram operations. Essential
   * for user-facing search features on text content.
   */
  export interface IGinIndex {
    /**
     * Name of the text field to index for full-text search capabilities.
     *
     * Must be a string field in the model that contains searchable text.
     * Examples from uploaded schemas: "nickname", "title", "body", "name" Used
     * with PostgreSQL gin_trgm_ops for trigram-based fuzzy text search.
     */
    fieldName: string;
  }
}
