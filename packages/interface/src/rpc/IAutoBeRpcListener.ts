import { IAutoBeEventJson } from "../json";

export interface IAutoBeRpcListener {
  assistantMessage(event: IAutoBeEventJson.IAssistantMessage): Promise<void>;
  userMessage?(event: IAutoBeEventJson.IUserMessage): Promise<void>;

  analyzeStart?(event: IAutoBeEventJson.IAnalyzeStart): Promise<void>;
  analyzeWriteDocument?(
    event: IAutoBeEventJson.IAnalyzeWriteDocument,
  ): Promise<void>;
  analyzeReview?(event: IAutoBeEventJson.IAnalyzeReview): Promise<void>;
  analyzeComplete?(event: IAutoBeEventJson.IAnalyzeComplete): Promise<void>;

  prismaStart?(event: IAutoBeEventJson.IPrismaStart): Promise<void>;
  prismaSchemas?(event: IAutoBeEventJson.IPrismaSchemas): Promise<void>;
  prismaComponents?(event: IAutoBeEventJson.IPrismaComponents): Promise<void>;
  prismaComplete?(event: IAutoBeEventJson.IPrismaComplete): Promise<void>;
  prismaValidate?(event: IAutoBeEventJson.IPrismaValidate): Promise<void>;

  interfaceStart?(event: IAutoBeEventJson.IInterfaceStart): Promise<void>;
  interfaceEndpoints?(
    event: IAutoBeEventJson.IInterfaceEndpoints,
  ): Promise<void>;
  interfaceOperations?(
    event: IAutoBeEventJson.IInterfaceOperations,
  ): Promise<void>;
  interfaceComponents?(
    event: IAutoBeEventJson.IInterfaceComponents,
  ): Promise<void>;
  interfaceComplete?(event: IAutoBeEventJson.IInterfaceComplete): Promise<void>;

  testStart?(event: IAutoBeEventJson.ITestStart): Promise<void>;
  testProgress?(event: IAutoBeEventJson.ITestProgress): Promise<void>;
  testValidate?(event: IAutoBeEventJson.ITestValidate): Promise<void>;
  testComplete?(event: IAutoBeEventJson.ITestComplete): Promise<void>;

  realizeStart?(event: IAutoBeEventJson.IRealizeStart): Promise<void>;
  realizeProgress?(event: IAutoBeEventJson.IRealizeProgress): Promise<void>;
  realizeValidate?(event: IAutoBeEventJson.IRealizeValidate): Promise<void>;
  realizeComplete?(event: IAutoBeEventJson.IRealizeComplete): Promise<void>;
}
