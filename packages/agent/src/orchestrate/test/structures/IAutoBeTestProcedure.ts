import { IAutoBeTestAuthorizeWriteResult } from "./IAutoBeTestAuthorizeWriteResult";
import { IAutoBeTestGenerateProcedure } from "./IAutoBeTestGenerateProcedure";
import { IAutoBeTestOperationProcedure } from "./IAutoBeTestOperationProcedure";
import { IAutoBeTestPrepareProcedure } from "./IAutoBeTestPrepareProcedure";

export type IAutoBeTestProcedure =
  | IAutoBeTestOperationProcedure
  | IAutoBeTestPrepareProcedure
  | IAutoBeTestGenerateProcedure
  | IAutoBeTestAuthorizeWriteResult;
