import { AutoBeTestCompleteEvent } from "@autobe/interface";

import StatusIndicator from "../../../common/StatusIndicator";
import CompleteEventBase from "../common/CompleteEventBase";

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

  // 파일 목록을 CompleteEventBase 형식으로 변환
  const files = generatedFiles.map((file) => ({
    filename: file.location,
    content: file.content || "",
  }));

  return (
    <CompleteEventBase
      title="테스트 완료"
      message={`E2E 테스트 코드 생성이 완료되었습니다. 총 ${generatedFiles.length}개의 테스트 파일이 생성되었습니다.`}
      theme={hasErrors ? "orange" : "green"}
      timestamp={timestamp || event.created_at}
      iconPath="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z"
      files={files}
      enableFileSave={true}
      defaultDirectory="test"
    >
      {/* 컴파일 결과 */}
      {compiled && (
        <div className="p-3 bg-gray-50 rounded-lg border border-gray-200">
          <div className="text-sm font-medium text-gray-700 mb-2">
            컴파일 결과
          </div>
          <StatusIndicator
            success={!hasErrors}
            successText="컴파일 성공"
            failureText="컴파일 실패"
          />
          <div className="grid grid-cols-2 gap-2 text-sm mt-2">
            <div className="bg-gray-50 p-2 rounded">
              <span className="font-medium">상태:</span>{" "}
              {compiled.type === "success"
                ? "성공"
                : compiled.type === "failure"
                  ? "실패"
                  : "예외"}
            </div>
            {compiled.type === "failure" && compiled.diagnostics && (
              <div className="bg-red-50 p-2 rounded">
                <span className="font-medium text-red-700">오류:</span>{" "}
                {compiled.diagnostics.length}개
              </div>
            )}
          </div>
        </div>
      )}

      {/* 컴파일 오류들 */}
      {compiled && compiled.type === "failure" && compiled.diagnostics && (
        <div className="p-3 bg-red-50 rounded-lg border border-red-200">
          <div className="text-sm font-medium text-red-700 mb-2">
            컴파일 오류
          </div>
          <div className="space-y-2">
            {compiled.diagnostics
              .slice(0, 3)
              .map((diagnostic, index: number) => (
                <div
                  key={index}
                  className="text-sm text-red-600 bg-red-100 p-2 rounded"
                >
                  <div className="font-medium">
                    {diagnostic.messageText || "알 수 없는 오류"}
                  </div>
                  {diagnostic.file && (
                    <div className="text-xs text-red-500 mt-1">
                      <strong>파일:</strong> {diagnostic.file}
                    </div>
                  )}
                </div>
              ))}
            {compiled.diagnostics.length > 3 && (
              <div className="text-xs text-red-500 italic">
                ... 외 {compiled.diagnostics.length - 3}개 더
              </div>
            )}
          </div>
        </div>
      )}

      {/* 추가 정보 */}
      <div className="p-3 bg-gray-50 rounded-lg border border-gray-200">
        <div className="text-xs text-gray-600">
          <div className="flex items-center justify-between">
            <span>분석 단계:</span>
            <span className="font-medium">{event.step}</span>
          </div>
          {event.elapsed && (
            <div className="flex items-center justify-between mt-1">
              <span>소요 시간:</span>
              <span className="font-medium">
                {event.elapsed >= 60000
                  ? `${Math.floor(event.elapsed / 60000)}분 ${Math.round((event.elapsed % 60000) / 1000)}초`
                  : `${Math.round(event.elapsed / 1000)}초`}
              </span>
            </div>
          )}
        </div>
      </div>
    </CompleteEventBase>
  );
};
