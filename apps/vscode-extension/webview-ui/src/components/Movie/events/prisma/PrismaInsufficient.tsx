import { AutoBePrismaInsufficientEvent } from "@autobe/interface";
import React from "react";

import EventBubble from "../../../common/EventBubble";
import InfoCard from "../../../common/InfoCard";
import StatusIndicator from "../../../common/StatusIndicator";

interface PrismaInsufficientProps {
  event: AutoBePrismaInsufficientEvent;
  timestamp?: string;
}

export const PrismaInsufficient: React.FC<PrismaInsufficientProps> = ({
  event,
  timestamp,
}) => {
  const { component, actual, missed } = event;
  const expectedCount = component.tables.length;
  const actualCount = actual.length;
  const missedCount = missed.length;

  return (
    <EventBubble
      iconPath="⚠️"
      title="Prisma Insufficient Models"
      theme="orange"
      timestamp={timestamp}
    >
      <InfoCard title="Model Generation Gap" theme="orange">
        <div className="space-y-4">
          {/* Status */}
          <StatusIndicator
            success={false}
            successText="All Models Generated"
            failureText={`${missedCount} Models Missing`}
          />

          {/* Component Information */}
          <div>
            <h4 className="font-medium text-amber-700 mb-2">
              Target Component:
            </h4>
            <div className="text-sm bg-amber-50 p-3 rounded border-l-4 border-amber-400">
              <div className="font-medium text-amber-800">
                {component.filename}
              </div>
              <div className="text-amber-700 mt-1">
                <strong>Namespace:</strong> {component.namespace}
              </div>
              <div className="text-amber-700 mt-1">
                <strong>Expected Models:</strong> {expectedCount} |{" "}
                <strong>Generated:</strong> {actualCount} |{" "}
                <strong>Missing:</strong> {missedCount}
              </div>
            </div>
          </div>

          {/* Generated Models */}
          {actual.length > 0 && (
            <div>
              <h4 className="font-medium text-green-700 mb-2">
                Generated Models ({actualCount}):
              </h4>
              <div className="space-y-1">
                {actual.map((model, index) => (
                  <div
                    key={index}
                    className="text-sm text-green-600 bg-green-50 p-2 rounded"
                  >
                    <div className="font-medium">{model.name}</div>
                    {model.description && (
                      <div className="text-xs text-green-500 mt-1">
                        {model.description}
                      </div>
                    )}
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Missing Models */}
          {missed.length > 0 && (
            <div>
              <h4 className="font-medium text-red-700 mb-2">
                Missing Models ({missedCount}):
              </h4>
              <div className="space-y-1">
                {missed.map((modelName, index) => (
                  <div
                    key={index}
                    className="text-sm text-red-600 bg-red-50 p-2 rounded"
                  >
                    <div className="font-medium">{modelName}</div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Component Details */}
          <div>
            <h4 className="font-medium text-blue-700 mb-2">
              Component Analysis:
            </h4>
            <div className="space-y-2">
              <div className="text-sm bg-blue-50 p-3 rounded">
                <div className="font-medium text-blue-800 mb-1">Thinking:</div>
                <div className="text-blue-700 text-xs">
                  {component.thinking}
                </div>
              </div>
              <div className="text-sm bg-purple-50 p-3 rounded">
                <div className="font-medium text-purple-800 mb-1">Review:</div>
                <div className="text-purple-700 text-xs">
                  {component.review}
                </div>
              </div>
              <div className="text-sm bg-indigo-50 p-3 rounded">
                <div className="font-medium text-indigo-800 mb-1">
                  Rationale:
                </div>
                <div className="text-indigo-700 text-xs">
                  {component.rationale}
                </div>
              </div>
            </div>
          </div>

          {/* Summary */}
          <div className="text-sm text-gray-600 bg-gray-50 p-2 rounded">
            <strong>Component:</strong> {component.filename} |{" "}
            <strong>Namespace:</strong> {component.namespace} |{" "}
            <strong>Completion:</strong>{" "}
            {Math.round((actualCount / expectedCount) * 100)}%
          </div>
        </div>
      </InfoCard>
    </EventBubble>
  );
};
