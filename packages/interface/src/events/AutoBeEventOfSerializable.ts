import { AutoBeEvent } from "./AutoBeEvent";
import { AutoBeVendorRequestEvent } from "./AutoBeVendorRequestEvent";
import { AutoBeVendorResponseEvent } from "./AutoBeVendorResponseEvent";

/** @internal */
export type AutoBeEventOfSerializable = Exclude<
  AutoBeEvent,
  AutoBeVendorRequestEvent | AutoBeVendorResponseEvent
>;

/** @internal */
export namespace AutoBeEventOfSerializable {
  export type Type = AutoBeEventOfSerializable["type"];
  export type Mapper = Omit<
    AutoBeEvent.Mapper,
    "vendorRequest" | "vendorResponse"
  >;
}
