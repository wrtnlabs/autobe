import { AutoBeRealizeCompleteEvent } from "@autobe/interface";

import ExpandableList from "../../../common/ExpandableList";
import CompleteEventBase from "../common/CompleteEventBase";

interface IRealizeCompleteProps {
  event: AutoBeRealizeCompleteEvent;
}

// 인증 데코레이터 아이템 컴포넌트
const AuthorizationItem = ({
  authorization,
}: {
  authorization: any; // AutoBeRealizeAuthorization 타입
}) => {
  return (
    <div className="mb-3 p-3 bg-blue-50 rounded-lg border border-blue-200">
      <div className="flex items-center space-x-2 mb-2">
        <div className="w-2 h-2 bg-blue-400 rounded-full" />
        <span className="text-sm font-medium text-gray-800 font-mono">
          {authorization.role?.name || "인증"}
        </span>
        <span className="text-xs px-2 py-1 bg-blue-100 text-blue-700 rounded">
          데코레이터
        </span>
      </div>
      <div className="ml-4 space-y-2">
        {authorization.role?.description && (
          <div className="text-xs text-gray-600">
            {authorization.role.description}
          </div>
        )}
        <div className="bg-gray-100 p-2 rounded text-xs font-mono text-gray-700 overflow-x-auto">
          <pre className="whitespace-pre-wrap">
            {JSON.stringify(authorization, null, 2)}
          </pre>
        </div>
      </div>
    </div>
  );
};

const RealizeComplete = ({ event }: IRealizeCompleteProps) => {
  // 파일 목록을 CompleteEventBase 형식으로 변환
  const files = [
    ...Object.entries(event.controllers || {}).map(([filename, content]) => ({
      filename: `controllers/${filename}.ts`,
      content,
    })),
    ...(event.functions || []).map((func, index) => ({
      filename: `functions/${func.name || `function-${index}`}.ts`,
      content: func.content || "",
    })),
  ];

  return (
    <CompleteEventBase
      title="구현 완료"
      message={`비즈니스 로직 구현이 완료되었습니다. 총 ${event.authorizations.length}개의 인증 데코레이터가 생성되었습니다. 전체 vibe coding 파이프라인이 성공적으로 완료되었습니다.`}
      theme="orange"
      timestamp={event.created_at}
      iconPath="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z"
      files={files}
      enableFileSave={true}
      defaultDirectory="realize"
    >
      {/* 생성된 인증 데코레이터들 */}
      {event.authorizations.length > 0 && (
        <ExpandableList
          title="인증 데코레이터"
          items={event.authorizations}
          theme="orange"
          renderItem={(authorization, index) => (
            <AuthorizationItem key={index} authorization={authorization} />
          )}
          maxDisplay={3}
        />
      )}

      {/* 컴파일 결과 */}
      {event.compiled.type === "success" && (
        <div className="p-3 bg-green-50 rounded-lg border border-green-200">
          <div className="text-sm font-medium text-green-700 mb-2">
            컴파일 성공
          </div>
          <div className="text-xs text-green-600">
            모든 코드가 성공적으로 컴파일되었습니다.
          </div>
        </div>
      )}

      {/* 추가 정보 */}
      <div className="p-3 bg-gray-50 rounded-lg border border-gray-200">
        <div className="text-xs text-gray-600">
          <div className="flex items-center justify-between">
            <span>인증 데코레이터:</span>
            <span className="font-medium">{event.authorizations.length}개</span>
          </div>
          <div className="flex items-center justify-between mt-1">
            <span>분석 단계:</span>
            <span className="font-medium">{event.step}</span>
          </div>
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
    </CompleteEventBase>
  );
};

export default RealizeComplete;
