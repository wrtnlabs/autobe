import { AutoBeTestValidateEvent } from "@autobe/interface";
import React from "react";

import EventBubble from "../../../common/EventBubble";
import InfoCard from "../../../common/InfoCard";
import StatusIndicator from "../../../common/StatusIndicator";

interface TestValidateProps {
  event: AutoBeTestValidateEvent;
  timestamp?: string;
}

export const TestValidate: React.FC<TestValidateProps> = ({
  event,
  timestamp,
}) => {
  const result = event.result;
  const hasErrors = result && result.type === "failure";

  return (
    <EventBubble
      iconPath="🔍"
      title="Test Validation"
      theme="orange"
      timestamp={timestamp}
    >
      <InfoCard title="Validation Results" theme="orange">
        <div className="space-y-3">
          <StatusIndicator
            success={!hasErrors}
            successText="Validation Passed"
            failureText="Validation Failed"
          />

          {/* File Information */}
          <div>
            <h4 className="font-medium text-gray-700 mb-2">Test File:</h4>
            <div className="text-sm bg-gray-50 p-3 rounded">
              <div className="font-medium text-gray-800">
                {event.file.location}
              </div>
              <div className="text-gray-700 mt-1">
                {event.file.scenario.draft || "Test scenario"}
              </div>
            </div>
          </div>

          {/* Compilation Errors */}
          {hasErrors && result.diagnostics && (
            <div className="space-y-2">
              <h4 className="font-medium text-red-700">Compilation Errors:</h4>
              <div className="space-y-1">
                {result.diagnostics.map((diagnostic, index: number) => (
                  <div
                    key={index}
                    className="text-sm text-red-600 bg-red-50 p-2 rounded"
                  >
                    <div className="font-medium">
                      {diagnostic.messageText || "Unknown error"}
                    </div>
                    {diagnostic.file && (
                      <div className="text-xs text-red-500 mt-1">
                        <strong>File:</strong> {diagnostic.file}
                      </div>
                    )}
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Summary */}
          <div className="text-sm text-gray-600 bg-gray-50 p-2 rounded">
            <strong>Step:</strong> {event.step} | <strong>File:</strong>{" "}
            {event.file.location}
          </div>
        </div>
      </InfoCard>
    </EventBubble>
  );
};
