import { AutoBeEventBase } from "./AutoBeEventBase";

export interface AutoBePrismaStartEvent extends AutoBeEventBase<"prismaStart"> {
  reason: string;
  step: number;
}
