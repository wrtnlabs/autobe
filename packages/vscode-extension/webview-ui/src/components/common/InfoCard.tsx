import React from "react";

interface IInfoCardProps {
  /** 제목 */
  title: string;
  /** 테마 색상 */
  theme: "blue" | "green" | "purple" | "orange";
  /** 자식 요소들 */
  children: React.ReactNode;
}

const InfoCard = ({ title, theme, children }: IInfoCardProps) => {
  const themeColors = {
    blue: "text-blue-600",
    green: "text-green-600",
    purple: "text-purple-600",
    orange: "text-orange-600",
  };

  const themeBorders = {
    blue: "border-blue-100",
    green: "border-green-100",
    purple: "border-purple-100",
    orange: "border-orange-100",
  };

  const color = themeColors[theme];
  const border = themeBorders[theme];

  return (
    <div className={`bg-white rounded-lg p-3 border ${border}`}>
      <div className="text-sm text-gray-700 mb-2">
        <span className={`font-medium ${color}`}>{title}:</span>
      </div>
      <div className="text-xs text-gray-600 leading-relaxed">{children}</div>
    </div>
  );
};

export default InfoCard;
