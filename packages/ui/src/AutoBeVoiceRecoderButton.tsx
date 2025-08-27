import { AutoBeUserMessageAudioContent } from "@autobe/interface";
import { useState } from "react";

import { AutoBeVoiceRecorder } from "./utils/AutoBeVoiceRecorder";

export const AutoBeVoiceRecoderButton = (
  props: AutoBeVoiceRecoderButton.IProps,
) => {
  const [isRecording, setIsRecording] = useState(false);
  const [mediaRecorder, setMediaRecorder] = useState<MediaRecorder | null>(
    null,
  );

  const startRecording = async () => {
    const recorder = await AutoBeVoiceRecorder.start(props.onComplete);
    recorder.start();
    setMediaRecorder(recorder);
    setIsRecording(true);
  };

  const stopRecording = () => {
    if (mediaRecorder && mediaRecorder.state !== "inactive") {
      mediaRecorder.stop();
      setIsRecording(false);
    }
  };

  const baseStyles: React.CSSProperties = {
    padding: "6px",
    border: "1px solid",
    borderColor: isRecording ? "#f44336" : "#e0e0e0",
    borderRadius: "4px",
    backgroundColor: isRecording ? "#ffebee" : "transparent",
    color: isRecording ? "#f44336" : "#1976d2",
    cursor: props.enabled ? "pointer" : "not-allowed",
    display: "inline-flex",
    alignItems: "center",
    justifyContent: "center",
    transition: "all 0.3s ease",
    outline: "none",
    width: "32px",
    height: "32px",
    opacity: props.enabled ? 1 : 0.5,
  };

  const hoverStyles: React.CSSProperties = {
    ...baseStyles,
    backgroundColor: isRecording ? "#f44336" : "#f5f5f5",
    borderColor: isRecording ? "#d32f2f" : "#1976d2",
    color: isRecording ? "#ffffff" : "#1976d2",
  };

  return (
    <button
      style={baseStyles}
      onClick={isRecording ? stopRecording : () => void startRecording()}
      disabled={!props.enabled}
      onMouseEnter={(e) => {
        if (props.enabled) {
          Object.assign(e.currentTarget.style, hoverStyles);
        }
      }}
      onMouseLeave={(e) => {
        Object.assign(e.currentTarget.style, baseStyles);
      }}
    >
      {isRecording ? (
        <svg
          width="16"
          height="16"
          viewBox="0 0 24 24"
          fill="currentColor"
          style={{ display: "block" }}
        >
          <path d="M6 6h12v12H6z" />
        </svg>
      ) : (
        <svg
          width="16"
          height="16"
          viewBox="0 0 24 24"
          fill="currentColor"
          style={{ display: "block" }}
        >
          <path d="M12 2c1.1 0 2 .9 2 2v6c0 1.1-.9 2-2 2s-2-.9-2-2V4c0-1.1.9-2 2-2zm5.3 6.7c.4-.4 1-.4 1.4 0 .4.4.4 1 0 1.4l-1.9 1.9c.03.33.05.66.05 1v.5c0 2.8-2.2 5-5 5s-5-2.2-5-5v-.5c0-.34.02-.67.05-1L4.9 10.1c-.4-.4-.4-1 0-1.4.4-.4 1-.4 1.4 0l1.9 1.9c1.8-1.6 4.3-1.6 6.1 0l1.9-1.9zM19 10.5v.5c0 3.9-3.1 7-7 7s-7-3.1-7-7v-.5c0-.8.7-1.5 1.5-1.5s1.5.7 1.5 1.5v.5c0 2.2 1.8 4 4 4s4-1.8 4-4v-.5c0-.8.7-1.5 1.5-1.5s1.5.7 1.5 1.5z" />
        </svg>
      )}
    </button>
  );
};

export namespace AutoBeVoiceRecoderButton {
  export interface IProps {
    enabled: boolean;
    onComplete: (content: {
      file: File;
      content: AutoBeUserMessageAudioContent;
    }) => void;
  }
}
