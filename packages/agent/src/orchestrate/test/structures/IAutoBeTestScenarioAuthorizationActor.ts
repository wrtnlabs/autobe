import { AutoBeOpenApi } from "@autobe/interface";

export interface IAutoBeTestScenarioAuthorizationActor {
  name: string;
  join: AutoBeOpenApi.IOperation | null;
  login: AutoBeOpenApi.IOperation | null;
}
