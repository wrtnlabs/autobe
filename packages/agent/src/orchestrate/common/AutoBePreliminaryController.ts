import { IMicroAgenticaHistoryJson } from "@agentica/core";
import { AutoBeEventSource, AutoBePreliminaryKind } from "@autobe/interface";
import { ILlmSchema, IValidation, OpenApiTypeChecker } from "@samchon/openapi";
import { IJsonSchemaApplication } from "typia";
import { v7 } from "uuid";

import { AutoBeConfigConstant } from "../../constants/AutoBeConfigConstant";
import { AutoBeContext } from "../../context/AutoBeContext";
import { AutoBeState } from "../../context/AutoBeState";
import { transformPreliminaryHistory } from "./histories/transformPreliminaryHistory";
import { complementPreliminaryCollection } from "./internal/complementPreliminaryCollection";
import { createPreliminaryCollection } from "./internal/createPreliminaryCollection";
import { validatePreliminary } from "./internal/validatePreliminary";
import { orchestratePreliminary } from "./orchestratePreliminary";
import { IAutoBePreliminaryRequest } from "./structures/AutoBePreliminaryRequest";
import { IAutoBeOrchestrateResult } from "./structures/IAutoBeOrchestrateResult";
import { IAutoBePreliminaryCollection } from "./structures/IAutoBePreliminaryCollection";

export class AutoBePreliminaryController<Kind extends AutoBePreliminaryKind> {
  // METADATA
  private readonly source: Exclude<AutoBeEventSource, "facade" | "preliminary">;
  private readonly source_id: string;
  private readonly kinds: Kind[];
  private readonly argumentTypeNames: string[];

  // PRELIMINARY DATA
  private readonly all: Pick<IAutoBePreliminaryCollection, Kind>;
  private readonly local: Pick<IAutoBePreliminaryCollection, Kind>;

  public constructor(props: AutoBePreliminaryController.IProps<Kind>) {
    this.source = props.source;
    this.source_id = v7();
    this.kinds = props.kinds;
    this.argumentTypeNames = (() => {
      const func = props.application.functions.find(
        (f) => f.name === "process",
      );
      if (func === undefined)
        throw new Error("Unable to find 'process' function in application.");

      const param = func.parameters[0]?.schema;
      if (
        param === undefined ||
        OpenApiTypeChecker.isReference(param) === false
      )
        throw new Error(
          "'process' function parameter is not a reference type.",
        );
      const schema =
        props.application.components.schemas?.[param.$ref.split("/").pop()!];
      if (schema === undefined || OpenApiTypeChecker.isObject(schema) === false)
        throw new Error(
          "'process' function parameter reference is not an object type.",
        );
      const request = schema.properties?.request;
      if (
        request === undefined ||
        OpenApiTypeChecker.isOneOf(request) === false
      )
        throw new Error(
          "'process' function parameter.request is not a oneOf type.",
        );
      else if (
        request.oneOf.length === 0 ||
        request.oneOf.every(
          (sch) => OpenApiTypeChecker.isReference(sch) === false,
        )
      )
        throw new Error(
          "'process' function parameter.request oneOf does not contain any reference type.",
        );
      return request.oneOf.map((sch) => {
        const ref = (sch as any).$ref;
        return ref.split("/").pop()!;
      });
    })();

    this.all = createPreliminaryCollection(props.state, props.all);
    this.local = createPreliminaryCollection(null, props.local);

    complementPreliminaryCollection({
      kinds: props.kinds,
      all: this.all as IAutoBePreliminaryCollection,
      local: this.local as IAutoBePreliminaryCollection,
    });
  }

  public validate(
    input: IAutoBePreliminaryRequest<Kind>,
  ): IValidation<IAutoBePreliminaryRequest<Kind>> {
    return validatePreliminary(this, input);
  }

  public createHistories(): IMicroAgenticaHistoryJson[] {
    return transformPreliminaryHistory(this);
  }

  public getSource(): Exclude<AutoBeEventSource, "facade" | "preliminary"> {
    return this.source;
  }

  public getKinds(): Kind[] {
    return this.kinds;
  }

  public getArgumentTypeNames(): string[] {
    return this.argumentTypeNames;
  }

  public getAll(): Pick<IAutoBePreliminaryCollection, Kind> {
    return this.all;
  }

  public getLocal(): Pick<IAutoBePreliminaryCollection, Kind> {
    return this.local;
  }

  public async orchestrate<Model extends ILlmSchema.Model, T>(
    ctx: AutoBeContext<Model>,
    process: (
      out: (
        result: AutoBeContext.IResult<Model>,
      ) => (value: T | null) => IAutoBeOrchestrateResult<Model, T>,
    ) => Promise<IAutoBeOrchestrateResult<Model, T>>,
  ): Promise<T | never> {
    for (let i: number = 0; i < AutoBeConfigConstant.RAG_LIMIT; ++i) {
      const result: IAutoBeOrchestrateResult<Model, T> = await process(
        (x) => (value) => ({
          ...x,
          value,
        }),
      );
      if (result.value !== null) return result.value;

      await orchestratePreliminary(ctx, {
        source_id: this.source_id,
        source: this.source,
        preliminary: this,
        trial: i + 1,
        histories: result.histories,
      });
    }
    throw new Error(
      "Preliminary process exceeded the maximum number of retries.",
    );
  }
}
export namespace AutoBePreliminaryController {
  export interface IProps<Kind extends AutoBePreliminaryKind> {
    source: Exclude<AutoBeEventSource, "facade" | "preliminary">;
    application: IJsonSchemaApplication;
    kinds: Kind[];
    state: AutoBeState;
    all?: Partial<Pick<IAutoBePreliminaryCollection, Kind>>;
    local?: Partial<Pick<IAutoBePreliminaryCollection, Kind>>;
  }
  export interface IProcessResult<T> {
    value: T | undefined;
    histories: IMicroAgenticaHistoryJson[];
  }
}
