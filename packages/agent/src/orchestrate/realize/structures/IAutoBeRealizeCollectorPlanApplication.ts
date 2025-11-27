import { IAutoBePreliminaryGetInterfaceOperations } from "../../common/structures/IAutoBePreliminaryGetInterfaceOperations";
import { IAutoBePreliminaryGetInterfaceSchemas } from "../../common/structures/IAutoBePreliminaryGetInterfaceSchemas";
import { IAutoBePreliminaryGetPrismaSchemas } from "../../common/structures/IAutoBePreliminaryGetPrismaSchemas";

export interface IAutoBeRealizeCollectorPlanApplication {
  process(props: IAutoBeRealizeCollectorPlanApplication.IProps): void;
}
export namespace IAutoBeRealizeCollectorPlanApplication {
  export interface IProps {
    thinking: string;
    request:
      | IComplete
      | IAutoBePreliminaryGetPrismaSchemas
      | IAutoBePreliminaryGetInterfaceOperations
      | IAutoBePreliminaryGetInterfaceSchemas;
  }
  export interface IComplete {
    type: "complete";
    plans: IPlan[];
  }
  export interface IPlan {
    dtoTypeName: string;
    thinking: string;
    result: IAcceptResult | IRejectResult;
  }
  export interface IAcceptResult {
    type: "accept";
    reason: string;
    prismaSchemaName: string;
    references: string[];
  }
  export interface IRejectResult {
    type: "reject";
    reason: string;
  }
}
