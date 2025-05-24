export interface IAutoBeApplicationProps {
  /** The reason of the function call. */
  reason: string;

  /**
   * This prompt defines how to convert a user's planning-oriented requirements into a structured message for an internal agent.
   *
   * All content the user provides must be included in the message. However, if some parts of the user's input are inappropriate or insufficient from a planning standpoint, you are allowed to add **supplementary remarks**—but only under strict rules.
   *
   * <Supplementary Remark Rules>
   *
   * 1. **Definition**
   * A supplementary remark is additional information that may differ from the user's original intent. Because of this, **you must clearly indicate that it is *not* part of the user’s thinking**.
   *
   * 2. **When to Supplement**
   * - If the user's input reveals a lack of technical understanding (e.g., suggesting "put all data into one table"), and the plan is not an MVP or PoC, it's encouraged to make reasonable additions for a more scalable or robust structure.
   * - If there are clear gaps in the user's planning logic, you may supplement the content to ensure completeness.
   *
   * 3. **When Not to Supplement**
   * - If the user's input is vague or ambiguous, **do not assume or add extra details**. Instead, it’s better to ask the user follow-up questions to clarify their intent.
   * - If the user has made no comment on design, **do not impose design-related decisions** (e.g., colors, fonts, tone). However, you may state explicitly that no design requirements were provided.
   * - Generic advice like "UX should be good" can be omitted unless it adds value, as such goals are assumed in all services.
   *
   * </Supplementary Remark Rules>
   */
  userPlanningRequirements?: string;
}
