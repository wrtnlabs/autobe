import { tags } from "typia";

import { IAutoBePrismaCompilerResult } from "../compiler/IAutoBePrismaCompilerResult";
import { AutoBeUserMessageContent } from "../histories/contents/AutoBeUserMessageContent";
import { AutoBeOpenApi } from "../openapi/AutoBeOpenApi";

export type IAutoBeEventJson =
  | IAutoBeEventJson.IAssistantMessage
  | IAutoBeEventJson.IUserMessage
  | IAutoBeEventJson.IAnalyzeStart
  | IAutoBeEventJson.IAnalyzeComplete
  | IAutoBeEventJson.IPrismaStart
  | IAutoBeEventJson.IPrismaComplete
  | IAutoBeEventJson.IPrismaValidate
  | IAutoBeEventJson.IInterfaceStart
  | IAutoBeEventJson.IInterfaceEndpoints
  | IAutoBeEventJson.IInterfaceOperations
  | IAutoBeEventJson.IInterfaceComponents
  | IAutoBeEventJson.IInterfaceComplete
  | IAutoBeEventJson.ITestStart
  | IAutoBeEventJson.ITestComplete
  | IAutoBeEventJson.IRealizeStart
  | IAutoBeEventJson.IRealizeComplete;
export namespace IAutoBeEventJson {
  export type Type = IAutoBeEventJson["type"];
  export type Mapper = {
    assistantMessage: IAssistantMessage;
    userMessage: IUserMessage;
    analyzeStart: IAnalyzeStart;
    analyzeComplete: IAnalyzeComplete;
    prismaStart: IPrismaStart;
    prismaComplete: IPrismaComplete;
    prismaValidate: IPrismaValidate;
    interfaceStart: IInterfaceStart;
    interfaceEndpoints: IInterfaceEndpoints;
    interfaceOperations: IInterfaceOperations;
    interfaceComponents: IInterfaceComponents;
    interfaceComplete: IInterfaceComplete;
    testStart: ITestStart;
    testComplete: ITestComplete;
    realizeStart: IRealizeStart;
    realizeComplete: IRealizeComplete;
  };

  export interface IAssistantMessage extends IBase<"assistantMessage"> {
    text: string;
  }
  export interface IUserMessage extends IBase<"userMessage"> {
    contents: AutoBeUserMessageContent[];
  }

  export interface IAnalyzeStart extends IBase<"analyzeStart"> {
    reason: string;
    step: number;
  }
  export interface IAnalyzeComplete extends IBase<"analyzeComplete"> {
    files: Record<string, string>;
    step: number;
  }

  export interface IPrismaStart extends IBase<"prismaStart"> {
    reason: string;
    step: number;
  }
  export interface IPrismaComplete extends IBase<"prismaComplete"> {
    schemas: Record<string, string>;
    diagrams: Record<string, string>;
    document: AutoBeOpenApi.IDocument;
    step: number;
  }
  export interface IPrismaValidate extends IBase<"prismaValidate"> {
    schemas: Record<string, string>;
    result:
      | IAutoBePrismaCompilerResult.IFailure
      | IAutoBePrismaCompilerResult.IException;
    step: number;
  }

  export interface IInterfaceStart extends IBase<"interfaceStart"> {
    reason: string;
    step: number;
  }
  export interface IInterfaceEndpoints extends IBase<"interfaceEndpoints"> {
    endpoints: AutoBeOpenApi.IEndpoint[];
    step: number;
  }
  export interface IInterfaceOperations extends IBase<"interfaceOperations"> {
    operations: AutoBeOpenApi.IOperation[];
    completed: number;
    total: number;
    step: number;
  }
  export interface IInterfaceComponents extends IBase<"interfaceComponents"> {
    components: AutoBeOpenApi.IComponents;
    completed: number;
    total: number;
    step: number;
  }
  export interface IInterfaceComplete extends IBase<"interfaceComplete"> {
    document: AutoBeOpenApi.IDocument;
    files: Record<string, string>;
    reason: string;
    step: number;
  }

  export interface ITestStart extends IBase<"testStart"> {
    reason: string;
    step: number;
  }
  export interface ITestComplete extends IBase<"testComplete"> {
    files: Record<string, string>;
  }

  export interface IRealizeStart extends IBase<"realizeStart"> {
    reason: string;
    step: number;
  }
  export interface IRealizeComplete extends IBase<"realizeComplete"> {
    files: Record<string, string>;
    step: number;
  }

  interface IBase<Type extends string> {
    type: Type;
    created_at: string & tags.Format<"date-time">;
  }
}
