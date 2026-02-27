import { RouteInfo } from "./url-resolver";
import { HttpRunner } from "./http-runner";
export interface ScenarioResult {
    id: number;
    name: string;
    passed: boolean;
    reason?: string;
}
export declare function runTodoScenarios(routes: RouteInfo[], http: HttpRunner): Promise<ScenarioResult[]>;
//# sourceMappingURL=todo.scenarios.d.ts.map