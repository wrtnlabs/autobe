# E2E Test Code Compilation Error Fix System Prompt for Typia Tag Errors

## 1. Role and Responsibility

TEST_CORRECT_INVALID_REQUEST.md 를 참고해서 이 문항을 똑같은 스타일로 채워라.

그리고 본 에이전트의 미션을 말해주자면, 오직 typia tag 에 관련된 컴파일 에러만을 고치는 것임. 

여타 컴파일 에러는 본 에이전트의 책임이 아니며, 이후의 다른 에이전트가 해결할 것임. typia tag 에 관련되지 않은 그 모든 컴파일 에러는 이후의 다른 에이전트가 해결해 줄 것이니 절대 손대지 말기를 바람. 

오직 본 시스템 프롬프트에서 다루는 typia tag 관련 컴파일 에러에 대하여만 분석하고, 오로지 그에 대해서만 주어진 가이드대로 컴파일 에러를 해소하는게 본 에이전트의 목적. 이외에 것에 손대는 것을 엄격하게 금함.

위 스토리는 final checklist 에도 잘 녹여져야 할 것이며, 아래 input materials 의 컴파일 에러를 설명하는 단원에서도 잘 녹여내고, 이후의 main story 도 잘 가꾸어 작성하기 바람.

## 2. Input Materials

### 2.1. TypeScript Code

TEST_CORRECT_INVALID_REQUEST.md 와 비슷하게 쓰면 됨.

### 2.2. TypeScript Compilation Results

TEST_CORRECT_INVALID_REQUEST.md 와 비슷하게 쓰면 됨.

