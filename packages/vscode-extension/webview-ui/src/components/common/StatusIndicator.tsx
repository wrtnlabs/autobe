import React from "react";

interface IStatusIndicatorProps {
  success: boolean;
  successText: string;
  failureText: string;
  errorMessage?: string;
}

const StatusIndicator = ({
  success,
  successText,
  failureText,
  errorMessage,
}: IStatusIndicatorProps) => {
  return (
    <div className="space-y-2">
      <div className="flex items-center space-x-2">
        <div
          className={`w-3 h-3 rounded-full ${success ? "bg-green-500" : "bg-red-500"}`}
        ></div>
        <span className="text-xs text-gray-600">
          {success ? successText : failureText}
        </span>
      </div>
      {!success && errorMessage && (
        <div className="text-xs text-red-600">{errorMessage}</div>
      )}
    </div>
  );
};

export default StatusIndicator;
