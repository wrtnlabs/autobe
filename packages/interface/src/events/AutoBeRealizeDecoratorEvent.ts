import {
  AutoBeRealizeDecorator,
  AutoBeRealizeDecoratorPayload,
} from "../histories/contents";
import { AutoBeEventBase } from "./AutoBeEventBase";

/**
 * Event fired when the Realize decorator agent generates decorator
 * implementation code.
 *
 * This event occurs when the Realize agent completes generating TypeScript
 * decorator implementations and their associated provider files. The event
 * provides detailed information about the generated files, progress metrics,
 * and the current step in the realization process.
 *
 * @author Michael
 */
export interface AutoBeRealizeDecoratorEvent
  extends AutoBeEventBase<"realizeDecorator"> {
  /**
   * Role of the decorator.
   *
   * Indicates the role for which the decorator was generated. This role
   * determines the type of authentication and authorization mechanism that will
   * be implemented in the decorator.
   */
  role: string;

  /**
   * Authentication Provider function configuration containing the function name
   * and implementation code. The Provider handles JWT token verification, role
   * validation, and database queries to authenticate users.
   */
  provider: AutoBeRealizeDecorator.IProvider;

  /**
   * Authentication Decorator configuration containing the decorator name and
   * implementation code. The Decorator integrates with NestJS parameter
   * decorators to automatically inject authenticated user data into Controller
   * methods.
   */
  decorator: AutoBeRealizeDecorator.IDecorator;

  /**
   * Authentication Decorator Type configuration containing the decorator type
   * name and implementation code. The Decorator Type is used to define the
   * structure of the authenticated user data that will be injected into
   * Controller methods when using the decorator. It serves as the TypeScript
   * type for the parameter in Controller method signatures.
   */
  payload: AutoBeRealizeDecoratorPayload;

  /**
   * Number of implementation files that have been completed so far.
   *
   * Indicates the current progress in the implementation process, showing how
   * many implementation files have been successfully generated and integrated
   * into the application. This progress tracking helps stakeholders monitor the
   * advancement of the final development phase and estimate completion timing.
   */
  completed: number;

  /**
   * Total number of implementation files that need to be created.
   *
   * Represents the complete scope of implementation files required to fulfill
   * all business requirements and complete the application functionality. This
   * total count provides context for the completion progress and helps
   * stakeholders understand the overall complexity and scope of the
   * implementation work.
   */
  total: number;

  /**
   * Iteration number of the requirements analysis this implementation progress
   * reflects.
   *
   * Indicates which version of the requirements analysis this implementation
   * work is based on. This step number ensures that the implementation progress
   * is aligned with the current requirements and helps track the development of
   * implementation components as they evolve with changing business needs.
   *
   * The step value enables proper synchronization between implementation
   * activities and the underlying requirements, ensuring that the generated
   * code remains relevant to the current project scope and business
   * objectives.
   */
  step: number;
}
