import { IAutoBeTestAuthorizationWriteResult } from "./IAutoBeTestAuthorizationWriteResult";
import { IAutoBeTestGenerationWriteResult } from "./IAutoBeTestGenerationWriteResult";
import { IAutoBeTestPrepareWriteResult } from "./IAutoBeTestPrepareWriteResult";
import { IAutoBeTestWriteResult } from "./IAutoBeTestWriteResult";

export type IAutoBeTestAgentResult =
  | IAutoBeTestWriteResult
  | IAutoBeTestPrepareWriteResult
  | IAutoBeTestGenerationWriteResult
  | IAutoBeTestAuthorizationWriteResult;
