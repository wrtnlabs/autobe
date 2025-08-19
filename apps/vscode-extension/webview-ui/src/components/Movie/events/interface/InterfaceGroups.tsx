import { AutoBeInterfaceGroupsEvent } from "@autobe/interface";
import { useState } from "react";

import EventBubble from "../../../common/EventBubble";
import ExpandableList from "../../../common/ExpandableList";
import InfoCard from "../../../common/InfoCard";

interface IInterfaceGroupsProps {
  event: AutoBeInterfaceGroupsEvent;
}

// 그룹 아이템 컴포넌트
const GroupItem = ({
  group,
}: {
  group: { name: string; description: string };
}) => {
  const [isExpanded, setIsExpanded] = useState(false);

  return (
    <div className="mb-3 p-3 bg-gray-50 rounded-lg border border-gray-200 hover:border-green-300 transition-colors">
      <div
        className="flex items-center justify-between cursor-pointer"
        onClick={() => setIsExpanded(!isExpanded)}
      >
        <div className="flex items-center space-x-2">
          <div className="w-2 h-2 bg-green-400 rounded-full" />
          <span className="text-sm font-medium text-gray-800">
            {group.name}
          </span>
          <span className="text-xs px-2 py-1 bg-green-100 text-green-700 rounded-full">
            그룹
          </span>
        </div>
        <div className="flex items-center space-x-1">
          <span className="text-xs text-gray-500">
            {isExpanded ? "접기" : "펼치기"}
          </span>
          <svg
            className={`w-4 h-4 text-gray-500 transition-transform ${
              isExpanded ? "rotate-180" : ""
            }`}
            fill="none"
            stroke="currentColor"
            viewBox="0 0 24 24"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={2}
              d="M19 9l-7 7-7-7"
            />
          </svg>
        </div>
      </div>

      {isExpanded && (
        <div className="mt-3 ml-4 space-y-2 border-l-2 border-green-200 pl-3">
          <div className="text-xs text-gray-600 leading-relaxed">
            {group.description}
          </div>
        </div>
      )}
    </div>
  );
};

const InterfaceGroups = ({ event }: IInterfaceGroupsProps) => {
  return (
    <EventBubble
      iconPath="M19 11H5m14 0a2 2 0 012 2v6a2 2 0 01-2 2H5a2 2 0 01-2-2v-6a2 2 0 012-2m14 0V9a2 2 0 00-2-2M5 11V9a2 2 0 012-2m0 0V5a2 2 0 012-2h6a2 2 0 012 2v2M7 7h10"
      title="인터페이스 그룹화"
      theme="green"
      timestamp={event.created_at}
    >
      {/* 그룹화 결과 메시지 */}
      <InfoCard title="인터페이스 그룹화 완료" theme="green">
        총 {event.groups.length}개의 그룹으로 API 엔드포인트가 분류되었습니다.
        각 그룹은 Prisma 스키마 구조를 기반으로 구성되었습니다.
      </InfoCard>

      {/* 그룹화된 인터페이스들 */}
      <ExpandableList
        title="API 엔드포인트 그룹"
        items={event.groups}
        theme="green"
        renderItem={(group, index) => <GroupItem key={index} group={group} />}
        maxDisplay={5}
      />
    </EventBubble>
  );
};

export default InterfaceGroups;
