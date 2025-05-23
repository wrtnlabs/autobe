import { AutoBeEventBase } from "./AutoBeEventBase";

export interface AutoBePrismaComponentsEvent
  extends AutoBeEventBase<"prismaComponents"> {
  components: { filename: string; tables: string[] }[];
  step: number;
}
