import { AutoBeEvent, IAutoBeRpcListener } from "@autobe/interface";
import { List } from "tstl";

import { AutoBePlaygroundState } from "./AutoBePlaygroundState";
import { IAutoBePlaygroundEventGroup } from "./IAutoBePlaygroundEventGroup";

export class AutoBePlaygroundListener {
  private callback_:
    | ((eventGroups: IAutoBePlaygroundEventGroup[]) => Promise<void>)
    | null;
  private listener_: Required<IAutoBeRpcListener>;
  private events_: List<IAutoBePlaygroundEventGroup> = new List();
  private dict_: Map<
    AutoBeEvent.Type,
    List.Iterator<IAutoBePlaygroundEventGroup>
  > = new Map();
  private readonly state_: AutoBePlaygroundState;

  public constructor() {
    this.callback_ = null;

    this.state_ = new AutoBePlaygroundState();
    this.listener_ = {
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
        this.dict_.delete("interfaceEndpoints");
        this.dict_.delete("interfaceOperations");
        this.dict_.delete("interfaceAuthorization");
        this.dict_.delete("interfaceSchemas");
        this.insert(event);
      },
      interfaceGroups: async (event) => {
        this.insert(event);
      },
      interfaceEndpoints: async (event) => {
        this.accumulate(event);
      },
      interfaceOperations: async (event) => {
        this.accumulate(event);
      },
      interfaceAuthorization: async (event) => {
        this.accumulate(event);
      },
      interfaceSchemas: async (event) => {
        this.accumulate(event);
      },
      interfaceComplement: async (event) => {
        this.insert(event);
      },
      interfaceComplete: async (event) => {
        this.dict_.delete("interfaceEndpoints");
        this.dict_.delete("interfaceOperations");
        this.dict_.delete("interfaceAuthorization");
        this.dict_.delete("interfaceSchemas");
        this.state_.setInterface(event);
        this.insert(event);
      },

      // TEST
      testStart: async (event) => {
        this.dict_.delete("testWrite");
        this.dict_.delete("testValidate");
        this.dict_.delete("testCorrect");
        this.insert(event);
      },
      testScenario: async (event) => {
        this.insert(event);
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

  public on(
    callback: (eventGroups: IAutoBePlaygroundEventGroup[]) => Promise<void>,
  ) {
    this.callback_ = callback;
  }

  public getListener(): Required<IAutoBeRpcListener> {
    return this.listener_;
  }

  public getState(): AutoBePlaygroundState {
    return this.state_;
  }

  private accumulate(event: AutoBeEvent) {
    const it: List.Iterator<IAutoBePlaygroundEventGroup> | undefined =
      this.dict_.get(event.type);
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
    this.callback_?.(this.events_.toJSON()).catch(() => {});
  }
}
