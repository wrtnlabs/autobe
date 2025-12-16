import { IAutoBeTestAuthorizationWriteResult } from "./IAutoBeTestAuthorizationWriteResult";
import { IAutoBeTestGenerationWriteResult } from "./IAutoBeTestGenerationWriteResult";
import { IAutoBeTestOperationWriteResult } from "./IAutoBeTestOperationWriteResult";
import { IAutoBeTestPrepareWriteResult } from "./IAutoBeTestPrepareWriteResult";

export type IAutoBeTestAgentResult =
  | IAutoBeTestOperationWriteResult
  | IAutoBeTestPrepareWriteResult
  | IAutoBeTestGenerationWriteResult
  | IAutoBeTestAuthorizationWriteResult;
