import { AutoBeTestCorrectEvent } from "@autobe/interface";
import React from "react";

import EventBubble from "../../../common/EventBubble";
import InfoCard from "../../../common/InfoCard";

interface TestCorrectProps {
  event: AutoBeTestCorrectEvent;
  timestamp?: string;
}

export const TestCorrect: React.FC<TestCorrectProps> = ({
  event,
  timestamp,
}) => {
  const result = event.result;
  const hasErrors = result && result.type === "failure";

  return (
    <EventBubble
      iconPath="🔧"
      title="Test Correction"
      theme="orange"
      timestamp={timestamp}
    >
      <InfoCard title="Correction Details" theme="orange">
        <div className="space-y-4">
          {/* File Information */}
          <div>
            <h4 className="font-medium text-amber-700 mb-2">Test File:</h4>
            <div className="text-sm bg-amber-50 p-3 rounded border-l-4 border-amber-400">
              <div className="font-medium text-amber-800">
                {event.file.location}
              </div>
              <div className="text-amber-700 mt-1">
                {event.file.scenario.draft || "Test scenario"}
              </div>
            </div>
          </div>

          {/* Compilation Errors */}
          {hasErrors && result.diagnostics && (
            <div>
              <h4 className="font-medium text-red-700 mb-2">
                Compilation Errors:
              </h4>
              <div className="space-y-2">
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

          {/* AI Analysis */}
          <div>
            <h4 className="font-medium text-blue-700 mb-2">AI Analysis:</h4>
            <div className="space-y-2">
              <div className="text-sm bg-blue-50 p-3 rounded">
                <div className="font-medium text-blue-800 mb-1">
                  Initial Analysis:
                </div>
                <div className="text-blue-700 text-xs">
                  {event.think_without_compile_error}
                </div>
              </div>
              <div className="text-sm bg-green-50 p-3 rounded">
                <div className="font-medium text-green-800 mb-1">
                  Revised Analysis:
                </div>
                <div className="text-green-700 text-xs">
                  {event.think_again_with_compile_error}
                </div>
              </div>
            </div>
          </div>

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
