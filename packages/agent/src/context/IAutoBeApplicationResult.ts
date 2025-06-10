export interface IAutoBeApplicationResult {
  type:
    | "success"
    | "failure"
    | "exception"
    | "in-progress"
    | "prerequisites-not-satisfied";
  description: string;
}
