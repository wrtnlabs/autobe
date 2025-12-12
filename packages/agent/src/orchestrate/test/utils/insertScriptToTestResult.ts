import { IAutoBeTestAgentResult } from "../structures/IAutoBeTestAgentResult";

export const insertScriptToTestResult = <Item extends IAutoBeTestAgentResult>(
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
