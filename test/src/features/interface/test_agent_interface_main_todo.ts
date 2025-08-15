import { TestFactory } from "../../TestFactory";
import { validate_agent_interface_main } from "./internal/validate_agent_interface_main";

export const test_agent_interface_main_todolist = (factory: TestFactory) =>
  validate_agent_interface_main(factory, "todo-backend");
