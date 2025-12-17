import { IAutoBeTestProcedure } from "../structures/IAutoBeTestProcedure";

export const insertScriptToTestResult = <Item extends IAutoBeTestProcedure>(
  item: Item,
  script: string,
): Item => {
  return {
    ...item,
    function: {
      ...item.function,
      content: script,
    },
  };
};
