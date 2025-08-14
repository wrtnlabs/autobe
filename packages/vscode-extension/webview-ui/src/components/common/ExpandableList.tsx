import React, { useState } from "react";

interface IExpandableListProps<T> {
  /** 제목 */
  title: string;
  /** 아이템 배열 */
  items: T[];
  /** 테마 색상 */
  theme: "blue" | "green" | "purple" | "orange";
  /** 아이템 렌더링 함수 */
  renderItem: (item: T, index: number) => React.ReactNode;
  /** 최대 표시 개수 (기본값: 3) */
  maxDisplay?: number;
}

const ExpandableList = <T,>({
  title,
  items,
  theme,
  renderItem,
  maxDisplay = 3,
}: IExpandableListProps<T>) => {
  const [isExpanded, setIsExpanded] = useState(false);

  const themeColors = {
    blue: "text-blue-600",
    green: "text-green-600",
    purple: "text-purple-600",
    orange: "text-orange-600",
  };

  const themeHoverColors = {
    blue: "hover:text-blue-700",
    green: "hover:text-green-700",
    purple: "hover:text-purple-700",
    orange: "hover:text-orange-700",
  };

  const color = themeColors[theme];
  const hoverColor = themeHoverColors[theme];

  // 표시할 아이템들 결정
  const displayItems = isExpanded ? items : items.slice(0, maxDisplay);
  const hasMore = items.length > maxDisplay;

  return (
    <div className="bg-white rounded-lg p-3 border border-gray-100">
      <div className="text-sm text-gray-700 mb-2">
        <span className={`font-medium ${color}`}>{title}:</span> {items.length}
        개
      </div>
      <div className="space-y-2">
        {displayItems.map((item, index) => (
          <div key={index}>{renderItem(item, index)}</div>
        ))}
        {hasMore && (
          <div
            className={`text-xs ${color} italic cursor-pointer ${hoverColor} hover:underline`}
            onClick={() => setIsExpanded(!isExpanded)}
          >
            {isExpanded ? "접기" : `+${items.length - maxDisplay}개 더...`}
          </div>
        )}
      </div>
    </div>
  );
};

export default ExpandableList;
