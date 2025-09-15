import { AutoBeEvent } from "./AutoBeEvent";
import { AutoBeVendorRequestEvent } from "./AutoBeVendorRequestEvent";
import { AutoBeVendorResponseEvent } from "./AutoBeVendorResponseEvent";
import { AutoBeVendorTimeoutEvent } from "./AutoBeVendorTimeoutEvent";

/** @internal */
export type AutoBeEventOfSerializable = Exclude<
  AutoBeEvent,
  | AutoBeVendorRequestEvent
  | AutoBeVendorResponseEvent
  | AutoBeVendorTimeoutEvent
>;

/** @internal */
export namespace AutoBeEventOfSerializable {
  export type Type = AutoBeEventOfSerializable["type"];
  export type Mapper = Omit<
    AutoBeEvent.Mapper,
    "vendorRequest" | "vendorResponse" | "vendorTimeout"
  >;
}
