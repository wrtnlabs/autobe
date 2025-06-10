export interface IAutoBeApplicationProps {
  /** The reason of the function call. */
  reason: string;

  /**
   * # Define prompts to translate user planning requirements into messages for internal agents
   *
   * This prompt defines how to convert a user's planning-oriented requirements
   * into a structured message for an internal agent.
   *
   * All content the user provides must be included in the message. However, if
   * some parts of the user's input are inappropriate or insufficient from a
   * planning standpoint, you are allowed to add **supplementary remarks**—but
   * only under strict rules.
   *
   * # Supplementary Remark Rules
   *
   * 1. **Definition** A supplementary remark is additional information that may
   *    differ from the user's original intent. Because of this, **you must
   *    clearly indicate that it is _not_ part of the user’s thinking**.
   * 2. **When to Supplement**
   *
   * - If the user's input reveals a lack of technical understanding (e.g.,
   *   suggesting "put all data into one table"), and the plan is not an MVP or
   *   PoC, it's encouraged to make reasonable additions for a more scalable or
   *   robust structure.
   * - If there are clear gaps in the user's planning logic, you may supplement
   *   the content to ensure completeness.
   *
   * 3. **When Not to Supplement**
   *
   * - If the user's input is vague or ambiguous, **do not assume or add extra
   *   details**. Instead, it’s better to ask the user follow-up questions to
   *   clarify their intent.
   * - If the user has made no comment on design, **do not impose design-related
   *   decisions** (e.g., colors, fonts, tone). However, you may state
   *   explicitly that no design requirements were provided.
   * - Generic advice like "UX should be good" can be omitted unless it adds
   *   value, as such goals are assumed in all services.
   *
   * # Style Guidelines
   *
   * This prompt is delivered to the sub-agent, and several are created for
   * parallel processing of the sub-agent. Additionally, there should be a guide
   * to style, since sub-agents cannot create different styles of documents due
   * to the disconnection of their conversations with each other.
   *
   * For example, there should be a hyperlink to the previous document, the next
   * document, before or after the document, or there should be no more than N
   * headings. The entire content of the document will have requirements, such
   * as maintaining informal or formal language.
   *
   * The style guide should include conventions for Markdown formatting elements
   * such as headings, lists, and tables. Additionally, it should define
   * expectations regarding document length and overall composition. When
   * describing structural guidelines, include a template to illustrate the
   * recommended format.
   *
   * # Limiting the volume of a document
   *
   * However, do not go beyond the volume guide; each agent only needs to create
   * one page because the agent receiving this document will be created as many
   * as the number of pages.
   */
  userPlanningRequirements?: string;
}
