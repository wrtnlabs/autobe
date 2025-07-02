import { IAutoBeTypeScriptCompileResult } from "../compiler/IAutoBeTypeScriptCompileResult";
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
   * Generated implementation files as key-value pairs representing the complete
   * application.
   *
   * Contains the final set of TypeScript implementation files including service
   * classes, business logic methods, data access objects, integration code, and
   * all supporting implementation that brings the designed system to life. Each
   * key represents the file path and each value contains the actual
   * implementation code that makes the application functional.
   *
   * The implementation files represent the culmination of the entire vibe
   * coding pipeline, bridging the gap between API specifications and database
   * schemas while providing concrete business logic that fulfills all
   * requirements. These files are ready for immediate deployment or further
   * customization.
   */
  files: Record<string, string>;

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
}
