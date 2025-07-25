import { AutoBeEvent, IAutoBeRpcListener } from "@autobe/interface";
import { List } from "tstl";

import { IAutoBePlaygroundEventGroup } from "./IAutoBePlaygroundEventGroup";

export class AutoBePlaygroundListener {
  private callback_:
    | ((eventGroups: IAutoBePlaygroundEventGroup[]) => Promise<void>)
    | null;
  private listener_: Required<IAutoBeRpcListener>;
  private events_: List<IAutoBePlaygroundEventGroup> = new List();
  private state_: Map<
    AutoBeEvent.Type,
    List.Iterator<IAutoBePlaygroundEventGroup>
  > = new Map();

  public constructor() {
    this.callback_ = null;
    this.listener_ = {
      assistantMessage: async (event) => {
        this.insert(event);
      },
      userMessage: async (event) => {
        this.insert(event);
      },

      // ANALYZE
      analyzeStart: async (event) => {
        this.state_.delete("analyzeWrite");
        this.state_.delete("analyzeReview");
        this.insert(event);
      },
      analyzeWrite: async (event) => {
        this.accumulate(event);
      },
      analyzeReview: async (event) => {
        this.accumulate(event);
      },
      analyzeComplete: async (event) => {
        this.state_.delete("analyzeWrite");
        this.state_.delete("analyzeReview");
        this.insert(event);
      },

      // PRISMA
      prismaStart: async (event) => {
        this.state_.delete("prismaSchemas");
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
      prismaValidate: async (event) => {
        this.insert(event);
      },
      prismaCorrect: async (event) => {
        this.insert(event);
      },
      prismaComplete: async (event) => {
        this.state_.delete("prismaSchemas");
        this.insert(event);
      },

      // INTERFACE
      interfaceStart: async (event) => {
        this.state_.delete("interfaceOperations");
        this.state_.delete("interfaceComponents");
        this.insert(event);
      },
      interfaceEndpoints: async (event) => {
        this.insert(event);
      },
      interfaceOperations: async (event) => {
        this.accumulate(event);
      },
      interfaceComponents: async (event) => {
        this.accumulate(event);
      },
      interfaceComplement: async (event) => {
        this.insert(event);
      },
      interfaceComplete: async (event) => {
        this.state_.delete("interfaceOperations");
        this.state_.delete("interfaceComponents");
        this.insert(event);
      },

      // TEST
      testStart: async (event) => {
        this.state_.delete("testWrite");
        this.state_.delete("testValidate");
        this.state_.delete("testCorrect");
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
        this.state_.delete("testWrite");
        this.state_.delete("testValidate");
        this.state_.delete("testCorrect");
        this.insert(event);
      },

      //----
      // REALIZE
      //----
      // REALIZE-MAIN
      realizeStart: async (event) => {
        this.state_.delete("realizeProgress");
        this.state_.delete("realizeValidate");
        this.insert(event);
      },
      realizeProgress: async (event) => {
        this.accumulate(event);
      },
      realizeValidate: async (event) => {
        this.accumulate(event);
      },
      realizeComplete: async (event) => {
        this.state_.delete("realizeProgress");
        this.state_.delete("realizeValidate");
        this.insert(event);
      },
      // REALIZE-AUTHORIZATION
      realizeAuthorizationStart: async (event) => {
        this.state_.delete("realizeAuthorizationWrite");
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
        this.state_.delete("realizeAuthorizationWrite");
        this.insert(event);
      },
      // REALILZE-TEST
      realizeTestStart: async (event) => {
        this.state_.delete("realizeTestOperation");
        this.insert(event);
      },
      realizeTestReset: async (event) => {
        this.insert(event);
      },
      realizeTestOperation: async (event) => {
        this.accumulate(event);
      },
      realizeTestComplete: async (event) => {
        this.state_.delete("realizeTestOperation");
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

  private accumulate(event: AutoBeEvent) {
    const it: List.Iterator<IAutoBePlaygroundEventGroup> | undefined =
      this.state_.get(event.type);
    if (it === undefined)
      this.state_.set(
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
