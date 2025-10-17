export interface IAutoBeFacadeApplicationResult {
  type:
    | "success"
    | "failure"
    | "exception"
    | "in-progress"
    | "prerequisites-not-satisfied";
  description: string;
}
