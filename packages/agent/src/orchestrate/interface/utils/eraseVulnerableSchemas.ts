export const eraseVulnerableSchemas = (input: unknown, path: string): void => {
  if (isObject(input) === false || isObject(input[path]) === false) return;

  if (input[path].description) delete input[path].description;
  if (input[path].required) delete input[path].required;
};

const isObject = (input: unknown): input is Record<string, unknown> =>
  typeof input === "object" && input !== null;
