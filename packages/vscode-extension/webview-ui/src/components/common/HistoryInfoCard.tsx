import React from "react";

interface IHistoryInfoCardProps {
  title: string;
  theme: "blue" | "green" | "purple" | "orange";
  children: React.ReactNode;
}

const HistoryInfoCard = ({ title, theme, children }: IHistoryInfoCardProps) => {
  const themeBorders = {
    blue: "border-blue-100",
    green: "border-green-100",
    purple: "border-purple-100",
    orange: "border-orange-100",
  };

  const themeColors = {
    blue: "text-blue-600",
    green: "text-green-600",
    purple: "text-purple-600",
    orange: "text-orange-600",
  };

  const border = themeBorders[theme];
  const color = themeColors[theme];

  return (
    <div className={`bg-white rounded-lg p-3 border ${border}`}>
      <div className="text-sm text-gray-700 mb-2">
        <span className={`font-medium ${color}`}>{title}:</span>
      </div>
      <div className="text-xs text-gray-600 leading-relaxed">{children}</div>
    </div>
  );
};

export default HistoryInfoCard;
