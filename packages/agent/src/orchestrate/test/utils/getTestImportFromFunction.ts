import { IAutoBeTestAgentResult } from "../structures/IAutoBeTestAgentResult";

export const getTestImportFromFunction = (props: {
  target: IAutoBeTestAgentResult;
}): string => {
  switch (props.target.type) {
    case "generate":
      return `import { ${props.target.prepareFunction.functionName} } from "test/features/utils/prepare/${props.target.prepareFunction.functionName}";`;
    case "operation":
      const importStatements = [
        ...props.target.generateFunctions.map(
          (f) =>
            `import { ${f.functionName} } from "test/features/utils/generation/${f.functionName}";`,
        ),
        ...props.target.authorizeFunctions.map(
          (f) =>
            `import { ${f.functionName} } from "test/features/utils/authorize/${f.functionName}";`,
        ),
      ].filter(Boolean);

      return importStatements.join("\n");
    default:
      return "";
  }
};