```typescript
/**
 * Result of TypeScript compilation and validation operations.
 *
 * This union type represents all possible outcomes when the TypeScript compiler
 * processes generated code from the Test and Realize agents. The compilation
 * results enable AI self-correction through detailed feedback mechanisms while
 * ensuring that all generated code meets production standards and integrates
 * seamlessly with the TypeScript ecosystem.
 *
 * The compilation process validates framework integration, type system
 * integrity, dependency resolution, and build compatibility. Success results
 * indicate production-ready code, while failure results provide detailed
 * diagnostics for iterative refinement through the AI feedback loop.
 *
 * @author Samchon
 */
export type IAutoBeTypeScriptCompileResult =
  | IAutoBeTypeScriptCompileResult.ISuccess
  | IAutoBeTypeScriptCompileResult.IFailure
  | IAutoBeTypeScriptCompileResult.IException;

export namespace IAutoBeTypeScriptCompileResult {
  /**
   * Successful compilation result with generated JavaScript output.
   *
   * Represents the ideal outcome where TypeScript compilation completed without
   * errors and produced clean JavaScript code ready for execution. This result
   * indicates that the generated TypeScript code meets all production
   * standards, integrates correctly with frameworks and dependencies, and
   * maintains complete type safety throughout the application stack.
   */
  export interface ISuccess {
    /** Discriminator indicating successful compilation. */
    type: "success";
  }

  /**
   * Compilation failure with detailed diagnostic information and partial
   * output.
   *
   * Represents cases where TypeScript compilation encountered errors or
   * warnings that prevent successful code generation. This result provides
   * comprehensive diagnostic information to enable AI agents to understand
   * specific issues and implement targeted corrections through the iterative
   * refinement process.
   */
  export interface IFailure {
    /** Discriminator indicating compilation failure. */
    type: "failure";

    /**
     * Detailed compilation diagnostics for error analysis and correction.
     *
     * Contains comprehensive information about compilation errors, warnings,
     * and suggestions that occurred during the TypeScript compilation process.
     * Each diagnostic includes file location, error category, diagnostic codes,
     * and detailed messages that enable AI agents to understand and resolve
     * specific compilation issues.
     */
    diagnostics: IDiagnostic[];
  }

  /**
   * Unexpected exception during the compilation process.
   *
   * Represents cases where the TypeScript compilation process encountered an
   * unexpected runtime error or system exception that prevented normal
   * compilation operation. These cases indicate potential issues with the
   * compilation environment or unexpected edge cases that should be
   * investigated.
   */
  export interface IException {
    /** Discriminator indicating compilation exception. */
    type: "exception";

    /**
     * The raw error or exception that occurred during compilation.
     *
     * Contains the original error object or exception details for debugging
     * purposes. This information helps developers identify the root cause of
     * unexpected compilation failures and improve system reliability while
     * maintaining the robustness of the automated development pipeline.
     */
    error: unknown;
  }

  /**
   * Detailed diagnostic information for compilation issues.
   *
   * Provides comprehensive details about specific compilation problems
   * including file locations, error categories, diagnostic codes, and
   * descriptive messages. This information is essential for AI agents to
   * understand compilation failures and implement precise corrections during
   * the iterative development process.
   *
   * @author Samchon
   */
  export interface IDiagnostic {
    /**
     * Source file where the diagnostic was generated.
     *
     * Specifies the TypeScript source file that contains the issue, or null if
     * the diagnostic applies to the overall compilation process rather than a
     * specific file. This information helps AI agents target corrections to the
     * appropriate source files during the refinement process.
     */
    file: string | null;

    /**
     * Category of the diagnostic message.
     *
     * Indicates the severity and type of the compilation issue, enabling AI
     * agents to prioritize fixes and understand the impact of each diagnostic.
     * Errors must be resolved for successful compilation, while warnings and
     * suggestions can guide code quality improvements.
     */
    category: DiagnosticCategory;

    /**
     * TypeScript diagnostic code for the specific issue.
     *
     * Provides the official TypeScript diagnostic code that identifies the
     * specific type of compilation issue. This code can be used to look up
     * detailed explanations and resolution strategies in TypeScript
     * documentation or automated correction systems.
     */
    code: number | string;

    /**
     * Character position where the diagnostic begins in the source file.
     *
     * Specifies the exact location in the source file where the issue starts,
     * or undefined if the diagnostic doesn't apply to a specific location. This
     * precision enables AI agents to make targeted corrections without
     * affecting unrelated code sections.
     */
    start: number | undefined;

    /**
     * Length of the text span covered by this diagnostic.
     *
     * Indicates how many characters from the start position are affected by
     * this diagnostic, or undefined if the diagnostic doesn't apply to a
     * specific text span. This information helps AI agents understand the scope
     * of corrections needed for each issue.
     */
    length: number | undefined;

    /**
     * Human-readable description of the compilation issue.
     *
     * Provides a detailed explanation of the compilation problem in natural
     * language that AI agents can analyze to understand the issue and formulate
     * appropriate corrections. The message text includes context and
     * suggestions for resolving the identified problem.
     */
    messageText: string;
  }

  /**
   * Categories of TypeScript diagnostic messages.
   *
   * Defines the severity levels and types of compilation diagnostics that can
   * be generated during TypeScript compilation. These categories help AI agents
   * prioritize fixes and understand the impact of each compilation issue on the
   * overall code quality and functionality.
   *
   * @author Samchon
   */
  export type DiagnosticCategory =
    | "warning" // Issues that don't prevent compilation but indicate potential problems
    | "error" // Critical issues that prevent successful compilation and must be fixed
    | "suggestion" // Recommendations for code improvements that enhance quality
    | "message"; // Informational messages about the compilation process
}
```

## 3. The Main Story

본 단원의 제목은 너가 적절하게 바꾸어라.

그리고 TEST_CORRECT.md 의 다음 단원들을 가져와 컴파일 에러에 대한 설명 및 해법 가이드를 충실하게 할 것.

최대한 자세히 설명하고, 예제들도 반드시 그대로 가져와 사용할 것. 절대 TEST_CORRECT.md 의 예제 코드를 임의 변경하여 사용하지 말고, 있는 그대로 사용할 것.

- 4.9. Typia Tag Type Conversion Errors
- 4.10. Date to ISO String Conversion for date-time Format
- 4.17. Date Type Nullable/Undefined Handling
  - 4.10 단원과 4.17 단원을 합쳐서 컨텐츠를 구성할 것
  - `Date` 타입을 `string & tags.Format<"uuid">` 로 변경하는 방법에 대한 안내
  - 컴파일 에러 메시지 패턴을 반드시 포함시키고 자세히 설명할 것

## 4. Final Verifiacation Checklist

이것은 너가 재량껏 판단하여, TEST_CORRECT_INVALID_REQUEST.md 와 같이 잘 작성하기 바람.