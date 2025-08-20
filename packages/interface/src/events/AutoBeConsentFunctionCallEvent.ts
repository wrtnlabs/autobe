import { AutoBeEventBase } from "./AutoBeEventBase";
import { AutoBeEventSource } from "./AutoBeEventSource";

export interface AutoBeConsentFunctionCallEvent
  extends AutoBeEventBase<"consentFunctionCall"> {
  source: AutoBeEventSource;
  assistantMessage: string;
  result: AutoBeConsentFunctionCallEvent.IResult | null;
}
export namespace AutoBeConsentFunctionCallEvent {
  export type IResult = IConsent | INotApplicable | IAssistantMessage;
  export interface IConsent {
    type: "consent";
    message: string;
  }
  export interface INotApplicable {
    type: "notApplicable";
  }
  export interface IAssistantMessage {
    type: "assistantMessage";
    message: string;
  }
}
