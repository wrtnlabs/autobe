import React from "react";

interface IEventBubbleProps {
  /** 아이콘 SVG 경로 */
  iconPath: string;
  /** 제목 */
  title: string;
  /** 테마 색상 */
  theme: "blue" | "green" | "purple" | "orange";
  /** 자식 요소들 */
  children: React.ReactNode;
  /** 타임스탬프 */
  timestamp?: string;
}

const EventBubble = ({
  iconPath,
  title,
  theme,
  children,
  timestamp,
}: IEventBubbleProps) => {
  const themeColors = {
    blue: {
      bg: "bg-blue-50",
      border: "border-blue-200",
      icon: "bg-blue-500",
      title: "text-blue-800",
      label: "text-blue-600",
    },
    green: {
      bg: "bg-green-50",
      border: "border-green-200",
      icon: "bg-green-500",
      title: "text-green-800",
      label: "text-green-600",
    },
    purple: {
      bg: "bg-purple-50",
      border: "border-purple-200",
      icon: "bg-purple-500",
      title: "text-purple-800",
      label: "text-purple-600",
    },
    orange: {
      bg: "bg-orange-50",
      border: "border-orange-200",
      icon: "bg-orange-500",
      title: "text-orange-800",
      label: "text-orange-600",
    },
  };

  const colors = themeColors[theme];

  const formatTime = (isoString: string) => {
    const date = new Date(isoString);
    return date.toLocaleTimeString("ko-KR", {
      hour: "2-digit",
      minute: "2-digit",
      hour12: false,
    });
  };

  return (
    <div className="flex justify-start mb-4">
      <div className="flex-1 max-w-3xl">
        {/* 메시지 버블 */}
        <div
          className={`${colors.bg} border ${colors.border} rounded-2xl rounded-tl-md px-4 py-3 shadow-sm`}
        >
          <div className="space-y-3">
            {/* 제목 */}
            <div className="flex items-center space-x-2">
              <div
                className={`w-6 h-6 ${colors.icon} rounded-full flex items-center justify-center`}
              >
                <svg
                  className="w-4 h-4 text-white"
                  fill="currentColor"
                  viewBox="0 0 20 20"
                >
                  <path fillRule="evenodd" d={iconPath} clipRule="evenodd" />
                </svg>
              </div>
              <h3 className={`text-lg font-semibold ${colors.title}`}>
                {title}
              </h3>
            </div>

            {/* 내용 */}
            {children}
          </div>
        </div>

        {/* 시간 표시 */}
        {timestamp && (
          <div className="mt-1 ml-1">
            <span className="text-xs text-gray-400">
              {formatTime(timestamp)}
            </span>
          </div>
        )}
      </div>
    </div>
  );
};

export default EventBubble;
