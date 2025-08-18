import { AutoBeTestCompleteEvent } from "@autobe/interface";
import React from "react";

import EventBubble from "../../../common/EventBubble";
import FileList from "../../../common/FileList";
import InfoCard from "../../../common/InfoCard";
import StatusIndicator from "../../../common/StatusIndicator";

interface TestCompleteProps {
  event: AutoBeTestCompleteEvent;
  timestamp?: string;
}

export const TestComplete: React.FC<TestCompleteProps> = ({
  event,
  timestamp,
}) => {
  const generatedFiles = event.files || [];
  const compiled = event.compiled;
  const hasErrors = compiled && compiled.type === "failure";

  return (
    <EventBubble
      iconPath="✅"
      title="Test Complete"
      theme={hasErrors ? "orange" : "green"}
      timestamp={timestamp}
    >
      <InfoCard title="Test Results" theme={hasErrors ? "orange" : "green"}>
        <div className="space-y-4">
          {/* Status */}
          <StatusIndicator
            success={!hasErrors}
            successText="All Tests Passed"
            failureText="Tests Completed with Errors"
          />

          {/* Compilation Results */}
          {compiled && (
            <div>
              <h4 className="font-medium text-gray-700 mb-2">
                Compilation Results:
              </h4>
              <div className="grid grid-cols-2 gap-2 text-sm">
                <div className="bg-gray-50 p-2 rounded">
                  <span className="font-medium">Status:</span>{" "}
                  {compiled.type === "success"
                    ? "Success"
                    : compiled.type === "failure"
                      ? "Failed"
                      : "Exception"}
                </div>
                {compiled.type === "failure" && compiled.diagnostics && (
                  <div className="bg-red-50 p-2 rounded">
                    <span className="font-medium text-red-700">Errors:</span>{" "}
                    {compiled.diagnostics.length}
                  </div>
                )}
              </div>
            </div>
          )}

          {/* Generated Files */}
          {generatedFiles.length > 0 && (
            <div>
              <h4 className="font-medium text-gray-700 mb-2">
                Generated Test Files:
              </h4>
              <FileList
                title="Generated Test Files"
                theme="purple"
                files={generatedFiles.map((file) => file.location)}
              />
            </div>
          )}

          {/* Compilation Errors */}
          {compiled && compiled.type === "failure" && compiled.diagnostics && (
            <div>
              <h4 className="font-medium text-red-700 mb-2">
                Compilation Errors:
              </h4>
              <div className="space-y-2">
                {compiled.diagnostics.map((diagnostic, index: number) => (
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
            <strong>Step:</strong> {event.step} | <strong>Elapsed:</strong>{" "}
            {event.elapsed}ms
          </div>
        </div>
      </InfoCard>
    </EventBubble>
  );
};
