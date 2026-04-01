import { AutoBeInterfaceSchemaDesign } from "@autobe/interface";

import { IAutoBePreliminaryGetAnalysisSections } from "../../common/structures/IAutoBePreliminaryGetAnalysisSections";
import { IAutoBePreliminaryGetDatabaseSchemas } from "../../common/structures/IAutoBePreliminaryGetDatabaseSchemas";
import { IAutoBePreliminaryGetInterfaceOperations } from "../../common/structures/IAutoBePreliminaryGetInterfaceOperations";
import { IAutoBePreliminaryGetInterfaceSchemas } from "../../common/structures/IAutoBePreliminaryGetInterfaceSchemas";
import { IAutoBePreliminaryGetPreviousAnalysisSections } from "../../common/structures/IAutoBePreliminaryGetPreviousAnalysisSections";
import { IAutoBePreliminaryGetPreviousDatabaseSchemas } from "../../common/structures/IAutoBePreliminaryGetPreviousDatabaseSchemas";
import { IAutoBePreliminaryGetPreviousInterfaceOperations } from "../../common/structures/IAutoBePreliminaryGetPreviousInterfaceOperations";
import { IAutoBePreliminaryGetPreviousInterfaceSchemas } from "../../common/structures/IAutoBePreliminaryGetPreviousInterfaceSchemas";
import { IComplete } from "../../common/structures/IComplete";

export interface IAutoBeInterfaceSchemaComplementApplication {
  /** Process task or retrieve preliminary data. */
  process(props: IAutoBeInterfaceSchemaComplementApplication.IProps): void;
}

export namespace IAutoBeInterfaceSchemaComplementApplication {
  export interface IProps {
    /**
     * Reasoning about your current state: what's missing (preliminary) or what
     * you accomplished (completion).
     */
    thinking: string;

    /**
     * Action to perform. Exhausted preliminary types are removed from the
     * union.
     */
    request:
      | IWrite
      | IComplete
      | IAutoBePreliminaryGetAnalysisSections
      | IAutoBePreliminaryGetDatabaseSchemas
      | IAutoBePreliminaryGetInterfaceOperations
      | IAutoBePreliminaryGetInterfaceSchemas
      | IAutoBePreliminaryGetPreviousAnalysisSections
      | IAutoBePreliminaryGetPreviousDatabaseSchemas
      | IAutoBePreliminaryGetPreviousInterfaceOperations
      | IAutoBePreliminaryGetPreviousInterfaceSchemas;
  }

  /** Submit a missing schema definition referenced by $ref in components.schemas for validation. */
  export interface IWrite {
    /** Type discriminator for write submission. */
    type: "write";

    /** Analysis of the missing type's purpose and reference context. */
    analysis: string;

    /** Rationale for the schema design decisions. */
    rationale: string;

    /**
     * Schema design: database mapping, specification, description, and JSON
     * Schema.
     */
    design: AutoBeInterfaceSchemaDesign;
  }
}

/** @deprecated Use IAutoBeInterfaceSchemaComplementApplication.IWrite instead. */
export type IAutoBeInterfaceSchemaComplementApplicationComplete =
  IAutoBeInterfaceSchemaComplementApplication.IWrite;
