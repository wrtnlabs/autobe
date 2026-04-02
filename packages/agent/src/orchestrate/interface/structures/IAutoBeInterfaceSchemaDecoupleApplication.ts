import { AutoBeInterfaceSchemaDecoupleRemoval } from "@autobe/interface";

export interface IAutoBeInterfaceSchemaDecoupleApplication {
  /** Resolve cross-type circular references by selecting the property to remove. */
  process(props: IAutoBeInterfaceSchemaDecoupleApplication.IProps): void;
}

export namespace IAutoBeInterfaceSchemaDecoupleApplication {
  /**
   * LLM response for one circular reference cycle.
   *
   * Fields are ordered for chain-of-thought generation:
   *
   * 1. `thinking` — initial reasoning about the cycle
   * 2. `draft` — first candidate removal based on that reasoning
   * 3. `review` — critical reflection on the draft
   * 4. `final` — refined removal, or `null` if the draft was already correct
   *
   * The effective removal used is `final ?? draft`.
   */
  export interface IProps {
    /**
     * Initial reasoning about this cycle and the resolution strategy.
     *
     * Think through which edge is semantically least important, which direction
     * the reference should flow, and whether any documentation will need
     * updating after the removal.
     */
    thinking: string;

    /**
     * First candidate removal based on the initial reasoning.
     *
     * Must correspond to an edge in the detected cycle (typeName.propertyName).
     * Include `description`/`specification` if the schema docs reference the
     * removed property.
     */
    draft: AutoBeInterfaceSchemaDecoupleRemoval;

    /**
     * Critical review of the draft.
     *
     * Re-examine the draft: Is the chosen edge truly the least semantically
     * important? Does removing it actually break the cycle? Are the doc updates
     * correct? Use this field to catch mistakes before committing.
     */
    review: string;

    /**
     * Final removal decision after reviewing the draft, or `null` if the draft
     * was already correct and needs no revision.
     *
     * The effective removal applied is `final ?? draft`. Return `null` here to
     * avoid redundant repetition when the draft required no change.
     */
    final: AutoBeInterfaceSchemaDecoupleRemoval | null;
  }
}
