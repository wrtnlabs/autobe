import { IAutoBeTestProcedure } from "../structures/IAutoBeTestProcedure";

export const getTestImportFromFunction = (props: {
  target: IAutoBeTestProcedure;
}): string => {
  switch (props.target.type) {
    case "generate":
      return `import { ${props.target.prepareFunction.name} } from "test/features/utils/prepare/${props.target.prepareFunction.name}";`;
    case "operation":
      const importStatements = [
        ...props.target.generateFunctions.map(
          (f) =>
            `import { ${f.name} } from "test/features/utils/generation/${f.name}";`,
        ),
        ...props.target.authorizeFunctions.map(
          (f) =>
            `import { ${f.name} } from "test/features/utils/authorize/${f.name}";`,
        ),
      ].filter(Boolean);

      return importStatements.join("\n");
    default:
      return "";
  }
};
