import {
  AutoBeAnalyzeCompleteEvent,
  AutoBeInterfaceCompleteEvent,
  AutoBePrismaCompleteEvent,
  AutoBeRealizeCompleteEvent,
  AutoBeTestCompleteEvent,
} from "@autobe/interface";

export class AutoBePlaygroundState {
  public analyze: AutoBeAnalyzeCompleteEvent | null;
  public prisma: AutoBePrismaCompleteEvent | null;
  public interface: AutoBeInterfaceCompleteEvent | null;
  public test: AutoBeTestCompleteEvent | null;
  public realize: AutoBeRealizeCompleteEvent | null;

  public constructor() {
    this.analyze = null;
    this.prisma = null;
    this.interface = null;
    this.test = null;
    this.realize = null;
  }

  public setAnalyze(event: AutoBeAnalyzeCompleteEvent): void {
    this.analyze = event;
    this.prisma = null;
    this.interface = null;
    this.test = null;
    this.realize = null;
  }

  public setPrisma(event: AutoBePrismaCompleteEvent): void {
    this.prisma = event;
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
