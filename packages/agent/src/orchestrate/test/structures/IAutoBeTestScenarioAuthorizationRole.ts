import { AutoBeOpenApi } from "@autobe/interface";

export interface IAutoBeTestScenarioAuthorizationRole {
  name: string;
  join: AutoBeOpenApi.IOperation | null;
  login: AutoBeOpenApi.IOperation | null;
}
