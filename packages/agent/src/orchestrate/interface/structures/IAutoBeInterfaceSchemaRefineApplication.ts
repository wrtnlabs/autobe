import {
  AutoBeInterfaceSchemaPropertyExclude,
  AutoBeInterfaceSchemaPropertyRefine,
} from "@autobe/interface";

import { IAutoBePreliminaryComplete } from "../../common/structures/IAutoBePreliminaryComplete";
import { IAutoBePreliminaryGetAnalysisSections } from "../../common/structures/IAutoBePreliminaryGetAnalysisSections";
import { IAutoBePreliminaryGetDatabaseSchemas } from "../../common/structures/IAutoBePreliminaryGetDatabaseSchemas";
import { IAutoBePreliminaryGetInterfaceOperations } from "../../common/structures/IAutoBePreliminaryGetInterfaceOperations";
import { IAutoBePreliminaryGetInterfaceSchemas } from "../../common/structures/IAutoBePreliminaryGetInterfaceSchemas";
import { IAutoBePreliminaryGetPreviousAnalysisSections } from "../../common/structures/IAutoBePreliminaryGetPreviousAnalysisSections";
import { IAutoBePreliminaryGetPreviousDatabaseSchemas } from "../../common/structures/IAutoBePreliminaryGetPreviousDatabaseSchemas";
import { IAutoBePreliminaryGetPreviousInterfaceOperations } from "../../common/structures/IAutoBePreliminaryGetPreviousInterfaceOperations";
import { IAutoBePreliminaryGetPreviousInterfaceSchemas } from "../../common/structures/IAutoBePreliminaryGetPreviousInterfaceSchemas";

/**
 * Enriches JSON Schema properties with databaseSchemaProperty, specification,
 * and description.
 */
export interface IAutoBeInterfaceSchemaRefineApplication {
  /**
   * Process schema refinement task or preliminary data requests.
   *
   * @param props Preliminary data request, write submission, or completion
   *   confirmation
   */
  process(props: IAutoBeInterfaceSchemaRefineApplication.IProps): void;
}
export namespace IAutoBeInterfaceSchemaRefineApplication {
  export interface IProps {
    /**
     * Think before you act.
     *
     * For preliminary requests: what critical information is missing and why?
     *
     * For write: what refinements you're submitting and key decisions.
     *
     * For complete: why you consider the last write final.
     */
    thinking: string;

    /**
     * Action to perform. Exhausted preliminary types are removed from the
     * union, physically preventing repeated calls.
     */
    request:
      | IWrite
      | IAutoBePreliminaryComplete
      | IAutoBePreliminaryGetAnalysisSections
      | IAutoBePreliminaryGetDatabaseSchemas
      | IAutoBePreliminaryGetInterfaceOperations
      | IAutoBePreliminaryGetInterfaceSchemas
      | IAutoBePreliminaryGetPreviousAnalysisSections
      | IAutoBePreliminaryGetPreviousDatabaseSchemas
      | IAutoBePreliminaryGetPreviousInterfaceOperations
      | IAutoBePreliminaryGetPreviousInterfaceSchemas;
  }

  /** Submit schema refinement with object-level and property-level enrichment. */
  export interface IWrite {
    /** Type discriminator for write submission. */
    type: "write";

    /** Summary of refinement analysis and actions taken. */
    review: string;

    /**
     * Database table this schema maps to, or `null` for non-table types
     * (aggregations, joins, utility).
     */
    databaseSchema: string | null;

    /**
     * HOW the schema should be implemented (data source mappings,
     * transformation rules). **MANDATORY**: Always provide, even if existing
     * value is correct — this forces explicit review of implementation
     * details.
     */
    specification: string;

    /**
     * WHAT the schema represents for API consumers. **MANDATORY**: Always
     * provide, even if existing value is correct — this forces explicit review
     * of consumer-facing documentation.
     */
    description: string;

    /**
     * Database properties explicitly excluded from this DTO. Together with
     * `revises`, must cover every database property exactly once.
     */
    excludes: AutoBeInterfaceSchemaPropertyExclude[];

    /**
     * Property-level refinement operations (depict/create/update/erase). Every
     * DTO property must appear exactly once. Database properties go here (via
     * `databaseSchemaProperty`) or in `excludes`. No omissions allowed.
     */
    revises: AutoBeInterfaceSchemaPropertyRefine[];
  }
}
