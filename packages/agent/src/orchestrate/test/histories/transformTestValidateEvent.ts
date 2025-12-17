import { AutoBeTestValidateEvent } from "@autobe/interface";

import { IAutoBeTestProcedure } from "../structures/IAutoBeTestProcedure";

export const transformTestValidateEvent = <T extends IAutoBeTestProcedure>(
  event: AutoBeTestValidateEvent,
  item: T,
): T => ({
  ...item,
  operationFunction: event.function,
});
