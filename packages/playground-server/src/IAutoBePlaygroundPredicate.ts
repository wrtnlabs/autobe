import { AutoBeAgent } from "@autobe/agent";
import { ILlmSchema } from "@samchon/openapi";

export type IAutoBePlaygroundPredicate =
  | IAutoBePlaygroundPredicate.IAccept
  | IAutoBePlaygroundPredicate.IReject;
export namespace IAutoBePlaygroundPredicate {
  export interface IAccept {
    type: "accept";
    agent: AutoBeAgent<ILlmSchema.Model>;
    cwd: string;
  }
  export interface IReject {
    type: "reject";
    status: number;
    reason: string;
  }
}
