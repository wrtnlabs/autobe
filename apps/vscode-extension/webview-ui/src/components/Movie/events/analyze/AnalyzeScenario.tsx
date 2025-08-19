import { AutoBeAnalyzeScenarioEvent } from "@autobe/interface";

import EventBubble from "../../../common/EventBubble";
import ExpandableList from "../../../common/ExpandableList";
import InfoCard from "../../../common/InfoCard";

interface IAnalyzeScenarioProps {
  event: AutoBeAnalyzeScenarioEvent;
}

// 역할 아이템 컴포넌트
const RoleItem = ({
  role,
}: {
  role: { name: string; description: string };
}) => (
  <div className="flex items-start space-x-2">
    <div className="w-2 h-2 bg-blue-400 rounded-full mt-2 flex-shrink-0" />
    <div className="text-xs">
      <span className="font-medium text-gray-800">{role.name}:</span>
      <span className="text-gray-600 ml-1">
        {role.description.length > 80
          ? `${role.description.substring(0, 80)}...`
          : role.description}
      </span>
    </div>
  </div>
);

// 파일 아이템 컴포넌트
const FileItem = ({ file }: { file: { filename: string } }) => (
  <div className="flex items-center space-x-2 mb-1">
    <div className="w-1 h-1 bg-gray-400 rounded-full" />
    <span>{file.filename}</span>
  </div>
);

const AnalyzeScenario = ({ event }: IAnalyzeScenarioProps) => {
  return (
    <EventBubble
      iconPath="M3 4a1 1 0 011-1h12a1 1 0 110 2H4a1 1 0 01-1-1zm0 4a1 1 0 011-1h12a1 1 0 110 2H4a1 1 0 01-1-1zm0 4a1 1 0 011-1h12a1 1 0 110 2H4a1 1 0 01-1-1z"
      title="분석 시나리오 생성"
      theme="blue"
      timestamp={event.created_at}
    >
      {/* 프로젝트 정보 */}
      <InfoCard title="프로젝트" theme="blue">
        {event.prefix}
      </InfoCard>

      {/* 역할 정보 */}
      <ExpandableList
        title="사용자 역할"
        items={event.roles}
        theme="blue"
        renderItem={(role) => <RoleItem role={role} />}
      />

      {/* 문서 정보 */}
      <ExpandableList
        title="생성될 문서"
        items={event.files}
        theme="blue"
        renderItem={(file) => <FileItem file={file} />}
      />
    </EventBubble>
  );
};

export default AnalyzeScenario;
