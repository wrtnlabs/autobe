import { tags } from "typia";

import { CamelCasePattern } from "../typings";
import { SnakeCasePattern } from "../typings/SnakeCasePattern";

/**
 * AST types for Prisma schema generation via AI function calling.
 *
 * Hierarchy: IApplication → IFile → IModel → Fields + Indexes.
 *
 * IMPORTANT: All description fields must be written in English.
 */
export namespace AutoBeDatabase {
  /** Root container for the entire database schema. */
  export interface IApplication {
    /** Array of schema files, each covering a business domain. */
    files: IFile[];
  }

  /** A single Prisma schema file covering one business domain. */
  export interface IFile {
    /**
     * Filename following "schema-{number}-{domain}.prisma" convention. The
     * number indicates dependency order.
     */
    filename: string & tags.Pattern<"^[a-zA-Z0-9._-]+\\.prisma$">;

    /** Business domain namespace used in Prisma @namespace directives. */
    namespace: string;

    /** Models (database tables) within this domain. */
    models: IModel[] & tags.MinItems<1>;
  }

  /** A single Prisma model (database table). */
  export interface IModel {
    /** MUST use snake_case. Materialized views use "mv_" prefix. */
    name: string & SnakeCasePattern;

    /**
     * Business purpose of this model. MUST be written in English. Reference
     * related entities using "{@\link ModelName}" syntax.
     */
    description: string;

    /**
     * Whether this model is a materialized view (read-only cached query). If
     * true, name must use "mv_" prefix.
     */
    material: boolean;

    /**
     * Architectural role of this model, guiding API endpoint generation.
     *
     * - "primary": Core entity users manage independently (full CRUD APIs). Use
     *   when users need to create, search, or manage entities outside their
     *   parent context.
     * - "actor": Authenticated user type with its own identity, credentials, and
     *   auth flow. Generates auth endpoints.
     * - "session": Login session table belonging to exactly one actor.
     *   Append-only audit trail, managed via auth flows.
     * - "subsidiary": Supporting entity managed through its parent, rarely needs
     *   standalone endpoints.
     * - "snapshot": Point-in-time versioning record, typically append-only and
     *   read-only from user perspective.
     */
    stance: "primary" | "subsidiary" | "snapshot" | "actor" | "session";

    //----
    // FIELDS
    //----
    /** Primary key field (UUID). */
    primaryField: IPrimaryField;

    /** Foreign key fields establishing relationships to other models. */
    foreignFields: IForeignField[];

    /** Regular data fields (names, timestamps, flags, amounts, etc.). */
    plainFields: IPlainField[];

    //----
    // INDEXES
    //----
    /** Unique indexes for data integrity constraints. */
    uniqueIndexes: IUniqueIndex[];

    /** Regular indexes for query performance. */
    plainIndexes: IPlainIndex[];

    /** GIN indexes for PostgreSQL full-text search (trigram). */
    ginIndexes: IGinIndex[];
  }

  /** Primary key field of a model. */
  export interface IPrimaryField {
    /** MUST use snake_case. */
    name: string & SnakeCasePattern;

    type: "uuid";

    /** Business purpose of this primary key. MUST be written in English. */
    description: string;

    /**
     * @ignore
     * @internal
     */
    nullable?: boolean;
  }

  /** Foreign key field establishing a relationship to another model. */
  export interface IForeignField {
    /** MUST use snake_case. Convention: "{target_model}_id". */
    name: string & SnakeCasePattern;

    type: "uuid";

    /** Use format: "Target's {@\link ModelName.id}". MUST be written in English. */
    description: string;

    /** Prisma relation configuration. */
    relation: IRelation;

    /** True for 1:1 relationships, false for 1:N. */
    unique: boolean;

    /** True if the relationship is optional. */
    nullable: boolean;
  }

  /** Prisma @relation configuration for a foreign key. */
  export interface IRelation {
    /** Relation property name in this model. MUST use camelCase. */
    name: string & CamelCasePattern;

    /** Must match an existing model name in the schema. */
    targetModel: string;

    /**
     * Inverse relation property name generated in the target model. Typically
     * plural for 1:N (e.g., "comments"), singular for 1:1.
     */
    oppositeName: string & CamelCasePattern;

    /**
     * Explicit Prisma mapping name. Only needed for self-referential relations
     * or when auto-generated names conflict.
     *
     * @internal
     */
    mappingName?: string;
  }

  /** A regular data field (not a primary or foreign key). */
  export interface IPlainField {
    /** MUST use snake_case. */
    name: string & SnakeCasePattern;

    /**
     * Prisma/PostgreSQL type mapping: boolean, int, double, string, uri, uuid
     * (non-FK), datetime.
     */
    type: "boolean" | "int" | "double" | "string" | "uri" | "uuid" | "datetime";

    /** Business purpose of this field. MUST be written in English. */
    description: string;

    /** Whether this field can be null. */
    nullable: boolean;
  }

  /** Unique index constraint (@@unique). */
  export interface IUniqueIndex {
    /** Field names forming the unique constraint. All must exist in the model. */
    fieldNames: string[] & tags.MinItems<1> & tags.UniqueItems;

    /** Always true. Distinguishes from plain indexes. */
    unique: true;
  }

  /** Regular index for query performance (@@index). */
  export interface IPlainIndex {
    /** Field names to index. Order matters for composite indexes. */
    fieldNames: string[] & tags.MinItems<1> & tags.UniqueItems;
  }

  /** GIN index for PostgreSQL full-text search (gin_trgm_ops). */
  export interface IGinIndex {
    /** Must be a string field containing searchable text. */
    fieldName: string;
  }
}
