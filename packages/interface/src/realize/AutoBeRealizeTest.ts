import { tags } from "typia";

export namespace AutoBeRealizeTest {
  export interface IProps {
    /** @default true */
    reset?: boolean;

    /** @default 1 */
    simultaneous?: number;
  }

  export interface IServant {
    execute(props: IProps): Promise<IReport>;
  }

  export interface IListener {
    onOperation(operation: IOperation): Promise<void>;
  }

  export interface IOperation {
    name: string;
    location: string;
    value: unknown;
    error: unknown | null;
    started_at: string & tags.Format<"date-time">;
    completed_at: string & tags.Format<"date-time">;
  }

  export interface IReport {
    reset: boolean;
    simultaneous: boolean;
    operations: IOperation[];
    time: number;
  }
}
