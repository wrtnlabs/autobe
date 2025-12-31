import {
  AutoBeAnalyzeCompleteEvent,
  AutoBeDatabaseCompleteEvent,
  AutoBeInterfaceCompleteEvent,
  AutoBeRealizeCompleteEvent,
  AutoBeTestCompleteEvent,
} from "@autobe/interface";

export class AutoBeListenerState {
  public analyze: AutoBeAnalyzeCompleteEvent | null;
  public database: AutoBeDatabaseCompleteEvent | null;
  public interface: AutoBeInterfaceCompleteEvent | null;
  public test: AutoBeTestCompleteEvent | null;
  public realize: AutoBeRealizeCompleteEvent | null;

  public constructor() {
    this.analyze = null;
    this.database = null;
    this.interface = null;
    this.test = null;
    this.realize = null;
  }

  public setAnalyze(event: AutoBeAnalyzeCompleteEvent): void {
    this.analyze = event;
    this.database = null;
    this.interface = null;
    this.test = null;
    this.realize = null;
  }

  public setDatabase(event: AutoBeDatabaseCompleteEvent): void {
    this.database = event;
    this.interface = null;
    this.test = null;
    this.realize = null;
  }

  public setInterface(event: AutoBeInterfaceCompleteEvent): void {
    this.interface = event;
    this.test = null;
    this.realize = null;
  }

  public setTest(event: AutoBeTestCompleteEvent): void {
    this.test = event;
    this.realize = null;
  }

  public setRealize(event: AutoBeRealizeCompleteEvent): void {
    this.realize = event;
  }
}
