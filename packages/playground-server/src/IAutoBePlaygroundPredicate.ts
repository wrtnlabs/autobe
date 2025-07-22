import { IAutoBeAgent } from "@autobe/interface";

export type IAutoBePlaygroundPredicate =
  | IAutoBePlaygroundPredicate.IAccept
  | IAutoBePlaygroundPredicate.IReject;
export namespace IAutoBePlaygroundPredicate {
  export interface IAccept {
    type: "accept";
    agent: IAutoBeAgent;
    cwd: string;
  }
  export interface IReject {
    type: "reject";
    status: number;
    reason: string;
  }
}
