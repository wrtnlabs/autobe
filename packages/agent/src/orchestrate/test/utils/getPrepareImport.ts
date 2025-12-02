import { AutoBeTestPrepareWriteFunction } from "@autobe/interface";

export const getPrepareImport = (props: {
  prepareFunction: AutoBeTestPrepareWriteFunction;
}): string => {
  return `import { ${props.prepareFunction.functionName} } from "../prepare/${props.prepareFunction.functionName}";`;
};
