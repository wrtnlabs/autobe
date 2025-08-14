import { IAutoBeTypeScriptCompileResult } from "../compiler/IAutoBeTypeScriptCompileResult";
import { AutoBeRealizeAuthorization } from "../histories/contents/AutoBeRealizeAuthorization";
import { AutoBeRealizeFunction } from "../histories/contents/AutoBeRealizeFunction";
import { AutoBeEventBase } from "./AutoBeEventBase";

/**
 * Event fired when the Realize agent completes the implementation of business
 * logic and service layer code, finalizing the entire vibe coding pipeline.
 *
 * This event represents the successful completion of the final phase in the
 * vibe coding workflow, where all previous design artifacts converge into
 * executable software. The Realize agent's completion marks the transformation
 * of requirements, database schemas, API specifications, and test scenarios
 * into a fully functional application ready for deployment.
 *
 * The completion of the Realize phase represents the culmination of the entire
 * automated development process, delivering working software that accurately
 * implements business requirements while maintaining consistency across all
 * architectural layers.
 *
 * @author Samchon
 */
export interface AutoBeRealizeCompleteEvent
  extends AutoBeEventBase<"realizeComplete"> {
  /**
   * Generated authentication and authorization decorators for role-based access
   * control.
   *
   * Contains the complete set of NestJS parameter decorators that provide
   * automatic authentication and authorization functionality for different user
   * roles. Each decorator includes its implementation code, associated provider
   * functions, and payload type definitions that enable seamless integration of
   * role-based security into Controller methods.
   *
   * These decorators eliminate the need for manual authentication logic in
   * Controllers by automatically validating JWT tokens, checking user roles,
   * and injecting authenticated user data as typed parameters, ensuring both
   * security and developer productivity.
   */
  authorizations: AutoBeRealizeAuthorization[];

  /**
   * Generated implementation functions
   *
   * Contains the complete set of TypeScript implementation functions including
   * service classes, business logic methods, data access objects, and
   * integration code. Each key represents the function name and each value
   * contains the actual implementation code that brings the designed system to
   * life.
   *
   * The implementation functions bridge the gap between API specifications and
   * database schemas, providing the concrete business logic that makes the
   * application functional and ready for deployment.
   */
  functions: AutoBeRealizeFunction[];

  /**
   * Generated NestJS controller implementations mapped by controller name.
   *
   * Contains the complete set of controller classes that handle HTTP requests
   * and responses for the REST API. Each key represents the controller name
   * (e.g., "BbsArticlesController", "ShoppingOrdersController") and each value
   * contains the full TypeScript source code for that controller.
   *
   * These controllers implement all the API endpoints defined in the Interface
   * phase, with proper request/response handling, validation, authentication
   * checks, and service layer integration. They serve as the entry points for
   * the application's business logic, delegating actual processing to the
   * corresponding service classes while maintaining clean separation of
   * concerns.
   *
   * The generated controllers follow NestJS best practices including decorator
   * usage, dependency injection, and proper error handling, ensuring the API
   * layer is both robust and maintainable.
   */
  controllers: Record<string, string>;

  /**
   * Results of compiling the generated implementation TypeScript files through
   * the TypeScript compiler.
   *
   * Contains the {@link IAutoBeTypeScriptCompileResult} from processing the
   * generated implementation files through the TypeScript compilation pipeline.
   * This compilation result validates the complete application code including
   * service classes, business logic, data access layers, and all integration
   * components to ensure the final implementation is syntactically correct and
   * ready for execution.
   *
   * Through the Realize agent's internal compiler feedback process, this result
   * is typically successful as the agent iteratively refines the generated code
   * based on compilation diagnostics. However, in rare cases where the compiler
   * feedback iteration limit is exceeded, the result may indicate failure
   * despite the agent's correction attempts. Such failure occurrences are
   * extremely infrequent due to the sophisticated feedback mechanisms built
   * into the Realize agent's code generation process.
   *
   * Successful compilation indicates that the generated implementation is
   * production-ready and represents a fully functional application that can be
   * deployed immediately without any syntax or integration issues.
   */
  compiled: IAutoBeTypeScriptCompileResult;

  /**
   * Final iteration number of the requirements analysis this implementation was
   * completed for.
   *
   * Indicates which version of the requirements analysis this implementation
   * reflects, representing the final synchronization point for the entire
   * development pipeline. This step number confirms that the completed
   * implementation is aligned with the latest requirements and incorporates all
   * design decisions from previous development phases.
   *
   * The step value serves as the definitive reference for the completed
   * application, ensuring that all stakeholders understand which requirements
   * version has been fully implemented and delivered as working software.
   */
  step: number;

  /**
   * Elapsed time in milliseconds for the entire Realize completion process.
   *
   * Indicates the total time taken from the start of the Realize phase until
   * its completion. This metric helps in understanding the efficiency of the
   * implementation phase and can be used for process improvement analysis.
   *
   * This elapsed time provides insights into the complexity of the
   * implementation, the number of business logic functions generated, and the
   * thoroughness of the integration with API specifications and database
   * schemas. It serves as a performance metric for the Realize agent's code
   * generation capabilities and the overall efficiency of the implementation
   * workflow.
   *
   * This elapsed time is same with the difference between the timestamps
   * recorded in the `created_at` field of the `AutoBeRealizeStartEvent` and
   * this event.
   */
  elapsed: number;
}
