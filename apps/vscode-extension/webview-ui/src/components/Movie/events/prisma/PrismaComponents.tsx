import { AutoBePrismaComponentsEvent } from "@autobe/interface";

import EventBubble from "../../../common/EventBubble";
import ExpandableList from "../../../common/ExpandableList";
import InfoCard from "../../../common/InfoCard";

interface IPrismaComponentsProps {
  event: AutoBePrismaComponentsEvent;
}

// 컴포넌트 아이템 컴포넌트
const ComponentItem = ({
  component,
}: {
  component: {
    filename: string;
    namespace: string;
    tables: string[];
  };
}) => (
  <div className="border-l-2 border-green-200 pl-3">
    <div className="flex items-center space-x-2 mb-1">
      <div className="w-2 h-2 bg-green-400 rounded-full flex-shrink-0" />
      <span className="text-xs font-medium text-gray-800">
        {component.filename}
      </span>
    </div>
    <div className="text-xs text-gray-600 mb-1">
      <span className="font-medium">Namespace:</span> {component.namespace}
    </div>
    <div className="text-xs text-gray-500">
      <span className="font-medium">Tables:</span> {component.tables.length}개
    </div>
  </div>
);

const PrismaComponents = ({ event }: IPrismaComponentsProps) => {
  return (
    <EventBubble
      iconPath="M4 4a2 2 0 012-2h4.586A2 2 0 0112 2.586L15.414 6A2 2 0 0116 7.414V16a2 2 0 01-2 2H6a2 2 0 01-2-2V4zm2 6a1 1 0 011-1h6a1 1 0 110 2H7a1 1 0 01-1-1zm1 3a1 1 0 100 2h6a1 1 0 100-2H7z"
      title="Prisma 스키마 컴포넌트 생성"
      theme="green"
      timestamp={event.created_at}
    >
      {/* 결정 사항 */}
      <InfoCard title="결정 사항" theme="green">
        {event.decision.length > 120
          ? `${event.decision.substring(0, 120)}...`
          : event.decision}
      </InfoCard>

      {/* 컴포넌트 정보 */}
      <ExpandableList
        title="스키마 컴포넌트"
        items={event.components}
        theme="green"
        renderItem={(component) => <ComponentItem component={component} />}
      />

      {/* 검토 사항 */}
      <InfoCard title="검토 결과" theme="green">
        {event.review.length > 100
          ? `${event.review.substring(0, 100)}...`
          : event.review}
      </InfoCard>
    </EventBubble>
  );
};

export default PrismaComponents;
