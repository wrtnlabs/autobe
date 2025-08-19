import { AutoBeRealizeTestCompleteEvent } from "@autobe/interface";

import ExpandableList from "../../../common/ExpandableList";
import CompleteEventBase from "../common/CompleteEventBase";

interface IRealizeTestCompleteProps {
  event: AutoBeRealizeTestCompleteEvent;
}

const RealizeTestComplete = ({ event }: IRealizeTestCompleteProps) => {
  const successfulTests = event.operations.filter((op) => !op.error);
  const failedTests = event.operations.filter((op) => op.error);

  return (
    <CompleteEventBase
      title="테스트 완료"
      message={`총 ${event.operations.length}개의 테스트가 실행되었습니다.${successfulTests.length > 0 ? ` ${successfulTests.length}개 성공,` : ""}${failedTests.length > 0 ? ` ${failedTests.length}개 실패` : ""}${event.operations.length > 0 ? "." : ""}`}
      theme="green"
      timestamp={event.created_at}
      iconPath="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z"
      enableFileSave={false}
    >
      {/* 성공한 테스트들 */}
      {successfulTests.length > 0 && (
        <ExpandableList
          title="성공한 테스트"
          items={successfulTests}
          theme="green"
          renderItem={(operation, index) => (
            <div
              key={index}
              className="mb-3 p-3 bg-green-50 rounded-lg border border-green-200"
            >
              <div className="flex items-center space-x-2 mb-2">
                <div className="w-2 h-2 bg-green-400 rounded-full" />
                <span className="text-sm font-medium text-gray-800 font-mono">
                  {operation.name}
                </span>
                <span className="text-xs px-2 py-1 bg-green-100 text-green-700 rounded">
                  성공
                </span>
              </div>
              <div className="ml-4 space-y-1">
                <div className="text-xs text-gray-600">
                  <span className="font-medium">파일:</span>{" "}
                  {operation.location}
                </div>
                {operation.value !== null && operation.value !== undefined && (
                  <div className="text-xs text-gray-600">
                    <span className="font-medium">반환값:</span>{" "}
                    {String(operation.value)}
                  </div>
                )}
              </div>
            </div>
          )}
          maxDisplay={3}
        />
      )}

      {/* 실패한 테스트들 */}
      {failedTests.length > 0 && (
        <ExpandableList
          title="실패한 테스트"
          items={failedTests}
          theme="green"
          renderItem={(operation, index) => (
            <div
              key={index}
              className="mb-3 p-3 bg-red-50 rounded-lg border border-red-200"
            >
              <div className="flex items-center space-x-2 mb-2">
                <div className="w-2 h-2 bg-red-400 rounded-full" />
                <span className="text-sm font-medium text-gray-800 font-mono">
                  {operation.name}
                </span>
                <span className="text-xs px-2 py-1 bg-red-100 text-red-700 rounded">
                  실패
                </span>
              </div>
              <div className="ml-4 space-y-1">
                <div className="text-xs text-gray-600">
                  <span className="font-medium">파일:</span>{" "}
                  {operation.location}
                </div>
                {operation.error !== null && operation.error !== undefined && (
                  <div className="text-xs text-red-600">
                    <span className="font-medium">오류:</span>{" "}
                    {String(operation.error)}
                  </div>
                )}
              </div>
            </div>
          )}
          maxDisplay={3}
        />
      )}

      {/* 추가 정보 */}
      <div className="p-3 bg-gray-50 rounded-lg border border-gray-200">
        <div className="text-xs text-gray-600">
          <div className="flex items-center justify-between">
            <span>총 테스트:</span>
            <span className="font-medium">{event.operations.length}개</span>
          </div>
          <div className="flex items-center justify-between mt-1">
            <span>성공:</span>
            <span className="font-medium text-green-600">
              {successfulTests.length}개
            </span>
          </div>
          <div className="flex items-center justify-between mt-1">
            <span>실패:</span>
            <span className="font-medium text-red-600">
              {failedTests.length}개
            </span>
          </div>
          <div className="flex items-center justify-between mt-1">
            <span>분석 단계:</span>
            <span className="font-medium">{event.step}</span>
          </div>
          <div className="flex items-center justify-between mt-1">
            <span>완료 시간:</span>
            <span className="font-medium">
              {new Date(event.completed_at).toLocaleTimeString()}
            </span>
          </div>
        </div>
      </div>
    </CompleteEventBase>
  );
};

export default RealizeTestComplete;
