import { AutoBePreliminaryKind } from "@autobe/interface";
import {
  ILlmApplication,
  ILlmFunction,
  ILlmSchema,
  LlmTypeChecker,
} from "@samchon/openapi";

import { AutoBeState } from "../../../context/AutoBeState";
import { AutoBePreliminaryController } from "../AutoBePreliminaryController";
import { IAutoBePreliminaryRequest } from "../structures/AutoBePreliminaryRequest";

export const fixPreliminaryApplication = <
  Kind extends AutoBePreliminaryKind,
>(props: {
  state: AutoBeState;
  preliminary: AutoBePreliminaryController<Kind>;
  application: ILlmApplication;
}): void => {
  if (
    props.preliminary.getKinds().some((k) => k.includes("previous")) === false
  )
    return;

  const func: ILlmFunction | undefined = props.application.functions.find(
    (f) => f.name === "process",
  );
  if (func === undefined) return;

  const request: ILlmSchema | undefined = func.parameters.properties.request;
  if (request === undefined) return;

  const eraseKind = (kind: AutoBePreliminaryKind) => {
    props.preliminary
      .getKinds()
      .splice(props.preliminary.getKinds().indexOf(kind as any), 1);
    delete (props.preliminary.getAll() as any)[kind];
    delete (props.preliminary.getLocal() as any)[kind];
  };
  const eraseMetadata = getUnionErasure({
    $defs: func.parameters.$defs,
    request,
  });
  if (eraseMetadata === null) return;

  for (const kind of props.preliminary.getKinds().slice())
    if (kind === "previousAnalysisFiles") {
      if (props.state.previousAnalyze === null) {
        eraseMetadata("getPreviousAnalysisFiles");
        eraseKind(kind);
      }
    } else if (kind === "previousDatabaseSchemas") {
      if (props.state.previousDatabase === null) {
        eraseMetadata("getPreviousDatabaseSchemas");
        eraseKind(kind);
      }
    } else if (kind === "previousInterfaceOperations") {
      if (props.state.previousInterface === null) {
        eraseMetadata("getPreviousInterfaceOperations");
        eraseKind(kind);
      }
    } else if (kind === "previousInterfaceSchemas") {
      if (props.state.previousInterface === null) {
        eraseMetadata("getPreviousInterfaceSchemas");
        eraseKind(kind);
      }
    }
};

const getUnionErasure = (props: {
  $defs: Record<string, ILlmSchema>;
  request: ILlmSchema;
}) => getUnionErasureOfChatGpt(props);

const getUnionErasureOfChatGpt = (props: {
  $defs: Record<string, ILlmSchema>;
  request: ILlmSchema;
}) => {
  if (LlmTypeChecker.isAnyOf(props.request) === false) return null;
  else if (
    props.request.anyOf.some((s) => LlmTypeChecker.isReference(s) === false)
  )
    return null;

  const children: ILlmSchema.IReference[] = props.request
    .anyOf as ILlmSchema.IReference[];
  const mapping: Record<string, string> =
    props.request["x-discriminator"]?.mapping ?? {};

  return (
    key: IAutoBePreliminaryRequest<
      Extract<AutoBePreliminaryKind, `previous${string}`>
    >["request"]["type"],
  ): void => {
    const type: string = `IAutoBePreliminary${key[0].toUpperCase()}${key.substring(1)}`;
    const index: number = children.findIndex((c) =>
      c.$ref.endsWith(`/${type}`),
    );
    if (index !== -1) children.splice(index, 1);
    delete props.$defs[key];
    delete mapping[key];
  };
};
