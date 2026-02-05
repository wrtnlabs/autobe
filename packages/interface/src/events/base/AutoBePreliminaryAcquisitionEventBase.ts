import { AutoBePreliminaryKind } from "../../typings/AutoBePreliminaryKind";
import { AutoBePreliminaryAcquisition } from "../contents/AutoBePreliminaryAcquisition";

export interface AutoBePreliminaryAcquisitionEventBase<
  Kind extends AutoBePreliminaryKind,
> {
  acquisition: Pick<AutoBePreliminaryAcquisition, Kind>;
}
