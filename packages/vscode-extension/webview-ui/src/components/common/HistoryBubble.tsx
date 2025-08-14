import React from "react";

interface IHistoryBubbleProps {
  iconPath: string;
  title: string;
  theme: "blue" | "green" | "purple" | "orange";
  timestamp?: string;
  children: React.ReactNode;
}

const HistoryBubble = ({
  iconPath,
  title,
  theme,
  children,
  timestamp,
}: IHistoryBubbleProps) => {
  const themeColors = {
    blue: {
      bg: "bg-blue-50",
      border: "border-blue-200",
      icon: "bg-blue-500",
      title: "text-blue-800",
    },
    green: {
      bg: "bg-green-50",
      border: "border-green-200",
      icon: "bg-green-500",
      title: "text-green-800",
    },
    purple: {
      bg: "bg-purple-50",
      border: "border-purple-200",
      icon: "bg-purple-500",
      title: "text-purple-800",
    },
    orange: {
      bg: "bg-orange-50",
      border: "border-orange-200",
      icon: "bg-orange-500",
      title: "text-orange-800",
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
        <div
          className={`${colors.bg} border ${colors.border} rounded-2xl rounded-tl-md px-4 py-3 shadow-sm`}
        >
          <div className="space-y-3">
            <div className="flex items-center space-x-2">
              <div
                className={`w-6 h-6 ${colors.icon} rounded-full flex items-center justify-center`}
              >
                <svg
                  className="w-4 h-4 text-white"
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d={iconPath}
                  />
                </svg>
              </div>
              <h3 className={`text-lg font-semibold ${colors.title}`}>
                {title}
              </h3>
            </div>
            {children}
          </div>
        </div>

        <div className="mt-1 ml-1">
          <span className="text-xs text-gray-400">
            {timestamp ? formatTime(timestamp) : "Assistant"}
          </span>
        </div>
      </div>
    </div>
  );
};

export default HistoryBubble;
