import { AutoBeOpenApi } from "@autobe/interface";
import { AutoBeOpenApiEndpointComparator, StringUtil } from "@autobe/utils";
import { HashMap, Pair, Singleton } from "tstl";
import { IValidation } from "typia";

import { IAutoBeInterfacePrerequisiteApplication } from "../structures/IAutoBeInterfacePrerequisiteApplication";

export namespace AutoBeInterfacePrerequisiteProgrammer {
  export const associate = (
    operations: AutoBeOpenApi.IOperation[],
  ): HashMap<AutoBeOpenApi.IEndpoint, AutoBeOpenApi.IOperation> =>
    new HashMap<AutoBeOpenApi.IEndpoint, AutoBeOpenApi.IOperation>(
      operations.map(
        (o) => new Pair(AutoBeOpenApiEndpointComparator.clone(o), o),
      ),
      AutoBeOpenApiEndpointComparator.hashCode,
      AutoBeOpenApiEndpointComparator.equals,
    );

  export const validate = (props: {
    document: AutoBeOpenApi.IDocument;
    operation: AutoBeOpenApi.IOperation;
    complete: IAutoBeInterfacePrerequisiteApplication.IComplete;
    accessor?: string;
    dict?: HashMap<AutoBeOpenApi.IEndpoint, AutoBeOpenApi.IOperation>;
  }): IValidation.IError[] => {
    const accessor: string = props.accessor ?? "$input.request";
    const dict: HashMap<AutoBeOpenApi.IEndpoint, AutoBeOpenApi.IOperation> =
      props.dict ?? associate(props.document.operations);

    const table: Singleton<string> = new Singleton(
      () =>
        StringUtil.trim`
        You have to select one of the endpoints below

        Path | Method
        -----|-------
        ${props.document.operations
          .filter(
            (o) =>
              true === isPrerequisite(o) &&
              false ===
                AutoBeOpenApiEndpointComparator.equals(o, props.operation),
          )
          .map((op) => `${op.path} | ${op.method}`)
          .join("\n")}
      `,
    );

    const errors: IValidation.IError[] = [];
    if (
      AutoBeOpenApiEndpointComparator.equals(
        props.operation,
        props.complete.endpoint,
      ) === false
    )
      errors.push({
        path: `${accessor}.endpoint`,
        expected: JSON.stringify({
          path: props.operation.path,
          method: props.operation.method,
        }),
        value: props.complete.endpoint,
        description: StringUtil.trim`
          ## ERROR: Endpoint Mismatch

          The endpoint in your response must EXACTLY match the target operation
          you are analyzing.

          ### Target Operation (What you should analyze)
          
          - Path: ${props.operation.path}
          - Method: ${props.operation.method}

          ### Your Response Endpoint (What you returned)
          
          - Path: ${props.complete.endpoint.path}
          - Method: ${props.complete.endpoint.method}

          ### Why This Matters
          
          You were asked to analyze the prerequisites for a SPECIFIC operation.
          Returning a different endpoint means you analyzed the wrong operation.

          ### How to Fix
          
          Set the \`endpoint\` field to match the target operation exactly:
          
          \`\`\`json
          {
            "endpoint": {
              "path": "${props.operation.path}",
              "method": "${props.operation.method}"
            },
            "prerequisites": [...]
          }
          \`\`\`
        `,
      });
    props.complete.prerequisites.forEach((raw, i) => {
      const it: HashMap.Iterator<
        AutoBeOpenApi.IEndpoint,
        AutoBeOpenApi.IOperation
      > = dict.find(raw.endpoint);
      if (it.equals(dict.end()) === true)
        errors.push({
          path: `${accessor}.prerequisites[${i}].endpoint`,
          expected: "AutoBeOpenApi.IEndpoint",
          value: raw.endpoint,
          description: StringUtil.trim`
            ## ERROR: Prerequisite Operation Does Not Exist

            The prerequisite endpoint you specified does not exist in the API
            specification. You can ONLY use prerequisites from the Available API
            Operations list provided in your context.

            ### Your Invalid Prerequisite [${i}]

            \`${raw.endpoint.method} ${raw.endpoint.path}\`

            ### Why This Is Wrong

            - This endpoint does not exist in the document's operations
            - You may have invented/hallucinated this endpoint
            - You may have made a typo in the path or method
            - You may have referenced an operation that was removed

            ### Available POST Operations (Valid Prerequisites)

            ${table.get()}

            ### How to Fix
            
            Replace this prerequisite with an ACTUAL operation from the list above.
            Double-check:
            
            1. The path matches EXACTLY (including slashes, braces, spelling)
            2. The method is lowercase "post"
            3. The operation exists in your Available API Operations context

            Only use operations that you can SEE in your conversation context.
            NEVER invent or guess operation endpoints.
          `,
        });
      else if (
        AutoBeOpenApiEndpointComparator.equals(props.operation, raw.endpoint)
      )
        errors.push({
          path: `${accessor}.prerequisites[${i}].endpoint`,
          expected: "Different Operation Endpoint from Target Operation",
          value: raw.endpoint,
          description: StringUtil.trim`
            ## CRITICAL ERROR: Self-Reference Detected

            You added the target operation as its own prerequisite. This creates
            a circular dependency and is logically invalid.

            ### Target Operation

            \`${props.operation.method} ${props.operation.path}\`

            ### Your Prerequisite [${i}]

            \`${raw.endpoint.method} ${raw.endpoint.path}\`

            These are THE SAME operation!

            ### Why This Is Wrong
            
            An operation cannot be its own prerequisite. This would mean:
            
            - To execute operation A, you must first execute operation A
            - This creates an infinite loop / circular dependency
            - E2E tests cannot be generated with circular dependencies

            ### Common Mistake
            
            If you have a resource with parent-child relationships (e.g., articles
            that reference parent articles), the prerequisite should create a
            DIFFERENT instance of the resource, not reference itself.

            Example:

            - ❌ Wrong: \`POST /articles\` as prerequisite of \`POST /articles\`
            - ✅ Correct: Remove the self-reference entirely, or if parent article
              is truly needed, the system will handle it through data generation,
              not through explicit prerequisites.

            ### How to Fix
            
            Remove this prerequisite from your prerequisites array. Only include
            operations that create DIFFERENT resources that this operation depends on.

            ### Available POST Operations (Choose Different Operations)

            ${table.get()}
          `,
        });
      else if (isPrerequisite(it.second) === false)
        errors.push({
          path: `${accessor}.prerequisites[${i}].endpoint`,
          expected: "AutoBeOpenApi.IEndpoint",
          value: raw.endpoint,
          description: StringUtil.trim`
            ## ERROR: Invalid Prerequisite Type

            The operation you specified exists, but it CANNOT be used as a
            prerequisite. Only POST operations without authentication can serve
            as prerequisites.

            ### Your Invalid Prerequisite [${i}]

            \`${raw.endpoint.method} ${raw.endpoint.path}\`

            - Method: ${it.second.method}
            - Has Authentication: ${it.second.authorizationType !== null ? "YES" : "NO"}

            ### Why This Is Wrong
            
            Prerequisites must be POST operations because they CREATE resources.
            Other HTTP methods:
            
            - GET: Only reads data, doesn't create prerequisites
            - PUT: Updates existing resources (resource must already exist)
            - DELETE: Removes resources (opposite of creating prerequisites)
            - PATCH: Loads pagination data (not a resource creation operation)

            Operations requiring authentication cannot be prerequisites because
            authentication is a separate concern from resource dependencies.

            ### Valid Prerequisites Are

            - ✅ POST operations (creates resources)
            - ✅ No authentication required (authorizationType === null)

            ### Available POST Operations (Valid Prerequisites)

            ${table.get()}

            ### How to Fix

            Replace this prerequisite with a POST operation from the list above.
            Make sure you understand:
            
            - Prerequisites CREATE resources that the target operation needs
            - Only POST operations create resources
            - GET/PUT/DELETE/PATCH operations are NEVER prerequisites
          `,
        });
    });
    return errors;
  };

  export const isCandidate = (o: AutoBeOpenApi.IOperation): boolean =>
    o.authorizationType === null;

  export const isPrerequisite = (o: AutoBeOpenApi.IOperation): boolean =>
    isCandidate(o) && o.method === "post";
}
