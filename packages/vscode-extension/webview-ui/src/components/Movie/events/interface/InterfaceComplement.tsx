import {
  AutoBeInterfaceComplementEvent,
  AutoBeOpenApi,
} from "@autobe/interface";

import EventBubble from "../../../common/EventBubble";
import ExpandableList from "../../../common/ExpandableList";
import InfoCard from "../../../common/InfoCard";

interface IInterfaceComplementProps {
  event: AutoBeInterfaceComplementEvent;
}

// 보완된 스키마 아이템 컴포넌트
const SchemaItem = ({
  schemaName,
  schema,
}: {
  schemaName: string;
  schema: AutoBeOpenApi.IJsonSchemaDescriptive;
}) => {
  return (
    <div className="mb-3 p-3 bg-blue-50 rounded-lg border border-blue-200">
      <div className="flex items-center space-x-2 mb-2">
        <div className="w-2 h-2 bg-blue-400 rounded-full" />
        <span className="text-sm font-medium text-gray-800 font-mono">
          {schemaName}
        </span>
        <span className="text-xs px-2 py-1 bg-blue-100 text-blue-700 rounded">
          스키마
        </span>
      </div>
      <div className="ml-4 space-y-2">
        {schema.description && (
          <div className="text-xs text-gray-600">{schema.description}</div>
        )}
        <div className="bg-gray-100 p-2 rounded text-xs font-mono text-gray-700 overflow-x-auto">
          <pre className="whitespace-pre-wrap">
            {JSON.stringify(schema, null, 2)}
          </pre>
        </div>
      </div>
    </div>
  );
};

const InterfaceComplement = ({ event }: IInterfaceComplementProps) => {
  return (
    <EventBubble
      iconPath="M12 6V4m0 2a2 2 0 100 4m0-4a2 2 0 110 4m-6 8a2 2 0 100-4m0 4a2 2 0 100 4m0-4v2m0-6V4m6 6v10m6-2a2 2 0 100-4m0 4a2 2 0 100 4m0-4v2m0-6V4"
      title="스키마 보완"
      theme="blue"
      timestamp={event.created_at}
    >
      {/* 보완 결과 메시지 */}
      <InfoCard title="스키마 보완 완료" theme="blue">
        총 {event.missed.length}개의 누락된 스키마가 식별되었고,{" "}
        {Object.keys(event.schemas).length}개의 스키마가 추가되었습니다. API
        명세가 완전해졌습니다.
      </InfoCard>

      {/* 누락된 스키마 목록 */}
      <ExpandableList
        title="누락된 스키마"
        items={event.missed}
        theme="blue"
        renderItem={(schemaName, index) => (
          <div key={index} className="flex items-center space-x-2">
            <div className="w-1.5 h-1.5 bg-red-400 rounded-full" />
            <span className="text-xs text-gray-600 font-mono">
              {schemaName}
            </span>
          </div>
        )}
        maxDisplay={5}
      />

      {/* 추가된 스키마들 */}
      <ExpandableList
        title="추가된 스키마"
        items={Object.entries(event.schemas)}
        theme="blue"
        renderItem={([schemaName, schema], index) => (
          <SchemaItem key={index} schemaName={schemaName} schema={schema} />
        )}
        maxDisplay={3}
      />
    </EventBubble>
  );
};

export default InterfaceComplement;
