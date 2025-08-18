import { AutoBeInterfaceCompleteEvent, AutoBeOpenApi } from "@autobe/interface";

import EventBubble from "../../../common/EventBubble";
import InfoCard from "../../../common/InfoCard";

interface IInterfaceCompleteProps {
  event: AutoBeInterfaceCompleteEvent;
}

// OpenAPI 문서 정보 컴포넌트
const OpenApiInfo = ({ document }: { document: AutoBeOpenApi.IDocument }) => {
  const operations = document.operations || [];
  const schemas = Object.keys(document.components?.schemas || {});

  return (
    <div className="space-y-3">
      <div className="p-3 bg-purple-50 rounded-lg border border-purple-200">
        <div className="flex items-center space-x-2 mb-2">
          <div className="w-2 h-2 bg-purple-400 rounded-full" />
          <span className="text-sm font-medium text-gray-800">API 정보</span>
        </div>
        <div className="ml-4 space-y-1">
          <div className="text-xs text-gray-600">
            <span className="font-medium">총 API 작업:</span>{" "}
            {operations.length}개
          </div>
          <div className="text-xs text-gray-600">
            <span className="font-medium">스키마 컴포넌트:</span>{" "}
            {schemas.length}개
          </div>
        </div>
      </div>

      <div className="grid grid-cols-2 gap-3">
        <div className="p-3 bg-green-50 rounded-lg border border-green-200">
          <div className="text-sm font-medium text-gray-800 mb-1">API 작업</div>
          <div className="text-lg font-bold text-green-600">
            {operations.length}개
          </div>
        </div>
        <div className="p-3 bg-blue-50 rounded-lg border border-blue-200">
          <div className="text-sm font-medium text-gray-800 mb-1">스키마</div>
          <div className="text-lg font-bold text-blue-600">
            {schemas.length}개
          </div>
        </div>
      </div>

      {/* API 작업 목록 미리보기 */}
      {operations.length > 0 && (
        <div className="p-3 bg-gray-50 rounded-lg border border-gray-200">
          <div className="text-sm font-medium text-gray-800 mb-2">
            API 작업 미리보기
          </div>
          <div className="space-y-1">
            {operations.slice(0, 5).map((operation, index) => (
              <div key={index} className="flex items-center space-x-2 text-xs">
                <span className="px-2 py-1 bg-gray-200 text-gray-700 rounded text-xs font-mono">
                  {operation.method.toUpperCase()}
                </span>
                <span className="text-gray-600 font-mono">
                  {operation.path}
                </span>
              </div>
            ))}
            {operations.length > 5 && (
              <div className="text-xs text-gray-500 italic">
                ... 외 {operations.length - 5}개 더
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
};

const InterfaceComplete = ({ event }: IInterfaceCompleteProps) => {
  return (
    <EventBubble
      iconPath="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z"
      title="API 설계 완료"
      theme="purple"
      timestamp={event.created_at}
    >
      {/* 완료 메시지 */}
      <InfoCard title="API 설계 완료" theme="purple">
        RESTful API 설계가 완료되었습니다. OpenAPI 명세가 생성되었고 NestJS
        애플리케이션 코드가 준비되었습니다.
      </InfoCard>

      {/* OpenAPI 문서 정보 */}
      <OpenApiInfo document={event.document} />

      {/* 추가 정보 */}
      <div className="mt-4 p-3 bg-gray-50 rounded-lg">
        <div className="text-xs text-gray-600">
          {event.elapsed && (
            <div className="flex items-center justify-between mt-1">
              <span>소요 시간:</span>
              <span className="font-medium">
                {event.elapsed >= 60000
                  ? `${Math.floor(event.elapsed / 60000)}분 ${Math.round((event.elapsed % 60000) / 1000)}초`
                  : `${Math.round(event.elapsed / 1000)}초`}
              </span>
            </div>
          )}
        </div>
      </div>
    </EventBubble>
  );
};

export default InterfaceComplete;
