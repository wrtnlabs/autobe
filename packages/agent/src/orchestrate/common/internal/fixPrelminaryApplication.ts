import { AutoBeHistory, AutoBePreliminaryKind } from "@autobe/interface";
import {
  ChatGptTypeChecker,
  ClaudeTypeChecker,
  IChatGptSchema,
  ILlmApplication,
  ILlmFunction,
  ILlmSchema,
} from "@samchon/openapi";

import { AutoBeState } from "../../../context/AutoBeState";
import { AutoBePreliminaryController } from "../AutoBePreliminaryController";
import { IAutoBePreliminaryRequest } from "../structures/AutoBePreliminaryRequest";

export const fixPreliminaryApplication = <
  Kind extends AutoBePreliminaryKind,
  Model extends Exclude<ILlmSchema.Model, "3.0">,
>(props: {
  histories: readonly AutoBeHistory[];
  state: AutoBeState;
  preliminary: AutoBePreliminaryController<Kind>;
  application: ILlmApplication<Model>;
  model: Model;
}): void => {
  if (
    props.preliminary.getKinds().some((k) => k.includes("previous")) === false
  )
    return;

  const func: ILlmFunction<Model> | undefined =
    props.application.functions.find((f) => f.name === "process");
  if (func === undefined) return;

  const request: ILlmSchema<Model> | undefined =
    func.parameters.properties.request;
  if (request === undefined) return;

  const eraseKind = (kind: AutoBePreliminaryKind) => {
    props.preliminary
      .getKinds()
      .splice(props.preliminary.getKinds().indexOf(kind as any), 1);
    delete (props.preliminary.getAll() as any)[kind];
    delete (props.preliminary.getLocal() as any)[kind];
  };
  const eraseMetadata = getUnionErasure({
    model: props.model,
    $defs: func.parameters.$defs,
    request,
  });
  if (eraseMetadata === null) return;

  const reversed: AutoBeHistory[] = props.histories.slice().reverse();
  const previous = (type: "analyze" | "prisma" | "interface"): boolean =>
    props.state[type] !== null &&
    reversed.some((h) => h.type === type && h !== props.state[type]);
  for (const kind of props.preliminary.getKinds()) {
    if (kind.startsWith("previous") === false) continue;
    else if (kind === "previousAnalysisFiles") {
      if (previous("analyze")) {
        eraseMetadata("getPreviousAnalysisFiles");
        eraseKind(kind);
      }
    } else if (kind === "previousPrismaSchemas") {
      if (previous("prisma")) {
        eraseMetadata("getPreviousPrismaSchemas");
        eraseKind(kind);
      }
    } else if (kind === "previousInterfaceOperations") {
      if (previous("interface")) {
        eraseMetadata("getPreviousInterfaceOperations");
        eraseKind(kind);
      }
    } else if (kind === "previousInterfaceSchemas") {
      if (previous("interface")) {
        eraseMetadata("getPreviousInterfaceSchemas");
        eraseKind(kind);
      }
    }
  }
};

const getUnionErasure = <
  Model extends Exclude<ILlmSchema.Model, "3.0">,
>(props: {
  model: Model;
  $defs: Record<string, IChatGptSchema>;
  request: ILlmSchema<Model>;
}) =>
  props.model === "chatgpt" || props.model === "gemini"
    ? getUnionErasureOfChatGpt(props)
    : getUnionErasureOfClaude(props);

const getUnionErasureOfChatGpt = (props: {
  $defs: Record<string, IChatGptSchema>;
  request: IChatGptSchema;
}) => {
  if (ChatGptTypeChecker.isAnyOf(props.request) === false) return null;
  else if (
    props.request.anyOf.some((s) => ChatGptTypeChecker.isReference(s) === false)
  )
    return null;

  const children: IChatGptSchema.IReference[] = props.request
    .anyOf as IChatGptSchema.IReference[];
  const mapping: Record<string, string> =
    props.request["x-discriminator"]?.mapping ?? {};

  return (
    key: IAutoBePreliminaryRequest<
      Extract<AutoBePreliminaryKind, `previous${string}`>
    >["request"]["type"],
  ): void => {
    const index: number = children.findIndex((c) => c.$ref.endsWith(`/${key}`));
    if (index !== -1) children.splice(index, 1);
    delete props.$defs[key];
    delete mapping[key];
  };
};

const getUnionErasureOfClaude = (props: {
  $defs: Record<string, IChatGptSchema>;
  request: IChatGptSchema;
}) => {
  if (ClaudeTypeChecker.isOneOf(props.request) === false) return null;
  else if (
    props.request.oneOf.some((s) => ClaudeTypeChecker.isReference(s) === false)
  )
    return null;

  const children: IChatGptSchema.IReference[] = props.request
    .oneOf as IChatGptSchema.IReference[];
  const mapping: Record<string, string> =
    props.request.discriminator?.mapping ?? {};

  return (
    key: IAutoBePreliminaryRequest<
      Extract<AutoBePreliminaryKind, `previous${string}`>
    >["request"]["type"],
  ): void => {
    const index: number = children.findIndex((c) => c.$ref.endsWith(`/${key}`));
    if (index !== -1) children.splice(index, 1);
    delete props.$defs[key];
    delete mapping[key];
  };
};
