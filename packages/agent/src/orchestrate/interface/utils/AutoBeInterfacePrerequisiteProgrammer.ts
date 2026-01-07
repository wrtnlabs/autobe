import { AutoBeOpenApi } from "@autobe/interface";
import { AutoBeOpenApiEndpointComparator } from "@autobe/utils";
import { HashMap, Pair } from "tstl";
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
      });

    props.complete.prerequisites.forEach((raw, i) => {
      const it: HashMap.Iterator<
        AutoBeOpenApi.IEndpoint,
        AutoBeOpenApi.IOperation
      > = dict.find(raw.endpoint);
      if (it.equals(dict.end()) === true)
        errors.push({
          path: `${accessor}.prerequisites[${i}].endpoint`,
          expected: "Existing Operation Endpoint",
          value: raw.endpoint,
        });
      else if (
        AutoBeOpenApiEndpointComparator.equals(props.operation, raw.endpoint)
      )
        errors.push({
          path: `${accessor}.prerequisites[${i}].endpoint`,
          expected: "Different Operation Endpoint from Target Operation",
          value: raw.endpoint,
        });
      else if (isPrerequisite(it.second) === false)
        errors.push({
          path: `${accessor}.prerequisites[${i}].endpoint`,
          expected: "Prerequisite Operation Endpoint",
          value: raw.endpoint,
        });
    });
    return errors;
  };

  export const isCandidate = (o: AutoBeOpenApi.IOperation): boolean =>
    o.authorizationType === null;

  export const isPrerequisite = (o: AutoBeOpenApi.IOperation): boolean =>
    isCandidate(o) && o.method === "post";
}
