import { AutoBeEvent, IAutoBeRpcListener } from "@autobe/interface";

export class AutoBePlaygroundListener {
  private callback: ((event: AutoBeEvent) => Promise<void>) | null;
  private listener: Required<IAutoBeRpcListener>;

  public constructor() {
    this.callback = null;
    this.listener = {
      assistantMessage: async (event) => {
        this.callback?.(event);
      },
      userMessage: async (event) => {
        this.callback?.(event);
      },

      analyzeStart: async (event) => {
        this.callback?.(event);
      },
      analyzeWrite: async (event) => {
        this.callback?.(event);
      },
      analyzeReview: async (event) => {
        this.callback?.(event);
      },
      analyzeComplete: async (event) => {
        this.callback?.(event);
      },

      prismaStart: async (event) => {
        this.callback?.(event);
      },
      prismaComponents: async (event) => {
        this.callback?.(event);
      },
      prismaSchemas: async (event) => {
        this.callback?.(event);
      },
      prismaComplete: async (event) => {
        this.callback?.(event);
      },
      prismaValidate: async (event) => {
        this.callback?.(event);
      },
      prismaCorrect: async (event) => {
        this.callback?.(event);
      },

      interfaceStart: async (event) => {
        this.callback?.(event);
      },
      interfaceEndpoints: async (event) => {
        this.callback?.(event);
      },
      interfaceOperations: async (event) => {
        this.callback?.(event);
      },
      interfaceComponents: async (event) => {
        this.callback?.(event);
      },
      interfaceComplement: async (event) => {
        this.callback?.(event);
      },
      interfaceComplete: async (event) => {
        this.callback?.(event);
      },

      testStart: async (event) => {
        this.callback?.(event);
      },
      testPlan: async (event) => {
        this.callback?.(event);
      },
      testProgress: async (event) => {
        this.callback?.(event);
      },
      testValidate: async (event) => {
        this.callback?.(event);
      },
      testCorrect: async (event) => {
        this.callback?.(event);
      },
      testComplete: async (event) => {
        this.callback?.(event);
      },

      realizeStart: async (event) => {
        this.callback?.(event);
      },
      realizeProgress: async (event) => {
        this.callback?.(event);
      },
      realizeValidate: async (event) => {
        this.callback?.(event);
      },
      realizeComplete: async (event) => {
        this.callback?.(event);
      },
    };
  }

  public on(callback: (event: AutoBeEvent) => Promise<void>) {
    this.callback = callback;
  }

  public getListener(): Required<IAutoBeRpcListener> {
    return this.listener;
  }
}
