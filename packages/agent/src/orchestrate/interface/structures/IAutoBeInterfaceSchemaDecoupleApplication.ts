import { AutoBeInterfaceSchemaDecoupleRemoval } from "@autobe/interface";

export interface IAutoBeInterfaceSchemaDecoupleApplication {
  /** Resolve cross-type circular references by selecting properties to remove. */
  process(props: IAutoBeInterfaceSchemaDecoupleApplication.IProps): void;
}

export namespace IAutoBeInterfaceSchemaDecoupleApplication {
  export interface IProps {
    /**
     * Reasoning about the circular references and your resolution strategy.
     */
    thinking: string;

    /**
     * Resolution action containing removal decisions.
     */
    request: IComplete;
  }

  /** Resolution of cross-type circular references. */
  export interface IComplete {
    /** Type discriminator. */
    type: "complete";

    /**
     * Analysis of each cycle and reasoning behind each removal decision.
     *
     * Explain which edge you chose to remove for each cycle and why,
     * considering semantic importance, reference direction, and DTO purpose.
     */
    analysis: string;

    /**
     * Properties to remove to break all circular reference cycles.
     *
     * Each removal must correspond to an edge in one of the detected cycles.
     * Every cycle must have at least one of its edges in this list.
     */
    removals: AutoBeInterfaceSchemaDecoupleRemoval[];
  }
}
