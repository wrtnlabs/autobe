import { AutoBeOpenApi } from "@autobe/interface";
import { StringUtil } from "@autobe/utils";
import typia, { IValidation } from "typia";

import { AutoBeInterfaceOperationProgrammer } from "./AutoBeInterfaceOperationProgrammer";

export namespace AutoBeInterfaceAuthorizationProgrammer {
  export const filter = (props: {
    actor: string;
    operation: AutoBeOpenApi.IOperation;
  }): boolean =>
    props.actor !== "guest"
      ? true
      : props.operation.authorizationType !== "login";

  export const validateOperation = (props: {
    operation: AutoBeOpenApi.IOperation;
    actor: string;
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

    // path parameters must be empty
    if (props.operation.parameters.length !== 0)
      props.errors.push({
        path: `${props.accessor}.parameters`,
        expected: "[] (no parameters allowed for authorization operations)",
        value: props.operation.parameters,
        description: StringUtil.trim`
          Authorization operations cannot have parameters. 
          
          All necessary data must be provided in the request body.
        `,
      });

    // check for which actor is specified
    if (props.operation.authorizationActor !== props.actor)
      props.errors.push({
        path: `${props.accessor}.authorizationActor`,
        expected: JSON.stringify(props.actor),
        value: props.operation.authorizationActor,
        description: StringUtil.trim`
          The authorizationActor must match the actor associated with
          this authorization operation.

          If this is just a mistake, please change the value accordingly.
          
          Otherwise you actually made for another actor, please entirely
          remake the operation for the correct actor. The other actor
          was already defined elsewhere.

          - Expected actor: ${JSON.stringify(props.actor)}
          - Provided actor: ${JSON.stringify(props.operation.authorizationActor)}
        `,
      });

    // validate request body
    if (
      props.operation.authorizationType === "join" ||
      props.operation.authorizationType === "login"
    ) {
      const expected: string =
        props.operation.authorizationType === "login" ? "ILogin" : "IJoin";
      if (props.operation.requestBody === null)
        props.errors.push({
          path: `${props.accessor}.requestBody`,
          expected: `AutoBeOpenApi.IRequestBody`,
          value: props.operation.requestBody,
          description: StringUtil.trim`
            Request body is required for authentication ${props.operation.authorizationType} operation.

            Define it with typeName and description fields. Note that, the typeName must end with ".${expected}" 
            
            (e.g., IUser.${expected}, IAdmin.${expected}).
          `,
        });
      else if (
        props.operation.requestBody.typeName.endsWith(`.${expected}`) === false
      )
        props.errors.push({
          path: `${props.accessor}.requestBody.typeName`,
          expected: `Type name must be I{RoleName(PascalCase)}.${expected}`,
          value: props.operation.requestBody.typeName,
          description: StringUtil.trim`
            Wrong request body type name: ${props.operation.requestBody.typeName}

            For authentication ${props.operation.authorizationType} operation, 
            the request body type name must follow the convention 
            "I{RoleName}.${expected}".

            This standardized naming convention ensures consistency across all authentication 
            endpoints and clearly identifies ${props.operation.authorizationType} request types.
            The actor name should be in PascalCase format 
            
            (e.g., IUser.${expected}, IAdmin.${expected}, ISeller.${expected}).
          `,
        });

      // validate response body
      if (props.operation.responseBody === null)
        props.errors.push({
          path: `${props.accessor}.responseBody`,
          expected: `AutoBeOpenApi.IResponseBody`,
          value: props.operation.responseBody,
          description: StringUtil.trim`
            Response body is required for authentication operations.
            The responseBody must contain description and typeName fields.
            
            "AutoBeOpenApi.IResponseBody.typeName" must be 
            "I{Prefix(PascalCase)}{RoleName(PascalCase)}.IAuthorized", and
            "description" must be a detailed description of the response body.
          `,
        });
      else if (
        props.operation.responseBody.typeName.endsWith(".IAuthorized") === false
      )
        props.errors.push({
          path: `${props.accessor}.responseBody.typeName`,
          expected: "`${string}.IAuthorized`",
          value: props.operation.responseBody.typeName,
          description: StringUtil.trim`
            Wrong response body type name: ${props.operation.responseBody.typeName}

            For authentication operations (login, join, refresh), the response body type name 
            must follow the convention "I{RoleName}.IAuthorized".

            This standardized naming convention ensures consistency across all 
            authentication endpoints and clearly identifies authorization response types.
            
            The actor name should be in PascalCase format 
            (e.g., IUser.IAuthorized, IAdmin.IAuthorized, ISeller.IAuthorized).
          `,
        });
    }
  };

  export const validateAuthorizationTypes = (props: {
    actor: string;
    operations: AutoBeOpenApi.IOperation[];
    accessor: string;
    errors: IValidation.IError[];
  }): void => {
    type AuthorizaationType = AutoBeOpenApi.IOperation["authorizationType"];
    for (const type of typia.misc.literals<AuthorizaationType>()) {
      if (props.actor === "guest" && type === "login") continue;
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
            for the "${props.actor}" role's authorization activity; "${type}".

            However, none of the operations have the 
            (AutoBeOpenApi.IOperation.authorizationType := "${type}") value, 
            so that the "${props.actor}" cannot perform the authorization ${type} activity.

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
            for the "${props.actor}" role's authorization activity; "${type}".

            However, multiple operations (${count} operations) have the
            (AutoBeOpenApi.IOperation.authorizationType := "${type}") value,
            so that the "${props.actor}" cannot determine which operation to use
            for the authorization ${type} activity.

            Please ensure that only one operation is defined for each
            authorizationType per actor.
          `,
        });
    }
  };
}
