import { IAutoBeTestAuthorizeWriteResult } from "./IAutoBeTestAuthorizeWriteResult";
import { IAutoBeTestGenerateWriteResult } from "./IAutoBeTestGenerateWriteResult";
import { IAutoBeTestOperationWriteResult } from "./IAutoBeTestOperationWriteResult";
import { IAutoBeTestPrepareWriteResult } from "./IAutoBeTestPrepareWriteResult";

export type IAutoBeTestAgentResult =
  | IAutoBeTestOperationWriteResult
  | IAutoBeTestPrepareWriteResult
  | IAutoBeTestGenerateWriteResult
  | IAutoBeTestAuthorizeWriteResult;
