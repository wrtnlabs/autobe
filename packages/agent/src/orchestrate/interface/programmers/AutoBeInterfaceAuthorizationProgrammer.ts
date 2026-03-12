import { AutoBeAnalyze, AutoBeOpenApi } from "@autobe/interface";
import { StringUtil } from "@autobe/utils";
import { singular } from "pluralize";
import typia, { IValidation } from "typia";
import { NamingConvention } from "typia/lib/utils/NamingConvention";

import { AutoBeInterfaceOperationProgrammer } from "./AutoBeInterfaceOperationProgrammer";

export namespace AutoBeInterfaceAuthorizationProgrammer {
  export const getTypeName = (props: {
    prefix: string | null;
    actor: string;
  }): string => {
    return ["I", ...(props.prefix ? [props.prefix] : []), props.actor]
      .map((s) => NamingConvention.pascal(singular(s)))
      .join("");
  };
  export const getSessionTypeName = (props: {
    prefix: string | null;
    actor: string;
  }): string => `${getTypeName(props)}Session`;

  export const filter = (props: {
    actor: string;
    operation: AutoBeOpenApi.IOperation;
  }): boolean =>
    props.actor !== "guest"
      ? true
      : props.operation.authorizationType !== "login";

  export const fixOperations = (props: {
    operations: AutoBeOpenApi.IOperation[];
    prefix: string;
  }): AutoBeOpenApi.IOperation[] => {
    for (const op of props.operations)
      AutoBeInterfaceOperationProgrammer.fix(op);
    return props.operations
      .filter((op) => op.authorizationType !== null)
      .map((op) => {
        return {
          ...op,
          path:
            "/" +
            [props.prefix, ...op.path.split("/")]
              .filter((it) => it !== "")
              .join("/"),
        } satisfies AutoBeOpenApi.IOperation;
      });
  };

  export const validateOperation = (props: {
    operation: AutoBeOpenApi.IOperation;
    actor: AutoBeAnalyze.IActor;
    prefix: string | null;
    accessor: string;
    errors: IValidation.IError[];
  }): void => {
    // common operation validations
    AutoBeInterfaceOperationProgrammer.validate({
      errors: props.errors,
      accessor: props.accessor,
      operation: props.operation,
    });

    // check authorization type
    if (props.operation.authorizationType === null) return;

    // check for which actor is specified
    if (props.operation.authorizationActor !== props.actor.name)
      props.errors.push({
        path: `${props.accessor}.authorizationActor`,
        expected: JSON.stringify(props.actor.name),
        value: props.operation.authorizationActor,
        description: StringUtil.trim`
          The authorizationActor must match the actor associated with
          this authorization operation.

          If this is just a mistake, please change the value accordingly.
          
          Otherwise you actually made for another actor, please entirely
          remake the operation for the correct actor. The other actor
          was already defined elsewhere.

          - Expected actor: ${JSON.stringify(props.actor.name)}
          - Provided actor: ${JSON.stringify(props.operation.authorizationActor)}
        `,
      });

    if (
      props.operation.authorizationType !== "join" &&
      props.operation.authorizationType !== "login" &&
      props.operation.authorizationType !== "refresh"
    )
      return;

    // path parameters must be empty
    if (props.operation.parameters.length !== 0)
      props.errors.push({
        path: `${props.accessor}.parameters`,
        expected: "[] // (empty array)",
        value: props.operation.parameters,
        description: StringUtil.trim`
          Authorization operations (join/login/refresh) cannot have 
          path parameters. All necessary data must be provided in 
          the request body.

          Remove the parameters from the operation.

          Also ensure the following properties are correct:

          - AutoBeOpenApi.IOperation.specification
          - AutoBeOpenApi.IOperation.description
          - AutoBeOpenApi.IOperation.requestBody
          - AutoBeOpenApi.IOperation.responseBody
        `,
      });

    // special authorization cases
    const typeName: string = getTypeName({
      prefix: props.prefix,
      actor: props.actor.name,
    });

    // validate request body
    const requestTypeName: string = `${typeName}.${
      props.operation.authorizationType === "login"
        ? "ILogin"
        : props.operation.authorizationType === "join"
          ? "IJoin"
          : "IRefresh"
    }`;
    if (props.operation.requestBody === null)
      props.errors.push({
        path: `${props.accessor}.requestBody`,
        expected: `AutoBeOpenApi.IRequestBody // typeName: ${requestTypeName}`,
        value: props.operation.requestBody,
        description: StringUtil.trim`
          Request body is required for authentication 
          ${props.operation.authorizationType} operation.

          Write the requestBody with typeName exactly "${requestTypeName}".

          Also ensure the following properties are correct:
          
          - AutoBeOpenApi.IOperation.specification
          - AutoBeOpenApi.IOperation.description
        `,
      });
    else if (props.operation.requestBody.typeName !== requestTypeName)
      props.errors.push({
        path: `${props.accessor}.requestBody.typeName`,
        expected: `AutoBeOpenApi.IOperation with requestBody.typeName: ${requestTypeName}`,
        value: props.operation.requestBody.typeName,
        description: StringUtil.trim`
          Wrong request body type name: "${props.operation.requestBody.typeName}"

          Fix the requestBody.typeName to exactly "${requestTypeName}".

          Also ensure the following properties are correct:
          
          - AutoBeOpenApi.IOperation.specification
          - AutoBeOpenApi.IOperation.description
          - AutoBeOpenApi.IOperation.requestBody.description
        `,
      });

    // validate response body
    const responseTypeName: string = `${typeName}.IAuthorized`;
    if (props.operation.responseBody === null)
      props.errors.push({
        path: `${props.accessor}.responseBody`,
        expected: `AutoBeOpenApi.IResponseBody // typeName: ${responseTypeName}`,
        value: props.operation.responseBody,
        description: StringUtil.trim`
          Response body is required for authentication ${props.operation.authorizationType} operation.

          Write the responseBody with typeName exactly "${responseTypeName}".

          Also ensure the following properties are correct:
          
          - AutoBeOpenApi.IOperation.specification
          - AutoBeOpenApi.IOperation.description
        `,
      });
    else if (props.operation.responseBody.typeName !== responseTypeName)
      props.errors.push({
        path: `${props.accessor}.responseBody.typeName`,
        expected: JSON.stringify(responseTypeName),
        value: props.operation.responseBody.typeName,
        description: StringUtil.trim`
          Wrong response body type name: "${props.operation.responseBody.typeName}"

          Fix the responseBody.typeName to exactly "${responseTypeName}".
          Also ensure the following properties are correct:

          - AutoBeOpenApi.IOperation.specification
          - AutoBeOpenApi.IOperation.description
          - AutoBeOpenApi.IOperation.responseBody.description
        `,
      });
  };

