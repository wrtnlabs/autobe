import {
  AutoBeAnalyzeCompleteEvent,
  AutoBeInterfaceCompleteEvent,
  AutoBePrismaCompleteEvent,
  AutoBeRealizeCompleteEvent,
  AutoBeTestCompleteEvent,
} from "@autobe/interface";

import { AutoBeListenerState } from "..";
import { COLORS } from "../constant/color";

export interface IAutoBeChatStateProps {
  state: AutoBeListenerState;
}

/** Common styles for step items */
const getStepItemStyle = (isActive: boolean): React.CSSProperties => ({
  padding: "12px",
  backgroundColor: COLORS.GRAY_BACKGROUND,
  borderRadius: "6px",
  borderLeft: `4px solid ${isActive ? "#007bff" : COLORS.GRAY_BORDER}`,
});

const stepTitleStyle: React.CSSProperties = {
  fontWeight: "bold",
  fontSize: "0.9rem",
  marginBottom: "4px",
  color: COLORS.GRAY_TEXT_DARK,
};

const stepDataStyle: React.CSSProperties = {
  fontSize: "0.85rem",
  color: COLORS.GRAY_TEXT_MEDIUM,
  lineHeight: "1.4",
};

/** Props interface for StateStep component */
interface IStateStepProps {
  /** Step name */
  step: string;

  data:
    | AutoBeAnalyzeCompleteEvent
    | AutoBePrismaCompleteEvent
    | AutoBeInterfaceCompleteEvent
    | AutoBeTestCompleteEvent
    | AutoBeRealizeCompleteEvent;
}

/** Component for displaying active state step */
const StateStep = ({ step, data }: IStateStepProps) => (
  <div style={getStepItemStyle(true)}>
    <div style={stepTitleStyle}>{step}</div>
    <div style={stepDataStyle}>
      {Object.entries(getStepCount(data))
        .map(([key, value]) => `${key}: ${value.toLocaleString()}`)
        .join(" • ")}
    </div>
    <div style={stepDataStyle}>
      ⏱️ {(Math.floor((data.elapsed / 60_000) * 100) / 100).toLocaleString()}{" "}
      mins
    </div>
  </div>
);

/** Component for displaying empty state step */
const StateEmpty = ({ step }: { step: string }) => (
  <div style={getStepItemStyle(false)}>
    <div style={stepTitleStyle}>{step}</div>
    <div style={stepDataStyle}>0 items • ⏱️ 0 mins</div>
  </div>
);

/** Component to display development state information */
export const AutoBeChatState = (props: IAutoBeChatStateProps) => {
  const containerStyle: React.CSSProperties = {
    display: "flex",
    flexDirection: "column",
    gap: "12px",
  };

  const steps = ["analyze", "prisma", "interface", "test", "realize"] as const;

  return (
    <div style={containerStyle}>
      <div style={{ display: "flex", flexDirection: "column", gap: "8px" }}>
        {steps.map((stepType) =>
          props.state[stepType] ? (
            <StateStep
              key={stepType}
              step={stepType}
              data={props.state[stepType]}
            />
          ) : (
            <StateEmpty key={stepType} step={stepType} />
          ),
        )}
      </div>
    </div>
  );
};

/** Calculate count data based on step type */
const getStepCount = (
  data:
    | AutoBeAnalyzeCompleteEvent
    | AutoBePrismaCompleteEvent
    | AutoBeInterfaceCompleteEvent
    | AutoBeTestCompleteEvent
    | AutoBeRealizeCompleteEvent,
): Record<string, number> => {
  switch (data.type) {
    case "analyzeComplete": {
      return {
        Documents: Object.keys(data.files).length,
        "Actor Roles": data.roles.length,
      };
    }
    case "prismaComplete": {
      return {
        Namespaces: data.result.data.files.length,
        Models: data.result.data.files
          .map((f: { models: unknown[] }) => f.models.length)
          .reduce((a: number, b: number) => a + b, 0),
      };
    }
    case "interfaceComplete": {
      return {
        Operations: data.document.operations.length,
        Schemas: Object.keys(data.document.components.schemas).length,
      };
    }
    case "testComplete": {
      return {
        Functions: data.files.length,
      };
    }
    case "realizeComplete": {
      return {
        Controllers: Object.keys(data.controllers).length,
        Functions: data.functions.length,
      };
    }
    default:
      data satisfies never;
      throw new Error(`Unknown step type: ${data}`);
  }
};
