import { useState } from "react";

import useVsCode from "../../../../hooks/use-vscode";
import EventBubble from "../../../common/EventBubble";
import ExpandableList from "../../../common/ExpandableList";
import InfoCard from "../../../common/InfoCard";

interface ICompleteEventBaseProps {
  title: string;
  message: string;
  theme: "blue" | "green" | "orange" | "purple";
  timestamp: string;
  iconPath: string;
  files?: Array<{ filename: string; content: string }>;
  children?: React.ReactNode;
  enableFileSave?: boolean;
  defaultDirectory?: string;
}

// 파일 아이템 컴포넌트
const FileItem = ({
  file,
}: {
  file: { filename: string; content: string };
}) => {
  // UTF-8 바이트 크기 계산 (Buffer.from과 동일한 방식)
  const getFileSize = (content: string): string => {
    // UTF-8 인코딩으로 바이트 크기 계산
    const bytes = new Blob([content]).size;
    if (bytes < 1024) {
      return `${bytes}B`;
    } else if (bytes < 1024 * 1024) {
      return `${Math.round(bytes / 1024)}KB`;
    } else {
      return `${(bytes / (1024 * 1024)).toFixed(1)}MB`;
    }
  };

  return (
    <div className="flex items-center justify-between space-x-2 mb-1">
      <div className="flex items-center space-x-2">
        <div className="w-1 h-1 bg-blue-400 rounded-full" />
        <span className="text-xs text-gray-800">{file.filename}</span>
      </div>
      <span className="text-xs text-gray-500">{getFileSize(file.content)}</span>
    </div>
  );
};

const CompleteEventBase = ({
  title,
  message,
  theme,
  timestamp,
  iconPath,
  files,
  children,
  enableFileSave = false,
  defaultDirectory = "output",
}: ICompleteEventBaseProps) => {
  const [isAccepted, setIsAccepted] = useState<boolean | null>(null);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [isRejected, setIsRejected] = useState(false);
  const vscode = useVsCode();
  const [isLoading, setIsLoading] = useState(false);
  const [directory, setDirectory] = useState(defaultDirectory);

  vscode.onMessage((message) => {
    if (message.type === "res_save_files") {
      if (message.data.success) {
        setIsAccepted(true);
      } else {
        setIsAccepted(false);
        setErrorMessage(message.data.error);
      }
    }
  });

  const handleAccept = async () => {
    if (!files) return;

    setIsLoading(true);
    try {
      vscode.postMessage({
        type: "req_save_files",
        data: {
          files: Object.fromEntries(files.map((v) => [v.filename, v.content])),
          directory: directory,
        },
      });
    } catch (error) {
      console.error("파일 저장 중 오류:", error);
      setIsAccepted(false);
      setErrorMessage("파일 저장 요청 중 오류가 발생했습니다.");
    }
  };

  const handleReject = () => {
    setIsRejected(true);
  };

  return (
    <EventBubble
      iconPath={iconPath}
      title={title}
      theme={theme}
      timestamp={timestamp}
    >
      {/* 완료 메시지 */}
      <InfoCard title={title} theme={theme}>
        {message}
      </InfoCard>

      {/* 추가 컨텐츠 */}
      {children}

      {/* 생성된 파일들 */}
      {files && files.length > 0 && (
        <ExpandableList
          title="생성된 파일"
          items={files}
          theme={theme}
          renderItem={(file) => <FileItem file={file} />}
        />
      )}

      {/* 파일 저장 기능이 활성화된 경우에만 수락/거절 버튼 표시 */}
      {enableFileSave && files && files.length > 0 && (
        <div className="bg-white rounded-lg p-3 border border-blue-100">
          <div className="text-sm text-gray-700 mb-3">
            <span className="font-medium text-blue-600">다음 단계:</span>
          </div>

          {isAccepted === null && (
            <div className="space-y-3">
              {/* 폴더 지정 */}
              <div className="flex items-center space-x-2">
                <label className="text-xs text-gray-600 font-medium">
                  저장 폴더:
                </label>
                <input
                  type="text"
                  value={directory}
                  onChange={(e) => setDirectory(e.target.value)}
                  placeholder={defaultDirectory}
                  className="flex-1 text-xs px-2 py-1 border border-gray-300 rounded focus:outline-none focus:ring-1 focus:ring-blue-500"
                />
              </div>

              <div className="flex space-x-3">
                <button
                  onClick={handleAccept}
                  disabled={isLoading}
                  className="flex-1 bg-blue-500 hover:bg-blue-600 disabled:bg-blue-300 text-white text-sm font-medium py-2 px-4 rounded-lg transition-colors duration-200 flex items-center justify-center space-x-2"
                >
                  {isLoading ? (
                    <>
                      <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                      <span>저장 중...</span>
                    </>
                  ) : (
                    <>
                      <svg
                        className="w-4 h-4"
                        fill="none"
                        stroke="currentColor"
                        viewBox="0 0 24 24"
                      >
                        <path
                          strokeLinecap="round"
                          strokeLinejoin="round"
                          strokeWidth={2}
                          d="M5 13l4 4L19 7"
                        />
                      </svg>
                      <span>수락 및 저장</span>
                    </>
                  )}
                </button>
                <button
                  onClick={handleReject}
                  disabled={isLoading}
                  className="flex-1 bg-gray-300 hover:bg-gray-400 disabled:bg-gray-200 text-gray-700 text-sm font-medium py-2 px-4 rounded-lg transition-colors duration-200 flex items-center justify-center space-x-2"
                >
                  <svg
                    className="w-4 h-4"
                    fill="none"
                    stroke="currentColor"
                    viewBox="0 0 24 24"
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth={2}
                      d="M6 18L18 6M6 6l12 12"
                    />
                  </svg>
                  <span>거절</span>
                </button>
              </div>
            </div>
          )}

          {isAccepted === true && (
            <div className="flex items-center space-x-2 text-green-600">
              <svg
                className="w-5 h-5"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M5 13l4 4L19 7"
                />
              </svg>
              <span className="text-sm font-medium">
                파일이 성공적으로 저장되었습니다! ({directory} 폴더)
              </span>
            </div>
          )}

          {isAccepted === false && (
            <div className="space-y-2">
              <div className="flex items-center space-x-2 text-red-600">
                <svg
                  className="w-5 h-5"
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z"
                  />
                </svg>
                <span className="text-sm font-medium">
                  파일 저장에 실패했습니다.
                </span>
              </div>
              {errorMessage && (
                <div className="bg-red-50 border border-red-200 rounded p-2">
                  <span className="text-xs text-red-700">{errorMessage}</span>
                </div>
              )}
            </div>
          )}

          {isRejected && (
            <div className="flex items-center space-x-2 text-gray-600">
              <svg
                className="w-5 h-5"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M6 18L18 6M6 6l12 12"
                />
              </svg>
              <span className="text-sm font-medium">
                결과가 거절되었습니다.
              </span>
            </div>
          )}
        </div>
      )}
    </EventBubble>
  );
};

export default CompleteEventBase;
