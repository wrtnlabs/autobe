import { AutoBeUserMessageContentBase } from "./AutoBeUserMessageContentBase";

export interface AutoBeUserMessageFileContent
  extends AutoBeUserMessageContentBase<"file"> {
  file:
    | AutoBeUserMessageFileContent.IReference
    | AutoBeUserMessageFileContent.IData;
}
export namespace AutoBeUserMessageFileContent {
  export interface IReference {
    type: "reference";
    id: string;
  }
  export interface IData {
    type: "data";
    name: string;
    data: string;
  }
}
