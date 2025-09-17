import { AutoBeEvent, IAutoBeRpcListener } from "@autobe/interface";
import { List } from "tstl";

import { AutoBeListenerState } from "./AutoBeListenerState";
import { IAutoBeEventGroup } from "./IAutoBeEventGroup";

export class AutoBeListener {
  private callback_: Set<(eventGroups: IAutoBeEventGroup[]) => Promise<void>>;
  private onEnableCallback_: Set<(value: boolean) => Promise<void>>;

  private listener_: Required<IAutoBeRpcListener>;
  private events_: List<IAutoBeEventGroup> = new List();
  private dict_: Map<AutoBeEvent.Type, List.Iterator<IAutoBeEventGroup>> =
    new Map();
  private enable_: boolean = false;
  private readonly state_: AutoBeListenerState;

  public constructor() {
    this.callback_ = new Set();
    this.onEnableCallback_ = new Set();

    this.state_ = new AutoBeListenerState();
    this.listener_ = {
      enable: async (value) => {
        this.enable_ = value;
        this.onEnableCallback_.forEach((callback) =>
          callback(value).catch(() => {}),
        );
      },
      assistantMessage: async (event) => {
        this.insert(event);
      },
      userMessage: async (event) => {
        this.insert(event);
      },

      // ANALYZE
      analyzeStart: async (event) => {
        this.dict_.delete("analyzeWrite");
        this.dict_.delete("analyzeReview");
        this.insert(event);
      },
      analyzeScenario: async (event) => {
        this.accumulate(event);
      },
      analyzeWrite: async (event) => {
        this.accumulate(event);
      },
      analyzeReview: async (event) => {
        this.accumulate(event);
      },
      analyzeComplete: async (event) => {
        this.dict_.delete("analyzeWrite");
        this.dict_.delete("analyzeReview");
        this.state_.setAnalyze(event);
        this.insert(event);
      },

      // PRISMA
      prismaStart: async (event) => {
        this.dict_.delete("prismaSchemas");
        this.dict_.delete("prismaReview");
        this.insert(event);
      },
      prismaComponents: async (event) => {
        this.insert(event);
      },
      prismaSchemas: async (event) => {
        this.accumulate(event);
      },
      prismaInsufficient: async (event) => {
        this.insert(event);
      },
      prismaReview: async (event) => {
        this.accumulate(event);
      },
      prismaValidate: async (event) => {
        this.insert(event);
      },
      prismaCorrect: async (event) => {
        this.insert(event);
      },
      prismaComplete: async (event) => {
        this.dict_.delete("prismaSchemas");
        this.dict_.delete("prismaReview");
        this.state_.setPrisma(event);
        this.insert(event);
      },

      // INTERFACE
      interfaceStart: async (event) => {
        this.dict_.delete("interfaceAuthorization");
        this.dict_.delete("interfaceEndpoints");
        this.dict_.delete("interfaceOperations");
        this.dict_.delete("interfaceOperationsReview");
        this.dict_.delete("interfaceSchemas");
        this.dict_.delete("interfaceSchemasReview");
        this.insert(event);
      },
      interfaceGroups: async (event) => {
        this.insert(event);
      },
      interfaceEndpoints: async (event) => {
        this.accumulate(event);
      },
      interfaceEndpointsReview: async (event) => {
        this.accumulate(event);
      },
      interfaceOperations: async (event) => {
        this.accumulate(event);
      },
      interfaceOperationsReview: async (event) => {
        this.accumulate(event);
      },
      interfaceAuthorization: async (event) => {
        this.accumulate(event);
      },
      interfaceSchemas: async (event) => {
        this.accumulate(event);
      },
      interfaceSchemasReview: async (event) => {
        this.accumulate(event);
      },
      interfaceComplement: async (event) => {
        this.insert(event);
      },
      interfaceComplete: async (event) => {
        this.dict_.delete("interfaceEndpoints");
        this.dict_.delete("interfaceOperations");
        this.dict_.delete("interfaceOperationsReview");
        this.dict_.delete("interfaceAuthorization");
        this.dict_.delete("interfaceSchemas");
        this.dict_.delete("interfaceSchemasReview");
        this.state_.setInterface(event);
        this.insert(event);
      },

      // TEST
      testStart: async (event) => {
        this.dict_.delete("testScenarios");
        this.dict_.delete("testWrite");
        this.dict_.delete("testValidate");
        this.dict_.delete("testCorrect");
        this.insert(event);
      },
      testScenarios: async (event) => {
        this.accumulate(event);
      },
      testScenariosReview: async (event) => {
        this.accumulate(event);
      },
      testWrite: async (event) => {
        this.accumulate(event);
      },
      testValidate: async (event) => {
        this.accumulate(event);
      },
      testCorrect: async (event) => {
        this.accumulate(event);
      },
      testComplete: async (event) => {
        this.dict_.delete("testScenarios");
        this.dict_.delete("testWrite");
        this.dict_.delete("testValidate");
        this.dict_.delete("testCorrect");
        this.state_.setTest(event);
        this.insert(event);
      },

      //----
      // REALIZE
      //----
      // REALIZE-MAIN
      realizeStart: async (event) => {
        this.dict_.delete("realizeWrite");
        this.dict_.delete("realizeValidate");
        this.insert(event);
      },
      realizeWrite: async (event) => {
        this.accumulate(event);
      },
      realizeCorrect: async (event) => {
        this.accumulate(event);
      },

      realizeValidate: async (event) => {
        this.accumulate(event);
      },
      realizeComplete: async (event) => {
        this.dict_.delete("realizeWrite");
        this.dict_.delete("realizeValidate");
        this.state_.setRealize(event);
        this.insert(event);
      },
      // REALIZE-AUTHORIZATION
      realizeAuthorizationStart: async (event) => {
        this.dict_.delete("realizeAuthorizationWrite");
        this.dict_.delete("realizeAuthorizationCorrect");
        this.dict_.delete("realizeAuthorizationValidate");
        this.insert(event);
      },
      realizeAuthorizationWrite: async (event) => {
        this.accumulate(event);
      },
      realizeAuthorizationValidate: async (event) => {
        this.accumulate(event);
      },
      realizeAuthorizationCorrect: async (event) => {
        this.insert(event);
      },
      realizeAuthorizationComplete: async (event) => {
        this.dict_.delete("realizeAuthorizationWrite");
        this.dict_.delete("realizeAuthorizationCorrect");
        this.dict_.delete("realizeAuthorizationValidate");
        this.insert(event);
      },
      // REALILZE-TEST
      realizeTestStart: async (event) => {
        this.dict_.delete("realizeTestOperation");
        this.insert(event);
      },
      realizeTestReset: async (event) => {
        this.insert(event);
      },
      realizeTestOperation: async (event) => {
        this.accumulate(event);
      },
      realizeTestComplete: async (event) => {
        this.dict_.delete("realizeTestOperation");
        this.insert(event);
      },
    };
  }

