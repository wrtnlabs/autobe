import { AutoBeTestValidateEvent } from "@autobe/interface";

import { IAutoBeTestAgentResult } from "../structures/IAutoBeTestAgentResult";

export const transformTestValidateEvent = <T extends IAutoBeTestAgentResult>(
  event: AutoBeTestValidateEvent,
  item: T,
): T => ({
  ...item,
  operationFunction: event.function,
});
