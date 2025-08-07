import { AutoBeEvent } from "@autobe/interface";

import { AllUnionMembersIncluded, IsTrue } from "../util/types";

export const AUTOBE_API_KEY = "auto-be-api-key";
export const AUTOBE_CONFIG = "auto-be-config";
export const AUTOBE_CHAT_SESSION_MAP = "auto-be-chat-session-map";
export const AUTOBE_EVENT_TYPES = [
  "userMessage",
  "assistantMessage",
  "analyzeStart",
  "analyzeWrite",
  "analyzeReview",
  "analyzeComplete",
  "interfaceStart",
  "interfaceGroups",
  "interfaceEndpoints",
  "interfaceOperations",
  "interfaceSchemas",
  "interfaceComplement",
  "interfaceComplete",
  "prismaStart",
  "prismaComponents",
  "prismaSchemas",
  "prismaInsufficient",
  "prismaReview",
  "prismaValidate",
  "prismaCorrect",
  "prismaComplete",
  "testStart",
  "testScenario",
  "testWrite",
  "testValidate",
  "testCorrect",
  "testComplete",
  "realizeStart",
  "realizeWrite",
  "realizeCorrect",
  "realizeValidate",
  "realizeComplete",
  "realizeAuthorizationStart",
  "realizeAuthorizationWrite",
  "realizeAuthorizationValidate",
  "realizeAuthorizationCorrect",
  "realizeAuthorizationComplete",
  "realizeTestStart",
  "realizeTestReset",
  "realizeTestOperation",
  "realizeTestComplete",
] as const;

type _Test = [
  IsTrue<AllUnionMembersIncluded<AutoBeEvent.Type, typeof AUTOBE_EVENT_TYPES>>,
];
