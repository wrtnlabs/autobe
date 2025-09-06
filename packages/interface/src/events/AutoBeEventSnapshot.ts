import { IAutoBeTokenUsageJson } from "../json";
import { AutoBeEvent } from "./AutoBeEvent";
import { AutoBeVendorRequestEvent } from "./AutoBeVendorRequestEvent";
import { AutoBeVendorResponseEvent } from "./AutoBeVendorResponseEvent";

/** @internal */
export interface AutoBeEventSnapshot<
  Event extends Exclude<
    AutoBeEvent,
    AutoBeVendorRequestEvent | AutoBeVendorResponseEvent
  > = Exclude<
    AutoBeEvent,
    AutoBeVendorRequestEvent | AutoBeVendorResponseEvent
  >,
> {
  event: Event;
  tokenUsage: IAutoBeTokenUsageJson;
}
