export interface IAutoBeFacadeApplicationProps {
  /**
   * Instructions for each agent phase redefined by AI from user's utterance.
   * Contains specific guidance for analyze/database/interface/test/realize
   * agents.
   */
  instruction: string;
}