  export const validateAuthorizationTypes = (props: {
    actor: AutoBeAnalyze.IActor;
    operations: AutoBeOpenApi.IOperation[];
    accessor: string;
    errors: IValidation.IError[];
  }): void => {
    type AuthorizationType = AutoBeOpenApi.IOperation["authorizationType"];
    for (const type of typia.misc.literals<AuthorizationType>()) {
      // Skip null - these are handled by Base/Action Endpoint generators
      if (type === null) continue;
      if (props.actor.kind === "guest" && type === "login") continue;
      const count: number = props.operations.filter(
        (o) => o.authorizationType === type,
      ).length;
      if (count === 0)
        props.errors.push({
          path: props.accessor,
          value: props.operations,
          expected: StringUtil.trim`
            {
              ...(AutoBeOpenApi.IOperation data),
              authorizationType: "${type}"
            }
          `,
          description: StringUtil.trim`
            There must be an operation that has defined 
            (AutoBeOpenApi.IOperation.authorizationType := "${type}")
            for the "${props.actor.name}" role's authorization activity; "${type}".

            However, none of the operations have the 
            (AutoBeOpenApi.IOperation.authorizationType := "${type}") value, 
            so that the "${props.actor.name}" cannot perform the authorization ${type} activity.

            Please make that operation at the next function calling. You have to do it.
          `,
        });
      else if (count > 1)
        props.errors.push({
          path: props.accessor,
          value: props.operations,
          expected: `Only one operation with authorizationType "${type}"`,
          description: StringUtil.trim`
            There must be only one operation that has defined 
            (AutoBeOpenApi.IOperation.authorizationType := "${type}")
            for the "${props.actor.name}" role's authorization activity; "${type}".

            However, multiple operations (${count} operations) have the
            (AutoBeOpenApi.IOperation.authorizationType := "${type}") value,
            so that the "${props.actor.name}" cannot determine which operation to use
            for the authorization ${type} activity.

            Please ensure that only one operation is defined for each
            authorizationType per actor.
          `,
        });
    }
  };
}