  public on(callback: (eventGroups: IAutoBeEventGroup[]) => Promise<void>) {
    this.callback_.add(callback);
  }

  public off(callback: (eventGroups: IAutoBeEventGroup[]) => Promise<void>) {
    this.callback_.delete(callback);
  }

  public getListener(): Required<IAutoBeRpcListener> {
    return this.listener_;
  }

  public getState(): AutoBeListenerState {
    return this.state_;
  }

  public getEnable(): boolean {
    return this.enable_;
  }

  public onEnable(callback: (value: boolean) => Promise<void>) {
    this.onEnableCallback_.add(callback);
  }

  public offEnable(callback: (value: boolean) => Promise<void>) {
    this.onEnableCallback_.delete(callback);
  }

  private accumulate(event: AutoBeEvent) {
    const it: List.Iterator<IAutoBeEventGroup> | undefined = this.dict_.get(
      event.type,
    );
    if (it === undefined)
      this.dict_.set(
        event.type,
        this.events_.insert(this.events_.end(), {
          type: event.type,
          events: [event],
        }),
      );
    else it.value.events.push(event);
    this.dispatch();
  }

  private insert(event: AutoBeEvent) {
    this.events_.push_back({
      type: event.type,
      events: [event],
    });
    this.dispatch();
  }

  private dispatch() {
    this.callback_.forEach((callback) =>
      callback(this.events_.toJSON()).catch(() => {}),
    );
  }
}
